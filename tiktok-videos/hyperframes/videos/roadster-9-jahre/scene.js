// „Neun Jahre für ein Auto“ – deutscher Nachbau eines @selfmade.engineer-Videos (Tesla Roadster).
// Schwebende Low-Poly-Insel im Sonnenuntergang, Sprecher + Wort-für-Wort-Untertitel, LED-Tafeln.
// Alle Zeiten kommen aus timeline.js (erzeugt von build.py aus der Sprecherspur).
import { THREE, rng, clamp, smooth, lerp, createSky, createStars } from "./lib/lowpoly.js";
import { mat, basic, box, cyl, canvasTexture } from "./lib/props.js";
import { TL } from "./timeline.js";

const E = TL.ev;
const DUR = TL.duration;
const SHOT = Object.fromEntries(TL.shots.map((s, i) => [s.name, { t0: s.t, t1: (TL.shots[i + 1] || { t: DUR }).t }]));
const win = (t, a, b) => smooth((t - a) / (b - a));
const ease = (x) => 1 - Math.pow(1 - clamp(x), 3);
const V = (x, y, z) => new THREE.Vector3(x, y, z);

// ------------------------------------------------------------ Renderer ---
const canvas = document.getElementById("scene");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1);
renderer.setSize(1080, 1920, false);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
scene.fog = new THREE.Fog("#f0a98c", 140, 420);
const camera = new THREE.PerspectiveCamera(52, 1080 / 1920, 0.1, 4000);
scene.add(camera);
const sky = createSky(1800);
scene.add(sky);
const SU = sky.material.uniforms;
SU.top.value.set("#7c69b4"); SU.horizon.value.set("#f9a46c"); SU.bottom.value.set("#d98f93");
SU.sunDir.value.set(-0.6, 0.12, -0.8).normalize(); SU.sunColor.value.set("#ffd2a0"); SU.sunGlow.value = 0.8;

const hemi = new THREE.HemisphereLight("#ffe6d6", "#7a6a7a", 1.15);
scene.add(hemi);
const sun = new THREE.DirectionalLight("#ffd9b0", 2.1);
sun.position.set(-60, 70, 40); sun.target.position.set(0, 0, -5);
sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -60, right: 60, top: 60, bottom: -60, near: 1, far: 260 });
sun.shadow.bias = -0.0005; sun.shadow.normalBias = 0.04;
scene.add(sun, sun.target);

// ------------------------------------------------------------ Farben ---
const C = {
  grass: "#74c24f", grass2: "#64b042", cliff: "#c98a7c", dirt: "#9a6a55", road: "#3b3d45", line: "#f4cf54",
  concrete: "#dedad3", truss: "#c4c9d0", board: "#121214", blue: "#2e5fbf", trunk: "#7b5136", leaf: "#82c64f",
  red: "#d42a2a", yellow: "#f0c234", white: "#eef0f2", glass: "#1b1e26", tire: "#1c1c1f", steel: "#b7bcc3",
};
const M = {
  grass: mat(C.grass), grass2: mat(C.grass2), cliff: mat(C.cliff), dirt: mat(C.dirt), road: mat(C.road, { roughness: 0.95 }),
  line: mat(C.line), concrete: mat(C.concrete), truss: mat(C.truss, { metalness: 0.45, roughness: 0.45 }),
  board: mat(C.board, { roughness: 0.6 }), blue: mat(C.blue), trunk: mat(C.trunk), leaf: mat(C.leaf), leaf2: mat("#9bd463"),
  tire: mat(C.tire), rim: mat("#9ea4ad", { metalness: 0.6, roughness: 0.4 }), glass: mat(C.glass, { roughness: 0.25, metalness: 0.3 }),
  dark: mat("#26272c"), whiteM: mat("#f4f4f2"), barrier: mat("#eceae6"), stripe: mat("#e04a3a"),
  glow: basic("#ffffff"), tail: basic("#ff3030"),
};

const SHOTCAM = {
  hook: [[33, 3.4, -3.5], [24.5, 7.2, -15], [31.5, 3.6, -5.5], [25.5, 7.2, -15]],
  promise: [[37, 5.5, 0], [29.5, 6.0, -15], [35.5, 6.2, -2], [29.5, 6.2, -15]],
  build: null,
  lotus: [[-14.5, 3.6, -4.6], [-19.2, 2.2, -15.5], [-15.2, 3.1, -6.2], [-19.2, 2.0, -15.5]],
  boom: [[-15.6, 2.6, -7.6], [-19.6, 1.6, -14.5], [-16.4, 2.3, -8.8], [-19.6, 1.6, -14.5]],
  space: null, orbit: null,
  new: [[6, 4.4, 16], [-4, 2.4, -1], [4.2, 4.0, 14], [-3, 2.4, -1]],
  specs: [[5.5, 3.2, 12.5], [0, 5.2, -2], [3.2, 2.7, 10.2], [0, 5.4, -2]],
  battery: [[0, 9.5, 8.5], [0, 3.2, -1.5], [1.2, 8.6, 7.5], [0, 3.4, -1.5]],
  cost: [[3.2, 3.0, 13], [0, 4.6, -2], [2.6, 3.2, 12], [0, 4.8, -2]],
  broke: [[0, 6.4, 12], [0, 5.4, -4], [0, 6.2, 10.5], [0, 5.6, -4]],
  price: [[-3.6, 1.6, 13], [0, 4.8, -2], [-3.0, 1.9, 12], [0, 5.0, -2]],
  ice: [[4.6, 3.4, 13], [0, 4.4, -1], [4.0, 3.2, 12], [0, 4.6, -1]],
  models: [[-9.5, 4.2, 4.5], [-21, 2.0, 15], [-10.5, 4.6, 6.0], [-21, 2.0, 15]],
  dessert: [[4.6, 4.4, 13], [0, 4.6, -1], [4.0, 4.8, 12], [0, 4.8, -1]],
  chips: [[0, 6.6, 9.5], [0, 6.6, -3], [0.6, 6.6, 8.2], [0, 6.6, -3]],
  years: [[-4.8, 3.0, 13], [-9.5, 3.3, 5], [-6.2, 3.1, 11.8], [-9.5, 3.4, 5]],
  rockets: [[33, 2.6, 7.5], [24, 1.6, 1.5], [32, 2.8, 6.5], [24, 1.7, 1.5]],
  fly: [[33.5, 3.0, 8.5], [24, 3.0, 1], [32.5, 3.8, 7.5], [24, 4.2, 1]],
  fans: [[30.5, 0.7, 8.0], [24, 1.2, 1.6], [29.8, 0.6, 7.0], [24, 0.9, 1.6]],
  stick: [[46, 8, -19], [24, 7.0, -30], [44.5, 9, -22], [24, 7.4, -31]],
  delay: [[0, 5.2, 18], [0, 7.4, -3], [0, 5.6, 15.5], [0, 7.6, -3]],
  reveal: [[2.6, 3.0, 14], [0, 4.4, 0], [2.0, 2.8, 12.5], [0, 4.2, 0]],
  flip: null,
  rocket: [[-1.5, 2.4, 20], [0, 4.0, 4], [-0.5, 2.6, 19], [1, 4.2, 4]],
  buy: [[0, 6.8, 13], [0, 5.6, -4], [0, 6.6, 11.5], [0, 5.6, -4]],
  look: null,
};

// ============================================================== Insel ===
const world = new THREE.Group();
scene.add(world);
{
  const top = new THREE.Mesh(new THREE.CylinderGeometry(47, 45, 3, 18), M.grass);
  top.position.y = -1.5; top.receiveShadow = true; world.add(top);
  const under = new THREE.Mesh(new THREE.ConeGeometry(45.5, 34, 18), M.cliff);
  under.rotation.x = Math.PI; under.position.y = -3 - 17; world.add(under);
  const r = rng(7);
  for (let i = 0; i < 14; i++) {   // Felsbrocken am Rand
    const a = (i / 14) * Math.PI * 2 + r() * 0.2;
    const rock = new THREE.Mesh(new THREE.IcosahedronGeometry(3 + r() * 3, 0), M.dirt);
    rock.position.set(Math.cos(a) * 42, -5 - r() * 4, Math.sin(a) * 42); rock.scale.y = 1.6; world.add(rock);
  }
}
// Straßen: Straße 1 entlang x bei z = 9, Straße 2 entlang z bei x = 24
function road(len, along, cx, cz) {
  const g = new THREE.Group();
  const w = 7;
  const r = along === "x" ? box(len, 0.08, w, M.road) : box(w, 0.08, len, M.road);
  r.castShadow = false; g.add(r);
  for (let s = -len / 2 + 2; s < len / 2 - 1; s += 4) {
    const d = along === "x" ? box(2, 0.02, 0.22, M.line, s, 0.05, 0) : box(0.22, 0.02, 2, M.line, 0, 0.05, s);
    d.castShadow = false; g.add(d);
  }
  g.position.set(cx, 0.04, cz);
  world.add(g);
  return g;
}
road(88, "x", 0, 9);
road(48, "z", 24, -15.5);
// Platz um die Bühne
box(24, 0.1, 15, M.concrete, -1, 0.05, -2, world).castShadow = false;
// Betonbarrieren an Straße 1
for (let x = -36; x <= 36; x += 3.1) if (Math.abs(x - 24) > 5) box(2.9, 0.9, 0.5, M.barrier, x, 0.45, 13.1, world);

