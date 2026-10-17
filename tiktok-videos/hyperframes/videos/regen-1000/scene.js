// "Was wäre, wenn es tausend Jahre lang regnet?" – 91 s, eine einzige feste Einstellung.
// Erhöhter Blick (wie aus einem Fenster im 5. Stock) schräg hinunter auf eine Berliner Kreuzung,
// die Allee läuft in die Tiefe. Zeitraffer: Stunden → Tage → Monate → Jahre → Jahrtausend.
// 0–5 s vor dem Regen · 5–12 s Regen setzt ein · 12–21 s Nacht, Gullys laufen über · 21–35 s Tage, Leute waten ·
// 35–50 s Monate, Boote · 50–62 s Jahre, Wasser in den Stockwerken, Lichter gehen aus ·
// 62–68 s unter Wasser · 68–75 s Wasser sinkt unter die Kamera · 75–80 s Schlamm · 80–88 s Wald · 88–91 s Endkarte.
import { THREE, rng, clamp, smooth, lerp, createSky, crowd, colorAt, valueAt } from "./lib/lowpoly.js";
import { mat } from "./lib/props.js";
import { createOverlay, de, curve } from "./lib/ww-overlay.js";
import { street, berlinHouses, skyline, furniture, vehicle, headMat, tailMat, umbrellas, kayak, dinghy, duck, rowboat,
         water, rain, ripples, boxes, lightShafts, forest, LANE_R, LANE_L, TRACK_R, TRACK_L, PARK } from "./sets.js";

const DURATION = 91;
const RAIN0 = 5;          // erste Stunde Regen
const RAIN_STOP = 66.4;   // Jahr 1.000: der Regen hört auf
const BLACK = 88;
const END = 88.5;

const SCENES = [
  { name: "Berliner Kreuzung, feste Einstellung aus dem 5. Stock", set: "kreuzung" },
];

// ------------------------------------------------------------ Zeitachse ---
// Vergangene Zeit seit Regenbeginn in Stunden; dazwischen logarithmisch interpoliert.
const YR = 8766;
const TIME = [[RAIN0, 0], [6, 1], [12, 3.9], [13, 4], [14, 6], [15, 8], [16.5, 12], [18, 16], [20.5, 21], [22, 72], [25, 120],
  [28, 144], [31, 240], [33, 312], [35, 456], [36, 552], [37.6, 1462], [44, 2930], [48, 6580], [50, 8040], [53, 15350],
  [56, 2.02 * YR], [58, 3.05 * YR], [61.5, 5.05 * YR], [62.2, 7.05 * YR], [63, 12.05 * YR], [64, 68.05 * YR], [65, 417.05 * YR],
  [66, 750.05 * YR], [RAIN_STOP, 1000.05 * YR], [67.6, 1023.05 * YR], [69, 1059.05 * YR], [71, 1065.05 * YR], [72, 1071.05 * YR],
  [74, 1095.05 * YR], [75, 1104.05 * YR], [76, 1129.05 * YR], [77, 1184.05 * YR], [79, 1299.05 * YR], [80, 1339.05 * YR],
  [81, 1462.05 * YR], [82, 1741.05 * YR], [86, 2752.05 * YR], [BLACK, 2979.05 * YR]];
function hours(t) {
  if (t <= RAIN0) return 0;
  for (let i = 1; i < TIME.length; i++) {
    const [t1, h1] = TIME[i], [t0, h0] = TIME[i - 1];
    if (t <= t1) return Math.pow(10, lerp(Math.log10(h0 + 1), Math.log10(h1 + 1), (t - t0) / (t1 - t0))) - 1;
  }
  return TIME[TIME.length - 1][1];
}
function when(t) {
  const h = hours(t);
  if (h < 24) return `Stunde ${Math.floor(h)}`;
  const d = h / 24;
  if (d < 31) return `Tag ${Math.max(1, Math.floor(d))}`;
  const m = h / 730.5;
  if (m < 24) return `Monat ${Math.floor(m)}`;
  return `Jahr ${de(Math.floor(h / YR))}`;
}
// Wasserstand über der Straße (m). Kamera auf 15 m: Wasserlinie kreuzt bei ~62,5 s und ~68,8 s.
const CAM_Y = 15;
const WATER = [[0, 0], [12, 0], [14, 0.05], [17, 0.12], [21, 0.3], [28, 0.45], [35, 0.8], [38, 1.8], [44, 3.5], [48, 6.6], [50, 8],
  [53, 10], [58, 13], [61.5, 14], [62.1, 14.4], [62.9, 15.6], [63.5, 21], [64, 60], [65, 183], [66.4, 238], [67, 240],
  [67.7, 150], [68.2, 18], [68.4, 16], [69.2, 14.3], [69.8, 12], [70.5, 10], [72, 9.5], [74, 6.5], [75, 4.5], [77, 1.0], [79.5, 0]];
