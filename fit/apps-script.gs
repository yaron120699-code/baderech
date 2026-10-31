// Google Apps Script לגיליון "בדרך - fit".
// מדביקים ב-Extensions → Apps Script, שומרים, ואז:
// Deploy → Manage deployments → עיפרון → Version: New version → Deploy.
// הוראות מלאות: fit/SETUP-FIT.md

var HEADERS = ['code', 'submitted_at', 'verdict', 'clicked', 'stage', 'why', 'stuck', 'change', 'seek', 'f2f', 'commit', 'source', 'id', 'name'];

function sheetWithHeaders_() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.setFrozenRows(1);
    return { sheet: sheet, head: HEADERS.slice() };
  }
  // גיליון שכבר יש בו כותרות: מוסיפים בסוף רק עמודות שחסרות, בלי לגעת בקיימות.
  var head = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  HEADERS.forEach(function (h) {
    if (head.indexOf(h) === -1) {
      head.push(h);
      sheet.getRange(1, head.length).setValue(h);
    }
  });
  return { sheet: sheet, head: head };
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var data = JSON.parse(e.postData.contents);
    var s = sheetWithHeaders_();
    var sheet = s.sheet, head = s.head;

    if (data.type === 'click') {
      // מוסיפים את הלחיצה לשורה עם אותו קוד (מחפשים מהסוף, השורה האחרונה היא החדשה).
      var codeCol = head.indexOf('code') + 1, clickCol = head.indexOf('clicked') + 1;
      var last = sheet.getLastRow();
      if (last > 1 && data.code) {
        var codes = sheet.getRange(2, codeCol, last - 1, 1).getValues();
        for (var i = codes.length - 1; i >= 0; i--) {
          if (String(codes[i][0]) === String(data.code)) {
            // שם ממסך התוצאה: נכתב לעמודה name ולא נרשם כלחיצה.
            if (data.action === 'name') {
              sheet.getRange(i + 2, head.indexOf('name') + 1).setValue(String(data.name || '').slice(0, 60));
              break;
            }
            var cell = sheet.getRange(i + 2, clickCol);
            var now = String(cell.getValue() || '');
            var list = now ? now.split(', ') : [];
            if (list.indexOf(data.action) === -1) list.push(data.action);
            cell.setValue(list.join(', '));
            break;
          }
        }
      }
      return ContentService.createTextOutput('ok');
    }

    var row = head.map(function (h) {
      if (h === 'submitted_at') return data.submitted_at ? new Date(data.submitted_at) : new Date();
      return data[h] || '';
    });
    sheet.appendRow(row);
    return ContentService.createTextOutput('ok');
  } finally {
    lock.releaseLock();
  }
}

function doGet() {
  return ContentService.createTextOutput('baderech fit: ok');
}
