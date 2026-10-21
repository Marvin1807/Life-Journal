// Sets für "internet-weg": U-Bahn-Wagen, Supermarktkasse, Geldautomat bei Nacht, Bahnhofshalle, Späti,
// Supermarktgang, Hinterhof, Wohnzimmer bei Kerzenlicht. Dazu Figuren mit freundlichen Gesichtern (folk,
// übernommen aus nur-100) und Handys in ihren Händen. Nur für dieses Video, lib/ bleibt unverändert.
import { THREE, rng, clamp, smooth, lerp, building, windowTextures, glowTexture, streetLamp } from "./lib/lowpoly.js";
import { mat, basic, box, cyl, canvasTexture, textPanel, tileTexture, supermarketAisle, shoppingCart } from "./lib/props.js";

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

// ============================================================ Hilfsmittel ===
const SANS = "Arial, 'DejaVu Sans', sans-serif";
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

/** Handy mit hochaufgelöstem Bildschirm (für die Nahaufnahme am Anfang und Ende). */
export function bigPhone() {
  const g = new THREE.Group();
  box(0.074, 0.152, 0.009, mat("#17181c", { roughness: 0.3, metalness: 0.4 }), 0, 0, 0, g);
  box(0.0745, 0.1525, 0.004, mat("#2a2c31", { roughness: 0.35, metalness: 0.6 }), 0, 0, 0, g);   // Rahmen
  const screen = canvasTexture(600, 1280, () => {});
  screen.tex.anisotropy = 8;
  const s = new THREE.Mesh(new THREE.PlaneGeometry(0.068, 0.145), new THREE.MeshBasicMaterial({ map: screen.tex, toneMapped: false }));
  s.position.z = 0.0052; g.add(s);
  g.traverse((o) => { if (o.isMesh) { o.castShadow = false; o.receiveShadow = false; } });
  g.userData.screen = screen;
  return g;
}

/**
 * Handys in den Händen der Figuren (instanziert). Bildschirm auf der Rückseite (-z), damit er zur Figur zeigt.
 * set(i, { x, y, z, rotY, sit, scale, lift (0 = Schoß/Tisch, 1 = vors Gesicht), rest: "lap" | "table", visible, on })
 */
export function heldPhones(n) {
  const g = new THREE.Group();
  const body = new THREE.InstancedMesh(new THREE.BoxGeometry(0.075, 0.15, 0.011), mat("#1b1c20", { roughness: 0.4 }), n);
  const scrGeo = new THREE.PlaneGeometry(0.066, 0.136); scrGeo.rotateY(Math.PI); scrGeo.translate(0, 0, -0.0062);
  const scr = new THREE.InstancedMesh(scrGeo, new THREE.MeshBasicMaterial({ color: "#ffffff", toneMapped: false }), n);
  for (const m of [body, scr]) { m.frustumCulled = false; m.castShadow = false; m.instanceMatrix.setUsage(THREE.DynamicDrawUsage); g.add(m); }
  const c = new THREE.Color();
  for (let i = 0; i < n; i++) scr.setColorAt(i, c.set("#bcd6ff"));
  const mR = new THREE.Matrix4(), mL = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), v = new THREE.Vector3(), s = new THREE.Vector3();
  const zero = new THREE.Matrix4().makeScale(0, 0, 0);
  const POSE = { up: [0, 1.17, 0.47, 0.9], upTable: [0, 1.33, 0.5, 0.8], lap: [0, 0.94, 0.26, 1.42], table: [0, 1.215, 0.42, Math.PI / 2] };
  function set(i, o) {
    if (!o.visible) { body.setMatrixAt(i, zero); scr.setMatrixAt(i, zero); return; }
    const S = o.scale ?? 1;
    mR.compose(v.set(o.x, o.y ?? (o.sit ? -0.43 * S : 0), o.z), q.setFromEuler(e.set(0, o.rotY ?? 0, 0)), s.setScalar(S));
    const a = POSE[o.rest || "lap"], b = o.rest === "table" ? POSE.upTable : POSE.up, k = o.lift ?? 1;
    mL.compose(v.set(lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)), q.setFromEuler(e.set(lerp(a[3], b[3], k), 0, 0)), s.setScalar(1));
    mR.multiply(mL);
    body.setMatrixAt(i, mR); scr.setMatrixAt(i, mR);
    scr.setColorAt(i, c.set(o.on === false ? "#0d0e12" : (o.color || "#bcd6ff")));
  }
  function commit() { body.instanceMatrix.needsUpdate = true; scr.instanceMatrix.needsUpdate = true; scr.instanceColor.needsUpdate = true; }
  return { group: g, set, commit };
}