// Bäume (nicht in Sichtlinien der Kameras)
function segDist(px, pz, ax, az, bx, bz) {
  const dx = bx - ax, dz = bz - az, l = dx * dx + dz * dz || 1;
  const u = clamp(((px - ax) * dx + (pz - az) * dz) / l);
  return Math.hypot(px - ax - u * dx, pz - az - u * dz);
}
function blocksView(x, z) {
  for (const k of Object.values(SHOTCAM)) {
    if (!k) continue;
    for (const [p, l] of [[k[0], k[1]], [k[2], k[3]]]) if (p[1] < 14 && segDist(x, z, p[0], p[2], l[0], l[2]) < 4.5) return true;
  }
  return false;
}
function tree(seed) {
  const r = rng(seed);
  const g = new THREE.Group();
  const h = 2.5 + r() * 2;
  cyl(0.25, 0.35, h, 6, M.trunk, 0, h / 2, 0, g);
  const n = 2 + Math.floor(r() * 2);
  for (let i = 0; i < n; i++) {
    const s = 2.2 + r() * 1.4;
    const leaf = new THREE.Mesh(new THREE.IcosahedronGeometry(s, 0), r() > 0.5 ? M.leaf : M.leaf2);
    leaf.position.set((r() - 0.5) * 1.6, h + s * 0.6 + i * 1.2, (r() - 0.5) * 1.6);
    leaf.rotation.set(r() * 3, r() * 3, 0);
    leaf.castShadow = true; g.add(leaf);
  }
  return g;
}
{
  const r = rng(31);
  let placed = 0, tries = 0;
  while (placed < 34 && tries < 600) {
    tries++;
    const a = r() * Math.PI * 2, d = 12 + r() * 31;
    const x = Math.cos(a) * d, z = Math.sin(a) * d;
    if (Math.abs(z - 9) < 6.5) continue;                       // Straße 1
    if (Math.abs(x - 24) < 7 && z < 12) continue;              // Straße 2 + Looping
    if (x > -14 && x < 14 && z > -12 && z < 6) continue;       // Bühne
    if (x > -28 && x < -12 && z > -22 && z < -8) continue;     // Station 2008
    if (x > -38 && x < -24 && z > -40 && z < -24) continue;    // Startrampe
    if (x > -31 && x < -13 && z > 15 && z < 30) continue;      // Fabrik
    if (x > 16 && x < 33 && z < -8) continue;
    if (x > -24 && x < -10 && z > -30 && z < -16) continue;    // Kamera Raketenstart
    if (blocksView(x, z)) continue;
    const tr = tree(100 + placed);
    tr.position.set(x, 0, z); tr.rotation.y = r() * 6; tr.scale.setScalar(0.85 + r() * 0.5);
    world.add(tr); placed++;
  }
}
// Wolken
const clouds = new THREE.Group();
{
  const r = rng(55);
  const cm = mat("#fff3ee", { roughness: 1 });
  for (let i = 0; i < 9; i++) {
    const g = new THREE.Group();
    for (let k = 0; k < 4; k++) {
      const p = new THREE.Mesh(new THREE.IcosahedronGeometry(4 + r() * 4, 0), cm);
      p.position.set(k * 5 - 8, r() * 2, r() * 3); p.scale.y = 0.55; g.add(p);
    }
    const a = r() * Math.PI * 2, d = 80 + r() * 90;
    g.position.set(Math.cos(a) * d, 35 + r() * 40, Math.sin(a) * d);
    clouds.add(g);
  }
  scene.add(clouds);
}

// ---------------------------------------------------------- Fachwerk ---
function truss(len, axis = "x", s = 1.1) {
  const g = new THREE.Group();
  const L = len, n = Math.max(1, Math.round(L / s));
  const rod = 0.09;
  const along = (x, y, z) => (axis === "x" ? [x, y, z] : axis === "y" ? [y, x, z] : [z, y, x]);
  const dims = (a, b, c) => (axis === "x" ? [a, b, c] : axis === "y" ? [b, a, c] : [c, b, a]);
  for (const [cy, cz] of [[-s / 2, -s / 2], [-s / 2, s / 2], [s / 2, -s / 2], [s / 2, s / 2]]) {
    const [w, h, d] = dims(L, rod * 1.4, rod * 1.4);
    g.add(box(w, h, d, M.truss, ...along(0, cy, cz)));
  }
  for (let i = 0; i <= n; i++) {
    const x = -L / 2 + (i * L) / n;
    for (const [cy, cz, w2, h2, d2] of [[-s / 2, 0, rod, rod, s], [s / 2, 0, rod, rod, s], [0, -s / 2, rod, s, rod], [0, s / 2, rod, s, rod]]) {
      const [w, h, d] = dims(w2, h2, d2);
      g.add(box(w, h, d, M.truss, ...along(x, cy, cz)));
    }
    if (i < n) {   // Diagonalen
      const dl = Math.hypot(L / n, s);
      for (const cz of [-s / 2, s / 2]) {
        const [w, h, d] = dims(dl, rod, rod);
        const m = box(w, h, d, M.truss, ...along(x + L / n / 2, 0, cz));
        const ang = Math.atan2(s, L / n) * (i % 2 ? 1 : -1);
        if (axis === "z") m.rotation.x = ang; else m.rotation.z = ang;
        g.add(m);
      }
    }
  }
  g.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = false; } });
  return g;
}

// ------------------------------------------------------------ Tafeln ---
let fontsReady = false;
function makeBoard(w, h, style = "main") {
  const px = 1024 / w;
  const ct = canvasTexture(1024, Math.round(h * px), () => {});
  const g = new THREE.Group();
  const frame = box(w + 0.3, h + 0.3, 0.3, M.board, 0, 0, -0.16, g);
  frame.castShadow = true;
  const face = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: ct.tex, toneMapped: false }));
  g.add(face);
  let key = "";
  g.userData.set = (label, value, opt = {}) => {
    const k = [label, value, opt.color, opt.stamp, opt.flash, fontsReady].join("|");
    if (k === key) return;
    key = k;
    ct.redraw((c, cw, ch) => {
      c.fillStyle = opt.bg || "#111114"; c.fillRect(0, 0, cw, ch);
      c.textAlign = "center"; c.textBaseline = "middle";
      const lab = style === "led" ? 0.24 : 0.22;
      c.fillStyle = "rgba(255,255,255,0.82)";
      c.font = `800 ${Math.round(ch * (style === "led" ? 0.17 : 0.12))}px RS, Arial, sans-serif`;
      if (label) c.fillText(label, cw / 2, ch * lab);
      const col = opt.color || (style === "led" ? "#ffae2b" : "#ffffff");
      let size = ch * (label ? 0.48 : 0.6);
      c.font = `900 ${Math.round(size)}px RS, Arial, sans-serif`;
      const tw = c.measureText(value).width;
      if (tw > cw * 0.88) { size *= (cw * 0.88) / tw; c.font = `900 ${Math.round(size)}px RS, Arial, sans-serif`; }
      c.fillStyle = col;
      if (style === "main") { c.shadowColor = col; c.shadowBlur = 22; }
      c.fillText(value, cw / 2, label ? ch * 0.62 : ch * 0.52);
      c.shadowBlur = 0;
      if (opt.stamp) {
        c.save(); c.translate(cw / 2, ch * 0.6); c.rotate(-0.16);
        c.strokeStyle = "#ff2b2b"; c.lineWidth = 14; c.fillStyle = "rgba(120,0,0,0.55)";
        const sw = cw * 0.86, sh = ch * 0.3;
        c.fillRect(-sw / 2, -sh / 2, sw, sh); c.strokeRect(-sw / 2, -sh / 2, sw, sh);
        c.fillStyle = "#ff3b3b"; c.font = `900 ${Math.round(sh * 0.62)}px RS, Arial, sans-serif`;
        c.fillText(opt.stamp, 0, 4); c.restore();
      }
      if (opt.flash) { c.fillStyle = `rgba(255,255,255,${opt.flash})`; c.fillRect(0, 0, cw, ch); }
    });
  };
  return g;
}

