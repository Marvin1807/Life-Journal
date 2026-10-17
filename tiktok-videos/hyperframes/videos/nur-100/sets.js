// Sets für "nur-100": Rathausplatz (Backstein-Rathaus mit Uhrturm und Treppengiebel, Straßenbahn),
// Penthouse über einer Skyline wie Frankfurt am Main im Abendlicht, das letzte Klassenzimmer,
// der Rathaus-Festsaal. Dazu Figuren mit freundlichen Gesichtern (folk). Nur für dieses Video, lib/ bleibt unverändert.
import { THREE, rng, clamp, smooth, lerp, building, windowTextures, glowTexture, streetLamp } from "./lib/lowpoly.js";
import { mat, basic, box, cyl, canvasTexture, textPanel } from "./lib/props.js";

// ================================================================ Figuren ===
// Wie crowd() aus lowpoly.js, aber mit Gesicht (Augen, Nase, Lächeln, Wangen), Händen, langen Haaren,
// Bart, getrennt hebbaren Armen, Oberkörper-Drehung (twist) und Kopfdrehung (headYaw).
const BASE = 0.88, HEAD = 1.56;
// name, size, pivot, offset, Farbe, Gruppe (0 = unten, 1 = Oberkörper, 2 = Kopf)
const PARTS = [
  ["legL", [0.17, 0.86, 0.2], [-0.11, BASE, 0], [0, -0.43, 0], "pants", 0],
  ["legR", [0.17, 0.86, 0.2], [0.11, BASE, 0], [0, -0.43, 0], "pants", 0],
  ["torso", [0.48, 0.66, 0.27], [0, BASE, 0], [0, 0.34, 0], "shirt", 1],
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
];
// Herbstliche, warme Palette
export const SHIRTS = ["#8a3b2a", "#c98b3a", "#5d6b3a", "#7a2e3e", "#d9c7a5", "#3f5468", "#b5582f", "#6b4a3a", "#e0b25b", "#4d3a52", "#9a6a3e", "#2f4a44"];
export const PANTS = ["#2c2a28", "#3b3f48", "#5b4a3a", "#2b3340", "#6b5a48", "#40362e"];
export const SKINS = ["#f1c8a5", "#e2b08a", "#c68d64", "#8d5a3b", "#f5d3b8", "#d9a07a"];
export const HAIRS = ["#2a1e17", "#4a3222", "#c9a16a", "#1a1a1a", "#7a5232", "#9a9a9a", "#a8552e"];

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
  function look(i, o = {}) {
    const L = { shirt: o.shirt ?? r.pick(SHIRTS), pants: o.pants ?? r.pick(PANTS), skin: o.skin ?? r.pick(SKINS), hair: o.hair ?? r.pick(HAIRS),
      long: o.long ?? (r() < 0.45 ? r.range(0.6, 1.25) : 0), beard: o.beard ?? 0, dark: o.dark ?? false };
    L.beardColor = o.beardColor ?? L.hair;
    looks[i] = L;
    const c = {
      pants: L.pants, shirt: L.shirt, skin: L.skin, hair: L.hair, beard: L.beardColor,
      eye: "#2a1c16", mouth: "#8a3b30",
      nose: tmpC.set(L.skin).multiplyScalar(0.92).getHexString(),
      cheek: tmpC.set(L.skin).lerp(new THREE.Color("#f08a7a"), 0.45).getHexString(),
    };
    PARTS.forEach(([, , , , kind], p) => {
      let v = c[kind];
      if (typeof v === "string" && !v.startsWith("#")) v = "#" + v;
      if (L.dark) v = "#0b0b0d";
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
  /** s: { x, y, z, rotY, swing, armL, armR, armRaise, spreadL, spreadR, twist, headYaw, headPitch, headTilt, sit, visible, scale, headScale } */
  function set(i, s) {
    if (!s.visible) { meshes.forEach((m) => m.setMatrixAt(i, zero)); return; }
    const L = looks[i];
    const S = s.scale ?? 1, HS = s.headScale ?? 1;
    mRoot.compose(v.set(s.x, s.y ?? (s.sit ? -0.43 * S : 0), s.z), q.setFromEuler(e.set(0, s.rotY ?? 0, 0)), sc.setScalar(S));
    // Oberkörper-Drehung um die Hüfte
    mA.makeTranslation(0, BASE, 0); mB.makeRotationY(s.twist || 0); mTw.multiplyMatrices(mA, mB); mA.makeTranslation(0, -BASE, 0); mTw.multiply(mA);
    const sw = s.swing || 0, raise = s.armRaise || 0;
    const legs = s.sit ? -1.45 : null;
    PARTS.forEach(([name, , pivot, off, , grp], p) => {
      let hide = false;
      if (name === "hairBack") hide = !L.long;
      if (name === "beard") hide = !L.beard;
      if (hide) { meshes[p].setMatrixAt(i, zero); return; }
      if (grp === 2) {
        e.set(s.headPitch || 0, s.headYaw || 0, s.headTilt || 0, "YXZ");
        mJ.compose(v.set(...pivot), q.setFromEuler(e), sc.setScalar(HS));
        mOff.makeTranslation(off[0], off[1], off[2]);
        if (name === "hairBack") { mOff.multiply(mA.makeTranslation(0, 0.15 - 0.15 * L.long, 0)); mOff.multiply(mA.makeScale(1, L.long, 1)); }
      } else {
        let ax = 0, az = 0;
        if (name === "legL") ax = legs ?? sw;
        else if (name === "legR") ax = legs ?? -sw;
        else if (name === "armL" || name === "handL") { ax = -sw * 0.8 - (s.armL ?? raise); az = -(s.spreadL || 0); }
        else if (name === "armR" || name === "handR") { ax = sw * 0.8 - (s.armR ?? raise); az = s.spreadR || 0; }
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
  return { group, set, commit, look, count };
}

// ============================================================== Texturen ===
function brickTexture(seed = 3, base = "#9b4632") {
  const r = rng(seed);
  const { tex } = canvasTexture(256, 256, (g, w, h) => {
    g.fillStyle = "#c9b8a4"; g.fillRect(0, 0, w, h);
    const bw = 32, bh = 12;
    for (let y = 0; y < h / bh; y++) for (let x = -1; x < w / bw + 1; x++) {
      const c = new THREE.Color(base).offsetHSL(r.range(-0.012, 0.012), r.range(-0.05, 0.05), r.range(-0.06, 0.05));
      g.fillStyle = "#" + c.getHexString();
      g.fillRect(x * bw + (y % 2) * bw / 2 + 1, y * bh + 1, bw - 2, bh - 2);
    }
  });
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

function cobbles(seed = 5) {
  const r = rng(seed);
  const { tex } = canvasTexture(512, 512, (g, w) => {
    g.fillStyle = "#6a625a"; g.fillRect(0, 0, w, w);
    const s = w / 20;
    for (let y = 0; y < 20; y++) for (let x = 0; x < 21; x++) {
      const v = 120 + Math.floor(r() * 40);
      g.fillStyle = `rgb(${v + 12},${v},${v - 14})`;
      g.fillRect(x * s + (y % 2) * s / 2 + 2 - s / 2, y * s + 2, s - 4, s - 4);
    }
  });
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

// ===================================================== Herbstlicher Baum ===
const LEAVES = ["#c8762e", "#d9a03a", "#b5522a", "#a8862f", "#d58a2c", "#8f6a2a"];
export function autumnTree(seed = 1, h = 6) {
  const r = rng(seed);
  const g = new THREE.Group();
  cyl(0.16, 0.24, h * 0.55, 6, mat("#4a3628"), 0, h * 0.275, 0, g);
  const leaf = mat(r.pick(LEAVES));
  for (let i = 0; i < 4; i++) {
    const m = new THREE.Mesh(new THREE.IcosahedronGeometry(r.range(1.3, 1.9) * h / 6, 0), leaf);
    m.position.set(r.range(-0.9, 0.9) * h / 6, h * r.range(0.62, 0.85), r.range(-0.9, 0.9) * h / 6);
    m.rotation.set(r() * 3, r() * 3, 0); m.castShadow = true; g.add(m);
  }
  return g;
}

// Satteldach als dreiseitiges Prisma: Breite w (x), Tiefe d (z), Höhe h; Grundfläche bei y = 0, mittig.
function gableRoof(w, d, h, material) {
  const sh = new THREE.Shape(); sh.moveTo(-w / 2, 0); sh.lineTo(w / 2, 0); sh.lineTo(0, h); sh.lineTo(-w / 2, 0);
  const geo = new THREE.ExtrudeGeometry(sh, { depth: d, bevelEnabled: false }); geo.translate(0, 0, -d / 2);
  const m = new THREE.Mesh(geo, material); m.castShadow = true; m.receiveShadow = true; return m;
}

// ========================================================== Rathausplatz ===
// Achsen: Rathausfront bei z = HALL_Z (Blick nach −z), Platz davor, Straßenbahn quer (x) bei z = TRAM_Z.
export const HALL_Z = -42;
export const TRAM_Z = -8;
export const BOARD = { x: -1.6, z: -29.2, w: 3.6, h: 2.3, y: 1.75 };

// 98 Vornamen + Initial, dann MAMA und DU
const VORNAMEN = ["ANNA", "BEN", "CLARA", "DAVID", "ELIF", "FELIX", "GRETA", "HANNES", "IDA", "JONAS", "KARLA", "LUKAS", "MIA", "NOAH", "OLE", "PAULA",
  "QUENTIN", "ROSA", "SAMI", "TILDA", "UWE", "VERA", "WILLI", "XAVER", "YARA", "ZOE", "ANTON", "BIRTE", "CEM", "DORA", "EMIL", "FRIEDA",
  "GÜNTER", "HEDI", "ILKA", "JAN", "KAI", "LENE", "MAX", "NELE", "OSKAR", "PIA", "RUDI", "SVEA", "THEO", "UTE", "VOLKER", "WIEBKE",
  "AYLIN", "BRUNO", "CARLO", "DILARA", "ERIK", "FINJA", "GERD", "HELGA", "INGO", "JULE", "KONRAD", "LOTTE", "MALTE", "NINA", "OTTO", "PETRA",
  "RENATE", "SÖNKE", "TARIK", "URSULA", "VIKTOR", "WANDA", "ALMA", "BERND", "CHIARA", "DENNIS", "EDDA", "FRITZ", "GESA", "HUGO", "IRIS", "JOHANN",
  "KATI", "LEON", "MARTHA", "NIKLAS", "OLGA", "PAUL", "RIEKE", "STEFAN", "TONI", "ULLA", "VINCENT", "WALTER", "LINA", "MORITZ", "EMMA", "KLAUS",
  "HANNA", "LUIS"];
const INITIAL = "KBSMWHRLTPFGDNEAZOVJ";

export function nameBoard() {
  const g = new THREE.Group();
  const PX = 600;
  const W = Math.round(BOARD.w * PX), H = Math.round(BOARD.h * PX);
  const r = rng(77);
  const { tex } = canvasTexture(W, H, (c) => {
    // Papierbogen auf Kork/Holz
    c.fillStyle = "#2b2420"; c.fillRect(0, 0, W, H);
    c.fillStyle = "rgba(255,240,210,0.035)";
    for (let i = 0; i < 260; i++) c.fillRect(r() * W, r() * H, r.range(20, 120), 2);
    c.fillStyle = "#f2c26b"; c.textAlign = "center"; c.textBaseline = "middle";
    c.font = "800 128px Inter, Arial, sans-serif";
    c.fillText("DIE 100", W / 2, 118);
    c.fillStyle = "#8a7660"; c.fillRect(W * 0.08, 196, W * 0.84, 5);
    const cols = 6, rows = 17, x0 = 70, colW = (W - 2 * x0) / cols, y0 = 262, rowH = (H - y0 - 50) / rows;
    c.textAlign = "left";
    for (let n = 1; n <= 100; n++) {
      const ci = Math.floor((n - 1) / rows), ri = (n - 1) % rows;
      const x = x0 + ci * colW + 14, y = y0 + ri * rowH + rowH / 2;
      let txt;
      if (n === 99) txt = "99. MAMA";
      else if (n === 100) txt = "100. DU";
      else txt = `${n}. ${VORNAMEN[n - 1]} ${INITIAL[(n * 7) % INITIAL.length]}.`;
      c.font = n >= 99 ? "800 50px Inter, Arial, sans-serif" : "700 44px Inter, Arial, sans-serif";
      c.fillStyle = n >= 99 ? "#ff5a48" : "#efe6d2";
      c.fillText(txt, x, y);
      if (n === 100) {
        const tw = c.measureText(txt).width;
        c.strokeStyle = "#ff5a48"; c.lineWidth = 6;
        c.strokeRect(x - 14, y - rowH / 2 + 4, tw + 28, rowH - 8);
      }
    }
  });
  const paper = new THREE.Mesh(new THREE.PlaneGeometry(BOARD.w, BOARD.h), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9, emissive: new THREE.Color("#ffffff"), emissiveMap: tex, emissiveIntensity: 0.25 }));
  paper.position.z = 0.051; g.add(paper);
  const wood = mat("#6b4a2e");
  box(BOARD.w + 0.3, BOARD.h + 0.3, 0.1, wood, 0, 0, 0, g);
  box(BOARD.w + 0.45, 0.14, 0.24, mat("#5a3d25"), 0, BOARD.h / 2 + 0.2, 0.05, g);          // Dächlein
  for (const x of [-BOARD.w / 2 - 0.05, BOARD.w / 2 + 0.05]) box(0.12, BOARD.y + BOARD.h / 2, 0.12, wood, x, -(BOARD.y) / 2 + BOARD.h / 4 - 0.6 + 0.6, -0.08, g);
  g.position.set(BOARD.x, BOARD.y, BOARD.z);
  g.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  paper.receiveShadow = false;
  return g;
}

function facadeTexture() {
  // Front des Rathauses: Backstein, Arkaden unten, hohe Spitzbogenfenster oben
  const W = 1536, H = 820;
  const r = rng(12);
  const { tex } = canvasTexture(W, H, (c) => {
    c.fillStyle = "#c9b8a4"; c.fillRect(0, 0, W, H);
    for (let y = 0; y < H / 14; y++) for (let x = -1; x < W / 38 + 1; x++) {
      const col = new THREE.Color("#9b4632").offsetHSL(r.range(-0.012, 0.012), r.range(-0.05, 0.05), r.range(-0.06, 0.05));
      c.fillStyle = "#" + col.getHexString();
      c.fillRect(x * 38 + (y % 2) * 19 + 1, y * 14 + 1, 36, 12);
    }
    // Sockel und Gesims aus hellem Sandstein
    c.fillStyle = "#d8cbb2"; c.fillRect(0, H - 40, W, 40); c.fillRect(0, 300, W, 18); c.fillRect(0, 0, W, 16);
    // Arkaden (7 Bögen)
    const n = 7, aw = W / n;
    for (let i = 0; i < n; i++) {
      const cx = aw * i + aw / 2;
      c.fillStyle = "#d8cbb2";
      c.beginPath(); c.moveTo(cx - aw * 0.36, H - 40); c.lineTo(cx - aw * 0.36, H - 330); c.quadraticCurveTo(cx, H - 470, cx + aw * 0.36, H - 330); c.lineTo(cx + aw * 0.36, H - 40); c.fill();
      c.fillStyle = i === 3 ? "#3a2418" : "#2a2420";
      c.beginPath(); c.moveTo(cx - aw * 0.31, H - 40); c.lineTo(cx - aw * 0.31, H - 330); c.quadraticCurveTo(cx, H - 455, cx + aw * 0.31, H - 330); c.lineTo(cx + aw * 0.31, H - 40); c.fill();
      if (i === 3) { c.fillStyle = "#5a3a22"; c.fillRect(cx - aw * 0.25, H - 300, aw * 0.5, 260); c.fillStyle = "#2a1a10"; c.fillRect(cx - 3, H - 300, 6, 260); }
    }
    // Obergeschoss: Spitzbogenfenster
    for (let i = 0; i < 9; i++) {
      const cx = (W / 9) * i + W / 18;
      c.fillStyle = "#e6dcc8";
      c.beginPath(); c.moveTo(cx - 50, 280); c.lineTo(cx - 50, 110); c.lineTo(cx, 50); c.lineTo(cx + 50, 110); c.lineTo(cx + 50, 280); c.fill();
      c.fillStyle = "#2d3a44";
      c.beginPath(); c.moveTo(cx - 40, 272); c.lineTo(cx - 40, 114); c.lineTo(cx, 64); c.lineTo(cx + 40, 114); c.lineTo(cx + 40, 272); c.fill();
      c.fillStyle = "#e6dcc8"; c.fillRect(cx - 3, 80, 6, 192); c.fillRect(cx - 40, 180, 80, 5);
      c.fillStyle = "rgba(255,230,180,0.18)"; c.fillRect(cx - 40, 114, 80, 10);
    }
  });
  return tex;
}

function clockFace() {
  const { tex } = canvasTexture(256, 256, (c) => {
    c.fillStyle = "#3c2a20"; c.fillRect(0, 0, 256, 256);
    c.fillStyle = "#f2ead8"; c.beginPath(); c.arc(128, 128, 118, 0, 6.283); c.fill();
    c.strokeStyle = "#c79a3a"; c.lineWidth = 8; c.beginPath(); c.arc(128, 128, 114, 0, 6.283); c.stroke();
    c.fillStyle = "#2a2018";
    for (let i = 0; i < 12; i++) { const a = (i / 12) * 6.283; c.save(); c.translate(128 + Math.sin(a) * 95, 128 - Math.cos(a) * 95); c.rotate(a); c.fillRect(-4, -12, 8, 24); c.restore(); }
    const hand = (a, len, w) => { c.save(); c.translate(128, 128); c.rotate(a); c.fillRect(-w / 2, -len, w, len + 10); c.restore(); };
    hand((11.95 / 12) * 6.283, 62, 10); hand((57 / 60) * 6.283, 92, 6);   // fast zwölf
    c.beginPath(); c.arc(128, 128, 9, 0, 6.283); c.fill();
  });
  return tex;
}

export function rathausplatz({ seed = 901 } = {}) {
  const r = rng(seed);
  const g = new THREE.Group();
  const brick = brickTexture(4);
  const brickMat = (rx, ry) => { const t = brick.clone(); t.needsUpdate = true; t.repeat.set(rx, ry); return mat("#ffffff", { map: t, roughness: 0.95 }); };
  // Boden: Kopfsteinpflaster
  const ct = cobbles(9); ct.repeat.set(40, 40);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(240, 240), mat("#ffffff", { map: ct, roughness: 1 }));
  ground.rotation.x = -Math.PI / 2; ground.position.set(0, 0, -20); ground.receiveShadow = true; g.add(ground);
  // Straßenbahngleise quer über den Platz
  const steel = mat("#a9a49c", { metalness: 0.6, roughness: 0.35 });
  const asphalt = new THREE.Mesh(new THREE.PlaneGeometry(240, 6.5), mat("#4c4844", { roughness: 0.95 }));
  asphalt.rotation.x = -Math.PI / 2; asphalt.position.set(0, 0.01, TRAM_Z); asphalt.receiveShadow = true; g.add(asphalt);
  for (const dz of [-2.1, -0.66, 0.66, 2.1]) box(240, 0.03, 0.09, steel, 0, 0.025, TRAM_Z + dz + (dz > 0 ? -0.36 : 0.36) * 0, g);
  for (const dz of [-2.1, -0.66, 0.66, 2.1]) box(240, 0.02, 0.05, mat("#2e2b28"), 0, 0.02, TRAM_Z + dz + 0.08, g);
  // Oberleitung
  for (let x = -60; x <= 60; x += 20) { cyl(0.08, 0.1, 6.4, 6, mat("#3a3c40"), x, 3.2, TRAM_Z + 4.2, g); box(0.08, 0.08, 5.5, mat("#3a3c40"), x, 6.2, TRAM_Z + 1.6, g); }
  for (const dz of [-1.4, 1.4]) box(240, 0.02, 0.02, mat("#2a2a2a"), 0, 5.9, TRAM_Z + dz, g);
  // Straßenbahn (beige/rot), steht an der Haltestelle rechts
  const tram = new THREE.Group();
  const tramBody = mat("#e9dfc6"), tramRed = mat("#a8322a"), glass = mat("#26303a", { roughness: 0.2, metalness: 0.4 });
  for (let k = 0; k < 3; k++) {
    box(9.6, 2.6, 2.5, tramBody, k * 9.9, 1.75, 0, tram); box(9.62, 0.5, 2.52, tramRed, k * 9.9, 0.72, 0, tram);
    box(9.0, 1.0, 2.54, glass, k * 9.9, 2.25, 0, tram); box(9.62, 0.12, 2.52, tramRed, k * 9.9, 3.05, 0, tram);
  }
  box(1.6, 0.5, 0.3, mat("#2a2a2a"), 10, 3.4, 0, tram);
  tram.position.set(22, 0, TRAM_Z - 1.38); g.add(tram);
  // ------------------------------------------------------------ Rathaus
  const HW = 30, HH = 15, HD = 16;
  const hall = new THREE.Group();
  box(HW, HH, HD, brickMat(HW / 3, HH / 3), 0, HH / 2, -HD / 2, hall);
  const front = new THREE.Mesh(new THREE.PlaneGeometry(HW, HH), new THREE.MeshStandardMaterial({ map: facadeTexture(), roughness: 0.95 }));
  front.position.set(0, HH / 2, 0.02); front.receiveShadow = true; hall.add(front);
  // Treppengiebel über der Front (Mitte), mit weißen Blenden und Fialen
  const gable = brickMat(2, 1), white = mat("#ebe3d2");
  const steps = [22, 18.5, 15, 11.5, 8, 4.5];
  steps.forEach((w, i) => {
    box(w, 2.0, 1.2, gable, 0, HH + 1.0 + i * 2.0, -0.6, hall);
    for (const s of [-1, 1]) box(0.7, 1.0, 1.3, gable, s * (w / 2 - 0.35), HH + 2.0 + i * 2.0 + 0.5, -0.6, hall);
  });
  for (let i = -4; i <= 4; i++) {
    const hgt = 10.5 - Math.abs(i) * 2.0;
    if (hgt <= 0.5) continue;
    box(1.0, hgt, 0.1, white, i * 2.0, HH + 0.4 + hgt / 2, 0.02, hall);
    box(0.5, 0.5, 0.11, mat("#2d3a44"), i * 2.0, HH + 0.4 + hgt * 0.62, 0.05, hall);
  }
  // Dach hinter dem Giebel
  const roof = gableRoof(HW - 0.4, HD - 1.4, 8.5, mat("#5b4038")); roof.position.set(0, HH, -HD / 2 - 0.6); hall.add(roof);
  // Uhrturm links
  const tw = 7, th = 28, tx = -HW / 2 - tw / 2 + 1.0, tz = -3.8;
  box(tw, th, tw, brickMat(tw / 3, th / 3), tx, th / 2, tz, hall);
  for (let k = 0; k < 4; k++) box(tw + 0.4, 0.6, tw + 0.4, mat("#d8cbb2"), tx, 9 + k * 7.5, tz, hall);
  for (let k = 0; k < 3; k++) {
    const y = 12 + k * 7.5;
    box(1.1, 3.2, 0.1, mat("#2d3a44"), tx - 1.4, y, tz + tw / 2 + 0.02, hall); box(1.1, 3.2, 0.1, mat("#2d3a44"), tx + 1.4, y, tz + tw / 2 + 0.02, hall);
  }
  const cf = clockFace();
  for (const [dx, dz, ry] of [[0, tw / 2 + 0.08, 0], [tw / 2 + 0.08, 0, Math.PI / 2], [-tw / 2 - 0.08, 0, -Math.PI / 2]]) {
    const c = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 4.2), new THREE.MeshStandardMaterial({ map: cf, roughness: 0.7 }));
    c.position.set(tx + dx, th - 3.2, tz + dz); c.rotation.y = ry; hall.add(c);
  }
  // Kupferhelm (grün), Laterne, Spitze
  const copper = mat("#5f9a84", { roughness: 0.7 });
  const helm = new THREE.Mesh(new THREE.ConeGeometry(5.6, 9, 4), copper); helm.rotation.y = Math.PI / 4; helm.position.set(tx, th + 4.5, tz); hall.add(helm);
  box(2.2, 3, 2.2, copper, tx, th + 8.5, tz, hall);
  const spire = new THREE.Mesh(new THREE.ConeGeometry(1.4, 9, 4), copper); spire.rotation.y = Math.PI / 4; spire.position.set(tx, th + 14.5, tz); hall.add(spire);
  cyl(0.05, 0.05, 3, 4, mat("#c9a14a", { metalness: 0.6 }), tx, th + 20, tz, hall);
  // Freitreppe
  for (let k = 0; k < 4; k++) box(14 - k * 0.6, 0.18, 1.2 - 0, mat("#c8bba4"), 0, 0.09 + k * 0.18, 2.6 - k * 0.6, hall);
  hall.position.set(0, 0, HALL_Z);
  hall.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  g.add(hall);
  // ------------------------------------------- Häuser rund um den Platz
  const houses = [];
  const texA = windowTextures(31, "altbau");
  const COLS = ["#d9c2a0", "#c99a6e", "#e3d3b5", "#b7765a", "#d6b48a", "#efe1c8", "#a85f45", "#cdb391"];
  const row = (x0, x1, z, side) => {
    let x = x0;
    while (x < x1) {
      const w = r.range(7, 11), h = r.range(11, 17), d = 12;
      const b = building({ w, h, d, color: r.pick(COLS), tex: texA, roof: r.pick(["#6e3d34", "#5b5650", "#7a4434"]) });
      b.mesh.position.set(x + w / 2, 0, z + side * d / 2); g.add(b.mesh); houses.push(b);
      // Giebeldach
      const gab = gableRoof(w, d, w * 0.55, mat(r.pick(["#7a3a2c", "#5e4a40", "#8a4a34"]))); gab.position.set(x + w / 2, h, z + side * d / 2); g.add(gab);
      x += w + 0.1;
    }
  };
  row(-75, -21.5, HALL_Z + 2, -1);     // neben dem Rathaus (links)
  row(16, 75, HALL_Z + 2, -1);         // neben dem Rathaus (rechts)
  row(-75, 75, 30, 1);                 // gegenüber (hinter dir)
  // Querstraßen-Seiten
  for (const sx of [-1, 1]) {
    let z = -34;
    while (z < 24) {
      const w = r.range(8, 11), h = r.range(12, 18);
      const b = building({ w: 12, h, d: w, color: r.pick(COLS), tex: texA, roof: "#6e3d34" });
      b.mesh.position.set(sx * 34, 0, z + w / 2); g.add(b.mesh); houses.push(b);
      const gab = gableRoof(w, 12, w * 0.55, mat("#7a3a2c")); gab.rotation.y = Math.PI / 2; gab.position.set(sx * 34, h, z + w / 2); g.add(gab);
      z += w + 0.1;
    }
  }
  // Laternen und Bäume
  const glow = glowTexture();
  const lamps = [];
  for (const [x, z] of [[-9, -20], [9, -20], [-9, -3], [9, -3], [-20, 6], [20, 6], [-6, 12], [6, 12]]) {
    const l = streetLamp(glow); l.group.position.set(x, 0, z); l.glowMat.opacity = 0.25; g.add(l.group); lamps.push(l);
  }
  const treeSpots = [[-14, -24], [14, -24], [-24, -14], [24, -14], [-26, 2], [26, 2], [-16, 18], [16, 18], [-28, 14], [28, 14], [0, 20]];
  treeSpots.forEach(([x, z], i) => { const t = autumnTree(seed + i, r.range(6, 8)); t.position.set(x, 0, z); g.add(t); });
  // Laub auf dem Pflaster
  const LEAF = 700;
  const leaves = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.16, 0.12), mat("#ffffff", { side: THREE.DoubleSide }), LEAF);
  const o = new THREE.Object3D(), cc = new THREE.Color();
  for (let i = 0; i < LEAF; i++) {
    const [tx2, tz2] = treeSpots[i % treeSpots.length];
    o.position.set(tx2 + r.range(-5, 5), 0.015, tz2 + r.range(-5, 5)); o.rotation.set(-Math.PI / 2, 0, r() * 6); o.updateMatrix();
    leaves.setMatrixAt(i, o.matrix); leaves.setColorAt(i, cc.set(r.pick(LEAVES)));
  }
  leaves.receiveShadow = true; g.add(leaves);
  // Bänke, Blumenkübel
  for (const x of [-6, 6]) { box(1.8, 0.08, 0.5, mat("#6b4a2e"), x, 0.45, -24, g); box(1.8, 0.5, 0.08, mat("#6b4a2e"), x, 0.7, -24.25, g); }
  const board = nameBoard(); g.add(board);
  return { group: g, houses, lamps, board };
}

// ============================================================= Penthouse ===
function marbleTexture(seed = 3) {
  const r = rng(seed);
  const { tex } = canvasTexture(512, 512, (c, w, h) => {
    c.fillStyle = "#f1ede6"; c.fillRect(0, 0, w, h);
    for (let k = 0; k < 14; k++) {
      c.strokeStyle = `rgba(${120 + r() * 40},${110 + r() * 30},${100 + r() * 30},${r.range(0.15, 0.4)})`;
      c.lineWidth = r.range(1, 3.5);
      c.beginPath(); let x = r() * w, y = 0; c.moveTo(x, y);
      while (y < h) { x += r.range(-30, 30); y += r.range(20, 60); c.lineTo(x, y); }
      c.stroke();
    }
  });
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

/** Flügel (Konzertflügel) aus einer extrudierten Kontur. */
export function grandPiano() {
  const g = new THREE.Group();
  const black = mat("#121214", { roughness: 0.25, metalness: 0.2 });
  const sh = new THREE.Shape();
  sh.moveTo(-0.75, 0); sh.lineTo(0.75, 0); sh.lineTo(0.75, -0.9);
  sh.bezierCurveTo(0.75, -1.5, 0.2, -1.6, 0.05, -1.9); sh.bezierCurveTo(-0.2, -2.3, -0.75, -2.2, -0.75, -1.6); sh.lineTo(-0.75, 0);
  const geo = new THREE.ExtrudeGeometry(sh, { depth: 0.32, bevelEnabled: false, curveSegments: 6 });
  geo.rotateX(Math.PI / 2);
  const body = new THREE.Mesh(geo, black); body.position.y = 1.0; body.castShadow = true; g.add(body);
  const lidGeo = new THREE.ShapeGeometry(sh, 6); lidGeo.rotateX(Math.PI / 2);
  const lid = new THREE.Mesh(lidGeo, new THREE.MeshStandardMaterial({ color: "#16161a", roughness: 0.2, side: THREE.DoubleSide, flatShading: true }));
  const hinge = new THREE.Group(); hinge.position.set(0.75, 1.0, 0); hinge.add(lid); lid.position.x = -0.75; hinge.rotation.z = 0.75; g.add(hinge);
  box(0.03, 0.9, 0.03, black, 0.2, 1.3, -1.1, g).rotation.z = -0.3;
  box(1.5, 0.08, 0.28, black, 0, 0.72, 0.14, g);                        // Tastenbrett
  box(1.4, 0.03, 0.16, mat("#f4f1ea"), 0, 0.77, 0.16, g);              // Tasten
  for (let i = 0; i < 24; i++) box(0.025, 0.02, 0.09, black, -0.66 + i * 0.058, 0.795, 0.12, g);
  for (const [x, z] of [[-0.62, -0.1], [0.62, -0.1], [-0.4, -1.9]]) box(0.1, 0.72, 0.1, black, x, 0.36, z, g);
  box(0.7, 0.06, 0.35, black, 0, 0.48, 0.6, g); box(0.06, 0.45, 0.3, black, -0.3, 0.24, 0.6, g); box(0.06, 0.45, 0.3, black, 0.3, 0.24, 0.6, g);
  box(0.42, 0.3, 0.02, mat("#efe6d2"), 0, 1.0, -0.02, g).rotation.x = -0.25;   // Notenblatt
  return g;
}

export function bigPlant(seed = 5) {
  const r = rng(seed);
  const g = new THREE.Group();
  cyl(0.28, 0.22, 0.6, 10, mat("#d8d2c6", { roughness: 0.5 }), 0, 0.3, 0, g);
  cyl(0.04, 0.05, 1.1, 5, mat("#5a4030"), 0, 1.0, 0, g);
  const leaf = mat("#4f7a3a");
  for (let i = 0; i < 6; i++) {
    const m = new THREE.Mesh(new THREE.IcosahedronGeometry(r.range(0.35, 0.5), 0), i % 2 ? leaf : mat("#5d8a44"));
    m.position.set(r.range(-0.35, 0.35), r.range(1.3, 1.9), r.range(-0.35, 0.35)); m.rotation.set(r() * 3, r() * 3, 0); g.add(m);
  }
  return g;
}

export const PENT_Y = 150;     // Boden des Penthouse
export function penthouse({ seed = 1101 } = {}) {
  const r = rng(seed);
  const g = new THREE.Group();
  const room = new THREE.Group(); room.position.y = PENT_Y; g.add(room);
  const floorT = (() => { const { tex } = canvasTexture(512, 512, (c, w) => { c.fillStyle = "#b08a62"; c.fillRect(0, 0, w, w); for (let i = 0; i < 8; i++) { c.fillStyle = i % 2 ? "#a77f58" : "#b9946a"; c.fillRect(0, i * 64, w, 62); } }); tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(4, 4); return tex; })();
  box(18, 0.1, 14, mat("#ffffff", { map: floorT, roughness: 0.45 }), 0, -0.05, -1, room);
  box(18, 0.1, 14, mat("#efe9df"), 0, 3.6, -1, room);
  box(0.1, 3.6, 14, mat("#e8e0d2"), -9, 1.8, -1, room);
  box(18, 3.6, 0.1, mat("#e8e0d2"), 0, 1.8, 6, room);
  // Panoramafenster (z = −8) über die ganze Breite und rechte Seite
  const frame = mat("#2a2724", { roughness: 0.5 });
  for (let x = -9; x <= 9; x += 3) box(0.1, 3.6, 0.12, frame, x, 1.8, -8, room);
  box(18, 0.12, 0.14, frame, 0, 0.06, -8, room); box(18, 0.14, 0.14, frame, 0, 3.55, -8, room);
  for (let z = -8; z <= 6; z += 3.5) box(0.12, 3.6, 0.1, frame, 9, 1.8, z, room);
  box(0.14, 0.12, 14, frame, 9, 0.06, -1, room); box(0.14, 0.14, 14, frame, 9, 3.55, -1, room);
  const glass = new THREE.MeshStandardMaterial({ color: "#c9d6dc", transparent: true, opacity: 0.12, roughness: 0.05, metalness: 0.1, depthWrite: false });
  const gl1 = new THREE.Mesh(new THREE.PlaneGeometry(18, 3.6), glass); gl1.position.set(0, 1.8, -8); room.add(gl1);
  const gl2 = new THREE.Mesh(new THREE.PlaneGeometry(14, 3.6), glass); gl2.rotation.y = -Math.PI / 2; gl2.position.set(9, 1.8, -1); room.add(gl2);
  // Terrasse draußen
  box(18, 0.1, 4, mat("#8d8478"), 0, -0.1, -10, room);
  box(18, 1.05, 0.04, new THREE.MeshStandardMaterial({ color: "#b8c8cc", transparent: true, opacity: 0.25 }), 0, 0.5, -12, room);
  // Kücheninsel aus Marmor im Vordergrund
  const marble = marbleTexture(4); marble.repeat.set(2, 1);
  const marbleMat = mat("#ffffff", { map: marble, roughness: 0.25 });
  box(3.6, 0.92, 1.1, marbleMat, -2.2, 0.46, 1.4, room);
  box(3.8, 0.06, 1.25, marbleMat, -2.2, 0.95, 1.4, room);
  const bowl = cyl(0.22, 0.12, 0.12, 10, mat("#c9b8a0"), -1.4, 1.04, 1.3, room);
  for (let i = 0; i < 4; i++) { const ap = new THREE.Mesh(new THREE.IcosahedronGeometry(0.06, 0), mat(i % 2 ? "#c8402a" : "#e0a032")); ap.position.set(-1.45 + (i % 2) * 0.1 - 0.05, 1.12, 1.25 + Math.floor(i / 2) * 0.1); room.add(ap); }
  box(0.5, 0.03, 0.35, mat("#6b4a2e"), -3.0, 0.995, 1.5, room);        // Brettchen
  // Hängelampen
  const lampMat = mat("#2b2724", { emissive: new THREE.Color("#ffcf8a"), emissiveIntensity: 0.0 });
  const bulbs = [];
  for (const x of [-3.2, -2.2, -1.2]) {
    cyl(0.005, 0.005, 1.4, 4, mat("#222"), x, 2.9, 1.4, room);
    cyl(0.06, 0.16, 0.2, 10, lampMat, x, 2.15, 1.4, room);
    const b = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), basic("#ffe2b0")); b.position.set(x, 2.05, 1.4); room.add(b); bulbs.push(b);
  }
  const pl = new THREE.PointLight("#ffd09a", 5, 9, 1.6); pl.position.set(-2.2, 2.0, 1.4); room.add(pl);
  // Pflanze, Flügel, Sofa, Teppich
  const plant = bigPlant(8); plant.position.set(3.2, 0, -6.8); room.add(plant);
  const plant2 = bigPlant(9); plant2.position.set(-7.6, 0, -6.6); plant2.scale.setScalar(1.15); room.add(plant2);
  const piano = grandPiano(); piano.position.set(5.6, 0, -4.8); piano.rotation.y = -2.5; room.add(piano);
  box(3.2, 0.42, 1.0, mat("#c8b9a0"), -4.8, 0.21, -3.6, room); box(3.2, 0.5, 0.25, mat("#c8b9a0"), -4.8, 0.62, -3.05, room);
  box(4.5, 0.02, 3, mat("#8a5a3e"), -4.6, 0.01, -4.6, room);
  box(1.2, 0.36, 0.7, mat("#4a3a2e"), -4.8, 0.18, -5.0, room);
  room.traverse((o) => { if (o.isMesh && o.material !== glass) { o.castShadow = true; o.receiveShadow = true; } });
  gl1.castShadow = gl2.castShadow = false;
  // ---------------------------------------------------- Stadt draußen
  const city = new THREE.Group(); g.add(city);
  const groundMat = mat("#6d6458", { roughness: 1 });
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(5000, 5000), groundMat); ground.rotation.x = -Math.PI / 2; ground.position.set(0, 0, -1500); city.add(ground);
  // Der Main: breites Band quer, mit Brücken
  const water = new THREE.Mesh(new THREE.PlaneGeometry(5000, 150), new THREE.MeshStandardMaterial({ color: "#7d8fa0", roughness: 0.15, metalness: 0.5, flatShading: true }));
  water.rotation.x = -Math.PI / 2; water.position.set(0, 0.3, -560); city.add(water);
  for (const x of [-420, -120, 160, 520]) box(16, 3, 160, mat("#8a8278"), x, 4, -560, city);
  // Blöcke (Altstadt/Wohnviertel) zwischen dir und dem Fluss und jenseits
  const BL = 1400;
  const blocks = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), mat("#ffffff"), BL);
  const o = new THREE.Object3D(), cc = new THREE.Color();
  const BCOL = ["#c9b39a", "#b89a7e", "#d8c8b0", "#a88a70", "#bfae9a", "#9e8e80", "#c4a68a", "#8f7d6e"];
  let k = 0;
  for (let i = 0; i < BL; i++) {
    const far = i > 700;
    const x = r.range(-900, 900), z = far ? r.range(-640, -1400) : r.range(-40, -480);
    if (Math.abs(z + 560) < 90) continue;
    if (!far && Math.abs(x) < 30 && z > -60) continue;
    const w = r.range(14, 34), d = r.range(14, 34), h = r.range(10, 28) * (far ? 1.1 : 1);
    o.position.set(x, h / 2, z); o.rotation.set(0, Math.round(r() * 2) * 0.5 * 0 + r.range(-0.05, 0.05), 0); o.scale.set(w, h, d); o.updateMatrix();
    blocks.setMatrixAt(k, o.matrix); blocks.setColorAt(k, cc.set(r.pick(BCOL))); k++;
  }
  blocks.count = k; blocks.receiveShadow = true; city.add(blocks);
  // Herbstbäume (Parks, Mainufer)
  const TR = 900;
  const trees = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(5, 0), mat("#ffffff"), TR);
  for (let i = 0; i < TR; i++) {
    const shore = i < 360;
    const x = r.range(-1200, 1200), z = shore ? -560 + (r() < 0.5 ? -1 : 1) * r.range(80, 105) : r.range(-60, -1300);
    o.position.set(x, 5, z); o.rotation.set(r() * 3, r() * 3, 0); o.scale.setScalar(r.range(0.7, 1.5)); o.updateMatrix();
    trees.setMatrixAt(i, o.matrix); trees.setColorAt(i, cc.set(r.pick(["#b8662a", "#c98a2e", "#8f5a2a", "#a87a2a", "#6f7a34", "#c4562c"])));
  }
  city.add(trees);
  // Hochhäuser (Bankenviertel jenseits des Mains, wie Frankfurt)
  const texG = windowTextures(91, "plattenbau"), texH = windowTextures(92, "plattenbau"), texI = windowTextures(93, "altbau");
  const towers = [];
  const tower = (geo, color, tex, x, z, h, extra = {}) => {
    const m = new THREE.MeshStandardMaterial({ color, map: tex.map, emissiveMap: tex.emissive, emissive: new THREE.Color("#ffc88a"), emissiveIntensity: 0.0, roughness: 0.55, metalness: 0.25, flatShading: true, ...extra });
    geo.translate(0, h / 2, 0);
    const uv = geo.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 3, uv.getY(i) * h / 28); uv.needsUpdate = true;
    const mesh = new THREE.Mesh(geo, m); mesh.position.set(x, 0, z); mesh.castShadow = true; mesh.receiveShadow = true; city.add(mesh);
    towers.push(m); return mesh;
  };
  // „Messeturm“: schlanker Schaft mit Pyramide
  tower(new THREE.BoxGeometry(40, 230, 40), "#b59a86", texI, -230, -760, 230);
  const pyr = new THREE.Mesh(new THREE.ConeGeometry(26, 32, 4), mat("#8a5a4a")); pyr.rotation.y = Math.PI / 4; pyr.position.set(-230, 246, -760); city.add(pyr);
  // „Commerzbank“: dreieckig mit Antennen
  tower(new THREE.CylinderGeometry(38, 38, 250, 3), "#c9cfd2", texG, 10, -820, 250);
  for (const dx of [-8, 8]) cyl(0.8, 1.2, 40, 4, mat("#d9dcdc"), 10 + dx, 270, -820, city);
  // „Main Tower“: rund mit Mast
  tower(new THREE.CylinderGeometry(22, 22, 200, 12), "#8fa4b4", texH, 120, -720, 200);
  cyl(1, 1.6, 50, 5, mat("#e05030"), 120, 225, -720, city);
  // Zwillingstürme (verspiegelt)
  tower(new THREE.BoxGeometry(30, 155, 30), "#7e95a8", texH, 230, -790, 155);
  tower(new THREE.BoxGeometry(30, 155, 30), "#7e95a8", texH, 275, -805, 155);
  // weitere Türme
  const extras = [[-110, -700, 140, "#c2b3a2"], [-60, -880, 180, "#9aa8b4"], [60, -690, 120, "#d2c6b6"], [180, -900, 170, "#a8b2ba"], [-330, -900, 130, "#b8aa9c"],
    [340, -700, 110, "#c8bcae"], [-170, -660, 100, "#a99a8a"], [420, -900, 150, "#94a2ae"], [-420, -800, 95, "#c4b8aa"], [-20, -990, 160, "#8f9eaa"]];
  extras.forEach(([x, z, h, c], i) => tower(new THREE.BoxGeometry(r.range(26, 38), h, r.range(26, 38)), c, i % 2 ? texG : texI, x, z, h));
  // EZB-artiger Doppelturm am Ostufer (rechts)
  tower(new THREE.BoxGeometry(34, 185, 24), "#9fb0bc", texG, 620, -650, 185).rotation.y = 0.3;
  return { group: g, room, city, towers, bulbs, lampMat, pl, water };
}

