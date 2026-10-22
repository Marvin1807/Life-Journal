// Sets für "aufwachen-1926": Berlin, Herbst 1926. Schlafzimmer (Anfang, Abend, Loop), Fenster zur Straße,
// Küche mit Kohleherd und Waschschüssel, Bäckerei, Gehweg, Fernsprechamt, Stummfilmkino, Wohnzimmer mit
// Detektor-Radio. Figuren mit freundlichen Gesichtern (folk aus internet-weg), hier zusätzlich mit Hut,
// Mantel, Schürze und Kopfhörer. Nur für dieses Video, lib/ bleibt unverändert.
import { THREE, rng, clamp, smooth, lerp, building, windowTextures, glowTexture } from "./lib/lowpoly.js";
import { mat, basic, box, cyl, canvasTexture, textPanel, tileTexture } from "./lib/props.js";

// ================================================================ Figuren ===
const BASE = 0.88, HEAD = 1.56;
// name, size, pivot, offset, Farbe, Gruppe (0 = unten, 1 = Oberkörper, 2 = Kopf)
const PARTS = [
  ["legL", [0.17, 0.86, 0.2], [-0.11, BASE, 0], [0, -0.43, 0], "pants", 0],
  ["legR", [0.17, 0.86, 0.2], [0.11, BASE, 0], [0, -0.43, 0], "pants", 0],
  ["torso", [0.48, 0.66, 0.27], [0, BASE, 0], [0, 0.34, 0], "shirt", 1],
  ["coat", [0.5, 0.5, 0.31], [0, BASE, 0], [0, -0.2, 0], "shirt", 1],
  ["collar", [0.3, 0.07, 0.29], [0, BASE, 0], [0, 0.68, 0.005], "collar", 1],
  ["apron", [0.42, 0.88, 0.02], [0, BASE, 0], [0, 0.02, 0.145], "apron", 1],
  ["armL", [0.12, 0.58, 0.14], [-0.31, 1.48, 0], [0, -0.28, 0], "shirt", 1],
  ["armR", [0.12, 0.58, 0.14], [0.31, 1.48, 0], [0, -0.28, 0], "shirt", 1],
  ["handL", [0.1, 0.1, 0.1], [-0.31, 1.48, 0], [0, -0.62, 0], "skin", 1],
  ["handR", [0.1, 0.1, 0.1], [0.31, 1.48, 0], [0, -0.62, 0], "skin", 1],
  ["head", [0.23, 0.27, 0.24], [0, HEAD, 0], [0, 0.15, 0], "skin", 2],
  ["hair", [0.25, 0.1, 0.27], [0, HEAD, 0], [0, 0.31, -0.002], "hair", 2],
  ["hairBack", [0.25, 0.3, 0.07], [0, HEAD, 0], [0, 0.14, -0.13], "hair", 2],
  ["beard", [0.235, 0.09, 0.06], [0, HEAD, 0], [0, 0.05, 0.105], "beard", 2],
  ["eyeL", [0.034, 0.042, 0.01], [0, HEAD, 0], [-0.052, 0.175, 0.121], "eye", 2],
  ["eyeR", [0.034, 0.042, 0.01], [0, HEAD, 0], [0.052, 0.175, 0.121], "eye", 2],
  ["nose", [0.034, 0.05, 0.03], [0, HEAD, 0], [0, 0.125, 0.13], "nose", 2],
  ["mouth", [0.062, 0.016, 0.01], [0, HEAD, 0], [0, 0.072, 0.121], "mouth", 2],
  ["mcL", [0.018, 0.016, 0.01], [0, HEAD, 0], [-0.037, 0.08, 0.121], "mouth", 2],
  ["mcR", [0.018, 0.016, 0.01], [0, HEAD, 0], [0.037, 0.08, 0.121], "mouth", 2],
  ["cheekL", [0.042, 0.026, 0.008], [0, HEAD, 0], [-0.078, 0.112, 0.1205], "cheek", 2],
  ["cheekR", [0.042, 0.026, 0.008], [0, HEAD, 0], [0.078, 0.112, 0.1205], "cheek", 2],
  ["hatBrim", [0.36, 0.022, 0.38], [0, HEAD, 0], [0, 0.285, -0.005], "hat", 2],
  ["hatTop", [0.25, 0.14, 0.27], [0, HEAD, 0], [0, 0.36, -0.005], "hat", 2],
  ["hatBand", [0.256, 0.035, 0.276], [0, HEAD, 0], [0, 0.31, -0.005], "band", 2],
  ["phoneEar", [0.035, 0.07, 0.06], [0, HEAD, 0], [-0.13, 0.16, 0.0], "set", 2],
  ["phoneMic", [0.03, 0.03, 0.11], [0, HEAD, 0], [0, 0.05, 0.17], "set", 2],
];
// Herbst 1926: gedeckte, warme Mantel- und Hutfarben
export const COATS = ["#4a3a2e", "#5b4a3a", "#3b3f48", "#6b5a48", "#2c2a28", "#7a5a3a", "#5d6b3a", "#8a6a4a", "#40362e", "#6a4a3a", "#7a2e3e", "#3f5468", "#8a3b2a", "#9a7a5a"];
export const PANTS = ["#2c2a28", "#3b3f48", "#5b4a3a", "#2b3340", "#4a4038", "#40362e"];
export const SKINS = ["#f1c8a5", "#e2b08a", "#c68d64", "#f5d3b8", "#d9a07a", "#e8bf98"];
export const HAIRS = ["#2a1e17", "#4a3222", "#c9a16a", "#1a1a1a", "#7a5232", "#9a9a9a", "#a8552e"];
export const HATS = ["#2a2420", "#4a3a2e", "#5a4a3a", "#3a3430", "#6b5a48", "#2f3238", "#7a6a55"];
export const CLOCHES = ["#7a2e3e", "#3f5468", "#8a6a4a", "#5d4a6a", "#2f4a44", "#a8552e"];

export function folk(count, seed = 11) {
  const r = rng(seed);
  const group = new THREE.Group();
  const meshes = PARTS.map(([, size]) => {
    const m = new THREE.InstancedMesh(new THREE.BoxGeometry(...size), new THREE.MeshStandardMaterial({ roughness: 0.85, flatShading: true }), count);
    m.castShadow = true; m.receiveShadow = false; m.frustumCulled = false;
    m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    group.add(m);
    return m;
  });
  const looks = [];
  const col = new THREE.Color(), tmpC = new THREE.Color();
  /** o: { shirt, pants, skin, hair, long, beard, hat: 0 | "hut" | "cloche", hatColor, coat, apron, headset } */
  function look(i, o = {}) {
    const long = o.long ?? (r() < 0.45 ? r.range(0.6, 1.1) : 0);
    const hat = o.hat ?? (r() < 0.8 ? (long ? "cloche" : "hut") : 0);
    const L = { shirt: o.shirt ?? r.pick(COATS), pants: o.pants ?? r.pick(PANTS), skin: o.skin ?? r.pick(SKINS), hair: o.hair ?? r.pick(HAIRS),
      long, beard: o.beard ?? (long ? 0 : r() < 0.25 ? 1 : 0), hat, coat: o.coat ?? (r() < 0.75 ? 1 : 0), apron: o.apron ?? 0, headset: o.headset ?? 0 };
    L.hatColor = o.hatColor ?? (hat === "cloche" ? r.pick(CLOCHES) : r.pick(HATS));
    L.beardColor = o.beardColor ?? L.hair;
    looks[i] = L;
    const c = {
      pants: L.pants, shirt: L.shirt, skin: L.skin, hair: L.hair, beard: L.beardColor,
      eye: "#2a1c16", mouth: "#8a3b30", hat: L.hatColor, band: hat === "cloche" ? "#e8d9b5" : "#1a1714",
      collar: o.collar ?? "#ece4d2", apron: "#f4efe4", set: "#1d1d1f",
      nose: tmpC.set(L.skin).multiplyScalar(0.92).getHexString(),
      cheek: tmpC.set(L.skin).lerp(new THREE.Color("#f08a7a"), 0.45).getHexString(),
    };
    PARTS.forEach(([, , , , kind], p) => {
      let v = c[kind];
      if (typeof v === "string" && !v.startsWith("#")) v = "#" + v;
      meshes[p].setColorAt(i, col.set(v));
    });
    meshes.forEach((m) => { m.instanceColor.needsUpdate = true; });
    return L;
  }
  for (let i = 0; i < count; i++) look(i);

  const mRoot = new THREE.Matrix4(), mTw = new THREE.Matrix4(), mJ = new THREE.Matrix4(), mOff = new THREE.Matrix4(), mOut = new THREE.Matrix4();
  const mA = new THREE.Matrix4(), mB = new THREE.Matrix4();
  const q = new THREE.Quaternion(), e = new THREE.Euler(), v = new THREE.Vector3(), sc = new THREE.Vector3();
  const zero = new THREE.Matrix4().makeScale(0, 0, 0);
  /** s: { x, y, z, rotY, swing, armL, armR, spreadL, spreadR, twist, headYaw, headPitch, headTilt, sit, visible, scale, headScale, hatOff } */
  function set(i, s) {
    if (!s.visible) { meshes.forEach((m) => m.setMatrixAt(i, zero)); return; }
    const L = looks[i];
    const S = s.scale ?? 1, HS = s.headScale ?? 1;
    mRoot.compose(v.set(s.x, s.y ?? (s.sit ? -0.43 * S : 0), s.z), q.setFromEuler(e.set(0, s.rotY ?? 0, 0)), sc.setScalar(S));
    mA.makeTranslation(0, BASE, 0); mB.makeRotationY(s.twist || 0); mTw.multiplyMatrices(mA, mB); mA.makeTranslation(0, -BASE, 0); mTw.multiply(mA);
    const sw = s.swing || 0;
    const legs = s.sit ? -1.45 : null;
    const hatOn = L.hat && !s.hatOff;
    PARTS.forEach(([name, , pivot, off, , grp], p) => {
      let hide = false;
      if (name === "hairBack") hide = !L.long;
      if (name === "beard") hide = !L.beard;
      if (name === "hair") hide = hatOn && L.hat === "hut";
      if (name === "hatBrim" || name === "hatTop" || name === "hatBand") hide = !hatOn;
      if (name === "coat") hide = !L.coat || s.sit;
      if (name === "apron") hide = !L.apron;
      if (name === "phoneEar" || name === "phoneMic") hide = !L.headset;
      if (hide) { meshes[p].setMatrixAt(i, zero); return; }
      if (grp === 2) {
        e.set(s.headPitch || 0, s.headYaw || 0, s.headTilt || 0, "YXZ");
        mJ.compose(v.set(...pivot), q.setFromEuler(e), sc.setScalar(HS));
        mOff.makeTranslation(off[0], off[1], off[2]);
        if (name === "hairBack") { mOff.multiply(mA.makeTranslation(0, 0.15 - 0.15 * L.long, 0)); mOff.multiply(mA.makeScale(1, L.long, 1)); }
        if (L.hat === "cloche" && (name === "hatBrim")) { mOff.multiply(mA.makeTranslation(0, -0.01, 0)); mOff.multiply(mA.makeScale(0.8, 1.6, 0.8)); }
        if (L.hat === "cloche" && (name === "hatTop" || name === "hatBand")) { mOff.multiply(mA.makeTranslation(0, -0.03, 0)); mOff.multiply(mA.makeScale(1.04, 1.25, 1.04)); }
      } else {
        let ax = 0, az = 0;
        if (name === "legL") ax = legs ?? sw;
        else if (name === "legR") ax = legs ?? -sw;
        else if (name === "armL" || name === "handL") { ax = -sw * 0.8 - (s.armL ?? 0); az = -(s.spreadL || 0); }
        else if (name === "armR" || name === "handR") { ax = sw * 0.8 - (s.armR ?? 0); az = s.spreadR || 0; }
        else if (name === "coat") ax = 0;
        mJ.compose(v.set(...pivot), q.setFromEuler(e.set(ax, 0, az)), sc.setScalar(1));
        mOff.makeTranslation(off[0], off[1], off[2]);
      }
      mOut.copy(mRoot);
      if (grp > 0) mOut.multiply(mTw);
      mOut.multiply(mJ).multiply(mOff);
      meshes[p].setMatrixAt(i, mOut);
    });
  }
  function commit() { meshes.forEach((m) => { m.instanceMatrix.needsUpdate = true; }); }
  return { group, set, commit, look, count, looks };
}

// ============================================================ Hilfsmittel ===
const SANS = "Arial, 'DejaVu Sans', sans-serif";
const SERIF = "Georgia, 'DejaVu Serif', serif";
const HAND = "italic 700 {s}px Georgia, 'DejaVu Serif', serif";   // „handgeschrieben“
export const handFont = (s) => HAND.replace("{s}", s);