// ------------------------------------------------------------- Autos ---
function extrude(points, depth, material) {
  const s = new THREE.Shape(points.map(([x, y]) => new THREE.Vector2(x, y)));
  const geo = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: false });
  geo.translate(0, 0, -depth / 2);
  const m = new THREE.Mesh(geo, material);
  m.castShadow = true; m.receiveShadow = true;
  return m;
}
const CARS = {
  lotus: { body: [[-1.95, 0.3], [1.9, 0.28], [2.0, 0.5], [1.6, 0.66], [0.5, 0.72], [-1.1, 0.78], [-1.95, 0.8], [-2.05, 0.55]],
    cab: [[-1.05, 0.74], [0.6, 0.7], [0.1, 1.1], [-0.7, 1.12], [-1.15, 0.95]], w: 1.75, cw: 1.32, wb: 1.18, r: 0.33 },
  r2017: { body: [[-2.25, 0.3], [2.2, 0.25], [2.32, 0.45], [2.0, 0.6], [0.9, 0.74], [-1.3, 0.8], [-2.2, 0.82], [-2.3, 0.58]],
    cab: [[-1.25, 0.77], [1.1, 0.72], [0.3, 1.1], [-0.6, 1.13], [-1.55, 0.94]], w: 1.98, cw: 1.5, wb: 1.42, r: 0.36 },
  cyber: { body: [[-2.25, 0.28], [2.3, 0.24], [2.38, 0.42], [0.1, 0.84], [-2.25, 0.88]],
    cab: [[-1.2, 0.84], [0.25, 0.78], [-0.35, 1.08], [-1.35, 1.04]], w: 2.0, cw: 1.55, wb: 1.45, r: 0.37 },
  sedan: { body: [[-2.35, 0.35], [2.35, 0.35], [2.42, 0.62], [1.3, 0.84], [-2.3, 0.94], [-2.42, 0.68]],
    cab: [[-1.85, 0.9], [1.1, 0.83], [0.2, 1.42], [-1.2, 1.43], [-2.05, 1.02]], w: 1.92, cw: 1.62, wb: 1.5, r: 0.37 },
  suv: { body: [[-2.4, 0.4], [2.4, 0.4], [2.45, 0.75], [1.4, 1.0], [-2.35, 1.1], [-2.45, 0.8]],
    cab: [[-2.1, 1.05], [1.2, 0.98], [0.3, 1.66], [-1.6, 1.68], [-2.25, 1.3]], w: 2.0, cw: 1.72, wb: 1.55, r: 0.42 },
  truck: { body: [[-2.8, 0.45], [2.8, 0.45], [2.86, 1.05], [0.3, 1.95], [-2.8, 1.3]], cab: null, w: 2.1, cw: 0, wb: 1.9, r: 0.45 },
};
function makeCar(kind, color, opt = {}) {
  const P = CARS[kind];
  const g = new THREE.Group();
  const bodyMat = mat(color, { roughness: opt.rough ?? 0.42, metalness: opt.metal ?? 0.25, flatShading: true });
  const body = extrude(P.body, P.w, bodyMat);
  g.add(body);
  if (P.cab) g.add(extrude(P.cab, P.cw, M.glass));
  else { const band = box(2.4, 0.32, P.w + 0.02, M.glass, 0.35, 1.45, 0, g); band.rotation.z = -0.32; }
  const wheels = [];
  const xs = kind === "truck" ? [1.85, -1.85] : [P.body[1][0] * 0.66, P.body[0][0] * 0.64];
  for (const x of xs) for (const z of [-1, 1]) {
    const wg = new THREE.Group();
    const tire = cyl(P.r, P.r, 0.32, 14, M.tire, 0, 0, 0, wg); tire.rotation.x = Math.PI / 2;
    const rim = cyl(P.r * 0.55, P.r * 0.55, 0.34, 8, M.rim, 0, 0, 0, wg); rim.rotation.x = Math.PI / 2;
    wg.position.set(x, P.r, z * (P.w / 2 - 0.06));
    g.add(wg); wheels.push(wg);
  }
  // Rücklicht (durchgehend bei Cyber)
  const tl = box(0.06, 0.08, kind === "cyber" ? P.w * 0.9 : 0.4, M.tail, P.body[0][0] - 0.02, kind === "cyber" ? 0.78 : 0.62, 0, g);
  if (kind !== "cyber") { tl.position.z = 0.6; box(0.06, 0.08, 0.4, M.tail, P.body[0][0] - 0.02, 0.62, -0.6, g); }
  // Scheinwerfer
  for (const z of [-0.6, 0.6]) box(0.06, 0.07, 0.36, basic("#fff6dc"), P.body[1][0] + 0.06, kind === "truck" ? 0.95 : 0.42, z * (P.w / 2) * 1.1, g);
  g.userData = { body, bodyMat, wheels, kind };
  return g;
}

// ============================================================= Kulissen ===
// --- Station 2008 ---
const PA = V(-20, 0, -14);
box(11, 0.12, 8, M.concrete, PA.x, 0.06, PA.z, world).castShadow = false;
for (const dx of [-5, 5]) {
  box(0.8, 3.4, 0.8, M.blue, PA.x + dx, 1.7, PA.z - 3.2, world);
  box(0.12, 2.2, 0.82, M.glow, PA.x + dx + (dx < 0 ? 0.36 : -0.36), 1.9, PA.z - 3.2, world).castShadow = false;
}
const signA = makeBoard(4.2, 2.4, "led");
signA.position.set(PA.x, 4.4, PA.z - 3.8); world.add(signA);
box(0.25, 3.3, 0.25, M.dark, PA.x - 1.6, 1.65, PA.z - 4.0, world); box(0.25, 3.3, 0.25, M.dark, PA.x + 1.6, 1.65, PA.z - 4.0, world);
box(2.2, 0.6, 0.9, mat("#8a5a3c"), PA.x - 4.5, 0.3, PA.z - 1.5, world); // Bank
for (let i = 0; i < 3; i++) cyl(0.45, 0.45, 0.35, 10, M.tire, PA.x - 4.2, 0.18 + i * 0.36, PA.z + 2.6, world); // Reifenstapel

// --- Startrampe + Rakete ---
const PR = V(-31, 0, -32);
box(9, 0.6, 9, M.dark, PR.x, 0.3, PR.z, world);
{ const tw = truss(34, "y", 1.6); tw.position.set(PR.x + 4.4, 17, PR.z - 1); world.add(tw); }
const rocket = new THREE.Group();
{
  const wm = mat("#f2f2f0", { roughness: 0.5 }), bm = mat("#1f1f22");
  for (const dx of [-1.9, 0, 1.9]) {
    const h = 24;
    cyl(0.9, 0.9, h, 14, wm, dx, 0.6 + h / 2, 0, rocket);
    cyl(0.92, 0.92, 1.4, 14, bm, dx, 0.6 + h - 3, 0, rocket);
    cyl(0.92, 0.92, 0.8, 14, bm, dx, 1.2, 0, rocket);
    if (dx !== 0) { const n = new THREE.Mesh(new THREE.ConeGeometry(0.9, 2.2, 14), wm); n.position.set(dx, 0.6 + h + 1.1, 0); rocket.add(n); }
  }
  cyl(0.9, 0.9, 4, 14, wm, 0, 0.6 + 24 + 2, 0, rocket);
  const fair = new THREE.Mesh(new THREE.ConeGeometry(1.05, 3.6, 14), wm); fair.position.set(0, 0.6 + 28 + 1.8, 0); rocket.add(fair);
  cyl(1.05, 0.9, 1.2, 14, wm, 0, 0.6 + 28.6, 0, rocket);
  rocket.traverse((o) => { if (o.isMesh) o.castShadow = true; });
}
const flames = [];
for (const dx of [-1.9, 0, 1.9]) {
  const f = new THREE.Mesh(new THREE.ConeGeometry(0.85, 6, 10), basic("#ffb347", { transparent: true, opacity: 0.95 }));
  f.rotation.x = Math.PI; f.position.set(dx, -2.6, 0); rocket.add(f); flames.push(f);
}
rocket.position.copy(PR).setY(0.6);
world.add(rocket);

