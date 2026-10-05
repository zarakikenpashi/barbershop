import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
import { forwardParticipation, participationFailure } from '../api/participation.js';

const script = readFileSync(new URL('../google-apps-script/Code.gs', import.meta.url), 'utf8');
const id = 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa';
const anotherId = 'bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb';
const feedback = {
  action: 'save', participationId: id, nomPrenom: 'Client test', contact: '+225 05 05 05 05 05',
  trancheAge: 'Adulte (26 - 40 ans)', noteCoupe: 5, noteAccueil: 4, noteAttente: 2,
  sourceDecouverte: 'WhatsApp', avis: 'Accueil agréable',
};

function service(draw = 0.01, greenApi = null, properties = {}) {
  const rows = [];
  let locked = false;
  let draws = 0;
  let uuidCount = 0;
  const sheet = {
    getLastRow: () => rows.length + 1,
    appendRow: row => rows.push(row),
    getRange: (row, column, count = 1, columns = 1) => ({
      getValue: () => row === 1 ? column === 18 ? 'Lot ID' : column === 21 ? 'Origine' : '' : rows[row - 2]?.[column - 1],
      getValues: () => rows.slice(row - 2, row - 2 + count).map(value => value.slice(column - 1, column - 1 + columns)),
      setValue: value => { rows[row - 2][column - 1] = value; },
    }),
  };
  const context = vm.createContext({
    Math: Object.assign(Object.create(Math), { random: () => { draws++; return draw; } }),
    PropertiesService: { getScriptProperties: () => ({ getProperty: key => key === 'SPREADSHEET_ID' ? 'test-sheet' : greenApi ? ({GREEN_API_ID_INSTANCE: '123456', GREEN_API_TOKEN_INSTANCE: 'test-token', GREEN_API_URL: 'https://api.green-api.com', ...properties})[key] : null }) },
    SpreadsheetApp: { openById: () => ({ getSheetByName: () => sheet }) },
    LockService: { getScriptLock: () => ({
      waitLock: () => { assert.equal(locked, false); locked = true; },
      hasLock: () => locked,
      releaseLock: () => { locked = false; },
    }) },
    Utilities: { getUuid: () => (++uuidCount).toString(16).padStart(8, '0') + '-cccc-4ccc-cccc-cccccccccccc' },
    ContentService: { createTextOutput: text => ({ setMimeType: () => text }), MimeType: { JSON: 'json' } },
    UrlFetchApp: { fetch: (...args) => greenApi(...args) },
    console,
  });
  vm.runInContext(script, context);
  return {
    rows, context, sheet,
    draws: () => draws,
    request: data => JSON.parse(context.doPost({ postData: { contents: JSON.stringify(data) } })),
  };
}

test('avis enregistré avant grattage, tirage caché et requêtes répétées idempotentes', () => {
  const app = service();
  const saved = app.request(feedback);
  assert.equal(saved.saved, true);
  assert.equal(saved.revealed, false);
  assert.equal(saved.rewardId, undefined);
  assert.equal(saved.codePromo, undefined);
  assert.equal(app.rows.length, 1);
  assert.equal(app.rows[0][8], feedback.avis);
  assert.equal(app.rows[0][4], 5);
  assert.equal(app.rows[0][7], 'WhatsApp');
  assert.deepEqual(app.request(feedback), saved);
  assert.equal(app.rows.length, 1);
  assert.equal(app.draws(), 1);
  const result = app.request({ action: 'reveal', participationId: id });
  assert.equal(result.rewardId, 1);
  assert.match(result.codePromo, /^BBF-[A-Z0-9]{10}$/);
  const revealDate = app.rows[0][14];
  assert.deepEqual(app.request({ action: 'reveal', participationId: id }), result);
  assert.deepEqual(app.request({ action: 'status', participationId: id }), result);
  assert.equal(app.rows[0][14], revealDate);
  assert.equal(app.draws(), 1);
});

test('prénom court et âge omis : participation autorisée et données conservées', () => {
  const app = service();
  assert.equal(app.request({...feedback, nomPrenom:'Al', trancheAge:''}).saved, true);
  assert.equal(app.rows[0][1], 'Al');
  assert.equal(app.rows[0][3], '');
  assert.equal(app.request({action:'reveal', participationId:id}).ok, true);
});

test('même téléphone : plusieurs parties autorisées, formats normalisés et chaque partie idempotente', () => {
  const app = service();
  app.request(feedback);
  for (const contact of ['0505050505', '002250505050505', '+225 (05) 05-05-05-05']) {
    const result = app.request({ ...feedback, participationId: anotherId, contact });
    assert.equal(result.ok, true);
    assert.equal(result.saved, true);
  }
  assert.equal(app.rows.length, 2);
  assert.equal(app.rows[1][16], app.rows[0][16]);
  assert.equal(app.draws(), 2);
  assert.notEqual(app.rows[1][10], app.rows[0][10]);
});

