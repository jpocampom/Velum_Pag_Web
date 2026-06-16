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
    var stage = doc.querySelector(".hero__bg");
    if (!stage) return;
    var vids = Array.prototype.slice.call(stage.querySelectorAll(".hero__vid"));
    if (!vids.length) return;
    vids.forEach(function (v) { v.muted = true; v.preload = "auto"; });
    var playFirst = vids[0].play();
    if (playFirst && playFirst.catch) playFirst.catch(function () {});
    if (prefersReduce || vids.length < 2) return;
    var idx = 0;
    var PERIOD = 6500;
    window.setInterval(function () {
      var next = (idx + 1) % vids.length;
      var nv = vids[next];
      try { nv.currentTime = 0; } catch (e) {}
      var p = nv.play();
      if (p && p.catch) p.catch(function () {});
      nv.classList.add("is-active");
      var prev = idx;
      vids[prev].classList.remove("is-active");
      idx = next;
      window.setTimeout(function () {
        if (idx !== prev) { try { vids[prev].pause(); } catch (e) {} }
      }, 1500);
    }, PERIOD);
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
     Cookie consent — AEPD/RGPD compliant gating.
     No non-essential scripts run until the user consents. Choice is
     stored in localStorage; reject is as easy as accept.
     ===================================================================== */
  var CONSENT_KEY = "velum_cookie_consent_v1";
  var banner = doc.querySelector(".cookie-banner");

  function readConsent() {
    try { return JSON.parse(localStorage.getItem(CONSENT_KEY) || "null"); }
    catch (e) { return null; }
  }
  function writeConsent(value) {
    try {
      localStorage.setItem(
        CONSENT_KEY,
        JSON.stringify({ v: value, ts: new Date().toISOString() })
      );
    } catch (e) {}
  }
  function hideBanner() { if (banner) banner.removeAttribute("data-show"); }
  function showBanner() { if (banner) banner.setAttribute("data-show", ""); }

  function loadAnalytics() {
    // Placeholder: the integrator drops the consented analytics loader
    // here. Example (commented):
    // var s = doc.createElement("script");
    // s.src = "https://www.googletagmanager.com/gtag/js?id=G-XXXXXXX";
    // s.async = true; doc.head.appendChild(s);
    root.setAttribute("data-analytics", "granted");
  }

  function applyConsent(value) {
    if (value === "all") loadAnalytics();
  }

  if (banner) {
    var existing = readConsent();
    if (existing && existing.v) {
      applyConsent(existing.v);
    } else {
      // Defer a touch so it animates in after first paint.
      window.setTimeout(showBanner, 900);
    }
    banner.querySelectorAll("[data-consent]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var v = btn.getAttribute("data-consent"); // 'all' | 'reject' | 'configure'
        if (v === "configure") {
          // Minimal: treat configure as "necessary only" for the static
          // build; a full CMP panel is the integrator's next step.
          v = "reject";
        }
        writeConsent(v);
        applyConsent(v);
        hideBanner();
      });
    });
  }

  // Re-open consent from a footer "cookie settings" link
  doc.querySelectorAll("[data-cookie-settings]").forEach(function (el) {
    el.addEventListener("click", function (e) {
      e.preventDefault();
      showBanner();
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
