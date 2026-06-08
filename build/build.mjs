/* =====================================================================
   VELUM static-site generator — zero runtime dependencies.
   Reads build/content/{lang}.json + build/content/legal/{lang}/*.html
   and emits localized, fully-static pages at the repo root.
   Run: node build/build.mjs
   ===================================================================== */
import { readFileSync, writeFileSync, mkdirSync, cpSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const CONTENT = resolve(__dirname, "content");

/* ---------- Site config ---------- */
const DOMAIN = "https://velum.es";
const LANGS = ["es", "en", "pt"];
const HREFLANG = { es: "es-ES", en: "en", pt: "pt-PT" };
const OGLOCALE = { es: "es_ES", en: "en_GB", pt: "pt_PT" };

// Canonical page → per-language URL path
const ROUTES = {
  home:       { es: "/",                         en: "/en/",                  pt: "/pt/" },
  servicios:  { es: "/servicios/",               en: "/en/services/",         pt: "/pt/servicos/" },
  sectores:   { es: "/sectores/",                en: "/en/sectors/",          pt: "/pt/setores/" },
  aviso:      { es: "/aviso-legal/",             en: "/en/legal-notice/",     pt: "/pt/aviso-legal/" },
  privacidad: { es: "/politica-de-privacidad/",  en: "/en/privacy-policy/",   pt: "/pt/politica-de-privacidade/" },
  cookies:    { es: "/politica-de-cookies/",     en: "/en/cookie-policy/",    pt: "/pt/politica-de-cookies/" }
};
const LEGAL_FILE = { aviso: "aviso-legal", privacidad: "privacidad", cookies: "cookies" };

/* ---------- Helpers ---------- */
const read = (p) => readFileSync(p, "utf8");
const load = (lang) => JSON.parse(read(resolve(CONTENT, lang + ".json")));
const legalBody = (lang, file) => read(resolve(CONTENT, "legal", lang, file + ".html"));

/* Content-hash cache busting: query string changes whenever the asset
   changes, so returning visitors always fetch the latest CSS/JS even
   though the path stays stable. */
const assetVer = (rel) =>
  createHash("sha1").update(readFileSync(resolve(ROOT, rel))).digest("hex").slice(0, 8);
const CSS_V = assetVer("assets/css/velum.css");
const JS_V = assetVer("assets/js/velum.js");

function writeOut(urlPath, html) {
  const rel = urlPath === "/" ? "index.html" : urlPath.replace(/^\/|\/$/g, "") + "/index.html";
  const abs = resolve(ROOT, rel);
  mkdirSync(dirname(abs), { recursive: true });
  writeFileSync(abs, html, "utf8");
  return rel;
}

/* ---------- Tejido logo (W1 Base, 2×2 plain weave, thread texture) ----------
   Geometry ported exactly from the design source tejido-variants.jsx (W1Base):
   sw=2.2, d=3.5, g=9 — each strand is a pair of parallel hairlines (yarn). */
function weaveLines() {
  const d = 3.5, g = 9;
  const V = [
    { x: 30, segs: [[6, 36 - g], [36 + g, 94]] },
    { x: 70, segs: [[6, 64 - g], [64 + g, 94]] }
  ];
  const H = [
    { y: 36, segs: [[6, 70 - g], [70 + g, 94]] },
    { y: 64, segs: [[6, 30 - g], [30 + g, 94]] }
  ];
  const out = [];
  V.forEach((v) => v.segs.forEach(([y1, y2]) => {
    out.push([v.x - d, y1, v.x - d, y2]);
    out.push([v.x + d, y1, v.x + d, y2]);
  }));
  H.forEach((h) => h.segs.forEach(([x1, x2]) => {
    out.push([x1, h.y - d, x2, h.y - d]);
    out.push([x1, h.y + d, x2, h.y + d]);
  }));
  return out.map((l) => `<line x1="${l[0]}" y1="${l[1]}" x2="${l[2]}" y2="${l[3]}"/>`).join("");
}
function weaveSVG({ cls = "", stroke = "currentColor", sw = 2.2, label = "VELUM", role = "decorative" } = {}) {
  const a11y = role === "decorative"
    ? 'aria-hidden="true"'
    : `role="img" aria-label="${label}"`;
  return `<svg ${a11y} class="${cls}" viewBox="0 0 100 100" fill="none" stroke="${stroke}" stroke-width="${sw}" stroke-linecap="square">${weaveLines()}</svg>`;
}

/* ---------- Service icons (24×24 line) ---------- */
const ICONS = {
  rent: '<path d="M3 9.5 12 4l9 5.5M5 8.5V20h14V8.5M9.5 20v-5h5v5" />',
  wash: '<circle cx="12" cy="13" r="6.5"/><circle cx="12" cy="13" r="2.6"/><path d="M5 4h14M8 4v3"/>',
  logistics: '<path d="M2 7h11v9H2zM13 10h5l3 3v3h-8zM6.5 18.5a1.6 1.6 0 1 0 0-.1M17.5 18.5a1.6 1.6 0 1 0 0-.1"/>',
  custom: '<path d="M4 18 14 8M14 8l2-2a2.8 2.8 0 0 1 4 4l-2 2M14 8l4 4M5.5 19.5l-2 .5.5-2"/>',
  rfid: '<path d="M5 9a10 10 0 0 1 0 6M8.5 7a14 14 0 0 1 0 10M12 5.5v13M15.5 7a14 14 0 0 0 0 10M19 9a10 10 0 0 0 0 6"/>'
};
const icon = (name) => `<svg class="svc-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ""}</svg>`;

/* ---------- Shared chrome ---------- */
function langSwitch(c, routeId) {
  const links = LANGS.map((l) => {
    const url = ROUTES[routeId][l];
    const cur = l === c.lang ? ' aria-current="true"' : "";
    return `<a href="${url}" lang="${l}" hreflang="${HREFLANG[l]}"${cur}>${l.toUpperCase()}</a>`;
  }).join('<span class="sep" aria-hidden="true">·</span>');
  return `<div class="lang-switch" role="group" aria-label="Idioma">${links}</div>`;
}

function header(c, routeId) {
  const onHome = routeId === "home";
  const homeUrl = ROUTES.home[c.lang];
  const navItems = c.nav.items.map((i) => {
    const href = i.route ? ROUTES[i.route][c.lang] : (onHome ? i.href : homeUrl + i.href);
    return `<a class="nav-link" href="${href}">${i.label}</a>`;
  }).join("");
  const ctaHref = onHome ? "#contacto" : homeUrl + "#contacto";
  return `<header class="site-header">
  <div class="wrap">
    <a class="logo-lockup" href="${homeUrl}" aria-label="VELUM — ${c.backHome}">
      ${weaveSVG({ cls: "mark", role: "img", label: "VELUM" })}
      <span class="wm">VELUM</span>
    </a>
    <nav class="nav" id="primary-nav" aria-label="Principal">
      ${navItems}
      <div class="nav-cta-wrap">${langSwitch(c, routeId)}</div>
      <a class="btn btn--primary nav-cta-mobile" href="${ctaHref}">${c.nav.cta}</a>
    </nav>
    <div class="header-actions">
      ${langSwitch(c, routeId)}
      <a class="btn btn--primary" href="${ctaHref}">${c.nav.cta} <span class="arr" aria-hidden="true">→</span></a>
      <button class="nav-toggle" type="button" aria-label="${c.nav.menu}" aria-expanded="false" aria-controls="primary-nav"><span></span></button>
    </div>
  </div>
</header>`;
}

function footer(c, routeId) {
  const ll = c.legalLinks;
  const groups = c.footer.groups.map((g) => {
    const base = routeId === "home" ? "" : ROUTES.home[c.lang];
    const links = g.links.map((x) => `<a href="${base}${x.href}">${x.label}</a>`).join("");
    return `<div class="footer-col"><h4>${g.title}</h4>${links}</div>`;
  }).join("");
  return `<footer class="site-footer">
  <div class="wrap">
    <div class="footer-top">
      <div class="footer-brand">
        <a class="logo-lockup" href="${ROUTES.home[c.lang]}" aria-label="VELUM">${weaveSVG({ cls: "mark", stroke: "var(--paper)", role: "img", label: "VELUM" })}<span class="wm">VELUM</span></a>
        <p>${c.footer.descriptor}</p>
      </div>
      ${groups}
    </div>
    <div class="footer-bottom">
      <span class="footer-tagline">${c.brand.tagline}</span>
      <div class="legal-links">
        <a href="${ll.aviso.href}">${ll.aviso.label}</a>
        <a href="${ll.privacidad.href}">${ll.privacidad.label}</a>
        <a href="${ll.cookies.href}">${ll.cookies.label}</a>
        <a href="#" data-cookie-settings>${c.footer.cookieSettings}</a>
      </div>
      <span>© <span data-year>2026</span> ${c.footer.copyright}</span>
    </div>
  </div>
</footer>`;
}

function cookieBanner(c) {
  return `<aside class="cookie-banner" role="dialog" aria-live="polite" aria-label="${c.cookies.title}">
  <div>
    <strong style="display:block;font-family:var(--serif);font-size:19px;margin-bottom:6px;">${c.cookies.title}</strong>
    <p>${c.cookies.text}</p>
  </div>
  <div class="cookie-actions">
    <button class="btn btn--primary" type="button" data-consent="all">${c.cookies.accept}</button>
    <button class="btn btn--mini-ghost" type="button" data-consent="reject">${c.cookies.reject}</button>
    <button class="btn btn--mini-ghost" type="button" data-consent="configure">${c.cookies.configure}</button>
  </div>
</aside>`;
}

/* ---------- <head> ---------- */
function jsonLd(c, routeId) {
  const org = {
    "@context": "https://schema.org", "@type": "Organization", "@id": DOMAIN + "/#organization",
    name: "VELUM", url: DOMAIN + "/", logo: DOMAIN + "/assets/img/velum-logo.svg",
    description: c.meta.description, email: "[CONTACTO@velum.es]", telephone: "[+34 900 000 000]",
    address: { "@type": "PostalAddress", streetAddress: "[CALLE Y NÚMERO]", addressLocality: "[CIUDAD]", postalCode: "[CP]", addressCountry: "ES" },
    areaServed: ["ES", "PT"], sameAs: ["https://www.linkedin.com/company/velum"]
  };
  const website = {
    "@context": "https://schema.org", "@type": "WebSite", "@id": DOMAIN + "/#website",
    url: DOMAIN + "/", name: "VELUM", inLanguage: HREFLANG[c.lang], publisher: { "@id": DOMAIN + "/#organization" }
  };
  const blocks = [org, website];
  if (routeId === "home") {
    blocks.push({
      "@context": "https://schema.org", "@type": "Service",
      serviceType: c.services.items[0].title, name: "VELUM",
      description: c.services.intro, provider: { "@id": DOMAIN + "/#organization" },
      areaServed: { "@type": "Country", name: "España" },
      audience: { "@type": "BusinessAudience", name: c.sectors.items.map((s) => s.title).join(", ") }
    });
    blocks.push({
      "@context": "https://schema.org", "@type": "FAQPage",
      mainEntity: c.faq.items.map((f) => ({
        "@type": "Question", name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a }
      }))
    });
  }
  if (routeId === "servicios" || routeId === "sectores") {
    const p = c.pages[routeId];
    blocks.push({
      "@context": "https://schema.org", "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: c.breadcrumbHome, item: DOMAIN + ROUTES.home[c.lang] },
        { "@type": "ListItem", position: 2, name: p.hero.eyebrow, item: DOMAIN + ROUTES[routeId][c.lang] }
      ]
    });
    blocks.push({
      "@context": "https://schema.org", "@type": "ItemList",
      name: p.hero.title,
      itemListElement: p.items.map((it, i) => ({
        "@type": "ListItem", position: i + 1, name: it.title
      }))
    });
  }
  return blocks.map((b) => `<script type="application/ld+json">${JSON.stringify(b)}</script>`).join("\n");
}

