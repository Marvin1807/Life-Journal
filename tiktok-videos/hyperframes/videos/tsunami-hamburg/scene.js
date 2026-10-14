// Was wäre, wenn ein Tsunami Hamburg trifft? – Twist-Typ "Entscheidung" (wie schwerkraft-wahl).
// Akt 1 Landungsbrücken: Countdown, die Elbe läuft leer, alle machen Fotos. Bei 15 s friert das Bild ein:
// LINKS auf den Michel rennen / RECHTS mit dem Auto raus. Das Video wählt RECHTS.
// Akt 2 im Auto: Stau, Hupen, Wasser fließt durch die Straße. Akt 3: Auto schwimmt, dreht sich,
// die zweite Welle läuft die Straße herauf → HIER.
// Szenen-Zeit ts(t) steht während des Freezes; HUD in Szenen-Zeit (shiftHud), Untertitel in Videozeit.
import { THREE, rng, clamp, smooth, lerp, shake, createSky } from "./lib/lowpoly.js";
import { hand, phone, phoneScreen, mat } from "./lib/props.js";
import { createOverlay, de, countdown, curve } from "./lib/ww-overlay.js";
import { hafen, strasse, egoCar, DRIVER, fischbroetchen } from "./sets.js";

const DURATION = 75;
const BLACK = 70;
const END = 70.5;
const F = 15.0;          // Freeze (Videozeit)
const D = 3.5;           // Dauer des Freezes
const ts = (t) => (t < F ? t : t < F + D ? F : t - D);   // Videozeit → Szenen-Zeit
const V = (x) => (x >= F ? Math.min(x + D, BLACK) : x);  // Szenen-Zeit → Videozeit (für HUD-Phasen)
function shiftHud(cfg) {
  cfg.hud = cfg.hud.map((p) => ({ ...p, start: V(p.start), end: V(p.end),
    value: typeof p.value === "function" ? (t) => p.value(ts(t)) : p.value,
    sub: typeof p.sub === "function" ? (t) => p.sub(ts(t)) : p.sub }));
  return cfg;
}

// --------------------------------------------------------- Zeitplan (Szenen-Zeit) ---
const CUT = F;                 // Schnitt Hafen → Auto (Szenen-Zeit 15 = Videozeit 18,5)
const ARRIVE = 540;            // Welle erreicht die Landungsbrücken: 9:00 nach Start (Echtzeit)
const realSec = (s) => s * 12; // Akt 1: Zeitraffer ×12 (15 s Szene = 3 min)
const HARBOR = 22.5;           // Welle an den Landungsbrücken (Szenen-Zeit)
const FLOOD = 24.5;            // erstes Wasser in deiner Straße
const TURN0 = 37, TURN1 = 41.5;// Strömung dreht das Auto
const WAVE_SPEED = 35 / 3.6;   // 9,72 m/s
const HIT = 62;                // zweite Welle erreicht dich (Videozeit 65,5)
const WAVE_SHOW = 40.6;
const LEVEL0 = -1.3;

const streetLevel = (s) => s < FLOOD ? 0 : curve([[FLOOD, 0.03], [27, 0.1], [29.5, 0.25], [33, 0.6], [37, 0.9], [43.5, 1.15], [HIT, 1.45]], s);
const lift = (s) => Math.max(0, streetLevel(s) - 0.35) * 0.9;
const front = (s) => s < FLOOD ? 1e9 : Math.max(-420, 30 - 16 * (s - FLOOD));
const waveDist = (s) => Math.max(0, WAVE_SPEED * (HIT - s));

