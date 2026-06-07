(function () {
  "use strict";

  var TRACKS = [
    { id: "t01", num: "01", ext: "mp3", title: "Расслабление", desc: "Мягкие волны звука — отпустить напряжение и позволить телу отдохнуть." },
    { id: "t02", num: "02", ext: "mp3", title: "Спокойное дыхание", desc: "Ритм, который помогает замедлиться и вернуться к спокойному вдоху." },
    { id: "t03", num: "03", ext: "mp3", title: "Лес", desc: "Тишина леса и природные оттенки — укрытие от суеты и шума." },
    { id: "t04", num: "04", ext: "mp3", title: "Туман", desc: "Лёгкая дымка звуков — мягкий переход в состояние покоя." },
    { id: "t05", num: "05", ext: "mp3", title: "Горы", desc: "Простор и высота — ощущение ясности и устойчивости внутри." },
    { id: "t06", num: "06", ext: "mp3", title: "Вечер", desc: "Тёплый вечерний свет в звуках — завершить день с заботой о себе." },
    { id: "t07", num: "07", ext: "mp3", title: "Сон", desc: "Нежное звучание для глубокого отдыха и мягкого засыпания." },
    { id: "t08", num: "08", ext: "mp3", title: "Утренний свет", desc: "Тихое пробуждение — мягкий старт дня без спешки." },
    { id: "t09", num: "09", ext: "mp3", title: "Глубокий покой", desc: "Погружение в тишину — пространство для внутреннего равновесия." },
    { id: "t10", num: "10", ext: "mp3", title: "Тихая вода", desc: "Плавные звуковые волны — как спокойная гладь озера." },
    { id: "t11", num: "11", ext: "m4a", title: "Мягкий ветер", desc: "Лёгкое движение воздуха — освобождение от зажимов и напряжения." },
    { id: "t12", num: "12", ext: "mp3", title: "Звёздная ночь", desc: "Ночная атмосфера — ясность и покой под тёмным небом." },
    { id: "t13", num: "13", ext: "mp3", title: "Гармония", desc: "Сбалансированное звучание — возвращение к центру и ритму." },
    { id: "t14", num: "14", ext: "mp3", title: "Безмятежность", desc: "Полное расслабление — отпустить всё лишнее и остаться с собой." }
  ];

  function icon(name, size) {
    if (window.BreatheIcons && window.BreatheIcons.render) {
      return window.BreatheIcons.render(name, { className: "icon--xs", size: size || 16 });
    }
    return "";
  }

  var activeTrackId = null;
  var audioEl = new Audio();
  var tracksRoot = null;
  var rafId = null;
  var initialized = false;

  audioEl.preload = "auto";

  function formatTime(sec) {
    if (!isFinite(sec) || sec < 0) return "0:00";
    var m = Math.floor(sec / 60);
    var s = Math.floor(sec % 60);
    return m + ":" + (s < 10 ? "0" : "") + s;
  }

  function getTrackSrc(track) {
    var relative = "assets/audio/meditation/" + track.num + "." + (track.ext || "mp3");
    try {
      return new URL(relative, document.baseURI || window.location.href).href;
    } catch (e) {
      return relative;
    }
  }

  function showPlayError() {
    if (window.BreatheApp && window.BreatheApp.showToast) {
      window.BreatheApp.showToast("Не удалось воспроизвести трек. Проверьте подключение файлов.");
    }
  }

  function stopOtherPlayers() {
    if (window.BreatheAudioSupport && window.BreatheAudioSupport.stopAll) {
      window.BreatheAudioSupport.stopAll();
    }
  }

  function getTrackCard(trackId) {
    if (!tracksRoot) return null;
    return tracksRoot.querySelector('.meditation-card[data-track-id="' + trackId + '"]');
  }

  function setCardPlaying(trackId, playing) {
    if (!tracksRoot) return;
    tracksRoot.querySelectorAll(".meditation-card").forEach(function (card) {
      var isActive = card.getAttribute("data-track-id") === trackId;
      card.classList.toggle("meditation-card--playing", isActive && playing);
      card.classList.toggle("meditation-card--active", isActive);
      var ring = card.querySelector(".track-player__ring-wrap");
      if (ring) ring.hidden = !(isActive && playing);
    });
  }

  function updateTrackUi(trackId) {
    var card = getTrackCard(trackId);
    if (!card) return;
    var cur = card.querySelector(".track-player__current");
    var dur = card.querySelector(".track-player__duration");
    var range = card.querySelector(".track-player__progress");
    var btnPlay = card.querySelector(".track-btn--play");
    var btnPause = card.querySelector(".track-btn--pause");
    var btnStop = card.querySelector(".track-btn--stop");
    var t = audioEl.currentTime || 0;
    var d = audioEl.duration || 0;
    if (cur) cur.textContent = formatTime(t);
    if (dur) dur.textContent = formatTime(d);
    if (range && d > 0) range.value = String(Math.round((t / d) * 1000));
    var playing = activeTrackId === trackId && !audioEl.paused && !audioEl.ended;
    if (btnPlay) btnPlay.disabled = playing;
    if (btnPause) btnPause.disabled = !playing;
    if (btnStop) btnStop.disabled = activeTrackId !== trackId || (audioEl.paused && t === 0);
  }

  function stopProgressLoop() {
    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  }

  function startProgressLoop() {
    stopProgressLoop();
    function tick() {
      if (activeTrackId) updateTrackUi(activeTrackId);
      rafId = requestAnimationFrame(tick);
    }
    rafId = requestAnimationFrame(tick);
  }

  function stopPlayback() {
    audioEl.pause();
    audioEl.currentTime = 0;
    var prev = activeTrackId;
    activeTrackId = null;
    stopProgressLoop();
    if (prev) {
      setCardPlaying(prev, false);
      updateTrackUi(prev);
    }
  }

  function pausePlayback() {
    if (!activeTrackId) return;
    audioEl.pause();
    setCardPlaying(activeTrackId, false);
    updateTrackUi(activeTrackId);
    stopProgressLoop();
  }

  function playTrack(trackId) {
    var track = TRACKS.find(function (t) {
      return t.id === trackId;
    });
    if (!track) return;

    stopOtherPlayers();

    if (activeTrackId && activeTrackId !== trackId) {
      setCardPlaying(activeTrackId, false);
    }

    activeTrackId = trackId;
    var src = getTrackSrc(track);

    audioEl.pause();
    audioEl.src = src;
    audioEl.setAttribute("data-track", trackId);
    audioEl.load();

    var playPromise = audioEl.play();
    if (!playPromise || typeof playPromise.then !== "function") {
      setCardPlaying(trackId, true);
      startProgressLoop();
      updateTrackUi(trackId);
      return;
    }

    playPromise
      .then(function () {
        setCardPlaying(trackId, true);
        startProgressLoop();
        updateTrackUi(trackId);
      })
      .catch(function () {
        activeTrackId = null;
        setCardPlaying(trackId, false);
        updateTrackUi(trackId);
        showPlayError();
      });
  }

  function buildTrackCard(track) {
    var article = document.createElement("article");
    article.className = "card meditation-card track-card";
    article.setAttribute("data-track-id", track.id);

    article.innerHTML =
      '<div class="meditation-card__glow" aria-hidden="true"></div>' +
      '<div class="meditation-card__inner">' +
      '<div class="track-card__head">' +
      '  <span class="track-card__icon" aria-hidden="true">' + icon("music", 18) + "</span>" +
      '  <div class="track-card__text">' +
      '    <h4 class="track-card__title">' +
      track.title +
      "</h4>" +
      '    <p class="track-card__desc">' +
      track.desc +
      "</p>" +
      "  </div>" +
      "</div>" +
      '<div class="track-player meditation-player">' +
      '  <div class="track-player__ring-wrap" hidden aria-hidden="true">' +
      '    <div class="track-player__ring meditation-player__ring"></div>' +
      "  </div>" +
      '  <div class="track-player__controls">' +
      '    <button type="button" class="track-btn track-btn--play" aria-label="Воспроизвести">' + icon("play", 14) + "<span>Play</span></button>" +
      '    <button type="button" class="track-btn track-btn--pause" aria-label="Пауза" disabled>' + icon("pause", 14) + "<span>Pause</span></button>" +
      '    <button type="button" class="track-btn track-btn--stop" aria-label="Стоп" disabled>' + icon("stop", 14) + "<span>Stop</span></button>" +
      "  </div>" +
      '  <div class="track-player__progress-wrap">' +
      '    <input type="range" class="track-player__progress" min="0" max="1000" value="0" aria-label="Прогресс воспроизведения" />' +
      '    <div class="track-player__time">' +
      '      <span class="track-player__current">0:00</span>' +
      '      <span class="track-player__duration">0:00</span>' +
      "    </div>" +
      "  </div>" +
      "</div>" +
      "</div>";

    var btnPlay = article.querySelector(".track-btn--play");
    var btnPause = article.querySelector(".track-btn--pause");
    var btnStop = article.querySelector(".track-btn--stop");
    var range = article.querySelector(".track-player__progress");

    btnPlay.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      playTrack(track.id);
    });
    btnPause.addEventListener("click", function (e) {
      e.preventDefault();
      if (activeTrackId === track.id) pausePlayback();
    });
    btnStop.addEventListener("click", function (e) {
      e.preventDefault();
      if (activeTrackId === track.id) stopPlayback();
    });
    range.addEventListener("input", function () {
      if (activeTrackId !== track.id || !audioEl.duration) return;
      audioEl.currentTime = (Number(range.value) / 1000) * audioEl.duration;
      updateTrackUi(track.id);
    });

    return article;
  }

  function renderTracks() {
    if (!tracksRoot) return;
    tracksRoot.innerHTML = "";
    TRACKS.forEach(function (track) {
      tracksRoot.appendChild(buildTrackCard(track));
    });
    tracksRoot.setAttribute("data-rendered-count", String(TRACKS.length));
  }

  function syncTracks() {
    if (!tracksRoot) return;
    var rendered = parseInt(tracksRoot.getAttribute("data-rendered-count"), 10) || 0;
    var domCount = tracksRoot.childElementCount;
    if (rendered !== TRACKS.length || domCount !== TRACKS.length) {
      if (activeTrackId) stopPlayback();
      renderTracks();
    }
  }

  function bindAudioEvents() {
    audioEl.addEventListener("loadedmetadata", function () {
      if (activeTrackId) updateTrackUi(activeTrackId);
    });
    audioEl.addEventListener("ended", function () {
      if (activeTrackId) {
        setCardPlaying(activeTrackId, false);
        updateTrackUi(activeTrackId);
      }
      stopProgressLoop();
    });
    audioEl.addEventListener("pause", function () {
      if (activeTrackId && !audioEl.ended) updateTrackUi(activeTrackId);
    });
    audioEl.addEventListener("error", function () {
      if (!activeTrackId) return;
      var failedId = activeTrackId;
      activeTrackId = null;
      setCardPlaying(failedId, false);
      updateTrackUi(failedId);
      stopProgressLoop();
      showPlayError();
    });
  }

  function ensureReady() {
    if (!tracksRoot) tracksRoot = document.getElementById("meditation-tracks");
    if (!tracksRoot) return;
    if (!initialized) {
      bindAudioEvents();
      initialized = true;
    }
    syncTracks();
    if (window.BreatheIcons && window.BreatheIcons.hydrate) {
      window.BreatheIcons.hydrate(tracksRoot);
    }
  }

  function init() {
    ensureReady();
  }

  function onScreenShow() {
    ensureReady();
    if (typeof window.refreshRevealObserver === "function") {
      requestAnimationFrame(window.refreshRevealObserver);
    }
  }

  window.BreatheMeditationMusic = {
    onScreenShow: onScreenShow,
    ensureReady: ensureReady,
    stopAll: stopPlayback
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    setTimeout(init, 0);
  }
})();
