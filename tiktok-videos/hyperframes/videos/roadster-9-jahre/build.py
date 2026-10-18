#!/usr/bin/env python3
"""Roadster-Video: Zeitachse + Ton aus der Sprecherspur bauen.

    python3 tools/voice.py videos/roadster-9-jahre/audio/voice.json   # Stimme + words.json
    python3 videos/roadster-9-jahre/build.py                          # timeline.js, sound.json, sound.wav

timeline.js  – Schnitte, Ereignisse und Wörter für scene.js (gleiche Zeiten wie der Ton)
audio/sound.json → audio/sfx.wav (tools/sounddesign.py), dann Stimme + Effekte → audio/sound.wav
"""
import json, subprocess, sys, wave
from pathlib import Path

import numpy as np

HERE = Path(__file__).resolve().parent
TOOLS = HERE.parent.parent / "tools"
W = json.loads((HERE / "audio/words.json").read_text())
L = {l["id"]: l for l in W["lines"]}


def word(line, text, n=1, key="start"):
    hits = [w for w in W["words"] if w["line"] == line and w["w"].rstrip(".,:!?") == text.rstrip(".,:!?")]
    return hits[n - 1][key]


S = lambda i: L[i]["start"]
BLACK = round(W["speech_end"] + 0.7, 2)
ENDCARD = round(BLACK + 0.35, 2)
DURATION = round(ENDCARD + 3.4, 1)

shots = [
    ("hook", 0), ("promise", S("promise")), ("build", S("build")), ("lotus", S("lotus")), ("boom", S("boom")),
    ("space", S("space")), ("orbit", S("orbit")), ("new", S("new")), ("specs", S("accel")), ("battery", S("battery")),
    ("cost", S("cost")), ("broke", S("broke")), ("price", S("price")), ("ice", S("ice")), ("models", S("models")),
    ("dessert", S("dessert")), ("chips", S("chips")), ("years", S("years")), ("rockets", S("rockets")), ("fly", S("fly")),
    ("fans", S("fans")), ("stick", S("stick")), ("delay", S("delay")), ("reveal", S("reveal")), ("flip", S("flip")),
    ("rocket", S("rocket")), ("buy", S("buy")), ("look", S("look")), ("black", BLACK),
]

ev = {
    "yearFlip": word("promise", "neun"),
    "lotusIn": S("lotus"),
    "engineOut": word("gutted", "Motor"), "tankOut": word("gutted", "Tank"),
    "cells0": S("cells"), "cells1": L["cells"]["end"],
    "boom": word("boom", "bumm:"), "roadsterName": word("boom", "Roadster."),
    "launch": word("space", "Rakete") - 0.35,
    "truck": S("new") + 0.2,
    "accel": S("accel"), "range": S("range"), "ready": S("ready"), "easy": S("easy"),
    "double": word("battery", "doppelt"),
    "money": S("cost") + 0.1,
    "broke": S("broke"), "weeks": S("weeks"), "price": S("price"),
    "ice": word("ice", "Eis."),
    "m3": word("models", "Model", 1), "my": word("models", "Model", 2), "ct": word("models", "Cybertruck."),
    "dessert": word("dessert", "Nachtisch.") - 0.3,
    "chip": word("chips", "Chipkrise."),
    "y21": word("years", "2021."), "y22": word("years", "2022."), "y23": word("years", "2023."),
    "nozzles": word("rockets", "Düsen"), "gas": word("rockets", "Kaltgas"),
    "lift": word("fly", "abheben.") - 0.4,
    "fans": S("fans") + 0.2,
    "loop0": S("stick"), "loopTop": word("stick", "kopfüber"),
    "stamp": word("delay", "verschoben."), "rain": word("delay", "Wetters.") - 0.3,
    "rise": S("reveal") + 0.2,
    "jump": word("flip", "springt,"), "kick": word("flip", "Kickflip"), "flyUp": word("flip", "fliegt."),
    "dash": S("rocket") + 0.2,
    "unknown": S("buy"), "y2028": word("2028", "2028."),
    "pull": S("look"),
}
ev = {k: round(v, 3) for k, v in ev.items()}

