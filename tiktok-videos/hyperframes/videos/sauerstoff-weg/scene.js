// "Was wäre, wenn der Sauerstoff 5 Sekunden verschwindet?" – 75 s, ein Ort (Spreeufer an der
// Oberbaumbrücke, Sommerabend), eine durchgehende POV-Einstellung ohne Wiederholung:
// Countdown → Sauerstoff weg (Zeitlupe) → Motoren aus, U1 fährt weiter → Druckwelle „HIER“.
// Kontrollformat ohne Twist.
import { THREE, rng, clamp, smooth, lerp, shake, createSky, crowd, car, fernsehturm, glowTexture } from "./lib/lowpoly.js";
import { hand, mat } from "./lib/props.js";
import { createOverlay, de, countdown } from "./lib/ww-overlay.js";
import { RIVER, WATER_Y, BRIDGE_Z, DECK_Y, TRACK_Y, oberbaumbruecke, u1Train, steamer, river, banks, grill, flame, mateBottle, lighter, tealight, puffTexture } from "./sets.js";

const DURATION = 75;
const EVENT = 20;                 // Sauerstoff verschwindet
const SLOW = 6;                   // Zeitlupe: 5 echte Sekunden = 30 Videosekunden
const BACK = EVENT + 5 * SLOW;    // 50: Sauerstoff zurück
const FRONT0 = 54;                // Druckwelle wird sichtbar
const HIT = 62;                   // Druckwelle erreicht dich
const SOUND = 343;                // m/s
const BLACK = 70;
const END = 70.5;

const SCENES = [{ name: "Spreeufer an der Oberbaumbrücke", set: "spreeufer" }];

const tau = (t) => Math.max(0, (t - EVENT) / SLOW);              // echte Sekunden seit dem Verschwinden
const W = (t) => (t < EVENT ? t : EVENT + (t - EVENT) / SLOW);   // Weltzeit (Zeitlupe ab dem Ereignis)
const frontDist = (t) => Math.max(0, SOUND * (HIT - t) / SLOW);  // Entfernung der Druckwelle (m)
const U1_SPEED = 11;              // m/s ≈ 40 km/h
const CAR_SPEED = 11;             // m/s ≈ 40 km/h
const CAR_DECEL = 2.2;            // m/s² – Motor aus, rollt in 5 s aus

