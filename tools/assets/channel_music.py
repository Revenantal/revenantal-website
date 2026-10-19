"""Process channel music originals into the shipped looping .m4a files.

Usage: python tools/assets/channel_music.py [--out DIR] [--wav]

Follows docs/channels/soundscapes.md: mono, cut to the loop, short fades at the
join, level-matched to -18 dBFS RMS, then ffmpeg encodes AAC at a bitrate that
keeps each loop within 300 KB. --wav writes processed WAV files without ffmpeg.
"""

import argparse
import shutil
import subprocess
import tempfile
from pathlib import Path

import numpy as np

from tv_sounds import SOURCES, read_mono, write_wav

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "public/assets/music"

# name: (source file, start s, end s or None, fade-in ms, fade-out ms)
MUSIC = {
    # Plays through to its natural ending (the last chord rings out), then restarts.
    "tv-guide": ("693384__yellowtree__weather-forecast-type-beat.wav", 0.0, 62.9, 3, 350),
    # Made as a loop: only a few milliseconds of fade so the join cannot click.
    "credits": ("449935__x3nus__epic-finale-loop.wav", 0.0, None, 4, 4),
}
RMS_DBFS = -18.0
PEAK_DBFS = -1.0
MAX_KB = 300
BITRATE_KBPS = 36


def process(samples: np.ndarray, rate: int, start: float, end: float | None, fade_in_ms: float, fade_out_ms: float) -> np.ndarray:
    """Cut one loop, fade its ends and match its level."""
    cut = samples[int(start * rate) : None if end is None else int(end * rate)].copy()
    fade_in = max(1, int(rate * fade_in_ms / 1000))
    fade_out = max(1, int(rate * fade_out_ms / 1000))
    cut[:fade_in] *= np.linspace(0, 1, fade_in)
    cut[-fade_out:] *= np.linspace(1, 0, fade_out)
    gain = 10 ** (RMS_DBFS / 20) / np.sqrt(np.mean(cut**2))
    # Never let level matching push a peak past the ceiling.
    gain = min(gain, 10 ** (PEAK_DBFS / 20) / np.abs(cut).max())
    return cut * gain


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--out", type=Path, default=OUT)
    parser.add_argument("--wav", action="store_true", help="write processed WAV instead of .m4a")
    args = parser.parse_args()
    ffmpeg = shutil.which("ffmpeg")
    if not args.wav and not ffmpeg:
        raise SystemExit("ffmpeg is required for .m4a output (or pass --wav).")
    args.out.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory() as temp:
        for name, (source, start, end, fade_in, fade_out) in MUSIC.items():
            samples, rate = read_mono(SOURCES / source)
            loop = process(samples, rate, start, end, fade_in, fade_out)
            wav = (args.out if args.wav else Path(temp)) / f"{name}.wav"
            write_wav(wav, loop, rate)
            target = wav
            if not args.wav:
                target = args.out / f"{name}.m4a"
                subprocess.run(
                    [ffmpeg, "-v", "error", "-y", "-i", str(wav), "-ar", "44100", "-ac", "1",
                     "-c:a", "aac", "-b:a", f"{BITRATE_KBPS}k", "-movflags", "+faststart",
                     "-map_metadata", "-1", str(target)],
                    check=True,
                )
                size_kb = target.stat().st_size / 1024
                if size_kb > MAX_KB:
                    raise SystemExit(f"{target.name}: {size_kb:.0f} KB is over the {MAX_KB} KB budget.")
            print(f"{target}  {len(loop) / rate:.2f}s  {target.stat().st_size / 1024:.1f} KB")


if __name__ == "__main__":
    main()