// ------------------------------------------------------------------ Overlay ---
const overlay = createOverlay(document.getElementById("overlay"), shiftHud({
  title: { text: "Was wäre, wenn ein Tsunami Hamburg trifft?", accent: "Tsunami", accentColor: "#7fd0e0", start: 0, end: 3.5 },
  hud: [
    { start: 0, end: CUT, label: "Welle erreicht Hamburg in", value: (s) => countdown(ARRIVE - realSec(s)),
      sub: (s) => s < 6.5 ? "Landungsbrücken · Sonntag · 14:49 Uhr" : `Elbe-Pegel: ${de(Math.min(0, hafenLevel(s) - LEVEL0), 2)} m`, fadeIn: 0.01, fadeOut: 0.01 },
    { start: CUT, end: HARBOR, label: "Welle bis zu den Landungsbrücken", value: (s) => `${de(3.5 * (1 - (s - CUT) / (HARBOR - CUT)), 2)} km`,
      sub: (s) => `Dein Tempo: ${de(Math.max(0, 7 * (1 - (s - CUT) / 2.5)))} km/h · Welle: 35 km/h`, fadeIn: 0.01, fadeOut: 0.01 },
    { start: HARBOR, end: FLOOD + 1.5, label: "Welle bis zu den Landungsbrücken", value: () => "0,00 km",
      sub: "Sie ist da. 1,2 km hinter dir.", fadeIn: 0.01, fadeOut: 0.01 },
    { start: FLOOD + 1.5, end: 43.5, label: "Wasser um dein Auto", value: (s) => `${de(streetLevel(s) * 100)} cm`,
      sub: (s) => s < 30.5 ? "Fließt landeinwärts" : "Dein Auto schwimmt", fadeIn: 0.01, fadeOut: 0.01 },
    { start: 43.5, end: HIT, label: "Zweite Welle bis zu dir", value: (s) => `${de(waveDist(s))} m`,
      sub: "Höhe: 7 m · Tempo: 35 km/h", fadeIn: 0.01, fadeOut: 0.01 },
    { start: HIT, end: HIT + 2.4, label: "Zweite Welle bis zu dir", value: () => "HIER", sub: "Höhe: 7 m", fadeIn: 0.01, fadeOut: 0.3 },
  ],
  subtitles: [   // in Videozeit (Freeze schon eingerechnet)
    { start: 3.7, end: 6.6, text: "Hamburg. 100 Kilometer bis zur Nordsee." },
    { start: 6.8, end: 9.4, text: "Dein Handy warnt: Flutwelle, 7 Meter." },
    { start: 9.6, end: 12.2, text: "Dann läuft die Elbe einfach leer." },
    { start: 12.4, end: 14.9, text: "Alle machen Fotos. Keiner rennt." },
    { start: 15.2, end: 18.3, text: "Noch 6 Minuten. Was tust du?" },
    { start: 18.7, end: 22.0, text: "Du sitzt im Auto. Raus aus der Stadt." },
    { start: 22.2, end: 25.6, text: "Alle anderen hatten dieselbe Idee." },
    { start: 25.8, end: 28.8, text: "Stau. Hupen. Nichts bewegt sich." },
    { start: 29.0, end: 32.4, text: "Dann fließt Wasser an dir vorbei." },
    { start: 32.6, end: 36.2, text: "Erst knöcheltief. Dann bis zur Tür." },
    { start: 36.4, end: 40.0, text: "Schon 30 Zentimeter heben ein Auto an." },
    { start: 40.2, end: 43.8, text: "Dann dreht dich die Strömung um." },
    { start: 44.0, end: 47.6, text: "Jetzt siehst du den Michel. Und noch was." },
    { start: 47.8, end: 51.6, text: "Die zweite Welle. Oft ist sie größer." },
    { start: 51.8, end: 55.6, text: "Sie schiebt Autos vor sich her." },
    { start: 55.8, end: 59.6, text: "Der Michel hätte 132 Meter gehabt." },
    { start: 59.8, end: 64.0, text: "Rechts war die falsche Wahl. Oder?" },
    { start: 66.2, end: 69.6, text: "Und dann ist es still." },
  ],
  black: { start: BLACK, end: END },
  endcard: { start: END, end: DURATION, lines: [
    "Du hast RECHTS gewählt: Stau statt Flucht",
    "Echte Sturmflut 1962: 315 Tote in Hamburg",
    "Teil 2: Was wäre LINKS passiert?",
    "Schreib LINKS oder RECHTS in die Kommentare",
  ] },
}));

// ----------------------------------------------------------------- Renderer ---
const canvas = document.getElementById("scene");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1);
renderer.setSize(1080, 1920, false);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.localClippingEnabled = true;

const scene = new THREE.Scene();
scene.fog = new THREE.Fog("#c9d6e0", 120, 1300);
const camera = new THREE.PerspectiveCamera(62, 1080 / 1920, 0.05, 3000);
scene.add(camera);
const sky = createSky(2200); scene.add(sky);
const hemi = new THREE.HemisphereLight("#e8f0ff", "#8a8270", 1.3); scene.add(hemi);
const sun = new THREE.DirectionalLight("#fff0da", 2.6);
sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -60, right: 60, top: 60, bottom: -60, near: 1, far: 400 });
sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.04;
scene.add(sun); scene.add(sun.target);

// ================================================================== Sets ===
const H = hafen(); scene.add(H.group);
const hafenLevel = H.level;
const S = strasse(); scene.add(S.group);
const ego = egoCar(); scene.add(ego.group);

const SCENES = [
  { name: "hafen", start: 0, end: F + D },
  { name: "auto", start: F + D, end: BLACK },
];

