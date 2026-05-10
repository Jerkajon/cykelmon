#!/Users/erikandersson/vscode/familjespelet/tools/sprites/.venv/bin/python
"""
Genererar 8-bit-stil ljud (WAV-filer) för pokemon-cykelspel.

Inga externa beroenden förutom numpy (finns redan i FLUX.2-venven).
Skriver mono 16-bit 44.1 kHz WAV via standard `wave`-modulen.

Användning:
  python generate_sounds.py [--out DIR]
"""

import argparse
import math
import pathlib
import wave

import numpy as np

SR = 44100  # sample rate


# ─── Wave-genererande hjälpare ──────────────────────────────────────────

def sine(freq, dur, phase=0.0):
    t = np.arange(int(SR * dur)) / SR
    return np.sin(2 * np.pi * freq * t + phase)


def triangle(freq, dur):
    t = np.arange(int(SR * dur)) / SR
    return 2 * np.abs(2 * (t * freq - np.floor(t * freq + 0.5))) - 1


def square(freq, dur, duty=0.5):
    t = np.arange(int(SR * dur)) / SR
    return np.where((t * freq) % 1 < duty, 1.0, -1.0)


def noise(dur):
    return np.random.uniform(-1, 1, int(SR * dur))


def adsr(samples, attack=0.01, decay=0.05, sustain=0.7, release=0.2):
    """Apply ADSR envelope to a sample array."""
    n = len(samples)
    a = max(1, int(SR * attack))
    d = max(1, int(SR * decay))
    r = max(1, int(SR * release))
    s = max(1, n - a - d - r)
    env = np.concatenate([
        np.linspace(0, 1, a),
        np.linspace(1, sustain, d),
        np.full(s, sustain),
        np.linspace(sustain, 0, r),
    ])
    if len(env) > n:
        env = env[:n]
    elif len(env) < n:
        env = np.pad(env, (0, n - len(env)))
    return samples * env


def fade_out(samples, ms=20):
    n = len(samples)
    f = min(int(SR * ms / 1000), n)
    samples[-f:] *= np.linspace(1, 0, f)
    return samples


