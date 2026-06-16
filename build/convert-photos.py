#!/usr/bin/env python3
"""Convierte JPGs de origen (organizados por tipo de cliente) a los .webp
del sitio, conservando los slugs. Reescala a lado mayor <= 1600px (solo
reduce), aplica orientacion EXIF y guarda WebP calidad 82."""
import sys
from pathlib import Path
from PIL import Image, ImageOps

SRC = Path(r"C:\Users\JPO\Pax Capital Partners\PCP - Documents\PCP\1. Compañias\1. Activos\4. PCP Laundry\Pagina Web\Fotos")
DST = Path(r"C:\Users\JPO\ClaudeCode\Velum_Pag_Web\assets\img\photos")

MAP = [
    ("Hosteleria/pexels-cottonbro-6466479.jpg", "sector-hosteleria.webp"),
    ("Hosteleria/white-towel-bed-decoration-bedroom-interior.jpg", "galeria-rollos.webp"),
    ("Hosteleria/pexels-kingofcotton-12679 (1).jpg", "materiales.webp"),
    ("Restauracion/Mesa_restaurante_Completa.jpg", "sector-restauracion.webp"),
    ("Restauracion/pexels-mikhail-nilov-8245683.jpg", "restauracion-2.webp"),
    ("Restauracion/pexels-immortelleana-10445929.jpg", "restauracion-3.webp"),
    ("Hospitalario/female-therapist-rehabilitation-center.jpg", "salud-2.webp"),
    ("Hospitalario/medicine-uniform-healthcare-medical-workers-day-concept.jpg", "salud-3.webp"),
]

MAXSIDE = 1600
QUALITY = 82

for src_rel, dst_name in MAP:
    src = SRC / src_rel
    dst = DST / dst_name
    if not src.exists():
        print(f"  !! NO EXISTE: {src}")
        sys.exit(1)
    im = Image.open(src)
    im = ImageOps.exif_transpose(im)
    if im.mode != "RGB":
        im = im.convert("RGB")
    w, h = im.size
    scale = min(1.0, MAXSIDE / max(w, h))
    if scale < 1.0:
        im = im.resize((round(w * scale), round(h * scale)), Image.LANCZOS)
    im.save(dst, "WEBP", quality=QUALITY, method=6)
    kb = dst.stat().st_size / 1024
    print(f"  OK {dst_name:26s} {im.size[0]}x{im.size[1]}  {kb:.0f} KB")

print("Listo.")
