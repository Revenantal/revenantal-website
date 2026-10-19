"""Process the TV sound originals into the shipped .m4a files.

Usage: python tools/assets/tv_sounds.py [--out DIR] [--wav]

Follows docs/tv/audio.md: mono, cut, trim silence at 1% of peak, short
fade-in/out, peak-normalise to -1 dBFS, then ffmpeg resamples to 44.1 kHz
and encodes AAC 96 kbps. --wav writes processed WAV files without ffmpeg.
"""

import argparse
import shutil
import subprocess
import tempfile
import wave
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[2]
SOURCES = ROOT / "docs/reference/assets/sounds"
OUT = ROOT / "public/assets/sounds"

# name: (source file, start s, end s or None, fade-out ms)
SOUNDS = {
    "btn_down": ("364202__joedeshon__vcr_switch.wav", 0.0, 0.215, 10),
    "btn_up": ("364202__joedeshon__vcr_switch.wav", 0.215, None, 30),
    "dial": ("139062__joedeshon__electrical_switch_02.wav", 0.0, None, 30),
    "vol": ("266018__joedeshon__click_01.wav", 0.0, None, 10),
    "toggle": ("119415__joedeshon__rocker_switch.wav", 0.0, None, 10),
    "static": ("279004__limitsnap_creations__channel-switch.wav", 0.0, None, 40),
    "power_btn": ("134712__joedeshon__push_button_switch_04.wav", 0.0, None, 30),
    "crt_on": ("693860__fission9__crt-tv-switches-on.wav", 0.12, 3.95, 60),
    "door_open": ("376059__stecman__tapedeck-open-and-closing.wav", 0.0, 0.75, 40),
    "door_close": ("376059__stecman__tapedeck-open-and-closing.wav", 1.25, 2.35, 40),
}
FADE_IN_MS = 2.5
PEAK_DBFS = -1.0


def read_mono(path: Path) -> tuple[np.ndarray, int]:
    """Read a 16- or 24-bit PCM WAV as mono floats in -1..1."""
    with wave.open(str(path)) as w:
        width, channels, rate = w.getsampwidth(), w.getnchannels(), w.getframerate()
        raw = w.readframes(w.getnframes())
    if width == 2:
        data = np.frombuffer(raw, "<i2").astype(np.float64) / 32768
    elif width == 3:
        b = np.frombuffer(raw, np.uint8).reshape(-1, 3).astype(np.int32)
        ints = b[:, 0] | (b[:, 1] << 8) | (b[:, 2] << 16)
        data = np.where(ints >= 1 << 23, ints - (1 << 24), ints) / float(1 << 23)
    else:
        raise SystemExit(f"{path.name}: unsupported {width * 8}-bit audio.")
    return data.reshape(-1, channels).mean(axis=1), rate


def process(samples: np.ndarray, rate: int, start: float, end: float | None, fade_out_ms: float) -> np.ndarray:
    """Cut, trim silence at 1% of peak, fade and normalise one sound."""
    cut = samples[int(start * rate) : None if end is None else int(end * rate)]
    loud = np.flatnonzero(np.abs(cut) >= 0.01 * np.abs(cut).max())
    cut = cut[loud[0] : loud[-1] + 1].copy()
    fade_in = max(1, int(rate * FADE_IN_MS / 1000))
    fade_out = max(1, min(len(cut) // 2, int(rate * fade_out_ms / 1000)))
    cut[:fade_in] *= np.linspace(0, 1, fade_in)
    cut[-fade_out:] *= np.linspace(1, 0, fade_out)
    return cut * (10 ** (PEAK_DBFS / 20) / np.abs(cut).max())


def write_wav(path: Path, samples: np.ndarray, rate: int) -> None:
    """Write mono 16-bit PCM."""
    with wave.open(str(path), "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(rate)
        w.writeframes((np.clip(samples, -1, 1) * 32767).round().astype("<i2").tobytes())


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
