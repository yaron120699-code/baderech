# חיבור דף /research לגיליון Google Sheets

הדף `/research` בנוי, אבל **התשובות עדיין לא נשלחות לשום מקום** — עד שתחבר endpoint אמיתי הן רק נשמרות מקומית בדפדפן של כל מבקר (`localStorage`, כגיבוי, לא הרבה שווה לך). הפתרון הכי פשוט, בחינם, בלי שרת ובלי build tool — Google Apps Script שכותב ישירות לגיליון.

זמן הקמה: כ-10 דקות.

## שלב 1 — גיליון חדש

1. פתח [Google Sheets](https://sheets.new) וצור גיליון חדש.
2. קרא לו למשל `בדרך - מחקר`.
3. בשורה הראשונה הוסף כותרות בעמודות A-J:
   ```
   id | submitted_at | q1 | q2_rating | q3_open_text | q4 | q5 | optin_name | optin_contact | source
   ```

## שלב 2 — Apps Script

1. בגיליון: **Extensions → Apps Script**.
2. מחק את התוכן הקיים והדבק את הקוד הבא:

```javascript
function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var data = JSON.parse(e.postData.contents);

  sheet.appendRow([
    data.id || '',
    data.submitted_at || '',
    data.q1 || '',
    data.q2_rating || '',
    data.q3_open_text || '',
    data.q4 || '',
    data.q5 || '',
    data.optin_name || '',
    data.optin_contact || '',
    data.source || ''
  ]);

  return ContentService
    .createTextOutput(JSON.stringify({ status: 'ok' }))
    .setMimeType(ContentService.MimeType.JSON);
}
```

3. שמור (איקון הדיסקט, או Ctrl+S). תן לפרויקט שם, למשל `baderech-research`.

## שלב 3 — פריסה כ-Web App

1. בפינה הימנית העליונה: **Deploy → New deployment**.
2. ליד "Select type" — בחר **Web app** (איקון גלגל השיניים).
3. הגדרות:
   - **Execute as:** Me
   - **Who has access:** Anyone
4. **Deploy**. בפעם הראשונה גוגל יבקש הרשאה — אשר (זה הפרויקט שלך, זה בטוח).
5. תקבל **Web app URL** שנראה כך:
   ```
   https://script.google.com/macros/s/AKfycb.../exec
   ```
   העתק אותו.

## שלב 4 — חיבור לקוד

בקובץ `research/research.js`, בשורה הראשונה של הקובץ:

```javascript
var SUBMIT_ENDPOINT = ''; // <-- הדבק כאן
```

הדבק את ה-URL:

```javascript
var SUBMIT_ENDPOINT = 'https://script.google.com/macros/s/AKfycb.../exec';
```

שמור, בצע `git commit` ו-`push` — אם Vercel מחובר לריפו, הוא ייפרס אוטומטית.

## שלב 5 — בדיקה

1. גלוש ל-`/research` באתר החי (או ב-`python3 -m http.server 8000` מקומית).
2. מלא את השאלון עד הסוף ולחץ "לסיום ושליחה".
3. תוך כמה שניות אמורה להופיע שורה חדשה בגיליון.

אם לא — פתח את ה-Console בדפדפן (F12) ובדוק שגיאות. הסיבה הכי נפוצה: פריסה שלא הוגדרה כ-"Anyone" בשלב 3.

## הערות חשובות

- **פרטיות:** שדות `optin_name` ו-`optin_contact` נשארים ריקים אלא אם המבקר בחר למלא אותם. רוב השורות בגיליון יהיו אנונימיות לגמרי — זה בכוונה, זה בדיוק הרעיון של הדף.
- **שינוי גרסת הסקריפט:** אם תערוך את קוד ה-Apps Script בעתיד, תצטרך **Deploy → Manage deployments → Edit → New version** כדי שהשינויים ייכנסו לתוקף (עריכת הקוד לבד לא מספיקה).
- **גיבוי מקומי:** אם ה-endpoint לא מוגדר, או שהקריאה נכשלת (למשל אין אינטרנט), התשובה נשמרת ב-`localStorage` תחת המפתח `baderech_research_queue` בדפדפן של המבקר עצמו — זה לא עוזר לך לאסוף דאטה בפועל, אבל מבטיח שלמבקר עצמו התשובה "לא נעלמת" אם תרצה בעתיד לשדרג לפתרון שמנסה לשלוח שוב.
- **מגבלה לדעת:** Apps Script Web Apps לפעמים "נרדמים" לכמה שניות בקריאה הראשונה אחרי זמן מנוחה (cold start). זה לא אמור להשפיע על המשתמש כי אין מסך "טוען" באמצע - השליחה קורית ברקע אחרי שהוא כבר ראה את מסך התודה.
