(function () {
  "use strict";

  var VOICE_KEY = "breatheFreelyAudioVoice";

  var TRACKS = [
    {
      id: "urge-now",
      num: "01",
      title: "Тяга прямо сейчас",
      desc: "Мягкая поддержка, когда желание особенно сильное — вернуться к дыханию и себе."
    },
    {
      id: "hard-evening",
      num: "02",
      title: "Сложный вечер",
      desc: "Помогает отпустить напряжение дня и прожить вечер без сигареты."
    },
    {
      id: "after-stress",
      num: "03",
      title: "После стресса",
      desc: "Спокойное восстановление после всплеска тревоги или раздражения."
    },
    {
      id: "after-coffee",
      num: "04",
      title: "После кофе",
      desc: "Мягкий переход после привычного ритуала — без спешки и осуждения."
    },
    {
      id: "after-food",
      num: "05",
      title: "После еды",
      desc: "Нежная пауза вместо сигареты — дать телу время успокоиться."
    },
    {
      id: "morning",
      num: "06",
      title: "Утренний настрой",
      desc: "Начать день с ясностью, заботой и спокойным намерением."
    },
    {
      id: "freedom",
      num: "07",
      title: "Я выбираю свободу",
      desc: "Напоминание о вашем выборе жить свободно — шаг за шагом."
    }
  ];

  var voiceLabels = {
    female: "Женский голос",
    male: "Мужской голос"
  };

  function icon(name, size) {
    if (window.BreatheIcons && window.BreatheIcons.render) {
      return window.BreatheIcons.render(name, { className: "icon--xs", size: size || 16 });
    }
    return "";
  }

  var selectedVoice = null;
  var activeTrackId = null;
  var audioEl = new Audio();
  var tracksRoot = null;
  var libraryEl = null;
  var completeEl = null;
  var voiceLabelEl = null;
  var feelMessageEl = null;
  var rafId = null;

  function formatTime(sec) {
    if (!isFinite(sec) || sec < 0) return "0:00";
    var m = Math.floor(sec / 60);
    var s = Math.floor(sec % 60);
    return m + ":" + (s < 10 ? "0" : "") + s;
  }

  function getTrackSrc(track, voice) {
    return "assets/audio/" + voice + "/" + track.num + ".mp3";
  }

  function getMeditationSrc(track) {
    return "assets/audio/meditation/" + track.num + ".mp3";
  }

  function loadSavedVoice() {
    try {
      var v = localStorage.getItem(VOICE_KEY);
      if (v === "female" || v === "male") return v;
    } catch (e) {}
    return null;
  }

  function saveVoice(voice) {
    try {
      localStorage.setItem(VOICE_KEY, voice);
    } catch (e) {}
  }

  function getTrackCard(trackId) {
    if (!tracksRoot) return null;
    return tracksRoot.querySelector('.track-card[data-track-id="' + trackId + '"]');
  }

  function setCardPlaying(trackId, playing) {
    tracksRoot.querySelectorAll(".track-card").forEach(function (card) {
      var isActive = card.getAttribute("data-track-id") === trackId;
      card.classList.toggle("track-card--playing", isActive && playing);
      card.classList.toggle("track-card--active", isActive);
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

  function hideComplete() {
    if (completeEl) completeEl.hidden = true;
    if (feelMessageEl) feelMessageEl.hidden = true;
  }

  function showComplete() {
    if (completeEl) {
      completeEl.hidden = false;
      completeEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
    if (feelMessageEl) feelMessageEl.hidden = true;
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

  function stopOtherPlayers() {
    if (window.BreatheMeditationMusic && window.BreatheMeditationMusic.stopAll) {
      window.BreatheMeditationMusic.stopAll();
    }
  }

  function playTrack(trackId) {
    if (!selectedVoice) return;
    var track = TRACKS.find(function (t) {
      return t.id === trackId;
    });
    if (!track) return;

    stopOtherPlayers();
    hideComplete();

    if (activeTrackId && activeTrackId !== trackId) {
      setCardPlaying(activeTrackId, false);
    }

    activeTrackId = trackId;
    var src = getTrackSrc(track, selectedVoice);
    if (
      audioEl.getAttribute("data-track") !== trackId ||
      audioEl.getAttribute("data-voice") !== selectedVoice
    ) {
      audioEl.src = src;
      audioEl.setAttribute("data-track", trackId);
      audioEl.setAttribute("data-voice", selectedVoice);
    }
    audioEl.play().catch(function () {
      audioEl.src = getMeditationSrc(track);
      audioEl.setAttribute("data-track", trackId);
      audioEl.removeAttribute("data-voice");
      audioEl.play().catch(function () {});
    });
    setCardPlaying(trackId, true);
    startProgressLoop();
  }

  function buildTrackCard(track) {
    var article = document.createElement("article");
    article.className = "card track-card";
    article.setAttribute("data-track-id", track.id);

    article.innerHTML =
      '<div class="track-card__head">' +
      '  <span class="track-card__icon" aria-hidden="true">' + icon("headphones", 18) + "</span>" +
      '  <div class="track-card__text">' +
      '    <h4 class="track-card__title">' +
      track.title +
      "</h4>" +
      '    <p class="track-card__desc">' +
      track.desc +
      "</p>" +
      "  </div>" +
      "</div>" +
      '<div class="track-player">' +
      '  <div class="track-player__ring-wrap" hidden aria-hidden="true">' +
      '    <div class="track-player__ring"></div>' +
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

  function updateVoiceCards() {
    document.querySelectorAll(".voice-card").forEach(function (card) {
      var v = card.getAttribute("data-voice");
      card.classList.toggle("voice-card--selected", v === selectedVoice);
      var btn = card.querySelector(".voice-card__btn");
      if (btn) {
        btn.textContent = v === selectedVoice ? "Выбрано" : "Выбрать";
        btn.classList.toggle("btn--primary", v === selectedVoice);
        btn.classList.toggle("btn--outline", v !== selectedVoice);
      }
    });
  }

  function selectVoice(voice) {
    if (voice !== "female" && voice !== "male") return;
    var changed = selectedVoice !== voice;
    selectedVoice = voice;
    saveVoice(voice);
    updateVoiceCards();
    if (libraryEl) libraryEl.hidden = false;
    if (voiceLabelEl) {
      voiceLabelEl.innerHTML =
        icon(voice === "female" ? "person" : "person-alt", 18) +
        ' <span class="audiosupport-library__voice-text">' +
        voiceLabels[voice] +
        "</span>";
    }
    if (changed) stopPlayback();
    hideComplete();
    if (window.requestAnimationFrame && typeof refreshRevealObserver === "function") {
      requestAnimationFrame(refreshRevealObserver);
    } else if (window.BreatheAudioSupport && window.BreatheAudioSupport.refreshReveal) {
      window.BreatheAudioSupport.refreshReveal();
    }
  }

  function bindVoiceCards() {
    document.querySelectorAll(".voice-card").forEach(function (card) {
      var voice = card.getAttribute("data-voice");
      var btn = card.querySelector(".voice-card__btn");
      if (btn) {
        btn.addEventListener("click", function (e) {
          e.stopPropagation();
          selectVoice(voice);
        });
      }
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
      showComplete();
    });
    audioEl.addEventListener("pause", function () {
      if (activeTrackId && !audioEl.ended) updateTrackUi(activeTrackId);
    });
  }

  function init() {
    tracksRoot = document.getElementById("audiosupport-tracks");
    libraryEl = document.getElementById("audiosupport-library");
    completeEl = document.getElementById("audiosupport-complete");
    voiceLabelEl = document.getElementById("audiosupport-voice-label");
    feelMessageEl = document.getElementById("audiosupport-feel-message");

    renderTracks();
    bindVoiceCards();
    bindAudioEvents();

    var feelBtn = document.getElementById("audiosupport-feel-better");
    if (feelBtn) {
      feelBtn.addEventListener("click", function () {
        if (window.BreatheWellness) window.BreatheWellness.recordVictory();
        if (feelMessageEl) {
          feelMessageEl.textContent = "Каждая маленькая победа делает вас сильнее.";
          feelMessageEl.hidden = false;
          feelMessageEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }
      });
    }

    var saved = loadSavedVoice();
    if (saved) selectVoice(saved);
    else updateVoiceCards();
  }

  function onScreenShow() {
    hideComplete();
    if (selectedVoice && libraryEl) libraryEl.hidden = false;
  }

  window.BreatheAudioSupport = {
    onScreenShow: onScreenShow,
    stopAll: stopPlayback,
    refreshReveal: function () {
      if (typeof window.refreshRevealObserver === "function") {
        window.refreshRevealObserver();
      }
    }
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    setTimeout(init, 0);
  }
})();