// ============================================================ Hände (POV) ===
const rig = new THREE.Group(); camera.add(rig);
const rightHand = hand(1, "#2f3d52"), leftHand = hand(-1, "#2f3d52");
rig.add(rightHand, leftHand);
const bun = fischbroetchen(); rig.add(bun);
const handy = phone(); rig.add(handy);
// Hände am Lenkrad (im Auto, Auto-Koordinaten)
const wheelL = hand(-1, "#2f3d52"), wheelR = hand(1, "#2f3d52");
wheelL.scale.setScalar(0.85); wheelR.scale.setScalar(0.85);
ego.group.add(wheelL, wheelR);
// Blasen unter Wasser (Kamera-Koordinaten)
const BUB = 40;
const bubbles = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.02, 0), new THREE.MeshBasicMaterial({ color: "#cfe7e2", transparent: true, opacity: 0.7 }), BUB);
const BD = []; const R = rng(909);
for (let i = 0; i < BUB; i++) BD.push({ x: R.range(-0.5, 0.5), z: R.range(-1.6, -0.6), v: R.range(0.25, 0.6), ph: R(), s: R.range(0.5, 1.6) });
camera.add(bubbles);

// ======================================================= Entscheidung ===
const choice = document.createElement("div");
choice.style.cssText = "position:absolute;left:0;right:0;top:13%;display:flex;flex-direction:column;align-items:center;gap:34px;opacity:0;pointer-events:none;font-family:'WW Sans',sans-serif;";
choice.innerHTML = `
  <div style="color:#fff;font-weight:600;font-size:46px;letter-spacing:0.18em;text-shadow:0 2px 14px rgba(0,0,0,.6)">WAS TUST DU?</div>
  <div style="display:flex;gap:28px">
    <div class="opt" data-side="l" style="width:400px;padding:30px 26px;border-radius:26px;border:4px solid #fff;background:rgba(20,28,40,.55);color:#fff;text-align:center">
      <div style="font-size:54px;font-weight:600;letter-spacing:0.06em">◀ LINKS</div>
      <div style="font-family:'WW Serif',serif;font-style:italic;font-size:44px;margin-top:12px;line-height:1.1">Auf den Michel rennen</div></div>
    <div class="opt" data-side="r" style="width:400px;padding:30px 26px;border-radius:26px;border:4px solid #fff;background:rgba(20,28,40,.55);color:#fff;text-align:center">
      <div style="font-size:54px;font-weight:600;letter-spacing:0.06em">RECHTS ▶</div>
      <div style="font-family:'WW Serif',serif;font-style:italic;font-size:44px;margin-top:12px;line-height:1.1">Mit dem Auto raus</div></div>
  </div>
  <div style="width:828px;height:12px;border-radius:6px;background:rgba(255,255,255,.25);overflow:hidden"><div class="bar" style="height:100%;background:#fff;transform-origin:left"></div></div>`;
document.getElementById("root").appendChild(choice);
const [optL, optR] = choice.querySelectorAll(".opt");
const bar = choice.querySelector(".bar");
const PICK = F + D - 0.9;     // das Video "wählt" RECHTS
function updateChoice(tv) {
  const vis = tv < F ? 0 : tv < F + D ? smooth((tv - F) / 0.3) : 0;
  choice.style.opacity = vis;
  bar.style.transform = `scaleX(${clamp(1 - (tv - F) / (PICK - F))})`;
  const p = smooth(clamp((tv - PICK) / 0.25));
  optR.style.transform = `scale(${1 + 0.08 * p})`;
  optR.style.background = p > 0.5 ? "#ffffff" : "rgba(20,28,40,.55)";
  optR.style.color = p > 0.5 ? "#141c28" : "#ffffff";
  optL.style.opacity = 1 - 0.6 * p;
}

// ==================================================================== Frame ===
const tmp = new THREE.Vector3(), camW = new THREE.Vector3();
const SUN_HAFEN = new THREE.Vector3(0.55, 0.75, 0.45).normalize();
const SUN_AUTO = new THREE.Vector3(0.75, 0.62, -0.2).normalize();
let lastPhone = "";

function setSky(top, hor, glow) {
  sky.material.uniforms.top.value.set(top); sky.material.uniforms.horizon.value.set(hor);
  sky.material.uniforms.bottom.value.set(hor).multiplyScalar(0.5); sky.material.uniforms.sunGlow.value = glow;
}

