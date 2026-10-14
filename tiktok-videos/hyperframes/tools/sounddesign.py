#!/usr/bin/env python3
"""Sounddesign im Stil der @man_ia_c-Videos – ohne Stimme, alles synthetisch
und deterministisch (gleiche JSON → gleiche WAV).

Aufbau wie bei den Vorbildern (Spektrogramm-Analyse, siehe REFERENZ_ANALYSE.md):
  1. Atmo pro Szene (Strand, Straße, U-Bahn, Supermarkt …), hart mit dem Bild geschnitten
  2. Musik-/Spannungsschicht ab dem Ereignis: Sub-Bass 40–60 Hz, Pad, Ticken,
     Herzschlag, Riser vor Höhepunkten, fallende Glissandi („Drop“), Glocken, Funkeln
  3. Foley zu dem, was die Hände/Szene tun (Schritte, Eis knackt, Papier flattert …)
  4. Mastering: Hall-Bus, Kompressor, Limiter, Lautheit ~ −16 LUFS (wie Referenz)

Aufruf:
  python tools/sounddesign.py videos/<id>/audio/sound.json videos/<id>/audio/sound.wav

Cue-Felder (alle optional außer type/at): dur, gain, pan (-1..1), seed,
verb (Hall-Anteil 0..1), lp (Tiefpass-Hz), hp (Hochpass-Hz), fadeIn, fadeOut.
Typen: siehe CUES unten (`python tools/sounddesign.py --list`).
"""

import json
import sys
import wave

import numpy as np

SR = 48000
TARGET_RMS_DB = -17.0   # Referenzvideos: laute Passagen −14 … −20 dB RMS


# ===================================================================== Basis ==

def rng(seed):
    return np.random.default_rng(int(seed))


def N(d):
    return max(1, int(d * SR))


def tt(d):
    return np.arange(N(d)) / SR


def env(n, attack, release):
    e = np.ones(n)
    a, r = min(n, int(attack * SR)), min(n, int(release * SR))
    if a:
        e[:a] = np.linspace(0, 1, a) ** 1.5
    if r:
        e[n - r:] *= np.linspace(1, 0, r) ** 1.5
    return e


def _shape(x, gain_fn):
    X = np.fft.rfft(x)
    f = np.fft.rfftfreq(len(x), 1 / SR)
    return np.fft.irfft(X * gain_fn(np.maximum(f, 1e-3)), len(x))


def lp(x, fc, order=2):
    return _shape(x, lambda f: 1 / np.sqrt(1 + (f / fc) ** (2 * order)))


def hp(x, fc, order=2):
    return _shape(x, lambda f: 1 / np.sqrt(1 + (fc / f) ** (2 * order)))


def bp(x, lo, hi, order=2):
    return _shape(x, lambda f: 1 / np.sqrt(1 + (f / hi) ** (2 * order)) / np.sqrt(1 + (lo / f) ** (2 * order)))


def noise(d, seed):
    return rng(seed).standard_normal(N(d))


def slow(d, rate, seed):
    """Langsame Zufallskurve 0..1 (für Modulation)."""
    x = lp(noise(d, seed), rate, 1)
    x = (x - x.min()) / (np.ptp(x) + 1e-9)
    return x


def glide(f0, f1, d, curve="exp"):
    t = tt(d)
    if curve == "exp":
        f = f0 * (f1 / f0) ** (t / d)
    else:
        f = f0 + (f1 - f0) * t / d
    return np.sin(2 * np.pi * np.cumsum(f) / SR), f


def norm(x):
    p = np.max(np.abs(x)) or 1
    return x / p


# ================================================================ Atmosphären ==

