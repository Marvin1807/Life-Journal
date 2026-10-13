// "Was wäre, wenn niemand mehr arbeiten geht?" – 30 s, POV, neun Szenen.
import { THREE, rng, clamp, smooth, lerp, colorAt, valueAt, shake, createSky, createStars,
         windowTextures, building, fernsehturm, crowd, car, streetLamp, glowTexture } from "./lib/lowpoly.js";
import { hand, coffeeCup, phone, phoneScreen, billFan, trashBag, supermarketAisle, shoppingCart,
         trashCorner, subwayPlatform, livingRoom, kitchenSink, storefront, office, box, mat } from "./lib/props.js";
import { createOverlay, de, countdown, curve } from "./lib/ww-overlay.js";

const DURATION = 30;
const EVENT = 6;          // 8:00 Uhr – niemand geht zur Arbeit
const RETURN = 24;        // alle gehen wieder arbeiten
const BLACK = 27.0;
const END = 27.4;

// Szenen (harte Schnitte mit kurzem Aufblenden)
const CUTS = { street: 0, platform: 7, aisle: 9, trash: 12, flat: 15, sink: 18, spaeti: 21, dawn: 24, office: 25.8, black: BLACK };

// ------------------------------------------------------------------ Overlay ---
const days = (t) => curve([[EVENT, 0], [9, 0.5], [12, 2], [15, 4], [18, 6], [21, 12], [RETURN, 30]], t);
const daysHud = (sub) => ({ label: "Niemand arbeitet seit", value: (t) => `${de(days(t), 3)} Tagen`, sub, fadeIn: 0.01, fadeOut: 0.01 });
const overlay = createOverlay(document.getElementById("overlay"), {
  title: { text: "Was wäre, wenn niemand mehr arbeiten geht?", accent: "arbeiten", accentColor: "#f2b84b", start: 0, end: 3.1 },
  hud: [
    { start: 0, end: EVENT, label: "Arbeitsbeginn in", value: (t) => countdown(EVENT - t),
      sub: (t) => `Montag · 07:${String(54 + Math.floor(t)).padStart(2, "0")} Uhr · Berlin-Mitte`, fadeIn: 0.01 },
    { start: EVENT, end: 9, ...daysHud("46 Mio. Menschen bleiben zu Hause") },
    { start: 9, end: 12, ...daysHud("Lieferungen an Supermärkte: 0") },
    { start: 12, end: 15, ...daysHud((t) => `Müll auf den Straßen: ${de(Math.round(days(t) * 92) * 1000)} t`) },
    { start: 15, end: 18, ...daysHud((t) => `Stromnetz: ${de(Math.round(100 * (1 - smooth((t - 15.4) / 1.9))))} %`) },
    { start: 18, end: 21, ...daysHud((t) => `Wasserdruck: ${de(Math.max(0, 4 * (1 - (t - 18.4) / 1.4)), 1)} bar`) },
    { start: 21, end: RETURN, ...daysHud("Was du dir dafür kaufen kannst: nichts") },
    { start: RETURN, end: BLACK, label: "Zurück an die Arbeit", value: () => "JETZT", sub: "Tag 31 · 06:00 Uhr", fadeIn: 0.01, fadeOut: 0.3 },
  ],
  subtitles: [
    { start: 3.2, end: 6.0, text: "Montagmorgen. Du bist auf dem Weg zur Arbeit." },
    { start: 6.2, end: 9.0, text: "Kein Bus fährt. Keine Bahn." },
    { start: 9.15, end: 12.0, text: "Nach zwei Tagen sind die Regale leer." },
    { start: 12.15, end: 15.0, text: "Der Müll bleibt einfach liegen." },
    { start: 15.15, end: 18.0, text: "Dann fällt der Strom aus. Überall." },
    { start: 18.15, end: 21.0, text: "Ohne Strom kommt kein Wasser mehr aus dem Hahn." },
    { start: 21.15, end: 24.0, text: "Geld ist plötzlich nur noch Papier." },
    { start: 24.15, end: 25.75, text: "Dann geht jeder wieder arbeiten.", fadeOut: 0.25 },
    { start: 25.9, end: 27.0, text: "Nur ohne Chef.", fadeIn: 0.2, fadeOut: 0.3 },
  ],
  black: { start: BLACK, end: END },
  endcard: { start: END, end: DURATION, lines: ["46 Millionen Menschen arbeiten in Deutschland", "zusammen über 61 Milliarden Stunden im Jahr"] },
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
scene.fog = new THREE.Fog("#e8c9a8", 60, 620);
const camera = new THREE.PerspectiveCamera(62, 1080 / 1920, 0.05, 3000);
scene.add(camera);

const sky = createSky(); scene.add(sky);
const stars = createStars(); scene.add(stars);
const hemi = new THREE.HemisphereLight("#cfe0ff", "#5a4a3a", 1.0); scene.add(hemi);
const sun = new THREE.DirectionalLight("#ffd7a0", 2.4);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -30, right: 30, top: 30, bottom: -30, near: 1, far: 300 });
sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.04;
scene.add(sun); scene.add(sun.target);