// --- Bühne mit Drehteller, Fachwerk-Portal, Haupttafel, Lastwagen ---
const turntable = new THREE.Group();
cyl(4.6, 4.6, 0.36, 40, M.rim, 0, 0.18, 0, turntable);
const tt = cyl(4.4, 4.4, 0.5, 40, mat("#17171b", { roughness: 0.35, metalness: 0.3 }), 0, 0.25, 0, turntable);
for (let i = 0; i < 3; i++) {   // Ringe (heizt beim Nachtisch)
  const ring = new THREE.Mesh(new THREE.TorusGeometry(1.4 + i * 1.0, 0.07, 6, 48), basic("#ff7a2a", { transparent: true, opacity: 0 }));
  ring.rotation.x = Math.PI / 2; ring.position.y = 0.52; turntable.add(ring);
}
world.add(turntable);
const portal = new THREE.Group();
for (const x of [-7.6, 7.6]) { const t = truss(13, "y", 1.2); t.position.set(x, 6.5, -4.5); portal.add(t); }
{ const t = truss(16.4, "x", 1.2); t.position.set(0, 13.1, -4.5); portal.add(t); }
world.add(portal);
const board = makeBoard(9, 5.1, "main");
board.position.set(0, 9.2, -4.4); world.add(board);
// Scheinwerfer + Lichtkegel
const beams = [];
for (const x of [-4.5, 4.5]) {
  const lamp = cyl(0.35, 0.5, 0.8, 10, M.dark, x, 12.2, -3.6, world);
  lamp.rotation.x = 0.5;
  const cone = new THREE.Mesh(new THREE.ConeGeometry(3.4, 12, 24, 1, true),
    new THREE.MeshBasicMaterial({ color: "#fff6e8", transparent: true, opacity: 0.1, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }));
  cone.position.set(x * 0.55, 6.2, -1.6); cone.rotation.x = -0.32; cone.rotation.z = x > 0 ? -0.2 : 0.2;
  world.add(cone); beams.push(cone);
}
const stageSpot = new THREE.SpotLight("#fff2e0", 0, 40, 0.5, 0.6, 1.2);
stageSpot.position.set(0, 14, 4); stageSpot.target.position.set(0, 0, 0); world.add(stageSpot, stageSpot.target);
// Lastwagen-Auflieger
const truck = new THREE.Group();
{
  const tm = mat("#e9e9ee", { roughness: 0.6 });
  box(12, 3.6, 2.8, tm, 0, 2.4, 0, truck);
  box(12.02, 0.25, 2.82, M.stripe, 0, 1.0, 0, truck);
  box(3, 3.0, 2.7, mat("#2b3a55"), -7.6, 2.1, 0, truck);
  box(1.5, 1.0, 2.6, M.glass, -8.6, 3.0, 0, truck);
  for (const x of [-7.6, -3.5, 3.5, 4.8]) for (const z of [-1.2, 1.2]) {
    const w = cyl(0.55, 0.55, 0.4, 12, M.tire, x, 0.55, z, truck); w.rotation.x = Math.PI / 2;
  }
  truck.position.set(-12.2, 0, -0.6);
  world.add(truck);
}
const truckDoor = new THREE.Group();
box(0.1, 3.5, 2.75, mat("#d9d9e0"), 0, -1.75, 0, truckDoor);
truckDoor.position.set(-6.15, 4.2, -0.6); world.add(truckDoor);
const ramp = box(3.2, 0.12, 2.4, M.truss, -4.6, 0.32, -0.6, world);
ramp.rotation.z = -0.2;
// Auslieferungs-Tafel am Mast
const delivery = makeBoard(3.6, 2.1, "led");
delivery.position.set(-9.5, 5.0, 5.4); world.add(delivery);
box(0.3, 4.2, 0.3, M.dark, -9.5, 2.1, 5.2, world);

// --- Looping + Fachwerkbrücke an Straße 2 ---
const LOOP = V(24, 7.35, -31), LR = 7;
{
  const N = 44;
  const tm = mat("#d8dbe0", { roughness: 0.5, metalness: 0.3 });
  for (let i = 0; i < N; i++) {
    const a = (i / N) * Math.PI * 2;
    const seg = new THREE.Group();
    const b = box(3.4, 0.22, (2 * Math.PI * LR) / N * 1.06, tm, 0, -LR - 0.11, 0, seg);
    b.castShadow = true;
    seg.rotation.x = a; seg.position.copy(LOOP); world.add(seg);
  }
  for (const dx of [-2.2, 2.2]) {   // Stützen
    const s = truss(LR + 6.5, "y", 0.8); s.position.set(LOOP.x + dx, (LR + 6.5) / 2, LOOP.z - 8.5); world.add(s);
  }
}
const BR = V(24, 8.4, -15);
{
  for (const x of [17.6, 30.4]) { const t = truss(9.6, "y", 1.1); t.position.set(x, 4.8, BR.z); world.add(t); }
  const deck = truss(14, "x", 1.1); deck.position.set(BR.x, BR.y + 0.55, BR.z); world.add(deck);
  box(13.2, 0.12, 1.4, mat("#9aa0a8"), BR.x, BR.y, BR.z, world);
}
const yearBoard = makeBoard(3.4, 2.0, "led");
yearBoard.position.set(31.8, 5.5, -13.6); yearBoard.rotation.y = 0.35; world.add(yearBoard);

// --- Fabrik ---
const PF = V(-22, 0, 23);
{
  const fm = mat("#efece6"), rm = mat("#c94a3d");
  box(14, 5.5, 9, fm, PF.x, 2.75, PF.z, world);
  for (let i = 0; i < 4; i++) {
    const p = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 1.9, 1.8, 3), rm);
    p.rotation.z = Math.PI / 2; p.rotation.y = Math.PI / 2;
    p.position.set(PF.x - 5.2 + i * 3.5, 6.0, PF.z); p.scale.set(1, 4.4, 1); world.add(p);
  }
  for (const dx of [3, 5]) cyl(0.5, 0.6, 5, 10, fm, PF.x + dx, 8, PF.z + 2.5, world);
  box(4.2, 3.4, 0.2, M.dark, PF.x, 1.7, PF.z - 4.5, world);
  box(14.02, 0.5, 9.02, rm, PF.x, 4.6, PF.z, world);
  box(4.2, 7, 0.1, M.road, PF.x, 0.05, PF.z - 8, world).rotation.x = -Math.PI / 2;
}

// =============================================================== Autos ===
const lotus = makeCar("lotus", C.yellow); world.add(lotus);
const red = makeCar("r2017", C.red, { rough: 0.3, metal: 0.35 }); world.add(red);
const cyber = makeCar("cyber", C.white, { rough: 0.35, metal: 0.2 }); world.add(cyber);
const prod = [makeCar("sedan", "#c9302c"), makeCar("suv", "#2f63c6"), makeCar("truck", C.steel, { metal: 0.6, rough: 0.35 })];
prod.forEach((c) => world.add(c));
const parkedLotus = makeCar("lotus", C.red); world.add(parkedLotus);

// Lotus-Innereien: Motor, Tank, Akkuzellen
const engine = new THREE.Group();
box(0.9, 0.55, 0.8, mat("#5b5f66", { metalness: 0.5 }), 0, 0, 0, engine);
for (let i = 0; i < 4; i++) cyl(0.11, 0.11, 0.3, 8, mat("#9aa0a8"), -0.3 + i * 0.2, 0.42, 0, engine);
const tank = new THREE.Group();
{ const t = cyl(0.32, 0.32, 1.0, 12, mat("#c4512f"), 0, 0, 0, tank); t.rotation.z = Math.PI / 2; }
world.add(engine, tank);
const CELL_N = 120;
const cells = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.075, 0.075, 0.26, 8), mat("#6fd08c", { metalness: 0.4, roughness: 0.4 }), CELL_N);
{
  const m = new THREE.Matrix4();
  for (let i = 0; i < CELL_N; i++) {
    const ix = i % 15, iz = Math.floor(i / 15);
    m.makeTranslation(-1.85 + ix * 0.165, 0.92, -0.58 + iz * 0.165);
    cells.setMatrixAt(i, m);
  }
}
lotus.add(cells);
// Akku-Hologramm über dem 2017er
const pack = new THREE.Group();
{
  const pm = new THREE.MeshBasicMaterial({ color: "#5ff2ff", transparent: true, opacity: 0.85 });
  const frameM = new THREE.MeshBasicMaterial({ color: "#a8f8ff", transparent: true, opacity: 0.5, wireframe: true });
  const inst = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.06, 0.06, 0.2, 6), pm, 22 * 9);
  const m = new THREE.Matrix4();
  let k = 0;
  for (let ix = 0; ix < 22; ix++) for (let iz = 0; iz < 9; iz++) { m.makeTranslation(-1.6 + ix * 0.152, 0, -0.62 + iz * 0.155); inst.setMatrixAt(k++, m); }
  pack.add(inst);
  pack.add(new THREE.Mesh(new THREE.BoxGeometry(3.5, 0.3, 1.5), frameM));
}
world.add(pack);
// Düsen + Lüfter am 2017er
const nozzles = [];
for (const [x, z, ry] of [[2.1, 0.75, 0.6], [2.1, -0.75, -0.6], [-2.1, 0.8, 2.5], [-2.1, -0.8, -2.5], [0.2, 1.0, 1.57], [0.2, -1.0, -1.57], [-1.2, 1.0, 1.57], [-1.2, -1.0, -1.57]]) {
  const n = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.5, 8), mat("#c9ced6", { metalness: 0.7, roughness: 0.3 }));
  n.rotation.set(0, -ry, -Math.PI / 2, "YXZ"); n.position.set(x, 0.55, z); red.add(n); nozzles.push(n);
}
const fans = [];
for (const x of [0.9, -0.9]) {
  const f = new THREE.Group();
  f.add(new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.06, 20), basic("#6ff7ff")));
  for (let b = 0; b < 4; b++) { const bl = box(1.0, 0.04, 0.12, M.dark, 0, -0.04, 0, f); bl.rotation.y = (b * Math.PI) / 4; }
  f.position.set(x, 0.22, 0); red.add(f); fans.push(f);
}