def amb_beach(d, s):
    r = rng(s)
    t = tt(d)
    waves = np.zeros(N(d))
    k = 0.0
    while k < d:  # einzelne Wellen alle 4–7 s
        ln = r.uniform(3.5, 6)
        seg = N(ln)
        i = int(k * SR)
        e = np.sin(np.linspace(0, np.pi, seg)) ** 3
        w = lp(noise(ln, s + int(k * 10)), r.uniform(600, 1200)) * e
        j = min(len(waves), i + seg)
        waves[i:j] += w[: j - i]
        k += r.uniform(3.5, 6.5)
    spray = hp(noise(d, s + 1), 3000) * 0.08 * (0.5 + slow(d, 0.3, s + 2))
    out = waves * 0.9 + spray
    # Möwen
    k = r.uniform(0.3, 1.5)
    while k < d - 0.6:
        g, _ = glide(r.uniform(1300, 1700), r.uniform(900, 1100), 0.35)
        call = g * np.sin(np.linspace(0, np.pi, len(g))) ** 2 * (1 + 0.3 * np.sin(2 * np.pi * 28 * tt(0.35)))
        i = int(k * SR)
        out[i:i + len(call)] += call[: len(out) - i] * 0.25
        k += r.uniform(1.2, 3.5)
    # entfernte Stimmen
    chat = bp(noise(d, s + 3), 300, 1600) * (0.3 + 2.5 * np.clip(lp(noise(d, s + 4), 5), 0, None))
    return out + chat * 0.08


def amb_street(d, s):
    rumble = lp(noise(d, s), 160) * 2.0
    hiss = bp(noise(d, s + 1), 400, 2500) * 0.25
    chat = bp(noise(d, s + 2), 300, 1800) * (0.4 + 3 * np.clip(lp(noise(d, s + 3), 5), 0, None))
    out = rumble + hiss + chat * 0.25
    r = rng(s)
    k = r.uniform(0, 1.5)
    while k < d - 2:  # vorbeifahrende Autos
        ln = r.uniform(2.2, 3.5)
        car = lp(noise(ln, s + int(k * 7)), 900) * np.sin(np.linspace(0, np.pi, N(ln))) ** 2
        i = int(k * SR)
        out[i:i + len(car)] += car[: len(out) - i] * 1.2
        k += r.uniform(2, 4)
    return out


def amb_subway(d, s):
    rumble = lp(noise(d, s), 90) * 3 * (0.6 + 0.4 * slow(d, 0.4, s + 1))
    vent = bp(noise(d, s + 2), 800, 4000) * 0.12
    hum = sum(np.sin(2 * np.pi * f * tt(d)) / (i + 1) for i, f in enumerate([100, 200, 300])) * 0.04
    return rumble + vent + hum


def amb_supermarket(d, s):
    t = tt(d)
    hum = sum(np.sign(np.sin(2 * np.pi * f * t)) / (i + 2) for i, f in enumerate([100, 200])) * 0.03  # Neonröhren
    room = bp(noise(d, s), 200, 1500) * 0.25
    out = hum + room
    r = rng(s)
    k = 0.3
    while k < d - 0.2:  # Kassenpiepen in der Ferne
        b = np.sin(2 * np.pi * 2900 * tt(0.09)) * env(N(0.09), 0.003, 0.02)
        i = int(k * SR)
        out[i:i + len(b)] += b[: len(out) - i] * 0.06
        k += r.uniform(0.6, 1.4)
    return out


def amb_backyard(d, s):
    out = lp(noise(d, s), 200) * 1.0 + bp(noise(d, s + 1), 500, 2500) * 0.1
    t = tt(d)
    for k in range(5):  # Fliegen: brummender Sägezahn mit Flatter-AM
        f0 = 170 + k * 23
        fm = f0 * (1 + 0.04 * np.sin(2 * np.pi * (0.7 + k * 0.3) * t + k))
        saw = 2 * ((np.cumsum(fm) / SR) % 1) - 1
        am = 0.5 + 0.5 * np.sin(2 * np.pi * (0.4 + 0.17 * k) * t + k * 2)
        out += bp(saw, 150, 1800) * am * 0.05
    return out


def amb_room(d, s):
    t = tt(d)
    fridge = (np.sin(2 * np.pi * 50 * t) + 0.5 * np.sin(2 * np.pi * 100 * t)) * 0.05
    tone = lp(noise(d, s), 300) * 0.4
    out = fridge + tone
    for k in np.arange(0.5, d, 1.0):  # Wanduhr
        c = hp(noise(0.02, s + int(k * 10)), 2000) * env(N(0.02), 0.001, 0.015)
        i = int(k * SR)
        out[i:i + len(c)] += c[: len(out) - i] * 0.15
    return out


