#!/usr/bin/env python3
"""Sounddesign im Stil der @man_ia_c-Videos: keine Stimme, nur Atmo, Drone,
Uhrticken, Einschläge, Riser. Alles synthetisch und deterministisch.

Aufruf:
  python tools/sounddesign.py audio/niemand-arbeitet.json audio/niemand-arbeitet.wav

Die JSON-Datei beschreibt die Cues (siehe audio/niemand-arbeitet.json).
"""

import json
import sys
import wave

import numpy as np

SR = 48000


def rng(seed):
    return np.random.default_rng(seed)


def env(n, attack, release, sr=SR):
    e = np.ones(n)
    a = min(n, int(attack * sr))
    r = min(n, int(release * sr))
    if a:
        e[:a] = np.linspace(0, 1, a)
    if r:
        e[n - r:] *= np.linspace(1, 0, r)
    return e




def lp(x, cutoff):
    """Tiefpass per FFT (schnell, für Rauschen)."""
    X = np.fft.rfft(x)
    f = np.fft.rfftfreq(len(x), 1 / SR)
    X *= 1 / np.sqrt(1 + (f / cutoff) ** 4)
    return np.fft.irfft(X, len(x))


def bp(x, lo, hi):
    X = np.fft.rfft(x)
    f = np.fft.rfftfreq(len(x), 1 / SR)
    X *= (1 / np.sqrt(1 + (f / hi) ** 4)) * (1 / np.sqrt(1 + (lo / np.maximum(f, 1)) ** 4))
    return np.fft.irfft(X, len(x))


class Mix:
    def __init__(self, duration):
        self.n = int(duration * SR)
        self.L = np.zeros(self.n)
        self.R = np.zeros(self.n)
        self.t = np.arange(self.n) / SR

    def add(self, sig, start, gain=1.0, pan=0.0):
        i = int(start * SR)
        if i >= self.n:
            return
        sig = sig[: self.n - i] * gain
        self.L[i:i + len(sig)] += sig * np.sqrt(0.5 * (1 - pan))
        self.R[i:i + len(sig)] += sig * np.sqrt(0.5 * (1 + pan))

    def add_stereo(self, l, r, start, gain=1.0):
        i = int(start * SR)
        l = l[: self.n - i] * gain
        r = r[: self.n - i] * gain
        self.L[i:i + len(l)] += l
        self.R[i:i + len(r)] += r


# ------------------------------------------------------------------ Klänge --

def city_ambience(dur, seed):
    g = rng(seed)
    n = int(dur * SR)
    rumble = lp(g.standard_normal(n), 180) * 2.2
    hiss = bp(g.standard_normal(n), 400, 2500) * 0.25
    # Stimmengewirr: bandbegrenztes Rauschen mit Silben-Modulation
    chatter = bp(g.standard_normal(n), 300, 1800)
    mod = lp(g.standard_normal(n), 5)
    chatter *= 0.5 + 4 * np.clip(mod, 0, None)
    l = rumble + hiss + chatter * 0.25
    r = rumble + bp(g.standard_normal(n), 400, 2500) * 0.25 + chatter * 0.2
    return l, r


def car_pass(dur, seed):
    g = rng(seed)
    n = int(dur * SR)
    x = lp(g.standard_normal(n), 900)
    e = np.sin(np.linspace(0, np.pi, n)) ** 2
    return x * e


def birds(dur, seed, density=1.5):
    g = rng(seed)
    n = int(dur * SR)
    out = np.zeros(n)
    t = 0.2
    while t < dur - 0.4:
        f0 = g.uniform(2800, 4600)
        chirps = g.integers(2, 5)
        for c in range(chirps):
            ln = int(g.uniform(0.05, 0.11) * SR)
            tt = np.arange(ln) / SR
            f = f0 + g.uniform(-600, 900) * tt / tt[-1]
            s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * tt / tt[-1]) ** 2
            i = int((t + c * 0.13) * SR)
            if i + ln < n:
                out[i:i + ln] += s
        t += g.exponential(1 / density) + 0.3
    return out


def drone(dur, freqs, seed):
    t = np.arange(int(dur * SR)) / SR
    g = rng(seed)
    out = np.zeros_like(t)
    for k, f in enumerate(freqs):
        lfo = 1 + 0.004 * np.sin(2 * np.pi * (0.07 + 0.03 * k) * t + g.uniform(0, 6))
        out += np.sin(2 * np.pi * f * lfo * t) / (1 + k * 0.6)
    out += lp(g.standard_normal(len(t)), 120) * 0.6
    return out


def tick(seed, bright=1.0):
    g = rng(seed)
    n = int(0.03 * SR)
    t = np.arange(n) / SR
    s = (np.sin(2 * np.pi * 2300 * t) * 0.6 + bp(g.standard_normal(n), 1500, 6000) * 2) * np.exp(-t * 180)
    return s * bright


def impact(seed, low=42):
    g = rng(seed)
    n = int(3.5 * SR)
    t = np.arange(n) / SR
    body = np.sin(2 * np.pi * (low + 60 * np.exp(-t * 8)) * t) * np.exp(-t * 1.6)
    noise = lp(g.standard_normal(n), 2000) * np.exp(-t * 6) * 0.8
    return (body * 1.4 + noise)


