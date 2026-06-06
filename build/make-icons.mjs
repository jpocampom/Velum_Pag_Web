/* =====================================================================
   VELUM icon rasterizer — pure Node (zlib), no external deps.
   The Tejido mark (W1 Base) is made of axis-aligned hairlines, so it
   rasterizes exactly as filled rectangles. Emits PNG app icons.
   Run: node build/make-icons.mjs
   ===================================================================== */
import { deflateSync } from "node:zlib";
import { writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const IMG = resolve(ROOT, "assets/img");
mkdirSync(IMG, { recursive: true });

const PAPER = [251, 250, 246, 255];
const INK = [33, 31, 27, 255];

/* W1 weave geometry in a 0..100 space (sw≈2.4 for icon legibility) */
function weaveRects(sw) {
  const d = 3.5, g = 9, h = sw / 2;
  const rects = [];
  const vline = (x, y1, y2) => rects.push([x - h, y1 - h, x + h, y2 + h]);
  const hline = (y, x1, x2) => rects.push([x1 - h, y - h, x2 + h, y + h]);
  [{ x: 30, s: [[6, 27], [45, 94]] }, { x: 70, s: [[6, 55], [73, 94]] }].forEach((v) =>
    v.s.forEach(([y1, y2]) => { vline(v.x - d, y1, y2); vline(v.x + d, y1, y2); }));
  [{ y: 36, s: [[6, 61], [79, 94]] }, { y: 64, s: [[6, 21], [39, 94]] }].forEach((hh) =>
    hh.s.forEach(([x1, x2]) => { hline(hh.y - d, x1, x2); hline(hh.y + d, x1, x2); }));
  return rects;
}

function render(size, { bg, fg, sw = 2.4 }) {
  const px = Buffer.alloc(size * size * 4);
  for (let i = 0; i < size * size; i++) px.set(bg, i * 4);
  const scale = size / 100;
  for (const [x1, y1, x2, y2] of weaveRects(sw)) {
    const ax = Math.round(x1 * scale), ay = Math.round(y1 * scale);
    const bx = Math.round(x2 * scale), by = Math.round(y2 * scale);
    for (let y = Math.max(0, ay); y < Math.min(size, by); y++) {
      for (let x = Math.max(0, ax); x < Math.min(size, bx); x++) {
        px.set(fg, (y * size + x) * 4);
      }
    }
  }
  return px;
}

/* Minimal PNG writer (RGBA, 8-bit, no filtering) */
function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xEDB88320 & -(c & 1));
  }
  return ~c >>> 0;
}
function chunk(type, data) {
  const t = Buffer.from(type, "ascii");
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0);
  const body = Buffer.concat([t, data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}
function png(size, px) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 6; // 8-bit, RGBA
  // raw: each row prefixed with filter byte 0
  const stride = size * 4;
  const raw = Buffer.alloc((stride + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (stride + 1)] = 0;
    px.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride);
  }
  return Buffer.concat([sig, chunk("IHDR", ihdr), chunk("IDAT", deflateSync(raw, { level: 9 })), chunk("IEND", Buffer.alloc(0))]);
}

function emit(name, size, opts) {
  writeFileSync(resolve(IMG, name), png(size, render(size, opts)));
  console.log("  assets/img/" + name + " (" + size + "²)");
}

console.log("VELUM icons:");
emit("icon-192.png", 192, { bg: INK, fg: PAPER, sw: 2.6 });
emit("icon-512.png", 512, { bg: INK, fg: PAPER, sw: 2.6 });
emit("apple-touch-icon.png", 180, { bg: INK, fg: PAPER, sw: 2.8 });
