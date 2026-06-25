/* =====================================================================
   VELUM — front-end behaviour
   Vanilla JS, no dependencies. Progressive enhancement: the site is
   fully readable with JS disabled.
   ===================================================================== */
(function () {
  "use strict";
  var doc = document;
  var root = doc.documentElement;

  /* ---------- Header: solid on scroll ---------- */
  var header = doc.querySelector(".site-header");
  var heroVideo = doc.querySelector(".hero--video");
  function onScroll() {
    if (!header) return;
    var scrolled = window.scrollY > 24;
    header.classList.toggle("scrolled", scrolled);
    // Over the video hero (home, at top) the header floats on a dark backdrop.
    if (heroVideo) header.classList.toggle("over-hero", !scrolled);
  }
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  /* ---------- Hero portada: crossfade de vídeos + entrada por caracteres ---------- */
  var prefersReduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  (function heroVideoRotate() {
    var stages = doc.querySelectorAll(".hero__bg");
    if (!stages.length) return;
    var heroMq = window.matchMedia("(max-width: 980px)");
    var timer = null;
    function visibleStage() {
      for (var i = 0; i < stages.length; i++) {
        if (stages[i].offsetParent !== null) return stages[i];
      }
      return stages[0];
    }
    function setup() {
      if (timer) { window.clearInterval(timer); timer = null; }
      var stage = visibleStage();
      // Pause clips in the hidden stack(s)
      stages.forEach(function (s) {
        if (s !== stage) s.querySelectorAll(".hero__vid").forEach(function (v) { try { v.pause(); } catch (e) {} });
      });
      var vids = Array.prototype.slice.call(stage.querySelectorAll(".hero__vid"));
      if (!vids.length) return;
      // Preload the whole (lightweight) visible stack so crossfades never show a blank frame.
      vids.forEach(function (v, i) { v.muted = true; v.preload = "auto"; if (i !== 0) { try { v.load(); } catch (e) {} } v.classList.toggle("is-active", i === 0); });
      var p = vids[0].play();
      if (p && p.catch) p.catch(function () {});
      if (prefersReduce || vids.length < 2) return;
      var idx = 0;
      timer = window.setInterval(function () {
        var next = (idx + 1) % vids.length;
        var nv = vids[next];
        vids[(next + 1) % vids.length].preload = "auto"; // warm up the upcoming clip
        try { nv.currentTime = 0; } catch (e) {}
        var pp = nv.play();
        if (pp && pp.catch) pp.catch(function () {});
        nv.classList.add("is-active");
        var prev = idx;
        vids[prev].classList.remove("is-active");
        idx = next;
        window.setTimeout(function () {
          if (idx !== prev) { try { vids[prev].pause(); } catch (e) {} }
        }, 1500);
      }, 6500);
    }
    setup();
    if (heroMq.addEventListener) heroMq.addEventListener("change", setup);
  })();

  (function animateHeroTitle() {
    var title = doc.querySelector(".hero__title[data-chars]");
    if (!title) return;
    if (prefersReduce) { title.classList.add("is-in"); return; }
    var CHAR = 26, counter = { n: 0 };
    function emitText(text, dest) {
      text.split(/(\s+)/).forEach(function (tok) {
        if (tok === "") return;
        if (/^\s+$/.test(tok)) { dest.appendChild(doc.createTextNode(" ")); return; }
        var w = doc.createElement("span"); w.className = "word";
        for (var i = 0; i < tok.length; i++) {
          var s = doc.createElement("span");
          s.className = "char";
          s.textContent = tok.charAt(i);
          s.style.transitionDelay = (counter.n++ * CHAR) + "ms";
          w.appendChild(s);
        }
        dest.appendChild(w);
      });
    }
    function walk(src, dest) {
      Array.prototype.slice.call(src.childNodes).forEach(function (node) {
        if (node.nodeType === 3) emitText(node.textContent, dest);
        else if (node.nodeName === "BR") dest.appendChild(doc.createElement("br"));
        else { var clone = node.cloneNode(false); dest.appendChild(clone); walk(node, clone); }
      });
    }
    var frag = doc.createDocumentFragment();
    walk(title, frag);
    title.textContent = "";
    title.appendChild(frag);
    window.setTimeout(function () { title.classList.add("is-in"); }, 200);
  })();

  /* ---------- Mobile nav toggle ---------- */
  var toggle = doc.querySelector(".nav-toggle");
  var navEl = doc.querySelector(".nav");
  var mqMobile = window.matchMedia("(max-width: 980px)");

  // Keep off-screen mobile menu links out of the tab order / AT tree
  // when the menu is closed (real a11y fix), without affecting desktop.
  function syncNavInert() {
    if (!navEl) return;
    var closedMobile = mqMobile.matches && !doc.body.classList.contains("nav-open");
    try { navEl.inert = closedMobile; } catch (e) {}
    navEl.setAttribute("aria-hidden", closedMobile ? "true" : "false");
  }

  function setNav(open) {
    doc.body.classList.toggle("nav-open", open);
    if (toggle) toggle.setAttribute("aria-expanded", open ? "true" : "false");
    syncNavInert();
    if (open && navEl) {
      var first = navEl.querySelector("a");
      if (first) first.focus();
    } else if (toggle) {
      toggle.focus();
    }
  }

  if (toggle) {
    toggle.addEventListener("click", function () {
      setNav(!doc.body.classList.contains("nav-open"));
    });
    doc.querySelectorAll(".nav a").forEach(function (a) {
      a.addEventListener("click", function () {
        doc.body.classList.remove("nav-open");
        toggle.setAttribute("aria-expanded", "false");
        syncNavInert();
      });
    });
  }
  // Escape closes the mobile menu and restores focus to the toggle
  doc.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && doc.body.classList.contains("nav-open")) setNav(false);
  });
  if (mqMobile.addEventListener) mqMobile.addEventListener("change", syncNavInert);
  window.addEventListener("resize", syncNavInert, { passive: true });
  syncNavInert();

  /* ---------- Scroll reveal ---------- */
  var reveals = doc.querySelectorAll("[data-reveal]");
  if ("IntersectionObserver" in window && reveals.length) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
    );
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("in"); });
  }

  /* ---------- Pointer highlight: draw box + cursor when in view ---------- */
  var highlights = doc.querySelectorAll(".ph");
  if ("IntersectionObserver" in window && highlights.length) {
    var phio = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) { e.target.classList.add("is-on"); phio.unobserve(e.target); }
        });
      },
      { threshold: 0.75 }
    );
    highlights.forEach(function (el) { phio.observe(el); });
  } else {
    highlights.forEach(function (el) { el.classList.add("is-on"); });
  }

  /* ---------- Gallery carousel: switch sector ---------- */
  doc.querySelectorAll(".carousel").forEach(function (car) {
    var tabs = car.querySelectorAll(".car-tab");
    var panels = car.querySelectorAll(".car-track");
    tabs.forEach(function (tab) {
      tab.addEventListener("click", function () {
        var key = tab.getAttribute("data-car");
        tabs.forEach(function (t) {
          var on = t === tab;
          t.classList.toggle("is-active", on);
          t.setAttribute("aria-selected", on ? "true" : "false");
        });
        panels.forEach(function (p) {
          p.classList.toggle("is-active", p.getAttribute("data-car-panel") === key);
        });
      });
    });
  });

  /* ---------- Active section in nav ---------- */
  var sections = doc.querySelectorAll("section[id]");
  var navLinks = doc.querySelectorAll(".nav a.nav-link");
  if ("IntersectionObserver" in window && sections.length && navLinks.length) {
    var map = {};
    navLinks.forEach(function (a) {
      var id = (a.getAttribute("href") || "").replace(/^.*#/, "");
      if (id) map[id] = a;
    });
    var spy = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (e) {
          var a = map[e.target.id];
          if (!a) return;
          if (e.isIntersecting) {
            navLinks.forEach(function (l) { l.removeAttribute("data-active"); });
            a.setAttribute("data-active", "true");
          }
        });
      },
      { rootMargin: "-45% 0px -50% 0px" }
    );
    sections.forEach(function (s) { spy.observe(s); });
  }

  /* ---------- Mobile dock: highlight the section in view ---------- */
  var dockItems = doc.querySelectorAll(".mobile-dock .dock-item");
  if ("IntersectionObserver" in window && dockItems.length && sections.length) {
    var dockMap = {};
    dockItems.forEach(function (a) {
      var id = a.getAttribute("data-dock");
      if (id) dockMap[id] = a;
    });
    function setDock(id) {
      dockItems.forEach(function (a) {
        a.classList.toggle("is-active", a.getAttribute("data-dock") === id);
      });
    }
    var dockSpy = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting && dockMap[e.target.id]) setDock(e.target.id);
        });
      },
      { rootMargin: "-45% 0px -50% 0px" }
    );
    sections.forEach(function (s) { if (dockMap[s.id]) dockSpy.observe(s); });
    setDock("top");
  }

  /* ---------- Contact form (front-end demo handling) ---------- */
  var form = doc.querySelector(".form");
  if (form) {
    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }
      // No backend in the static build — surface success and let the
      // integrator wire a real endpoint (mailto / form service / API).
      form.classList.add("sent");
      var ok = form.querySelector(".form-success");
      if (ok) { ok.setAttribute("tabindex", "-1"); ok.focus(); }
    });
  }

  /* =====================================================================
     Cookie consent — AEPD/RGPD compliant + Google Consent Mode v2.
     No non-essential scripts (GA4) run until the user consents. Consent
     defaults to DENIED before any tag loads; reject is as easy as accept.
     Choice is stored in localStorage and expires after 365 days.
     ===================================================================== */

  // --- Google Consent Mode v2: deny everything by default, before any load.
  window.dataLayer = window.dataLayer || [];
  function gtag() { dataLayer.push(arguments); }
  gtag("consent", "default", {
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
    analytics_storage: "denied",
    functionality_storage: "granted",
    security_storage: "granted",
    wait_for_update: 500
  });

  // ┌──────────────────────────────────────────────────────────────────┐
  // │ CLIENTE: sustituye este valor por tu ID real de GA4 (formato      │
  // │ 'G-XXXXXXXXXX'). Mientras valga el placeholder, GA NO se carga     │
  // │ aunque el usuario consienta.                                       │
  // └──────────────────────────────────────────────────────────────────┘
  var GA_MEASUREMENT_ID = "G-XXXXXXXXXX";

  var CONSENT_KEY = "velum_cookie_consent_v2";
  var CONSENT_MAX_AGE_DAYS = 365;
  var BANNER_DELAY_MS = 900;

  var banner = doc.querySelector(".cookie-banner");
  var panel = doc.querySelector("[data-cookie-panel]");
  var panelBox = panel ? panel.querySelector(".cookie-panel__box") : null;
  var analyticsToggle = doc.getElementById("ck-analytics");
  var gaLoaded = false;
  var lastFocus = null;

  function gaIdIsReal() {
    return /^G-[A-Z0-9]{6,}$/.test(GA_MEASUREMENT_ID) &&
           GA_MEASUREMENT_ID !== "G-XXXXXXXXXX";
  }

  function readConsent() {
    var raw;
    try { raw = JSON.parse(localStorage.getItem(CONSENT_KEY) || "null"); }
    catch (e) { return null; }
    if (!raw || raw.v !== 2 || typeof raw.analytics !== "boolean" || !raw.ts) {
      return null;
    }
    // Expire stale consent → ask again.
    var ageMs = Date.now() - new Date(raw.ts).getTime();
    if (isNaN(ageMs) || ageMs > CONSENT_MAX_AGE_DAYS * 864e5) return null;
    return raw;
  }

  function writeConsent(analytics) {
    try {
      localStorage.setItem(CONSENT_KEY, JSON.stringify({
        analytics: !!analytics,
        ts: new Date().toISOString(),
        v: 2
      }));
    } catch (e) {}
  }

  function loadGA() {
    if (gaLoaded || !gaIdIsReal()) return;
    gaLoaded = true;
    var s = doc.createElement("script");
    s.async = true;
    s.src = "https://www.googletagmanager.com/gtag/js?id=" +
            encodeURIComponent(GA_MEASUREMENT_ID);
    doc.head.appendChild(s);
    gtag("js", new Date());
    gtag("config", GA_MEASUREMENT_ID, { anonymize_ip: true });
  }

  function applyConsent(analytics) {
    if (analytics) {
      gtag("consent", "update", { analytics_storage: "granted" });
      root.setAttribute("data-analytics", "granted");
      loadGA();
    } else {
      gtag("consent", "update", { analytics_storage: "denied" });
      root.setAttribute("data-analytics", "denied");
    }
  }

  /* ---------- Banner show/hide ---------- */
  function showBanner() {
    if (!banner) return;
    banner.setAttribute("data-show", "");
    banner.setAttribute("aria-hidden", "false");
  }
  function hideBanner() {
    if (!banner) return;
    banner.removeAttribute("data-show");
    banner.setAttribute("aria-hidden", "true");
  }

  /* ---------- Preferences panel open/close ---------- */
  function openPanel() {
    if (!panel) return;
    lastFocus = doc.activeElement;
    // Prefill the toggle with the saved preference (or false).
    var saved = readConsent();
    if (analyticsToggle) analyticsToggle.checked = !!(saved && saved.analytics);
    panel.removeAttribute("hidden");
    panel.classList.add("is-open");
    (panelBox || panel).setAttribute("tabindex", "-1");
    (panelBox || panel).focus();
  }
  function closePanel() {
    if (!panel) return;
    panel.classList.remove("is-open");
    panel.setAttribute("hidden", "");
    if (lastFocus && typeof lastFocus.focus === "function") {
      lastFocus.focus();
    }
    lastFocus = null;
  }

  // Commit a choice from any control: persist, apply, close UI.
  function commitConsent(analytics) {
    writeConsent(analytics);
    applyConsent(analytics);
    closePanel();
    hideBanner();
  }

  /* ---------- Initial load ---------- */
  var existing = readConsent();
  if (existing) {
    applyConsent(existing.analytics); // silent
  } else {
    // No valid consent → deny stays in effect; surface the banner after paint.
    window.setTimeout(showBanner, BANNER_DELAY_MS);
  }

  /* ---------- Banner buttons ---------- */
  if (banner) {
    banner.querySelectorAll("[data-consent]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var v = btn.getAttribute("data-consent"); // 'all'|'reject'|'configure'
        if (v === "all") {
          commitConsent(true);
        } else if (v === "reject") {
          commitConsent(false);
        } else if (v === "configure") {
          openPanel(); // openPanel syncs the toggle with current state
        }
      });
    });
  }

  /* ---------- Panel buttons ---------- */
  if (panel) {
    panel.querySelectorAll("[data-consent]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var v = btn.getAttribute("data-consent"); // 'save'|'reject'|'all'
        var analytics;
        if (v === "save") {
          analytics = !!(analyticsToggle && analyticsToggle.checked);
        } else if (v === "all") {
          analytics = true;
          if (analyticsToggle) analyticsToggle.checked = true;
        } else { // reject
          analytics = false;
          if (analyticsToggle) analyticsToggle.checked = false;
        }
        commitConsent(analytics);
      });
    });

    // Close controls (× button + backdrop): close panel ONLY. If there is no
    // prior consent, the banner stays so the user can still choose.
    panel.querySelectorAll("[data-cookie-close]").forEach(function (el) {
      el.addEventListener("click", function (e) {
        e.preventDefault();
        closePanel();
        if (!readConsent() && banner && !banner.hasAttribute("data-show")) {
          showBanner();
        }
      });
    });

    // Escape closes the panel only.
    doc.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && panel.classList.contains("is-open")) {
        closePanel();
        if (!readConsent() && banner && !banner.hasAttribute("data-show")) {
          showBanner();
        }
      }
    });
  }

  /* ---------- Footer "cookie settings" link → reopen panel ---------- */
  doc.querySelectorAll("[data-cookie-settings]").forEach(function (el) {
    el.addEventListener("click", function (e) {
      e.preventDefault();
      openPanel();
    });
  });

  /* ---------- Scroll progress bar + back-to-top ---------- */
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var lang = (root.getAttribute("lang") || "es").slice(0, 2);
  var TOP_LABEL = { es: "Volver arriba", en: "Back to top", pt: "Voltar ao topo" }[lang] || "Top";

  var progress = doc.createElement("div");
  progress.className = "scroll-progress";
  progress.setAttribute("aria-hidden", "true");
  doc.body.appendChild(progress);

  var toTop = doc.createElement("button");
  toTop.className = "to-top";
  toTop.type = "button";
  toTop.setAttribute("aria-label", TOP_LABEL);
  toTop.innerHTML = '<span aria-hidden="true">↑</span>';
  doc.body.appendChild(toTop);
  toTop.addEventListener("click", function () {
    window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
    var logo = doc.querySelector(".site-header .logo-lockup");
    if (logo) logo.focus({ preventScroll: true });
  });

  function onScrollUI() {
    var de = doc.documentElement;
    var max = de.scrollHeight - de.clientHeight;
    var y = window.scrollY || de.scrollTop;
    progress.style.transform = "scaleX(" + (max > 0 ? (y / max).toFixed(4) : 0) + ")";
    toTop.classList.toggle("show", y > 640);
  }
  window.addEventListener("scroll", onScrollUI, { passive: true });
  onScrollUI();

  /* ---------- Year in footer ---------- */
  doc.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = String(new Date().getFullYear());
  });
})();
