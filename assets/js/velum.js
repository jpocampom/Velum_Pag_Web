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
  function onScroll() {
    if (!header) return;
    if (window.scrollY > 24) header.classList.add("scrolled");
    else header.classList.remove("scrolled");
  }
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

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

  /* ---------- Sector carousels (crossfade, auto + dots) ---------- */
  doc.querySelectorAll("[data-carousel]").forEach(function (car) {
    var slides = car.querySelectorAll(".sector-carousel__slide");
    var dots = car.querySelectorAll(".sector-carousel__dot");
    if (slides.length < 2) return;
    var idx = 0;
    var timer = null;

    function show(n) {
      n = (n + slides.length) % slides.length;
      slides[idx].classList.remove("is-active");
      if (dots[idx]) { dots[idx].classList.remove("is-active"); dots[idx].removeAttribute("aria-selected"); }
      idx = n;
      slides[idx].classList.add("is-active");
      if (dots[idx]) { dots[idx].classList.add("is-active"); dots[idx].setAttribute("aria-selected", "true"); }
    }
    function start() {
      if (reduceMotion) return;
      stop();
      timer = window.setInterval(function () { show(idx + 1); }, 4800);
    }
    function stop() { if (timer) { window.clearInterval(timer); timer = null; } }

    dots.forEach(function (d, i) {
      d.addEventListener("click", function () { show(i); start(); });
    });
    car.addEventListener("mouseenter", stop);
    car.addEventListener("mouseleave", start);
    start();
  });

  /* ---------- Year in footer ---------- */
  doc.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = String(new Date().getFullYear());
  });
})();