// Bunte Polster wie in der BVG
function seatTexture(seed = 3) {
  const r = rng(seed);
  const { tex } = canvasTexture(256, 256, (g, w, h) => {
    g.fillStyle = "#24305e"; g.fillRect(0, 0, w, h);
    const cols = ["#d9352f", "#f2c318", "#ffffff", "#2fa4d9", "#e66a2c"];
    for (let i = 0; i < 160; i++) {
      g.fillStyle = r.pick(cols); const x = r() * w, y = r() * h, s = r.range(4, 12);
      if (i % 3 === 0) g.fillRect(x, y, s, s * 0.4); else { g.beginPath(); g.arc(x, y, s / 3, 0, 6.3); g.fill(); }
    }
  });
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

// ========================================================== A: U-Bahn-Wagen ===
// Wagen entlang −z, Gang bei x = 0, Längssitze links und rechts. Kamera steht hinten bei z ≈ 1,3.
export function subwayCar({ seed = 301 } = {}) {
  const r = rng(seed);
  const g = new THREE.Group();
  const L = 19, W = 2.3, H = 2.25, Z0 = 2.6, ZC = Z0 - L / 2;
  box(W, 0.06, L, mat("#55555c"), 0, -0.03, ZC, g);
  box(0.5, 0.005, L, mat("#6a6a72"), 0, 0.002, ZC, g);
  box(W, 0.06, L, mat("#ebe6da"), 0, H, ZC, g);
  const lower = mat("#e4dcc0"), upper = mat("#f1ecdf");
  const glass = new THREE.MeshStandardMaterial({ color: "#0b1018", roughness: 0.15, metalness: 0.3, emissive: new THREE.Color("#0a1224"), emissiveIntensity: 1 });
  const DOORS = [-3.2, -10.6];
  for (const s of [-1, 1]) {
    box(0.06, 0.95, L, lower, s * W / 2, 0.475, ZC, g);
    box(0.05, 0.9, L, glass, s * W / 2, 1.4, ZC, g);
    box(0.06, 0.4, L, upper, s * W / 2, 2.05, ZC, g);
    for (let z = Z0 - 0.6; z > Z0 - L; z -= 1.5) box(0.08, 0.9, 0.08, upper, s * (W / 2 - 0.02), 1.4, z, g);   // Fensterstreben
    // Türen
    for (const d of DOORS) {
      box(0.08, 2.0, 1.4, mat("#f2c318", { roughness: 0.5 }), s * (W / 2 - 0.03), 1.0, d, g);
      box(0.09, 1.0, 0.5, glass, s * (W / 2 - 0.03), 1.35, d - 0.33, g);
      box(0.09, 1.0, 0.5, glass, s * (W / 2 - 0.03), 1.35, d + 0.33, g);
      box(0.1, 2.0, 0.03, mat("#3a3a3a"), s * (W / 2 - 0.03), 1.0, d, g);
      cyl(0.022, 0.022, H, 8, mat("#f2c318", { roughness: 0.4, metalness: 0.3 }), s * 0.62, H / 2, d + 0.85, g);
    }
    // Haltestangen längs unter der Decke
    const rail = cyl(0.017, 0.017, L, 8, mat("#c9ccd1", { metalness: 0.7, roughness: 0.3 }), s * 0.55, 1.95, ZC, g); rail.rotation.x = Math.PI / 2;
    // Lichtband
    box(0.22, 0.03, L - 0.6, basic("#fffbe8"), s * 0.45, H - 0.035, ZC, g);
  }
  // Sitze (Längsbänke)
  const seatMat = new THREE.MeshStandardMaterial({ map: seatTexture(seed), roughness: 0.9 });
  const seatSpots = [];
  for (const s of [-1, 1]) {
    for (let z = Z0 - 0.75; z > Z0 - L + 0.5; z -= 0.5) {
      if (DOORS.some((d) => Math.abs(z - d) < 1.0)) continue;
      seatSpots.push({ x: s * 0.84, z, rotY: -s * Math.PI / 2 });
      box(0.5, 0.1, 0.5, seatMat, s * (W / 2 - 0.27), 0.42, z, g);
      box(0.08, 0.5, 0.5, seatMat, s * (W / 2 - 0.05), 0.75, z, g);
      box(0.46, 0.37, 0.5, mat("#5c5b60"), s * (W / 2 - 0.27), 0.185, z, g);
    }
  }
  // Stirnwand mit Durchgangstür und Linienanzeige
  box(W, H, 0.08, upper, 0, H / 2, Z0 - L, g);
  box(0.75, 1.9, 0.09, mat("#c9c3b2"), 0, 0.95, Z0 - L + 0.02, g);
  box(0.45, 0.8, 0.1, glass, 0, 1.35, Z0 - L + 0.03, g);
  box(W, H, 0.08, upper, 0, H / 2, Z0 + 0.04, g);
  const disp = textPanel(1.5, 0.2, 400, "#101114", [{ text: "U2  Pankow  ·  Nächster Halt: Alexanderplatz", size: 36, y: 0.52, color: "#ff9a2a", font: "'Courier New', monospace", weight: 700 }]);
  disp.position.set(0, 2.05, Z0 - L + 0.05); g.add(disp);
  // Werbung über den Fenstern
  for (const s of [-1, 1]) for (let z = Z0 - 1.6; z > Z0 - L + 1; z -= 3.1) {
    const ad = box(0.02, 0.26, 0.9, mat(r.pick(["#d94f3d", "#2f80ed", "#27ae60", "#f2994a", "#9b51e0"])), s * (W / 2 - 0.04), 2.04, z, g);
    ad.castShadow = false;
  }
  // Tunnellichter, die draußen vorbeiziehen
  const NT = 24;
  const tl = new THREE.InstancedMesh(new THREE.BoxGeometry(0.05, 0.08, 0.7), basic("#ffd9a0"), NT);
  tl.frustumCulled = false; g.add(tl);
  const lights = [];
  for (let i = 0; i < NT; i++) lights.push({ s: i % 2 ? 1 : -1, y: r.range(1.1, 1.7), ph: r() * 40 });
  const pl1 = new THREE.PointLight("#fff6dc", 4, 9, 1.4); pl1.position.set(0, 2.0, -1); g.add(pl1);
  const pl2 = new THREE.PointLight("#fff6dc", 4, 9, 1.4); pl2.position.set(0, 2.0, -8); g.add(pl2);
  const o = new THREE.Object3D();
  return {
    group: g, seatSpots, Z0, L,
    update(t) {
      lights.forEach((l, i) => {
        const z = Z0 + 4 - ((t * 14 + l.ph) % 40);
        o.position.set(l.s * (W / 2 + 0.6), l.y, z); o.updateMatrix(); tl.setMatrixAt(i, o.matrix);
      });
      tl.instanceMatrix.needsUpdate = true;
    },
    lights: [pl1, pl2],
  };
}

// ======================================================= B: Supermarktkasse ===
// Du stehst am Ende des Kassenbands (x ≈ 0, z ≈ 0,3). Kasse rechts, Band nach −z, Kassiererin sitzt rechts.
function productTexture(seed) {
  const r = rng(seed);
  const { tex } = canvasTexture(512, 256, (g, w, h) => {
    g.fillStyle = "#c7cbd1"; g.fillRect(0, 0, w, h);
    const cols = ["#d94f3d", "#f2c94c", "#2f80ed", "#27ae60", "#f2994a", "#9b51e0", "#e0e0e0", "#eb5757", "#56ccf2", "#6fcf97"];
    for (let row = 0; row < 4; row++) {
      g.fillStyle = "#9aa0a8"; g.fillRect(0, row * 64 + 58, w, 6);
      let x = 0;
      while (x < w) { const bw = r.range(10, 26); g.fillStyle = r.pick(cols); const bh = r.range(26, 52); g.fillRect(x, row * 64 + 58 - bh, bw - 2, bh); x += bw; }
    }
  });
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

export function checkout({ seed = 401 } = {}) {
  const r = rng(seed);
  const g = new THREE.Group();
  const ft = tileTexture("#e7e3da", "#cdc8bd", 8); ft.repeat.set(10, 10);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(20, 20), new THREE.MeshStandardMaterial({ map: ft, roughness: 0.35 }));
  floor.rotation.x = -Math.PI / 2; floor.position.z = -6; floor.receiveShadow = true; g.add(floor);
  box(20, 0.05, 20, mat("#dcdcd8"), 0, 3.4, -6, g);
  for (let z = 1; z > -15; z -= 2.4) for (const x of [-3, 0, 3]) box(1.4, 0.03, 0.3, basic("#fffaf0"), x, 3.36, z, g);
  // Regale im Hintergrund
  const pt = productTexture(seed);
  for (let i = 0; i < 5; i++) {
    const t = pt.clone(); t.needsUpdate = true; t.repeat.set(2, 1); t.offset.x = i * 0.37;
    const sh = box(1.2, 2.1, 7, mat("#ffffff", { map: t, roughness: 0.6 }), -4.4 + i * 2.2, 1.05, -10.5, g);
    sh.rotation.y = 0; sh.material = [mat("#c7cbd1"), mat("#c7cbd1"), mat("#9aa0a8"), mat("#9aa0a8"), new THREE.MeshStandardMaterial({ map: t, roughness: 0.6 }), new THREE.MeshStandardMaterial({ map: t, roughness: 0.6 })];
    sh.rotation.y = Math.PI / 2;
  }
  // Rückwand mit Marktschild
  box(20, 3.4, 0.1, mat("#efe9df"), 0, 1.7, -14, g);
  const banner = textPanel(5, 0.7, 120, "#c8282e", [{ text: "Frische · Vielfalt · Kiezmarkt", size: 46, y: 0.54 }]);
  banner.position.set(0, 2.7, -13.9); g.add(banner);
  // Kassen (unsere bei x = 0,62; Nachbarkasse bei x = −1,4)
  const lanes = [0.62, -1.5];
  const counterMat = mat("#5a5f68"), topMat = mat("#c9ccd1", { metalness: 0.4, roughness: 0.4 }), beltMat = mat("#202226", { roughness: 0.7 });
  for (const x of lanes) {
    box(0.62, 0.86, 4.2, counterMat, x, 0.43, -1.9, g);
    box(0.64, 0.03, 4.2, topMat, x, 0.875, -1.9, g);
    box(0.5, 0.02, 2.6, beltMat, x, 0.9, -2.75, g);
    // Kassenhäuschen rechts daneben
    box(0.08, 1.05, 1.4, counterMat, x + 0.95, 0.52, -1.1, g);
    const mon = new THREE.Group(); mon.position.set(x + 0.25, 1.15, -0.95); g.add(mon);
    box(0.05, 0.25, 0.04, mat("#2a2c31"), 0, -0.12, 0, mon);
    box(0.3, 0.2, 0.03, mat("#2a2c31"), 0, 0.02, 0, mon).rotation.y = 0.5;
    // Kassennummer
    const num = textPanel(0.3, 0.3, 300, "#c8282e", [{ text: x > 0 ? "3" : "4", size: 70, y: 0.55 }]);
    num.position.set(x + 0.3, 2.35, -1.2); g.add(num);
    cyl(0.015, 0.015, 1.0, 6, mat("#7a7f86"), x + 0.3, 2.9, -1.2, g);
    // Einkäufe auf dem Band
    for (let k = 0; k < 7; k++) {
      const w = r.range(0.08, 0.2), h = r.range(0.08, 0.25);
      const it = box(w, h, w * 0.8, mat(r.pick(["#d94f3d", "#f2c94c", "#2f80ed", "#27ae60", "#f2994a", "#ffffff", "#8a5a3a"])), x + r.range(-0.15, 0.15), 0.91 + h / 2, -1.8 - k * 0.32, g);
      it.rotation.y = r.range(-0.4, 0.4);
    }
  }
  // Kartenterminal (dein Ende der Kasse), Bildschirm zeigt zu dir
  const term = new THREE.Group(); term.position.set(0.26, 1.0, -0.14); term.rotation.set(-0.8, -0.42, 0, "YXZ"); g.add(term);
  box(0.12, 0.21, 0.035, mat("#26282d", { roughness: 0.4 }), 0, 0, 0, term);
  const tdisp = drawPanel(0.1, 0.08, 3000, () => {});
  tdisp.mesh.position.set(0, 0.048, 0.0185); term.add(tdisp.mesh);
  for (let k = 0; k < 12; k++) box(0.022, 0.012, 0.006, mat(k === 9 ? "#c0392b" : k === 11 ? "#27ae60" : "#d9d9d9"), -0.03 + (k % 3) * 0.03, -0.012 - Math.floor(k / 3) * 0.02, 0.019, term);
  cyl(0.03, 0.04, 0.12, 8, mat("#3a3c42"), 0.26, 0.92, -0.2, g);
  // Schild „Nur Barzahlung“ (Pappe auf einem Ständer)
  const sign = drawPanel(0.62, 0.42, 900, (c, w, h) => {
    c.fillStyle = "#f4efe2"; c.fillRect(0, 0, w, h);
    c.strokeStyle = "#c0392b"; c.lineWidth = 14; c.strokeRect(18, 18, w - 36, h - 36);
    c.fillStyle = "#c0392b"; c.textAlign = "center"; c.textBaseline = "middle";
    c.font = handFont(88); c.fillText("Nur", w / 2, h * 0.3);
    c.font = handFont(80); c.fillText("Barzahlung!", w / 2, h * 0.58);
    c.fillStyle = "#333"; c.font = handFont(36); c.fillText("Kartenzahlung gestört", w / 2, h * 0.83);
  }, { basicMat: false });
  sign.mesh.position.set(0.3, 1.5, -1.95); sign.mesh.rotation.y = -0.1; g.add(sign.mesh);
  cyl(0.012, 0.012, 0.55, 6, mat("#7a7f86"), 0.3, 1.02, -1.97, g);
  return { group: g, term: tdisp, lanes };
}

// ======================================================== C: Geldautomat ===
// Fassade bei z = −3 (Front), Automat bei x = 0. Kamera steht in der Schlange bei z ≈ 3.
export function atmStreet({ seed = 501 } = {}) {
  const r = rng(seed);
  const g = new THREE.Group();
  const cob = (() => { const { tex } = canvasTexture(256, 256, (c, w) => { c.fillStyle = "#6c6a66"; c.fillRect(0, 0, w, w); for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) { const v = 120 + Math.floor(r() * 30); c.fillStyle = `rgb(${v},${v},${v - 6})`; c.fillRect(x * 32 + 2, y * 32 + 2, 28, 28); } }); tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(30, 12); return tex; })();
  const walk = new THREE.Mesh(new THREE.PlaneGeometry(60, 9), new THREE.MeshStandardMaterial({ map: cob, roughness: 0.9 }));
  walk.rotation.x = -Math.PI / 2; walk.position.set(0, 0, 1.5); walk.receiveShadow = true; g.add(walk);
  const road = new THREE.Mesh(new THREE.PlaneGeometry(60, 12), mat("#2c2d31"));
  road.rotation.x = -Math.PI / 2; road.position.set(0, -0.12, 12); g.add(road);
  box(60, 0.14, 0.25, mat("#8a8780"), 0, -0.05, 6, g);
  const tex = windowTextures(seed, "altbau");
  const facades = [];
  [["#c9b28f", -9], ["#b7a48a", 0], ["#c2a78e", 9.2]].forEach(([c, x], i) => {
    const b = building({ w: 9, h: 17, d: 8, color: c, tex }); b.mesh.position.set(x, 0, -7 - (i === 1 ? 0 : 0.3)); g.add(b.mesh); facades.push(b.material);
  });
  // Bank-Erdgeschoss
  box(9, 3.4, 0.1, mat("#d8d2c6"), 0, 1.7, -2.98, g);
  for (const x of [-3.2, 3.2]) box(2.2, 2.2, 0.06, new THREE.MeshStandardMaterial({ color: "#3a4a5a", emissive: new THREE.Color("#6a88aa"), emissiveIntensity: 0.25, roughness: 0.2 }), x, 1.4, -2.93, g);
  const bankSign = textPanel(3.4, 0.45, 200, "#1d4f8f", [{ text: "Kiezbank · Geldautomat", size: 54, y: 0.54 }]);
  bankSign.position.set(0, 2.95, -2.92); g.add(bankSign);
  // Automat
  const atm = new THREE.Group(); atm.position.set(0, 0, -2.9); g.add(atm);
  box(1.0, 1.9, 0.12, mat("#9aa1a8", { metalness: 0.6, roughness: 0.35 }), 0, 1.15, 0.0, atm);
  box(0.86, 0.06, 0.3, mat("#7a8188", { metalness: 0.6, roughness: 0.35 }), 0, 1.08, 0.13, atm).rotation.x = 0.25;
  const screen = drawPanel(0.5, 0.38, 1400, (c, w, h) => {
    c.fillStyle = "#123a7a"; c.fillRect(0, 0, w, h);
    c.fillStyle = "#ffffff"; c.textAlign = "center"; c.textBaseline = "middle";
    c.font = `700 112px ${SANS}`; c.fillText("Außer", w / 2, h * 0.3);
    c.fillText("Betrieb", w / 2, h * 0.56);
    c.font = `500 40px ${SANS}`; c.fillStyle = "#c9d8f0"; c.fillText("Keine Verbindung zur Bank", w / 2, h * 0.82);
  });
  screen.mesh.position.set(0, 1.52, 0.065); atm.add(screen.mesh);
  box(0.3, 0.03, 0.04, mat("#202226"), 0.25, 1.2, 0.08, atm);
  for (let k = 0; k < 12; k++) box(0.05, 0.035, 0.02, mat("#d0d3d8"), -0.08 + (k % 3) * 0.065, 1.15 - Math.floor(k / 3) * 0.05, 0.25 - Math.floor(k / 3) * 0.012, atm).rotation.x = 0.25;
  const atmLight = new THREE.PointLight("#bcd4ff", 3, 5, 1.5); atmLight.position.set(0, 2.4, -2.2); g.add(atmLight);
  // Papierzettel
  const note = drawPanel(0.2, 0.26, 1200, (c, w, h) => {
    c.fillStyle = "#fbf8ee"; c.fillRect(0, 0, w, h); c.fillStyle = "#222"; c.textAlign = "center"; c.textBaseline = "middle";
    c.font = handFont(46); c.fillText("Heute kein", w / 2, h * 0.35); c.fillText("Bargeld!", w / 2, h * 0.58);
  }, { basicMat: false });
  note.mesh.position.set(0.66, 1.55, -2.86); note.mesh.rotation.z = 0.06; g.add(note.mesh);
  // Laterne, geparkte Autos
  const glowT = glowTexture();
  const lamp = streetLamp(glowT); lamp.group.position.set(-3.2, 0, 4.8); g.add(lamp.group);
  const lampLight = new THREE.PointLight("#ffc98a", 18, 16, 1.4); lampLight.position.set(-3.2, 5.6, 4.6); g.add(lampLight);
  return { group: g, facades, screen };
}

