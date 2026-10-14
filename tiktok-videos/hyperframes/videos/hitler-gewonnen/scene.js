// "Was wäre, wenn Hitler den Krieg gewonnen hätte?" – Berlin 2026 als Dystopie.
// Ernster Ton, keine NS-Symbole (§86a StGB), keine Pointe. POV, eine Szene pro Satz.
import { THREE, rng, clamp, smooth, lerp, shake, createSky, createStars,
         windowTextures, building, crowd, car, streetLamp, glowTexture, fernsehturm } from "./lib/lowpoly.js";
import { hand, coffeeCup, phone, phoneScreen, idCard, livingRoom, monumentalAxis, greatDome, checkpoint,
         radioUnderBlanket, emptyVillage, box, cyl, mat, basic } from "./lib/props.js";
import { createOverlay, de, countdown } from "./lib/ww-overlay.js";

const DURATION = 30;
const EVENT = 6;          // Umschlag in die andere Geschichte
const RETURN = 24;        // zurück in die Wirklichkeit
const BLACK = 27.0;
const END = 27.4;

// ------------------------------------------------------------------ Overlay ---
const regime = (sub) => ({ label: "Diktatur seit", value: () => "93 Jahren", sub, fadeIn: 0.01, fadeOut: 0.01 });
const overlay = createOverlay(document.getElementById("overlay"), {
  title: { text: "Was wäre, wenn Hitler den Krieg gewonnen hätte?", accent: "gewonnen", accentColor: "#d06a5a", start: 0, end: 3.1 },
  hud: [
    { start: 0, end: EVENT, label: "Geschichte ändert sich in", value: (t) => countdown(EVENT - t), sub: "Berlin · 2026 · wie du es kennst", fadeIn: 0.01 },
    { start: EVENT, end: 9, ...regime("Keine freie Wahl seit 1933") },
    { start: 9, end: 12, label: "Große Halle", value: (t) => `${de(Math.round(290 * smooth((t - 9.2) / 2.2)))} m`, sub: "Geplant für bis zu 180.000 Menschen", fadeIn: 0.01, fadeOut: 0.01 },
    { start: 12, end: 15, ...regime("Freie Presse: 0") },
    { start: 15, end: 18, ...regime("Kontrollen an jeder Ecke") },
    { start: 18, end: 21, ...regime("Rundfunkverordnung 1939: Zuchthaus") },
    { start: 21, end: RETURN, ...regime("Generalplan Ost: 31 Mio. Menschen vertreiben") },
    { start: RETURN, end: BLACK, label: "In Wirklichkeit", value: () => "8. MAI 1945", sub: "Kapitulation · Er hat verloren", fadeIn: 0.01, fadeOut: 0.3 },
  ],
  subtitles: [
    { start: 3.2, end: 6.0, text: "Berlin, heute. So, wie du es kennst." },
    { start: 6.2, end: 9.0, text: "Und jetzt: Er hat den Krieg gewonnen." },
    { start: 9.15, end: 12.0, text: "Die Große Halle. 290 Meter hoch." },
    { start: 12.15, end: 15.0, text: "Dein Handy zeigt nur, was der Staat will." },
    { start: 15.15, end: 18.0, text: "Ein falsches Wort, und du verschwindest." },
    { start: 18.15, end: 21.0, text: "Ausländisches Radio? Schon 1939 ein Verbrechen." },
    { start: 21.15, end: 24.0, text: "Im Osten: leere Dörfer. Millionen Menschen fehlen." },
    { start: 24.15, end: 25.75, text: "Zum Glück kam es anders.", fadeOut: 0.25 },
    { start: 25.9, end: 27.0, text: "Am 8. Mai 1945 hat er verloren.", fadeIn: 0.2, fadeOut: 0.3 },
  ],
  black: { start: BLACK, end: END },
  endcard: { start: END, end: DURATION, lines: ["Über 60 Millionen Menschen starben im Zweiten Weltkrieg", "Die Große Halle wurde nie gebaut"] },
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
scene.fog = new THREE.Fog("#e8c9a8", 60, 900);
const camera = new THREE.PerspectiveCamera(62, 1080 / 1920, 0.05, 4000);
scene.add(camera);
const sky = createSky(2500); scene.add(sky);
const stars = createStars(900, 2300); scene.add(stars);
const hemi = new THREE.HemisphereLight("#ffffff", "#5a4a3a", 1.0); scene.add(hemi);
const sun = new THREE.DirectionalLight("#ffd7a0", 2.4);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -30, right: 30, top: 30, bottom: -30, near: 1, far: 300 });
sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.04;
scene.add(sun); scene.add(sun.target);

