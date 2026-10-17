// "Was wäre, wenn alle Menschen verschwinden?" – 75 s, klassisches Format ohne Twist.
// Zwei Orte, jeder genau einmal: Domplatte vor dem Kölner Dom (Countdown → alle weg → Stunden/Tage,
// Licht geht aus, Tauben und Füchse) → Hohenzollernbrücke (Jahre bis Jahrhunderte: Rost, Bewuchs,
// Wald am Ufer, der Dom wird grün, Hochwasser) → das Gehwegstück bricht ab → Rhein „HIER“.
// Du bist der Einzige, der bleibt – deine Hände sind immer im Bild.
import { THREE, rng, clamp, smooth, lerp, shake, createSky, crowd, car, glowTexture, streetLamp } from "./lib/lowpoly.js";
import { hand, coffeeCup, phone, phoneScreen, mat } from "./lib/props.js";
import { createOverlay, de, countdown, curve } from "./lib/ww-overlay.js";
import { kolnerDom, hauptbahnhof, regioTrain, domplatte, ampel, guitar, guitarCase, quadruped, pigeonFlock,
         rhine, riverbanks, forest, hohenzollernbruecke, padlock, HBF, WATER0, DECK_Y, RAIL_X, BANK_Z } from "./sets.js";

const DURATION = 75;
const EVENT = 20;          // alle Menschen verschwinden
const CUT = 44;            // Schnitt auf die Hohenzollernbrücke
const BREAK_T = 62.2;      // das Gehwegstück bricht ab
const HIT = 65.0;          // Aufschlag im Rhein
const BLACK = 70;
const END = 70.5;

const SCENES = [
  { name: "Domplatte vor dem Kölner Dom", set: "domplatte" },
  { name: "Hohenzollernbrücke über den Rhein", set: "bruecke" },
];

// Vergangene Zeit seit dem Verschwinden (Stunden), wächst immer schneller
const HOURS = [[20, 0], [21, 0.0014], [24, 0.0167], [27, 0.25], [29, 2], [31.5, 4.8], [35.4, 11.3], [36.8, 28.8], [39, 35.3], [44, 52]];
const H = (t) => (t < EVENT ? 0 : curve(HOURS, t));
const hourOfDay = (t) => (17.667 + H(t)) % 24;
// Jahre auf der Brücke (log10): 1 → 10 → 50 → 100 → 200 → 300
const YEARS = [[44, 0], [47.8, 1], [51.4, 1.7], [54.8, 2], [58.4, 2.3], [BREAK_T, 2.477]];
const logY = (t) => curve(YEARS, t);
const Y = (t) => Math.pow(10, logY(t));
const POWER_OFF = 37.25;   // Stromnetz fällt aus (Nacht 2)

function since(t) {
  const h = H(t), s = h * 3600;
  if (s < 120) return `${de(Math.floor(s))} Sekunden`;
  if (h < 2) return `${de(Math.floor(s / 60))} Minuten`;
  if (h < 36) return `${de(h, 1)} Stunden`;
  return `${de(h / 24, 1)} Tagen`;
}
const years = (t) => { const y = Y(t); return y < 1.5 ? "1 Jahr" : `${de(Math.round(y))} Jahren`; };

