#!/usr/bin/env python3
"""
Fyller interior transparent-pixlar i obstacle-sprites med en mörk basfärg.

DrawThings/FLUX.2-genererade sprites har ofta semi-transparenta hål i
mitten (anti-aliased highlights). Mot mörk bakgrund (grottan) syns dessa
som "genomskinliga" områden.

Skriptet:
1. Öppnar varje obstacle-bild som RGBA
2. Flood-fill från hörnen → markerar bg-pixlar
3. Hittar interior transparent-pixlar (alpha=0 men ej bg)
4. Fyller dem med medianfärg från opaque-pixlar (mörkare variant)

Idempotent — kör gärna fler gånger.
"""

import sys
import pathlib
from collections import deque, Counter

from PIL import Image

OBSTACLE_DIR = pathlib.Path(__file__).resolve().parents[1] / 'assets' / 'obstacles'
TARGETS = ['rock.png', 'log.png', 'puddle.png', 'shell.png', 'stalagmite.png']


def median_color(pixels):
    rs = sorted(p[0] for p in pixels)
    gs = sorted(p[1] for p in pixels)
    bs = sorted(p[2] for p in pixels)
    n = len(pixels)
    return (rs[n // 2], gs[n // 2], bs[n // 2])


def fill_holes(path):
    img = Image.open(path).convert('RGBA')
    w, h = img.size
    px = list(img.getdata())

    # Flood-fill från hörnen för att hitta bg
    seen = set()
    q = deque([0, w - 1, (h - 1) * w, h * w - 1])
    while q:
        i = q.popleft()
        if i in seen or i < 0 or i >= w * h:
            continue
        if px[i][3] != 0:
            continue
        seen.add(i)
        x = i % w
        y = i // w
        if x > 0: q.append(i - 1)
        if x < w - 1: q.append(i + 1)
        if y > 0: q.append(i - w)
        if y < h - 1: q.append(i + w)

    opaque = [p for p in px if p[3] >= 200]
    if not opaque:
        print(f'  {path.name}: inga opaque pixlar')
        return
    # Mörkare variant av medianfärg → blir naturlig fyllning utan att skrika
    base = median_color(opaque)
    fill = (max(0, base[0] - 25), max(0, base[1] - 25), max(0, base[2] - 25), 255)

    holes = 0
    for i, p in enumerate(px):
        if p[3] == 0 and i not in seen:
            px[i] = fill
            holes += 1
    if holes == 0:
        print(f'  {path.name}: inga hål')
        return
    img.putdata(px)
    img.save(path)
    print(f'  {path.name}: fyllde {holes} hål med {fill[:3]}')


def main():
    for name in TARGETS:
        p = OBSTACLE_DIR / name
        if not p.exists():
            print(f'  {name}: saknas, hoppar')
            continue
        fill_holes(p)


if __name__ == '__main__':
    main()
