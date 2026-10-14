// "Was wäre, wenn die Erde 5 Sekunden aufhört, sich zu drehen?" – 75 s, ein Ort (Strand Warnemünde),
// eine durchgehende POV-Einstellung: Countdown → Erde steht → alles Lose fliegt mit 980 km/h nach Osten
// → auf die Westmole zu → HIER. Twist ab 65 s: Die Kamera zieht raus ins All, die Erde ist ein
// Tischglobus im Klassenzimmer, den ein Finger angehalten hat – und jetzt wieder anschubst.
// Hinweise ab Sekunde 0: feine Längen-/Breitengrade blitzen zweimal am Himmel auf (9,2 s und 37,4 s),
// genau dann knarzt leise eine Holzachse (audio/sound.json, "creak").
import { THREE, rng, clamp, smooth, lerp, shake, createSky, crowd } from "./lib/lowpoly.js";
import { hand, iceCream, mat, basic } from "./lib/props.js";
import { createOverlay, de, countdown } from "./lib/ww-overlay.js";
import { warnemuende, strandkorb, umbrella, gridLines, classroom } from "./sets.js";

const DURATION = 75;
const EVENT = 20;          // Erde bleibt stehen
const SLOW = 9;            // Zeitlupe: 5 echte Sekunden = 45 Videosekunden
const REVEAL = EVENT + 5 * SLOW;   // 65: die 5 Sekunden sind um, Kamera zieht raus
// 1.670 km/h am Äquator × cos(54,2°) ≈ 980 km/h Bodengeschwindigkeit in Warnemünde
const V = 980 / 3.6;       // 272,2 m/s relativ zum stehenden Boden
const D0 = 1280;           // Entfernung zur Westmole beim Stopp (m)
const TAU_HIT = D0 / V;    // ≈ 4,70 echte Sekunden
const HIT = EVENT + TAU_HIT * SLOW;   // ≈ 62,3
const SPACE = 66.3;        // Schnitt: Globus im All
const SPIN = 68.0;         // Finger gibt Schwung
const BLACK = 70;
const END = 70.5;
const HINTS = [9.2, 37.4]; // Gradnetz blitzt am Himmel auf

const tau = (t) => clamp((t - EVENT) / SLOW, 0, 5);      // echte Sekunden seit dem Stopp
const flown = (t) => Math.min(D0, V * tau(t));           // Strecke über dem Boden (m)