// ------------------------------------------------------------------ Overlay ---
const overlay = createOverlay(document.getElementById("overlay"), {
  title: { text: "Was wäre, wenn der Sauerstoff 5 Sekunden verschwindet?", accent: "Sauerstoff", accentColor: "#8fd3ff", start: 0, end: 3.5 },
  hud: [
    { start: 0, end: EVENT, label: "Sauerstoff verschwindet in", value: (t) => countdown(EVENT - t),
      sub: (t) => (t < 10 ? "Spreeufer · Oberbaumbrücke · 20:47 Uhr" : "Sauerstoff in der Luft: 20,95 %"), fadeIn: 0.01, fadeOut: 0.01 },
    { start: EVENT, end: 24, label: "Sauerstoff zurück in", value: (t) => `${de(Math.max(0, 5 - tau(t)), 3)} s`, sub: `Zeit ${SLOW}× verlangsamt`, fadeIn: 0.01, fadeOut: 0.01 },
    { start: 24, end: 36, label: "Ohne Sauerstoff seit", value: (t) => `${de(tau(t), 3)} s`, sub: "Luftdruck: 800 statt 1.013 hPa · −21 %", fadeIn: 0.01, fadeOut: 0.01 },
    { start: 36, end: BACK, label: "Die U1 fährt einfach weiter", value: (t) => `${de(U1_SPEED * tau(t), 1)} m`, sub: "Autos und Dampfer: Motor aus", fadeIn: 0.01, fadeOut: 0.01 },
    { start: BACK, end: FRONT0, label: "Sauerstoff", value: () => "20,95 %", sub: "Luftdruck springt auf 1.013 hPa", fadeIn: 0.01, fadeOut: 0.01 },
    { start: FRONT0, end: HIT, label: "Druckwelle", value: (t) => `${de(frontDist(t), 0)} m`, sub: `Tempo: ${SOUND} m/s · Zeit ${SLOW}× verlangsamt`, fadeIn: 0.01, fadeOut: 0.01 },
    { start: HIT, end: HIT + 2.4, label: "Druckwelle", value: () => "HIER", sub: "Fenster klirren am ganzen Ufer", fadeIn: 0.01, fadeOut: 0.2 },
    { start: HIT + 2.4, end: BLACK, label: "Sauerstoff", value: () => "20,95 %", sub: "Wieder da. Der Grill nicht.", fadeIn: 0.3, fadeOut: 0.4 },
  ],
  subtitles: [
    { start: 3.7, end: 7.6, text: "Berlin, Spreeufer, Sommerabend." },
    { start: 7.8, end: 11.6, text: "In 12 Sekunden ist der Sauerstoff weg." },
    { start: 11.8, end: 15.6, text: "Nur für fünf Sekunden. Klingt harmlos." },
    { start: 15.8, end: 19.8, text: "Der Grill brennt. Keiner ahnt etwas." },
    { start: 20.2, end: 23.8, text: "Dann ist er weg. Jede Flamme erlischt." },
    { start: 24.0, end: 27.6, text: "Deine Ohren knacken. Der Luftdruck fällt." },
    { start: 27.8, end: 31.4, text: "Du atmest ein. Es bringt nichts." },
    { start: 31.6, end: 35.2, text: "Also hältst du die Luft an." },
    { start: 35.4, end: 39.0, text: "Die Autos auf der Brücke rollen aus." },
    { start: 39.2, end: 42.8, text: "Auch der Dampfer treibt nur noch." },
    { start: 43.0, end: 46.6, text: "Nur die U1 fährt weiter. Elektrisch." },
    { start: 46.8, end: 49.8, text: "Noch eine Sekunde." },
    { start: 50.2, end: 53.8, text: "Dann ist der Sauerstoff zurück." },
    { start: 54.0, end: 57.8, text: "Und mit ihm der ganze Luftdruck." },
    { start: 58.0, end: 61.8, text: "Eine Druckwelle rast über die Spree." },
    { start: 62.1, end: 64.8, text: "Ein Knall wie Donner." },
    { start: 65.2, end: 69.6, text: "Fünf Sekunden. Und der Grill ist aus." },
  ],
  black: { start: BLACK, end: END },
  endcard: { start: END, end: DURATION, lines: [
    "Ohne Sauerstoff erlischt jedes Feuer sofort",
    "Luft ist zu 20,95 % Sauerstoff, der Druck fiele auf 800 hPa",
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
renderer.toneMappingExposure = 1.08;

const scene = new THREE.Scene();
scene.fog = new THREE.Fog("#e6b893", 160, 1700);
const camera = new THREE.PerspectiveCamera(62, 1080 / 1920, 0.05, 4000);
scene.add(camera);
const sky = createSky(3000); scene.add(sky);
const SU = sky.material.uniforms;
SU.top.value.set("#4f73ad"); SU.horizon.value.set("#f5b07c"); SU.bottom.value.set("#6d5c55");
SU.sunColor.value.set("#ffb27a"); SU.sunGlow.value = 0.9;
SU.sunDir.value.set(-0.75, 0.12, -0.65).normalize();     // Abendsonne tief im Westen (hinter der Brücke links)
const hemi = new THREE.HemisphereLight("#ffe3c8", "#4d4038", 1.35); scene.add(hemi);
const sun = new THREE.DirectionalLight("#ffc690", 2.5);
sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -40, right: 40, top: 40, bottom: -40, near: 1, far: 300 });
sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.04;
const SUN_DIR = new THREE.Vector3(-0.85, 0.42, 0.2).normalize();  // Licht von links hinten (kein Gegenlicht)
scene.add(sun); scene.add(sun.target);

// ================================================================== Set ===
const bridge = oberbaumbruecke(); scene.add(bridge.group);
const bank = banks(); scene.add(bank.group);
const spree = river(); scene.add(spree.mesh);
const tower = fernsehturm(); tower.group.position.set(-480, 0, -1300); scene.add(tower.group);

const CAM = new THREE.Vector3(62.6, 1.65, -52);
const GP = new THREE.Vector3(61.4, 0, -55.9);   // Grill
const R = rng(4242);

// Grill vorne rechts, Glut + Flammen + Punktlicht
const G = grill(); G.group.position.copy(GP); scene.add(G.group);
const grillFlames = [];
for (let i = 0; i < 7; i++) {
  const f = flame(R.range(0.09, 0.17)); f.position.set(R.range(-0.17, 0.17), 0.7, R.range(-0.15, 0.15)); G.group.add(f);
  grillFlames.push({ f, ph: R() * 6, base: f.userData.base });
}
const grillLight = new THREE.PointLight("#ff8a3a", 6, 9, 1.6); grillLight.position.set(GP.x + 0.4, 1.4, GP.z); scene.add(grillLight);
// Decke + Kühltasche neben dem Grill
const blanket = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.03, 1.6), mat("#3d6f8f")); blanket.position.set(63.6, 0.02, -60.5); blanket.rotation.y = 0.3; scene.add(blanket);
const cooler = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.35, 0.35), mat("#d14a3a")); cooler.position.set(63.4, 0.18, -57.2); scene.add(cooler);

