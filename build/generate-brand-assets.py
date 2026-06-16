#!/usr/bin/env python3
"""Genera los assets de marca del sitio desde el kit oficial (logos-velum):
- velum-lockup-tagline-blanco.webp (footer)
- favicon.png / apple-touch-icon.png / icon-192 / icon-512 (simbolo oficial sobre ink)
- og-velum.png 1200x630 (lockup con tagline sobre ink) para redes sociales
"""
from pathlib import Path
from PIL import Image

SRC = Path(r"C:\Users\JPO\Pax Capital Partners\PCP - Documents\PCP\1. Compañias\1. Activos\4. PCP Laundry\Pagina Web\PCP Laundry\logos-velum")
OUT = Path(r"C:\Users\JPO\ClaudeCode\Velum_Pag_Web\assets\img")

INK = (33, 31, 27, 255)

def load(name):
    return Image.open(SRC / name).convert("RGBA")

# 1) Footer: lockup con tagline (blanco) -> WebP transparente
tag = load("velum-lockup-tagline-blanco-4x.png")
H = 240
tag_r = tag.resize((round(tag.width * H / tag.height), H), Image.LANCZOS)
tag_r.save(OUT / "velum-lockup-tagline-blanco.webp", "WEBP", lossless=True, quality=100, method=6)
print("velum-lockup-tagline-blanco.webp", tag_r.size)

# 2) Iconos cuadrados: simbolo blanco oficial centrado sobre fondo ink
symbol = load("velum-simbolo-blanco-4x.png")
def square_icon(size, pad_ratio):
    canvas = Image.new("RGBA", (size, size), INK)
    inner = round(size * (1 - 2 * pad_ratio))
    s = symbol.resize((inner, inner), Image.LANCZOS)
    off = (size - inner) // 2
    canvas.alpha_composite(s, (off, off))
    return canvas

for name, size, pad in [("favicon.png", 64, 0.16),
                         ("icon-192.png", 192, 0.18),
                         ("icon-512.png", 512, 0.18),
                         ("apple-touch-icon.png", 180, 0.20)]:
    square_icon(size, pad).save(OUT / name, "PNG")
    print(name, f"{size}x{size}")

# 3) OG 1200x630: lockup con tagline (blanco) centrado sobre ink
og = Image.new("RGBA", (1200, 630), INK)
target_w = 560
lk = tag.resize((target_w, round(tag.height * target_w / tag.width)), Image.LANCZOS)
og.alpha_composite(lk, ((1200 - lk.width) // 2, (630 - lk.height) // 2))
og.convert("RGB").save(OUT / "og-velum.png", "PNG")
print("og-velum.png 1200x630")
print("Listo.")
