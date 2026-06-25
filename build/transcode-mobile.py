#!/usr/bin/env python3
"""Vídeos de portada para MÓVIL: MISMO encuadre 16:9 que escritorio (fotograma
completo, no recortado a vertical), pequeño y ligero. En la web se muestran con
object-fit:contain sobre una copia desenfocada (blur-fill), así se ve toda la
imagen sin franjas negras. Genera assets/video/velum-hero-m-{1..5}.mp4 + poster."""
import subprocess
from pathlib import Path
import imageio_ffmpeg
from PIL import Image

FF = imageio_ffmpeg.get_ffmpeg_exe()
SRC = Path(r"C:\Users\JPO\Pax Capital Partners\PCP - Documents\PCP\1. Compañias\1. Activos\4. PCP Laundry\Pagina Web\Videos")
OUT = Path(r"C:\Users\JPO\ClaudeCode\Velum_Pag_Web\assets\video")
OUT.mkdir(parents=True, exist_ok=True)

# Mismo orden y mismas fuentes que el desktop
ORDER = [
    "8247208-hd_1920_1080_25fps.mp4",
    "4935317_People_Person_3840x2160.mp4",
    "6466561-uhd_4096_2160_25fps.mp4",
    "6631692-uhd_4096_2160_25fps.mp4",
    "6863738-uhd_4096_2160_25fps.mp4",
]

# Encuadre 16:9 completo (idéntico al desktop) pero a 960x540 y ligero
VF = "scale=960:540:force_original_aspect_ratio=increase,crop=960:540,fps=24"
DUR = "6"

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

# Poster móvil (frame ~1.5s del primer vídeo, fotograma completo) -> webp
poster_png = OUT / "_poster_m.png"
subprocess.run([FF, "-y", "-ss", "1.5", "-i", str(SRC / ORDER[0]),
                "-vframes", "1", "-vf", VF, str(poster_png)],
               check=True, capture_output=True)
Image.open(poster_png).convert("RGB").save(OUT / "hero-poster-m.webp", "WEBP", quality=70, method=6)
poster_png.unlink()
print("poster-m:", (OUT / "hero-poster-m.webp").stat().st_size // 1024, "KB")
print("Listo.")