// ========================================================== Klassenzimmer ===
function worldMap() {
  const { tex } = canvasTexture(768, 420, (c, w, h) => {
    c.fillStyle = "#cfe0e3"; c.fillRect(0, 0, w, h);
    c.fillStyle = "#e9dcb8";
    const blob = (pts) => { c.beginPath(); pts.forEach(([x, y], i) => (i ? c.lineTo(x * w, y * h) : c.moveTo(x * w, y * h))); c.closePath(); c.fill(); };
    blob([[0.08, 0.2], [0.3, 0.14], [0.33, 0.3], [0.25, 0.45], [0.2, 0.52], [0.12, 0.36]]);                      // Nordamerika
    blob([[0.24, 0.55], [0.33, 0.58], [0.31, 0.78], [0.27, 0.9], [0.24, 0.72]]);                                // Südamerika
    c.fillStyle = "#c9d8a8"; blob([[0.45, 0.18], [0.56, 0.14], [0.56, 0.3], [0.47, 0.34]]);                      // Europa
    c.fillStyle = "#e7c99a"; blob([[0.45, 0.38], [0.6, 0.38], [0.62, 0.55], [0.55, 0.8], [0.5, 0.75], [0.44, 0.5]]); // Afrika
    c.fillStyle = "#d9c7a0"; blob([[0.56, 0.12], [0.9, 0.12], [0.93, 0.3], [0.82, 0.45], [0.7, 0.48], [0.6, 0.35]]); // Asien
    c.fillStyle = "#e3b58a"; blob([[0.8, 0.65], [0.92, 0.63], [0.93, 0.78], [0.82, 0.8]]);                      // Australien
    c.strokeStyle = "rgba(60,80,90,0.25)"; c.lineWidth = 1;
    for (let i = 1; i < 12; i++) { c.beginPath(); c.moveTo((i / 12) * w, 0); c.lineTo((i / 12) * w, h); c.stroke(); }
    for (let i = 1; i < 6; i++) { c.beginPath(); c.moveTo(0, (i / 6) * h); c.lineTo(w, (i / 6) * h); c.stroke(); }
    // Flugrouten (gestrichelt) – passend zum Lehrer
    c.strokeStyle = "#b5382a"; c.setLineDash([8, 6]); c.lineWidth = 3;
    c.beginPath(); c.moveTo(0.5 * w, 0.24 * h); c.quadraticCurveTo(0.35 * w, 0.05 * h, 0.2 * w, 0.3 * h); c.stroke();
    c.beginPath(); c.moveTo(0.5 * w, 0.24 * h); c.quadraticCurveTo(0.75 * w, 0.2 * h, 0.86 * w, 0.68 * h); c.stroke();
    c.setLineDash([]); c.fillStyle = "#b5382a"; c.beginPath(); c.arc(0.5 * w, 0.24 * h, 6, 0, 6.3); c.fill();
    c.fillStyle = "#3a4a52"; c.fillRect(0, 0, w, 8); c.fillRect(0, h - 8, w, 8);
  });
  return tex;
}