function head(c, routeId, title, desc) {
  const canonical = DOMAIN + ROUTES[routeId][c.lang];
  const alternates = LANGS.map((l) =>
    `<link rel="alternate" hreflang="${HREFLANG[l]}" href="${DOMAIN + ROUTES[routeId][l]}" />`
  ).join("\n  ") + `\n  <link rel="alternate" hreflang="x-default" href="${DOMAIN + ROUTES[routeId].es}" />`;
  const ogAlt = LANGS.filter((l) => l !== c.lang)
    .map((l) => `<meta property="og:locale:alternate" content="${OGLOCALE[l]}" />`).join("\n  ");
  return `<!DOCTYPE html>
<html lang="${HREFLANG[c.lang]}" dir="${c.dir}">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <script>document.documentElement.classList.add('has-js')</script>
  <title>${title}</title>
  <meta name="description" content="${desc}" />
  <link rel="canonical" href="${canonical}" />
  ${alternates}
  <meta name="theme-color" content="#FBFAF6" />
  <meta name="robots" content="index, follow, max-image-preview:large" />
  <meta name="author" content="VELUM" />
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="VELUM" />
  <meta property="og:locale" content="${OGLOCALE[c.lang]}" />
  ${ogAlt}
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="${desc}" />
  <meta property="og:url" content="${canonical}" />
  <meta property="og:image" content="${DOMAIN}/assets/img/og-velum.svg" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${title}" />
  <meta name="twitter:description" content="${desc}" />
  <meta name="twitter:image" content="${DOMAIN}/assets/img/og-velum.svg" />
  <link rel="icon" href="/assets/img/favicon.svg" type="image/svg+xml" />
  <link rel="apple-touch-icon" href="/assets/img/apple-touch-icon.png" />
  <link rel="manifest" href="/site.webmanifest" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link rel="preload" as="style" href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,400&family=DM+Sans:wght@400;500&family=JetBrains+Mono:wght@400;500&display=swap" />
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,400&family=DM+Sans:wght@400;500&family=JetBrains+Mono:wght@400;500&display=swap" />
  <link rel="stylesheet" href="/assets/css/velum.css?v=${CSS_V}" />
  ${jsonLd(c, routeId)}
</head>`;
}