// ============================================================== Straße ===
const street = new THREE.Group();
const R = rng(1945);
const ROAD = 8, WALK = 13.5, Z0 = 40, Z1 = -420;
const flat = (c) => new THREE.MeshStandardMaterial({ color: c, roughness: 1, flatShading: true });
const plane = (w, d, m, x, y, z) => { const p = new THREE.Mesh(new THREE.PlaneGeometry(w, d), m); p.rotation.x = -Math.PI / 2; p.position.set(x, y, z); p.receiveShadow = true; street.add(p); return p; };
plane(2000, 2000, flat("#3a3836"), 0, -0.02, -300);
plane(ROAD * 2, Z0 - Z1, flat("#4b4b4e"), 0, 0, (Z0 + Z1) / 2);
for (const s of [-1, 1]) { const c = new THREE.Mesh(new THREE.BoxGeometry(WALK - ROAD, 0.16, Z0 - Z1), flat("#b3ada3")); c.position.set(s * (ROAD + (WALK - ROAD) / 2), 0.08, (Z0 + Z1) / 2); c.receiveShadow = true; street.add(c); }
const markMat = new THREE.MeshStandardMaterial({ color: "#d8d6cf", roughness: 0.8 });
for (let z = Z0; z > Z1; z -= 9) plane(0.18, 4, markMat, 0, 0.012, z);
const texAlt = [windowTextures(11, "altbau"), windowTextures(12, "altbau"), windowTextures(13, "altbau")];
const FACADES = ["#e9dcc3", "#d9b48f", "#c98f73", "#e6e1d6", "#b9c2b0", "#d7c49a", "#cfa79a", "#bdbab3", "#e3cfae"];
const awnings = [];
for (const s of [-1, 1]) {
  let z = Z0;
  const r = rng(100 + s);
  while (z > Z1) {
    const w = r.range(9, 15);
    const { mesh } = building({ w: 14, h: r.range(15, 22), d: w, color: r.pick(FACADES), tex: r.pick(texAlt) });
    mesh.position.set(s * (WALK + 7), 0, z - w / 2); street.add(mesh);
    if (r() < 0.6) {
      const aw = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.12, w * 0.6), flat(r.pick(["#c0392b", "#2e86c1", "#27ae60", "#f39c12", "#8e44ad"])));
      aw.position.set(s * (WALK + 7) - s * 7.6, 3.4, z - w / 2); aw.rotation.z = s * 0.18; street.add(aw); awnings.push(aw);
    }
    z -= w;
  }
}
const tower = fernsehturm(); tower.group.position.set(-38, 0, -470); street.add(tower.group);
const farDome = greatDome(); farDome.position.set(0, 0, -1300); farDome.scale.setScalar(0.9); street.add(farDome);
const glow = glowTexture();
const cams = [];
for (let z = 30; z > -300; z -= 24) for (const s of [-1, 1]) {
  if (s > 0 && z + 12 > -14) continue;
  const l = streetLamp(glow); l.group.position.set(s * (ROAD + 0.6), 0, z + (s > 0 ? 12 : 0)); l.glowMat.opacity = 0; street.add(l.group);
  const cam = new THREE.Group();
  box(0.5, 0.24, 0.24, mat("#d9d9d4"), 0, 0, 0, cam); box(0.05, 0.05, 0.05, basic("#ff3020"), -0.2 * s, 0.03, 0.12, cam);
  cam.position.set(s * (ROAD + 0.3), 4.6, z + (s > 0 ? 12 : 0)); cam.rotation.y = s * 0.5; street.add(cam); cams.push(cam);
}
const cars = [];
for (let i = 0; i < 10; i++) {
  const dir = i % 2 === 0 ? -1 : 1; const g = car(500 + i, i === 3 ? "bus" : "car");
  g.rotation.y = dir < 0 ? 0 : Math.PI; street.add(g);
  cars.push({ g, dir, x: dir < 0 ? 3 : -3, z0: dir < 0 ? R.range(-10, 25) - i * 9 : R.range(-160, -40) - i * 6, v: R.range(8, 11) });
}
const N = 90;
const people = crowd(N, 45); street.add(people.group);
const P = [];
for (let i = 0; i < N; i++) {
  const hero = i < 26, side = hero ? 1 : (i % 2 === 0 ? 1 : -1);
  P.push({ side, dir: hero ? -1 : (R() < 0.6 ? -1 : 1), x: side * R.range(9.0, 12.4), z0: hero ? R.range(-40, -2) : R.range(-150, -14), v: R.range(1.15, 1.6), ph: R() * 6.28 });
}
// Farben der Menschen: bunt (Wirklichkeit) oder Einheitsgrau (Dystopie)
const colorful = people.group.children.map((m) => m.instanceColor.array.slice());
const greyCol = new THREE.Color();
function setCrowdColors(alt) {
  people.group.children.forEach((m, p) => {
    const arr = m.instanceColor.array;
    for (let i = 0; i < N; i++) {
      if (alt && p !== 5) { const v = p <= 1 ? 0.16 : 0.24; greyCol.setRGB(v, v * 1.02, v * 1.06); arr[i * 3] = greyCol.r; arr[i * 3 + 1] = greyCol.g; arr[i * 3 + 2] = greyCol.b; }
      else { arr[i * 3] = colorful[p][i * 3]; arr[i * 3 + 1] = colorful[p][i * 3 + 1]; arr[i * 3 + 2] = colorful[p][i * 3 + 2]; }
    }
    m.instanceColor.needsUpdate = true;
  });
}