// Eisblock, Cupcake, Chip
const ice = new THREE.Mesh(new THREE.BoxGeometry(5.6, 2.6, 2.9), new THREE.MeshStandardMaterial({ color: "#bfeaff", transparent: true, opacity: 0.55, roughness: 0.1, metalness: 0.1, flatShading: true }));
world.add(ice);
const cupcake = new THREE.Group();
{
  const cup = new THREE.Mesh(new THREE.CylinderGeometry(1.25, 0.95, 1.1, 14), mat("#f29bb5"));
  cup.position.y = 0.55; cupcake.add(cup);
  for (let i = 0; i < 3; i++) {
    const cr = new THREE.Mesh(new THREE.ConeGeometry(1.35 - i * 0.35, 0.8, 12), mat("#fff8f0"));
    cr.position.y = 1.35 + i * 0.5; cupcake.add(cr);
  }
  const ch = new THREE.Mesh(new THREE.IcosahedronGeometry(0.3, 1), mat("#d0142a", { roughness: 0.3 }));
  ch.position.y = 2.8; cupcake.add(ch);
  cupcake.traverse((o) => { if (o.isMesh) o.castShadow = true; });
}
world.add(cupcake);
const chip = new THREE.Group();
const chipHalves = [];
for (const s of [-1, 1]) {
  const h = new THREE.Group();
  box(1.2, 0.25, 2.4, mat("#1d1e22", { roughness: 0.4 }), s * 0.6, 0, 0, h);
  for (let i = 0; i < 5; i++) box(0.3, 0.06, 0.12, mat("#d7b04a", { metalness: 0.7 }), s * 1.32, 0, -0.9 + i * 0.45, h);
  box(0.5, 0.27, 0.9, mat("#8a8f98", { metalness: 0.6 }), s * 0.3, 0.02, 0, h);
  chip.add(h); chipHalves.push(h);
}
chip.position.set(0, 5.0, -1.4); chip.rotation.x = Math.PI / 2 - 0.25; world.add(chip);

// Regenwolke
const storm = new THREE.Group();
{
  const sm = mat("#5b5f6e", { roughness: 1 });
  const r = rng(77);
  for (let i = 0; i < 9; i++) {
    const p = new THREE.Mesh(new THREE.IcosahedronGeometry(2.4 + r() * 1.8, 0), sm);
    p.position.set(-9 + i * 2.3, r() * 1.6, (r() - 0.5) * 3); p.scale.y = 0.7; storm.add(p);
  }
  storm.position.set(0, 18, 0);
  world.add(storm);
}
const RAIN_N = 420;
const rain = new THREE.InstancedMesh(new THREE.BoxGeometry(0.04, 0.9, 0.04), basic("#cfe3ff", { transparent: true, opacity: 0.7 }), RAIN_N);
rain.frustumCulled = false; world.add(rain);
const rainSeed = Array.from({ length: RAIN_N }, (_, i) => { const r = rng(900 + i); return [r() * 24 - 12, r() * 18, r() * 16 - 9, 14 + r() * 6]; });

// Partikel: Rauch/Kaltgas-Wölkchen und Geldscheine
const PUFF_N = 260;
const puffs = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 0), mat("#ffffff", { roughness: 1 }), PUFF_N);
puffs.frustumCulled = false; puffs.castShadow = false; world.add(puffs);
const BILL_N = 46;
const bills = new THREE.InstancedMesh(new THREE.BoxGeometry(0.62, 0.02, 0.3), mat("#59b25a"), BILL_N);
bills.frustumCulled = false; world.add(bills);
const billSeed = Array.from({ length: BILL_N }, (_, i) => { const r = rng(400 + i); return [r() * 6.28, 2 + r() * 4, 4 + r() * 6, r() * 10, r() * 0.25]; });

// ------------------------------------------------------- Weltall-Szene ---
const space = new THREE.Scene();
const spaceCam = new THREE.PerspectiveCamera(48, 1080 / 1920, 0.1, 5000);
space.add(new THREE.AmbientLight("#8090b0", 0.6));
const sunS = new THREE.DirectionalLight("#fff4e0", 3.0); sunS.position.set(-40, 30, 20); space.add(sunS);
const stars = createStars(1400, 1500, 4); stars.material.opacity = 1; space.add(stars);
const earth = new THREE.Group();
{
  const geo = new THREE.IcosahedronGeometry(60, 4).toNonIndexed();
  const pos = geo.attributes.position, cols = [];
  const ocean = new THREE.Color("#2f6fc4"), land = new THREE.Color("#5aa548"), sand = new THREE.Color("#c7a467");
  for (let i = 0; i < pos.count; i += 3) {
    const x = (pos.getX(i) + pos.getX(i + 1) + pos.getX(i + 2)) / 3, y = (pos.getY(i) + pos.getY(i + 1) + pos.getY(i + 2)) / 3, z = (pos.getZ(i) + pos.getZ(i + 1) + pos.getZ(i + 2)) / 3;
    const n = Math.sin(x * 0.07 + 1.3) * Math.cos(z * 0.06 - 0.4) + Math.sin(y * 0.09 + z * 0.03) * 0.6 + Math.sin(x * 0.21 - y * 0.17) * 0.25;
    const c = n > 0.55 ? land : n > 0.42 ? sand : ocean;
    for (let k = 0; k < 3; k++) cols.push(c.r, c.g, c.b);
  }
  geo.setAttribute("color", new THREE.Float32BufferAttribute(cols, 3));
  earth.add(new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.9 })));
  const cg = new THREE.IcosahedronGeometry(61.5, 3).toNonIndexed();
  const cp = cg.attributes.position, keep = [];
  const r = rng(12);
  for (let i = 0; i < cp.count; i += 3) if (r() < 0.18) for (let k = 0; k < 3; k++) keep.push(cp.getX(i + k), cp.getY(i + k), cp.getZ(i + k));
  const cgeo = new THREE.BufferGeometry(); cgeo.setAttribute("position", new THREE.Float32BufferAttribute(keep, 3)); cgeo.computeVertexNormals();
  earth.add(new THREE.Mesh(cgeo, new THREE.MeshStandardMaterial({ color: "#ffffff", transparent: true, opacity: 0.8, flatShading: true })));
  const atm = new THREE.Mesh(new THREE.SphereGeometry(64, 32, 16), new THREE.MeshBasicMaterial({ color: "#7fc4ff", transparent: true, opacity: 0.12, side: THREE.BackSide }));
  earth.add(atm);
  earth.position.set(0, -72, -40);
  space.add(earth);
}
const spaceCar = makeCar("lotus", C.red);
space.add(spaceCar);
{ // Puppe am Steuer (Kopf + Schultern)
  const d = new THREE.Group();
  box(0.5, 0.45, 0.55, mat("#f4f4f2"), 0, 0, 0, d);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 8), mat("#f4f4f2")); head.position.y = 0.42; d.add(head);
  const visor = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 8), M.glass); visor.position.set(0.12, 0.44, 0); d.add(visor);
  d.position.set(-0.3, 1.05, 0.3); spaceCar.add(d);
}

// ============================================================== Overlay ===
const ov = document.getElementById("overlay");
const cap = document.createElement("div"); cap.className = "cap"; ov.appendChild(cap);
const flash = document.createElement("div"); flash.className = "flash"; ov.appendChild(flash);
const black = document.createElement("div"); black.className = "black"; ov.appendChild(black);
const end = document.createElement("div"); end.className = "end";
end.innerHTML = `<div class="q">Würdest du <span>50.000 $</span> anzahlen?</div><div class="s">So viel will Tesla wieder als Reservierung</div>`;
ov.appendChild(end);
let capText = null;
function updateOverlay(t) {
  let w = null;
  for (let i = 0; i < TL.words.length; i++) {
    const a = TL.words[i], b = TL.words[i + 1];
    const until = b && b.t - a.e < 0.45 ? b.t : a.e + 0.22;
    if (t >= a.t && t < until) { w = a; break; }
  }
  if (w) {
    if (capText !== w.w) { cap.textContent = w.w; capText = w.w; }
    const age = t - w.t;
    const s = age < 0.09 ? lerp(0.78, 1.08, age / 0.09) : age < 0.16 ? lerp(1.08, 1, (age - 0.09) / 0.07) : 1;
    cap.style.transform = `scale(${s.toFixed(3)})`;
    cap.style.opacity = t < TL.black ? 1 : 0;
  } else cap.style.opacity = 0;
  black.style.opacity = t >= TL.black && t < TL.endcard ? 1 : 0;
  end.style.opacity = t >= TL.endcard ? smooth((t - TL.endcard) / 0.4) : 0;
}

