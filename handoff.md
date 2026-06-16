# VELUM — Handoff

Documento de entrega del sitio web de **VELUM**, plataforma ibérica de **textile care premium** (renting textil para hostelería, restauración y salud). Sitio **estático, trilingüe (ES · EN · PT)**, sin dependencias de runtime, desplegado en Vercel con cada push.

> Actualizado tras el rediseño completo + logo oficial del brand kit (header/footer con tagline), fotografía curada por sector, mapa con Madrid y Bilbao, resalte en subrayado y OG en PNG. Mantén este documento junto al código.

---

## 1. Dónde vive todo

| Pieza | Ubicación |
|---|---|
| **Repositorio** | GitHub `jpocampom/Velum_Pag_Web` (público) |
| **Rama de producción / por defecto** | `claude/adoring-cannon-4eRet` |
| **Hosting** | Vercel, proyecto `velum-pag-web` |
| **URL producción** | https://velum-pag-web.vercel.app (dominio final previsto: `velum.es`) |
| **Despliegue** | Automático: cada `git push` a la rama de producción dispara un deploy en Vercel |

> **Recomendación**: renombrar la rama a `main` (más estándar). GitHub y Vercel se reajustan solos al ser la rama por defecto. No se ha hecho para no alterar el deploy sin confirmación.

---

## 2. Stack y estructura

Sin frameworks. Generador estático propio en Node (cero dependencias) que compila HTML localizado desde JSON.

```
build/
  build.mjs                 Generador (rutas, plantillas, JSON-LD, sitemap, highlights, cache-busting)
  make-icons.mjs            Rasterizador antiguo del isotipo (recreación geométrica; ya no es la fuente)
  convert-photos.py         Origen JPG → WebP del sitio (mapeo slug, resize, q82)
  generate-brand-assets.py  Kit oficial → footer-tagline, favicon/iconos y OG (Pillow)
  iberia-map.svg            Mapa de la Península Ibérica (geografía real) que el build inyecta inline
  content/
    es.json en.json pt.json      Contenido por idioma (FUENTE DE VERDAD; ES es la versión maestra)
    legal/{es,en,pt}/*.html       Cuerpos legales por idioma
assets/
  css/velum.css        Sistema de diseño (tokens 3 capas, componentes, motion)
  js/velum.js          Comportamiento (nav, reveals, PointerHighlight, cookies, scroll)
  img/                 Logo oficial (lockups/símbolo), favicon, OG, iconos
  img/photos/          Fotografía real optimizada a WebP (hero, sectores, galería, gestor, materiales)
index.html · en/ · pt/ · servicios/ · sectores/ · aviso-legal/ …   (GENERADO — no editar a mano)
sitemap.xml · robots.txt · site.webmanifest · 404.html · vercel.json
README.md · handoff.md · PRODUCT.md · DESIGN.md
```

> **Regla de oro**: edita `build/content/` (y `assets/`) y recompila. **No edites los HTML generados a mano.**

---

## 3. Ejecutar y compilar

Requiere **Node ≥ 18**. Cero dependencias para compilar.

```bash
npm run icons   # genera los PNG del isotipo (solo si cambia la marca)
npm run build   # genera todas las páginas + sitemap/robots/manifest + inyecta mapa y highlights
npm run all     # iconos + build
npm run serve   # servidor local → http://localhost:8080
```

Flujo de trabajo: editar `build/content/*.json` → `npm run build` → revisar → `git add` + `commit` + `push` (despliega solo).

---

## 4. Editar contenido / traducciones

- Todo el texto vive en `build/content/{es,en,pt}.json` con la **misma estructura de claves** en los tres idiomas (paridad exacta: 321 claves). El **español es la versión maestra**; al cambiar ES, replica en EN y PT.
- Registro: **ES en "tú"** (peninsular), **EN** estándar, **PT-PT** formal ("você").
- Textos legales (más largos) en `build/content/legal/{idioma}/`.
- Tras editar: `npm run build`.

### Marcador de resalte (PointerHighlight)
Para resaltar una palabra con el **subrayado animado** + cursor (se traza al entrar en viewport), envuélvela con dobles corchetes en el JSON:
```
"title": "Un modelo [[renting-first]], pensado para no fallar."
```
El build transforma `[[palabra]]` en el componente, que se anima al entrar en viewport. Actualmente aplicado en 3 titulares (manifiesto, servicios, por qué) en los 3 idiomas. Úsalo con moderación.

---

## 5. Sistema de diseño (resumen — ver `DESIGN.md`)

- **Tipografía** (= brand book): **Cormorant Garamond** (display), **DM Sans** (cuerpo), **JetBrains Mono** (etiquetas/datos).
- **Logo**: se usa el **lockup oficial del brand kit** (PNG transparente → WebP en `assets/img/`), no una recreación. Header con `velum-lockup` (ink); footer con `velum-lockup-tagline-blanco` (incluye la tagline "Tu textil. Nuestro compromiso."). Favicon/iconos/OG generados desde el símbolo y lockup oficiales (ver §“Marca” abajo). Originales en `…/PCP Laundry/logos-velum/`.
- **Color**: neutros cálidos (`--paper`, `--linen`, `--mist`, `--ink`, `--soft`) + **acento índigo `#2E3A4B`** (`--accent`), uso ≤5%. Tokens en 3 capas (primitive → semantic) con canales RGB; cambiar `--c-ink`/`--c-paper`/`--c-indigo` reskinea todo.
- **Imágenes**: fotografía real **curada por tipo de cliente** (carpetas `Fotos/Hosteleria · Restauracion · Hospitalario` en el OneDrive de PCP) con *grading* índigo unificado. Optimizadas a WebP en `assets/img/photos/`.
- **Motion**: scroll-reveal, PointerHighlight (subrayado), hover de tarjetas, mapa; todo respeta `prefers-reduced-motion`.
- **Mapa**: `build/iberia-map.svg` — silueta real de Iberia; **solo las 2 plantas propias (Madrid y Bilbao)** como puntos índigo (sin puntos de aliados; la red de aliados se explica en el copy). Portugal en discontinuo "próximamente". Posiciones validadas con *hit-test* sobre la silueta para que caigan en tierra firme.