/** Fläche mit frei gezeichneter Canvas-Textur. Gibt { mesh, redraw } zurück. */
export function drawPanel(w, h, ppu, draw, { basicMat = true, double = false } = {}) {
  const ct = canvasTexture(Math.round(w * ppu), Math.round(h * ppu), draw);
  const m = basicMat
    ? new THREE.MeshBasicMaterial({ map: ct.tex, toneMapped: false, side: double ? THREE.DoubleSide : THREE.FrontSide })
    : new THREE.MeshStandardMaterial({ map: ct.tex, roughness: 0.9, side: double ? THREE.DoubleSide : THREE.FrontSide });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m);
  return { mesh, redraw: ct.redraw, tex: ct.tex };
}

function wallpaper(base = "#d9c39a", line = "#c4a878", dot = "#a8784a", seed = 3) {
  const { tex } = canvasTexture(256, 256, (c, w, h) => {
    c.fillStyle = base; c.fillRect(0, 0, w, h);
    c.fillStyle = line; for (let x = 0; x < w; x += 64) { c.fillRect(x + 4, 0, 6, h); c.fillRect(x + 14, 0, 2, h); }
    c.fillStyle = dot;
    for (let y = 12; y < h; y += 32) for (let x = 40; x < w; x += 64) {
      const yy = y + ((x - 40) / 64 % 2) * 16;
      c.beginPath(); c.moveTo(x, yy - 5); c.lineTo(x + 4, yy); c.lineTo(x, yy + 5); c.lineTo(x - 4, yy); c.fill();
    }
  });
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}
function planks(a = "#7a5434", b = "#6a462a", n = 8) {
  const { tex } = canvasTexture(256, 256, (c, w) => {
    for (let i = 0; i < n; i++) { c.fillStyle = i % 2 ? a : b; c.fillRect(0, i * w / n, w, w / n - 2); c.fillStyle = "rgba(0,0,0,0.25)"; c.fillRect(0, (i + 1) * w / n - 2, w, 2); c.fillRect(((i * 97) % 200) + 20, i * w / n, 2, w / n); }
  });
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}
function cobbles(seed = 5, tone = 120) {
  const r = rng(seed);
  const { tex } = canvasTexture(512, 512, (g, w) => {
    g.fillStyle = "#5a524a"; g.fillRect(0, 0, w, w);
    const s = w / 20;
    for (let y = 0; y < 20; y++) for (let x = 0; x < 21; x++) {
      const v = tone + Math.floor(r() * 36);
      g.fillStyle = `rgb(${v + 14},${v + 2},${v - 14})`;
      g.fillRect(x * s + (y % 2) * s / 2 + 2 - s / 2, y * s + 2, s - 4, s - 4);
    }
  });
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}
function plane(w, d, material, x, y, z, parent) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), material);
  m.rotation.x = -Math.PI / 2; m.position.set(x, y, z); m.receiveShadow = true; parent.add(m); return m;
}
function sphere(r, material, x, y, z, parent, sx = 1, sy = 1, sz = 1, detail = 1) {
  const m = new THREE.Mesh(new THREE.IcosahedronGeometry(r, detail), material);
  m.position.set(x, y, z); m.scale.set(sx, sy, sz); m.castShadow = true; parent.add(m); return m;
}

// ===================================================== Herbstlicher Baum ===
const LEAVES = ["#c8762e", "#d9a03a", "#b5522a", "#a8862f", "#d58a2c", "#8f6a2a"];
export function autumnTree(seed = 1, h = 6) {
  const r = rng(seed);
  const g = new THREE.Group();
  cyl(0.14, 0.22, h * 0.55, 6, mat("#4a3628"), 0, h * 0.275, 0, g);
  for (let i = 0; i < 4; i++) {
    const m = new THREE.Mesh(new THREE.IcosahedronGeometry(r.range(1.1, 1.6) * h / 6, 0), mat(r.pick(LEAVES)));
    m.position.set(r.range(-0.8, 0.8) * h / 6, h * r.range(0.66, 0.86), r.range(-0.8, 0.8) * h / 6);
    m.rotation.set(r() * 3, r() * 3, 0); m.castShadow = true; g.add(m);
  }
  return g;
}

// ================================================================ Handy ===
/** Handy mit hochaufgelöstem Bildschirm (liegt auf dem Nachttisch). */
export function bigPhone() {
  const g = new THREE.Group();
  box(0.074, 0.152, 0.009, mat("#17181c", { roughness: 0.3, metalness: 0.4 }), 0, 0, 0, g);
  box(0.0745, 0.1525, 0.004, mat("#2a2c31", { roughness: 0.35, metalness: 0.6 }), 0, 0, 0, g);
  const screen = canvasTexture(600, 1280, () => {});
  screen.tex.anisotropy = 8;
  const s = new THREE.Mesh(new THREE.PlaneGeometry(0.068, 0.145), new THREE.MeshBasicMaterial({ map: screen.tex, toneMapped: false, transparent: true }));
  s.position.z = 0.0052; g.add(s);
  g.traverse((o) => { if (o.isMesh) { o.castShadow = false; o.receiveShadow = false; } });
  g.userData.screen = screen; g.userData.screenMat = s.material;
  return g;
}

