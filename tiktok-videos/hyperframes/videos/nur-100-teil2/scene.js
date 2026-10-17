// "Wer ist die Nummer 101?" – Teil 2 zu nur-100, 61 s, gleicher Look und gleiche ruhige Musik.
// Auflösung: Gezählt wurden nur die Menschen auf der Erde. Nummer 101 war auf der ISS. Sie heißt Ida.
// Fünf Orte, jeder genau einmal: Festsaal-Tür (Fortsetzung) → ISS-Kuppel (Idas Blick, Tag 1–29) →
// Landung an der Nordseeküste → Landstraße nachts → Rathausplatz nachts (deine Hände, Kreide, Funkgerät, Signal).
import { THREE, rng, clamp, smooth, lerp, shake, createSky, createStars, valueAt } from "./lib/lowpoly.js";
import { hand, mat, box, cyl } from "./lib/props.js";
import { createOverlay, de, curve } from "./lib/ww-overlay.js";
import { folk, rathausplatz, festsaal, astronaut, issRadio, backpack, nightEarth, spherePos, cupola, capsule, coast, countryRoad,
         BOARD, BOARD_SLOT, HALL_Z, DOOR_Z, TABLE } from "./sets.js";

const DURATION = 61;
const CUT_B = 8.0;      // ISS-Kuppel
const CUT_C = 20.0;     // Landung (von außen)
const CUT_C2 = 23.4;    // Idas Blick aus der Luke
const CUT_D = 27.0;     // Landstraße
const CUT_E = 35.0;     // Rathausplatz: Tafel
const CUT_E2 = 40.0;    // Rathaustreppe: Ida und das Funkgerät
const SIGNAL = 54.6;    // jemand antwortet
const BLACK = 59.9;
const END = 60.15;

const SCENES = [
  { name: "Festsaal im Rathaus, die offene Tür", set: "festsaal" },
  { name: "ISS-Kuppel über Europa bei Nacht", set: "iss" },
  { name: "Landung vor der Nordseeküste", set: "kueste" },
  { name: "Landstraße bei Nacht", set: "landstrasse" },
  { name: "Rathausplatz bei Nacht", set: "rathausplatz" },
];

// --------------------------------------------------------------- Overlay ---
const DAYS = [[CUT_B, 1], [10.8, 1.9], [13.0, 4.9], [15.5, 11.9], [17.8, 21.9], [19.7, 29.9]];
const day = (t) => Math.max(1, Math.min(29, Math.floor(curve(DAYS, t))));
const KM = [[CUT_D, 12], [CUT_E, 0.4]];
const overlay = createOverlay(document.getElementById("overlay"), {
  title: { text: "Wer ist die Nummer 101?", accent: "101", accentColor: "#f2c26b", start: 0, end: 3.0 },
  hud: [
    { start: 0, end: CUT_B - 0.1, label: "Gezählt", value: () => "101", sub: "Tag 30 · Einer zu viel", fadeIn: 0.3, fadeOut: 0.3 },
    { start: CUT_B + 0.1, end: CUT_C - 0.1, label: "Menschen im All", value: () => "1", sub: (t) => `Tag ${day(t)} · ISS · 400 km über dir`, fadeIn: 0.25, fadeOut: 0.3 },
    { start: CUT_C + 0.1, end: CUT_D - 0.1, label: "Menschen im All", value: () => "0", sub: "Tag 29 · Landung", fadeIn: 0.25, fadeOut: 0.3 },
    { start: CUT_D + 0.1, end: CUT_E - 0.1, label: "Noch", value: (t) => `${de(curve(KM, t), 1)} km`, sub: "Tag 30 · Landstraße · Nachts", fadeIn: 0.25, fadeOut: 0.3 },
    { start: CUT_E + 0.1, end: 37.7, label: "Menschen auf der Erde", value: () => "100", sub: "Tag 30 · Rathaus · Nachts", fadeIn: 0.25, fadeOut: 0.01 },
    { start: 37.7, end: 45.4, label: "Menschen auf der Erde", value: () => "101", sub: "Tag 30 · Rathaus · Nachts", fadeIn: 0.01, fadeOut: 0.2 },
    { start: 45.6, end: SIGNAL, label: "Signale", value: () => "0", sub: "Tag 30 · Funkgerät der ISS", fadeIn: 0.2, fadeOut: 0.01 },
    { start: SIGNAL, end: BLACK, label: "Signale", value: () => "1", sub: "Tag 30 · 61° S · 58° W", fadeIn: 0.01, fadeOut: 0.2 },
  ],
  subtitles: [
    { start: 0.3, end: 2.8, text: "Teil 2." },
    { start: 3.0, end: 5.3, text: "Sie steht auf keiner Liste." },
    { start: 5.5, end: 7.8, text: "Weil sie nicht auf der Erde war." },
    { start: 8.3, end: 10.9, text: "Tag 1. Sie war auf der ISS." },
    { start: 11.1, end: 13.8, text: "Unter ihr gehen die Lichter aus." },
    { start: 14.0, end: 16.6, text: "Niemand antwortet mehr." },
    { start: 16.8, end: 19.8, text: "Also wartet sie. 29 Tage." },
    { start: 20.3, end: 23.2, text: "Dann landet sie. Allein." },
    { start: 23.5, end: 26.7, text: "Kein Schiff holt sie ab." },
    { start: 27.3, end: 30.8, text: "Sie folgt dem einzigen Licht im Land." },
    { start: 31.0, end: 34.6, text: "Zwölf Kilometer. Zu Fuß." },
    { start: 35.3, end: 37.6, text: "Die Liste wird länger." },
    { start: 37.8, end: 39.8, text: "Zum ersten Mal." },
    { start: 40.2, end: 42.4, text: "Sie heißt Ida." },
    { start: 42.6, end: 45.3, text: "Sie hat etwas mitgebracht." },
    { start: 45.5, end: 49.4, text: "Seit 30 Tagen hört sie nur Rauschen." },
    { start: 49.6, end: 52.6, text: "Bis heute Nacht." },
    { start: 54.8, end: 59.0, text: "Jemand antwortet." },
  ],
  black: { start: BLACK, end: END },
  endcard: { start: END, end: DURATION, lines: [
    "Teil 3?",
    "Wer meldet sich da? Schreib es in die Kommentare",
  ] },
});

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
scene.fog = new THREE.Fog("#e9cfa8", 120, 900);
const camera = new THREE.PerspectiveCamera(62, 1080 / 1920, 0.03, 60000);
scene.add(camera);
const sky = createSky(4000); scene.add(sky);
const SU = sky.material.uniforms;
const stars = createStars(1400, 3500, 7); scene.add(stars);
const hemi = new THREE.HemisphereLight("#ffeedd", "#8a7a66", 1.1); scene.add(hemi);
const sun = new THREE.DirectionalLight("#ffd6a0", 2.6);
sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.05;
scene.add(sun); scene.add(sun.target);
function setShadow(cx, cy, cz, dir, size, dist = 200) {
  sun.position.set(cx, cy, cz).addScaledVector(dir, dist); sun.target.position.set(cx, cy, cz);
  Object.assign(sun.shadow.camera, { left: -size, right: size, top: size, bottom: -size, near: 1, far: dist * 2 });
  sun.shadow.camera.updateProjectionMatrix();
}
function setSky(top, hor, bot, dir, glow) { SU.top.value.set(top); SU.horizon.value.set(hor); SU.bottom.value.set(bot); SU.sunDir.value.copy(dir); SU.sunGlow.value = glow; }

