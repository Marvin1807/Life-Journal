// "Was wäre, wenn du morgen im Jahr 1926 aufwachst?" – 40 s, POV, LOOP.
// Berlin, Freitag, 22. Oktober 1926. Alle ~3,2 s ein neuer Ort: Schlafzimmer (aufwachen) → Fenster zur Straße →
// Küche mit Kohleherd → Bäckerei → Gehweg → Fernsprechamt → Stummfilmkino → Wohnzimmer mit Detektor-Radio →
// Schlafzimmer am Abend (Zettel schreiben) → hinlegen, Licht aus, Morgen: Die Kamera hebt sich wieder aus dem
// Kissen – exakt das erste Bild (gleiche Pose, gleiches Licht ab 39,2 s). Du trägst einen modernen blauen Hoodie.
import { THREE, rng, clamp, smooth, lerp, shake, createSky } from "./lib/lowpoly.js";
import { hand, mat, box } from "./lib/props.js";
import { createOverlay } from "./lib/ww-overlay.js";
import { folk, handFont, bigPhone, candle, alarmClock, writingNote, pencil, bedroom, street1926, windowFrame, horseCart,
         tram, oldCar, litfass, kitchen, bakery, euroNote, exchangeHall, earpiece, cinema, parlor, detectorRadio,
         headphones, oilLamp, TABLE_Y } from "./sets.js";

const DURATION = 40;
// Szenenstarts: Schlafzimmer 0 · Fenster · Küche · Bäckerei · Gehweg · Fernsprechamt · Kino · Wohnzimmer · Abend · Loop
const CUT_B = 3.2, CUT_C = 6.4, CUT_D = 9.6, CUT_E = 12.8, CUT_F = 16.0, CUT_G = 19.5, CUT_H = 23.0, CUT_I = 27.0, CUT_J = 33.0;
const TAP_PHONE = 2.2;               // Hand tippt aufs Handy
const COAL1 = 7.55, COAL2 = 8.75;    // Briketts ins Feuer
const NOTE_DOWN = 10.35;             // Euro-Schein liegt auf der Theke
const SHAKE0 = 10.9;                 // Bäckerin schüttelt den Kopf
const CRANK0 = 16.45, CRANK1 = 17.7; // Kurbel drehen
const PLUG = 18.2;                   // Fräulein vom Amt stöpselt
const TITLE_CARD0 = 21.25, TITLE_CARD1 = 22.45;   // Zwischentitel im Stummfilm
const PHONES_ON = 25.4;             // Kopfhörer auf
const WRITE0 = 27.6, WRITE1 = 31.6;  // Zettel schreiben
const LIE0 = 33.0, LIE1 = 34.3, BLOW = 34.6, SINK0 = 35.0, SINK1 = 36.6, DARK1 = 37.2, DAWN = 37.4, MORNING = 39.2;

const SCENES = [
  { name: "Schlafzimmer am Morgen", set: "schlafzimmer" },
  { name: "Fenster zur Straße", set: "fenster" },
  { name: "Küche mit Kohleherd und Waschschüssel", set: "kueche" },
  { name: "Bäckerei", set: "baeckerei" },
  { name: "Gehweg mit Passanten", set: "gehweg" },
  { name: "Fernsprechamt", set: "fernsprechamt" },
  { name: "Stummfilmkino", set: "kino" },
  { name: "Wohnzimmer mit Detektor-Radio", set: "wohnzimmer" },
  { name: "Schlafzimmer am Abend (Loop, gewollt)", set: "schlafzimmer" },
  { name: "Schlafzimmer: Licht aus, Morgen (Loop)", set: "schlafzimmer" },
];

// --------------------------------------------------------------- Overlay ---
const SUB_DAY = "Freitag, 22. Oktober";
const overlay = createOverlay(document.getElementById("overlay"), {
  title: { text: "Was wäre, wenn du morgen im Jahr 1926 aufwachst?", accent: "1926", accentColor: "#f2c26b", start: 0, end: 2.8 },
  hud: [
    { start: 0.7, end: 3.15, label: "Berlin 1926", value: () => "07:12 Uhr", sub: SUB_DAY, fadeIn: 0.3, fadeOut: 0.12 },
    { start: 3.28, end: 6.35, label: "Berlin 1926", value: () => "07:20 Uhr", sub: SUB_DAY, fadeIn: 0.12, fadeOut: 0.12 },
    { start: 6.48, end: 9.55, label: "Berlin 1926", value: () => "07:41 Uhr", sub: SUB_DAY, fadeIn: 0.12, fadeOut: 0.12 },
    { start: 9.68, end: 12.75, label: "Berlin 1926", value: () => "08:05 Uhr", sub: "Seit 1924 zahlt man mit Reichsmark und Pfennig", fadeIn: 0.12, fadeOut: 0.12 },
    { start: 12.88, end: 15.95, label: "Berlin 1926", value: () => "08:20 Uhr", sub: SUB_DAY, fadeIn: 0.12, fadeOut: 0.12 },
    { start: 16.08, end: 19.45, label: "Berlin 1926", value: () => "11:40 Uhr", sub: SUB_DAY, fadeIn: 0.12, fadeOut: 0.12 },
    { start: 19.58, end: 22.95, label: "Berlin 1926", value: () => "15:30 Uhr", sub: "Noch bis Ende der 1920er-Jahre laufen Stummfilme", fadeIn: 0.12, fadeOut: 0.12 },
    { start: 23.08, end: 26.95, label: "Berlin 1926", value: () => "19:45 Uhr", sub: "Seit 29. Oktober 1923 sendet in Deutschland das Radio", fadeIn: 0.12, fadeOut: 0.12 },
    { start: 27.08, end: 32.95, label: "Berlin 1926", value: () => "22:10 Uhr", sub: SUB_DAY, fadeIn: 0.12, fadeOut: 0.12 },
    { start: 33.05, end: 36.0, label: "Berlin 1926", value: () => "23:04 Uhr", sub: "Licht aus", fadeIn: 0.12, fadeOut: 0.6 },
  ],
  subtitles: [
    { start: 0.5, end: 3.05, text: "Du wachst auf. 100 Jahre zu früh." },
    { start: 3.4, end: 6.25, text: "Draußen: Pferdekutschen und Straßenbahnen." },
    { start: 6.6, end: 9.45, text: "Warmes Wasser? Erst den Kohleofen anheizen." },
    { start: 9.8, end: 12.65, text: "Dein Geld gibt es noch nicht." },
    { start: 13.0, end: 15.85, text: "Und alle starren auf deinen Hoodie." },
    { start: 16.2, end: 19.35, text: "Telefonieren? Nur über das Fräulein vom Amt." },
    { start: 19.7, end: 22.85, text: "Im Kino: Filme ohne Ton. Ein Pianist spielt dazu." },
    { start: 23.2, end: 26.85, text: "Radio gibt es erst seit drei Jahren." },
    { start: 27.3, end: 32.8, text: "Abends fragst du dich …" },
    { start: 33.5, end: 39.8, text: "Was würdest du am meisten vermissen?" },
  ],
  // Kein Schwarzbild, keine Endkarte: das Video endet im Loop-Bild (Start nach dem Videoende = unsichtbar).
  black: { start: 40.5, end: 40.5 },
  endcard: { start: 40.5, end: 40.5, lines: [
    "Seit 29. Oktober 1923 sendet in Deutschland das Radio",
    "Was würdest du 1926 am meisten vermissen?",
  ] },
});
const titleEl = document.querySelector("#overlay .ww-title");
// Titel steht im ersten Bild schon voll da und kehrt im letzten Bild zurück (Loop).
const titleOpacity = (t) => (t < 2.8 ? 1 - smooth((t - 2.2) / 0.6) : smooth((t - 39.3) / 0.45));