// Teelichter auf der Kaikante und auf Decken
const teas = [];
const glow = glowTexture();
const glowMats = [];
for (let i = 0; i < 18; i++) {
  const tl = tealight();
  const z = -57 - i * 3.4 + R.range(-0.6, 0.6);
  const x = i < 4 ? 61.0 + R.range(0, 1.0) : RIVER + 0.5 + R.range(-0.2, 0.25);
  tl.position.set(x, i < 4 ? 0.05 : 0.27, z); tl.scale.setScalar(1.6); scene.add(tl);
  const gm = new THREE.SpriteMaterial({ map: glow, color: "#ffb35a", transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
  const sp = new THREE.Sprite(gm); sp.position.set(x, (i < 4 ? 0.05 : 0.27) + 0.14, z); sp.scale.setScalar(0.55); scene.add(sp);
  glowMats.push(gm);
  teas.push({ tl, ph: R() * 6 });
}

// Dampfer
const boat = steamer(); boat.position.set(34, WATER_Y + 0.5, -175); scene.add(boat);
const BOAT_V = 3, BOAT_DECEL = 0.6;
function boatZ(t) {
  const w = W(t);
  if (w <= EVENT) return -175 + BOAT_V * w;
  const s = Math.min(w - EVENT, BOAT_V / BOAT_DECEL);
  return -175 + BOAT_V * EVENT + BOAT_V * s - 0.5 * BOAT_DECEL * s * s;
}

// U1-Züge: A fährt im ersten Akt nach Westen, B steht beim Ereignis auf der Brücke und fährt weiter
const trainA = u1Train(); scene.add(trainA);
const trainB = u1Train(); scene.add(trainB);
const trainAx = (t) => 150 - U1_SPEED * W(t);                 // Richtung −x
const trainBx = (t) => -45 + U1_SPEED * (W(t) - EVENT);       // Richtung +x

// Autos auf der Fahrbahn
const CARS = [];
for (let i = 0; i < 22; i++) {
  const dir = i % 2 === 0 ? 1 : -1;
  const c = car(500 + i, i === 5 || i === 14 ? "bus" : "car");
  c.rotation.y = dir > 0 ? Math.PI / 2 : -Math.PI / 2;
  scene.add(c);
  CARS.push({ c, dir, x0: -150 + (i * 13.7 + R.range(0, 5)) % 300, z: BRIDGE_Z + (dir > 0 ? 7.2 : 1.6) });
}
function carX(k, t) {
  const w = W(t);
  let s = CAR_SPEED * Math.min(w, EVENT);
  if (w > EVENT) { const u = Math.min(w - EVENT, CAR_SPEED / CAR_DECEL); s += CAR_SPEED * u - 0.5 * CAR_DECEL * u * u; }
  let x = k.x0 + k.dir * s;
  x = ((x + 150) % 300 + 300) % 300 - 150;
  return x;
}

// Rauch (Grill, Zigarette, Dampfer-Schornstein): Partikel mit Startzeit, ab dem Ereignis keine neuen
const puff = puffTexture();
const SMOKE = 70;
const smoke = [];
const smokeGroup = new THREE.Group(); scene.add(smokeGroup);
for (let i = 0; i < SMOKE; i++) {
  const src = i < 34 ? 0 : i < 46 ? 1 : 2;   // 0 Grill, 1 Zigarette, 2 Dampfer
  const m = new THREE.SpriteMaterial({ map: puff, color: src === 2 ? "#6b6b6b" : "#dcdcdc", transparent: true, depthWrite: false, opacity: 0 });
  const sp = new THREE.Sprite(m); smokeGroup.add(sp);
  smoke.push({ sp, m, src, period: src === 0 ? 4.0 : src === 1 ? 3.0 : 6.0, off: R(), dx: R.range(-1, 1), dz: R.range(-1, 1) });
}

// Menschen
const people = crowd(70, 77); scene.add(people.group);
const P = [];
// am Kai sitzend (unser Ufer), Blick aufs Wasser
for (let i = 0; i < 18; i++) P.push({ kind: "sit", x: RIVER + 0.55, z: -60 - i * 3.6 - R.range(0, 1.6), rotY: -Math.PI / 2 + R.range(-0.2, 0.2), ph: R() * 6, gasp: R.range(0.6, 1.4) });
// gegenüber sitzend
for (let i = 0; i < 16; i++) P.push({ kind: "sit", x: -RIVER - 0.55, z: -40 - i * 5 - R.range(0, 2), rotY: Math.PI / 2 + R.range(-0.2, 0.2), ph: R() * 6, gasp: R.range(0.6, 1.4) });
// auf Decken
for (let i = 0; i < 8; i++) P.push({ kind: "sit", x: 63 + R.range(0, 6), z: -66 - i * 4.5 + R.range(-1, 1), rotY: R() * 6.28, ph: R() * 6, gasp: R.range(0.6, 1.4) });
// stehend am Grill / im Gespräch
for (let i = 0; i < 6; i++) P.push({ kind: "stand", x: 65 + R.range(0, 4), z: -63 - i * 3 + R.range(-1, 1), rotY: R() * 6.28, ph: R() * 6, gasp: R.range(0.6, 1.4) });
// Spaziergänger auf dem Uferweg
for (let i = 0; i < 10; i++) P.push({ kind: "walk", x: 66.5 + R.range(0, 6), z: -70 - i * 9, dir: R() < 0.5 ? 1 : -1, v: R.range(0.9, 1.3), ph: R() * 6, gasp: R.range(0.6, 1.4) });
// Raucher
const SMOKER = P.length;
P.push({ kind: "smoker", x: 64.2, z: -64.5, rotY: Math.PI * 0.85, ph: 0, gasp: 1 });
// Passagiere auf dem Sonnendeck
const PASS0 = P.length;
for (let i = 0; i < 9; i++) P.push({ kind: "boat", bx: R.range(-2.2, 2.2), bz: R.range(-9, 6), rotY: R() * 6.28, ph: R() * 6, gasp: R.range(0.6, 1.4) });

const cig = new THREE.Group();
const cigBody = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.012, 0.08), mat("#f2f0ea")); cig.add(cigBody);
const cigTipMat = new THREE.MeshBasicMaterial({ color: "#ff5a1a" });
const cigTip = new THREE.Mesh(new THREE.BoxGeometry(0.014, 0.014, 0.012), cigTipMat); cigTip.position.z = 0.045; cig.add(cigTip);
scene.add(cig);
const tipGlowMat = new THREE.SpriteMaterial({ map: glow, color: "#ff7a2a", transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
const tipGlow = new THREE.Sprite(tipGlowMat); tipGlow.scale.setScalar(0.18); scene.add(tipGlow);

function personState(p, t, i) {
  const s = tau(t);
  const gasp = t > EVENT + 1 && t < BACK + 2 ? smooth(clamp((t - EVENT - 1) / 3)) * (1 - smooth(clamp((t - BACK) / 2))) : 0;
  const duck = t > HIT - 0.3 ? Math.exp(-Math.max(0, t - HIT) * 0.6) * smooth(clamp((t - HIT + 0.3) / 0.3)) : 0;
  const talk = t < EVENT ? Math.sin(t * 2.2 + p.ph) * 0.15 : 0;
  const raise = gasp * p.gasp * 1.3 + duck * 2.6;
  if (p.kind === "sit") return { x: p.x, y: p.y ?? -0.8, z: p.z, rotY: p.rotY, sit: true, armRaise: Math.max(0, talk) + raise, visible: true };
  if (p.kind === "stand") return { x: p.x, z: p.z, rotY: p.rotY + talk * 0.3, swing: talk * 0.4, armRaise: raise, visible: true };
  if (p.kind === "walk") {
    const w = W(t);
    const z = p.z + p.dir * p.v * w;
    const moving = t < EVENT ? 1 : 0.2;
    return { x: p.x, z, rotY: p.dir > 0 ? 0 : Math.PI, swing: Math.sin(w * p.v * 4.2 + p.ph) * 0.5 * moving, armRaise: raise, visible: true };
  }
  if (p.kind === "smoker") return { x: p.x, z: p.z, rotY: p.rotY, armRaise: 1.3 + raise * 0.3, visible: true };
  // Passagiere
  const bz = boatZ(t);
  return { x: 34 + p.bx, y: WATER_Y + 0.5 + 3.8 - 0.45, z: bz + p.bz, rotY: p.rotY, sit: true, armRaise: raise + Math.max(0, talk), visible: true, yOff: true };
}

// Druckwelle: Gischtwand über der Spree + Spritzer + Blätter/Staub am Ufer
const wallTex = (() => {
  const c = document.createElement("canvas"); c.width = 16; c.height = 128;
  const x = c.getContext("2d"); const grd = x.createLinearGradient(0, 128, 0, 0);
  grd.addColorStop(0, "rgba(255,255,255,0.95)"); grd.addColorStop(0.35, "rgba(255,255,255,0.55)"); grd.addColorStop(1, "rgba(255,255,255,0)");
  x.fillStyle = grd; x.fillRect(0, 0, 16, 128);
  const tx = new THREE.CanvasTexture(c); tx.colorSpace = THREE.SRGBColorSpace; return tx;
})();
const wallMat = new THREE.MeshBasicMaterial({ map: wallTex, color: "#fbf6ee", transparent: true, depthWrite: false, side: THREE.DoubleSide, opacity: 0 });
const wall = new THREE.Mesh(new THREE.PlaneGeometry(RIVER * 2 - 2, 18), wallMat); wall.position.set(-1, WATER_Y + 9, 0); scene.add(wall);
const SPRAY = 700;
const spray = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.13, 0), new THREE.MeshBasicMaterial({ color: "#f4f8f8", transparent: true, opacity: 0.8 }), SPRAY);
const SD = []; for (let i = 0; i < SPRAY; i++) SD.push({ x: R.range(-RIVER + 1, RIVER - 1), back: R.range(0, 22), h: R.range(2, 9), s: R.range(0.6, 1.8), ph: R() * 6 });
spray.frustumCulled = false; scene.add(spray);
const BURST = 520;
const burst = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.08, 0), new THREE.MeshBasicMaterial({ color: "#f6fafa", transparent: true, opacity: 0.85 }), BURST);
const BD = []; for (let i = 0; i < BURST; i++) BD.push({ x: R.range(44, 59.4), z: R.range(-110, 10), vy: R.range(5, 13), vx: R.range(0.2, 2.2), vz: -R.range(1, 6), s: R.range(0.6, 2.0) });
burst.frustumCulled = false; scene.add(burst);
const LEAVES = 140;
const leaves = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.09, 0.06), new THREE.MeshStandardMaterial({ color: "#ffffff", side: THREE.DoubleSide, roughness: 0.8 }), LEAVES);
const LD = []; const lc = new THREE.Color();
for (let i = 0; i < LEAVES; i++) {
  const side = R() < 0.5;
  LD.push({ x: side ? R.range(64.5, 67) : R.range(67, 76), z: R.range(-46, -20), vz: -R.range(5, 12), vy: R.range(1.5, 5), vx: R.range(0, 1.2), spin: R.range(-8, 8), ph: R() * 6 });
  leaves.setColorAt(i, lc.set(R.pick(["#6f8a3a", "#8c9a40", "#b08a3a", "#7a6a4a", "#c9b48a"])));
}
leaves.frustumCulled = false; scene.add(leaves);