// ------------------------------------------------------------------ Overlay ---
const overlay = createOverlay(document.getElementById("overlay"), {
  title: { text: "Was wäre, wenn die Erde 5 Sekunden aufhört, sich zu drehen?", accent: "Erde", accentColor: "#8fc3ff", start: 0, end: 3.5 },
  hud: [
    { start: 0, end: EVENT, label: "Erde stoppt in", value: (t) => countdown(EVENT - t), sub: "Warnemünde · 54° Nord · Samstag, 15:30 Uhr", fadeIn: 0.01, fadeOut: 0.01 },
    { start: EVENT, end: 30, label: "Weggerissen nach Osten", value: (t) => `${de(Math.round(flown(t)))} m`, sub: `Zeit ${SLOW}× verlangsamt`, fadeIn: 0.01, fadeOut: 0.01 },
    { start: 30, end: 42, label: "Weggerissen nach Osten", value: (t) => `${de(Math.round(flown(t)))} m`, sub: "Wind: 980 km/h · 8× Orkanstärke", fadeIn: 0.01, fadeOut: 0.01 },
    { start: 42, end: HIT, label: "Bis zur Mole", value: (t) => `${de(Math.round(D0 - flown(t)))} m`,
      sub: (t) => `Erde dreht wieder in ${de(5 - tau(t), 3)} s`, fadeIn: 0.01, fadeOut: 0.01 },
    { start: HIT, end: REVEAL, label: "Bis zur Mole", value: () => "HIER",
      sub: (t) => `Erde dreht wieder in ${de(5 - tau(t), 3)} s`, fadeIn: 0.01, fadeOut: 0.2 },
    { start: 66.6, end: BLACK, label: "Globus angehalten", value: () => "5 s", sub: "Erdkunde · Klasse 7b · 3. Stunde", fadeIn: 0.3, fadeOut: 0.4 },
  ],
  subtitles: [
    { start: 3.7, end: 7.6, text: "Warnemünde, Samstagnachmittag, 24 Grad." },
    { start: 7.8, end: 11.8, text: "Du stehst still. Sagst du." },
    { start: 12.0, end: 15.8, text: "Dabei rast der Strand mit 980 km/h nach Osten." },
    { start: 16.0, end: 19.8, text: "Mit dir, dem Eis und der Ostsee." },
    { start: 20.2, end: 23.9, text: "Dann bleibt die Erde stehen. Du nicht." },
    { start: 24.1, end: 27.9, text: "Dein Eis fliegt dir voraus." },
    { start: 28.1, end: 31.9, text: "Unter dir: Sandsturm mit 980 km/h." },
    { start: 32.1, end: 35.9, text: "Strandkörbe, Schirme, Menschen. Alles fliegt mit." },
    { start: 36.1, end: 39.9, text: "Und die Ostsee bäumt sich auf." },
    { start: 40.1, end: 43.9, text: "Nur eins fliegt nicht mit: die Mole." },
    { start: 44.1, end: 47.9, text: "Der Leuchtturm steht fest im Boden." },
    { start: 48.1, end: 51.9, text: "Die Ostsee prallt zuerst gegen die Mole." },
    { start: 52.1, end: 55.9, text: "Noch eine Sekunde, in echter Zeit." },
    { start: 56.1, end: 59.9, text: "Du greifst nach irgendwas. Da ist nichts." },
    { start: 60.1, end: 62.2, text: "Nur noch Gischt." },
    { start: 62.6, end: 64.8, text: "Und dann …" },
    { start: 65.1, end: 69.7, text: "… gibt jemand dem Globus wieder Schwung." },
  ],
  black: { start: BLACK, end: END },
  endcard: { start: END, end: DURATION, lines: [
    "Hast du die Linien am Himmel gesehen?",
    "Am Äquator dreht sich die Erde mit 1.670 km/h, in Warnemünde mit 980 km/h",
    "Wer hält gerade deinen Globus fest? Schreib es in die Kommentare",
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
renderer.toneMappingExposure = 1.05;

const scene = new THREE.Scene();
const FOG = new THREE.Color("#d3e3ee");
scene.fog = new THREE.Fog(FOG.clone(), 150, 2600);
const camera = new THREE.PerspectiveCamera(62, 1080 / 1920, 0.03, 3000);
scene.add(camera);
const sky = createSky(2000); scene.add(sky);
const SKY = { top: new THREE.Color("#4f8fd8"), horizon: new THREE.Color("#dbe9f2"), bottom: new THREE.Color("#6f8ea2") };
sky.material.uniforms.bottom.value.copy(SKY.bottom); sky.material.uniforms.sunGlow.value = 0.35;
const hemi = new THREE.HemisphereLight("#eaf3ff", "#b8a37e", 1.25); scene.add(hemi);
const sun = new THREE.DirectionalLight("#fff0d6", 2.7);
sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -45, right: 45, top: 45, bottom: -45, near: 1, far: 320 });
sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.04;
// Nachmittagssonne aus Südwesten: hinten rechts (Blick nach Osten)
const SUN_DIR = new THREE.Vector3(0.55, 0.6, 0.58).normalize();
sky.material.uniforms.sunDir.value.copy(SUN_DIR);
scene.add(sun); scene.add(sun.target);
const stars = (() => {
  const r = rng(909), n = 1400, pos = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const u = r() * 2 - 1, th = r() * 6.283, rr = Math.sqrt(1 - u * u);
    pos.set([Math.cos(th) * rr * 1400, u * 1400, Math.sin(th) * rr * 1400], i * 3);
  }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  return new THREE.Points(g, new THREE.PointsMaterial({ color: 0xffffff, size: 2.2, sizeAttenuation: false, transparent: true, opacity: 0, fog: false, depthWrite: false }));
})();
scene.add(stars);

// Hinweis: Gradnetz am Himmel (Achse zeigt auf den Himmelsnordpol: Norden, 54° hoch)
const grid = gridLines(1500); grid.rotation.z = (90 - 54) * Math.PI / 180; scene.add(grid);

// ================================================================== Strand ===
const W = warnemuende({ moleZ: -D0 });
scene.add(W.group);
const MOLE = W.moleZ;
const CAM_ZE = 0;                         // Kamera-z beim Stopp (du stehst)

const R = rng(512);
// Menschen
const N = 84;
const people = crowd(N, 54); scene.add(people.group);
const P = [];
for (let i = 0; i < N; i++) {
  let x = R.range(-12, 30), z = R.range(-150, 12);
  if (Math.abs(x - 0.3) < 2.6 && z > -30) x += x > 0.3 ? 4 : -4;
  const k = R();
  const kind = k < 0.3 ? "walk" : k < 0.6 ? "stand" : k < 0.8 ? "sit" : "lie";
  P.push({ x, z, kind, dir: kind === "walk" ? R.pick([0, Math.PI, Math.PI / 2, -Math.PI / 2]) + R.range(-0.3, 0.3) : R() * 6.28,
           v: R.range(0.6, 1.2), ph: R() * 6.28, c: R.range(0.6, 5.5), lift: R.range(0.3, 4.2), spin: R.range(-1.6, 1.6), tumble: R() < 0.7 });
}
function personState(p, t) {
  const tt = Math.min(t, EVENT);
  const walk = p.kind === "walk";
  let x = p.x + (walk ? Math.sin(p.dir) * p.v * tt : 0), z = p.z + (walk ? Math.cos(p.dir) * p.v * tt : 0);
  if (Math.abs(x - 0.3) < 2.6 && z > -26) x += x > 0.3 ? 4.5 : -4.5;   // nie durch die Kamera
  if (t < EVENT) {
    if (p.kind === "sit") return { x, y: -0.43, z, rotY: p.dir, sit: true, visible: true };
    if (p.kind === "lie") return { x, z, rotY: p.dir, lie: true, visible: true };
    return { x, z, rotY: p.dir, swing: walk ? Math.sin(t * p.v * 4.2 + p.ph) * 0.55 : 0, armRaise: p.kind === "stand" ? 0.15 : 0, visible: true };
  }
  const s = tau(t);
  const ahead = z < CAM_ZE - 2;
  const drift = (ahead ? -1 : 1) * p.c * s ** 1.5;
  const y = p.lift * smooth(s / 1.4) * (0.85 + 0.15 * Math.sin(s * 3 + p.ph));
  const zz = z - V * s + drift;
  if (p.tumble && s > 0.12) return { x: x - s * 0.8, y: y + 0.3, z: zz, rotY: p.dir + p.spin * s, lie: true, visible: true };
  return { x: x - s * 0.8, y, z: zz, rotY: p.dir + p.spin * s, swing: Math.sin(t * 2.4 + p.ph) * 0.5, armRaise: 2.1 + Math.sin(t * 1.8 + p.ph) * 0.5, visible: true };
}

// Strandkörbe, Schirme, Handtücher, Bälle
const LOOSE = [];
for (let i = 0; i < 30; i++) {
  let x = R.range(-9, 28), z = R.range(-130, 8);
  if (Math.abs(x - 0.3) < 3.2 && z > -34) x += x > 0.3 ? 5 : -5;
  const o = strandkorb(700 + i); o.position.set(x, 0, z); o.rotation.y = R.range(2.7, 3.6) + Math.PI; scene.add(o);
  LOOSE.push({ o, x, z, ry: o.rotation.y, c: R.range(0.3, 3), lift: R.range(0.2, 1.6), rx: R.range(-0.6, 0.6), rz: R.range(-0.8, 0.8), y0: 0 });
}
for (let i = 0; i < 14; i++) {
  let x = R.range(-8, 28), z = R.range(-120, 6);
  if (Math.abs(x - 0.3) < 3.2 && z > -34) x += x > 0.3 ? 5 : -5;
  const o = umbrella(800 + i); o.position.set(x, 0, z); scene.add(o);
  LOOSE.push({ o, x, z, ry: 0, c: R.range(1, 7), lift: R.range(2, 9), rx: R.range(-2.5, 2.5), rz: R.range(-2.5, 2.5), y0: 0 });
}
const towelCols = ["#2f6fb0", "#d24a3a", "#e8b23a", "#f2f2ee", "#3a8a6a", "#c86aa0"];
for (let i = 0; i < 20; i++) {
  let x = R.range(-9, 28), z = R.range(-120, 6);
  if (Math.abs(x - 0.3) < 3 && z > -30) x += x > 0.3 ? 5 : -5;
  const o = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.02, 1.8), mat(R.pick(towelCols))); o.position.set(x, 0.01, z); o.rotation.y = R() * 3; o.receiveShadow = true; scene.add(o);
  LOOSE.push({ o, x, z, ry: o.rotation.y, c: R.range(1, 8), lift: R.range(1, 6), rx: R.range(-3, 3), rz: R.range(-3, 3), y0: 0.01 });
}
for (let i = 0; i < 6; i++) {
  let x = R.range(-6, 20), z = R.range(-60, -8);
  if (Math.abs(x - 0.3) < 2.5) x += 4;
  const o = new THREE.Mesh(new THREE.IcosahedronGeometry(0.17, 1), mat(R.pick(["#e8423a", "#f2c744", "#3a7ad9"]), { roughness: 0.4 })); o.position.set(x, 0.17, z); o.castShadow = true; scene.add(o);
  LOOSE.push({ o, x, z, ry: 0, c: R.range(2, 9), lift: R.range(1, 5), rx: R.range(-4, 4), rz: R.range(-4, 4), y0: 0.17 });
}