// ===================================================== D: Bahnhofshalle ===
// Halle entlang −z, Glasdach als Tonnengewölbe, große Anzeigetafel bei z = −13.
export function stationHall({ seed = 601 } = {}) {
  const r = rng(seed);
  const g = new THREE.Group();
  const ft = tileTexture("#cfc9bd", "#a9a296", 6); ft.repeat.set(16, 24);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(26, 44), new THREE.MeshStandardMaterial({ map: ft, roughness: 0.4 }));
  floor.rotation.x = -Math.PI / 2; floor.position.z = -12; floor.receiveShadow = true; g.add(floor);
  // Seitenwände mit Läden
  const wallMat = mat("#b9aa94");
  for (const s of [-1, 1]) {
    box(0.3, 8, 44, wallMat, s * 13, 4, -12, g);
    const shops = ["Bäckerei", "Presse", "Blumen", "Reisezentrum", "Kaffee"];
    shops.forEach((n, i) => {
      const z = 4 - i * 6.4 - (s > 0 ? 3 : 0);
      box(0.1, 2.6, 4.6, new THREE.MeshStandardMaterial({ color: "#2a3440", emissive: new THREE.Color("#ffd9a0"), emissiveIntensity: 0.35, roughness: 0.3 }), s * 12.82, 1.5, z, g);
      const sg = textPanel(4.2, 0.5, 120, "#2b2f36", [{ text: n, size: 40, y: 0.55, color: "#ffd27a" }]);
      sg.rotation.y = -s * Math.PI / 2; sg.position.set(s * 12.78, 3.1, z); g.add(sg);
    });
  }
  // Gewölbe: Stahlbögen + Glas
  const steel = mat("#5d6670", { metalness: 0.5, roughness: 0.5 });
  for (let z = 8; z > -34; z -= 4) {
    const rib = new THREE.Mesh(new THREE.TorusGeometry(13, 0.14, 4, 28, Math.PI), steel); rib.position.set(0, 8, z); g.add(rib);
  }
  const glass = new THREE.Mesh(new THREE.CylinderGeometry(13, 13, 44, 28, 1, true, -Math.PI / 2, Math.PI), new THREE.MeshBasicMaterial({ color: "#cfe0ee", side: THREE.BackSide, transparent: true, opacity: 0.9 }));
  glass.rotation.set(-Math.PI / 2, 0, 0); glass.position.set(0, 8, -12);   // Halbschale nach oben, längs z
  g.add(glass);
  // Längsstreben im Glas
  for (let a = 0.15; a < Math.PI; a += 0.28) {
    const st = box(0.1, 0.1, 44, steel, Math.cos(a) * 12.9, 8 + Math.sin(a) * 12.9, -12, g); st.castShadow = false;
  }
  box(26, 0.1, 0.1, steel, 0, 8, -12, g);
  // Stirnwand hinten mit Bahnsteigzugängen
  box(26, 8, 0.3, mat("#a89a86"), 0, 4, -34, g);
  for (const x of [-8, -2.7, 2.7, 8]) {
    box(3.6, 3.2, 0.1, mat("#1c2026"), x, 1.6, -33.8, g);
    const ps = textPanel(2.2, 0.45, 160, "#1d3b8f", [{ text: `Gleis ${x < -5 ? "1–2" : x < 0 ? "3–4" : x < 5 ? "5–6" : "7–8"}`, size: 46, y: 0.54 }]);
    ps.position.set(x, 3.6, -33.8); g.add(ps);
  }
  // Große Anzeigetafel
  const board = new THREE.Group(); board.position.set(0, 4.6, -13); g.add(board);
  box(7.4, 2.6, 0.25, mat("#1d2026"), 0, 0, 0, board);
  for (const x of [-3, 3]) cyl(0.04, 0.04, 3.4, 6, steel, x, 3.0, 0, board);
  const bd = drawPanel(7.1, 2.3, 220, (c, w, h) => {
    c.fillStyle = "#0e2a5c"; c.fillRect(0, 0, w, h);
    c.fillStyle = "#ffffff"; c.textBaseline = "middle"; c.textAlign = "left";
    c.font = `700 70px ${SANS}`; c.fillText("Abfahrt", 40, 64);
    c.font = `500 40px ${SANS}`; c.fillStyle = "#b9c8e6";
    c.fillText("Zeit      Zug        Ziel                                   Gleis", 40, 140);
    c.fillStyle = "#16346e"; c.fillRect(0, 168, w, 4);
    const rows = 5;
    for (let i = 0; i < rows; i++) {
      const y = 210 + i * 46;
      c.fillStyle = "rgba(255,255,255,0.28)"; c.font = `500 36px ${SANS}`;
      c.fillText("– –:– –     – – –       – – – – – – – – – – –                 – –", 40, y);
    }
    c.fillStyle = "#ffd200"; c.fillRect(0, h * 0.53, w, 150);
    c.fillStyle = "#0e2a5c"; c.textAlign = "center"; c.font = `800 92px ${SANS}`;
    c.fillText("Fahrplan nicht verfügbar", w / 2, h * 0.53 + 78);
  });
  bd.mesh.position.z = 0.13; board.add(bd.mesh);
  // Bahnhofsuhr
  const clock = drawPanel(0.9, 0.9, 300, (c, w) => {
    c.fillStyle = "#ffffff"; c.beginPath(); c.arc(w / 2, w / 2, w / 2 - 4, 0, 6.3); c.fill();
    c.strokeStyle = "#111"; c.lineWidth = 10; c.stroke();
    for (let i = 0; i < 12; i++) { const a = i / 12 * 6.283; c.fillStyle = "#111"; c.save(); c.translate(w / 2, w / 2); c.rotate(a); c.fillRect(-6, -w / 2 + 18, 12, 40); c.restore(); }
    const hand = (a, len, wd, col) => { c.save(); c.translate(w / 2, w / 2); c.rotate(a); c.fillStyle = col; c.fillRect(-wd / 2, -len, wd, len + 20); c.restore(); };
    hand((6 + 16 / 60) / 12 * 6.283, 80, 18, "#111"); hand(16 / 60 * 6.283, 120, 12, "#111"); hand(0.6, 115, 5, "#c0392b");
  }, { basicMat: false });
  clock.mesh.position.set(-4.6, 4.6, -12.9); g.add(clock.mesh);
  const hallLight = new THREE.PointLight("#fff1dc", 0, 30, 1.2); hallLight.position.set(0, 6, -6); g.add(hallLight);
  return { group: g, board: bd, hallLight };
}