// ============================================================ Hände (POV) ===
const rig = new THREE.Group(); camera.add(rig);
const RG = new THREE.Group(), LG = new THREE.Group(); rig.add(RG, LG);
RG.position.set(0.0, -0.04, -0.16); LG.position.set(0.0, -0.04, -0.16);
const rightHand = hand(1, "#5d6b4a"); RG.add(rightHand);
const bottle = mateBottle(); bottle.scale.setScalar(0.85); RG.add(bottle);
const leftHand = hand(-1, "#5d6b4a"); LG.add(leftHand);
const lit = lighter(); LG.add(lit);
const lighterLight = new THREE.PointLight("#ffa04a", 0.6, 1.2, 2); LG.add(lighterLight);

// ==================================================================== Frame ===
const tmp = new THREE.Vector3(), look = new THREE.Vector3(), o = new THREE.Object3D(), v3 = new THREE.Vector3();
// Blickziele (Weltkoordinaten) über die Zeit
const LOOKS = [
  [0, [10, 9, -140]],
  [11, [14, 8, -140]],
  [14.5, [44, 1.5, -95]],     // Grill + Leute am Kai
  [20, [44, 1.2, -95]],
  [31, [40, 2.5, -100]],
  [34.5, [-12, 9.2, -133]],   // Fahrbahn der Brücke
  [38.5, [-18, 9.2, -133]],
  [40.5, [34, 2.0, -104]],    // Dampfer
  [42.6, [35, 2.6, -102]],
  [44.5, [10, 14.5, -146]],   // U1
  [50, [20, 14.5, -146]],
  [54, [-10, 5, 160]],        // Spree flussaufwärts: dort kommt die Druckwelle
  [59.5, [10, 2, 110]],
  [62, [22, 1.5, -12]],       // Druckwelle kommt an: Gischt an der Kaimauer
  [64.8, [30, 1.0, -40]],
  [67.2, [61.4, 0.4, -55.9]], // Grill: aus
  [70, [61.4, 0.4, -55.9]],
];
function lookAt(t, out) {
  if (t <= LOOKS[0][0]) return out.set(...LOOKS[0][1]);
  for (let i = 1; i < LOOKS.length; i++) {
    if (t <= LOOKS[i][0]) {
      const x = smooth((t - LOOKS[i - 1][0]) / (LOOKS[i][0] - LOOKS[i - 1][0]));
      const a = LOOKS[i - 1][1], b = LOOKS[i][1];
      return out.set(lerp(a[0], b[0], x), lerp(a[1], b[1], x), lerp(a[2], b[2], x));
    }
  }
  return out.set(...LOOKS[LOOKS.length - 1][1]);
}
const FOV = [[0, 62], [33, 62], [35.5, 30], [39, 30], [40.5, 52], [43.5, 50], [45, 44], [50, 44], [53, 60], [70, 60]];
function fovAt(t) {
  for (let i = 1; i < FOV.length; i++) if (t <= FOV[i][0]) return lerp(FOV[i - 1][1], FOV[i][1], smooth((t - FOV[i - 1][0]) / (FOV[i][0] - FOV[i - 1][0])));
  return FOV[FOV.length - 1][1];
}

