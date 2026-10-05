const RESPONSE_SHEET = 'Reponses Beaufort';
const LEGACY_SHEET = 'sondage';
const CAMPAIGN = 'ouverture-beaufort-v1';
const SOURCES = ['WhatsApp', 'Instagram', 'Un ami / bouche-à-oreille', 'En passant devant le salon', 'Autre'];
const PRIZES = ['Aucun lot', 'Coupe gratuite', '30% de réduction', 'Pigmentation offerte', '20% de réduction', '10% de réduction'];
const HEADERS = ['Date', 'Nom', 'WhatsApp', 'Tranche d’âge', 'Coupe', 'Accueil', 'Attente', 'Source', 'Avis', 'Récompense', 'Code promo', 'Emoji coupe', 'Participation', 'Opération', 'Révélé le', 'Code utilisé le', 'Numéro normalisé', 'Lot ID', 'WhatsApp statut', 'WhatsApp ID message', 'Origine'];

function onOpen() {
  SpreadsheetApp.getUi().createMenu('Le BeauFORT BarberShop')
    .addItem('Vérifier / utiliser un code', 'redeemPromoCode').addToUi();
}

function setupBeaufort() {
  const book = SpreadsheetApp.getActiveSpreadsheet();
  PropertiesService.getScriptProperties().setProperty('SPREADSHEET_ID', book.getId());
  const sheet = book.getSheetByName(RESPONSE_SHEET) || book.insertSheet(RESPONSE_SHEET);
  sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]).setBackground('#ffcc00').setFontWeight('bold');
  sheet.setFrozenRows(1);
  sheet.getRange('A:A').setNumberFormat('dd/MM/yyyy HH:mm');
  sheet.getRange('O:P').setNumberFormat('dd/MM/yyyy HH:mm');
  sheet.getRange('C:C').setNumberFormat('@');
  sheet.getRange('Q:Q').setNumberFormat('@');
  sheet.autoResizeColumns(1, HEADERS.length);
  const dashboard = book.getSheetByName('Tableau de bord Beaufort') || book.insertSheet('Tableau de bord Beaufort');
  dashboard.getRange('A1:B9').setValues([
    ['Satisfaction Le BeauFORT BarberShop', 'Valeur'], ['Nombre de réponses', ''],
    ['Coupe — moyenne / 5', ''], ['Accueil — moyenne / 5', ''], ['Attente — moyenne / 5', ''],
    ['Clients avec au moins une note ≤ 2', ''], ['Commentaires renseignés', ''],
    ['Lots attribués', ''], ['Source de découverte', 'Nombre'],
  ]);
  dashboard.getRange('B2').setFormula("=COUNTA('Reponses Beaufort'!A2:A)");
  ['E', 'F', 'G'].forEach(function (column, index) {
    dashboard.getRange(index + 3, 2).setFormula("=IFERROR(AVERAGE('Reponses Beaufort'!" + column + '2:' + column + '),0)');
  });
  dashboard.getRange('B6').setFormula("=SUMPRODUCT(('Reponses Beaufort'!A2:A<>\"\")*((('Reponses Beaufort'!E2:E<>\"\")*('Reponses Beaufort'!E2:E<=2)+('Reponses Beaufort'!F2:F<>\"\")*('Reponses Beaufort'!F2:F<=2)+('Reponses Beaufort'!G2:G<>\"\")*('Reponses Beaufort'!G2:G<=2))>0))");
  dashboard.getRange('B7').setFormula("=COUNTIF('Reponses Beaufort'!I2:I,\"?*\")");
  dashboard.getRange('B8').setFormula("=COUNTIF('Reponses Beaufort'!K2:K,\"?*\")");
  SOURCES.forEach(function (source, index) {
    const row = index + 10;
    dashboard.getRange(row, 1).setValue(source);
    dashboard.getRange(row, 2).setFormula("=COUNTIF('Reponses Beaufort'!H2:H,A" + row + ')');
  });
  dashboard.getRange('B3:B5').setNumberFormat('0.00');
  dashboard.getRange('A1:B1').setBackground('#ffcc00').setFontWeight('bold');
  dashboard.getRange('A9:B9').setBackground('#ffcc00').setFontWeight('bold');
  dashboard.getRange('A16:B16').setValues([['Codes utilisés', "=COUNT('Reponses Beaufort'!P2:P)"]]);
  dashboard.setFrozenRows(1);
  dashboard.autoResizeColumns(1, 2);
  // Les anciens enregistrements et leurs cadeaux restent conservés.
  if (sheet.getLastRow() > 1) {
    const oldRows = sheet.getRange(2, 1, sheet.getLastRow() - 1, HEADERS.length).getValues();
    oldRows.forEach(function (row, index) {
      if (row[12]) return;
      const prizeId = PRIZES.indexOf(String(row[9]));
      sheet.getRange(index + 2, 13, 1, 6).setValues([[
        Utilities.getUuid(), CAMPAIGN, row[0] || new Date(), '', normalizePhone(row[2]), Math.max(0, prizeId),
      ]]);
    });
  }
  importLegacyResponses(book, sheet);
  onOpen();
}

