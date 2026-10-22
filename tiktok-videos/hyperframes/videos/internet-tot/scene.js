// „Was, wenn das Internet schon lange tot ist?“ – Gedankenexperiment im Stil @mentalist_xyz, 9:16, ~83 s.
// Sprecher (Piper/Thorsten) + Ein-Wort-Untertitel. Jede Einstellung zeigt, was gerade gesagt wird,
// und hängt an den Satz-/Wortzeiten aus words.js (erzeugt von tools/sprecher.py).
import V from "./words.js";
import {
  W, H, clamp, smooth, lerp, easeOut, backOut, ramp, rng, mix, rr, fillRR, circle, ring, line, glow, text, heart, star,
  spotlight, linear, dust, finish, person, avatar, headProfile, phone, hand, bubble, clock, donut, caption,
} from "./lib/flat2d.js";

const DURATION = 83;
const canvas = document.getElementById("scene");
canvas.width = W; canvas.height = H;
const g = canvas.getContext("2d");
const buf = document.createElement("canvas"); buf.width = W; buf.height = H;
const gb = buf.getContext("2d");

const L = (i) => V.lines[i].t0;                                   // Satzbeginn
const LE = (i) => V.lines[i].t1;                                  // Satzende
const lineWords = (i) => V.words.filter((w) => w.line === i);
const Wt = (i, k) => lineWords(i)[Math.min(k, lineWords(i).length - 1)].t0;   // k-tes Wort im Satz
const find = (i, s) => { const w = lineWords(i).find((x) => x.w.toLowerCase().startsWith(s.toLowerCase())); return w ? w.t0 : L(i); };

// Farbwelt (Referenz): dunkles Violett, Akzente Cyan, Magenta, Mint, Orange, Blutrot
const C = { deep: "#0d0820", violet: "#2a1659", violet2: "#43217f", cyan: "#58e6ff", mint: "#bdf5c8", magenta: "#e5487a",
  orange: "#ff9a4a", cream: "#f6e7c8", red: "#ff3b4e", blue: "#2d5bd0", skin: "#e9b48a" };

// ================================================================ Shots ===
// Jeder Shot: { at: Startzeit, cap: Untertitel-Optionen, draw(g, t, lt, cap) } – cap() setzt das Wort
// an der passenden Ebene (Vordergrund darf es verdecken), sonst wird es zuletzt gezeichnet.

// A · Browserfenster mit Herzschlag-Linie, die flach wird („tot“)
const A = { at: 0, cap: { color: C.mint }, draw(g, t, lt, cap) {
  spotlight(g, "#3a1d74", C.deep);
  dust(g, t, 1, 40, C.cyan, 0.4);
  const flat = find(0, "tot"), x0 = 120, y0 = 560, w = 840, h = 760;
  fillRR(g, x0, y0, w, h, 34, "#1a1238");
  fillRR(g, x0, y0, w, 86, 34, "#2c2160"); g.fillStyle = "#2c2160"; g.fillRect(x0, y0 + 50, w, 36);
  [C.red, C.orange, C.mint].forEach((c, i) => circle(g, x0 + 48 + i * 42, y0 + 43, 12, c));
  fillRR(g, x0 + 170, y0 + 24, 560, 40, 20, "#150f30");
  text(g, "www.", x0 + 200, y0 + 45, { size: 26, color: "#8f86c9", align: "left", weight: 800 });
  // Feed-Kacheln, die ausgrauen
  const dead = ramp(t, flat, 0.8);
  for (let i = 0; i < 3; i++) {
    const yy = y0 + 130 + i * 110;
    avatar(g, x0 + 80, yy + 30, 34, { bg: mix("#4b2f95", "#2a2540", dead), bot: 0 });
    fillRR(g, x0 + 140, yy + 6, 380 - i * 60, 20, 10, mix("#6e5fc0", "#3a3550", dead));
    fillRR(g, x0 + 140, yy + 38, 260 + i * 40, 16, 8, mix("#4f4590", "#2e2a40", dead));
    heart(g, x0 + w - 80, yy + 30, 38, mix(C.magenta, "#3a3550", dead));
  }
  // EKG
  const ey = y0 + 560, pts = [];
  for (let x = 0; x <= w - 80; x += 6) {
    const tt = (x / (w - 80)) * 2.2 + lt * 1.6, ph = tt % 1, beat = t < flat ? 1 : 1 - ramp(t, flat, 0.35);
    let v = 0;
    if (ph > 0.42 && ph < 0.47) v = -(ph - 0.42) / 0.05 * 140;
    else if (ph >= 0.47 && ph < 0.52) v = -140 + (ph - 0.47) / 0.05 * 220;
    else if (ph >= 0.52 && ph < 0.56) v = 80 - (ph - 0.52) / 0.04 * 80;
    pts.push([x0 + 40 + x, ey + v * beat]);
  }
  const col = t < flat ? C.mint : mix(C.mint, C.red, ramp(t, flat, 0.3));
  g.save(); g.shadowColor = col; g.shadowBlur = 24; line(g, pts, col, 7); g.restore();
  // Wort tot: rotes Pulsieren
  if (t > flat) glow(g, W / 2, ey, 500, "rgba(255,40,70,0.5)", 0.6 * (1 - ramp(t, flat + 0.2, 1.2)));
  cap();
} };

