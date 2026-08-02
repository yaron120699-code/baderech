(function(){
  "use strict";

  /* ============================================================
     חשוב: כתובת ה-endpoint שאליו נשלחות התשובות.
     ברירת מחדל היא ריקה בכוונה — ראה SETUP-RESEARCH.md להוראות
     איך לחבר Google Apps Script (Web App) שכותב לגיליון Google
     Sheets, בחינם ובלי שרת. עד שתחובר כתובת אמיתית, התשובות
     יישמרו רק מקומית (localStorage) כגיבוי, ולא יאבדו — אבל גם
     לא יגיעו אליך.
     ============================================================ */
  var SUBMIT_ENDPOINT = 'https://script.google.com/macros/s/AKfycbxUD-hCW7uz_E2x5xx_E9TetLvUUJUKOz9MjZCM_uilDU96KihyvS0_tC3ZkT_KF25Y7Q/exec';
  var STORAGE_KEY = 'baderech_research_v1';
  var QUEUE_KEY = 'baderech_research_queue'; // גיבוי מקומי לתשובות שלא נשלחו בהצלחה

  var QUESTION_STEPS = ['q1','q2','q3','q4','q5'];

  var steps = Array.prototype.slice.call(document.querySelectorAll('.fit__step'));
  var stepNames = steps.map(function(s){ return s.dataset.step; });
  var current = 0;

  var progressWrap = document.querySelector('.fit__progress');
  var progressFill = document.querySelector('.fit__progress-fill');
  var progressLabel = document.querySelector('.fit__progress-label');

  // ---------- storage ----------
  function loadAnswers(){
    try{
      var raw = sessionStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    }catch(e){ return {}; }
  }
  function saveAnswers(){
    try{ sessionStorage.setItem(STORAGE_KEY, JSON.stringify(answers)); }catch(e){}
  }
  function clearAnswers(){
    try{ sessionStorage.removeItem(STORAGE_KEY); }catch(e){}
  }

  var answers = loadAnswers();

  // ---------- navigation ----------
  var stepEnteredAt = 0;
  function showStep(index){
    steps.forEach(function(s){ s.classList.remove('is-active'); });
    steps[index].classList.add('is-active');
    current = index;
    stepEnteredAt = Date.now();
    updateProgress();
    var heading = steps[index].querySelector('h1, h2');
    if(heading){ heading.focus({ preventScroll: true }); }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function progressCaption(qIndex, total){
    var pct = (qIndex + 1) / total;
    if(qIndex === 0) return 'מתחילים';
    if(pct <= 0.5) return 'בתנועה';
    if(qIndex < total - 1) return 'כמעט שם';
    return 'שאלה אחרונה';
  }

  function updateProgress(){
    var name = stepNames[current];
    var qIndex = QUESTION_STEPS.indexOf(name);
    if(qIndex === -1){
      progressWrap.style.display = 'none';
    } else {
      progressWrap.style.display = '';
      var pct = ((qIndex + 1) / QUESTION_STEPS.length) * 100;
      progressFill.style.width = pct + '%';
      progressLabel.textContent = progressCaption(qIndex, QUESTION_STEPS.length);
    }
  }

  // ---------- option styling (checkbox / radio groups) ----------
  function refreshOptionStyles(name){
    document.querySelectorAll('input[name="' + name + '"]').forEach(function(inp){
      var card = inp.closest('.fit__option');
      if(card){ card.classList.toggle('is-selected', inp.checked); }
    });
  }

  document.querySelectorAll('.fit__options').forEach(function(group){
    var firstInput = group.querySelector('input');
    if(!firstInput) return;
    var name = firstInput.name;
    var max = parseInt(group.dataset.max || '1', 10);

    group.addEventListener('change', function(e){
      if(e.target.type === 'checkbox'){
        var checked = Array.prototype.slice.call(group.querySelectorAll('input:checked'));
        if(checked.length > max){ e.target.checked = false; }
      }
      refreshOptionStyles(name);
      persistCurrentStep();
      validateCurrentStep();
    });
  });

  // ---------- rating scale (Q2) ----------
  document.querySelectorAll('.research__scale').forEach(function(scale){
    var name = scale.dataset.name;
    var buttons = Array.prototype.slice.call(scale.querySelectorAll('.research__scale-btn'));
    buttons.forEach(function(btn){
      btn.addEventListener('click', function(){
        buttons.forEach(function(b){ b.classList.remove('is-selected'); b.setAttribute('aria-pressed','false'); });
        btn.classList.add('is-selected');
        btn.setAttribute('aria-pressed','true');
        answers[name] = btn.dataset.value;
        saveAnswers();
        validateCurrentStep();
      });
    });
  });

  // ---------- open text (Q3) ----------
  document.querySelectorAll('textarea').forEach(function(ta){
    ta.addEventListener('input', function(){
      persistCurrentStep();
      validateCurrentStep();
      var counter = ta.parentElement.querySelector('.research__counter, .fit__counter');
      if(counter && ta.maxLength > 0){
        counter.textContent = ta.value.length + ' / ' + ta.maxLength;
      }
    });
  });

  // ---------- persistence per step ----------
  function persistCurrentStep(){
    var step = steps[current];
    var name = step.dataset.step;
    if(QUESTION_STEPS.indexOf(name) === -1) return;

    var checkboxes = step.querySelectorAll('input[type="checkbox"]');
    var radios = step.querySelectorAll('input[type="radio"]');
    var textarea = step.querySelector('textarea');

    if(checkboxes.length){
      answers[name] = Array.prototype.slice.call(step.querySelectorAll('input:checked')).map(function(i){ return i.value; });
    } else if(radios.length){
      var checked = step.querySelector('input:checked');
      answers[name] = checked ? checked.value : undefined;
    } else if(textarea){
      answers[name] = textarea.value;
    }
    // Q2 (rating scale) is persisted directly by its own click handler above.
    saveAnswers();
  }

  function validateStep(step){
    var name = step.dataset.step;
    if(QUESTION_STEPS.indexOf(name) === -1) return true;
    var required = step.dataset.required !== 'false';
    if(!required) return true;
    var val = answers[name];
    if(Array.isArray(val)) return val.length > 0;
    if(typeof val === 'string') return val.trim().length > 0;
    return !!val;
  }

  function validateCurrentStep(){
    var step = steps[current];
    var btn = step.querySelector('.fit__btn-continue');
    if(!btn) return;
    var valid = validateStep(step);
    btn.disabled = !valid;
    btn.setAttribute('aria-disabled', String(!valid));
  }

  // ---------- restore previously entered answers (survive refresh) ----------
  function restoreInputs(){
    Object.keys(answers).forEach(function(name){
      var val = answers[name];
      if(Array.isArray(val)){
        val.forEach(function(v){
          var el = document.querySelector('input[name="' + name + '"][value="' + v + '"]');
          if(el) el.checked = true;
        });
      } else if(val !== undefined && val !== null){
        var textarea = document.querySelector('textarea[name="' + name + '"]');
        var scaleBtn = document.querySelector('.research__scale[data-name="' + name + '"] .research__scale-btn[data-value="' + val + '"]');
        if(textarea){
          textarea.value = val;
          var counter = textarea.parentElement.querySelector('.research__counter, .fit__counter');
          if(counter && textarea.maxLength > 0){ counter.textContent = textarea.value.length + ' / ' + textarea.maxLength; }
        } else if(scaleBtn){
          scaleBtn.classList.add('is-selected');
          scaleBtn.setAttribute('aria-pressed', 'true');
        } else {
          var radio = document.querySelector('input[name="' + name + '"][value="' + val + '"]');
          if(radio) radio.checked = true;
        }
      }
      refreshOptionStyles(name);
    });
  }

  function firstUnansweredQuestionIndex(){
    var hasAnyAnswer = Object.keys(answers).length > 0;
    if(!hasAnyAnswer) return stepNames.indexOf('q1');
    for(var i = 0; i < QUESTION_STEPS.length; i++){
      var step = steps[stepNames.indexOf(QUESTION_STEPS[i])];
      if(!validateStep(step)) return stepNames.indexOf(QUESTION_STEPS[i]);
    }
    return stepNames.indexOf(QUESTION_STEPS[QUESTION_STEPS.length - 1]);
  }

  // ---------- nav buttons ----------
  document.querySelectorAll('.fit__btn-continue[data-action="start"]').forEach(function(btn){
    btn.addEventListener('click', function(){
      showStep(firstUnansweredQuestionIndex());
      validateCurrentStep();
    });
  });

  steps.forEach(function(step){
    var continueBtn = step.querySelector('.fit__btn-continue');
    if(continueBtn && continueBtn.dataset.action !== 'start' && continueBtn.id !== 'submitResearch'){
      continueBtn.addEventListener('click', function(){
        if(continueBtn.disabled) return;
        if(continueBtn.dataset.action === 'finish'){
          persistCurrentStep();
          showStep(stepNames.indexOf('closing'));
        } else {
          showStep(current + 1);
          validateCurrentStep();
        }
      });
    }
    var backBtn = step.querySelector('.fit__btn-back');
    if(backBtn){
      backBtn.addEventListener('click', function(){
        showStep(Math.max(0, current - 1));
        validateCurrentStep();
      });
    }
  });

  // ---------- passthrough (reflection) screen ----------
  document.querySelectorAll('.fit__step[data-passthrough="true"]').forEach(function(step){
    function advance(){
      if(!step.classList.contains('is-active')) return;
      if(Date.now() - stepEnteredAt < 350) return;
      showStep(current + 1);
      validateCurrentStep();
    }
    function goBack(){
      if(!step.classList.contains('is-active')) return;
      showStep(Math.max(0, current - 1));
      validateCurrentStep();
    }
    step.addEventListener('click', function(e){
      if(e.target.closest('.fit__reflect-back')){ goBack(); return; }
      advance();
    });
    step.addEventListener('keydown', function(e){
      if(e.target.closest('.fit__reflect-back')) return;
      if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); advance(); }
    });
  });

  // ---------- anonymous id (so a repeat visit doesn't look like a new person if they submit twice by mistake; not used to identify anyone) ----------
  function anonId(){
    var key = 'baderech_research_anon_id';
    try{
      var id = localStorage.getItem(key);
      if(!id){
        id = 'r_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2,8);
        localStorage.setItem(key, id);
      }
      return id;
    }catch(e){
      return 'r_' + Date.now().toString(36);
    }
  }

  // ---------- human-readable labels (so the sheet shows real text, not internal codes) ----------
  var LABELS = {
    q1: {
      q1_single: 'רווק, לא בזוגיות כרגע',
      q1_recent_breakup: 'יצא לאחרונה מזוגיות ארוכה או מגירושין',
      q1_relationship: 'בזוגיות, אבל יש דברים שהיה רוצה לשנות בעצמו',
      q1_transition: 'עובר תקופת שינוי משמעותית',
      q1_other: 'אחר'
    },
    q4: {
      q4_fitness: 'כושר או בריאות גופנית',
      q4_therapy: "טיפול פסיכולוגי או קואצ'ינג",
      q4_style: 'סטייל, לבוש או תדמית',
      q4_learning: 'קורסים, ספרים או תוכן בנושא',
      q4_nothing: 'שום דבר עדיין',
      q4_other: 'משהו אחר'
    },
    q5: {
      q5_none: 'אין פער גדול — די תואם',
      q5_small: 'יש פער קטן',
      q5_big: 'יש פער גדול',
      q5_unsure: 'לא ממש חשב על זה ככה עד עכשיו'
    }
  };

  function label(q, val){
    if(!val) return '';
    return (LABELS[q] && LABELS[q][val]) || val;
  }

  function labelList(q, vals){
    if(!Array.isArray(vals) || !vals.length) return '';
    return vals.map(function(v){ return label(q, v); }).join('; ');
  }

  // ---------- submission ----------
  function queueLocally(payload){
    try{
      var raw = localStorage.getItem(QUEUE_KEY);
      var queue = raw ? JSON.parse(raw) : [];
      queue.push(payload);
      localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
    }catch(e){}
  }

  function submitPayload(payload){
    if(!SUBMIT_ENDPOINT){
      // No endpoint configured yet — keep the response safe locally so
      // nothing is lost once the endpoint is wired up (see SETUP-RESEARCH.md).
      queueLocally(payload);
      return Promise.resolve({ queued: true });
    }
    return fetch(SUBMIT_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' }, // text/plain avoids a CORS preflight against Apps Script
      body: JSON.stringify(payload)
    }).catch(function(){
      queueLocally(payload);
      return { queued: true };
    });
  }

  function finishResearch(){
    var name = (document.getElementById('optinName').value || '').trim();
    var contact = (document.getElementById('optinContact').value || '').trim();

    var payload = {
      id: anonId(),
      submitted_at: new Date().toISOString(),
      q1: label('q1', answers.q1),
      q2_rating: answers.q2 || '',
      q3_open_text: answers.q3 || '',
      q4: labelList('q4', answers.q4),
      q5: label('q5', answers.q5),
      optin_name: name,
      optin_contact: contact,
      source: (new URLSearchParams(window.location.search)).get('src') || ''
    };

    var submitBtn = document.getElementById('submitResearch');
    submitBtn.classList.add('is-sending');
    submitBtn.disabled = true;

    var hint = document.getElementById('sendingHint');
    var hintTimer = setTimeout(function(){
      hint.textContent = 'עוד רגע, כמעט סיימנו...';
      hint.classList.add('is-visible');
    }, 2200);

    submitPayload(payload).then(function(){
      clearTimeout(hintTimer);
      hint.classList.remove('is-visible');
      clearAnswers();
      answers = {};
      var thanksMsg = document.getElementById('thanksMessage');
      if(contact){
        thanksMsg.textContent = 'השארת פרטים — אחזור אליך אישית, בלי לחץ ובלי מכירה.';
      } else {
        thanksMsg.textContent = 'התשובות שלך יעזרו לי להבין נכון יותר מה עובר על גברים היום. תודה.';
      }
      showStep(stepNames.indexOf('thanks'));
    });
  }

  var submitBtn = document.getElementById('submitResearch');
  if(submitBtn){
    submitBtn.addEventListener('click', finishResearch);
  }

  // ---------- init ----------
  restoreInputs();
  showStep(0);
  steps.forEach(function(step){
    var btn = step.querySelector('.fit__btn-continue');
    if(btn && btn.dataset.action !== 'start' && btn.id !== 'submitResearch'){
      var valid = validateStep(step);
      btn.disabled = !valid;
      btn.setAttribute('aria-disabled', String(!valid));
    }
  });

})();