def amb_storm(d, s):
    t = tt(d)
    w = noise(d, s)
    center = 400 + 500 * slow(d, 0.25, s + 1)
    # heulender Wind: zwei Bänder, deren Mitte wandert
    howl = bp(w, 250, 900) * (0.4 + slow(d, 0.4, s + 2)) + bp(noise(d, s + 3), 900, 2600) * 0.3 * slow(d, 0.6, s + 4)
    whistle = np.sin(2 * np.pi * np.cumsum(center * 2) / SR) * 0.03 * slow(d, 0.5, s + 5)
    return howl + whistle + lp(noise(d, s + 6), 120) * 0.8


def amb_underwater(d, s):
    out = lp(noise(d, s), 260, 3) * 3 * (0.7 + 0.3 * slow(d, 0.2, s + 1))
    r = rng(s)
    k = 0.1
    while k < d - 0.1:  # Blasen
        g, _ = glide(r.uniform(300, 600), r.uniform(900, 1500), 0.05)
        b = g * env(len(g), 0.002, 0.03)
        i = int(k * SR)
        out[i:i + len(b)] += b[: len(out) - i] * 0.12
        k += r.exponential(0.15)
    return out


def amb_office(d, s):
    out = bp(noise(d, s), 150, 1500) * 0.3
    r = rng(s)
    k = 0.05
    while k < d - 0.05:  # Tastaturen
        c = bp(noise(0.012, s + int(k * 1000)), 1500, 6000) * env(N(0.012), 0.0005, 0.01)
        i = int(k * SR)
        out[i:i + len(c)] += c[: len(out) - i] * r.uniform(0.15, 0.4)
        k += r.exponential(0.07)
    return out


def amb_night(d, s):
    """Stille Stadtnacht mit Grillen in der Ferne."""
    t = tt(d)
    out = lp(noise(d, s), 150) * 0.6
    chirp = np.sin(2 * np.pi * 4300 * t) * (np.sin(2 * np.pi * 30 * t) > 0.3) * (np.sin(2 * np.pi * 1.6 * t) > 0)
    return out + chirp * 0.02


def amb_crowd(d, s):
    return bp(noise(d, s), 250, 2200) * (0.6 + 3 * np.clip(lp(noise(d, s + 1), 4), 0, None)) * 0.4 + lp(noise(d, s + 2), 200)


AMBIENCES = {
    "beach": amb_beach, "street": amb_street, "subway": amb_subway, "supermarket": amb_supermarket,
    "backyard": amb_backyard, "room": amb_room, "storm": amb_storm, "underwater": amb_underwater,
    "office": amb_office, "night": amb_night, "crowd": amb_crowd,
}


# ===================================================================== Musik ==

def sub(d, freq=48, s=0):
    t = tt(d)
    x = np.sin(2 * np.pi * freq * t) + 0.35 * np.sin(2 * np.pi * freq * 2 * t + 0.4)
    x *= 0.85 + 0.15 * np.sin(2 * np.pi * 0.11 * t)
    return x + lp(noise(d, s), 70) * 0.5


def pad(d, freqs, s=0):
    t = tt(d)
    r = rng(s)
    out = np.zeros(N(d))
    for f in freqs:
        for det in (-0.004, 0.0, 0.0047):  # leicht verstimmte Sägezähne
            ph = r.uniform(0, 1)
            saw = 2 * ((f * (1 + det) * t + ph) % 1) - 1
            out += saw
    out = lp(out, 900) * (0.75 + 0.25 * np.sin(2 * np.pi * 0.08 * t))
    return out / (len(freqs) * 3)


def tinnitus(d, freq=3800):
    t = tt(d)
    return np.sin(2 * np.pi * freq * t) * np.exp(-t * 0.9)


