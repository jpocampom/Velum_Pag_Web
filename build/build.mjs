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
const DOMAIN = "https://byvelum.com";
const LANGS = ["es", "en", "pt"];
const HREFLANG = { es: "es-ES", en: "en", pt: "pt-PT" };
const OGLOCALE = { es: "es_ES", en: "en_GB", pt: "pt_PT" };

// Canonical page → per-language URL path
const ROUTES = {
  home:       { es: "/",                         en: "/en/",                  pt: "/pt/" },
  servicios:  { es: "/servicios/",               en: "/en/services/",         pt: "/pt/servicos/" },
  sectores:   { es: "/sectores/",                en: "/en/sectors/",          pt: "/pt/setores/" },
  productos:  { es: "/productos/",               en: "/en/products/",         pt: "/pt/produtos/" },
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
/* Versioned photo URL: ?v=<hash> so swapping a photo (same filename) busts cache instantly. */
const photo = (slug) => `/assets/img/photos/${slug}.webp?v=${assetVer("assets/img/photos/" + slug + ".webp")}`;
/* Versioned logo URL (official VELUM lockup, transparent WebP). */
const logo = (slug) => `/assets/img/${slug}.webp?v=${assetVer("assets/img/" + slug + ".webp")}`;
/* Versioned hero video / poster URLs. */
const vid = (slug) => `/assets/video/${slug}.mp4?v=${assetVer("assets/video/" + slug + ".mp4")}`;
const vidPoster = () => `/assets/video/hero-poster.webp?v=${assetVer("assets/video/hero-poster.webp")}`;
const vidPosterM = () => `/assets/video/hero-poster-m.webp?v=${assetVer("assets/video/hero-poster-m.webp")}`;

/* Pointer highlight: [[word]] → animated underline + cursor (drawn on scroll-in). */
function phMarkup(word) {
  return `<span class="ph"><span class="ph__t">${word}</span>` +
    `<svg class="ph__line" viewBox="0 0 100 4" preserveAspectRatio="none" aria-hidden="true"><line class="ph__rule" x1="0.5" y1="2" x2="99.5" y2="2" pathLength="1"/></svg>` +
    `<svg class="ph__ptr" viewBox="0 0 12 12" aria-hidden="true"><path d="M1.2 1.2 9.6 4.4 6 5.6 4.6 9.4 Z"/></svg>` +
    `</span>`;
}
const applyHighlights = (html) => html.replace(/\[\[([\s\S]+?)\]\]/g, (_, w) => phMarkup(w));

function writeOut(urlPath, html) {
  html = applyHighlights(html);
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

/* ---------- Mobile dock (bottom nav, app-style) ---------- */
const DOCK_ICONS = {
  home: '<path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-4.5v-6h-5v6H5a1 1 0 0 1-1-1z"/>',
  about: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 7.6h.01"/>',
  grid: '<rect x="4" y="4" width="6.2" height="6.2" rx="1"/><rect x="13.8" y="4" width="6.2" height="6.2" rx="1"/><rect x="4" y="13.8" width="6.2" height="6.2" rx="1"/><rect x="13.8" y="13.8" width="6.2" height="6.2" rx="1"/>',
  box: '<path d="M12 3 21 7.8 12 12.6 3 7.8z"/><path d="M3 7.8V16.2L12 21l9-4.8V7.8"/><path d="M12 12.6V21"/>',
  people: '<circle cx="9" cy="9" r="3"/><path d="M3 19a6 6 0 0 1 12 0"/><path d="M16 6.5a3 3 0 0 1 0 5.5M21 19a6 6 0 0 0-4-5.6"/>',
  pin: '<path d="M12 21s6.5-5.8 6.5-10.5a6.5 6.5 0 1 0-13 0C5.5 15.2 12 21 12 21z"/><circle cx="12" cy="10.3" r="2.4"/>',
  mail: '<rect x="3" y="5.5" width="18" height="13" rx="1.5"/><path d="M3.5 7 12 13l8.5-6"/>'
};
const DOCK = [
  { id: "top", icon: "home", key: "inicio" },
  { id: "manifiesto", icon: "about", key: "acerca" },
  { id: "servicios", icon: "grid", key: "servicios" },
  { id: "sectores", icon: "people", key: "sectores" },
  { id: "productos", icon: "box", key: "productos", route: "productos" },
  { id: "cobertura", icon: "pin", key: "cobertura" }
];
function dockIcon(name) {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${DOCK_ICONS[name] || ""}</svg>`;
}
function mobileDock(c, routeId) {
  const base = routeId === "home" ? "" : ROUTES.home[c.lang];
  const items = DOCK.map((d) => {
    if (d.sep) return `<span class="dock-sep" aria-hidden="true"></span>`;
    const label = (c.dock && c.dock[d.key]) || d.key;
    const href = d.route ? ROUTES[d.route][c.lang] : `${base}#${d.id}`;
    return `<a class="dock-item" href="${href}" data-dock="${d.id}" aria-label="${label}" data-label="${label}">${dockIcon(d.icon)}<span class="dock-dot" aria-hidden="true"></span></a>`;
  }).join("");
  return `<nav class="mobile-dock" aria-label="${c.nav.menu}">
    <div class="dock-bar">${items}</div>
    <a class="dock-cta" href="${base}#contacto">${c.hero.ctaPrimary}</a>
  </nav>`;
}

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
      <img class="logo-img" src="${logo("velum-lockup")}" width="466" height="160" alt="VELUM" />
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
        <a class="logo-lockup" href="${ROUTES.home[c.lang]}" aria-label="VELUM — Tu textil. Nuestro compromiso."><img class="logo-img logo-img--tagline" src="${logo("velum-lockup-tagline-blanco")}" width="531" height="240" alt="VELUM — Tu textil. Nuestro compromiso." /></a>
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
  const k = c.cookies;
  return `<aside class="cookie-banner" role="dialog" aria-live="polite" aria-label="${k.title}">
  <div>
    <strong style="display:block;font-family:var(--serif);font-size:19px;margin-bottom:6px;">${k.title}</strong>
    <p>${k.text}</p>
  </div>
  <div class="cookie-actions">
    <button class="btn btn--primary" type="button" data-consent="all">${k.accept}</button>
    <button class="btn btn--mini-ghost" type="button" data-consent="reject">${k.reject}</button>
    <button class="btn btn--mini-ghost" type="button" data-consent="configure">${k.configure}</button>
  </div>
</aside>
<div class="cookie-panel" data-cookie-panel hidden>
  <div class="cookie-panel__backdrop" data-cookie-close></div>
  <div class="cookie-panel__box" role="dialog" aria-modal="true" aria-labelledby="ckp-title">
    <button class="cookie-panel__close" type="button" data-cookie-close aria-label="${k.close}">&times;</button>
    <h2 id="ckp-title">${k.panelTitle}</h2>
    <p class="cookie-panel__intro">${k.panelIntro}</p>
    <div class="cookie-cat">
      <div class="cookie-cat__head">
        <span class="cookie-cat__name">${k.necessaryTitle}</span>
        <span class="cookie-cat__tag">${k.necessaryTag}</span>
      </div>
      <p>${k.necessaryDesc}</p>
    </div>
    <div class="cookie-cat">
      <div class="cookie-cat__head">
        <label class="cookie-cat__name" for="ck-analytics">${k.analyticsTitle}</label>
        <span class="cookie-switch"><input type="checkbox" id="ck-analytics" data-cat="analytics" /><span class="cookie-switch__track" aria-hidden="true"></span></span>
      </div>
      <p>${k.analyticsDesc}</p>
    </div>
    <div class="cookie-panel__actions">
      <button class="btn btn--primary" type="button" data-consent="save">${k.save}</button>
      <button class="btn btn--mini-ghost" type="button" data-consent="reject">${k.reject}</button>
      <button class="btn btn--mini-ghost" type="button" data-consent="all">${k.accept}</button>
    </div>
  </div>
</div>`;
}