timeline = {
    "duration": DURATION, "black": BLACK, "endcard": ENDCARD,
    "shots": [{"name": n, "t": round(t, 3)} for n, t in shots],
    "ev": ev,
    "words": [{"w": w["w"], "t": w["start"], "e": w["end"]} for w in W["words"]],
    "lines": [{"id": l["id"], "t": l["start"], "e": l["end"]} for l in W["lines"]],
}
(HERE / "timeline.js").write_text(
    "// Erzeugt von build.py aus audio/words.json – nicht von Hand ändern.\n"
    f"export const TL = {json.dumps(timeline, ensure_ascii=False)};\n")

# ------------------------------------------------------------------ Ton ---
cues = []
add = lambda **c: cues.append(c)
shot_t = [t for _, t in shots]

# Musikbett: ruhige Dur-Akkorde in 4-Takt-Schleifen (A-Dur, 96 bpm), unter der Stimme
CH = [[220.0, 277.18, 329.63], [185.0, 220.0, 277.18], [146.83, 185.0, 220.0], [164.81, 207.65, 246.94]]
bar = 60 / 96 * 4
t, i = 0.0, 0
while t < BLACK - 0.5:
    d = min(bar, BLACK - t)
    add(type="pad", at=round(t, 3), dur=round(d + 0.4, 3), freqs=CH[i % 4], gain=0.16, verb=0.35, fadeIn=0.3, fadeOut=0.5, lp=2600, seed=i)
    add(type="sub", at=round(t, 3), dur=round(d, 3), freq=CH[i % 4][0] / 4, gain=0.14, fadeIn=0.2, fadeOut=0.3)
    t += bar; i += 1
# leise Hi-Hat-Ticks auf den Achteln (Ton „Bastelvideo“)
add(type="ticks", at=0, dur=BLACK - 0.6, interval=[60 / 96 / 2, 60 / 96 / 2], gain=0.05, hp=5000)

# Whoosh bei jedem Schnitt
for n, st in shots[1:-1]:
    add(type="whoosh", at=round(max(0, st - 0.22), 3), gain=0.28, verb=0.3, seed=int(st * 7))

# Ereignisse
E = ev
add(type="impact", at=0.05, gain=0.25, verb=0.4, low=55)
add(type="beep", at=E["yearFlip"], freq=880, dur=0.12, gain=0.12)
add(type="car", at=E["lotusIn"], dur=1.6, gain=0.25, fadeOut=0.5)
add(type="rattle", at=E["engineOut"], dur=0.4, gain=0.35, seed=3)
add(type="rattle", at=E["tankOut"], dur=0.4, gain=0.3, seed=4)
for k in range(8):
    add(type="beep", at=round(E["cells0"] + k * (E["cells1"] - E["cells0"]) / 8, 3), freq=1400 + k * 120, dur=0.06, gain=0.06)
add(type="impact", at=E["boom"], gain=0.45, verb=0.5, low=48)
add(type="shimmer", at=E["roadsterName"], dur=1.4, gain=0.18)
add(type="riser", at=E["launch"] - 1.2, dur=1.2, gain=0.2)
add(type="impact", at=E["launch"], gain=0.5, verb=0.6, low=40, d=4.0)
add(type="wind", at=E["launch"], dur=S("orbit") - E["launch"], gain=0.4, fadeOut=0.4)
add(type="shimmer", at=S("orbit"), dur=1.6, gain=0.15)
add(type="creak", at=E["truck"], dur=0.8, gain=0.2)
add(type="car", at=E["truck"] + 0.3, dur=1.5, gain=0.22, fadeOut=0.5)
for k in ("accel", "range", "ready"):
    add(type="ding", at=E[k], gain=0.12)
add(type="chime", at=E["double"], freq=523.25, gain=0.15)
add(type="flutter", at=E["money"], dur=1.1, gain=0.35)
add(type="drop", at=E["broke"], dur=1.2, gain=0.2)
add(type="beep", at=E["price"], freq=2600, dur=0.1, gain=0.1)
add(type="ice_crack", at=E["ice"], gain=0.4)
for k in ("m3", "my", "ct"):
    add(type="car", at=E[k], dur=1.2, gain=0.18, fadeOut=0.4)
