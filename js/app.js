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
    state.survey = {
      cigsPerDay: Math.max(0, parseInt(fd.get("cigsPerDay"), 10) || 0),
      yearsSmoking: Math.max(0, parseFloat(fd.get("yearsSmoking")) || 0),
      urgeMoment: fd.get("urgeMoment"),
      whyQuit: (fd.get("whyQuit") || "").trim(),
      fear: fd.get("fear"),
      startToday: formSurvey.startToday.checked
    };
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

  function renderProgress() {
    var empty = document.getElementById("progress-empty");
    var stats = document.getElementById("progress-stats");
    var hasQuit = state.quitTimestamp != null;
    var hasSurvey = !!state.survey;

    if (!hasQuit || !hasSurvey) {
      empty.hidden = false;
      stats.hidden = true;
    } else {
      empty.hidden = true;
      stats.hidden = false;
      var quit = new Date(state.quitTimestamp);
      var now = new Date();
      var diffMs = now.getTime() - quit.getTime();
      var days = Math.max(0, Math.floor(diffMs / 86400000));
      var cigs = state.survey.cigsPerDay || 0;
      var notSmoked = Math.round(days * cigs);
      var perCig = state.pricePerPack / state.cigsPerPack;
      var money = Math.round(notSmoked * perCig);

      document.getElementById("stat-days").textContent = String(days);
      document.getElementById("stat-not-smoked").textContent = String(notSmoked);
      document.getElementById("stat-money").textContent = formatMoney(money);
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

  var supportPool = [
    "Тяга не команда — это сигнал усталости или напряжения. Ты уже делаешь достаточно, просто оставаясь здесь.",
    "Не нужно «победить» себя. Достаточно дать телу паузу: дыхание уже помогает снизить напряжение.",
    "Если бы ты хотел(а) сдаться по-настоящему, ты бы не открыл(а) этот экран. Это про заботу, а не про силу воли на крике."
  ];

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
  }

  function getPhaseForSecond(secLeft) {
    var elapsed = 60 - secLeft;
    var cycle = 15;
    var pos = elapsed % cycle;
    if (pos < 5) return { phase: "inhale", label: "Медленный вдох", hint: "Носом, на 4 счёта — без рывка." };
    if (pos < 10) return { phase: "hold", label: "Мягкая задержка", hint: "Плечи опущены, челюсть расслаблена." };
    return { phase: "exhale", label: "Медленный выдох", hint: "Длиннее, чем вдох. Как тёплый пар." };
  }

  function updateBreathUI() {
    breathTimer.textContent = String(breathRemaining);
    var p = getPhaseForSecond(breathRemaining);
    breathPhase.textContent = p.label;
    breathHint.textContent = p.hint;
    breathRing.classList.remove("breath-ring--inhale", "breath-ring--hold", "breath-ring--exhale");
    breathRing.classList.add("breath-ring--" + p.phase);
  }

  function finishBreath() {
    clearInterval(breathInterval);
    sosBreath.hidden = true;
    sosAfter.hidden = false;
    var si = Math.floor(Math.random() * supportPool.length);
    supportText.textContent = supportPool[si];
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
    showToast("Хорошо. Этот момент засчитан — ты поддержал(а) себя.");
    currentScreen = "home";
    navStack = ["home"];
    resetSos();
    setScreen("home");
    btnBack.hidden = true;
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

  /* First paint */
  setScreen("home");
  renderProgress();
})();