/* ---------- <head> ---------- */
function jsonLd(c, routeId) {
  const org = {
    "@context": "https://schema.org", "@type": "Organization", "@id": DOMAIN + "/#organization",
    name: "VELUM", legalName: "PCP LAUNDRY, S.L.", url: DOMAIN + "/", logo: DOMAIN + "/assets/img/velum-logo.svg",
    description: c.meta.description, email: "[CONTACTO@byvelum.com]", telephone: "[+34 900 000 000]",
    address: { "@type": "PostalAddress", streetAddress: "Calle Don Ramón de la Cruz 17, piso 3, puerta derecha", addressLocality: "Madrid", postalCode: "28001", addressCountry: "ES" },
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
  <meta property="og:image" content="${DOMAIN}/assets/img/og-velum.png?v=${assetVer("assets/img/og-velum.png")}" />
  <meta property="og:image:type" content="image/png" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${title}" />
  <meta name="twitter:description" content="${desc}" />
  <meta name="twitter:image" content="${DOMAIN}/assets/img/og-velum.png?v=${assetVer("assets/img/og-velum.png")}" />
  <link rel="icon" type="image/png" sizes="64x64" href="/assets/img/favicon.png?v=${assetVer("assets/img/favicon.png")}" />
  <link rel="icon" href="/assets/img/favicon.svg" type="image/svg+xml" />
  <link rel="apple-touch-icon" href="/assets/img/apple-touch-icon.png?v=${assetVer("assets/img/apple-touch-icon.png")}" />
  <link rel="manifest" href="/site.webmanifest" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link rel="preload" as="style" href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,700;1,400&family=DM+Sans:wght@400;500&family=JetBrains+Mono:wght@400;500&display=swap" />
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,700;1,400&family=DM+Sans:wght@400;500&family=JetBrains+Mono:wght@400;500&display=swap" />
  <link rel="stylesheet" href="/assets/css/velum.css?v=${CSS_V}" />
  ${jsonLd(c, routeId)}
</head>`;
}

/* ---------- Home sections ---------- */
function homeMain(c) {
  // Hero — portada en vídeo: 5 clips en crossfade sincronizado + slogan encima
  const clip = (src, poster, active) =>
    `<video class="hero__vid${active ? " is-active" : ""}" muted loop playsinline ${active ? "autoplay " : ""}preload="${active ? "auto" : "none"}"${poster ? ` poster="${poster}"` : ""} aria-hidden="true"><source src="${src}" type="video/mp4" /></video>`;
  const heroClipsD = [1, 2, 3, 4, 5].map((n, i) => clip(vid("velum-hero-" + n), i === 0 ? vidPoster() : "", i === 0)).join("\n      ");
  // Móvil: metraje vertical 9:16 real → object-fit:cover llena la pantalla.
  const heroClipsM = [1, 2, 3, 4, 5].map((n, i) => clip(vid("velum-hero-m-" + n), i === 0 ? vidPosterM() : "", i === 0)).join("\n      ");
  const hero = `<section class="hero hero--video" id="top">
  <div class="hero__bg hero__bg--d">
      ${heroClipsD}
  </div>
  <div class="hero__bg hero__bg--m" aria-hidden="true">
      ${heroClipsM}
  </div>
  <div class="hero__scrim" aria-hidden="true"></div>
  <div class="wrap hero__inner">
    <div class="hero__text liquid-glass">
      <span class="kicker" data-reveal>${c.hero.eyebrow}</span>
      <h1 class="hero__title" data-chars>${c.hero.headlineHtml}</h1>
      <p class="lede" data-reveal data-reveal-delay="2">${c.hero.sub}</p>
      <div class="hero-cta" data-reveal data-reveal-delay="3">
        <a class="btn btn--primary" href="#contacto">${c.hero.ctaPrimary} <span class="arr" aria-hidden="true">→</span></a>
        <a class="btn btn--ghost btn--glass" href="#proceso">${c.hero.ctaSecondary}</a>
      </div>
    </div>
    ${c.hero.tag ? `<div class="hero__tag liquid-glass" data-reveal data-reveal-delay="4">${c.hero.tag}</div>` : ""}
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
      <h2 class="h-section" style="margin-top:18px;">${c.manifesto.title}</h2>
    </div>
    <p class="manifesto__body" data-reveal data-reveal-delay="1">${c.manifesto.bodyHtml}</p>
  </div>
</section>`;

  // Services
  const svc = c.services.items.map((s, i) =>
    `<article class="svc-card" data-reveal data-reveal-delay="${(i % 3) + 1}">
      ${icon(s.icon)}
      <h3>${s.title}</h3>
      <p>${s.body}</p>
    </article>`
  ).join("");
  const svcCta = `<a class="svc-card svc-card--cta" href="#contacto" data-reveal>
      <span class="svc-index" aria-hidden="true">→</span>
      <h3>${c.services.cta.title}</h3>
      <p>${c.services.cta.text}</p>
      <span class="svc-cta-btn">${c.services.cta.link} <span class="arr" aria-hidden="true">→</span></span>
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
  const SECTOR_IMG = ["sector-hosteleria", "sector-restauracion", "sector-salud"];
  const sec = c.sectors.items.map((s, i) =>
    `<article class="sector-card" data-reveal data-reveal-delay="${i + 1}">
      <figure class="sector-card__media"><img src="${photo(SECTOR_IMG[i] || SECTOR_IMG[0])}" width="1500" height="1000" loading="lazy" decoding="async" alt="${s.tag} — ${s.title}" /></figure>
      <div class="sector-card__body">
        <span class="sector-tag">${s.tag}</span>
        <h3>${s.title}</h3>
        <p>${s.body}</p>
        <div class="sector-products">
          <span class="sector-products__label">${c.sectors.productsLabel}</span>
          <ul class="sector-items">${s.items.map((it) => `<li>${it}</li>`).join("")}</ul>
          <a class="link-arrow sector-products__more" href="${ROUTES.productos[c.lang]}">${c.sectors.verGama} <span class="arr" aria-hidden="true">→</span></a>
        </div>
      </div>
    </article>`
  ).join("");
  const sectors = `<section class="section" id="sectores">
  <div class="wrap">
    <div class="section-head" data-reveal>
      <h2 class="h-section">${c.sectors.title}</h2>
      <p class="lede">${c.sectors.intro}</p>
    </div>
    <div class="sectors-grid">${sec}</div>
    <div class="section-more" data-reveal><a class="link-arrow" href="${ROUTES.sectores[c.lang]}">${c.sectors.more} <span class="arr" aria-hidden="true">→</span></a></div>
  </div>
</section>`;

  // Process — infografía de flujo conectado (icono + nodo numerado por etapa)
  const FLOW_ICONS = [
    '<path d="M3 7h10v9H3z"/><path d="M13 10h4l4 3.5V16h-8z"/><circle cx="7" cy="18" r="1.7"/><circle cx="17.5" cy="18" r="1.7"/>',
    '<circle cx="12" cy="13" r="6.6"/><circle cx="12" cy="13" r="2.6"/><path d="M5 4.5h14M8.5 4.5v3.2"/>',
    '<circle cx="12" cy="12" r="3.2"/><path d="M12 3.2v3M12 17.8v3M3.2 12h3M17.8 12h3M5.7 5.7l2.1 2.1M16.2 16.2l2.1 2.1M18.3 5.7l-2.1 2.1M7.8 16.2l-2.1 2.1"/>',
    '<path d="M12 3l7 3v5c0 4.6-3.1 7.7-7 9-3.9-1.3-7-4.4-7-9V6z"/><path d="M9 12.2l2.1 2.1L15 10"/>',
    '<rect x="4" y="4" width="6" height="6" rx="1"/><rect x="14" y="4" width="6" height="6" rx="1"/><rect x="4" y="14" width="6" height="6" rx="1"/><path d="M14.5 14.5h2v2M20 14.5v5.5M14.5 20h3"/>'
  ];
  const stepIcon = (i) => `<svg class="flow-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${FLOW_ICONS[i % FLOW_ICONS.length]}</svg>`;
  const steps = c.process.steps.map((s, i) =>
    `<li class="flow-step" data-reveal data-reveal-delay="${(i % 3) + 1}">
      <div class="flow-node"><span class="flow-num">${String(i + 1).padStart(2, "0")}</span></div>
      <div class="flow-card">
        ${stepIcon(i)}
        <h3>${s.title}</h3>
        <p>${s.body}</p>
      </div>
    </li>`
  ).join("");
  const process = `<section class="section section--mist process" id="proceso">
  <div class="wrap">
    <div class="section-head" data-reveal>
      <h2 class="h-section">${c.process.title}</h2>
      <p class="lede">${c.process.intro}</p>
    </div>
    <ol class="flow">${steps}</ol>
  </div>
</section>`;

  // Why (dark)
  const why = c.why.items.map((w, i) =>
    `<div class="why-cell" data-reveal data-reveal-delay="${(i % 2) + 1}">
      <h3>${w.title}</h3>
      <p>${w.body}</p>
    </div>`
  ).join("");
  const whySection = `<section class="section section--ink" id="porque">
  <div class="wrap">
    <div class="section-head" data-reveal>
      <h2 class="h-section">${c.why.title}</h2>
    </div>
    <div class="why-grid">${why}</div>
  </div>
</section>`;

  // Manager split
  const manager = `<section class="section" id="gestor">
  <div class="wrap split">
    <div class="split__text" data-reveal>
      <h2 class="h-section" style="margin:18px 0 24px;">${c.manager.title}</h2>
      <p class="lede">${c.manager.body}</p>
    </div>
    <figure class="split__visual" data-reveal data-reveal-delay="1">
      <span class="badge">${c.manager.badge}</span>
      <img src="${photo("gestor")}" width="1500" height="1000" loading="lazy" decoding="async" alt="${c.manager.badge}" />
    </figure>
  </div>
</section>`;


  // Coverage
  const coverage = `<section class="section coverage" id="cobertura">
  <div class="wrap">
    <div data-reveal>
      <h2 class="h-section" style="margin:18px 0 24px;">${c.coverage.title}</h2>
      <p class="lede">${c.coverage.body}</p>
      <div class="coverage__legend">
        <span class="item"><span class="swatch swatch--plant" aria-hidden="true"></span>${c.coverage.plants}</span>
        <span class="item"><span class="swatch swatch--ally" aria-hidden="true"></span>${c.coverage.allies}</span>
        <span class="item"><span class="swatch swatch--soon" aria-hidden="true"></span>${c.coverage.soon}</span>
      </div>
    </div>
    <div class="coverage__map" data-reveal data-reveal-delay="1">${iberiaMap(c)}</div>
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

  // Gallery carousel organised by sector (tabs + horizontal scroll-snap)
  const CAR_KEYS = ["hosteleria", "restauracion", "salud"];
  const CAR_IMGS = {
    hosteleria: ["hosteleria-suite", "hero-suite", "galeria-rollos", "materiales"],
    restauracion: ["sector-restauracion", "restauracion-2", "restauracion-3"],
    salud: ["sector-salud", "salud-2", "salud-3"]
  };
  const carTabs = c.sectors.items.map((s, i) =>
    `<button class="car-tab${i === 0 ? " is-active" : ""}" type="button" role="tab" aria-selected="${i === 0}" data-car="${CAR_KEYS[i]}">${s.tag}</button>`
  ).join("");
  const carTracks = CAR_KEYS.map((k, i) => {
    const slides = CAR_IMGS[k].map((src) =>
      `<figure class="car-slide"><img src="${photo(src)}" width="1400" height="1050" loading="lazy" decoding="async" alt="${c.sectors.items[i].tag} — ${c.sectors.items[i].title}" /></figure>`
    ).join("");
    return `<div class="car-track${i === 0 ? " is-active" : ""}" data-car-panel="${k}" role="tabpanel">${slides}</div>`;
  }).join("");
  const gallery = `<section class="section section--tight carousel" aria-label="${c.galleryLabel || "Galería"}">
  <div class="wrap">
    <div class="car-head" data-reveal>
      <h2 class="h-mid">${c.galleryLabel}</h2>
      <div class="car-tabs" role="tablist">${carTabs}</div>
    </div>
    <div class="car-viewport" data-reveal data-reveal-delay="1">${carTracks}</div>
  </div>
</section>`;

  // La gama completa de productos vive ahora en su página dedicada (/productos);
  // los sectores enlazan a ella. Por eso la sección de productos sale del home.
  return [hero, trust, manifesto, whySection, services, process, sectors, gallery, manager, coverage, faq, contact].join("\n");
}

/* Iberian Peninsula — real geography (Spain + Portugal), Portugal distinguished.
   Markup lives in build/iberia-map.svg (classed for CSS styling). */
function iberiaMap(c) {
  const cities = (c && c.coverage && c.coverage.cities) || {};
  return read(resolve(__dirname, "iberia-map.svg"))
    .replaceAll("{{C_MADRID}}", cities.madrid || "Madrid")
    .replaceAll("{{C_BILBAO}}", cities.bilbao || "Bilbao")
    .replaceAll("{{C_LISBOA}}", cities.lisboa || "Lisboa");
}

/* ---------- Page assemblers ---------- */
function skip(c) { return `<a class="skip-link" href="#top">${c.skip}</a>`; }
function tail(c, routeId) {
  return `${footer(c, routeId)}\n${mobileDock(c, routeId)}\n${cookieBanner(c)}\n<script src="/assets/js/velum.js?v=${JS_V}" defer></script>\n</body>\n</html>`;
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

function buildProducts(c) {
  const p = c.productosPage;
  const homeUrl = ROUTES.home[c.lang];
  const claims = p.claims.map((cl) =>
    `<div class="prod-claim" data-reveal><h3>${cl.title}</h3><p>${cl.body}</p></div>`).join("");
  const tabs = p.families.map((fam, i) =>
    `<button class="prod-tab${i === 0 ? " is-active" : ""}" type="button" role="tab" id="ptab-${i}" aria-selected="${i === 0 ? "true" : "false"}" aria-controls="ppanel-${i}" data-ptab="${i}">${fam.tag}</button>`).join("");
  const panels = p.families.map((fam, i) => {
    const groups = fam.groups.map((g) =>
      `<div class="prod-group"><h4>${g.name}</h4><p>${g.body}</p></div>`).join("");
    return `<div class="prod-panel${i === 0 ? " is-active" : ""}" role="tabpanel" id="ppanel-${i}" aria-labelledby="ptab-${i}"${i !== 0 ? " hidden" : ""}>
      <article class="prod-family" id="familia-${i + 1}">
        <div class="prod-family__head">
          <span class="prod-fam-tag">${fam.tag}</span>
          <h3 class="h-mid">${fam.title}</h3>
          <p class="lede">${fam.lead}</p>
        </div>
        <div class="prod-groups">${groups}</div>
      </article>
    </div>`;
  }).join("");
  const custItems = p.custom.items.map((x) => `<li>${x}</li>`).join("");
  const certItems = p.certs.items.map((ct) =>
    `<div class="prod-cert"><h4>${ct.name}</h4><p>${ct.body}</p></div>`).join("");
  return `${head(c, "productos", p.meta.title, p.meta.description)}
<body>
${skip(c)}
${header(c, "productos")}
<main id="main">
  <section class="page-hero">
    <div class="wrap">
      <nav class="crumbs" aria-label="breadcrumb"><a href="${homeUrl}">${c.breadcrumbHome}</a> <span aria-hidden="true">/</span> <span aria-current="page">${p.hero.eyebrow}</span></nav>
      <span class="kicker" style="margin-top:20px;">${p.hero.eyebrow}</span>
      <h1 class="display" style="margin-top:14px;font-size:var(--fs-section);max-width:18ch;">${p.hero.title}</h1>
      <p class="lede" style="margin-top:22px;max-width:64ch;">${p.hero.sub}</p>
    </div>
  </section>
  <section class="section section--linen">
    <div class="wrap"><div class="prod-claims">${claims}</div></div>
  </section>
  <section class="section">
    <div class="wrap">
      <div class="section-head" data-reveal>
        <h2 class="h-section">${p.gamaTitle}</h2>
        <p class="lede">${p.gamaIntro}</p>
      </div>
      <div class="prod-gama" data-reveal>
        <div class="prod-tabs" role="tablist" aria-label="${p.hero.eyebrow}">${tabs}</div>
        <div class="prod-panels">${panels}</div>
      </div>
    </div>
  </section>
  <section class="section section--mist">
    <div class="wrap prod-custom">
      <div class="prod-custom__lead" data-reveal>
        <span class="kicker">${p.custom.kicker}</span>
        <h2 class="h-section" style="margin:16px 0 18px;">${p.custom.title}</h2>
        <p class="lede">${p.custom.body}</p>
      </div>
      <ul class="prod-custom-list" data-reveal data-reveal-delay="1">${custItems}</ul>
    </div>
  </section>
  <section class="section section--linen">
    <div class="wrap">
      <div class="section-head" data-reveal><h2 class="h-section">${p.certs.title}</h2></div>
      <div class="prod-certs">${certItems}</div>
    </div>
  </section>
  <section class="section cta-final">
    <div class="wrap" style="text-align:center;display:grid;gap:22px;justify-items:center;">
      <span class="kicker">${p.cta.eyebrow}</span>
      <h2 class="h-section" style="max-width:20ch;">${p.cta.title}</h2>
      <p class="lede" style="max-width:54ch;">${p.cta.sub}</p>
      <a class="btn btn--primary" href="${homeUrl}#contacto">${p.cta.button} <span class="arr" aria-hidden="true">→</span></a>
    </div>
  </section>
</main>
${tail(c, "productos")}`;
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
    built.push(writeOut(ROUTES.productos[lang], buildProducts(c)));
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