// -------------------------------------------------------------- Renderer ---
const canvas = document.getElementById("scene");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1);
renderer.setSize(1080, 1920, false);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
scene.fog = new THREE.Fog("#000000", 60, 400);
const camera = new THREE.PerspectiveCamera(62, 1080 / 1920, 0.02, 3000);
scene.add(camera);
const sky = createSky(2000); scene.add(sky);
const SU = sky.material.uniforms;
const hemi = new THREE.HemisphereLight("#ffeedd", "#8a7a66", 1.1); scene.add(hemi);
const sun = new THREE.DirectionalLight("#ffd6a0", 2.6);
sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.05;
scene.add(sun); scene.add(sun.target);
function setShadow(cx, cy, cz, dir, size, dist = 60) {
  sun.position.set(cx, cy, cz).addScaledVector(dir, dist); sun.target.position.set(cx, cy, cz);
  Object.assign(sun.shadow.camera, { left: -size, right: size, top: size, bottom: -size, near: 1, far: dist * 2 });
  sun.shadow.camera.updateProjectionMatrix();
}
function look({ hemiSky, hemiGround, hemiI, sunColor = "#ffffff", sunI = 0, sunDir, shadowAt = [0, 0, 0], shadowSize = 12, bg = null, skyCols = null, exposure = 1.1, fog = [60, 400], fogColor = "#000000" }) {
  hemi.color.set(hemiSky); hemi.groundColor.set(hemiGround); hemi.intensity = hemiI;
  sun.color.set(sunColor); sun.intensity = sunI;
  if (sunDir) setShadow(shadowAt[0], shadowAt[1], shadowAt[2], sunDir, shadowSize, 60);
  if (skyCols) {
    sky.visible = true; scene.background = null;
    SU.top.value.set(skyCols[0]); SU.horizon.value.set(skyCols[1]); SU.bottom.value.set(skyCols[2]);
    SU.sunGlow.value = skyCols[3] ?? 0.4; if (sunDir) SU.sunDir.value.copy(sunDir);
    sky.position.copy(camera.position);
  } else { sky.visible = false; scene.background = new THREE.Color(bg || "#000000"); }
  scene.fog.color.set(fogColor); scene.fog.near = fog[0]; scene.fog.far = fog[1];
  renderer.toneMappingExposure = exposure;
}
// Warmer 1926-Look: leichte Sepia, Helligkeit für Licht aus / Morgen
function grade(b = 1, sep = 0.2, sat = 1.0) { canvas.style.filter = `sepia(${sep}) saturate(${sat}) contrast(1.04) brightness(${b.toFixed(3)})`; }

const R = rng(1926);
const eu = new THREE.Euler(0, 0, 0, "YXZ");
const tmp = new THREE.Vector3(), tmp2 = new THREE.Vector3();
const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));
const yawTo = (from, x, z) => Math.atan2(-(x - from[0]), -(z - from[2]));
const pitchTo = (from, x, y, z) => Math.atan2(y - from[1], Math.hypot(x - from[0], z - from[2]));
const towardCam = (cx, cz, x, z, rotY) => clamp(wrap(Math.atan2(cx - x, cz - z) - rotY), -1.2, 1.2);
let currentT = 0;
function setCam(pos, yaw, pitch, fov = 62, amp = 0.004, roll = 0) {
  camera.position.set(pos[0], pos[1], pos[2]);
  const [sx, sy] = shake(currentT * 1.1, amp);
  eu.set(pitch + sy, yaw + sx, roll);
  camera.quaternion.setFromEuler(eu);
  camera.fov = fov; camera.updateProjectionMatrix(); camera.updateMatrixWorld(true);
}

// ============================================================ Hände (POV) ===
// Moderner blauer Hoodie mit weißen Streifen am Ärmel. hand(1) als linke, hand(−1) als rechte Hand:
// so liegt der Daumen bei Handrücken nach oben innen.
const SLEEVE = "#2f6fd8";
const rig = new THREE.Group(); camera.add(rig);
const rigLight = new THREE.PointLight("#fff0dc", 0.45, 1.4, 1.2); rigLight.position.set(0.05, 0.12, 0.05); rig.add(rigLight);
const leftHand = hand(1, SLEEVE); rig.add(leftHand);
const rightHand = hand(-1, SLEEVE); rig.add(rightHand);
leftHand.scale.setScalar(0.8); rightHand.scale.setScalar(0.8);
for (const h of [leftHand, rightHand]) {
  for (const z of [0.15, 0.2]) { const s = box(0.108, 0.103, 0.022, mat("#f4f4f4"), 0, 0, z, h); s.castShadow = false; s.receiveShadow = false; }
}
const _up = new THREE.Vector3(), _sh = new THREE.Vector3(), _q = new THREE.Quaternion();
/** Hand an Kamera-Position p (lokal), Ärmel zeigt zur Schulter; roll dreht um die Unterarmachse. */
function arm(h, side, p, roll = 0, curl = 0.3) {
  h.visible = true;
  h.position.set(p[0], p[1], p[2]);
  rig.updateMatrixWorld(true);
  _sh.set(side * 0.22, Math.min(p[1] - 0.14, -0.3), 0.3); rig.localToWorld(_sh);
  _up.set(0, 1, 0).applyQuaternion(camera.quaternion);
  h.up.copy(_up);
  h.lookAt(_sh);
  h.rotateZ(roll * side);
  h.userData.curl(curl);
}
/** wie arm(), aber Position in Weltkoordinaten. */
function armWorld(h, side, w, roll = 0, curl = 0.3) {
  rig.updateMatrixWorld(true);
  tmp.set(w[0], w[1], w[2]); rig.worldToLocal(tmp);
  arm(h, side, [tmp.x, tmp.y, tmp.z], roll, curl);
}
const handProps = [];
function prop(obj, parent = rig) { parent.add(obj); handProps.push(obj); obj.visible = false; return obj; }
function noHands() { leftHand.visible = false; rightHand.visible = false; handProps.forEach((o) => { o.visible = false; }); }

// Requisiten in der Hand
const heldBrikett = prop(box(0.17, 0.05, 0.065, mat("#2a2622", { roughness: 0.9 })), rightHand);
heldBrikett.position.set(0, -0.025, -0.12); heldBrikett.rotation.set(0, Math.PI / 2, 0);
const heldEuro = prop(euroNote(), rightHand);
heldEuro.position.set(0.0, -0.022, -0.13); heldEuro.rotation.set(-Math.PI / 2, 0, Math.PI / 2 + 0.2);
const heldEar = prop(earpiece(), leftHand);
heldEar.position.set(0.0, -0.01, -0.09); heldEar.rotation.set(0, 0, Math.PI / 2);
const heldPencil = prop(pencil());
const ticket = prop((() => {
  const g = new THREE.Group();
  const p = new THREE.Mesh(new THREE.PlaneGeometry(0.09, 0.05), new THREE.MeshStandardMaterial({ roughness: 0.9, side: THREE.DoubleSide, map: (() => {
    const c = document.createElement("canvas"); c.width = 360; c.height = 200; const x = c.getContext("2d");
    x.fillStyle = "#e8b0a0"; x.fillRect(0, 0, 360, 200); x.strokeStyle = "#7a2a22"; x.lineWidth = 8; x.strokeRect(10, 10, 340, 180);
    x.fillStyle = "#5a1a14"; x.textAlign = "center"; x.textBaseline = "middle"; x.font = "700 44px Georgia, serif"; x.fillText("Lichtspiele", 180, 70);
    x.font = "600 32px Georgia, serif"; x.fillText("Parkett · Reihe 7", 180, 135);
    const tx = new THREE.CanvasTexture(c); tx.colorSpace = THREE.SRGBColorSpace; return tx; })() }));
  g.add(p); return g;
})(), rightHand);
ticket.position.set(0.0, -0.02, -0.14); ticket.rotation.set(-1.1, 0, 0.25);
const heldPhones = prop(headphones());

