// Flacher 2D-Vektorlook für die Gedankenexperiment-Videos (Stil @mentalist_xyz), Canvas 2D, 1080×1920.
// Alles ist eine reine Funktion der Zeit t: kein Math.random(), kein Date.now().
// Bausteine: Hintergrund mit Spotlight, Vignette, Korn, Figuren (Mensch ↔ Roboter), Köpfe im Profil,
// Handy, Hand, Sprechblasen, Herz, Uhr, Donut, Ein-Wort-Untertitel, Schnitt-Helfer.

export const W = 1080, H = 1920;
export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const smooth = (x) => { x = clamp(x); return x * x * (3 - 2 * x); };
export const lerp = (a, b, x) => a + (b - a) * x;
export const easeOut = (x) => 1 - Math.pow(1 - clamp(x), 3);
export const easeIn = (x) => Math.pow(clamp(x), 3);
export const backOut = (x) => { x = clamp(x); const c = 1.9; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };
// 0→1 ab Zeitpunkt a über d Sekunden
export const ramp = (t, a, d = 0.4, f = smooth) => f((t - a) / d);

// Deterministischer Zufall (mulberry32)
export function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let r = Math.imul(s ^ (s >>> 15), 1 | s);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

// Farbe mischen: mix("#ff0000", "#0000ff", 0.5)
export function mix(a, b, x) {
  const p = (c) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
  const A = p(a), B = p(b);
  return "#" + A.map((v, i) => Math.round(lerp(v, B[i], clamp(x))).toString(16).padStart(2, "0")).join("");
}

// ------------------------------------------------------------- Grundformen ---
export function rr(g, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}
export function fillRR(g, x, y, w, h, r, color) { rr(g, x, y, w, h, r); g.fillStyle = color; g.fill(); }
export function circle(g, x, y, r, color) { g.beginPath(); g.arc(x, y, Math.max(0, r), 0, Math.PI * 2); g.fillStyle = color; g.fill(); }
export function ring(g, x, y, r, w, color, a0 = -Math.PI / 2, a1 = a0 + Math.PI * 2) {
  g.beginPath(); g.arc(x, y, r, a0, a1); g.strokeStyle = color; g.lineWidth = w; g.lineCap = "round"; g.stroke();
}
export function line(g, pts, color, w = 6, cap = "round") {
  g.beginPath(); g.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]);
  g.strokeStyle = color; g.lineWidth = w; g.lineCap = cap; g.lineJoin = "round"; g.stroke();
}
export function glow(g, x, y, r, color, a = 1) {
  const gr = g.createRadialGradient(x, y, 0, x, y, r);
  gr.addColorStop(0, color); gr.addColorStop(1, "rgba(0,0,0,0)");
  g.save(); g.globalAlpha *= a; g.globalCompositeOperation = "lighter"; g.fillStyle = gr;
  g.fillRect(x - r, y - r, r * 2, r * 2); g.restore();
}
export function text(g, s, x, y, { size = 40, color = "#fff", weight = 800, align = "center", font = "Cap", alpha = 1, base = "middle", spacing = 0 } = {}) {
  g.save(); g.globalAlpha *= alpha;
  g.font = `${weight} ${size}px ${font}`; g.textAlign = align; g.textBaseline = base; g.fillStyle = color;
  if (spacing) g.letterSpacing = `${spacing}px`;
  g.fillText(s, x, y); g.restore();
}
export function heart(g, x, y, s, color) {
  g.save(); g.translate(x, y); g.scale(s / 100, s / 100);
  g.beginPath(); g.moveTo(0, 30);
  g.bezierCurveTo(-60, -10, -40, -60, 0, -30);
  g.bezierCurveTo(40, -60, 60, -10, 0, 30);
  g.fillStyle = color; g.fill(); g.restore();
}
export function star(g, x, y, r, color, n = 5) {
  g.beginPath();
  for (let i = 0; i < n * 2; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / n, rr2 = i % 2 ? r * 0.45 : r;
    g.lineTo(x + Math.cos(a) * rr2, y + Math.sin(a) * rr2);
  }
  g.closePath(); g.fillStyle = color; g.fill();
}