// ============================================================ Kleinkram ===
export function candle(h = 0.12) {
  const g = new THREE.Group();
  cyl(0.06, 0.07, 0.012, 12, mat("#b08a3a", { metalness: 0.6, roughness: 0.35 }), 0, 0.006, 0, g);   // Messinghalter
  const torus = new THREE.Mesh(new THREE.TorusGeometry(0.03, 0.006, 5, 10, Math.PI), mat("#b08a3a", { metalness: 0.6 })); torus.position.set(0.075, 0.03, 0); g.add(torus);
  cyl(0.018, 0.018, h, 10, mat("#f3ead2", { emissive: new THREE.Color("#ffcf8a"), emissiveIntensity: 0.25 }), 0, 0.012 + h / 2, 0, g);
  const glowMat = new THREE.SpriteMaterial({ map: glowTexture(), color: "#ffb860", transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
  const flame = new THREE.Sprite(glowMat); flame.position.set(0, 0.012 + h + 0.03, 0); flame.scale.set(0.08, 0.12, 1); g.add(flame);
  const core = new THREE.Mesh(new THREE.ConeGeometry(0.006, 0.026, 5), basic("#fff1c8")); core.position.set(0, 0.012 + h + 0.016, 0); g.add(core);
  const light = new THREE.PointLight("#ffa850", 2, 4, 1.4); light.position.set(0, 0.012 + h + 0.08, 0); g.add(light);
  return { group: g, flame, core, light, glowMat };
}

/** Mechanischer Wecker mit zwei Glocken, Zifferblatt 7:12. */
export function alarmClock() {
  const g = new THREE.Group();
  const brass = mat("#b8923e", { metalness: 0.6, roughness: 0.35 });
  const body = cyl(0.055, 0.055, 0.04, 16, brass, 0, 0.075, 0, g); body.rotation.x = Math.PI / 2;
  const face = drawPanel(0.094, 0.094, 2400, (c, w) => {
    c.fillStyle = "#f6efdc"; c.beginPath(); c.arc(w / 2, w / 2, w / 2 - 2, 0, 6.3); c.fill();
    c.fillStyle = "#1a1714"; c.textAlign = "center"; c.textBaseline = "middle"; c.font = `600 22px ${SERIF}`;
    for (let i = 1; i <= 12; i++) { const a = i / 12 * 6.283; c.fillText(String(i), w / 2 + Math.sin(a) * w * 0.38, w / 2 - Math.cos(a) * w * 0.38); }
    const hand = (a, len, wd) => { c.save(); c.translate(w / 2, w / 2); c.rotate(a); c.fillRect(-wd / 2, -len, wd, len + 8); c.restore(); };
    hand((7 + 12 / 60) / 12 * 6.283, w * 0.22, 7); hand(12 / 60 * 6.283, w * 0.33, 5);
    c.fillStyle = "#b02a20"; hand(7.2 / 12 * 6.283, w * 0.3, 2);
  });
  face.mesh.position.set(0, 0.075, 0.021); g.add(face.mesh);
  for (const s of [-1, 1]) {
    const bellM = new THREE.Mesh(new THREE.SphereGeometry(0.03, 10, 6, 0, 6.3, 0, Math.PI / 2), brass);
    bellM.position.set(s * 0.034, 0.128, 0); bellM.rotation.z = -s * 0.5; g.add(bellM);
    box(0.012, 0.03, 0.012, brass, s * 0.035, 0.018, 0, g).rotation.z = s * 0.4;
  }
  box(0.008, 0.03, 0.008, brass, 0, 0.14, 0, g);
  return g;
}

/** Abreißkalender: Freitag, 22. Oktober 1926. */
export function tearCalendar() {
  const g = new THREE.Group();
  box(0.26, 0.36, 0.015, mat("#6a4a2a"), 0, 0, -0.008, g);
  const p = drawPanel(0.23, 0.31, 1400, (c, w, h) => {
    c.fillStyle = "#f4ecd6"; c.fillRect(0, 0, w, h);
    c.fillStyle = "#9a2a22"; c.fillRect(0, 0, w, h * 0.16);
    c.fillStyle = "#fff4dc"; c.textAlign = "center"; c.textBaseline = "middle";
    c.font = `700 ${Math.round(h * 0.085)}px ${SERIF}`; c.fillText("OKTOBER", w / 2, h * 0.085);
    c.fillStyle = "#1c1a18"; c.font = `700 ${Math.round(h * 0.42)}px ${SERIF}`; c.fillText("22", w / 2, h * 0.43);
    c.font = `600 ${Math.round(h * 0.09)}px ${SERIF}`; c.fillText("Freitag", w / 2, h * 0.7);
    c.fillStyle = "#9a2a22"; c.font = `700 ${Math.round(h * 0.11)}px ${SERIF}`; c.fillText("1926", w / 2, h * 0.86);
    c.fillStyle = "rgba(0,0,0,0.15)"; for (let i = 0; i < 6; i++) c.fillRect(0, h - 3 - i * 3, w, 1);
  }, { basicMat: false });
  p.mesh.position.z = 0.002; g.add(p.mesh);
  cyl(0.006, 0.006, 0.01, 6, mat("#888"), 0, 0.2, 0, g).rotation.x = Math.PI / 2;
  return g;
}

/** Zettel zum Beschreiben: redraw(k) zeigt k (0..1) des Satzes. */
export function writingNote() {
  const TEXT = ["Wenn ich", "morgen", "aufwache …"];
  const total = TEXT.join("").length;
  const p = drawPanel(0.2, 0.15, 3000, () => {}, { basicMat: false });
  let last = -1;
  function draw(k) {
    const n = Math.round(clamp(k) * total);
    if (n === last) return; last = n;
    p.redraw((c, w, h) => {
      c.fillStyle = "#f3ead2"; c.fillRect(0, 0, w, h);
      c.strokeStyle = "rgba(90,110,160,0.35)"; c.lineWidth = 3; for (let y = h * 0.28; y < h; y += h * 0.24) { c.beginPath(); c.moveTo(0, y); c.lineTo(w, y); c.stroke(); }
      c.fillStyle = "#1e2a4a"; c.textAlign = "left"; c.textBaseline = "alphabetic"; c.font = handFont(Math.round(h * 0.2));
      let left = n;
      TEXT.forEach((line, i) => { if (left <= 0) return; c.fillText(line.slice(0, left), w * 0.08, h * (0.25 + i * 0.24)); left -= line.length; });
    });
  }
  draw(0);
  return { mesh: p.mesh, draw };
}

/** Bleistift (für die rechte Hand). */
export function pencil() {
  const g = new THREE.Group();
  const b = cyl(0.0045, 0.0045, 0.15, 6, mat("#d9a032"), 0, 0, 0, g); b.rotation.x = Math.PI / 2;
  const tip = new THREE.Mesh(new THREE.ConeGeometry(0.0045, 0.018, 6), mat("#e8c9a0")); tip.rotation.x = -Math.PI / 2; tip.position.z = -0.084; g.add(tip);
  return g;
}

// ===================================================== A: Schlafzimmer ===
// Bett längs z, Kopfende bei z = 0,9, Kissen bei z ≈ 0,55. Nachttisch links (x = −0,8), Wand bei x = −1,3 mit Kalender.
export function bedroom({ seed = 1001 } = {}) {
  const r = rng(seed);
  const g = new THREE.Group();
  const fl = planks("#7a5434", "#6c4a2c"); fl.repeat.set(4, 4);
  box(5, 0.04, 6, mat("#ffffff", { map: fl, roughness: 0.7 }), 0.6, -0.02, -0.8, g);
  const wp = wallpaper("#d8c09a", "#c7aa7c", "#a07048"); wp.repeat.set(4, 2);
  const wall = new THREE.MeshStandardMaterial({ map: wp, roughness: 0.95 });
  box(0.06, 3.1, 6, wall, -1.48, 1.55, -0.8, g);         // linke Wand (Kalender)
  box(5, 3.1, 0.06, wall, 0.6, 1.55, 1.0, g);            // Wand hinter dem Kopfende
  box(0.06, 3.1, 6, wall, 3.1, 1.55, -0.8, g);
  // Rückwand mit Fenster (z = −3,8)
  const wpB = wp.clone(); wpB.needsUpdate = true;
  box(1.7, 3.1, 0.06, wall, -0.5, 1.55, -3.8, g); box(1.7, 3.1, 0.06, wall, 2.3, 1.55, -3.8, g);
  box(1.1, 0.95, 0.06, wall, 0.9, 0.475, -3.8, g); box(1.1, 0.75, 0.06, wall, 0.9, 2.725, -3.8, g);
  const winGlass = new THREE.MeshStandardMaterial({ color: "#c9d4dc", emissive: new THREE.Color("#ffe2b0"), emissiveIntensity: 1, roughness: 0.2 });
  box(1.1, 1.4, 0.03, winGlass, 0.9, 1.65, -3.84, g);
  const frameM = mat("#efe6d4");
  for (const x of [0.36, 0.9, 1.44]) box(0.06, 1.4, 0.08, frameM, x, 1.65, -3.8, g);
  for (const y of [0.95, 1.65, 2.35]) box(1.14, 0.06, 0.08, frameM, 0.9, y, -3.8, g);
  for (const x of [0.15, 1.65]) box(0.42, 2.3, 0.05, mat("#8a3b2a"), x, 1.75, -3.72, g);   // Vorhänge
  box(1.9, 0.05, 0.08, mat("#5a3a22"), 0.9, 2.92, -3.72, g);
  box(5, 0.06, 6, mat("#ece2cc"), 0.6, 3.1, -0.8, g);   // Decke
  // Bett
  const wood = mat("#6a4224", { roughness: 0.6 });
  box(1.1, 0.35, 2.15, wood, 0, 0.25, -0.15, g);
  box(1.12, 1.15, 0.08, wood, 0, 0.575, 0.88, g);       // Kopfteil
  box(0.9, 0.06, 0.05, mat("#8a5a32"), 0, 1.12, 0.85, g);
  box(1.12, 0.75, 0.08, wood, 0, 0.375, -1.24, g);      // Fußteil
  box(1.02, 0.14, 2.05, mat("#efe8da"), 0, 0.48, -0.15, g);  // Matratze/Laken
  const pillow = box(0.78, 0.13, 0.42, mat("#f6f1e6", { roughness: 1 }), 0, 0.6, 0.6, g);
  pillow.scale.set(1, 1, 1);
  sphere(0.2, mat("#f6f1e6", { roughness: 1 }), -0.22, 0.6, 0.58, g, 1.0, 0.38, 1.0);
  sphere(0.2, mat("#f6f1e6", { roughness: 1 }), 0.22, 0.6, 0.58, g, 1.0, 0.38, 1.0);
  const duvet = box(1.06, 0.2, 1.5, mat("#e8d9b8", { roughness: 1 }), 0, 0.62, -0.45, g);
  for (let i = 0; i < 5; i++) box(1.07, 0.01, 0.03, mat("#c9a878"), 0, 0.725, -1.1 + i * 0.32, g);   // Karomuster
  // Nachttisch
  const ns = new THREE.Group(); ns.position.set(-0.95, 0, 0.5); g.add(ns);
  box(0.46, 0.6, 0.42, mat("#5a3a22", { roughness: 0.6 }), 0, 0.3, 0, ns);
  box(0.5, 0.03, 0.46, mat("#6e4a2c", { roughness: 0.5 }), 0, 0.615, 0, ns);
  box(0.36, 0.16, 0.01, mat("#4a2e1a"), 0, 0.45, 0.215, ns).rotation.y = Math.PI / 2 * 0;
  sphere(0.012, mat("#b8923e", { metalness: 0.6 }), 0, 0.45, 0.225, ns);
  // Lampe über dem Bett (Glühbirne mit Stoffschirm)
  cyl(0.008, 0.008, 0.9, 5, mat("#2a2a2a"), 0.2, 2.65, -0.6, g);
  const shade = cyl(0.12, 0.3, 0.2, 10, mat("#f0dcb0", { emissive: new THREE.Color("#ffc070"), emissiveIntensity: 0.0, side: THREE.DoubleSide }), 0.2, 2.15, -0.6, g);
  // Kleiderschrank, Stuhl mit Kleidung, Bild
  box(1.3, 2.2, 0.6, mat("#5e3c22", { roughness: 0.6 }), 2.4, 1.1, -2.6, g);
  for (const x of [2.1, 2.7]) box(0.5, 1.8, 0.02, mat("#6e4a2c"), x, 1.2, -2.29, g);
  const chair = new THREE.Group(); chair.position.set(-1.0, 0, -1.4); chair.rotation.y = 0.5; g.add(chair);
  box(0.45, 0.05, 0.45, wood, 0, 0.46, 0, chair); box(0.45, 0.55, 0.05, wood, 0, 0.75, -0.2, chair);
  for (const [a, b] of [[-0.2, -0.2], [0.2, -0.2], [-0.2, 0.2], [0.2, 0.2]]) box(0.04, 0.46, 0.04, wood, a, 0.23, b, chair);
  box(0.42, 0.06, 0.4, mat("#4a5a6a"), 0, 0.51, 0.02, chair);    // gefaltete Hose
  const pic = drawPanel(0.5, 0.38, 300, (c, w, h) => { c.fillStyle = "#c9b48a"; c.fillRect(0, 0, w, h); c.fillStyle = "#7a8a5a"; c.fillRect(0, h * 0.55, w, h * 0.45); c.fillStyle = "#e8d6a8"; c.beginPath(); c.arc(w * 0.3, h * 0.35, 18, 0, 6.3); c.fill(); c.strokeStyle = "#8a6a3a"; c.lineWidth = 14; c.strokeRect(0, 0, w, h); }, { basicMat: false });
  pic.mesh.rotation.y = Math.PI / 2; pic.mesh.position.set(-1.44, 1.75, -0.7); g.add(pic.mesh);
  const cal = tearCalendar(); cal.rotation.y = Math.PI / 2; cal.position.set(-1.44, 1.1, 0.52); g.add(cal);
  return { group: g, nightstandTop: new THREE.Vector3(-0.95, 0.63, 0.5), shade, winGlass };
}

// ========================================================== Straße 1926 ===
/** Pferdefuhrwerk (Vorderseite +z). update(t) bewegt Beine und Räder. */
export function horseCart(seed = 1, { load = "barrels", horseColor } = {}) {
  const r = rng(seed);
  const g = new THREE.Group();
  const hc = horseColor || r.pick(["#6a4026", "#4a2e1c", "#8a5a34", "#3a2a22"]);
  const hm = mat(hc), dark = mat("#2a1d14");
  const horse = new THREE.Group(); horse.position.z = 1.6; g.add(horse);
  box(0.5, 0.58, 1.35, hm, 0, 1.25, 0, horse);
  const neck = box(0.28, 0.75, 0.34, hm, 0, 1.65, 0.62, horse); neck.rotation.x = 0.55;
  const head = box(0.24, 0.24, 0.55, hm, 0, 1.92, 0.95, horse); head.rotation.x = 0.55;
  box(0.06, 0.12, 0.05, hm, -0.08, 2.12, 0.82, horse); box(0.06, 0.12, 0.05, hm, 0.08, 2.12, 0.82, horse);
  box(0.06, 0.55, 0.3, dark, 0, 1.75, 0.5, horse).rotation.x = 0.55;   // Mähne
  const tail = box(0.1, 0.6, 0.1, dark, 0, 1.15, -0.72, horse); tail.rotation.x = -0.35;
  box(0.52, 0.12, 0.3, mat("#3a2418"), 0, 1.55, 0.3, horse);           // Kummet
  const legs = [];
  for (const [x, z] of [[-0.15, 0.5], [0.15, 0.5], [-0.15, -0.5], [0.15, -0.5]]) {
    const p = new THREE.Group(); p.position.set(x, 1.0, z); horse.add(p);
    box(0.12, 1.0, 0.14, hm, 0, -0.5, 0, p); box(0.13, 0.1, 0.16, dark, 0, -0.97, 0.01, p);
    legs.push(p);
  }
  // Wagen
  const cart = new THREE.Group(); cart.position.z = -0.3; g.add(cart);
  const wood = mat("#7a5232"), wood2 = mat("#5a3a22");
  box(1.3, 0.12, 2.2, wood, 0, 0.85, 0, cart);
  for (const s of [-1, 1]) box(0.05, 0.3, 2.2, wood2, s * 0.65, 1.05, 0, cart);
  box(1.3, 0.3, 0.05, wood2, 0, 1.05, -1.1, cart);
  for (const s of [-1, 1]) { const sh = box(0.05, 0.05, 1.6, wood2, s * 0.3, 1.05, 1.6, cart); sh.rotation.x = -0.12; }
  box(1.0, 0.1, 0.35, wood2, 0, 1.3, 0.9, cart);                      // Kutschbock
  const wheels = [];
  for (const [x, z, rr] of [[-0.72, 0.65, 0.42], [0.72, 0.65, 0.42], [-0.72, -0.7, 0.5], [0.72, -0.7, 0.5]]) {
    const w = new THREE.Group(); w.position.set(x, rr, z); cart.add(w);
    const tor = new THREE.Mesh(new THREE.TorusGeometry(rr, 0.035, 4, 14), wood2); tor.rotation.y = Math.PI / 2; w.add(tor);
    for (let k = 0; k < 4; k++) { const sp = box(0.03, rr * 2, 0.03, wood2, 0, 0, 0, w); sp.rotation.x = k * Math.PI / 4; }
    wheels.push({ w, rr });
  }
  if (load === "barrels") {
    for (let k = 0; k < 4; k++) { const b = cyl(0.25, 0.25, 0.5, 10, mat("#8a5a32"), (k % 2 ? 0.28 : -0.28), 1.18, -0.2 - Math.floor(k / 2) * 0.6, cart); b.rotation.z = 0; box(0.52, 0.03, 0.52, mat("#3a3a3a"), b.position.x, 1.3, b.position.z, cart).scale.set(1, 1, 1); }
  } else {
    for (let k = 0; k < 5; k++) { const s = sphere(0.24, mat(r.pick(["#c9b48a", "#b8a074", "#d6c49a"])), r.range(-0.35, 0.35), 1.12, r.range(-0.9, 0.3), cart, 1.2, 0.7, 1.4, 0); s.rotation.y = r() * 3; }
  }
  // Kutscher (einfach, Rücken/Seite)
  const drv = new THREE.Group(); drv.position.set(0, 1.35, 0.9); cart.add(drv);
  const coatC = mat(r.pick(["#3b3f48", "#4a3a2e", "#5b4a3a"]));
  box(0.42, 0.55, 0.3, coatC, 0, 0.3, 0, drv); box(0.22, 0.24, 0.22, mat("#e2b08a"), 0, 0.72, 0, drv);
  box(0.34, 0.02, 0.36, mat("#2a2420"), 0, 0.85, 0, drv); box(0.24, 0.12, 0.25, mat("#2a2420"), 0, 0.91, 0, drv);
  for (const s of [-1, 1]) { const a = box(0.1, 0.45, 0.12, coatC, s * 0.25, 0.32, 0.18, drv); a.rotation.x = -1.0; }
  box(0.3, 0.12, 0.4, coatC, 0, 0.0, 0.2, drv);
  return {
    group: g,
    update(t, speed = 2) {
      const ph = t * speed * 2.2;
      legs.forEach((p, i) => { p.rotation.x = 0.35 * Math.sin(ph + (i === 0 || i === 3 ? 0 : Math.PI)); });
      horse.position.y = 0.02 * Math.abs(Math.sin(ph));
      head.rotation.x = 0.55 + 0.05 * Math.sin(ph * 2);
      wheels.forEach(({ w, rr }) => { w.rotation.x = -(t * speed) / rr; });
      tail.rotation.z = 0.1 * Math.sin(t * 2.3 + seed);
    },
  };
}

/** Alte Straßenbahn (Vorderseite +z), Länge ~10 m. */
export function tram({ line = "3", dest = "Alexanderplatz" } = {}) {
  const g = new THREE.Group();
  const cream = mat("#e9d9a6", { roughness: 0.6 }), dark = mat("#6a3a24", { roughness: 0.6 });
  const L = 10;
  box(2.1, 0.95, L, dark, 0, 0.85, 0, g);
  box(2.12, 0.08, L, cream, 0, 1.36, 0, g);
  const glass = new THREE.MeshStandardMaterial({ color: "#2c3038", emissive: new THREE.Color("#5a4a30"), emissiveIntensity: 0.35, roughness: 0.15 });
  box(2.06, 0.85, L - 0.3, glass, 0, 1.82, 0, g);
  for (let z = -L / 2 + 0.2; z <= L / 2 - 0.1; z += 1.05) for (const s of [-1, 1]) box(0.04, 0.85, 0.1, cream, s * 1.05, 1.82, z, g);
  box(2.12, 0.35, L, cream, 0, 2.42, 0, g);
  box(1.5, 0.25, L - 1.5, mat("#8a8a84"), 0, 2.7, 0, g);   // Oberlicht
  box(2.12, 0.14, L + 0.1, mat("#4a4a48"), 0, 2.64, 0, g);
  box(1.9, 0.25, 0.1, mat("#2a2a2a"), 0, 0.3, 0, g).scale.set(1, 1, L * 9);
  // Stromabnehmer (Lyra-Bügel)
  const bug = box(0.05, 0.05, 2.2, mat("#2a2a2a"), 0, 3.4, -0.6, g); bug.rotation.x = -0.6;
  box(1.0, 0.05, 0.05, mat("#2a2a2a"), 0, 4.0, 0.25, g);
  const sign = textPanel(1.6, 0.32, 200, "#1c1a18", [{ text: `${line}  ${dest}`, size: 40, y: 0.55, color: "#f4e6b8", font: SERIF, weight: 700 }]);
  sign.position.set(0, 2.42, L / 2 + 0.07); g.add(sign);
  box(0.25, 0.25, 0.08, basic("#ffe6a8"), 0, 1.0, L / 2 + 0.05, g);
  box(1.6, 0.1, 0.4, dark, 0, 0.35, L / 2 + 0.15, g);
  g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  return g;
}

/** Automobil der 20er (Vorderseite +z). */
export function oldCar(seed = 1) {
  const r = rng(seed);
  const g = new THREE.Group();
  const paint = mat(r.pick(["#1d1c1e", "#2a3a2e", "#3a2420", "#24304a"]), { roughness: 0.45, metalness: 0.2 });
  const blackM = mat("#151515");
  box(1.5, 0.4, 3.6, paint, 0, 0.75, 0, g);
  box(0.9, 0.55, 1.2, paint, 0, 1.1, 1.0, g);              // Motorhaube
  box(0.9, 0.6, 0.06, mat("#c9c3b0", { metalness: 0.7, roughness: 0.3 }), 0, 1.1, 1.62, g);   // Kühler
  box(1.45, 0.95, 1.7, paint, 0, 1.45, -0.55, g);          // Kabine
  box(1.47, 0.5, 1.4, new THREE.MeshStandardMaterial({ color: "#22262c", roughness: 0.15, metalness: 0.5 }), 0, 1.6, -0.55, g);
  box(1.5, 0.06, 1.75, blackM, 0, 1.95, -0.55, g);
  for (const s of [-1, 1]) {
    const fender = box(0.32, 0.08, 1.2, blackM, s * 0.72, 0.95, 1.05, g); fender.rotation.x = 0.25;
    box(0.3, 0.06, 1.4, blackM, s * 0.78, 0.55, 0, g);    // Trittbrett
    const lamp = cyl(0.1, 0.1, 0.12, 10, mat("#c9c3b0", { metalness: 0.7 }), s * 0.6, 1.25, 1.55, g); lamp.rotation.x = Math.PI / 2;
    box(0.14, 0.14, 0.01, basic("#fff2c8"), s * 0.6, 1.25, 1.62, g);
  }
  const wheels = [];
  for (const [x, z] of [[-0.75, 1.15], [0.75, 1.15], [-0.75, -1.15], [0.75, -1.15]]) {
    const w = new THREE.Group(); w.position.set(x, 0.38, z); g.add(w);
    const tire = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.07, 6, 14), blackM); tire.rotation.y = Math.PI / 2; w.add(tire);
    for (let k = 0; k < 6; k++) { const sp = box(0.02, 0.6, 0.025, mat("#d9cfb4"), 0, 0, 0, w); sp.rotation.x = k * Math.PI / 6; }
    wheels.push(w);
  }
  g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  return { group: g, update(t, speed) { wheels.forEach((w) => { w.rotation.x = -(t * speed) / 0.38; }); } };
}