function importLegacyResponses(book, destination) {
  const source = book.getSheetByName(LEGACY_SHEET);
  if (!source || source.getLastRow() < 2) return;
  const existing = destination.getLastRow() > 1
    ? destination.getRange(2, 1, destination.getLastRow() - 1, HEADERS.length).getValues() : [];
  const imported = new Set(existing.map(function (row) { return row[20]; }));
  const rows = source.getRange(2, 1, source.getLastRow() - 1, 8).getValues();
  rows.forEach(function (row, index) {
    const origin = LEGACY_SHEET + ':' + source.getSheetId() + ':' + (index + 2);
    if (imported.has(origin) || !row[2]) return;
    const date = row[0] instanceof Date ? row[0] : new Date(row[0]);
    const validDate = isNaN(date.getTime()) ? new Date() : date;
    const prizeId = Math.max(0, PRIZES.indexOf(String(row[6])));
    destination.appendRow([
      validDate, safeText(row[1]), safeText(row[2]), safeText(row[3]), '', '', '', '',
      safeText(row[5]), safeText(row[6]), safeText(row[7]), safeText(row[4]),
      Utilities.getUuid(), CAMPAIGN, validDate, '', normalizePhone(row[2]), prizeId,
      'Historique — aucun nouvel envoi', '', origin,
    ]);
    imported.add(origin);
  });
}

function jsonResult(value) {
  return ContentService.createTextOutput(JSON.stringify(Object.assign({ version: 2 }, value)))
    .setMimeType(ContentService.MimeType.JSON);
}

// Diagnostic public sans lecture de contacts, sans tirage et sans écriture.
function doGet(event) {
  if (!event || !event.parameter || event.parameter.action !== 'health') {
    return jsonResult({ ok: false, code: 'INVALID_ACTION', message: 'Requête invalide.' });
  }
  try {
    getResponseSheet();
    return jsonResult({ ok: true, revision: 'repeat-play-v1', unlimitedPlays: true });
  } catch {
    return jsonResult({ ok: false, code: 'SETUP_REQUIRED', message: 'Le service de participation n’est pas encore configuré. Merci de prévenir le salon.' });
  }
}

function getResponseSheet() {
  const id = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
  if (!id) throw new Error('Exécuter setupBeaufort avant le déploiement.');
  const sheet = SpreadsheetApp.openById(id).getSheetByName(RESPONSE_SHEET);
  if (!sheet || sheet.getRange(1, 18).getValue() !== 'Lot ID' || sheet.getRange(1, 21).getValue() !== 'Origine') throw new Error('Exécuter setupBeaufort.');
  return sheet;
}