export function chalkboardTexture() {
  const W = 2000, H = 650;
  const r = rng(21);
  return canvasTexture(W, H, (c) => {
    c.fillStyle = "#2f4a3a"; c.fillRect(0, 0, W, H);
    for (let i = 0; i < 300; i++) { c.fillStyle = `rgba(255,255,255,${r.range(0.01, 0.04)})`; c.fillRect(r() * W, r() * H, r.range(30, 200), r.range(4, 20)); }
    c.textAlign = "left"; c.textBaseline = "middle";
    c.fillStyle = "#f4f1e6"; c.font = "700 118px Inter, Arial, sans-serif";
    c.fillText("DIE LETZTE KLASSE DER WELT", 70, 150);
    c.fillStyle = "#f2d66b"; c.font = "700 104px Inter, Arial, sans-serif";
    c.fillText("SCHÜLER: 9", 70, 340);
    c.fillStyle = "#f4f1e6"; c.font = "600 96px Inter, Arial, sans-serif";
    c.fillText("ALTER 5 – 15", 70, 510);
  });
}

function wingTexture(kind) {
  return canvasTexture(500, 650, (c, w, h) => {
    c.fillStyle = "#2f4a3a"; c.fillRect(0, 0, w, h);
    c.strokeStyle = "rgba(244,241,230,0.85)"; c.fillStyle = "rgba(244,241,230,0.85)"; c.lineWidth = 7; c.lineCap = "round";
    if (kind === 0) {
      // Kreide-Flugzeug + Pfeil
      c.beginPath(); c.moveTo(80, 330); c.lineTo(420, 300); c.moveTo(220, 320); c.lineTo(300, 180); c.lineTo(330, 310); c.moveTo(230, 316); c.lineTo(300, 450); c.lineTo(330, 306);
      c.moveTo(90, 330); c.lineTo(60, 260); c.lineTo(110, 325); c.stroke();
      c.font = "600 54px Inter, Arial"; c.textAlign = "center"; c.fillText("AUFTRIEB", w / 2, 560);
    } else {
      c.font = "600 64px Inter, Arial"; c.textAlign = "center";
      c.fillText("7 · 8 = 56", w / 2, 180); c.fillText("A  B  C", w / 2, 330); c.fillText("Haus", w / 2, 480);
    }
  });
}