/** Litfaßsäule mit Plakaten. */
export function litfass(seed = 1) {
  const r = rng(seed);
  const g = new THREE.Group();
  const { tex } = canvasTexture(1024, 512, (c, w, h) => {
    c.fillStyle = "#d9cfb0"; c.fillRect(0, 0, w, h);
    const posters = [
      ["#9a2a22", "#f4e6b8", "GROSSER", "BALL", "Sonnabend 8 Uhr"],
      ["#1d3a5a", "#f2c94c", "KONZERT", "im Park", "Eintritt frei"],
      ["#e8d9a6", "#1c1a18", "LICHT-", "SPIELE", "Neues Programm"],
      ["#2f4a2e", "#f4e6b8", "VARIETÉ", "Abend", "täglich 20 Uhr"],
      ["#c98b3a", "#1c1a18", "TANZ-", "TEE", "jeden Sonntag"],
    ];
    const pw = w / posters.length;
    posters.forEach(([bg, fg, a, b, s], i) => {
      const x = i * pw + 10, y = 30 + (i % 2) * 20, ph = h - 80;
      c.fillStyle = bg; c.fillRect(x, y, pw - 20, ph);
      c.fillStyle = fg; c.textAlign = "center"; c.textBaseline = "middle";
      c.font = `800 46px ${SERIF}`; c.fillText(a, x + pw / 2 - 10, y + ph * 0.25); c.fillText(b, x + pw / 2 - 10, y + ph * 0.42);
      c.font = `500 22px ${SERIF}`; c.fillText(s, x + pw / 2 - 10, y + ph * 0.75);
      c.strokeStyle = fg; c.lineWidth = 4; c.strokeRect(x + 10, y + 10, pw - 40, ph - 20);
    });
  });
  const col = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 2.4, 20, 1, true), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9 }));
  col.position.y = 1.55; col.castShadow = true; g.add(col);
  const green = mat("#2f4a3a");
  cyl(0.66, 0.68, 0.35, 20, green, 0, 0.17, 0, g);
  cyl(0.7, 0.62, 0.12, 20, green, 0, 2.8, 0, g);
  const dome = new THREE.Mesh(new THREE.SphereGeometry(0.62, 16, 6, 0, 6.3, 0, Math.PI / 2), green); dome.position.y = 2.85; g.add(dome);
  sphere(0.07, mat("#b8923e", { metalness: 0.6 }), 0, 3.5, 0, g);
  return g;
}

export function gasLamp() {
  const g = new THREE.Group();
  const m = mat("#2a3a32", { metalness: 0.3 });
  cyl(0.06, 0.1, 3.4, 8, m, 0, 1.7, 0, g);
  cyl(0.12, 0.14, 0.25, 8, m, 0, 0.12, 0, g);
  const lantern = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.12, 0.45, 6), new THREE.MeshStandardMaterial({ color: "#f4e2b0", emissive: new THREE.Color("#ffc870"), emissiveIntensity: 0.15, roughness: 0.3 }));
  lantern.position.y = 3.65; g.add(lantern);
  const cap = new THREE.Mesh(new THREE.ConeGeometry(0.27, 0.2, 6), m); cap.position.y = 3.98; g.add(cap);
  return { group: g, lantern };
}

/**
 * Berliner Straße 1926 entlang x. Eigene Hauswand bei z = 0, Gehweg z 0…−3, Fahrbahn z −3…−13 (Gleise bei z = −8),
 * Gehweg gegenüber z −13…−16, Häuser gegenüber ab z = −16.
 */
export function street1926({ seed = 1101, tramOn = true, shops = false, near = true } = {}) {
  const r = rng(seed);
  const g = new THREE.Group();
  const cb = cobbles(seed, 112); cb.repeat.set(30, 5);
  plane(120, 10, new THREE.MeshStandardMaterial({ map: cb, roughness: 0.95 }), 0, 0, -8, g);
  const sw = tileTexture("#b9ad98", "#8f8574", 4); sw.repeat.set(60, 2);
  for (const z of [-1.5, -14.5]) {
    const s = plane(120, 3, new THREE.MeshStandardMaterial({ map: sw, roughness: 0.95 }), 0, 0.12, z, g);
    box(120, 0.14, 0.2, mat("#8a8274"), 0, 0.06, z > -5 ? -3.0 : -13.0, g);
  }
  // Gleise und Oberleitung
  if (tramOn) {
    for (const z of [-7.3, -8.7]) box(120, 0.03, 0.08, mat("#8a8a88", { metalness: 0.7, roughness: 0.3 }), 0, 0.015, z, g);
    const wire = box(120, 0.015, 0.015, mat("#222"), 0, 5.6, -8, g); wire.castShadow = false;
    for (let x = -50; x <= 50; x += 18) {
      cyl(0.08, 0.1, 6.2, 6, mat("#2a3a32"), x, 3.1, -13.3, g);
      const arm = box(0.05, 0.05, 5.5, mat("#2a3a32"), x, 5.8, -10.6, g); arm.castShadow = false;
    }
  }
  // Häuser
  const tex = windowTextures(seed, "altbau");
  const facades = [];
  const cols = ["#d8bf94", "#c9a97c", "#e2cfa6", "#bfa07a", "#d4b48a", "#c2a58a", "#e0c79c"];
  let x = -60;
  while (x < 60) {
    const w = r.range(9, 13), h = r.range(16, 19);
    const b = building({ w, h, d: 9, color: r.pick(cols), tex, roof: "#6a4a3a" }); b.mesh.position.set(x + w / 2, 0, -21); g.add(b.mesh); facades.push(b.material);
    box(w, 0.35, 0.4, mat("#a89070"), x + w / 2, h - 0.2, -16.4, g);   // Gesims
    if (near) { const n = building({ w, h, d: 9, color: r.pick(cols), tex, roof: "#6a4a3a" }); n.mesh.position.set(x + w / 2, 0, 4.5); g.add(n.mesh); }
    x += w;
  }
  // Ladenzeilen auf der eigenen Seite (für den Gehweg-Blick)
  if (shops) {
    const SH = [["Kolonialwaren", "#2f4a3a"], ["Hutmacher", "#6a2a22"], ["Friseur", "#1d3a5a"], ["Zigarren", "#4a3a2e"], ["Feinkost", "#5a4a2a"], ["Schuhmacher", "#3a2a4a"], ["Drogerie", "#2a4a4a"]];
    SH.forEach(([name, c], i) => {
      const sx = 6 - i * 6.2;
      box(5.4, 3.2, 0.12, mat(c), sx, 1.6, -0.06, g);
      const win = drawPanel(3.4, 1.9, 120, (cx, w, h) => {
        cx.fillStyle = "#3a3026"; cx.fillRect(0, 0, w, h);
        const rr = rng(seed + i);
        for (let k = 0; k < 9; k++) { cx.fillStyle = ["#c9a878", "#8a5a32", "#e8d9b5", "#6a2a22", "#2f4a3a", "#d9b45a"][k % 6]; const bx = 20 + rr() * (w - 80), by = h * 0.35 + rr() * h * 0.45; cx.fillRect(bx, by, 30 + rr() * 40, 26 + rr() * 50); }
        cx.fillStyle = "rgba(255,240,210,0.16)"; cx.fillRect(0, 0, w, h);
        cx.fillStyle = "rgba(255,255,255,0.25)"; cx.beginPath(); cx.moveTo(w * 0.1, 0); cx.lineTo(w * 0.3, 0); cx.lineTo(w * 0.1, h); cx.lineTo(0, h); cx.fill();
      }, { basicMat: false });
      win.mesh.position.set(sx - 0.6, 1.55, -0.13); win.mesh.rotation.y = Math.PI; g.add(win.mesh);
      box(0.9, 2.3, 0.06, mat("#4a2e1a"), sx + 1.9, 1.15, -0.13, g);
      const sign = textPanel(4.8, 0.55, 140, c, [{ text: name, size: 52, y: 0.56, color: "#f2dfa8", font: SERIF, weight: 700 }]);
      sign.position.set(sx, 2.85, -0.14); sign.rotation.y = Math.PI; g.add(sign);
      const aw = box(5.2, 0.06, 1.1, mat(i % 2 ? "#8a3b2a" : "#3f5e4a"), sx, 3.3, -0.55, g); aw.rotation.x = -0.35;
    });
  }
  // Bäume, Laternen, Litfaßsäule
  const trees = [];
  for (let tx = -48; tx < 50; tx += 9.5) for (const z of near && !shops ? [-2.6, -13.5] : [-13.5]) {
    const t = autumnTree(Math.floor(tx * 7 + z), r.range(6, 7.5)); t.position.set(tx + r.range(-1, 1), 0.12, z); g.add(t); trees.push(t);
  }
  const lamps = [];
  for (let lx = -45; lx < 50; lx += 14) for (const z of [-2.7, -13.4]) { const l = gasLamp(); l.group.position.set(lx + 4.7, 0.12, z); g.add(l.group); lamps.push(l); }
  return { group: g, facades, trees, lamps };
}

