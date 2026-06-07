(function () {
  "use strict";

  var TRACKS = [
    {
      id: "relax",
      num: "01",
      title: "Расслабление",
      desc: "Мягкие волны звука — отпустить напряжение и позволить телу отдохнуть."
    },
    {
      id: "breath",
      num: "02",
      title: "Спокойное дыхание",
      desc: "Ритм, который помогает замедлиться и вернуться к спокойному вдоху."
    },
    {
      id: "forest",
      num: "03",
      title: "Лес",
      desc: "Тишина леса и природные оттенки — укрытие от суеты и шума."
    },
    {
      id: "fog",
      num: "04",
      title: "Туман",
      desc: "Лёгкая дымка звуков — мягкий переход в состояние покоя."
    },
    {
      id: "mountains",
      num: "05",
      title: "Горы",
      desc: "Простор и высота — ощущение ясности и устойчивости внутри."
    },
    {
      id: "evening",
      num: "06",
      title: "Вечер",
      desc: "Тёплый вечерний свет в звуках — завершить день с заботой о себе."
    },
    {
      id: "sleep",
      num: "07",
      title: "Сон",
      desc: "Нежное звучание для глубокого отдыха и мягкого засыпания."
    }
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

  function formatTime(sec) {
    if (!isFinite(sec) || sec < 0) return "0:00";
    var m = Math.floor(sec / 60);
    var s = Math.floor(sec % 60);
    return m + ":" + (s < 10 ? "0" : "") + s;
  }

  function getTrackSrc(track) {
    return "assets/audio/meditation/" + track.num + ".mp3";
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
    if (audioEl.getAttribute("data-track") !== trackId) {
      audioEl.src = src;
      audioEl.setAttribute("data-track", trackId);
    }
    audioEl.play().catch(function () {});
    setCardPlaying(trackId, true);
    startProgressLoop();
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

    btnPlay.addEventListener("click", function () {
      playTrack(track.id);
    });
    btnPause.addEventListener("click", function () {
      if (activeTrackId === track.id) pausePlayback();
    });
    btnStop.addEventListener("click", function () {
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
  }

  function init() {
    tracksRoot = document.getElementById("meditation-tracks");
    renderTracks();
    bindAudioEvents();
  }

  function onScreenShow() {
    if (typeof window.refreshRevealObserver === "function") {
      requestAnimationFrame(window.refreshRevealObserver);
    }
  }

  window.BreatheMeditationMusic = {
    onScreenShow: onScreenShow,
    stopAll: stopPlayback
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    setTimeout(init, 0);
  }
})();