// ============================================================== Set: Straße ===
const street = new THREE.Group(); scene.add(street);
const R = rng(2024);
const ROAD = 8, WALK = 13.5, Z0 = 40, Z1 = -420;
const flat = (c) => new THREE.MeshStandardMaterial({ color: c, roughness: 1, flatShading: true });
const plane = (w, d, m, x, y, z, parent = street) => {
  const p = new THREE.Mesh(new THREE.PlaneGeometry(w, d), m);
  p.rotation.x = -Math.PI / 2; p.position.set(x, y, z); p.receiveShadow = true; parent.add(p); return p;
};
plane(2000, 2000, flat("#3a3836"), 0, -0.02, -300);
plane(ROAD * 2, Z0 - Z1, flat("#4b4b4e"), 0, 0, (Z0 + Z1) / 2);
for (const s of [-1, 1]) {
  const curb = new THREE.Mesh(new THREE.BoxGeometry(WALK - ROAD, 0.16, Z0 - Z1), flat("#b3ada3"));
  curb.position.set(s * (ROAD + (WALK - ROAD) / 2), 0.08, (Z0 + Z1) / 2); curb.receiveShadow = true; street.add(curb);
}
const markMat = new THREE.MeshStandardMaterial({ color: "#d8d6cf", roughness: 0.8 });
for (let z = Z0; z > Z1; z -= 9) plane(0.18, 4, markMat, 0, 0.012, z);
const CROSS = [-95, -205, -315];
for (const zc of CROSS) plane(400, 14, flat("#4b4b4e"), 0, 0.005, zc);

const texAlt = [windowTextures(11, "altbau"), windowTextures(12, "altbau"), windowTextures(13, "altbau")];
const texNeu = [windowTextures(21, "plattenbau"), windowTextures(22, "plattenbau")];
const FACADES = ["#e9dcc3", "#d9b48f", "#c98f73", "#e6e1d6", "#b9c2b0", "#d7c49a", "#cfa79a", "#bdbab3", "#e3cfae"];
const houses = [];
function houseRow(xSide, depth, seed, rowIndex) {
  const r = rng(seed);
  let z = Z0;
  while (z > Z1) {
    if (CROSS.some((zc) => Math.abs(z - 7 - zc) < 9)) { z -= 2; continue; }
    const w = r.range(9, 15);
    const h = rowIndex === 0 ? r.range(15, 22) : r.range(14, 30);
    const tex = rowIndex === 0 ? r.pick(texAlt) : r.pick(r() < 0.5 ? texNeu : texAlt);
    const { mesh, material } = building({ w: depth, h, d: w, color: r.pick(FACADES), tex });
    mesh.position.set(xSide, 0, z - w / 2);
    street.add(mesh);
    if (rowIndex === 0 && r() < 0.55) {
      const aw = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.12, w * 0.6), flat(r.pick(["#7a2b2b", "#2d4b3d", "#3a3f6b", "#a36a2a"])));
      aw.position.set(xSide - Math.sign(xSide) * (depth / 2 + 0.6), 3.4, z - w / 2);
      aw.rotation.z = Math.sign(xSide) * 0.18; aw.castShadow = true; street.add(aw);
    }
    houses.push({ material, onAt: RETURN + 0.1 + r() * 1.2 });
    z -= w + (rowIndex === 0 ? 0 : r.range(0, 3));
  }
}
for (const s of [-1, 1]) {
  houseRow(s * (WALK + 7), 14, 100 + s, 0);
  houseRow(s * (WALK + 30), 16, 200 + s, 1);
  houseRow(s * (WALK + 55), 18, 300 + s, 2);
}
const tower = fernsehturm();
tower.group.position.set(-38, 0, -470);
street.add(tower.group);