export function pilotCap() {
  const g = new THREE.Group();
  const navy = mat("#1d2433", { roughness: 0.6 });
  cyl(0.115, 0.1, 0.075, 14, navy, 0, 0.0375, 0, g);
  const top = cyl(0.135, 0.125, 0.03, 14, mat("#f3f1ea", { roughness: 0.5 }), 0, 0.09, -0.01, g);
  top.scale.set(1, 1, 1.05);
  cyl(0.103, 0.103, 0.022, 14, mat("#c9a14a", { metalness: 0.6, roughness: 0.3 }), 0, 0.045, 0, g);
  const visor = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.012, 14, 1, false, -0.9, 1.8), mat("#0e0f12", { roughness: 0.2 }));
  visor.position.set(0, 0.012, 0.02); visor.rotation.x = 0.12; g.add(visor);
  box(0.05, 0.035, 0.01, mat("#e0b84a", { metalness: 0.6 }), 0, 0.07, 0.112, g);
  return g;
}

export function planeModel() {
  const g = new THREE.Group();
  const white = mat("#f2f1ec", { roughness: 0.4 }), red = mat("#b5382a");
  const body = cyl(0.03, 0.03, 0.42, 8, white, 0, 0, 0, g); body.rotation.x = Math.PI / 2;
  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.07, 8), white); nose.rotation.x = -Math.PI / 2; nose.position.z = -0.245; g.add(nose);
  box(0.46, 0.008, 0.09, white, 0, -0.005, -0.02, g);
  box(0.16, 0.006, 0.05, white, 0, 0.005, 0.19, g);
  box(0.006, 0.08, 0.06, red, 0, 0.045, 0.19, g);
  box(0.062, 0.008, 0.36, red, 0, 0.0, 0.0, g).position.y = 0.018;
  for (const x of [-0.12, 0.12]) { const e = cyl(0.014, 0.014, 0.06, 6, mat("#9aa0a6"), x, -0.022, -0.04, g); e.rotation.x = Math.PI / 2; }
  // Ständer
  cyl(0.004, 0.004, 0.14, 4, mat("#2a2a2a"), 0, -0.1, 0, g);
  cyl(0.05, 0.05, 0.012, 10, mat("#2a2a2a"), 0, -0.17, 0, g);
  return g;
}