// ================================================================= Sets ===
const platz = rathausplatz(); scene.add(platz.group);
const saal = festsaal(); scene.add(saal.group);
const EARTH_O = new THREE.Vector3(-40000, 0, 0);
const earth = nightEarth(); earth.group.position.copy(EARTH_O); scene.add(earth.group);
const cup = cupola(); scene.add(cup.group);
const COAST_O = new THREE.Vector3(9000, 0, 0);
const kueste = coast(); kueste.group.position.copy(COAST_O); scene.add(kueste.group);
const kapsel = capsule(); scene.add(kapsel.group);
const strasse = countryRoad(); scene.add(strasse.group);
const ida = astronaut(); scene.add(ida.group);
const radio = issRadio(); scene.add(radio);
const bag = backpack(); scene.add(bag);
const SETS = { A: [saal.group], B: [earth.group, cup.group], C: [kueste.group, kapsel.group], D: [strasse.group, platz.group], E: [platz.group] };
function only(k) {
  for (const gs of Object.values(SETS)) for (const g of gs) g.visible = false;
  for (const g of SETS[k]) g.visible = true;
}

const tmp = new THREE.Vector3(), eu = new THREE.Euler(0, 0, 0, "YXZ");
const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));
const R = rng(200);
const UP = new THREE.Vector3(0, 1, 0);
function aim(pos, look, up = UP) { camera.position.copy(pos); camera.up.copy(up); camera.lookAt(look); camera.up.copy(UP); }

// ============================================================ Hände (POV) ===
const rig = new THREE.Group(); camera.add(rig);
const rightHand = hand(1, "#6b4a3a"); rig.add(rightHand);
const leftHand = hand(-1, "#6b4a3a"); rig.add(leftHand);
// Idas Handschuhe (eigene Hände, umgefärbt)
const gloveR = hand(1, "#e9e6dc"), gloveL = hand(-1, "#e9e6dc"); rig.add(gloveR, gloveL);
for (const gh of [gloveR, gloveL]) gh.traverse((o) => { if (o.isMesh) { o.material = o.material.clone(); if (o.material.color.getHexString() === "e9b892") o.material.color.set("#d8d4ca"); if (o.material.color.getHexString() === "1d2129") o.material.color.set("#3a5a8a"); } });
// Taschenlampe (Landstraße)
const torch = new THREE.Group(); rig.add(torch);
{ const b = cyl(0.022, 0.022, 0.17, 10, mat("#2a2a2c", { roughness: 0.4 }), 0, 0, 0, torch); b.rotation.x = Math.PI / 2;
  const h = cyl(0.032, 0.024, 0.05, 10, mat("#2a2a2c"), 0, 0, -0.1, torch); h.rotation.x = Math.PI / 2;
  const lens = new THREE.Mesh(new THREE.CircleGeometry(0.03, 12), new THREE.MeshBasicMaterial({ color: "#fff6d8", toneMapped: false })); lens.position.z = -0.126; lens.rotation.y = Math.PI; torch.add(lens); }
