/* =====================================================================
   VELUM — generador de firmas de correo.
   Emite en /firmas/ una firma HTML por persona (tablas + estilos inline,
   compatible con Outlook, Gmail y Apple Mail) y una página de previsualización
   con botón "Copiar firma".
   Run: node build/make-firmas.mjs
   ===================================================================== */
import { writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = resolve(ROOT, "firmas");
mkdirSync(OUT, { recursive: true });

const DOMAIN = "https://www.by-velum.com";
const LOGO_PATH = "/assets/img/velum-firma-logo.png"; // 419x116 (PNG, no WebP/SVG: Outlook no los soporta)
const LOGO_W = 168, LOGO_H = 47;

const INK = "#211F1B", SOFT = "#66625A", ACCENT = "#2E3A4B", LINE = "#E4DED1";
const SERIF = "'Cormorant Garamond', Georgia, 'Times New Roman', serif";
const SANS = "'DM Sans', Helvetica, Arial, sans-serif";

const COMPANY = {
  brand: "VELUM",
  claim: "Textile care premium",
  legal: "PCP Laundry, S.L.",
  address: "Calle Don Ramón de la Cruz 17, 3º dcha. · 28001 Madrid",
  web: "www.by-velum.com",
  tagline: "El aliado invisible que sostiene la excelencia.",
  privacyEmail: "privacidad@by-velum.com",
};

export const PEOPLE = [
  { slug: "juan-luis-mesa",  name: "Juan Luis Mesa",  cargo: "", email: "jlmesa@by-velum.com",  phone: "+34 667 562 171" },
  { slug: "jose-luis-gomez", name: "José Luis Gómez", cargo: "", email: "jlgomez@by-velum.com", phone: "+34 666 318 832" },
  { slug: "angela-pena",     name: "Ángela Peña",     cargo: "", email: "apena@by-velum.com",   phone: "+34 626 159 091" },
  { slug: "manuela-martin",  name: "Manuela Martín",  cargo: "", email: "mmartin@by-velum.com", phone: "+34 647 288 274" },
];

/* Entidades numéricas para todo lo no-ASCII: la firma sobrevive a cualquier charset del cliente de correo. */
const ent = (s) => s.replace(/[^\x20-\x7E\n]/g, (ch) => `&#${ch.codePointAt(0)};`);
const telHref = (p) => "tel:" + p.replace(/[^\d+]/g, "");

export function signatureHtml(p, { logoSrc = DOMAIN + LOGO_PATH } = {}) {
  const c = COMPANY;
  const cargoRow = p.cargo
    ? `<tr><td style="padding:0 0 2px;font-family:${SANS};font-size:13px;line-height:18px;color:${SOFT};">${ent(p.cargo)}</td></tr>`
    : "";
  return ent(`<!-- Firma VELUM · ${p.name} -->
<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;font-family:${SANS};color:${INK};max-width:540px;">
  <tr>
    <td valign="middle" style="padding:0 22px 0 0;border-right:1px solid ${LINE};">
      <a href="${DOMAIN}/" target="_blank" style="text-decoration:none;border:0;"><img src="${logoSrc}" width="${LOGO_W}" height="${LOGO_H}" alt="VELUM" style="display:block;border:0;outline:none;width:${LOGO_W}px;height:${LOGO_H}px;" /></a>
    </td>
    <td valign="middle" style="padding:0 0 0 22px;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
        <tr><td style="padding:0 0 2px;font-family:${SERIF};font-size:20px;line-height:24px;font-weight:normal;color:${INK};letter-spacing:0.2px;">${p.name}</td></tr>
        ${cargoRow}
        <tr><td style="padding:0 0 8px;font-family:${SANS};font-size:12px;line-height:16px;color:${SOFT};letter-spacing:1.4px;text-transform:uppercase;white-space:nowrap;">${c.brand} &middot; ${c.claim}</td></tr>
        <tr><td style="padding:0 0 2px;font-family:${SANS};font-size:13px;line-height:18px;color:${INK};"><a href="${telHref(p.phone)}" style="color:${INK};text-decoration:none;">${p.phone}</a></td></tr>
        <tr><td style="padding:0 0 2px;font-family:${SANS};font-size:13px;line-height:18px;"><a href="mailto:${p.email}" style="color:${ACCENT};text-decoration:none;">${p.email}</a></td></tr>
        <tr><td style="padding:0;font-family:${SANS};font-size:13px;line-height:18px;"><a href="${DOMAIN}/" target="_blank" style="color:${ACCENT};text-decoration:none;">${c.web}</a></td></tr>
      </table>
    </td>
  </tr>
  <tr>
    <td colspan="2" style="padding:14px 0 0;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;border-top:1px solid ${LINE};width:100%;">
        <tr><td style="padding:10px 0 0;font-family:${SERIF};font-size:14px;line-height:18px;font-style:italic;color:${SOFT};">${c.tagline}</td></tr>
        <tr><td style="padding:4px 0 0;font-family:${SANS};font-size:11px;line-height:15px;color:${SOFT};">${c.legal} &middot; ${c.address}</td></tr>
        <tr><td style="padding:8px 0 0;font-family:${SANS};font-size:10px;line-height:14px;color:#8E8A80;">Este mensaje y sus adjuntos se dirigen exclusivamente a su destinatario y pueden contener información confidencial. Si lo ha recibido por error, comuníquelo al remitente y elimínelo. Responsable del tratamiento: ${c.legal}. Puede ejercer sus derechos de acceso, rectificación, supresión y demás previstos en el RGPD en <a href="mailto:${c.privacyEmail}" style="color:#8E8A80;text-decoration:underline;">${c.privacyEmail}</a>.</td></tr>
      </table>
    </td>
  </tr>
</table>`);
}

const standalone = (p) => `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="noindex, nofollow" />
<title>Firma VELUM &middot; ${ent(p.name)}</title>
</head>
<body style="margin:0;padding:24px;background:#ffffff;">
${signatureHtml(p)}
</body>
</html>
`;

/* Página de previsualización + copia */
function indexHtml() {
  const cards = PEOPLE.map((p) => `
    <section class="card">
      <header class="card__head">
        <h2>${ent(p.name)}</h2>
        <div class="card__actions">
          <button type="button" class="btn" data-copy="${p.slug}">Copiar firma</button>
          <a class="btn btn--ghost" href="./${p.slug}.html" target="_blank" rel="noopener">Abrir HTML</a>
        </div>
      </header>
      <div class="card__body" id="sig-${p.slug}">${signatureHtml(p, { logoSrc: ".." + LOGO_PATH })}</div>
      <template id="tpl-${p.slug}">${signatureHtml(p)}</template>
    </section>`).join("\n");

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="noindex, nofollow" />
<title>Firmas de correo &middot; VELUM</title>
<link rel="icon" href="../assets/img/favicon.svg" type="image/svg+xml" />
<style>
  :root{--paper:#FBFAF6;--linen:#F2EDE3;--mist:#E4DED1;--ink:#211F1B;--soft:#66625A;--accent:#2E3A4B}
  *{box-sizing:border-box}
  body{margin:0;padding:40px 20px 80px;background:var(--paper);color:var(--ink);font:15px/1.55 'DM Sans',Helvetica,Arial,sans-serif}
  .wrap{max-width:980px;margin:0 auto}
  h1{font:300 40px/1.1 'Cormorant Garamond',Georgia,serif;margin:0 0 8px;letter-spacing:-.01em}
  .lede{color:var(--soft);max-width:70ch;margin:0 0 32px}
  .steps{background:var(--linen);border:1px solid var(--mist);border-radius:2px;padding:18px 22px;margin:0 0 36px;font-size:14px}
  .steps h3{margin:0 0 6px;font:500 12px/1 'DM Sans',Helvetica,Arial,sans-serif;letter-spacing:.14em;text-transform:uppercase;color:var(--soft)}
  .steps ol{margin:0 0 10px 18px;padding:0}.steps li{margin:2px 0}
  .steps p{margin:0}
  .card{background:#fff;border:1px solid var(--mist);border-radius:2px;margin:0 0 22px;overflow:hidden}
  .card__head{display:flex;justify-content:space-between;align-items:center;gap:16px;flex-wrap:wrap;padding:14px 22px;border-bottom:1px solid var(--mist);background:var(--linen)}
  .card__head h2{margin:0;font:400 22px/1.2 'Cormorant Garamond',Georgia,serif}
  .card__actions{display:flex;gap:8px}
  .btn{appearance:none;border:1px solid var(--ink);background:var(--ink);color:var(--paper);font:500 13px/1 'DM Sans',Helvetica,Arial,sans-serif;padding:10px 16px;border-radius:2px;cursor:pointer;text-decoration:none;display:inline-block}
  .btn:hover{background:var(--accent);border-color:var(--accent)}
  .btn--ghost{background:transparent;color:var(--ink)}
  .btn--ghost:hover{background:var(--mist);border-color:var(--ink);color:var(--ink)}
  .btn.is-done{background:#4F6B57;border-color:#4F6B57}
  .card__body{padding:26px 22px;overflow-x:auto}
  .note{font-size:13px;color:var(--soft);margin-top:36px}
  @media (max-width:600px){h1{font-size:32px}.card__head{padding:12px 16px}.card__body{padding:18px 16px}}
</style>
</head>
<body>
<div class="wrap">
  <h1>Firmas de correo VELUM</h1>
  <p class="lede">Firmas HTML del equipo, con el logotipo oficial alojado en <strong>${DOMAIN.replace("https://", "")}</strong>. Pulse <em>Copiar firma</em> y pegue en el editor de firmas de su cliente de correo.</p>

  <div class="steps">
    <h3>Instalación</h3>
    <ol>
      <li><strong>Outlook (Windows / Mac / nuevo Outlook / web):</strong> Configuración &rarr; Correo &rarr; Redactar y responder &rarr; Firmas. Nueva firma, pegue (Ctrl+V / &#8984;V) y guarde. Asigne la firma a &laquo;Mensajes nuevos&raquo; y &laquo;Respuestas/reenvíos&raquo;.</li>
      <li><strong>Gmail / Google Workspace:</strong> Configuración &rarr; Ver todos los ajustes &rarr; General &rarr; Firma &rarr; Crear nueva, pegue y guarde los cambios al pie de la página.</li>
      <li><strong>Apple Mail:</strong> Mail &rarr; Ajustes &rarr; Firmas &rarr; +, pegue y desmarque &laquo;Usar siempre mi tipo de letra predeterminado&raquo;.</li>
      <li><strong>iPhone / Android:</strong> la firma del ordenador no se sincroniza. En el móvil use la versión de texto: nombre, VELUM &middot; Textile care premium, teléfono, correo y ${COMPANY.web}.</li>
    </ol>
    <p>El logotipo se carga desde la web (no se adjunta como archivo), así que no genera adjuntos ni pesa en el correo. Compruebe la firma enviándose un mensaje de prueba antes de usarla.</p>
  </div>

  ${cards}

  <p class="note">Tipografías: Cormorant Garamond y DM Sans solo se muestran si el destinatario las tiene instaladas; en caso contrario la firma degrada a Georgia y Helvetica/Arial, previstas en la propia firma. El logotipo es imagen y conserva siempre la marca.</p>
</div>
<script>
  document.querySelectorAll("[data-copy]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const slug = btn.dataset.copy;
      const html = document.getElementById("tpl-" + slug).innerHTML.trim();
      const tmp = document.createElement("div"); tmp.innerHTML = html;
      const text = tmp.innerText.replace(/\\n{3,}/g, "\\n\\n").trim();
      const done = () => { const o = btn.textContent; btn.textContent = "Copiada"; btn.classList.add("is-done"); setTimeout(() => { btn.textContent = o; btn.classList.remove("is-done"); }, 1800); };
      try {
        if (navigator.clipboard && window.ClipboardItem) {
          await navigator.clipboard.write([new ClipboardItem({
            "text/html": new Blob([html], { type: "text/html" }),
            "text/plain": new Blob([text], { type: "text/plain" }),
          })]);
          return done();
        }
        throw new Error("no ClipboardItem");
      } catch (e) {
        /* Fallback: seleccionar el bloque renderizado y copiar */
        const el = document.getElementById("sig-" + slug);
        const range = document.createRange(); range.selectNodeContents(el);
        const sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(range);
        try { document.execCommand("copy"); done(); } finally { sel.removeAllRanges(); }
      }
    });
  });
</script>
</body>
</html>
`;
}

for (const p of PEOPLE) writeFileSync(resolve(OUT, `${p.slug}.html`), standalone(p));
writeFileSync(resolve(OUT, "index.html"), indexHtml());
console.log(`firmas/ → ${PEOPLE.length} firmas + index.html`);