// Raum: Tafelwand bei z = −5, Fensterwand links (x = −4.5), Kamera hinten bei z ≈ +3.
export function classroom({ seed = 1201 } = {}) {
  const r = rng(seed);
  const g = new THREE.Group();
  const plane = (w, h, color, x, y, z, rx = 0, ry = 0, extra = {}) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat(color, { roughness: 0.9, ...extra }));
    m.position.set(x, y, z); m.rotation.set(rx, ry, 0); m.receiveShadow = true; g.add(m); return m;
  };
  const floorT = (() => { const { tex } = canvasTexture(256, 256, (c, w) => { c.fillStyle = "#a8794c"; c.fillRect(0, 0, w, w); for (let i = 0; i < 8; i++) for (let j = 0; j < 4; j++) { c.fillStyle = (i + j) % 2 ? "#9c6f45" : "#b0825a"; c.fillRect(j * 64 + (i % 2) * 32, i * 32, 62, 30); } }); tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(5, 6); return tex; })();
  plane(9, 10, "#ffffff", 0, 0, 0, -Math.PI / 2, 0, { map: floorT });
  plane(9, 3.4, "#e8dcc2", 0, 1.7, -5);                                 // Tafelwand
  plane(9, 3.4, "#e5d8be", 0, 1.7, 5, 0, Math.PI);                      // Rückwand
  plane(10, 3.4, "#ebe0c8", -4.5, 1.7, 0, 0, Math.PI / 2);              // Fensterwand
  plane(10, 3.4, "#e2d4b8", 4.5, 1.7, 0, 0, -Math.PI / 2);              // rechte Wand
  plane(9, 10, "#f2ede2", 0, 3.4, 0, Math.PI / 2);                      // Decke
  box(9, 0.9, 0.04, mat("#8a6a4a"), 0, 0.45, -4.97, g);                 // Holzsockel
  // Fenster (gleißend hell)
  const winMats = [];
  for (const z of [-3.2, -0.6, 2.0]) {
    const m = plane(2.0, 2.0, "#fff4d6", -4.48, 1.85, z, 0, Math.PI / 2, { emissive: new THREE.Color("#fff1d0"), emissiveIntensity: 1.0 });
    winMats.push(m.material);
    box(0.06, 2.1, 0.08, mat("#f6f2ea"), -4.45, 1.85, z, g); box(0.06, 0.06, 2.1, mat("#f6f2ea"), -4.45, 1.85, z, g);
    box(0.25, 0.05, 2.2, mat("#efe8da"), -4.38, 0.82, z, g);
  }
  // Grüne Klapptafel: Mittelteil + zwei Flügel
  const ct = chalkboardTexture();
  const centerB = new THREE.Mesh(new THREE.PlaneGeometry(4.0, 1.3), new THREE.MeshStandardMaterial({ map: ct.tex, roughness: 0.9, emissive: new THREE.Color("#ffffff"), emissiveMap: ct.tex, emissiveIntensity: 0.18 }));
  centerB.position.set(0, 1.85, -4.93); g.add(centerB);
  box(4.12, 1.42, 0.05, mat("#6b5a48"), 0, 1.85, -4.97, g);
  const wings = [];
  [[-1, 0], [1, 1]].forEach(([s, kind]) => {
    const hinge = new THREE.Group(); hinge.position.set(s * 2.05, 1.85, -4.93); g.add(hinge);
    const wt = wingTexture(kind);
    const w = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 1.3), new THREE.MeshStandardMaterial({ map: wt.tex, roughness: 0.9, emissive: new THREE.Color("#ffffff"), emissiveMap: wt.tex, emissiveIntensity: 0.15 }));
    w.position.set(s * 0.52, 0, 0.0); hinge.add(w);
    box(1.06, 1.42, 0.04, mat("#6b5a48"), s * 0.52, 0, -0.03, hinge);
    hinge.rotation.y = -s * 0.42; wings.push(hinge);
  });
  box(4.2, 0.05, 0.14, mat("#6b5a48"), 0, 1.17, -4.88, g);             // Kreideablage
  box(0.09, 0.02, 0.02, mat("#f6f4ee"), 0.7, 1.205, -4.88, g); box(0.09, 0.02, 0.02, mat("#f2d66b"), 0.85, 1.205, -4.88, g);
  // Weltkarte rechts neben der Tafel
  const map = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.9), new THREE.MeshStandardMaterial({ map: worldMap(), roughness: 0.9 }));
  map.position.set(3.45, 2.05, -4.96); g.add(map);
  // Uhr, Plakat
  const clock = cyl(0.2, 0.2, 0.04, 16, mat("#f4f1ea"), -3.4, 2.75, -4.97, g); clock.rotation.x = Math.PI / 2;
  const poster = textPanel(1.0, 0.7, 200, "#d9a35b", [{ text: "Wir sind", size: 34, y: 0.3, color: "#3a2a1e" }, { text: "Klasse!", size: 52, y: 0.62, color: "#3a2a1e", weight: 800 }]);
  poster.material = new THREE.MeshStandardMaterial({ map: poster.material.map, roughness: 0.9 }); poster.position.set(4.47, 1.9, -1.5); poster.rotation.y = -Math.PI / 2; g.add(poster);
  // Deckenleuchten
  for (const z of [-3, 0, 3]) for (const x of [-1.8, 1.8]) box(1.3, 0.04, 0.3, basic("#fffaf0"), x, 3.37, z, g);
  // Lehrerpult (rechts vorn) mit Pilotenmütze und Flugzeugmodell
  const wood = mat("#9a6e44", { roughness: 0.6 });
  const desk = new THREE.Group(); desk.position.set(3.35, 0, -3.6); desk.rotation.y = -0.15; g.add(desk);
  box(1.6, 0.06, 0.8, wood, 0, 0.78, 0, desk);
  box(1.6, 0.72, 0.04, mat("#86603c"), 0, 0.39, 0.38, desk);
  box(0.04, 0.72, 0.8, mat("#86603c"), -0.78, 0.39, 0, desk); box(0.04, 0.72, 0.8, mat("#86603c"), 0.78, 0.39, 0, desk);
  const cap = pilotCap(); cap.position.set(0.3, 0.81, 0.12); cap.rotation.y = 0.5; desk.add(cap);
  const pm = planeModel(); pm.position.set(-0.3, 0.98, 0.0); pm.rotation.set(0.0, 0.9, -0.12); desk.add(pm);
  box(0.24, 0.05, 0.32, mat("#2f5a8a"), 0.66, 0.835, -0.15, desk); box(0.22, 0.04, 0.3, mat("#c8432f"), 0.66, 0.88, -0.16, desk);
  const mug = cyl(0.04, 0.04, 0.1, 10, mat("#e9e4d8"), -0.02, 0.86, 0.25, desk);
  // Schülertische: 9 Einzeltische, verschieden hoch (Alter 5–15)
  const deskSpots = [];
  const rows = [[-2.3, -0.85, 0.6, 1.75], [-1.5, 0, 2.4], [-0.9, 0.2]];
  const zs = [-2.4, -0.9, 0.55];
  rows.forEach((xs, ri) => xs.forEach((x, j) => {
    const sc = [0.8, 0.95, 1.0, 0.88, 0.7, 0.9, 0.85, 0.75, 1.0][deskSpots.length] ?? 1;
    const z = zs[ri] + (j % 2 ? 0.1 : -0.05);
    const top = 0.72 * sc + 0.08;
    box(0.8, 0.04, 0.55, mat("#c9a978"), x, top, z, g);
    box(0.76, top - 0.02, 0.04, mat("#5f7a8a"), x, (top - 0.02) / 2, z - 0.25, g);
    for (const dx of [-0.36, 0.36]) box(0.03, top, 0.03, mat("#4a4f55"), x + dx, top / 2, z + 0.22, g);
    // Stuhl
    box(0.42, 0.04, 0.4, mat("#3f6a8a"), x, 0.45 * sc, z + 0.55, g);
    box(0.42, 0.4 * sc, 0.04, mat("#3f6a8a"), x, 0.45 * sc + 0.22 * sc, z + 0.75, g);
    // Heft und Stift
    box(0.22, 0.008, 0.3, mat(r.pick(["#f4f1e8", "#e8c86a", "#9ac0d8"])), x - 0.1, top + 0.024, z + 0.05, g).rotation.y = r.range(-0.3, 0.3);
    deskSpots.push({ x, z: z + 0.5, scale: sc });
  }));
  // Dein Tisch hinten (Kamera)
  box(1.0, 0.04, 0.6, mat("#c9a978"), -0.4, 0.76, 2.75, g);
  box(0.96, 0.74, 0.04, mat("#5f7a8a"), -0.4, 0.37, 2.47, g);
  // Regal hinten rechts, Globus-artige Kugel, Bücher
  box(0.4, 1.6, 2.4, mat("#8a6a4a"), 4.25, 0.8, 1.8, g);
  for (let i = 0; i < 18; i++) box(0.22, r.range(0.22, 0.3), 0.05, mat(r.pick(["#7a2e2e", "#2f5a8a", "#c98b3a", "#3f5e4a", "#d9d4c7"])), 4.05, 0.98 + Math.floor(i / 9) * 0.5, 0.9 + (i % 9) * 0.2, g);
  g.traverse((o) => { if (o.isMesh) { o.castShadow = o.castShadow ?? true; o.receiveShadow = true; } });
  return { group: g, deskSpots, winMats, desk, cap, plane: pm };
}