def heartbeat(d, bpm=70, s=0):
    out = np.zeros(N(d))
    k = 0.0
    while k < d:
        for off, amp in ((0, 1.0), (0.24, 0.7)):
            th = tt(0.25)
            beat = np.sin(2 * np.pi * (55 + 40 * np.exp(-th * 30)) * th) * np.exp(-th * 18) * amp
            i = int((k + off) * SR)
            out[i:i + len(beat)] += beat[: max(0, len(out) - i)]
        k += 60 / bpm
    return out


def riser(d, s=0, f0=200, f1=2400):
    g, f = glide(f0, f1, d)
    # Rauschen, dessen Band mitwandert (blockweise)
    out = np.zeros(N(d))
    blk = N(0.05)
    for i in range(0, len(out), blk):
        c = f[min(i, len(f) - 1)]
        seg = bp(noise(0.05 + 0.02, s + i), c * 0.6, c * 1.6)[:blk]
        out[i:i + blk] += seg[: len(out) - i]
    e = np.linspace(0, 1, N(d)) ** 2.5
    return (out * 0.7 + g * 0.35) * e


def drop(d, f0=1400, f1=40):
    """Fallendes Glissando wie in den Referenzen (z. B. vor Einschlägen)."""
    g, f = glide(f0, f1, d)
    h, _ = glide(f0 * 2, f1 * 2, d)
    return (g + 0.3 * h) * env(N(d), 0.05, 0.25)


def reverse_swell(d, s=0):
    t = tt(d)
    x = bp(noise(d, s), 300, 6000) + 0.6 * np.sin(2 * np.pi * 110 * t)
    return x * (np.linspace(0, 1, N(d)) ** 4)


def shimmer(d, s=0, density=40):
    r = rng(s)
    out = np.zeros(N(d))
    for _ in range(int(d * density)):
        f = r.uniform(4500, 9000)
        ln = r.uniform(0.04, 0.12)
        g = np.sin(2 * np.pi * f * tt(ln)) * np.sin(np.linspace(0, np.pi, N(ln))) ** 2
        i = r.integers(0, max(1, len(out) - len(g)))
        out[i:i + len(g)] += g * r.uniform(0.3, 1)
    return out * env(len(out), d * 0.3, d * 0.4)


def chime(d, freq=392.0):
    t = tt(d)
    parts = [(1, 1.0, 1.2), (2.0, 0.5, 2.0), (3.01, 0.3, 2.8), (4.2, 0.18, 3.5), (5.4, 0.1, 4.5)]
    return sum(a * np.sin(2 * np.pi * freq * m * t) * np.exp(-t * dec) for m, a, dec in parts)


def tick(s, bright=1.0):
    th = tt(0.03)
    return (np.sin(2 * np.pi * 2300 * th) * 0.6 + bp(noise(0.03, s), 1500, 6000) * 2) * np.exp(-th * 180) * bright


def impact(s, low=42, d=3.5):
    t = tt(d)
    body = np.sin(2 * np.pi * (low + 70 * np.exp(-t * 8)) * t) * np.exp(-t * 1.4)
    crack = hp(noise(d, s), 1200) * np.exp(-t * 25) * 0.6
    rumble = lp(noise(d, s + 1), 300) * np.exp(-t * 2.5) * 0.9
    return body * 1.4 + crack + rumble


def whoosh(s, d=0.9):
    x = bp(noise(d, s), 300, 3500)
    return x * np.sin(np.linspace(0, np.pi, N(d))) ** 3


def chord(d, freqs, attack=1.6):
    t = tt(d)
    out = sum((np.sin(2 * np.pi * f * t) + 0.3 * np.sin(4 * np.pi * f * t)) / (1 + k * 0.4) for k, f in enumerate(freqs))
    return out * env(N(d), attack, min(1.0, d / 2))


def bell(d, freqs):
    t = tt(d)
    return sum(np.sin(2 * np.pi * f * t) * np.exp(-t * 1.1) + 0.25 * np.sin(2 * np.pi * f * 2.76 * t) * np.exp(-t * 3) for f in freqs)


def powerdown(d=1.8):
    t = tt(d)
    f = 380 * np.exp(-t * 2.2) + 30
    s = np.sin(2 * np.pi * np.cumsum(f) / SR)
    buzz = np.sign(np.sin(2 * np.pi * 100 * t)) * 0.15 * np.exp(-t * 4)
    return (s + buzz) * np.exp(-t * 1.2)