// ============================================================ weitere Sets ===
const axis = monumentalAxis();
const flatRoom = livingRoom({ seed: 61 });
const cp = checkpoint();
const guards = crowd(3, 7); cp.group.add(guards.group);
guards.group.children.forEach((m) => { for (let i = 0; i < 3; i++) m.setColorAt(i, new THREE.Color(m === guards.group.children[5] ? "#e2b08a" : "#2b2e33")); m.instanceColor.needsUpdate = true; });
const radio = radioUnderBlanket();
const radioSet = new THREE.Group(); radioSet.add(radio.radio); radioSet.add(radio.set);
const village = emptyVillage();
const SETS = { street, axis: axis.group, flat: flatRoom.group, checkpoint: cp.group, radio: radioSet, village: village.group };
for (const g of Object.values(SETS)) { g.visible = false; scene.add(g); }

// ============================================================ Hände (POV) ===
const rig = new THREE.Group(); camera.add(rig);
const rightHand = hand(1, "#3a3f48"); rig.add(rightHand);
const leftHand = hand(-1, "#3a3f48"); rig.add(leftHand);
const cup = coffeeCup(); rig.add(cup);
const handy = phone(); rig.add(handy);
const ausweis = idCard(); rig.add(ausweis);
function pose(o, p, r) { o.visible = true; o.position.set(...p); o.rotation.set(...r); }
const POSES = {
  cup() { pose(rightHand, [0.12, -0.245, -0.52], [0.15, 0.25, 1.25]); rightHand.userData.curl(0.95); pose(cup, [0.075, -0.195, -0.55], [0.08, 0, -0.05]); },
  phone() { pose(leftHand, [-0.07, -0.235, -0.36], [-0.65, 0.1, -0.15]); leftHand.userData.curl(0.45); pose(handy, [-0.065, -0.17, -0.385], [-0.55, 0.12, 0.05]); },
  phoneUp() { pose(leftHand, [-0.075, -0.27, -0.42], [-0.3, 0.1, -0.15]); leftHand.userData.curl(0.5); pose(handy, [-0.07, -0.205, -0.45], [-0.25, 0.15, 0.05]); },
  id() { pose(rightHand, [0.09, -0.25, -0.5], [0.3, 0, 0.3]); rightHand.userData.curl(0.8); pose(ausweis, [0.05, -0.16, -0.48], [-0.35, 0.1, 0.05]); },
  radio() {
    pose(leftHand, [-0.17, -0.25, -0.8], [0.5, 0.7, -0.5]); leftHand.userData.curl(0.6);
    pose(rightHand, [0.17, -0.25, -0.8], [0.5, -0.7, 0.5]); rightHand.userData.curl(0.6);
  },
};