/* ---------- Home sections ---------- */
function homeMain(c) {
  // Hero
  const hero = `<section class="hero" id="top">
  ${weaveSVG({ cls: "hero__weave" })}
  <div class="wrap hero__inner">
    <span class="kicker" data-reveal>${c.hero.eyebrow}</span>
    <h1 data-reveal data-reveal-delay="1">${c.hero.headlineHtml}</h1>
    <p class="lede" data-reveal data-reveal-delay="2">${c.hero.sub}</p>
    <div class="hero-cta" data-reveal data-reveal-delay="3">
      <a class="btn btn--primary" href="#contacto">${c.hero.ctaPrimary} <span class="arr" aria-hidden="true">→</span></a>
      <a class="btn btn--ghost" href="#proceso">${c.hero.ctaSecondary}</a>
    </div>
  </div>
</section>`;

  // Trust bar
  const stats = c.trust.stats.map((s, i) => {
    const isWord = !/^[\d.,%+]+$/.test(s.num);
    return `<div class="stat" data-reveal data-reveal-delay="${i + 1}"><div class="num${isWord ? " is-word" : ""}">${s.num}</div><div class="label">${s.label}</div></div>`;
  }).join("");
  const trust = `<section class="trustbar" aria-label="Cobertura">
  <div class="wrap">
    <p class="trust-line" data-reveal>${c.trust.line}</p>
    <div class="stats">${stats}</div>
  </div>
</section>`;

  // Manifesto
  const manifesto = `<section class="section manifesto" id="manifiesto">
  <div class="wrap">
    <div data-reveal>
      <span class="kicker">${c.manifesto.kicker}</span>
      <h2 class="h-section" style="margin-top:18px;">${c.manifesto.title}</h2>
    </div>
    <p class="manifesto__body" data-reveal data-reveal-delay="1">${c.manifesto.bodyHtml}</p>
  </div>
</section>`;

  // Services
  const svc = c.services.items.map((s, i) =>
    `<article class="svc-card" data-reveal data-reveal-delay="${(i % 3) + 1}">
      <span class="svc-index">${String(i + 1).padStart(2, "0")}</span>
      ${icon(s.icon)}
      <h3>${s.title}</h3>
      <p>${s.body}</p>
    </article>`
  ).join("");
  const svcCta = `<a class="svc-card svc-card--cta" href="#contacto" data-reveal>
      <span class="svc-index" aria-hidden="true">→</span>
      <h3>${c.services.cta.title}</h3>
      <p>${c.services.cta.text}</p>
      <span class="link-arrow">${c.services.cta.link}</span>
    </a>`;
  const services = `<section class="section section--linen" id="servicios">
  <div class="wrap">
    <div class="section-head" data-reveal>
      <span class="kicker">${c.services.kicker}</span>
      <h2 class="h-section">${c.services.title}</h2>
      <p class="lede">${c.services.intro}</p>
    </div>
    <div class="services-grid">${svc}${svcCta}</div>
    <div class="section-more" data-reveal><a class="link-arrow" href="${ROUTES.servicios[c.lang]}">${c.services.more} <span class="arr" aria-hidden="true">→</span></a></div>
  </div>
</section>`;

  // Sectors
  const sec = c.sectors.items.map((s, i) =>
    `<article class="sector-card" data-reveal data-reveal-delay="${i + 1}">
      <span class="sector-tag">${s.tag}</span>
      <h3>${s.title}</h3>
      <p>${s.body}</p>
      <ul class="sector-items">${s.items.map((it) => `<li>${it}</li>`).join("")}</ul>
    </article>`
  ).join("");
  const sectors = `<section class="section" id="sectores">
  <div class="wrap">
    <div class="section-head" data-reveal>
      <span class="kicker">${c.sectors.kicker}</span>
      <h2 class="h-section">${c.sectors.title}</h2>
      <p class="lede">${c.sectors.intro}</p>
    </div>
    <div class="sectors-grid">${sec}</div>
    <div class="section-more" data-reveal><a class="link-arrow" href="${ROUTES.sectores[c.lang]}">${c.sectors.more} <span class="arr" aria-hidden="true">→</span></a></div>
  </div>
</section>`;

  // Process
  const steps = c.process.steps.map((s, i) =>
    `<div class="process-step" data-reveal>
      <div class="step-num">${String(i + 1).padStart(2, "0")}</div>
      <div class="step-head"><h3>${s.title}</h3></div>
      <div class="step-body"><p>${s.body}</p></div>
    </div>`
  ).join("");
  const process = `<section class="section section--mist process" id="proceso">
  <div class="wrap">
    <div class="section-head" data-reveal>
      <span class="kicker">${c.process.kicker}</span>
      <h2 class="h-section">${c.process.title}</h2>
      <p class="lede">${c.process.intro}</p>
    </div>
    <div class="process-steps">${steps}</div>
  </div>
</section>`;

  // Why (dark)
  const why = c.why.items.map((w, i) =>
    `<div class="why-cell" data-reveal data-reveal-delay="${(i % 2) + 1}">
      <span class="why-num">${String(i + 1).padStart(2, "0")}</span>
      <h3>${w.title}</h3>
      <p>${w.body}</p>
    </div>`
  ).join("");
  const whySection = `<section class="section section--ink" id="porque">
  <div class="wrap">
    <div class="section-head" data-reveal>
      <span class="kicker">${c.why.kicker}</span>
      <h2 class="h-section">${c.why.title}</h2>
    </div>
    <div class="why-grid">${why}</div>
  </div>
</section>`;

  // Manager split
  const manager = `<section class="section" id="gestor">
  <div class="wrap split">
    <div class="split__text" data-reveal>
      <span class="kicker">${c.manager.kicker}</span>
      <h2 class="h-section" style="margin:18px 0 24px;">${c.manager.title}</h2>
      <p class="lede">${c.manager.body}</p>
    </div>
    <div class="split__visual" data-reveal data-reveal-delay="1" aria-hidden="true">
      <span class="badge">${c.manager.badge}</span>
      ${weaveSVG({ cls: "mark" })}
    </div>
  </div>
</section>`;

  // Standards → compact credential strip rendered inside Sustainability
  const credItems = c.standards.items.map((s) => `<li>${s.code}</li>`).join("");
  const credStrip = `<div class="cred-strip" data-reveal>
        <span class="cred-strip__label">${c.standards.kicker}</span>
        <ul class="cred-list">${credItems}</ul>
        <p class="cred-note">${c.standards.note}</p>
      </div>`;

  // Sustainability (dark)
  const claims = c.sustainability.claims.map((cl) =>
    `<div class="sust-claim" data-reveal><span class="dot" aria-hidden="true"></span><p>${cl}</p></div>`
  ).join("");
  const sustainability = `<section class="section section--ink" id="sostenibilidad">
  <div class="wrap">
    <div class="section-head" data-reveal>
      <span class="kicker">${c.sustainability.kicker}</span>
      <h2 class="h-section">${c.sustainability.title}</h2>
      <p class="lede">${c.sustainability.body}</p>
    </div>
    <div class="sust-claims">${claims}</div>
    ${credStrip}
  </div>
</section>`;

  // Coverage
  const coverage = `<section class="section coverage" id="cobertura">
  <div class="wrap">
    <div data-reveal>
      <span class="kicker">${c.coverage.kicker}</span>
      <h2 class="h-section" style="margin:18px 0 24px;">${c.coverage.title}</h2>
      <p class="lede">${c.coverage.body}</p>
      <div class="coverage__legend">
        <span class="item"><span class="swatch swatch--now" aria-hidden="true"></span>${c.coverage.now}</span>
        <span class="item"><span class="swatch swatch--soon" aria-hidden="true"></span>${c.coverage.soon}</span>
      </div>
    </div>
    <div class="coverage__map" data-reveal data-reveal-delay="1">${iberiaMap()}</div>
  </div>
</section>`;

  // FAQ
  const faqs = c.faq.items.map((f) =>
    `<details class="faq-item" data-reveal>
      <summary class="faq-q">${f.q}</summary>
      <div class="faq-a">${f.a}</div>
    </details>`
  ).join("");
  const faq = `<section class="section section--linen" id="faq">
  <div class="wrap">
    <div class="section-head" data-reveal>
      <span class="kicker">${c.faq.kicker}</span>
      <h2 class="h-section">${c.faq.title}</h2>
    </div>
    <div class="faq-list">${faqs}</div>
  </div>
</section>`;

  // Contact + form (dark)
  const f = c.form.fields;
  const opts = [`<option value="" disabled selected>${f.sectorPlaceholder}</option>`]
    .concat(f.sectorOptions.map((o) => `<option>${o}</option>`)).join("");
  const consent = c.form.consentHtml.replace("{privacy}", c.legalLinks.privacidad.href);
  const contact = `<section class="section cta-final" id="contacto">
  <div class="wrap contact-grid">
    <div class="cta-final__lead" data-reveal>
      <span class="kicker">${c.ctaFinal.eyebrow}</span>
      <h2 class="h-section" style="margin:18px 0 24px;">${c.ctaFinal.title}</h2>
      <p class="lede">${c.ctaFinal.sub}</p>
    </div>
    <form class="form" data-reveal data-reveal-delay="1" novalidate>
      <div class="form-grid">
        <p class="form-title" style="font-family:var(--serif);font-size:24px;margin:0 0 8px;">${c.form.title}</p>
        <div class="row two">
          <div class="field"><label for="f-nombre">${f.nombre}</label><input id="f-nombre" name="nombre" type="text" autocomplete="name" required /></div>
          <div class="field"><label for="f-empresa">${f.empresa}</label><input id="f-empresa" name="empresa" type="text" autocomplete="organization" required /></div>
        </div>
        <div class="row two">
          <div class="field"><label for="f-sector">${f.sector}</label><select id="f-sector" name="sector" required>${opts}</select></div>
          <div class="field"><label for="f-volumen">${f.volumen}</label><input id="f-volumen" name="volumen" type="text" /></div>
        </div>
        <div class="row two">
          <div class="field"><label for="f-email">${f.email}</label><input id="f-email" name="email" type="email" autocomplete="email" required /></div>
          <div class="field"><label for="f-telefono">${f.telefono}</label><input id="f-telefono" name="telefono" type="tel" autocomplete="tel" /></div>
        </div>
        <div class="field"><label for="f-mensaje">${f.mensaje}</label><textarea id="f-mensaje" name="mensaje" rows="3"></textarea></div>
        <label class="consent"><input type="checkbox" name="consent" required /> <span>${consent}</span></label>
        <div><button class="btn btn--primary" type="submit">${c.form.submit} <span class="arr" aria-hidden="true">→</span></button></div>
      </div>
      <p class="form-success" role="status">${c.form.success}</p>
    </form>
  </div>
</section>`;

  return [hero, trust, manifesto, services, sectors, process, whySection, manager, sustainability, coverage, faq, contact].join("\n");
}