# ===================================================================== Foley ==

SURFACES = {  # Band, Abklingrate, Körnung
    "sand": (300, 2200, 35, 0.6), "snow": (1500, 7000, 22, 1.0), "street": (600, 5000, 60, 0.3),
    "tile": (900, 7000, 80, 0.2), "wood": (150, 2500, 45, 0.3), "ice": (1200, 8000, 70, 0.4),
}


def step(surface, s):
    lo, hi, dec, grain = SURFACES[surface]
    th = tt(0.18)
    x = bp(noise(0.18, s), lo, hi) * np.exp(-th * dec)
    if grain:
        x *= 1 + grain * (rng(s).random(len(x)) > 0.7)
    x += np.sin(2 * np.pi * 70 * th) * np.exp(-th * 40) * 0.6  # Körperschall
    return x


def footsteps(d, surface="street", rate=1.85, s=0):
    out = np.zeros(N(d))
    k, n = 0.0, 0
    r = rng(s)
    while k < d:
        st = step(surface, s + n) * r.uniform(0.7, 1.0)
        i = int(k * SR)
        out[i:i + len(st)] += st[: max(0, len(out) - i)]
        k += 1 / rate * r.uniform(0.95, 1.05)
        n += 1
    return out


def ice_crack(s):
    th = tt(1.2)
    snap = hp(noise(1.2, s), 2000) * np.exp(-th * 60)
    ping, _ = glide(2600, 600, 1.2)
    return snap * 1.5 + ping * np.exp(-th * 4) * 0.4 + lp(noise(1.2, s + 1), 200) * np.exp(-th * 5) * 0.6


def crackle(d, s, density=25):
    r = rng(s)
    out = np.zeros(N(d))
    for _ in range(int(d * density)):
        c = hp(noise(0.006, s + _), 2500) * np.exp(-tt(0.006) * 600)
        i = r.integers(0, max(1, len(out) - len(c)))
        out[i:i + len(c)] += c * r.uniform(0.2, 1)
    return out


def splat(s):
    th = tt(0.5)
    return np.sin(2 * np.pi * (90 + 120 * np.exp(-th * 30)) * th) * np.exp(-th * 14) + bp(noise(0.5, s), 300, 2500) * np.exp(-th * 22) * 0.8


def flutter(d, s):
    t = tt(d)
    return bp(noise(d, s), 2000, 7000) * (0.5 + 0.5 * np.sign(np.sin(2 * np.pi * (24 + 8 * np.sin(2 * np.pi * 0.7 * t)) * t)))


def rattle(d, s):
    r = rng(s)
    out = lp(noise(d, s), 120) * 0.6
    for _ in range(int(d * 30)):
        c = bp(noise(0.01, s + _), 2000, 6000) * np.exp(-tt(0.01) * 300)
        i = r.integers(0, max(1, len(out) - len(c)))
        out[i:i + len(c)] += c * r.uniform(0.2, 0.8)
    return out


def squeak(s, d=0.35):
    t = tt(d)
    f = 1100 + 250 * np.sin(2 * np.pi * 9 * t) + 300 * t / d
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.linspace(0, np.pi, N(d))) ** 2


def beep(freq=2900, d=0.12):
    return np.sin(2 * np.pi * freq * tt(d)) * env(N(d), 0.003, 0.02)


def ding():
    a = chime(1.2, 659.3)
    b = chime(1.6, 523.3)
    out = np.zeros(N(2.2))
    out[: len(a)] += a
    out[N(0.45): N(0.45) + len(b)] += b
    return out


def flicker(d, s):
    t = tt(d)
    chop = rng(s).random(int(d * 40) + 1)
    gate = np.repeat(chop > 0.45, N(1 / 40))[: N(d)]
    return np.sign(np.sin(2 * np.pi * 100 * t)) * gate * 0.5


