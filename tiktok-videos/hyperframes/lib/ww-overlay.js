// "Was wäre wenn" – Overlay (Titel, HUD, Untertitel, Schwarzbild, Endkarte).
// Alles ist eine reine Funktion der Zeit t, damit HyperFrames jedes Frame exakt
// rendern kann. Kein Date.now(), kein Math.random().

export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const smooth = (x) => { x = clamp(x); return x * x * (3 - 2 * x); };
export const lerp = (a, b, x) => a + (b - a) * x;

// Zahlen deutsch formatieren: 1234567.891 -> "1.234.567,891"
export function de(x, decimals = 0) {
  const fixed = Math.abs(x).toFixed(decimals);
  let [int, frac] = fixed.split(".");
  int = int.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return (x < 0 ? "−" : "") + int + (frac ? "," + frac : "");
}

// Countdown wie im Original: 0:04,951
export function countdown(seconds) {
  const s = Math.max(0, seconds);
  const m = Math.floor(s / 60);
  const rest = s - m * 60;
  const whole = Math.floor(rest);
  const ms = Math.floor((rest - whole) * 1000 + 1e-6);
  return `${m}:${String(whole).padStart(2, "0")},${String(ms).padStart(3, "0")}`;
}

// Stückweise lineare Kurve: keys = [[t, wert], ...]
export function curve(keys, t) {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    const [t1, v1] = keys[i];
    const [t0, v0] = keys[i - 1];
    if (t <= t1) return lerp(v0, v1, (t - t0) / (t1 - t0));
  }
  return keys[keys.length - 1][1];
}

function fadeWindow(t, start, end, fadeIn = 0.4, fadeOut = 0.4) {
  if (t < start || t >= end) return 0;
  return Math.min(smooth((t - start) / fadeIn), smooth((end - t) / fadeOut));
}

function escapeHtml(s) {
  return s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
}

function titleHtml(text, accent, color) {
  const safe = escapeHtml(text);
  if (!accent) return safe;
  return safe.replace(escapeHtml(accent), `<span style="color:${color}">${escapeHtml(accent)}</span>`);
}

// Deterministisches Filmkorn als Hintergrundbild.
function grainDataUrl(size = 256, seed = 7) {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const g = c.getContext("2d");
  const img = g.createImageData(size, size);
  let s = seed >>> 0;
  for (let i = 0; i < size * size; i++) {
    s = (s * 1664525 + 1013904223) >>> 0;
    const v = s >>> 24;
    img.data[i * 4] = img.data[i * 4 + 1] = img.data[i * 4 + 2] = v;
    img.data[i * 4 + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  return c.toDataURL();
}

/**
 * config = {
 *   title:     { text, accent, accentColor, start, end },
 *   hud:       [{ start, end, label, value: (t) => string, sub: string | (t) => string }],
 *   subtitles: [{ start, end, text }],
 *   black:     { start, end },
 *   endcard:   { start, end, lines: [string, string] }   // nutzt title.text / accent
 * }
 */
export function createOverlay(root, config) {
  const el = (cls, parent = root) => {
    const d = document.createElement("div");
    d.className = cls;
    parent.appendChild(d);
    return d;
  };

  const vignette = el("ww-vignette");
  const grain = el("ww-grain");
  grain.style.backgroundImage = `url(${grainDataUrl()})`;

  const title = el("ww-title");
  title.innerHTML = titleHtml(config.title.text, config.title.accent, config.title.accentColor);

  const hud = el("ww-hud");
  const hudLabel = el("ww-hud-label", hud);
  const hudValue = el("ww-hud-value", hud);
  const hudSub = el("ww-hud-sub", hud);

  const sub = el("ww-sub");
  const black = el("ww-black");
  const end = el("ww-end");
  const endTitle = el("ww-end-title", end);
  endTitle.innerHTML = titleHtml(config.title.text, config.title.accent, config.title.accentColor);
  const endLines = el("ww-end-lines", end);
  endLines.innerHTML = config.endcard.lines.map((l) => `<div>${escapeHtml(l)}</div>`).join("");

  let lastSubText = null;

  function update(t) {
    // Titel
    title.style.opacity = fadeWindow(t, config.title.start, config.title.end, 0.35, 0.6);

    // HUD: aktive Phase suchen
    const phase = config.hud.find((p) => t >= p.start && t < p.end);
    if (phase) {
      hud.style.opacity = fadeWindow(t, phase.start, phase.end, phase.fadeIn ?? 0.12, phase.fadeOut ?? 0.12);
      hudLabel.textContent = phase.label;
      hudValue.textContent = phase.value(t);
      hudSub.textContent = typeof phase.sub === "function" ? phase.sub(t) : (phase.sub || "");
    } else {
      hud.style.opacity = 0;
    }

    // Untertitel
    const s = config.subtitles.find((x) => t >= x.start && t < x.end);
    if (s) {
      if (s.text !== lastSubText) { sub.textContent = s.text; lastSubText = s.text; }
      sub.style.opacity = fadeWindow(t, s.start, s.end, s.fadeIn ?? 0.45, s.fadeOut ?? 0.45);
    } else {
      sub.style.opacity = 0;
    }

    // Schwarzbild + Endkarte
    const bl = config.black;
    black.style.opacity = t >= bl.start && t < config.endcard.start ? smooth((t - bl.start) / 0.25) : 0;
    end.style.opacity = t >= config.endcard.start ? smooth((t - config.endcard.start) / 0.5) : 0;
    const inScene = t < bl.start;
    vignette.style.opacity = inScene ? 1 : 0;
    grain.style.opacity = inScene ? 0.07 : 0.04;
  }

  return { update };
}