function renderAt(tv) {
  tv = clamp(tv, 0, DURATION);
  overlay.update(tv);
  updateChoice(tv);
  const s = ts(tv);
  const sc = tv < F + D ? SCENES[0] : SCENES[1];
  const inHafen = sc.name === "hafen";
  const frz = tv < F ? 0 : tv < F + D ? smooth((tv - F) / 0.5) : 0;

  H.group.visible = inHafen;
  S.group.visible = ego.group.visible = !inHafen;
  for (const o of [rightHand, leftHand, bun, handy]) o.visible = inHafen;

  if (inHafen) {
    // ----------------------------------------------------------- Hafenkante
    if (camera.parent !== scene) scene.add(camera);
    camera.fov = 62 - 8 * frz; camera.near = 0.05; camera.updateProjectionMatrix();
    H.update(s);
    const [sx, sy] = shake(s * 1.2, 0.012);
    const sway = Math.sin(s * 0.6) * 0.03;
    camera.position.set(-1.25 + sway * 0.3 + sx, 1.65 + sy, 2.0);
    const look = smooth((s - 7.6) / 5.4);
    camera.lookAt(tmp.set(lerp(8, 28, look) + sx * 3, lerp(6, -10, look) + sy * 3, lerp(-300, -50, look)));
    camera.updateMatrixWorld();
    setSky("#5f8fc4", "#d7e3ec", 0.35);
    scene.fog.color.set("#c9d6e0"); scene.fog.near = 120; scene.fog.far = 1300;
    scene.background = null; sky.visible = true;
    hemi.color.set("#e8f0ff"); hemi.groundColor.set("#8a8270"); hemi.intensity = 1.3;
    sun.intensity = 2.6; sun.userData.dir = SUN_HAFEN;
    sky.material.uniforms.sunDir.value.copy(SUN_HAFEN);
    renderer.toneMappingExposure = 1.0;

    // Hände: rechts Fischbrötchen, links Handy mit Warnung
    rightHand.position.set(0.15, -0.29, -0.64); rightHand.rotation.set(0.2, 0.15, 1.35); rightHand.userData.curl(0.85);
    bun.position.set(0.105, -0.228, -0.67); bun.rotation.set(0.25, -0.35, -0.12); bun.scale.setScalar(0.8);
    leftHand.position.set(-0.105, -0.285, -0.47); leftHand.rotation.set(-0.12, 0.1, -0.15); leftHand.userData.curl(0.45);
    handy.position.set(-0.098, -0.218, -0.495); handy.rotation.set(-0.55, 0.14, 0.05);
    rig.position.set(0, Math.sin(s * 0.9) * 0.003, 0);
    const clock = `14:${String(49 + Math.floor(realSec(s) / 60)).padStart(2, "0")}`;
    if (clock !== lastPhone) {
      lastPhone = clock;
      handy.userData.screen.redraw((c, w, h) => {
        phoneScreen(c, w, h, { time: clock, title: "TSUNAMI", accent: "#ff5b4a", bg: "#1a0c0c", battery: 71,
          lines: ["Hangrutsch vor Norwegen", "Flutwelle Elbe: ca. 7 m", "Ankunft Hamburg 14:58", "", "Höher gelegene Orte", "sofort aufsuchen!"] });
        c.fillStyle = "#ff5b4a"; c.fillRect(0, 54, w, 10);
        c.fillStyle = "#fff"; c.font = "600 20px Inter, Arial"; c.textAlign = "center"; c.fillText("AMTLICHE WARNUNG", w / 2, 92);
      });
    }
  } else {
    // ------------------------------------------------------------- Auto
    if (camera.parent !== ego.group) ego.group.add(camera);
    const lv = streetLevel(s), L = lift(s);
    const under = s >= HIT + 0.15;
    const creep = smooth((s - CUT) / 2.5);
    const yaw = Math.PI * smooth((s - TURN0) / (TURN1 - TURN0));
    const floatK = clamp(L / 0.2);
    ego.group.position.set(1.75 + Math.sin(s * 0.3) * 0.4 * floatK - 0.6 * smooth((s - TURN0) / 5), L + Math.sin(s * 1.3) * 0.05 * floatK, 3 - 3 * creep - L * 2.5);
    ego.group.rotation.set(Math.sin(s * 1.1 + 1) * 0.035 * floatK, yaw + Math.sin(s * 0.7) * 0.05 * floatK, Math.sin(s * 0.9) * 0.045 * floatK, "YXZ");
    ego.group.updateMatrixWorld();
    const egoZ = ego.group.position.z;
    const d = waveDist(s);
    S.update(s, { level: lv, front: front(s), waveZ: s < WAVE_SHOW ? 1e9 : egoZ + d + 2.4, lift: L, egoZ });

    camera.fov = 64; camera.near = 0.05; camera.updateProjectionMatrix();
    const near = smooth(1 - d / 40);
    const jolt = s > HARBOR && s < HARBOR + 1.2 ? Math.exp(-(s - HARBOR) * 4) * 0.012 : 0;
    const [sx, sy] = shake(s * 1.3, 0.004 + jolt + 0.01 * floatK + 0.02 * near + (under ? 0.05 : 0));
    camera.position.set(DRIVER.x + sx, DRIVER.y + sy, DRIVER.z);
    if (under) {
      const u = s - HIT;
      camera.rotation.set(0.05 + Math.sin(u * 1.3) * 0.15, u * 0.2, Math.sin(u * 0.9) * 0.3);
    } else {
      tmp.set(DRIVER.x + 0.03 + sx * 3, DRIVER.y + 0.3 + near * 1.6 + sy * 3, -10);
      camera.lookAt(ego.group.localToWorld(tmp));
    }
    camera.updateMatrixWorld();

    // Hände am Lenkrad (10 und 2 Uhr)
    wheelL.visible = wheelR.visible = true;
    const grip = Math.sin(s * 9) * 0.004 * (near + floatK * 0.3);
    wheelL.position.set(-0.49, 1.06 + grip, -0.31); wheelL.rotation.set(0.3, -0.25, -0.75); wheelL.userData.curl(0.9);
    wheelR.position.set(-0.25, 1.06 - grip, -0.31); wheelR.rotation.set(0.3, 0.25, 0.75); wheelR.userData.curl(0.9);

    // Licht: grauer Nachmittag, wird dunkler
    const dark = smooth((s - 30) / 25);
    sky.material.uniforms.sunGlow.value = 0.15;
    sky.material.uniforms.top.value.lerpColors(new THREE.Color("#7f97b0"), new THREE.Color("#4f5d6c"), dark);
    sky.material.uniforms.horizon.value.lerpColors(new THREE.Color("#cdd6dd"), new THREE.Color("#8d98a0"), dark);
    sky.material.uniforms.sunDir.value.copy(SUN_AUTO);
    scene.fog.color.lerpColors(new THREE.Color("#c3ccd3"), new THREE.Color("#8e989f"), dark);
    scene.fog.near = 60; scene.fog.far = lerp(700, 480, dark);
    hemi.color.set("#e6edf5"); hemi.groundColor.set("#6d6a60"); hemi.intensity = lerp(1.45, 1.25, dark);
    sun.intensity = lerp(2.2, 1.5, dark); sun.userData.dir = SUN_AUTO;
    renderer.toneMappingExposure = lerp(1.05, 1.1, dark);
    sky.visible = !under; scene.background = under ? new THREE.Color("#23413c") : null;
    if (under) {
      scene.fog.color.set("#23413c"); scene.fog.near = 0.1; scene.fog.far = 6;
      hemi.intensity = 0.9; sun.intensity = 0.3;
      S.wave.visible = false;
    }
    // Blasen
    BD.forEach((b, i) => {
      const u = s - HIT - 0.15;
      const y = -0.4 + ((u * b.v + b.ph) % 1.2);
      tmp.set(b.x + Math.sin(u * 3 + i) * 0.03, y, b.z);
      const m = new THREE.Matrix4().compose(tmp, new THREE.Quaternion(), new THREE.Vector3().setScalar(under ? b.s : 0));
      bubbles.setMatrixAt(i, m);
    });
    bubbles.instanceMatrix.needsUpdate = true;
  }
  bubbles.visible = !inHafen;

  camera.getWorldPosition(camW);
  sun.position.copy(camW).addScaledVector(sun.userData.dir, 160);
  sun.target.position.set(camW.x, 0, camW.z - 20);
  sky.position.copy(camW);

  // Farblook + Schnitt (0,14 s aus Schwarz) + Freeze (grau, dunkler)
  const fadeIn = tv < sc.start ? 1 : sc.start === 0 ? 1 : smooth((tv - sc.start) / 0.14);
  const dark = inHafen ? 0 : smooth((s - 30) / 25);
  canvas.style.filter = `brightness(${fadeIn * (1 - 0.25 * frz)}) saturate(${lerp(1.08, 0.9, dark)}) contrast(${lerp(1.03, 1.1, dark)}) grayscale(${0.75 * frz})`;
  canvas.style.opacity = tv < BLACK ? 1 : 0;
  renderer.render(scene, camera);
}

window.addEventListener("hf-seek", (e) => renderAt(e.detail.time));
renderAt(window.__hfThreeTime || 0);