test('le client ne peut imposer un cadeau ou un code et une perte n’a pas de code', () => {
  const app = service(0.8);
  app.request({ ...feedback, recompense: 'Coupe gratuite', codePromo: 'BBF-FAUX', rewardId: 1 });
  const result = app.request({ action: 'reveal', participationId: id });
  assert.equal(result.rewardId, 0);
  assert.equal(result.codePromo, '');
});

test('refuse les données invalides et un grattage sans avis', () => {
  const app = service();
  assert.equal(app.request({ action: 'reveal', participationId: id }).ok, false);
  for (const changes of [{ noteCoupe: 6 }, { noteAccueil: 0 }, { sourceDecouverte: 'inconnue' }, { contact: '++' }, { participationId: 'invalid' }]) {
    assert.equal(app.request({ ...feedback, ...changes }).ok, false);
  }
  assert.equal(app.rows.length, 0);
  assert.equal(app.request({ action: 'status', participationId: id }).saved, false);
});

test('code à usage unique, vérifié dans la feuille, uniquement après révélation', () => {
  const app = service();
  app.request(feedback);
  const code = app.rows[0][10];
  assert.match(app.context.consumePromoCode(code), /pas encore révélé/);
  assert.equal(app.rows[0][15], '');
  app.request({ action: 'reveal', participationId: id });
  assert.match(app.context.consumePromoCode('BBF-INVENTE'), /invalide/);
  assert.match(app.context.consumePromoCode(code), /Code utilisé/);
  assert.ok(app.rows[0][15]);
  assert.match(app.context.consumePromoCode(code), /déjà été utilisé/);
});

test('les commentaires sont stockés comme texte et non comme formules', () => {
  const app = service();
  app.request({ ...feedback, avis: '=IMPORTXML("x")' });
  assert.equal(app.rows[0][8], "'=IMPORTXML(\"x\")");
});

test('proxy : reçoit une confirmation v2 et refuse un ancien script ou une erreur Google', async () => {
  const url = 'https://script.google.com/macros/s/test/exec';
  const result = await forwardParticipation(feedback, url, async (target, options) => {
    if (options.method === 'GET') {
      assert.equal(target, url + '?action=health');
      return { ok: true, json: async () => ({ version: 2, ok: true }) };
    }
    assert.equal(target, url);
    assert.equal(JSON.parse(options.body).action, 'save');
    return { ok: true, json: async () => ({ version: 2, ok: true, saved: true, revealed: false }) };
  });
  assert.equal(result.saved, true);
  await assert.rejects(forwardParticipation(feedback, url, async () => ({ ok: true, json: async () => ({ saved: true }) })), error => error.code === 'SCRIPT_UPDATE_REQUIRED');
  await assert.rejects(forwardParticipation(feedback, url, async () => ({ ok: false })), error => error.code === 'GOOGLE_ACCESS');
  await assert.rejects(forwardParticipation(feedback, 'http://invalid'), /configuré/);
});

test('diagnostic ancien script : aucun POST ni enregistrement envoyé', async () => {
  const methods = [];
  await assert.rejects(forwardParticipation(feedback, 'https://script.google.com/macros/s/test/exec', async (_url, options) => {
    methods.push(options.method);
    return { ok: true, json: async () => { throw new SyntaxError('HTML'); } };
  }), error => error.code === 'SCRIPT_UPDATE_REQUIRED');
  assert.deepEqual(methods, ['GET']);
});

test('diagnostic Apps Script v2 : contrôle sans ligne ni tirage', () => {
  const app = service();
  const response = JSON.parse(app.context.doGet({ parameter: { action: 'health' } }));
  assert.equal(response.ok, true);
  assert.equal(response.version, 2);
  assert.equal(app.rows.length, 0);
  assert.equal(app.draws(), 0);
});

test('WhatsApp : une seule tentative après révélation, sans bloquer le résultat', () => {
  const messages = [];
  const app = service(0.01, (url, options) => {
    if (url.includes('/checkWhatsapp/')) return {getResponseCode: () => 200, getContentText: () => JSON.stringify({existsWhatsapp:true, chatId:'123456789012345@lid'})};
    messages.push(JSON.parse(options.payload));
    return { getResponseCode: () => 200, getContentText: () => JSON.stringify({idMessage:'message-test'}) };
  });
  app.request(feedback);
  assert.equal(messages.length, 0);
  app.request({action:'reveal',participationId:id});
  app.request({action:'reveal',participationId:id});
  app.request({action:'status',participationId:id});
  assert.equal(messages.length, 1);
  assert.equal(messages[0].chatId, '123456789012345@lid');
  assert.match(messages[0].message, /Coupe gratuite/);
  assert.match(messages[0].message, /BBF-/);
  assert.equal(app.rows[0][18], 'Accepté par Green API');
});

