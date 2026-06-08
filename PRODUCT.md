# PRODUCT.md — VELUM

**Qué es:** Plataforma ibérica de **textile care premium** en modelo **renting** para hostelería, restauración y salud. Dota, cuida y repone el textil de sus clientes bajo un único interlocutor. NO es una lavandería: el lavado/mantenimiento son el soporte; la promesa es disponibilidad e impecabilidad.

**Registro:** brand / marketing (el diseño ES el producto). Sitio estático trilingüe ES·EN·PT, generador propio en Node (sin frameworks) que compila HTML desde JSON (`build/content/*.json`).

**Audiencia:** decisores B2B — directores de hotel, gobernantas/housekeepers, jefes de compras, F&B, maîtres; gestores de hospitales/clínicas/residencias; propietarios de restaurantes premium. Registro de trato: **usted**.

**Posicionamiento:** "VELUM, la plataforma ibérica de textile care premium que cuida, mantiene y repone el textil bajo un único interlocutor." Tagline (promesa de marca, no dato): **"El aliado invisible que sostiene la excelencia."**

**Pilares de mensaje:**
1. Renting-first (modelo de uso, no de propiedad; el lavado es soporte).
2. Un solo interlocutor.
3. Cobertura ibérica: 2 plantas propias (donde nace el estándar) + red nacional de aliados homologados. España ahora, Portugal próximamente.
4. Adaptación 100% (tejido, gramaje, acabado a medida).
5. Tranquilidad "sin sustos" (control de inventario y previsibilidad).

**Verdades de producto (de catálogos de proveedores Resuinsa / Distrihogar):** percal (144 hilos), satén, rizo americano y rizo tundido (tacto aterciopelado), damasco de algodón, nido de abeja, sanforizado, jacquard, plumón/microfibra/downproof; toallas de 500–800 g/m². Marcos de referencia: UNE-EN 14065 (RABC), ISO 9001/14001/50001, OEKO-TEX.

**Reglas de oro:** renting es el héroe; cada cifra es verificable o no se publica; imágenes reales y editoriales (sin máquinas); nunca RFID; "aliado nº1" solo como promesa, jamás como dato; "usted" en todo el copy ES (PT formal, EN estándar).

**No tocar a mano:** los HTML generados. Editar `build/content/` y recompilar (`npm run build`). Trabajo siempre commiteado y pusheado a GitHub (`jpocampom/Velum_Pag_Web`, rama `claude/adoring-cannon-4eRet`, deploy auto en Vercel).