// ================================================================== Szenen ===
const L = (a, b, u) => [lerp(a[0], b[0], u), lerp(a[1], b[1], u), lerp(a[2], b[2], u)];
const SCENES = [
  { name: "real", set: "street", start: 0, end: EVENT, walk: () => 1, hands: ["cup"],
    cam: (t) => ({ pos: [10.1, 1.7, 15.5 - t * 1.05], look: [5.5, 1.9, -60] }) },
  { name: "flip", set: "street", start: EVENT, end: 9, walk: () => 1, hands: ["cup"],
    cam: (t) => ({ pos: [10.1, 1.7, 15.5 - t * 1.05], look: [lerp(5.5, 2.0, smooth((t - 6.5) / 2)), lerp(1.9, 6, smooth((t - 6.5) / 2)), -60] }) },
  { name: "axis", set: "axis", start: 9, end: 12, walk: () => 0.5, hands: ["phoneUp"],
    cam: (t) => { const u = (t - 9) / 3; return { pos: [4, 1.7, 10 - u * 6], look: [0, lerp(40, 140, smooth(u)), -1250] }; } },
  { name: "flat", set: "flat", start: 12, end: 15, walk: () => 0, hands: ["phone"],
    cam: (t) => { const u = smooth((t - 12) / 3); return { pos: L([0.4, 1.6, 1.4], [0.3, 1.58, 1.0], u), look: [0.1, 0.9, -8] }; } },
  { name: "checkpoint", set: "checkpoint", start: 15, end: 18, walk: () => 0.4, hands: ["id"],
    cam: (t) => { const u = (t - 15) / 3; return { pos: [0.4, 1.68, 3.5 - u * 1.2], look: [0.3, 1.5, -6] }; } },
  { name: "radio", set: "radio", start: 18, end: 21, walk: () => 0, hands: [],
    cam: (t) => { const u = smooth((t - 18) / 3); return { pos: L([0, 0.36, 0.95], [0, 0.32, 0.8], u), look: [0, 0.0, 0] }; } },
  { name: "village", set: "village", start: 21, end: RETURN, walk: () => 0.55, hands: [],
    cam: (t) => { const u = (t - 21) / 3; return { pos: [0.3, 1.66, 6 - u * 3], look: [0.6, 1.4, -60] }; } },
  { name: "real2", set: "street", start: RETURN, end: BLACK, walk: () => 1, hands: ["cup"],
    cam: (t) => ({ pos: [10.1, 1.7, 6 - (t - RETURN) * 1.05], look: [5.5, 2.4, -60] }) },
];

