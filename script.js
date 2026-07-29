// Personalized WhatsApp bridge from the fit quiz.
// If the visitor just came from /fit with a result of "high match" or
// "turning point", a one-time composed summary is waiting in sessionStorage
// (see WA_BRIDGE_KEY in fit/fit.js). We apply it to every WhatsApp link on
// this page and then remove it immediately, so it is used exactly once and
// a later, unrelated visit falls back to the page's normal default message.
(function(){
  try{
    var KEY = 'baderech_wa_prefill';
    var prefill = sessionStorage.getItem(KEY);
    if(!prefill) return;
    document.querySelectorAll('a[href^="https://wa.me/972505494326"]').forEach(function(a){
      a.setAttribute('href', 'https://wa.me/972505494326?text=' + encodeURIComponent(prefill));
    });
    sessionStorage.removeItem(KEY);
  }catch(e){}
})();

const revealEls = document.querySelectorAll('.reveal, .reveal-pop');
  const io = new IntersectionObserver((entries)=>{
    entries.forEach(e=>{
      if(e.isIntersecting){ e.target.classList.add('is-visible'); io.unobserve(e.target); }
    });
  }, { threshold:0.15 });
  revealEls.forEach(el=>io.observe(el));

  // Safety net: if anything ever prevents the observer from firing
  // (slow scroll, odd viewport, etc.), reveal everything after a short delay anyway.
  setTimeout(()=>{
    document.querySelectorAll('.reveal:not(.is-visible), .reveal-pop:not(.is-visible)').forEach(el=>el.classList.add('is-visible'));
  }, 2500);

  const toggle = document.querySelector('.nav__toggle');
  const links = document.querySelector('.nav__links');
  if(toggle && links){
    toggle.setAttribute('aria-expanded', 'false');
    function closeMenu(){
      links.classList.remove('is-open');
      toggle.textContent = '☰';
      toggle.setAttribute('aria-expanded', 'false');
    }
    function openMenu(){
      links.classList.add('is-open');
      toggle.textContent = '✕';
      toggle.setAttribute('aria-expanded', 'true');
    }
    toggle.addEventListener('click', (e)=>{
      e.stopPropagation();
      links.classList.contains('is-open') ? closeMenu() : openMenu();
    });
    links.querySelectorAll('a').forEach(a=>{
      a.addEventListener('click', closeMenu);
    });
    document.addEventListener('click', (e)=>{
      if(links.classList.contains('is-open') && !links.contains(e.target) && e.target !== toggle){
        closeMenu();
      }
    });
  }

  // Reflect widget: a private step-through reflection, not a submitted form.
  // Nothing here is sent or stored anywhere — it only moves the visitor
  // from one quiet question to the next, ending in an invitation to talk.
  const reflectCard = document.querySelector('.reflect__card');
  if(reflectCard){
    const steps = Array.from(reflectCard.querySelectorAll('.reflect__step'));
    const dots = Array.from(reflectCard.querySelectorAll('.reflect__dot'));
    const skip = document.getElementById('reflectSkip');
    let current = 0;

    function showStep(index){
      steps.forEach(s=>s.classList.remove('is-active'));
      steps[index].classList.add('is-active');
      dots.forEach((d,i)=> d.classList.toggle('is-done', i < index));
    }

    reflectCard.querySelectorAll('.reflect__option').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        current = Math.min(current + 1, steps.length - 1);
        showStep(current);
      });
    });

    if(skip){
      skip.addEventListener('click', ()=>{
        current = steps.length - 1;
        showStep(current);
        steps[current].scrollIntoView({ behavior:'smooth', block:'center' });
      });
    }
  }