// ====================================================== B: Fensterrahmen ===
/** Fensterlaibung von innen (für den Blick auf die Straße). Öffnung x −0,6…0,6, y 0…1,5 (lokal), Wand bei z = 0. */
export function windowFrame() {
  const g = new THREE.Group();
  const wp = wallpaper("#cdb48c", "#bba07a", "#9a6a42"); wp.repeat.set(2, 1.5);
  const wall = new THREE.MeshStandardMaterial({ map: wp, roughness: 0.95 });
  box(1.6, 3, 0.1, wall, -1.4, 0.75, 0.25, g); box(1.6, 3, 0.1, wall, 1.4, 0.75, 0.25, g);
  box(1.2, 1.0, 0.1, wall, 0, -0.5, 0.25, g); box(1.2, 1.0, 0.1, wall, 0, 2.0, 0.25, g);
  const reveal = mat("#e6dcc6");
  for (const s of [-1, 1]) box(0.05, 1.5, 0.5, reveal, s * 0.62, 0.75, 0.0, g);
  box(1.3, 0.05, 0.5, reveal, 0, 1.52, 0.0, g);
  const sill = box(1.4, 0.06, 0.45, mat("#d9cfb8"), 0, -0.02, 0.22, g);
  // geöffnete Fensterflügel (nach innen)
  const frameM = mat("#f2eadb");
  for (const s of []) {
    const wing = new THREE.Group(); wing.position.set(s * 0.6, 0.75, 0.2); wing.rotation.y = s * 1.25; g.add(wing);
    const w = 0.6;
    box(0.04, 1.45, 0.05, frameM, -s * 0.02, 0, 0, wing); box(0.04, 1.45, 0.05, frameM, -s * (w - 0.02), 0, 0, wing);
    for (const y of [-0.7, 0, 0.7]) box(w, 0.04, 0.05, frameM, -s * w / 2, y, 0, wing);
    const gl = new THREE.Mesh(new THREE.PlaneGeometry(w - 0.04, 1.4), new THREE.MeshStandardMaterial({ color: "#c8d6e0", roughness: 0.05, metalness: 0.3, transparent: true, opacity: 0.35 }));
    gl.position.x = -s * w / 2; gl.rotation.y = Math.PI / 2 * 0; wing.add(gl);
  }
  // Spitzengardinen
  const lace = canvasTexture(256, 512, (c, w, h) => {
    c.clearRect(0, 0, w, h); c.fillStyle = "rgba(250,244,230,0.85)"; c.fillRect(0, 0, w, h);
    c.fillStyle = "rgba(255,255,255,0.0)";
    c.globalCompositeOperation = "destination-out";
    for (let y = 20; y < h; y += 40) for (let x = 16; x < w; x += 32) { c.beginPath(); c.arc(x + ((y / 40) % 2) * 16, y, 9, 0, 6.3); c.fill(); }
    c.globalCompositeOperation = "source-over";
  });
  for (const s of [-1, 1]) {
    const cu = new THREE.Mesh(new THREE.PlaneGeometry(0.45, 1.9, 6, 1), new THREE.MeshStandardMaterial({ map: lace.tex, transparent: true, side: THREE.DoubleSide, roughness: 1 }));
    const p = cu.geometry.attributes.position; for (let i = 0; i < p.count; i++) p.setZ(i, 0.04 * Math.sin(p.getX(i) * 40));
    cu.position.set(s * 0.82, 0.6, 0.38); g.add(cu);
  }
  box(2.0, 0.04, 0.04, mat("#5a3a22"), 0, 1.6, 0.4, g);
  // Blumentopf mit Geranie auf dem Sims
  cyl(0.08, 0.06, 0.14, 8, mat("#b5653a"), 0.42, 0.08, 0.2, g);
  for (let i = 0; i < 6; i++) sphere(0.05, mat(i % 2 ? "#3d6b3a" : "#c0392b"), 0.42 + Math.sin(i * 2.1) * 0.06, 0.2 + (i % 3) * 0.03, 0.2 + Math.cos(i * 2.1) * 0.05, g, 1, 1, 1, 0);
  return { group: g, sill };
}

// ============================================================== C: Küche ===
// Herd bei z = −0,75 (Front zur Kamera), Waschtisch links bei x = −1,0, Fenster links hinten.
export function kitchen() {
  const g = new THREE.Group();
  const ft = tileTexture("#c9b89a", "#8a7a62", 6); ft.repeat.set(5, 5);
  box(5, 0.04, 5, mat("#ffffff", { map: ft, roughness: 0.7 }), 0, -0.02, -0.8, g);
  const wt = tileTexture("#eae4d4", "#b9b09a", 10); wt.repeat.set(4, 1);
  const tileWall = new THREE.MeshStandardMaterial({ map: wt, roughness: 0.5 });
  const wall = mat("#d6c4a0");
  box(5, 1.3, 0.06, tileWall, 0, 0.65, -1.35, g); box(5, 1.8, 0.06, wall, 0, 2.2, -1.35, g);
  box(0.06, 3.1, 5, wall, -2.0, 1.55, -0.8, g); box(0.06, 3.1, 5, wall, 1.8, 1.55, -0.8, g);
  box(5, 0.06, 5, mat("#e8dcc4"), 0, 3.1, -0.8, g);
  // Fenster in der linken Wand
  const winGlass = new THREE.MeshStandardMaterial({ color: "#d9e2e8", emissive: new THREE.Color("#ffe6c0"), emissiveIntensity: 1.0 });
  box(0.03, 1.2, 0.9, winGlass, -1.98, 1.75, -0.7, g);
  for (const z of [-1.15, -0.7, -0.25]) box(0.06, 1.24, 0.05, mat("#f2eadb"), -1.96, 1.75, z, g);
  for (const y of [1.15, 1.75, 2.35]) box(0.06, 0.05, 0.94, mat("#f2eadb"), -1.96, y, -0.7, g);
  // Kohleherd (Küchenhexe)
  const stove = new THREE.Group(); stove.position.set(0.1, 0, -0.95); g.add(stove);
  const enamel = mat("#efe8d8", { roughness: 0.35 }), iron = mat("#26231f", { roughness: 0.6, metalness: 0.4 }), chrome = mat("#c9c3b0", { metalness: 0.8, roughness: 0.25 });
  box(1.0, 0.8, 0.62, enamel, 0, 0.42, 0, stove);
  box(1.04, 0.05, 0.66, iron, 0, 0.845, 0, stove);
  for (const [x, rr] of [[-0.22, 0.13], [0.2, 0.1]]) { cyl(rr, rr, 0.02, 14, mat("#3a3530", { metalness: 0.5 }), x, 0.875, 0.02, stove); cyl(rr * 0.55, rr * 0.55, 0.025, 12, iron, x, 0.88, 0.02, stove); }
  const rail = box(1.06, 0.025, 0.025, chrome, 0, 0.78, 0.36, stove);
  for (const x of [-0.5, 0.5]) box(0.025, 0.06, 0.06, chrome, x, 0.78, 0.33, stove);
  box(0.06, 0.4, 0.06, chrome, -0.48, 0.2, 0.32, stove);
  box(0.95, 0.06, 0.04, iron, 0, 0.06, 0.3, stove);
  // Feuerloch mit offener Tür
  const fireBox = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.22, 0.02), new THREE.MeshBasicMaterial({ color: "#ff8a2a" })); fireBox.position.set(-0.22, 0.55, 0.312); stove.add(fireBox);
  const embers = drawPanel(0.28, 0.2, 800, (c, w, h) => {
    const gr = c.createRadialGradient(w / 2, h * 0.8, 10, w / 2, h * 0.7, w * 0.7); gr.addColorStop(0, "#fff0a0"); gr.addColorStop(0.35, "#ff9a30"); gr.addColorStop(1, "#7a1a08");
    c.fillStyle = gr; c.fillRect(0, 0, w, h);
    c.fillStyle = "#2a1a12"; for (let i = 0; i < 7; i++) c.fillRect(10 + i * 32, h * 0.7 + (i % 2) * 12, 26, 14);
  });
  embers.mesh.position.set(-0.22, 0.55, 0.314); stove.add(embers.mesh);
  box(0.36, 0.04, 0.02, iron, -0.22, 0.68, 0.32, stove); box(0.36, 0.04, 0.02, iron, -0.22, 0.42, 0.32, stove);
  for (const x of [-0.39, -0.05]) box(0.04, 0.3, 0.02, iron, x, 0.55, 0.32, stove);
  const door = new THREE.Group(); door.position.set(-0.4, 0.55, 0.33); door.rotation.y = -1.9; stove.add(door);
  box(0.34, 0.26, 0.025, iron, 0.17, 0, 0, door); box(0.05, 0.03, 0.04, chrome, 0.3, 0, 0.03, door);
  box(0.3, 0.12, 0.02, iron, 0.22, 0.24, 0.31, stove);   // Aschekasten
  // Ofenrohr
  cyl(0.07, 0.07, 1.9, 10, iron, 0.32, 1.8, -0.2, stove);
  const elbow = cyl(0.07, 0.07, 0.3, 10, iron, 0.32, 2.75, -0.3, stove); elbow.rotation.x = Math.PI / 2;
  // Wasserkessel auf der Platte
  const kettle = new THREE.Group(); kettle.position.set(0.2, 0.89, 0.02); stove.add(kettle);
  const km = mat("#b8b2a0", { metalness: 0.7, roughness: 0.3 });
  sphere(0.11, km, 0, 0.09, 0, kettle, 1, 0.8, 1, 1);
  cyl(0.03, 0.035, 0.03, 8, km, 0, 0.18, 0, kettle);
  const spout = cyl(0.012, 0.025, 0.14, 6, km, 0.12, 0.12, 0, kettle); spout.rotation.z = -0.9;
  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.008, 4, 10, Math.PI), mat("#2a2420")); handle.position.y = 0.15; kettle.add(handle);
  const steam = [];
  const steamMat = new THREE.SpriteMaterial({ map: glowTexture(), color: "#ffffff", transparent: true, opacity: 0.35, depthWrite: false });
  for (let i = 0; i < 6; i++) { const s = new THREE.Sprite(steamMat.clone()); s.scale.set(0.12, 0.12, 1); stove.add(s); steam.push(s); }
  // Kohlenkasten mit Briketts
  const bin = new THREE.Group(); bin.position.set(0.85, 0, -0.75); g.add(bin);
  box(0.42, 0.45, 0.38, mat("#3a3a34", { metalness: 0.4 }), 0, 0.225, 0, bin);
  const brik = mat("#2a2622", { roughness: 0.9 });
  for (let i = 0; i < 9; i++) { const b = box(0.17, 0.05, 0.065, brik, -0.12 + (i % 3) * 0.12, 0.46 + Math.floor(i / 3) * 0.035, -0.12 + Math.floor(i / 3) * 0.11, bin); b.rotation.y = (i * 0.37) % 0.4 - 0.2; }
  // Waschtisch mit Schüssel und Krug
  const ws = new THREE.Group(); ws.position.set(-1.05, 0, -0.95); g.add(ws);
  const woodW = mat("#6a4224", { roughness: 0.6 });
  box(0.75, 0.78, 0.48, woodW, 0, 0.39, 0, ws); box(0.8, 0.04, 0.52, mat("#e8e2d8", { roughness: 0.3 }), 0, 0.8, 0, ws);
  box(0.8, 0.3, 0.04, woodW, 0, 0.97, -0.25, ws);
  const porcelain = mat("#f6f2ea", { roughness: 0.25 });
  const basin = new THREE.Mesh(new THREE.SphereGeometry(0.2, 14, 6, 0, 6.3, Math.PI / 2, Math.PI / 2), mat("#f6f2ea", { roughness: 0.25, side: THREE.DoubleSide }));
  basin.scale.set(1, 0.45, 1); basin.position.set(-0.08, 0.91, 0.02); basin.rotation.x = Math.PI; ws.add(basin);
  const water = new THREE.Mesh(new THREE.CircleGeometry(0.17, 14), mat("#a9c4cc", { roughness: 0.05, metalness: 0.2 })); water.rotation.x = -Math.PI / 2; water.position.set(-0.08, 0.86, 0.02); ws.add(water);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.012, 4, 18), mat("#3f6a9a")); rim.rotation.x = Math.PI / 2; rim.position.set(-0.08, 0.91, 0.02); ws.add(rim);
  const jug = new THREE.Group(); jug.position.set(0.24, 0.82, 0.05); ws.add(jug);
  cyl(0.06, 0.085, 0.12, 12, porcelain, 0, 0.06, 0, jug); cyl(0.07, 0.06, 0.12, 12, porcelain, 0, 0.18, 0, jug);
  const jr = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.008, 4, 14), mat("#3f6a9a")); jr.rotation.x = Math.PI / 2; jr.position.y = 0.24; jug.add(jr);
  const jh = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.01, 4, 10, Math.PI), porcelain); jh.position.set(0.075, 0.14, 0); jh.rotation.z = -Math.PI / 2; jug.add(jh);
  box(0.4, 0.5, 0.02, mat("#c9d2d6", { metalness: 0.6, roughness: 0.1 }), 0, 1.45, -0.24, ws);   // Spiegel
  box(0.46, 0.56, 0.015, woodW, 0, 1.45, -0.255, ws);
  box(0.06, 0.4, 0.12, mat("#f0ead8"), 0.42, 0.62, 0.15, ws);   // Handtuch
  // Regal mit Töpfen
  box(1.2, 0.03, 0.25, woodW, 1.0, 1.75, -1.2, g);
  for (let i = 0; i < 4; i++) cyl(0.08, 0.07, 0.12, 10, mat(["#3f6a9a", "#c9c3b0", "#8a3b2a", "#e8e2d8"][i]), 0.6 + i * 0.27, 1.83, -1.2, g);
  const fireLight = new THREE.PointLight("#ff8a3a", 1.5, 2.5, 1.5); fireLight.position.set(-0.12, 0.6, -0.4); g.add(fireLight);
  return { group: g, stove, fireLight, steam, door, embers };
}