const beam = new THREE.SpotLight("#fff1d0", 0, 45, 0.42, 0.5, 1.1); camera.add(beam); camera.add(beam.target);
beam.position.set(0.12, -0.25, -0.3); beam.target.position.set(0.3, -2.4, -14);
// Teetasse (Rathausplatz)
const mug = new THREE.Group(); rig.add(mug);
cyl(0.04, 0.036, 0.095, 12, mat("#c8432f", { roughness: 0.4 }), 0, 0, 0, mug);
cyl(0.036, 0.036, 0.005, 12, mat("#8a5a2a", { roughness: 0.2 }), 0, 0.044, 0, mug);
const handle = new THREE.Mesh(new THREE.TorusGeometry(0.024, 0.007, 6, 10, Math.PI), mat("#c8432f")); handle.position.set(0.04, 0, 0); handle.rotation.z = -Math.PI / 2; mug.add(handle);
function hands(o = {}) {
  rightHand.visible = o.right === "mug"; leftHand.visible = false; mug.visible = o.right === "mug";
  gloveR.visible = !!o.gloveR; gloveL.visible = !!o.gloveL; torch.visible = o.gloveR === "torch";
  beam.intensity = o.gloveR === "torch" ? 40 : 0;
}

// ============================================================ A: Festsaal ===
const MOM_LOOK = { shirt: "#c98b3a", pants: "#3b3f48", hair: "#7a5232", skin: "#f1c8a5", long: 1.15 };
const CAM_SEAT = 6, MOM_SEAT = 49 + 6;
const diners = folk(98, 404); saal.group.add(diners.group);
const DS = [];
let fi = 0;
saal.seats.forEach((st, i) => { if (i === CAM_SEAT) return; DS.push({ ...st, idx: fi++, ph: R() * 6.28, mom: i === MOM_SEAT }); });
DS.push({ x: 0.62, z: TABLE.z0 + 0.35, side: 0, idx: fi++, ph: 1, foot: true });
diners.look(DS.find((d) => d.mom).idx, MOM_LOOK);
const CAM_D = new THREE.Vector3(-1.0, 1.22, saal.seats[CAM_SEAT].z);
const yawTo = (from, x, z) => Math.atan2(-(x - from.x), -(z - from.z));
const revealLight = new THREE.PointLight("#ffd7a0", 0, 14, 1.3); revealLight.position.set(-0.3, 2.6, 2.5); saal.group.add(revealLight);
const IDA_IN = { z0: DOOR_Z + 0.6, z1: DOOR_Z - 4.6, t0: 0.6, t1: 7.4 };
function renderHall(t) {
  only("A");
  const u = smooth(clamp((t - IDA_IN.t0) / (IDA_IN.t1 - IDA_IN.t0)));
  const iz = lerp(IDA_IN.z0, IDA_IN.z1, (t - IDA_IN.t0) / (IDA_IN.t1 - IDA_IN.t0) * 0.15 + u * 0.85);
  const ix = lerp(0, -0.25, u);
  const breath = Math.sin(t * Math.PI * 2 * 0.24) * 0.005;
  camera.position.copy(CAM_D); camera.position.y += breath;
  const [sx, sy] = shake(t * 1.1, 0.0045);
  eu.set(-0.075 + 0.02 * u + sy, yawTo(CAM_D, ix * 0.6, iz) + sx, 0);
  camera.quaternion.setFromEuler(eu);
  camera.fov = lerp(52, 40, u); camera.updateProjectionMatrix(); camera.updateMatrixWorld();
  scene.background = new THREE.Color("#1a120c"); sky.visible = false; stars.visible = false;
  scene.fog.color.set("#2a1c12"); scene.fog.near = 14; scene.fog.far = 70;
  sun.intensity = 0; hemi.color.set("#ffd2a0"); hemi.groundColor.set("#3a2414"); hemi.intensity = 0.85;
  saal.chand.forEach((c, i) => { c.light.intensity = 8.5 * (1 + 0.03 * Math.sin(t * 7 + i)); });
  saal.candles.forEach((f, i) => { const fl = 1 + 0.06 * Math.sin(t * (9 + (i % 5)) + i); f.scale.set(0.16 * fl, 0.24 * fl, 1); });
  renderer.toneMappingExposure = 1.5;
  // Tür offen, gleißendes Licht – sie tritt ins Licht
  saal.leaves.forEach((h, k) => { h.rotation.y = (k ? -1 : 1) * 1.45; });
  saal.glare.visible = true;
  saal.glow.material.opacity = lerp(0.95, 0.55, u); saal.floorGlow.material.opacity = 0.8;
  saal.doorLight.intensity = 60;
  revealLight.intensity = 9 * smooth(clamp((t - 2.0) / 3.5));
  // Alle schauen zur Tür
  DS.forEach((d) => {
    const rotY = d.foot ? Math.PI : d.side < 0 ? Math.PI / 2 : -Math.PI / 2;
    const toIda = wrap(Math.atan2(ix - d.x, iz - d.z) - rotY);
    const tw = clamp(toIda * 0.62, -1.15, 1.15);
    diners.set(d.idx, { x: d.x, z: d.z, rotY, sit: true, twist: tw, headYaw: clamp(toIda - tw, -0.9, 0.9), headPitch: 0.03 * Math.sin(t + d.ph), armR: 0.35, armL: 0.3, visible: true });
  });
  diners.commit();
  const walking = t > IDA_IN.t0 && t < IDA_IN.t1;
  ida.set({ x: ix, z: iz, rotY: Math.PI + ix * 0.1, swing: walking ? Math.sin(t * 4.6) * 0.42 * (1 - u * 0.7) : 0, armL: 0.35, spreadL: 0.22, armR: 0.05,
    headYaw: 0.25 * Math.sin(t * 0.6) * u, headPitch: -0.04, helmet: "arm" });
  hands({});
  rig.position.set(0, 0, 0);
  canvas.style.filter = "saturate(1.08) contrast(1.04)";
  return 1;
}

