#!/usr/bin/env python3
"""Vídeos de portada para MÓVIL — usa metraje VERTICAL real (9:16) que llena
la pantalla del teléfono edge-to-edge, sin recortes raros ni blur. Salida
720x1280 ligera. Genera assets/video/velum-hero-m-{1..5}.mp4 + poster vertical."""
import subprocess
from pathlib import Path
import imageio_ffmpeg
from PIL import Image

FF = imageio_ffmpeg.get_ffmpeg_exe()
SRC = Path(r"C:\Users\JPO\Pax Capital Partners\PCP - Documents\PCP\1. Compañias\1. Activos\4. PCP Laundry\Pagina Web\Videos\Videos Verticales")
OUT = Path(r"C:\Users\JPO\ClaudeCode\Velum_Pag_Web\assets\video")
OUT.mkdir(parents=True, exist_ok=True)

# 5 clips verticales — se eligen para reflejar las escenas del desktop por
# familia de ID (8247, 6466, 6863) + dos para completar variedad.
ORDER = [
    "8247209-hd_1080_1920_25fps.mp4",   # ↔ desktop #1
    "6998327-hd_1080_1920_25fps.mp4",
    "6466562-uhd_2160_4096_25fps.mp4",  # ↔ desktop #3 (familia 6466)
    "8756826-uhd_2160_4096_25fps.mp4",
    "6863732-uhd_2160_4096_25fps.mp4",  # ↔ desktop #5 (familia 6863)
]

# Duración 8s: mayor que el intervalo de rotación (6s) para que el clip visible
# nunca llegue a hacer loop (reinicio) antes del crossfade -> sin "saltos".
VF = "scale=720:1280:force_original_aspect_ratio=increase,crop=720:1280,fps=24"
DUR = "8"

for i, name in enumerate(ORDER, 1):
    src = SRC / name
    dst = OUT / f"velum-hero-m-{i}.mp4"
    cmd = [FF, "-y", "-ss", "0", "-t", DUR, "-i", str(src),
           "-an", "-vf", VF,
           "-c:v", "libx264", "-crf", "30", "-preset", "slow",
           "-pix_fmt", "yuv420p", "-movflags", "+faststart", str(dst)]
    print(f"[{i}/5] {name} -> {dst.name}")
    subprocess.run(cmd, check=True, capture_output=True)
    print(f"      {dst.stat().st_size/1024:.0f} KB")

# Poster móvil (frame ~1.5s del primer vídeo vertical) -> webp
poster_png = OUT / "_poster_m.png"
subprocess.run([FF, "-y", "-ss", "1.5", "-i", str(SRC / ORDER[0]),
                "-vframes", "1", "-vf", VF, str(poster_png)],
               check=True, capture_output=True)
Image.open(poster_png).convert("RGB").save(OUT / "hero-poster-m.webp", "WEBP", quality=70, method=6)
poster_png.unlink()
print("poster-m:", (OUT / "hero-poster-m.webp").stat().st_size // 1024, "KB")
print("Listo.")