function setEnv(o) {
  sky.visible = o.sky !== false;
  if (o.sky !== false) {
    sky.material.uniforms.top.value.set(o.top); sky.material.uniforms.horizon.value.set(o.hor);
    sky.material.uniforms.bottom.value.set(o.hor).multiplyScalar(0.35);
    sky.material.uniforms.sunGlow.value = o.glow ?? 0;
  }
  scene.background = o.sky === false ? new THREE.Color(o.bg || "#000") : null;
  scene.fog.color.set(o.fog || o.hor || o.bg); scene.fog.near = o.near ?? 60; scene.fog.far = o.far ?? 900;
  hemi.color.set(o.hemiSky || "#ffffff"); hemi.groundColor.set(o.hemiGround || "#5a4a3a"); hemi.intensity = o.hemi;
  sun.color.set(o.sunColor || "#ffd7a0"); sun.intensity = o.sun ?? 0;
  const a = o.sunA ?? -0.7, el = o.sunEl ?? 0.4;
  sun.userData.dir = new THREE.Vector3(Math.sin(a), el, Math.cos(a)).normalize();
  sky.material.uniforms.sunDir.value.copy(sun.userData.dir);
  sun.castShadow = (o.sun ?? 0) > 0.3;
  stars.material.opacity = o.stars ?? 0;
  renderer.toneMappingExposure = o.exposure ?? 1;
}
const REAL = { top: "#6fa3dc", hor: "#f3dcbc", hemi: 1.3, hemiSky: "#eaf2ff", sun: 2.9, sunColor: "#ffd9a6", sunA: -0.7, sunEl: 0.35, glow: 0.5 };
const GREY = { top: "#5d6168", hor: "#a9adb2", hemi: 1.15, hemiSky: "#d4d8de", hemiGround: "#4a4a4c", sun: 0.7, sunColor: "#e1e4e8", sunA: -0.5, sunEl: 0.8, near: 30, far: 700 };
const ENV = {
  real: () => REAL,
  flip: (t) => (t < EVENT + 0.05 ? REAL : GREY),
  axis: () => ({ ...GREY, top: "#4b5058", hor: "#9a9ea4", near: 120, far: 2600, hemi: 1.25 }),
  flat: () => ({ top: "#0f1834", hor: "#26325a", hemi: 0.5, hemiSky: "#8ea2d8", hemiGround: "#2a2420", sun: 0.3, sunColor: "#9fb4e8", sunA: 2.6, sunEl: 0.8, stars: 0.6, near: 80, far: 700, exposure: 1.25 }),
  checkpoint: () => ({ top: "#05070d", hor: "#161b26", hemi: 0.9, hemiSky: "#6a7690", hemiGround: "#1a1a1c", sun: 0.15, sunColor: "#9fb4e8", stars: 0.3, near: 20, far: 120, exposure: 1.3 }),
  radio: () => ({ sky: false, bg: "#030405", fog: "#030405", near: 3, far: 20, hemi: 0.12, hemiSky: "#4a5470", hemiGround: "#111", exposure: 1.05 }),
  village: () => ({ top: "#7a7f86", hor: "#c3c6c4", hemi: 1.1, hemiSky: "#d9dcdf", hemiGround: "#4a5040", sun: 0.5, sunColor: "#e6e6e0", sunA: 0.5, sunEl: 0.9, near: 10, far: 140, fog: "#b9bcbb" }),
  real2: () => REAL,
};

