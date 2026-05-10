#!/usr/bin/env python3
"""
Normaliserar bike-sprites så content fyller ramen (bot-padding = 0).

DrawThings genererar ofta bilder med transparent padding under motiv.
Original bike.png har content y=[0..95] (fyller hela ramen). Custom-cyklarna
har tomt utrymme nederst, så när de skalas i spelet "svävar" de ovan marken.

Skriptet hittar content bbox och flyttar content till botten av ramen.
"""

import pathlib
from PIL import Image

CHAR_DIR = pathlib.Path(__file__).resolve().parents[1] / 'assets' / 'characters'
TARGETS = ['bike-red.png', 'bike-unicycle.png', 'bike-hover.png']


def normalize(path):
    img = Image.open(path).convert('RGBA')
    w, h = img.size
    px = list(img.getdata())

    rows = set()
    for i, p in enumerate(px):
        if p[3] >= 50:
            rows.add(i // w)
    if not rows:
        print(f'  {path.name}: empty')
        return
    top = min(rows)
    bot = max(rows)
    bot_pad = h - 1 - bot
    if bot_pad == 0:
        print(f'  {path.name}: redan på plats')
        return

    # Flytta content till botten: ny bild med transparent + content vid bot
    content = img.crop((0, top, w, bot + 1))
    content_h = content.size[1]
    new_img = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    new_img.paste(content, (0, h - content_h))
    new_img.save(path)
    print(f'  {path.name}: flyttade {bot_pad}px content nedåt')


def main():
    for name in TARGETS:
        p = CHAR_DIR / name
        if not p.exists():
            print(f'  {name}: saknas')
            continue
        normalize(p)


if __name__ == '__main__':
    main()