const glow = glowTexture();
const lamps = [];
for (let z = 30; z > -300; z -= 24) for (const s of [-1, 1]) {
  if (s > 0 && z + 12 > -14) continue;
  const l = streetLamp(glow);
  l.group.position.set(s * (ROAD + 0.6), 0, z + (s > 0 ? 12 : 0));
  street.add(l.group); lamps.push(l);
}
// Haltestelle
{
  const glassMat = new THREE.MeshStandardMaterial({ color: "#b9d3e0", transparent: true, opacity: 0.28, roughness: 0.1 });
  const frame = flat("#3a3d42");
  box(1.6, 0.12, 4.2, frame, 9.6, 2.5, -5, street);
  box(0.06, 2.4, 4.0, glassMat, 10.35, 1.25, -5, street);
  box(0.4, 0.06, 3.0, flat("#5a4a3a"), 10.1, 0.55, -5, street);
  const sign = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.05, 16), flat("#2e8b3a"));
  sign.rotation.z = Math.PI / 2; sign.position.set(8.7, 3.0, -2.6); street.add(sign);
  box(0.06, 0.3, 0.3, flat("#f2c318"), 8.67, 3.0, -2.6, street);
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 3.0, 6), frame); pole.position.set(8.7, 1.5, -2.6); street.add(pole);
}
// Verkehr
const cars = [];
for (let i = 0; i < 14; i++) {
  const dir = i % 2 === 0 ? -1 : 1;
  const kind = i === 3 ? "bus" : "car";
  const g = car(500 + i, kind);
  g.rotation.y = dir < 0 ? 0 : Math.PI;
  street.add(g);
  cars.push({ g, dir, x: dir < 0 ? 3 : -3, z0: dir < 0 ? R.range(-10, 25) - i * 9 : R.range(-160, -40) - i * 6,
              v: R.range(8, 12) * (kind === "bus" ? 0.7 : 1), stop: EVENT + R.range(0.1, 0.8), kind });
}
function carZ(c, t) {
  const brake = 1.2;
  let s = t < c.stop ? c.v * t
    : c.v * c.stop + c.v * (Math.min(t, c.stop + brake) - c.stop) - 0.5 * (c.v / brake) * Math.min(t - c.stop, brake) ** 2;
  if (t > RETURN + 0.2) { const u = t - (RETURN + 0.2); s += 0.5 * 2.0 * u * u; }
  return c.z0 + c.dir * s;
}
// Menschen
const N = 90;
const people = crowd(N, 77);
street.add(people.group);
const P = [];
for (let i = 0; i < N; i++) {
  const hero = i < 26;
  const side = hero ? 1 : (i % 2 === 0 ? 1 : -1);
  P.push({
    side, dir: hero ? -1 : (R() < 0.62 ? -1 : 1),
    x: side * R.range(9.0, 12.4),
    z0: hero ? R.range(-40, -2) : R.range(-150, -14),
    v: R.range(1.15, 1.6), ph: R() * 6.28,
    stop: EVENT + R.range(0.05, 0.6),
    back: RETURN - 1.2 + R.range(0, 1.6),
    turn: R() < 0.6,
  });
}
const walkPos = (p, t) => {
  const b = 0.6;
  if (t < p.stop) return p.v * t;
  return p.v * p.stop + p.v * Math.min(t - p.stop, b) - 0.5 * (p.v / b) * Math.min(t - p.stop, b) ** 2;
};
function personState(p, t) {
  if (t < RETURN - 2) {
    const s = walkPos(p, Math.min(t, 8));
    const k = 1 - smooth((t - p.stop) / 0.6);
    const look = p.turn ? smooth((t - p.stop - 0.2) / 0.6) * (p.side > 0 ? -1.3 : 1.3) : 0;
    return { x: p.x, z: p.z0 + p.dir * s, rotY: (p.dir < 0 ? Math.PI : 0) + look,
             swing: Math.sin(t * p.v * 4.2 + p.ph) * 0.55 * k, visible: true };
  }
  // Morgengrauen: aus den Häusern raus und Richtung Arbeit
  const u = t - p.back;
  if (u < 0) return { visible: false };
  const out = Math.min(u, 1.6);
  const x = p.side * (WALK - 0.3 - 1.6 * out);
  const along = Math.max(0, u - 1.6) * 1.5;
  const zz = p.z0 + 4 - along;
  return { x, z: zz, rotY: u < 1.6 ? (p.side > 0 ? -Math.PI / 2 : Math.PI / 2) : Math.PI,
           swing: Math.sin(u * 6.5 + p.ph) * 0.55, visible: true };
}

