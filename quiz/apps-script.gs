// Google Apps Script לגיליון "בדרך - מבדק" (רק המבדק, /quiz).
// מדביקים ב-Extensions → Apps Script, שומרים, ואז:
// Deploy → New deployment → Web app · Execute as: Me · Who has access: Anyone → Deploy.
// הכתובת שמתקבלת (מסתיימת ב-/exec) מוגדרת ב-SUBMIT_ENDPOINT בתוך quiz/quiz.js.

var HEADERS = ['code', 'submitted_at', 'pattern', 'second', 'answers', 'clicked', 'source', 'id'];

function sheet_() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.setFrozenRows(1);
    return { sheet: sheet, head: HEADERS.slice() };
  }
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
    var s = sheet_();
    var sheet = s.sheet, head = s.head;

    if (data.type === 'quiz_click') {
      // מוסיפים את הלחיצה לשורה עם אותו קוד (מחפשים מהסוף).
      var codeCol = head.indexOf('code') + 1, clickCol = head.indexOf('clicked') + 1;
      var last = sheet.getLastRow();
      if (last > 1 && data.code) {
        var codes = sheet.getRange(2, codeCol, last - 1, 1).getValues();
        for (var i = codes.length - 1; i >= 0; i--) {
          if (String(codes[i][0]) === String(data.code)) {
            var cell = sheet.getRange(i + 2, clickCol);
            var now = String(cell.getValue() || '');
            var list = now ? now.split(', ') : [];
            var action = String(data.action || '').slice(0, 30);
            if (list.indexOf(action) === -1) list.push(action);
            cell.setValue(list.join(', '));
            break;
          }
        }
      }
      return ContentService.createTextOutput('ok');
    }

    if (data.type === 'quiz') {
      var row = head.map(function (h) {
        if (h === 'submitted_at') return data.submitted_at ? new Date(data.submitted_at) : new Date();
        return data[h] || '';
      });
      sheet.appendRow(row);
    }
    return ContentService.createTextOutput('ok');
  } finally {
    lock.releaseLock();
  }
}

function doGet() {
  return ContentService.createTextOutput('baderech quiz: ok');
}
