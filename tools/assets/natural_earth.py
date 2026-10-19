"""Build the TV Guide's radar base map from Natural Earth 1:110m land (public domain).

Downloads the pinned release's land polygons and writes compact rings for the channel:
public/assets/tv-guide/land-110m.json, as {"source", "rings": [[lon, lat, ...] x100]}.
Run: python tools/assets/natural_earth.py
"""

import json
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
VERSION = "v5.1.2"
SOURCE = (
    "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/"
    f"{VERSION}/geojson/ne_110m_land.geojson"
)
TARGET = ROOT / "public/assets/tv-guide/land-110m.json"


def rings(geometry):
    """Yield the outer and inner rings of a Polygon or MultiPolygon."""
    polygons = (
        [geometry["coordinates"]]
        if geometry["type"] == "Polygon"
        else geometry["coordinates"]
    )
    for polygon in polygons:
        yield from polygon


def main():
    with urllib.request.urlopen(SOURCE, timeout=60) as response:  # noqa: S310 (fixed URL)
        data = json.load(response)
    out = []
    for feature in data["features"]:
        for ring in rings(feature["geometry"]):
            flat = []
            for lon, lat in ring:
                flat += [round(lon * 100), round(lat * 100)]
            if len(flat) >= 6:
                out.append(flat)
    TARGET.parent.mkdir(parents=True, exist_ok=True)
    TARGET.write_text(
        json.dumps(
            {"source": f"Natural Earth 1:110m land {VERSION}", "rings": out},
            separators=(",", ":"),
        )
        + "\n",
        encoding="utf-8",
    )
    print(f"{len(out)} rings, {TARGET.stat().st_size} bytes -> {TARGET.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