// Sandkörner / Sandsturm: Streifen, die unter dir nach hinten rasen
const STREAKS = 760;
const streaks = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial({ color: "#efe2bf", transparent: true, opacity: 0.8 }), STREAKS);
const SK = [];
for (let i = 0; i < STREAKS; i++) {
  let px = R.range(-16, 16); if (Math.abs(px) < 1.3) px += px < 0 ? -1.3 : 1.3;
  SK.push({ px, h: R(), sp: R.range(0.35, 1.0), p0: R(), th: R.range(0.03, 0.075) });
}
streaks.frustumCulled = false; scene.add(streaks);

// Ostsee bäumt sich auf: lange Wasserwalze links neben dir (fliegt mit dir)
const waveGeo = (() => {
  const NV = 14, NU = 90, pos = [], col = [], idx = [];
  const sea = new THREE.Color("#2f78a8"), deep = new THREE.Color("#1f4f78"), foam = new THREE.Color("#eef6f8");
  const wr = rng(31);
  const noise = []; for (let u = 0; u <= NU; u++) noise.push(0.75 + 0.25 * Math.sin(u * 0.37) + 0.12 * Math.sin(u * 1.3 + 2) + wr.range(-0.05, 0.05));
  for (let u = 0; u <= NU; u++) for (let v = 0; v <= NV; v++) {
    const f = v / NV;
    const prof = f < 0.78 ? (f / 0.78) ** 2 : 1 - ((f - 0.78) / 0.22) ** 1.6 * 0.97;
    pos.push(lerp(-80, -16, f) + (f > 0.78 ? -2.5 * Math.sin((f - 0.78) / 0.22 * Math.PI) : 0), prof * noise[u], -u / NU);
    const c = deep.clone().lerp(sea, Math.min(1, f * 1.3)).lerp(foam, Math.exp(-(((f - 0.79) / 0.045) ** 2)) * 0.95);
    col.push(c.r, c.g, c.b);
  }
  for (let u = 0; u < NU; u++) for (let v = 0; v < NV; v++) {
    const a = u * (NV + 1) + v, b = a + 1, c = a + NV + 1, d = c + 1;
    idx.push(a, c, b, b, c, d);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
  g.setIndex(idx); g.computeVertexNormals();
  return g;
})();
const wave = new THREE.Mesh(waveGeo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.3, metalness: 0.0, flatShading: true, side: THREE.DoubleSide, fog: false }));
wave.frustumCulled = false; scene.add(wave);
const FOAMN = 260;
const foamMesh = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 0), new THREE.MeshStandardMaterial({ color: "#f4f8fa", roughness: 0.6, transparent: true, opacity: 0.9 }), FOAMN);
const FM = []; for (let i = 0; i < FOAMN; i++) FM.push({ u: R.range(0.18, 1), dx: R.range(-6, 1), up: R.range(0, 1.2), s: R.range(0.2, 0.6), ph: R() * 6.28 });
foamMesh.frustumCulled = false; scene.add(foamMesh);