def water(d, s):
    """Wasserstrahl: Rauschen mit Gluckern."""
    x = bp(noise(d, s), 400, 6000) * (0.7 + 0.3 * slow(d, 6, s + 1))
    return x + lp(noise(d, s + 2), 300) * 0.5


def radio_static(d, s):
    """Röhrenradio: Rauschen, Pfeifen beim Senderwechsel, ferne Musik-/Sprachfetzen."""
    t = tt(d)
    hiss = bp(noise(d, s), 300, 4000) * (0.6 + 0.4 * slow(d, 8, s + 1))
    tune = 900 + 700 * np.sin(2 * np.pi * 0.35 * t)
    whistle = np.sin(2 * np.pi * np.cumsum(tune) / SR) * 0.12 * (slow(d, 1.5, s + 2) > 0.6)
    voice = bp(noise(d, s + 3), 300, 2500) * np.clip(lp(noise(d, s + 4), 6), 0, None) * 2.5 * (slow(d, 0.7, s + 5) > 0.5)
    return hiss + whistle + voice * 0.5


def creak(d, s):
    """Knarren (Schaukel, Holz): rauer, langsam gleitender Ton."""
    t = tt(d)
    f = 320 + 140 * np.sin(np.linspace(0, np.pi, N(d)))
    tone = np.sin(2 * np.pi * np.cumsum(f) / SR)
    grit = (rng(s).random(N(d)) > 0.55).astype(float)
    return bp(tone * (0.5 + grit), 200, 2500) * np.sin(np.linspace(0, np.pi, N(d))) ** 2


def drip_sound():
    t = tt(0.25)
    f = 900 + 1400 * np.exp(-t * 40)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 28)


# ==================================================== Kompatible alte Cues ===

def city_ambience(d, s):
    return amb_street(d, s)


def birds(d, s, density=1.5):
    r = rng(s)
    out = np.zeros(N(d))
    k = 0.2
    while k < d - 0.4:
        f0 = r.uniform(2800, 4600)
        for c in range(r.integers(2, 5)):
            ln = r.uniform(0.05, 0.11)
            th = tt(ln)
            f = f0 + r.uniform(-600, 900) * th / th[-1]
            b = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * th / th[-1]) ** 2
            i = int((k + c * 0.13) * SR)
            out[i:i + len(b)] += b[: max(0, len(out) - i)]
        k += r.exponential(1 / density) + 0.3
    return out


def drone(d, freqs, s):
    t = tt(d)
    r = rng(s)
    out = sum(np.sin(2 * np.pi * f * (1 + 0.004 * np.sin(2 * np.pi * (0.07 + 0.03 * k) * t + r.uniform(0, 6))) * t) / (1 + k * 0.6) for k, f in enumerate(freqs))
    return out + lp(noise(d, s), 120) * 0.6


def wind(d, s):
    x = bp(noise(d, s), 250, 1800)
    mod = 0.5 + 0.5 * np.sin(2 * np.pi * 0.35 * tt(d)) + lp(noise(d, s + 1), 1) * 2
    return x * np.clip(mod, 0.1, None)


# ===================================================================== Mixer ==

class Mix:
    def __init__(self, duration):
        self.n = N(duration)
        self.dry = np.zeros((self.n, 2))
        self.verb = np.zeros((self.n, 2))

    def add(self, sig, start, gain=1.0, pan=0.0, verb=0.0):
        i = int(start * SR)
        if i >= self.n or len(sig) == 0:
            return
        if i < 0:
            sig, i = sig[-i:], 0
        sig = sig[: self.n - i] * gain
        l, r = np.sqrt(0.5 * (1 - pan)), np.sqrt(0.5 * (1 + pan))
        st = np.stack([sig * l, sig * r], axis=1)
        self.dry[i:i + len(sig)] += st * (1 - 0.4 * verb)
        self.verb[i:i + len(sig)] += st * verb

    def silence(self, start, dur):
        i, j = int(start * SR), int((start + dur) * SR)
        self.dry[i:j] = 0
        self.verb[i:j] = 0