// =========================================================== B: ISS-Kuppel ===
const ER = earth.R;
const ISS_POS = spherePos(7.5, 45.5, ER + 38).add(EARTH_O);
const ISS_LOOK = spherePos(11, 50.5, ER).add(EARTH_O);
const ISS_UP = spherePos(7.5, 45.5, 1).normalize();
// Kuppel einmal ausrichten
aim(ISS_POS, ISS_LOOK, ISS_UP);
cup.group.position.copy(camera.position); cup.group.quaternion.copy(camera.quaternion);
const ISS_Q = camera.quaternion.clone();
let lastFunk = "";
function drawFunk(t) {
  const blink = Math.floor(t * 2) % 2 === 0;
  const key = `${day(t)}|${blink}|${Math.floor(t * 1.5) % 3}`;
  if (key === lastFunk) return;
  lastFunk = key;
  cup.screen.redraw((c, w, h) => {
    c.fillStyle = "#0a1410"; c.fillRect(0, 0, w, h);
    c.fillStyle = "#7fd8a0"; c.font = "700 30px 'Courier New', monospace"; c.textAlign = "left"; c.textBaseline = "top";
    c.fillText("FUNK · BODENSTATION", 24, 20);
    c.fillText(`TAG ${day(t)}   RUF ${"…".repeat(1 + (Math.floor(t * 1.5) % 3))}`, 24, 70);
    c.fillStyle = blink ? "#ff5a48" : "#7a2a22"; c.font = "800 52px 'Courier New', monospace";
    c.fillText("KEINE ANTWORT", 24, 140);
  });
}
function renderISS(t) {
  only("B");
  const u = t - CUT_B;
  // schwebende Kamera in der Kuppel
  tmp.set(0.02 * Math.sin(u * 0.5), 0.015 * Math.sin(u * 0.37 + 1), 0.02 * Math.sin(u * 0.29)).applyQuaternion(ISS_Q);
  camera.position.copy(ISS_POS).add(tmp);
  camera.quaternion.copy(ISS_Q);
  eu.set(-0.04 + 0.02 * Math.sin(u * 0.21), 0.03 * Math.sin(u * 0.17), 0.04 * Math.sin(u * 0.13));
  camera.quaternion.multiply(new THREE.Quaternion().setFromEuler(eu));
  camera.fov = 62; camera.updateProjectionMatrix(); camera.updateMatrixWorld();
  scene.background = new THREE.Color("#000000"); sky.visible = false;
  stars.visible = true; stars.material.opacity = 0.9; stars.position.copy(camera.position);
  scene.fog.near = 1e6; scene.fog.far = 2e6;
  sun.intensity = 0.0; hemi.color.set("#c8d4e8"); hemi.groundColor.set("#3a4050"); hemi.intensity = 1.25;
  renderer.toneMappingExposure = 1.15;
  earth.group.rotation.set(0, 0, 0);
  earth.lights(t);
  drawFunk(t);
  // Handschuhe schweben im Bild
  hands({ gloveR: true, gloveL: true });
  gloveR.position.set(0.17 + 0.01 * Math.sin(u * 0.8), -0.3 + 0.012 * Math.sin(u * 0.6), -0.56); gloveR.rotation.set(0.3 + 0.05 * Math.sin(u * 0.5), 0.2, 0.5); gloveR.userData.curl(0.35);
  gloveL.position.set(-0.19 + 0.01 * Math.sin(u * 0.7 + 1), -0.33 + 0.012 * Math.sin(u * 0.55 + 2), -0.6); gloveL.rotation.set(0.25, -0.25, -0.4 + 0.05 * Math.sin(u * 0.4)); gloveL.userData.curl(0.25);
  rig.position.set(0, 0, 0);
  canvas.style.filter = "saturate(1.05) contrast(1.05)";
  return smooth((t - CUT_B) / 0.14);
}