function normalizePhone(value) {
  let digits = String(value || '').replace(/^'/, '').replace(/\D/g, '');
  if (digits.indexOf('00') === 0) digits = digits.slice(2);
  // Le salon utilise les numéros ivoiriens : formats local et +225 identiques.
  if (digits.length === 10) digits = '225' + digits;
  return digits;
}

function participationResult(row) {
  const revealed = Boolean(row[14]);
  const result = { ok: true, saved: true, revealed: revealed };
  if (revealed) {
    result.rewardId = Number(row[17]);
    result.codePromo = String(row[10] || '');
  }
  return result;
}

function doPost(event) {
  const lock = LockService.getScriptLock();
  let notification = null;
  try {
    const data = JSON.parse(event.postData.contents);
    if (['save', 'status', 'reveal'].indexOf(data.action) === -1 ||
        !/^[a-f0-9-]{36}$/i.test(String(data.participationId || ''))) {
      return jsonResult({ ok: false, message: 'Participation invalide.' });
    }
    lock.waitLock(30000);
    const sheet = getResponseSheet();
    const rows = sheet.getLastRow() > 1 ? sheet.getRange(2, 1, sheet.getLastRow() - 1, HEADERS.length).getValues() : [];
    const index = rows.findIndex(function (row) { return row[12] === data.participationId && row[13] === CAMPAIGN; });
    if (index !== -1) {
      const row = rows[index];
      if (data.action === 'reveal' && !row[14]) {
        row[14] = new Date();
        sheet.getRange(index + 2, 15).setValue(row[14]);
        // Réserver l’unique tentative sous verrou avant d’appeler Green API.
        sheet.getRange(index + 2, 19).setValue('Envoi en cours');
        notification = { sheet: sheet, number: index + 2, row: row };
      }
      return jsonResult(participationResult(row));
    }
    if (data.action === 'status') return jsonResult({ ok: true, saved: false, revealed: false });
    if (data.action === 'reveal') return jsonResult({ ok: false, message: 'Envoie ton avis avant de jouer.' });
    const phone = normalizePhone(data.contact);
    if (!/^\+?[0-9\s()\-]+$/.test(String(data.contact || '')) || !/^\d{8,15}$/.test(phone) || String(data.nomPrenom || '').trim().length < 2) {
      return jsonResult({ ok: false, message: 'Vérifie ton nom et ton numéro WhatsApp.' });
    }
    ['noteCoupe', 'noteAccueil', 'noteAttente'].forEach(function (key) {
      if (!Number.isInteger(data[key]) || data[key] < 1 || data[key] > 5) throw new Error('Note invalide');
    });
    if (SOURCES.indexOf(data.sourceDecouverte) === -1) throw new Error('Réponse invalide');
    // 4 % par cadeau, 80 % sans lot : le client ne décide ni du lot ni du code.
    const draw = Math.random();
    const prizeId = draw < 0.2 ? Math.floor(draw / 0.04) + 1 : 0;
    let code = '';
    if (prizeId) {
      do { code = 'BBF-' + Utilities.getUuid().replace(/-/g, '').slice(0, 10).toUpperCase(); }
      while (rows.some(function (row) { return row[10] === code; }));
    }
    const row = [
      new Date(), safeText(data.nomPrenom), safeText(data.contact), safeText(data.trancheAge),
      data.noteCoupe, data.noteAccueil, data.noteAttente, safeText(data.sourceDecouverte),
      safeText(data.avis), PRIZES[prizeId], code, safeText(data.noteEmoji),
      data.participationId, CAMPAIGN, '', '', phone, prizeId, 'En attente du grattage', '', '',
    ];
    sheet.appendRow(row);
    return jsonResult(participationResult(row));
  } catch {
    return jsonResult({ ok: false, message: 'Enregistrement impossible. Réessaie dans un instant ou signale-le au salon.' });
  } finally {
    if (lock.hasLock()) lock.releaseLock();
    if (notification) {
      // Le résultat déjà enregistré reste accessible même si WhatsApp échoue.
      try { sendRecordedWhatsApp(notification); } catch { console.error('WhatsApp : suivi indisponible, aucun nouvel envoi automatique.'); }
    }
  }
}

function sendRecordedWhatsApp(notification) {
  const properties = PropertiesService.getScriptProperties();
  const instance = properties.getProperty('GREEN_API_ID_INSTANCE');
  const token = properties.getProperty('GREEN_API_TOKEN_INSTANCE');
  const apiUrl = (properties.getProperty('GREEN_API_URL') || 'https://api.green-api.com').replace(/\/$/, '');
  const sheet = notification.sheet;
  const number = notification.number;
  const row = notification.row;
  if (!instance || !token) {
    sheet.getRange(number, 19).setValue('Non configuré');
    return;
  }
  if (!/^https:\/\/[a-z0-9.-]*green-?api\.com$/i.test(apiUrl) || !/^\d+$/.test(instance)) {
    sheet.getRange(number, 19).setValue('Configuration invalide');
    return;
  }
  const phone = normalizePhone(row[16] || row[2]);
  if (!/^\d{8,15}$/.test(phone)) {
    sheet.getRange(number, 19).setValue('Numéro invalide');
    return;
  }
  const firstName = String(row[1] || '').replace(/^'/, '').trim().split(/\s+/)[0];
    const message = row[10]
      ? buildWinMessage(firstName, row[9], row[10]) : buildLossMessage(firstName);
    let sendStarted = false;
    try {
      const baseUrl = apiUrl + '/waInstance' + instance;
      const aliases = JSON.parse(properties.getProperty('GREEN_API_VERIFIED_PHONE_ALIASES') || '{}');
      if (!aliases || typeof aliases !== 'object' || Array.isArray(aliases)) {
        sheet.getRange(number, 19).setValue('Correspondances WhatsApp invalides');
        return;
      }
      // Only salon-confirmed mappings are allowed; never guess by removing an operator prefix.
      const verifiedAlias = Object.prototype.hasOwnProperty.call(aliases, phone) ? aliases[phone] : null;
      if (verifiedAlias !== null && !/^\d{8,15}$/.test(String(verifiedAlias))) {
        sheet.getRange(number, 19).setValue('Correspondance WhatsApp invalide');
        return;
      }
      let target = phone;
      let account;
      for (let attempt = 0; attempt < 2; attempt++) {
        const check = UrlFetchApp.fetch(baseUrl + '/checkWhatsapp/' + encodeURIComponent(token), {
          method: 'post', contentType: 'application/json',
          payload: JSON.stringify({ chatId: target + '@c.us', force: true }),
          muteHttpExceptions: true,
        });
        if (check.getResponseCode() < 200 || check.getResponseCode() >= 300) {
          sheet.getRange(number, 19).setValue('Vérification WhatsApp : HTTP ' + check.getResponseCode());
          return;
        }
        account = JSON.parse(check.getContentText());
        if (account.existsWhatsapp === true) break;
        if (account.existsWhatsapp !== false) {
          sheet.getRange(number, 19).setValue('Réponse WhatsApp invalide');
          return;
        }
        if (attempt === 0 && verifiedAlias && String(verifiedAlias) !== phone) {
          target = String(verifiedAlias);
        } else {
          sheet.getRange(number, 19).setValue('Compte WhatsApp non trouvé — vérifier avec le client');
          return;
        }
      }
      const chatId = account.chatId;
      if (typeof chatId !== 'string' || !/^\d{8,20}@(lid|c\.us)$/.test(chatId)) {
        sheet.getRange(number, 19).setValue('Identifiant WhatsApp invalide');
        return;
      }
      sheet.getRange(number, 19).setValue('Envoi en cours');
      sendStarted = true;
      const response = UrlFetchApp.fetch(apiUrl + '/waInstance' + instance + '/sendMessage/' + encodeURIComponent(token), {
      method: 'post', contentType: 'application/json',
        payload: JSON.stringify({ chatId: chatId, message: message }),
      muteHttpExceptions: true,
    });
    const status = response.getResponseCode();
    const body = JSON.parse(response.getContentText());
    if (status >= 200 && status < 300 && body.idMessage) {
      sheet.getRange(number, 19).setValue('Accepté par Green API');
      sheet.getRange(number, 20).setValue(safeText(body.idMessage));
    } else {
      sheet.getRange(number, 19).setValue('Échec HTTP ' + status);
    }
  } catch {
      sheet.getRange(number, 19).setValue(sendStarted ? 'Envoi incertain — à vérifier' : 'Vérification WhatsApp impossible — aucun envoi');
  }
}

function buildWinMessage(firstName, prize, code) {
  return '🎉 Félicitations ' + firstName + ' !\n\n'
    + 'Chez *Le BeauFORT BarberShop*, tu as gagné :\n✨ *' + prize + '*\n\n'
    + 'Ton code cadeau : *' + code + '*\n\n'
    + 'Présente-le au salon lors de ta prochaine visite. Utilisable une seule fois. ✂️\n'
    + 'Merci pour ton avis et à très vite !';
}

function buildLossMessage(firstName) {
  return 'Merci ' + firstName + ' pour ta visite chez *Le BeauFORT BarberShop* ! 💛\n\n'
    + 'Pas de lot cette fois, mais ton avis nous aide à améliorer ton prochain passage.\n'
    + 'On sera heureux de te retrouver pour ta prochaine coupe. ✂️';
}

function findPromo(sheet, code) {
  if (sheet.getLastRow() < 2) return null;
  const rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, HEADERS.length).getValues();
  const index = rows.findIndex(function (row) { return String(row[10]) === code; });
  return index === -1 ? null : { number: index + 2, values: rows[index] };
}

function consumePromoCode(code) {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const sheet = getResponseSheet();
    const match = findPromo(sheet, code);
    if (!match || !match.values[14]) return 'Code invalide ou pas encore révélé.';
    if (match.values[15]) return 'Ce code a déjà été utilisé.';
    sheet.getRange(match.number, 16).setValue(new Date());
    return 'Code utilisé : ' + match.values[9];
  } finally { lock.releaseLock(); }
}

function redeemPromoCode() {
  const ui = SpreadsheetApp.getUi();
  const input = ui.prompt('Code Le BeauFORT BarberShop', 'Saisis le code présenté par le client.', ui.ButtonSet.OK_CANCEL);
  if (input.getSelectedButton() !== ui.Button.OK) return;
  const code = input.getResponseText().trim().toUpperCase();
  if (!/^BBF-[A-Z0-9]{6,10}$/.test(code)) { ui.alert('Code invalide.'); return; }
  const match = findPromo(getResponseSheet(), code);
  if (!match || !match.values[14]) { ui.alert('Code invalide ou pas encore révélé.'); return; }
  if (match.values[15]) { ui.alert('Ce code a déjà été utilisé.'); return; }
  const decision = ui.alert('Code valide : ' + match.values[9], 'Numéro du client : ' + match.values[2] + '\nUtiliser ce code maintenant ?', ui.ButtonSet.YES_NO);
  if (decision === ui.Button.YES) ui.alert(consumePromoCode(code));
}

function safeText(value) {
  const text = String(value == null ? '' : value).slice(0, 5000);
  return /^[=+\-@\s]/.test(text) ? "'" + text : text;
}