// B · Raster aus Profilbildern: alles Bots, nur eins in der Mitte ist ein Mensch (du)
const B = { at: L(1) - 0.05, cap: { color: C.cream, y: 1500 }, draw(g, t, lt, cap) {
  spotlight(g, "#30196a", C.deep, { y: 900 });
  const z = 1 + lt * 0.05;
  g.save(); g.translate(W / 2, 900); g.scale(z, z);
  const youT = find(1, "echten");
  for (let r = -4; r <= 4; r++) for (let c = -2; c <= 2; c++) {
    const x = c * 200, y = r * 190, me = r === 0 && c === 0;
    const pop = ramp(lt, 0.03 * (Math.abs(r) + Math.abs(c)), 0.35, backOut);
    if (me) {
      glow(g, x, y, 260, "rgba(255,180,90,0.9)", ramp(t, youT, 0.5));
      avatar(g, x, y, 78 * pop, { bg: "#ff9a4a", ringColor: mix("#ffffff", C.orange, 0.3) });
    } else avatar(g, x, y, 70 * pop, { bot: 1, bg: "#2d2560", eye: C.cyan });
  }
  g.restore();
  cap();
} };

// C1 · „Klingt verrückt.“ – Figur zuckt mit den Schultern, Fragezeichen kreisen
const C1 = { at: L(2) - 0.05, cap: { color: C.mint, y: 1580 }, draw(g, t, lt, cap) {
  spotlight(g, "#5a2470", "#140a26");
  for (let i = 0; i < 5; i++) {
    const a = lt * 2.4 + (i / 5) * Math.PI * 2;
    text(g, "?", W / 2 + Math.cos(a) * 190, 640 + Math.sin(a) * 60, { size: 90, color: [C.cyan, C.magenta, C.orange, C.mint, C.cream][i] });
  }
  const shrug = Math.sin(clamp(lt / 0.5) * Math.PI);
  person(g, W / 2, 1420, 1.9, { shirt: C.magenta, armL: 0.25 + 0.25 * shrug, armR: 0.25 + 0.25 * shrug, look: Math.sin(lt * 3) * 0.6 });
  cap();
} };

// C2 · Altes Forum, 2021: ein Beitrag „Dead Internet Theory“ erscheint
const C2 = { at: L(3) - 0.05, cap: { color: C.cream, y: 1560 }, draw(g, t, lt, cap) {
  linear(g, "#1b1036", "#0b0718");
  dust(g, t, 3, 30, C.cream, 0.25);
  const x0 = 90, y0 = 330, w = 900, h = 1000;
  fillRR(g, x0, y0, w, h, 18, "#c9c3b4");
  fillRR(g, x0 + 10, y0 + 10, w - 20, 70, 8, "#2c3c8c");
  text(g, "Forum · Unterhaltung", x0 + 40, y0 + 46, { size: 34, color: "#f4f0e6", align: "left", weight: 800, font: "Mono" });
  // Beiträge
  for (let i = 0; i < 6; i++) {
    const yy = y0 + 110 + i * 140, isPost = i === 2;
    const show = isPost ? ramp(t, find(3, "Theorie"), 0.3) : 1;
    fillRR(g, x0 + 30, yy, w - 60, 120, 6, isPost ? mix("#e8e2d2", "#fff3c2", show) : "#e8e2d2");
    circle(g, x0 + 90, yy + 60, 34, ["#8a7fb8", "#b88a7f", "#5c8a7f", "#7f9ab8", "#b87fa5", "#8ab87f"][i]);
    if (isPost) {
      const s = "Dead Internet Theory";
      const n = Math.floor(s.length * ramp(t, find(3, "Theorie"), 1.0, (x) => x));
      text(g, s.slice(0, n) + (n < s.length && Math.floor(t * 4) % 2 ? "▌" : ""), x0 + 150, yy + 44, { size: 40, color: "#1c1a2a", align: "left", weight: 800, font: "Mono" });
      text(g, "Das meiste im Netz ist fake.", x0 + 150, yy + 90, { size: 28, color: "#5c5870", align: "left", weight: 400, font: "Mono", alpha: show });
    } else {
      fillRR(g, x0 + 150, yy + 32, 420 - i * 30, 22, 6, "#b9b3a4"); fillRR(g, x0 + 150, yy + 72, 300 + i * 20, 18, 6, "#cfc9ba");
    }
  }
  // Jahr 2021 als Stempel
  const y21 = find(3, "2021"), k = ramp(t, y21, 0.35, backOut);
  if (k > 0) {
    g.save(); g.translate(W - 250, y0 + 120); g.rotate(-0.18); g.scale(k, k);
    fillRR(g, -150, -66, 300, 132, 20, C.magenta); text(g, "2021", 0, 4, { size: 92, color: "#fff", weight: 900 });
    g.restore();
  }
  cap();
} };

// D · „Die Dead-Internet-Theorie“: Netz-Globus, dessen Lichter ausgehen
const D = { at: L(4) - 0.05, cap: { color: C.cyan, y: 1560 }, draw(g, t, lt, cap) {
  spotlight(g, "#1f2a6e", "#070a1c");
  const cx = W / 2, cy = 860, R = 360, r = rng(4), nodes = [];
  for (let i = 0; i < 70; i++) {
    const a = r() * Math.PI * 2, b = Math.acos(2 * r() - 1), rot = lt * 0.35;
    const x = Math.sin(b) * Math.cos(a + rot), z = Math.sin(b) * Math.sin(a + rot), y = Math.cos(b);
    nodes.push({ x: cx + x * R, y: cy + y * R, z, off: r() });
  }
  circle(g, cx, cy, R, "#141a46");
  ring(g, cx, cy, R, 4, "rgba(88,230,255,0.35)");
  const dark = clamp(lt / 1.6);
  for (let i = 0; i < nodes.length; i++) for (let j = i + 1; j < nodes.length; j++) {
    const a = nodes[i], b = nodes[j], d = Math.hypot(a.x - b.x, a.y - b.y);
    if (d < 120 && a.z > -0.2 && b.z > -0.2) line(g, [[a.x, a.y], [b.x, b.y]], `rgba(88,230,255,${0.35 * (1 - dark)})`, 2);
  }
  for (const n of nodes) if (n.z > -0.2) {
    const on = n.off > dark;
    circle(g, n.x, n.y, 7, on ? C.cyan : "#3a3f66");
    if (on) glow(g, n.x, n.y, 26, C.cyan, 0.6);
  }
  cap();
} };