// Gischt an der Mole: Die Ostsee prallt dagegen
const SPRAYN = 520;
const spray = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 0), new THREE.MeshStandardMaterial({ color: "#ffffff", roughness: 0.9, transparent: true, opacity: 0.72, emissive: "#ffffff", emissiveIntensity: 0.25, depthWrite: false }), SPRAYN);
const SP = []; const sc = new THREE.Color();
for (let i = 0; i < SPRAYN; i++) {
  const x = R.range(-334, 20);
  SP.push({ x, per: R.range(1.4, 3.0), ph: R(), k: R.range(0.35, 1.0), back: R.range(4, 30), s: R.range(1.2, 3.6), dx: R.range(-6, 6) });
  spray.setColorAt(i, sc.set(x > -14 ? "#f1e8d2" : R() < 0.7 ? "#ffffff" : "#e2eef3"));
}
spray.frustumCulled = false; scene.add(spray);

// ============================================================ Hände (POV) ===
const rig = new THREE.Group(); camera.add(rig);
const rightHand = hand(1, "#5f87a8"); rig.add(rightHand);
const leftHand = hand(-1, "#5f87a8"); rig.add(leftHand);
const ice = iceCream(); ice.scale.setScalar(0.78); rig.add(ice);

// ========================================================== Klassenzimmer ===
const ROOM = new THREE.Vector3(6000, 0, 0);
const C = classroom();
const room = C.group; room.position.copy(ROOM); scene.add(room);
const standKids = C.stand.children;
const students = crowd(12, 77); room.add(students.group);
C.desks.forEach(([x, z], i) => students.set(i, { x: x + (i % 2 ? 0.25 : -0.25), y: -0.43, z: z - 0.55, rotY: 0, sit: true, armRaise: i === 5 ? 2.9 : 0.6, visible: true }));
students.commit();
const GC = C.globeCenter.clone().add(ROOM);                    // Globusmitte in Weltkoordinaten
const ELEV = (54.18 - 23.44) * Math.PI / 180;                   // Warnemünde zeigt genau zur Kamera
const VIEW = new THREE.Vector3(0, Math.sin(ELEV), Math.cos(ELEV));
const SPIN0 = -Math.PI / 2 - 12.08 * Math.PI / 180;
const globeLight = new THREE.SpotLight("#fff4e0", 0, 4, 0.32, 0.5, 0);
scene.add(globeLight); scene.add(globeLight.target);
const teacher = hand(1, "#7a4e3a"); scene.add(teacher);
const roomStars = (() => {
  const r = rng(919), n = 900, pos = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const u = r() * 2 - 1, th = r() * 6.283, rr = Math.sqrt(1 - u * u);
    pos.set([GC.x + Math.cos(th) * rr * 3, GC.y + u * 3, GC.z + Math.sin(th) * rr * 3], i * 3);
  }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  return new THREE.Points(g, new THREE.PointsMaterial({ color: 0xffffff, size: 2.0, sizeAttenuation: false, transparent: true, opacity: 0, depthWrite: false }));
})();
scene.add(roomStars);

