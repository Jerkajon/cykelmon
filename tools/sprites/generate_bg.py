#!/Users/erikandersson/vscode/familjespelet/tools/sprites/.venv/bin/python
"""
FLUX.2 [klein] 4B + Limbicnation pixel-art LoRA → bakgrundsbild.

Skillnad mot generate_sprite.py: ingen bg-removal, ingen crop, ingen downscale.
Sparar raw 1024-bilden direkt — perfekt för parallax-bakgrunder.
"""

import argparse
import base64
import json
import pathlib
import sys
import urllib.request

API_URL = "http://127.0.0.1:7860/sdapi/v1/txt2img"


def request_image(prompt: str, w: int, h: int, seed: int) -> bytes:
    body = json.dumps({"prompt": prompt, "seed": seed, "width": w, "height": h}).encode()
    req = urllib.request.Request(API_URL, data=body, headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=600) as r:
        data = json.loads(r.read())
    if "images" not in data:
        sys.exit(f"API error: {data}")
    return base64.b64decode(data["images"][0])


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--prompt", required=True)
    ap.add_argument("--out", required=True, type=pathlib.Path)
    ap.add_argument("--width", type=int, default=1024)
    ap.add_argument("--height", type=int, default=576)
    ap.add_argument("--seed", type=int, default=-1)
    args = ap.parse_args()

    args.out.parent.mkdir(parents=True, exist_ok=True)
    print(f"[gen] {args.width}x{args.height}, seed={args.seed}")
    raw = request_image(args.prompt, args.width, args.height, args.seed)
    args.out.write_bytes(raw)
    print(f"[out] {args.out}")


if __name__ == "__main__":
    main()
