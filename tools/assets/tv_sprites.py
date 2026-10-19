"""Cut the TV frame and control sprites from the source photo.

Usage: python tools/assets/tv_sprites.py [--photo PATH] [--out DIR]

Steps follow docs/tv/art-and-assets.md: key the screen, repaint the dial
face without numerals, cut the knob, clear the button area, cut the sprites
and export WebP. Coordinates are photo pixels (1536x1024).
"""

import argparse
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parents[2]
PHOTO = ROOT / "docs/reference/assets/tv/tv-photo-door.png"
ROOM = ROOT / "docs/reference/assets/tv/room.png"
OUT = ROOT / "public/assets/tv"

SCREEN_BOX = (100, 92, 1182, 900)  # x0, y0, x1, y1 searched for green
CABINET = (10, 11, 1526, 1007)  # outer cabinet edge; the photo margin outside it becomes transparent
DIAL = (1391, 211)
DIAL_RADIUS = 81
KNOB_ANGLE = -33.3  # pointer direction in the photo, degrees clockwise from up
BUTTON_AREA = (1311, 421, 1461, 615)
HOUSING = (1315, 425, 1457, 488)
FACES = {  # top-left corner and size of each button face in the photo
    "face0": (1330, 435, 114, 43),  # cream
    "face1": (1331, 497, 113, 44),  # grey
    "face2": (1331, 560, 113, 43),  # dark
}
DOOR = (1284, 618, 1488, 691)
VOLUME = (1392, 370)
VOLUME_RADIUS = 36.5
CAP_RADIUS = 26.5
SUPERSAMPLE = 4


def key_screen(rgb: np.ndarray) -> np.ndarray:
    """Return alpha that removes the green screen, and despill its edges in place."""
    alpha = np.ones(rgb.shape[:2])
    x0, y0, x1, y1 = SCREEN_BOX
    box = rgb[y0:y1, x0:x1]
    r, g, b = box[..., 0], box[..., 1], box[..., 2]
    other = np.maximum(r, b)
    alpha[y0:y1, x0:x1] = 1 - np.clip((g - other - 30) / 70, 0, 1)
    spill = alpha[y0:y1, x0:x1] < 1
    box[..., 1] = np.where(spill, np.minimum(g, other), g)
    return alpha


def disc_mask(size: tuple[int, int], centre: tuple[float, float], radius: float) -> Image.Image:
    """Anti-aliased filled circle as an L mask."""
    w, h = size
    big = Image.new("L", (w * SUPERSAMPLE, h * SUPERSAMPLE), 0)
    cx, cy = (c * SUPERSAMPLE for c in centre)
    r = radius * SUPERSAMPLE
    ImageDraw.Draw(big).ellipse((cx - r, cy - r, cx + r, cy + r), fill=255)
    return big.resize(size, Image.LANCZOS)


def rounded_mask(size: tuple[int, int], radius: float) -> Image.Image:
    """Anti-aliased rounded rectangle as an L mask."""
    w, h = size
    big = Image.new("L", (w * SUPERSAMPLE, h * SUPERSAMPLE), 0)
    ImageDraw.Draw(big).rounded_rectangle(
        (0, 0, w * SUPERSAMPLE - 1, h * SUPERSAMPLE - 1),
        radius=radius * SUPERSAMPLE,
        fill=255,
    )
    return big.resize(size, Image.LANCZOS)