// ------------------------------------------------------------------ Overlay ---
let fallDist = 14;
const overlay = createOverlay(document.getElementById("overlay"), {
  title: { text: "Was wäre, wenn alle Menschen verschwinden?", accent: "Menschen", accentColor: "#f2c26b", start: 0, end: 3.5 },
  hud: [
    { start: 0, end: EVENT, label: "Alle Menschen verschwinden in", value: (t) => countdown(EVENT - t),
      sub: (t) => (t < 10 ? "Domplatte · Köln · Samstag, 17:40 Uhr" : "Menschen auf der Erde: über 8 Milliarden"), fadeIn: 0.01, fadeOut: 0.01 },
    { start: EVENT, end: 29, label: "Ohne Menschen seit", value: since, sub: "Menschen auf der Erde: 1", fadeIn: 0.01, fadeOut: 0.01 },
    { start: 29, end: POWER_OFF, label: "Ohne Menschen seit", value: since, sub: "Stromnetz ohne Wartung: Ausfall nach Stunden bis Tagen (Schätzung)", fadeIn: 0.01, fadeOut: 0.01 },
    { start: POWER_OFF, end: CUT, label: "Ohne Menschen seit", value: since, sub: "Stromnetz: aus · Menschen auf der Erde: 1", fadeIn: 0.01, fadeOut: 0.01 },
    { start: CUT, end: 51.4, label: "Ohne Menschen seit", value: years, sub: "Hohenzollernbrücke · kein Anstrich, keine Wartung", fadeIn: 0.15, fadeOut: 0.01 },
    { start: 51.4, end: 58.4, label: "Ohne Menschen seit", value: years, sub: "Menschen auf der Erde: 1", fadeIn: 0.01, fadeOut: 0.01 },
    { start: 58.4, end: BREAK_T, label: "Ohne Menschen seit", value: years, sub: "Schätzung: Ohne Pflege halten Stahlbrücken wenige Jahrhunderte", fadeIn: 0.01, fadeOut: 0.01 },
    { start: BREAK_T, end: HIT, label: "Bis zum Rhein", value: () => `${de(fallDist, 1)} m`, sub: "Ohne Menschen seit ca. 300 Jahren", fadeIn: 0.01, fadeOut: 0.01 },
    { start: HIT, end: 67.2, label: "Bis zum Rhein", value: () => "HIER", sub: "Ohne Menschen seit ca. 300 Jahren", fadeIn: 0.01, fadeOut: 0.2 },
    { start: 67.2, end: BLACK, label: "Kölner Dom", value: () => "157 m", sub: "Steht noch. Fertig seit 1880.", fadeIn: 0.3, fadeOut: 0.4 },
  ],
  subtitles: [
    { start: 3.7, end: 7.5, text: "Köln, Domplatte, Samstagnachmittag." },
    { start: 7.7, end: 11.6, text: "In 12 Sekunden verschwinden alle Menschen." },
    { start: 11.8, end: 15.6, text: "Über 8 Milliarden. Alle, außer dir." },
    { start: 15.8, end: 19.8, text: "Der Gitarrist spielt sein letztes Lied." },
    { start: 20.2, end: 23.6, text: "Dann sind sie weg. Nur ihre Sachen fallen." },
    { start: 23.8, end: 26.4, text: "Ein Taxi rollt gegen einen Poller." },
    { start: 26.6, end: 28.8, text: "Der Zug rollt ohne Fahrer aus." },
    { start: 29.0, end: 32.2, text: "Die Ampel schaltet weiter. Für niemanden." },
    { start: 32.4, end: 35.4, text: "Nachts leuchtet die Stadt noch. Von allein." },
    { start: 35.6, end: 38.8, text: "Ohne Wartung geht das Licht aus." },
    { start: 39.0, end: 43.8, text: "Tauben und Füchse übernehmen die Domplatte." },
    { start: 44.4, end: 47.8, text: "Dann vergehen Jahre. Rost frisst die Brücke." },
    { start: 48.0, end: 51.4, text: "Die Liebesschlösser rosten am Geländer." },
    { start: 51.6, end: 54.8, text: "Am Ufer wächst ein Wald." },
    { start: 55.0, end: 58.4, text: "Und der Dom wird grün." },
    { start: 58.6, end: 62.0, text: "Jedes Hochwasser nagt an den Pfeilern." },
    { start: 62.2, end: 64.9, text: "Bis die Brücke nachgibt." },
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

// Autos auf der Trankgasse
const taxi = car(5); taxi.children[0].material.color.set("#efe3bf");
const sign = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.18, 0.25), new THREE.MeshStandardMaterial({ color: "#ffd84a", emissive: new THREE.Color("#ffcc33"), emissiveIntensity: 0.4 }));
sign.position.set(0, 1.78, -0.2); taxi.add(sign); scene.add(taxi);
const car2 = car(9); scene.add(car2);
const car3 = car(14); scene.add(car3);
function taxiState(t) {
  if (t < EVENT) return { x: -68, z: 133 - 7 * (EVENT - t), ry: 0, pitch: 0 };
  const u = Math.min(t - EVENT, 5), du = t - EVENT;
  const x = -68 + 6.45 * smooth(u / 5), z = 133 + 7 * u - 0.3 * u * u;
  const vx = 6.45 * 6 * (u / 5) * (1 - u / 5) / 5, vz = 7 - 0.6 * u;
  const bump = du > 5 ? Math.exp(-(du - 5) * 3) * Math.sin((du - 5) * 18) * 0.05 : 0;
  return { x, z, ry: Math.atan2(vx, vz), pitch: bump };
}
function carZ(z0, v, t, dir) {   // fährt bis zum Ereignis, rollt dann in 5 s aus
  if (t < EVENT) return z0 + dir * v * t;
  const u = Math.min(t - EVENT, v / 1.6);
  return z0 + dir * (v * EVENT + v * u - 0.8 * u * u);
}
// Zug in der Halle: fährt ein, rollt nach dem Ereignis ohne Fahrer aus
function trainZ(t) {
  if (t < EVENT) return 112 - 8 * (EVENT - t);
  const u = Math.min(t - EVENT, 8 / 0.9);
  return 112 + 8 * u - 0.45 * u * u;
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
  const battery = Math.max(0, Math.round(64 - h * 1.45));
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
      bLocks = memo(bridge.rustLocks), birchGrow = memo(bridge.birch.grow);

function lightPlaza(t) {
  const hod = hourOfDay(t), d = dayF(hod);
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

function renderPlaza(t) {
  // --- Kamera: stehen, Kopf dreht zum Bahnhof (Taxi, Zug) und zurück zum Dom
  const pan = smooth(clamp((t - 22.6) / 1.4)) * (1 - smooth(clamp((t - 28.9) / 1.6)));
  const yaw = lerp(-0.1 + 0.03 * Math.sin(t * 0.21), 0.66, pan);
  const pitch = lerp(0.115 - 0.01 * Math.sin(t * 0.17), 0.125, pan);
  const breath = Math.sin(t * Math.PI * 2 * 0.24) * 0.006;
  const jolt = t >= EVENT && t < EVENT + 1.5 ? Math.exp(-(t - EVENT) * 3.5) * 0.12 : 0;
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
  manyPigeons.update(t, (p) => ({ visible: t > EVENT + 5 && smooth(clamp((t - 37.5) / 5.5)) > p.at }));
  // Fuchs, zweiter Fuchs, Hund (nach Tagen)
  const fu = t - 39.2;
  fox.group.visible = fu > 0;
  fox.group.position.set(-31 + fu * 2.0, 0, 184 + fu * 0.5); fox.group.rotation.y = Math.atan2(2.0, 0.5); fox.update(t * 11);
  const f2 = t - 40.6;
  fox2.group.visible = f2 > 0;
  fox2.group.position.set(-9 - f2 * 1.8, 0, 181 + f2 * 0.4); fox2.group.rotation.y = Math.atan2(-1.8, 0.4); fox2.update(t * 10 + 1);
  const du = t - 41.2;
  dog.group.visible = du > 0;
  const dogStop = Math.min(du, 1.6);
  dog.group.position.set(-26 + dogStop * 2.0, 0, 190 - dogStop * 0.4); dog.group.rotation.y = Math.atan2(2.0, -0.4);
  dog.update(du < 1.6 ? t * 9 : 0, du > 1.6 ? 0.5 + 0.3 * Math.sin(t * 6) : 0);

  // Autos, Zug
  const ts = taxiState(t);
  taxi.position.set(ts.x, 0, ts.z); taxi.rotation.set(ts.pitch, ts.ry, 0);
  sign.material.emissiveIntensity = power(t) * 0.5;
  car2.position.set(-80, 0, carZ(330, 6.5, t, -1)); car2.rotation.y = Math.PI;
  car3.position.set(-68, 0, carZ(-20, 6.5, t, 1) - 30);
  train.group.position.set(-89, 0.3, trainZ(t));
  train.win.emissiveIntensity = 0.15 + power(t) * (1 - d) * 0.6;

  // Ampel: normal, im Zeitraffer blinkt sie, dann aus
  const cyc = t < 27 ? t / 24 : 27 / 24 + (t - 27) * 1.35;
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
  if (!v) fox.group.visible = fox2.group.visible = dog.group.visible = false;
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
  const base = smooth(clamp((t - 58.3) / 1.4)) * 3.4;
  const pulses = 1.3 * (gauss(t, 59.2, 0.4) + gauss(t, 60.5, 0.4) + gauss(t, 61.6, 0.45));
  return WATER0 + base + pulses + (t > 61.8 ? 0.8 * smooth(clamp((t - 61.8) / 1)) : 0);
}
const slabAngle = (t) => (t < BREAK_T ? 0 : 1.24 * Math.pow(clamp((t - BREAK_T) / (HIT - BREAK_T)), 1.6));

function renderBridge(t) {
  plazaVisible(false);
  const yv = Y(t), ly = Math.log10(Math.max(1, yv));
  // --- Verfall
  bAge(clamp(ly / 2.0));
  bOver(clamp(ly / 1.5));
  bLocks(clamp((ly - 0.4) / 1.3));
  birchGrow(clamp((ly - 1.0) / 1.1));
  treesGrow(clamp((ly - 1.25) / 0.8));
  domGrow(clamp((ly - 1.85) / 0.55));
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
  const look = smooth(clamp((t - 58.6) / 2.4));
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
    // Ab 57 s gleiten die Hände vom Geländer in eine feste Pose am unteren Bildrand,
    // sonst ragt beim Blick nach unten der Ärmel ins Bild.
    const k = smooth(clamp((t - 57) / 1.5));
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
    domGrow(0); treesGrow(0); bAge(0); bOver(0); bLocks(0); birchGrow(0);
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