add(type="splat", at=E["dessert"] + 0.35, gain=0.35)
add(type="powerdown", at=E["chip"], dur=1.2, gain=0.2)
for k in ("y21", "y22", "y23"):
    add(type="beep", at=E[k], freq=620, dur=0.18, gain=0.13)
add(type="whoosh", at=E["gas"], d=0.6, gain=0.3, hp=1500)
add(type="whoosh", at=E["gas"] + 0.7, d=0.6, gain=0.3, hp=1500, seed=5)
add(type="riser", at=E["lift"] - 0.6, dur=1.6, gain=0.18)
add(type="wind", at=E["fans"], dur=S("stick") - E["fans"], gain=0.25, hp=800)
add(type="car", at=E["loop0"], dur=1.5, gain=0.2, fadeOut=0.4)
add(type="impact", at=E["loopTop"], gain=0.25, low=60)
add(type="splat", at=E["stamp"], gain=0.3)
add(type="ambience", preset="storm", at=E["rain"], dur=S("reveal") - E["rain"], gain=0.35, fadeIn=0.2, fadeOut=0.2)
add(type="riser", at=S("reveal") - 0.1, dur=2.0, gain=0.22)
add(type="whoosh", at=E["jump"], gain=0.35)
add(type="whoosh", at=E["kick"], gain=0.4, seed=8)
add(type="impact", at=E["flyUp"], gain=0.35, low=50)
add(type="wind", at=E["flyUp"], dur=S("rocket") - E["flyUp"], gain=0.3)
add(type="impact", at=E["dash"], gain=0.45, low=45)
add(type="whoosh", at=E["dash"] + 0.1, d=1.2, gain=0.4)
add(type="chime", at=E["y2028"], freq=392.0, gain=0.14)
add(type="chord", at=S("look"), dur=BLACK - S("look"), freqs=[220.0, 277.18, 329.63, 440.0], gain=0.2, verb=0.5, fadeOut=0.6)
add(type="silence", at=BLACK, dur=DURATION - BLACK)
add(type="bell", at=ENDCARD + 0.2, dur=2.5, freqs=[440.0, 659.25], gain=0.08, verb=0.5)

for c in cues:
    for k in ("at", "dur", "d"):
        if k in c:
            c[k] = round(float(c[k]), 3)
(HERE / "audio/sound.json").write_text(json.dumps({"duration": DURATION, "cues": cues}, indent=1))
subprocess.run([sys.executable, str(TOOLS / "sounddesign.py"), str(HERE / "audio/sound.json"), str(HERE / "audio/sfx.wav")], check=True)


def read(p):
    with wave.open(str(p)) as w:
        ch, sr = w.getnchannels(), w.getframerate()
        x = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32) / 32768
    x = x.reshape(-1, ch)
    if ch == 1:
        x = np.repeat(x, 2, axis=1)
    assert sr == 48000, sr
    return x


sfx, voice = read(HERE / "audio/sfx.wav"), read(HERE / "audio/voice.wav")
n = int(DURATION * 48000)
pad = lambda x: np.pad(x, ((0, max(0, n - len(x))), (0, 0)))[:n]
sfx, voice = pad(sfx), pad(voice)
# Ducking: Effekte/Musik leiser, solange gesprochen wird
envv = np.convolve(np.abs(voice[:, 0]), np.ones(4800) / 4800, mode="same")
duck = np.where(envv > 0.01, 0.42, 1.0)
duck = np.convolve(duck, np.ones(9600) / 9600, mode="same")[:, None]
mix = voice * 1.0 + sfx * 0.55 * duck
mix = np.tanh(mix * 1.15) / np.tanh(1.15)
rms = np.sqrt(np.mean(mix[: int(BLACK * 48000)] ** 2))
mix *= 10 ** (-16 / 20) / rms
mix = np.clip(mix, -0.98, 0.98)
with wave.open(str(HERE / "audio/sound.wav"), "wb") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(48000)
    w.writeframes((mix * 32767).astype(np.int16).tobytes())
print(f"timeline.js + sound.wav: {DURATION} s, Schwarz {BLACK}, Endkarte {ENDCARD}, Peak {np.abs(mix).max():.2f}")
