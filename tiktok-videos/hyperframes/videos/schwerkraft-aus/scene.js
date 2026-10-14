// "Was wäre, wenn die Schwerkraft 5 Sekunden ausfällt?" – 75 s, ein Ort (Alexanderplatz),
// eine durchgehende POV-Einstellung ohne Wiederholung: Countdown → Schweben → Aufstieg → Fall.
import { THREE, rng, clamp, smooth, lerp, shake, createSky, crowd, fernsehturm, glowTexture } from "./lib/lowpoly.js";
import { hand, coffeeCup, alexanderplatz, pigeons, mat, basic } from "./lib/props.js";
import { createOverlay, de, countdown } from "./lib/ww-overlay.js";

const DURATION = 75;
const EVENT = 20;        // Schwerkraft fällt aus
const SLOW = 6;          // Zeitlupe: 5 echte Sekunden = 30 Videosekunden
const BACK = EVENT + 5 * SLOW;   // 50: Schwerkraft zurück
const PEAK = 23;         // Höhe über dem Boden (m) beim Zurückkehren der Schwerkraft
const FALL_T = Math.sqrt((2 * PEAK) / 9.81);   // ≈ 2,17 s echte Fallzeit
const IMPACT = BACK + FALL_T * SLOW;           // ≈ 63
const BLACK = 70;
const END = 70.5;

const tau = (t) => Math.max(0, (t - EVENT) / SLOW);       // echte Sekunden seit dem Ausfall
const myHeight = (t) => {
  const s = tau(t);
  if (s <= 5) return PEAK * (1 - (1 - s / 5) ** 2);        // steigt, wird oben langsamer
  return Math.max(0, PEAK - 0.5 * 9.81 * (s - 5) ** 2);    // freier Fall
};