// E · Menschen mit Handys – „sondern von Bots“: einer nach dem anderen wird zum Roboter
const E = { at: L(5) - 0.05, cap: { color: C.mint, y: 560 }, draw(g, t, lt, cap) {
  spotlight(g, "#3b1b72", C.deep, { y: 1150 });
  dust(g, t, 5, 30, C.mint, 0.25);
  const flipT = find(6, "Bots"), screens = ramp(t, find(5, "online"), 0.4);
  const ppl = [[-330, 1500, 1.15, "#e5487a", 0], [330, 1520, 1.15, "#2bb5a0", 1], [-110, 1430, 1.0, "#ff9a4a", 0], [140, 1440, 1.0, "#5a7cf0", 1],
    [-420, 1280, 0.8, "#2bb5a0", 1], [420, 1290, 0.8, "#e5487a", 0], [0, 1300, 0.85, "#c9b6ff", 0], [-230, 1210, 0.7, "#ff9a4a", 1], [240, 1210, 0.7, "#2bb5a0", 0]];
  ppl.sort((a, b) => a[1] - b[1]);
  cap();
  ppl.forEach(([dx, y, s, shirt, hs], i) => {
    const robot = ramp(t, flipT - 0.5 + ((i * 7) % 9) * 0.12, 0.3);
    if (screens > 0) glow(g, W / 2 + dx - 10 * s, y - 210 * s, 70 * s, "rgba(125,249,255,0.8)", screens * (1 - robot));
    person(g, W / 2 + dx, y, s, { shirt, hairStyle: hs, hair: hs ? "#5a3020" : "#22170f", robot, phone: true, armR: 0.05, look: Math.sin(t + i) * 0.4 });
  });
} };

// F · Bot-Farm: Server-Schrank, Beiträge/Likes/Kommentare fliegen heraus; „rund um die Uhr“: Uhr rast
const F = { at: L(7) - 0.05, cap: { color: C.cream, y: 1640 }, draw(g, t, lt, cap) {
  const day = ramp(t, L(8), 0.2) * (0.5 + 0.5 * Math.sin((t - L(8)) * 9));
  spotlight(g, mix("#2a1a66", "#6a4ab0", day), C.deep, { y: 1050 });
  const rx = W / 2 - 170, ry = 860, rw = 340, rh = 640;
  fillRR(g, rx, ry, rw, rh, 24, "#1a1536");
  for (let i = 0; i < 8; i++) {
    fillRR(g, rx + 26, ry + 30 + i * 74, rw - 52, 56, 10, "#2b2558");
    for (let k = 0; k < 6; k++) {
      const on = Math.floor(t * 12 + i * 3 + k * 5) % 4 !== 0;
      circle(g, rx + 60 + k * 22, ry + 58 + i * 74, 6, on ? (k % 2 ? C.cyan : C.mint) : "#3a3570");
    }
    fillRR(g, rx + rw - 120, ry + 50 + i * 74, 70, 16, 6, "#3e3680");
  }
  // Icons, die herausfliegen (je ein Typ pro Verb)
  const kinds = [["post", find(7, "posten")], ["like", find(7, "liken")], ["comment", find(7, "kommentieren")], ["reply", find(7, "antworten") - 0.6]];
  kinds.forEach(([k, t0], j) => {
    for (let n = 0; n < 7; n++) {
      const st = t0 + n * 0.22, p = (t - st) / 1.6;
      if (p < 0 || p > 1) continue;
      const side = (n + j) % 2 ? 1 : -1, x = W / 2 + side * (120 + p * 300 + j * 30), y = ry + 120 - p * 520 + j * 50 + (n % 3) * 40;
      const a = Math.sin(p * Math.PI);
      g.save(); g.globalAlpha = a;
      if (k === "post") { fillRR(g, x - 70, y - 50, 140, 100, 16, C.cream); fillRR(g, x - 50, y - 30, 100, 40, 8, C.blue); fillRR(g, x - 50, y + 20, 70, 12, 6, "#9a92c0"); }
      if (k === "like") heart(g, x, y, 90, C.magenta);
      if (k === "comment") { bubble(g, x, y, 130, 80, C.mint); fillRR(g, x - 40, y - 12, 80, 10, 5, "#2b6a52"); fillRR(g, x - 40, y + 8, 50, 10, 5, "#2b6a52"); }
      if (k === "reply") { bubble(g, x, y, 120, 76, C.cyan, side); text(g, "↩", x, y - 2, { size: 50, color: "#0d3a4a" }); }
      g.restore();
    }
  });
  // Uhr über dem Schrank
  const spin = Math.max(0, t - L(8) + 0.3) * 14;
  clock(g, W / 2, 560, 150, spin * 0.3 + 1, spin * 3.6 + 2);
  cap();
} };

