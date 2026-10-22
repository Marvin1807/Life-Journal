#!/usr/bin/env python3
"""Erzeugt audio/sound.json aus words.json (Zeiten hängen an der Sprecherspur).
   python3 audio/ton.py && python3 ../../tools/sounddesign.py audio/sound.json audio/sound.wav"""
import json, os
B = os.path.dirname(os.path.abspath(__file__))
V = json.load(open(f"{B}/../words.json", encoding="utf-8"))
L = lambda i: V["lines"][i]["t0"]
LE = lambda i: V["lines"][i]["t1"]
def find(i, s):
    for w in V["words"]:
        if w["line"] == i and w["w"].lower().startswith(s.lower()):
            return w["t0"]
    return L(i)
DUR = 83
END = LE(len(V["lines"]) - 1) + 0.25
cuts = [L(i) - 0.05 for i in (1, 2, 3, 4, 5, 7, 9, 11, 12, 13, 14, 15, 16, 17, 19, 22, 24, 25)]
MUSIC_OUT = L(22)            # wie Referenz B: im letzten Teil fällt die Musik weg
c = []
# 1 · Sprecher (Musik/Atmo werden darunter um ~45 % leiser)
c.append({"type": "voice", "file": "voice.wav", "at": 0, "gain": 1.0, "duck": 0.45})
# 2 · Musikbett: dunkles Moll-Pad + Drone + Sub, durchgehend bis MUSIC_OUT
c += [{"type": "pad", "at": 0, "dur": MUSIC_OUT + 1.5, "freqs": [110, 130.81, 164.81], "gain": 0.16, "seed": 3, "fadeIn": 0.3, "fadeOut": 1.5, "verb": 0.4},
      {"type": "drone", "at": 0, "dur": MUSIC_OUT + 1.5, "freqs": [55, 82.4], "gain": 0.14, "seed": 4, "fadeIn": 0.2, "fadeOut": 1.5},
      {"type": "pad", "at": L(11), "dur": MUSIC_OUT - L(11) + 1.5, "freqs": [220, 261.63, 329.63, 493.88], "gain": 0.07, "seed": 5, "fadeIn": 3, "fadeOut": 1.5, "verb": 0.6},
      {"type": "sub", "at": L(9), "dur": MUSIC_OUT - L(9) + 1, "freq": 44, "gain": 0.16, "from": 0.4, "to": 1.0, "fadeIn": 2, "fadeOut": 1}]
# 3 · Schnitte: Whoosh
c += [{"type": "whoosh", "at": t, "dur": 0.7, "gain": 0.22, "verb": 0.3, "seed": 20 + k} for k, t in enumerate(cuts)]
# 4 · Effekte zum Bild
tot = find(0, "tot")
c += [{"type": "beep", "at": 0.35 + k * 0.62, "freq": 980, "dur": 0.09, "gain": 0.06} for k in range(int((tot - 0.35) / 0.62) + 1)]
c += [{"type": "beep", "at": tot + 0.1, "freq": 980, "dur": 2.0, "gain": 0.07}]
c += [{"type": "chime", "at": find(1, "echten"), "freq": 523.25, "dur": 2.5, "gain": 0.12, "verb": 0.6}]
c += [{"type": "beep", "at": find(3, "Theorie") + k * 0.09, "freq": 2400 + (k % 3) * 300, "dur": 0.03, "gain": 0.04} for k in range(18)]
c += [{"type": "impact", "at": find(3, "2021"), "gain": 0.18, "low": 60, "verb": 0.4, "seed": 7}]
c += [{"type": "powerdown", "at": L(4) + 0.1, "dur": 1.4, "gain": 0.14}]
c += [{"type": "static", "at": find(6, "Bots") - 0.5, "dur": 1.2, "gain": 0.1, "seed": 8}]
c += [{"type": "ding", "at": find(7, w), "gain": 0.07, "pan": p} for w, p in (("posten", -0.4), ("liken", 0.4), ("kommentieren", -0.3), ("antworten", 0.3))]
c += [{"type": "ticks", "at": L(8) - 0.2, "dur": 1.2, "interval": [0.09, 0.04], "gain": 0.16, "seed": 9}]
c += [{"type": "flutter", "at": find(10, "Dann"), "dur": 1.0, "gain": 0.12, "seed": 10}]
c += [{"type": "riser", "at": find(11, "mehr"), "dur": 2.4, "gain": 0.12, "seed": 11}]
c += [{"type": "impact", "at": L(12), "gain": 0.16, "low": 48, "verb": 0.5, "seed": 12}]
c += [{"type": "static", "at": find(13, "37"), "dur": 0.8, "gain": 0.1, "seed": 13}, {"type": "ice_crack", "at": find(13, "Schaden"), "gain": 0.12, "seed": 14}]
c += [{"type": "shimmer", "at": find(14, "Texte"), "dur": 2.0, "gain": 0.08, "seed": 15, "verb": 0.5}]
c += [{"type": "splat", "at": find(15, "Schätzung"), "gain": 0.16, "seed": 16}]
c += [{"type": "static", "at": find(16, "90") - 0.3, "dur": 1.6, "gain": 0.09, "seed": 17}]
c += [{"type": "riser", "at": L(18), "dur": 2.0, "gain": 0.12, "seed": 18},
      {"type": "impact", "at": find(18, "jetzt"), "gain": 0.3, "low": 40, "verb": 0.6, "seed": 19},
      {"type": "tinnitus", "at": find(18, "jetzt") + 0.05, "dur": 2.2, "gain": 0.015}]
c += [{"type": "beep", "at": find(21, "gleich") + k * 0.12, "freq": 1600, "dur": 0.05, "gain": 0.05} for k in range(5)]
# Schlussteil ohne Musik: nur Sub-Herzschlag + Stimme, dann Chip-Glocke und Schnitt
c += [{"type": "heartbeat", "at": MUSIC_OUT, "dur": END - MUSIC_OUT, "bpm": 62, "gain": 0.2, "seed": 21},
      {"type": "creak", "at": L(24) + 0.2, "dur": 2.4, "gain": 0.05, "seed": 22},
      {"type": "chime", "at": find(26, "keinem"), "freq": 392.0, "dur": 3.0, "gain": 0.14, "verb": 0.7},
      {"type": "shimmer", "at": find(26, "keinem"), "dur": 1.8, "gain": 0.07, "seed": 23, "verb": 0.5},
      {"type": "silence", "at": END, "dur": DUR - END}]
json.dump({"duration": DUR, "cues": c}, open(f"{B}/sound.json", "w"), indent=1)
print(f"{len(c)} Cues, Ende {END:.2f}")