// ============================================================== Festsaal ===
// Saal von z = DOOR_Z (Doppeltür, hinter dir) bis z = HEAD_Z (Pult der Bürgermeisterin).
export const DOOR_Z = 9;
export const HEAD_Z = -32;
export const TABLE = { z0: -1, z1: -28.5, w: 1.9, y: 0.76 };

function crestTexture() {
  return canvasTexture(256, 512, (c, w, h) => {
    c.fillStyle = "#6e1f24"; c.fillRect(0, 0, w, h);
    c.fillStyle = "#c9a14a"; c.fillRect(0, 0, w, 18); c.fillRect(0, h - 60, w, 8);
    // Fransen
    for (let x = 6; x < w; x += 14) c.fillRect(x, h - 40, 6, 40);
    // Schild mit Eiche (frei erfunden, kein echtes Wappen)
    c.fillStyle = "#f1e6c8";
    c.beginPath(); c.moveTo(48, 120); c.lineTo(208, 120); c.lineTo(208, 260); c.quadraticCurveTo(208, 350, 128, 390); c.quadraticCurveTo(48, 350, 48, 260); c.closePath(); c.fill();
    c.fillStyle = "#2f5a3a"; c.beginPath(); c.arc(128, 220, 44, 0, 6.3); c.fill(); c.beginPath(); c.arc(96, 250, 30, 0, 6.3); c.fill(); c.beginPath(); c.arc(160, 250, 30, 0, 6.3); c.fill();
    c.fillStyle = "#5a3a22"; c.fillRect(120, 250, 16, 80);
    c.fillStyle = "#c9a14a"; c.beginPath(); c.arc(128, 80, 16, 0, 6.3); c.fill();
  });
}

