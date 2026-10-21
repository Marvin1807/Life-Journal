// "Was wäre, wenn nur noch 100 Menschen übrig wären?" – 61 s, Nachbildung eines Referenzvideos (Erzählform statt Countdown).
// Vier Orte, jeder genau einmal: Rathausplatz (Tag 1) → Penthouse über einer Skyline wie Frankfurt (Tag 3) →
// das letzte Klassenzimmer (Tag 20) → Festsaal im Rathaus (Tag 30): Sonntagsessen, Zählung, 101, die Tür.
// POV auf Augenhöhe, deine Hände halten Handy, Tasse, Papierflieger, Gabel und Glas.
import { THREE, rng, clamp, smooth, lerp, shake, createSky, cameraPath, valueAt } from "./lib/lowpoly.js";
import { hand, phone, phoneScreen, mat, box, cyl } from "./lib/props.js";
import { createOverlay, de, curve } from "./lib/ww-overlay.js";
import { folk, rathausplatz, penthouse, classroom, festsaal, BOARD, PENT_Y, DOOR_Z, HEAD_Z, TABLE } from "./sets.js";

const DURATION = 61;
const CUT_A2 = 8.0;     // Gegenschuss auf dem Platz (Mama kommt)
const CUT_B = 12.0;     // Penthouse
const CUT_C = 23.0;     // Klassenzimmer
const CUT_D = 35.0;     // Festsaal
const COUNT0 = 45.3;    // Bürgermeisterin zählt
const EXTRA = 53.0;     // 101
const TURN = 55.0;      // alle drehen sich um
const BLACK = 59.9;
const END = 60.15;

const SCENES = [
  { name: "Rathausplatz mit Backstein-Rathaus und Namensliste", set: "rathausplatz" },
  { name: "Penthouse über der Skyline am Main", set: "penthouse" },
  { name: "Das letzte Klassenzimmer der Welt", set: "klassenzimmer" },
  { name: "Festsaal im Rathaus, Sonntagsessen", set: "festsaal" },
];