/* Stylized Iberian Peninsula — recognizable, Portugal distinguished. */
function iberiaMap() {
  return `<svg viewBox="0 0 460 380" class="iberia" aria-hidden="true" fill="none">
    <path d="M62 92 L150 74 L250 70 L330 78 L372 70 L398 104 L388 150 L398 196 L368 244 L336 268 L286 300 L236 312 L176 306 L140 300 L110 250 L92 188 L84 134 L70 110 Z"
      fill="var(--linen)" stroke="rgba(31,30,27,0.5)" stroke-width="1.4" stroke-linejoin="round"/>
    <path d="M70 110 L84 134 L92 188 L110 250 L140 300 L150 272 L138 210 L128 150 L118 100 Z"
      fill="var(--mist)" stroke="rgba(31,30,27,0.4)" stroke-width="1.2" stroke-linejoin="round"/>
    <g fill="var(--ink)">
      <circle cx="236" cy="178" r="4.5"/><circle cx="352" cy="120" r="3.5"/>
      <circle cx="250" cy="96" r="3.5"/><circle cx="340" cy="196" r="3.5"/>
      <circle cx="196" cy="280" r="3.5"/>
    </g>
    <g fill="var(--soft)"><circle cx="100" cy="224" r="4"/><circle cx="104" cy="150" r="3"/></g>
    <g fill="rgba(31,30,27,0.62)" font-family="JetBrains Mono, monospace" font-size="11" letter-spacing="0.4">
      <text x="246" y="176">Madrid</text>
      <text x="360" y="118">Barcelona</text>
      <text x="60" y="242">Lisboa</text>
    </g>
  </svg>`;
}