// --------------------------------------------------------------- Hintergrund ---
// Spotlight-Hintergrund wie in den Referenzen: heller Kreis in der Mitte, Ränder fast schwarz.
export function spotlight(g, inner, outer, { x = W / 2, y = H * 0.47, r = 900 } = {}) {
  g.fillStyle = outer; g.fillRect(0, 0, W, H);
  const gr = g.createRadialGradient(x, y, 0, x, y, r);
  gr.addColorStop(0, inner); gr.addColorStop(0.55, mix(inner, outer, 0.45)); gr.addColorStop(1, outer);
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
}
export function linear(g, top, bottom) {
  const gr = g.createLinearGradient(0, 0, 0, H);
  gr.addColorStop(0, top); gr.addColorStop(1, bottom);
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
}
// Sterne/Staub, langsam driftend
export function dust(g, t, seed, n = 60, color = "#ffffff", alpha = 0.5) {
  const r = rng(seed);
  for (let i = 0; i < n; i++) {
    const x = (r() * W + t * (6 + r() * 14)) % W, y = (r() * H - t * (4 + r() * 10) + H * 10) % H;
    const tw = 0.5 + 0.5 * Math.sin(t * (1 + r() * 2) + r() * 6);
    circle(g, x, y, 1.5 + r() * 2.5, color);
    g.globalAlpha = 1;
    glow(g, x, y, 10, color, alpha * tw * 0.4);
  }
}

let grainCanvas = null;
function makeGrain() {
  const c = document.createElement("canvas");
  c.width = 512; c.height = 512;
  const gg = c.getContext("2d"), img = gg.createImageData(512, 512), r = rng(11);
  for (let i = 0; i < 512 * 512; i++) {
    const v = Math.floor(r() * 255);
    img.data[i * 4] = img.data[i * 4 + 1] = img.data[i * 4 + 2] = v; img.data[i * 4 + 3] = 255;
  }
  gg.putImageData(img, 0, 0);
  return c;
}
// Vignette + Filmkorn + feine vertikale Scanlines (Referenz B)
export function finish(g, t, { vignette = 0.62, grain = 0.06 } = {}) {
  const gr = g.createRadialGradient(W / 2, H * 0.47, H * 0.18, W / 2, H * 0.5, H * 0.72);
  gr.addColorStop(0, "rgba(0,0,0,0)"); gr.addColorStop(1, `rgba(0,0,0,${vignette})`);
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
  if (!grainCanvas) grainCanvas = makeGrain();
  const f = Math.floor(t * 30), ox = (f * 197) % 512, oy = (f * 331) % 512;
  g.save(); g.globalAlpha = grain; g.globalCompositeOperation = "overlay";
  for (let x = -ox; x < W; x += 512) for (let y = -oy; y < H; y += 512) g.drawImage(grainCanvas, x, y);
  g.globalAlpha = grain * 0.5;
  g.fillStyle = "#000";
  for (let x = 0; x < W; x += 6) g.fillRect(x, 0, 2, H);
  g.restore();
}

