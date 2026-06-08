# VELUM — Handoff

Documento de entrega del sitio web de **VELUM** (plataforma ibérica de cuidado
textil premium · renting + lavado + gestión integral, para hostelería,
restauración y salud). Sitio **estático, trilingüe (ES · EN · PT)**, sin
dependencias de runtime.

---

## 1. Estado actual

✅ **Listo y funcional:**
- Home trilingüe (ES raíz, `/en/`, `/pt/`) con 11 secciones: hero, barra de
  confianza, manifiesto, servicios (3×2 con tarjeta CTA), sectores, proceso,
  por qué VELUM, gestor dedicado, sostenibilidad (con tira de estándares),
  cobertura (mapa de la Península), FAQ y contacto.
- Páginas de **Servicios** y **Sectores** (detalle: qué hacemos + productos),
  con enlaces cruzados sector→servicio. Productos basados en los catálogos de
  proveedores (Distrihogar Hotel Division y Resuinsa Profesional).
- Páginas legales (Aviso legal, Privacidad RGPD/LSSI, Cookies AEPD) en 3 idiomas.
- Marca: isotipo **«Tejido»** (SVG + favicon + iconos PNG), Cormorant Garamond
  + DM Sans + JetBrains Mono, paleta de blancos cálidos y carbón.
- SEO: `hreflang` + `x-default`, `canonical`, JSON-LD (Organization, WebSite,
  Service, FAQPage, BreadcrumbList, ItemList), OG/Twitter, `sitemap.xml`,
  `robots.txt`, `site.webmanifest`.
- RGPD: banner de cookies con analítica bloqueada hasta consentimiento.
- Responsive y accesible: menú móvil con foco/Escape/inert, scroll-spy, barra
  de progreso, botón “volver arriba”, `prefers-reduced-motion`, contenido
  visible aunque el JS falle (no depende de la animación para mostrarse).
- `vercel.json` listo para despliegue en un clic.

🔧 **Pendiente antes de producción** — ver §6.

---

## 2. Stack y estructura

Sin frameworks. Generador estático propio en Node (sin dependencias) que
compila HTML localizado desde JSON.

```
build/
  build.mjs            Generador (rutas, plantillas, JSON-LD, sitemap…)
  make-icons.mjs       Rasteriza el isotipo a PNG (favicon/app icons)
  content/
    es.json en.json pt.json      Contenido por idioma (FUENTE DE VERDAD)
    legal/{es,en,pt}/*.html       Cuerpos legales por idioma
assets/  css/velum.css · js/velum.js · img/ (isotipo, favicon, OG, iconos)
index.html · en/ · pt/ · servicios/ · sectores/ · aviso-legal/ …   (GENERADO)
sitemap.xml · robots.txt · site.webmanifest · 404.html · vercel.json
README.md · handoff.md
```

> Edita **`build/content/`** y recompila. No edites los HTML generados a mano.

---

## 3. Ejecutar y compilar

Requiere **Node ≥ 18**. Cero dependencias para compilar.

```bash
npm run icons   # genera los PNG del isotipo (solo si cambia la marca)
npm run build   # genera las 18 páginas + sitemap/robots/manifest/SVGs
npm run all     # iconos + build
npm run serve   # servidor local → http://localhost:8080
```

---

## 4. Editar contenido / traducciones

- Todo el texto vive en `build/content/{es,en,pt}.json` con la **misma
  estructura de claves** en los tres idiomas. El español es la versión maestra.
- Los textos legales (más largos) están en `build/content/legal/{idioma}/`.
- Tras editar: `npm run build`.

---

## 5. Verificación visual (capturas)

El proyecto **no** incluye navegador (para mantenerlo sin dependencias). Para
auditar visualmente o hacer capturas, instala bajo demanda un Chromium real:

```bash
npm i -D puppeteer-core @sparticuz/chromium
# (en este entorno hicieron falta libs del sistema: libnss3, libgbm1, etc.)
```

…y usa un script con `puppeteer-core` apuntando a `chromium.executablePath()`
contra `npm run serve`. Para capturas fieles: forzar visibles los `[data-reveal]`
(`document.querySelectorAll('[data-reveal]').forEach(e=>e.classList.add('in'))`)
y descartar el banner de cookies. Estas dependencias **no se commitean**.

---

## 6. Pendientes antes de producción ✅ checklist

- [ ] **Datos legales / de empresa:** rellenar todos los `[CORCHETES]` en
  `build/content/legal/**` y en el JSON-LD de `build/build.mjs` (razón social,
  CIF, domicilio, datos registrales, email, teléfono, nº de marca OEPM/EUIPO,
  encargados del tratamiento). **Revisión por asesoría legal** antes de publicar.
- [ ] **Backend del formulario:** hoy hace una confirmación en cliente. Conectar
  un endpoint real (servicio de formularios / función serverless / `mailto`) en
  el handler `form.submit` de `assets/js/velum.js`.
- [ ] **Analítica con consentimiento:** insertar el loader en `loadAnalytics()`
  de `assets/js/velum.js` (se ejecuta solo tras aceptar cookies).
- [ ] **Imagen Open Graph:** hay `og-velum.svg`; varias redes no renderizan SVG.
  Exportar un **PNG 1200×630** y actualizar las metaetiquetas `og:image`.
- [ ] **Fotografía editorial** (hero, sectores, planta, gestor): el diseño es
  deliberadamente tipográfico/textural; hay huecos naturales para fotos reales.
- [ ] **Certificaciones reales:** la tira de «Estándares» lista normas de
  referencia del sector. Sustituir por los sellos vigentes cuando se obtengan.
- [ ] **Cifras propias:** sustituir afirmaciones cualitativas por datos
  verificados de VELUM (ahorro de agua/energía, retención, vida útil…).
- [ ] **Dominio Portugal:** hoy PT se sirve en `/pt/`. Si se opta por `velum.pt`
  (ccTLD), ajustar `ROUTES`/`DOMAIN` en `build/build.mjs` y los `hreflang`.

---

## 7. Despliegue en Vercel

El repo está **listo para un clic** (`vercel.json` ya configurado: sitio
estático, regenera en build, `trailingSlash` acorde a los canónicos, cache de
`/assets` y cabeceras de seguridad).

**Opción A — Dashboard:** [vercel.com/new](https://vercel.com/new) → Import Git
Repository → `jpocampom/Velum_Pag_Web`. Production Branch = `main` (o la rama
publicada). Deploy.

**Opción B — CLI:**
```bash
npm i -g vercel
vercel        # preview
vercel --prod # producción
```

Cualquier hosting estático sirve igual (Netlify, Cloudflare Pages, GitHub
Pages…). Recomendado HTTPS + HTTP/2 + Brotli; incluye `.nojekyll`.

---

## 8. Notas

- Repositorio: `jpocampom/Velum_Pag_Web`.
- Identidad (isotipo «Tejido», paleta, tipografía) procedente del brand book de
  VELUM; implementación web a partir de él.
- Este documento y el `README.md` se mantienen junto al código.