// ============================================================ Handy-Display ===
function roundRect(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
function drawLock(c, w, h, s) {
  if (s.off) { c.fillStyle = "#050507"; c.fillRect(0, 0, w, h); return; }
  const gr = c.createLinearGradient(0, 0, w * 0.4, h); gr.addColorStop(0, "#2b3d6b"); gr.addColorStop(1, "#8a4a5a");
  c.fillStyle = gr; c.fillRect(0, 0, w, h);
  c.fillStyle = "#ffffff"; c.textBaseline = "middle";
  c.textAlign = "left"; c.font = "700 40px Arial"; c.fillText("Kein Netz", 40, 56);
  c.textAlign = "right"; c.font = "600 34px Arial"; c.fillStyle = s.battery < 20 ? "#ff6b5b" : "#ffffff"; c.fillText(`${s.battery} %`, w - 40, 56);
  c.fillStyle = "#ffffff"; c.textAlign = "center";
  c.font = "500 40px Arial"; c.fillText(s.date, w / 2, h * 0.14);
  c.font = "300 200px Arial"; c.fillText(s.time, w / 2, h * 0.27);
  c.fillStyle = "rgba(255,255,255,0.9)"; roundRect(c, 30, h * 0.44, w - 60, 200, 34); c.fill();
  c.fillStyle = "#c0392b"; c.font = "800 62px Arial"; c.fillText("Kein Netz", w / 2, h * 0.44 + 70);
  c.fillStyle = "#3a3f4a"; c.font = "500 34px Arial"; c.fillText("Suche Mobilfunknetz …", w / 2, h * 0.44 + 145);
  if (s.alarm) {
    c.fillStyle = "rgba(255,255,255,0.86)"; roundRect(c, 30, h * 0.62, w - 60, 140, 30); c.fill();
    c.fillStyle = "#1a1c22"; c.font = "700 42px Arial"; c.fillText("Wecker · 07:12", w / 2, h * 0.62 + 70);
  }
}
const bedPhone = bigPhone();
let lastScreen = "";
function phoneScreen(s) {
  const k = JSON.stringify(s);
  if (k === lastScreen) return; lastScreen = k;
  bedPhone.userData.screen.redraw((c, w, h) => drawLock(c, w, h, s));
}
const MORNING_SCREEN = { time: "07:12", date: "Freitag, 22. Oktober", battery: 64, alarm: true };
const NIGHT_SCREEN = { time: "22:10", date: "Freitag, 22. Oktober", battery: 9, alarm: false };

// ================================================================= Sets ===
const A = bedroom(); scene.add(A.group);
// Handy lehnt an zwei Büchern, Display zum Bett
const books = new THREE.Group(); books.position.set(-1.0, 0.63, 0.66); A.group.add(books);
box(0.1, 0.035, 0.15, mat("#6a2a22"), 0, 0.018, 0, books); box(0.095, 0.03, 0.14, mat("#2f4a44"), 0.003, 0.05, 0.002, books);
bedPhone.rotation.set(-0.32, Math.PI / 2, 0, "YXZ"); bedPhone.position.set(-0.925, 0.705, 0.66); A.group.add(bedPhone);
const note = writingNote(); note.mesh.rotation.set(-Math.PI / 2, 0, Math.PI / 2); note.mesh.position.set(-0.86, 0.633, 0.45); A.group.add(note.mesh);
const cdl = candle(0.12); cdl.group.position.set(-1.1, 0.63, 0.3); A.group.add(cdl.group);
const wecker = alarmClock(); wecker.position.set(-1.12, 0.63, 0.47); wecker.rotation.y = Math.PI / 2 + 0.1; A.group.add(wecker);
const moon = new THREE.PointLight("#7a90d0", 0, 8, 1.2); moon.position.set(0.9, 2.2, -3.2); A.group.add(moon);

const B = new THREE.Group(); scene.add(B);
const S1 = street1926({ seed: 1101, tramOn: true, near: false }); B.add(S1.group);
const WF = windowFrame(); WF.group.position.set(0, 4.2, 0); B.add(WF.group);
const tramB = tram({ line: "3", dest: "Alexanderplatz" }); B.add(tramB);
const cartsB = [horseCart(5, { load: "barrels" }), horseCart(6, { load: "sacks", horseColor: "#c9c3b4" }), horseCart(7, { load: "sacks" })];
cartsB.forEach((c) => B.add(c.group));
const carsB = [oldCar(3), oldCar(4)]; carsB.forEach((c) => B.add(c.group));
const litB = litfass(2); litB.position.set(-4.6, 0.12, -14.3); B.add(litB);

const C = kitchen(); scene.add(C.group);
const fireBrikett = box(0.17, 0.05, 0.065, mat("#2a2622")); C.group.add(fireBrikett);

const D = bakery(); scene.add(D.group);
const counterEuro = euroNote(); D.group.add(counterEuro);

const E = new THREE.Group(); scene.add(E);
const S2 = street1926({ seed: 1151, tramOn: true, shops: true, near: true }); E.add(S2.group);
const cartE = horseCart(9, { load: "barrels", horseColor: "#3a2a22" }); E.add(cartE.group);
const carE = oldCar(8); E.add(carE.group);
const tramE = tram({ line: "12", dest: "Wedding" }); E.add(tramE);
const litE = litfass(4); litE.position.set(-9.5, 0.12, -2.2); E.add(litE);

const F = exchangeHall(); scene.add(F.group);
const G = cinema(); scene.add(G.group);
const H = parlor(); scene.add(H.group);
const radio = detectorRadio(); radio.group.position.set(-0.02, TABLE_Y, -0.62); radio.group.rotation.y = 0.12; H.group.add(radio.group);
const lamp = oilLamp(); lamp.group.position.set(0.42, TABLE_Y, -0.78); H.group.add(lamp.group);
const tablePhones = headphones(); H.group.add(tablePhones);
const book = box(0.16, 0.035, 0.22, mat("#6a2a22"), -0.42, TABLE_Y + 0.018, -0.5); book.rotation.y = 0.4; H.group.add(book);

const SETS = { A: A.group, B, C: C.group, D: D.group, E, F: F.group, G: G.group, H: H.group };
function only(k) { for (const [n, g] of Object.entries(SETS)) g.visible = n === k; }

// ================================================== A: Schlafzimmer ===
const P = (p, yaw, pitch, roll = 0) => ({ p, yaw, pitch, roll });
const POSE_LIE = P([0.16, 0.74, 0.58], Math.PI / 2 + 0.06, 0.1, -0.3);
const POSE_SIT = P([-0.02, 1.16, 0.46], Math.PI / 2 + 0.03, -0.14, 0);
const POSE_DEEP = P([0.2, 0.665, 0.6], Math.PI / 2 + 0.2, -0.5, -0.45);
const POSE_WRITE = P([-0.08, 1.24, 0.5], Math.PI / 2 + 0.0, -0.56, 0);
function mixPose(a, b, k) {
  return { p: [lerp(a.p[0], b.p[0], k), lerp(a.p[1], b.p[1], k), lerp(a.p[2], b.p[2], k)], yaw: lerp(a.yaw, b.yaw, k), pitch: lerp(a.pitch, b.pitch, k), roll: lerp(a.roll, b.roll, k) };
}
// Aufwachen über u = t (Anfang) bzw. u = t − 40 (Ende): eine einzige stetige Bewegung über die Loop-Naht.
function wake(u) {
  if (u < -0.6) return mixPose(POSE_DEEP, POSE_LIE, smooth((u + 3.0) / 2.4));
  return mixPose(POSE_LIE, POSE_SIT, smooth((u + 0.6) / 2.1));
}
const cDay = new THREE.Color(), cNight = new THREE.Color(), cOut = new THREE.Color();
const mixC = (a, b, k) => cOut.set(a).lerp(cNight.set(b), k).clone();
const SUN_BED = new THREE.Vector3(0.35, 0.5, -0.8).normalize();
function bedLight(day, candleOn) {
  look({ hemiSky: mixC("#55648e", "#ffe6c4", day), hemiGround: mixC("#1c1612", "#7a5a40", day), hemiI: lerp(0.32, 1.3, day),
    sunColor: mixC("#8aa0d8", "#ffcf96", day), sunI: lerp(0.35, 2.3, day), sunDir: SUN_BED, shadowAt: [-0.3, 0.6, 0], shadowSize: 4,
    bg: "#000000", exposure: lerp(1.25, 1.12, day), fog: [20, 40], fogColor: "#000000" });
  A.winGlass.emissive.set(mixC("#2a3a6a", "#ffe2b0", day)); A.winGlass.emissiveIntensity = lerp(0.6, 1.0, day);
  moon.intensity = 1.2 * (1 - day);
  const fl = 1 + 0.08 * Math.sin(currentT * 11) + 0.05 * Math.sin(currentT * 23.7);
  cdl.flame.visible = candleOn > 0.02; cdl.core.visible = candleOn > 0.3;
  cdl.flame.scale.set(0.08 * fl * candleOn, 0.12 * fl * candleOn, 1); cdl.light.intensity = 2.4 * fl * candleOn;
}
function renderBedroom(t) {
  only("A");
  let pose, day = 1, candleOn = 0, b = 1, fade = 1;
  if (t < CUT_B) {
    pose = wake(t);
  } else if (t < CUT_J) {   // Abend: Zettel schreiben
    const lt = t - CUT_I;
    pose = mixPose(POSE_WRITE, P([-0.12, 1.22, 0.52], Math.PI / 2 + 0.04, -0.6, 0), smooth(lt / 6));
    day = 0; candleOn = 1; fade = smooth(lt / 0.14);
  } else if (t < SINK0) {
    pose = mixPose(POSE_WRITE, POSE_LIE, smooth((t - LIE0) / (LIE1 - LIE0)));
    day = 0; candleOn = 1 - smooth((t - BLOW) / 0.18);
  } else if (t < DARK1) {
    pose = mixPose(POSE_LIE, POSE_DEEP, smooth((t - SINK0) / (SINK1 - SINK0)));
    day = 0;
  } else {
    pose = wake(t - DURATION);
    day = smooth((t - DAWN) / (MORNING - DAWN));
  }
  if (t >= SINK0 - 0.3 && t < DURATION - 0.8) b = 1 - 0.94 * smooth((t - 35.3) / 1.1) + 0.94 * smooth((t - DARK1) / (MORNING - 0.2 - DARK1));
  const breath = Math.sin(t * Math.PI * 2 * 0.25) * 0.004;
  setCam([pose.p[0], pose.p[1] + breath, pose.p[2]], pose.yaw, pose.pitch, 68, 0.003, pose.roll);
  bedLight(day, candleOn);
  // Handy, Wecker, Zettel
  if (t < CUT_B || t >= 38.7) phoneScreen(MORNING_SCREEN);
  else if (t < BLOW) phoneScreen({ ...NIGHT_SCREEN, time: t < CUT_J ? "22:10" : "23:04" });
  else phoneScreen({ off: true });
  bedPhone.userData.screenMat.color.setScalar(t >= 38.7 && t < 39.1 ? smooth((t - 38.7) / 0.4) : (t < CUT_B || t >= 39.1 ? 1 : 0.75));
  const u = t > 30 ? t - DURATION : t;
  const ring = u > -0.7 && u < 0.6 ? 1 : 0;
  wecker.rotation.z = ring * 0.05 * Math.sin(t * 95); wecker.position.y = 0.63 + ring * 0.002 * Math.abs(Math.sin(t * 60));
  note.draw(t >= CUT_B && t < CUT_J ? (t - WRITE0) / (WRITE1 - WRITE0) : 1);
  // Hände
  noHands();
  if (t < CUT_B) {   // rechte Hand tippt aufs Handy
    const k = smooth((t - 1.35) / 0.8) * (1 - smooth((t - 2.75) / 0.4));
    if (k > 0.01) {
      const tap = Math.exp(-Math.pow((t - TAP_PHONE) / 0.12, 2));
      armWorld(rightHand, -1, [lerp(-0.3, -0.84 + 0.02 * tap, k), lerp(0.45, 0.72, k), lerp(0.4, 0.64, k)], 0.15, 0.35);
    }
  } else if (t < CUT_J) {   // schreiben: links hält den Zettel, rechts der Bleistift
    const p = clamp((t - WRITE0) / (WRITE1 - WRITE0));
    const line = Math.min(2, Math.floor(p * 3)), q = p * 3 - line;
    const tipX = -0.86 - 0.04 + line * 0.036, tipZ = 0.53 - q * 0.13 * (line === 1 ? 0.6 : 1);
    const wig = (t > WRITE0 && t < WRITE1) ? 0.004 * Math.sin(t * 38) : 0;
    const lift = t < WRITE0 ? 0.03 : t > WRITE1 ? 0.04 * smooth((t - WRITE1) / 0.4) : 0;
    const tip = [tipX + wig, 0.636 + lift + Math.max(0, 0.006 * Math.sin(t * 19)), tipZ + wig * 0.6];
    armWorld(rightHand, -1, [tip[0] + 0.07, tip[1] + 0.045, tip[2] - 0.08], 0.5, 0.75);
    heldPencil.visible = true;
    rightHand.updateMatrixWorld(true);
    const hw = rightHand.localToWorld(tmp2.set(0, -0.01, -0.08));
    tmp.set(...tip); const dir = hw.clone().sub(tmp).normalize();
    const c = tmp.clone().addScaledVector(dir, 0.084);
    rig.worldToLocal(c); heldPencil.position.copy(c); heldPencil.lookAt(hw);
  }
  grade(b, 0.2, 1.0);
  return fade;
}

// ================================================ B: Fenster zur Straße ===
const NB = 16;
const bFolk = folk(NB, 2101); B.add(bFolk.group);
const bPeople = [];
for (let i = 0; i < NB; i++) {
  const far = i < 11;
  bPeople.push({ x: R.range(-12, 6), z: far ? R.range(-15.4, -13.7) : R.range(-2.6, -0.6), dir: R() < 0.5 ? 1 : -1, v: R.range(0.6, 1.2), ph: R() * 6.28, stand: R() < 0.25 });
}
Object.assign(bPeople[0], { x: -3.6, z: -13.9, stand: true });   // liest an der Litfaßsäule
Object.assign(bPeople[1], { x: -5.5, z: -13.8, stand: true, dir: 1 });
const SUN_ST = new THREE.Vector3(0.45, 0.55, 0.7).normalize();
function renderWindow(t) {
  only("B");
  const lt = t - CUT_B;
  const pos = [0.05, 5.0 - 0.03 * smooth(lt / 3), 0.78 - 0.06 * smooth(lt / 3)];
  setCam(pos, lerp(0.3, 0.2, smooth(lt / 3.2)), lerp(-0.6, -0.54, smooth(lt / 3.2)), 70, 0.003);
  look({ hemiSky: "#fff0d8", hemiGround: "#8a7258", hemiI: 1.2, sunColor: "#ffd6a0", sunI: 2.5, sunDir: SUN_ST, shadowAt: [-3, 0, -9], shadowSize: 16,
    skyCols: ["#8fb0d0", "#f2dcb4", "#8a8070", 0.6], exposure: 1.08, fog: [30, 140], fogColor: "#e8d4b0" });
  tramB.position.set(9 - 5.2 * lt, 0, -8); tramB.rotation.y = -Math.PI / 2;
  const cs = [[-6.2 + 2.1 * lt, -5.0, 1], [3.5 - 2.0 * lt, -11.0, -1], [-1.5 - 1.6 * lt, -11.4, -1]];
  cartsB.forEach((c, i) => { const [x, z, d] = cs[i]; c.group.position.set(x + (i === 2 ? -9 : 0), 0, z); c.group.rotation.y = d * Math.PI / 2; c.update(t, 2); });
  carsB[0].group.position.set(-16 + 4.8 * lt, 0, -4.5); carsB[0].group.rotation.y = Math.PI / 2; carsB[0].update(t, 4.8);
  carsB[1].group.position.set(-8.8, 0.12, -12.3); carsB[1].group.rotation.y = -Math.PI / 2; carsB[1].update(0, 0);
  bPeople.forEach((p, i) => {
    const x = p.stand ? p.x : p.x + p.dir * p.v * lt;
    bFolk.set(i, { x, z: p.z, rotY: p.stand ? (i === 0 ? Math.PI : p.dir * Math.PI / 2) : p.dir * Math.PI / 2, swing: p.stand ? 0 : Math.sin(lt * 5 * p.v + p.ph) * 0.45,
      headYaw: p.stand ? 0.3 * Math.sin(t * 0.6 + p.ph) : 0, headPitch: i === 0 ? -0.15 : 0.02, armL: i === 1 ? 0.6 : 0.05, armR: 0.05, visible: true });
  });
  bFolk.commit();
  noHands();
  arm(leftHand, 1, [-0.2, -0.3, -0.55], 0.25, 0.25);
  arm(rightHand, -1, [0.21, -0.3, -0.55], 0.25, 0.25);
  grade(1, 0.22, 1.0);
  return smooth(lt / 0.14);
}

// ====================================================== C: Küche ===
const CAM_C = [0.3, 1.62, 0.9];
function renderKitchen(t) {
  only("C");
  const lt = t - CUT_C;
  // erst Überblick (Waschtisch mit Krug + Herd), dann in die Hocke vors Feuerloch
  const cr = smooth((lt - 0.55) / 0.5);
  const tgt = [lerp(-0.5, -0.16, cr), lerp(0.82, 0.58, cr), lerp(-0.95, -0.62, cr)];
  const pos = [lerp(CAM_C[0], 0.18, cr), lerp(CAM_C[1], 1.34, cr), lerp(CAM_C[2] - 0.05 * lt, 0.52, cr)];
  setCam(pos, yawTo(pos, tgt[0], tgt[2]), pitchTo(pos, ...tgt), 66, 0.003);
  look({ hemiSky: "#ffeed8", hemiGround: "#7a6450", hemiI: 1.2, sunColor: "#ffdcaa", sunI: 2.0, sunDir: new THREE.Vector3(-0.8, 0.5, 0.2).normalize(), shadowAt: [-0.4, 0.6, -0.8], shadowSize: 3,
    bg: "#000000", exposure: 1.12, fog: [20, 40] });
  const flare = 1 + 0.9 * Math.exp(-Math.max(0, t - COAL1 - 0.1) * 2.5) * (t > COAL1 ? 1 : 0) + 0.9 * Math.exp(-Math.max(0, t - COAL2 - 0.1) * 2.5) * (t > COAL2 ? 1 : 0);
  C.fireLight.intensity = (1.2 + 0.25 * Math.sin(t * 13) + 0.15 * Math.sin(t * 29)) * flare;
  C.steam.forEach((s, i) => {
    const k = ((t * 0.5 + i / C.steam.length) % 1);
    s.position.set(0.2 + 0.13 + 0.08 * k + 0.02 * Math.sin(t * 2 + i), 1.02 + 0.45 * k, 0.02 + 0.03 * Math.sin(t * 1.3 + i));
    s.scale.setScalar(0.06 + 0.16 * k); s.material.opacity = 0.32 * Math.sin(Math.PI * k);
  });
  noHands();
  // rechte Hand: Brikett aus dem Kasten → ins Feuerloch (zweimal)
  const doorW = [-0.12, 0.56, -0.6];
  const cyc = (t0) => {
    const a = smooth((t - (t0 - 0.75)) / 0.6), b = smooth((t - (t0 + 0.12)) / 0.45);
    return { a, b };
  };
  const c1 = cyc(COAL1), c2 = cyc(COAL2);
  const useSecond = t > COAL1 + 0.5;
  const { a, b } = useSecond ? c2 : c1;
  const startW = [0.42, 0.78, -0.42], restW = [0.35, 0.72, -0.35];
  const pW = [lerp(startW[0], doorW[0] + 0.05, a), lerp(startW[1], doorW[1] + 0.07, a), lerp(startW[2], doorW[2] + 0.13, a)];
  const handW = b > 0 ? [lerp(pW[0], restW[0], b), lerp(pW[1], restW[1], b), lerp(pW[2], restW[2], b)] : pW;
  rig.updateMatrixWorld(true);
  const early = rig.localToWorld(tmp2.set(0.16, -0.27, -0.55));
  armWorld(rightHand, -1, [lerp(early.x, handW[0], cr), lerp(early.y, handW[1], cr), lerp(early.z, handW[2], cr)], 0.25, 0.75);
  heldBrikett.visible = b < 0.02;
  const into = (t0) => clamp((t - (t0 + 0.05)) / 0.35);
  const k = useSecond ? into(COAL2) : into(COAL1);
  fireBrikett.visible = k > 0 && k < 1;
  fireBrikett.position.set(doorW[0] + 0.05 - 0.02 * k, doorW[1] - 0.02 * k, doorW[2] - 0.05 - 0.22 * k); fireBrikett.rotation.set(0, 0.3, 0);
  // linke Hand am Messinggriff des Herds
  
  grade(1, 0.2, 1.0);
  return smooth(lt / 0.14);
}

// ====================================================== D: Bäckerei ===
const CAM_D = [0.12, 1.6, 0.3];
const dFolk = folk(3, 2201); D.group.add(dFolk.group);
dFolk.look(0, { shirt: "#6a4a5a", pants: "#3a3030", hair: "#7a5232", long: 1.0, hat: "cloche", hatColor: "#f4efe4", coat: 0, apron: 1, skin: "#f1c8a5" });
dFolk.look(1, { shirt: "#5b4a3a", hat: "hut", hatColor: "#2a2420", long: 0, beard: 1, beardColor: "#9a9a9a", hair: "#9a9a9a", coat: 1 });
dFolk.look(2, { shirt: "#3f5468", hat: "cloche", hatColor: "#7a2e3e", long: 0.8, coat: 1 });
function renderBakery(t) {
  only("D");
  const lt = t - CUT_D;
  const tgt = [0.05, lerp(1.2, 1.1, smooth((lt - 0.4) / 0.8)), -1.2];
  setCam(CAM_D, yawTo(CAM_D, tgt[0], tgt[2]), pitchTo(CAM_D, ...tgt) - 0.08, lerp(68, 64, smooth(lt / 3)), 0.003);
  look({ hemiSky: "#fff0d8", hemiGround: "#8a7258", hemiI: 1.25, sunColor: "#ffdcaa", sunI: 1.4, sunDir: new THREE.Vector3(0.6, 0.6, 0.5).normalize(), shadowAt: [0, 0.8, -1], shadowSize: 3,
    bg: "#000000", exposure: 1.1, fog: [20, 40] });
  D.bellG.rotation.z = 0.25 * Math.sin(lt * 9) * Math.exp(-lt * 2);
  // Bäckerin: schaut zum Schein, schüttelt den Kopf, Zeigefinger hin und her
  const look1 = smooth((t - (NOTE_DOWN + 0.05)) / 0.3) * (1 - smooth((t - SHAKE0) / 0.3));
  const shakeK = smooth((t - SHAKE0) / 0.25) * (1 - smooth((t - 12.35) / 0.3));
  const wag = smooth((t - SHAKE0 - 0.2) / 0.3) * (1 - smooth((t - 12.4) / 0.3));
  dFolk.set(0, { x: 0.08, z: -1.32, rotY: -0.05, headPitch: 0.05 + 0.4 * look1, headYaw: 0.4 * shakeK * Math.sin((t - SHAKE0) * 13), headTilt: 0.08 * shakeK,
    armL: 0.25, spreadL: 0.1, armR: 0.2 + 1.5 * wag, spreadR: -0.25 * wag + 0.12 * wag * Math.sin((t - SHAKE0) * 14), twist: 0.05, visible: true });
  // Kunden schauen neugierig
  const nosy = smooth((t - SHAKE0) / 0.6);
  dFolk.set(1, { x: -1.35, z: -0.05, rotY: 0.9, headYaw: lerp(0.0, 0.5, nosy), headPitch: lerp(0, 0.15, nosy), armL: 0.2, armR: 0.35, visible: true });
  dFolk.set(2, { x: 1.55, z: -0.15, rotY: -1.1, headYaw: lerp(0.2, -0.45, nosy), headPitch: 0.05, armL: 0.6, armR: 0.1, visible: true });
  dFolk.commit();
  noHands();
  // rechte Hand legt den 20-Euro-Schein hin
  const inK = smooth((t - (CUT_D + 0.1)) / 0.6), down = smooth((t - (NOTE_DOWN - 0.35)) / 0.35), back = smooth((t - (NOTE_DOWN + 0.15)) / 0.5);
  const noteW = [0.04, 0.951, -0.42];
  const handW = [lerp(0.4, noteW[0] + 0.03, inK), lerp(0.75, noteW[1] + 0.03 + 0.06 * (1 - down), inK) + 0.08 * back, lerp(-0.1, noteW[2] + 0.09, inK) + 0.12 * back];
  armWorld(rightHand, -1, [handW[0] + 0.12 * back, handW[1], handW[2]], 0.05, lerp(0.35, 0.2, back));
  heldEuro.visible = t < NOTE_DOWN;
  counterEuro.visible = t >= NOTE_DOWN;
  counterEuro.position.set(noteW[0], noteW[1], noteW[2]); counterEuro.rotation.set(-Math.PI / 2, 0, 0.12);
  // linke Hand ruht auf der Theke
  armWorld(leftHand, 1, [-0.3, 0.955, -0.36], 0, 0.2);
  grade(1, 0.2, 1.02);
  return smooth(lt / 0.14);
}

// ====================================================== E: Gehweg ===
const NE = 13;
const eFolk = folk(NE, 2301); E.add(eFolk.group);
eFolk.look(0, { shirt: "#8a3b2a", pants: "#3b3f48", hat: "hut", hatColor: "#4a3a2e", long: 0, coat: 0 });   // Kind mit Schiebermütze
const ePeople = [
  { x: -1.7, z: -2.35, rotY: Math.PI / 2 + 0.7, kid: true, d: 0.2 },
  { x: -1.0, z: -2.65, rotY: Math.PI / 2 + 0.9, d: 0.35, hand: true },
  { x: -3.3, z: -0.75, rotY: Math.PI / 2 - 0.3, d: 0.0 },
  { x: -3.9, z: -1.9, rotY: Math.PI / 2 + 0.2, d: 0.5, walk: 0.55 },
  { x: -5.6, z: -0.9, rotY: Math.PI / 2, d: 0.25 },
  { x: -6.2, z: -2.4, rotY: Math.PI / 2 + 0.4, d: 0.6 },
  { x: -8.0, z: -1.5, rotY: Math.PI / 2, d: 0.4, walk: 0.7 },
  { x: -9.3, z: -0.8, rotY: Math.PI / 2 - 0.2, d: 0.8 },
  { x: -10.6, z: -2.2, rotY: Math.PI / 2 + 0.3, d: 0.7 },
  { x: -12.5, z: -1.2, rotY: Math.PI / 2, d: 1.0 },
  { x: -7.0, z: -14.2, rotY: Math.PI / 2, d: 1.2, walk: 0.9 },
  { x: -3.0, z: -14.6, rotY: -Math.PI / 2, d: 1.1, walk: 0.8 },
  { x: -14.5, z: -2.0, rotY: Math.PI / 2, d: 1.3 },
].map((p) => ({ ...p, ph: R() * 6.28 }));
eFolk.look(1, { shirt: "#7a5a3a", hat: "cloche", hatColor: "#2f4a44", long: 1.0, coat: 1 });
function renderStreet(t) {
  only("E");
  const lt = t - CUT_E;
  const bob = Math.sin(lt * Math.PI * 2 * 0.95) * 0.012;
  const pos = [2.6 - 0.75 * lt, 1.62 + bob, -1.35];
  setCam(pos, Math.PI / 2 - 0.1 + 0.03 * Math.sin(lt * 0.8), -0.05, 62, 0.003);
  look({ hemiSky: "#fff0d8", hemiGround: "#8a7258", hemiI: 1.15, sunColor: "#ffd6a0", sunI: 2.5, sunDir: new THREE.Vector3(-0.35, 0.55, -0.75).normalize(), shadowAt: [pos[0] - 6, 0, -3], shadowSize: 12,
    skyCols: ["#8fb0d0", "#f2dcb4", "#8a8070", 0.6], exposure: 1.08, fog: [25, 120], fogColor: "#e8d4b0" });
  cartE.group.position.set(-14 + 2.4 * lt, 0, -5.0); cartE.group.rotation.y = Math.PI / 2; cartE.update(t, 2.4);
  carE.group.position.set(-6.5, 0, -3.9); carE.group.rotation.y = -Math.PI / 2; carE.update(0, 0);
  tramE.position.set(-30 + 4.5 * lt, 0, -8); tramE.rotation.y = Math.PI / 2;
  ePeople.forEach((p, i) => {
    const x = p.x + (p.walk ? p.walk * Math.min(lt, 1.0 + p.d) : 0);
    const turn = smooth((lt - 0.25 - p.d * 0.6) / 0.45);
    const toCam = towardCam(pos[0], pos[2], x, p.z, p.rotY);
    const walking = p.walk && lt < 1.0 + p.d;
    let s = { x, z: p.z, rotY: p.rotY, swing: walking ? Math.sin(lt * 5 + p.ph) * 0.4 : 0, twist: 0.35 * toCam * turn, headYaw: lerp(0.2 * Math.sin(t * 0.7 + p.ph), toCam * 0.75, turn),
      headPitch: p.kid ? -0.15 * turn : 0.02, armL: 0.05, armR: 0.05, visible: true };
    if (p.kid) s = { ...s, scale: 0.62, headScale: 1.15, armR: 1.45 * smooth((lt - 0.7) / 0.4), spreadR: -0.25, twist: 0.6 * turn };
    if (p.hand) s = { ...s, armL: 0.9 * smooth((lt - 1.2) / 0.4), spreadL: 0.2, headTilt: 0.1 * turn };
    eFolk.set(i, s);
  });
  eFolk.commit();
  noHands();
  const sw = Math.sin(lt * Math.PI * 0.95);
  arm(leftHand, 1, [-0.2, -0.31 + 0.01 * sw, -0.56 - 0.03 * sw], 0.35, 0.35);
  arm(rightHand, -1, [0.2, -0.31 - 0.01 * sw, -0.56 + 0.03 * sw], 0.35, 0.35);
  rig.position.set(0, -bob * 0.4, 0);
  grade(1, 0.22, 1.0);
  return smooth(lt / 0.14);
}

// =================================================== F: Fernsprechamt ===
const CAM_F = [0.36, 1.62, 0.95];
const fFolk = folk(4, 2401); F.group.add(fFolk.group);
for (let i = 0; i < 4; i++) fFolk.look(i, { shirt: ["#3f5468", "#4d3a52", "#2f4a44", "#5b4a3a"][i], pants: "#2c2a28", hat: 0, coat: 0, long: [1.0, 0.9, 1.1, 0.8][i], headset: 1, hair: ["#7a5232", "#2a1e17", "#c9a16a", "#4a3222"][i], collar: "#f4efe4" });
const PHONE_W = new THREE.Vector3(0.82, 1.48, -0.46);
function renderExchange(t) {
  only("F");
  const lt = t - CUT_F;
  setCam([CAM_F[0], CAM_F[1], CAM_F[2] - 0.05 * lt], lerp(-0.12, -0.14, smooth(lt / 3.5)), lerp(-0.06, -0.09, smooth(lt / 3.5)), 66, 0.003);
  look({ hemiSky: "#fff0d8", hemiGround: "#8a7258", hemiI: 1.25, sunColor: "#ffe2b8", sunI: 1.6, sunDir: new THREE.Vector3(-0.8, 0.6, 0.2).normalize(), shadowAt: [0, 0.8, -4], shadowSize: 6,
    bg: "#000000", exposure: 1.1, fog: [20, 40] });
  const crankA = -Math.PI * 2 * 2.5 * smooth((t - CRANK0) / (CRANK1 - CRANK0));
  F.phone.crank.rotation.x = crankA;
  // Lämpchen: leuchtet nach dem Kurbeln, bis das Fräulein stöpselt
  F.boards.forEach((b, i) => b.draw(i === 0 ? (t > CRANK0 + 0.5 && t < PLUG + 0.1 ? [23] : t >= PLUG + 0.1 ? [] : []) : [((i * 17 + Math.floor(t * 1.5)) % 60), (i * 31 + 7) % 70]));
  // Fräulein vom Amt (vorne links) dreht sich zu dir, stöpselt
  const turn = smooth((t - (CRANK0 + 0.6)) / 0.5) * (1 - smooth((t - (PLUG - 0.3)) / 0.4));
  const plug = smooth((t - (PLUG - 0.3)) / 0.35);
  const rY0 = Math.PI + 0.2 + (-Math.PI + 0.2) * turn;
  fFolk.set(0, { x: -0.3, z: -2.7, rotY: rY0, sit: true, twist: 0.1 * turn, headYaw: towardCam(CAM_F[0], CAM_F[2], -0.3, -2.7, rY0) * turn, headPitch: lerp(0.1, 0.0, turn), headTilt: 0.12 * turn,
    armL: 0.9, spreadL: -0.1, armR: lerp(0.9, 1.9, plug), spreadR: -0.2 * plug, visible: true });
  for (let i = 1; i < 4; i++) {
    const reach = Math.max(0, Math.sin(t * 1.3 + i * 1.9));
    fFolk.set(i, { x: -0.3 + i * 1.2, z: -2.7, rotY: Math.PI, sit: true, headYaw: 0.15 * Math.sin(t * 0.8 + i), headPitch: 0.1, armL: 0.9, armR: 0.9 + 0.9 * reach, spreadR: -0.15 * reach, visible: true });
  }
  fFolk.commit();
  noHands();
  // rechte Hand an der Kurbel
  const kx = PHONE_W.x + 0.2, ky = PHONE_W.y - 0.02 - 0.09 * Math.cos(crankA), kz = PHONE_W.z - 0.09 * Math.sin(crankA);
  armWorld(rightHand, -1, [kx + 0.02, ky, kz + 0.05], 1.1, 0.8);
  // linke Hand mit dem Hörer
  const up = smooth((t - (PLUG + 0.15)) / 0.6);
  if (up < 0.98) { arm(leftHand, 1, [lerp(-0.15, -0.3, up), lerp(-0.28, 0.05, up), lerp(-0.68, -0.3, up)], 1.25, 0.85); heldEar.visible = true; }
  grade(1, 0.2, 1.0);
  return smooth(lt / 0.14);
}

// ====================================================== G: Kino ===
const CAM_G = [0.3, 1.5, -1.0];
const seatsG = G.seats.filter((s) => s.row >= 1 && s.row <= 6).filter((s) => s.z < -1.5 && !(s.z > -2.4 && Math.abs(s.x - 0.3) < 0.6)).filter((s, i) => (i * 7 + 3) % 11 < 8);
const NG = seatsG.length + 1;
const gFolk = folk(NG, 2501); G.group.add(gFolk.group);
const gPeople = seatsG.map((s, i) => ({ ...s, ph: R() * 6.28, hatOff: (i * 5 + 1) % 4 !== 0 }));
gFolk.look(NG - 1, { shirt: "#2c2a28", pants: "#2c2a28", hair: "#4a3222", hat: 0, coat: 0, long: 0, beard: 0 });   // Pianist
const filmRng = rng(77);
let lastFilm = -1;
function drawFilm(t) {
  const f = Math.floor(t * 16);
  if (f === lastFilm) return; lastFilm = f;
  const r = rng(1000 + f);
  G.screen.redraw((c, w, h) => {
    const flick = 0.88 + 0.12 * r();
    if (t >= TITLE_CARD0 && t < TITLE_CARD1) {   // Zwischentitel
      c.fillStyle = "#0b0b0b"; c.fillRect(0, 0, w, h);
      c.strokeStyle = `rgba(235,235,225,${0.9 * flick})`; c.lineWidth = 6; c.strokeRect(34, 30, w - 68, h - 60); c.lineWidth = 2; c.strokeRect(46, 42, w - 92, h - 84);
      for (const [x, y] of [[46, 42], [w - 46, 42], [46, h - 42], [w - 46, h - 42]]) { c.beginPath(); c.arc(x, y, 12, 0, 6.3); c.stroke(); }
      c.fillStyle = `rgba(240,240,230,${flick})`; c.textAlign = "center"; c.textBaseline = "middle";
      c.font = `italic 600 58px Georgia, serif`; c.fillText("„Wo bin ich hier", w / 2, h * 0.42); c.fillText("nur gelandet?“", w / 2, h * 0.58);
    } else {
      const lt = t - CUT_G;
      const sky = Math.round(200 * flick), gr = Math.round(150 * flick);
      c.fillStyle = `rgb(${sky},${sky},${sky - 6})`; c.fillRect(0, 0, w, h);
      c.fillStyle = `rgb(${gr - 60},${gr - 60},${gr - 62})`;
      [[0, 0.2, 0.22], [0.2, 0.32, 0.14], [0.66, 0.24, 0.16], [0.82, 0.12, 0.2]].forEach(([x, y, ww]) => c.fillRect(x * w, y * h, ww * w, h * 0.7));
      c.fillStyle = `rgb(${gr - 20},${gr - 20},${gr - 22})`; c.fillRect(0, h * 0.72, w, h * 0.28);
      // Laterne
      c.fillStyle = "#222"; c.fillRect(w * 0.58, h * 0.3, 8, h * 0.45); c.fillRect(w * 0.56, h * 0.28, 30, 18);
      // kleiner Herr mit Melone und Stock läuft und verliert den Hut
      const k = ((t - CUT_G) * 0.32) % 1;
      const x = w * (0.08 + 0.75 * k), y = h * 0.72, bobY = Math.abs(Math.sin(lt * 9)) * 6;
      c.fillStyle = "#111";
      c.fillRect(x - 10, y - 70 - bobY, 22, 44);   // Körper
      c.beginPath(); c.arc(x + 1, y - 82 - bobY, 11, 0, 6.3); c.fill();
      const hatUp = lt > 1.0 ? Math.min(60, (lt - 1.0) * 70) : 0;
      c.fillRect(x - 12, y - 95 - bobY - hatUp, 26, 4); c.beginPath(); c.arc(x + 1, y - 95 - bobY - hatUp, 9, Math.PI, 0); c.fill();
      const leg = Math.sin(lt * 9) * 10;
      c.fillRect(x - 8 + leg, y - 26 - bobY, 7, 26 + bobY); c.fillRect(x + 4 - leg, y - 26 - bobY, 7, 26 + bobY);
      c.save(); c.translate(x + 14, y - 50 - bobY); c.rotate(0.4 + Math.sin(lt * 6) * 0.3); c.fillRect(0, 0, 4, 46); c.restore();
      // Hund
      c.fillRect(x - 70, y - 20, 34, 14); c.fillRect(x - 40, y - 28, 12, 12); c.fillRect(x - 68, y - 8, 5, 8); c.fillRect(x - 46, y - 8, 5, 8);
    }
    // Kratzer, Staub, Vignette
    c.strokeStyle = "rgba(255,255,255,0.35)"; c.lineWidth = 2;
    for (let i = 0; i < 3; i++) { const x = r() * w; c.beginPath(); c.moveTo(x, 0); c.lineTo(x + r() * 10 - 5, h); c.stroke(); }
    c.fillStyle = "rgba(0,0,0,0.5)"; for (let i = 0; i < 8; i++) { c.beginPath(); c.arc(r() * w, r() * h, 1 + r() * 3, 0, 6.3); c.fill(); }
    const vg = c.createRadialGradient(w / 2, h / 2, h * 0.3, w / 2, h / 2, w * 0.62); vg.addColorStop(0, "rgba(0,0,0,0)"); vg.addColorStop(1, "rgba(0,0,0,0.6)");
    c.fillStyle = vg; c.fillRect(0, 0, w, h);
  });
  return 0.88;
}
function renderCinema(t) {
  only("G");
  const lt = t - CUT_G;
  setCam([CAM_G[0], CAM_G[1], CAM_G[2] - 0.03 * lt], lerp(0.03, 0.06, smooth(lt / 3.5)), lerp(0.09, 0.07, smooth(lt / 3.5)), 64, 0.002);
  drawFilm(t);
  const fl = 0.85 + 0.15 * filmRng.range(0, 1) * 0 + 0.12 * Math.sin(t * 47) * Math.sin(t * 13);
  look({ hemiSky: "#c8c0d0", hemiGround: "#2a1a14", hemiI: 0.5, bg: "#050404", exposure: 1.3, fog: [20, 40], fogColor: "#050404" });
  G.screenLight.intensity = 3.2 * fl; G.beamMat.opacity = 0.055 * fl;
  gPeople.forEach((p, i) => {
    gFolk.set(i, { x: p.x, z: p.z, rotY: Math.PI, sit: true, hatOff: p.hatOff, headYaw: 0.08 * Math.sin(t * 0.4 + p.ph), headPitch: -0.12 + 0.03 * Math.sin(t * 0.7 + p.ph), headTilt: (i % 9 === 2 && lt > 1.9 && lt < 2.9) ? 0.25 : 0.04 * Math.sin(p.ph),
      armL: 0.95, armR: 0.95, visible: true });
  });
  // Pianist spielt
  const pl = Math.sin(t * 11), pr = Math.sin(t * 13 + 1.3);
  gFolk.set(NG - 1, { y: 0.07, x: -1.25, z: -9.0, rotY: -Math.PI / 2, sit: true, armL: 1.25 + 0.12 * pl, armR: 1.25 + 0.12 * pr, spreadL: -0.15 + 0.08 * pr, spreadR: -0.15 + 0.08 * pl, headPitch: 0.15 + 0.05 * Math.sin(t * 3), headTilt: 0.08 * Math.sin(t * 2.2), visible: true });
  gFolk.commit();
  noHands();
  arm(rightHand, -1, [0.17, -0.36, -0.52], 0.6, 0.6);
  ticket.visible = true;
  arm(leftHand, 1, [-0.2, -0.4, -0.55], 0.2, 0.4);
  grade(1, 0.18, 1.0);
  return smooth(lt / 0.14);
}

// ================================================== H: Wohnzimmer ===
const CAM_H = [0.06, 1.2, 0.32];
function renderParlor(t) {
  only("H");
  const lt = t - CUT_H;
  const tgt = [0.12, 0.83, -0.66];
  const pos = [CAM_H[0], CAM_H[1], CAM_H[2] - 0.04 * lt];
  setCam(pos, yawTo(pos, tgt[0], tgt[2]) + 0.05, pitchTo(pos, ...tgt) + 0.2, 64, 0.0025);
  look({ hemiSky: "#ffc890", hemiGround: "#2a1a10", hemiI: 0.48, bg: "#0c0a0a", exposure: 1.32, fog: [8, 20], fogColor: "#140e0a" });
  const fl = 1 + 0.05 * Math.sin(t * 9) + 0.03 * Math.sin(t * 21);
  lamp.light.intensity = 3.4 * fl; lamp.glow.scale.setScalar(0.16 * fl);
  H.pendulum.rotation.z = 0.25 * Math.sin(t * Math.PI);
  radio.knob.rotation.y = t > 26.3 ? -0.8 * smooth((t - 26.3) / 0.6) : 0;
  noHands();
  // Kopfhörer: vom Tisch hochnehmen, aufsetzen (nach oben aus dem Bild)
  const lift = smooth((t - (CUT_H + 0.2)) / 0.7), on = smooth((t - PHONES_ON) / 0.6);
  tablePhones.visible = lift <= 0.001;
  tablePhones.position.set(0.2, TABLE_Y + 0.045, -0.48); tablePhones.rotation.set(-Math.PI / 2 + 0.2, 0, 0.3);
  if (lift > 0.001 && on < 0.999) {
    heldPhones.visible = true;
    rig.updateMatrixWorld(true);
    tmp.set(0.2, TABLE_Y + 0.05, -0.48); rig.worldToLocal(tmp);
    const hp = [lerp(tmp.x, 0.0, lift), lerp(tmp.y, -0.17, lift) + 0.35 * on, lerp(tmp.z, -0.42, lift) + 0.3 * on];
    heldPhones.position.set(...hp); heldPhones.rotation.set(lerp(-1.2, 0.1, lift), 0, 0); heldPhones.scale.setScalar(1 + 0.6 * on);
    arm(leftHand, 1, [hp[0] - 0.12 - 0.1 * on, hp[1] - 0.04, hp[2] + 0.02], 1.3, 0.7);
    arm(rightHand, -1, [hp[0] + 0.12 + 0.1 * on, hp[1] - 0.04, hp[2] + 0.02], 1.3, 0.7);
  }
  // rechte Hand dreht danach am Abstimmknopf
  if (t > 26.0) {
    const k = smooth((t - 26.0) / 0.5);
    armWorld(rightHand, -1, [lerp(0.3, 0.17, k), TABLE_Y + 0.03, lerp(-0.25, -0.42, k)], 0.2, 0.3);
    armWorld(leftHand, 1, [lerp(-0.4, -0.22, k), TABLE_Y + 0.03, lerp(-0.25, -0.38, k)], 0.2, 0.3);
  }
  grade(1, 0.2, 1.02);
  return smooth(lt / 0.14);
}

// ================================================================= Frame ===
function renderAt(t) {
  t = clamp(t, 0, DURATION);
  currentT = t;
  overlay.update(t);
  titleEl.style.opacity = titleOpacity(t);
  rig.position.set(0, 0, 0);
  let k;
  if (t < CUT_B) k = renderBedroom(t);
  else if (t < CUT_C) k = renderWindow(t);
  else if (t < CUT_D) k = renderKitchen(t);
  else if (t < CUT_E) k = renderBakery(t);
  else if (t < CUT_F) k = renderStreet(t);
  else if (t < CUT_G) k = renderExchange(t);
  else if (t < CUT_H) k = renderCinema(t);
  else if (t < CUT_I) k = renderParlor(t);
  else k = renderBedroom(t);
  canvas.style.opacity = clamp(k);
  renderer.render(scene, camera);
}

window.addEventListener("hf-seek", (e) => renderAt(e.detail.time));
renderAt(window.__hfThreeTime || 0);