// ==================================================================== Frame ===
const tmpLook = new THREE.Vector3();
let lastAlt = null;
function renderAt(t) {
  t = clamp(t, 0, DURATION);
  overlay.update(t);
  const sc = SCENES.find((s) => t >= s.start && t < s.end) || SCENES[SCENES.length - 1];
  for (const g of Object.values(SETS)) g.visible = false;
  SETS[sc.set].visible = true;
  setEnv(ENV[sc.name](t));

  const { pos, look } = sc.cam(t);
  const walk = sc.walk(t);
  const bob = Math.sin(t * Math.PI * 2 * 1.85) * 0.022 * walk;
  const sway = Math.sin(t * Math.PI * 1.85) * 0.014 * walk;
  const jolt = t >= EVENT && t < 7.5 ? Math.exp(-(t - EVENT) * 3) : 0;
  const [sx, sy] = shake(t, 0.012 + jolt * 0.07);
  camera.position.set(pos[0] + sway + sx, pos[1] + bob + sy, pos[2]);
  camera.lookAt(tmpLook.set(look[0] + sx * 3, look[1] + sy * 3, look[2]));
  camera.updateMatrixWorld();
  sun.position.copy(camera.position).addScaledVector(sun.userData.dir, 120);
  sun.target.position.set(camera.position.x, 0, camera.position.z - 15);
  sky.position.copy(camera.position); stars.position.copy(camera.position);

  for (const o of [rightHand, leftHand, cup, handy, ausweis]) o.visible = false;
  rig.position.set(0, -bob * 0.4, 0);
  for (const h of sc.hands) POSES[h](t);

  if (sc.set === "street") {
    const alt = sc.name === "flip" && t >= EVENT;
    if (alt !== lastAlt) { setCrowdColors(alt); lastAlt = alt; }
    tower.group.visible = !alt; farDome.visible = alt;
    cams.forEach((c) => { c.visible = alt; });
    awnings.forEach((a) => { a.visible = !alt; });
    for (const c of cars) c.g.position.set(c.x, 0, alt ? c.z0 + c.dir * 0 : c.z0 + c.dir * c.v * (t - (sc.name === "real2" ? 18 : 0)));
    for (let i = 0; i < N; i++) {
      const p = P[i];
      if (alt) {
        // Gleichschritt: alle gleich schnell, gleiche Richtung, gleicher Takt
        const z = p.z0 - 1.3 * (t - 4);
        people.set(i, { x: p.x, z, rotY: Math.PI, swing: Math.sin(t * 5.6) * 0.6, visible: true });
      } else {
        const tt = sc.name === "real2" ? t - 18 : t;
        people.set(i, { x: p.x, z: p.z0 + p.dir * p.v * tt, rotY: p.dir < 0 ? Math.PI : 0, swing: Math.sin(tt * p.v * 4.2 + p.ph) * 0.55, visible: true });
      }
    }
    people.commit();
  }
  if (sc.name === "axis") {
    const k = smooth((t - 9.2) / 2.2);
    axis.dome.position.y = lerp(-420, 0, k);
    handy.userData.screen.redraw((c, w, h) => phoneScreen(c, w, h, { time: "14:02", title: "Filmen verboten", accent: "#ff5b4a", lines: ["Aufnahmen an diesem", "Ort sind untersagt."], battery: 71 }));
  }
  if (sc.name === "flat") {
    flatRoom.update(14);
    handy.userData.screen.redraw((c, w, h) => phoneScreen(c, w, h, t < 13.6
      ? { time: "22:14", title: "Zugriff verweigert", accent: "#ff5b4a", lines: ["Diese Seite ist", "nicht erlaubt."], battery: 38 }
      : { time: "22:14", title: "Hinweis", accent: "#ffb43a", lines: ["Ihr Suchverlauf", "wurde gemeldet."], battery: 38 }));
  }
  if (sc.name === "checkpoint") {
    const stopRaise = smooth((t - 15.6) / 0.5) * 1.5;
    guards.set(0, { x: 0.9, z: -3.0, rotY: 0, armRaise: 0, visible: true });
    guards.set(1, { x: -0.7, z: -3.6, rotY: 0.2, armRaise: stopRaise, visible: true });
    guards.set(2, { x: 3.0, z: -6.5, rotY: -0.4, visible: true });
    guards.commit();
  }
  if (sc.name === "radio") {
    const f = 0.75 + 0.25 * Math.sin(t * 23) * Math.sin(t * 7.3);
    radio.glow.intensity = 1.6 * f;
    radio.dial.material.color.setRGB(1 * f, 0.81 * f, 0.48 * f);
  }
  if (sc.name === "village") village.seat.rotation.x = Math.sin(t * 1.6) * 0.35;

  const fadeIn = smooth((t - sc.start) / 0.14);
  const altLook = ["flip", "axis", "flat", "checkpoint", "radio", "village"].includes(sc.name) && !(sc.name === "flip" && t < EVENT);
  // Umschlag: Farbe weicht in 0,8 s
  const drain = sc.name === "flip" ? smooth((t - EVENT) / 0.8) : altLook ? 1 : 0;
  const sat = lerp(1.12, 0.18, drain);
  canvas.style.filter = `brightness(${sc.start === 0 || sc.name === "flip" ? 1 : fadeIn}) saturate(${sat}) contrast(${lerp(1.03, 1.12, drain)})`;
  canvas.style.opacity = t < BLACK ? 1 : 0;
  renderer.render(scene, camera);
}

window.addEventListener("hf-seek", (e) => renderAt(e.detail.time));
renderAt(window.__hfThreeTime || 0);