const W = (t) => curve(WATER, t);
const waterText = (t) => {
  const w = W(t);
  return `Wasser ${w <= 0.001 ? "0" : w < 10 ? de(w, 1) : de(Math.round(w))} m über der Straße`;
};

// ------------------------------------------------------------------ Overlay ---
const overlay = createOverlay(document.getElementById("overlay"), {
  title: { text: "Was wäre, wenn es tausend Jahre lang regnet?", accent: "tausend Jahre", accentColor: "#f2c26b", start: 0, end: 5 },
  hud: [
    { start: 0.3, end: RAIN0, label: "Vor dem Regen", value: () => "Stunde 0", sub: "Wasser 0 m über der Straße", fadeIn: 0.3, fadeOut: 0.01 },
    { start: RAIN0, end: RAIN_STOP, label: "Regen", value: when, sub: waterText, fadeIn: 0.01, fadeOut: 0.01 },
    { start: RAIN_STOP, end: BLACK, label: "Regen vorbei", value: when, sub: waterText, fadeIn: 0.01, fadeOut: 0.3 },
  ],
  subtitles: [
    { start: 7, end: 11, text: "Es fängt an wie jeder Schauer." },
    { start: 16, end: 20, text: "Bei Einbruch der Nacht geben die Gullys auf." },
    { start: 24, end: 31, text: "Die Berliner passen sich an. Wie immer." },
    { start: 37, end: 41, text: "Monat zwei: Die Allee ist ein Kanal." },
    { start: 43, end: 49, text: "Das Leben zieht nach oben." },
    { start: 51, end: 56, text: "Aber das Wasser steigt immer weiter." },
    { start: 57, end: 61, text: "Ein Licht nach dem anderen geht aus." },
    { start: 63, end: 67, text: "Tausend Jahre lang ändert sich nichts." },
    { start: 69, end: 74, text: "Dann, eines Tages, hört der Regen auf." },
    { start: 75, end: 79, text: "Das Wasser braucht drei Jahrhunderte, um zu gehen." },
    { start: 81, end: 87, text: "Was übrig bleibt, gehört dem Wald." },
  ],
  black: { start: BLACK, end: END },
  endcard: { start: END, end: DURATION, lines: [
    "1.000 Jahre Regen · 300 Jahre Abfluss · Eine Allee",
    "Was soll als Nächstes passieren? Schreib es in die Kommentare",
  ] },
});

// ----------------------------------------------------------------- Renderer ---
const canvas = document.getElementById("scene");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1);
renderer.setSize(1080, 1920, false);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
scene.fog = new THREE.Fog("#c9cdd0", 60, 700);
const camera = new THREE.PerspectiveCamera(58, 1080 / 1920, 0.1, 5000);
const CAM = new THREE.Vector3(8, CAM_Y, 59);
const YAW = 0.262, PITCH = -0.187;
camera.position.copy(CAM);
camera.quaternion.setFromEuler(new THREE.Euler(PITCH, YAW, 0, "YXZ"));
camera.updateMatrixWorld();
scene.add(camera);
const sky = createSky(3000); scene.add(sky);
const SU = sky.material.uniforms;
const hemi = new THREE.HemisphereLight("#dfe6ee", "#6d6a62", 1.2); scene.add(hemi);
const sun = new THREE.DirectionalLight("#fff1dc", 1.2);
sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -90, right: 90, top: 110, bottom: -110, near: 1, far: 600 });
sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.05;
scene.add(sun); scene.add(sun.target);
const SUN_DIR = new THREE.Vector3(0.72, 0.62, -0.32).normalize();
sun.position.set(0, 0, -30).addScaledVector(SUN_DIR, 300); sun.target.position.set(0, 0, -30);

// Unterwasser-Tönung unterhalb der Wasserlinie (nur beim Durchgang der Linie durchs Bild)
const line = document.createElement("div");
line.style.cssText = "position:absolute;left:0;right:0;height:4px;background:rgba(230,245,240,0.55);box-shadow:0 0 14px rgba(200,240,230,0.6);opacity:0;pointer-events:none";
canvas.insertAdjacentElement("afterend", line);

// ==================================================================== Welt ===
const R = rng(2024);
const st = street(); scene.add(st.group);
const city = berlinHouses(); scene.add(city.group);
const sl = skyline(); scene.add(sl.group);
const fur = furniture(); scene.add(fur.group);
const wat = water(); scene.add(wat.mesh);
const drops = rain(camera); scene.add(drops.lines);
const rings = ripples(); scene.add(rings.mesh);
const shafts = lightShafts(); scene.add(shafts.group);