/** Papierstadtplan (gefaltet, beidseitig). */
export function paperMap(w = 0.36, h = 0.26, seed = 7) {
  const r = rng(seed);
  const { tex } = canvasTexture(720, 520, (c, cw, ch) => {
    c.fillStyle = "#f3eedd"; c.fillRect(0, 0, cw, ch);
    c.fillStyle = "#cfe3c0"; for (let i = 0; i < 6; i++) c.fillRect(r() * cw, r() * ch, r.range(40, 120), r.range(30, 90));
    c.fillStyle = "#a9cbe8"; c.beginPath(); c.moveTo(0, ch * 0.62); c.bezierCurveTo(cw * 0.3, ch * 0.5, cw * 0.6, ch * 0.78, cw, ch * 0.66); c.lineTo(cw, ch * 0.72); c.bezierCurveTo(cw * 0.6, ch * 0.84, cw * 0.3, ch * 0.56, 0, ch * 0.68); c.fill();
    c.strokeStyle = "#ffffff"; c.lineWidth = 7;
    for (let i = 0; i < 14; i++) { c.beginPath(); const x = r() * cw, y = r() * ch; c.moveTo(x, y); c.lineTo(x + r.range(-300, 300), y + r.range(-200, 200)); c.stroke(); }
    c.strokeStyle = "#f2c94c"; c.lineWidth = 12;
    for (let i = 0; i < 3; i++) { c.beginPath(); c.moveTo(0, r() * ch); c.lineTo(cw, r() * ch); c.stroke(); }
    c.strokeStyle = "rgba(0,0,0,0.18)"; c.lineWidth = 3;
    for (let i = 1; i < 4; i++) { c.beginPath(); c.moveTo(cw * i / 4, 0); c.lineTo(cw * i / 4, ch); c.stroke(); }
    c.beginPath(); c.moveTo(0, ch / 2); c.lineTo(cw, ch / 2); c.stroke();
    c.fillStyle = "#c0392b"; c.font = `800 46px ${SANS}`; c.textAlign = "left"; c.textBaseline = "top";
    c.fillStyle = "rgba(255,255,255,0.85)"; c.fillRect(14, 12, 290, 64);
    c.fillStyle = "#c0392b"; c.fillText("Stadtplan Berlin", 22, 22);
  });
  const geo = new THREE.PlaneGeometry(w, h, 4, 1);
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) { const x = p.getX(i); p.setZ(i, (Math.round((x / w + 0.5) * 4) % 2) * 0.012); }
  geo.computeVertexNormals();
  const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9, side: THREE.DoubleSide }));
  m.castShadow = false;
  return m;
}

