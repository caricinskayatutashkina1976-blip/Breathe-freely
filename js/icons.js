(function () {
  "use strict";

  var ICONS = {
    "arrow-left":
      '<path d="M19 12H5M12 19l-7-7 7-7"/>',
    "chevron-right":
      '<path d="M9 6l6 6-6 6"/>',
    trophy:
      '<path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 01-10 0V4zM5 4H3v2a2 2 0 002 2M19 4h2v2a2 2 0 01-2 2"/>',
    heart:
      '<path d="M12 20.5s-6.2-4.3-8.8-8.1C1.4 8.2 3.8 5.5 7 5.5c2 0 3.4 1.4 5 3.3 1.6-1.9 3-3.3 5-3.3 3.2 0 5.6 2.7 3.8 6.9-2.6 3.8-8.8 8.1-8.8 8.1z"/>',
    sprout:
      '<path d="M12 22V12M12 12C12 7 7 5 4 5c0 4 2 7 8 7M12 12c0-5 5-7 8-7 0 4-2 7-8 7"/>',
    medal:
      '<circle cx="12" cy="9" r="5"/><path d="M8.5 14L7 22l5-2.5L17 22l-1.5-8"/>',
    headphones:
      '<path d="M4 14v-2a8 8 0 0116 0v2"/><path d="M4 14a2 2 0 004 0v-2a2 2 0 00-4 0v2zM20 14a2 2 0 01-4 0v-2a2 2 0 014 0v2z"/>',
    leaf:
      '<path d="M6 20C14 20 20 14 20 6c-8 0-14 6-14 14z"/><path d="M6 20c4-4 8-10 14-14"/>',
    sparkle:
      '<path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1"/>',
    music:
      '<path d="M9 18V6l10-2v12"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="16" r="2"/>',
    play:
      '<polygon points="8,5 19,12 8,19"/>',
    pause:
      '<line x1="9" y1="6" x2="9" y2="18"/><line x1="15" y1="6" x2="15" y2="18"/>',
    stop:
      '<rect x="7" y="7" width="10" height="10" rx="1"/>',
    person:
      '<circle cx="12" cy="8" r="3.5"/><path d="M5 20c0-4 3.5-6.5 7-6.5s7 2.5 7 6.5"/>',
    "person-alt":
      '<circle cx="12" cy="7.5" r="3"/><path d="M6 20v-1.5c0-3 2.7-5 6-5s6 2 6 5V20"/>',
    sun:
      '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M2 12h2M20 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4"/>',
    "mood-good":
      '<circle cx="12" cy="12" r="9"/><path d="M8.5 14.5c1.2 1.2 2.8 1.8 3.5 1.8s2.3-.6 3.5-1.8"/>',
    "mood-ok":
      '<circle cx="12" cy="12" r="9"/><line x1="8.5" y1="15" x2="15.5" y2="15"/>',
    "mood-hard":
      '<circle cx="12" cy="12" r="9"/><path d="M8.5 16c1.2-1.2 2.8-1.8 3.5-1.8s2.3.6 3.5 1.8"/>',
    cloud:
      '<path d="M18 18H8a4 4 0 010-8 5.5 5.5 0 0110.6-1.8A3.5 3.5 0 0118 18z"/>',
    star:
      '<path d="M12 2l2.4 5.8 6.3.5-4.8 4.1 1.5 6.1L12 16.8 6.6 18.5l1.5-6.1L3.3 8.3l6.3-.5z"/>',
    check:
      '<path d="M5 12l4 4L19 6"/>',
    wave:
      '<path d="M3 14c2-2 4-2 6 0s4 2 6 0 4-2 6 0"/>'
  };

  function svg(name, size) {
    var paths = ICONS[name];
    if (!paths) return "";
    var s = size || 24;
    return (
      '<svg width="' +
      s +
      '" height="' +
      s +
      '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      paths +
      "</svg>"
    );
  }

  function render(name, opts) {
    opts = opts || {};
    var extra = opts.className ? " " + opts.className : "";
    var size = opts.size || 24;
    return '<span class="icon' + extra + '">' + svg(name, size) + "</span>";
  }

  function hydrate(root) {
    var scope = root || document;
    scope.querySelectorAll("[data-icon]").forEach(function (el) {
      var name = el.getAttribute("data-icon");
      if (!name || !ICONS[name]) return;
      var size = parseInt(el.getAttribute("data-icon-size"), 10) || 24;
      el.innerHTML = svg(name, size);
      el.classList.add("icon");
      var sizeClass = el.getAttribute("data-icon-class");
      if (sizeClass) el.classList.add(sizeClass);
    });
  }

  window.BreatheIcons = {
    svg: svg,
    render: render,
    hydrate: hydrate
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      hydrate();
    });
  } else {
    hydrate();
  }
})();
