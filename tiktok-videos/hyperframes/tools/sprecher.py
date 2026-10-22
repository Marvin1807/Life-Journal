#!/usr/bin/env python3
"""Sprecherstimme für die Gedankenexperiment-Videos (Stil @mentalist_xyz), komplett offline.

Piper-TTS (Stimme „Thorsten“, Deutsch) über sherpa-onnx erzeugt den Sprechtext Satz für Satz.
Daraus entstehen:
  audio/voice.wav   48 kHz mono, Sätze mit Pausen aneinandergehängt
  words.json        jedes Wort mit Start/Ende (für die Ein-Wort-Untertitel), dazu words.js als ES-Modul

Die Wortzeiten werden geschätzt: Pausen im Satz (Kommas, Punkte) werden im Audio gesucht,
innerhalb eines Teilsatzes wird nach der Länge jedes einzeln gesprochenen Wortes verteilt.
Genauigkeit ≈ ±0,1 s – reicht für harte Wortwechsel.

Aufruf:
  python3 tools/sprecher.py videos/<id>/sprecher.json            # erzeugt voice.wav + words.json
  python3 tools/sprecher.py videos/<id>/sprecher.json --pruefen  # zusätzlich Whisper-Rücktranskription

sprecher.json:
  { "start": 0.15, "speed": 1.0, "pause": 0.22,
    "lines": [ { "say": "Was, wenn das Internet tot ist?", "show": "…optional, gleiche Wortzahl…",
                 "pause": 0.5, "speed": 0.95 } ] }
  say   = was gesprochen wird (Zahlen/Fremdwörter so schreiben, wie sie klingen sollen)
  show  = was als Untertitel erscheint (gleiche Anzahl Wörter wie say), sonst = say
  pause = Stille nach dem Satz in Sekunden

Einmalig nötig (Cloud): pip install sherpa-onnx soundfile und die Modelle unter /opt/tts
(siehe .claude/skills/gedankenexperimente/SKILL.md, Abschnitt „Einrichtung“).
"""

import json
import os
import re
import subprocess
import sys

import numpy as np

TTS_DIR = os.environ.get("TTS_DIR", "/opt/tts/vits-piper-de_DE-thorsten-high")
WHISPER_DIR = os.environ.get("WHISPER_DIR", "/opt/tts/sherpa-onnx-whisper-small")
SR_OUT = 48000

_tts = None


def tts():
    global _tts
    if _tts is None:
        import sherpa_onnx
        name = os.path.basename(TTS_DIR).replace("vits-piper-", "")
        cfg = sherpa_onnx.OfflineTtsConfig(model=sherpa_onnx.OfflineTtsModelConfig(
            vits=sherpa_onnx.OfflineTtsVitsModelConfig(
                model=f"{TTS_DIR}/{name}.onnx", tokens=f"{TTS_DIR}/tokens.txt",
                data_dir=f"{TTS_DIR}/espeak-ng-data"),
            num_threads=4))
        _tts = sherpa_onnx.OfflineTts(cfg)
    return _tts


def speak(text, speed):
    a = tts().generate(text, sid=0, speed=speed)
    return np.asarray(a.samples, dtype=np.float32), a.sample_rate


def trim(x, sr, thr=0.012):
    idx = np.where(np.abs(x) > thr)[0]
    if len(idx) == 0:
        return x[:0]
    a, b = max(0, idx[0] - int(0.01 * sr)), min(len(x), idx[-1] + int(0.03 * sr))
    return x[a:b]


def gaps(x, sr, min_gap=0.11, thr=0.012):
    """Stille Abschnitte im Satz (Kommas/Punkte) → Liste (start, ende) in Sekunden."""
    win = int(0.01 * sr)
    n = len(x) // win
    loud = np.array([np.max(np.abs(x[i * win:(i + 1) * win])) for i in range(n)]) > thr
    out, i = [], 0
    while i < n:
        if not loud[i]:
            j = i
            while j < n and not loud[j]:
                j += 1
            if (j - i) * 0.01 >= min_gap and i > 0 and j < n:
                out.append((i * 0.01, j * 0.01))
            i = j
        else:
            i += 1
    return out


def clean(w):
    return re.sub(r"[^\wÄÖÜäöüß%-]", "", w)


