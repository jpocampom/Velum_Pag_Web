#!/usr/bin/env python3
"""Transcodifica los vídeos de portada de VELUM a MP4 1080p web-optimizado.
Recorta a ~8s, crop 16:9 (cover), sin audio, H.264 yuv420p + faststart.
Genera assets/video/velum-hero-{1..5}.mp4 y un poster.webp."""
import subprocess
from pathlib import Path
import imageio_ffmpeg
from PIL import Image
import io

FF = imageio_ffmpeg.get_ffmpeg_exe()
SRC = Path(r"C:\Users\JPO\Pax Capital Partners\PCP - Documents\PCP\1. Compañias\1. Activos\4. PCP Laundry\Pagina Web\Videos")
OUT = Path(r"C:\Users\JPO\ClaudeCode\Velum_Pag_Web\assets\video")
OUT.mkdir(parents=True, exist_ok=True)

# Orden tal y como los listó el cliente
ORDER = [
    "8247208-hd_1920_1080_25fps.mp4",
    "4935317_People_Person_3840x2160.mp4",
    "6466561-uhd_4096_2160_25fps.mp4",
    "6631692-uhd_4096_2160_25fps.mp4",
    "6863738-uhd_4096_2160_25fps.mp4",
]

VF = "scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080,fps=25"
DUR = "8"

for i, name in enumerate(ORDER, 1):
    src = SRC / name
    dst = OUT / f"velum-hero-{i}.mp4"
    cmd = [FF, "-y", "-ss", "0", "-t", DUR, "-i", str(src),
           "-an", "-vf", VF,
           "-c:v", "libx264", "-crf", "26", "-preset", "slow",
           "-pix_fmt", "yuv420p", "-movflags", "+faststart", str(dst)]
    print(f"[{i}/5] {name} -> {dst.name}")
    subprocess.run(cmd, check=True, capture_output=True)
    print(f"      {dst.stat().st_size/1024/1024:.1f} MB")

# Poster (frame ~1.5s del primer vídeo) -> webp
poster_png = OUT / "_poster.png"
subprocess.run([FF, "-y", "-ss", "1.5", "-i", str(SRC / ORDER[0]),
                "-vframes", "1", "-vf", VF, str(poster_png)],
               check=True, capture_output=True)
Image.open(poster_png).convert("RGB").save(OUT / "hero-poster.webp", "WEBP", quality=72, method=6)
poster_png.unlink()
print("poster:", (OUT / "hero-poster.webp").stat().st_size // 1024, "KB")
print("Listo.")