// ======================================================= C: Landung, Küste ===
const CAP0 = new THREE.Vector3(COAST_O.x, 0, -70);
const SPLASH_T = 22.5;
const SPL = 120;
const splash = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.35, 0), new THREE.MeshStandardMaterial({ color: "#eef4f6", roughness: 0.4, transparent: true, opacity: 0.9 }), SPL);
const SPD = []; for (let i = 0; i < SPL; i++) { const a = R() * 6.28; SPD.push({ vx: Math.cos(a) * R.range(1, 5), vz: Math.sin(a) * R.range(1, 5), vy: R.range(3, 9), s: R.range(0.5, 1.6) }); }
splash.frustumCulled = false; kapsel.group.parent.add(splash); SETS.C.push(splash);
const o3 = new THREE.Object3D();
function capsuleY(t) {
  if (t < SPLASH_T) { const k = (SPLASH_T - t) / (SPLASH_T - CUT_C); return 1.2 + 70 * k; }
  return -0.5 + kueste.waveY(0, -70, t) + 0.6 * Math.exp(-(t - SPLASH_T) * 2) * Math.cos((t - SPLASH_T) * 6);
}
function renderCoast(t) {
  only("C");
  kueste.update(t);
  const cy = capsuleY(t);
  kapsel.group.position.set(CAP0.x, cy, CAP0.z);
  kapsel.group.rotation.set(0.05 * Math.sin(t * 1.1), 0.3, 0.06 * Math.sin(t * 0.9 + 1));
  kapsel.chutes.visible = t < SPLASH_T + 0.6;
  kapsel.chutes.scale.setScalar(t < SPLASH_T ? 1 : Math.max(0.01, 1 - (t - SPLASH_T) / 0.6));
  // Spritzer
  SPD.forEach((p, i) => {
    const s = (t - SPLASH_T) * 1.1;
    const vis = s > 0 && s < 1.9;
    o3.position.set(CAP0.x + p.vx * s, Math.max(-1, p.vy * s - 4.9 * s * s), CAP0.z + p.vz * s);
    o3.rotation.set(s * 3, i, 0); o3.scale.setScalar(vis ? p.s : 0); o3.updateMatrix(); splash.setMatrixAt(i, o3.matrix);
  });
  splash.instanceMatrix.needsUpdate = true;
  // Licht: grauer Nordsee-Morgen, Sonne tief von links
  const SUN_DIR = new THREE.Vector3(-0.7, 0.35, 0.3).normalize();
  setShadow(CAP0.x, 0, CAP0.z, SUN_DIR, 30, 150);
  sun.intensity = 2.0; sun.color.set("#ffd9b0");
  hemi.color.set("#e8eef2"); hemi.groundColor.set("#5a6a70"); hemi.intensity = 1.1;
  setSky("#7d95b0", "#f0d2b4", "#5d7f8c", SUN_DIR, 0.6);
  scene.background = null; sky.visible = true; stars.visible = false;
  scene.fog.color.set("#d9d4cc"); scene.fog.near = 150; scene.fog.far = 1500;
  renderer.toneMappingExposure = 1.05;
  if (t < CUT_C2) {
    // von der Wasseroberfläche aus: Kapsel an Fallschirmen, dann der Platscher
    const wy = kueste.waveY(10, -10, t);
    camera.position.set(CAP0.x + 12, 1.3 + wy * 0.6, CAP0.z + 34);
    const look = tmp.set(CAP0.x, Math.max(cy + 1.5, 2.2) + (t < SPLASH_T ? 6 : 0), CAP0.z);
    camera.lookAt(look);
    const [sx, sy] = shake(t * 1.3, 0.006 + 0.03 * Math.exp(-Math.max(0, t - SPLASH_T) * 3) * (t > SPLASH_T ? 1 : 0));
    camera.rotateY(sx); camera.rotateX(sy);
    camera.rotateZ(0.03 * Math.sin(t * 1.2));
    hands({});
  } else {
    // Idas Blick aus der Luke auf die leere Küste
    tmp.set(0, 3.15, -0.2).applyEuler(kapsel.group.rotation).add(kapsel.group.position);
    camera.position.copy(tmp);
    const u = smooth(clamp((t - CUT_C2) / 3));
    eu.set(lerp(-0.12, -0.02, u) + 0.02 * Math.sin(t * 1.1), lerp(-0.35, 0.18, u), 0.04 * Math.sin(t * 0.9 + 1));
    camera.quaternion.setFromEuler(eu);
    hands({ gloveR: true, gloveL: true });
    gloveR.position.set(0.2, -0.36, -0.5); gloveR.rotation.set(0.9, 0.1, 0.2); gloveR.userData.curl(0.8);
    gloveL.position.set(-0.22, -0.37, -0.5); gloveL.rotation.set(0.9, -0.1, -0.2); gloveL.userData.curl(0.8);
  }
  camera.fov = 62; camera.updateProjectionMatrix(); camera.updateMatrixWorld();
  rig.position.set(0, 0, 0);
  sky.position.copy(camera.position);
  canvas.style.filter = "saturate(0.95) contrast(1.03)";
  return t < CUT_C2 ? smooth((t - CUT_C) / 0.14) : smooth((t - CUT_C2) / 0.14);
}