function panelTexture() {
  const { tex } = canvasTexture(512, 256, (c, w, h) => {
    c.fillStyle = "#5a3a24"; c.fillRect(0, 0, w, h);
    for (let i = 0; i < 4; i++) {
      c.fillStyle = "#4a2e1c"; c.fillRect(i * 128 + 14, 22, 100, h - 44);
      c.fillStyle = "#6b4630"; c.fillRect(i * 128 + 22, 30, 84, h - 60);
      c.fillStyle = "rgba(255,220,170,0.08)"; c.fillRect(i * 128 + 22, 30, 84, 6);
    }
    c.fillStyle = "#3a2416"; c.fillRect(0, 0, w, 10); c.fillRect(0, h - 10, w, 10);
  });
  tex.wrapS = THREE.RepeatWrapping;
  return tex;
}

export function festsaal({ seed = 1301 } = {}) {
  const r = rng(seed);
  const g = new THREE.Group();
  const W = 14, H = 8.5, Z0 = DOOR_Z, Z1 = HEAD_Z - 4, L = Z0 - Z1, ZC = (Z0 + Z1) / 2;
  const floorT = (() => { const { tex } = canvasTexture(256, 256, (c, w) => { c.fillStyle = "#5a3a26"; c.fillRect(0, 0, w, w); for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) { c.fillStyle = (i + j) % 2 ? "#6a4630" : "#4e3220"; c.fillRect(j * 32, i * 32, 31, 31); } }); tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(W / 2, L / 2); return tex; })();
  box(W, 0.1, L, mat("#ffffff", { map: floorT, roughness: 0.55 }), 0, -0.05, ZC, g);
  // Kassettendecke
  box(W, 0.2, L, mat("#3e2a1c"), 0, H, ZC, g);
  for (let z = Z1 + 2; z < Z0; z += 4) box(W, 0.35, 0.3, mat("#2e1e12"), 0, H - 0.25, z, g);
  for (const x of [-4.5, 0, 4.5]) box(0.3, 0.35, L, mat("#2e1e12"), x, H - 0.25, ZC, g);
  // Wände: Putz oben, Holzvertäfelung unten
  const plaster = mat("#c9a77a", { roughness: 0.95 });
  const pt = panelTexture();
  const pm = (len) => { const t = pt.clone(); t.needsUpdate = true; t.repeat.set(len / 4, 1); return mat("#ffffff", { map: t, roughness: 0.7 }); };
  for (const s of [-1, 1]) {
    box(0.2, H, L, plaster, s * W / 2, H / 2, ZC, g);
    box(0.08, 2.6, L, pm(L), s * (W / 2 - 0.12), 1.3, ZC, g);
    box(0.14, 0.12, L, mat("#3a2416"), s * (W / 2 - 0.14), 2.62, ZC, g);
  }
  box(W, H, 0.2, plaster, 0, H / 2, Z1, g);
  box(W, 2.6, 0.08, pm(W), 0, 1.3, Z1 + 0.12, g);
  // Türwand mit Öffnung für die Doppeltür (2.8 x 3.8)
  box((W - 2.8) / 2, H, 0.2, plaster, -(W / 2 + 1.4) / 2, H / 2, Z0, g);
  box((W - 2.8) / 2, H, 0.2, plaster, (W / 2 + 1.4) / 2, H / 2, Z0, g);
  box(2.8, H - 3.8, 0.2, plaster, 0, 3.8 + (H - 3.8) / 2, Z0, g);
  for (const s of [-1, 1]) box((W - 2.8) / 2, 2.6, 0.08, pm((W - 2.8) / 2), s * (W / 2 + 1.4) / 2, 1.3, Z0 - 0.12, g);
  box(3.2, 0.3, 0.3, mat("#3a2416"), 0, 3.95, Z0 - 0.1, g);
  for (const s of [-1, 1]) box(0.2, 3.9, 0.3, mat("#3a2416"), s * 1.5, 1.95, Z0 - 0.1, g);
  // Türflügel (drehen nach innen auf)
  const doorMat = mat("#5a3420", { roughness: 0.6 });
  const leaves = [-1, 1].map((s) => {
    const hinge = new THREE.Group(); hinge.position.set(s * 1.4, 0, Z0 - 0.05); g.add(hinge);
    box(1.4, 3.8, 0.1, doorMat, -s * 0.7, 1.9, 0, hinge);
    box(1.1, 1.4, 0.12, mat("#6e4228"), -s * 0.7, 2.6, 0, hinge); box(1.1, 1.4, 0.12, mat("#6e4228"), -s * 0.7, 1.0, 0, hinge);
    box(0.05, 0.3, 0.16, mat("#c9a14a", { metalness: 0.6 }), -s * 1.25, 1.9, 0, hinge);
    return hinge;
  });
  // Gleißendes Licht hinter der Tür
  const glare = new THREE.Mesh(new THREE.PlaneGeometry(4, 5), new THREE.MeshBasicMaterial({ color: "#fff8ec", toneMapped: false }));
  glare.position.set(0, 2.2, Z0 + 0.8); glare.rotation.y = Math.PI; g.add(glare);
  const glowTex = glowTexture();
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: "#fff2dc", transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
  glow.position.set(0, 1.9, Z0 + 0.65); glow.scale.set(7, 8, 1); g.add(glow);
  const floorGlow = new THREE.Mesh(new THREE.PlaneGeometry(2.8, 9), new THREE.MeshBasicMaterial({ map: glowTex, color: "#fff0d8", transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
  floorGlow.rotation.x = -Math.PI / 2; floorGlow.position.set(0, 0.02, Z0 - 4.2); floorGlow.scale.set(1.6, 1, 1); g.add(floorGlow);
  const doorLight = new THREE.SpotLight("#fff3e0", 0, 30, 0.75, 0.6, 1.2);
  doorLight.position.set(0, 2.6, Z0 + 1.0); doorLight.target.position.set(0, 0.4, Z0 - 10); g.add(doorLight); g.add(doorLight.target);
  // Hohe Fenster (Nacht, blau) an den Seiten
  for (let z = Z1 + 4; z < Z0 - 3; z += 5.5) for (const s of [-1, 1]) {
    box(0.06, 3.6, 1.6, mat("#2a3a5a", { emissive: new THREE.Color("#1e3050"), emissiveIntensity: 0.6, roughness: 0.2 }), s * (W / 2 - 0.1), 5.0, z, g);
    box(0.08, 3.7, 0.08, mat("#3a2416"), s * (W / 2 - 0.12), 5.0, z, g);
    box(0.4, 4.2, 0.5, mat("#7a2a26"), s * (W / 2 - 0.2), 5.0, z - 1.05, g);   // Vorhang
  }
  // Fahnen/Banner mit erfundenem Wappen hinter dem Pult
  const ct = crestTexture();
  for (const x of [-3.6, 3.6]) {
    const b = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 3.0), new THREE.MeshStandardMaterial({ map: ct.tex, roughness: 0.8, side: THREE.DoubleSide }));
    b.position.set(x, 4.5, Z1 + 0.15); g.add(b);
    box(1.8, 0.06, 0.06, mat("#c9a14a", { metalness: 0.6 }), x, 6.05, Z1 + 0.2, g);
  }
  for (const s of [-1, 1]) for (let z = Z1 + 8; z < Z0 - 4; z += 11) {
    const b = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 2.2), new THREE.MeshStandardMaterial({ map: ct.tex, roughness: 0.8, side: THREE.DoubleSide }));
    b.position.set(s * (W / 2 - 0.13), 4.9, z + 2.6); b.rotation.y = -s * Math.PI / 2; g.add(b);
  }
  // Großes Gemälde/Wappenschild in der Mitte hinter dem Pult
  const shield = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 2.6), new THREE.MeshStandardMaterial({ map: ct.tex, roughness: 0.7 }));
  shield.position.set(0, 4.8, Z1 + 0.14); g.add(shield);
  // Lange Tafel mit weißem Tischtuch
  const tl = TABLE.z0 - TABLE.z1, tz = (TABLE.z0 + TABLE.z1) / 2;
  box(TABLE.w, 0.06, tl, mat("#efe8da", { roughness: 0.9 }), 0, TABLE.y, tz, g);
  box(TABLE.w + 0.04, 0.4, tl + 0.04, mat("#e6dccb", { roughness: 0.95 }), 0, TABLE.y - 0.2, tz, g);
  box(0.5, 0.008, tl, mat("#8a2a26"), 0, TABLE.y + 0.035, tz, g);           // Tischläufer
  // Stühle, Gedecke, Kerzen (instanziert)
  const seats = [];
  for (const s of [-1, 1]) for (let z = TABLE.z0 - 0.4; z > TABLE.z1 + 0.2; z -= 0.56) seats.push({ x: s * (TABLE.w / 2 + 0.38), z, side: s });
  const NS = seats.length;
  const chairB = new THREE.InstancedMesh(new THREE.BoxGeometry(0.46, 0.55, 0.07), mat("#4a2c1a"), NS);
  const chairS = new THREE.InstancedMesh(new THREE.BoxGeometry(0.46, 0.06, 0.44), mat("#7a2a26"), NS);
  const plates = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.13, 0.11, 0.02, 14), mat("#f6f3ec", { roughness: 0.4 }), NS);
  const food = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.055, 0), mat("#ffffff"), NS * 2);
  const glasses = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.035, 0.028, 0.13, 8), new THREE.MeshStandardMaterial({ color: "#a8323a", roughness: 0.15, transparent: true, opacity: 0.8 }), NS);
  const o = new THREE.Object3D(), cc = new THREE.Color();
  seats.forEach((st, i) => {
    o.rotation.set(0, st.side > 0 ? -Math.PI / 2 : Math.PI / 2, 0);
    o.position.set(st.x + st.side * 0.24, 0.76, st.z); o.updateMatrix(); chairB.setMatrixAt(i, o.matrix);
    o.position.set(st.x + st.side * 0.02, 0.46, st.z); o.updateMatrix(); chairS.setMatrixAt(i, o.matrix);
    o.rotation.set(0, 0, 0);
    o.position.set(st.side * 0.58, TABLE.y + 0.04, st.z); o.updateMatrix(); plates.setMatrixAt(i, o.matrix);
    for (let k = 0; k < 2; k++) {
      o.position.set(st.side * 0.58 + r.range(-0.05, 0.05), TABLE.y + 0.07, st.z + (k ? 0.05 : -0.04)); o.rotation.set(r() * 3, r() * 3, 0); o.scale.set(1, 0.55, 1); o.updateMatrix();
      food.setMatrixAt(i * 2 + k, o.matrix); food.setColorAt(i * 2 + k, cc.set(k ? r.pick(["#c97a3a", "#a8522a", "#d9b25a"]) : r.pick(["#6f8a3a", "#e8d8a8", "#b8442a"])));
      o.scale.set(1, 1, 1); o.rotation.set(0, 0, 0);
    }
    o.position.set(st.side * 0.42, TABLE.y + 0.1, st.z - 0.2); o.updateMatrix(); glasses.setMatrixAt(i, o.matrix);
  });
  for (const m of [chairB, chairS, plates, food, glasses]) { m.castShadow = false; m.receiveShadow = true; g.add(m); }
  // Kerzen auf der Tafel (Leuchter alle ~1,7 m) mit Flammen-Sprites
  const flameMat = new THREE.SpriteMaterial({ map: glowTex, color: "#ffc070", transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
  const candles = [];
  const candleMat = mat("#f3ead2", { emissive: new THREE.Color("#ffd9a0"), emissiveIntensity: 0.35 });
  for (let z = TABLE.z0 - 0.9; z > TABLE.z1 + 0.4; z -= 1.7) {
    cyl(0.06, 0.09, 0.05, 8, mat("#c9a14a", { metalness: 0.7, roughness: 0.3 }), 0, TABLE.y + 0.06, z, g);
    for (const dx of [-0.1, 0.1]) {
      cyl(0.022, 0.022, 0.24, 6, candleMat, dx, TABLE.y + 0.2, z, g);
      const f = new THREE.Sprite(flameMat); f.position.set(dx, TABLE.y + 0.36, z); f.scale.set(0.16, 0.24, 1); g.add(f); candles.push(f);
      const core = new THREE.Mesh(new THREE.ConeGeometry(0.012, 0.045, 5), basic("#fff1c8")); core.position.set(dx, TABLE.y + 0.345, z); g.add(core);
    }
  }
  // Kronleuchter
  const chand = [];
  const brass = mat("#b8913e", { metalness: 0.7, roughness: 0.35 });
  const bulbMat = basic("#ffe7b8");
  for (const z of [-4, -13, -22, -30]) {
    const c = new THREE.Group(); c.position.set(0, 5.6, z); g.add(c);
    cyl(0.02, 0.02, H - 5.6, 4, mat("#2a2018"), 0, (H - 5.6) / 2, 0, c);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.85, 0.05, 6, 16), brass); ring.rotation.x = Math.PI / 2; c.add(ring);
    const bowl = new THREE.Mesh(new THREE.SphereGeometry(0.42, 10, 6, 0, 6.3, Math.PI / 2, Math.PI / 2), mat("#e9dcc0", { emissive: new THREE.Color("#ffd9a0"), emissiveIntensity: 0.5, side: THREE.DoubleSide })); bowl.position.y = 0.1; c.add(bowl);
    for (let k = 0; k < 10; k++) {
      const a = (k / 10) * Math.PI * 2;
      const b = new THREE.Mesh(new THREE.SphereGeometry(0.05, 6, 4), bulbMat); b.position.set(Math.cos(a) * 0.85, 0.12, Math.sin(a) * 0.85); c.add(b);
      const sp = new THREE.Sprite(flameMat); sp.position.copy(b.position); sp.scale.set(0.42, 0.42, 1); c.add(sp);
    }
    const pl = new THREE.PointLight("#ffc888", 9, 16, 1.4); pl.position.y = -0.3; c.add(pl);
    chand.push({ group: c, light: pl });
  }
  // Rednerpult am Kopfende
  box(5.5, 0.4, 3.4, mat("#4a2c1a"), 0, 0.2, HEAD_Z + 0.1, g);                 // Podium
  box(5.5, 0.02, 3.4, mat("#7a2a26"), 0, 0.41, HEAD_Z + 0.1, g);
  const lectern = new THREE.Group(); lectern.position.set(0, 0.4, HEAD_Z + 0.5); g.add(lectern);
  box(0.9, 1.1, 0.5, mat("#4a2c1a"), 0, 0.55, 0.3, lectern);
  const top = box(1.0, 0.06, 0.6, mat("#5a3420"), 0, 1.15, 0.28, lectern); top.rotation.x = 0.2;
  const crestSmall = new THREE.Mesh(new THREE.PlaneGeometry(0.35, 0.6), new THREE.MeshStandardMaterial({ map: ct.tex, roughness: 0.8 })); crestSmall.position.set(0, 0.62, 0.56); lectern.add(crestSmall);
  box(0.25, 0.01, 0.3, mat("#f4f1e8"), 0, 1.2, 0.28, lectern).rotation.x = 0.2;
  g.traverse((ob) => { if (ob.isMesh && ob.castShadow === undefined) ob.castShadow = false; });
  return { group: g, seats, leaves, glare, glow, floorGlow, doorLight, candles, chand, flameMat, candleMat };
}