// ============================================================ D: Bäckerei ===
// Theke bei z = −0,6 (Oberkante 0,95), Bäckerin hinter der Theke bei z ≈ −1,35. Kamera bei z ≈ 0,5.
export function bakery({ seed = 1201 } = {}) {
  const r = rng(seed);
  const g = new THREE.Group();
  const ft = tileTexture("#d9cdb4", "#9a8a6e", 8);
  ft.repeat.set(4, 4);
  // Schachbrettboden
  const { tex: chk } = canvasTexture(256, 256, (c, w) => { for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) { c.fillStyle = (x + y) % 2 ? "#e8dcc4" : "#6a4a3a"; c.fillRect(x * 32, y * 32, 32, 32); } });
  chk.wrapS = chk.wrapT = THREE.RepeatWrapping; chk.repeat.set(3, 3);
  box(6, 0.04, 6, mat("#ffffff", { map: chk, roughness: 0.5 }), 0, -0.02, -1, g);
  const wall = mat("#e2cfa6");
  box(6, 3.2, 0.06, wall, 0, 1.6, -2.3, g); box(0.06, 3.2, 6, wall, -2.3, 1.6, -1, g); box(0.06, 3.2, 6, wall, 2.3, 1.6, -1, g);
  box(6, 0.06, 6, mat("#efe4cc"), 0, 3.2, -1, g);
  // Regale mit Brot an der Rückwand
  const wood = mat("#7a5232", { roughness: 0.6 }), wood2 = mat("#5a3a22");
  box(3.4, 2.2, 0.35, wood2, 0, 1.1, -2.1, g);
  const crust = ["#b9773a", "#a8682e", "#c98a48", "#8a5226"];
  for (let k = 0; k < 4; k++) {
    const y = 0.75 + k * 0.42;
    box(3.3, 0.03, 0.36, wood, 0, y, -1.95, g);
    for (let i = 0; i < 9; i++) {
      const x = -1.45 + i * 0.36;
      if (k % 2 === 0) sphere(0.12, mat(r.pick(crust)), x, y + 0.08, -1.95, g, 1.3, 0.7, 0.9, 1);
      else for (let j = 0; j < 3; j++) sphere(0.05, mat("#d39a55"), x - 0.08 + j * 0.08, y + 0.04, -1.93 + (j % 2) * 0.05, g, 1.4, 0.75, 0.9, 1);
    }
  }
  // Schild
  const sign = textPanel(2.8, 0.42, 200, "#5a2a1a", [{ text: "BÄCKEREI · KONDITOREI", size: 54, y: 0.56, color: "#f2dfa8", font: SERIF, weight: 700 }]);
  sign.position.set(0, 2.62, -2.26); g.add(sign);
  // Preistafel
  const board = drawPanel(0.9, 0.62, 500, (c, w, h) => {
    c.fillStyle = "#1e2420"; c.fillRect(0, 0, w, h); c.strokeStyle = "#8a6a3a"; c.lineWidth = 18; c.strokeRect(0, 0, w, h);
    c.fillStyle = "#f2ead8"; c.textBaseline = "middle"; c.font = handFont(52); c.textAlign = "center"; c.fillText("Heute frisch", w / 2, h * 0.16);
    c.font = handFont(42); c.textAlign = "left";
    [["Schrippe", "4 Pf"], ["Roggenbrot", "40 Pf"], ["Pfannkuchen", "10 Pf"], ["Streusel", "8 Pf"]].forEach(([a, b], i) => {
      c.textAlign = "left"; c.fillText(a, w * 0.08, h * (0.36 + i * 0.16)); c.textAlign = "right"; c.fillText(b, w * 0.92, h * (0.36 + i * 0.16));
    });
  }, { basicMat: false });
  board.mesh.position.set(1.15, 2.05, -1.9); board.mesh.rotation.y = -0.15; g.add(board.mesh);
  // Theke mit Glasvitrine
  box(2.6, 0.9, 0.55, wood, 0, 0.45, -0.62, g);
  box(2.66, 0.04, 0.6, mat("#e8e2d8", { roughness: 0.3 }), 0, 0.92, -0.62, g);
  for (let i = 0; i < 6; i++) box(0.36, 0.5, 0.01, mat("#8a5a32"), -1.05 + i * 0.42, 0.45, -0.34, g);
  const vit = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.36, 0.45), new THREE.MeshStandardMaterial({ color: "#dfe8ea", transparent: true, opacity: 0.25, roughness: 0.05 }));
  vit.position.set(-0.75, 1.13, -0.68); g.add(vit);
  for (let i = 0; i < 5; i++) { const c = cyl(0.07, 0.07, 0.05, 10, mat(i % 2 ? "#c98a48" : "#e8c070"), -1.1 + i * 0.17, 0.98, -0.68, g); }
  for (let i = 0; i < 4; i++) sphere(0.045, mat("#d9a050"), -1.05 + i * 0.2, 1.06, -0.78, g, 1, 0.6, 1, 1);
  // Brotkorb auf der Theke
  const basket = cyl(0.2, 0.15, 0.12, 10, mat("#b08a4a"), 0.85, 1.0, -0.7, g);
  for (let j = 0; j < 6; j++) sphere(0.055, mat("#d39a55"), 0.85 + Math.sin(j * 1.1) * 0.1, 1.08, -0.7 + Math.cos(j * 1.1) * 0.08, g, 1.4, 0.75, 0.9, 1);
  // Zahlteller mit Reichsmark und Pfennigen
  const plate = cyl(0.12, 0.1, 0.015, 16, mat("#c9c3b0", { metalness: 0.6, roughness: 0.3 }), 0.25, 0.948, -0.48, g);
  const silver = mat("#d0d2d4", { metalness: 0.8, roughness: 0.25 }), copper = mat("#b8703a", { metalness: 0.7, roughness: 0.3 });
  [[0.2, -0.47, 0.016, silver], [0.27, -0.5, 0.013, copper], [0.3, -0.44, 0.012, copper], [0.22, -0.52, 0.0135, silver], [0.26, -0.45, 0.016, silver], [0.33, -0.5, 0.01, copper], [0.18, -0.44, 0.011, copper]].forEach(([x, z, rr, m], i) => cyl(rr, rr, 0.003, 14, m, x, 0.958 + (i % 3) * 0.003, z, g));
  const rmSign = drawPanel(0.2, 0.08, 1600, (c, w, h) => {
    c.fillStyle = "#f4ecd6"; c.fillRect(0, 0, w, h); c.strokeStyle = "#5a2a1a"; c.lineWidth = 6; c.strokeRect(3, 3, w - 6, h - 6);
    c.fillStyle = "#5a2a1a"; c.textAlign = "center"; c.textBaseline = "middle"; c.font = `700 ${Math.round(h * 0.42)}px ${SERIF}`; c.fillText("Reichsmark", w / 2, h * 0.52);
  }, { basicMat: false });
  rmSign.mesh.position.set(0.27, 0.99, -0.62); rmSign.mesh.rotation.x = -0.35; g.add(rmSign.mesh);
  // Registrierkasse
  const reg = new THREE.Group(); reg.position.set(0.55, 0.94, -0.75); reg.rotation.y = -0.3; g.add(reg);
  const brass = mat("#b8923e", { metalness: 0.7, roughness: 0.3 });
  box(0.4, 0.22, 0.35, brass, 0, 0.11, 0, reg); box(0.36, 0.18, 0.12, brass, 0, 0.3, -0.08, reg).rotation.x = -0.3;
  for (let i = 0; i < 8; i++) cyl(0.012, 0.012, 0.03, 6, mat("#f2ead8"), -0.12 + (i % 4) * 0.08, 0.24, 0.08 + Math.floor(i / 4) * 0.06, reg);
  // Ladenglocke über der Tür (rechts)
  const bellG = new THREE.Group(); bellG.position.set(2.0, 2.6, -0.2); g.add(bellG);
  const bellM = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 6, 0, 6.3, 0, Math.PI / 2), brass); bellM.rotation.x = Math.PI; bellG.add(bellM);
  box(0.02, 0.2, 0.02, brass, 0, 0.1, 0, bellG);
  const lampLight = new THREE.PointLight("#ffd8a0", 2.0, 6, 1.4); lampLight.position.set(0, 2.6, -1.0); g.add(lampLight);
  cyl(0.18, 0.3, 0.18, 10, mat("#f0dcb0", { emissive: new THREE.Color("#ffc070"), emissiveIntensity: 0.6 }), 0, 2.85, -1.0, g);
  return { group: g, bellG };
}

/** Euro-Schein (20 €), beidseitig. */
export function euroNote() {
  const { mesh } = drawPanel(0.133, 0.072, 4000, (c, w, h) => {
    const gr = c.createLinearGradient(0, 0, w, h); gr.addColorStop(0, "#3a6ac0"); gr.addColorStop(0.5, "#7ea6dc"); gr.addColorStop(1, "#2f5aa8");
    c.fillStyle = gr; c.fillRect(0, 0, w, h);
    c.fillStyle = "rgba(255,255,255,0.25)"; c.beginPath(); c.arc(w * 0.32, h * 0.5, h * 0.36, 0, 6.3); c.fill();
    c.strokeStyle = "rgba(255,255,255,0.55)"; c.lineWidth = 8; for (let i = 0; i < 5; i++) { c.beginPath(); c.arc(w * 0.32, h * 0.5, h * (0.12 + i * 0.05), Math.PI * 0.9, Math.PI * 2.1); c.stroke(); }
    c.fillStyle = "#f2c94c"; for (let i = 0; i < 12; i++) { const a = i / 12 * 6.283; c.beginPath(); c.arc(w * 0.72 + Math.cos(a) * h * 0.13, h * 0.32 + Math.sin(a) * h * 0.13, 6, 0, 6.3); c.fill(); }
    c.fillStyle = "#ffffff"; c.textAlign = "left"; c.textBaseline = "middle";
    c.font = `800 ${Math.round(h * 0.42)}px ${SANS}`; c.fillText("20", w * 0.06, h * 0.28);
    c.font = `800 ${Math.round(h * 0.2)}px ${SANS}`; c.fillText("EURO", w * 0.6, h * 0.78);
    c.font = `800 ${Math.round(h * 0.34)}px ${SANS}`; c.textAlign = "right"; c.fillText("20", w * 0.96, h * 0.6);
    c.fillStyle = "#c9d8f0"; c.fillRect(w * 0.52, 0, 10, h);
  }, { basicMat: false, double: true });
  return mesh;
}

// ====================================================== F: Fernsprechamt ===
/** Wandtelefon mit Kurbel (Front +z). */
export function wallPhone() {
  const g = new THREE.Group();
  const wood = mat("#6a3a1e", { roughness: 0.5 }), black = mat("#1a1816", { roughness: 0.4 }), nickel = mat("#c9c3b0", { metalness: 0.8, roughness: 0.25 });
  box(0.26, 0.36, 0.13, wood, 0, 0, 0, g);
  box(0.28, 0.03, 0.15, wood, 0, 0.19, 0, g); box(0.28, 0.03, 0.15, wood, 0, -0.19, 0, g);
  for (const s of [-1, 1]) { const b = new THREE.Mesh(new THREE.SphereGeometry(0.045, 10, 6, 0, 6.3, 0, Math.PI / 2), nickel); b.position.set(s * 0.06, 0.12, 0.07); b.rotation.x = Math.PI / 2; g.add(b); }
  sphere(0.012, nickel, 0, 0.12, 0.09, g);
  const horn = cyl(0.04, 0.02, 0.1, 10, black, 0, -0.03, 0.12, g); horn.rotation.x = Math.PI / 2;
  const arm = cyl(0.012, 0.012, 0.08, 6, black, 0, -0.03, 0.06, g); arm.rotation.x = Math.PI / 2;
  box(0.32, 0.03, 0.2, wood, 0, -0.33, 0.06, g);   // Schreibbrett
  const plate = textPanel(0.16, 0.04, 800, "#e8dcb8", [{ text: "Fernsprecher", size: 20, y: 0.55, color: "#2a1a10", font: SERIF, weight: 700 }]);
  plate.position.set(0, -0.12, 0.066); g.add(plate);
  // Kurbel rechts
  const crank = new THREE.Group(); crank.position.set(0.14, -0.02, 0.0); g.add(crank);
  const ax = cyl(0.008, 0.008, 0.04, 6, nickel, 0.02, 0, 0, crank); ax.rotation.z = Math.PI / 2;
  box(0.012, 0.09, 0.012, nickel, 0.04, -0.045, 0, crank);
  const knob = cyl(0.012, 0.012, 0.04, 8, black, 0.06, -0.09, 0, crank); knob.rotation.z = Math.PI / 2;
  // Haken links (Hörer ist in deiner Hand)
  box(0.04, 0.012, 0.012, nickel, -0.15, 0.06, 0.03, g);
  return { group: g, crank };
}
/** Hörer (für die Hand). */
export function earpiece() {
  const g = new THREE.Group();
  const black = mat("#1a1816", { roughness: 0.4 });
  cyl(0.018, 0.016, 0.12, 8, black, 0, 0, 0, g);
  const cup = cyl(0.04, 0.02, 0.05, 10, black, 0, 0.075, 0, g);
  return g;
}