// G · Verschwörungs-Pinnwand mit roten Fäden – „dann kamen die Zahlen“: Zahlen überdecken sie
const G = { at: L(9) - 0.05, cap: { color: C.cream, y: 1640 }, draw(g, t, lt, cap) {
  linear(g, "#2b1438", "#0e0716");
  const bx = 90, by = 380, bw = 900, bh = 1080;
  fillRR(g, bx - 20, by - 20, bw + 40, bh + 40, 20, "#5a3a26");
  fillRR(g, bx, by, bw, bh, 8, "#b98a5e");
  const pins = [[250, 560], [720, 520], [480, 820], [260, 1130], [760, 1080], [520, 1330]];
  const r = rng(9);
  pins.forEach(([x, y], i) => {
    g.save(); g.translate(x, y); g.rotate((r() - 0.5) * 0.25);
    fillRR(g, -110, -80, 220, 160, 6, i % 2 ? "#f2eee2" : "#ffe58a");
    if (i % 2) { circle(g, 0, -10, 40, "#7a6f9a"); fillRR(g, -60, 34, 120, 30, 15, "#7a6f9a"); }
    else text(g, "?", 0, 4, { size: 110, color: "#c0392b" });
    g.restore();
  });
  const order = [0, 2, 1, 4, 3, 5, 2, 0];
  for (let i = 0; i < order.length - 1; i++) line(g, [pins[order[i]], pins[order[i + 1]]], "#d62839", 5);
  pins.forEach(([x, y]) => circle(g, x, y - 70, 12, "#d62839"));
  // Zahlenregen ab „Zahlen“
  const z0 = find(10, "Dann"), rr2 = rng(10);
  for (let i = 0; i < 70; i++) {
    const x = rr2() * W, sp = 700 + rr2() * 600, st = z0 + rr2() * 0.7, y = -100 + (t - st) * sp;
    if (t < st || y > H + 100) continue;
    text(g, ["51", "%", "2024", "37", "90", "0", "1", "%"][i % 8], x, y, { size: 70 + rr2() * 70, color: [C.cyan, C.mint, C.cream][i % 3], weight: 900 });
  }
  cap();
} };

// H · 2024: Anteil am Internetverkehr – Bots überholen Menschen
const Hs = { at: L(11) - 0.05, cap: { color: C.mint, y: 520 }, draw(g, t, lt, cap) {
  spotlight(g, "#1c2a6a", "#070a1c", { y: 1100 });
  const yr = ramp(t, L(11), 0.4, backOut);
  g.save(); g.translate(W / 2, 330); g.scale(yr, yr); text(g, "2024", 0, 0, { size: 150, color: C.cream, weight: 900 }); g.restore();
  // zwei Ströme: Menschen (warm) und Bots (cyan), fließen in den Balken
  // Balken füllt sich von beiden Seiten bis zum echten Wert (Imperva 2025: 51 % Bots, 49 % Menschen)
  const over = find(11, "mehr"), fill = ramp(t, over - 0.8, 1.8, easeOut), share = 0.51;
  const r = rng(12);
  for (let i = 0; i < 60; i++) {
    const bot = i % 2 === 1, lane = bot ? 1 : -1, speed = 300 + r() * 200, ph = r();
    const y = 760 + ((ph * 760 + t * speed) % 760);
    const x = W / 2 + lane * (230 + Math.sin(i) * 50);
    if (bot) fillRR(g, x - 20, y - 20, 40, 40, 8, C.cyan); else circle(g, x, y, 20, C.orange);
  }
  // Waage-Balken
  const bx = 120, by = 1680, bw = 840;
  fillRR(g, bx, by, bw, 90, 45, "#211a46");
  if (fill > 0.02) {
    fillRR(g, bx, by, bw * (1 - share) * fill, 90, 45, C.orange);
    fillRR(g, bx + bw - bw * share * fill, by, bw * share * fill, 90, 45, C.cyan);
  }
  line(g, [[W / 2, by - 30], [W / 2, by + 120]], "#ffffff", 4);
  text(g, "MENSCHEN", bx + 20, by + 150, { size: 46, color: C.orange, align: "left", weight: 900 });
  text(g, "BOTS", bx + bw - 20, by + 150, { size: 46, color: C.cyan, align: "right", weight: 900 });
  const lab = ramp(t, over + 0.9, 0.3);
  text(g, "49 %", bx + 40, by + 46, { size: 44, color: "#2a1200", align: "left", weight: 900, alpha: lab });
  text(g, "51 %", bx + bw - 40, by + 46, { size: 44, color: "#062a33", align: "right", weight: 900, alpha: lab });
  avatar(g, 260, 650, 70, { bg: "#7a3d1a" }); avatar(g, W - 260, 650, 70, { bot: 1, bg: "#1b3d5a" });
  cap();
} };

// I · 51 %: Kreisdiagramm füllt sich, daneben der Bericht einer Sicherheitsfirma (Schild)
const I = { at: L(12) - 0.05, cap: { color: C.cream, y: 1500 }, draw(g, t, lt, cap) {
  spotlight(g, "#381a78", C.deep, { y: 800 });
  const f = 0.51 * ramp(t, L(12), 0.9, easeOut);
  glow(g, W / 2, 760, 420, "rgba(88,230,255,0.35)", 1);
  donut(g, W / 2, 760, 300, 90, f, C.cyan);
  text(g, `${Math.round(f * 100)} %`, W / 2, 770, { size: 150, color: "#ffffff", weight: 900 });
  const rep = ramp(t, find(12, "Bad"), 0.4, backOut);
  if (rep > 0) {
    g.save(); g.translate(300, 1260); g.scale(rep, rep); g.rotate(-0.08);
    fillRR(g, -120, -150, 240, 300, 16, C.cream);
    text(g, "BAD BOT", 0, -100, { size: 34, color: "#2a1659", weight: 900 }); text(g, "REPORT", 0, -62, { size: 34, color: "#2a1659", weight: 900 });
    for (let i = 0; i < 5; i++) fillRR(g, -80, -20 + i * 30, 160 - (i % 2) * 40, 12, 6, "#b5abd0");
    g.restore();
  }
  const sh = ramp(t, find(12, "Sicherheitsfirma"), 0.4, backOut);
  if (sh > 0) {
    g.save(); g.translate(W - 300, 1260); g.scale(sh, sh);
    g.beginPath(); g.moveTo(0, -150); g.lineTo(120, -100); g.bezierCurveTo(120, 40, 60, 120, 0, 150); g.bezierCurveTo(-60, 120, -120, 40, -120, -100); g.closePath();
    g.fillStyle = C.blue; g.fill(); line(g, [[-45, 0], [-10, 40], [55, -40]], "#fff", 18);
    g.restore();
  }
  cap();
} };