// ============================================================ E: Späti ===
// Altbau bei z = −3, Kioskfenster bei x = −0,8, Zeitungsständer rechts. Kamera bei z ≈ 3.
export function spaeti({ seed = 701 } = {}) {
  const r = rng(seed);
  const g = new THREE.Group();
  const walkT = tileTexture("#b9b2a6", "#8f887c", 4); walkT.repeat.set(20, 8);
  const walk = new THREE.Mesh(new THREE.PlaneGeometry(40, 12), new THREE.MeshStandardMaterial({ map: walkT, roughness: 0.9 }));
  walk.rotation.x = -Math.PI / 2; walk.position.set(0, 0, 2); walk.receiveShadow = true; g.add(walk);
  const tex = windowTextures(seed, "altbau");
  [["#d6b48a", -8.5], ["#e1c9a4", 0], ["#b9c4b0", 8.6]].forEach(([c, x]) => { const b = building({ w: 8.4, h: 18, d: 8, color: c, tex }); b.mesh.position.set(x, 0, -8.1); g.add(b.mesh); });
  // Ladenfront mit echter Kioskfenster-Öffnung (x −1,75…−0,25, y 0,95…2,15)
  const front = mat("#2a3b4c");
  box(2.45, 3.3, 0.12, front, -2.975, 1.65, -2.96, g);
  box(4.45, 3.3, 0.12, front, 1.975, 1.65, -2.96, g);
  box(1.5, 0.95, 0.12, front, -1.0, 0.475, -2.96, g);
  box(1.5, 1.15, 0.12, front, -1.0, 2.725, -2.96, g);
  box(8.4, 0.15, 1.2, mat("#24303c"), 0, 3.37, -3.5, g);                      // Vordach bis zur Hauswand
  // Innenraum hinter dem Fenster
  box(1.6, 1.6, 0.05, mat("#3a2e26"), -1.0, 1.6, -4.0, g);
  for (const x of [-1.8, -0.2]) box(0.05, 1.6, 1.05, mat("#3a2e26"), x, 1.6, -3.5, g);
  box(1.6, 0.05, 1.05, mat("#3a2e26"), -1.0, 2.4, -3.5, g);
  const goods = drawPanel(1.5, 1.2, 200, (c, w, h) => {
    c.fillStyle = "#4a3a2e"; c.fillRect(0, 0, w, h);
    const cols = ["#c0392b", "#f2c94c", "#2f80ed", "#27ae60", "#e67e22", "#ecf0f1", "#8e44ad"];
    for (let row = 0; row < 4; row++) { c.fillStyle = "#2a1e16"; c.fillRect(0, row * h / 4 + h / 4 - 6, w, 6); for (let x = 6; x < w - 16; x += 20) { c.fillStyle = cols[(x * 7 + row * 3) % cols.length]; c.fillRect(x, row * h / 4 + 14, 15, h / 4 - 22); } }
  }, { basicMat: false });
  goods.mesh.position.set(-1.0, 1.6, -3.97); g.add(goods.mesh);
  const sign = textPanel(4.6, 0.75, 200, "#1b2b6b", [{ text: "SPÄTI", size: 104, y: 0.56, color: "#ffd23a", weight: 800 }]);
  sign.position.set(0.2, 2.95, -2.88); g.add(sign);
  const win = drawPanel(2.4, 1.5, 300, (c, w, h) => {
    c.fillStyle = "#1f2a33"; c.fillRect(0, 0, w, h);
    const cols = ["#3a7d3a", "#8a5a2a", "#d9a03a", "#c0392b", "#2f80ed", "#f2f2f2"];
    for (let row = 0; row < 4; row++) {
      c.fillStyle = "#6a6a6a"; c.fillRect(0, row * h / 4 + h / 4 - 8, w, 8);
      for (let x = 10; x < w - 20; x += 26) { c.fillStyle = cols[(x / 26 + row * 3) % cols.length | 0]; c.fillRect(x, row * h / 4 + 20, 18, h / 4 - 30); c.fillRect(x + 5, row * h / 4 + 8, 8, 14); }
    }
    c.fillStyle = "rgba(255,255,255,0.08)"; c.fillRect(0, 0, w, h);
  }, { basicMat: false });
  win.mesh.position.set(1.9, 1.35, -2.89); g.add(win.mesh);
  box(1.7, 0.08, 0.45, mat("#7a5232"), -1.0, 0.98, -2.82, g);                // Theke
  const kioskLight = new THREE.PointLight("#ffd9a0", 3, 4, 1.5); kioskLight.position.set(-1.0, 2.1, -3.5); g.add(kioskLight);
  // Getränkekisten + Bank
  for (let k = 0; k < 6; k++) box(0.4, 0.3, 0.32, mat(k % 2 ? "#2f6a3a" : "#c0392b"), 3.4 + (k % 2) * 0.42, 0.15 + Math.floor(k / 2) * 0.3, -2.4, g);
  box(1.6, 0.06, 0.4, mat("#7a5232"), -3.4, 0.46, -2.5, g);
  for (const x of [-4.1, -2.7]) box(0.06, 0.45, 0.35, mat("#3a3a3a"), x, 0.23, -2.5, g);
  // Zeitungsständer (leer) + Pappschild
  const rack = new THREE.Group(); rack.position.set(1.15, 0, -1.9); rack.rotation.y = -0.08; g.add(rack);
  const wire = mat("#9aa0a8", { metalness: 0.6, roughness: 0.4 });
  for (const x of [-0.4, 0.4]) box(0.03, 1.3, 0.03, wire, x, 0.65, 0, rack);
  for (let k = 0; k < 3; k++) { const sh = box(0.85, 0.02, 0.28, wire, 0, 0.45 + k * 0.33, 0.06, rack); sh.rotation.x = -0.45; box(0.85, 0.06, 0.015, wire, 0, 0.47 + k * 0.33, 0.19, rack); }
  // zwei letzte Werbeprospekte, keine Zeitungen
  const card = drawPanel(0.62, 0.42, 900, (c, w, h) => {
    c.fillStyle = "#c9a26a"; c.fillRect(0, 0, w, h);
    c.fillStyle = "rgba(0,0,0,0.08)"; for (let i = 0; i < 40; i++) c.fillRect(0, i * 10, w, 2);
    c.fillStyle = "#1d1d1d"; c.textAlign = "center"; c.textBaseline = "middle";
    c.font = handFont(84); c.fillText("Zeitungen", w / 2, h * 0.32);
    c.fillStyle = "#b02a20"; c.font = handFont(80); c.fillText("ausverkauft!", w / 2, h * 0.64);
  }, { basicMat: false });
  card.mesh.position.set(0, 1.5, 0.2); card.mesh.rotation.x = -0.05; rack.add(card.mesh);
  return { group: g };
}