// ------------------------------------------------------------------ Overlay ---
const overlay = createOverlay(document.getElementById("overlay"), {
  title: { text: "Was wäre, wenn die Schwerkraft 5 Sekunden ausfällt?", accent: "Schwerkraft", accentColor: "#8fc3ff", start: 0, end: 3.5 },
  hud: [
    { start: 0, end: EVENT, label: "Schwerkraft fällt aus in", value: (t) => countdown(EVENT - t), sub: "Alexanderplatz · Samstag · 12:00 Uhr", fadeIn: 0.01, fadeOut: 0.01 },
    { start: EVENT, end: 28, label: "Schwerkraft zurück in", value: (t) => `${de(Math.max(0, 5 - tau(t)), 3)} s`, sub: `Zeit ${SLOW}× verlangsamt`, fadeIn: 0.01, fadeOut: 0.01 },
    { start: 28, end: 36, label: "Schwerkraft zurück in", value: (t) => `${de(Math.max(0, 5 - tau(t)), 3)} s`,
      sub: (t) => `Wind nach oben: ${de(Math.round(9.81 * Math.min(tau(t), 5) * 3.6))} km/h`, fadeIn: 0.01, fadeOut: 0.01 },
    { start: 36, end: BACK, label: "Deine Höhe", value: (t) => `${de(myHeight(t), 1)} m`,
      sub: (t) => `Wind nach oben: ${de(Math.round(9.81 * Math.min(tau(t), 5) * 3.6))} km/h`, fadeIn: 0.01, fadeOut: 0.01 },
    { start: BACK, end: IMPACT, label: "Bis zum Boden", value: (t) => `${de(myHeight(t), 1)} m`,
      sub: (t) => `Fallgeschwindigkeit: ${de(Math.round(9.81 * Math.max(0, tau(t) - 5) * 3.6))} km/h`, fadeIn: 0.01, fadeOut: 0.01 },
    { start: IMPACT, end: IMPACT + 2.2, label: "Bis zum Boden", value: () => "HIER", sub: "Aufprall mit 76 km/h", fadeIn: 0.01, fadeOut: 0.2 },
    { start: IMPACT + 2.2, end: BLACK, label: "Schwerkraft", value: () => "9,81 m/s²", sub: "Wieder da. Als wäre nichts gewesen.", fadeIn: 0.3, fadeOut: 0.4 },
  ],
  subtitles: [
    { start: 3.7, end: 7.8, text: "Alexanderplatz, Samstagmittag." },
    { start: 8.0, end: 12.3, text: "In 12 Sekunden fällt die Schwerkraft aus." },
    { start: 12.5, end: 16.4, text: "Nur für fünf Sekunden. Klingt harmlos." },
    { start: 16.6, end: 19.9, text: "Keiner hier ahnt etwas." },
    { start: 20.2, end: 24.0, text: "Dein nächster Schritt hebt dich vom Boden." },
    { start: 24.2, end: 28.0, text: "Dein Kaffee schwebt aus dem Becher." },
    { start: 28.2, end: 32.0, text: "Nichts hält die Luft mehr unten." },
    { start: 32.2, end: 36.0, text: "Ein Sturm, der nach oben weht." },
    { start: 36.2, end: 40.5, text: "Tauben, Taschen, Menschen. Alles steigt." },
    { start: 40.7, end: 44.5, text: "Deine Ohren knacken." },
    { start: 44.7, end: 49.8, text: "Und noch höher." },
    { start: 50.2, end: 53.8, text: "Dann ist die Schwerkraft zurück." },
    { start: 54.0, end: 57.8, text: "Alles, was oben ist, fällt." },
    { start: 58.0, end: 60.6, text: "23 Meter." },
    { start: 60.8, end: 63.0, text: "Direkt auf den Neptunbrunnen zu." },
    { start: 64.6, end: 69.6, text: "Fünf Sekunden. Mehr braucht es nicht." },
  ],
  black: { start: BLACK, end: END },
  endcard: { start: END, end: DURATION, lines: [
    "Ohne Schwerkraft würde die Atmosphäre ins All entweichen",
    "Die Erde zieht dich mit 9,81 m/s² nach unten",
    "Was soll als Nächstes ausfallen? Schreib es in die Kommentare",
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
scene.fog = new THREE.Fog("#cfe0ef", 80, 600);
const camera = new THREE.PerspectiveCamera(62, 1080 / 1920, 0.05, 3000);
scene.add(camera);
const sky = createSky(2000); scene.add(sky);
sky.material.uniforms.top.value.set("#5f9be0"); sky.material.uniforms.horizon.value.set("#d6e8f5");
sky.material.uniforms.bottom.value.set("#8a9aa8"); sky.material.uniforms.sunGlow.value = 0.3;
const hemi = new THREE.HemisphereLight("#eaf3ff", "#a89c86", 1.3); scene.add(hemi);
const sun = new THREE.DirectionalLight("#fff1dc", 2.8);
sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -45, right: 45, top: 45, bottom: -45, near: 1, far: 300 });
sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.04;
const SUN_DIR = new THREE.Vector3(-0.4, 0.9, 0.5).normalize();
sky.material.uniforms.sunDir.value.copy(SUN_DIR);
scene.add(sun); scene.add(sun.target);
renderer.toneMappingExposure = 1.0;

// ================================================================== Set ===
const alex = alexanderplatz();
scene.add(alex.group);
const tower = fernsehturm(); tower.group.position.set(-45, 0, -320); tower.group.scale.setScalar(1.0); scene.add(tower.group);
const FP = alex.fountainPos;

// Menschen
const R = rng(512);
const N = 110;
const people = crowd(N, 88); scene.add(people.group);
const P = [];
for (let i = 0; i < N; i++) {
  let x = R.range(-26, 34), z = R.range(-70, 10);
  if (Math.hypot(x - FP.x, z - FP.z) < 10.5) x += 22;
  P.push({ x, z, dir: R() * 6.28, v: R() < 0.7 ? R.range(0.9, 1.5) : 0, ph: R() * 6.28,
           v0: R.range(0.15, 0.9), a: R.range(0.3, 1.5), spin: R.range(-0.8, 0.8) });
}
function personState(p, t) {
  const tt = Math.min(t, EVENT);
  const x = p.x + Math.sin(p.dir) * p.v * tt, z = p.z + Math.cos(p.dir) * p.v * tt;
  if (t < EVENT) return { x, z, rotY: p.dir, swing: p.v ? Math.sin(t * p.v * 4.2 + p.ph) * 0.55 : 0, visible: true };
  const s = tau(t);
  const sUp = Math.min(s, 5);
  const y5 = p.v0 * 5 + 0.5 * p.a * 25, v5 = p.v0 + p.a * 5;
  let y = p.v0 * sUp + 0.5 * p.a * sUp * sUp;
  let landed = false;
  if (s > 5) { const u = s - 5; y = y5 + v5 * u - 4.905 * u * u; if (y <= 0) { y = 0; landed = true; } }
  if (landed) return { x, z, rotY: p.dir, lie: true, visible: true };
  return { x: x + Math.sin(t * 0.3 + p.ph) * 0.2 * sUp, y, z, rotY: p.dir + p.spin * s, swing: Math.sin(t * 3 + p.ph) * 0.3, armRaise: 2.3 + Math.sin(t * 2 + p.ph) * 0.4, visible: true };
}

// Taschen, Flaschen, Hüte, Blätter
const LOOSE = 160;
const loose = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), mat("#ffffff", { roughness: 0.7 }), LOOSE);
const L = []; const lc = new THREE.Color();
for (let i = 0; i < LOOSE; i++) {
  const kind = R();
  L.push({ x: R.range(-24, 34), z: R.range(-66, 8), s: kind < 0.4 ? [0.35, 0.3, 0.15] : kind < 0.7 ? [0.08, 0.25, 0.08] : [0.2, 0.02, 0.15],
           v0: R.range(0.2, 1.2), a: R.range(0.5, 2.0), rx: R.range(-2, 2), ry: R.range(-2, 2) });
  loose.setColorAt(i, lc.set(R.pick(["#7a2b2b", "#2d4b3d", "#3a3f6b", "#d9c39a", "#e9e6dd", "#4f8a3a", "#c98a2e"])));
}
scene.add(loose);
const birds = pigeons(46, 77); scene.add(birds.mesh);