const GROUND = {
  asphalt: [[0, "#4c4d51"], [6, "#4c4d51"], [10, "#36383b"], [74, "#36383b"], [78, "#5e5040"], [81, "#5a5a3c"], [87, "#4f6436"]],
  trackBed: [[0, "#5d5b57"], [6, "#5d5b57"], [10, "#46454a"], [74, "#46454a"], [78, "#655642"], [81, "#5f6440"], [87, "#556c3a"]],
  paving: [[0, "#9a968f"], [6, "#9a968f"], [10, "#76736e"], [74, "#76736e"], [78, "#7a6a50"], [81, "#6f7448"], [87, "#5f7a42"]],
};
const houseBase = city.houses.map((h) => h.mats.map((m) => m.color.clone()));
const houseOff = city.houses.map(() => 55.5 + R() * 5.8);   // Lichter gehen einzeln aus
const towerBase = sl.towers.map((b) => b.material.color.clone());

// ================================================================ Fahrzeuge ===
// Verkehr fährt bis 8 s, bremst bis 11,5 s und steht dann (Stau, Wasser).
const sMove = (t, v) => {
  if (t < 8) return v * t;
  const u = Math.min(t - 8, 3.5);
  return v * 8 + v * u - v * u * u / 7;
};
const vehicles = [];
function addVehicle(kind, seed, x, z0, dir, v, extra = {}) {
  const g = vehicle(seed, kind); scene.add(g);
  const k = rng(seed * 7 + 3);
  vehicles.push({ g, kind, x, z0, dir, v, wreck: { dx: k.range(-2.5, 2.5), dz: k.range(-6, 6), ry: k.range(-0.9, 0.9), tilt: k.range(-0.25, 0.25), sink: k.range(0.1, 0.35) }, ...extra });
  return g;
}
const kinds = ["taxi", "car", "car", "taxi", "car", "taxi", "car", "car"];
// rechte Spur: weg von der Kamera (−z)
let n = 0;
for (let z = 150; z > -70; z -= 13.5) {
  const kind = n === 4 ? "decker" : kinds[n % kinds.length];
  addVehicle(kind, 100 + n, LANE_R + R.range(-0.2, 0.2), kind === "decker" ? z - 4 : z, -1, 8.5);
  n++;
}
// linke Spur: auf die Kamera zu (+z)
for (let z = -260; z < -40; z += 12.5) { addVehicle(kinds[(n + 3) % kinds.length], 100 + n, LANE_L + R.range(-0.2, 0.2), z, 1, 8.5); n++; }
// Tram auf dem rechten Gleis, zweite Tram stadtauswärts weiter hinten
addVehicle("tram", 900, TRACK_R, 30, -1, 6.4);
addVehicle("tram", 901, TRACK_L, -170, 1, 6.4);
// Parkende Autos und wartende Autos in der Querstraße
for (const sx of [-1, 1]) for (let z = sx > 0 ? 24 : 22; z < 140; z += 6.2) if (R() < 0.8) { addVehicle(R() < 0.3 ? "taxi" : "car", 300 + n, sx * PARK, z, sx > 0 ? -1 : 1, 0); n++; }
for (const sx of [-1, 1]) for (let z = -18; z > -260; z -= 6.2) if (R() < 0.75) { addVehicle(R() < 0.2 ? "taxi" : "car", 300 + n, sx * PARK, z, -1, 0); n++; }
for (let x = -14; x > -90; x -= 6.4) { const g = addVehicle(R() < 0.3 ? "taxi" : "car", 500 + n, 0, 0, 0, 0, { cx: x - 2, cz: 3.4 }); g.rotation.y = -Math.PI / 2; n++; }
for (let x = 16; x < 90; x += 6.4) { const g = addVehicle(R() < 0.3 ? "taxi" : "car", 500 + n, 0, 0, 0, 0, { cx: x + 2, cz: -3.4 }); g.rotation.y = Math.PI / 2; n++; }
const RUST = new THREE.Color("#6b4a32");
vehicles.forEach((v) => { v.paint = v.g.userData.paint; v.base = v.paint.color.clone(); });

function updateVehicles(t) {
  const wreckK = smooth(clamp((t - 64) / 3));   // während der Tiefe verschoben/verkantet
  const rustK = smooth(clamp((t - 69) / 9));
  for (const v of vehicles) {
    let x, z, ry;
    if (v.cx !== undefined) { x = v.cx; z = v.cz; ry = v.g.rotation.y; }
    else {
      const s = v.v ? sMove(t, v.v) : 0;
      x = v.x; z = v.z0 + v.dir * s; ry = v.dir > 0 ? Math.PI : 0;
    }
    const w = v.wreck;
    v.g.position.set(x + w.dx * wreckK, -w.sink * wreckK + (v.kind === "tram" ? 0.02 : 0), z + w.dz * wreckK);
    v.g.rotation.set(w.tilt * wreckK, ry + w.ry * wreckK * (v.kind === "tram" ? 0.15 : 1), w.tilt * 0.6 * wreckK);
    v.paint.color.copy(v.base).lerp(RUST, rustK * 0.75);
  }
}