function renderAt(t) {
  t = clamp(t, 0, DURATION);
  overlay.update(t);
  const s = tau(t), w = W(t);
  const gone = t >= EVENT && t < BACK;           // kein Sauerstoff
  const fireOn = t < EVENT;                      // Flammen brennen nur bis zum Ereignis (entzünden sich nicht neu)

  // --- Kamera: kurzer Spaziergang am Ufer, dann stehen
  const walkK = 1 - smooth(clamp((t - 9.5) / 2.5));
  const zWalk = lerp(-44, CAM.z, smooth(clamp(t / 12)));
  const bob = Math.sin(t * Math.PI * 2 * 0.925) * 0.03 * walkK;
  const breath = t > 27.8 && t < 31.6 ? Math.sin(clamp((t - 27.8) / 3.0) * Math.PI) * 0.035 : 0;
  const jolt = (t >= EVENT && t < EVENT + 1.5 ? Math.exp(-(t - EVENT) * 3) * 0.06 : 0)
    + (t >= 24 && t < 25.5 ? Math.exp(-(t - 24) * 4) * 0.035 : 0)
    + (t >= HIT && t < HIT + 3 ? Math.exp(-(t - HIT) * 1.8) * 0.18 : 0);
  const [sx, sy] = shake(t * 1.3, 0.012 + jolt);
  camera.position.set(CAM.x + sx * 0.5, CAM.y + bob + breath + sy * 0.5 - (t > HIT ? Math.min(0.25, (t - HIT) * 0.6) * Math.exp(-Math.max(0, t - HIT - 1) * 0.5) : 0), zWalk);
  lookAt(t, look);
  camera.lookAt(tmp.set(look.x + sx * 20, look.y + sy * 20, look.z));
  camera.fov = fovAt(t); camera.updateProjectionMatrix();
  camera.updateMatrixWorld();
  sun.position.copy(camera.position).addScaledVector(SUN_DIR, 140);
  sun.target.position.set(camera.position.x - 10, 0, camera.position.z - 30);
  sky.position.copy(camera.position);

  // --- Wasser: Kräuseln, Bugwelle des Dampfers, Druckwelle
  const fz = CAM.z + frontDist(t);
  const frontOn = t >= FRONT0 - 0.5 && t < HIT + 0.5;
  const after = t >= FRONT0;
  spree.update((x, z) => {
    let h = 0.07 * Math.sin(0.35 * x + w * 1.3) + 0.05 * Math.sin(0.23 * z - w * 1.0 + x * 0.12);
    if (after) {
      const d = fz - z;
      h += 1.3 * Math.exp(-((d / 5) ** 2));
      if (d < 0) h += 0.35 * Math.sin(z * 0.9 + x * 0.6 + w * 9) * Math.exp(d / 60);
    }
    return h;
  });

  // --- Flammen
  grillFlames.forEach((g, i) => {
    const flick = 1 + 0.18 * Math.sin(t * 13 + g.ph) + 0.1 * Math.sin(t * 29 + g.ph * 2);
    const out = t < EVENT ? 1 : Math.max(0, 1 - (t - EVENT) / 0.35);
    g.f.scale.set(g.base * (1 + 0.08 * Math.sin(t * 17 + g.ph)), g.base * flick * out, g.base);
    g.f.visible = out > 0.01;
  });
  G.ember.emissiveIntensity = t < EVENT ? 1.6 + 0.2 * Math.sin(t * 5) : lerp(0.25, 1.6, Math.exp(-(t - EVENT) * 1.2));
  grillLight.intensity = t < EVENT ? 6 + Math.sin(t * 11) * 0.8 : 6 * Math.max(0, 1 - (t - EVENT) / 0.35);
  teas.forEach((tt, i) => {
    const f = tt.tl.userData.flame;
    const out = t < EVENT ? 1 : Math.max(0, 1 - (t - EVENT) / 0.3);
    f.scale.set(f.userData.base, f.userData.base * (1 + 0.15 * Math.sin(t * 9 + tt.ph)) * out, f.userData.base);
    f.visible = out > 0.01;
    glowMats[i].opacity = 0.9 * out;
  });

  // --- Menschen
  for (let i = 0; i < P.length; i++) people.set(i, personState(P[i], t, i));
  people.commit();
  // Zigarette in der Hand des Rauchers (Arm nach vorn gehoben)
  {
    const p = P[SMOKER];
    const ang = -1.3;
    v3.set(0.31, 1.48 + -0.6 * Math.cos(ang), -0.6 * Math.sin(ang) + 0.02).applyAxisAngle(tmp.set(0, 1, 0), p.rotY);
    cig.position.set(p.x + v3.x, v3.y + 0.02, p.z + v3.z);
    cig.rotation.set(0, p.rotY, 0);
    const tipOn = t < EVENT ? 1 : Math.max(0, 1 - (t - EVENT) / 0.6);
    cigTipMat.color.set(tipOn > 0.05 ? "#ff5a1a" : "#3a3633");
    tipGlowMat.opacity = 0.9 * tipOn * (0.8 + 0.2 * Math.sin(t * 3));
    v3.set(0, 0, 0.045).applyAxisAngle(tmp.set(0, 1, 0), p.rotY);
    tipGlow.position.set(cig.position.x + v3.x, cig.position.y, cig.position.z + v3.z);
  }

  // --- Dampfer, Züge, Autos
  const bz = boatZ(t);
  boat.position.set(34, WATER_Y + 0.5 + Math.sin(w * 1.1) * 0.05, bz);
  boat.rotation.set(Math.sin(w * 0.9) * 0.01, 0, Math.sin(w * 0.7) * 0.012 + (t > HIT - 1.8 && t < HIT + 4 ? Math.sin((t - HIT + 1.8) * 3) * 0.04 * Math.exp(-Math.max(0, t - HIT + 1.8) * 0.4) : 0));
  trainA.position.set(trainAx(t), TRACK_Y + 0.12, BRIDGE_Z - 4.6); trainA.rotation.y = Math.PI; trainA.visible = trainAx(t) > -260;
  trainB.position.set(trainBx(t), TRACK_Y + 0.12, BRIDGE_Z - 7.4); trainB.visible = trainBx(t) > -260;
  CARS.forEach((k) => { k.c.position.set(carX(k, t), DECK_Y + 0.36, k.z); });

  // --- Rauch: Partikel steigen; ab dem Ereignis werden keine neuen erzeugt
  const tipPos = tipGlow.position;
  const stack = v3.copy(boat.userData.stackTop).add(boat.position);
  smoke.forEach((p) => {
    const age = ((w / p.period + p.off) % 1) * p.period;
    const born = w - age;
    const alive = born < EVENT || (born > EVENT + 5);     // nach dem Ereignis: Flammen bleiben aus → kein Rauch
    if (!alive || born > EVENT) { p.m.opacity = 0; return; }
    const u = age / p.period;
    let x, y, z, sc;
    if (p.src === 0) { x = GP.x + p.dx * 0.15 + u * 0.6; y = 0.9 + age * 0.55; z = GP.z + p.dz * 0.15 - u * 0.8; sc = 0.2 + u * 0.8; p.m.opacity = 0.16 * (1 - u); }
    else if (p.src === 1) { x = tipPos.x + p.dx * 0.03 + u * 0.15; y = tipPos.y + age * 0.25; z = tipPos.z + p.dz * 0.03; sc = 0.05 + u * 0.35; p.m.opacity = 0.22 * (1 - u); }
    else { x = stack.x + p.dx * 0.3; y = stack.y + age * 0.8; z = stack.z - age * 1.2; sc = 1 + u * 4; p.m.opacity = 0.32 * (1 - u); }
    p.sp.position.set(x, y, z); p.sp.scale.setScalar(sc);
  });

  // --- Druckwelle
  wall.position.z = fz;
  const near = clamp((frontDist(t) - 12) / 40);
  wallMat.opacity = frontOn ? 0.95 * smooth(clamp((t - FRONT0 + 0.5) / 1.5)) * near : 0;
  wall.scale.y = 0.6 + 0.4 * smooth(clamp((t - FRONT0) / 3));
  SD.forEach((p, i) => {
    const vis = after && t < HIT + 6;
    const zz = fz + p.back;
    const life = clamp(1 - p.back / 22);
    const y = WATER_Y + 0.3 + p.h * life * (0.7 + 0.3 * Math.sin(t * 4 + p.ph)) * smooth(clamp((t - FRONT0) / 1.5)) * (t > HIT ? Math.exp(-(t - HIT) * 0.6) : 1);
    o.position.set(p.x, y, zz);
    o.rotation.set(0, 0, 0);
    o.scale.setScalar(vis && zz < 900 ? p.s * (0.4 + life) * clamp((Math.hypot(p.x - CAM.x, zz - CAM.z) - 6) / 25, 0.15, 1) : 0);
    o.updateMatrix(); spray.setMatrixAt(i, o.matrix);
  });
  spray.instanceMatrix.needsUpdate = true;
  BD.forEach((p, i) => {
    const u = (t - (HIT - (p.z - CAM.z) / (SOUND / SLOW))) * 0.9;   // Sekunden seit die Front hier war (gedehnt)
    const y = WATER_Y + p.vy * u - 3.2 * u * u;
    const vis = u > 0 && y > WATER_Y - 0.2 && t < BLACK;
    o.position.set(Math.min(59.2, p.x + p.vx * u), y, p.z + p.vz * u);
    o.rotation.set(0, 0, 0); o.scale.setScalar(vis ? p.s : 0); o.updateMatrix(); burst.setMatrixAt(i, o.matrix);
  });
  burst.instanceMatrix.needsUpdate = true;
  // Blätter und Staub werden aufgewirbelt, sobald die Front sie erreicht
  LD.forEach((p, i) => {
    const passT = HIT - (p.z - CAM.z) / (SOUND / SLOW);   // wann die Front diese Stelle erreicht
    const u = Math.max(0, t - passT);
    const k = Math.min(u, 4);
    const y = 0.02 + (u > 0 ? Math.max(0, p.vy * k - 0.8 * k * k) + 0.6 * Math.sin(k * 2 + p.ph) * (k > 0.3 ? 1 : k / 0.3) : 0);
    o.position.set(p.x + p.vx * k * 0.6, Math.max(0.02, y), p.z + p.vz * k);
    o.rotation.set(u > 0 ? k * p.spin : -Math.PI / 2, u > 0 ? k * p.spin * 0.7 : p.ph, 0);
    o.scale.setScalar(u > 0 ? 1.8 : 1.0);
    o.updateMatrix(); leaves.setMatrixAt(i, o.matrix);
  });
  leaves.instanceMatrix.needsUpdate = true;
  // Bäume biegen sich, wenn die Front vorbeizieht
  bank.trees.forEach((tr) => {
    const passT = HIT - (tr.group.position.z - CAM.z) / (SOUND / SLOW);
    const u = t - passT;
    tr.crown.rotation.z = u > 0 ? Math.sin(u * 2.5 + tr.ph) * 0.35 * Math.exp(-u * 0.5) : 0;
    tr.crown.position.x = u > 0 ? Math.sin(u * 2.5 + tr.ph) * 0.5 * Math.exp(-u * 0.5) : 0;
  });
  // Fenster klirren: kurzes Aufblitzen der Fensterreflexe, wenn die Front vorbeizieht
  bank.houses.forEach((b) => {
    const u = t - (HIT - (b.mesh.position.z - CAM.z) / (SOUND / SLOW));
    b.material.emissiveIntensity = 0.12 + (u > 0 && u < 0.6 ? 0.5 * (1 - u / 0.6) : 0);
  });

  // --- Hände: rechts Mate-Flasche, links Feuerzeug
  const handDrop = smooth(clamp((t - 32) / 2)) * (1 - smooth(clamp((t - 64) / 2)));
  rightHand.position.set(0.15, -0.285, -0.56); rightHand.rotation.set(0.18, 0.2, 1.25); rightHand.userData.curl(0.95);
  bottle.position.set(0.112, -0.225, -0.585); bottle.rotation.set(0.05, 0, -0.06 + Math.sin(t * 0.7) * 0.02);
  const ly = -0.03 * handDrop;
  leftHand.position.set(-0.15, -0.29 + ly, -0.56); leftHand.rotation.set(0.18, -0.2, -1.25); leftHand.userData.curl(0.9);
  lit.position.set(-0.113, -0.232 + ly, -0.585); lit.rotation.set(0.05, 0, 0.08);
  const lf = lit.userData.flame;
  const lOn = t > 1.0 && t < EVENT ? 1 : t >= EVENT ? Math.max(0, 1 - (t - EVENT) / 0.25) : 0;
  lf.scale.set(lf.userData.base, lf.userData.base * (1 + 0.15 * Math.sin(t * 15)) * lOn, lf.userData.base);
  lf.visible = lOn > 0.01;
  lighterLight.position.set(-0.11, -0.16, -0.58); lighterLight.intensity = 0.6 * lOn;
  rig.position.set(0, -bob * 0.4 + breath * 0.3, 0);

  // --- Farblook: warmes Abendlicht; ohne Sauerstoff kühler und flauer; Knall = kurzer Blitz
  const cold = gone ? smooth(clamp((t - EVENT) / 1.5)) : t >= BACK ? 1 - smooth(clamp((t - BACK) / 8)) : 0;
  const flash = t >= HIT && t < HIT + 1.2 ? Math.exp(-(t - HIT) * 4) : 0;
  const blur = t >= 24 && t < 25.6 ? 1.6 * Math.exp(-(t - 24) * 2.5) : 0;
  canvas.style.filter = `saturate(${lerp(1.12, 0.8, cold)}) contrast(${lerp(1.03, 1.1, cold)}) brightness(${1 + flash * 0.5}) hue-rotate(${-6 * cold}deg) blur(${blur.toFixed(2)}px)`;
  hemi.intensity = 1.35 - 0.1 * cold;
  canvas.style.opacity = t < BLACK ? 1 : 0;
  renderer.render(scene, camera);
}

window.addEventListener("hf-seek", (e) => renderAt(e.detail.time));
renderAt(window.__hfThreeTime || 0);