def line_words(line, x, sr, speed):
    say = line["say"].split()
    show = line.get("show", line["say"]).split()
    if len(say) != len(show):
        sys.exit(f"Wortzahl say/show ungleich: {line['say']!r} / {line.get('show')!r}")
    total = len(x) / sr
    # Teilsätze an Satzzeichen
    phrases, cur = [], []
    for i, w in enumerate(say):
        cur.append(i)
        if re.search(r"[,.;:?!]$", w) and i < len(say) - 1:
            phrases.append(cur)
            cur = []
    phrases.append(cur)
    g = gaps(x, sr)
    if len(g) >= len(phrases) - 1 and len(phrases) > 1:
        # die längsten Pausen den Satzzeichen zuordnen (zeitlich geordnet)
        g = sorted(sorted(g, key=lambda p: p[1] - p[0], reverse=True)[: len(phrases) - 1])
        bounds = [0.0] + [v for p in g for v in p] + [total]
        spans = [(bounds[2 * k], bounds[2 * k + 1]) for k in range(len(phrases))]
    else:
        spans = [(0.0, total)]
        phrases = [list(range(len(say)))]
    weights = []
    for w in say:
        y, s = speak(clean(w) or w, speed)
        weights.append(max(0.08, len(trim(y, s)) / s))
    out = []
    for (a, b), idxs in zip(spans, phrases):
        ws = np.array([weights[i] for i in idxs])
        edges = a + np.concatenate([[0], np.cumsum(ws)]) / ws.sum() * (b - a)
        for k, i in enumerate(idxs):
            out.append({"w": show[i], "t0": float(edges[k]), "t1": float(edges[k + 1])})
    return out


def resample(x, sr_in, sr_out):
    p = subprocess.run(["ffmpeg", "-loglevel", "error", "-f", "f32le", "-ar", str(sr_in), "-ac", "1", "-i", "-",
                        "-ar", str(sr_out), "-f", "f32le", "-"], input=x.astype(np.float32).tobytes(), capture_output=True)
    return np.frombuffer(p.stdout, dtype=np.float32)


def main():
    cfg_path = sys.argv[1]
    base = os.path.dirname(os.path.abspath(cfg_path))
    cfg = json.load(open(cfg_path, encoding="utf-8"))
    t = cfg.get("start", 0.15)
    parts, words, lines_out = [np.zeros(int(t * SR_OUT), np.float32)], [], []
    for k, line in enumerate(cfg["lines"]):
        speed = line.get("speed", cfg.get("speed", 1.0))
        x, sr = speak(line["say"], speed)
        x = trim(x, sr)
        for w in line_words(line, x, sr, speed):
            words.append({"w": w["w"], "t0": round(t + w["t0"], 3), "t1": round(t + w["t1"], 3), "line": k})
        y = resample(x, sr, SR_OUT)
        dur = len(y) / SR_OUT
        lines_out.append({"line": k, "t0": round(t, 3), "t1": round(t + dur, 3), "text": line.get("show", line["say"])})
        pause = line.get("pause", cfg.get("pause", 0.22))
        parts += [y, np.zeros(int(pause * SR_OUT), np.float32)]
        t += dur + pause
    voice = np.concatenate(parts)
    voice = voice / (np.max(np.abs(voice)) + 1e-9) * 0.89
    os.makedirs(f"{base}/audio", exist_ok=True)
    import soundfile as sf
    sf.write(f"{base}/audio/voice.wav", voice, SR_OUT, subtype="PCM_16")
    data = {"duration": round(len(voice) / SR_OUT, 3), "lines": lines_out, "words": words}
    json.dump(data, open(f"{base}/words.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    # dieselben Daten als ES-Modul, damit scene.js sie ohne fetch() importieren kann
    with open(f"{base}/words.js", "w", encoding="utf-8") as f:
        f.write("// Automatisch erzeugt von tools/sprecher.py – nicht von Hand ändern.\nexport default ")
        json.dump(data, f, ensure_ascii=False)
        f.write(";\n")
    print(f"✔ audio/voice.wav  {len(voice) / SR_OUT:.2f} s, {len(words)} Wörter "
          f"({len(words) / (len(voice) / SR_OUT):.2f} Wörter/s)")
    for l in lines_out:
        print(f"  {l['t0']:6.2f}–{l['t1']:6.2f}  {l['text']}")
    if "--pruefen" in sys.argv:
        import sherpa_onnx
        d = WHISPER_DIR + "/"
        r = sherpa_onnx.OfflineRecognizer.from_whisper(
            encoder=d + "small-encoder.int8.onnx", decoder=d + "small-decoder.int8.onnx",
            tokens=d + "small-tokens.txt", language="de", task="transcribe", num_threads=4)
        a16 = resample(voice, SR_OUT, 16000)
        print("Whisper hört:")
        for l in lines_out:
            s = r.create_stream()
            s.accept_waveform(16000, a16[int(l["t0"] * 16000):int(l["t1"] * 16000) + 1600])
            r.decode_stream(s)
            print(f"  {l['t0']:6.2f}  {s.result.text.strip()}")


if __name__ == "__main__":
    main()
