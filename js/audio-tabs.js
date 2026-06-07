(function () {
  "use strict";

  var TAB_KEY = "breatheFreelyAudioTab";
  var currentTab = "voices";

  var heroCopy = {
    voices: {
      eyebrow: "Пространство спокойствия",
      title: "Голоса поддержки",
      lead: "Выберите голос, который поможет вам пройти этот момент спокойно."
    },
    meditation: {
      eyebrow: "Пространство тишины",
      title: "Музыка для медитации и расслабления",
      lead: "Атмосферные композиции — лес, туман, горы и сон. Выберите звук под ваш момент."
    }
  };

  var tabsRoot = null;
  var panelVoices = null;
  var panelMeditation = null;
  var heroEyebrow = null;
  var heroTitle = null;
  var heroLead = null;
  var heroMistMeditation = null;

  function loadSavedTab() {
    try {
      var t = localStorage.getItem(TAB_KEY);
      if (t === "voices" || t === "meditation") return t;
    } catch (e) {}
    return "voices";
  }

  function saveTab(tab) {
    try {
      localStorage.setItem(TAB_KEY, tab);
    } catch (e) {}
  }

  function stopTabPlayer(tab) {
    if (tab === "voices" && window.BreatheAudioSupport && window.BreatheAudioSupport.stopAll) {
      window.BreatheAudioSupport.stopAll();
    }
    if (tab === "meditation" && window.BreatheMeditationMusic && window.BreatheMeditationMusic.stopAll) {
      window.BreatheMeditationMusic.stopAll();
    }
  }

  function updateHero(tab) {
    var copy = heroCopy[tab];
    if (!copy) return;
    if (heroEyebrow) heroEyebrow.textContent = copy.eyebrow;
    if (heroTitle) heroTitle.textContent = copy.title;
    if (heroLead) heroLead.textContent = copy.lead;
    if (heroMistMeditation) heroMistMeditation.hidden = tab !== "meditation";
  }

  function setTab(tab, opts) {
    opts = opts || {};
    if (tab !== "voices" && tab !== "meditation") return;

    if (!opts.silent && currentTab !== tab) {
      stopTabPlayer(currentTab);
    }

    currentTab = tab;
    if (!opts.skipSave) saveTab(tab);

    if (tabsRoot) {
      tabsRoot.querySelectorAll("[data-audio-tab]").forEach(function (btn) {
        var active = btn.getAttribute("data-audio-tab") === tab;
        btn.classList.toggle("is-active", active);
        btn.setAttribute("aria-selected", active ? "true" : "false");
      });
    }

    if (panelVoices) panelVoices.hidden = tab !== "voices";
    if (panelMeditation) panelMeditation.hidden = tab !== "meditation";

    updateHero(tab);

    if (tab === "meditation" && window.BreatheMeditationMusic && window.BreatheMeditationMusic.onScreenShow) {
      window.BreatheMeditationMusic.onScreenShow();
    }
    if (tab === "voices" && window.BreatheAudioSupport && window.BreatheAudioSupport.onScreenShow) {
      window.BreatheAudioSupport.onScreenShow();
    }

    if (window.BreatheIcons && window.BreatheIcons.hydrate) {
      window.BreatheIcons.hydrate(tabsRoot);
    }
    if (typeof window.refreshRevealObserver === "function") {
      requestAnimationFrame(window.refreshRevealObserver);
    }
  }

  function bindTabs() {
    if (!tabsRoot) return;
    tabsRoot.querySelectorAll("[data-audio-tab]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        setTab(btn.getAttribute("data-audio-tab"));
      });
    });
  }

  function init() {
    tabsRoot = document.getElementById("audio-tabs");
    panelVoices = document.getElementById("audio-tab-voices");
    panelMeditation = document.getElementById("audio-tab-meditation");
    heroEyebrow = document.getElementById("audio-hero-eyebrow");
    heroTitle = document.getElementById("audio-hero-title");
    heroLead = document.getElementById("audio-hero-lead");
    heroMistMeditation = document.getElementById("audio-hero-mist-meditation");

    bindTabs();
    setTab(loadSavedTab(), { skipSave: true, silent: true });
  }

  function onScreenShow(preferredTab) {
    if (preferredTab === "voices" || preferredTab === "meditation") {
      setTab(preferredTab);
      return;
    }
    setTab(loadSavedTab(), { skipSave: true, silent: true });
  }

  window.BreatheAudioTabs = {
    setTab: setTab,
    getTab: function () {
      return currentTab;
    },
    onScreenShow: onScreenShow
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    setTimeout(init, 0);
  }
})();
