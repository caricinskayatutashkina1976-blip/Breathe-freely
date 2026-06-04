(function () {
  "use strict";

  var STORAGE_KEY = "breatheFreelyMvp";

  function normalizePath7Checks(raw) {
    var out = [false, false, false, false, false, false, false];
    if (!raw || !Array.isArray(raw)) return out;
    for (var i = 0; i < 7; i++) out[i] = !!raw[i];
    return out;
  }

  var defaultState = {
    survey: null,
    quitTimestamp: null,
    pricePerPack: 250,
    cigsPerPack: 20,
    path7Checks: [false, false, false, false, false, false, false]
  };

  function loadState() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return Object.assign({}, defaultState);
      var parsed = JSON.parse(raw);
      var merged = Object.assign({}, defaultState, parsed);
      merged.path7Checks = normalizePath7Checks(merged.path7Checks);
      return merged;
    } catch (e) {
      return Object.assign({}, defaultState);
    }
  }

  function saveState(state) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  var state = loadState();

  var screens = {
    home: document.getElementById("screen-home"),
    survey: document.getElementById("screen-survey"),
    sos: document.getElementById("screen-sos"),
    progress: document.getElementById("screen-progress"),
    audio: document.getElementById("screen-audio")
  };

  var btnBack = document.getElementById("btn-back");
  var toastEl = document.getElementById("toast");
  var toastTimer;

  var THEME_KEY = "breatheFreelyTheme";
  var btnThemeLight = document.getElementById("btn-theme-light");
  var btnThemeNight = document.getElementById("btn-theme-night");

  function updateThemeToggleUi(mode) {
    var isNight = mode === "night";
    if (btnThemeLight) {
      btnThemeLight.classList.toggle("is-active", !isNight);
      btnThemeLight.setAttribute("aria-pressed", isNight ? "false" : "true");
    }
    if (btnThemeNight) {
      btnThemeNight.classList.toggle("is-active", isNight);
      btnThemeNight.setAttribute("aria-pressed", isNight ? "true" : "false");
    }
  }

  function beginThemeTransition() {
    var root = document.documentElement;
    root.classList.remove("theme-transitioning");
    void root.offsetWidth;
    root.classList.add("theme-transitioning");
    clearTimeout(beginThemeTransition._timer);
    beginThemeTransition._timer = setTimeout(function () {
      root.classList.remove("theme-transitioning");
    }, 920);
  }

  function applyTheme(theme, opts) {
    opts = opts || {};
    var next = theme === "night" ? "night" : "light";
    var prev = document.documentElement.getAttribute("data-theme") || "light";
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch (e) {}
    updateThemeToggleUi(next);
    if (!opts.skipSupportRefresh) {
      setAiSupportOfTheDay();
    }
    if (!opts.skipTransition && prev !== next) {
      beginThemeTransition();
    }
  }

  function initTheme() {
    var t = "light";
    try {
      if (localStorage.getItem(THEME_KEY) === "night") t = "night";
    } catch (e) {}
    document.documentElement.setAttribute("data-theme", t);
    updateThemeToggleUi(t);
  }

  function showToast(message) {
    toastEl.textContent = message;
    toastEl.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      toastEl.hidden = true;
    }, 3200);
  }

  var revealObserver = null;

  function refreshRevealObserver() {
    if (!("IntersectionObserver" in window)) {
      document.querySelectorAll(".reveal").forEach(function (el) {
        el.classList.add("reveal--visible");
      });
      return;
    }
    var active = document.querySelector(".screen:not([hidden])");
    if (!active) return;
    var nodes = active.querySelectorAll(":scope > .card, :scope > aside.card, :scope > .home-grid");
    if (revealObserver) revealObserver.disconnect();
    revealObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) {
            en.target.classList.add("reveal--visible");
            revealObserver.unobserve(en.target);
          }
        });
      },
      { root: null, threshold: 0.06, rootMargin: "0px 0px -8% 0px" }
    );
    nodes.forEach(function (el) {
      el.classList.add("reveal");
      var r = el.getBoundingClientRect();
      var vh = window.innerHeight || document.documentElement.clientHeight;
      if (r.top < vh * 0.92 && r.bottom > -24) {
        el.classList.add("reveal--visible");
      } else {
        revealObserver.observe(el);
      }
    });
  }

  var navStack = ["home"];
  var currentScreen = "home";

  function setScreen(name) {
    Object.keys(screens).forEach(function (key) {
      var el = screens[key];
      if (!el) return;
      var active = key === name;
      el.hidden = !active;
      el.classList.toggle("screen--active", active);
    });
    btnBack.hidden = name === "home";
  }

  function navigate(name, push) {
    if (currentScreen === "sos" && name !== "sos") {
      resetSos();
    }
    if (push !== false && navStack[navStack.length - 1] !== name) {
      navStack.push(name);
    }
    currentScreen = name;
    setScreen(name);
    if (name === "home") {
      companionShowForCurrentTime();
    }
    if (name === "progress") renderProgress();
    if (name === "survey") hydrateSurvey();
    if (name === "sos") resetSos();
    requestAnimationFrame(function () {
      refreshRevealObserver();
    });
  }

  function goBack() {
    if (navStack.length <= 1) {
      if (currentScreen === "sos") resetSos();
      currentScreen = "home";
      navStack = ["home"];
      setScreen("home");
      btnBack.hidden = true;
      companionShowForCurrentTime();
      requestAnimationFrame(function () {
        refreshRevealObserver();
      });
      return;
    }
    if (currentScreen === "sos") {
      resetSos();
    }
    navStack.pop();
    var prev = navStack[navStack.length - 1] || "home";
    currentScreen = prev;
    setScreen(prev);
    if (prev === "home") {
      companionShowForCurrentTime();
    }
    if (prev === "progress") renderProgress();
    if (prev === "survey") hydrateSurvey();
    if (prev === "sos") resetSos();
    requestAnimationFrame(function () {
      refreshRevealObserver();
    });
  }

  btnBack.addEventListener("click", goBack);

  if (btnThemeLight) {
    btnThemeLight.addEventListener("click", function () {
      applyTheme("light");
    });
  }
  if (btnThemeNight) {
    btnThemeNight.addEventListener("click", function () {
      applyTheme("night");
    });
  }

  /* AI-компаньон: без API, фразы по времени и кнопке */
  var companionMorning = [
    "Свобода начинается не с запрета, а с заботы о себе.",
    "Сегодняшний маленький шаг важнее идеального результата.",
    "Утро не ставит тебе экзамен — оно просто приходит. Можно встретить его мягко.",
    "Не нужно решать всё сразу. Достаточно одного спокойного выбора в свою пользу.",
    "Тело просыпается не одним дыханием — дай ему воду и несколько медленных вдохов.",
    "Вчера уже позади. Сегодня — страница без оценок, только забота.",
    "Ты имеешь право начинать сколько угодно раз — без стыда и без объяснений.",
    "Солнце в окне или нет — ты всё равно достоин(а) тишины внутри."
  ];

  var companionAfternoon = [
    "Организм уже начинает благодарить тебя.",
    "История с сигаретой не определяет весь день — только несколько минут.",
    "Между «хочу» и «сделаю» есть щель. В ней можно просто побыть.",
    "Перекур не обязан быть отдыхом. Отдых можно найти и без него.",
    "Ты учишься новому ритму — у любого обучения бывают паузы.",
    "Одно «постой» перед действием уже меняет привычку изнутри.",
    "Усталость и тяга часто похожи — тело можно напоить и снять спешку.",
    "Небольшая прогулка иногда заменяет целый внутренний спор."
  ];

  var companionEvening = [
    "Сделай медленный вдох. Напряжение пройдёт быстрее, чем кажется.",
    "Вечер — время отпустить суету, а не собирать к ней ещё доказательства.",
    "Ты сделал(а) уже достаточно для этого дня. Остальное может подождать до завтра.",
    "Дыхание потише — и мысли становятся ближе и спокойнее.",
    "Если день был сложным, ты всё равно в нём выжил(а). Это не мелочь.",
    "Позволь себе режим «без улучшений», просто «я рядом с собой».",
    "Завтрашний ты поблагодарит сегодняшнего за нежность, а не за подвиги.",
    "Тьма за окном не про тебя — про время суток. Свет внутри можно не гасить."
  ];

  var companionUrge = [
    "Тяга всегда временная. Она сильнее в моменте, чем в реальности.",
    "Сейчас тебе не нужно бросать навсегда. Только не курить ближайшие 10 минут.",
    "Ты не слабый. Ты просто много лет жил с привычкой.",
    "Иногда мозг путает тревогу с потребностью в сигарете.",
    "Ты уже меняешь сценарий своей жизни.",
    "Даже если был срыв — путь не потерян.",
    "Это не приказ мозга — это сигнал «мне тревожно». На него можно ответить теплом, а не дымом.",
    "Подожди чуть-чуть: волна сама устанет, если её не кормить импульсом.",
    "Ты не обязан(а) быть стальным(ой). Мягкость тоже сила.",
    "Прямо сейчас можно сесть и тихо назвать себя по имени — не по делам и ошибкам."
  ];

  var lastCompanionPhrase = "";
  var companionAllFlat = companionMorning.concat(companionAfternoon, companionEvening, companionUrge);

  function companionPickDifferent(pool) {
    if (!pool || !pool.length) return "";
    var x = pool[Math.floor(Math.random() * pool.length)];
    var guard = 0;
    while (x === lastCompanionPhrase && pool.length > 1 && guard < 24) {
      x = pool[Math.floor(Math.random() * pool.length)];
      guard += 1;
    }
    return x;
  }

  function companionSetMessage(phrase) {
    var el = document.getElementById("companion-message");
    var card = document.getElementById("companion-block");
    if (!el) return;
    lastCompanionPhrase = phrase;
    if (!el.textContent || !el.textContent.trim()) {
      el.textContent = phrase;
      return;
    }
    el.classList.add("companion__message--swap");
    if (card) card.classList.add("companion--refresh");
    window.setTimeout(function () {
      el.textContent = phrase;
      el.classList.remove("companion__message--swap");
      if (card) card.classList.remove("companion--refresh");
    }, 220);
  }

  function companionShowForCurrentTime() {
    var ctx = document.getElementById("companion-context");
    var h = new Date().getHours();
    var pool;
    var label;
    if (h >= 5 && h < 12) {
      pool = companionMorning;
      label = "Утро — мягкая поддержка";
    } else if (h >= 12 && h < 17) {
      pool = companionAfternoon;
      label = "День — спокойное сопровождение";
    } else if (h >= 17 && h < 22) {
      pool = companionEvening;
      label = "Вечер — можно выдохнуть";
    } else {
      pool = companionEvening.concat(companionUrge);
      label = "Ночь — рядом с собой";
    }
    if (ctx) ctx.textContent = label;
    companionSetMessage(companionPickDifferent(pool));
  }

  function companionRefreshWithTyping() {
    var typing = document.getElementById("companion-typing");
    var ctx = document.getElementById("companion-context");
    var wrap = document.getElementById("companion-message-wrap");
    if (ctx) ctx.textContent = "Момент тяги — на одной волне с тобой";
    if (wrap) wrap.setAttribute("aria-busy", "true");
    if (typing) typing.hidden = false;
    window.setTimeout(function () {
      if (typing) typing.hidden = true;
      if (wrap) wrap.setAttribute("aria-busy", "false");
      var roll = Math.random();
      var pool = roll < 0.38 ? companionUrge : companionAllFlat;
      companionSetMessage(companionPickDifferent(pool));
    }, 520);
  }

  var companionBtn = document.getElementById("companion-refresh");
  if (companionBtn) {
    companionBtn.addEventListener("click", function () {
      companionRefreshWithTyping();
    });
  }

  document.querySelectorAll("[data-nav]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var target = btn.getAttribute("data-nav");
      var homeEl = document.getElementById("screen-home");
      if (homeEl && homeEl.contains(btn) && currentScreen === "home") {
        var ctxNav = document.getElementById("companion-context");
        if (ctxNav) ctxNav.textContent = "Перед шагом — мягкое напоминание";
        companionSetMessage(companionPickDifferent(companionUrge));
      }
      navigate(target);
    });
  });

  /* Survey */
  var formSurvey = document.getElementById("form-survey");

  function hydrateSurvey() {
    if (!state.survey) return;
    var s = state.survey;
    formSurvey.cigsPerDay.value = s.cigsPerDay;
    formSurvey.pricePerPack.value =
      s.pricePerPack != null ? s.pricePerPack : state.pricePerPack != null ? state.pricePerPack : "";
    formSurvey.cigsPerPack.value =
      s.cigsPerPack != null ? s.cigsPerPack : state.cigsPerPack != null ? state.cigsPerPack : "";
    formSurvey.yearsSmoking.value = s.yearsSmoking;
    formSurvey.urgeMoment.value = s.urgeMoment;
    formSurvey.whyQuit.value = s.whyQuit;
    var fear = formSurvey.querySelector('input[name="fear"][value="' + s.fear + '"]');
    if (fear) fear.checked = true;
    formSurvey.startToday.checked = !!s.startToday;
  }

  formSurvey.addEventListener("submit", function (e) {
    e.preventDefault();
    var fd = new FormData(formSurvey);
    var pricePack = Math.max(0, parseFloat(fd.get("pricePerPack")) || 0);
    var cigsPack = Math.max(1, parseInt(fd.get("cigsPerPack"), 10) || 20);
    state.survey = {
      cigsPerDay: Math.max(0, parseInt(fd.get("cigsPerDay"), 10) || 0),
      pricePerPack: pricePack,
      cigsPerPack: cigsPack,
      yearsSmoking: Math.max(0, parseFloat(fd.get("yearsSmoking")) || 0),
      urgeMoment: fd.get("urgeMoment"),
      whyQuit: (fd.get("whyQuit") || "").trim(),
      fear: fd.get("fear"),
      startToday: formSurvey.startToday.checked
    };
    state.pricePerPack = pricePack;
    state.cigsPerPack = cigsPack;
    if (state.survey.startToday) {
      if (!state.quitTimestamp) {
        state.quitTimestamp = startOfToday().getTime();
      }
    }
    saveState(state);
    showToast("Сохранено на этом устройстве");
    navigate("progress");
  });

  function startOfToday() {
    var d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }

  /* Progress */
  var phrases = [
    "Свобода — это не идеальные дни, а честная забота о себе в обычных.",
    "Тяга — волна. Ты можешь подождать её с берега, а не нырять внутрь.",
    "Один момент спокойного дыхания уже меняет химию тела к мягкости.",
    "Ты не «слабый», если сложно. Ты человек, который учится новому.",
    "Маленький шаг сегодня — это уже не ноль."
  ];

  var achievements = [
    "Сегодня ты заметил(а) себя раньше автопилота.",
    "Сегодня ты выбрал(а) паузу вместо импульса.",
    "Сегодня ты дал(а) себе слово без крика — с поддержкой.",
    "Сегодня ты напомнил(а) себе: я могу иначе.",
    "Сегодня ты укрепил(а) связь «я — забота», а не «я — строгость»."
  ];

  function dayIndex() {
    return Math.floor(Date.now() / 86400000);
  }

  function surveyMoneyParams(survey) {
    var cigsPerDay = Math.max(0, survey.cigsPerDay || 0);
    var packSize = Math.max(
      1,
      parseInt(survey.cigsPerPack, 10) || state.cigsPerPack || 20
    );
    var packPrice =
      survey.pricePerPack != null
        ? Math.max(0, parseFloat(survey.pricePerPack) || 0)
        : Math.max(0, parseFloat(state.pricePerPack) || 0);
    var perCig = packPrice / packSize;
    var perDay = Math.round(cigsPerDay * perCig);
    return {
      cigsPerDay: cigsPerDay,
      packSize: packSize,
      packPrice: packPrice,
      perCig: perCig,
      perDay: perDay,
      perWeek: Math.round(perDay * 7),
      perMonth: Math.round(perDay * 30),
      perYear: Math.round(perDay * 365)
    };
  }

  function savingsMotivationLine(totalRub) {
    if (totalRub <= 0) {
      return "С нуля тоже начинают перемены: ты уже выбрал(а) путь, на котором деньги остаются с тобой.";
    }
    if (totalRub < 800) {
      return "Пусть сумма кажется скромной — это уже реальные рубли, которые не ушли в дым.";
    }
    if (totalRub < 5000) {
      return "Заметный «подушечный» запас: можно побаловать себя чем-то тёплым и полезным.";
    }
    if (totalRub < 20000) {
      return "Ты перенаправил(а) серьёзный поток денег — это сильный аргумент в пользу нового ритма.";
    }
    return "Цифра достойна уважения: столько можно вложить в жизнь без ежедневной кассы у прилавка.";
  }

  function updatePath7Bar() {
    var fills = document.getElementById("path7-bar-fill");
    var cap = document.getElementById("path7-bar-caption");
    if (!fills || !cap) return;
    state.path7Checks = normalizePath7Checks(state.path7Checks);
    var n = 0;
    for (var j = 0; j < 7; j++) {
      if (state.path7Checks[j]) n += 1;
    }
    fills.style.width = Math.round((n / 7) * 100) + "%";
    cap.textContent = n + " из 7 шагов отмечено";
  }

  function renderPath7(active, daysSince) {
    var section = document.getElementById("path7-section");
    if (!section) return;
    if (!active) {
      section.hidden = true;
      return;
    }
    section.hidden = false;
    state.path7Checks = normalizePath7Checks(state.path7Checks);
    var inputs = section.querySelectorAll(".path7-day__check");
    for (var i = 0; i < inputs.length; i++) {
      var inp = inputs[i];
      var idx = parseInt(inp.getAttribute("data-day-idx"), 10);
      if (isNaN(idx) || idx < 0 || idx > 6) continue;
      var unlocked = daysSince >= idx;
      inp.disabled = !unlocked;
      inp.checked = !!state.path7Checks[idx] && unlocked;
      var li = inp.closest(".path7-day");
      if (li) {
        li.classList.toggle("path7-day--locked", !unlocked);
        li.classList.toggle("path7-day--done", unlocked && !!state.path7Checks[idx]);
      }
    }
    updatePath7Bar();
  }

  function renderProgress() {
    var empty = document.getElementById("progress-empty");
    var stats = document.getElementById("progress-stats");
    var savingsCard = document.getElementById("savings-card");
    var path7Section = document.getElementById("path7-section");
    var hasQuit = state.quitTimestamp != null;
    var hasSurvey = !!state.survey;
    var days = 0;
    if (hasQuit && hasSurvey) {
      var quit = new Date(state.quitTimestamp);
      var now = new Date();
      days = Math.max(0, Math.floor((now.getTime() - quit.getTime()) / 86400000));
    }

    if (!hasQuit || !hasSurvey) {
      empty.hidden = false;
      stats.hidden = true;
      savingsCard.hidden = true;
      if (path7Section) path7Section.hidden = true;
    } else {
      empty.hidden = true;
      stats.hidden = false;
      savingsCard.hidden = false;
      var m = surveyMoneyParams(state.survey);
      var notSmoked = Math.round(days * m.cigsPerDay);
      var totalSaved = Math.round(notSmoked * m.perCig);

      document.getElementById("stat-days").textContent = String(days);
      document.getElementById("stat-not-smoked").textContent = String(notSmoked);
      document.getElementById("savings-total").textContent = formatMoney(totalSaved);
      document.getElementById("savings-motivation").textContent = savingsMotivationLine(totalSaved);
      document.getElementById("savings-day").textContent = formatMoney(m.perDay);
      document.getElementById("savings-week").textContent = formatMoney(m.perWeek);
      document.getElementById("savings-month").textContent = formatMoney(m.perMonth);
      document.getElementById("savings-year").textContent = formatMoney(m.perYear);
    }

    renderPath7(hasQuit && hasSurvey, days);

    var pi = dayIndex() % phrases.length;
    document.getElementById("phrase-day").textContent = phrases[pi];
    document.getElementById("achievement-day").textContent = achievements[pi % achievements.length];
  }

  var path7SectionBind = document.getElementById("path7-section");
  if (path7SectionBind && !path7SectionBind.dataset.path7Bound) {
    path7SectionBind.dataset.path7Bound = "1";
    path7SectionBind.addEventListener("change", function (e) {
      var t = e.target;
      if (!t || t.type !== "checkbox" || !t.classList.contains("path7-day__check")) return;
      if (!state.quitTimestamp || !state.survey) return;
      var idx = parseInt(t.getAttribute("data-day-idx"), 10);
      if (isNaN(idx) || idx < 0 || idx > 6) return;
      var quit = new Date(state.quitTimestamp);
      var now = new Date();
      var daysSince = Math.max(0, Math.floor((now.getTime() - quit.getTime()) / 86400000));
      if (daysSince < idx) {
        t.checked = false;
        return;
      }
      state.path7Checks = normalizePath7Checks(state.path7Checks);
      state.path7Checks[idx] = t.checked;
      saveState(state);
      var li = t.closest(".path7-day");
      if (li) li.classList.toggle("path7-day--done", t.checked);
      updatePath7Bar();
    });
  }

  function formatMoney(n) {
    return n.toLocaleString("ru-RU", { maximumFractionDigits: 0 }) + " ₽";
  }

  /* SOS */
  var sosIntro = document.getElementById("sos-intro");
  var sosBreath = document.getElementById("sos-breath");
  var sosAfter = document.getElementById("sos-after");
  var breathRing = document.getElementById("breath-ring");
  var breathPhase = document.getElementById("breath-phase");
  var breathTimer = document.getElementById("breath-timer");
  var breathHint = document.getElementById("breath-hint");
  var supportText = document.getElementById("support-text");
  var sosMoodChips = document.getElementById("sos-mood-chips");
  var sosResponsePanel = document.getElementById("sos-response-panel");
  var sosResponseText = document.getElementById("sos-response-text");
  var sosGroundingBox = document.getElementById("sos-grounding-box");
  var sosGroundingText = document.getElementById("sos-grounding-text");
  var sosMoodReset = document.getElementById("sos-mood-reset");

  var breathInterval;
  var breathRemaining = 60;
  var BREATH_SEGMENT_SEC = 5;
  var SOS_VICTORY_TEXT = "Ты прошёл одну волну тяги. Это уже победа.";

  var SOS_MOOD_REPLY_COPING =
    "Ты прошёл волну тяги. Запомни это ощущение: ты можешь выдерживать больше, чем кажется.";
  var SOS_MOOD_REPLY_HARD =
    "Это нормально. Тяга не исчезает мгновенно. Давай сделаем ещё один маленький шаг: выпей воды, умойся или выйди на 2 минуты подышать.";
  var SOS_GROUNDING_54321 =
    "Назови 5 предметов вокруг себя, 4 звука, которые слышишь, 3 ощущения в теле, 2 цвета и 1 мысль, за которую можно себя поддержать.";

  function resetSosMoodUi() {
    if (!sosMoodChips || !sosResponsePanel || !sosResponseText) return;
    sosMoodChips.hidden = false;
    sosResponsePanel.hidden = true;
    sosResponseText.hidden = false;
    sosResponseText.textContent = "";
    if (sosGroundingBox) sosGroundingBox.hidden = true;
    if (sosGroundingText) sosGroundingText.textContent = SOS_GROUNDING_54321;
  }

  function resetSos() {
    clearInterval(breathInterval);
    breathRemaining = 60;
    sosIntro.hidden = false;
    sosBreath.hidden = true;
    sosAfter.hidden = true;
    breathRing.className = "breath-ring";
    breathPhase.textContent = "Вдох";
    breathTimer.textContent = "60";
    resetSosMoodUi();
  }

  function getBreathPhase(secLeft) {
    var elapsed = 60 - secLeft;
    if (elapsed < 0) elapsed = 0;
    if (elapsed > 59) elapsed = 59;
    var seg = Math.floor(elapsed / BREATH_SEGMENT_SEC);
    var isInhale = seg % 2 === 0;
    return {
      phase: isInhale ? "inhale" : "exhale",
      label: isInhale ? "Вдох" : "Выдох",
      hint: isInhale
        ? "Носом, спокойно наполняй грудь и живот."
        : "Выдохни длиннее, чем вдох. Плечи мягко опускаются вниз."
    };
  }

  function updateBreathUI() {
    breathTimer.textContent = String(breathRemaining);
    var p = getBreathPhase(breathRemaining);
    breathPhase.textContent = p.label;
    breathHint.textContent = p.hint;
    breathRing.classList.remove("breath-ring--inhale", "breath-ring--exhale");
    breathRing.classList.add("breath-ring--" + p.phase);
  }

  function finishBreath() {
    clearInterval(breathInterval);
    sosBreath.hidden = true;
    sosAfter.hidden = false;
    supportText.textContent = SOS_VICTORY_TEXT;
    resetSosMoodUi();
  }

  function leaveSosToHome(toastMessage) {
    showToast(toastMessage);
    currentScreen = "home";
    navStack = ["home"];
    resetSos();
    setScreen("home");
    btnBack.hidden = true;
    companionShowForCurrentTime();
    requestAnimationFrame(function () {
      refreshRevealObserver();
    });
  }

  document.getElementById("btn-start-breath").addEventListener("click", function () {
    sosIntro.hidden = true;
    sosBreath.hidden = false;
    breathRemaining = 60;
    updateBreathUI();
    clearInterval(breathInterval);
    breathInterval = setInterval(function () {
      breathRemaining -= 1;
      if (breathRemaining <= 0) {
        finishBreath();
        return;
      }
      updateBreathUI();
    }, 1000);
  });

  document.getElementById("btn-skip-breath").addEventListener("click", function () {
    finishBreath();
  });

  document.getElementById("btn-urge-less").addEventListener("click", function () {
    leaveSosToHome("Хорошо. Этот момент засчитан — ты поддержал(а) себя.");
  });

  document.getElementById("btn-feel-better").addEventListener("click", function () {
    leaveSosToHome("Приятно слышать, что стало легче. Один шаг за другим.");
  });

  document.querySelectorAll("#sos-mood-chips .sos-chip").forEach(function (chip) {
    chip.addEventListener("click", function () {
      var mood = chip.getAttribute("data-mood");
      if (!mood || !sosResponsePanel || !sosResponseText) return;
      sosMoodChips.hidden = true;
      sosResponsePanel.hidden = false;
      if (mood === "coping") {
        sosResponseText.hidden = false;
        sosResponseText.textContent = SOS_MOOD_REPLY_COPING;
        if (sosGroundingBox) sosGroundingBox.hidden = true;
      } else if (mood === "hard") {
        sosResponseText.hidden = false;
        sosResponseText.textContent = SOS_MOOD_REPLY_HARD;
        if (sosGroundingBox) sosGroundingBox.hidden = true;
      } else if (mood === "distract") {
        sosResponseText.textContent = "";
        sosResponseText.hidden = true;
        if (sosGroundingText) sosGroundingText.textContent = SOS_GROUNDING_54321;
        if (sosGroundingBox) sosGroundingBox.hidden = false;
      }
    });
  });

  if (sosMoodReset) {
    sosMoodReset.addEventListener("click", function () {
      resetSosMoodUi();
    });
  }

  /* Audio cards */
  var audioTitles = {
    urge: "5 минут против тяги",
    evening: "Вечернее расслабление",
    morning: "Утренний настрой",
    stress: "Антистресс"
  };

  document.querySelectorAll(".audio-card").forEach(function (card) {
    card.addEventListener("click", function () {
      var id = card.getAttribute("data-audio");
      var title = audioTitles[id] || "Аудио";
      showToast("«" + title + "»: в MVP трека нет — в полной версии откроется плеер. Спасибо за интерес!");
    });
    card.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        card.click();
      }
    });
    card.tabIndex = 0;
    card.setAttribute("role", "button");
  });

  /* Поддержка дня на главной: статичные фразы, случайная при загрузке */
  var aiSupportPhrases = [
    "Тяга — это волна. Она поднимается, но обязательно проходит.",
    "Ты не обязан побеждать весь день сразу. Победи ближайшие 5 минут.",
    "Каждый отказ от сигареты — это голос в пользу твоей свободы.",
    "Срыв не отменяет путь. Важно не бросить себя.",
    "Сейчас просто вдохни глубже. Ты уже делаешь шаг."
  ];

  var aiSupportPhrasesNight = [
    "Сегодня не нужно бороться с собой. Просто позволь себе успокоиться.",
    "Тревога не вечна. Ночь тоже пройдёт.",
    "Сейчас важнее не идеальность, а забота о себе.",
    "Иногда лучший шаг — просто спокойно лечь спать."
  ];

  function isNightTheme() {
    return document.documentElement.getAttribute("data-theme") === "night";
  }

  function setAiSupportOfTheDay() {
    var el = document.getElementById("ai-support-quote");
    if (!el) return;
    var list = isNightTheme() ? aiSupportPhrasesNight : aiSupportPhrases;
    var i = Math.floor(Math.random() * list.length);
    el.textContent = list[i];
  }

  /* First paint */
  initTheme();
  setScreen("home");
  setAiSupportOfTheDay();
  companionShowForCurrentTime();
  renderProgress();
  requestAnimationFrame(function () {
    refreshRevealObserver();
  });
})();
