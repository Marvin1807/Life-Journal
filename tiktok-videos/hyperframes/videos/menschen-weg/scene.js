// "Was wäre, wenn alle Menschen verschwinden?" – 75 s, klassisches Format ohne Twist, schnelle Fassung.
// Zwei Orte, jeder genau einmal: Domplatte vor dem Kölner Dom → Hohenzollernbrücke.
// 0–7 s Countdown · 7 s alle weg · 7–28 s Sofortfolgen Schlag auf Schlag (Taxi, Zug, Auto im Schaufenster,
// Flugzeug, Rauch, Alarm, Hund) · 28–44 s Zeitraffer Stunden → Wochen (Brände, Strom aus, Tiere, Gras) ·
// 44–62 s Brücke: Jahre → Jahrhunderte (Rost, Schlösser fallen, Birken, Wald, Dom grün, Hochwasser) ·
// 62,4 s Gehweg bricht → 65 s Rhein „HIER“. Du bist der Einzige, der bleibt – deine Hände sind immer im Bild.
import { THREE, rng, clamp, smooth, lerp, shake, createSky, crowd, car, glowTexture, streetLamp, valueAt } from "./lib/lowpoly.js";
import { hand, coffeeCup, phone, phoneScreen, mat, box } from "./lib/props.js";
import { createOverlay, de, countdown, curve } from "./lib/ww-overlay.js";
import { kolnerDom, hauptbahnhof, regioTrain, domplatte, ampel, guitar, guitarCase, quadruped, pigeonFlock,
         rhine, riverbanks, forest, hohenzollernbruecke, padlock, airliner, smokeColumn, elephant, bufferStop,
         HBF, WATER0, DECK_Y, RAIL_X, BANK_Z } from "./sets.js";

const DURATION = 75;
const EVENT = 7;           // alle Menschen verschwinden
const TAXI_HIT = 10.5;     // Taxi kracht in den Poller
const TRAIN_HIT = 13.5;    // Zug prallt auf den Prellbock
const SHOP_HIT = 16.8;     // Auto rollt ins Schaufenster
const PLANE0 = 18.8, PLANE_DOWN = 22.6;   // Flugzeug kippt ab, verschwindet hinter der Stadt
const DOG0 = 25.4;         // Hund läuft zwischen den Kleiderhaufen
const LAPSE = 28;          // Zeitraffer beginnt
const POWER_OFF = 33.6;    // Stromnetz fällt aus (Nacht 1)
const CUT = 44;            // Schnitt auf die Hohenzollernbrücke
const BREAK_T = 62.4;      // das Gehwegstück bricht ab
const HIT = 65.0;          // Aufschlag im Rhein
const BLACK = 70;
const END = 70.5;

const SCENES = [
  { name: "Domplatte vor dem Kölner Dom", set: "domplatte" },
  { name: "Hohenzollernbrücke über den Rhein", set: "bruecke" },
];

// Vergangene Zeit seit dem Verschwinden (Stunden): Sekunden → Minuten → Stunden → Tage → Wochen
const HOURS = [[EVENT, 0], [8, 0.0014], [10.5, 0.0083], [13.5, 0.025], [17, 0.067], [20, 0.17], [23, 0.33], [26, 0.75], [LAPSE, 1.5],
  [29.5, 3.5], [31, 5], [32.6, 8], [34, 10.5], [35.6, 14], [38.8, 60], [41.6, 200], [CUT, 504]];
const H = (t) => (t < EVENT ? 0 : curve(HOURS, t));
const hourOfDay = (t) => (17.667 + H(t)) % 24;
// Jahre auf der Brücke (log10): 1 → 10 → 30 → 70 → 125 → 215 → 300
const YEARS = [[CUT, 0], [47.5, 1], [50.7, 1.48], [54, 1.85], [57.2, 2.1], [60.2, 2.33], [BREAK_T, 2.477]];
const logY = (t) => curve(YEARS, t);
const Y = (t) => Math.pow(10, logY(t));

function since(t) {
  const h = H(t), s = h * 3600;
  if (s < 120) return `${de(Math.floor(s))} Sekunden`;
  if (h < 2) return `${de(Math.floor(s / 60))} Minuten`;
  if (h < 36) return `${de(h, 1)} Stunden`;
  if (h < 24 * 14) return `${de(h / 24, 1)} Tagen`;
  return `${de(h / 168, 1)} Wochen`;
}
const years = (t) => { const y = Y(t); return y < 1.5 ? "1 Jahr" : `${de(Math.round(y))} Jahren`; };