// =========================================================== G: Hinterhof ===
export function greenTree(seed = 1, h = 7) {
  const r = rng(seed);
  const g = new THREE.Group();
  cyl(0.18, 0.28, h * 0.55, 6, mat("#5a4332"), 0, h * 0.275, 0, g);
  const cols = ["#4f8a3a", "#5e9a42", "#3f7a34", "#6aa64a"];
  for (let i = 0; i < 5; i++) {
    const m = new THREE.Mesh(new THREE.IcosahedronGeometry(r.range(1.4, 2.0) * h / 7, 0), mat(r.pick(cols)));
    m.position.set(r.range(-1, 1) * h / 7, h * r.range(0.62, 0.86), r.range(-1, 1) * h / 7);
    m.rotation.set(r() * 3, r() * 3, 0); m.castShadow = true; g.add(m);
  }
  return g;
}
export function guitar() {
  const g = new THREE.Group();
  const wood = mat("#c98a4a", { roughness: 0.5 });
  const b1 = cyl(0.17, 0.17, 0.09, 12, wood, 0, 0, 0, g); b1.rotation.x = Math.PI / 2;
  const b2 = cyl(0.13, 0.13, 0.09, 12, wood, 0, 0.22, 0, g); b2.rotation.x = Math.PI / 2;
  const hole = cyl(0.05, 0.05, 0.092, 10, mat("#2a1a10"), 0, 0.08, 0, g); hole.rotation.x = Math.PI / 2;
  box(0.05, 0.5, 0.03, mat("#4a2e1c"), 0, 0.55, 0.02, g);
  box(0.08, 0.12, 0.035, mat("#3a2414"), 0, 0.84, 0.02, g);
  return g;
}

export function courtyard({ seed = 801 } = {}) {
  const r = rng(seed);
  const g = new THREE.Group();
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(24, 24), new THREE.MeshStandardMaterial({ map: (() => { const t = cobbles(seed); t.repeat.set(6, 6); return t; })(), roughness: 0.95 }));
  ground.rotation.x = -Math.PI / 2; ground.position.z = -3; ground.receiveShadow = true; g.add(ground);
  const tex = windowTextures(seed, "altbau");
  const back = building({ w: 18, h: 19, d: 2, color: "#e2cfae", tex }); back.mesh.position.set(0, 0, -11); g.add(back.mesh);
  const left = building({ w: 2, h: 19, d: 18, color: "#d3b896", tex }); left.mesh.position.set(-8, 0, -3); g.add(left.mesh);
  const right = building({ w: 2, h: 19, d: 18, color: "#c9b8a0", tex }); right.mesh.position.set(8, 0, -3); g.add(right.mesh);
  const tree = greenTree(seed, 7.5); tree.position.set(3.6, 0, -6.5); g.add(tree);
  // Rasenstück, Sandkasten, Bank, Fahrräder, Blumenkübel
  box(5, 0.04, 3.4, mat("#6a9a4a"), -3.2, 0.02, -7.6, g);
  box(2.2, 0.18, 2.2, mat("#7a5a3a"), 3.3, 0.09, -3.2, g); box(2.0, 0.2, 2.0, mat("#e6d29a"), 3.3, 0.1, -3.2, g);
  box(1.8, 0.07, 0.45, mat("#8a5a32"), 4.6, 0.46, -6.9, g); box(1.8, 0.4, 0.06, mat("#8a5a32"), 4.6, 0.75, -7.12, g);
  for (const x of [3.9, 5.3]) box(0.06, 0.46, 0.4, mat("#333"), x, 0.23, -6.9, g);
  for (let i = 0; i < 4; i++) {
    const b = new THREE.Group(); b.position.set(-6.4, 0, -1.2 - i * 0.7); b.rotation.y = Math.PI / 2; g.add(b);
    for (const z of [-0.5, 0.5]) { const w = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.03, 4, 14), mat("#222")); w.position.set(0, 0.34, z); w.rotation.y = Math.PI / 2; b.add(w); }
    box(0.04, 0.04, 0.9, mat(r.pick(["#c0392b", "#2f80ed", "#27ae60", "#e0e0e0"])), 0, 0.6, 0, b);
  }
  for (const [x, z] of [[-5.5, -9.5], [1.2, -9.6], [6.2, -9.4]]) {
    cyl(0.32, 0.25, 0.55, 8, mat("#b5653a"), x, 0.27, z, g);
    const f = new THREE.Mesh(new THREE.IcosahedronGeometry(0.4, 0), mat(r.pick(["#4f8a3a", "#d9548a", "#f2c94c"]))); f.position.set(x, 0.75, z); g.add(f);
  }
  // Wäscheleine mit Wimpeln
  const line = box(10, 0.01, 0.01, mat("#ddd"), 0, 3.4, -5, g);
  for (let i = 0; i < 16; i++) {
    const p = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.3, 3), basic(["#e74c3c", "#f1c40f", "#3498db", "#2ecc71"][i % 4]));
    p.position.set(-4.7 + i * 0.63, 3.25 - 0.18 * Math.sin((i / 15) * Math.PI), -5); p.rotation.x = Math.PI; g.add(p);
  }
  const ball = new THREE.Mesh(new THREE.IcosahedronGeometry(0.13, 1), mat("#e74c3c")); g.add(ball);
  const gtr = guitar(); g.add(gtr);
  return { group: g, ball, guitar: gtr };
}

