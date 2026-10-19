"""Build the TV Guide's radar base map from Natural Earth (public domain).

Downloads pinned-release layers and writes compact, simplified shapes for the channel:
public/assets/tv-guide/base-map.json with
  {"source", "land": rings, "lakes": rings, "borders": lines, "states": lines},
each shape a flat [lon, lat, ...] list in hundredths of a degree.
Run: python tools/assets/natural_earth.py
"""

import json
import math
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
VERSION = "v5.1.2"
BASE = f"https://raw.githubusercontent.com/nvkelso/natural-earth-vector/{VERSION}/geojson/"
LAYERS = {
    "land": "ne_110m_land",
    "lakes": "ne_110m_lakes",
    "borders": "ne_110m_admin_0_boundary_lines_land",
    # 1:110m has US states only; 1:50m adds Canadian provinces and other regions.
    "states": "ne_50m_admin_1_states_provinces_lines",
}
# Degrees of simplification per layer: enough for a regional view, small enough to fetch.
TOLERANCE = {"land": 0.04, "lakes": 0.04, "borders": 0.06, "states": 0.12}
TARGET = ROOT / "public/assets/tv-guide/base-map.json"


def simplify(points, tolerance):
    """Douglas-Peucker simplification of a list of (lon, lat) points."""
    if len(points) < 3:
        return points
    keep = [False] * len(points)
    keep[0] = keep[-1] = True
    stack = [(0, len(points) - 1)]
    while stack:
        start, end = stack.pop()
        (x1, y1), (x2, y2) = points[start], points[end]
        length = math.hypot(x2 - x1, y2 - y1) or 1e-12
        best, index = 0.0, -1
        for i in range(start + 1, end):
            x, y = points[i]
            distance = abs((y2 - y1) * x - (x2 - x1) * y + x2 * y1 - y2 * x1) / length
            if distance > best:
                best, index = distance, i
        if best > tolerance and index > 0:
            keep[index] = True
            stack += [(start, index), (index, end)]
    return [point for point, kept in zip(points, keep) if kept]


def simplify_ring(points, tolerance):
    """Simplify a closed ring by splitting it at the point farthest from its start."""
    if len(points) < 4:
        return points
    x0, y0 = points[0]
    far = max(range(len(points)), key=lambda i: math.hypot(points[i][0] - x0, points[i][1] - y0))
    return simplify(points[: far + 1], tolerance) + simplify(points[far:], tolerance)[1:]


def shapes(geometry):
    """Yield the coordinate lists of polygons' rings or of lines."""
    kind, coords = geometry["type"], geometry["coordinates"]
    if kind == "Polygon":
        yield from coords
    elif kind == "MultiPolygon":
        for polygon in coords:
            yield from polygon
    elif kind == "LineString":
        yield coords
    elif kind == "MultiLineString":
        yield from coords


def layer(name, closed, tolerance):
    with urllib.request.urlopen(BASE + name + ".geojson", timeout=60) as response:  # noqa: S310
        data = json.load(response)
    out = []
    for feature in data["features"]:
        for shape in shapes(feature["geometry"]):
            raw = [(lon, lat) for lon, lat, *_ in shape]
            points = simplify_ring(raw, tolerance) if closed else simplify(raw, tolerance)
            if len(points) < (3 if closed else 2):
                continue
            flat = []
            for lon, lat in points:
                flat += [round(lon * 100), round(lat * 100)]
            out.append(flat)
    return out


def main():
    result = {"source": f"Natural Earth {VERSION}: " + ", ".join(LAYERS.values())}
    for key, name in LAYERS.items():
        result[key] = layer(name, closed=key in ("land", "lakes"), tolerance=TOLERANCE[key])
    TARGET.parent.mkdir(parents=True, exist_ok=True)
    with TARGET.open("w", encoding="utf-8", newline="\n") as file:
        json.dump(result, file, separators=(",", ":"))
        file.write("\n")
    counts = ", ".join(f"{key} {len(result[key])}" for key in LAYERS)
    print(f"{counts}; {TARGET.stat().st_size} bytes -> {TARGET.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