/* ---------- Page assemblers ---------- */
function skip(c) { return `<a class="skip-link" href="#top">${c.skip}</a>`; }
function tail(c, routeId) {
  return `${footer(c, routeId)}\n${cookieBanner(c)}\n<script src="/assets/js/velum.js?v=${JS_V}" defer></script>\n</body>\n</html>`;
}

function buildHome(c) {
  return `${head(c, "home", c.meta.title, c.meta.description)}
<body>
${skip(c)}
${header(c, "home")}
<main id="main">
${homeMain(c)}
</main>
${tail(c, "home")}`;
}

function pageCtaBand(c) {
  const homeUrl = ROUTES.home[c.lang];
  return `<section class="section cta-final">
  <div class="wrap" style="text-align:center;display:grid;gap:22px;justify-items:center;">
    <span class="kicker">${c.ctaFinal.eyebrow}</span>
    <h2 class="h-section" style="max-width:20ch;">${c.pageCta.title}</h2>
    <p class="lede" style="max-width:54ch;">${c.pageCta.sub}</p>
    <a class="btn btn--primary" href="${homeUrl}#contacto">${c.pageCta.button} <span class="arr" aria-hidden="true">→</span></a>
  </div>
</section>`;
}

function buildDetail(c, routeId) {
  const p = c.pages[routeId];
  const homeUrl = ROUTES.home[c.lang];
  // Which services each sector relates to (sector index → service indices)
  const SECTOR_SERVICES = [[0, 1, 2, 3], [0, 1, 3], [1, 2, 4]];
  const blocks = p.items.map((it, i) => {
    const does = it.does.map((d) => `<li>${d}</li>`).join("");
    const chips = it.products.map((x) => `<li>${x}</li>`).join("");
    const tag = it.tag
      ? `<span class="detail-tag">${it.tag}</span>`
      : `<span class="detail-index">${String(i + 1).padStart(2, "0")}</span>`;
    const blockId = routeId === "servicios" ? `servicio-${i + 1}` : `sector-${i + 1}`;
    let related = "";
    if (routeId === "sectores") {
      const svc = c.pages.servicios.items;
      const links = (SECTOR_SERVICES[i] || [])
        .map((j) => `<a class="chip-link" href="${ROUTES.servicios[c.lang]}#servicio-${j + 1}">${svc[j].title} <span aria-hidden="true">→</span></a>`)
        .join("");
      related = `<div class="detail-related"><span class="detail-related__label">${c.labels.related}</span><div class="chip-links">${links}</div></div>`;
    }
    return `<article class="detail-block" id="${blockId}" data-reveal>
      <div class="detail-block__head">
        ${tag}
        <h2 class="h-mid">${it.title}</h2>
        <p class="lede">${it.lead}</p>
      </div>
      <div class="detail-cols">
        <div class="detail-col">
          <h3 class="detail-col__title">${c.labels.does}</h3>
          <ul class="detail-list">${does}</ul>
        </div>
        <div class="detail-col">
          <h3 class="detail-col__title">${c.labels.products}</h3>
          <ul class="chips">${chips}</ul>
        </div>
      </div>
      ${related}
    </article>`;
  }).join("");
  const otherHub = routeId === "servicios"
    ? { href: ROUTES.sectores[c.lang], label: c.sectors.more }
    : { href: ROUTES.servicios[c.lang], label: c.services.more };
  return `${head(c, routeId, p.meta.title, p.meta.description)}
<body>
${skip(c)}
${header(c, routeId)}
<main id="main">
  <section class="page-hero">
    <div class="wrap">
      <nav class="crumbs" aria-label="breadcrumb"><a href="${homeUrl}">${c.breadcrumbHome}</a> <span aria-hidden="true">/</span> <span aria-current="page">${p.hero.eyebrow}</span></nav>
      <span class="kicker" style="margin-top:20px;">${p.hero.eyebrow}</span>
      <h1 class="display" style="margin-top:14px;font-size:var(--fs-section);max-width:18ch;">${p.hero.title}</h1>
      <p class="lede" style="margin-top:22px;">${p.hero.sub}</p>
    </div>
  </section>
  <section class="section detail">
    <div class="wrap">
      ${blocks}
      <div class="section-more"><a class="link-arrow" href="${otherHub.href}">${otherHub.label} <span class="arr" aria-hidden="true">→</span></a></div>
    </div>
  </section>
  ${pageCtaBand(c)}
</main>
${tail(c, routeId)}`;
}