// ============================================================ weitere Sets ===
const platform = subwayPlatform();
const aisle = supermarketAisle({ emptyFrom: 9.35, emptyTo: 11.5 });
const trash = trashCorner({ growFrom: 12.2, growTo: 14.6 });
const flatRoom = livingRoom();
const sink = kitchenSink();
const spaeti = storefront();
const work = office();
for (const s of [platform, aisle, trash, flatRoom, sink, spaeti, work]) { s.group.visible = false; scene.add(s.group); }
// Büro: Kollegen sitzen und tippen
const colleagues = crowd(work.seats.length, 303);
work.group.add(colleagues.group);
work.seats.forEach((s) => { box(0.5, 0.08, 0.5, mat("#202226"), s.x, 0.46, s.z + 0.1, work.group); box(0.5, 0.55, 0.08, mat("#202226"), s.x, 0.8, s.z + 0.38, work.group); });

const SETS = { street, platform: platform.group, aisle: aisle.group, trash: trash.group, flat: flatRoom.group, sink: sink.group, spaeti: spaeti.group, dawn: street, office: work.group };

// ============================================================ Hände (POV) ===
const rig = new THREE.Group(); camera.add(rig);
const rightHand = hand(1, "#2d3340"); rig.add(rightHand);
const leftHand = hand(-1, "#2d3340"); rig.add(leftHand);
const cup = coffeeCup(); rig.add(cup);
const handy = phone(); rig.add(handy);
const cart = shoppingCart(); rig.add(cart);
const bag = trashBag(0.75); rig.add(bag);
const fan = billFan(); rig.add(fan.group);
const flashlight = new THREE.SpotLight("#f4f7ff", 0, 7, 0.55, 0.6, 1.2);
flashlight.position.set(-0.06, -0.1, -0.3);
camera.add(flashlight); camera.add(flashlight.target);
flashlight.target.position.set(0.0, -0.12, -1.0);
// Hand am Wasserhahn (in der Welt, nicht an der Kamera)
const tapHand = hand(1, "#2d3340");
tapHand.position.set(0.1, 1.33, -0.32); tapHand.rotation.set(-0.5, 0.5, 1.4); tapHand.userData.curl(0.55);
sink.group.add(tapHand);

function pose(obj, p, r, show = true) {
  obj.visible = show;
  if (!show) return;
  obj.position.set(...p);
  obj.rotation.set(...r);
}
const POSES = {
  cup(t) {
    pose(rightHand, [0.12, -0.245, -0.52], [0.15, 0.25, 1.25]); rightHand.userData.curl(0.95);
    pose(cup, [0.075, -0.195, -0.55], [0.08, 0, -0.05]);
  },
  phone(t) {
    pose(leftHand, [-0.07, -0.235, -0.36], [-0.65, 0.1, -0.15]); leftHand.userData.curl(0.45);
    pose(handy, [-0.065, -0.17, -0.385], [-0.55, 0.12, 0.05]);
  },
  cart(t) {
    pose(cart, [0, -0.5, -1.25], [0.1, 0, 0]);
    pose(rightHand, [0.12, -0.28, -0.8], [0.75, 0, 0.0]); rightHand.userData.curl(1);
    pose(leftHand, [-0.12, -0.28, -0.8], [0.75, 0, 0.0]); leftHand.userData.curl(1);
  },
  bag(t) {
    pose(rightHand, [0.14, -0.2, -0.78], [0.9, 0, 0.35]); rightHand.userData.curl(1);
    const sw = Math.sin(t * 2.2) * 0.04;
    pose(bag, [0.07 + sw * 0.3, -0.33, -0.84], [0, 0, sw]);
  },
  bills(t) {
    pose(rightHand, [0.075, -0.235, -0.40], [-0.35, 0.1, 0.35]); rightHand.userData.curl(0.7);
    pose(fan.group, [0.045, -0.16, -0.43], [-0.45, 0.15, 0.1]);
    fan.bills.forEach((b, i) => {
      const u = Math.max(0, t - (22.35 + i * 0.09));
      b.position.set(u * (0.25 + i * 0.12) * (i % 2 ? 1 : -1), u * 0.55 + u * u * 0.2, -u * 1.6);
      b.rotation.set(u * (5 + i), u * (3 + i * 0.7), -0.5 + i * 0.25 + u * 4);
    });
  },
};