// ------------------------------------------------------------------ Overlay ---
let fallDist = 14;
const overlay = createOverlay(document.getElementById("overlay"), {
  title: { text: "Was wäre, wenn alle Menschen verschwinden?", accent: "Menschen", accentColor: "#f2c26b", start: 0, end: 3.5 },
  hud: [
    { start: 0, end: EVENT, label: "Alle Menschen verschwinden in", value: (t) => countdown(EVENT - t),
      sub: (t) => (t < 3.5 ? "Domplatte · Köln · Samstag, 17:40 Uhr" : "Menschen auf der Erde: über 8 Milliarden"), fadeIn: 0.01, fadeOut: 0.01 },
    { start: EVENT, end: LAPSE, label: "Ohne Menschen seit", value: since, sub: "Menschen auf der Erde: 1", fadeIn: 0.01, fadeOut: 0.01 },
    { start: LAPSE, end: POWER_OFF, label: "Ohne Menschen seit", value: since, sub: "Stromnetz ohne Wartung: Ausfall nach Stunden bis Tagen (Schätzung)", fadeIn: 0.01, fadeOut: 0.01 },
    { start: POWER_OFF, end: CUT, label: "Ohne Menschen seit", value: since, sub: "Stromnetz: aus · Menschen auf der Erde: 1", fadeIn: 0.01, fadeOut: 0.01 },
    { start: CUT, end: 50.8, label: "Ohne Menschen seit", value: years, sub: "Hohenzollernbrücke · kein Anstrich, keine Wartung", fadeIn: 0.15, fadeOut: 0.01 },
    { start: 50.8, end: 58.6, label: "Ohne Menschen seit", value: years, sub: "Menschen auf der Erde: 1", fadeIn: 0.01, fadeOut: 0.01 },
    { start: 58.6, end: BREAK_T, label: "Ohne Menschen seit", value: years, sub: "Schätzung: Ohne Pflege halten Stahlbrücken wenige Jahrhunderte", fadeIn: 0.01, fadeOut: 0.01 },
    { start: BREAK_T, end: HIT, label: "Bis zum Rhein", value: () => `${de(fallDist, 1)} m`, sub: "Ohne Menschen seit ca. 300 Jahren", fadeIn: 0.01, fadeOut: 0.01 },
    { start: HIT, end: 67.2, label: "Bis zum Rhein", value: () => "HIER", sub: "Ohne Menschen seit ca. 300 Jahren", fadeIn: 0.01, fadeOut: 0.2 },
    { start: 67.2, end: BLACK, label: "Kölner Dom", value: () => "157 m", sub: "Steht noch. Fertig seit 1880.", fadeIn: 0.3, fadeOut: 0.4 },
  ],
  subtitles: [
    { start: 3.7, end: 6.9, text: "Über 8 Milliarden. In 3 Sekunden: alle, außer dir." },
    { start: 7.2, end: 10.0, text: "Dann sind sie weg. Nur ihre Sachen fallen." },
    { start: 10.2, end: 13.2, text: "Ein Taxi kracht in den Poller." },
    { start: 13.4, end: 16.5, text: "Der Zug rast ohne Fahrer in den Prellbock." },
    { start: 16.7, end: 19.6, text: "Ein Auto rollt ins Schaufenster." },
    { start: 19.8, end: 23.0, text: "Am Himmel kippt ein Flugzeug ab. Ohne Piloten." },
    { start: 23.2, end: 26.4, text: "Rauch in der Ferne. Alarmanlagen heulen." },
    { start: 29.0, end: 32.4, text: "Stunden später brennen Herde, die keiner ausmacht." },
    { start: 32.6, end: 35.6, text: "Dann fällt der Strom aus. Der Dom wird dunkel." },
    { start: 35.8, end: 39.8, text: "Die Tiere übernehmen. Sogar die Elefanten aus dem Zoo." },
    { start: 40.0, end: 43.8, text: "Gras in den Fugen. Dein Akku ist leer." },
    { start: 44.4, end: 47.4, text: "Dann vergehen Jahre. Rost frisst die Brücke." },
    { start: 47.6, end: 50.6, text: "Die Liebesschlösser fallen ab." },
    { start: 50.8, end: 54.8, text: "Aus den Gleisen wachsen Birken, am Ufer ein Wald." },
    { start: 55.0, end: 58.4, text: "Und der Dom wird grün." },
    { start: 58.6, end: 62.2, text: "Jedes Hochwasser nagt an den Pfeilern." },
    { start: 62.4, end: 64.9, text: "Bis die Brücke nachgibt." },
    { start: 66.4, end: 69.6, text: "Der Dom steht noch. Er ist Warten gewohnt." },
  ],
  black: { start: BLACK, end: END },
  endcard: { start: END, end: DURATION, lines: [
    "Bauzeit des Kölner Doms: 632 Jahre (1248–1880)",
    "Schätzung: Ohne Pflege würde die Natur ihn in wenigen Jahrhunderten zurückerobern",
    "Was soll als Nächstes verschwinden? Schreib es in die Kommentare",
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
scene.fog = new THREE.Fog("#e8d2b4", 260, 1600);
const camera = new THREE.PerspectiveCamera(62, 1080 / 1920, 0.03, 4000);
scene.add(camera);
const sky = createSky(3000); scene.add(sky);
const SU = sky.material.uniforms;
const hemi = new THREE.HemisphereLight("#fff1dc", "#9a8f7c", 1.25); scene.add(hemi);
const sun = new THREE.DirectionalLight("#ffd9a8", 2.6);
sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -60, right: 60, top: 60, bottom: -60, near: 1, far: 400 });
sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.05;
scene.add(sun); scene.add(sun.target);
// Spätnachmittag: Sonne im Westen (+z), leicht südlich – hinter dir, also kein Gegenlicht auf den Dom
const SUN_A = new THREE.Vector3(0.42, 0.5, 0.76).normalize();
// Brücke (Blick nach Westen): Licht von links hinten (Südosten)
const SUN_B = new THREE.Vector3(0.62, 0.62, -0.48).normalize();

// ================================================================== Welt ===
const dom = kolnerDom(); scene.add(dom.group);
const hbf = hauptbahnhof(); scene.add(hbf.group);
const plaza = domplatte(); scene.add(plaza.group);
const river = rhine(); scene.add(river.mesh);
const banks = riverbanks(); scene.add(banks.group);
const CAMB_Z = -420;
const bridge = hohenzollernbruecke({ camZ: CAMB_Z }); scene.add(bridge.group);
const train = regioTrain(4); scene.add(train.group);
const train2 = regioTrain(4, "#b8182c"); train2.group.position.set(-120, DECK_Y - 0.25, -300); scene.add(train2.group);
const train2Red = train2.red.color.clone();

// Bäume: einige stehen schon (Rheingarten), der Rest wächst über die Jahrzehnte
const R = rng(4711);
const inBuilding = (x, z) => (x > -78 && x < -2 && z < -180 && z > -230) || (x > 18 && x < 62 && z < -192 && z > -228) || (x > -48 && x < 48 && z > -160);
const oldTrees = forest(26, 903, (r) => [r.range(-95, 150), -2, r.range(-256, -276)]); oldTrees.grow(1); scene.add(oldTrees.group);
const newTrees = forest(260, 904, (r) => {
  for (let k = 0; k < 20; k++) {
    const zone = r();
    const x = zone < 0.5 ? r.range(-100, 170) : r.range(-100, 110);
    const z = zone < 0.5 ? r.range(-252, -278) : r.range(-150, -250);
    if (!inBuilding(x, z)) return [x, zone < 0.5 ? -2 : 0, z];
  }
  return [r.range(60, 160), 0, -170];
});
scene.add(newTrees.group);

// Laternen auf der Domplatte
const glow = glowTexture();
const lamps = [[-36, 150], [-4, 150], [-36, 110], [-4, 110], [-36, 70], [-4, 70], [16, 170], [16, 120]].map(([x, z]) => {
  const l = streetLamp(glow); l.group.position.set(x, 0, z); scene.add(l.group); return l;
});
const light = ampel(); light.group.position.set(-12.5, 0, 176); scene.add(light.group);

// ================================================================= Menschen ===
const N = 230;
const people = crowd(N, 61); scene.add(people.group);
const CAM_A = new THREE.Vector3(-20, 1.65, 200);
const MUS = { x: -22.5, z: 182 };
const P = [];
for (let i = 0; i < N; i++) {
  let x = R.range(-58, 34), z = R() < 0.6 ? R.range(130, 194) : R.range(30, 130);
  const near = Math.hypot(x - CAM_A.x, z - CAM_A.z);
  if (near < 6) z -= 9;
  if (Math.hypot(x - MUS.x, z - MUS.z) < 3) x += 5;
  const k = R();
  const kind = k < 0.42 ? "walk" : k < 0.72 ? "stand" : k < 0.88 ? "photo" : "sit";
  const dir = kind === "walk" ? R.pick([Math.PI / 2, -Math.PI / 2, Math.PI, Math.PI * 0.8, -Math.PI * 0.8]) + R.range(-0.25, 0.25)
    : kind === "photo" ? Math.PI + R.range(-0.35, 0.35) : R() * 6.28;
  P.push({ x, z, kind, dir, v: R.range(0.7, 1.3), ph: R() * 6.28, bag: R() < 0.35, phone: kind === "photo" || R() < 0.25 });
}
// Gruppe direkt vor dir, die den Dom fotografiert
P[0] = { x: -18.2, z: 192.5, kind: "photo", dir: Math.PI - 0.08, v: 0, ph: 0, bag: true, phone: true };
P[1] = { x: -16.4, z: 191.2, kind: "stand", dir: Math.PI + 0.4, v: 0, ph: 1, bag: false, phone: false };
P[2] = { x: MUS.x, z: MUS.z, kind: "music", dir: 0, v: 0, ph: 0, bag: false, phone: false };
P[3] = { x: -24.6, z: 186.5, kind: "stand", dir: -0.6, v: 0, ph: 2, bag: true, phone: false };
P[4] = { x: -21.0, z: 186.0, kind: "stand", dir: 0.3, v: 0, ph: 3, bag: false, phone: true };
function personAt(p, t) {
  const tt = Math.min(t, EVENT);
  const walk = p.kind === "walk";
  let x = p.x + (walk ? Math.sin(p.dir) * p.v * tt : 0), z = p.z + (walk ? Math.cos(p.dir) * p.v * tt : 0);
  if (Math.hypot(x - CAM_A.x, z - CAM_A.z) < 4.5) x += x > CAM_A.x ? 5 : -5;
  return { x, z };
}
function personState(p, t) {
  if (t >= EVENT) return { visible: false };
  const { x, z } = personAt(p, t);
  if (p.kind === "sit") return { x, y: -0.43, z, rotY: p.dir, sit: true, visible: true };
  if (p.kind === "music") return { x, z, rotY: 0, swing: 0.04 * Math.sin(t * 2), armRaise: 0.95 + 0.25 * Math.max(0, Math.sin(t * 9.4)), visible: true };
  if (p.kind === "photo") return { x, z, rotY: p.dir, swing: 0, armRaise: 1.55 + 0.05 * Math.sin(t + p.ph), visible: true };
  return { x, z, rotY: p.dir, swing: walk(p) ? Math.sin(t * p.v * 4.2 + p.ph) * 0.55 : 0, armRaise: p.kind === "stand" ? 0.1 : 0, visible: true };
}
const walk = (p) => p.kind === "walk";

// Zurückgelassene Sachen: Kleiderhaufen, Taschen, Handys
const SHIRT_C = ["#2f3a4f", "#7a2e2e", "#d9d4c7", "#3f5e4a", "#c98b3a", "#5a5f6b", "#e4e0d6", "#8a4f6f", "#1f2a33", "#b5492f"];
const PANT_C = ["#24272d", "#3b4250", "#5b4a3a", "#2b3340", "#6b6f78"];
const shirts = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), mat("#ffffff", { roughness: 0.95 }), N);
const pants = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), mat("#ffffff", { roughness: 0.95 }), N);
const bags = new THREE.InstancedMesh(new THREE.BoxGeometry(0.34, 0.26, 0.14), mat("#ffffff", { roughness: 0.8 }), N);
const phones = new THREE.InstancedMesh(new THREE.BoxGeometry(0.075, 0.012, 0.15), new THREE.MeshStandardMaterial({ color: "#151619", emissive: new THREE.Color("#9fc4ff"), emissiveIntensity: 0.6, roughness: 0.3 }), N);
const col = new THREE.Color();
const ITEMS = P.map((p, i) => {
  shirts.setColorAt(i, col.set(R.pick(SHIRT_C))); pants.setColorAt(i, col.set(R.pick(PANT_C)));
  bags.setColorAt(i, col.set(R.pick(["#2a2a2c", "#7a4a2a", "#a8322e", "#3a4a6a", "#c9b48a"])));
  return { ry: R() * 6.28, ry2: R() * 6.28, dx: R.range(-0.25, 0.25), dz: R.range(-0.25, 0.25), d: R.range(0, 0.12) };
});
for (const m of [shirts, pants, bags, phones]) { m.castShadow = true; m.receiveShadow = true; m.frustumCulled = false; scene.add(m); }
const o = new THREE.Object3D();
const fallY = (y0, u) => Math.max(0, y0 - 4.9 * u * u);
function updateItems(t) {
  const u = t - EVENT;
  P.forEach((p, i) => {
    const it = ITEMS[i];
    const vis = t >= EVENT && p.kind !== "music";
    const { x, z } = vis ? personAt(p, EVENT) : { x: 0, z: 0 };
    const uu = Math.max(0, u - it.d);
    // Hemd: fällt von Schulterhöhe und sackt zusammen
    const ys = fallY(1.15, uu), flat = smooth(1 - ys / 1.15);
    o.position.set(x + it.dx * flat, ys + 0.04, z + it.dz * flat); o.rotation.set(flat * 0.15, it.ry, flat * 0.2);
    o.scale.set(vis ? lerp(0.46, 0.62, flat) : 0, lerp(0.62, 0.07, flat), lerp(0.26, 0.48, flat)); o.updateMatrix(); shirts.setMatrixAt(i, o.matrix);
    const yp = fallY(0.45, uu), fp = smooth(1 - yp / 0.45);
    o.position.set(x - it.dx * 0.8, yp + 0.03, z - it.dz * 0.8); o.rotation.set(0, it.ry2, 0);
    o.scale.set(vis ? lerp(0.36, 0.42, fp) : 0, lerp(0.86, 0.06, fp), lerp(0.2, 0.62, fp)); o.updateMatrix(); pants.setMatrixAt(i, o.matrix);
    const yb = fallY(0.9, uu);
    o.position.set(x + 0.32, yb + 0.13 * (yb <= 0 ? 0.55 : 1), z + 0.1); o.rotation.set(yb <= 0 ? 1.3 : 0, it.ry, 0);
    o.scale.setScalar(vis && p.bag ? 1 : 0); o.updateMatrix(); bags.setMatrixAt(i, o.matrix);
    const yh = fallY(1.35, uu);
    o.position.set(x - 0.3, yh + 0.006, z + 0.25); o.rotation.set(0, it.ry2, yh > 0 ? 0.6 : 0);
    o.scale.setScalar(vis && p.phone ? 1.2 : 0); o.updateMatrix(); phones.setMatrixAt(i, o.matrix);
  });
  for (const m of [shirts, pants, bags, phones]) m.instanceMatrix.needsUpdate = true;
  phones.material.emissiveIntensity = t < 30 ? 0.6 : Math.max(0, 0.6 - (t - 30) * 0.08);
}