// ========================================================= H: Wohnzimmer ===
// Tisch bei z = −0,85; du sitzt bei z ≈ 0,2 (Blick nach −z). Drei Freunde links, gegenüber, rechts.
export const TABLE_Y = 0.75;
function boardTexture() {
  const { tex } = canvasTexture(800, 800, (c, w) => {
    c.fillStyle = "#f2e6c4"; c.fillRect(0, 0, w, w);
    c.strokeStyle = "#7a5232"; c.lineWidth = 16; c.strokeRect(8, 8, w - 16, w - 16);
    const cell = w / 11;
    const corners = [["#d9352f", 0, 0], ["#f2c318", 9, 0], ["#2f80ed", 9, 9], ["#27ae60", 0, 9]];
    for (const [col, cx, cy] of corners) for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) {
      c.fillStyle = col; c.beginPath(); c.arc((cx + i + 0.5) * cell, (cy + j + 0.5) * cell, cell * 0.38, 0, 6.3); c.fill();
    }
    const path = [];
    for (let i = 0; i < 11; i++) for (let j = 0; j < 11; j++) {
      const onCross = (i >= 4 && i <= 6) || (j >= 4 && j <= 6);
      const inside = i >= 4 && i <= 6 && j >= 4 && j <= 6;
      if (onCross && !inside) path.push([i, j]);
    }
    for (const [i, j] of path) {
      let col = "#ffffff";
      if (i === 5 && j >= 1 && j <= 4) col = "#f2c318";
      if (i === 5 && j >= 6 && j <= 9) col = "#27ae60";
      if (j === 5 && i >= 1 && i <= 4) col = "#d9352f";
      if (j === 5 && i >= 6 && i <= 9) col = "#2f80ed";
      if ((i === 5 && (j === 0 || j === 10)) || (j === 5 && (i === 0 || i === 10))) col = "#ffffff";
      c.fillStyle = col; c.strokeStyle = "#3a2a1a"; c.lineWidth = 4;
      c.beginPath(); c.arc((i + 0.5) * cell, (j + 0.5) * cell, cell * 0.36, 0, 6.3); c.fill(); c.stroke();
    }
  });
  return tex;
}
function pipTexture(n) {
  const { tex } = canvasTexture(128, 128, (c, w) => {
    c.fillStyle = "#fbfaf5"; c.fillRect(0, 0, w, w);
    c.fillStyle = "#1a1a1a";
    const P = { 1: [[0.5, 0.5]], 2: [[0.25, 0.25], [0.75, 0.75]], 3: [[0.25, 0.25], [0.5, 0.5], [0.75, 0.75]], 4: [[0.25, 0.25], [0.75, 0.25], [0.25, 0.75], [0.75, 0.75]],
      5: [[0.25, 0.25], [0.75, 0.25], [0.5, 0.5], [0.25, 0.75], [0.75, 0.75]], 6: [[0.25, 0.22], [0.75, 0.22], [0.25, 0.5], [0.75, 0.5], [0.25, 0.78], [0.75, 0.78]] };
    for (const [x, y] of P[n]) { c.beginPath(); c.arc(x * w, y * w, w * 0.09, 0, 6.3); c.fill(); }
  });
  return tex;
}
export function dice() {
  // Flächen: +x, −x, +y, −y, +z, −z → 3, 4, 6, 1, 2, 5 (oben liegt die 6)
  const mats = [3, 4, 6, 1, 2, 5].map((n) => new THREE.MeshStandardMaterial({ map: pipTexture(n), roughness: 0.5 }));
  const m = new THREE.Mesh(new THREE.BoxGeometry(0.028, 0.028, 0.028), mats);
  m.castShadow = true;
  return m;
}

