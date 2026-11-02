/* בדרך · תנועה בדף הבית
   הכול מתחיל רק אם המשתמש לא ביקש פחות תנועה, ואם הדפדפן תומך ב-IntersectionObserver.
   בלי JS הדף שלם וגלוי: כל מצב ״לפני״ מוגדר רק תחת html.js-motion. */
(function(){
  var root=document.documentElement;
  var header=document.querySelector('header.site');

  /* הכותרת העליונה מתחבאת בגלילה למטה וחוזרת בגלילה למעלה */
  var lastY=window.scrollY, ticking=false, quietUntil=0, dir=0, travel=0;
  function quiet(){quietUntil=Date.now()+900}
  function onScroll(){
    var y=window.scrollY;
    if(header){
      var d=y-lastY, nd=d>0?1:-1;
      if(nd!==dir){dir=nd;travel=0}
      travel+=Math.abs(d);
      if(y<420) header.classList.remove('away');
      else if(Date.now()>quietUntil && travel>40) header.classList.toggle('away',dir>0);
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
    var hero=document.querySelector('.hero');
    if(hero) hero.classList.add('seen');
    if(heroStrike) heroStrike.classList.add('seen');
    if(portrait) portrait.classList.add('seen');
    var hm=document.querySelector('.hero .mark');
    if(hm) hm.classList.add('seen');
  })});

  /* מרקר נמרח וסקשנים נכנסים, פעם אחת */
  var io=new IntersectionObserver(function(entries){
    entries.forEach(function(e){
      if(!e.isIntersecting) return;
      e.target.classList.add('seen');
      io.unobserve(e.target);
    });
  },{threshold:.3,rootMargin:'0px 0px -8% 0px'});
  document.querySelectorAll('.mark,.rv').forEach(function(el){if(!el.closest('.hero')) io.observe(el)});

  /* שאלות נפוצות: הגובה נפתח ונסגר בהחלקה, ואז המילים מופיעות. כל שאלה מנוהלת לבד,
     ואם לוחצים באמצע תנועה, התנועה הקודמת מתבטלת ולא נערמת. */
  document.querySelectorAll('.faq details').forEach(function(d){
    var sum=d.querySelector('summary'), a=d.querySelector('.a'), words=null, anim=null, timers=[];
    function split(){
      words=[];
      d.querySelectorAll('.a p').forEach(function(p){
        var parts=p.textContent.split(/(\s+)/); p.textContent='';
        parts.forEach(function(t){
          if(!t||/^\s+$/.test(t)){p.appendChild(document.createTextNode(t));return}
          var s=document.createElement('span'); s.className='w'; s.textContent=t; p.appendChild(s); words.push(s);
        });
      });
    }
    function clear(){timers.forEach(clearTimeout);timers=[];if(anim){anim.cancel();anim=null}}
    sum.addEventListener('click',function(e){
      e.preventDefault(); clear(); quiet();
      if(!d.open || d.classList.contains('closing')){
        d.classList.remove('closing'); d.classList.add('opening'); d.open=true;
        if(!words) split();
        words.forEach(function(w){w.classList.remove('go')});
        var h=a.scrollHeight;
        anim=a.animate([{height:'0px'},{height:h+'px'}],{duration:650,easing:'cubic-bezier(.16,1,.3,1)'});
        anim.onfinish=function(){anim=null;d.classList.remove('opening')};
        var step=Math.min(45,1100/Math.max(words.length,1));
        words.forEach(function(w,k){timers.push(setTimeout(function(){w.classList.add('go')},120+k*step))});
      } else {
        d.classList.add('closing');
        anim=a.animate([{height:a.offsetHeight+'px'},{height:'0px'}],{duration:450,easing:'cubic-bezier(.65,0,.35,1)'});
        anim.onfinish=function(){anim=null;d.open=false;d.classList.remove('closing')};
      }
    });
  });

  /* אז / היום: מחכים ששתי התמונות ייטענו, ואז חושפים */
  var dip=document.getElementById('diptych');
  if(dip){
    var imgs=[].slice.call(dip.querySelectorAll('img'));
    imgs.forEach(function(im){im.loading='eager'});
    var ready=Promise.all(imgs.map(function(im){return im.decode?im.decode().catch(function(){}):Promise.resolve()}));
    var dio=new IntersectionObserver(function(es){
      es.forEach(function(e){
        if(!e.isIntersecting) return;
        dio.disconnect();
        var go=function(){dip.classList.add('seen')};
        ready.then(go); setTimeout(go,2500);
      });
    },{threshold:.3});
    dio.observe(dip);
  }

  /* ציר השלבים: הקו מתמלא והשלבים נדלקים אחד אחרי השני */
  var track=document.getElementById('track');
  if(track){
    var steps=[].slice.call(track.querySelectorAll('li'));
    var tio=new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        if(!e.isIntersecting) return;
        track.classList.add('seen');
        steps.forEach(function(li,i){setTimeout(function(){li.classList.add('lit')},250+i*480)});
        tio.disconnect();
      });
    },{threshold:.35});
    tio.observe(track);
  }
})();
