#!/usr/bin/env python3
"""Deutsche Sprecherstimme offline (Piper, Stimme "thorsten") + Wort-Timings für Wort-für-Wort-Untertitel.

    python3 tools/voice.py videos/<id>/audio/voice.json

voice.json:
{
  "start": 0.25,            # erste Zeile beginnt hier (s)
  "gap": 0.18,              # Pause zwischen Zeilen (s), pro Zeile mit "pause" überschreibbar
  "length_scale": 0.9,      # < 1 = schneller
  "lines": [ { "id": "hook", "text": "Du startest {2008|zweitausendacht} mit einem Lotus." }, ... ]
}

{Anzeige|Aussprache}: links steht im Bild, rechts wird gesprochen.
Ausgabe neben voice.json: voice.wav (48 kHz mono) und words.json
  { "duration": s, "lines": [{ id, start, end }], "words": [{ w, start, end, line }] }

Piper liefert keine Wortzeiten. Innerhalb einer Zeile werden die Wörter anhand der Sprechsilben
verteilt und an die Sprechpausen (Stille in der WAV) angelehnt.

Stimme: tools/voices/thorsten-low/de-thorsten-low.onnx
(https://github.com/rhasspy/piper/releases/download/v0.0.2/voice-de-thorsten-low.tar.gz).
"""
import json, re, subprocess, sys, tempfile, wave
from pathlib import Path

import numpy as np

HERE = Path(__file__).resolve().parent
MODEL = HERE / "voices/thorsten-low/de-thorsten-low.onnx"
SR = 48000
TOKEN = re.compile(r"\{([^|}]*)\|([^}]*)\}|(\S+)")
VOWELS = re.compile(r"[aeiouäöüy]+", re.I)


def parse(text):
    """-> [(anzeige, aussprache)] pro Anzeige-Wort; gesprochener Satz."""
    out = []
    for m in TOKEN.finditer(text):
        if m.group(3) is not None:
            out.append((m.group(3), m.group(3)))
        else:
            shows = m.group(1).split()
            say = m.group(2)
            # Mehrere Anzeige-Wörter teilen sich die Aussprache gleichmäßig
            for i, s in enumerate(shows):
                out.append((s, say if i == 0 else ""))
    spoken = " ".join(s for _, s in out if s)
    return out, spoken


def syllables(word):
    w = re.sub(r"[^a-zäöüß]", "", word.lower())
    return max(1, len(VOWELS.findall(w))) if w else 0


def synth(text, length_scale):
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as f:
        path = f.name
    subprocess.run([sys.executable, "-m", "piper", "-m", str(MODEL), "-f", path,
                    "--length-scale", str(length_scale), "--sentence-silence", "0.12"],
                   input=text.encode(), check=True, capture_output=True)
    with wave.open(path) as w:
        sr = w.getframerate()
        x = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32) / 32768
    # auf 48 kHz
    t_new = np.arange(int(len(x) * SR / sr)) / SR
    x = np.interp(t_new, np.arange(len(x)) / sr, x)
    # Stille vorne/hinten abschneiden
    env = np.convolve(np.abs(x), np.ones(480) / 480, mode="same")
    idx = np.where(env > 0.01)[0]
    if len(idx):
        x = x[max(0, idx[0] - 240): idx[-1] + 960]
    return x


def word_times(x, tokens):
    """Verteilt die Wörter über die Sprechabschnitte der Zeile."""
    env = np.convolve(np.abs(x), np.ones(960) / 960, mode="same")
    voiced = env > 0.012
    # Pausen >= 90 ms finden -> Abschnitte
    segs, start, quiet = [], None, 0
    for i in range(0, len(x), 240):
        v = voiced[i]
        if v and start is None:
            start = i
        if not v and start is not None:
            quiet += 240
            if quiet >= int(0.09 * SR):
                segs.append((start, i - quiet)); start, quiet = None, 0
        elif v:
            quiet = 0
    if start is not None:
        segs.append((start, len(x)))
    total = sum(b - a for a, b in segs) or len(x)
    if not segs:
        segs = [(0, len(x))]
    w = np.array([max(0.6, sum(syllables(p) for p in say.split())) if say else 0.6 for _, say in tokens], float)
    cum = np.concatenate([[0], np.cumsum(w)]) / w.sum() * total

    def at(v):  # gesprochene Zeit -> Position in der Zeile
        for a, b in segs:
            if v <= b - a:
                return a + v
            v -= b - a
        return segs[-1][1]

    return [(at(cum[i]) / SR, at(cum[i + 1]) / SR) for i in range(len(tokens))]


def main():
    cfg_path = Path(sys.argv[1])
    cfg = json.loads(cfg_path.read_text())
    ls = cfg.get("length_scale", 0.9)
    t = cfg.get("start", 0.25)
    pieces, lines, words = [], [], []
    for line in cfg["lines"]:
        if "at" in line:
            t = max(t, line["at"])
        tokens, spoken = parse(line["text"])
        x = synth(spoken, line.get("length_scale", ls))
        times = word_times(x, tokens)
        pieces.append((t, x))
        lines.append({"id": line["id"], "start": round(t, 3), "end": round(t + len(x) / SR, 3)})
        for (show, _), (a, b) in zip(tokens, times):
            words.append({"w": show, "start": round(t + a, 3), "end": round(t + b, 3), "line": line["id"]})
        print(f"{line['id']:>10}  {t:6.2f}–{t + len(x) / SR:6.2f}  {spoken}")
        t += len(x) / SR + line.get("pause", cfg.get("gap", 0.18))
    dur = cfg.get("duration", t + 0.5)
    out = np.zeros(int(dur * SR) + SR, np.float32)
    for t0, x in pieces:
        i = int(t0 * SR)
        out[i:i + len(x)] += x[: max(0, len(out) - i)]
    out = out[: int(dur * SR)]
    peak = np.abs(out).max() or 1
    out = out / peak * 0.89
    with wave.open(str(cfg_path.with_name("voice.wav")), "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((out * 32767).astype(np.int16).tobytes())
    cfg_path.with_name("words.json").write_text(json.dumps(
        {"duration": round(dur, 3), "speech_end": round(t, 3), "lines": lines, "words": words}, ensure_ascii=False, indent=1))
    print(f"Sprache endet bei {t:.2f} s, {len(words)} Wörter")


if __name__ == "__main__":
    main()
