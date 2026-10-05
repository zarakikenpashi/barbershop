import process from 'node:process';

const verifiedWebhooks = new Map();
const HEALTH_CACHE_MS = 5 * 60 * 1000;

export class ParticipationServiceError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

export function participationFailure(error) {
  if (error instanceof ParticipationServiceError) {
    return { ok: false, code: error.code, message: error.message };
  }
  if (error?.name === 'TimeoutError' || error?.name === 'AbortError') {
    return { ok: false, code: 'GOOGLE_TIMEOUT', message: 'Le salon met un peu plus de temps à répondre. Réessaie : ta participation ne sera pas comptée deux fois.' };
  }
  return { ok: false, code: 'SERVICE_UNAVAILABLE', message: 'Enregistrement impossible. Réessaie dans un instant. Si le problème persiste, signale-le au salon.' };
}

async function readScriptResponse(response) {
  if (!response.ok) throw new ParticipationServiceError('GOOGLE_ACCESS', 'Le service de participation est inaccessible. Merci de prévenir le salon.');
  let result;
  try { result = await response.json(); } catch {
    throw new ParticipationServiceError('SCRIPT_UPDATE_REQUIRED', 'Le service de participation n’est pas encore prêt. Merci de prévenir le salon.');
  }
  if (!result || result.version !== 2 || typeof result.ok !== 'boolean') {
    throw new ParticipationServiceError('SCRIPT_UPDATE_REQUIRED', 'Le service de participation n’est pas encore prêt. Merci de prévenir le salon.');
  }
  return result;
}

export async function forwardParticipation(data, webhookUrl, request = fetch) {
  if (!webhookUrl || !/^https:\/\/script\.google\.com\/macros\/s\/[^/]+\/exec$/.test(webhookUrl)) {
    throw new ParticipationServiceError('WEBHOOK_MISSING', 'Le service de participation n’est pas configuré. Merci de prévenir le salon.');
  }
  if (!data || !['save', 'status', 'reveal'].includes(data.action)) throw new Error('Requête invalide.');
  // Vérification sans écriture : un ancien doPost pourrait enregistrer une ligne
  // même pour une demande de statut. Ne pas lui transmettre de participation.
  // Un budget unique pour toute la requête, inférieur au délai du navigateur.
  const signal = AbortSignal.timeout(55000);
  const verifiedUntil = request === fetch ? verifiedWebhooks.get(webhookUrl) || 0 : 0;
  if (verifiedUntil <= Date.now()) {
    const health = await readScriptResponse(await request(`${webhookUrl}?action=health`, {
      method: 'GET', signal,
    }));
    if (!health.ok) return health;
    if (request === fetch) verifiedWebhooks.set(webhookUrl, Date.now() + HEALTH_CACHE_MS);
  }
  const response = await request(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
    body: JSON.stringify(data),
    signal,
  });
  return readScriptResponse(response);
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, message: 'Méthode non autorisée.' });
  }
  try {
    const data = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const result = await forwardParticipation(data, process.env.WEBHOOK_URL || process.env.VITE_WEBHOOK_URL);
    return res.status(200).json(result);
  } catch (error) {
    const failure = participationFailure(error);
    console.error('[participation]', failure.code, error.name, error.cause?.code || '');
    return res.status(503).json(failure);
  }
}