function buildLegal(c, routeId) {
  const page = c.legalPages[routeId]; // { title, updated }
  const body = legalBody(c.lang, LEGAL_FILE[routeId]);
  const title = `${page.title} | VELUM`;
  const desc = page.metaDescription || page.title + " — VELUM.";
  return `${head(c, routeId, title, desc)}
<body>
${skip(c)}
${header(c, routeId)}
<main id="main">
  <section class="legal-hero">
    <div class="wrap">
      <a class="link-arrow" href="${ROUTES.home[c.lang]}">← ${c.backHome}</a>
      <h1 class="display" style="margin-top:24px;font-size:var(--fs-section);">${page.title}</h1>
      <p class="legal-meta">${page.updatedLabel}: ${page.updated}</p>
    </div>
  </section>
  <section class="legal-body">
    <div class="wrap">${body}</div>
  </section>
</main>
${tail(c, routeId)}`;
}

/* ---------- Static files ---------- */
function sitemap() {
  const pages = Object.keys(ROUTES);
  const urls = pages.map((p) => {
    const alts = LANGS.map((l) =>
      `    <xhtml:link rel="alternate" hreflang="${HREFLANG[l]}" href="${DOMAIN + ROUTES[p][l]}"/>`
    ).join("\n");
    return LANGS.map((l) => `  <url>
    <loc>${DOMAIN + ROUTES[p][l]}</loc>
${alts}
    <xhtml:link rel="alternate" hreflang="x-default" href="${DOMAIN + ROUTES[p].es}"/>
    <lastmod>2026-06-06</lastmod>
  </url>`).join("\n");
  }).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls}