// Straßenmusiker: Gitarre + Koffer
const gtr = guitar(); scene.add(gtr);
const gcase = guitarCase(); gcase.position.set(MUS.x + 0.2, 0, MUS.z + 1.1); gcase.rotation.y = 0.1; scene.add(gcase);

// Tauben: wenige am Anfang, viele nach Tagen
const fewPigeons = pigeonFlock(36, 31, [-34, -8, 172, 194]); scene.add(fewPigeons.group);
const manyPigeons = pigeonFlock(260, 32, [-46, 12, 150, 195]); scene.add(manyPigeons.group);
const fox = quadruped("fox"); fox.group.scale.setScalar(1.25); scene.add(fox.group);
const fox2 = quadruped("fox"); fox2.group.scale.setScalar(1.25); scene.add(fox2.group);
const dog = quadruped("dog"); scene.add(dog.group);
const ele = elephant(1); scene.add(ele.group);
const calf = elephant(0.6); scene.add(calf.group);

// Gras in den Fugen (Platten 2,5 m)
const GRASS = 900;
const grass = new THREE.InstancedMesh(new THREE.ConeGeometry(0.06, 0.22, 4), mat("#5f8f3a"), GRASS);
const GR = [];
for (let i = 0; i < GRASS; i++) {
  const alongX = R() < 0.5;
  const lx = Math.round(R.range(-50, 10) / 2.5) * 2.5, lz = Math.round(R.range(120, 197) / 2.5) * 2.5;
  GR.push({ x: alongX ? R.range(-50, 10) : lx + R.range(-0.04, 0.04), z: alongX ? lz + R.range(-0.04, 0.04) : R.range(120, 197), s: R.range(0.6, 1.6), at: R() });
}
grass.frustumCulled = false; scene.add(grass);
function updateGrass(k) {
  GR.forEach((g, i) => {
    const f = smooth((k - g.at * 0.7) / 0.3);
    o.position.set(g.x, 0.11 * g.s * f, g.z); o.rotation.set(0, i, 0); o.scale.set(g.s * f + 0.001, g.s * f + 0.001, g.s * f + 0.001); o.updateMatrix(); grass.setMatrixAt(i, o.matrix);
  });
  grass.instanceMatrix.needsUpdate = true;
  grass.visible = k > 0.001;
}

