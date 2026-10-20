"""Process the XBOX channel's Halo menu media into the shipped files.

Usage: python tools/assets/xbox_media.py [--source DIR]

Sources: halome.nu's Halo menu loop (loop.webm) and music (loop.ogg), kept out of
git in .cache/xbox-360/. Halo (c) Microsoft Corporation; capture by halome.nu; used
under Microsoft's Game Content Usage Rules (see docs/channels/07-xbox.md).

Writes, for the 760x570 channel (the widescreen menu letterboxed, as on a 4:3 TV):
  public/assets/xbox/menu.webm   VP9 loop, no audio
  public/assets/xbox/menu.mp4    H.264 loop, no audio (for browsers without VP9)
  public/assets/xbox/menu.webp   first frame: poster and reduced-motion still
  public/assets/music/xbox.m4a   the menu music, mono AAC, to its natural end
Needs ffmpeg on PATH.
"""

import argparse
import shutil
import subprocess
import tempfile
from pathlib import Path

import numpy as np

from channel_music import process
from tv_sounds import read_mono, write_wav

ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / ".cache/xbox-360"
VIDEO_OUT = ROOT / "public/assets/xbox"
MUSIC_OUT = ROOT / "public/assets/music/xbox.m4a"

# Trim a sliver from each side of the 1920x1080 capture so the letterbox bars are thinner,
# keeping the full HALO logo, then scale to the channel's width.
FRAME = "crop=1720:1080,scale=760:-2,fps=24"
MAX_KB = {"menu.webm": 1600, "menu.mp4": 1600, "menu.webp": 120, "xbox.m4a": 1100}
MUSIC_KBPS = 36


def run(ffmpeg: str, *args: str) -> None:
    subprocess.run([ffmpeg, "-v", "error", "-y", *args], check=True)


def checked(path: Path) -> None:
    size_kb = path.stat().st_size / 1024
    if size_kb > MAX_KB[path.name]:
        raise SystemExit(f"{path.name}: {size_kb:.0f} KB is over its {MAX_KB[path.name]} KB budget.")
    print(f"{path.relative_to(ROOT)}  {size_kb:.0f} KB")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--source", type=Path, default=SOURCE)
    args = parser.parse_args()
    ffmpeg = shutil.which("ffmpeg")
    if not ffmpeg:
        raise SystemExit("ffmpeg is required.")
    video = args.source / "loop.webm"
    VIDEO_OUT.mkdir(parents=True, exist_ok=True)

    webm = VIDEO_OUT / "menu.webm"
    run(ffmpeg, "-i", str(video), "-vf", FRAME, "-an", "-c:v", "libvpx-vp9", "-b:v", "0",
        "-crf", "46", "-deadline", "good", "-cpu-used", "2", "-row-mt", "1",
        "-pix_fmt", "yuv420p", "-map_metadata", "-1", str(webm))
    checked(webm)
    mp4 = VIDEO_OUT / "menu.mp4"
    run(ffmpeg, "-i", str(video), "-vf", FRAME, "-an", "-c:v", "libx264", "-preset", "slow",
        "-crf", "34", "-profile:v", "main", "-pix_fmt", "yuv420p", "-movflags", "+faststart",
        "-map_metadata", "-1", str(mp4))
    checked(mp4)
    still = VIDEO_OUT / "menu.webp"
    run(ffmpeg, "-i", str(video), "-vf", FRAME, "-frames:v", "1", "-c:v", "libwebp",
        "-quality", "70", "-map_metadata", "-1", str(still))
    checked(still)

    with tempfile.TemporaryDirectory() as temp:
        decoded = Path(temp) / "music.wav"
        run(ffmpeg, "-i", str(args.source / "loop.ogg"), "-c:a", "pcm_s16le", str(decoded))
        samples, rate = read_mono(decoded)
        # Play to the natural end: drop the trailing silence but keep a short pause.
        loud = np.flatnonzero(np.abs(samples) >= 0.001)
        end = min(len(samples), loud[-1] + int(0.4 * rate)) / rate
        loop = process(samples, rate, 0.0, end, 3, 300)
        wav = Path(temp) / "xbox.wav"
        write_wav(wav, loop, rate)
        MUSIC_OUT.parent.mkdir(parents=True, exist_ok=True)
        run(ffmpeg, "-i", str(wav), "-ar", "44100", "-ac", "1", "-c:a", "aac",
            "-b:a", f"{MUSIC_KBPS}k", "-movflags", "+faststart", "-map_metadata", "-1", str(MUSIC_OUT))
    checked(MUSIC_OUT)


if __name__ == "__main__":
    main()