def whoosh(seed, dur=0.9):
    g = rng(seed)
    n = int(dur * SR)
    x = bp(g.standard_normal(n), 300, 3500)
    e = np.sin(np.linspace(0, np.pi, n)) ** 3
    return x * e


def powerdown(dur=1.8):
    n = int(dur * SR)
    t = np.arange(n) / SR
    f = 380 * np.exp(-t * 2.2) + 30
    s = np.sin(2 * np.pi * np.cumsum(f) / SR)
    buzz = np.sign(np.sin(2 * np.pi * 100 * t)) * 0.15 * np.exp(-t * 4)
    return (s + buzz) * np.exp(-t * 1.2)


def drip():
    n = int(0.25 * SR)
    t = np.arange(n) / SR
    f = 900 + 1400 * np.exp(-t * 40)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 28)


def wind(dur, seed):
    g = rng(seed)
    n = int(dur * SR)
    x = bp(g.standard_normal(n), 250, 1800)
    mod = 0.5 + 0.5 * np.sin(2 * np.pi * 0.35 * np.arange(n) / SR) + lp(g.standard_normal(n), 1) * 2
    return x * np.clip(mod, 0.1, None)


def chord(dur, freqs, attack=1.6):
    t = np.arange(int(dur * SR)) / SR
    out = np.zeros_like(t)
    for k, f in enumerate(freqs):
        out += (np.sin(2 * np.pi * f * t) + 0.3 * np.sin(4 * np.pi * f * t)) / (1 + k * 0.4)
    return out * env(len(t), attack, min(1.0, dur / 2))


def bell(dur, freqs):
    t = np.arange(int(dur * SR)) / SR
    out = np.zeros_like(t)
    for f in freqs:
        out += np.sin(2 * np.pi * f * t) * np.exp(-t * 1.1) + 0.25 * np.sin(2 * np.pi * f * 2.76 * t) * np.exp(-t * 3)
    return out


# -------------------------------------------------------------------- Main --

def build(cfg):
    m = Mix(cfg["duration"])
    for c in cfg["cues"]:
        kind, at = c["type"], c["at"]
        dur = c.get("dur", 1.0)
        gain = c.get("gain", 1.0)
        seed = c.get("seed", 1)
        if kind == "city":
            l, r = city_ambience(dur, seed)
            e = env(len(l), c.get("fadeIn", 0.05), c.get("fadeOut", 0.02))
            m.add_stereo(l * e, r * e, at, gain)
        elif kind == "car":
            m.add(car_pass(dur, seed), at, gain, c.get("pan", 0))
        elif kind == "birds":
            b = birds(dur, seed, c.get("density", 1.5))
            m.add(b * env(len(b), 0.3, 0.3), at, gain, c.get("pan", 0.3))
        elif kind == "drone":
            d = drone(dur, c["freqs"], seed)
            e = env(len(d), c.get("fadeIn", 0.02), c.get("fadeOut", 0.02))
            # langsames Anschwellen über die Dauer
            e *= np.linspace(c.get("from", 1.0), c.get("to", 1.0), len(d))
            m.add(d * e, at, gain)
        elif kind == "ticks":
            # Intervall wandert linear von interval[0] nach interval[1]
            t, end = at, at + dur
            i0, i1 = c["interval"]
            k = 0
            while t < end:
                x = (t - at) / dur
                m.add(tick(seed + k, 1.0 if k % 2 == 0 else 0.7), t, gain * (0.7 + 0.3 * x), -0.2 if k % 2 else 0.2)
                t += i0 + (i1 - i0) * x
                k += 1
        elif kind == "impact":
            m.add(impact(seed, c.get("low", 42)), at, gain)
        elif kind == "whoosh":
            m.add(whoosh(seed, dur), at - dur * 0.6, gain, c.get("pan", 0))
        elif kind == "powerdown":
            m.add(powerdown(dur), at, gain)
        elif kind == "drip":
            m.add(drip(), at, gain, c.get("pan", 0))
        elif kind == "wind":
            w = wind(dur, seed)
            m.add(w * env(len(w), 0.8, 0.8), at, gain, 0.2)
        elif kind == "chord":
            m.add(chord(dur, c["freqs"], c.get("attack", 1.6)), at, gain)
        elif kind == "bell":
            m.add(bell(dur, c["freqs"]), at, gain)
        elif kind == "silence":
            i, j = int(at * SR), int((at + dur) * SR)
            m.L[i:j] = 0
            m.R[i:j] = 0
        else:
            raise SystemExit(f"Unbekannter Cue-Typ: {kind}")

    stereo = np.stack([m.L, m.R], axis=1)
    peak = np.max(np.abs(stereo)) or 1
    stereo = stereo / peak * 10 ** (-1 / 20)
    return stereo


def write_wav(path, stereo):
    data = (np.clip(stereo, -1, 1) * 32767).astype("<i2")
    with wave.open(path, "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(data.tobytes())


if __name__ == "__main__":
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    cfg = json.load(open(sys.argv[1], encoding="utf-8"))
    write_wav(sys.argv[2], build(cfg))
    print(f"✔ {sys.argv[2]}")