// Autos auf der Trankgasse
const taxi = car(5); taxi.children[0].material.color.set("#efe3bf");
const sign = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.18, 0.25), new THREE.MeshStandardMaterial({ color: "#ffd84a", emissive: new THREE.Color("#ffcc33"), emissiveIntensity: 0.4 }));
sign.position.set(0, 1.78, -0.2); taxi.add(sign); scene.add(taxi);
const car2 = car(9); scene.add(car2);
const car3 = car(14); scene.add(car3);
// Warnblinker (Alarmanlagen)
const blinkMat = new THREE.MeshBasicMaterial({ color: "#ffa21a", toneMapped: false });
for (const c of [taxi, car3]) for (const [x, z] of [[-0.8, 2.16], [0.8, 2.16], [-0.8, -2.16], [0.8, -2.16]]) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.14, 0.04), blinkMat); b.position.set(x, 0.85, z); c.add(b); }
function taxiState(t) {
  const T = TAXI_HIT - EVENT, Z0 = 160 - (9 * T - 0.3 * T * T);
  if (t < EVENT) return { x: -68, z: Z0 - 9 * (EVENT - t), ry: 0, pitch: 0 };
  const u = Math.min(t - EVENT, T), du = t - EVENT;
  const x = -68 + 6.45 * smooth(u / T), z = Z0 + 9 * u - 0.3 * u * u;
  const vx = 6.45 * 6 * (u / T) * (1 - u / T) / T, vz = 9 - 0.6 * u;
  const bump = du > T ? Math.exp(-(du - T) * 3) * Math.sin((du - T) * 18) * 0.07 : 0;
  return { x, z, ry: Math.atan2(vx, vz), pitch: bump };
}
function carZ(z0, v, t, dir) {   // fährt bis zum Ereignis, rollt dann in 5 s aus
  if (t < EVENT) return z0 + dir * v * t;
  const u = Math.min(t - EVENT, v / 1.6);
  return z0 + dir * (v * EVENT + v * u - 0.8 * u * u);
}
// Auto 3 rollt quer über den Vorplatz ins Schaufenster am Bahnhof
const C3A = new THREE.Vector2(-74, 152), C3B = new THREE.Vector2(-104, 99.7);
function car3State(t) {
  const v = 5.6;
  if (t < EVENT) return { x: C3A.x, z: C3A.y + v * (EVENT - t), ry: Math.PI };
  const f = clamp((t - EVENT) / (SHOP_HIT - EVENT));
  const e = smooth(clamp(f * 1.4));   // biegt ab, dann gerade
  const x = lerp(C3A.x, C3B.x, f), z = lerp(C3A.y, C3B.y, f);
  const ry = Math.atan2(C3B.x - C3A.x, C3B.y - C3A.y);
  const bump = t > SHOP_HIT ? Math.exp(-(t - SHOP_HIT) * 3) * Math.sin((t - SHOP_HIT) * 16) * 0.06 : 0;
  return { x: lerp(C3A.x, x, 1), z, ry: lerp(Math.PI, ry, e), pitch: bump };
}
// Schaufenster + Scherben
const shop = box(8, 3.2, 0.12, new THREE.MeshStandardMaterial({ color: "#9ec3d6", roughness: 0.1, metalness: 0.4, transparent: true, opacity: 0.6 }), -104, 1.7, 97.9);
scene.add(shop);
box(8.4, 0.5, 0.3, mat("#3a3f45"), -104, 3.5, 97.9, scene);
const shopSign = new THREE.Mesh(new THREE.PlaneGeometry(6, 0.9), new THREE.MeshBasicMaterial({ color: "#c8302a" })); shopSign.position.set(-104, 4.2, 98.1); scene.add(shopSign);
const SH = 70;
const shards = new THREE.InstancedMesh(new THREE.TetrahedronGeometry(0.18, 0), new THREE.MeshStandardMaterial({ color: "#cfe6f0", roughness: 0.1, metalness: 0.5 }), SH);
const SHD = []; for (let i = 0; i < SH; i++) SHD.push({ x: R.range(-3.8, 3.8), y: R.range(0.3, 3.2), vx: R.range(-2, 2), vy: R.range(0, 3), vz: R.range(0.5, 4), r: R() * 6 });
shards.frustumCulled = false; scene.add(shards);
// Zug: Außengleis, rollt ohne Fahrer in den Prellbock
const BUFFER_Z = 90;
const buf = bufferStop(); buf.position.set(-89, 0.25, BUFFER_Z + 1.2); scene.add(buf);
function trainZ(t) {
  const v = 9;
  const front = BUFFER_Z - 0.2;
  const z = front - v * (TRAIN_HIT - t);
  if (t < TRAIN_HIT) return z;
  const u = t - TRAIN_HIT;
  return front - 0.9 * Math.exp(-u * 4) * Math.sin(u * 9) * 0.5;
}
// Flugzeug und Rauchsäulen
const plane = airliner(); plane.scale.setScalar(2.6); scene.add(plane);
const SMOKE = [
  { c: smokeColumn(11, 380, 44, true), x: 480, z: -1100, t0: PLANE_DOWN + 0.3, grow: 3 },   // Absturzstelle
  { c: smokeColumn(12, 180, 18), x: -160, z: -620, t0: 29.0, grow: 2.5 },
  { c: smokeColumn(13, 140, 14), x: 140, z: -480, t0: 29.6, grow: 2.5 },
  { c: smokeColumn(14, 160, 16), x: -230, z: -380, t0: 30.4, grow: 2.5 },
  { c: smokeColumn(15, 120, 12), x: 220, z: -260, t0: 31.0, grow: 2.5 },
];
for (const sm of SMOKE) { sm.c.group.position.set(sm.x, 0, sm.z); scene.add(sm.c.group); }
function planeAt(t) {
  const s = clamp((t - PLANE0) / (PLANE_DOWN - PLANE0));
  const dive = smooth(clamp((t - 20.2) / (PLANE_DOWN - 20.2)));
  const x = lerp(-420, 480, s), y = 1250 - 1250 * dive * dive;
  return { x, y, z: -1100, pitch: -0.75 * dive, roll: 0.25 + 0.9 * dive, vis: t > PLANE0 - 0.5 && t < PLANE_DOWN + 0.2 };
}

