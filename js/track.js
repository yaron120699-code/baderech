/* בדרך · מדידה קלה (גרסה 6, 18.11.2026)
   אירוע = שם קצר, למשל cta_fit_hero או fit_start. בלי עוגיות, בלי שם ובלי טלפון.
   נשלח לשני מקומות:
   1. Vercel Web Analytics (va 'event'). אם התוכנית לא כוללת אירועים מותאמים, Vercel פשוט מתעלם.
   2. הגיליון ״בדרך - fit״, ללשונית ״אירועים״, דרך אותו Apps Script.
      כבוי עד שירון מעדכן את הסקריפט (fit/apps-script.gs) ופורס גרסה חדשה. אז משנים ל-true.
   בדפדפן במצב בדיקה (?me=1) לא נשלח כלום. */
(function(){
  var SHEET_EVENTS_ON=false;
  var ENDPOINT='https://script.google.com/macros/s/AKfycbxHb8v9OwSYn3RxBpwQewbEqruxgm-vFaaMdyYKgFZbwooa9_wr0cUqVIp-T1QLth_7/exec';
  var sent={};
  function src(){try{return new URLSearchParams(location.search).get('src')||''}catch(e){return ''}}
  function anon(){try{return localStorage.getItem('baderech_fit_anon_id')||''}catch(e){return ''}}
  window.bdTrack=function(name,extra,once){
    if(!name||window.baderechMe) return;
    if(once){if(sent[name])return;sent[name]=1}
    try{if(window.va) window.va('event',{name:name})}catch(e){}
    if(!SHEET_EVENTS_ON) return;
    try{
      var p={type:'event',event:name,page:location.pathname,source:src(),id:anon(),at:new Date().toISOString()};
      if(extra) for(var k in extra) p[k]=extra[k];
      fetch(ENDPOINT,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify(p),keepalive:true}).catch(function(){});
    }catch(e){}
  };
  /* לחיצות על כפתורים מסומנים (data-ev) */
  document.addEventListener('click',function(e){
    var a=e.target.closest&&e.target.closest('[data-ev]');
    if(a) window.bdTrack(a.getAttribute('data-ev'));
  });
  /* הגעה לחלקים מרכזיים (data-view), פעם אחת בביקור */
  if('IntersectionObserver' in window){
    var io=new IntersectionObserver(function(es){es.forEach(function(en){
      if(!en.isIntersecting) return; io.unobserve(en.target);
      window.bdTrack(en.target.getAttribute('data-view'),null,true);
    })},{threshold:.25});
    document.querySelectorAll('[data-view]').forEach(function(s){io.observe(s)});
  }
})();