// Spritzer beim Aufprall
const SPL = 120;
const splash = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.12, 0), new THREE.MeshStandardMaterial({ color: "#d9eef8", roughness: 0.1, transparent: true, opacity: 0.85 }), SPL);
const SD = []; for (let i = 0; i < SPL; i++) { const a = R() * 6.28; SD.push({ vx: Math.cos(a) * R.range(1, 6), vz: Math.sin(a) * R.range(1, 6), vy: R.range(4, 11), s: R.range(0.6, 1.6) }); }
scene.add(splash);

// ============================================================ Hände (POV) ===
const rig = new THREE.Group(); camera.add(rig);
const rightHand = hand(1, "#3a4a5e"); rig.add(rightHand);
const cup = coffeeCup(); rig.add(cup);
const coffee = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.012, 1), new THREE.MeshStandardMaterial({ color: "#5a3a22", roughness: 0.2 }), 14);
rig.add(coffee);
const CB = []; for (let i = 0; i < 14; i++) CB.push({ dx: R.range(-0.025, 0.025), dz: R.range(-0.02, 0.02), up: R.range(0.006, 0.016), s: R.range(0.35, 0.9), d: R.range(0, 1.5) });

// ==================================================================== Frame ===
const tmp = new THREE.Vector3(), o = new THREE.Object3D();
const START = new THREE.Vector3(10, 1.65, -8);
function renderAt(t) {
  t = clamp(t, 0, DURATION);
  overlay.update(t);
  const s = tau(t);

  // --- Kamera: gehen → abheben → steigen → fallen → Wasser
  const walk = t < EVENT ? 1 : 0;
  const before = Math.min(t, EVENT) * 0.6;                    // Gehstrecke bis zum Ausfall
  const drift = smooth(clamp(s / 7.2));                       // Drift Richtung Brunnen
  const baseX = lerp(START.x + 0.5, FP.x + 4.6, drift), baseZ = lerp(START.z - before, FP.z + 3.2, drift);
  let eye = 1.65 + myHeight(t);
  const under = t >= IMPACT;
  if (under) eye = 0.25 - Math.min(0.4, (t - IMPACT) * 0.3);
  const bob = Math.sin(t * Math.PI * 2 * 1.85) * 0.022 * walk;
  const tumble = t >= EVENT && t < IMPACT ? 0.02 + s * 0.006 : 0.01;
  const jolt = t >= IMPACT && t < IMPACT + 1.2 ? Math.exp(-(t - IMPACT) * 4) * 0.25 : 0;
  const [sx, sy] = shake(t * 1.3, tumble + jolt);
  camera.position.set(baseX + sx, eye + bob + sy, baseZ);
  // Blick: geradeaus → mit der Höhe immer mehr nach unten → beim Fall senkrecht auf den Brunnen
  const down = smooth(clamp((t - 30) / 22));
  const fallLook = smooth(clamp((t - BACK) / 4));
  if (under) camera.lookAt(tmp.set(baseX + 0.2, 6, baseZ - 3));
  else camera.lookAt(tmp.set(
    lerp(lerp(-25, FP.x, down), FP.x + 4.0, fallLook) + sx * 3,
    lerp(lerp(40, 0, down), 0, fallLook) + sy * 3,
    lerp(lerp(-260, FP.z - 18, down), FP.z + 1.0, fallLook)));
  camera.updateMatrixWorld();
  sun.position.copy(camera.position).addScaledVector(SUN_DIR, 140);
  sun.target.position.set(camera.position.x, 0, camera.position.z - 20);
  sky.position.copy(camera.position);

  // --- Unterwasser nach dem Aufprall
  scene.fog.color.set(under ? "#2c5f74" : "#cfe0ef");
  scene.fog.near = under ? 0.05 : 80; scene.fog.far = under ? 3.5 : 600;
  sky.visible = !under; scene.background = under ? new THREE.Color("#2c5f74") : null;
  hemi.intensity = under ? 0.8 : 1.3;

  // --- Weltzeituhr dreht sich langsam weiter, Atom-Ringe
  alex.atom.rotation.y = t * 0.4;

  // --- Menschen, Gegenstände, Tauben
  for (let i = 0; i < N; i++) people.set(i, personState(P[i], t));
  people.commit();
  L.forEach((b, i) => {
    let y = 0.1;
    if (t >= EVENT) {
      const su = Math.min(s, 5);
      y = 0.1 + b.v0 * su + 0.5 * b.a * su * su;
      if (s > 5) { const u = s - 5; y = Math.max(0.1, 0.1 + b.v0 * 5 + 12.5 * b.a + (b.v0 + 5 * b.a) * u - 4.905 * u * u); }
    }
    o.position.set(b.x, y, b.z); o.rotation.set(b.rx * s, b.ry * s, 0); o.scale.set(...b.s); o.updateMatrix(); loose.setMatrixAt(i, o.matrix);
  });
  loose.instanceMatrix.needsUpdate = true;
  birds.update(t, (p) => {
    if (t < EVENT) return 0.1;
    const su = Math.min(s, 5); let y = 0.1 + 0.8 * su + 0.9 * su * su;
    if (s > 5) y = Math.max(0.1, 0.1 + 4 + 22.5 + 9.8 * (s - 5) - 4.905 * (s - 5) ** 2 + 8 * (s - 5)); // Tauben fliegen einfach weg
    return y;
  });

  // --- Spritzer
  SD.forEach((p, i) => {
    const u = (t - IMPACT) / SLOW * 2.2;
    const vis = u > 0 && u < 1.6;
    o.position.set(FP.x + 4.6 + p.vx * u, 0.6 + p.vy * u - 4.9 * u * u, FP.z + 3.2 + p.vz * u);
    o.rotation.set(0, 0, 0); o.scale.setScalar(vis ? p.s : 0); o.updateMatrix(); splash.setMatrixAt(i, o.matrix);
  });
  splash.instanceMatrix.needsUpdate = true;

  // --- Hände + Kaffee
  rightHand.visible = cup.visible = !under;
  rightHand.position.set(0.12, -0.245, -0.52); rightHand.rotation.set(0.15, 0.25, 1.25); rightHand.userData.curl(0.95);
  cup.position.set(0.075, -0.195, -0.55); cup.rotation.set(0.08, 0, -0.05 + Math.sin(t * 0.8) * 0.05 * (t > EVENT ? 1 : 0));
  rig.position.set(0, -bob * 0.4 + (t > EVENT && t < BACK ? Math.sin(t * 0.9) * 0.01 : 0), 0);
  CB.forEach((c, i) => {
    const u = Math.max(0, s - 0.6 - c.d * 0.3);
    const vis = t > EVENT + 3 && t < BACK && !under;
    o.position.set(0.075 + c.dx + Math.sin(u * 2 + i) * 0.01 * u, -0.12 + u * c.up * 6, -0.55 + c.dz - u * 0.01);
    o.rotation.set(0, 0, 0); o.scale.setScalar(vis ? c.s * (1 + u * 0.2) : 0); o.updateMatrix(); coffee.setMatrixAt(i, o.matrix);
  });
  coffee.instanceMatrix.needsUpdate = true;

  // Farblook: Mittagssonne, beim Fall etwas kälter, unter Wasser blau
  const fall = smooth(clamp((t - BACK) / 6));
  canvas.style.filter = under ? "saturate(1.3) contrast(1.05) brightness(0.9)" : `saturate(${lerp(1.1, 0.9, fall)}) contrast(${lerp(1.03, 1.12, fall)})`;
  canvas.style.opacity = t < BLACK ? 1 : 0;
  renderer.render(scene, camera);
}

window.addEventListener("hf-seek", (e) => renderAt(e.detail.time));
renderAt(window.__hfThreeTime || 0);