### Orden del home
hero → banda de confianza → manifiesto (Acerca) → por qué VELUM → servicios → cómo trabajamos → sectores → galería → gestor/interlocutor → cobertura (mapa) → FAQ → contacto.

### Añadir/cambiar fotos
1. Coloca el original en `Fotos/` o `assets/img/photos/`.
2. Mapea origen→slug en `build/convert-photos.py` y ejecútalo (resize a lado máx. ~1600 px + WebP q82). Los slugs (`sector-*`, `hero-suite`, `galeria-rollos`, `materiales`, `restauracion-2/3`, `salud-2/3`, `gestor`) se referencian en `build.mjs`.
3. `npm run build`. El cache-busting `?v=hash` es automático: cambiar un WebP con el mismo nombre refresca al instante.

### Marca (logo / iconos / OG)
- Lockups y símbolo viven en `assets/img/` como WebP/PNG (`velum-lockup`, `velum-lockup-blanco`, `velum-lockup-tagline-blanco`; `favicon.png`, `apple-touch-icon.png`, `icon-192/512.png`, `og-velum.png`).
- Para regenerarlos desde el kit oficial: `python build/generate-brand-assets.py` (toma los PNG de `…/logos-velum/` y produce footer-tagline, iconos sobre fondo ink y OG 1200×630).
- El `og:image` es **PNG** (renderiza en redes); el favicon usa el **símbolo oficial** (con `favicon.svg` vectorial como alternativa).

---

## 6. Rendimiento y caché (resuelto)

- **Cache-busting por hash de contenido**: `velum.css`/`velum.js` se enlazan con `?v=<sha1>`. Cada cambio genera una URL nueva → los navegadores cargan la versión fresca al instante (evita assets "congelados").
- `vercel.json`: CSS/JS `immutable` (van versionados); `/assets/img` con `max-age=1d + stale-while-revalidate`; cabeceras de seguridad.
- Imágenes con `loading="lazy"`, `width/height` (sin CLS) y `decoding="async"`; hero con `fetchpriority="high"`.

---

## 7. Pendientes antes de producción ✅ checklist

- [ ] **Datos legales / de empresa**: rellenar todos los `[CORCHETES]` en `build/content/legal/**` y en el JSON-LD / footer (`[RAZÓN SOCIAL]`, CIF, domicilio, datos registrales, email, teléfono, nº de marca OEPM/EUIPO). **Revisión por asesoría legal** antes de publicar.
- [ ] **Backend del formulario**: hoy hace confirmación en cliente. Conectar endpoint real (servicio de formularios / función serverless / `mailto`) en el handler `form.submit` de `assets/js/velum.js`.
- [ ] **Analítica con consentimiento**: insertar el loader en `loadAnalytics()` de `assets/js/velum.js` (se ejecuta solo tras aceptar cookies).
- [x] **Imagen Open Graph**: ~~SVG~~ → ahora **`og-velum.png` 1200×630** (lockup + tagline sobre ink). Nota: las redes cachean el OG; al pasar al dominio final, forzar re-scrape en el *debugger* de cada red.
- [ ] **Cifras y certificaciones**: sustituir afirmaciones por datos verificados de VELUM; los sellos de Estándares (UNE-EN 14065, ISO 9001/14001/50001, OEKO-TEX) deben corresponder a certificaciones vigentes con alcance nombrado.
- [ ] **Fotografía definitiva**: reemplazar el stock/placeholders por fotos reales de marca cuando estén disponibles (estructura ya preparada).
- [ ] **Dominio**: apuntar `velum.es` a Vercel y revisar `DOMAIN`/`hreflang`/canónicos en `build/build.mjs`. Portugal hoy se sirve en `/pt/`.
- [ ] **(Opcional) Rama `main`**: renombrar la rama de producción.

---

## 8. Notas

- Repositorio: `jpocampom/Velum_Pag_Web`. Identidad (isotipo «Tejido», paleta, tipografía) procedente del brand book de VELUM.
- Plantas propias reales: **Madrid y Bilbao**; el resto de cobertura nacional es vía red de aliados homologados (reflejado en mapa y copy).
- Catálogos de referencia de producto usados para el copy: Distrihogar Hotel Division y Resuinsa Profesional.
- `PRODUCT.md` y `DESIGN.md` documentan el posicionamiento y el sistema de diseño en detalle.
- El árbol de trabajo puede mostrar avisos de fin de línea (CRLF↔LF) en Windows; es cosmético y no afecta al contenido. Un `.gitattributes` con `* text=auto eol=lf` lo normalizaría.