// --------------------------------------------------------------- Overlay ---
const COUNT = [[COUNT0, 1], [46.3, 1.9], [47.3, 3.9], [48.3, 18.9], [49.3, 44.9], [50.2, 71.9], [50.9, 92.9], [51.3, 97.9], [51.9, 98.9], [52.5, 99.9], [52.9, 100.9]];
const headcount = (t) => String(Math.min(100, Math.max(1, Math.floor(curve(COUNT, t)))));
const overlay = createOverlay(document.getElementById("overlay"), {
  title: { text: "Was wäre, wenn nur noch 100 Menschen übrig wären?", accent: "100", accentColor: "#f2c26b", start: 0, end: 3.0 },
  hud: [
    { start: 0, end: CUT_B - 0.1, label: "Menschen auf der Erde", value: () => "100", sub: "Tag 1 · Rathaus", fadeIn: 0.3, fadeOut: 0.3 },
    { start: CUT_B + 0.1, end: CUT_C - 0.1, label: "Menschen auf der Erde", value: () => "100", sub: `Tag 3 · Leere Wohnungen: ${de(2000000000)}`, fadeIn: 0.25, fadeOut: 0.3 },
    { start: CUT_C + 0.1, end: CUT_D - 0.1, label: "Kinder auf der Erde", value: () => "9", sub: "Tag 20 · 1 Klassenzimmer", fadeIn: 0.25, fadeOut: 0.3 },
    { start: CUT_D + 0.1, end: COUNT0, label: "Menschen auf der Erde", value: () => "100", sub: "Tag 30 · Sonntagsessen", fadeIn: 0.25, fadeOut: 0.01 },
    { start: COUNT0, end: EXTRA, label: "Gezählt", value: headcount, sub: "Tag 30 · Sonntagsessen", fadeIn: 0.01, fadeOut: 0.01 },
    { start: EXTRA, end: BLACK, label: "Gezählt", value: () => "101", sub: "Tag 30 · Einer zu viel", fadeIn: 0.01, fadeOut: 0.2 },
  ],
  subtitles: [
    { start: 3.1, end: 4.9, text: "Tag 1." },
    { start: 5.1, end: 7.9, text: "Alle Übrigen treffen sich im Rathaus." },
    { start: 8.15, end: 9.9, text: "Dein Name steht auf der Liste." },
    { start: 10.1, end: 11.8, text: "Der von deiner Mama auch." },
    { start: 12.3, end: 14.0, text: "Tag 3." },
    { start: 14.2, end: 16.9, text: "Es gibt 2 Milliarden leere Wohnungen." },
    { start: 17.1, end: 19.4, text: "Also nimmst du dir ein Penthouse." },
    { start: 19.6, end: 22.4, text: "Die ganze Stadt ist dein Garten." },
    { start: 23.2, end: 25.0, text: "Tag 20." },
    { start: 25.2, end: 27.9, text: "Nur noch 9 Kinder sind übrig." },
    { start: 28.1, end: 30.6, text: "Eine Klasse. Jedes Alter." },
    { start: 30.8, end: 34.2, text: "Dein Lehrer war früher Pilot." },
    { start: 35.3, end: 37.0, text: "Tag 30." },
    { start: 37.2, end: 40.4, text: "Jeden Sonntag essen alle 100 zusammen." },
    { start: 40.6, end: 42.9, text: "Du kennst jeden einzelnen Namen." },
    { start: 43.1, end: 45.2, text: "Alle sind jetzt Familie." },
    { start: 45.4, end: 50.4, text: "Dann zählt die Bürgermeisterin alle. Wie immer." },
    { start: 50.6, end: 52.9, text: "98 … 99 … 100 …" },
    { start: 53.1, end: 54.9, text: "101?" },
    { start: 55.1, end: 57.2, text: "Alle drehen sich um." },
    { start: 57.4, end: 59.8, text: "Niemand hat sie je zuvor gesehen." },
  ],
  black: { start: BLACK, end: END },
  endcard: { start: END, end: DURATION, lines: [
    "Teil 2?",
    "Wer ist die Nummer 101? Schreib es in die Kommentare",
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
const camera = new THREE.PerspectiveCamera(62, 1080 / 1920, 0.03, 5000);
scene.add(camera);
const sky = createSky(4000); scene.add(sky);
const SU = sky.material.uniforms;
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

// ================================================================= Sets ===
const platz = rathausplatz(); scene.add(platz.group);
const pent = penthouse(); scene.add(pent.group);
const klasse = classroom(); scene.add(klasse.group);
const saal = festsaal(); scene.add(saal.group);
const SETS = { A: platz.group, B: pent.group, C: klasse.group, D: saal.group };
function only(k) { for (const [n, g] of Object.entries(SETS)) g.visible = n === k; }

const tmp = new THREE.Vector3(), tmp2 = new THREE.Vector3(), eu = new THREE.Euler(0, 0, 0, "YXZ");
const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));
const R = rng(100);

// ============================================================ Hände (POV) ===
const SLEEVE = "#6b4a3a";
const rig = new THREE.Group(); camera.add(rig);
const rightHand = hand(1, SLEEVE); rig.add(rightHand);
const leftHand = hand(-1, SLEEVE); rig.add(leftHand);
const handy = phone(); rig.add(handy);
handy.userData.screen.redraw((c, w, h) => {
  phoneScreen(c, w, h, { time: "11:56", title: "Rathaus", accent: "#f2c26b", bg: "#14171d", battery: 71,
    lines: ["Treffen um 12 Uhr", "", "Mama:", "Bin schon da!"] });
});
// Tasse (Penthouse)
const mug = new THREE.Group(); rig.add(mug);
cyl(0.04, 0.036, 0.095, 12, mat("#e9e2d4", { roughness: 0.4 }), 0, 0, 0, mug);
cyl(0.036, 0.036, 0.005, 12, mat("#4a2e1c", { roughness: 0.2 }), 0, 0.044, 0, mug);
const handle = new THREE.Mesh(new THREE.TorusGeometry(0.024, 0.007, 6, 10, Math.PI), mat("#e9e2d4")); handle.position.set(0.04, 0, 0); handle.rotation.z = -Math.PI / 2; mug.add(handle);
// Papierflieger (Klassenzimmer)
const paperPlane = new THREE.Group(); rig.add(paperPlane);
{
  const paper = new THREE.MeshStandardMaterial({ color: "#f6f3ea", roughness: 0.8, side: THREE.DoubleSide, flatShading: true });
  for (const s of [-1, 1]) {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute([0, 0, -0.11, 0, -0.012, 0.07, s * 0.06, 0.008, 0.07], 3));
    geo.computeVertexNormals();
    paperPlane.add(new THREE.Mesh(geo, paper));
  }
}
// Gabel und Glas (Festsaal)
const fork = new THREE.Group(); rig.add(fork);
box(0.012, 0.004, 0.13, mat("#c8c8c4", { metalness: 0.8, roughness: 0.3 }), 0, 0, 0, fork);
for (let i = 0; i < 4; i++) box(0.003, 0.003, 0.04, mat("#c8c8c4", { metalness: 0.8, roughness: 0.3 }), -0.0075 + i * 0.005, 0, -0.08, fork);
const wine = new THREE.Group(); rig.add(wine);
cyl(0.035, 0.022, 0.075, 10, new THREE.MeshStandardMaterial({ color: "#d9e2e4", transparent: true, opacity: 0.35, roughness: 0.05 }), 0, 0.06, 0, wine);
cyl(0.031, 0.02, 0.04, 10, mat("#7a1a22", { roughness: 0.2 }), 0, 0.045, 0, wine);
cyl(0.004, 0.004, 0.06, 6, mat("#d9e2e4"), 0, -0.01, 0, wine);
cyl(0.028, 0.028, 0.004, 10, mat("#d9e2e4"), 0, -0.04, 0, wine);
function hands(o = {}) {
  rightHand.visible = !!o.right; leftHand.visible = !!o.left;
  handy.visible = o.left === "phone"; mug.visible = o.right === "mug";
  paperPlane.visible = o.right === "plane"; fork.visible = o.right === "fork"; wine.visible = o.left === "glass";
}

// ======================================================== A: Rathausplatz ===
const NA = 64;
const street = folk(NA, 31); platz.group.add(street.group);
const MOM_LOOK = { shirt: "#c98b3a", pants: "#3b3f48", hair: "#7a5232", skin: "#f1c8a5", long: 1.15 };
street.look(0, MOM_LOOK);
const camA = cameraPath([
  { t: 0, pos: [-4.6, 1.65, -2], look: [-9.5, 9.5, -44] },
  { t: 3.0, pos: [-3.6, 1.65, -8.5], look: [-6.5, 6.0, -44] },
  { t: 4.7, pos: [-1.6, 1.66, -19.5], look: [-1.5, 2.2, -29.2] },
  { t: 6.3, pos: [-0.5, 1.67, -25.6], look: [-0.4, 1.8, -29.2] },
  { t: 7.6, pos: [-0.2, 1.68, -27.45], look: [-0.2, 1.62, -29.2] },
  { t: 8.0, pos: [-0.2, 1.68, -27.55], look: [-0.2, 1.62, -29.2] },
]);
const CAM_A2 = new THREE.Vector3(-0.6, 1.66, -27.0);
const camPosA = new THREE.Vector3(), camLookA = new THREE.Vector3();
function camAAt(t, out) { if (t < CUT_A2) { camA(t, out, camLookA); } else out.copy(CAM_A2); return out; }
// Passanten: queren den Platz, ein paar lesen die Liste
const PA = [];
for (let i = 1; i < NA; i++) {
  const k = R();
  if (i < 6) {   // vor der Tafel
    const x = [-3.9, -3.1, 1.9, 2.6, -4.6][i - 1];
    PA.push({ kind: "read", x, z: -27.5 - R.range(0, 0.6), dir: Math.PI + R.range(-0.3, 0.3), v: 0, ph: R() * 6 });
    continue;
  }
  const along = k < 0.3;
  const dir = along ? (R() < 0.5 ? 0 : Math.PI) + R.range(-0.2, 0.2) : (R() < 0.5 ? Math.PI / 2 : -Math.PI / 2) + R.range(-0.15, 0.15);
  PA.push({ kind: R() < 0.85 ? "walk" : "stand", x: R.range(-24, 24), z: along ? R.range(-38, 18) : R.range(-36, 14), dir, v: R.range(0.9, 1.4), ph: R() * 6.28 });
}
// Niemand läuft durch die Kamera: Startpunkte verschieben, bis der Abstand überall > 2,2 m ist
for (const p of PA) {
  if (p.kind === "read") continue;
  for (let tries = 0; tries < 12; tries++) {
    let ok = true;
    for (let t = 0; t <= 12; t += 0.1) {
      camAAt(t, tmp);
      const x = p.x + Math.sin(p.dir) * p.v * t, z = p.z + Math.cos(p.dir) * p.v * t;
      if (Math.hypot(x - tmp.x, z - tmp.z) < 2.2) { ok = false; break; }
      if (t > 8 && Math.abs(x - (-0.6)) < 3 && z > -27 && z < -22) { ok = false; break; }   // Mamas Weg frei halten
    }
    if (ok) break;
    p.x += 4.3; if (p.x > 26) p.x -= 50;
  }
}
const MOM = { x0: 3.4, z0: -15.5, x1: -0.45, z1: -24.6, t0: 8.0, t1: 10.0 };
function renderStreet(t) {
  only("A");
  const second = t >= CUT_A2;
  // Kamera
  camAAt(t, camPosA);
  const walk = t < 7.6 ? 1 : 0;
  const bob = Math.sin(t * Math.PI * 2 * 0.95) * 0.022 * walk * (t < 3.2 ? 1 : 0.5);
  if (!second) {
    camera.position.copy(camPosA); camera.position.y += bob;
    camera.lookAt(camLookA);
    const [sx, sy] = shake(t * 1.1, 0.005);
    camera.rotateY(sx); camera.rotateX(sy);
  } else {
    const breath = Math.sin(t * Math.PI * 2 * 0.24) * 0.006;
    camera.position.copy(CAM_A2); camera.position.y += breath;
    const u = smooth((t - CUT_A2) / 3.0);
    eu.set(lerp(0.02, -0.02, u), Math.PI + lerp(0.1, 0.02, u), 0);
    const [sx, sy] = shake(t * 1.1, 0.005);
    eu.x += sy; eu.y += sx;
    camera.quaternion.setFromEuler(eu);
  }
  camera.fov = 62; camera.updateProjectionMatrix();
  camera.updateMatrixWorld();
  // Licht: Herbstnachmittag, tiefe Sonne von der Seite
  const SUN_DIR = second ? new THREE.Vector3(0.62, 0.5, -0.6).normalize() : new THREE.Vector3(0.78, 0.48, 0.4).normalize();
  setShadow(camera.position.x, 0, camera.position.z - (second ? -10 : 14), SUN_DIR, 45, 150);
  sun.color.set("#ffcf98"); sun.intensity = 2.7;
  hemi.color.set("#ffe9d0"); hemi.groundColor.set("#8a6e58"); hemi.intensity = 1.15;
  SU.top.value.set("#6f93c4"); SU.horizon.value.set("#f2c995"); SU.bottom.value.set("#7a6a5a");
  SU.sunDir.value.copy(SUN_DIR); SU.sunGlow.value = 0.55;
  scene.fog.color.set("#ecd2ad"); scene.fog.near = 90; scene.fog.far = 700;
  scene.background = null; sky.visible = true; sky.position.copy(camera.position);
  renderer.toneMappingExposure = 1.05;
  // Menschen
  PA.forEach((p, j) => {
    const i = j + 1;
    if (p.kind === "read") {
      street.set(i, { x: p.x, z: p.z, rotY: p.dir, headPitch: 0.12 + 0.04 * Math.sin(t * 0.7 + p.ph), headYaw: 0.15 * Math.sin(t * 0.5 + p.ph), armR: j === 2 ? 1.2 : 0.1, armL: 0.1, visible: true });
      return;
    }
    const w = p.kind === "walk";
    const x = p.x + (w ? Math.sin(p.dir) * p.v * t : 0), z = p.z + (w ? Math.cos(p.dir) * p.v * t : 0);
    street.set(i, { x, z, rotY: p.dir, swing: w ? Math.sin(t * p.v * 4.2 + p.ph) * 0.5 : 0, armL: w ? 0 : 0.15, headYaw: w ? 0 : 0.3 * Math.sin(t * 0.4 + p.ph), visible: true });
  });
  // Mama: kommt nach dem Gegenschuss auf dich zu, bleibt stehen, winkt, lächelt
  const mu = smooth(clamp((t - MOM.t0) / (MOM.t1 - MOM.t0)));
  const mx = lerp(MOM.x0, MOM.x1, mu), mz = lerp(MOM.z0, MOM.z1, mu);
  const moving = t > MOM.t0 && t < MOM.t1 + 0.2;
  const wave = smooth(clamp((t - 9.7) / 0.5));
  street.set(0, { x: mx, z: mz, rotY: Math.atan2(CAM_A2.x - mx, CAM_A2.z - mz), swing: moving ? Math.sin(t * 5.2) * 0.45 * (1 - mu * 0.8) : 0,
    armR: lerp(0, 2.55 + 0.18 * Math.sin(t * 9), wave), spreadR: 0.35 * wave, armL: 0.15, headTilt: 0.06 * wave, headPitch: -0.05, visible: second });
  street.commit();
  // Hände: links das Handy mit der Nachricht, dann runter; im Gegenschuss winkt die rechte Hand zurück
  const lower = smooth(clamp((t - 3.3) / 0.9));
  if (!second) {
    hands({ left: lower < 0.98 ? "phone" : null });
    leftHand.position.set(-0.11, -0.29 - lower * 0.25, -0.47); leftHand.rotation.set(-0.12, 0.1, -0.15); leftHand.userData.curl(0.45);
    handy.position.set(-0.103, -0.222 - lower * 0.25, -0.495); handy.rotation.set(-0.55, 0.14, 0.05);
  } else {
    const up = smooth(clamp((t - 10.0) / 0.5));
    hands({ right: up > 0.02 ? "wave" : null });
    rightHand.position.set(0.2, lerp(-0.55, -0.24, up), -0.66); rightHand.rotation.set(lerp(0.2, 1.35, up), 0.1, 0.1 * Math.sin(t * 9) * up); rightHand.userData.curl(0.08);
  }
  rig.position.set(0, -bob * 0.4, 0);
  canvas.style.filter = "saturate(1.06) contrast(1.03)";
  return second ? smooth((t - CUT_A2) / 0.14) : 1;
}

// ========================================================== B: Penthouse ===
const PY = PENT_Y;
const PK = { // Zeit → [x, z, yaw, pitch]
  x: [[CUT_B, -0.9], [15.0, -0.4], [17.0, 0.6], [19.4, 1.7], [22.5, 1.75]],
  z: [[CUT_B, 3.7], [15.0, 3.2], [17.0, 1.2], [19.4, -6.4], [22.5, -6.6]],
  yaw: [[CUT_B, 0.42], [15.0, 0.12], [17.0, -0.62], [18.4, -0.32], [19.6, 0.05], [22.5, 0.32]],
  pitch: [[CUT_B, -0.06], [15.0, -0.04], [17.0, -0.03], [19.4, -0.05], [21.0, -0.3], [22.5, -0.33]],
};
function renderPenthouse(t) {
  only("B");
  const walking = t > 17 && t < 19.5 ? 1 : 0;
  const bob = Math.sin(t * Math.PI * 2 * 0.9) * 0.018 * walking;
  camera.position.set(valueAt(PK.x, t), PY + 1.65 + bob, valueAt(PK.z, t));
  const [sx, sy] = shake(t * 1.1, 0.005);
  eu.set(valueAt(PK.pitch, t) + sy, valueAt(PK.yaw, t) + sx, 0.003 * Math.sin(t * 0.5));
  camera.quaternion.setFromEuler(eu);
  camera.fov = 62; camera.updateProjectionMatrix(); camera.updateMatrixWorld();
  // Abendlicht: tiefe Sonne von links (Westen), warmer Himmel
  const SUN_DIR = new THREE.Vector3(-0.8, 0.18, 0.45).normalize();
  setShadow(0, PY, -1, SUN_DIR, 14, 80);
  sun.color.set("#ffae6a"); sun.intensity = 2.4;
  hemi.color.set("#ffd2b0"); hemi.groundColor.set("#6a5450"); hemi.intensity = 1.0;
  SU.top.value.set("#4f5f8e"); SU.horizon.value.set("#f4a66a"); SU.bottom.value.set("#5a4a48");
  SU.sunDir.value.copy(SUN_DIR); SU.sunGlow.value = 1.0;
  scene.fog.color.set("#e8a978"); scene.fog.near = 260; scene.fog.far = 2300;
  scene.background = null; sky.visible = true; sky.position.copy(camera.position);
  renderer.toneMappingExposure = 1.08;
  // Leere Stadt: nur ganz wenige Fenster brennen
  pent.towers.forEach((m, i) => { m.emissiveIntensity = 0.12 + (i % 4 === 0 ? 0.12 : 0); });
  pent.lampMat.emissiveIntensity = 1.2; pent.pl.intensity = 5;
  // Hände: rechte Hand mit Tasse
  hands({ right: "mug" });
  rightHand.position.set(0.15, -0.29, -0.58); rightHand.rotation.set(0.15, 0.3, 1.25); rightHand.userData.curl(0.95);
  mug.position.set(0.105, -0.24, -0.61); mug.rotation.set(0.05, -0.6, -0.04);
  rig.position.set(0, -bob * 0.4, 0);
  canvas.style.filter = "saturate(1.05) contrast(1.03)";
  return smooth((t - CUT_B) / 0.14) * (1 - smooth((t - 22.25) / 0.6));
}

// ======================================================= C: Klassenzimmer ===
const kids = folk(10, 77); klasse.group.add(kids.group);
const TEACHER = 9;
kids.look(TEACHER, { shirt: "#7a5a3e", pants: "#3b3f48", hair: "#cfcfc8", skin: "#f1c8a5", long: 0, beard: 1, beardColor: "#d8d8d2" });
const KID_HAIR = ["#a8552e", "#2a1e17", "#c9a16a", "#4a3222", "#1a1a1a", "#7a5232", "#c9a16a", "#2a1e17", "#4a3222"];
const KID_SHIRT = ["#d9a03a", "#3f6a8a", "#b5522a", "#5d6b3a", "#c8402a", "#7a2e3e", "#e0b25b", "#2f4a44", "#9a6a3e"];
for (let i = 0; i < 9; i++) kids.look(i, { hair: KID_HAIR[i], shirt: KID_SHIRT[i], long: i % 3 === 0 ? 0.9 : i % 3 === 1 ? 0 : 0.6 });
const KID_SCALE = [0.8, 0.95, 1.0, 0.86, 0.66, 0.9, 0.84, 0.72, 0.98];
const RAISER = 5;
const CC = { // Klassenzimmer-Kamera
  yaw: [[CUT_C, 0.06], [26, -0.04], [28.6, 0.03], [30.8, 0.0], [31.8, -0.49], [32.7, -0.48], [33.7, 1.05], [35, 1.1]],
  pitch: [[CUT_C, -0.07], [28.6, -0.08], [30.8, -0.08], [31.8, -0.098], [32.7, -0.098], [33.7, 0.02], [35, 0.02]],
  fov: [[CUT_C, 62], [30.8, 62], [31.8, 30], [32.7, 30], [33.7, 62]],
};
function renderClassroom(t) {
  only("C");
  const breath = Math.sin(t * Math.PI * 2 * 0.24) * 0.005;
  camera.position.set(-0.35, 1.7 + breath, 3.3);
  const [sx, sy] = shake(t * 1.1, 0.005);
  eu.set(valueAt(CC.pitch, t) + sy, valueAt(CC.yaw, t) + sx, 0);
  camera.quaternion.setFromEuler(eu);
  camera.fov = valueAt(CC.fov, t); camera.updateProjectionMatrix(); camera.updateMatrixWorld();
  // Licht: heller Vormittag, Sonne durch die Fenster links
  const SUN_DIR = new THREE.Vector3(-0.8, 0.55, 0.25).normalize();
  setShadow(0, 1, -1, SUN_DIR, 7, 30);
  sun.color.set("#fff0d8"); sun.intensity = 1.2;
  hemi.color.set("#fff4e4"); hemi.groundColor.set("#a08060"); hemi.intensity = 1.8;
  scene.background = new THREE.Color("#f4ead8"); sky.visible = false; scene.fog.near = 50; scene.fog.far = 200;
  const glare = smooth(clamp((t - 32.8) / 1.2));
  klasse.winMats.forEach((m) => { m.emissiveIntensity = 1.0 + glare * 1.6; });
  renderer.toneMappingExposure = 1.1 + glare * 0.25;
  // Kinder
  klasse.deskSpots.forEach((d, i) => {
    const raise = i === RAISER ? smooth(clamp((t - 28.2) / 0.5)) * (1 - smooth(clamp((t - 30.5) / 0.4))) : 0;
    kids.set(i, { x: d.x, z: d.z, rotY: Math.PI, sit: true, scale: KID_SCALE[i], headScale: 1.12,
      armL: 0.95, armR: lerp(0.95 + 0.06 * Math.sin(t * 2 + i), 2.95, raise), spreadR: 0.08 * raise,
      headYaw: 0.18 * Math.sin(t * 0.6 + i * 1.7), headPitch: 0.05 + 0.08 * Math.sin(t * 0.8 + i), visible: true });
  });
  // Lehrer: schreibt an die Tafel, dreht sich dann lächelnd zur Klasse
  const turn = smooth(clamp((t - 25.6) / 1.0));
  const write = 1 - turn;
  kids.set(TEACHER, { x: -1.15, z: -4.25, rotY: lerp(Math.PI, 0.35, turn), armR: lerp(2.25 + 0.12 * Math.sin(t * 6), 0.2, turn), spreadR: 0.1 * write,
    armL: lerp(0.2, 0.9 + 0.1 * Math.sin(t * 1.3), turn), headPitch: lerp(-0.05, 0.05, turn), headYaw: 0.1 * Math.sin(t * 0.7) * turn, scale: 0.98, visible: true });
  kids.commit();
  // Hände: rechts der Papierflieger, links flach auf dem Tisch
  hands({ right: "plane" });
  rightHand.position.set(0.14, -0.3, -0.56); rightHand.rotation.set(0.5, 0.15, 1.3); rightHand.userData.curl(0.85);
  paperPlane.position.set(0.12, -0.25, -0.64); paperPlane.rotation.set(0.25, 0.25, -0.15);
  leftHand.position.set(-0.17, -0.42, -0.5); leftHand.rotation.set(0.45, -0.25, 0); leftHand.userData.curl(0.25);
  rig.position.set(0, 0, 0);
  canvas.style.filter = `saturate(1.04) contrast(1.02) brightness(${1 + glare * 0.08})`;
  return smooth((t - CUT_C) / 0.14) * (1 - smooth((t - 34.0) / 0.75));
}

// ============================================================ D: Festsaal ===
const CAM_SEAT = 6, MOM_SEAT = 49 + 6;   // du links, Mama gegenüber
const diners = folk(98, 404); saal.group.add(diners.group);
const DS = [];   // [seat, folk-Index]
let fi = 0;
saal.seats.forEach((st, i) => { if (i === CAM_SEAT) return; DS.push({ ...st, idx: fi++, ph: R() * 6.28, rate: R.range(0.8, 1.4), t0: TURN + R.range(0.0, 0.75), mom: i === MOM_SEAT }); });
// einer am Fußende (rechte Ecke)
DS.push({ x: 0.62, z: TABLE.z0 + 0.35, side: 0, idx: fi++, ph: 1, rate: 1, t0: TURN + 0.2, foot: true });
const hallFolk = folk(2, 505); saal.group.add(hallFolk.group);
hallFolk.look(0, { shirt: "#7a1f2a", pants: "#2c2a28", hair: "#d8d4cc", skin: "#e8b896", long: 0.55 });
hallFolk.look(1, { dark: true, long: 1.25 });
const momDiner = DS.find((d) => d.mom);
diners.look(momDiner.idx, MOM_LOOK);
// Amtskette der Bürgermeisterin
const chain = new THREE.Group(); saal.group.add(chain);
const gold = mat("#d4ad4a", { metalness: 0.7, roughness: 0.3 });
for (let k = 0; k < 9; k++) { const a = -1.1 + (k / 8) * 2.2; box(0.035, 0.035, 0.02, gold, Math.sin(a) * 0.17, -0.02 - 0.12 * Math.cos(a * 1.3), 0, chain); }
cyl(0.045, 0.045, 0.012, 10, gold, 0, -0.17, 0.0, chain).rotation.x = Math.PI / 2;
const CAM_D = new THREE.Vector3(-1.0, 1.22, saal.seats[CAM_SEAT].z);
const MAYOR_P = new THREE.Vector3(0, 0.4, HEAD_Z - 0.15);
const yawTo = (from, x, z) => Math.atan2(-(x - from.x), -(z - from.z));   // Kamera-Yaw zu einem Punkt
const YAW_MAYOR = yawTo(CAM_D, 0, HEAD_Z);
const YAW_DOOR = yawTo(CAM_D, 0, DOOR_Z);
const YAW_MOM = yawTo(CAM_D, momDiner.x, momDiner.z);
const DK = {
  yaw: [[CUT_D, -0.95], [37.0, -0.62], [37.6, -0.42], [40.2, -0.18], [41.0, -0.95], [42.9, -0.8], [43.5, YAW_MOM - 0.02], [45.0, YAW_MOM - 0.06],
        [46.2, YAW_MAYOR], [TURN, YAW_MAYOR], [57.2, YAW_DOOR], [BLACK, YAW_DOOR]],
  pitch: [[CUT_D, -0.14], [37.0, -0.08], [37.6, 0.12], [39.6, 0.3], [40.4, 0.08], [41.0, -0.1], [42.9, -0.08], [43.5, -0.02], [45.0, -0.02],
          [46.2, 0.03], [TURN, 0.03], [57.2, 0.03], [BLACK, 0.04]],
  fov: [[CUT_D, 62], [45.3, 62], [47.2, 30], [TURN, 30], [56.8, 58], [57.6, 58], [BLACK, 50]],
};
function renderHall(t) {
  only("D");
  const breath = Math.sin(t * Math.PI * 2 * 0.24) * 0.005;
  camera.position.copy(CAM_D); camera.position.y += breath;
  const [sx, sy] = shake(t * 1.1, 0.0045);
  eu.set(valueAt(DK.pitch, t) + sy, valueAt(DK.yaw, t) + sx, 0);
  camera.quaternion.setFromEuler(eu);
  camera.fov = valueAt(DK.fov, t); camera.updateProjectionMatrix(); camera.updateMatrixWorld();
  // Licht: Kerzen und Kronleuchter, warm
  scene.background = new THREE.Color("#1a120c"); sky.visible = false;
  scene.fog.color.set("#2a1c12"); scene.fog.near = 14; scene.fog.far = 70;
  sun.intensity = 0; hemi.color.set("#ffd2a0"); hemi.groundColor.set("#3a2414"); hemi.intensity = 0.85;
  const door = smooth(clamp((t - (TURN + 0.35)) / 1.3));
  const hush = smooth(clamp((t - EXTRA) / 0.6));   // bei 101 wird es still – die Kerzen flackern weniger
  saal.chand.forEach((c, i) => { c.light.intensity = 10 * (1 + 0.03 * Math.sin(t * 7 + i)) * (1 - 0.15 * door); });
  saal.candles.forEach((f, i) => { const fl = 1 + (0.12 - 0.07 * hush) * Math.sin(t * (9 + (i % 5)) + i); f.scale.set(0.16 * fl, 0.24 * fl, 1); });
  renderer.toneMappingExposure = 1.35 + 0.15 * door;
  // Tür
  saal.leaves.forEach((h, k) => { h.rotation.y = (k ? -1 : 1) * 1.45 * door; });
  saal.glare.visible = door > 0.01;
  saal.glow.material.opacity = 0.95 * door; saal.floorGlow.material.opacity = 0.8 * door;
  saal.doorLight.intensity = 60 * door;
  // Gäste: essen, lächeln; zum Satz „Du kennst jeden Namen“ schauen die Nahen zu dir; ab TURN drehen sich alle zur Tür
  const look = smooth(clamp((t - 40.7) / 0.6)) * (1 - smooth(clamp((t - 43.0) / 0.6)));
  const attention = smooth(clamp((t - COUNT0 - 0.4) / 1.2));   // während der Zählung schauen alle nach vorn
  DS.forEach((d) => {
    const rotY = d.foot ? Math.PI : d.side < 0 ? Math.PI / 2 : -Math.PI / 2;
    const eat = (1 - attention) * Math.max(0, Math.sin(t * d.rate * 1.3 + d.ph));
    const toCam = clamp(wrap(Math.atan2(CAM_D.x - d.x, CAM_D.z - d.z) - rotY), -1.1, 1.1);
    const toHead = clamp(wrap(Math.atan2(0 - d.x, HEAD_Z - d.z) - rotY), -1.2, 1.2);
    const toDoor = wrap(Math.atan2(0 - d.x, DOOR_Z + 0.4 - d.z) - rotY);
    const near = Math.hypot(d.x - CAM_D.x, d.z - CAM_D.z) < 5 ? 1 : 0;
    const k = smooth(clamp((t - d.t0) / 0.9));
    const momTurn = d.mom ? smooth(clamp((t - 43.2) / 0.6)) * (1 - attention) : 0;
    let headYaw = 0.25 * Math.sin(t * 0.5 + d.ph) * (1 - attention);
    headYaw = lerp(headYaw, toCam * 0.8, Math.max(look * near, momTurn));
    headYaw = lerp(headYaw, toHead * 0.6, attention);
    let twist = lerp(0, toCam * 0.45, momTurn) + lerp(0, toHead * 0.35, attention);
    const tw = clamp(toDoor * 0.62, -1.15, 1.15);
    twist = lerp(twist, tw, k); headYaw = lerp(headYaw, clamp(toDoor - tw, -0.9, 0.9), k);
    diners.set(d.idx, { x: d.x, z: d.z, rotY, sit: true, twist, headYaw, headPitch: 0.04 * Math.sin(t + d.ph),
      armR: lerp(0.95 + 0.5 * eat, 0.35, k) + (d.mom ? 0.6 * momTurn : 0), armL: lerp(0.85, 0.3, k), visible: true });
  });
  // Bürgermeisterin am Pult: zeigt beim Zählen über die Tafel
  const counting = t > COUNT0 + 0.3 && t < EXTRA;
  const sweep = counting ? Math.sin((t - COUNT0) * 1.6) * 0.45 : 0;
  const point = smooth(clamp((t - COUNT0 - 0.3) / 0.5)) * (1 - smooth(clamp((t - EXTRA) / 0.5)));
  const stop = smooth(clamp((t - EXTRA) / 0.4));
  hallFolk.set(0, { x: MAYOR_P.x, y: MAYOR_P.y, z: MAYOR_P.z, rotY: 0, twist: sweep * 0.6, headYaw: sweep * 0.5 - 0.05 * stop, headPitch: 0.12 * stop,
    armR: lerp(0.4, 1.35, point), spreadR: -0.15 * point, armL: 0.75, visible: true });
  chain.position.set(MAYOR_P.x, MAYOR_P.y + 1.48, MAYOR_P.z + 0.15); chain.rotation.y = sweep * 0.6;
  // Die Unbekannte in der Tür (Silhouette)
  hallFolk.set(1, { x: 0, z: DOOR_Z + 0.3, rotY: Math.PI, armL: 0.02, armR: 0.02, visible: door > 0.05 });
  diners.commit(); hallFolk.commit();
  // Hände: Gabel und Glas, beim Zählen und an der Tür nicht im Bild
  const handsDown = smooth(clamp((t - 45.0) / 0.6));
  hands({ right: handsDown < 0.98 ? "fork" : null, left: handsDown < 0.98 ? "glass" : null });
  const lift = smooth(clamp((t - 43.4) / 0.6)) * (1 - handsDown);   // Glas heben bei „Familie“
  rightHand.position.set(0.14, -0.33 - handsDown * 0.3, -0.52); rightHand.rotation.set(0.55, 0.2, 1.2); rightHand.userData.curl(0.8);
  fork.position.set(0.1, -0.28 - handsDown * 0.3, -0.62); fork.rotation.set(0.6, 0.35, -0.2);
  leftHand.position.set(-0.13, -0.3 + lift * 0.08 - handsDown * 0.3, -0.5); leftHand.rotation.set(0.1, -0.2, -1.2); leftHand.userData.curl(0.85);
  wine.position.set(-0.1, -0.245 + lift * 0.08 - handsDown * 0.3, -0.53); wine.rotation.set(0.05, 0, 0.05);
  rig.position.set(0, 0, 0);
  canvas.style.filter = `saturate(1.08) contrast(1.04) brightness(${1 + 0.06 * door})`;
  return smooth((t - CUT_D) / 0.14);
}

// ================================================================= Frame ===
function renderAt(t) {
  t = clamp(t, 0, DURATION);
  overlay.update(t);
  let k;
  if (t < CUT_B) {
    k = renderStreet(t);
    k *= 1 - smooth((t - 10.9) / 0.9);       // Abdunkeln zum Übergang
  } else if (t < CUT_C) k = renderPenthouse(t);
  else if (t < CUT_D) k = renderClassroom(t);
  else k = renderHall(t);
  if (t >= BLACK) k = 0;
  canvas.style.opacity = clamp(k);
  renderer.render(scene, camera);
}

window.addEventListener("hf-seek", (e) => renderAt(e.detail.time));
renderAt(window.__hfThreeTime || 0);