// ======================================================= D: Landstraße ===
const ROAD_Z0 = 1336, ROAD_Z1 = 1312;
function renderRoad(t) {
  only("D");
  const u = (t - CUT_D) / (CUT_E - CUT_D);
  const bob = Math.sin(t * Math.PI * 2 * 0.95) * 0.025;
  camera.position.set(-0.9 + 0.2 * Math.sin(u * 3), 1.65 + bob, lerp(ROAD_Z0, ROAD_Z1, u));
  // Blick zum leuchtenden Rathausturm in der Ferne
  const yaw = yawTo(camera.position, -17.5, HALL_Z - 3.8) + 0.02 * Math.sin(t * 0.7);
  const [sx, sy] = shake(t * 1.1, 0.006);
  eu.set(-0.015 + sy, yaw + sx, 0.01 * Math.sin(t * 2.9));
  camera.quaternion.setFromEuler(eu);
  camera.fov = 62; camera.updateProjectionMatrix(); camera.updateMatrixWorld();
  // Nacht: Mond, Sterne, kein Licht außer dem Turm
  const MOON = new THREE.Vector3(0.5, 0.5, 0.7).normalize();
  setShadow(camera.position.x, 0, camera.position.z - 10, MOON, 30, 120);
  sun.intensity = 0.35; sun.color.set("#9db4ff");
  hemi.color.set("#5a6e9a"); hemi.groundColor.set("#141820"); hemi.intensity = 0.7;
  setSky("#050a1a", "#1c2a48", "#0a0e16", MOON, 0.15);
  scene.background = null; sky.visible = true; sky.position.copy(camera.position);
  stars.visible = true; stars.material.opacity = 0.9; stars.position.copy(camera.position);
  scene.fog.color.set("#0e1626"); scene.fog.near = 40; scene.fog.far = 3200;
  renderer.toneMappingExposure = 1.45;
  platz.houses.forEach((b) => { b.material.emissiveIntensity = 0; });
  platz.lamps.forEach((l) => { l.glowMat.opacity = 0; l.bulbMat.color.set("#3a3a3a"); });
  platz.clockMats.forEach((m) => { m.emissiveIntensity = 1.6; });
  platz.towerGlow.material.opacity = 1; platz.towerGlow.scale.set(150, 150, 1);
  platz.towerLight.intensity = 0;
  hands({ gloveR: "torch", gloveL: true });
  gloveR.position.set(0.165, -0.315, -0.56); gloveR.rotation.set(0.2, 0.1, 1.2); gloveR.userData.curl(0.95);
  torch.position.set(0.13, -0.27, -0.64); torch.rotation.set(0.08, 0.04, 0);
  gloveL.position.set(-0.2, -0.42 + bob * 0.3, -0.5); gloveL.rotation.set(0.3, -0.1, -0.3); gloveL.userData.curl(0.5);
  rig.position.set(0, -bob * 0.4, 0);
  canvas.style.filter = "saturate(1.0) contrast(1.05)";
  return smooth((t - CUT_D) / 0.14);
}