// ============================================================== Zustände ===
// Turntable dreht ständig
const ttAngle = (t) => t * 0.42;
const onTable = (car, t, y = 0.5) => { car.position.set(0, y, 0); car.rotation.set(0, ttAngle(t), 0); };

function placeLotus(t) {
  engine.visible = tank.visible = false;
  lotus.visible = t >= SHOT.lotus.t0 && t < SHOT.space.t0;
  if (!lotus.visible) return;
  const u = ease((t - E.lotusIn) / 1.3);
  lotus.position.set(lerp(PA.x - 14, PA.x, u), 0.12, PA.z);
  lotus.rotation.set(0, 0, 0);
  lotus.userData.wheels.forEach((w) => (w.rotation.z = -lerp(-14, 0, u) / 0.33));
  const red2008 = win(t, E.boom, E.boom + 0.25);
  lotus.userData.bodyMat.color.set(C.yellow).lerp(new THREE.Color(C.red), red2008);
  cells.count = Math.round(CELL_N * clamp((t - E.cells0) / (E.cells1 - E.cells0 - 0.2)));
  // Motor + Tank fliegen raus
  const fly = (obj, t0, x0, vx, vz, spin) => {
    const a = t - t0;
    obj.visible = a > -0.01 && a < 1.6 && lotus.visible;
    if (!obj.visible) return;
    obj.position.set(PA.x + x0 + vx * a, 0.7 + 7 * a - 4.9 * a * a, PA.z + vz * a);
    obj.rotation.set(spin * a, spin * 0.7 * a, spin * 0.4 * a);
  };
  fly(engine, E.engineOut, -1.0, -1.5, 3.2, 5);
  fly(tank, E.tankOut, 0.6, 1.2, 3.5, -4);
}
function placeRed(t) {
  const S = SHOT;
  red.visible = t >= S.new.t0 && t < S.reveal.t0 || t >= S.look.t0;
  nozzles.forEach((n) => (n.scale.setScalar(0.001)));
  fans.forEach((f) => (f.visible = false));
  if (!red.visible) return;
  red.rotation.set(0, 0, 0);
  const wheelsRoll = (d) => red.userData.wheels.forEach((w) => (w.rotation.z = -d / 0.36));
  if (t < S.rockets.t0) {
    if (t < E.truck + 1.9) {   // aus dem Lastwagen auf den Drehteller
      const u = ease((t - E.truck - 0.35) / 1.5);
      const x = lerp(-9.5, 0, u);
      const y = x < -6.2 ? 0.62 : x < -3 ? lerp(0.62, 0.5, (x + 6.2) / 3.2) : 0.5;
      red.position.set(x, y, 0);
      red.rotation.y = lerp(0, ttAngle(E.truck + 1.9) % (Math.PI * 2), smooth((u - 0.7) / 0.3));
      wheelsRoll(x);
    } else onTable(red, t);
    return;
  }
  if (t < S.look.t0) {
    // Straße 2, Fahrtrichtung −z
    red.rotation.y = Math.PI / 2;
    let z = 2, y = 0;
    if (t >= S.rockets.t0 && t < S.fans.t0) {
      nozzles.forEach((n) => n.scale.setScalar(Math.max(0.001, ease((t - E.nozzles) / 0.35))));
      const l = t - E.lift;
      if (l > 0) y = 3.4 * ease(l / 1.3) + Math.sin(l * 5) * 0.12;
      red.rotation.z = l > 0 ? Math.sin(l * 3.1) * 0.05 : 0;
      red.rotation.x = l > 0 ? Math.sin(l * 2.3) * 0.06 : 0;
    } else if (t < S.stick.t0) {
      nozzles.forEach((n) => n.scale.setScalar(1));
      fans.forEach((f, i) => { f.visible = true; f.rotation.y = t * 30 + i; });
      y = lerp(1.6, 0, win(t, E.fans, E.fans + 1.4));
    } else {
      nozzles.forEach((n) => n.scale.setScalar(1));
      fans.forEach((f, i) => { f.visible = true; f.rotation.y = t * 30 + i; });
      const a = (t - E.loop0) / 1.0;
      if (a < 1) { z = lerp(-17, LOOP.z, smooth(a)); red.position.set(24, 0, z); wheelsRoll(-z); return; }
      const th = Math.PI * win(t, E.loop0 + 1.0, E.loopTop + 0.2);
      // Auf dem Looping: Position wie Drehung um die x-Achse durch den Mittelpunkt
      const q = new THREE.Quaternion().setFromAxisAngle(V(1, 0, 0), th);
      const p = V(0, -LR + 0.0, 0).applyQuaternion(q).add(LOOP);
      red.position.copy(p);
      red.quaternion.copy(q).multiply(new THREE.Quaternion().setFromAxisAngle(V(0, 1, 0), Math.PI / 2));
      wheelsRoll(th * LR + 14);
      return;
    }
    red.position.set(24, y, z);
    return;
  }
  // Schlussbild: geparkt vor der Bühne
  red.position.set(-6, 0.04, 9); red.rotation.set(0, 0.25, 0);
  nozzles.forEach((n) => n.scale.setScalar(1));
}
function placeCyber(t) {
  const S = SHOT;
  cyber.visible = t < S.build.t0 || t >= S.reveal.t0;
  if (!cyber.visible) return;
  cyber.rotation.set(0, 0, 0);
  if (t < S.build.t0) {   // kopfüber unter der Brücke
    cyber.position.set(lerp(20.5, 26.5, t / S.build.t0), BR.y - 0.06, BR.z);
    cyber.rotation.set(Math.PI, 0, 0);   // um die Längsachse gedreht
    cyber.userData.wheels.forEach((w) => (w.rotation.z = t * 6));
    return;
  }
  if (t < S.flip.t0) { onTable(cyber, t, lerp(-2.4, 0.5, ease((t - E.rise) / 1.3))); return; }
  if (t < S.rocket.t0) {
    const base = ttAngle(S.flip.t0);
    cyber.rotation.y = base;
    let y = 0.5;
    const j = (t - E.jump) / 0.6; if (j > 0 && j < 1) y += 2.4 * 4 * j * (1 - j);
    const k = (t - E.kick) / 0.85;
    if (k > 0 && k < 1) { y += 4.2 * 4 * k * (1 - k); cyber.rotateX(Math.PI * 2 * smooth(k)); }
    const f = t - E.flyUp;
    if (f > 0) { y += 9 * ease(f / 1.4) + Math.sin(f * 4) * 0.15; cyber.position.z = 0; }
    cyber.position.set(0, y, 0);
    return;
  }
  if (t < S.buy.t0) {   // Sprint über Straße 1
    const a = Math.max(0, t - E.dash);
    const x = -15 + 0.5 * 70 * a * a;
    cyber.visible = x < 80;
    cyber.position.set(x, 0.04, 8.2); cyber.rotation.y = 0;
    cyber.userData.wheels.forEach((w) => (w.rotation.z = -x / 0.37));
    return;
  }
  onTable(cyber, t);
}
function placeProd(t) {
  const starts = [E.m3, E.my, E.ct];
  prod.forEach((car, k) => {
    const a = t - starts[k] + 0.25;
    car.visible = a > 0 && t < SHOT.delay.t0;
    if (!car.visible) return;
    const u = ease(a / 1.1);
    if (a < 1.1) { car.position.set(PF.x, 0.04, lerp(PF.z - 2, 9.6, u)); car.rotation.set(0, Math.PI / 2, 0); }
    else {
      const b = a - 1.1;
      const x = PF.x - Math.min(7 + k * 6.5, 9 * b);
      car.position.set(x, 0.04, 9.6);
      car.rotation.set(0, lerp(Math.PI / 2, Math.PI, smooth(b / 0.35)), 0);
    }
  });
}
// Rauch/Gas-Emitter (deterministisch)
const EMIT = [
  { t0: () => E.boom, t1: () => E.boom + 0.5, rate: 60, life: 1.6, origin: () => V(PA.x, 0.6, PA.z), spread: 3.0, up: 1.0, size: 0.6, seed: 1 },
  { t0: () => E.launch - 0.4, t1: () => SHOT.orbit.t0, rate: 45, life: 2.2, origin: () => V(PR.x, 0.6, PR.z), spread: 7, up: 0.4, size: 1.8, seed: 2 },
  { t0: () => E.gas, t1: () => SHOT.fly.t0, rate: 40, life: 0.8, origin: () => V(24, 0.55, 2), spread: 3.2, up: 0.1, size: 0.35, seed: 3, side: true },
  { t0: () => E.lift - 0.2, t1: () => SHOT.fans.t0, rate: 40, life: 0.8, origin: (s) => V(24, 0.2 + 3.4 * ease((s - E.lift) / 1.3), 2), spread: 1.2, up: -2.2, size: 0.4, seed: 4 },
  { t0: () => E.jump - 0.05, t1: () => SHOT.rocket.t0 - 0.9, rate: 35, life: 0.9, origin: (s) => V(0, cyberY(s), 0), spread: 1.5, up: -2.6, size: 0.45, seed: 5 },
  { t0: () => E.dash - 0.6, t1: () => E.dash + 0.6, rate: 50, life: 1.1, origin: (s) => V(-17 + 0.5 * 70 * Math.max(0, s - E.dash) ** 2, 0.5, 8.2), spread: 1.4, up: 0.6, size: 0.6, seed: 6 },
  { t0: () => E.ice - 0.05, t1: () => E.ice + 0.25, rate: 60, life: 0.9, origin: () => V(0, 1.4, 0), spread: 3.6, up: 0.8, size: 0.5, seed: 7 },
];
function cyberY(s) {
  let y = 0.5;
  const j = (s - E.jump) / 0.6; if (j > 0 && j < 1) y += 2.4 * 4 * j * (1 - j);
  const k = (s - E.kick) / 0.85; if (k > 0 && k < 1) y += 4.2 * 4 * k * (1 - k);
  const f = s - E.flyUp; if (f > 0) y += 9 * ease(f / 1.4);
  return y;
}
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _s = new THREE.Vector3(), _p = new THREE.Vector3();
function updatePuffs(t) {
  let n = 0;
  for (const em of EMIT) {
    const t0 = em.t0(), t1 = em.t1();
    if (t < t0 || t > t1 + em.life) continue;
    const count = Math.floor((Math.min(t, t1) - t0) * em.rate);
    for (let i = 0; i <= count && n < PUFF_N; i++) {
      const s = t0 + i / em.rate, age = t - s;
      if (age < 0 || age > em.life) continue;
      const r = rng(em.seed * 1000 + i);
      const a = r() * Math.PI * 2, sp = em.spread * (0.4 + r() * 0.6);
      const o = em.origin(s);
      const u = ease(age / em.life);
      let dx = Math.cos(a) * sp * u, dz = Math.sin(a) * sp * u;
      if (em.side) { dx = (r() - 0.5) * 0.8 * u; dz = (r() > 0.5 ? 1 : -1) * sp * u; }
      _p.set(o.x + dx, o.y + em.up * u * 2 + r() * 0.3, o.z + dz);
      const sc = em.size * (0.5 + r() * 0.7) * (age < 0.15 ? age / 0.15 : 1 - smooth((age - em.life * 0.55) / (em.life * 0.45)));
      _s.setScalar(Math.max(0.001, sc));
      _q.setFromAxisAngle(V(0, 1, 0), r() * 3);
      puffs.setMatrixAt(n++, _m.compose(_p, _q, _s));
    }
  }
  puffs.count = n;
  puffs.instanceMatrix.needsUpdate = true;
}
function updateBills(t) {
  const a = t - E.money;
  bills.visible = a > 0 && a < 3;
  if (!bills.visible) return;
  for (let i = 0; i < BILL_N; i++) {
    const [ang, vy, vr, spin, delay] = billSeed[i];
    const b = Math.max(0, a - delay);
    _p.set(Math.cos(ang) * vr * ease(b / 2), 1.2 + vy * b - 1.2 * b * b, Math.sin(ang) * vr * ease(b / 2) + 1);
    _q.setFromEuler(new THREE.Euler(spin * b, spin * 0.6 * b + ang, spin * 0.3 * b));
    _s.setScalar(b > 0 ? 0.9 : 0.001);
    bills.setMatrixAt(i, _m.compose(_p, _q, _s));
  }
  bills.instanceMatrix.needsUpdate = true;
}
function updateRain(t) {
  const on = t >= E.rain && t < SHOT.reveal.t0;
  rain.visible = on; storm.visible = t >= SHOT.delay.t0 && t < SHOT.reveal.t0;
  storm.position.x = lerp(-30, 0, ease((t - SHOT.delay.t0) / 1.6));
  if (!on) return;
  for (let i = 0; i < RAIN_N; i++) {
    const [x, y0, z, sp] = rainSeed[i];
    const y = 17 - ((y0 + (t - E.rain) * sp) % 17);
    _p.set(x, y, z); _q.identity(); _s.set(1, 1, 1);
    rain.setMatrixAt(i, _m.compose(_p, _q, _s));
  }
  rain.instanceMatrix.needsUpdate = true;
}

