(function(){
  "use strict";

  var STORAGE_KEY = 'baderech_fit_v1';
  var WHATSAPP_NUMBER = '972505494326'; // taken from the existing site (wa.me link in index.html)

  var QUESTION_STEPS = ['q1','q2','q3','q4','q5','q6','q7','q8','q9'];

  var steps = Array.prototype.slice.call(document.querySelectorAll('.fit__step'));
  var stepNames = steps.map(function(s){ return s.dataset.step; });
  var current = 0;

  var progressWrap = document.querySelector('.fit__progress');
  var progressFill = document.querySelector('.fit__progress-fill');
  var progressLabel = document.querySelector('.fit__progress-label');
  var toastEl = document.getElementById('fitToast');

  var AFFIRMATIONS = ['הבנו.', 'רשמנו את זה.', 'תודה על הכנות.', 'ברור.', 'זה נשאר בינך לבינך, לעת עתה.'];
  var toastTimer = null;
  function showToast(){
    if(!toastEl) return;
    clearTimeout(toastTimer);
    toastEl.textContent = AFFIRMATIONS[Math.floor(Math.random() * AFFIRMATIONS.length)];
    toastEl.classList.add('is-visible');
    toastTimer = setTimeout(function(){ toastEl.classList.remove('is-visible'); }, 1300);
  }

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
  function showStep(index){
    steps.forEach(function(s){ s.classList.remove('is-active'); });
    steps[index].classList.add('is-active');
    current = index;
    updateProgress();
    var heading = steps[index].querySelector('h1, h2');
    if(heading){
      heading.focus({ preventScroll: true });
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Milestone-based labels instead of an exact "X out of Y" count.
  // An exact fraction invites the visitor to calculate whether finishing is
  // "worth it" (this is what we saw hurting completion on long questionnaires
  // like BetterHelp's). Qualitative milestones keep the reassurance without
  // the arithmetic.
  function progressCaption(qIndex, total){
    var pct = (qIndex + 1) / total;
    if(qIndex === 0) return 'מתחילים';
    if(pct <= 0.4) return 'בתנועה';
    if(pct <= 0.75) return 'בערך באמצע';
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

  // ---------- option styling / selection ----------
  function refreshOptionStyles(name){
    document.querySelectorAll('input[name="' + name + '"]').forEach(function(inp){
      var card = inp.closest('.fit__option') || inp.closest('.fit__scale-opt');
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
        if(checked.length > max){
          e.target.checked = false;
        }
      }
      refreshOptionStyles(name);
      persistCurrentStep();
      validateCurrentStep();
    });
  });

  document.querySelectorAll('.fit__scale').forEach(function(group){
    var firstInput = group.querySelector('input');
    if(!firstInput) return;
    var name = firstInput.name;
    group.addEventListener('change', function(){
      refreshOptionStyles(name);
      persistCurrentStep();
      validateCurrentStep();
    });
  });

  document.querySelectorAll('textarea').forEach(function(ta){
    ta.addEventListener('input', function(){
      persistCurrentStep();
      validateCurrentStep();
      var counter = ta.parentElement.querySelector('.fit__counter');
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
        if(textarea){
          textarea.value = val;
          var counter = textarea.parentElement.querySelector('.fit__counter');
          if(counter && textarea.maxLength > 0){ counter.textContent = textarea.value.length + ' / ' + textarea.maxLength; }
        } else {
          var radio = document.querySelector('input[name="' + name + '"][value="' + val + '"]');
          if(radio) radio.checked = true;
        }
      }
      refreshOptionStyles(name);
    });
  }

  function firstUnansweredQuestionIndex(){
    for(var i = 0; i < QUESTION_STEPS.length; i++){
      var step = steps[stepNames.indexOf(QUESTION_STEPS[i])];
      if(!validateStep(step)) return stepNames.indexOf(QUESTION_STEPS[i]);
    }
    return stepNames.indexOf(QUESTION_STEPS[QUESTION_STEPS.length - 1]);
  }

  // ---------- nav buttons ----------
  document.querySelectorAll('.fit__btn-continue[data-action="start"]').forEach(function(btn){
    btn.addEventListener('click', function(){
      var resumeIndex = firstUnansweredQuestionIndex();
      showStep(resumeIndex);
      validateCurrentStep();
    });
  });

  steps.forEach(function(step){
    var continueBtn = step.querySelector('.fit__btn-continue');
    if(continueBtn && continueBtn.dataset.action !== 'start'){
      continueBtn.addEventListener('click', function(){
        if(continueBtn.disabled) return;
        if(continueBtn.dataset.action === 'finish'){
          finishQuiz();
        } else {
          var wasQuestion = QUESTION_STEPS.indexOf(stepNames[current]) !== -1;
          if(wasQuestion) showToast();
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

  // ---------- scoring ----------
  var SCORES = {
    q4: { q4_1: 2, q4_2: 2, q4_3: -1, q4_4: -2, q4_5: 0 },
    q5: { '1': -2, '2': -1, '3': 0, '4': 1, '5': 2 },
    q6: { q6_1: 2, q6_2: 1, q6_3: -2, q6_4: 0 },
    q7: { q7_1: 2, q7_2: 1, q7_3: -3 },
    q8: { q8_1: 2, q8_2: 0, q8_3: -2 }
  };

  function computeScore(){
    var total = 0;
    ['q4','q5','q6','q7','q8'].forEach(function(q){
      var val = answers[q];
      if(val !== undefined && SCORES[q][val] !== undefined){
        total += SCORES[q][val];
      }
    });
    return total;
  }

  function resultBucket(score){
    if(score >= 6) return 'result-a';
    if(score >= 2) return 'result-b';
    return 'result-c';
  }

  // ---------- human-readable labels (for the WhatsApp summary only) ----------
  var LABELS = {
    q1: {
      q1_1: 'אני מרגיש תקוע למרות שאני יודע שיש בי יותר',
      q1_2: 'חסר לי ביטחון מול אנשים או בדייטינג',
      q1_3: 'קשה לי ליזום, להוביל או לבטא עניין',
      q1_4: 'אני רוצה שינוי רחב יותר בדרך שבה אני מחזיק את עצמי',
      q1_5: 'בעיקר סקרנות'
    },
    q2: {
      q2_1: 'אני יודע מה לעשות, אבל לא מצליח לפעול',
      q2_2: 'אני חושב יותר מדי ומאבד את הרגע',
      q2_3: 'אני תלוי באישור מאחרים',
      q2_4: 'אני חוזר שוב ושוב לאותם דפוסים',
      q2_5: 'אני עדיין לא יודע להגדיר'
    },
    q4: {
      q4_1: 'תהליך אישי שדורש ממני להשתתף ולעבוד',
      q4_2: 'כלים פרקטיים ותרגול במציאות',
      q4_3: 'מישהו שיגיד לי בדיוק מה לעשות בכל מצב',
      q4_4: 'פתרון מהיר או כמה טיפים',
      q4_5: 'עדיין לא בטוח'
    },
    q7: {
      q7_1: 'זה אפילו חשוב לי',
      q7_2: 'מתאים לי, אם ארגיש שיש התאמה',
      q7_3: 'אני מעדיף תהליך אונליין בלבד'
    }
  };

  function label(q, val){
    if(!val) return '—';
    return (LABELS[q] && LABELS[q][val]) || val;
  }

  function buildWhatsAppMessage(){
    var q1text = Array.isArray(answers.q1) && answers.q1.length
      ? answers.q1.map(function(v){ return label('q1', v); }).join('; ')
      : '—';
    var q3text = (answers.q3 && answers.q3.trim()) ? answers.q3.trim() : '—';
    var q5text = answers.q5 ? (answers.q5 + ' מתוך 5') : '—';
    var q9text = (answers.q9 && answers.q9.trim()) ? answers.q9.trim() : 'לא צויין';

    var lines = [
      'היי ירון, הגעתי דרך בדיקת ההתאמה של בדרך.',
      '',
      'מה הביא אותי לכאן: ' + q1text,
      'הפער המרכזי שאני מרגיש: ' + label('q2', answers.q2),
      'מה הייתי רוצה שייראה אחרת בעוד חודש וחצי: ' + q3text,
      'מה אני מחפש: ' + label('q4', answers.q4),
      'מידת המוכנות שלי להתנסות: ' + q5text,
      'התאמה למפגשים פנים מול פנים: ' + label('q7', answers.q7),
      'מה חשוב לדעת לפני שנדבר: ' + q9text,
      '',
      'אשמח לבדוק איתך אם יש התאמה לשיחה.'
    ];
    return lines.join('\n');
  }

  function prepareWhatsAppLinks(){
    var message = buildWhatsAppMessage();
    var url = 'https://wa.me/' + WHATSAPP_NUMBER + '?text=' + encodeURIComponent(message);
    document.querySelectorAll('.fit__whatsapp-link').forEach(function(a){
      a.setAttribute('href', url);
    });
  }

  // ---------- finish ----------
  var MATCHING_MESSAGES = ['מחברים את מה שענית', 'מסתכלים על זה כמכלול', 'כמעט מוכן'];
  var WA_BRIDGE_KEY = 'baderech_wa_prefill';

  function finishQuiz(){
    persistCurrentStep();
    var score = computeScore();
    var bucket = resultBucket(score);
    prepareWhatsAppLinks();

    // Results A and B now continue onto the landing page before WhatsApp
    // (the "skip straight to WhatsApp" link is the only direct WA exit left
    // on this page). So that a personal touch isn't lost for someone who
    // reads the landing page and then clicks its own WhatsApp button, we
    // hand the composed message forward through sessionStorage. The landing
    // page (js/script.js) picks this up once and clears it immediately —
    // it is not the raw answers, only the human-readable summary, and it
    // never outlives the current browser tab.
    if(bucket === 'result-a' || bucket === 'result-b'){
      try{ sessionStorage.setItem(WA_BRIDGE_KEY, buildWhatsAppMessage()); }catch(e){}
    }

    // Brief processing moment before the result, instead of an instant jump.
    // This is not decorative delay: it is what makes the result that follows
    // feel considered rather than a static lookup table (same idea used by
    // Noom's "building your plan" screen between quiz and result).
    var matchingIndex = stepNames.indexOf('matching');
    var labelEl = document.getElementById('fitMatchingLabel');
    showStep(matchingIndex);

    var mi = 0;
    if(labelEl) labelEl.textContent = MATCHING_MESSAGES[0];
    var msgInterval = setInterval(function(){
      mi = (mi + 1) % MATCHING_MESSAGES.length;
      if(!labelEl) return;
      labelEl.style.opacity = 0;
      setTimeout(function(){
        labelEl.textContent = MATCHING_MESSAGES[mi];
        labelEl.style.opacity = 1;
      }, 250);
    }, 900);

    setTimeout(function(){
      clearInterval(msgInterval);
      showStep(stepNames.indexOf(bucket));
      // Privacy: once the result is computed and shown, the answers no longer
      // need to live in this browser session.
      clearAnswers();
      answers = {};
    }, 2400);
  }

  // ---------- restart ----------
  function resetQuiz(){
    clearAnswers();
    answers = {};
    document.querySelectorAll('input[type="radio"], input[type="checkbox"]').forEach(function(i){ i.checked = false; });
    document.querySelectorAll('textarea').forEach(function(t){
      t.value = '';
      var counter = t.parentElement.querySelector('.fit__counter');
      if(counter && t.maxLength > 0){ counter.textContent = '0 / ' + t.maxLength; }
    });
    document.querySelectorAll('.fit__option, .fit__scale-opt').forEach(function(c){ c.classList.remove('is-selected'); });
    document.querySelectorAll('.fit__btn-continue:not([data-action])').forEach(function(btn){
      btn.disabled = true;
      btn.setAttribute('aria-disabled', 'true');
    });
    showStep(0);
  }

  document.querySelectorAll('.fit__restart-link').forEach(function(btn){
    btn.addEventListener('click', resetQuiz);
  });

  // ---------- init ----------
  restoreInputs();
  showStep(0);
  QUESTION_STEPS.forEach(function(name){
    var idx = stepNames.indexOf(name);
    if(idx > -1) validateStep(steps[idx]);
  });
  // Set initial disabled state for every continue button based on restored answers
  steps.forEach(function(step){
    var btn = step.querySelector('.fit__btn-continue');
    if(btn && btn.dataset.action !== 'start'){
      var valid = validateStep(step);
      btn.disabled = !valid;
      btn.setAttribute('aria-disabled', String(!valid));
    }
  });

})();