// ------------------------------------------------------------------ Figuren ---
// Flache Figur wie in den Referenzen (rundlicher Körper, Kopf mit Punktaugen, kein Mund).
// robot 0..1 blendet in einen Roboter um (Metallkopf, Antenne, Leuchtaugen).
export function person(g, x, y, s, o = {}) {
  const { shirt = "#2bb5a0", pants = "#283a7a", skin = "#e9b48a", hair = "#3a2418", robot = 0, eye = "#7df9ff",
    armL = 0, armR = 0, look = 0, hairStyle = 0, alpha = 1, phone = false, tilt = 0 } = o;
  g.save(); g.translate(x, y); g.scale(s, s); g.rotate(tilt); g.globalAlpha *= alpha;
  // Schatten
  g.save(); g.globalAlpha *= 0.35; g.beginPath(); g.ellipse(0, 0, 70, 14, 0, 0, Math.PI * 2); g.fillStyle = "#000"; g.fill(); g.restore();
  const metal = "#9aa6c4", metalD = "#5d6886";
  // Beine
  fillRR(g, -34, -170, 30, 170, 14, mix(pants, metalD, robot));
  fillRR(g, 4, -170, 30, 170, 14, mix(pants, metalD, robot));
  fillRR(g, -40, -12, 40, 14, 7, "#1b1530"); fillRR(g, 2, -12, 40, 14, 7, "#1b1530");
  // Körper
  fillRR(g, -48, -330, 96, 180, 34, mix(shirt, metal, robot));
  // Arme
  const arm = (side, raise) => {
    g.save(); g.translate(side * 50, -310); g.rotate(side * (0.12 + raise * 2.2));
    fillRR(g, -13, 0, 26, 140, 13, mix(shirt, metal, robot));
    circle(g, 0, 146, 15, mix(skin, metalD, robot));
    g.restore();
  };
  arm(-1, armL); arm(1, armR);
  if (phone) { fillRR(g, -26, -232, 34, 56, 6, "#15122a"); fillRR(g, -22, -228, 26, 48, 4, "#7df9ff"); }
  // Hals + Kopf
  fillRR(g, -14, -352, 28, 30, 8, mix(skin, metalD, robot));
  const hy = -410;
  if (robot < 1) {
    g.save(); g.globalAlpha *= 1 - smooth((robot - 0.35) / 0.3);
    // lange Haare liegen hinter dem Kopf, nur Pony/Scheitel davor
    if (hairStyle === 1) fillRR(g, -70, hy - 66, 140, 150, 56, hair);
    circle(g, 0, hy, 58, skin);
    g.beginPath();
    g.arc(0, hy - 8, 60, Math.PI * 1.02, Math.PI * 1.98);
    g.closePath(); g.fillStyle = hair; g.fill();
    circle(g, -20 + look * 10, hy + 8, 6.5, "#1b1530"); circle(g, 20 + look * 10, hy + 8, 6.5, "#1b1530");
    g.restore();
  }
  if (robot > 0) {
    g.save(); g.globalAlpha *= smooth(robot / 0.65);
    line(g, [[0, hy - 60], [0, hy - 92]], metalD, 8); circle(g, 0, hy - 96, 11, eye);
    fillRR(g, -60, hy - 58, 120, 112, 30, metal);
    fillRR(g, -46, hy - 18, 92, 40, 18, "#1d1838");
    circle(g, -20, hy + 2, 8, eye); circle(g, 20, hy + 2, 8, eye);
    glow(g, -20, hy + 2, 30, eye, 0.7); glow(g, 20, hy + 2, 30, eye, 0.7);
    g.restore();
  }
  g.restore();
}

// Kleiner Avatar-Kreis (Profilbild): Mensch oder Bot
export function avatar(g, x, y, r, { bg = "#3a2a6b", skin = "#e9b48a", hair = "#3a2418", bot = 0, eye = "#7df9ff", ringColor = null } = {}) {
  g.save(); g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.clip();
  circle(g, x, y, r, bg);
  if (bot < 1) {
    g.save(); g.globalAlpha *= 1 - bot;
    circle(g, x, y + r * 0.95, r * 0.75, "#2bb5a0");
    circle(g, x, y - r * 0.12, r * 0.42, skin);
    g.beginPath(); g.arc(x, y - r * 0.2, r * 0.44, Math.PI, Math.PI * 2); g.fillStyle = hair; g.fill();
    g.restore();
  }
  if (bot > 0) {
    g.save(); g.globalAlpha *= bot;
    circle(g, x, y + r * 0.95, r * 0.75, "#5d6886");
    fillRR(g, x - r * 0.42, y - r * 0.55, r * 0.84, r * 0.78, r * 0.2, "#9aa6c4");
    fillRR(g, x - r * 0.32, y - r * 0.3, r * 0.64, r * 0.26, r * 0.12, "#1d1838");
    circle(g, x - r * 0.14, y - r * 0.17, r * 0.07, eye); circle(g, x + r * 0.14, y - r * 0.17, r * 0.07, eye);
    g.restore();
  }
  g.restore();
  if (ringColor) ring(g, x, y, r + 5, 6, ringColor);
}

// Kopf im Profil (Silhouette nach rechts), wie am Anfang/Ende von Referenz B
export function headProfile(g, x, y, s, fill, rim = null) {
  g.save(); g.translate(x, y); g.scale(s, s);
  g.beginPath();
  g.moveTo(-150, 330); g.bezierCurveTo(-150, 220, -230, 150, -230, 0);
  g.bezierCurveTo(-230, -190, -90, -300, 40, -300);
  g.bezierCurveTo(170, -300, 240, -190, 230, -60);
  g.lineTo(285, 40); g.lineTo(240, 60); g.lineTo(250, 110); g.lineTo(232, 125); g.lineTo(242, 160);
  g.bezierCurveTo(240, 210, 180, 215, 120, 205); g.lineTo(110, 330); g.closePath();
  g.fillStyle = fill; g.fill();
  if (rim) { g.strokeStyle = rim; g.lineWidth = 8; g.stroke(); }
  g.restore();
}