// ================================================================= Menschen ===
const NP = 96;
const people = crowd(NP, 77); scene.add(people.group);
const umb = umbrellas(NP); scene.add(umb.group);
const P = [];
for (let i = 0; i < NP; i++) {
  const kind = i < 58 ? "avenue" : i < 74 ? "cross" : "wade";
  const side = R() < 0.55 ? -1 : 1;
  P.push({
    kind, side,
    x: kind === "avenue" ? side * R.range(10.8, 15.4) : kind === "cross" ? 0 : R.range(-9, 15),
    z: kind === "cross" ? (R() < 0.5 ? -1 : 1) * R.range(8.2, 11.6) : R.range(-90, 70),
    dir: R() < 0.5 ? -1 : 1, v: kind === "wade" ? R.range(0.35, 0.6) : R.range(1.0, 1.5), ph: R() * 6.28,
    umbAt: R() < 0.12 ? -1 : 5.5 + R() * 5, leave: 12 + R() * 9, cx: R.range(-90, -16),
  });
}
function personState(p, i, t) {
  if (p.kind === "wade") {
    if (t < 21 || t > 35.5 - (i % 5) * 0.4) return null;
    const range = 120, zz = -70 + (((p.z + 70 + p.dir * p.v * (t - 21)) % range) + range) % range;
    return { x: p.x, y: -0.15 - 0.2 * smooth((t - 28) / 6), z: zz, rotY: p.dir > 0 ? 0 : Math.PI, swing: Math.sin(t * 2.4 + p.ph) * 0.3, umb: true };
  }
  if (t > p.leave) return null;
  if (p.kind === "cross") {
    const range = 74, xx = -90 + (((p.cx + 90 + p.dir * p.v * t) % range) + range) % range;
    return { x: xx, y: 0.15, z: p.z, rotY: p.dir > 0 ? Math.PI / 2 : -Math.PI / 2, swing: Math.sin(t * p.v * 4.2 + p.ph) * 0.5, umb: p.umbAt >= 0 && t > p.umbAt };
  }
  const range = 160, zz = -90 + (((p.z + 90 + p.dir * p.v * t) % range) + range) % range;
  const onCross = Math.abs(zz) < 7.2;
  if (onCross && Math.abs(p.x) < 12.2) return null;
  return { x: p.x, y: onCross ? 0 : 0.15, z: zz, rotY: p.dir > 0 ? 0 : Math.PI, swing: Math.sin(t * p.v * 4.2 + p.ph) * 0.5, umb: p.umbAt >= 0 && t > p.umbAt };
}

// Leute auf Balkonen und Booten ("Das Leben zieht nach oben")
const balc = city.balconies.filter((b) => b.x < -15 && b.z > -160 && b.z < 50).slice(0, 14);
const NB = balc.length + 9;
const upstairs = crowd(NB, 91); scene.add(upstairs.group);
const boatRow = rowboat(), boatD = dinghy("#e0662a"), boatK1 = kayak("#b8262a"), boatK2 = kayak("#2f6fb0"), boatDuck = duck(), boatD2 = dinghy("#5d6266");
const BOATS = [
  { g: boatRow, x: (t) => 1.5 + 0.4 * Math.sin(t * 0.3), z: (t) => 16 + 1.3 * (t - 37), ry: Math.PI + 0.25, seats: [[0, -1.2], [0, 0.4], [0, 1.6]] },
  { g: boatD, x: (t) => 6, z: (t) => 6 + 0.9 * (t - 37), ry: 0.5, seats: [[0, -0.6], [0, 0.9]] },
  { g: boatK1, x: (t) => -1.5 + 0.15 * (t - 38), z: (t) => 56 - 1.7 * (t - 38), ry: 0.35, seats: [[0, 0.1]] },
  { g: boatK2, x: (t) => -5, z: (t) => -14 + 2.0 * (t - 40), ry: Math.PI, seats: [[0, 0.1]] },
  { g: boatDuck, x: (t) => 7 + 0.6 * Math.sin(t * 0.4), z: (t) => 24 + 0.3 * (t - 38), ry: Math.PI + 0.9, seats: [[0, 0.3]] },
  { g: boatD2, x: (t) => -6, z: (t) => 30 - 0.5 * (t - 44), ry: -0.3, seats: [] },
];
for (const b of BOATS) scene.add(b.g);
function updateUpstairs(t, w) {
  let k = 0;
  balc.forEach((b, i) => {
    const vis = t > 41 + (i % 5) * 0.5 && t < 57.5 + (i % 4) * 0.8 && w < b.y - 0.4;
    upstairs.set(k++, vis ? { x: b.x + 0.4, y: b.y + 0.1, z: b.z, rotY: Math.PI / 2, armRaise: i % 3 === 0 ? 1.2 + 0.6 * Math.max(0, Math.sin(t * 6 + i)) : 0.1, visible: true } : { visible: false });
  });
  const bvis = t > 37.2 && t < 58.5;
  for (const b of BOATS) {
    const x = b.x(t), z = b.z(t), bob = Math.sin(t * 1.7 + x) * 0.06;
    b.g.visible = bvis;
    b.g.position.set(x, w + 0.05 + bob, z); b.g.rotation.set(Math.sin(t * 1.3 + z) * 0.04, b.ry + Math.sin(t * 0.5 + x) * 0.05, Math.sin(t * 1.1) * 0.05);
    for (const [sx, sz] of b.seats) {
      const c = Math.cos(b.ry), s = Math.sin(b.ry);
      upstairs.set(k++, bvis ? { x: x + sx * c + sz * s, y: w - 0.15 + bob, z: z - sx * s + sz * c, rotY: b.ry + Math.PI, sit: true, armRaise: 0.4 + 0.3 * Math.sin(t * 3 + sz), visible: true } : { visible: false });
    }
  }
  while (k < NB) upstairs.set(k++, { visible: false });
  upstairs.commit();
}