// J · 37 %: ein Bot-Schwarm greift einen Online-Shop an, rot leuchtende Bots
const J = { at: L(13) - 0.05, cap: { color: C.cream, y: 1680 }, draw(g, t, lt, cap) {
  spotlight(g, "#4a1230", "#12050c", { y: 900 });
  const x0 = 240, y0 = 640, w = 600, h = 520;
  fillRR(g, x0, y0, w, h, 26, "#f1e8f2"); fillRR(g, x0, y0, w, 70, 26, "#c9b8d6"); g.fillStyle = "#c9b8d6"; g.fillRect(x0, y0 + 40, w, 30);
  text(g, "KASSE", W / 2, y0 + 150, { size: 54, color: "#3a1d4a", weight: 900 });
  const crack = ramp(t, find(13, "Schaden"), 0.4);
  fillRR(g, W / 2 - 80, y0 + 250, 160, 140, 20, mix("#3a1d4a", C.red, crack));
  ring(g, W / 2, y0 + 250, 52, 22, mix("#3a1d4a", C.red, crack), Math.PI, Math.PI * 2);
  if (crack > 0) line(g, [[W / 2 - 20, y0 + 270], [W / 2 + 10, y0 + 310], [W / 2 - 10, y0 + 340], [W / 2 + 20, y0 + 380]], "#fff", 6 * crack);
  // Schwarm: 100 Bots, 37 davon rot
  const r = rng(13), redT = find(13, "37");
  for (let i = 0; i < 100; i++) {
    const a = r() * Math.PI * 2, d = 520 + r() * 260, sp = 0.2 + r() * 0.3;
    const pull = 0.55 * smooth((lt - 0.2) / 3.5);
    const x = W / 2 + Math.cos(a + lt * sp) * d * (1 - pull), y = 900 + Math.sin(a + lt * sp) * d * 1.25 * (1 - pull);
    const red = i < 37 ? ramp(t, redT + i * 0.012, 0.3) : 0;
    const eye = mix(C.cyan, C.red, red);
    fillRR(g, x - 22, y - 20, 44, 40, 10, mix("#9aa6c4", "#4a2030", red));
    circle(g, x - 8, y, 5, eye); circle(g, x + 8, y, 5, eye);
    if (red > 0.5) glow(g, x, y, 34, "rgba(255,59,78,0.9)", 0.5);
  }
  const big = ramp(t, redT, 0.4, backOut);
  if (big > 0) { g.save(); g.translate(W / 2, 420); g.scale(big, big); text(g, "37 %", 0, 0, { size: 170, color: C.red, weight: 900 }); g.restore(); }
  cap();
} };

// K · KI erzeugt Texte, Bilder, Stimmen in Sekunden – echt und künstlich sehen gleich aus
const K = { at: L(14) - 0.05, cap: { color: C.mint, y: 1660 }, draw(g, t, lt, cap) {
  spotlight(g, "#122f5a", "#050b18", { y: 760 });
  const cx = W / 2, cy = 700, pulse = 0.5 + 0.5 * Math.sin(t * 6);
  glow(g, cx, cy, 300, "rgba(88,230,255,0.9)", 0.5 + 0.2 * pulse);
  fillRR(g, cx - 110, cy - 110, 220, 220, 30, "#1c3a6a");
  for (let i = -2; i <= 2; i++) { line(g, [[cx + i * 40, cy - 150], [cx + i * 40, cy - 110]], C.cyan, 8); line(g, [[cx + i * 40, cy + 110], [cx + i * 40, cy + 150]], C.cyan, 8);
    line(g, [[cx - 150, cy + i * 40], [cx - 110, cy + i * 40]], C.cyan, 8); line(g, [[cx + 110, cy + i * 40], [cx + 150, cy + i * 40]], C.cyan, 8); }
  text(g, "KI", cx, cy + 6, { size: 110, color: C.cyan, weight: 900 });
  const items = [["text", find(14, "Texte"), -330], ["bild", find(14, "Bilder"), 0], ["stimme", find(14, "Stimmen"), 330]];
  const same = ramp(t, find(14, "Unterschied"), 0.6);
  items.forEach(([k, t0, dx]) => {
    const p = ramp(t, t0, 0.45, backOut);
    if (p <= 0) return;
    const x = cx + dx, y = lerp(cy, 1180, p) - same * 60;
    g.save(); g.translate(x, y); g.scale(p, p);
    fillRR(g, -130, -130, 260, 260, 22, C.cream);
    if (k === "text") for (let i = 0; i < 5; i++) fillRR(g, -90, -80 + i * 38, 180 - (i % 3) * 40, 18, 9, "#6d63a8");
    if (k === "bild") { fillRR(g, -100, -100, 200, 200, 12, "#86c5ff"); circle(g, 50, -50, 26, "#ffe08a"); g.beginPath(); g.moveTo(-100, 100); g.lineTo(-30, -10); g.lineTo(30, 60); g.lineTo(60, 20); g.lineTo(100, 100); g.closePath(); g.fillStyle = "#3d8a5a"; g.fill(); }
    if (k === "stimme") for (let i = 0; i < 9; i++) { const hgt = 30 + 70 * Math.abs(Math.sin(t * 8 + i * 1.3)); fillRR(g, -100 + i * 24, -hgt / 2, 14, hgt, 7, C.magenta); }
    g.restore();
  });
  // Stoppuhr „Sekunden“
  const sw = ramp(t, find(14, "Sekunden"), 0.4, backOut);
  if (sw > 0) { g.save(); g.translate(cx + 300, cy - 240); g.scale(sw * 0.6, sw * 0.6); clock(g, 0, 0, 120, 0, (t - find(14, "Sekunden")) * 12); g.restore(); }
  // Lupe, die zwischen den Karten hin- und herwandert und nichts findet
  if (same > 0) {
    const lx = cx + Math.sin((t - find(14, "Unterschied")) * 2.2) * 330, ly = 1120;
    g.save(); g.globalAlpha = same;
    ring(g, lx, ly, 90, 20, "#ffffff"); line(g, [[lx + 64, ly + 64], [lx + 150, ly + 150]], "#ffffff", 28);
    text(g, "?", lx, ly + 4, { size: 100, color: "#ffffff" });
    g.restore();
  }
  cap();
} };

