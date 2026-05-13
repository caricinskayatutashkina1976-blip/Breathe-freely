(function () {
  "use strict";

  var STORAGE_KEY = "breatheFreelyMvp";

  var defaultState = {
    survey: null,
    quitTimestamp: null,
    pricePerPack: 250,
    cigsPerPack: 20
  };

  function loadState() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return Object.assign({}, defaultState);
      var parsed = JSON.parse(raw);
      return Object.assign({}, defaultState, parsed);
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

  function showToast(message) {
    toastEl.textContent = message;
    toastEl.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      toastEl.hidden = true;
    }, 3200);
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
    if (name === "progress") renderProgress();
    if (name === "survey") hydrateSurvey();
    if (name === "sos") resetSos();
  }

  function goBack() {
    if (navStack.length <= 1) {
      if (currentScreen === "sos") resetSos();
      currentScreen = "home";
      navStack = ["home"];
      setScreen("home");
      btnBack.hidden = true;
      return;
    }
    if (currentScreen === "sos") {
      resetSos();
    }
    navStack.pop();
    var prev = navStack[navStack.length - 1] || "home";
    currentScreen = prev;
    setScreen(prev);
    if (prev === "progress") renderProgress();
    if (prev === "survey") hydrateSurvey();
    if (prev === "sos") resetSos();
  }

  btnBack.addEventListener("click", goBack);

  document.querySelectorAll("[data-nav]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var target = btn.getAttribute("data-nav");
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

  function renderProgress() {
    var empty = document.getElementById("progress-empty");
    var stats = document.getElementById("progress-stats");
    var savingsCard = document.getElementById("savings-card");
    var hasQuit = state.quitTimestamp != null;
    var hasSurvey = !!state.survey;

    if (!hasQuit || !hasSurvey) {
      empty.hidden = false;
      stats.hidden = true;
      savingsCard.hidden = true;
    } else {
      empty.hidden = true;
      stats.hidden = false;
      savingsCard.hidden = false;
      var quit = new Date(state.quitTimestamp);
      var now = new Date();
      var diffMs = now.getTime() - quit.getTime();
      var days = Math.max(0, Math.floor(diffMs / 86400000));
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

    var pi = dayIndex() % phrases.length;
    document.getElementById("phrase-day").textContent = phrases[pi];
    document.getElementById("achievement-day").textContent = achievements[pi % achievements.length];
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
  var miniTask = document.getElementById("mini-task");

  var breathInterval;
  var breathRemaining = 60;
  var BREATH_SEGMENT_SEC = 5;
  var SOS_VICTORY_TEXT = "Ты прошёл одну волну тяги. Это уже победа.";

  var tasks = [
    {
      title: "Мини-задание",
      body: "Назови вслух три предмета рядом с собой и их цвет. Это мягко возвращает внимание в настоящее."
    },
    {
      title: "Мини-задание",
      body: "Выпей стакан воды маленькими глотками. Часто жажду путают с тягой — это нормально."
    },
    {
      title: "Мини-задание",
      body: "Напиши одному человеку короткое «привет» без темы сигарет — социальная связь снижает зуд скуки."
    },
    {
      title: "Мини-задание",
      body: "Сделай 20 шагов по комнате или коридору. Движение помогает переждать пик тяги."
    }
  ];

  function resetSos() {
    clearInterval(breathInterval);
    breathRemaining = 60;
    sosIntro.hidden = false;
    sosBreath.hidden = true;
    sosAfter.hidden = true;
    breathRing.className = "breath-ring";
    breathPhase.textContent = "Вдох";
    breathTimer.textContent = "60";
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
    var ti = Math.floor(Math.random() * tasks.length);
    var t = tasks[ti];
    miniTask.innerHTML = "<strong>" + escapeHtml(t.title) + "</strong>" + escapeHtml(t.body);
  }

  function escapeHtml(s) {
    return s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function leaveSosToHome(toastMessage) {
    showToast(toastMessage);
    currentScreen = "home";
    navStack = ["home"];
    resetSos();
    setScreen("home");
    btnBack.hidden = true;
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

  function setAiSupportOfTheDay() {
    var el = document.getElementById("ai-support-quote");
    if (!el) return;
    var i = Math.floor(Math.random() * aiSupportPhrases.length);
    el.textContent = aiSupportPhrases[i];
  }

  /* First paint */
  setScreen("home");
  setAiSupportOfTheDay();
  renderProgress();
})();
