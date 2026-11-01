/* בדרך · תנועה בדף הבית
   הכול מתחיל רק אם המשתמש לא ביקש פחות תנועה, ואם הדפדפן תומך ב-IntersectionObserver.
   בלי JS הדף שלם וגלוי: כל מצב ״לפני״ מוגדר רק תחת html.js-motion. */
(function(){
  var root=document.documentElement;
  var header=document.querySelector('header.site');

  /* הכותרת העליונה מתחבאת בגלילה למטה וחוזרת בגלילה למעלה */
  var lastY=window.scrollY, ticking=false;
  function onScroll(){
    var y=window.scrollY;
    if(header){
      if(y>420 && y>lastY+6) header.classList.add('away');
      else if(y<lastY-6 || y<420) header.classList.remove('away');
    }
    lastY=y; ticking=false;
  }
  window.addEventListener('scroll',function(){if(!ticking){ticking=true;requestAnimationFrame(onScroll)}},{passive:true});
  /* מעבר במקלדת לתוך הכותרת מחזיר אותה */
  if(header) header.addEventListener('focusin',function(){header.classList.remove('away')});

  var reduce=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(reduce||!('IntersectionObserver' in window)) return;

  /* מצב התחלה בלי מעברים, ואז מדליקים את המעברים */
  root.classList.add('js-motion','no-tr');
  void document.body.offsetHeight;
  root.classList.remove('no-tr');

  /* הכותרת הראשית: הקו נכתב על ״הדמות״, ואז ״עצמך״. התמונה נחשפת מימין */
  var heroStrike=document.querySelector('.hero .strike'), portrait=document.querySelector('.portrait');
  requestAnimationFrame(function(){requestAnimationFrame(function(){
    if(heroStrike) heroStrike.classList.add('seen');
    if(portrait) portrait.classList.add('seen');
  })});

  /* מרקר נמרח וסקשנים נכנסים, פעם אחת */
  var io=new IntersectionObserver(function(entries){
    entries.forEach(function(e){
      if(!e.isIntersecting) return;
      e.target.classList.add('seen');
      io.unobserve(e.target);
    });
  },{threshold:.3,rootMargin:'0px 0px -8% 0px'});
  document.querySelectorAll('.mark,.rv').forEach(function(el){io.observe(el)});

  /* ציר השלבים: הקו מתמלא והשלבים נדלקים אחד אחרי השני */
  var track=document.getElementById('track');
  if(track){
    var steps=[].slice.call(track.querySelectorAll('li'));
    var tio=new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        if(!e.isIntersecting) return;
        track.classList.add('seen');
        steps.forEach(function(li,i){setTimeout(function(){li.classList.add('lit')},180+i*200)});
        tio.disconnect();
      });
    },{threshold:.25});
    tio.observe(track);
  }
})();