// L · Europol-Bericht von 2022 mit Sternenkranz, Stempel „SCHÄTZUNG“
const Ls = { at: L(15) - 0.05, cap: { color: C.cream, y: 1600 }, draw(g, t, lt, cap) {
  spotlight(g, "#1d2a78", "#060918", { y: 900 });
  g.save(); g.translate(W / 2, 880); g.rotate(-0.04 + lt * 0.01);
  fillRR(g, -320, -440, 640, 880, 18, "#f4efe4");
  for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; star(g, Math.cos(a) * 100, -230 + Math.sin(a) * 100, 22, "#e7b416"); }
  text(g, "EUROPOL", 0, -60, { size: 64, color: "#1d2a78", weight: 900 });
  text(g, "Bericht · 2022", 0, 10, { size: 40, color: "#5c5870", weight: 800 });
  for (let i = 0; i < 6; i++) fillRR(g, -220, 90 + i * 46, 440 - (i % 3) * 70, 18, 9, "#c9c2d8");
  const st = ramp(t, find(15, "Schätzung"), 0.25, backOut);
  if (st > 0) {
    g.save(); g.translate(40, 200); g.rotate(-0.22); g.scale(2 - st, 2 - st); g.globalAlpha = st;
    g.strokeStyle = C.red; g.lineWidth = 14; rr(g, -270, -70, 540, 140, 16); g.stroke();
    text(g, "SCHÄTZUNG", 0, 6, { size: 86, color: C.red, weight: 900 });
    g.restore();
  }
  g.restore();
  cap();
} };

// M · Raster aus 100 Inhalten: bis 2026 könnten 90 davon künstlich sein
const M = { at: L(16) - 0.05, cap: { color: C.cream, y: 1700 }, draw(g, t, lt, cap) {
  spotlight(g, "#2b1666", C.deep, { y: 900 });
  const y26 = ramp(t, find(16, "2026"), 0.35, backOut);
  if (y26 > 0) { g.save(); g.translate(W / 2, 300); g.scale(y26, y26); text(g, "2026", 0, 0, { size: 130, color: C.cream, weight: 900 }); g.restore(); }
  const nine = find(16, "90"), x0 = 115, y0 = 470, s = 85;
  const r = rng(16), order = Array.from({ length: 100 }, (_, i) => [r(), i]).sort((a, b) => a[0] - b[0]).map((p) => p[1]);
  const synth = new Map(order.slice(0, 90).map((i, k) => [i, k]));
  for (let i = 0; i < 100; i++) {
    const cx = x0 + (i % 10) * s + s / 2, cy = y0 + Math.floor(i / 10) * s + s / 2;
    const k = synth.has(i) ? ramp(t, nine - 0.4 + synth.get(i) * 0.025, 0.25) : 0;
    const pop = ramp(lt, (i % 10) * 0.02 + Math.floor(i / 10) * 0.03, 0.3, backOut);
    g.save(); g.translate(cx, cy); g.scale(pop, pop);
    fillRR(g, -36, -36, 72, 72, 12, mix(["#f6e7c8", "#ffb27a", "#c9b6ff"][i % 3], "#163a5a", k));
    if (k > 0.5) {
      // Glitch-Streifen + Chip-Augen
      fillRR(g, -36 + Math.sin(t * 20 + i) * 6, -8, 72, 10, 3, C.cyan);
      circle(g, -12, 14, 6, C.cyan); circle(g, 12, 14, 6, C.cyan);
    } else {
      circle(g, 0, -6, 14, "#7a5a8a"); fillRR(g, -20, 12, 40, 14, 7, "#7a5a8a");
    }
    g.restore();
  }
  const big = ramp(t, nine, 0.4, backOut);
  if (big > 0) { glow(g, W / 2, 1420, 300, "rgba(88,230,255,0.7)", big * 0.6); g.save(); g.translate(W / 2, 1460); g.scale(big, big); text(g, "90 %", 0, 0, { size: 150, color: C.cyan, weight: 900 }); g.restore(); }
  cap();
} };

// N · Kalenderblatt 2026 – „Das ist jetzt.“: roter Kreis, Bild ruckt
const N = { at: L(17) - 0.05, cap: { color: C.cream, y: 1560 }, draw(g, t, lt, cap) {
  spotlight(g, "#3d0f2a", "#0c0309", { y: 900 });
  const now = find(18, "jetzt"), jolt = t > now ? Math.exp(-(t - now) * 6) * Math.sin((t - now) * 60) * 14 : 0;
  g.save(); g.translate(W / 2 + jolt, 860);
  const p = ramp(t, L(17), 0.4, backOut);
  g.scale(p, p);
  fillRR(g, -330, -380, 660, 760, 30, "#f4efe4");
  fillRR(g, -330, -380, 660, 170, 30, C.red); g.fillStyle = C.red; g.fillRect(-330, -260, 660, 50);
  for (let i = -2; i <= 2; i++) fillRR(g, i * 120 - 14, -420, 28, 80, 14, "#2a2540");
  text(g, "2026", 0, 40, { size: 230, color: "#1c1830", weight: 900 });
  const ringK = ramp(t, now, 0.45);
  if (ringK > 0) {
    g.beginPath();
    for (let a = 0; a <= ringK * Math.PI * 2.1; a += 0.05) g.lineTo(Math.cos(a - 2) * 300 + Math.sin(a * 3) * 8, 40 + Math.sin(a - 2) * 150);
    g.strokeStyle = C.red; g.lineWidth = 18; g.lineCap = "round"; g.stroke();
  }
  g.restore();
  if (t > now) glow(g, W / 2, 860, 700, "rgba(255,59,78,0.6)", 0.5 * Math.exp(-(t - now) * 2));
  cap();
} };