def dial_face() -> Image.Image:
    """Draw the numeral-free dial face, centred in a square RGBA tile."""
    size = (DIAL_RADIUS * 2 + 4) * SUPERSAMPLE
    c = size / 2
    s = SUPERSAMPLE
    yy, xx = np.mgrid[:size, :size]
    r = np.hypot(xx - c + 0.5, yy - c + 0.5) / s
    tone = 15 + 6 * np.clip(r / 78, 0, 1) ** 2  # subtle radial gradient
    face = np.dstack([tone, tone * 0.97, tone * 0.95]).astype(np.uint8)
    img = Image.fromarray(face, "RGB").convert("RGBA")
    draw = ImageDraw.Draw(img)
    groove = 47.5 * s
    draw.ellipse((c - groove, c - groove, c + groove, c + groove), outline=(36, 35, 34, 255), width=int(1.4 * s))
    for i in range(60):
        major = i % 5 == 0
        inner, outer = (73.5, 79.5) if major else (77, 79)
        colour = (118, 116, 112, 255) if major else (44, 43, 42, 255)
        t = np.radians(i * 6)
        sx, sy = np.sin(t), -np.cos(t)
        draw.line(
            (c + sx * inner * s, c + sy * inner * s, c + sx * outer * s, c + sy * outer * s),
            fill=colour,
            width=int(1.6 * s),
        )
    small = (DIAL_RADIUS * 2 + 4,) * 2
    img = img.resize(small, Image.LANCZOS)
    img.putalpha(disc_mask(small, (small[0] / 2, small[1] / 2), DIAL_RADIUS))
    return img


def knob_mask() -> Image.Image:
    """Disc r46 plus the two pointer-bar sectors out to r55, as an L mask."""
    size = 112
    s = SUPERSAMPLE
    big = Image.new("L", (size * s, size * s), 0)
    draw = ImageDraw.Draw(big)
    c = size * s / 2
    draw.ellipse((c - 46 * s, c - 46 * s, c + 46 * s, c + 46 * s), fill=255)
    for centre in (KNOB_ANGLE, KNOB_ANGLE + 180):
        # PIL angles run clockwise from 3 o'clock; ours run clockwise from 12.
        start, end = centre - 12 - 90, centre + 12 - 90
        draw.pieslice((c - 55 * s, c - 55 * s, c + 55 * s, c + 55 * s), start, end, fill=255)
    return big.resize((size, size), Image.LANCZOS)


def cut_knob(photo: Image.Image) -> Image.Image:
    """Cut the dial knob with its pointer bar and add the red index dot."""
    x, y = DIAL[0] - 56, DIAL[1] - 56
    knob = photo.crop((x, y, x + 112, y + 112)).convert("RGBA")
    draw = ImageDraw.Draw(knob)
    t = np.radians(KNOB_ANGLE)
    dx, dy = 56 + np.sin(t) * 44, 56 - np.cos(t) * 44
    draw.ellipse((dx - 2.6, dy - 2.6, dx + 2.6, dy + 2.6), fill=(214, 34, 38, 255))
    knob.putalpha(knob_mask())
    return knob