// ================================================================= Treibgut ===
const DEBRIS_C = ["#7a5638", "#9a7550", "#3a3d42", "#b8382c", "#d8d2c4", "#2f5a8a", "#5c5148", "#c9a46a", "#1d1f22"];
const floatDebris = boxes(110, 31, (r) => ({ x: r.range(-14, 14), z: r.range(-120, 58), sx: r.range(0.4, 1.6), sy: r.range(0.15, 0.5), sz: r.range(0.4, 1.3), c: r.pick(DEBRIS_C), at: r.range(44, 58) }));
scene.add(floatDebris.mesh);
const deepDebris = boxes(230, 32, (r) => {
  const big = r() < 0.25;
  return { x: r.range(-22, 32), y: r.range(-24, 14), z: r.range(-30, 50), sx: big ? r.range(1.2, 3.2) : r.range(0.3, 1.2), sy: big ? r.range(0.4, 1.2) : r.range(0.2, 0.9), sz: big ? r.range(1.5, 4.5) : r.range(0.3, 1.5), c: r.pick(DEBRIS_C) };
});
scene.add(deepDebris.mesh);
const planks = boxes(90, 33, (r) => ({ x: r.range(-15, 15), z: r.range(-110, 56), sx: r.range(0.15, 0.3), sy: r.range(0.1, 0.2), sz: r.range(1.5, 4.2), c: r.pick(["#6e4e34", "#8a6a48", "#5a4230", "#9a7a56", "#4b3a2b"]) }));
scene.add(planks.mesh);
const bubbles = boxes(90, 34, (r) => ({ x: r.range(-6, 6), y: r.range(-6, 6), z: r.range(-14, -2), sx: 0.08, sy: 0.08, sz: 0.08, c: "#d9f2ee" }),
  new THREE.MeshBasicMaterial({ color: "#d9f2ee", transparent: true, opacity: 0.6 }));
bubbles.mesh.castShadow = false;
camera.add(bubbles.mesh);

// =================================================================== Wald ===
const bigTrees = forest(150, 41, (r, i) => {
  if (i < 95) { // auf Fahrbahn und Gehwegen
    const z = r.range(-160, 30);
    return [r.range(-15, 15), 0.1, z, z > 0 ? r.range(0.8, 1.0) : r.range(0.9, 1.3)];
  }
  if (i < 120) { // in der Querstraße
    return [r.range(-120, -14), 0.1, r.range(-10, 10), 1.1];
  }
  const s = city.roofSpots[Math.floor(r() * city.roofSpots.length)];
  return [s.x + r.range(-1.5, 1.5), s.y - 0.3, s.z, r.range(0.55, 0.8)];
});
scene.add(bigTrees.group);
const bushes = boxes(220, 42, (r) => ({ x: r.range(-16, 16), z: r.range(-160, 58), sx: r.range(0.8, 2.2), sy: r.range(0.5, 1.2), sz: r.range(0.8, 2.2), c: r.pick(["#4d7f38", "#5a8a3c", "#3f6f30", "#6a9444", "#7a8f3e"]), at: r() }));
bushes.mesh.geometry = new THREE.IcosahedronGeometry(0.6, 0);
scene.add(bushes.mesh);

// ==================================================================== Licht ===
const SKY_TOP = [[0, "#8fa3b8"], [5, "#7d8792"], [11, "#5d666f"], [14, "#3a4554"], [16, "#26303e"], [20, "#283240"], [22.5, "#5a636c"],
  [50, "#555f63"], [56, "#4f5a58"], [61, "#6b7774"], [68.5, "#7c8a8c"], [72, "#9fb0bd"], [76, "#8fb2d6"], [88, "#7fa8d8"]];