// =================================================== E: Rathausplatz nachts ===
const mayorF = folk(1, 505); platz.group.add(mayorF.group);
mayorF.look(0, { shirt: "#7a1f2a", pants: "#2c2a28", hair: "#d8d4cc", skin: "#e8b896", long: 0.55 });
const chain = new THREE.Group(); platz.group.add(chain);
const gold = mat("#d4ad4a", { metalness: 0.7, roughness: 0.3 });
for (let k = 0; k < 9; k++) { const a = -1.1 + (k / 8) * 2.2; box(0.035, 0.035, 0.02, gold, Math.sin(a) * 0.17, -0.02 - 0.12 * Math.cos(a * 1.3), 0, chain); }
cyl(0.045, 0.045, 0.012, 10, gold, 0, -0.17, 0.0, chain).rotation.x = Math.PI / 2;
const slot = BOARD_SLOT(101);
const SLOT = new THREE.Vector3(BOARD.x + slot.x, BOARD.y + slot.y, BOARD.z);
const TITLE = new THREE.Vector3(BOARD.x + 0.3, BOARD.y + BOARD.h / 2 - 0.2, BOARD.z);
const nightLights = [[-1.6, 3.6, -26.5, 7], [1.6, 3.2, -37.5, 6]].map(([x, y, z, i]) => { const l = new THREE.PointLight("#ffcf90", 0, 14, 1.4); l.position.set(x, y, z); l.userData.i = i; platz.group.add(l); return l; });
const IDA_SEAT = new THREE.Vector3(0.7, 0.04, -40.0);
const RADIO_LAP = new THREE.Vector3(0.7, 0.86, -39.5);
const BAG_P = new THREE.Vector3(1.32, 0.36, -40.15);
let lastRadio = "";
function drawRadio(t) {
  const sig = t >= SIGNAL;
  const q = Math.floor(t * 8);
  const key = `${sig}|${q}`;
  if (key === lastRadio) return;
  lastRadio = key;
  const rr = rng(q + 3);
  radio.userData.screen.redraw((c, w, h) => {
    c.fillStyle = "#0b1410"; c.fillRect(0, 0, w, h);
    c.textBaseline = "top"; c.textAlign = "left";
    c.fillStyle = "#7fd8a0"; c.font = "700 30px 'Courier New', monospace";
    c.fillText("ISS · FUNK · KANAL 1", 18, 12);
    // Wellenform
    c.strokeStyle = sig ? "#b8ffcc" : "#4f8a64"; c.lineWidth = 3; c.beginPath();
    for (let x = 0; x <= w - 36; x += 6) {
      const n = sig ? Math.sin(x * 0.12 + q) * 26 * (0.5 + 0.5 * Math.sin(x * 0.02 + q * 0.7)) : (rr() - 0.5) * 44;
      const y = 92 + n;
      x ? c.lineTo(18 + x, y) : c.moveTo(18 + x, y);
    }
    c.stroke();
    if (!sig) {
      c.fillStyle = "#7fd8a0"; c.font = "800 44px 'Courier New', monospace"; c.fillText("RAUSCHEN", 18, 140);
      c.font = "700 26px 'Courier New', monospace"; c.fillText("SIGNALE: 0", 18, 196);
    } else {
      const blink = q % 4 < 3;
      c.fillStyle = blink ? "#b8ffcc" : "#4f8a64"; c.font = "800 46px 'Courier New', monospace"; c.fillText("SIGNAL!", 18, 128);
      c.fillStyle = "#f2c26b"; c.font = "800 50px 'Courier New', monospace"; c.fillText("61°S 58°W", 18, 180);
      c.fillStyle = "#7fd8a0"; c.font = "700 24px 'Courier New', monospace"; c.fillText("SIGNALE: 1", 290, 140);
    }
  });
}
const EK = {   // Kamera an der Treppe
  pos: [[CUT_E2, [-0.4, 1.66, -36.2]], [42.6, [-0.2, 1.62, -36.6]], [45.3, [0.2, 1.5, -37.4]], [47.0, [0.36, 1.44, -37.75]], [SIGNAL, [0.4, 1.4, -37.95]], [57.2, [0.42, 1.38, -38.05]], [58.6, [0.42, 1.4, -38.0]], [BLACK, [0.42, 1.4, -38.0]]],
  look: [[CUT_E2, [0.7, 1.2, -40.0]], [42.6, [0.75, 1.0, -40.0]], [45.3, [0.85, 0.9, -39.9]], [47.0, [0.75, 1.0, -39.7]], [SIGNAL, [0.75, 1.0, -39.7]], [57.2, [0.75, 1.02, -39.7]], [58.6, [0.75, 1.1, -39.75]], [BLACK, [0.75, 1.1, -39.75]]],
};
const vk = (keys, t, out) => { for (let a = 0; a < 3; a++) out.setComponent(a, valueAt(keys.map(([kt, v]) => [kt, v[a]]), t)); return out; };
const lookP = new THREE.Vector3();
function renderSquare(t) {
  only("E");
  const second = t >= CUT_E2;
  const breath = Math.sin(t * Math.PI * 2 * 0.24) * 0.006;
  if (!second) {
    const up = smooth(clamp((t - 37.9) / 0.9));
    camera.position.set(-0.4, 1.64 + breath, -26.15);
    lookP.copy(SLOT).lerp(TITLE, up); lookP.y += 0.15 * (1 - up);
    camera.lookAt(lookP);
    camera.fov = lerp(50, 62, up);
  } else {
    vk(EK.pos, t, camera.position); camera.position.y += breath;
    vk(EK.look, t, lookP); camera.lookAt(lookP);
    camera.fov = 62;
  }
  const [sx, sy] = shake(t * 1.1, 0.0045);
  camera.rotateY(sx); camera.rotateX(sy);
  camera.updateProjectionMatrix(); camera.updateMatrixWorld();
  // Nacht, Laternen an, Mondlicht
  const MOON = new THREE.Vector3(0.45, 0.6, 0.65).normalize();
  setShadow(camera.position.x, 0, camera.position.z - 6, MOON, 25, 120);
  sun.intensity = 0.55; sun.color.set("#a8bcff");
  hemi.color.set("#7a8cb8"); hemi.groundColor.set("#2a2420"); hemi.intensity = 0.8;
  setSky("#060c1e", "#22304e", "#0a0e16", MOON, 0.1);
  scene.background = null; sky.visible = true; sky.position.copy(camera.position);
  stars.visible = true; stars.material.opacity = 0.8; stars.position.copy(camera.position);
  scene.fog.color.set("#121a2c"); scene.fog.near = 30; scene.fog.far = 400;
  renderer.toneMappingExposure = 1.4;
  platz.houses.forEach((b, i) => { b.material.emissiveIntensity = 0; });
  platz.lamps.forEach((l) => { l.glowMat.opacity = 1; l.bulbMat.color.set("#ffd59a"); });
  platz.clockMats.forEach((m) => { m.emissiveIntensity = 1.3; });
  platz.towerGlow.material.opacity = 0.8; platz.towerGlow.scale.set(14, 14, 1);
  platz.towerLight.intensity = 4;
  nightLights.forEach((l) => { l.intensity = l.userData.i; });
  // Kreide auf der Tafel
  platz.board.userData.chalk({ ida: clamp((t - 35.8) / 1.8), strike: clamp((t - 38.0) / 0.45), title: clamp((t - 38.55) / 0.9) });
  // Bürgermeisterin schreibt
  const toTitle = smooth(clamp((t - 37.75) / 0.4));
  const writing = (t > 35.7 && t < 37.7) || (t > 37.95 && t < 39.5);
  const wob = writing ? 0.08 * Math.sin(t * 11) : 0;
  const mx = lerp(SLOT.x + 0.85, TITLE.x + 0.75, toTitle), mz = BOARD.z + 0.5;
  const tgt = toTitle > 0.5 ? TITLE : SLOT;
  const ry = Math.atan2(tgt.x - mx, tgt.z - mz);
  mayorF.set(0, { x: mx, z: mz, rotY: ry, armR: lerp(0.75, 2.75, toTitle) + wob, spreadR: 0.05, armL: 0.2, headPitch: lerp(0.35, -0.3, toTitle), visible: true });
  mayorF.commit();
  chain.position.set(mx + Math.sin(ry) * 0.15, 1.48, mz + Math.cos(ry) * 0.15); chain.rotation.y = ry;
  // Ida auf der Rathaustreppe, Rucksack, Funkgerät
  const wave = smooth(clamp((t - 40.6) / 0.4)) * (1 - smooth(clamp((t - 41.9) / 0.4)));
  const take = smooth(clamp((t - 43.0) / 1.3));
  const hold = smooth(clamp((t - 44.1) / 0.5));
  const look = smooth(clamp((t - SIGNAL - 0.5) / 0.6));
  ida.set({ x: IDA_SEAT.x, y: IDA_SEAT.y, z: IDA_SEAT.z, rotY: lerp(0.15, 0.0, hold), sit: true, helmet: "side",
    armR: hold ? lerp(0.6, 1.05, hold) : lerp(0.4, 2.5, wave) + take * 0.6, spreadR: take * (1 - hold) * -0.5, armL: lerp(0.5, 1.05, hold), spreadL: 0.05,
    twist: take * (1 - hold) * -0.5, headPitch: lerp(lerp(-0.12, 0.35, hold), -0.28, look), headYaw: lerp(0.08 * Math.sin(t * 0.6), -0.5, take * (1 - hold)), visible: true });
  bag.position.copy(BAG_P); bag.rotation.y = -0.4;
  bag.userData.flap.rotation.x = -1.9 * smooth(clamp((t - 42.8) / 0.5));
  const rp = tmp.copy(BAG_P).add(new THREE.Vector3(0, 0.38, 0)).lerp(RADIO_LAP, take);
  radio.position.copy(rp); radio.rotation.set(lerp(0, -0.55, take), lerp(-0.4, 0, take), 0);
  radio.visible = t > 43.0;
  drawRadio(t);
  // deine Hand mit der Teetasse
  const down = smooth(clamp((t - 45.0) / 0.6));
  hands({ right: down < 0.98 ? "mug" : null });
  rightHand.position.set(0.17, -0.36 - down * 0.3, -0.6); rightHand.rotation.set(0.15, 0.3, 1.25); rightHand.userData.curl(0.95);
  mug.position.set(0.125, -0.31 - down * 0.3, -0.63); mug.rotation.set(0.05, -0.6, -0.04);
  rig.position.set(0, 0, 0);
  const flash = t >= SIGNAL ? Math.exp(-(t - SIGNAL) * 3) * 0.25 : 0;
  canvas.style.filter = `saturate(1.05) contrast(1.04) brightness(${1 + flash})`;
  return second ? smooth((t - CUT_E2) / 0.14) : smooth((t - CUT_E) / 0.14);
}

// ================================================================= Frame ===
function renderAt(t) {
  t = clamp(t, 0, DURATION);
  overlay.update(t);
  // Szene-spezifische Objekte zurücksetzen
  ida.group.visible = false; radio.visible = false; bag.visible = false;
  mayorF.group.visible = true; chain.visible = true;
  nightLights.forEach((l) => { l.intensity = 0; });
  platz.board.userData.chalk({});
  let k;
  if (t < CUT_B) { k = renderHall(t); ida.group.visible = true; }
  else if (t < CUT_C) k = renderISS(t);
  else if (t < CUT_D) k = renderCoast(t);
  else if (t < CUT_E) { mayorF.group.visible = false; chain.visible = false; k = renderRoad(t); }
  else { k = renderSquare(t); ida.group.visible = t >= CUT_E2; bag.visible = t >= CUT_E2; radio.visible = radio.visible && t >= CUT_E2; }
  if (t >= BLACK) k = 0;
  canvas.style.opacity = clamp(k);
  renderer.render(scene, camera);
}

window.addEventListener("hf-seek", (e) => renderAt(e.detail.time));
renderAt(window.__hfThreeTime || 0);