def clear_buttons(rgb: np.ndarray) -> None:
    """Replace the button stack with brushed panel interpolated from its clean edges."""
    x0, y0, x1, y1 = BUTTON_AREA
    left = rgb[y0:y1, x0 - 8 : x0].mean(axis=1)
    right = rgb[y0:y1, x1 : x1 + 8].mean(axis=1)
    t = np.linspace(0, 1, x1 - x0)[None, :, None]
    base = left[:, None, :] * (1 - t) + right[:, None, :] * t
    # High-pass brushing: grain from each clean edge strip, mirrored so tiles join without seams.
    def grain(strip: np.ndarray) -> np.ndarray:
        smooth = np.asarray(
            Image.fromarray(strip.clip(0, 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(4))
        ).astype(float)
        detail = strip - smooth
        return np.concatenate([detail, detail[:, ::-1]], axis=1)

    left_grain = grain(rgb[y0:y1, x0 - 24 : x0])
    right_grain = grain(rgb[y0:y1, x1 : x1 + 24])
    width = x1 - x0
    reps = int(np.ceil(width / left_grain.shape[1]))
    texture = np.tile(left_grain, (1, reps, 1))[:, :width] * (1 - t) + np.tile(
        right_grain, (1, reps, 1)
    )[:, :width] * t
    rgb[y0:y1, x0:x1] = base + texture


def door_cavity(rgb: np.ndarray) -> None:
    """Darken the opening behind the settings door, keeping its rim and hinges."""
    x0, y0, x1, y1 = DOOR
    rgb[y0 + 3 : y1 - 3, x0 + 3 : x1 - 3] = 18
    rgb[y0 + 3 : y0 + 13, x0 + 3 : x1 - 3] = 6  # shadow under the panel lip


def housing_sprite(photo: Image.Image) -> Image.Image:
    """Cut the top button housing and fill the face opening with a dark recess."""
    x0, y0, x1, y1 = HOUSING
    housing = np.asarray(photo.crop(HOUSING)).astype(float)
    fx, fy, fw, fh = FACES["face0"]
    ox, oy = fx - x0, fy - y0
    recess = np.array([12.0, 10.0, 9.0])
    housing[oy - 1 : oy + fh + 1, ox - 1 : ox + fw + 1] = recess
    housing[oy - 1, ox + 2 : ox + fw - 2] = [70.0, 58.0, 48.0]  # lit top lip
    img = Image.fromarray(housing.clip(0, 255).astype(np.uint8), "RGB").convert("RGBA")
    img.putalpha(rounded_mask(img.size, 6))
    return img


def volume_sprite(photo: Image.Image) -> Image.Image:
    """Cut the volume ring and paint its light index notch at 12 o'clock."""
    img = round_crop(photo, VOLUME, VOLUME_RADIUS)
    c = img.width / 2
    ImageDraw.Draw(img).rectangle((c - 1.5, c - 33, c + 1.5, c - 29), fill=(232, 226, 214, 255))
    return img


def round_crop(photo: Image.Image, centre: tuple[float, float], radius: float) -> Image.Image:
    """Cut a circular sprite centred on a photo point."""
    size = int(round(radius * 2 + 1))
    x, y = int(round(centre[0] - size / 2)), int(round(centre[1] - size / 2))
    img = photo.crop((x, y, x + size, y + size)).convert("RGBA")
    img.putalpha(disc_mask(img.size, (centre[0] - x, centre[1] - y), radius))
    return img


def save(img: Image.Image, path: Path, quality: int = 88) -> None:
    img.save(path, "WEBP", quality=quality, method=6)
    print(f"{path}  {img.size[0]}x{img.size[1]}  {path.stat().st_size / 1024:.1f} KB")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--photo", type=Path, default=PHOTO)
    parser.add_argument("--room", type=Path, default=ROOM)
    parser.add_argument("--out", type=Path, default=OUT)
    args = parser.parse_args()
    photo = Image.open(args.photo).convert("RGB")
    if photo.size != (1536, 1024):
        raise SystemExit(f"Expected a 1536x1024 photo, got {photo.size}.")
    args.out.mkdir(parents=True, exist_ok=True)

    # Sprites come from the untouched photo.
    save(cut_knob(photo), args.out / "knob.webp")
    save(volume_sprite(photo), args.out / "vol.webp")
    save(round_crop(photo, VOLUME, CAP_RADIUS), args.out / "cap.webp")
    save(housing_sprite(photo), args.out / "housing.webp")
    for name, (x, y, w, h) in FACES.items():
        face = photo.crop((x, y, x + w, y + h)).convert("RGBA")
        face.putalpha(rounded_mask(face.size, 2))
        save(face, args.out / f"{name}.webp")
    save(photo.crop(DOOR), args.out / "door.webp")

    rgb = np.asarray(photo).astype(float)
    alpha = key_screen(rgb)
    clear_buttons(rgb)
    door_cavity(rgb)
    frame = Image.fromarray(rgb.clip(0, 255).astype(np.uint8), "RGB").convert("RGBA")
    cabinet = Image.new("L", photo.size, 0)
    x0, y0, x1, y1 = CABINET
    w, h = x1 - x0, y1 - y0
    cabinet.paste(rounded_mask((w, h), 16), (x0, y0))
    alpha *= np.asarray(cabinet).astype(float) / 255
    frame.putalpha(Image.fromarray((alpha * 255).round().astype(np.uint8), "L"))
    face = dial_face()
    frame.alpha_composite(face, (DIAL[0] - face.width // 2, DIAL[1] - face.height // 2))
    save(frame, args.out / "frame.webp", quality=86)

    # The room plate behind the TV; its painted TV is covered by the real one.
    room = Image.open(args.room).convert("RGB")
    if room.size != (1536, 1024):
        raise SystemExit(f"Expected a 1536x1024 room, got {room.size}.")
    save(room, args.out / "room.webp", quality=80)


if __name__ == "__main__":
    main()