</urlset>
`;
}
function robots() {
  return `User-agent: *
Allow: /

Sitemap: ${DOMAIN}/sitemap.xml
`;
}
function webmanifest() {
  return JSON.stringify({
    name: "VELUM", short_name: "VELUM", lang: "es-ES",
    description: "Cuidado textil premium para hostelería, restauración y salud.",
    start_url: "/", display: "standalone",
    background_color: "#FBFAF6", theme_color: "#FBFAF6",
    icons: [
      { src: "/assets/img/favicon.svg", sizes: "any", type: "image/svg+xml" },
      { src: "/assets/img/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/assets/img/icon-512.png", sizes: "512x512", type: "image/png" }
    ]
  }, null, 2);
}
function faviconSVG() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <rect width="100" height="100" rx="18" fill="#FBFAF6"/>
  <g fill="none" stroke="#211F1B" stroke-width="2.4" stroke-linecap="square">${weaveLines()}</g>
</svg>
`;
}
function logoSVG() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <g fill="none" stroke="#211F1B" stroke-width="2.2" stroke-linecap="square">${weaveLines()}</g>
</svg>
`;
}
function ogSVG(c) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#FBFAF6"/>
  <g transform="translate(96,210)" fill="none" stroke="#211F1B" stroke-width="2.2" stroke-linecap="square" opacity="0.9">
    <g transform="scale(2.1)">${weaveLines()}</g>
  </g>
  <text x="330" y="300" font-family="Cormorant Garamond, Georgia, serif" font-size="150" letter-spacing="40" fill="#211F1B">VELUM</text>
  <text x="338" y="372" font-family="DM Sans, sans-serif" font-size="30" letter-spacing="6" fill="#7C786E">Cuidado textil premium · Hostelería · Restauración · Salud</text>
  <rect x="338" y="404" width="120" height="2" fill="#ADB59C"/>
</svg>
`;
}

