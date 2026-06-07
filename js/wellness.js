(function () {
  "use strict";

  var MOTIVATION = [
    "✨ Ты сильнее своей привычки.",
    "✨ Ещё одна маленькая победа.",
    "✨ Ты уже меняешь свою жизнь.",
    "✨ Сегодня ты выбрал свободу.",
    "✨ Организм благодарит тебя.",
    "✨ Сделай ещё один спокойный вдох.",
    "✨ Каждая минута имеет значение.",
    "✨ Ты справляешься.",
    "✨ Ты уже молодец.",
    "✨ Свобода начинается именно сейчас."
  ];

  var MOOD_REPLIES = {
    great: "Как здорово чувствовать эту лёгкость. Побудь в ней ещё немного — ты это заслужил(а).",
    good: "Хорошее состояние — хорошая опора. Можно опереться на него весь день.",
    ok: "Нормальный день — тоже победа. Не нужно быть на максимуме, чтобы идти вперёд.",
    hard: "Тяжело — и это правда. Сейчас важнее забота, а не идеальность. Ты не один(а).",
    veryhard: "Сейчас очень непросто. Позволь себе быть мягче. Один спокойный вдох уже поддержка."
  };

  var MILESTONES = [
    { days: 0, label: "📅 Сегодня", badge: "🏅 Начало пути", title: "Сегодня" },
    { days: 3, label: "📅 3 дня", badge: "🏅 Первые 3 дня", title: "Первые 3 дня" },
    { days: 7, label: "📅 7 дней", badge: "🏅 Первая неделя", title: "Первая неделя" },
    { days: 14, label: "📅 14 дней", badge: "🏅 Две недели", title: "Две недели свободы" },
    { days: 30, label: "📅 30 дней", badge: "🏅 Первый месяц", title: "Первый месяц" },
    { days: 100, label: "📅 100 дней", badge: "🏅 Сто дней свободы", title: "Сто дней на пути" }
  ];

  var LEAF_COUNT = 30;
  var treeBuilt = false;

  function app() {
    return window.BreatheApp || null;
  }

  function todayKey() {
    var d = new Date();
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  }

  function getWellness() {
    var a = app();
    if (!a) return null;
    var s = a.getState();
    if (!s.wellness) s.wellness = {};
    return s.wellness;
  }

  function save() {
    var a = app();
    if (a) a.saveState();
  }

  function resetTodayVictories(w) {
    var key = todayKey();
    if (w.todayVictoryDate !== key) {
      w.todayVictories = 0;
      w.todayVictoryDate = key;
    }
  }

  function pickMotivation(prev) {
    var list = MOTIVATION.slice();
    if (list.length > 1 && prev) {
      list = list.filter(function (p) {
        return p !== prev;
      });
    }
    return list[Math.floor(Math.random() * list.length)];
  }

  function showMotivation(text) {
    var el = document.getElementById("wellness-motivation");
    if (!el) return;
    el.hidden = false;
    el.classList.remove("wellness-motivation--show");
    void el.offsetWidth;
    el.textContent = text;
    el.classList.add("wellness-motivation--show");
  }

  function buildTree() {
    var canvas = document.getElementById("wellness-tree-canvas");
    if (!canvas || treeBuilt) return;
    treeBuilt = true;
    var svgNS = "http://www.w3.org/2000/svg";
    var svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("viewBox", "0 0 200 220");
    svg.setAttribute("class", "wellness-tree__svg");
    svg.setAttribute("aria-hidden", "true");

    var trunk = document.createElementNS(svgNS, "path");
    trunk.setAttribute("d", "M96 200 Q98 150 100 120 Q102 95 100 75 L100 200 Z");
    trunk.setAttribute("class", "wellness-tree__trunk");
    svg.appendChild(trunk);

    var crown = document.createElementNS(svgNS, "ellipse");
    crown.setAttribute("cx", "100");
    crown.setAttribute("cy", "72");
    crown.setAttribute("rx", "58");
    crown.setAttribute("ry", "48");
    crown.setAttribute("class", "wellness-tree__crown");
    crown.setAttribute("id", "wellness-tree-crown");
    svg.appendChild(crown);

    var positions = [
      [72, 58], [88, 48], [104, 44], [120, 50], [128, 64], [118, 78], [100, 82], [82, 76], [64, 68],
      [76, 88], [92, 92], [108, 90], [124, 84], [132, 72], [110, 58], [94, 62], [78, 72], [86, 52],
      [102, 52], [116, 58], [126, 70], [114, 86], [96, 94], [80, 86], [70, 74], [98, 68], [106, 74],
      [118, 66], [90, 66], [100, 56]
    ];

    for (var i = 0; i < LEAF_COUNT; i++) {
      var leaf = document.createElementNS(svgNS, "circle");
      leaf.setAttribute("cx", String(positions[i][0]));
      leaf.setAttribute("cy", String(positions[i][1]));
      leaf.setAttribute("r", "5");
      leaf.setAttribute("class", "wellness-tree__leaf");
      leaf.setAttribute("data-leaf-idx", String(i));
      svg.appendChild(leaf);
    }

    canvas.appendChild(svg);
  }

  function renderTree(totalVictories) {
    buildTree();
    var active = Math.min(LEAF_COUNT, Math.round((Math.min(totalVictories, 100) / 100) * LEAF_COUNT));
    var leaves = document.querySelectorAll(".wellness-tree__leaf");
    leaves.forEach(function (leaf, idx) {
      var on = idx < active;
      leaf.classList.toggle("wellness-tree__leaf--on", on);
      leaf.classList.toggle("wellness-tree__leaf--new", on && idx === active - 1);
    });
    var crown = document.getElementById("wellness-tree-crown");
    if (crown) {
      crown.classList.toggle("wellness-tree__crown--full", totalVictories >= 100);
    }
    var prog = document.getElementById("wellness-tree-progress");
    if (prog) {
      prog.textContent = Math.min(totalVictories, 100) + " из 100 листьев";
    }
  }

  function renderJourney(days) {
    var list = document.getElementById("wellness-journey-list");
    if (!list) return;
    var w = getWellness();
    var celebrated = w && w.celebratedMilestones ? w.celebratedMilestones.map(String) : [];
    list.innerHTML = "";
    MILESTONES.forEach(function (m) {
      var reached = days >= m.days;
      var li = document.createElement("li");
      li.className = "wellness-journey__item" + (reached ? " wellness-journey__item--done" : "");
      li.innerHTML =
        '<span class="wellness-journey__label">' +
        m.label +
        "</span>" +
        '<span class="wellness-journey__status">' +
        (reached ? m.badge : "Впереди") +
        "</span>";
      if (reached && celebrated.indexOf(String(m.days)) !== -1) {
        li.classList.add("wellness-journey__item--celebrated");
      }
      list.appendChild(li);
    });
  }

  function showAchievement(milestone) {
    var modal = document.getElementById("wellness-achievement");
    var badge = document.getElementById("wellness-achievement-badge");
    var title = document.getElementById("wellness-achievement-title");
    var text = document.getElementById("wellness-achievement-text");
    if (!modal || !milestone) return;
    if (badge) badge.textContent = milestone.badge;
    if (title) title.textContent = milestone.title;
    if (text) text.textContent = "Вы дошли до этапа «" + milestone.label.replace("📅 ", "") + "». Это ваша победа.";
    modal.hidden = false;
    document.body.classList.add("wellness-achievement-open");
  }

  function hideAchievement() {
    var modal = document.getElementById("wellness-achievement");
    if (modal) modal.hidden = true;
    document.body.classList.remove("wellness-achievement-open");
  }

  function checkMilestones(days) {
    var a = app();
    var w = getWellness();
    if (!w || !a) return;
    var s = a.getState();
    if (!w.celebratedMilestones) w.celebratedMilestones = [];
    var pending = null;
    MILESTONES.forEach(function (m) {
      if (m.days === 0 && !s.quitTimestamp && w.totalVictories === 0) return;
      var done = w.celebratedMilestones.some(function (x) {
        return Number(x) === m.days;
      });
      if (days >= m.days && !done) {
        if (!pending || m.days > pending.days) pending = m;
      }
    });
    if (pending) {
      w.celebratedMilestones.push(pending.days);
      save();
      setTimeout(function () {
        showAchievement(pending);
      }, 400);
    }
  }

  function renderEvening() {
    var section = document.getElementById("wellness-evening");
    if (!section) return;
    var w = getWellness();
    var hour = new Date().getHours();
    var isEvening = hour >= 17 || hour < 5;
    var doneToday = w && w.eveningRitualDate === todayKey();
    section.hidden = !isEvening || doneToday;
    var reply = document.getElementById("wellness-evening-reply");
    if (reply) reply.hidden = true;
  }

  function renderMood() {
    var w = getWellness();
    if (!w) return;
    var key = todayKey();
    document.querySelectorAll(".wellness-mood__chip").forEach(function (chip) {
      var mood = chip.getAttribute("data-mood");
      chip.classList.toggle("wellness-mood__chip--active", w.lastMoodDate === key && w.lastMood === mood);
    });
    var reply = document.getElementById("wellness-mood-reply");
    if (reply && w.lastMoodDate === key && w.lastMood && MOOD_REPLIES[w.lastMood]) {
      reply.textContent = MOOD_REPLIES[w.lastMood];
      reply.hidden = false;
    }
  }

  function render() {
    var a = app();
    if (!a) return;
    var w = getWellness();
    if (!w) return;
    resetTodayVictories(w);
    save();

    var days = a.getDaysOnPath();
    var todayEl = document.getElementById("wellness-today-count");
    var totalEl = document.getElementById("wellness-total-count");
    var daysEl = document.getElementById("wellness-days-count");
    if (todayEl) todayEl.textContent = String(w.todayVictories);
    if (totalEl) totalEl.textContent = String(w.totalVictories);
    if (daysEl) daysEl.textContent = String(days);

    renderTree(w.totalVictories);
    renderJourney(days);
    renderMood();
    renderEvening();
    checkMilestones(days);
  }

  function recordVictory() {
    var a = app();
    if (!a) return;
    var s = a.getState();
    var w = getWellness();
    if (!w) return;
    if (!s.quitTimestamp) {
      s.quitTimestamp = a.startOfToday().getTime();
    }
    resetTodayVictories(w);
    w.todayVictories += 1;
    w.totalVictories += 1;
    w.todayVictoryDate = todayKey();
    if (!w.celebratedMilestones) w.celebratedMilestones = [];
    save();

    var prev = document.getElementById("wellness-motivation");
    var prevText = prev ? prev.textContent : "";
    showMotivation(pickMotivation(prevText));
    render();

    if (a.showToast) {
      a.showToast("Победа засчитана. Ты справился(ась) — это важно.");
    }
    if (a.refreshReveal) a.refreshReveal();
  }

  function bind() {
    var feelBtn = document.getElementById("wellness-feel-better");
    if (feelBtn) {
      feelBtn.addEventListener("click", recordVictory);
    }

    document.querySelectorAll(".wellness-mood__chip").forEach(function (chip) {
      chip.addEventListener("click", function () {
        var mood = chip.getAttribute("data-mood");
        var w = getWellness();
        if (!w || !mood) return;
        w.lastMood = mood;
        w.lastMoodDate = todayKey();
        save();
        renderMood();
        var reply = document.getElementById("wellness-mood-reply");
        if (reply && MOOD_REPLIES[mood]) {
          reply.hidden = false;
          reply.classList.remove("wellness-mood__reply--show");
          void reply.offsetWidth;
          reply.textContent = MOOD_REPLIES[mood];
          reply.classList.add("wellness-mood__reply--show");
        }
      });
    });

    var eveningBtn = document.getElementById("wellness-evening-btn");
    if (eveningBtn) {
      eveningBtn.addEventListener("click", function () {
        var w = getWellness();
        if (!w) return;
        w.eveningRitualDate = todayKey();
        save();
        var reply = document.getElementById("wellness-evening-reply");
        if (reply) {
          reply.hidden = false;
          reply.classList.add("wellness-evening__reply--show");
        }
        eveningBtn.disabled = true;
        setTimeout(function () {
          renderEvening();
        }, 2400);
      });
    }

    var closeBtn = document.getElementById("wellness-achievement-close");
    if (closeBtn) closeBtn.addEventListener("click", hideAchievement);
    var backdrop = document.querySelector(".wellness-achievement__backdrop");
    if (backdrop) backdrop.addEventListener("click", hideAchievement);
  }

  function init() {
    bind();
    if (app()) render();
    else setTimeout(init, 50);
  }

  window.BreatheWellness = {
    render: render,
    recordVictory: recordVictory
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    setTimeout(init, 0);
  }
})();