def write_wav(path, samples, gain=0.6):
    samples = np.asarray(samples, dtype=np.float64)
    samples = np.clip(samples * gain, -1, 1)
    pcm = (samples * 32767).astype(np.int16)
    with wave.open(str(path), "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())
    print(f"  {path.name} ({len(samples) / SR:.2f}s)")


# ─── SFX ────────────────────────────────────────────────────────────────

def sfx_jump():
    """Snabb upp-svep — barn hoppar med cykeln."""
    dur = 0.15
    n = int(SR * dur)
    t = np.arange(n) / SR
    freq = 250 + (700 - 250) * (t / dur)  # linjär svep upp
    samples = triangle_sweep(freq, dur)
    samples = adsr(samples, attack=0.005, decay=0.02, sustain=0.6, release=0.08)
    return samples


def triangle_sweep(freq_curve, dur):
    """Triangle wave med varierande frekvens (för svep)."""
    n = int(SR * dur)
    phase = np.cumsum(2 * np.pi * freq_curve / SR)
    return 2 * np.abs(2 * ((phase / (2 * np.pi)) % 1) - 1) - 1


def sfx_pickup():
    """Glad chime — pentaton trippel C5 E5 G5."""
    notes = [(523, 0.0), (659, 0.07), (784, 0.14)]  # (Hz, start-time)
    total = 0.32
    n = int(SR * total)
    out = np.zeros(n)
    for hz, start in notes:
        s = int(start * SR)
        d = total - start
        wave_data = sine(hz, d) * 0.6 + sine(hz * 2, d) * 0.2  # grundton + harmonisk
        env = adsr(np.ones_like(wave_data), attack=0.005, decay=0.04, sustain=0.5, release=0.18)
        out[s:s + len(wave_data)] += wave_data * env
    return out


def sfx_bonk():
    """Mjuk komisk dump — låg sinus + lite noise."""
    dur = 0.22
    base = sine(110, dur) * 0.7  # låg ton
    base += sine(80, dur, phase=0.3) * 0.3  # bas-harmonisk
    base += noise(dur) * 0.15  # lite kraschtextur
    base = adsr(base, attack=0.002, decay=0.05, sustain=0.3, release=0.15)
    # frekvens-fade ner via amplitud-modulering
    t = np.arange(len(base)) / SR
    base *= np.exp(-t * 6)
    return base


def sfx_shiny():
    """Glittrig arpeggio — C5 E5 G5 C6 + shimmer."""
    notes = [(523, 0.0), (659, 0.05), (784, 0.10), (1047, 0.15)]
    total = 0.55
    n = int(SR * total)
    out = np.zeros(n)
    for hz, start in notes:
        s = int(start * SR)
        d = total - start
        wave_data = sine(hz, d) * 0.5 + sine(hz * 2, d) * 0.3 + sine(hz * 3, d) * 0.15
        env = adsr(np.ones_like(wave_data), attack=0.003, decay=0.05, sustain=0.4, release=0.30)
        out[s:s + len(wave_data)] += wave_data * env
    # shimmer-lager (high-freq vibrato)
    t = np.arange(n) / SR
    shimmer = sine(2000 + 200 * np.sin(2 * np.pi * 12 * t), total) * 0.08
    out += shimmer * np.exp(-t * 2)
    return out


# ─── BGM-loopar ─────────────────────────────────────────────────────────

def note(freq, dur, wave_fn=triangle, harmonic_mix=(1.0, 0.0)):
    """En enskild ton med envelope. harmonic_mix = (grund, oktav)."""
    base = wave_fn(freq, dur) * harmonic_mix[0]
    if harmonic_mix[1] > 0:
        base = base + sine(freq * 2, dur) * harmonic_mix[1]
    return adsr(base, attack=0.01, decay=0.05, sustain=0.55, release=0.08)


def play_sequence(notes_seq, total_dur, gain=0.5):
    """notes_seq: lista av (freq, start_s, dur_s, wave_fn). Mixar till total_dur."""
    n = int(SR * total_dur)
    out = np.zeros(n)
    for freq, start, dur, wave_fn in notes_seq:
        if freq is None:  # paus
            continue
        s = int(start * SR)
        d = min(int(dur * SR), n - s)
        if d <= 0:
            continue
        nt = note(freq, d / SR, wave_fn) * gain
        out[s:s + len(nt)] += nt
    return out


# Toner i Hz (fyra oktaver runt mittpunkten)
NOTES = {
    "C3": 130.81, "D3": 146.83, "E3": 164.81, "F3": 174.61, "G3": 196.00, "A3": 220.00, "B3": 246.94,
    "C4": 261.63, "D4": 293.66, "E4": 329.63, "F4": 349.23, "G4": 392.00, "A4": 440.00, "B4": 493.88,
    "C5": 523.25, "D5": 587.33, "E5": 659.25, "F5": 698.46, "G5": 783.99, "A5": 880.00, "B5": 987.77,
    "C6": 1046.50,
}


def bgm_forest():
    """Lugn skog-loop ~10s. Tempo 100 BPM, F major, mjuk melodi."""
    bpm = 100
    beat = 60.0 / bpm  # 0.6s
    # 16 åttondelar = 8 takter
    melody_seq = []
    melody_notes = ["F4", "A4", "C5", "A4", "F4", "A4", "C5", "D5",
                    "C5", "A4", "F4", "A4", "G4", "F4", "E4", "F4"]
    for i, n in enumerate(melody_notes):
        start = i * beat / 2
        melody_seq.append((NOTES[n], start, beat / 2 * 0.95, triangle))
    # Bas: F-C-F-C på fjärdedelarna
    bass_notes = ["F3", "C3", "F3", "C3"] * 2
    bass_seq = []
    for i, n in enumerate(bass_notes):
        start = i * beat
        bass_seq.append((NOTES[n], start, beat * 0.95, square))
    total = 8 * beat
    melody = play_sequence(melody_seq, total, gain=0.4)
    bass = play_sequence(bass_seq, total, gain=0.25)
    return melody + bass


def bgm_beach():
    """Glad strand-loop ~10s. Tempo 120 BPM, C major."""
    bpm = 120
    beat = 60.0 / bpm  # 0.5s
    melody_notes = ["C5", "E5", "G5", "E5", "C5", "E5", "G5", "C6",
                    "G5", "E5", "C5", "E5", "D5", "C5", "G4", "C5"]
    melody_seq = [(NOTES[n], i * beat / 2, beat / 2 * 0.9, triangle) for i, n in enumerate(melody_notes)]
    bass_notes = ["C3", "G3", "C3", "G3"] * 2
    bass_seq = [(NOTES[n], i * beat, beat * 0.95, square) for i, n in enumerate(bass_notes)]
    total = 8 * beat
    melody = play_sequence(melody_seq, total, gain=0.4)
    bass = play_sequence(bass_seq, total, gain=0.25)
    return melody + bass


def bgm_cave():
    """Mystisk grotta-loop ~10s. Tempo 90 BPM, A minor."""
    bpm = 90
    beat = 60.0 / bpm  # 0.667s
    melody_notes = ["A4", "C5", "E5", "C5", "A4", "B4", "C5", "B4",
                    "A4", "G4", "F4", "G4", "A4", "C5", "B4", "A4"]
    melody_seq = [(NOTES[n], i * beat / 2, beat / 2 * 0.95, triangle) for i, n in enumerate(melody_notes)]
    bass_notes = ["A3", "E3", "F3", "E3"] * 2
    bass_seq = [(NOTES[n], i * beat, beat * 0.95, square) for i, n in enumerate(bass_notes)]
    total = 8 * beat
    melody = play_sequence(melody_seq, total, gain=0.4)
    bass = play_sequence(bass_seq, total, gain=0.3)
    return melody + bass


def bgm_ocean():
    """Drömmande hav-loop ~10s. Tempo 80 BPM, D major. Vågrullande melodi."""
    bpm = 80
    beat = 60.0 / bpm  # 0.75s
    # Lugn melodi som rullar upp och ner som vågor.
    melody_notes = ["D5", "F5", "A5", "F5", "D5", "F5", "A5", "G5",
                    "F5", "A5", "G5", "F5", "E5", "D5", "F5", "D5"]
    melody_seq = [(NOTES[n], i * beat / 2, beat / 2 * 0.95, triangle) for i, n in enumerate(melody_notes)]
    # Bas: D-A-D-A pulse
    bass_notes = ["D3", "A3", "D3", "A3"] * 2
    bass_seq = [(NOTES[n], i * beat, beat * 0.95, square) for i, n in enumerate(bass_notes)]
    total = 8 * beat
    melody = play_sequence(melody_seq, total, gain=0.4)
    bass = play_sequence(bass_seq, total, gain=0.25)
    # Mjuk vågpad: låg sinus med långsam vibrato → "djupa havet" känsla
    n = int(SR * total)
    t = np.arange(n) / SR
    pad = sine(NOTES["D3"] / 2, total) * (0.10 + 0.04 * np.sin(2 * np.pi * 0.4 * t))
    return melody + bass + pad


# ─── Main ──────────────────────────────────────────────────────────────

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", type=pathlib.Path, default=pathlib.Path(__file__).resolve().parents[2] / "assets" / "audio")
    args = ap.parse_args()
    args.out.mkdir(parents=True, exist_ok=True)

    print(f"Skriver ljud till {args.out}")
    sfx = {
        "sfx-jump.wav": sfx_jump(),
        "sfx-pickup.wav": sfx_pickup(),
        "sfx-bonk.wav": sfx_bonk(),
        "sfx-shiny.wav": sfx_shiny(),
    }
    for name, samples in sfx.items():
        write_wav(args.out / name, samples, gain=0.55)

    bgm = {
        "bgm-forest.wav": bgm_forest(),
        "bgm-beach.wav": bgm_beach(),
        "bgm-cave.wav": bgm_cave(),
        "bgm-ocean.wav": bgm_ocean(),
    }
    for name, samples in bgm.items():
        write_wav(args.out / name, samples, gain=0.45)

    print("Klart.")


if __name__ == "__main__":
    main()