// ================================================================== Szenen ===
// Kamera je Szene: pos/look als Funktionen der lokalen Zeit u (0..1)
const L = (a, b, u) => [lerp(a[0], b[0], u), lerp(a[1], b[1], u), lerp(a[2], b[2], u)];
const SCENES = [
  { name: "street", start: 0, end: 7, walk: (t) => (t < EVENT ? 1 : 1 - smooth((t - EVENT) / 0.6)), hands: ["cup"],
    cam: (t) => { const s = Math.min(t, EVENT) * 1.05 + smooth((t - EVENT) / 0.6) * 0.3; return { pos: [10.1, 1.7, 15.5 - s], look: [5.5 - Math.max(0, t - EVENT) * 1.6, 1.9, -60] }; } },
  { name: "platform", start: 7, end: 9, walk: () => 0, hands: ["phone"],
    cam: (t) => { const u = smooth((t - 7.15) / 1.6); return { pos: L([1.6, 1.65, 2.2], [1.5, 1.65, 1.4], u), look: L([2.0, 2.45, -5.5], [-2.2, 0.6, -12], u) }; } },
  { name: "aisle", start: 9, end: 12, walk: () => 0.6, hands: ["cart"],
    cam: (t) => { const u = (t - 9) / 3; return { pos: [0, 1.62, 1.6 - u * 5.5], look: [Math.sin((t - 9) * 1.3) * 0.9, 1.05, -12] }; } },
  { name: "trash", start: 12, end: 15, walk: () => 0.3, hands: ["bag"],
    cam: (t) => { const u = smooth((t - 12) / 3); return { pos: L([0.7, 1.68, 4.4], [0.4, 1.64, 2.9], u), look: L([0.2, 1.0, -2.3], [0.0, 0.8, -2.3], u) }; } },
  { name: "flat", start: 15, end: 18, walk: () => 0, hands: ["phone"],
    cam: (t) => { const u = smooth((t - 15) / 3); return { pos: L([0.5, 1.62, 1.7], [0.3, 1.6, 1.0], u), look: L([0.1, 1.15, -20], [0.0, 1.25, -20], u) }; } },
  { name: "sink", start: 18, end: 21, walk: () => 0, hands: ["phone"],
    cam: (t) => { const u = smooth((t - 18) / 3); return { pos: L([0.08, 1.64, 0.55], [0.05, 1.6, 0.45], u), look: L([0, 0.98, -0.32], [0, 0.95, -0.3], u) }; } },
  { name: "spaeti", start: 21, end: 24, walk: () => 0, hands: ["bills"],
    cam: (t) => { const u = smooth((t - 21) / 3); const up = smooth((t - 22.5) / 1.2) * 0.9; return { pos: L([0.2, 1.65, 4.8], [0.1, 1.65, 4.0], u), look: [0.0, 1.35 + up, -1.3] }; } },
  { name: "dawn", start: 24, end: 25.8, walk: () => 1, hands: ["cup"],
    cam: (t) => { const s = (t - 24) * 1.2; return { pos: [10.2, 1.7, 1.5 - s], look: [6.0, 2.6, -60] }; } },
  { name: "office", start: 25.8, end: BLACK, walk: () => 0.5, hands: ["cup"],
    cam: (t) => { const u = (t - 25.8) / 1.2; return { pos: [0.7, 1.65, 0.5 - u * 3.2], look: [0.45, 1.3, -15] }; } },
];

