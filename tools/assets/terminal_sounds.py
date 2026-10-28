"""Process the Terminal keyboard recordings into the shipped .m4a files.

Usage: python tools/assets/terminal_sounds.py [--out DIR] [--wav]

Uses the same steps as tv_sounds.py (mono, cut, trim silence at 1% of peak,
short fades, peak-normalise to -1 dBFS, AAC 96 kbps). --wav writes processed
WAV files without ffmpeg. Output: public/assets/sounds/terminal/.
"""

import argparse
import shutil
import subprocess
import tempfile
from pathlib import Path

from tv_sounds import SOURCES, process, read_mono, write_wav

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "public/assets/sounds/terminal"

LONG = "660387__xemptful__single-key-presses-on-mechanical-keyboard.wav"

# name: (source file, start s, end s or None, fade-out ms)
# Four presses cut from one longer recording (each starts 12 ms before its onset),
# two single-key recordings for variety, then a heavier key for Enter and Space
# and a softer one for Backspace.
SOUNDS = {
    "key-1": (LONG, 1.460, 1.660, 25),
    "key-2": (LONG, 1.826, 2.026, 25),
    "key-3": (LONG, 2.962, 3.162, 25),
    "key-4": (LONG, 4.046, 4.246, 25),
    "key-5": ("766639__stavsounds__keyboard_tactile_8.wav", 0.0, None, 25),
    "key-6": ("378085__bigmonmulgrew__mechanical-key-hard.wav", 0.0, None, 25),
    "enter": ("813210__capt-jack__single_key_stroke_large_key.wav", 0.0, None, 40),
    "back": ("570754__foxfire-__keyboard-press-down.wav", 0.0, None, 30),
}


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
        for name, (source, start, end, fade_out) in SOUNDS.items():
            samples, rate = read_mono(SOURCES / source)
            clip = process(samples, rate, start, end, fade_out)
            wav = (args.out if args.wav else Path(temp)) / f"{name}.wav"
            write_wav(wav, clip, rate)
            target = wav
            if not args.wav:
                target = args.out / f"{name}.m4a"
                subprocess.run(
                    [ffmpeg, "-v", "error", "-y", "-i", str(wav), "-ar", "44100", "-ac", "1",
                     "-c:a", "aac", "-b:a", "96k", "-movflags", "+faststart", "-map_metadata", "-1", str(target)],
                    check=True,
                )
            print(f"{target}  {len(clip) / rate:.2f}s  {target.stat().st_size / 1024:.1f} KB")


if __name__ == "__main__":
    main()