/** Steckschrank-Vermittlung (Front +z), Breite 1,1. */
export function switchboard(seed = 1) {
  const g = new THREE.Group();
  const wood = mat("#5a3a22", { roughness: 0.5 });
  box(1.1, 1.75, 0.45, wood, 0, 0.875, -0.1, g);
  box(1.14, 0.06, 0.55, mat("#6a4a2c"), 0, 0.78, 0.15, g);   // Tischplatte
  const jacks = drawPanel(0.96, 0.75, 400, () => {}, { basicMat: true });
  jacks.mesh.position.set(0, 1.3, 0.126); g.add(jacks.mesh);
  let last = "";
  function draw(on) {
    const key = on.join(",");
    if (key === last) return; last = key;
    jacks.redraw((c, w, h) => {
      c.fillStyle = "#2a1a10"; c.fillRect(0, 0, w, h);
      for (let row = 0; row < 7; row++) for (let col = 0; col < 10; col++) {
        const x = 22 + col * 37, y = 22 + row * 42;
        c.fillStyle = "#c9b48a"; c.beginPath(); c.arc(x, y, 9, 0, 6.3); c.fill();
        c.fillStyle = "#120a06"; c.beginPath(); c.arc(x, y, 5, 0, 6.3); c.fill();
        const lit = on.includes(row * 10 + col);
        c.fillStyle = lit ? "#ffd84a" : "#5a4020"; c.beginPath(); c.arc(x, y + 17, 5, 0, 6.3); c.fill();
        if (lit) { c.fillStyle = "rgba(255,220,90,0.35)"; c.beginPath(); c.arc(x, y + 17, 11, 0, 6.3); c.fill(); }
      }
    });
  }
  draw([]);
  // Stöpsel auf dem Tisch und Schnüre
  const r = rng(seed);
  const cordM = mat("#3a2a1e");
  const plugs = [];
  for (let i = 0; i < 8; i++) {
    const x = -0.42 + i * 0.12;
    const p = cyl(0.012, 0.012, 0.08, 6, mat("#1a1816"), x, 0.85, 0.3, g); plugs.push(p);
  }
  for (let i = 0; i < 4; i++) {
    const a = new THREE.Vector3(-0.35 + i * 0.22, 1.05 + r() * 0.4, 0.13), b = new THREE.Vector3(-0.3 + r() * 0.6, 0.83, 0.32);
    const mid = a.clone().lerp(b, 0.5); mid.z += 0.15; mid.y -= 0.12;
    const tube = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([a, mid, b]), 12, 0.006, 4), cordM); g.add(tube);
  }
  return { group: g, draw, plugs };
}

export function exchangeHall({ seed = 1301 } = {}) {
  const g = new THREE.Group();
  const fl = planks("#8a6a4a", "#7a5a3a", 10); fl.repeat.set(4, 6);
  box(10, 0.04, 14, mat("#ffffff", { map: fl, roughness: 0.6 }), 0, -0.02, -4, g);
  const wallM = mat("#d9c8a2"), panelM = mat("#6a4a2c");
  box(10, 3.6, 0.06, wallM, 0, 1.8, -8.5, g);
  box(0.06, 3.6, 14, wallM, -4, 1.8, -4, g); box(0.06, 3.6, 14, wallM, 4, 1.8, -4, g);
  box(10, 1.0, 0.07, panelM, 0, 0.5, -8.45, g);
  box(10, 0.06, 14, mat("#ece2cc"), 0, 3.6, -4, g);
  // hohe Fenster links
  for (const z of [-2.5, -5.5]) { box(0.03, 1.8, 1.1, new THREE.MeshStandardMaterial({ color: "#d9e2e8", emissive: new THREE.Color("#fff0d0"), emissiveIntensity: 0.9 }), -3.96, 2.0, z, g); for (const y of [1.1, 2.0, 2.9]) box(0.05, 0.05, 1.14, mat("#f2eadb"), -3.94, y, z, g); }
  const sign = textPanel(3.2, 0.5, 200, "#2a3a32", [{ text: "FERNSPRECHAMT", size: 70, y: 0.56, color: "#f2dfa8", font: SERIF, weight: 700 }]);
  sign.position.set(0.2, 2.95, -8.42); g.add(sign);
  const clock = drawPanel(0.6, 0.6, 300, (c, w) => {
    c.fillStyle = "#f6efdc"; c.beginPath(); c.arc(w / 2, w / 2, w / 2 - 4, 0, 6.3); c.fill(); c.strokeStyle = "#2a1a10"; c.lineWidth = 10; c.stroke();
    for (let i = 0; i < 12; i++) { c.save(); c.translate(w / 2, w / 2); c.rotate(i / 12 * 6.283); c.fillStyle = "#2a1a10"; c.fillRect(-4, -w / 2 + 14, 8, 22); c.restore(); }
    const hand = (a, len, wd) => { c.save(); c.translate(w / 2, w / 2); c.rotate(a); c.fillStyle = "#2a1a10"; c.fillRect(-wd / 2, -len, wd, len + 12); c.restore(); };
    hand((11 + 40 / 60) / 12 * 6.283, 50, 12); hand(40 / 60 * 6.283, 75, 7);
  }, { basicMat: false });
  clock.mesh.position.set(2.4, 2.75, -8.42); g.add(clock.mesh);
  // Reihe von Vermittlungsschränken
  const boards = [];
  for (let i = 0; i < 4; i++) { const b = switchboard(seed + i); b.group.position.set(-0.3 + i * 1.2, 0, -3.4); g.add(b.group); boards.push(b); }
  // Stühle
  for (let i = 1; i < 4; i++) { const x = -0.3 + i * 1.2; box(0.42, 0.05, 0.42, mat("#5a3a22"), x, 0.45, -2.7, g); box(0.42, 0.5, 0.05, mat("#5a3a22"), x, 0.72, -2.47, g); }
  // Pfeiler mit Wandtelefon vorne rechts
  box(0.12, 1.9, 0.12, mat("#5a3a22"), 0.82, 0.95, -0.6, g); box(0.2, 0.06, 0.2, mat("#5a3a22"), 0.82, 1.92, -0.6, g); box(0.4, 0.6, 0.03, mat("#6a4a2c"), 0.82, 1.42, -0.52, g);
  const phone = wallPhone(); phone.group.position.set(0.82, 1.48, -0.46); g.add(phone.group);
  // Schalter / Tresen links mit Gitter
  box(2.6, 1.05, 0.5, panelM, -2.4, 0.525, -3.5, g); box(2.6, 0.05, 0.56, mat("#8a6a4a"), -2.4, 1.07, -3.5, g);
  for (let i = 0; i < 9; i++) box(0.015, 0.7, 0.015, mat("#b8923e", { metalness: 0.6 }), -3.6 + i * 0.3, 1.45, -3.6, g);
  const lampLight = new THREE.PointLight("#ffe0b0", 3, 12, 1.2); lampLight.position.set(0, 3.0, -5); g.add(lampLight);
  for (const z of [-2.5, -6]) { cyl(0.01, 0.01, 0.6, 4, mat("#2a2a2a"), 0, 3.3, z, g); const s = sphere(0.14, mat("#f6eed8", { emissive: new THREE.Color("#ffe0a0"), emissiveIntensity: 0.8 }), 0, 2.95, z, g); s.castShadow = false; }
  return { group: g, boards, phone };
}

// ============================================================== G: Kino ===
// Leinwand bei z = −9,5 (Mitte y = 2,6), Sitzreihen ab z = −1, Pianist links vorne. Kamera sitzt bei z ≈ 0,3.
export function cinema({ seed = 1401 } = {}) {
  const g = new THREE.Group();
  box(12, 0.04, 16, mat("#3a2420"), 0, -0.02, -4, g);
  const wall = mat("#5a2a24", { roughness: 0.9 });
  box(0.08, 5, 16, wall, -4.2, 2.5, -4, g); box(0.08, 5, 16, wall, 4.2, 2.5, -4, g);
  box(9, 5, 0.08, mat("#3a1a18"), 0, 2.5, -10, g);
  box(9, 0.08, 16, mat("#2a1614"), 0, 5, -4, g);
  // Vorhang und Bühne
  for (const s of [-1, 1]) { const v = box(1.2, 4.6, 0.1, mat("#8a1e22", { roughness: 1 }), s * 3.3, 2.4, -9.7, g); }
  box(8.4, 0.7, 0.12, mat("#8a1e22"), 0, 4.6, -9.7, g);
  box(8.4, 0.5, 1.4, mat("#4a2a1e"), 0, 0.25, -9.2, g);
  const W = 4.6, H = 3.3;
  const scr = drawPanel(W, H, 120, () => {}, { basicMat: true });
  scr.mesh.position.set(0, 2.75, -9.9); g.add(scr.mesh);
  // Ornament-Leisten, Wandlampen
  for (const s of [-1, 1]) for (const z of [-2, -6]) { const l = sphere(0.12, mat("#f0c890", { emissive: new THREE.Color("#ff9a40"), emissiveIntensity: 0.9 }), s * 4.1, 2.6, z, g, 1, 1.4, 0.6, 0); l.castShadow = false; }
  // Sitzreihen
  const seatM = mat("#7a1e22", { roughness: 0.9 }), seatB = mat("#3a1a14");
  const seats = [];
  for (let row = 0; row < 7; row++) for (let i = 0; i < 12; i++) {
    const x = -2.9 + i * 0.52, z = 0.9 - row * 0.95 - 0.3;
    if (Math.abs(x) < 0.3 && row === 0) continue;
    box(0.46, 0.08, 0.42, seatM, x, 0.45, z, g); box(0.46, 0.55, 0.08, seatM, x, 0.75, z + 0.22, g);
    box(0.04, 0.45, 0.4, seatB, x - 0.25, 0.22, z, g);
    seats.push({ x, z, row });
  }
  // Klavier links vorne
  const piano = new THREE.Group(); piano.position.set(-1.85, 0.5, -9.0); piano.rotation.y = Math.PI / 2; g.add(piano);
  const pw = mat("#2a1a12", { roughness: 0.35 });
  box(1.5, 1.3, 0.6, pw, 0, 0.65, 0, piano);
  box(1.4, 0.06, 0.25, mat("#f6f2ea"), 0, 0.72, 0.38, piano);
  for (let i = 0; i < 14; i++) box(0.03, 0.03, 0.14, mat("#111"), -0.62 + i * 0.1, 0.76, 0.33, piano);
  box(1.4, 0.06, 0.3, pw, 0, 0.68, 0.38, piano).position.y = 0.66;
  const notes = drawPanel(0.4, 0.28, 600, (c, w, h) => { c.fillStyle = "#f2ead8"; c.fillRect(0, 0, w, h); c.strokeStyle = "#333"; c.lineWidth = 2; for (let k = 0; k < 3; k++) for (let l = 0; l < 5; l++) { const y = 30 + k * 55 + l * 7; c.beginPath(); c.moveTo(10, y); c.lineTo(w - 10, y); c.stroke(); } c.fillStyle = "#222"; for (let k = 0; k < 18; k++) { c.beginPath(); c.ellipse(20 + (k % 6) * 38, 32 + Math.floor(k / 6) * 55 + (k * 7) % 25, 5, 4, -0.4, 0, 6.3); c.fill(); } }, { basicMat: false });
  notes.mesh.position.set(0, 1.05, 0.32); notes.mesh.rotation.x = -0.25; piano.add(notes.mesh);
  const pLamp = sphere(0.07, mat("#ffe0a0", { emissive: new THREE.Color("#ffc060"), emissiveIntensity: 1.5 }), 0.5, 1.4, 0.2, piano);
  const pianoLight = new THREE.PointLight("#ffc070", 5, 4.5, 1.2); pianoLight.position.set(0.4, 1.6, 0.6); piano.add(pianoLight);
  // Projektorstrahl
  const beamGeo = new THREE.ConeGeometry(1.0, 1, 24, 1, true); beamGeo.translate(0, -0.5, 0); beamGeo.rotateX(-Math.PI / 2);
  const beamMat = new THREE.MeshBasicMaterial({ color: "#fff2d0", transparent: true, opacity: 0.06, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide });
  const beam = new THREE.Mesh(beamGeo, beamMat);
  const src = new THREE.Vector3(0, 4.3, 4.5), dst = new THREE.Vector3(0, 2.75, -9.9);
  beam.position.copy(src); beam.lookAt(dst); beam.scale.set(W * 0.42, H * 0.42, src.distanceTo(dst)); g.add(beam);
  const screenLight = new THREE.PointLight("#e8e8f0", 3, 14, 1.2); screenLight.position.set(0, 2.6, -8.2); g.add(screenLight);
  return { group: g, screen: scr, seats, piano, beam, beamMat, screenLight, W, H };
}

