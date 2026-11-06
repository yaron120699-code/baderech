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

  /* אז / היום: השוואה בגרירה (גרסה 4). עובדת גם למי שביקש פחות תנועה, רק בלי ההדגמה.
     ״היום״ למטה, ״אז״ מעליה וחתוכה מימין. --pos = מיקום הקו מהשמאל, באחוזים, ושווה לחלק של ״היום״.
     שליטה: גרירה בעכבר או באצבע (גלילה אנכית ממשיכה לעבוד), נגיעה/לחיצה קופצת לנקודה,
     ומקלדת דרך input מסוג range מוסתר, עם תווית נגישה. */
  var dip=document.getElementById('diptych'), cmp=null, setPos=null;
  if(dip){
    var thenF=dip.querySelector('figure.then'), nowF=dip.querySelector('figure.now');
    if(thenF&&nowF){
      cmp=document.createElement('div'); cmp.className='compare';
      dip.insertBefore(cmp,thenF);
      cmp.appendChild(thenF); cmp.appendChild(nowF); /* סדר הקריאה נשאר: אז, ואז היום. השכבות לפי z-index */
      var range=document.createElement('input');
      range.type='range'; range.min='0'; range.max='100'; range.step='1'; range.value='50';
      range.setAttribute('dir','ltr'); range.className='cmp-range';
      range.setAttribute('aria-label','השוואה בין התמונות: אז והיום');
      var handle=document.createElement('span'); handle.className='cmp-handle'; handle.setAttribute('aria-hidden','true');
      handle.innerHTML='<span class="cmp-knob"><svg viewBox="0 0 22 12" focusable="false"><path d="M6 1 1 6l5 5M16 1l5 5-5 5"/></svg></span>';
      cmp.appendChild(range); cmp.appendChild(handle);
      dip.classList.add('is-compare');
      setPos=function(v,byUser){
        v=Math.max(0,Math.min(100,v));
        cmp.style.setProperty('--pos',v+'%');
        range.value=String(Math.round(v));
        range.setAttribute('aria-valuetext','אז '+Math.round(100-v)+' אחוז, היום '+Math.round(v)+' אחוז');
        if(byUser) cmp.dataset.touched='1';
      };
      setPos(50);
      range.addEventListener('input',function(){setPos(+range.value,true)});
      var drag=null;
      var fromX=function(x){var r=cmp.getBoundingClientRect();return (x-r.left)/r.width*100};
      cmp.addEventListener('pointerdown',function(e){
        if(e.button>0) return;
        drag={id:e.pointerId,x:e.clientX,moved:false,touch:e.pointerType!=='mouse'};
        cmp.classList.add('dragging');
        try{cmp.setPointerCapture(e.pointerId)}catch(_){}
        if(!drag.touch){e.preventDefault();setPos(fromX(e.clientX),true)}
      });
      cmp.addEventListener('pointermove',function(e){
        if(!drag||e.pointerId!==drag.id) return;
        if(Math.abs(e.clientX-drag.x)>3) drag.moved=true;
        if(drag.moved||!drag.touch) setPos(fromX(e.clientX),true);
      });
      var endDrag=function(e,cancel){
        if(!drag) return;
        if(!cancel&&drag.touch&&!drag.moved) setPos(fromX(e.clientX),true); /* נגיעה בלי גרירה קופצת לנקודה */
        drag=null; cmp.classList.remove('dragging');
      };
      cmp.addEventListener('pointerup',function(e){endDrag(e,false)});
      cmp.addEventListener('pointercancel',function(e){endDrag(e,true)}); /* גלילה אנכית: לא משנים כלום */
    }
  }

  /* הניווט העליון מסמן את החלק שבאמצע המסך (מחשב בלבד, בטלפון הניווט מוסתר) */
  var navLinks=[].slice.call(document.querySelectorAll('nav.main a[href^="#"]'));
  if(navLinks.length&&'IntersectionObserver' in window){
    var navVis={};
    var nio=new IntersectionObserver(function(es){
      es.forEach(function(e){navVis[e.target.id]=e.isIntersecting});
      navLinks.forEach(function(a){
        var on=!!navVis[a.getAttribute('href').slice(1)];
        a.classList.toggle('cur',on);
        if(on) a.setAttribute('aria-current','location'); else a.removeAttribute('aria-current');
      });
    },{rootMargin:'-45% 0px -54% 0px'});
    navLinks.forEach(function(a){var s=document.querySelector(a.getAttribute('href'));if(s) nio.observe(s)});
  }

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
        var shown=false;
        var go=function(){
          if(shown) return; shown=true;
          dip.classList.add('seen');
          /* הדגמה אחת קטנה שאפשר לגרור: הקו זז מעט לכיוון ״היום״ וחוזר. רק אם עוד לא נגעו */
          if(cmp&&setPos) setTimeout(function(){
            if(cmp.dataset.touched) return;
            var t0=null, D=1500;
            (function f(t){
              if(cmp.dataset.touched) return;
              if(t0===null) t0=t;
              var k=Math.min(1,(t-t0)/D), s=Math.sin(k*Math.PI);
              setPos(50+14*s*s);
              if(k<1) requestAnimationFrame(f);
            })(performance.now());
          },2300);
        };
        ready.then(go); setTimeout(go,2500);
      });
    },{threshold:.3});
    dio.observe(dip);
  }

  /* ציר השלבים: הקו נכתב על שביל מקווקו, וכל שלב נדלק ומודגש לרגע כשהקו מגיע אליו.
     במחשב (שורה אחת): רצף בזמן, 250 + 480 × מספר השלב, כמו ב-CSS.
     בטלפון (עמודה): הקו עוקב אחרי הגלילה, ושלב נדלק כשהוא עובר את 62% מגובה המסך.
     הקו לא חוזר אחורה, אבל ההדגשה (.now) עוברת לשלב שמולך גם כשגוללים למעלה. */
  var track=document.getElementById('track');
  if(track){
    var steps=[].slice.call(track.querySelectorAll('li'));
    var mq=window.matchMedia('(max-width:960px)');
    var tTimers=[], scrubOn=false, maxFill=0, pend=false;
    var setNow=function(k){steps.forEach(function(li,i){li.classList.toggle('now',i===k)})};
    var finishTrack=function(){
      tTimers.forEach(clearTimeout); scrubOn=false;
      track.classList.remove('scrub'); track.style.removeProperty('--fill');
      track.classList.add('seen'); steps.forEach(function(li){li.classList.add('lit')}); setNow(-1);
    };
    var scrub=function(){
      pend=false; if(!scrubOn) return;
      var r=track.getBoundingClientRect(), line=window.innerHeight*.62;
      var p=Math.max(0,Math.min(r.height,line-r.top)), cur=-1;
      if(p>maxFill){maxFill=p;track.style.setProperty('--fill',maxFill+'px')}
      steps.forEach(function(li,i){if(li.offsetTop+10<=p){li.classList.add('lit');cur=i}});
      if(maxFill>=r.height-2) track.classList.add('seen');
      setNow(p>=r.height-2?-1:cur);
    };
    if(mq.matches){
      scrubOn=true; track.classList.add('scrub');
      window.addEventListener('scroll',function(){if(!pend){pend=true;requestAnimationFrame(scrub)}},{passive:true});
      window.addEventListener('resize',function(){if(!pend){pend=true;requestAnimationFrame(scrub)}});
      scrub();
    } else {
      var tio=new IntersectionObserver(function(entries){
        entries.forEach(function(e){
          if(!e.isIntersecting) return;
          track.classList.add('seen');
          steps.forEach(function(li,i){tTimers.push(setTimeout(function(){li.classList.add('lit');setNow(i)},250+i*480))});
          tTimers.push(setTimeout(function(){setNow(-1)},250+steps.length*480+600));
          tio.disconnect();
        });
      },{threshold:.35});
      tio.observe(track);
    }
    /* אם הפריסה מתחלפת באמצע (סיבוב טלפון, שינוי חלון), פשוט מציגים הכול */
    var onMq=function(){finishTrack()};
    if(mq.addEventListener) mq.addEventListener('change',onMq); else if(mq.addListener) mq.addListener(onMq);
  }

    /* ״אם אתה כאן״: השורה שאתה קורא נדלקת (6.11.2026).
     בטלפון: לפי גלילה. שורה נדלקת כשהאמצע שלה עובר 60% מגובה המסך, ונשארת כהה (קראת אותה).
     השורה האחרונה שנדלקה היא ״עכשיו״: המספר בירוק. כשכל הרשימה מאחוריך, אין ״עכשיו״.
     במחשב: הרשימה ליד הכותרת וכולה במסך, אז השורות נדלקות אחת אחרי השנייה בזמן. */
  var lines=document.querySelector('.problem .lines');
  if(lines){
    var rows=[].slice.call(lines.querySelectorAll('li'));
    var lmq=window.matchMedia('(max-width:960px)'), lScrub=false, lPend=false, lTimers=[];
    lines.classList.add('read');
    var lNow=function(k){rows.forEach(function(li,i){li.classList.toggle('now',i===k)})};
    var lAll=function(){lTimers.forEach(clearTimeout);lScrub=false;rows.forEach(function(li){li.classList.add('lit')});lNow(-1)};
    var lRead=function(){
      lPend=false; if(!lScrub) return;
      var line=window.innerHeight*.6, cur=-1;
      rows.forEach(function(li,i){var r=li.getBoundingClientRect();if(r.top+r.height/2<=line){li.classList.add('lit');cur=i}});
      var last=rows[rows.length-1].getBoundingClientRect();
      lNow(last.bottom<window.innerHeight*.3?-1:cur);
    };
    if(lmq.matches){
      lScrub=true;
      window.addEventListener('scroll',function(){if(!lPend){lPend=true;requestAnimationFrame(lRead)}},{passive:true});
      lRead();
    } else {
      var lio=new IntersectionObserver(function(es){es.forEach(function(e){
        if(!e.isIntersecting) return; lio.disconnect();
        rows.forEach(function(li,i){lTimers.push(setTimeout(function(){li.classList.add('lit');lNow(i)},500+i*650))});
        lTimers.push(setTimeout(function(){lNow(-1)},500+rows.length*650+900));
      })},{threshold:.5});
      lio.observe(lines);
    }
    var lMq=function(){lAll()};
    if(lmq.addEventListener) lmq.addEventListener('change',lMq); else if(lmq.addListener) lmq.addListener(lMq);
  }

  /* האיורים בעקרונות: התנועה רצה רק כשהם על המסך. .drawn נשאר אחרי הפעם הראשונה (קו שנכתב פעם אחת) */
  var wio=new IntersectionObserver(function(es){es.forEach(function(e){
    e.target.classList.toggle('play',e.isIntersecting);
    if(e.isIntersecting) e.target.classList.add('drawn');
  })},{threshold:.4});
  document.querySelectorAll('.walk').forEach(function(w){wio.observe(w)});
})();