/* ---------- Run ---------- */
function run() {
  const built = [];
  for (const lang of LANGS) {
    const c = load(lang);
    built.push(writeOut(ROUTES.home[lang], buildHome(c)));
    built.push(writeOut(ROUTES.servicios[lang], buildDetail(c, "servicios")));
    built.push(writeOut(ROUTES.sectores[lang], buildDetail(c, "sectores")));
    for (const routeId of ["aviso", "privacidad", "cookies"]) {
      built.push(writeOut(ROUTES[routeId][lang], buildLegal(c, routeId)));
    }
  }
  // Static root files
  writeFileSync(resolve(ROOT, "sitemap.xml"), sitemap());
  writeFileSync(resolve(ROOT, "robots.txt"), robots());
  writeFileSync(resolve(ROOT, "site.webmanifest"), webmanifest());
  mkdirSync(resolve(ROOT, "assets/img"), { recursive: true });
  writeFileSync(resolve(ROOT, "assets/img/favicon.svg"), faviconSVG());
  writeFileSync(resolve(ROOT, "assets/img/velum-logo.svg"), logoSVG());
  writeFileSync(resolve(ROOT, "assets/img/og-velum.svg"), ogSVG(load("es")));

  console.log("VELUM build complete — " + built.length + " pages:");
  built.forEach((b) => console.log("  /" + b));
}
run();
