# DESIGN.md — VELUM

Sistema visual del sitio. Objetivo: nivel "agencia 1M$", efecto WOW, **sin caer en el cliché editorial-IA** (serif + mono + filetes + monocromo + cero fotos), que es justo donde estaba el diseño anterior.

## Identidad (se preserva — viene del brand book)
- **Display:** Cormorant Garamond (300/400, italic para énfasis). Conservado por identidad de marca, no por reflejo. Se compensa el riesgo de "lane editorial" con imagen real + color + layout.
- **Body:** DM Sans (400/500). **Mono:** JetBrains Mono — SOLO en datos/etiquetas puntuales, **no** como eyebrow en cada sección.
- Isotipo "Tejido" (warp/weft).

## Color (tokens en `assets/css/velum.css`, arquitectura 3 capas)
- Neutros cálidos: `--paper #FBFAF6`, `--linen #F2EDE3`, `--mist #E4DED1`, `--ink #211F1B`, `--soft #66625A` (AA), `--sage`/`--sage-deep` (acentos suaves AA).
- **NUEVO acento índigo** `--accent #2E3A4B` (+ vivo `#3F5168`): tinte textil noble; rompe el monocromo. Uso ≤5% del viewport — hilo que se teje, link activo, marcador de planta en el mapa, hover de CTA. Nunca más del 5%.
- Canales RGB para componer alfa desde una fuente única (`--c-ink-rgb`, `--c-paper-rgb`).
- Contraste: body ≥4.5:1 verificado.

## Tipografía
- Escala fluida `clamp()`, ratio ≥1.25. Hero serif ≤ ~7rem, tracking ≥ -0.04em. `text-wrap: balance` en h1–h3, `pretty` en prosa. Medida 65–75ch.

## Imágenes (OBLIGATORIO — brief de hotelería)
- Cero fotos = bug. Se usa **stock con licencia libre (Unsplash)** con **URL verificadas** (`https://images.unsplash.com/photo-{id}?auto=format&fit=crop&w=1600&q=80`), sustituible por fotos reales del cliente.
- **Grading unificado** para que todo se vea "caro" y cohesionado: `filter: saturate(.88) contrast(1.04)`, overlay cálido `multiply rgba(40,34,28,.10)`, grano sutil (SVG feTurbulence opacity .045), radio 2px, una sola temperatura de luz cálida.
- Buscar el objeto físico ("crisp white percale hotel bed sunlight"), no la categoría. Alt text descriptivo con keyword.

## Layout
- Hero asimétrico (texto izq. / imagen der.), no centrado genérico. Romper la uniformidad de secciones (art-direction por sección cuando el relato lo pida).
- Eyebrows: como mucho 1–2 deliberados, no en cada sección. Marcadores 01/02/03 solo donde hay secuencia real (proceso).
- `clamp()` para ritmo de espaciado; cards solo cuando son la mejor afordancia (nada de rejillas idénticas de tarjetas).

## Motion (parte del build, no afterthought)
- Carga de hero orquestada: clip-reveal de titular por línea (ease-out-expo), imagen scale 1.04→1.
- **Hilo índigo que se teje al scroll** (SVG dashoffset ligado a progreso) — momento de marca.
- Hover de tarjeta con profundidad (sombra en capas + translateY -4px); mapa que se dibuja al entrar.
- Todo con `@media (prefers-reduced-motion: reduce)` (estado final visible).

## Mapa ibérico
- Line-art (no blob relleno): silueta España+Portugal `stroke` índigo fino sobre textura tejido.
- Plantas propias (2): punto índigo sólido + etiqueta serif. Red de aliados: puntos huecos. Portugal: contorno discontinuo + "próximamente".

## Bans (no hacer)
- Side-stripe borders, gradient text, glass por defecto, hero-metric template, rejillas de tarjetas idénticas, eyebrow tracked en cada sección, 01/02/03 como scaffold, texto que desborda, em dashes en copy, buzzwords.