const SKY_HOR = [[0, "#c7c6c0"], [5, "#b0b5b8"], [11, "#8b9296"], [14, "#5a6470"], [16, "#3e4856"], [20, "#424c5a"], [22.5, "#8d969a"],
  [50, "#8a9490"], [57, "#a2ada7"], [61, "#c3cbc6"], [68.5, "#c9d0cc"], [72, "#e3dccb"], [76, "#f0dcb4"], [88, "#e9e2c8"]];
const FOG_NEAR = [[0, 90], [4, 80], [7, 60], [12, 30], [50, 18], [61, 6], [68.5, 25], [72, 60], [80, 120]];
const FOG_FAR = [[0, 950], [4, 850], [7, 560], [12, 330], [50, 230], [61, 140], [68.5, 260], [72, 650], [80, 1300]];
const HEMI = [[0, 1.15], [11, 1.0], [15, 0.72], [20, 0.72], [22.5, 0.95], [61, 1.0], [68.5, 1.1], [76, 1.15], [88, 1.2]];
const SUN_I = [[0, 2.2], [3, 1.9], [6, 0.7], [11, 0.2], [15, 0.12], [20, 0.12], [22.5, 0.3], [62, 0.3], [69, 0.9], [72, 2.0], [76, 2.6], [88, 2.7]];
const SUN_C = [[0, "#fff1dc"], [12, "#c9d4e6"], [16, "#8ea6dc"], [21, "#8ea6dc"], [23, "#dfe6ee"], [68, "#e6ecef"], [72, "#ffe8c4"], [76, "#ffd9a0"], [84, "#fff0d8"]];
const EXPO = [[0, 1.0], [11, 1.0], [15, 1.4], [20, 1.4], [22.5, 1.0], [68.5, 1.0], [76, 1.02]];
const NIGHT = [[0, 0], [11, 0], [14.5, 1], [20, 1], [22.5, 0]];
const RAINK = [[0, 0], [1.5, 0.03], [5, 0.08], [7, 0.14], [9, 0.3], [12.5, 1], [62, 1], [62.6, 1], [68.4, 0.06], [70, 0.02], [72, 0]];
const SAT = [[0, 0.95], [6, 0.82], [12, 0.72], [60, 0.7], [69, 0.78], [74, 0.95], [80, 1.0], [88, 1.06]];

const UNDER_SHALLOW = new THREE.Color("#2f6e64"), UNDER_DEEP = new THREE.Color("#081a18");
const tmpC = new THREE.Color(), tint = { c: new THREE.Color("#6b5a3e"), k: 0 };
const memo = (fn) => { let last = NaN; return (k) => { const r = Math.round(k * 300) / 300; if (r !== last) { last = r; fn(r); } }; };
const growForest = memo(bigTrees.grow);

function setMode(under, t, w) {
  const depth = Math.max(0, w - CAM_Y);
  if (under) {
    const dk = clamp(Math.log10(1 + depth) / Math.log10(240));
    tmpC.copy(UNDER_SHALLOW).lerp(UNDER_DEEP, dk);
    scene.fog.color.copy(tmpC); scene.fog.near = 0.5; scene.fog.far = lerp(75, 30, dk);
    scene.background = tmpC.clone(); sky.visible = false;
    drops.lines.visible = false; rings.mesh.visible = false;
    shafts.group.visible = true; shafts.material.opacity = lerp(0.16, 0.03, dk);
    deepDebris.mesh.visible = true; bubbles.mesh.visible = true;
    wat.material.color.set("#7fc4b2"); wat.material.emissive.set("#2a5a50");
    hemi.color.set("#9fe0cf"); hemi.groundColor.set("#1c3a34"); hemi.intensity = lerp(1.2, 0.5, dk);
    sun.intensity = lerp(0.6, 0.1, dk);
    renderer.toneMappingExposure = 1.0;
    canvas.style.filter = `saturate(1.05) contrast(1.04) brightness(${lerp(1, 0.75, dk)})`;
  } else {
    scene.fog.color.copy(colorAt(SKY_HOR, t));
    scene.fog.near = valueAt(FOG_NEAR, t); scene.fog.far = valueAt(FOG_FAR, t);
    scene.background = null; sky.visible = true;
    shafts.group.visible = false; deepDebris.mesh.visible = false; bubbles.mesh.visible = false;
    wat.material.emissive.copy(scene.fog.color).multiplyScalar(valueAt([[0, 0.12], [22, 0.14], [60, 0.1], [69, 0.06], [74, 0.03]], t));
    wat.material.color.copy(colorAt([[0, "#5a6460"], [14, "#4a5452"], [16, "#2c343a"], [20, "#303a40"], [22.5, "#6a7668"], [50, "#6c7a68"], [60, "#7d8a80"], [70, "#7a8680"], [74, "#80786a"], [78, "#6e604c"]], t));
    hemi.color.set("#dfe6ee"); hemi.groundColor.set("#6d6a62"); hemi.intensity = valueAt(HEMI, t);
    sun.intensity = valueAt(SUN_I, t);
    renderer.toneMappingExposure = valueAt(EXPO, t);
    canvas.style.filter = `saturate(${valueAt(SAT, t)}) contrast(1.03)`;
  }
}