// ==================================================================== Frame ===
const tmp = new THREE.Vector3(), o = new THREE.Object3D(), dir = new THREE.Vector3();
const gauss = (t, c, w) => Math.exp(-(((t - c) / w) ** 2));

function camState(t) {
  const s = tau(t);
  if (t < EVENT) {
    const bob = Math.sin(t * Math.PI * 2 * 0.25) * 0.008;   // ruhiges Atmen, du stehst
    return { x: 0.3, y: 1.65 + bob, z: 0, yaw: 0.2 + 0.07 * Math.sin(t * 0.33 + 0.4) * smooth(t / 4), pitch: -0.07 - 0.03 * Math.sin(t * 0.21), roll: 0, amp: 0.006, bob };
  }
  const eye = s < 0.35 ? 1.65 - 0.55 * smooth(s / 0.35) : 1.1 + 2.3 * smooth((s - 0.35) / 3.6) + 0.18 * Math.sin(s * 3.1);
  const look = smooth(clamp((t - 35.4) / 1.6)) * (1 - smooth(clamp((t - 40.6) / 2.0)));
  const pitch = lerp(-0.13 + 0.05 * smooth(clamp((t - 28) / 6)), 0.04, look) + 0.05 * smooth(clamp((t - 44) / 16));
  const yaw = lerp(lerp(0.2, 0.05, smooth(clamp((t - EVENT) / 6))), 0.95, look);
  const roll = 0.07 * Math.sin(s * 1.9) + 0.035 * Math.sin(s * 4.3 + 1);
  const z = CAM_ZE - flown(t);
  return { x: 0.3 - 3 * smooth(s / 4.7), y: eye, z, yaw, pitch, roll, amp: 0.02 + s * 0.006 + (t < EVENT + 1.2 ? Math.exp(-(t - EVENT) * 3) * 0.18 : 0), bob: 0 };
}