// O · Deine Hand mit Handy: Kommentare unter einem viralen Video – viele klingen gleich
const O = { at: L(19) - 0.05, cap: { color: C.mint, y: 360 }, draw(g, t, lt, cap) {
  spotlight(g, "#3a1b78", C.deep, { y: 1000 });
  const rise = ramp(lt, 0, 0.6, easeOut), px = 240, py = lerp(1900, 560, rise), pw = 600, ph = 1180;
  const scroll = ramp(t, find(20, "Kommentare") - 0.3, 1.4) * 360;
  const same = ramp(t, find(21, "gleich") - 0.4, 0.5);
  cap();
  phone(g, px, py, pw, ph, (g, x, y, w, h) => {
    g.fillStyle = "#14102a"; g.fillRect(x, y, w, h);
    // virales Video oben
    fillRR(g, x, y, w, 360, 0, "#4b2a8a");
    circle(g, x + w / 2, y + 190, 70, "rgba(255,255,255,0.85)");
    g.beginPath(); g.moveTo(x + w / 2 - 22, y + 155); g.lineTo(x + w / 2 + 38, y + 190); g.lineTo(x + w / 2 - 22, y + 225); g.closePath(); g.fillStyle = "#4b2a8a"; g.fill();
    text(g, "2,4 Mio.", x + w - 30, y + 320, { size: 30, color: "#fff", align: "right", weight: 800 }); heart(g, x + w - 190, y + 318, 36, C.magenta);
    const texts = ["Endlich sagt es mal einer!", "So wahr!!", "Wer ist 2026 noch hier?", "So wahr!", "Endlich sagt es mal einer", "So wahr!!!", "Bester Inhalt heute", "Endlich sagt es mal einer!!", "So wahr!"];
    for (let i = 0; i < texts.length; i++) {
      const yy = y + 400 + i * 120 - scroll;
      if (yy < y + 360 || yy > y + h) continue;
      const dup = /So wahr|Endlich/.test(texts[i]);
      const hl = dup ? same : 0;
      if (hl > 0) fillRR(g, x + 12, yy - 8, w - 24, 104, 18, `rgba(88,230,255,${0.22 * hl})`);
      avatar(g, x + 60, yy + 40, 30, { bot: hl, bg: "#3a2a6b" });
      fillRR(g, x + 104, yy + 10, 120, 14, 7, "#5d5590");
      text(g, texts[i], x + 104, yy + 58, { size: 30, color: mix("#e8e3ff", C.cyan, hl), align: "left", weight: 800 });
    }
  });
  hand(g, px + pw * 0.62, py + ph + 10, 1.0);
} };

// P · Streit in den Kommentaren: zwei Figuren, rote Sprechblasen mit Zeichen
const P = { at: L(22) - 0.05, cap: { color: C.cream, y: 380 }, draw(g, t, lt, cap) {
  spotlight(g, "#4a1b5e", "#10061a", { y: 1150 });
  const bump = (a) => Math.max(0, Math.sin((t - a) * 9)) * Math.exp(-(t - a) * 2);
  cap();
  const angry = ramp(t, find(22, "Streit"), 0.3);
  person(g, 300, 1650, 1.55, { shirt: "#2bb5a0", armR: 0.4 + 0.35 * bump(find(22, "Streit")), look: 0.6 });
  person(g, 780, 1650, 1.55, { shirt: "#ff9a4a", hairStyle: 1, armL: 0.4 + 0.35 * bump(find(22, "Kommentaren")), look: -0.6 });
  if (angry > 0) {
    g.save(); g.globalAlpha = angry;
    bubble(g, 330, 760 - bump(find(22, "Streit")) * 20, 300, 150, C.red, 0.3); text(g, "!#?%!", 330, 760, { size: 64, color: "#fff", weight: 900 });
    bubble(g, 760, 690 - bump(find(22, "Kommentaren")) * 20, 300, 150, C.orange, -0.3); text(g, "?!!", 760, 690, { size: 70, color: "#fff", weight: 900 });
    g.restore();
  }
  // „Menschen?“ – kurz ein Fragezeichen über beiden
  const q = ramp(t, find(23, "Menschen"), 0.3);
  if (q > 0) text(g, "?", W / 2, 1050, { size: 160, color: C.cream, alpha: q });
} };

// Q · Rückzug: die beiden hängen an Fäden, oben führen Roboterhände die Spielkreuze
const Q = { at: L(24) - 0.05, cap: { color: C.cyan, y: 1790 }, draw(g, t, lt, cap) {
  spotlight(g, "#1b1a5e", "#05040f", { y: 1100 });
  const z = lerp(1.25, 0.9, ramp(lt, 0, 1.6, easeOut));
  g.save(); g.translate(W / 2, 1250); g.scale(z, z); g.translate(-W / 2, -1250);
  const sw = Math.sin(t * 3) * 0.08;
  const puppets = [[330, 1600, "#2bb5a0", 0, sw], [750, 1600, "#ff9a4a", 1, -sw]];
  puppets.forEach(([x, y, shirt, hs, s]) => {
    const cx = x + 0, cy = 520;
    // Spielkreuz + Fäden
    g.save(); g.translate(cx, cy); g.rotate(s);
    fillRR(g, -130, -12, 260, 24, 12, "#8a6a4a"); fillRR(g, -12, -80, 24, 160, 12, "#8a6a4a"); g.restore();
    const ends = [[-130, 0], [130, 0], [0, -80], [0, 80]];
    const targets = [[x - 120, y - 400], [x + 120, y - 400], [x, y - 470], [x, y - 200]];
    ends.forEach(([ex, ey], i) => line(g, [[cx + ex * Math.cos(s), cy + ey + ex * Math.sin(s)], targets[i]], "rgba(240,240,255,0.7)", 3));
    person(g, x, y, 1.45, { shirt, hairStyle: hs, armL: 0.5 + s * 3, armR: 0.5 - s * 3, look: s * 4, tilt: s * 0.3 });
    // Roboterhand über dem Kreuz
    g.save(); g.translate(cx, cy - 120);
    fillRR(g, -60, -400, 120, 330, 40, "#5d6886"); fillRR(g, -90, -110, 180, 120, 40, "#9aa6c4");
    for (let k = -1; k <= 1; k++) fillRR(g, k * 50 - 18, -10, 36, 90, 18, "#9aa6c4");
    circle(g, 0, -60, 14, C.cyan); glow(g, 0, -60, 50, C.cyan, 0.8);
    g.restore();
  });
  g.restore();
  cap();
} };

