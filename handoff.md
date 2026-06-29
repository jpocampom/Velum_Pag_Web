# VELUM — Handoff

Documento de entrega del sitio web de **VELUM**, plataforma española de **textile care premium** (renting textil para hostelería, restauración y salud). Sitio **estático, trilingüe (ES · EN · PT)**, sin dependencias de runtime, desplegado en Vercel con cada push.

> Actualizado tras: **portada en vídeo** (5 clips en crossfade) con el slogan sobre panel acristalado; **copy comercial revisado** (posicionamiento "no somos lavandería industrial: somos textile care"); nueva sección **Nuestros Productos** (gama completa + adaptación de lo básico a lo personalizado) y sección **Cómo trabajamos tu textil**; **+6 aliados** en el mapa y en las cifras; **trazabilidad con software (Lavander)**; **datos legales de PCP LAUNDRY, S.L.**; **consentimiento de cookies AEPD + Google Consent Mode v2 (GA4 diferido)**; **dominio byvelum.com**; logo oficial del brand kit; fotografía curada por sector; **versión móvil con dock inferior estilo app** (responsive, un solo código). Mantén este documento junto al código.

---

## 1. Dónde vive todo

| Pieza | Ubicación |
|---|---|
| **Repositorio** | GitHub `jpocampom/Velum_Pag_Web` (público) |
| **Rama de producción / por defecto** | `claude/adoring-cannon-4eRet` |
| **Hosting** | Vercel, proyecto `velum-pag-web` |
| **URL producción** | https://velum-pag-web.vercel.app · **dominio final: `byvelum.com`** (canónicos/OG/JSON-LD ya apuntan ahí; falta conectar el DNS en Vercel) |
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
  transcode-videos.py       Vídeos 4K → MP4 1080p web (crop 16:9, 8s, sin audio) + poster
  iberia-map.svg            Mapa de la Península Ibérica (geografía real) que el build inyecta inline
                            Puntos GEOREFERENCIADOS: viewBox 114.1 390.8 142.2 123.3; contorno con
                            x∈[133.57,251.26], y∈[395.82,509.06]. Transform aprox. (Madrid casa):
                            x=133.57+(lon+9.4989)*9.1816 ; y=395.82+(43.789-lat)*14.540. OJO: el
                            contorno está estilizado → en costas hay que AJUSTAR al trazado real
                            (este sobresale ~+16, norte ~+6, sur ~-7). Plantas Madrid/Bilbao;
                            aliados = Barcelona (236,441), Valencia (211,458), Zaragoza (213,427), Sevilla
                            (166,483), Málaga (181,490) y Oporto (135,427). Plantas: Madrid (186,446)
                            y Bilbao (194,412). Lisboa (123,456) y Oporto van con estilo `.ally`
                            (círculo hueco borde índigo, igual que los aliados).
                            OJO 2: la costa este peninsular ≠ Baleares (las islas están en el
                            trazado a x~251; la costa de Valencia está en x~214). OJO 3: Portugal
                            (`pt-soon`) es un trazado APARTE y comprimido (caja y[414.7,477.7], otra
                            escala); Lisboa/Oporto van en su costa oeste (~66% y ~19% de altura), NO
                            con la fórmula de España. Las **etiquetas de ciudad se localizan**: tokens `{{C_MADRID/BILBAO/LISBOA}}` en el SVG, resueltos en `iberiaMap(c)` desde `coverage.cities` (EN="Lisbon"; ES/PT="Lisboa"). Estilos en CSS: `.plant` relleno índigo;
                            `.ally` hueco con borde índigo; `.pt-label` etiqueta índigo.
  content/
    es.json en.json pt.json      Contenido por idioma (FUENTE DE VERDAD; ES es la versión maestra)
    legal/{es,en,pt}/*.html       Cuerpos legales por idioma
assets/
  css/velum.css        Sistema de diseño (tokens 3 capas, componentes, motion)
  js/velum.js          Comportamiento (nav, reveals, PointerHighlight, portada-vídeo, cookies, scroll)
  img/                 Logo oficial (lockups/símbolo), favicon, OG, iconos
  img/photos/          Fotografía real optimizada a WebP (sectores, galería, gestor, materiales)
  video/               Portada: velum-hero-1..5.mp4 (1080p, ~6.4 MB total) + hero-poster.webp
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

- Todo el texto vive en `build/content/{es,en,pt}.json` con la **misma estructura de claves** en los tres idiomas (paridad exacta: 390 claves). El **español es la versión maestra**; al cambiar ES, replica en EN y PT.
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
- **Logo**: se usa el **lockup oficial del brand kit** (PNG transparente → WebP en `assets/img/`), no una recreación. Header con `velum-lockup` (ink, 56px; blanco vía filtro sobre la portada en vídeo); footer con `velum-lockup-tagline-blanco` (incluye la tagline "Tu textil. Nuestro compromiso."). Favicon/iconos/OG generados desde el símbolo y lockup oficiales (ver §“Marca” abajo). Originales en `…/PCP Laundry/logos-velum/`.
- **Mensaje / posicionamiento**: hilo conductor **"No somos una lavandería industrial: somos textile care; gestionamos tu textil para que la ropa deje de ser tu problema"**, presente en manifiesto, intro de servicios y `meta.description` (ES/EN/PT). El **hero lidera con el beneficio**: «Tu textil siempre impecable y a punto, sin que tengas que ocuparte de nada…». **CTA unificado en toda la web: "Solicitar propuesta" / "Request a proposal" / "Pedir proposta"** (header/nav, hero, recuadro de servicios —botón acristalado `.svc-cta-btn`—, píldora del dock móvil y cierre). Copy revisado por agentes (conversión + confianza B2B): garantía de calidad, transición desde el proveedor actual, control sobre los aliados y reaseguro en CTA.
- **Color**: neutros cálidos (`--paper`, `--linen`, `--mist`, `--ink`, `--soft`) + **acento índigo `#2E3A4B`** (`--accent`), uso ≤5%. Tokens en 3 capas (primitive → semantic) con canales RGB; cambiar `--c-ink`/`--c-paper`/`--c-indigo` reskinea todo.
- **Imágenes**: fotografía real **curada por tipo de cliente** (carpetas `Fotos/Hosteleria · Restauracion · Hospitalario` en el OneDrive de PCP) con *grading* índigo unificado. Optimizadas a WebP en `assets/img/photos/`.
- **Motion**: scroll-reveal, PointerHighlight (subrayado), hover de tarjetas, mapa; todo respeta `prefers-reduced-motion`.
- **Mapa**: `build/iberia-map.svg` — silueta real de Iberia; **2 plantas propias (Madrid y Bilbao)** como puntos índigo sólidos (con etiqueta) + **6 aliados** como círculos huecos (Barcelona, Zaragoza, Valencia, Sevilla, Málaga, A Coruña). Leyenda: «Plantas propias / Aliados homologados / Portugal — próximamente». Portugal en discontinuo. Posiciones validadas con *hit-test* sobre la silueta para que caigan en tierra firme. La banda de cifras refleja **+6 aliados nacionales homologados**.

### Orden del home
**portada en vídeo** → banda de confianza → manifiesto (Acerca) → por qué VELUM (5 ventajas, incl. Previsibilidad) → servicios (incl. Controlar = trazabilidad con software **Lavander**) → **cómo trabajamos tu textil** (recogida/expediciones, lavado especializado, maquinaria, control, trazabilidad) → sectores → **Nuestros Productos** → galería → gestor/interlocutor → cobertura (mapa) → FAQ → contacto.

### Nuestros productos
- Sección `id="productos"` (clave `products` en los JSON): intro comercial (gama completa + adaptación, **de lo básico a lo personalizado**) + rejilla de 4 familias (Habitación, Baño, Restauración, Salud) con tipos/formatos, y cierre sobre personalización (bordados, logos, medidas a medida). Añadida al `nav` como «Productos/Products/Produtos». Gama basada en los catálogos de los proveedores homologados.

### Portada en vídeo (hero)
- El hero es a pantalla completa (`.hero--video`): **5 vídeos** (`assets/video/velum-hero-1..5.mp4`) apilados que hacen **crossfade** cada 6,5 s mediante un único temporizador en `velum.js` (sincronizado, fundido de 1,4 s). Sólo el primero precarga con `poster`; el resto se cargan al activarse.
- El **slogan** (titular + sub) va encima sobre un **panel acristalado** (`liquid-glass`, opacidad ~0.26 + blur) para legibilidad sobre cualquier fotograma; el énfasis "no pueden fallar" usa índigo claro `--accent-soft`.
- El **header flota en claro** sobre el vídeo (logo en blanco vía filtro, nav clara) y vuelve a oscuro al hacer scroll (clase `over-hero` en `velum.js`).
- Respeta `prefers-reduced-motion`: sin rotación ni animación de entrada.
- **Cambiar/añadir vídeos**: coloca los originales y edita la lista `ORDER` en `build/transcode-videos.py`; ejecútalo (requiere `pip install imageio-ffmpeg`, trae ffmpeg). Genera `velum-hero-N.mp4` 1080p + `hero-poster.webp`. Luego `npm run build` (cache-bust `?v=` automático). El nº de clips se detecta solo en el build (array `[1..5]` en `build.mjs`, ajústalo si cambias la cantidad).

### Página de Productos (`/productos`, `/en/products`, `/pt/produtos`)
- **Página dedicada, profesional y comercial** generada por `buildProducts()` desde la clave `productosPage` de los JSON (ES/EN/PT, paridad 228 claves). Estructura: hero + 4 *claims* + gama por **4 familias** (Habitación, Baño, Restauración, Salud) con grupos y specs reales (densidades 250–1.000 hilos, rizo 420–650 g/m², gramajes, etc.) + **Personalización** + **Certificaciones** (OEKO-TEX® STANDARD 100, STeP, UNE-EN ISO 15797, RFID) + CTA.
- **Contenido AGNÓSTICO de proveedor** (no se nombra a nadie) y con las **exclusiones** del cliente aplicadas (sin almohadas/edredones/rellenos, zapatillas, jacquard/antimanchas, fundas de silla, textil técnico de planta). Fuente: catálogos PDF en `…/Pagina Web/PDF & Pag WEBs/` (Hotel Division + Resuinsa). Webs de referencia del cliente (royaleuropetextile, stranfford, vayoiltextil, distrihogar, bassols, resuinsa) — revisar si se quiere ampliar Salud.
- **Fusión sectores↔productos**: cada tarjeta de sector (home) lleva ahora «Qué textil cubrimos» + enlace **«Ver toda la gama» → /productos**. La antigua sección de productos del home se **eliminó** (unificación). Nav y dock «Productos» enlazan a la página (item con `route: "productos"`). Ruta en `ROUTES`, incluida en sitemap/hreflang automáticamente.
- **Interactivo**: las 4 familias van en **pestañas** (`.prod-tabs`/`.prod-tab` + `.prod-panel`), con JS `productTabs()` en `velum.js` (accesible, flechas del teclado, fade al cambiar). Salud tiene 4 grupos (incl. «Residencias y quirófano») a partir de la investigación de las webs (WebFetch funciona desde el agente principal; Stranfford da error SSL).
- Estilos: `.prod-claims/.prod-claim`, `.prod-tabs/.prod-tab/.prod-panel`, `.prod-family/.prod-groups/.prod-group`, `.prod-custom/.prod-custom-list`, `.prod-certs/.prod-cert`, y `.sector-products*` en `velum.css`.
- **Foto del gestor** («tu interlocutor»): es el apretón de manos (`assets/img/photos/gestor.webp`, origen `Fotos/pexels-fauxels-3184465.jpg`).

### Home — interacciones y maquetación
- **Párrafos justificados** en todo el contenido (`text-align: justify` + `hyphens: auto`) — ver bloque en `velum.css`.
- **«Por qué VELUM»** (`.why-cell`): en escritorio (hover) solo se ve el **título**; la descripción **se despliega al pasar el ratón** (afford. `+` que gira). En táctil/móvil se muestra todo (`@media (hover: hover)`).
- **«El Modelo»** (`.svc-card`): tarjetas más compactas (menos padding/min-height) para que ocupen menos.
- **Proceso «Cómo trabajamos»**: reconvertido de lista a **infografía de flujo** (`.flow`/`.flow-step`/`.flow-node`/`.flow-icon`): horizontal con nodos conectados en escritorio, timeline vertical en móvil.

### Versión móvil (dock inferior tipo app)
- **No hay dos sitios**: es **una sola web responsive**. En escritorio se ve el header arriba; en **móvil (≤980 px)** aparece un **dock flotante** abajo (estilo app) y se oculta el menú hamburguesa. Al ser un único código, **web y móvil se actualizan siempre juntas** en cada push.
- El dock (`mobileDock()` en `build.mjs`, estilos `.mobile-dock`/`.dock-*` en CSS, lógica en `velum.js`) lleva un icono por sección (Inicio, Acerca, Servicios, Productos, Sectores, Cobertura · separador · Contacto), con **estado activo** (índigo claro + punto) y **tooltip** de la sección en vista (IntersectionObserver), más una píldora **«Solicitar propuesta»** (hereda `hero.ctaPrimary`). Etiquetas en la clave `dock` de los JSON (3 idiomas). Para añadir/quitar iconos: edita el array `DOCK` en `build.mjs` (cada item: `id` de sección + `icon` + `key` de etiqueta) y la clave `dock`.
- **Hero de vídeo en móvil**: usa **metraje VERTICAL 9:16 real** (no recortes del 16:9): el cliente aportó clips verticales en `…/Pagina Web/Videos/Videos Verticales/`. El script **`build/transcode-mobile.py`** elige 5 (lista `ORDER`) y los saca a `velum-hero-m-1..5.mp4` (720×1280, ~150–525 KB) + `hero-poster-m.webp`. Con `object-fit:cover` llenan la pantalla del teléfono edge-to-edge, sin recortes raros ni desenfoque. El generador crea dos pilas (`.hero__bg--d` 16:9 escritorio / `.hero__bg--m` 9:16 móvil); el CSS muestra una u otra según el ancho (≤980 px) y `velum.js` reproduce/rota solo la pila visible (la oculta no se descarga). Para regenerar: edita `ORDER` en `transcode-mobile.py` y ejecútalo, luego `npm run build`. **Tiempos**: los clips duran **8 s** y la rotación va a **6 s** (`setInterval(rotate, 6000)`); el clip de vídeo DEBE durar más que el intervalo, si no hace *loop* visible (reinicio) antes del crossfade = "salto". Autoplay robusto: la rotación no arranca hasta que el clip reproduce de verdad, y si iOS (bajo consumo) bloquea el autoplay, arranca al primer toque/scroll.

### Añadir/cambiar fotos
1. Coloca el original en `Fotos/` o `assets/img/photos/`.
2. Mapea origen→slug en `build/convert-photos.py` y ejecútalo (resize a lado máx. ~1600 px + WebP q82). Los slugs (`sector-*`, `hero-suite`, `galeria-rollos`, `materiales`, `restauracion-2/3`, `salud-2/3`, `gestor`) se referencian en `build.mjs`.
3. `npm run build`. El cache-busting `?v=hash` es automático: cambiar un WebP con el mismo nombre refresca al instante.

### Marca (logo / iconos / OG)
- Lockups y símbolo viven en `assets/img/` como WebP/PNG (`velum-lockup`, `velum-lockup-blanco`, `velum-lockup-tagline-blanco`; `favicon.png`, `apple-touch-icon.png`, `icon-192/512.png`, `og-velum.png`).
- Para regenerarlos desde el kit oficial: `python build/generate-brand-assets.py` (toma los PNG de `…/logos-velum/` y produce footer-tagline, iconos sobre fondo ink y OG 1200×630).
- El `og:image` es **PNG** (renderiza en redes); el favicon usa el **símbolo oficial** (con `favicon.svg` vectorial como alternativa).

### Cookies, consentimiento y analítica (AEPD/RGPD + Google Consent Mode v2)
- Banner en la 1ª visita con 3 opciones **equiparables** (Aceptar todas / Rechazar todas / Configurar) + **panel de preferencias** por categorías: Necesarias (siempre activas) y Analíticas (opcional, **off por defecto**). Markup en `cookieBanner()` de `build.mjs`; textos en la clave `cookies` de los JSON (3 idiomas).
- **Google Consent Mode v2** en `assets/js/velum.js`: por defecto todo `denied`; al consentir analíticas se hace `consent update` y se carga **GA4 una sola vez** (IP anonimizada). Constante **`GA_MEASUREMENT_ID`** (placeholder `G-XXXXXXXXXX`): mientras sea el placeholder, **GA NO se carga**; sustitúyela por el ID real de GA4.
- Preferencia en `localStorage` (`velum_cookie_consent_v2`), **caducidad 12 meses**. Revocar/cambiar en cualquier momento: enlace «Configuración de cookies» del pie **y** botón «Cambiar mis preferencias de cookies» dentro de la Política de cookies (ambos reabren el panel).
- **Política de cookies y aviso legal conformes** (RGPD/LOPDGDD/LSSI/guía AEPD 2023), trilingües, con tabla de cookies (incl. GA4 `_ga`/`_ga_<ID>`), transferencias a EE. UU. (Data Privacy Framework + SCC) y gestión del consentimiento.

---

## 6. Rendimiento y caché (resuelto)

- **Cache-busting por hash de contenido**: `velum.css`/`velum.js` se enlazan con `?v=<sha1>`. Cada cambio genera una URL nueva → los navegadores cargan la versión fresca al instante (evita assets "congelados").
- `vercel.json`: CSS/JS y `/assets/video` `immutable` (van versionados); `/assets/img` con `max-age=1d + stale-while-revalidate`; cabeceras de seguridad. **`buildCommand` = `node build/build.mjs`** (se quitó `make-icons` para no pisar los iconos oficiales ya commiteados).
- Imágenes con `loading="lazy"`, `width/height` (sin CLS) y `decoding="async"`.
- **Vídeo de portada**: ~6,4 MB en total (5 clips 1080p), `muted`/`playsinline`/`loop`; sólo el 1º precarga, con `poster` para el LCP.

---

## 7. Pendientes antes de producción ✅ checklist

- [~] **Datos legales / de empresa**: ✅ cumplimentados razón social (**PCP LAUNDRY, S.L.**), NIF (**B-21947916**), domicilio (**C/ Don Ramón de la Cruz 17, 3.º dcha., 28001 Madrid**) y registro (**RM de Madrid, Hoja M-855.350**) en JSON-LD, footer y textos legales. **Pendiente**: email y teléfono de contacto, estado/registro de la marca VELUM (OEPM/EUIPO), proveedores RGPD (hosting/correo/analítica/gestoría) en privacidad, fecha de última actualización de los legales, y **revisión por asesoría legal** antes de publicar.
- [ ] **Backend del formulario**: hoy hace confirmación en cliente. Conectar endpoint real (servicio de formularios / función serverless / `mailto`) en el handler `form.submit` de `assets/js/velum.js`.
- [x] **Analítica con consentimiento**: implementado **Google Consent Mode v2** (todo denegado por defecto) + **GA4 con carga diferida** tras consentimiento analítico (IP anonimizada). **Pendiente**: sustituir `GA_MEASUREMENT_ID = 'G-XXXXXXXXXX'` en `assets/js/velum.js` por el ID real, y el `[ID GA]` de la tabla de la Política de cookies.
- [x] **Imagen Open Graph**: ~~SVG~~ → ahora **`og-velum.png` 1200×630** (lockup + tagline sobre ink). Nota: las redes cachean el OG; al pasar al dominio final, forzar re-scrape en el *debugger* de cada red.
- [ ] **Cifras y certificaciones**: sustituir afirmaciones por datos verificados de VELUM; los sellos de Estándares (UNE-EN 14065, ISO 9001/14001/50001, OEKO-TEX) deben corresponder a certificaciones vigentes con alcance nombrado.
- [ ] **Fotografía definitiva**: reemplazar el stock/placeholders por fotos reales de marca cuando estén disponibles (estructura ya preparada).
- [~] **Dominio**: el código ya usa `https://byvelum.com` (DOMAIN/hreflang/canónicos/OG/legales). **Pendiente**: conectar `byvelum.com` en Vercel (DNS). Portugal se sirve en `/pt/`.
- [ ] **(Opcional) Rama `main`**: renombrar la rama de producción.

---

## 8. Notas

- Repositorio: `jpocampom/Velum_Pag_Web`. Identidad (isotipo «Tejido», paleta, tipografía) procedente del brand book de VELUM.
- Plantas propias reales: **Madrid y Bilbao**; cobertura nacional vía **red de +6 aliados homologados** (lavanderías que prestan el servicio). Reflejado en mapa, cifras y copy.
- **Decisión del cliente: NO nombrar públicamente** (por ahora) ni a proveedores ni a aliados. Se muestran como "red homologada" sin marca. Referencia interna —no publicar sin permiso—: aliados/lavanderías **McLean, Metinta** (y posible **Hispalimpia**); proveedores de producto **Royal Europe Textile, Stranfford, Vayoil, Distrihogar, Bassols, Resuinsa**.
- La gama de **Nuestros Productos** se basó en los catálogos de esos proveedores (sin nombrarlos). Solo se listan productos que VELUM **sí** ofrece: se excluyeron almohadas/edredones/rellenos, zapatillas, fundas de silla, jacquard/antimanchas y textil técnico de planta.
- Vídeos de portada: originales 4K en `…/Pagina Web/Videos/` (elegidos por el cliente); las versiones web ligeras se generan con `build/transcode-videos.py`.
- `PRODUCT.md` y `DESIGN.md` documentan el posicionamiento y el sistema de diseño en detalle.
- El árbol de trabajo puede mostrar avisos de fin de línea (CRLF↔LF) en Windows; es cosmético y no afecta al contenido. Un `.gitattributes` con `* text=auto eol=lf` lo normalizaría.