test('WhatsApp indisponible : avis et cadeau conservés, pas de doublon au nouvel essai', () => {
  let calls = 0;
  const app = service(0.8, () => { calls++; throw new Error('network'); });
  app.request(feedback);
  assert.equal(app.request({action:'reveal',participationId:id}).ok, true);
  assert.equal(app.rows[0][18], 'Vérification WhatsApp impossible — aucun envoi');
  assert.equal(app.request({action:'reveal',participationId:id}).ok, true);
  assert.equal(calls, 1);
});

test('ancien compte : seule une correspondance confirmée autorise une deuxième vérification', () => {
  const calls = [];
  const app = service(0.8, (url, options) => {
    const data = JSON.parse(options.payload);
    calls.push(data);
    const body = url.includes('/checkWhatsapp/')
      ? data.chatId === '2250505050505@c.us' ? {existsWhatsapp:false} : {existsWhatsapp:true,chatId:'123456789012345@lid'}
      : {idMessage:'confirmed-message'};
    return {getResponseCode: () => 200, getContentText: () => JSON.stringify(body)};
  }, {GREEN_API_VERIFIED_PHONE_ALIASES: JSON.stringify({'2250505050505':'22505050505'})});
  app.request(feedback);
  app.request({action:'reveal',participationId:id});
  assert.deepEqual(calls.map(call => call.chatId), ['2250505050505@c.us','22505050505@c.us','123456789012345@lid']);
  assert.equal(app.rows[0][16], '2250505050505');
  assert.equal(app.rows[0][18], 'Accepté par Green API');
});

test('compte inconnu, réponse invalide ou quota : aucun envoi ni suppression du résultat', () => {
  for (const [status, body] of [[200,{existsWhatsapp:false}],[200,{existsWhatsapp:true,chatId:'bad-id'}],[466,{}],[200,{}]]) {
    let calls = 0;
    const app = service(0.8, (url) => {
      calls++;
      assert.match(url, /\/checkWhatsapp\//);
      return {getResponseCode: () => status, getContentText: () => JSON.stringify(body)};
    });
    app.request(feedback);
    assert.equal(app.request({action:'reveal',participationId:id}).ok, true);
    app.request({action:'reveal',participationId:id});
    assert.equal(calls, 1);
    assert.equal(app.rows.length, 1);
    assert.notEqual(app.rows[0][18], 'Accepté par Green API');
  }
});

test('timeout pendant envoi : aucune deuxième tentative', () => {
  let sends = 0;
  const app = service(0.8, url => {
    if (url.includes('/checkWhatsapp/')) return {getResponseCode: () => 200,getContentText: () => JSON.stringify({existsWhatsapp:true,chatId:'123456789012345@lid'})};
    sends++;
    throw new Error('network');
  });
  app.request(feedback);
  app.request({action:'reveal',participationId:id});
  app.request({action:'reveal',participationId:id});
  assert.equal(sends, 1);
  assert.equal(app.rows[0][18], 'Envoi incertain — à vérifier');
});

test('historique sondage : import sans doublon, ancien code conservé et nouvelle partie autorisée', () => {
  const app = service();
  const old = ['2026-10-05T10:00:00Z', 'Client historique', '+2250505050505', 'Adulte', '😎', 'Très bien', 'Coupe gratuite', 'BBF-ABC123'];
  const book = {getSheetByName: () => ({getLastRow: () => 2, getSheetId: () => 123, getRange: () => ({getValues: () => [old]})})};
  app.context.importLegacyResponses(book, app.sheet);
  app.context.importLegacyResponses(book, app.sheet);
  assert.equal(app.rows.length, 1);
  assert.equal(app.rows[0][10], 'BBF-ABC123');
  assert.equal(app.rows[0][18], 'Historique — aucun nouvel envoi');
  assert.equal(app.request({...feedback, participationId:anotherId}).ok, true);
  assert.match(app.context.consumePromoCode('BBF-ABC123'), /Code utilisé/);
  assert.equal(app.draws(), 1);
});

test('un seul budget de temps pour le contrôle Google et la participation', async () => {
  let firstSignal;
  await forwardParticipation(feedback, 'https://script.google.com/macros/s/test/exec', async (_url, options) => {
    if (options.method === 'GET') firstSignal = options.signal;
    else assert.equal(options.signal, firstSignal);
    return {ok:true,json:async () => ({version:2,ok:true,saved:true})};
  });
  assert.equal(participationFailure({name:'TimeoutError'}).code, 'GOOGLE_TIMEOUT');
  assert.match(participationFailure({name:'AbortError'}).message, /pas comptée deux fois/);
});