// Licht/Himmel je Szene
const SKY_TOP = [[0, "#87a6cf"], [7, "#87a6cf"], [24, "#37477a"], [25.8, "#6f8fc0"]];
const SKY_HOR = [[0, "#f3cfa6"], [7, "#f3cfa6"], [24, "#f0a46a"], [25.8, "#ffd29a"]];
function setEnv(o) {
  sky.visible = o.sky !== false;
  if (o.sky !== false) {
    sky.material.uniforms.top.value.set(o.top); sky.material.uniforms.horizon.value.set(o.hor);
    sky.material.uniforms.bottom.value.set(o.hor).multiplyScalar(0.35);
    sky.material.uniforms.sunGlow.value = o.glow ?? 0.8;
  }
  scene.background = o.sky === false ? new THREE.Color(o.bg || "#000") : null;
  scene.fog.color.set(o.fog || o.hor || o.bg); scene.fog.near = o.near ?? 60; scene.fog.far = o.far ?? 620;
  hemi.color.set(o.hemiSky || "#ffffff"); hemi.groundColor.set(o.hemiGround || "#5a4a3a"); hemi.intensity = o.hemi;
  sun.color.set(o.sunColor || "#ffd7a0"); sun.intensity = o.sun ?? 0;
  const a = o.sunA ?? 0, el = o.sunEl ?? 0.5;
  sun.userData.dir = new THREE.Vector3(Math.sin(a), el, Math.cos(a)).normalize();
  sun.castShadow = (o.sun ?? 0) > 0.2;
  stars.material.opacity = o.stars ?? 0;
  renderer.toneMappingExposure = o.exposure ?? 1;
  flashlight.intensity = o.flash ?? 0;
}
const ENV = {
  street: (t) => ({ top: "#87a6cf", hor: "#f3cfa6", hemi: 1.25, sun: 2.8, sunColor: "#ffd29a", sunA: -0.7, sunEl: 0.35, hemiSky: "#e3ecff" }),
  platform: () => ({ sky: false, bg: "#14120e", fog: "#1d1a14", near: 12, far: 55, hemi: 1.7, hemiSky: "#fff3dc", hemiGround: "#6b5a3e", exposure: 1.05 }),
  aisle: () => ({ sky: false, bg: "#e9e6df", fog: "#efece6", near: 14, far: 60, hemi: 2.2, hemiSky: "#ffffff", hemiGround: "#bdb6a8", sun: 0.8, sunA: 0.3, sunEl: 1.5, exposure: 1.0 }),
  trash: () => ({ top: "#6f6f94", hor: "#e9a57a", hemi: 1.7, hemiSky: "#ffd9bd", sun: 1.6, sunColor: "#ffaa6e", sunA: 0.9, sunEl: 0.35, glow: 0.4, near: 30, far: 200 }),
  flat: () => ({ top: "#0f1834", hor: "#26325a", hemi: 0.45, hemiSky: "#8ea2d8", hemiGround: "#2a2420", sun: 0.35, sunColor: "#9fb4e8", sunA: 2.6, sunEl: 0.8, stars: 0.9, glow: 0, near: 80, far: 700, exposure: 1.25 }),
  sink: () => ({ sky: false, bg: "#05070a", fog: "#05070a", near: 4, far: 30, hemi: 0.4, hemiSky: "#6a7db0", hemiGround: "#111", flash: 2.2, exposure: 1.15 }),
  spaeti: () => ({ top: "#0f1834", hor: "#27325a", hemi: 1.0, hemiSky: "#8ea2d8", hemiGround: "#2a2420", sun: 0.7, sunColor: "#a9bdf0", sunA: 0.6, sunEl: 0.7, stars: 0.8, glow: 0, near: 20, far: 200, exposure: 1.3 }),
  dawn: () => ({ top: "#4a5a8a", hor: "#f2a66a", hemi: 1.1, hemiSky: "#ffd2b0", sun: 1.8, sunColor: "#ff9f62", sunA: -0.4, sunEl: 0.2, glow: 1 }),
  office: () => ({ sky: false, bg: "#f6e2bf", fog: "#f3e6cf", near: 20, far: 80, hemi: 1.9, hemiSky: "#fff4e2", hemiGround: "#8a8478", sun: 2.0, sunColor: "#ffd9a8", sunA: 1.3, sunEl: 0.45, exposure: 1.0 }),
};