// Tafeln je Zeitpunkt
function updateBoards(t) {
  const S = SHOT;
  // Station 2008
  if (t < E.cells0) signA.userData.set("2008", "DAS ORIGINAL", { color: "#ffffff" });
  else if (t < E.boom) signA.userData.set("AKKUZELLEN", Math.round(6831 * clamp((t - E.cells0) / (E.cells1 - E.cells0 - 0.2))).toLocaleString("de-DE"));
  else signA.userData.set("2008", "ROADSTER", { color: "#ffffff" });
  // Haupttafel
  let lab = "", val = "", opt = {};
  if (t < S.new.t0) { lab = "TESLA"; val = "ROADSTER"; }
  else if (t < E.accel) { lab = "NEU · 2017"; val = "ROADSTER"; }
  else if (t < E.range) { lab = "0–97 KM/H"; val = "1,9 S"; }
  else if (t < E.ready) { lab = "REICHWEITE"; val = "1.000 KM"; }
  else if (t < S.battery.t0) { lab = "AUSLIEFERUNG"; val = "2020"; }
  else if (t < E.double) { lab = "AKKU"; val = "1×"; }
  else if (t < S.cost.t0) { lab = "AKKU"; val = "2×"; opt = { color: "#7ff4ff" }; }
  else if (t < S.broke.t0) { lab = "KOSTEN"; val = "$$$$$"; opt = { color: "#5fe07a" }; }
  else if (t < E.weeks) { lab = "KONTOSTAND"; val = "0 $"; opt = { color: "#ff4a3d" }; }
  else if (t < S.price.t0) { lab = "2018"; val = "FAST PLEITE"; opt = { color: "#ff4a3d" }; }
  else if (t < E.ice) { lab = "PREIS"; val = "200.000 $"; }
  else if (t < S.dessert.t0 + 0.4) { lab = "ROADSTER"; val = "AUF EIS"; opt = { color: "#9fe3ff" }; }
  else if (t < S.chips.t0) { lab = "ROADSTER"; val = "NACHTISCH"; opt = { color: "#ffb3c8" }; }
  else if (t < S.delay.t0) { lab = "CHIPS"; val = t < E.chip ? "100 %" : "0 %"; opt = { color: t < E.chip ? "#ffffff" : "#ff4a3d" }; }
  else if (t < S.reveal.t0) { lab = "ENTHÜLLUNG"; val = "1. OKT"; opt = t >= E.stamp ? { stamp: "VERSCHOBEN" } : {}; }
  else if (t < S.rocket.t0) { lab = "ENTHÜLLUNG"; val = "15. OKT 2026"; opt = { color: "#ffffff" }; }
  else if (t < S.buy.t0) { lab = "0–97 KM/H"; val = "0,59 S"; opt = { color: "#ffd04a" }; }
  else if (t < E.y2028) { lab = "MARKTSTART"; val = "?"; }
  else if (t < S.look.t0) { lab = "MARKTSTART"; val = "2028"; opt = { color: "#ffd04a" }; }
  else { lab = "2017 → 2026"; val = "9 JAHRE"; }
  const since = Math.min(...[S.new.t0, E.accel, E.range, E.ready, E.double, E.weeks, E.ice, E.chip, E.stamp, E.y2028].map((x) => (t >= x ? t - x : 99)));
  if (since < 0.12) opt.flash = (0.12 - since) * 4;
  board.userData.set(lab, val, opt);
  // Auslieferung
  const y = t < E.y21 ? "2020" : t < E.y22 ? "2021" : t < E.y23 ? "2022" : "2023";
  const yAge = Math.min(...[E.y21, E.y22, E.y23].map((x) => (t >= x ? t - x : 99)));
  delivery.userData.set("AUSLIEFERUNG", t < SHOT.years.t0 ? "2020" : y, yAge < 0.15 ? { flash: (0.15 - yAge) * 3 } : {});
  // Jahr an der Brücke
  yearBoard.userData.set("JAHR", t < E.yearFlip ? "2026" : "2017", { color: t < E.yearFlip ? "#ffae2b" : "#ff6a3d" });
}