// R · Kopf im Profil: Schallwellen aus dem Mund – „keinem Menschen“: innen ein Chip
const R = { at: L(25) - 0.05, cap: { color: C.mint, y: 1580 }, draw(g, t, lt, cap) {
  spotlight(g, "#2a1458", "#05030c", { y: 860, r: 1000 });
  const chip = ramp(t, find(26, "keinem"), 0.6);
  g.save();
  headProfile(g, W / 2 - 60, 860, 1.25, "#0a0714", mix("#7a5cff", C.cyan, chip));
  g.restore();
  // Schallwellen
  for (let i = 0; i < 4; i++) {
    const p = ((t * 0.9 + i * 0.25) % 1), a = (1 - p) * ramp(t, L(26), 0.3) * (t < LE(26) + 0.3 ? 1 : 0);
    g.save(); g.globalAlpha = a; ring(g, W / 2 + 300, 1010, 40 + p * 260, 8, C.cyan, -0.6, 0.6); g.restore();
  }
  // Chip im Kopf
  if (chip > 0) {
    const cx = W / 2 - 20, cy = 760;
    g.save(); g.globalAlpha = chip;
    const r = rng(26);
    for (let i = 0; i < 14; i++) {
      const a = r() * Math.PI * 2, d = 120 + r() * 160;
      line(g, [[cx, cy], [cx + Math.cos(a) * d * 0.6, cy + Math.sin(a) * d * 0.6], [cx + Math.cos(a) * d, cy + Math.sin(a) * d * 0.6]], "rgba(88,230,255,0.75)", 5);
      circle(g, cx + Math.cos(a) * d, cy + Math.sin(a) * d * 0.6, 9, C.cyan);
    }
    fillRR(g, cx - 80, cy - 80, 160, 160, 22, "#123a5a"); ring(g, cx, cy, 40, 10, C.cyan);
    glow(g, cx, cy, 260, "rgba(88,230,255,0.9)", 0.6);
    g.restore();
  } else glow(g, W / 2 - 20, 760, 120, "rgba(255,210,140,0.9)", 0.5 + 0.2 * Math.sin(t * 4));
  cap();
} };

const SHOTS = [A, B, C1, C2, D, E, F, G, Hs, I, J, K, Ls, M, N, O, P, Q, R];
const END = V.lines[V.lines.length - 1].t1 + 0.25;   // nach dem letzten Wort: Schnitt auf Schwarz (wie Referenz)

// ============================================================ Untertitel ===
function wordAt(t) {
  const ws = V.words;
  for (let i = ws.length - 1; i >= 0; i--) {
    if (t >= ws[i].t0) {
      const next = ws[i + 1];
      const hold = next ? Math.min(next.t0, ws[i].t1 + 0.35) : ws[i].t1 + 0.3;
      return t < hold ? ws[i].w : null;
    }
  }
  return null;
}

// ================================================================= Frame ===
const XF = 0.16;   // Überblendung zwischen Shots
function drawShot(ctx, s, t, idx, withCap = true) {
  const next = SHOTS[idx + 1], lt = t - s.at, dur = (next ? next.at : END) - s.at;
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  const z = 1 + 0.045 * clamp(lt / dur);                 // langsamer Zoom (Ken Burns)
  ctx.translate(W / 2, H / 2); ctx.scale(z, z); ctx.translate(-W / 2, -H / 2);
  let drawn = false;
  const cap = () => {
    drawn = true;
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
    if (withCap) caption(ctx, wordAt(t), s.cap);
    ctx.restore();
  };
  s.draw(ctx, t, lt, cap);
  if (!drawn) cap();
  ctx.restore();
}

function renderAt(t) {
  t = clamp(t, 0, DURATION);
  g.setTransform(1, 0, 0, 1, 0, 0);
  if (t >= END) { g.fillStyle = "#000"; g.fillRect(0, 0, W, H); return; }
  let i = 0;
  while (i + 1 < SHOTS.length && t >= SHOTS[i + 1].at) i++;
  const s = SHOTS[i];
  if (i > 0 && t - s.at < XF) {
    drawShot(g, SHOTS[i - 1], t, i - 1, false);
    drawShot(gb, s, t, i);
    g.save(); g.globalAlpha = smooth((t - s.at) / XF); g.drawImage(buf, 0, 0); g.restore();
    // kurzer heller Blitz wie in der Referenz
    g.save(); g.globalAlpha = 0.18 * Math.sin(((t - s.at) / XF) * Math.PI); g.fillStyle = "#fff"; g.fillRect(0, 0, W, H); g.restore();
  } else drawShot(g, s, t, i);
  finish(g, t);
  if (t < 0.12) { g.fillStyle = `rgba(0,0,0,${1 - t / 0.12})`; g.fillRect(0, 0, W, H); }
}

window.addEventListener("hf-seek", (e) => renderAt(e.detail.time));
document.fonts.load("900 100px Cap").then(() => renderAt(window.__hfThreeTime || 0));
renderAt(window.__hfThreeTime || 0);
export { SHOTS, renderAt };