// Handy (Hochformat), Bildschirm wird über draw(g, x, y, w, h) gefüllt
export function phone(g, x, y, w, h, draw) {
  fillRR(g, x - 14, y - 14, w + 28, h + 28, 56, "#121022");
  fillRR(g, x - 6, y - 6, w + 12, h + 12, 50, "#2c2650");
  g.save(); rr(g, x, y, w, h, 44); g.clip();
  draw(g, x, y, w, h);
  g.restore();
  fillRR(g, x + w / 2 - 70, y + 16, 140, 30, 15, "#121022");
}
// Hand von unten, die etwas hält (Daumen vorne)
export function hand(g, x, y, s, skin = "#e9a77d", sleeve = "#3b2f78") {
  g.save(); g.translate(x, y); g.scale(s, s);
  fillRR(g, -150, 120, 300, 400, 80, sleeve);
  fillRR(g, -170, -40, 340, 230, 90, skin);
  for (let i = 0; i < 4; i++) fillRR(g, 120 + (i === 0 ? -6 : 0), -150 + i * 62, 90, 52, 26, mix(skin, "#c98761", 0.15 * i));
  g.save(); g.rotate(-0.5); fillRR(g, -230, -110, 70, 170, 35, mix(skin, "#c98761", 0.2)); g.restore();
  g.restore();
}

// Sprechblase
export function bubble(g, x, y, w, h, color, tailDir = 0) {
  fillRR(g, x - w / 2, y - h / 2, w, h, Math.min(28, h / 2), color);
  g.beginPath(); g.moveTo(x - 18 + tailDir * 20, y + h / 2 - 2); g.lineTo(x + tailDir * 46, y + h / 2 + 30); g.lineTo(x + 18 + tailDir * 20, y + h / 2 - 2);
  g.closePath(); g.fillStyle = color; g.fill();
}

// Uhr
export function clock(g, x, y, r, a1, a2, face = "#f4ead8", rim = "#2c2650") {
  circle(g, x, y, r + 14, rim); circle(g, x, y, r, face);
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    line(g, [[x + Math.cos(a) * r * 0.8, y + Math.sin(a) * r * 0.8], [x + Math.cos(a) * r * 0.9, y + Math.sin(a) * r * 0.9]], rim, 6);
  }
  line(g, [[x, y], [x + Math.cos(a1 - Math.PI / 2) * r * 0.5, y + Math.sin(a1 - Math.PI / 2) * r * 0.5]], rim, 12);
  line(g, [[x, y], [x + Math.cos(a2 - Math.PI / 2) * r * 0.75, y + Math.sin(a2 - Math.PI / 2) * r * 0.75]], "#e5487a", 7);
  circle(g, x, y, 12, rim);
}

// Donut/Kreisdiagramm (Anteil 0..1), wie Referenz B (50 %)
export function donut(g, x, y, r, w, frac, color, track = "rgba(255,255,255,0.12)") {
  ring(g, x, y, r, w, track);
  if (frac > 0.002) ring(g, x, y, r, w, color, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * frac);
}

// --------------------------------------------------------------- Untertitel ---
// Ein Wort, Großbuchstaben, fette runde Schrift, mittig; zu lange Wörter werden schmaler gesetzt.
export function caption(g, word, { y = 960, color = "#bdf5c8", size = 132, maxW = 960, shadow = "rgba(10,4,30,0.55)" } = {}) {
  if (!word) return;
  const s = word.toUpperCase().replace(/[.,:;!]$/, "").replace(/-$/, "-");
  g.save();
  g.font = `900 ${size}px Cap`;
  const w = g.measureText(s).width;
  const k = Math.min(1, maxW / w);
  g.translate(W / 2, y); g.scale(k, k);
  g.textAlign = "center"; g.textBaseline = "middle";
  g.shadowColor = shadow; g.shadowBlur = 24; g.shadowOffsetY = 6;
  g.fillStyle = color; g.fillText(s, 0, 0);
  g.shadowColor = "transparent";
  g.restore();
}
