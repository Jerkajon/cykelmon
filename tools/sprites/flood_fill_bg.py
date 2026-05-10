#!/usr/bin/env python3
"""Flood-fill near-white background to transparent on a PNG sprite.

Usage: python flood_fill_bg.py <input.png> [--tolerance 30] [--out <output.png>]

Floods from all 4 corners. Pixels within RGB tolerance of (255,255,255) become alpha=0.
If --out omitted, overwrites input.
"""
import argparse
import sys
from collections import deque

from PIL import Image


def flood_fill_white_to_transparent(img: Image.Image, tolerance: int) -> Image.Image:
    img = img.convert("RGBA")
    px = img.load()
    w, h = img.size

    visited = [[False] * h for _ in range(w)]
    queue = deque()

    for sx, sy in [(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1)]:
        r, g, b, _ = px[sx, sy]
        if 255 - r <= tolerance and 255 - g <= tolerance and 255 - b <= tolerance:
            queue.append((sx, sy))

    while queue:
        x, y = queue.popleft()
        if x < 0 or y < 0 or x >= w or y >= h or visited[x][y]:
            continue
        r, g, b, _ = px[x, y]
        if 255 - r > tolerance or 255 - g > tolerance or 255 - b > tolerance:
            continue
        visited[x][y] = True
        px[x, y] = (r, g, b, 0)
        queue.extend([(x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)])

    return img


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument("input")
    p.add_argument("--tolerance", type=int, default=30)
    p.add_argument("--out", default=None)
    args = p.parse_args()

    img = Image.open(args.input)
    out = flood_fill_white_to_transparent(img, args.tolerance)
    out.save(args.out or args.input, "PNG")
    print(f"wrote {args.out or args.input}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