// =============================================================== Kamera ===
function shotName(t) {
  let n = "hook";
  for (const s of TL.shots) if (t >= s.t) n = s.name;
  return n;
}
function setCam(cam, t) {
  const name = shotName(t);
  const S = SHOT[name] || { t0: TL.black, t1: DUR };
  const u = clamp((t - S.t0) / (S.t1 - S.t0));
  const k = SHOTCAM[name];
  let pos, look;
  if (k) {
    const e = smooth(u) * 0.6 + u * 0.4;
    pos = V(...k[0]).lerp(V(...k[2]), e);
    look = V(...k[1]).lerp(V(...k[3]), e);
  } else if (name === "build") {
    const a = lerp(0.35, 1.0, u);
    pos = V(Math.sin(a) * 72, lerp(46, 38, u), Math.cos(a) * 72 - 4);
    look = V(0, -2, -6);
  } else if (name === "space") {
    const ry = Math.max(0, t - E.launch);
    const rh = 0.5 * 7 * ry * ry;
    pos = V(-14, 2.0 + rh * 0.22, -22);
    look = V(PR.x, 15 + rh, PR.z);
  } else if (name === "flip") {
    const y = cyberY(t);
    pos = V(lerp(7.5, 6.5, u), 3.2 + y * 0.6, lerp(11.5, 10.5, u));
    look = V(0, y + 0.8, 0);
  } else if (name === "look") {
    const e = smooth(u);
    pos = V(lerp(3, 40, e), lerp(17, 58, e), lerp(24, 96, e));
    look = V(0, lerp(3, -4, e), lerp(-1, -6, e));
  } else { pos = V(0, 10, 30); look = V(0, 0, 0); }
  // leichtes Schweben + Ruck bei Ereignissen
  let sh = 0.03;
  for (const [tt0, amp] of [[E.boom, 0.35], [E.launch, 0.5], [E.dash, 0.4], [E.loopTop, 0.15], [E.flyUp, 0.25], [E.ice, 0.15]]) {
    const a = t - tt0; if (a > 0 && a < 0.7) sh += amp * (1 - a / 0.7);
  }
  pos.x += Math.sin(t * 1.3) * 0.08 + Math.sin(t * 23) * sh * 0.4;
  pos.y += Math.sin(t * 1.1 + 1) * 0.06 + Math.sin(t * 19 + 2) * sh * 0.4;
  cam.position.copy(pos);
  cam.lookAt(look);
  cam.updateMatrixWorld();
  return name;
}

// =============================================================== Frame ===
function renderAt(t) {
  t = clamp(t, 0, DUR);
  fontsReady = document.fonts ? document.fonts.check("900 40px RS") : true;
  updateOverlay(t);
  if (t >= TL.black) { canvas.style.opacity = 0; return; }
  canvas.style.opacity = 1;
  const name = shotName(t);

  // Weltall-Einstellung
  if (name === "orbit") {
    const u = (t - SHOT.orbit.t0) / (SHOT.orbit.t1 - SHOT.orbit.t0);
    spaceCar.position.set(0, 0, 0); spaceCar.rotation.set(0.15 + Math.sin(t * 0.8) * 0.12, 0.6 + t * 0.3, 0.1);
    spaceCam.position.set(lerp(6.5, 5.2, u), lerp(2.4, 1.9, u), lerp(8.5, 7.2, u)); spaceCam.lookAt(0, -0.6, 0);
    earth.rotation.y = t * 0.03;
    renderer.render(space, spaceCam);
    return;
  }
  // Licht/Himmel: Sonnenuntergang, beim Regen grauer, bei der Enthüllung dunkler mit Spots
  const storm01 = t >= SHOT.delay.t0 && t < SHOT.reveal.t0 ? win(t, SHOT.delay.t0, SHOT.delay.t0 + 1.2) : 0;
  const dusk = t >= SHOT.reveal.t0 && t < SHOT.rocket.t0 ? 1 : 0;
  SU.top.value.set("#7c69b4").lerp(new THREE.Color("#4a4f63"), storm01).lerp(new THREE.Color("#2d2858"), dusk * 0.8);
  SU.horizon.value.set("#f9a46c").lerp(new THREE.Color("#8d8f9c"), storm01).lerp(new THREE.Color("#e0735a"), dusk * 0.6);
  sun.intensity = 2.1 * (1 - storm01 * 0.65) * (1 - dusk * 0.55);
  hemi.intensity = 1.15 * (1 - storm01 * 0.3) * (1 - dusk * 0.35);
  stageSpot.intensity = dusk ? 160 : 0;
  beams.forEach((b) => (b.material.opacity = dusk ? 0.14 : 0.08));
  scene.fog.color.set("#f0a98c").lerp(new THREE.Color("#8d8f9c"), storm01);
  sky.position.copy(camera.position);

  // Lastwagentür
  truckDoor.rotation.y = -1.9 * win(t, E.truck, E.truck + 0.5);
  turntable.rotation.y = 0;
  turntable.children.filter((c) => c.geometry && c.geometry.type === "TorusGeometry").forEach((r) => (r.material.opacity = t >= SHOT.dessert.t0 && t < SHOT.years.t0 ? 0.6 + 0.3 * Math.sin(t * 6) : 0));

  // Rakete
  const ry = Math.max(0, t - E.launch);
  rocket.position.y = 0.6 + 0.5 * 7 * ry * ry;
  rocket.visible = t < SHOT.orbit.t0 || t >= SHOT.new.t0 && false;
  flames.forEach((f, i) => { f.visible = t >= E.launch - 0.3 && t < SHOT.orbit.t0; f.scale.set(1, 1 + 0.25 * Math.sin(t * 40 + i * 2) + ry * 0.4, 1); });
  if (t >= SHOT.orbit.t0) rocket.visible = false;
  if (t >= SHOT.look.t0) { rocket.visible = true; rocket.position.y = 0.6; flames.forEach((f) => (f.visible = false)); }

  placeLotus(t);
  parkedLotus.visible = t >= SHOT.look.t0;
  parkedLotus.position.set(PA.x, 0.12, PA.z);
  placeRed(t);
  placeCyber(t);
  placeProd(t);

  // Akku-Hologramm
  pack.visible = t >= SHOT.battery.t0 && t < SHOT.cost.t0;
  if (pack.visible) {
    const d = win(t, E.double, E.double + 0.5);
    pack.position.set(0, 2.4 + d * 0.4, 0); pack.rotation.y = ttAngle(t);
    pack.scale.set(lerp(1, 1.45, d), 1, lerp(1, 1.4, d));
    pack.scale.multiplyScalar(ease((t - SHOT.battery.t0) / 0.4));
  }
  red.userData.body.scale.y = 1; // (kein Einfedern nötig)

  // Eis + Nachtisch
  ice.visible = t >= E.ice - 0.05 && t < SHOT.years.t0;
  if (ice.visible) { ice.position.set(0, 0.5 + 1.3, 0); ice.rotation.y = ttAngle(t); ice.scale.setScalar(Math.max(0.01, ease((t - E.ice + 0.05) / 0.3))); }
  cupcake.visible = t >= E.dessert && t < SHOT.chips.t0;
  if (cupcake.visible) {
    const f = clamp((t - E.dessert) / 0.35);
    const land = 0.5 + 2.6;
    cupcake.position.set(0, lerp(22, land, f * f), 0);
    const sq = t - E.dessert - 0.35;
    const s = sq > 0 && sq < 0.3 ? 1 - 0.25 * Math.sin((sq / 0.3) * Math.PI) : 1;
    cupcake.scale.set(1 / Math.sqrt(s), s, 1 / Math.sqrt(s));
    cupcake.rotation.y = ttAngle(t);
  }
  // Chip
  chip.visible = t >= SHOT.chips.t0 && t < SHOT.years.t0;
  if (chip.visible) {
    const c = Math.max(0, t - E.chip);
    chipHalves.forEach((h, i) => { const s = i ? 1 : -1; h.position.set(s * c * 1.6, 0, c * c * 1.5); h.rotation.set(0, 0, s * c * 1.2); });
  }

  updatePuffs(t);
  updateBills(t);
  updateRain(t);
  updateBoards(t);

  setCam(camera, t);
  clouds.rotation.y = t * 0.004;
  renderer.render(scene, camera);
  // Weißblitz beim „Bumm“ und beim Raketenstart
  let fl = 0;
  for (const [a, s] of [[E.boom, 0.55], [E.launch, 0.35], [E.dash, 0.3]]) { const d = t - a; if (d > 0 && d < 0.25) fl = Math.max(fl, s * (1 - d / 0.25)); }
  flash.style.opacity = fl.toFixed(3);
}

window.addEventListener("hf-seek", (e) => renderAt(e.detail.time));
renderAt(window.__hfThreeTime || 0);
if (document.fonts) document.fonts.ready.then(() => renderAt(window.__hfThreeTime || 0));
