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
  if (toggle) {
    toggle.addEventListener("click", function () {
      var open = doc.body.classList.toggle("nav-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    // Close the menu when a nav link is chosen
    doc.querySelectorAll(".nav a").forEach(function (a) {
      a.addEventListener("click", function () {
        doc.body.classList.remove("nav-open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }

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

  /* ---------- Year in footer ---------- */
  doc.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = String(new Date().getFullYear());
  });
})();