export function livingRoom({ seed = 901 } = {}) {
  const r = rng(seed);
  const g = new THREE.Group();
  const wall = mat("#b98e6a"), wall2 = mat("#a87e5c");
  const ft = (() => { const { tex } = canvasTexture(256, 256, (c, w) => { for (let i = 0; i < 8; i++) { c.fillStyle = i % 2 ? "#6a4a32" : "#5c3f2a"; c.fillRect(0, i * 32, w, 31); } }); tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(3, 3); return tex; })();
  box(7, 0.05, 7, mat("#ffffff", { map: ft, roughness: 0.6 }), 0, -0.025, -1, g);
  box(7, 0.05, 7, mat("#e8dcc8"), 0, 2.8, -1, g);
  box(0.05, 2.8, 7, wall2, -3.5, 1.4, -1, g);
  box(0.05, 2.8, 7, wall2, 3.5, 1.4, -1, g);
  box(7, 2.8, 0.05, wall2, 0, 1.4, 2.5, g);
  // Rückwand mit Fenster (Nacht)
  box(2.4, 2.8, 0.08, wall, -2.3, 1.4, -4.5, g);
  box(2.4, 2.8, 0.08, wall, 2.3, 1.4, -4.5, g);
  box(2.2, 0.85, 0.08, wall, 0, 0.42, -4.5, g);
  box(2.2, 0.45, 0.08, wall, 0, 2.58, -4.5, g);
  box(2.2, 1.5, 0.04, new THREE.MeshStandardMaterial({ color: "#0f1a33", emissive: new THREE.Color("#18264a"), emissiveIntensity: 1, roughness: 0.2 }), 0, 1.6, -4.56, g);
  for (const x of [-1.1, 0, 1.1]) box(0.05, 1.5, 0.1, mat("#efe6d6"), x, 1.6, -4.5, g);
  box(2.2, 0.05, 0.1, mat("#efe6d6"), 0, 1.6, -4.5, g);
  // Lichter gegenüber im Fenster
  for (let i = 0; i < 10; i++) box(0.12, 0.16, 0.02, basic(r() < 0.7 ? "#ffcf7a" : "#9ab8e8"), r.range(-1, 1), r.range(1.0, 2.2), -4.7, g);
  for (const x of [-1.45, 1.45]) box(0.55, 2.4, 0.1, mat("#7a3b2e"), x, 1.5, -4.4, g);
  // Bücherregal links hinten
  const shelf = new THREE.Group(); shelf.position.set(-2.6, 0, -4.2); g.add(shelf);
  box(1.4, 2.2, 0.35, mat("#5a3a22"), 0, 1.1, 0, shelf);
  for (let k = 0; k < 4; k++) {
    let x = -0.62;
    while (x < 0.6) { const w = r.range(0.04, 0.09), h = r.range(0.25, 0.4); box(w, h, 0.25, mat(r.pick(["#c0392b", "#2f80ed", "#27ae60", "#f2c94c", "#8e44ad", "#e8e2d4", "#34495e"])), x + w / 2, 0.15 + k * 0.52 + h / 2, 0.08, shelf); x += w + 0.01; }
  }
  // Sofa rechts hinten, Pflanze, Stehlampe, Bild
  box(2.0, 0.45, 0.8, mat("#4a5a6a"), 2.2, 0.22, -3.9, g); box(2.0, 0.5, 0.2, mat("#4a5a6a"), 2.2, 0.7, -4.25, g);
  const pot = cyl(0.2, 0.16, 0.4, 8, mat("#b5653a"), -3.0, 0.2, -2.6, g);
  for (let i = 0; i < 6; i++) { const l = box(0.08, 0.7, 0.24, mat("#3d6b3a"), -3.0, 0.75, -2.6, g); l.rotation.set(r.range(-0.5, 0.5), i, r.range(-0.6, 0.6)); }
  const lampShade = cyl(0.2, 0.28, 0.3, 10, mat("#f4e6c8", { emissive: new THREE.Color("#ffb060"), emissiveIntensity: 0.5 }), 3.0, 1.6, -2.6, g);
  cyl(0.02, 0.02, 1.5, 6, mat("#2b2b2b"), 3.0, 0.75, -2.6, g);
  const pic = drawPanel(0.9, 0.65, 200, (c, w, h) => { c.fillStyle = "#2a2f3a"; c.fillRect(0, 0, w, h); c.fillStyle = "#f2c26b"; c.beginPath(); c.arc(w * 0.7, h * 0.35, 30, 0, 6.3); c.fill(); c.fillStyle = "#4a6a8a"; c.fillRect(0, h * 0.6, w, h * 0.4); c.strokeStyle = "#c9a14a"; c.lineWidth = 14; c.strokeRect(0, 0, w, h); }, { basicMat: false });
  pic.mesh.rotation.y = Math.PI / 2; pic.mesh.position.set(-3.46, 1.7, -1.2); g.add(pic.mesh);
  // Tisch
  const tz = -0.85;
  box(1.5, 0.05, 1.05, mat("#8a5a32", { roughness: 0.6 }), 0, TABLE_Y - 0.025, tz, g);
  for (const [x, z] of [[-0.68, -0.45], [0.68, -0.45], [-0.68, 0.45], [0.68, 0.45]]) box(0.06, TABLE_Y - 0.05, 0.06, mat("#6a4224"), x, (TABLE_Y - 0.05) / 2, tz + z, g);
  // Stühle der Freunde
  const chairs = [[-0.4, tz - 0.85, 0], [0.4, tz - 0.85, 0], [1.05, tz - 0.2, -Math.PI / 2]];
  for (const [x, z, ry] of chairs) {
    const ch = new THREE.Group(); ch.position.set(x, 0, z); ch.rotation.y = ry; g.add(ch);
    box(0.45, 0.05, 0.45, mat("#6a4224"), 0, 0.45, 0, ch); box(0.45, 0.5, 0.05, mat("#6a4224"), 0, 0.72, -0.22, ch);
    for (const [a, b] of [[-0.2, -0.2], [0.2, -0.2], [-0.2, 0.2], [0.2, 0.2]]) box(0.04, 0.45, 0.04, mat("#5a3a1e"), a, 0.22, b, ch);
  }
  // Spielbrett, Figuren
  const boardM = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.012, 0.56), [mat("#7a5232"), mat("#7a5232"), new THREE.MeshStandardMaterial({ map: boardTexture(), roughness: 0.7 }), mat("#7a5232"), mat("#7a5232"), mat("#7a5232")]);
  boardM.position.set(0, TABLE_Y + 0.006, tz - 0.02); boardM.receiveShadow = true; g.add(boardM);
  const pawnCols = ["#d9352f", "#f2c318", "#2f80ed", "#27ae60"];
  const cell = 0.56 / 11;
  const pawnSpots = [[0, 2, 5], [0, 4, 6], [1, 9, 4], [1, 6, 9], [2, 9, 9], [2, 6, 2], [3, 0, 10], [3, 4, 0], [0, 5, 3], [2, 10, 5], [1, 10, 0], [3, 1, 9]];
  for (const [ci, i, j] of pawnSpots) {
    const p = new THREE.Group(); p.position.set(-0.28 + (i + 0.5) * cell, TABLE_Y + 0.012, tz - 0.02 - 0.28 + (j + 0.5) * cell); g.add(p);
    cyl(0.009, 0.016, 0.03, 8, mat(pawnCols[ci], { roughness: 0.4 }), 0, 0.015, 0, p);
    const hd = new THREE.Mesh(new THREE.SphereGeometry(0.011, 8, 6), mat(pawnCols[ci], { roughness: 0.4 })); hd.position.y = 0.036; p.add(hd);
  }
  // Snackschale, Gläser
  const bowl = new THREE.Mesh(new THREE.SphereGeometry(0.11, 10, 6, 0, 6.3, Math.PI / 2, Math.PI / 2), mat("#e8e2d4", { side: THREE.DoubleSide })); bowl.position.set(0.48, TABLE_Y + 0.1, tz - 0.3); bowl.rotation.x = Math.PI; g.add(bowl);
  for (let i = 0; i < 9; i++) { const c = box(0.04, 0.008, 0.03, mat("#e8b84a"), 0.48 + r.range(-0.06, 0.06), TABLE_Y + 0.085, tz - 0.3 + r.range(-0.06, 0.06), g); c.rotation.set(r(), r() * 3, r()); }
  for (const [x, z] of [[-0.55, -0.55], [0.35, -1.25], [0.62, -0.75]]) cyl(0.03, 0.026, 0.11, 8, new THREE.MeshStandardMaterial({ color: "#e6d27a", roughness: 0.15, transparent: true, opacity: 0.75 }), x, TABLE_Y + 0.055, z, g);
  // Kerzen
  const glowT = glowTexture();
  const flameMat = new THREE.SpriteMaterial({ map: glowT, color: "#ffb860", transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
  const candles = [];
  for (const [x, z, h] of [[-0.42, tz - 0.32, 0.16], [-0.3, tz - 0.4, 0.11]]) {
    cyl(0.03, 0.03, h, 10, mat("#f3ead2", { emissive: new THREE.Color("#ffcf8a"), emissiveIntensity: 0.3 }), x, TABLE_Y + h / 2, z, g);
    cyl(0.05, 0.05, 0.01, 10, mat("#c9a14a", { metalness: 0.6 }), x, TABLE_Y + 0.005, z, g);
    const f = new THREE.Sprite(flameMat); f.position.set(x, TABLE_Y + h + 0.035, z); f.scale.set(0.09, 0.14, 1); g.add(f);
    const core = new THREE.Mesh(new THREE.ConeGeometry(0.008, 0.03, 5), basic("#fff1c8")); core.position.set(x, TABLE_Y + h + 0.02, z); g.add(core);
    const light = new THREE.PointLight("#ffa850", 2.2, 5, 1.4); light.position.set(x, TABLE_Y + h + 0.1, z); g.add(light);
    candles.push({ f, core, light, base: TABLE_Y + h });
  }
  const lampLight = new THREE.PointLight("#ffb060", 1.2, 6, 1.5); lampLight.position.set(3.0, 1.5, -2.5); g.add(lampLight);
  return { group: g, candles, tz, chairs, lampShade };
}