// ============================================================ Hände (POV) ===
const rig = new THREE.Group(); camera.add(rig);
const rightHand = hand(1, "#4c5a6e"); rig.add(rightHand);
const leftHand = hand(-1, "#4c5a6e"); rig.add(leftHand);
const cup = coffeeCup(); rig.add(cup);
const handy = phone(); rig.add(handy);
const lock = padlock("#9a5a2a"); rig.add(lock.group);
let lastPhone = "";
const DAYS = ["Samstag", "Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag"];
function drawPhone(t) {
  const h = H(t), hod = (17.667 + h);
  const day = DAYS[Math.floor(hod / 24)] || "";
  const hh = Math.floor(hod % 24), mm = Math.floor(((hod % 24) - hh) * 60);
  const clock = `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
  const battery = Math.max(0, Math.round(64 - h * 0.43));
  const net = t < POWER_OFF;
  const key = `${clock}|${battery}|${net}|${day}|${t < EVENT}`;
  if (key === lastPhone) return;
  lastPhone = key;
  handy.userData.screen.redraw((c, w, hgt) => {
    if (battery <= 0) { c.fillStyle = "#050505"; c.fillRect(0, 0, w, hgt); return; }
    phoneScreen(c, w, hgt, { time: clock, title: clock, accent: "#ffffff", bg: "#101826", battery, net,
      lines: [day, "", t < EVENT ? "Mama: Kommst du zum Essen?" : "Keine neuen Nachrichten", t < EVENT ? "Gleis 4: RE 5 pünktlich" : ""] });
    c.font = "600 74px Inter, Arial"; c.fillStyle = "#ffffff"; c.textAlign = "center";
  });
}

// ===================================================================== Licht ===
const DAYSKY = { top: new THREE.Color("#5a8fd2"), hor: new THREE.Color("#f1cfa4"), bot: new THREE.Color("#8a8070") };
const NIGHTSKY = { top: new THREE.Color("#0c1630"), hor: new THREE.Color("#2a3a5e"), bot: new THREE.Color("#1a1f2a") };
const BSKY = { top: new THREE.Color("#5b93d8"), hor: new THREE.Color("#dfe8ec"), bot: new THREE.Color("#7d8a8c") };
const dayF = (h) => smooth((h - 4.9) / 1.3) * (1 - smooth((h - 20.9) / 1.3));
function power(t) {
  if (t < POWER_OFF - 0.35) return 1;
  if (t > POWER_OFF + 0.1) return 0;
  const f = Math.sin(t * 90) * Math.sin(t * 37);
  return f > 0.1 ? 1 : 0.15;
}
const houseMats = [...plaza.houses, ...banks.houses].map((b) => b.material);

// ==================================================================== Frame ===
const tmp = new THREE.Vector3(), eu = new THREE.Euler(0, 0, 0, "YXZ"), q = new THREE.Quaternion();
const gauss = (t, c, w) => Math.exp(-(((t - c) / w) ** 2));
// Teure Updates nur, wenn sich der Wert ändert
const memo = (fn) => { let last = NaN; return (k) => { const r = Math.round(k * 400) / 400; if (r !== last) { last = r; fn(r); } }; };
const domGrow = memo(dom.grow), treesGrow = memo(newTrees.grow), bAge = memo(bridge.age), bOver = memo(bridge.overgrow),
      bLocks = memo(bridge.rustLocks), birchGrow = memo(bridge.birch.grow), bDrop = memo(bridge.dropLocks);

function lightPlaza(t) {
  const hod = hourOfDay(t), blur = smooth(clamp((t - 36.6) / 1.6));
  const d = lerp(dayF(hod), 0.82 + 0.06 * Math.sin(t * 5), blur);   // sehr schneller Zeitraffer: Tag/Nacht verwischen
  const gold = 1 - smooth((Math.abs(hod - 19.5)) / 3.5);
  SU.top.value.copy(NIGHTSKY.top).lerp(DAYSKY.top, d);
  SU.horizon.value.copy(NIGHTSKY.hor).lerp(DAYSKY.hor.clone().lerp(new THREE.Color("#dbe7f0"), 1 - gold), d);
  SU.bottom.value.copy(NIGHTSKY.bot).lerp(DAYSKY.bot, d);
  SU.sunDir.value.copy(SUN_A); SU.sunGlow.value = 0.5 * d;
  scene.fog.color.copy(SU.horizon.value);
  scene.fog.near = 260; scene.fog.far = lerp(1100, 1700, d);
  sun.color.set("#9db4ff").lerp(new THREE.Color("#ffd2a0").lerp(new THREE.Color("#fff3e2"), 1 - gold), d);
  sun.intensity = lerp(0.75, 2.6, d);
  hemi.color.set("#8ea6dc").lerp(new THREE.Color("#fff1dc"), d);
  hemi.groundColor.set("#3a3f4f").lerp(new THREE.Color("#9a8f7c"), d);
  hemi.intensity = lerp(0.85, 1.25, d);
  renderer.toneMappingExposure = lerp(1.45, 1.02, d);
  const lit = power(t) * (1 - d);
  dom.light(lit);
  hbf.glass.emissiveIntensity = lit * 0.5; hbf.glassFront.material.emissiveIntensity = lit * 0.9;
  houseMats.forEach((m) => { m.emissiveIntensity = lit * 1.1; });
  lamps.forEach((l) => { l.glowMat.opacity = lit; l.bulbMat.color.set("#3a3a3a").lerp(new THREE.Color("#ffd59a"), lit); });
  return d;
}

// Blickrichtung auf der Domplatte: Dom → Bahnhof (Taxi, Zug, Schaufenster) → Himmel (Flugzeug) → Dom
const YAWK = [[0, -0.1], [9.5, -0.1], [10.3, 0.72], [17.6, 0.72], [19.0, -0.08], [21.0, -0.16], [22.6, -0.26], [24.6, -0.1], [CUT, -0.1]];
const PITK = [[0, 0.115], [9.5, 0.115], [10.3, 0.12], [17.6, 0.12], [19.0, 0.52], [21.4, 0.45], [23.0, 0.2], [24.4, 0.115], [CUT, 0.115]];
function renderPlaza(t) {
  const yaw = valueAt(YAWK, t) + 0.02 * Math.sin(t * 0.21);
  const pitch = valueAt(PITK, t) - 0.008 * Math.sin(t * 0.17);
  const breath = Math.sin(t * Math.PI * 2 * 0.24) * 0.006;
  const jolt = (t >= EVENT && t < EVENT + 1.5 ? Math.exp(-(t - EVENT) * 3.5) * 0.12 : 0)
    + 0.03 * Math.exp(-Math.abs(t - TAXI_HIT) * 6) * (t > TAXI_HIT ? 1 : 0) + 0.03 * Math.exp(-Math.abs(t - TRAIN_HIT) * 6) * (t > TRAIN_HIT ? 1 : 0);
  const [sx, sy] = shake(t * 1.2, 0.006 + jolt);
  camera.position.set(CAM_A.x, CAM_A.y + breath, CAM_A.z);
  eu.set(pitch + sy, yaw + sx, 0.004 * Math.sin(t * 0.5)); camera.quaternion.setFromEuler(eu);
  camera.updateMatrixWorld();
  sun.position.copy(CAM_A).addScaledVector(SUN_A, 200); sun.target.position.set(-25, 0, 150);
  sun.shadow.camera.left = -70; sun.shadow.camera.right = 70; sun.shadow.camera.top = 70; sun.shadow.camera.bottom = -70; sun.shadow.camera.updateProjectionMatrix();
  sky.position.copy(camera.position);
  const d = lightPlaza(t);

  // --- Menschen + Sachen
  for (let i = 0; i < N; i++) people.set(i, personState(P[i], t));
  people.commit();
  updateItems(t);
  // Gitarre: vor dem Bauch, fällt beim Ereignis
  const gu = t - EVENT;
  if (gu < 0) {
    gtr.position.set(MUS.x - 0.05, 1.12, MUS.z + 0.28); gtr.rotation.set(0, 0, 0.42);
  } else {
    const y = Math.max(0.06, 1.12 - 4.9 * gu * gu), k = smooth(clamp(gu / 0.5));
    const bounce = gu > 0.48 ? Math.exp(-(gu - 0.48) * 7) * Math.abs(Math.sin((gu - 0.48) * 14)) * 0.08 : 0;
    gtr.position.set(MUS.x - 0.05 + k * 0.1, y + bounce, MUS.z + 0.28 + k * 0.35); gtr.rotation.set(-Math.PI / 2 * k, 0, lerp(0.42, 0.15, k));
  }
  // Tauben
  fewPigeons.update(t, () => ({ visible: true }));
  manyPigeons.update(t, (p) => ({ visible: t > 34.5 && smooth(clamp((t - 34.5) / 4.5)) > p.at }));
  // Hund (verwirrt zwischen den Kleiderhaufen), später Füchse und Elefanten
  const du = t - DOG0;
  dog.group.visible = du > 0 && t < 31;
  const dk = clamp(du / 3.4);
  const dx = lerp(-29, -17.5, dk), dz = 189 + Math.sin(dk * 7) * 1.6;
  dog.group.position.set(dx, 0, dz); dog.group.rotation.y = Math.atan2(11.5 / 3.4, Math.cos(dk * 7) * 1.6 * 7 / 3.4);
  dog.update(dk < 1 ? t * 14 : 0, dk >= 1 ? 0.6 + 0.3 * Math.sin(t * 6) : 0.2 * Math.sin(t * 5));
  const fu = t - 35.9;
  fox.group.visible = fu > 0;
  fox.group.position.set(-31 + fu * 2.0, 0, 184 + fu * 0.5); fox.group.rotation.y = Math.atan2(2.0, 0.5); fox.update(t * 11);
  const f2 = t - 36.8;
  fox2.group.visible = f2 > 0;
  fox2.group.position.set(-9 - f2 * 1.8, 0, 181 + f2 * 0.4); fox2.group.rotation.y = Math.atan2(-1.8, 0.4); fox2.update(t * 10 + 1);
  const eu2 = t - 36.2;
  ele.group.visible = calf.group.visible = eu2 > 0;
  ele.group.position.set(-27 + eu2 * 1.8, 0, 170 + eu2 * 0.2); ele.group.rotation.y = Math.atan2(1.8, 0.2); ele.update(t * 4.5);
  calf.group.position.set(-31 + eu2 * 1.8, 0, 172.5 + eu2 * 0.2); calf.group.rotation.y = Math.atan2(1.8, 0.2); calf.update(t * 5.5 + 1);
  updateGrass(clamp((t - 39.5) / 4.0));

  // Autos, Zug, Schaufenster
  const ts = taxiState(t);
  taxi.position.set(ts.x, 0, ts.z); taxi.rotation.set(ts.pitch, ts.ry, 0);
  sign.material.emissiveIntensity = power(t) * 0.5;
  car2.position.set(-80, 0, carZ(250, 6.5, t, -1)); car2.rotation.y = Math.PI;
  const c3 = car3State(t);
  car3.position.set(c3.x, 0, c3.z); car3.rotation.set(c3.pitch || 0, c3.ry, 0);
  const broken = t >= SHOP_HIT;
  shop.visible = !broken;
  SHD.forEach((p, i) => {
    const u = t - SHOP_HIT;
    const vis = broken && t < LAPSE + 2;
    const uu = Math.min(Math.max(u, 0), 1.2);
    const y = Math.max(0.03, p.y + p.vy * uu - 4.9 * uu * uu);
    o.position.set(-104 + p.x + p.vx * uu, y, 97.9 + p.vz * uu); o.rotation.set(p.r + uu * 4, p.r, 0); o.scale.setScalar(vis ? 1 : 0); o.updateMatrix(); shards.setMatrixAt(i, o.matrix);
  });
  shards.instanceMatrix.needsUpdate = true;
  blinkMat.color.set(t > TAXI_HIT && power(t) > 0.5 && Math.sin(t * Math.PI * 2 * 1.4) > 0 ? "#ffa21a" : "#3a2a10");
  train.group.position.set(-89, 0.3, trainZ(t));
  train.win.emissiveIntensity = 0.15 + power(t) * (1 - d) * 0.6;
  // Flugzeug
  const pa = planeAt(t);
  plane.visible = pa.vis;
  plane.position.set(pa.x, pa.y, pa.z); plane.rotation.set(pa.roll, 0, pa.pitch);
  // Rauchsäulen (nachts mit Feuerschein)
  for (const sm of SMOKE) sm.c.update(t, smooth(clamp((t - sm.t0) / sm.grow)) * (1 - 0.5 * smooth(clamp((t - 40) / 4))), 1 - d);

  // Ampel: normal, im Zeitraffer blinkt sie, dann aus
  const cyc = t < LAPSE ? t / 24 : LAPSE / 24 + (t - LAPSE) * 1.35;
  const ph = ((cyc % 1) + 1) % 1;
  light.set(power(t) < 0.5 ? -1 : ph < 0.45 ? 0 : ph < 0.52 ? 1 : ph < 0.93 ? 2 : 1);

  // --- Hände: rechts Kaffee, links Handy
  rightHand.visible = cup.visible = leftHand.visible = handy.visible = true; lock.group.visible = false;
  rightHand.position.set(0.14, -0.285, -0.6); rightHand.rotation.set(0.15, 0.25, 1.25); rightHand.userData.curl(0.95);
  cup.position.set(0.095, -0.235, -0.63); cup.scale.setScalar(0.9); cup.rotation.set(0.08, 0, -0.05);
  leftHand.position.set(-0.105, -0.285, -0.47); leftHand.rotation.set(-0.12, 0.1, -0.15); leftHand.userData.curl(0.45);
  handy.position.set(-0.098, -0.218, -0.495); handy.rotation.set(-0.55, 0.14, 0.05);
  rig.position.set(0, -breath * 0.5 - jolt * 0.05, 0);
  drawPhone(t);

  plazaVisible(true);
  people.group.visible = t < EVENT;   // nach dem Ereignis ganz ausblenden (robust gegen Seek)
  canvas.style.filter = `saturate(${lerp(0.85, 1.08, d)}) contrast(1.03)`;
  renderer.render(scene, camera);
}

function plazaVisible(v) {
  people.group.visible = v;
  for (const m of [shirts, pants, bags, phones]) m.visible = v;
  gtr.visible = gcase.visible = v;
  fewPigeons.group.visible = manyPigeons.group.visible = v;
  taxi.visible = car2.visible = car3.visible = v;
  shards.visible = v; plane.visible = plane.visible && v;
  if (!v) {
    fox.group.visible = fox2.group.visible = dog.group.visible = ele.group.visible = calf.group.visible = false;
    grass.visible = false;
    for (const sm of SMOKE) sm.c.group.visible = false;
  }
}

// ------------------------------------------------------------------ Brücke ---
const CAM_L = new THREE.Vector3(-110.35 + 113, 1.65, -14);       // Kamera auf der Gehwegplatte
const HAND_L = new THREE.Vector3(RAIL_X + 113, bridge.RAIL_TOP + 0.04, -13.02);
const HAND_R = new THREE.Vector3(RAIL_X + 113, bridge.RAIL_TOP + 0.04, -12.78);
const SPLASH = 160;
const splash = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.25, 0), new THREE.MeshStandardMaterial({ color: "#eef6f8", roughness: 0.4, transparent: true, opacity: 0.85 }), SPLASH);
const SPD = []; for (let i = 0; i < SPLASH; i++) { const a = R() * 6.28; SPD.push({ vx: Math.cos(a) * R.range(0.5, 4), vz: Math.sin(a) * R.range(0.5, 4), vy: R.range(3, 9), s: R.range(0.5, 1.6) }); }
splash.frustumCulled = false; scene.add(splash);
const bubbles = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.02, 0), new THREE.MeshBasicMaterial({ color: "#d9f0f5", transparent: true, opacity: 0.7 }), 80);
const BUB = []; for (let i = 0; i < 80; i++) BUB.push({ x: R.range(-0.5, 0.5), z: R.range(-1.2, -0.3), sp: R.range(0.4, 1.1), ph: R() });
bubbles.frustumCulled = false; rig.add(bubbles);

function waterLevel(t) {
  const base = smooth(clamp((t - 58.6) / 1.4)) * 3.4;
  const pulses = 1.3 * (gauss(t, 59.4, 0.4) + gauss(t, 60.6, 0.4) + gauss(t, 61.7, 0.45));
  return WATER0 + base + pulses + (t > 61.9 ? 0.8 * smooth(clamp((t - 61.9) / 1)) : 0);
}
const slabAngle = (t) => (t < BREAK_T ? 0 : 1.24 * Math.pow(clamp((t - BREAK_T) / (HIT - BREAK_T)), 1.6));

function renderBridge(t) {
  plazaVisible(false);
  const yv = Y(t), ly = Math.log10(Math.max(1, yv));
  // --- Verfall
  bAge(clamp(ly / 1.5));
  bOver(clamp(ly / 1.3));
  bLocks(clamp((ly - 0.3) / 1.0));
  bDrop(clamp((ly - 0.95) / 0.6));
  birchGrow(clamp((ly - 1.2) / 0.55));
  treesGrow(clamp((ly - 1.45) / 0.5));
  domGrow(clamp((ly - 1.95) / 0.35));
  dom.light(0);
  train2.red.color.copy(train2Red).lerp(new THREE.Color("#6e3a22"), clamp(ly / 1.6));
  houseMats.forEach((m) => { m.emissiveIntensity = 0; });
  hbf.glass.emissiveIntensity = 0; hbf.glassFront.material.emissiveIntensity = 0;
  lamps.forEach((l) => { l.glowMat.opacity = 0; });
  const level = waterLevel(t);
  river.update(t, level);

  // --- Gehwegplatte bricht ab
  const ang = slabAngle(t);
  bridge.slab.rotation.x = -ang;
  bridge.slab.updateMatrixWorld();

  // --- Kamera
  const look = smooth(clamp((t - 59.0) / 2.4));
  let yaw = lerp(0.2 + 0.02 * Math.sin(t * 0.23), 0.52, look) + 0.03 * smooth(clamp((t - 55) / 3)) * (1 - look);
  let pitch = lerp(0.075 + 0.01 * Math.sin(t * 0.19), -0.3, look);
  const quake = t > 60.5 && t < HIT ? 0.004 + 0.02 * smooth(clamp((t - 60.5) / 1.7)) + 0.03 * gauss(t, BREAK_T, 0.25) : 0.004;
  const [sx, sy] = shake(t * 1.6, quake);
  const under = t >= HIT && t < 66.25;
  const surfaced = t >= 66.25;
  if (t < HIT) {
    tmp.copy(CAM_L); bridge.slab.localToWorld(tmp);
    camera.position.copy(tmp);
    eu.set(pitch + sy - ang * 0.25, Math.PI + yaw + sx, 0.03 * Math.sin(t * 2.1) * (t > BREAK_T ? 1 : 0));
    q.setFromEuler(eu);
    camera.quaternion.copy(bridge.slab.getWorldQuaternion(new THREE.Quaternion())).multiply(q);
    fallDist = Math.max(0, camera.position.y - level - 0.05);
  } else {
    const rise = smooth(clamp((t - 65.6) / 0.9));
    const bob = surfaced ? Math.sin(t * 1.7) * 0.06 : 0;
    camera.position.set(lerp(-100, -80, rise), lerp(level - 1.6, level + 0.42, rise) + bob, CAMB_Z - 18);
    const yawE = lerp(0.35, 0.1, rise) + 0.02 * Math.sin(t * 0.6), pitchE = lerp(0.5, 0.11, rise);
    eu.set(pitchE + sy * 0.5, Math.PI + yawE, 0.04 * Math.sin(t * 1.3) * rise); camera.quaternion.setFromEuler(eu);
    fallDist = 0;
  }
  camera.updateMatrixWorld();
  sun.position.copy(camera.position).addScaledVector(SUN_B, 200); sun.target.position.set(-112, DECK_Y, CAMB_Z + 20);
  sky.position.copy(camera.position);
  SU.top.value.copy(BSKY.top); SU.horizon.value.copy(BSKY.hor); SU.bottom.value.copy(BSKY.bot);
  SU.sunDir.value.copy(SUN_B); SU.sunGlow.value = 0.3;
  sun.color.set("#fff0da"); sun.intensity = 2.5;
  hemi.color.set("#eef4ff"); hemi.groundColor.set("#8a8676"); hemi.intensity = 1.25;
  renderer.toneMappingExposure = 1.04;
  if (under) {
    scene.fog.color.set("#2c5c6a"); scene.fog.near = 0.1; scene.fog.far = 9;
    scene.background = new THREE.Color("#2c5c6a"); sky.visible = false;
  } else {
    scene.fog.color.copy(BSKY.hor); scene.fog.near = 320; scene.fog.far = 2000;
    scene.background = null; sky.visible = true;
  }

  // --- Spritzer beim Aufschlag
  SPD.forEach((p, i) => {
    const u = (t - HIT + 0.05) * 1.2;
    const vis = u > 0 && u < 1.8 && !under;
    o.position.set(camera.position.x + p.vx * u, level + p.vy * u - 4.9 * u * u, camera.position.z + p.vz * u + 1.5);
    o.rotation.set(u * 3, i, 0); o.scale.setScalar(vis ? p.s : 0); o.updateMatrix(); splash.setMatrixAt(i, o.matrix);
  });
  splash.instanceMatrix.needsUpdate = true;
  bubbles.visible = under;
  BUB.forEach((b, i) => {
    const y = -0.4 + (((t - HIT) * b.sp + b.ph) % 1) * 0.9;
    o.position.set(b.x, y, b.z); o.rotation.set(0, 0, 0); o.scale.setScalar(1); o.updateMatrix(); bubbles.setMatrixAt(i, o.matrix);
  });
  bubbles.instanceMatrix.needsUpdate = true;

  // --- Hände
  cup.visible = handy.visible = false;
  rightHand.visible = leftHand.visible = true;
  rig.position.set(0, 0, 0);
  if (t < HIT) {
    lock.group.visible = false;
    const grip = 0.95 + 0.05 * smooth(clamp((t - 60.5) / 1.5));
    // Ab 57,6 s gleiten die Hände vom Geländer in eine feste Pose am unteren Bildrand,
    // sonst ragt beim Blick nach unten der Ärmel ins Bild.
    const k = smooth(clamp((t - 57.6) / 1.5));
    [[leftHand, HAND_L, -0.05, -1], [rightHand, HAND_R, -0.3, 1]].forEach(([hd, pL, ry, side]) => {
      tmp.copy(pL); bridge.slab.localToWorld(tmp);
      camera.worldToLocal(tmp);
      tmp.add(new THREE.Vector3(0, 0.0, 0.05));
      hd.position.set(lerp(tmp.x, side * 0.15, k), lerp(tmp.y, -0.28, k), lerp(tmp.z, -0.5, k));
      hd.rotation.set(lerp(1.15, 0.2, k), lerp(ry, side * 0.25, k), lerp(0, side * 1.1, k));
      hd.userData.curl(lerp(grip, 0.9, k));
    });
  } else {
    // im Wasser: rechte Hand hält ein verrostetes Liebesschloss
    leftHand.visible = false;
    lock.group.visible = true;
    const bobH = Math.sin(t * 1.7 + 0.6) * 0.012;
    rightHand.position.set(0.1, -0.27 + bobH, -0.5); rightHand.rotation.set(0.35, 0.25, 1.2); rightHand.userData.curl(0.7);
    lock.group.position.set(0.062, -0.215 + bobH, -0.54); lock.group.rotation.set(0.2, 0.3, -0.25);
  }

  // Schnitt: kurze Aufblende aus Schwarz
  canvas.style.opacity = t < CUT + 0.14 ? smooth((t - CUT) / 0.14) : t < BLACK ? 1 : 0;
  const flash = t >= HIT ? Math.exp(-(t - HIT) * 4) : 0;
  canvas.style.filter = under ? "saturate(1.2) contrast(1.05) brightness(0.85)" : `saturate(${lerp(1.05, 0.95, look)}) contrast(1.04) brightness(${1 + flash * 0.5})`;
  renderer.render(scene, camera);
}

function renderAt(t) {
  t = clamp(t, 0, DURATION);
  overlay.update(t);
  if (t < CUT) {
    canvas.style.opacity = 1;
    scene.background = null; sky.visible = true;
    splash.visible = false; bubbles.visible = false;
    domGrow(0); treesGrow(0); bAge(0); bOver(0); bLocks(0); birchGrow(0); bDrop(0);
    bridge.slab.rotation.x = 0;
    river.update(t, WATER0);
    renderPlaza(t);
  } else {
    splash.visible = true;
    renderBridge(t);
  }
}

window.addEventListener("hf-seek", (e) => renderAt(e.detail.time));
renderAt(window.__hfThreeTime || 0);
