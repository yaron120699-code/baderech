(function(){
var WA="972505494326";
var CAL="https://calendar.google.com/calendar/u/0/appointments/schedules/AcZssZ0ofP-cRwZhCKLFa0pnLG4Ib2WAyO6t5vIcJPsrCWzk4PzxktiDKDWdj4BuDzzyIKh5W39e9tZA";
var CHANNEL="https://instagram.com/baderech_";
// כתובת ה-Web App של Google Apps Script שכותב לגיליון (גיליון בדרך - fit).
// אם תרוקן את הכתובת, השאלון ימשיך לעבוד ופשוט לא ישלח כלום.
var SUBMIT_ENDPOINT='https://script.google.com/macros/s/AKfycbxHb8v9OwSYn3RxBpwQewbEqruxgm-vFaaMdyYKgFZbwooa9_wr0cUqVIp-T1QLth_7/exec';

var Q=[
 {id:"stage",stage:"מתחילים",note:"נקודת התחלה. לא ציון.",q:"באיזה שלב חיים אתה נמצא כרגע?",multi:true,hint:"אפשר לבחור יותר מתשובה אחת.",
  o:["רווק, לא בזוגיות כרגע","יצאתי לאחרונה מזוגיות ארוכה או מגירושין","בזוגיות, אבל יש דברים שהייתי רוצה לשנות בעצמי","עובר תקופת שינוי משמעותית (עבודה, מקום מגורים, סגנון חיים)","אחר"]},
 {id:"why",stage:"מה הביא אותך",note:"מה באמת. לא מה שנשמע טוב.",q:"מה הביא אותך לכאן עכשיו?",multi:true,hint:"אפשר לבחור יותר מתשובה אחת.",
  o:["אני מרגיש תקוע למרות שאני יודע שיש בי יותר","חסר לי ביטחון מול אנשים או בדייטינג","קשה לי ליזום, להוביל או לבטא עניין","אני רוצה שינוי רחב יותר בדרך שבה אני מחזיק את עצמי","בעיקר סקרנות"]},
 {id:"stuck",stage:"איפה זה נתקע",note:"התשובה הראשונה בדרך כלל מדויקת.",q:"איפה אתה מרגיש הכי תקוע?",multi:true,hint:"אפשר לבחור יותר מתשובה אחת.",
  o:["אני יודע מה לעשות, אבל לא מצליח לפעול","אני חושב יותר מדי ומאבד את הרגע","אני תלוי באישור מאחרים","אני חוזר שוב ושוב לאותם דפוסים","אני עדיין לא יודע להגדיר"]},
 {pause:true},
 {id:"change",stage:"מה ישתנה",note:"מה הכי חשוב לך.",q:"מה היית רוצה שייראה אחרת?",multi:true,hint:"אפשר לבחור יותר מתשובה אחת.",
  o:["הביטחון העצמי שלי במצבים חברתיים","איך אני מתנהל בזוגיות או בדייטינג","היכולת שלי לפעול, לא רק לחשוב","התחושה הכללית שיש לי כלפי עצמי","קשה לי לבחור אחת. זה קצת מהכול"]},
 {id:"seek",stage:"מה אתה מחפש",note:"כנות חוסכת לשנינו זמן.",q:"מה אתה מחפש כרגע?",multi:true,hint:"אפשר לבחור יותר מתשובה אחת.",
  o:["תהליך אישי שדורש ממני להשתתף ולעבוד","כלים פרקטיים ותרגול במציאות","מישהו שיגיד לי בדיוק מה לעשות בכל מצב","פתרון מהיר או כמה טיפים","עדיין לא בטוח"]},
 {id:"f2f",stage:"איך נפגשים",note:"כן, באמת פנים מול פנים.",q:"המפגשים ב״בדרך״ מתקיימים פנים מול פנים. איך זה מרגיש לך?",
  o:["זה אפילו חשוב לי","מתאים לי, אם ארגיש שיש התאמה","אני מעדיף תהליך אונליין בלבד"]},
 {id:"commit",stage:"לפני הסוף",note:"שאלה לא נוחה. חשובה.",q:"האם אתה מוכן להשקיע בתהליך משמעותי זמן, נוכחות ומשאבים?",
  o:["כן, אם אבין שזה מדויק לי","אולי, אני צריך לשמוע ולהבין יותר","כרגע אני מחפש משהו חינמי או נקודתי"]}
];
var questions=Q.filter(function(x){return !x.pause});
var TOTAL=questions.length;
var app=document.getElementById('app'), actIn=document.getElementById('actIn'), prog=document.getElementById('prog');
var step=-1; // -1 intro, 0..Q.length-1, Q.length = result
var A={};

function esc(s){return s.replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function qIndex(i){var n=0;for(var k=0;k<=i;k++){if(!Q[k].pause)n++}return n}
function setDark(on){document.body.classList.toggle('dark',!!on)}
function focusHead(){var h=app.querySelector('h1,h2');if(h){h.setAttribute('tabindex','-1');h.focus({preventScroll:true})}window.scrollTo(0,0)}

function renderIntro(){
  setDark(false);prog.hidden=true;
  app.innerHTML='<div class="in screen center intro fade">'+
    '<span class="label">בדיקת התאמה</span>'+
    '<h1>לפני שמדברים, בוא נבדוק אם זה בכלל <span class="strike">מתאים<span class="fix">מדויק</span></span>.</h1>'+
    '<p class="sub">כמה שאלות קצרות. <span class="mark">בלי ציונים ובלי התחייבות.</span></p>'+
    '<div class="meta"><span>7 שאלות</span><span>כ-2 דקות</span><span>התשובות מגיעות רק אליי</span></div>'+
  '</div>';
  actIn.innerHTML='<button class="btn solo" id="go">מתחילים <span class="arr">←</span></button>';
  document.getElementById('go').onclick=function(){go(0)};
  focusHead();
}

function renderPause(){
  setDark(true);prog.hidden=true;
  app.innerHTML='<div class="in screen center pause fade"><span class="label">רגע לנשום</span><h2>אין כאן תשובה נכונה.</h2><span class="hand">רק ניסיון להבין אם זה מדויק לך עכשיו.</span></div>';
  actIn.innerHTML='<button class="link" id="bk">חזרה</button><button class="btn light" id="nx">להמשיך <span class="arr">←</span></button>';
  document.getElementById('bk').onclick=function(){go(step-1)};
  document.getElementById('nx').onclick=function(){go(step+1)};
  focusHead();
}

function renderQ(){
  var q=Q[step]; setDark(false); prog.hidden=false;
  var n=qIndex(step);
  document.getElementById('progTxt').textContent='שאלה '+n+' מתוך '+TOTAL;
  document.getElementById('progStage').textContent=q.stage;
  document.getElementById('barFill').style.width=((n-1)/TOTAL*100)+'%';
  var multi=!!(q.max||q.multi), sel=A[q.id]||[];
  var html='<div class="in screen fade"><span class="hand qnote">'+esc(q.note)+'</span><h2 id="qh">'+esc(q.q)+'</h2>'+(q.hint?'<p class="qhint">'+esc(q.hint)+'</p>':'')+
    '<fieldset aria-labelledby="qh"><legend>'+esc(q.q)+'</legend>';
  q.o.forEach(function(t,i){
    var id='o_'+q.id+'_'+i, ch=sel.indexOf(i)>-1;
    html+='<label class="opt '+(multi?'check':'radio')+'" for="'+id+'"><input type="'+(multi?'checkbox':'radio')+'" name="'+q.id+'" id="'+id+'" value="'+i+'"'+(ch?' checked':'')+'><span class="box" aria-hidden="true"></span><span>'+esc(t)+'</span></label>';
  });
  html+='</fieldset></div>';
  app.innerHTML=html;
  var last=(step===Q.length-1);
  actIn.innerHTML='<button class="link" id="bk">חזרה</button><button class="btn" id="nx"'+(sel.length?'':' disabled')+'>'+(last?'לסיום':'המשך')+' <span class="arr">←</span></button>';
  var nx=document.getElementById('nx');
  var inputs=[].slice.call(app.querySelectorAll('input'));
  function sync(){
    var v=inputs.filter(function(x){return x.checked}).map(function(x){return +x.value});
    A[q.id]=v; nx.disabled=!v.length;
    if(q.max){inputs.forEach(function(x){var off=!x.checked&&v.length>=q.max;x.disabled=off;x.parentNode.classList.toggle('dis',off)})}
  }
  inputs.forEach(function(x){x.addEventListener('change',function(){sync(); if(!multi && !last){setTimeout(function(){},0)}})});
  sync();
  document.getElementById('bk').onclick=function(){go(step-1)};
  nx.onclick=function(){if(!nx.disabled)go(step+1)};
  focusHead();
}

function has(id,i){return (A[id]||[]).indexOf(i)>-1}
function verdict(){
  if(has('commit',2)||has('f2f',2)) return 'no';
  var unsure=0;
  if(has('commit',1)) unsure++;
  if(has('seek',2)||has('seek',3)) unsure++;
  if(has('seek',4)) unsure+=.5;
  if((A.why||[]).length===1 && has('why',4)) unsure++;
  if(has('stuck',4)) unsure+=.5;
  return unsure>=1?'maybe':'yes';
}
function summary(){
  return questions.map(function(q){var v=(A[q.id]||[]).map(function(i){return q.o[i]});return v.length?{q:q.q,a:v.join(' · ')}:null}).filter(Boolean);
}
// ---------- שליחה לגיליון ----------
var VERDICT_LABEL={yes:'מתאים',maybe:'אולי',no:'לא מתאים'};
var sent=false, CODE='';
function anonId(){
  var key='baderech_fit_anon_id';
  try{
    var id=localStorage.getItem(key);
    if(!id){id='f_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,8);localStorage.setItem(key,id)}
    return id;
  }catch(e){return 'f_'+Date.now().toString(36)}
}
// קוד קצר לכל מילוי. מזהה את השורה בגיליון, כדי שהלחיצות ייכנסו לשורה הנכונה.
// בלי אותיות וספרות שקל לבלבל ביניהן (O/0, I/1/L).
function newCode(){
  var abc='ABCDEFGHJKMNPQRSTUVWXYZ23456789', c='';
  for(var i=0;i<4;i++) c+=abc.charAt(Math.floor(Math.random()*abc.length));
  return c;
}
// מאיפה הגיע: קודם ?src= מהקישור, אחרת לפי האתר הקודם, אחרת direct.
// מילוי מדפדפן שסומן ב-?me=1 נרשם עם test- לפני המקור, כדי להפריד אותו מלידים אמיתיים.
function sourceOf(){
  var s=rawSource();
  return window.baderechMe ? 'test-'+s : s;
}
function rawSource(){
  var src=(new URLSearchParams(window.location.search)).get('src');
  if(src) return src;
  try{
    if(!document.referrer) return 'direct';
    var h=new URL(document.referrer).hostname.replace(/^www\./,'');
    if(h===window.location.hostname) return 'site';
    if(/instagram\.com$/.test(h)) return 'instagram';
    if(/facebook\.com$|fb\.com$/.test(h)) return 'facebook';
    if(/whatsapp\.com$|wa\.me$/.test(h)) return 'whatsapp';
    if(/(^|\.)google\./.test(h)) return 'google';
    if(/^t\.co$|twitter\.com$|x\.com$/.test(h)) return 'x';
    if(/linkedin\.com$|lnkd\.in$/.test(h)) return 'linkedin';
    return h;
  }catch(e){return 'direct'}
}
function answerText(id){
  var q=questions.filter(function(x){return x.id===id})[0];
  return (A[id]||[]).map(function(i){return q.o[i]}).join('; ');
}
function post(p){
  if(!SUBMIT_ENDPOINT) return;
  try{
    fetch(SUBMIT_ENDPOINT,{
      method:'POST',
      headers:{'Content-Type':'text/plain;charset=utf-8'}, // בלי preflight מול Apps Script
      body:JSON.stringify(p),
      keepalive:true // שהשליחה תסתיים גם אם יוצאים מהדף מיד
    }).catch(function(){});
  }catch(e){}
}
function submitFit(v){
  if(sent) return;
  sent=true;
  CODE=newCode();
  post({
    type:'result',
    code:CODE,
    id:anonId(),
    submitted_at:new Date().toISOString(),
    verdict:VERDICT_LABEL[v]||v,
    stage:answerText('stage'),
    why:answerText('why'),
    stuck:answerText('stuck'),
    change:answerText('change'),
    seek:answerText('seek'),
    f2f:answerText('f2f'),
    commit:answerText('commit'),
    source:sourceOf()
  });
}
// רושם בגיליון על מה לחצו במסך התוצאה (וואטסאפ, יומן, אינסטגרם).
function trackClick(action){
  if(CODE) post({type:'click', code:CODE, action:action});
}

function waLink(kind){
  // הקוד מחבר את ההודעה לשורה בגיליון.
  var c = CODE ? ' (קוד: '+CODE+')' : '';
  var msg = kind==='ask' ? 'היי ירון, מילאתי את שאלון ההתאמה'+c+' ויש לי שאלה:' : 'היי ירון, מילאתי את שאלון ההתאמה ואשמח לדבר.'+c;
  return 'https://wa.me/'+WA+'?text='+encodeURIComponent(msg);
}

function renderResult(){
  setDark(false); prog.hidden=false;
  document.getElementById('progTxt').textContent='סיימת';
  document.getElementById('progStage').textContent='התוצאה';
  document.getElementById('barFill').style.width='100%';
  var v=verdict(), s=summary(), html='<div class="in screen res fade"><span class="label">התוצאה</span>';
  submitFit(v);
  if(v==='no'){
    html+='<div class="verdict"><h2>כרגע זה כנראה לא הפורמט הנכון בשבילך. <span class="hand" style="font-size:.8em">וזה בסדר.</span></h2>'+
      '<p class="body">״בדרך״ הוא תהליך פנים מול פנים שדורש זמן והשקעה, ומהתשובות שלך זה לא נשמע כמו מה שאתה מחפש עכשיו. אבל אני לא רוצה שתצא מכאן בידיים ריקות.</p></div>'+
      '<div class="heard" style="background:var(--paper-2)"><span class="label">צידה לדרך, ממני אליך</span><p class="body" style="font-size:16px">שלושה דברים שכולם יודעים, אבל לא תמיד באמת עושים.</p>'+
      '<div class="tips">'+
        '<div class="tip"><span class="t">בפעם הבאה</span><p>תדבר קצת יותר לאט. ואל תסביר את אותו דבר פעמיים.</p></div>'+
        '<div class="tip"><span class="t">בפעם הבאה</span><p>תחזיק <span class="mark">קשר עין עוד רגע אחד</span> לפני שאתה מסתכל הצידה.</p></div>'+
        '<div class="tip"><span class="t">בפעם הבאה</span><p>תשאל שאלת המשך על מילה אחת שהצד השני אמר.</p></div>'+
      '</div></div>'+
      '<div class="ctas"><a class="btn ghost" data-track="instagram" href="'+CHANNEL+'" target="_blank" rel="noopener">לאינסטגרם, שם אני כותב <span class="arr">←</span></a>'+
      '<a class="btn ghost" data-track="whatsapp" href="'+waLink('ask')+'" target="_blank" rel="noopener">בכל זאת, אני רוצה לשאול משהו <span class="arr">←</span></a></div>';
  } else {
    var head = v==='yes' ? '<h2>נראה שיש <span class="mark">בסיס טוב</span> לשיחה.</h2>' : '<h2>יכול להיות שיש כאן התאמה. <span class="hand" style="font-size:.78em">כדאי לדבר.</span></h2>';
    var body = v==='yes' ? 'מהתשובות שלך עולה שאתה לא מחפש רק טיפ נקודתי, אלא שינוי שדורש עבודה אמיתית.' : 'יש כמה דברים שכדאי להבין יחד לפני שמחליטים, וזה בדיוק בשביל זה שיחת ההיכרות קיימת.';
    html+='<div class="verdict">'+head+'<p class="body">'+body+'</p></div>'+
      '<div class="heard"><span class="label">מה שמעתי ממך</span><ul>'+s.map(function(x){return '<li>'+esc(x.a)+'</li>'}).join('')+'</ul></div>'+
      '<div class="ctas"><a class="btn" data-track="whatsapp" href="'+waLink('send')+'" target="_blank" rel="noopener">לשלוח לירון בוואטסאפ <span class="arr">←</span></a>'+
      '<a class="btn ghost" data-track="calendar" href="'+CAL+'" target="_blank" rel="noopener">או לקבוע שיחת התאמה ישירות <span class="arr">←</span></a>'+
      '<p class="small">נפתחת הודעה קצרה בוואטסאפ. אפשר לשנות אותה לפני ששולחים.</p></div>';
  }
  html+='<button class="reset" id="reset">למחוק את התשובות ולהתחיל מחדש</button></div>';
  app.innerHTML=html;
  actIn.innerHTML='';document.getElementById('actions').hidden=true;
  document.getElementById('reset').onclick=function(){A={};sent=false;CODE='';go(-1)};
  [].forEach.call(app.querySelectorAll('[data-track]'),function(a){a.addEventListener('click',function(){trackClick(a.getAttribute('data-track'))})});
  focusHead();
}

function go(i){
  document.getElementById('actions').hidden=false;
  step=Math.max(-1,Math.min(i,Q.length));
  if(step===-1) renderIntro();
  else if(step===Q.length) renderResult();
  else if(Q[step].pause) renderPause();
  else renderQ();
}
document.addEventListener('keydown',function(e){
  if(e.key==='Enter'&&e.target.tagName==='INPUT'){var nx=document.getElementById('nx');if(nx&&!nx.disabled){e.preventDefault();nx.click()}}
});
go(-1);
})();