// ==================================================================== Frame ===
const tmpLook = new THREE.Vector3();
function renderAt(t) {
  t = clamp(t, 0, DURATION);
  overlay.update(t);
  const sc = SCENES.find((s) => t >= s.start && t < s.end) || SCENES[SCENES.length - 1];

  for (const [name, g] of Object.entries(SETS)) g.visible = false;
  SETS[sc.name].visible = true;
  setEnv(ENV[sc.name](t));

  // Kamera + POV-Wackeln
  const { pos, look } = sc.cam(t);
  const walk = sc.walk(t);
  const bob = Math.sin(t * Math.PI * 2 * 1.85) * 0.022 * walk;
  const sway = Math.sin(t * Math.PI * 1.85) * 0.014 * walk;
  const jolt = t >= EVENT && t < 7 ? Math.exp(-(t - EVENT) * 4) : 0;
  const [sx, sy] = shake(t, 0.012 + jolt * 0.08);
  camera.position.set(pos[0] + sway + sx, pos[1] + bob + sy, pos[2]);
  camera.lookAt(tmpLook.set(look[0] + sx * 3, look[1] + sy * 3, look[2]));
  camera.updateMatrixWorld();
  sun.position.copy(camera.position).addScaledVector(sun.userData.dir, 120);
  sun.target.position.set(camera.position.x, 0, camera.position.z - 15);
  sky.position.copy(camera.position);

  // Hände
  for (const o of [rightHand, leftHand, cup, handy, cart, bag, fan.group]) o.visible = false;
  rig.position.set(0, -bob * 0.4, 0);
  for (const h of sc.hands) POSES[h](t);
  // Handy-Bildschirm je Szene
  if (sc.hands.includes("phone")) {
    const s = handy.userData.screen;
    if (sc.name === "platform") s.redraw((c, w, h) => phoneScreen(c, w, h, { time: "08:12", title: "BVG", accent: "#f2c318", lines: ["Alle Fahrten", "fallen aus."], battery: 61 }));
    else if (sc.name === "flat") s.redraw((c, w, h) => phoneScreen(c, w, h, t < 16.6
      ? { time: "21:47", title: "Eilmeldung", accent: "#ff5b4a", lines: ["Stromnetz in Berlin", "instabil."], battery: 23 }
      : { time: "21:49", title: "Kein Netz", accent: "#9aa4b2", lines: ["Nur Notrufe", "möglicherweise."], battery: 22, net: false }));
    else s.redraw((c, w, h) => phoneScreen(c, w, h, { time: "--:--", title: "Taschenlampe an", accent: "#e8edf5", lines: ["Akku 9 %"], battery: 9, net: false }));
  }
  tapHand.visible = sc.name === "sink";
  if (sc.name === "sink") tapHand.rotation.z = 1.4 - 0.5 * smooth((t - 18.25) / 0.35);

  // Set-spezifisch
  if (sc.name === "street" || sc.name === "dawn") {
    for (const c of cars) c.g.position.set(c.x, 0, carZ(c, t));
    for (let i = 0; i < N; i++) people.set(i, personState(P[i], t));
    people.commit();
    const dawn = sc.name === "dawn";
    for (const h of houses) h.material.emissiveIntensity = dawn ? smooth((t - h.onAt) / 0.3) * 1.5 : 0;
    for (const l of lamps) { l.bulbMat.opacity = dawn ? 1 : 0.25; l.glowMat.opacity = dawn ? 0.8 : 0; }
    tower.warnLightMaterial.opacity = Math.sin(t * 3.2) > 0 ? 1 : 0.25;
  }
  if (sc.name === "platform") platform.update(t);
  if (sc.name === "aisle") aisle.update(t);
  if (sc.name === "trash") trash.update(t);
  if (sc.name === "flat") flatRoom.update(t);
  if (sc.name === "sink") sink.update(t);
  if (sc.name === "office") {
    work.seats.forEach((s, i) => colleagues.set(i, { x: s.x, y: -0.4, z: s.z + 0.1, rotY: Math.PI, sit: true,
      armRaise: 1.15 + Math.sin(t * 14 + i) * 0.06, visible: true }));
    colleagues.commit();
  }

  // Schnitt: kurz aus Schwarz aufblenden, Farblook je Szene
  const fadeIn = smooth((t - sc.start) / 0.14);
  const sat = { street: 1.05, platform: 0.9, aisle: 0.95, trash: 0.95, flat: 0.9, sink: 0.85, spaeti: 0.85, dawn: 1.08, office: 1.02 }[sc.name];
  canvas.style.filter = `brightness(${sc.start === 0 ? 1 : fadeIn}) saturate(${sat}) contrast(1.05)`;
  canvas.style.opacity = t < BLACK ? 1 : 0;

  renderer.render(scene, camera);
}

window.addEventListener("hf-seek", (e) => renderAt(e.detail.time));
renderAt(window.__hfThreeTime || 0);