// ==================================================================== Frame ===
function renderAt(t) {
  t = clamp(t, 0, DURATION);
  overlay.update(t);
  if (t >= END) { canvas.style.opacity = 0; line.style.opacity = 0; return; }
  canvas.style.opacity = 1;
  const w = W(t);
  const night = valueAt(NIGHT, t);

  // Himmel + Sonne
  SU.top.value.copy(colorAt(SKY_TOP, t)); SU.horizon.value.copy(colorAt(SKY_HOR, t)); SU.bottom.value.copy(colorAt(SKY_HOR, t));
  SU.sunDir.value.copy(SUN_DIR); SU.sunGlow.value = 0.6 * smooth((t - 69) / 6);
  sun.color.copy(colorAt(SUN_C, t));
  sky.position.copy(camera.position);

  // Boden: nass → Schlamm → Moos
  st.materials.asphalt.color.copy(colorAt(GROUND.asphalt, t));
  st.materials.trackBed.color.copy(colorAt(GROUND.trackBed, t));
  st.materials.paving.color.copy(colorAt(GROUND.paving, t));
  st.markMesh.material.color.copy(colorAt([[0, "#ffffff"], [7, "#ffffff"], [10, "#c8c8c8"], [75, "#c8c8c8"], [79, "#7a6a52"], [83, "#6e7448"], [87, "#56703e"]], t));

  // Häuser: Fensterlicht, Lichter gehen aus, Schmutz, Grün
  const stain = smooth(clamp((t - 68) / 8)) * 0.38, green = smooth(clamp((t - 81) / 6)) * 0.22;
  city.houses.forEach((h, i) => {
    const base = t < 11 ? 0.06 : lerp(0.4, 0.95, night);
    const on = t < houseOff[i] ? 1 : t < houseOff[i] + 0.25 ? (Math.sin(t * 70 + i) > 0 ? 0.6 : 0) : 0;
    h.mats.forEach((m, j) => {
      const shopFlood = j > 0 && m.emissiveMap && w > 3.2 ? 0 : 1;
      m.emissiveIntensity = base * on * shopFlood;
      m.color.copy(houseBase[i][j]).lerp(tmpC.set("#6e6250"), stain).lerp(tmpC.set("#58733e"), green);
    });
  });
  sl.towers.forEach((b, i) => { b.material.emissiveIntensity = t < 60 ? night * 0.6 : 0; b.material.color.copy(towerBase[i]).lerp(tmpC.set("#7a7466"), stain * 0.6); });
  sl.tv.warnLightMaterial.opacity = t < 58 ? 0.4 + 0.6 * (Math.sin(t * 6) > 0 ? 1 : 0) : 0;

  // Straßenlicht, Ampeln, Autolichter
  const power = w < 3.6 ? 1 : 0;
  const lampOn = power * Math.max(night, t > 9 && t < 46 ? 0.7 : 0);
  fur.lamps.forEach((l) => { l.glowMat.opacity = lampOn; l.bulbMat.color.set("#3a3a3a").lerp(tmpC.set("#ffd59a"), lampOn); });
  fur.setSignals(t, w < 3.0 ? 1 : 0);
  const carLight = t > 10 && t < 34 ? Math.max(0.35, night) : 0.05;
  headMat.color.set("#fff1c8").multiplyScalar(carLight); tailMat.color.set("#ff2a1a").multiplyScalar(Math.max(0.15, carLight));
  updateVehicles(t);

  // Linden: sterben im Wasser, wachsen als Wald neu
  const crownK = t < 63 ? 1 : t < 80.5 ? 0 : 1.25 * smooth((t - 80.5) / 5.5);
  tint.k = t > 80 ? 0 : 0; fur.setCrowns(crownK, tint);
  growForest(clamp((t - 80) / 7.2));
  const bk = clamp((t - 78.5) / 8);
  bushes.update((p) => { const f = smooth((bk - p.at * 0.6) / 0.4); return f > 0.001 ? { x: p.x, y: 0.15, z: p.z, ry: p.ph, s: f } : null; });

  // Menschen mit Schirmen
  for (let i = 0; i < NP; i++) {
    const s = personState(P[i], i, t);
    if (!s) { people.set(i, { visible: false }); umb.set(i, null); continue; }
    people.set(i, { x: s.x, y: s.y, z: s.z, rotY: s.rotY, swing: s.swing, armRaise: s.umb ? 0.3 : 0, visible: true });
    umb.set(i, s.umb ? { x: s.x, y: s.y, z: s.z, rotY: s.rotY, open: smooth(clamp((t - P[i].umbAt) / 0.6)) } : null);
  }
  people.commit(); umb.commit();
  updateUpstairs(t, w);

  // Wasser (Oberleitung reißt ab, sobald das Wasser hoch steht)
  st.wireMesh.visible = w < 5.2;
  const wv = w > 0.004;
  wat.mesh.visible = wv;
  if (wv) wat.update(t, Math.max(0.02, w), w < 0.5 ? 0.01 : w < 4 ? 0.06 : 0.12);
  rings.update(t, Math.max(0.02, w), wv ? valueAt(RAINK, t) * (w > 0.05 ? 1 : 0.5) : 0);
  drops.update(t, valueAt(RAINK, t), 0.14);
  drops.material.opacity = lerp(0.3, 0.18, night);

  // Treibgut auf der Oberfläche (Monate–Jahre), unter Wasser, Holz beim Abfluss
  floatDebris.update((p, i) => {
    if (t < p.at || t > 62.6 || w < 2) return null;
    const dz = (t - p.at) * (0.6 + p.sp);
    return { x: p.x + Math.sin(t * 0.3 + p.ph) * 0.6, y: w + p.sy * 0.25 + Math.sin(t * 1.6 + p.ph) * 0.05, z: p.z + dz, ry: p.ry + t * 0.05 * p.sp, rx: Math.sin(t + p.ph) * 0.05 };
  });
  deepDebris.update((p) => {
    if (t < 62.2 || t > 69) return null;
    const u = t - 62.2;
    return { x: CAM.x - 10 + p.x * 0.8 + Math.sin(u * 0.3 + p.ph) * 1.5, y: CAM_Y + p.y + Math.sin(u * 0.4 + p.ph) * 1.2 - u * 0.5, z: CAM.z - 58 + p.z + u * 0.4, rx: p.rx + u * 0.2 * p.sp, ry: p.ry + u * 0.15, rz: u * 0.1 };
  });
  planks.update((p) => {
    if (t < 68.2) return null;
    const settle = w < 0.25;
    const u = Math.min(t, 79.5) - 68.2;
    const y = settle ? 0.2 : w + 0.05 + Math.sin(t * 1.4 + p.ph) * 0.04;
    return { x: p.x + Math.sin(u * 0.2 + p.ph) * 1.5, y, z: p.z + u * 0.7 * p.sp, ry: p.ry + u * 0.04, rx: settle ? 0 : Math.sin(t + p.ph) * 0.04 };
  });
  bubbles.update((p) => {
    const y = p.y + ((t * (0.8 + p.sp) + p.ph) % 4);
    return { x: p.x + Math.sin(t + p.ph) * 0.2, y: y - 2, z: p.z };
  });
  shafts.update(t, Math.min(w, CAM_Y + 30));

  // Wasserlinie durch die Linse: oben Luft, unten Wasser (zwei Durchgänge mit Scissor)
  const tv = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
  const LENS = 1.0;
  const v = (w - CAM_Y - LENS * Math.sin(PITCH)) / (Math.cos(PITCH) * LENS * tv);
  const yLine = (1 - v) / 2 * 1920;
  camera.position.copy(CAM); camera.updateMatrixWorld();
  if (yLine > 0 && yLine < 1920) {
    const split = Math.round(yLine);
    renderer.setScissorTest(true);
    renderer.setViewport(0, 0, 1080, 1920);
    // oben: Luft
    camera.position.y = Math.max(CAM_Y, w + 0.3); camera.updateMatrixWorld();
    setMode(false, t, w);
    renderer.setScissor(0, 1920 - split, 1080, split);
    renderer.render(scene, camera);
    // unten: Wasser
    camera.position.y = Math.min(CAM_Y, w - 0.3); camera.updateMatrixWorld();
    setMode(true, t, w);
    renderer.setScissor(0, 0, 1080, 1920 - split);
    renderer.render(scene, camera);
    renderer.setScissorTest(false);
    camera.position.y = CAM_Y; camera.updateMatrixWorld();
    canvas.style.filter = "saturate(0.95) contrast(1.03)";
    line.style.top = `${(yLine - 2).toFixed(1)}px`; line.style.opacity = 1;
  } else {
    setMode(w > CAM_Y, t, w);
    renderer.render(scene, camera);
    line.style.opacity = 0;
  }
}

window.addEventListener("hf-seek", (e) => renderAt(e.detail.time));
renderAt(window.__hfThreeTime || 0);