def reverb_ir(d=2.6, seed=99):
    t = tt(d)
    r = rng(seed)
    irs = []
    for ch in range(2):
        x = r.standard_normal(N(d)) * np.exp(-t * 2.6)
        x = lp(x, 6000) * (1 - np.exp(-t * 400))
        irs.append(x / np.sqrt(np.sum(x ** 2)))
    return irs


def convolve(x, ir):
    n = len(x) + len(ir) - 1
    nfft = 1 << (n - 1).bit_length()
    y = np.fft.irfft(np.fft.rfft(x, nfft) * np.fft.rfft(ir, nfft), nfft)
    return y[: len(x)]


def master(mix):
    irs = reverb_ir()
    wet = np.stack([convolve(mix.verb[:, c], irs[c]) for c in range(2)], axis=1)
    out = mix.dry + wet * 1.4
    out = np.stack([hp(out[:, 0], 28), hp(out[:, 1], 28)], axis=1)
    # Kompressor (Hüllkurve über 30 ms)
    lvl = np.sqrt(lp(np.mean(out ** 2, axis=1), 12, 1).clip(1e-10))
    db = 20 * np.log10(lvl)
    thr, ratio = -24.0, 3.0
    gain_db = np.where(db > thr, (thr - db) * (1 - 1 / ratio), 0)
    out *= (10 ** (gain_db / 20))[:, None]
    # Lautheit: RMS der hörbaren Teile auf das Ziel bringen
    loud = np.mean(out ** 2, axis=1)
    mask = loud > 1e-6
    rms = np.sqrt(np.mean(loud[mask])) if mask.any() else 1
    out *= 10 ** (TARGET_RMS_DB / 20) / (rms + 1e-12)
    # weicher Limiter auf −1 dBFS
    ceil = 10 ** (-1 / 20)
    out = np.tanh(out / ceil) * ceil
    return out


# ====================================================================== Cues ==

def render_cue(c):
    k = c["type"]
    d = c.get("dur", 1.0)
    s = c.get("seed", 1)
    if k == "ambience":
        x = AMBIENCES[c["preset"]](d, s)
        return norm(x) * env(N(d), c.get("fadeIn", 0.02), c.get("fadeOut", 0.02))
    if k == "sub":
        x = sub(d, c.get("freq", 48), s)
        return norm(x) * np.linspace(c.get("from", 1), c.get("to", 1), N(d)) * env(N(d), c.get("fadeIn", 0.05), c.get("fadeOut", 0.3))
    if k == "pad":
        return norm(pad(d, c["freqs"], s)) * env(N(d), c.get("fadeIn", 1.5), c.get("fadeOut", 1.0))
    if k == "tinnitus":
        return tinnitus(d, c.get("freq", 3800))
    if k == "heartbeat":
        return norm(heartbeat(d, c.get("bpm", 70), s))
    if k == "riser":
        return norm(riser(d, s, c.get("f0", 200), c.get("f1", 2400)))
    if k == "drop":
        return norm(drop(d, c.get("f0", 1400), c.get("f1", 40)))
    if k == "reverse":
        return norm(reverse_swell(d, s))
    if k == "shimmer":
        return norm(shimmer(d, s, c.get("density", 40)))
    if k == "chime":
        return norm(chime(d, c.get("freq", 392.0)))
    if k == "footsteps":
        return norm(footsteps(d, c.get("surface", "street"), c.get("rate", 1.85), s))
    if k == "ice_crack":
        return norm(ice_crack(s))
    if k == "crackle":
        return norm(crackle(d, s, c.get("density", 25))) * env(N(d), 0.2, 0.3)
    if k == "splat":
        return norm(splat(s))
    if k == "flutter":
        return norm(flutter(d, s)) * env(N(d), 0.05, 0.4)
    if k == "rattle":
        return norm(rattle(d, s)) * env(N(d), 0.05, 0.1)
    if k == "squeak":
        return norm(squeak(s, d))
    if k == "beep":
        return beep(c.get("freq", 2900), d)
    if k == "ding":
        return norm(ding())
    if k == "flicker":
        return norm(flicker(d, s))
    if k == "drip":
        return drip_sound()
    if k == "static":
        return norm(radio_static(d, s)) * env(N(d), c.get("fadeIn", 0.05), c.get("fadeOut", 0.1))
    if k == "creak":
        return norm(creak(d, s))
    if k == "water":
        return norm(water(d, s)) * env(N(d), c.get("fadeIn", 0.05), c.get("fadeOut", 0.5))
    if k == "ticks":
        out = np.zeros(N(d))
        t, n = 0.0, 0
        i0, i1 = c["interval"]
        while t < d:
            x = t / d
            tk = tick(s + n, 1.0 if n % 2 == 0 else 0.7) * (0.7 + 0.3 * x)
            i = int(t * SR)
            out[i:i + len(tk)] += tk[: max(0, len(out) - i)]
            t += i0 + (i1 - i0) * x
            n += 1
        return out
    # --- ältere Typen ---
    if k == "city":
        x = norm(city_ambience(d, s))
        return x * env(N(d), c.get("fadeIn", 0.05), c.get("fadeOut", 0.02))
    if k == "car":
        return norm(lp(noise(d, s), 900) * np.sin(np.linspace(0, np.pi, N(d))) ** 2)
    if k == "birds":
        return norm(birds(d, s, c.get("density", 1.5))) * env(N(d), 0.3, 0.3)
    if k == "drone":
        x = norm(drone(d, c["freqs"], s))
        return x * np.linspace(c.get("from", 1), c.get("to", 1), N(d)) * env(N(d), c.get("fadeIn", 0.02), c.get("fadeOut", 0.02))
    if k == "impact":
        return norm(impact(s, c.get("low", 42)))
    if k == "whoosh":
        return norm(whoosh(s, d))
    if k == "powerdown":
        return norm(powerdown(d))
    if k == "wind":
        return norm(wind(d, s)) * env(N(d), 0.8, 0.8)
    if k == "chord":
        return norm(chord(d, c["freqs"], c.get("attack", 1.6)))
    if k == "bell":
        return norm(bell(d, c["freqs"]))
    raise SystemExit(f"Unbekannter Cue-Typ: {k}")