function renderBeach(t) {
  const s = tau(t);
  const c = camState(t);
  const [sx, sy] = shake(t * 1.4, c.amp);
  let { x, y, z, yaw, pitch, roll } = c;
  // nach dem Aufprall: in der Gischt, dann nach oben aus der Atmosphäre
  const rise = smooth(clamp((t - 63.9) / 2.3));
  if (t >= HIT) {
    z = MOLE + 2; y = 3.4 + 2 * smooth(clamp((t - HIT) / 1.5));
    pitch = lerp(0.08, 1.5, smooth(clamp((t - 63.6) / 1.4))); yaw = 0.03; roll *= 1 - rise;
    y += 2800 * (rise ** 2.2);
  }
  camera.position.set(x + sx, y + sy, z);
  dir.set(-Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), -Math.cos(yaw) * Math.cos(pitch));
  camera.lookAt(tmp.copy(camera.position).add(dir));
  camera.rotateZ(roll);
  camera.updateMatrixWorld();
  sun.position.copy(camera.position).addScaledVector(SUN_DIR, 150);
  sun.target.position.set(camera.position.x, 0, camera.position.z - 25);
  sky.position.copy(camera.position); stars.position.copy(camera.position); grid.position.copy(camera.position);
  sky.visible = true; scene.background = null;

  // Himmel: am Ende ins All
  const space = smooth(clamp((t - 64.9) / 1.2));
  sky.material.uniforms.top.value.copy(SKY.top).lerp(new THREE.Color("#000006"), space);
  sky.material.uniforms.horizon.value.copy(SKY.horizon).lerp(new THREE.Color("#0b1a3a"), space);
  sky.material.uniforms.sunGlow.value = 0.35 * (1 - space);
  // in der Gischt: alles weiß, dann reißt der Himmel auf
  const mist = t >= HIT ? 1 - smooth(clamp((t - 63.7) / 1.0)) : 0;
  const WH = new THREE.Color("#f4f7f8");
  sky.material.uniforms.bottom.value.copy(SKY.bottom).lerp(new THREE.Color("#000006"), space);
  for (const k of ["top", "horizon", "bottom"]) sky.material.uniforms[k].value.lerp(WH, mist);
  const gone = t >= HIT + 0.25;
  W.group.visible = !gone; people.group.visible = !gone;
  for (const L of LOOSE) L.o.visible = !gone;
  stars.material.opacity = smooth(clamp((t - 65.3) / 0.8));
  // Hinweis: Gradnetz blitzt zweimal kurz auf, beim Weg ins All bleibt es stehen
  grid.material.opacity = 0.55 * (gauss(t, HINTS[0], 0.32) + gauss(t, HINTS[1], 0.32)) + 0.4 * smooth(clamp((t - 65.4) / 0.8));

  // Nebel: Sandsturm, dann Gischt (Weiß), dann klarer Himmel
  const storm = smooth(clamp((t - 26) / 6)) * (1 - 0.6 * smooth(clamp((t - 42) / 4)));
  const white = t >= HIT ? 1 - smooth(clamp((t - 63.8) / 1.2)) : smooth(clamp((t - 59.5) / 2.8)) * 0.6;
  scene.fog.color.copy(FOG).lerp(new THREE.Color("#d8c7a2"), storm * 0.8).lerp(new THREE.Color("#f3f6f7"), white);
  scene.fog.near = lerp(lerp(150, 40, storm), t >= HIT ? 0.2 : 8, white);
  scene.fog.far = lerp(lerp(2600, 1500, storm), t >= HIT ? 6 : 160, white);
  if (t >= 64.4) { scene.fog.near = 1e5; scene.fog.far = 2e5; }
  hemi.intensity = 1.25; sun.intensity = 2.7 * (1 - space);
  hemi.color.set("#eaf3ff");

  // Menschen
  for (let i = 0; i < N; i++) people.set(i, personState(P[i], t));
  people.commit();
  // Lose Dinge: fliegen mit dir, aber dir etwas voraus
  for (const L of LOOSE) {
    if (t < EVENT) { L.o.position.set(L.x, L.y0, L.z); L.o.rotation.set(0, L.ry, 0); continue; }
    const ahead = L.z < CAM_ZE - 2;
    L.o.position.set(L.x - s * 0.6, L.y0 + L.lift * smooth(s / 1.6) * (0.9 + 0.1 * Math.sin(s * 4 + L.rx)), L.z - V * s + (ahead ? -1 : 1) * L.c * s ** 1.5);
    L.o.rotation.set(L.rx * s, L.ry + L.rz * s * 0.5, L.rz * s);
  }

  // Sandstreifen
  const dens = t < EVENT ? 0 : 0.18 + 0.82 * smooth(clamp((t - 21) / 8));
  const hs = 0.35 + 4.5 * smooth(clamp((t - 24) / 9));
  const rel = V / SLOW;     // ≈ 30 m pro Videosekunde
  SK.forEach((k, i) => {
    const vis = i < STREAKS * dens && t < HIT;
    const pz = -80 + (((k.p0 * 85 + (t - EVENT) * rel * k.sp) % 85) + 85) % 85;
    const len = 0.5 + rel * k.sp * 0.07;
    o.position.set(camera.position.x + k.px, 0.06 + k.h ** 1.7 * hs, camera.position.z + pz);
    o.rotation.set(0, 0, 0); o.scale.set(vis ? k.th : 0, vis ? k.th : 0, len); o.updateMatrix(); streaks.setMatrixAt(i, o.matrix);
  });
  streaks.instanceMatrix.needsUpdate = true;

  // Wasserwalze links
  const H = t < EVENT ? 0 : 0.6 + 11 * smooth(clamp((t - 27) / 12));
  const front = Math.max(MOLE + 6, c.z - 420);
  const back = c.z + 40;
  wave.visible = t >= EVENT && t < HIT + 1;
  wave.position.set(0, -0.3, back); wave.scale.set(1, Math.max(0.01, H), back - front);
  FM.forEach((f, i) => {
    const zz = lerp(back, front, f.u);
    const vis = H > 1 && t < HIT;
    o.position.set(-20 + f.dx + Math.sin(t * 1.3 + f.ph) * 0.6, H * (0.92 + 0.1 * f.up) + Math.sin(t * 2 + f.ph) * 0.4, zz);
    o.rotation.set(f.ph, f.ph * 2, 0); o.scale.setScalar(vis ? f.s * (0.6 + H / 12) : 0); o.updateMatrix(); foamMesh.setMatrixAt(i, o.matrix);
  });
  foamMesh.instanceMatrix.needsUpdate = true;

  // Gischt an der Mole
  const amp = t < EVENT ? 0 : 6 + 34 * smooth(s / 4.7);
  SP.forEach((p, i) => {
    const a = (((t - EVENT) / p.per + p.ph) % 1 + 1) % 1;
    const vis = t >= EVENT && t < HIT + 0.6;
    o.position.set(p.x + p.dx * a, 4 * amp * p.k * a * (1 - a) + 1, MOLE + 1 + p.back * a);
    o.rotation.set(a * 3, p.ph * 6, 0); o.scale.setScalar(vis ? p.s * (0.5 + a) * (0.6 + amp / 40) : 0); o.updateMatrix(); spray.setMatrixAt(i, o.matrix);
  });
  spray.instanceMatrix.needsUpdate = true;

  // --- Hände + Eis
  const handsOn = t < HIT;
  rightHand.visible = leftHand.visible = handsOn;
  const fl = Math.max(0, s - 0.3) * SLOW;        // Videosekunden seit dem Loslassen
  rightHand.position.set(0.125, -0.27, -0.53);
  rightHand.rotation.set(0.15 + (t > EVENT ? 0.12 * Math.sin(t * 2.3) : 0), 0.25, 1.25);
  rightHand.userData.curl(t < EVENT + 2.7 ? 0.95 : lerp(0.95, 0.25, smooth(clamp((t - EVENT - 2.7) / 1.2))));
  if (fl <= 0) {
    ice.position.set(0.082, -0.185, -0.56); ice.rotation.set(0.05, 0, -0.06);
    ice.userData.top.position.set(0, 0.095, 0);
  } else {
    ice.position.set(0.082 - fl * 0.02, -0.185 + fl * 0.035 + Math.sin(fl * 0.9) * 0.03, -0.55 - fl * fl * 0.06);
    ice.rotation.set(fl * 0.5, fl * 0.3, -0.06 + fl * 0.7);
    ice.userData.top.position.set(fl * 0.012, 0.095 + fl * 0.02, -fl * 0.015);
  }
  ice.visible = handsOn && fl < 9;
  // linke Hand greift ins Leere (56–60 s)
  const reach = smooth(clamp((t - 55.6) / 1.2)) * (1 - smooth(clamp((t - 60.5) / 1.2)));
  leftHand.visible = handsOn && reach > 0.01;
  leftHand.position.set(-0.14 + 0.02 * Math.sin(t * 3), lerp(-0.42, -0.2, reach), lerp(-0.4, -0.58, reach));
  leftHand.rotation.set(0.12, -0.22, -1.1);
  leftHand.userData.curl(t < 58.3 ? 0.1 : lerp(0.1, 0.75, smooth(clamp((t - 58.3) / 0.6))));
  rig.position.set(0, -c.bob * 0.4, 0);

  // Weißblitz beim Aufprall
  const flash = t >= HIT ? Math.exp(-(t - HIT) * 2.5) : 0;
  canvas.style.filter = `saturate(${lerp(1.08, 0.92, storm)}) contrast(${1.03 + 0.04 * storm}) brightness(${1 + flash * 0.6})`;
  canvas.style.opacity = 1;
  room.visible = teacher.visible = roomStars.visible = false;
  renderer.render(scene, camera);
}