// ======================================================== H: Wohnzimmer ===
// Tisch bei z = −0,55 (Oberkante 0,74), Radio darauf, du sitzt bei z ≈ 0,25.
export const TABLE_Y = 0.74;
export function detectorRadio() {
  const g = new THREE.Group();
  const wood = mat("#7a4a26", { roughness: 0.45 }), brass = mat("#c9a04a", { metalness: 0.7, roughness: 0.3 }), ebon = mat("#1c1612", { roughness: 0.3 });
  box(0.34, 0.11, 0.24, wood, 0, 0.055, 0, g);
  box(0.32, 0.012, 0.22, ebon, 0, 0.116, 0, g);
  // Spule
  const { tex } = canvasTexture(128, 128, (c, w, h) => { c.fillStyle = "#b8703a"; c.fillRect(0, 0, w, h); c.fillStyle = "#8a4a22"; for (let y = 0; y < h; y += 5) c.fillRect(0, y, w, 2); });
  const coil = cyl(0.045, 0.045, 0.11, 16, new THREE.MeshStandardMaterial({ map: tex, roughness: 0.5, metalness: 0.3 }), -0.08, 0.18, -0.02, g);
  cyl(0.05, 0.05, 0.008, 16, ebon, -0.08, 0.237, -0.02, g);
  // Kristalldetektor (Glasröhrchen mit Fühlarm)
  const glass = cyl(0.012, 0.012, 0.07, 10, new THREE.MeshStandardMaterial({ color: "#dfe8ea", transparent: true, opacity: 0.45, roughness: 0.05 }), 0.07, 0.15, 0.02, g); glass.rotation.z = Math.PI / 2;
  sphere(0.007, mat("#5a5a5a", { metalness: 0.8 }), 0.07, 0.15, 0.02, g);
  for (const x of [0.03, 0.11]) cyl(0.01, 0.012, 0.03, 8, brass, x, 0.135, 0.02, g);
  const knobA = cyl(0.022, 0.022, 0.02, 10, ebon, 0.06, 0.13, -0.07, g);
  // Klemmen
  for (let i = 0; i < 4; i++) cyl(0.008, 0.01, 0.02, 8, brass, -0.13 + i * 0.03, 0.13, 0.08, g);
  const label = textPanel(0.16, 0.035, 1500, "#e8dcb8", [{ text: "Detektor-Empfänger", size: 26, y: 0.55, color: "#2a1a10", font: SERIF, weight: 700 }]);
  label.position.set(0, 0.06, 0.121); g.add(label);
  return { group: g, knob: knobA };
}
export function headphones() {
  const g = new THREE.Group();
  const black = mat("#1c1816", { roughness: 0.35 }), metal = mat("#8a8a84", { metalness: 0.7, roughness: 0.3 });
  const band = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.006, 4, 16, Math.PI), metal); g.add(band);
  for (const s of [-1, 1]) {
    const cup = cyl(0.04, 0.04, 0.025, 14, black, s * 0.095, -0.01, 0, g); cup.rotation.z = Math.PI / 2;
    const cap = cyl(0.03, 0.03, 0.01, 12, metal, s * 0.11, -0.01, 0, g); cap.rotation.z = Math.PI / 2;
  }
  return g;
}
export function oilLamp() {
  const g = new THREE.Group();
  const brass = mat("#c9a04a", { metalness: 0.7, roughness: 0.3 });
  cyl(0.06, 0.08, 0.02, 12, brass, 0, 0.01, 0, g);
  cyl(0.015, 0.03, 0.12, 8, brass, 0, 0.08, 0, g);
  sphere(0.065, new THREE.MeshStandardMaterial({ color: "#e8c890", emissive: new THREE.Color("#ffb060"), emissiveIntensity: 0.6, transparent: true, opacity: 0.85 }), 0, 0.19, 0, g, 1, 0.8, 1);
  const chim = cyl(0.025, 0.035, 0.16, 12, new THREE.MeshStandardMaterial({ color: "#fff4d8", emissive: new THREE.Color("#ffcf80"), emissiveIntensity: 1.2, transparent: true, opacity: 0.7 }), 0, 0.32, 0, g);
  const glowMat = new THREE.SpriteMaterial({ map: glowTexture(), color: "#ffb860", transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.8 });
  const glow = new THREE.Sprite(glowMat); glow.position.y = 0.3; glow.scale.set(0.35, 0.35, 1); g.add(glow);
  const light = new THREE.PointLight("#ffa850", 3.2, 6, 1.3); light.position.y = 0.38; g.add(light);
  return { group: g, light, glow };
}
export function parlor({ seed = 1501 } = {}) {
  const r = rng(seed);
  const g = new THREE.Group();
  const fl = planks("#6a4a32", "#5c3f2a"); fl.repeat.set(3, 3);
  box(7, 0.05, 7, mat("#ffffff", { map: fl, roughness: 0.6 }), 0, -0.025, -1, g);
  const wp = wallpaper("#7a5a3e", "#6a4a32", "#c9a060"); wp.repeat.set(4, 2);
  const wall = new THREE.MeshStandardMaterial({ map: wp, roughness: 0.95 });
  box(0.05, 2.9, 7, wall, -2.6, 1.45, -1, g); box(0.05, 2.9, 7, wall, 2.6, 1.45, -1, g); box(7, 2.9, 0.05, wall, 0, 1.45, 2.0, g);
  box(1.9, 2.9, 0.08, wall, -1.65, 1.45, -3.2, g); box(1.9, 2.9, 0.08, wall, 1.65, 1.45, -3.2, g);
  box(1.4, 0.85, 0.08, wall, 0, 0.42, -3.2, g); box(1.4, 0.5, 0.08, wall, 0, 2.65, -3.2, g);
  box(1.4, 1.55, 0.04, new THREE.MeshStandardMaterial({ color: "#1a2440", emissive: new THREE.Color("#2a3a66"), emissiveIntensity: 1, roughness: 1 }), 0, 1.62, -3.26, g);
  for (const x of [-0.7, 0, 0.7]) box(0.05, 1.55, 0.1, mat("#efe6d6"), x, 1.62, -3.2, g);
  box(1.4, 0.05, 0.1, mat("#efe6d6"), 0, 1.62, -3.2, g);
  for (let i = 0; i < 7; i++) box(0.1, 0.13, 0.02, basic(r() < 0.8 ? "#ffcf7a" : "#e8b060"), r.range(-0.6, 0.6), r.range(1.0, 2.2), -3.4, g);
  for (const x of [-0.95, 0.95]) box(0.45, 2.4, 0.1, mat("#5a2a24"), x, 1.55, -3.1, g);
  box(7, 0.05, 7, mat("#d8ccb4"), 0, 2.9, -1, g);
  box(7, 0.12, 0.04, mat("#4a2e1a"), 0, 0.06, -3.14, g);
  // Teppich
  const rug = canvasTexture(256, 256, (c, w) => { c.fillStyle = "#7a2a24"; c.fillRect(0, 0, w, w); c.strokeStyle = "#c9a060"; c.lineWidth = 10; c.strokeRect(16, 16, w - 32, w - 32); c.fillStyle = "#2a3a5a"; c.beginPath(); c.arc(w / 2, w / 2, 50, 0, 6.3); c.fill(); });
  plane(2.6, 2.0, new THREE.MeshStandardMaterial({ map: rug.tex, roughness: 1 }), 0, 0.005, -0.8, g);
  // Tisch
  const wood = mat("#5a3a22", { roughness: 0.5 });
  box(1.2, 0.05, 0.8, wood, 0, TABLE_Y - 0.025, -0.55, g);
  for (const [x, z] of [[-0.52, -0.33], [0.52, -0.33], [-0.52, 0.33], [0.52, 0.33]]) box(0.06, TABLE_Y - 0.05, 0.06, wood, x, (TABLE_Y - 0.05) / 2, -0.55 + z, g);
  const cloth = box(0.7, 0.005, 0.5, mat("#efe6d2"), 0.05, TABLE_Y + 0.003, -0.6, g);
  // Ohrensessel, Sofa, Pendeluhr, Bild, Regal
  const ch = new THREE.Group(); ch.position.set(-1.6, 0, -1.6); ch.rotation.y = 0.6; g.add(ch);
  const plush = mat("#4a5a3a", { roughness: 1 });
  box(0.85, 0.45, 0.8, plush, 0, 0.22, 0, ch); box(0.85, 0.85, 0.18, plush, 0, 0.85, -0.32, ch);
  for (const s of [-1, 1]) { box(0.15, 0.3, 0.7, plush, s * 0.38, 0.55, 0, ch); box(0.18, 0.4, 0.25, plush, s * 0.36, 1.05, -0.22, ch); }
  box(2.0, 0.42, 0.75, mat("#6a3a2a", { roughness: 1 }), 1.4, 0.21, -2.6, g); box(2.0, 0.55, 0.18, mat("#6a3a2a", { roughness: 1 }), 1.4, 0.7, -2.92, g);
  const clockG = new THREE.Group(); clockG.position.set(2.55, 1.55, -0.9); clockG.rotation.y = -Math.PI / 2; g.add(clockG);
  box(0.35, 0.9, 0.12, mat("#4a2a16", { roughness: 0.4 }), 0, 0, 0, clockG);
  const cf = drawPanel(0.26, 0.26, 600, (c, w) => {
    c.fillStyle = "#f6efdc"; c.beginPath(); c.arc(w / 2, w / 2, w / 2 - 3, 0, 6.3); c.fill();
    for (let i = 0; i < 12; i++) { c.save(); c.translate(w / 2, w / 2); c.rotate(i / 12 * 6.283); c.fillStyle = "#2a1a10"; c.fillRect(-3, -w / 2 + 8, 6, 14); c.restore(); }
    const hand = (a, len, wd) => { c.save(); c.translate(w / 2, w / 2); c.rotate(a); c.fillStyle = "#2a1a10"; c.fillRect(-wd / 2, -len, wd, len + 8); c.restore(); };
    hand((7 + 45 / 60) / 12 * 6.283, w * 0.24, 7); hand(45 / 60 * 6.283, w * 0.36, 5);
  }, { basicMat: false });
  cf.mesh.position.set(0, 0.25, 0.062); clockG.add(cf.mesh);
  const pendulum = new THREE.Group(); pendulum.position.set(0, 0.05, 0.07); clockG.add(pendulum);
  box(0.01, 0.3, 0.01, mat("#c9a04a", { metalness: 0.7 }), 0, -0.15, 0, pendulum); cyl(0.04, 0.04, 0.01, 12, mat("#c9a04a", { metalness: 0.7 }), 0, -0.3, 0, pendulum).rotation.x = Math.PI / 2;
  const pic = drawPanel(0.7, 0.5, 300, (c, w, h) => { c.fillStyle = "#3a4a3a"; c.fillRect(0, 0, w, h); c.fillStyle = "#c9b07a"; c.fillRect(0, h * 0.62, w, h * 0.38); c.fillStyle = "#e8d6a8"; c.beginPath(); c.arc(w * 0.68, h * 0.3, 20, 0, 6.3); c.fill(); c.strokeStyle = "#b08a3a"; c.lineWidth = 16; c.strokeRect(0, 0, w, h); }, { basicMat: false });
  pic.mesh.rotation.y = Math.PI / 2; pic.mesh.position.set(-2.56, 1.75, -0.4); g.add(pic.mesh);
  const shelf = new THREE.Group(); shelf.position.set(1.7, 0, -3.0); g.add(shelf);
  // Deckenlampe (aus)
  cyl(0.008, 0.008, 0.6, 4, mat("#2a2a2a"), 0, 2.6, -0.6, g);
  cyl(0.15, 0.32, 0.18, 10, mat("#e8c890", { side: THREE.DoubleSide }), 0, 2.25, -0.6, g);
  // Antennendraht vom Radio zum Fenster
  const a = new THREE.Vector3(-0.17, TABLE_Y + 0.13, -0.65), b = new THREE.Vector3(-0.6, 2.4, -3.15);
  const wire = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([a, new THREE.Vector3(-0.4, 1.3, -1.9), b]), 16, 0.003, 4), mat("#9a6a3a")); g.add(wire);
  return { group: g, pendulum };
}