# Wie weit vor `at` ein Cue startet (damit der Höhepunkt auf `at` liegt)
PRE_ROLL = {"whoosh": 0.6, "riser": 1.0, "reverse": 1.0}


def build(cfg):
    m = Mix(cfg["duration"])
    silences = []
    for c in cfg["cues"]:
        if c["type"] == "silence":
            silences.append((c["at"], c.get("dur", 0.5)))
            continue
        x = render_cue(c)
        if "lp" in c:
            x = lp(x, c["lp"])
        if "hp" in c:
            x = hp(x, c["hp"])
        start = c["at"] - PRE_ROLL.get(c["type"], 0) * c.get("dur", 1.0)
        m.add(x, start, c.get("gain", 1.0), c.get("pan", 0.0), c.get("verb", 0.0))
    out = master(m)
    for a, d in silences:
        i, j = int(a * SR), int((a + d) * SR)
        out[i:j] *= 0
    return out


def write_wav(path, stereo):
    data = (np.clip(stereo, -1, 1) * 32767).astype("<i2")
    with wave.open(path, "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(data.tobytes())


if __name__ == "__main__":
    if len(sys.argv) == 2 and sys.argv[1] == "--list":
        print("Atmos:", ", ".join(AMBIENCES))
        print("Typen: ambience, sub, pad, tinnitus, heartbeat, riser, drop, reverse, shimmer, chime, ticks, impact, whoosh,"
              " powerdown, chord, bell, footsteps(surface: " + ", ".join(SURFACES) + "), ice_crack, crackle, splat,"
              " flutter, rattle, squeak, beep, ding, flicker, drip, water, static, creak, wind, birds, city, car, drone, silence")
        sys.exit(0)
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    cfg = json.load(open(sys.argv[1], encoding="utf-8"))
    out = build(cfg)
    write_wav(sys.argv[2], out)
    rms = 20 * np.log10(np.sqrt(np.mean(out ** 2)) + 1e-12)
    print(f"✔ {sys.argv[2]}  (RMS {rms:.1f} dB, Peak {20 * np.log10(np.max(np.abs(out))):.1f} dB)")
