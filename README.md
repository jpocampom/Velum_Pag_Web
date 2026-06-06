# VELUM — Web

Sitio corporativo **premium y trilingüe (ES · EN · PT)** de VELUM, la plataforma
ibérica de **cuidado textil** (renting textil, lavado industrial y gestión textil
integral) para hostelería, restauración y salud.

Posicionamiento: **textile care, no lavandería**. Diseño editorial, cálido y
sobrio — tipografía Cormorant Garamond + DM Sans, paleta de blancos cálidos y
carbón, e isotipo **«Tejido»** (tejido 2×2 con textura de hilo) heredado del
brand book.

Sitio **estático, sin dependencias de runtime**: HTML/CSS/JS puro, generado
desde una única fuente de contenido por idioma. Pensado para máxima velocidad
(Core Web Vitals), SEO internacional y accesibilidad.

---

## Estructura del repositorio

```
build/
  build.mjs              Generador estático (Node, sin dependencias)
  make-icons.mjs         Rasterizador PNG del isotipo (favicon/app icons)
  content/
    es.json en.json pt.json     Contenido por idioma (única fuente de verdad)
    legal/{es,en,pt}/*.html      Cuerpos de las páginas legales por idioma
assets/
  css/velum.css          Sistema de diseño
  js/velum.js            Interacción (header, reveal, cookies, formulario)
  img/                   Isotipo SVG, favicon, OG e iconos PNG (generados)
index.html               (GENERADO) Home ES — raíz
servicios/ sectores/     (GENERADO) Páginas de Servicios y Sectores (ES)
en/ pt/                  (GENERADO) Home + servicios/sectores + legales EN / PT
aviso-legal/ ...         (GENERADO) Páginas legales por idioma
sitemap.xml robots.txt site.webmanifest 404.html   (GENERADO / estático)
```

> Los HTML de páginas y los ficheros raíz (`sitemap.xml`, `robots.txt`,
> `site.webmanifest`) y los iconos de `assets/img/` son **generados**. Edita el
> **contenido en `build/content/`** y vuelve a compilar — no edites los HTML a mano.

## Compilar

```bash
npm run icons   # genera los PNG del isotipo (una vez, o si cambia la marca)
npm run build   # genera las 18 páginas + sitemap/robots/manifest/SVGs
npm run all     # iconos + build
npm run serve   # servidor local de desarrollo → http://localhost:8080
```

Requiere **Node ≥ 18**. No instala nada (cero dependencias).

## Editar contenido / traducciones

- Todo el texto vive en `build/content/{es,en,pt}.json` con la **misma
  estructura de claves** en los tres idiomas.
- Los cuerpos legales (más largos) están en `build/content/legal/{idioma}/`.
- Tras editar, ejecuta `npm run build`.
- El español (`es.json`) es la **versión maestra**; EN y PT son traducciones.

## Arquitectura i18n y SEO

- Rutas por idioma: ES en la raíz (`/`), EN en `/en/`, PT en `/pt/`.
- `hreflang` autorreferencial (`es-ES`, `en`, `pt-PT`) + `x-default` → español,
  presente en cada página y en `sitemap.xml`.
- `canonical` propio por página; `<html lang>` correcto por idioma.
- JSON-LD: `Organization`, `WebSite`, `Service` y `FAQPage`.
- Open Graph + Twitter Card, `theme-color`, manifest PWA, favicon SVG + PNG.
- Conmutador de idioma con enlaces reales rastreables que apuntan a la página
  equivalente en cada idioma.

> **Portugal:** la estrategia SEO recomienda a futuro un ccTLD `velum.pt`. Aquí
> se sirve PT en `/pt/` sobre el mismo dominio (válido y consolidado). El cambio
> a `velum.pt` solo requiere ajustar `ROUTES`/`DOMAIN` en `build/build.mjs`.

## Cumplimiento legal (RGPD / LSSI / cookies)

- Banner de cookies conforme a la guía de la AEPD: **no se cargan scripts no
  esenciales hasta el consentimiento**; «Rechazar» tan accesible como «Aceptar»;
  el consentimiento se guarda y se puede revocar desde el pie («Configuración de
  cookies»).
- La analítica se carga **solo tras consentimiento** — ver `loadAnalytics()` en
  `assets/js/velum.js` (placeholder listo para insertar GA4/Matomo).
- Páginas legales (Aviso legal, Privacidad, Cookies) en los tres idiomas.

## Pendientes antes de producción (handoff)

Marcados con `[CORCHETES]` en el contenido y aquí:

1. **Datos legales/de empresa:** rellenar todos los `[CORCHETES]` en las páginas
   legales y en el JSON-LD de `build/build.mjs` (razón social, CIF, domicilio,
   datos registrales, email, teléfono, nº de marca OEPM/EUIPO, encargados del
   tratamiento). Revisión por asesoría legal antes de publicar.
2. **Backend del formulario:** el formulario hace una confirmación en cliente.
   Conectar un endpoint real (servicio de formularios, función serverless o
   `mailto`) en `assets/js/velum.js` (handler `form.submit`).
3. **Analítica:** insertar el loader consentido en `loadAnalytics()`.
4. **Imagen Open Graph:** se incluye un `og-velum.svg`; varias redes no renderizan
   SVG. Exportar un **PNG 1200×630** y actualizar las metaetiquetas `og:image`.
5. **Fotografía:** el diseño es deliberadamente tipográfico/textural (recomendación
   del análisis competitivo: evitar stock genérico). Hay puntos naturales para
   añadir fotografía editorial original (hero, sectores, gestor dedicado, planta).
6. **Certificaciones:** la sección «Estándares» lista normas de referencia del
   sector como guía de procesos (redactada con honestidad para una marca nueva).
   Cuando VELUM obtenga certificaciones, reemplazar por los sellos vigentes.
7. **Cifras propias:** sustituir métricas cualitativas por datos verificados de
   VELUM (ahorro de agua/energía, retención, vida útil, etc.) cuando existan.
8. **Catálogos de proveedores:** quedaron pendientes de adjuntar; pueden integrarse
   como sección de producto o descargas por sector.

## Despliegue

Cualquier hosting estático (Netlify, Vercel, Cloudflare Pages, GitHub Pages, S3).
Subir el contenido del repositorio tal cual. Recomendado: HTTPS, HTTP/2+, Brotli,
cabeceras de caché largas para `/assets/*`. Incluye `.nojekyll` para GitHub Pages.
```

Créditos: identidad VELUM (isotipo «Tejido», paleta y tipografía) del brand book
de Claude Design; implementación web a partir de él.