function renderRoom(t) {
  // Vom All zurück ins Klassenzimmer: dieselbe Blickachse, nur weiter weg.
  const pull = smooth(clamp((t - SPACE) / 1.7));
  const dist = lerp(0.235, 1.12, pull);
  camera.position.copy(GC).addScaledVector(VIEW, dist);
  camera.position.x += lerp(0, 0.05, pull);
  camera.lookAt(tmp.copy(GC).add(new THREE.Vector3(0, lerp(0, -0.02, pull), 0)));
  camera.updateMatrixWorld();
  const lights = smooth(clamp((t - 66.95) / 0.75));
  const roomOn = t > 66.9;
  W.group.visible = false; sky.visible = false; stars.visible = false; grid.visible = true;
  people.group.visible = false;
  for (const L of LOOSE) L.o.visible = false;
  streaks.visible = wave.visible = foamMesh.visible = spray.visible = false;
  rightHand.visible = leftHand.visible = ice.visible = false;
  room.visible = true;
  room.children.forEach((ch) => { if (ch !== C.stand) ch.visible = roomOn; });
  standKids.forEach((ch) => { ch.visible = ch === C.tilt || roomOn; });
  // Gradnetz-Linien um den Globus (wie am Himmel) verblassen ins Gradnetz des Globus
  grid.position.copy(GC); grid.scale.setScalar((C.R * 1.06) / 1500); grid.rotation.set(C.tilt.rotation.x, 0, 0);
  grid.material.opacity = 0.5 * (1 - smooth(clamp((t - 66.5) / 0.6)));
  roomStars.visible = true; roomStars.material.opacity = 1 - smooth(clamp((t - 66.55) / 0.35));
  scene.background = new THREE.Color("#000004").lerp(new THREE.Color("#2a2620"), lights);
  scene.fog.near = 1e5; scene.fog.far = 2e5;
  hemi.intensity = 1.05 * lights; hemi.color.set("#fff4e6");
  sun.intensity = 2.0 * lights;
  sun.position.set(GC.x - 4, GC.y + 3.2, GC.z - 1.2); sun.target.position.copy(GC);
  globeLight.intensity = lerp(9, 3, lights);
  globeLight.position.copy(GC).addScaledVector(VIEW, 1.0).add(new THREE.Vector3(-0.6, 0.5, 0));
  globeLight.target.position.copy(GC);
  // Globus: steht still, bis der Finger ihn anschubst; dann dreht er nach Osten und wird langsamer
  const after = Math.max(0, t - SPIN - 0.12);
  C.spin.rotation.y = SPIN0 + (7.5 * (1 - Math.exp(-after * 0.35)) / 0.35);
  // Finger der Lehrkraft: liegt auf Europa, schiebt nach rechts, hebt ab
  const push = smooth(clamp((t - SPIN) / 0.28)), lift = smooth(clamp((t - SPIN - 0.22) / 0.7));
  const n = new THREE.Vector3(0.42 + 0.55 * push, 0.32, 0).add(VIEW).normalize();
  const tip = tmp.copy(GC).addScaledVector(n, C.R + 0.004);
  const away = new THREE.Vector3(0.62, 0.42, 0.62).normalize();
  const wrist = tip.clone().addScaledVector(away, 0.16).add(new THREE.Vector3(0.03, 0.12, 0.08).multiplyScalar(lift));
  teacher.position.copy(wrist);
  teacher.lookAt(wrist.clone().multiplyScalar(2).sub(tip));
  teacher.rotateZ(-0.35);
  teacher.userData.curl(0.95);
  teacher.children[6].rotation.x = -0.05;
  teacher.visible = true;
  canvas.style.filter = "saturate(1.06) contrast(1.03)";
  canvas.style.opacity = t < BLACK ? 1 : 0;
  renderer.render(scene, camera);
}

function renderAt(t) {
  t = clamp(t, 0, DURATION);
  overlay.update(t);
  if (t >= SPACE) return renderRoom(t);
  // Strand: alles zurück auf sichtbar
  people.group.visible = true;
  for (const L of LOOSE) L.o.visible = true;
  streaks.visible = foamMesh.visible = spray.visible = true;
  grid.visible = true; grid.scale.setScalar(1); grid.rotation.set(0, 0, (90 - 54) * Math.PI / 180);
  stars.visible = true;
  globeLight.intensity = 0;
  renderBeach(t);
}

window.addEventListener("hf-seek", (e) => renderAt(e.detail.time));
renderAt(window.__hfThreeTime || 0);
