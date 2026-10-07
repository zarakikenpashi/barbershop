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

function service(draw = 0.01) {
  const rows = [];
  let locked = false;
  let lockWaits = 0;
  let draws = 0;
  let uuidCount = 0;
  const ranges = [];
  const sheet = {
    getLastRow: () => rows.length + 1,
    appendRow: row => rows.push(row),
    getRange: (row, column, count = 1, columns = 1) => {
      ranges.push([row, column, count, columns]);
      return {
        getValue: () => row === 1 ? ({18:'Lot ID', 21:'Origine', 22:'Actualités WhatsApp', 23:'Accord actualités le'})[column] || '' : rows[row - 2]?.[column - 1],
        getValues: () => row === 1
          ? [Array.from({length: columns}, (_, index) => ({18:'Lot ID', 21:'Origine', 22:'Actualités WhatsApp', 23:'Accord actualités le'})[column + index] || '')]
          : rows.slice(row - 2, row - 2 + count).map(value => value.slice(column - 1, column - 1 + columns)),
        setValue: value => { rows[row - 2][column - 1] = value; },
        setValues: values => values.forEach((valuesRow, rowIndex) => valuesRow.forEach((value, columnIndex) => {
          rows[row - 2 + rowIndex][column - 1 + columnIndex] = value;
        })),
        createTextFinder: text => ({
          matchEntireCell() { return this; },
          findNext() {
            for (let rowIndex = row - 2; rowIndex < row - 2 + count; rowIndex++) {
              for (let columnIndex = column - 1; columnIndex < column - 1 + columns; columnIndex++) {
                if (String(rows[rowIndex]?.[columnIndex] ?? '') === text) return { getRow: () => rowIndex + 2 };
              }
            }
            return null;
          },
        }),
      };
    },
  };
  const context = vm.createContext({
    Math: Object.assign(Object.create(Math), { random: () => { draws++; return draw; } }),
    PropertiesService: { getScriptProperties: () => ({ getProperty: key => key === 'SPREADSHEET_ID' ? 'test-sheet' : null }) },
    SpreadsheetApp: { openById: () => ({ getSheetByName: () => sheet }) },
    LockService: { getScriptLock: () => ({
      waitLock: () => { assert.equal(locked, false); locked = true; lockWaits++; },
      hasLock: () => locked,
      releaseLock: () => { locked = false; },
    }) },
    Utilities: { getUuid: () => (++uuidCount).toString(16).padStart(8, '0') + '-cccc-4ccc-cccc-cccccccccccc' },
    ContentService: { createTextOutput: text => ({ setMimeType: () => text }), MimeType: { JSON: 'json' } },
    UrlFetchApp: { fetch: () => { throw new Error('La participation ne doit pas appeler une API de messagerie.'); } },
    console,
  });
  vm.runInContext(script, context);
  return {
    rows, context, sheet, ranges,
    draws: () => draws,
    lockWaits: () => lockWaits,
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

test('participation anonyme et âge omis : participation autorisée sans coordonnées', () => {
  const app = service();
  assert.equal(app.request({...feedback, nomPrenom:'', contact:'', trancheAge:''}).saved, true);
  assert.equal(app.rows[0][1], '');
  assert.equal(app.rows[0][2], '');
  assert.equal(app.rows[0][3], '');
  assert.equal(app.request({action:'reveal', participationId:id}).ok, true);
});

test('les coordonnées peuvent être ajoutées après le résultat sans message automatique', () => {
  const app = service(0.01);
  app.request({...feedback, nomPrenom:'', contact:''});
  app.request({action:'reveal', participationId:id});
  assert.equal(app.request({action:'profile', participationId:id, nomPrenom:'Yao', contact:'0505050505'}).ok, false);
  const result = app.request({action:'profile', participationId:id, nomPrenom:'Yao Koffi', contact:'+225 05 05 05 05 05'});
  assert.equal(result.saved, true);
  assert.equal(result.nomPrenom, 'Yao Koffi');
  assert.equal(result.contact, '+225 05 05 05 05 05');
  assert.equal(app.rows[0][1], 'Yao Koffi');
  assert.equal(app.rows[0][2], "'+225 05 05 05 05 05");
  assert.equal(app.rows[0][16], '2250505050505');
  assert.equal(app.rows[0][18], 'Résultat affiché dans l’application');
  assert.equal(app.rows[0][21], 'Non');
  assert.equal(result.marketingConsent, false);
});

test('consentement marketing facultatif, distinct et mémorisé avec sa date', () => {
  const app = service();
  app.request({...feedback, nomPrenom:'', contact:''});
  app.request({action:'reveal', participationId:id});
  const saved = app.request({action:'profile', participationId:id, nomPrenom:'Yao Koffi', contact:'0505050505', marketingConsent:true});
  assert.equal(saved.saved, true);
  assert.equal(saved.marketingConsent, true);
  assert.equal(app.rows[0][21], 'Oui');
  assert.ok(app.rows[0][22]);
  const optedOut = app.request({action:'profile', participationId:id, nomPrenom:'Yao Koffi', contact:'0505050505', marketingConsent:false});
  assert.equal(optedOut.marketingConsent, false);
  assert.equal(app.rows[0][21], 'Non');
  assert.equal(app.rows[0][22], '');
});

test('coordonnées refusées avant révélation ou avec participation inconnue', () => {
  const app = service();
  app.request({...feedback, nomPrenom:'', contact:''});
  assert.equal(app.request({action:'profile', participationId:id, nomPrenom:'Yao', contact:'0505050505'}).ok, false);
  assert.equal(app.request({action:'profile', participationId:anotherId, nomPrenom:'Yao', contact:'0505050505'}).ok, false);
  assert.equal(app.rows.length, 1);
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
  for (const changes of [{ noteCoupe: 6 }, { noteAccueil: 0 }, { sourceDecouverte: 'inconnue' }, { participationId: 'invalid' }]) {
    assert.equal(app.request({ ...feedback, ...changes }).ok, false);
  }
  assert.equal(app.rows.length, 0);
  assert.equal(app.request({ action: 'status', participationId: id }).saved, false);
});

test('le statut cherche seulement l’identifiant en colonne et ne prend pas le verrou', () => {
  const app = service();
  app.request(feedback);
  const waitsBeforeStatus = app.lockWaits();
  app.ranges.length = 0;
  const result = app.request({action:'status', participationId:anotherId});
  assert.equal(result.saved, false);
  assert.equal(app.lockWaits(), waitsBeforeStatus);
  assert.ok(app.ranges.some(([row, column, , columns]) => row === 2 && column === 13 && columns === 1));
  assert.ok(!app.ranges.some(([row, column, , columns]) => row === 2 && column === 1 && columns === 23));
});

test('code à usage unique, vérifié dans la feuille, uniquement après révélation', () => {
  const app = service();
  app.request(feedback);
  const code = app.rows[0][10];
  assert.match(app.context.consumePromoCode(code), /pas encore révélé/);
  assert.equal(app.rows[0][15], '');
  app.request({ action: 'reveal', participationId: id });
  assert.match(app.context.consumePromoCode('BBF-INVENTE'), /invalide/);
  app.request({ action: 'profile', participationId: id, nomPrenom: 'Client Test', contact: '0505050505' });
  assert.match(app.context.consumePromoCode(code), /Code utilisé/);
  assert.ok(app.rows[0][15]);
  assert.match(app.context.consumePromoCode(code), /déjà été utilisé/);
});

test('un cadeau ne peut être réclamé qu’après l’enregistrement du nom et du WhatsApp', () => {
  const app = service(0.01);
  app.request({...feedback, nomPrenom:'', contact:''});
  const result = app.request({action:'reveal', participationId:id});
  assert.match(app.context.consumePromoCode(result.codePromo), /doit enregistrer son nom complet/);
  assert.equal(app.rows[0][15], '');
  app.request({action:'profile', participationId:id, nomPrenom:'Yao Koffi', contact:'0505050505'});
  assert.match(app.context.consumePromoCode(result.codePromo), /Code utilisé/);
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
      return { ok: true, json: async () => ({ version: 2, ok: true, revision: 'identity-after-result-v5' }) };
    }
    assert.equal(target, url);
    assert.equal(JSON.parse(options.body).action, 'save');
    return { ok: true, json: async () => ({ version: 2, ok: true, saved: true, revealed: false }) };
  });
  assert.equal(result.saved, true);
  const optimized = await forwardParticipation(feedback, url, async (_target, options) => ({
    ok: true,
    json: async () => options.method === 'GET'
      ? ({version:2,ok:true,revision:'identity-after-result-v6'})
      : ({version:2,ok:true,saved:true}),
  }));
  assert.equal(optimized.saved, true);
  await assert.rejects(forwardParticipation(feedback, url, async () => ({ ok: true, json: async () => ({ saved: true }) })), error => error.code === 'SCRIPT_UPDATE_REQUIRED');
  await assert.rejects(forwardParticipation(feedback, url, async (_target, options) => options.method === 'GET'
    ? {ok:true,json:async()=>({version:2,ok:true,revision:'identity-after-result-v4'})}
    : {ok:true,json:async()=>({version:2,ok:true,saved:true})}), error => error.code === 'SCRIPT_UPDATE_REQUIRED');
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
  assert.equal(response.revision, 'identity-after-result-v6');
  assert.equal(app.rows.length, 0);
  assert.equal(app.draws(), 0);
});

test('la révélation affiche le résultat sans envoyer de message WhatsApp', () => {
  const app = service(0.01);
  app.request(feedback);
  const result = app.request({action:'reveal',participationId:id});
  assert.equal(result.rewardId, 1);
  assert.match(result.codePromo, /^BBF-/);
  assert.equal(app.rows[0][18], 'Résultat affiché dans l’application');
  assert.equal(app.rows[0][19], '');
  assert.equal(app.request({action:'reveal',participationId:id}).codePromo, result.codePromo);
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
    return {ok:true,json:async () => options.method === 'GET'
      ? ({version:2,ok:true,revision:'identity-after-result-v5'})
      : ({version:2,ok:true,saved:true})};
  });
  assert.equal(participationFailure({name:'TimeoutError'}).code, 'GOOGLE_TIMEOUT');
  assert.match(participationFailure({name:'AbortError'}).message, /pas comptée deux fois/);
});
