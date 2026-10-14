// "Was wäre, wenn die Sonne verschwindet?" – 30 s, POV, eine Szene pro Satz.
import { THREE, rng, clamp, smooth, lerp, shake, createSky, createStars,
         windowTextures, building, crowd, car, streetLamp, glowTexture, fernsehturm } from "./lib/lowpoly.js";
import { hand, phone, phoneScreen, iceCream, thermometer, diveLamp, pottedPlant, beach, balcony,
         frozenRiver, deepSeaVents, box, cyl, mat, basic, canvasTexture } from "./lib/props.js";
import { createOverlay, de, countdown, curve } from "./lib/ww-overlay.js";

const DURATION = 30;
const EVENT = 6;          // das letzte Sonnenlicht erreicht die Erde
const RETURN = 24;        // zurück in die Wirklichkeit: Die Sonne ist noch da
const BLACK = 27.0;
const END = 27.4;

// ------------------------------------------------------------------ Overlay ---
const days = (t) => curve([[EVENT, 0], [9, 0.003], [12, 0.02], [12.01, 5], [15, 8], [18, 60], [19, 365], [21, 400], [24, 5000]], t);
const fmtDays = (t) => { const d = days(t); return d < 1 ? `${de(d * 24 * 60, 1)} Minuten` : `${de(d, d < 100 ? 2 : 0)} Tagen`; };
const noSun = (sub) => ({ label: "Ohne Sonne seit", value: fmtDays, sub, fadeIn: 0.01, fadeOut: 0.01 });
const tempStr = (c) => `Temperatur: ${c < 0 ? "−" : ""}${de(Math.abs(c), 1)} °C`;
const overlay = createOverlay(document.getElementById("overlay"), {
  title: { text: "Was wäre, wenn die Sonne verschwindet?", accent: "Sonne", accentColor: "#f2b84b", start: 0, end: 3.1 },
  hud: [
    { start: 0, end: EVENT, label: "Sonnenlicht erreicht dich noch", value: (t) => countdown(EVENT - t),
      sub: "Licht braucht 8 Min. 20 Sek. bis zur Erde", fadeIn: 0.01 },
    { start: EVENT, end: 9, ...noSun("Erde fliegt geradeaus · 107.000 km/h") },
    { start: 9, end: 12, ...noSun("Mond: kein Licht mehr") },
    { start: 12, end: 15, ...noSun((t) => tempStr(lerp(2, -17, smooth((t - 12.2) / 2.6)))) },
    { start: 15, end: 18, ...noSun("Photosynthese: 0 %") },
    { start: 18, end: 21, ...noSun((t) => tempStr(lerp(-48, -73, smooth((t - 18.2) / 2.4)))) },
    { start: 21, end: RETURN, ...noSun("Schwarze Raucher: bis zu 400 °C") },
    { start: RETURN, end: BLACK, label: "Die Sonne", value: () => "NOCH DA", sub: "Noch rund 5 Milliarden Jahre", fadeIn: 0.01, fadeOut: 0.3 },
  ],
  subtitles: [
    { start: 3.2, end: 6.0, text: "Sommer am Wannsee. Die Sonne ist schon weg." },
    { start: 6.2, end: 9.0, text: "Schlagartig wird es Nacht. Mitten am Tag." },
    { start: 9.15, end: 12.0, text: "Auch der Mond wird dunkel." },
    { start: 12.15, end: 15.0, text: "Nach einer Woche: rund minus 17 Grad." },
    { start: 15.15, end: 18.0, text: "Ohne Licht sterben die Pflanzen." },
    { start: 18.15, end: 21.0, text: "Nach einem Jahr: minus 73 Grad." },
    { start: 21.15, end: 24.0, text: "Nur in der Tiefsee gibt es noch Leben." },
    { start: 24.15, end: 25.75, text: "Keine Sorge. Die Sonne bleibt uns erhalten.", fadeOut: 0.25 },
    { start: 25.9, end: 27.0, text: "Dein Eis leider nicht.", fadeIn: 0.2, fadeOut: 0.3 },
  ],
  black: { start: BLACK, end: END },
  endcard: { start: END, end: DURATION, lines: ["Sonnenlicht braucht 8 Minuten und 20 Sekunden zu dir", "ohne Sonne wären es nach einem Jahr rund −73 °C"] },
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
scene.fog = new THREE.Fog("#cfe3f2", 80, 700);
const camera = new THREE.PerspectiveCamera(62, 1080 / 1920, 0.05, 3000);
scene.add(camera);
const sky = createSky(); scene.add(sky);
const stars = createStars(1400); scene.add(stars);
const hemi = new THREE.HemisphereLight("#ffffff", "#5a4a3a", 1.0); scene.add(hemi);
const sun = new THREE.DirectionalLight("#fff1d6", 2.4);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -30, right: 30, top: 30, bottom: -30, near: 1, far: 300 });
sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.04;
scene.add(sun); scene.add(sun.target);
const R = rng(77);

// ================================================================ Wannsee ===
const strand = beach();
const bathers = crowd(46, 12);
strand.group.add(bathers.group);
const B = [];
for (let i = 0; i < 46; i++) {
  const lying = i % 3 !== 0;
  let x = R.range(-20, 20), z = R.range(-28, -3);
  if (Math.abs(x) < 2.2 && z > -9) x += x < 0 ? -3 : 3;
  B.push({ lying, x, z, rotY: R() * 6.28, walk: !lying && R() < 0.5, v: R.range(0.6, 1.1), ph: R() * 6, look: 6.3 + R() * 1.2 });
}
function batherState(b, t) {
  if (b.lying) return { x: b.x, z: b.z, rotY: b.rotY, lie: true, visible: true };
  const tt = Math.min(t, EVENT + 0.4);
  const s = b.walk ? b.v * tt : 0;
  const z = b.z + Math.cos(b.rotY) * s, x = b.x + Math.sin(b.rotY) * s;
  const night = t > EVENT && t < RETURN;
  return { x, z, rotY: b.rotY, swing: b.walk && t < EVENT ? Math.sin(t * 4 * b.v + b.ph) * 0.5 : 0,
           armRaise: night ? smooth((t - b.look) / 0.6) * 2.6 : 0, visible: true };
}

const sunDisc = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color: "#fff6dc", transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
sunDisc.scale.set(260, 260, 1); sunDisc.position.set(-160, 330, -620); strand.group.add(sunDisc);
const sunCore = new THREE.Mesh(new THREE.CircleGeometry(26, 32), new THREE.MeshBasicMaterial({ color: "#fffaf0", fog: false, toneMapped: false }));
sunCore.position.copy(sunDisc.position); sunCore.lookAt(0, 0, 0); strand.group.add(sunCore);

// ================================================================= Balkon ===
const balk = balcony();
const tower = fernsehturm(); tower.group.position.set(-90, -22, -380); tower.group.scale.setScalar(0.8); balk.group.add(tower.group);
const moon = new THREE.Mesh(new THREE.SphereGeometry(16, 24, 16), new THREE.MeshBasicMaterial({ color: "#f3efe2", fog: false }));
moon.position.set(70, 210, -520); balk.group.add(moon);
const moonHalo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color: "#dfe6ff", transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
moonHalo.scale.set(140, 140, 1); moonHalo.position.copy(moon.position); balk.group.add(moonHalo);

// ===================================================== gefrorene Straße ===
const frost = new THREE.Group();
{
  const snowMat = mat("#eef3f8", { roughness: 0.9 });
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(60, 300), snowMat);
  ground.rotation.x = -Math.PI / 2; ground.position.z = -120; ground.receiveShadow = true; frost.add(ground);
  const tex = [windowTextures(201, "altbau"), windowTextures(202, "altbau")];
  for (const s of [-1, 1]) {
    let z = 20;
    while (z > -260) {
      const w = R.range(9, 14);
      const b = building({ w: 14, h: R.range(15, 21), d: w, color: R.pick(["#d9c7aa", "#c9b8a6", "#bfc4c8", "#d8b49a"]), tex: R.pick(tex), roof: "#f4f7fa" });
      b.mesh.position.set(s * 20.5, 0, z - w / 2); b.material.emissiveIntensity = 1.2; frost.add(b.mesh);
      z -= w;
    }
    for (let i = 0; i < 7; i++) {
      const c = car(700 + i + (s > 0 ? 10 : 0)); c.position.set(s * 6.2, 0, 4 - i * 9); c.rotation.y = s > 0 ? 0 : Math.PI; frost.add(c);
      box(1.85, 0.18, 4.4, snowMat, s * 6.2, 1.12, 4 - i * 9, frost);
      box(1.7, 0.2, 2.4, snowMat, s * 6.2, 1.75, 4 - i * 9 - (s > 0 ? 0.2 : -0.2), frost);
    }
  }
  const glow = glowTexture();
  for (let z = 10; z > -200; z -= 22) for (const s of [-1, 1]) { const l = streetLamp(glow); l.group.position.set(s * 8.5, 0, z); l.glowMat.opacity = 0.85; frost.add(l.group); }
}
// Schneefall (auch für die Spree)
function snowfall(n, area, seed) {
  const r = rng(seed);
  const m = new THREE.InstancedMesh(new THREE.BoxGeometry(0.035, 0.035, 0.035), basic("#ffffff"), n);
  const d = []; for (let i = 0; i < n; i++) d.push({ x: r.range(-area, area), y: r.range(0, 10), z: r.range(-area * 2, 2), sp: r.range(0.5, 1.2), ph: r() * 6 });
  const o = new THREE.Object3D();
  return { mesh: m, update(t) { d.forEach((s, i) => { o.position.set(s.x + Math.sin(t + s.ph) * 0.3, ((s.y - t * s.sp) % 10 + 10) % 10, s.z); o.updateMatrix(); m.setMatrixAt(i, o.matrix); }); m.instanceMatrix.needsUpdate = true; } };
}
const frostSnow = snowfall(600, 10, 9); frost.add(frostSnow.mesh);

// ========================================================== Fensterbank ===
const sill = new THREE.Group();
{
  const wall = mat("#cbbfae");
  box(4, 0.05, 4, mat("#6b4f3a"), 0, 0, 0, sill);
  box(1.4, 3, 0.1, wall, -1.3, 1.5, -1.0, sill); box(1.4, 3, 0.1, wall, 1.3, 1.5, -1.0, sill);
  box(1.2, 0.95, 0.1, wall, 0, 0.47, -1.0, sill); box(1.2, 0.7, 0.1, wall, 0, 2.65, -1.0, sill);
  box(1.4, 0.06, 0.35, mat("#ece6dc"), 0, 0.97, -0.85, sill);                    // Fensterbank
  const frame = mat("#f1eee8");
  box(1.2, 0.05, 0.08, frame, 0, 1.0, -1.0, sill); box(1.2, 0.05, 0.08, frame, 0, 2.3, -1.0, sill); box(0.05, 1.3, 0.08, frame, 0, 1.65, -1.0, sill);
  // Eisblumen am Fenster
  const fr = rng(31);
  const { tex } = canvasTexture(512, 512, (x, w, h) => {
    x.clearRect(0, 0, w, h);
    x.strokeStyle = "rgba(235,245,255,0.35)"; x.lineWidth = 1;
    for (let i = 0; i < 70; i++) {
      const cx = fr() < 0.5 ? fr() * w * 0.3 : w - fr() * w * 0.3, cy = fr() * h;
      for (let k = 0; k < 6; k++) { const a = fr() * 6.28, l = fr() * 70 + 20; x.beginPath(); x.moveTo(cx, cy); x.lineTo(cx + Math.cos(a) * l, cy + Math.sin(a) * l); x.stroke(); }
    }
  });
  const ice = new THREE.Mesh(new THREE.PlaneGeometry(1.15, 1.25), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false }));
  ice.position.set(0, 1.65, -0.95); sill.add(ice);
  // Kerze
  cyl(0.035, 0.035, 0.16, 10, mat("#f3ead6"), -0.38, 1.08, -0.8, sill);
  const flame = new THREE.Mesh(new THREE.ConeGeometry(0.014, 0.05, 6), basic("#ffcf6a"));
  flame.position.set(-0.38, 1.19, -0.8); sill.add(flame);
  const candle = new THREE.PointLight("#ffb35a", 2.2, 4, 1.6); candle.position.set(-0.38, 1.25, -0.75); sill.add(candle);
  sill.userData = { flame, candle };
  // draußen: dunkle Häuser
  for (let i = 0; i < 12; i++) {
    const b = building({ w: 14, h: R.range(14, 26), d: 12, color: "#8a8f99", tex: windowTextures(220 + i, "altbau") });
    b.mesh.position.set(R.range(-30, 30), -12, -30 - R.range(0, 40)); b.material.emissiveIntensity = R() < 0.3 ? 0.4 : 0; sill.add(b.mesh);
  }
}
const plant = pottedPlant(5);

// ================================================================== Spree ===
const river = frozenRiver();
// ================================================================ Tiefsee ===
const sea = deepSeaVents();

const SETS = { beach: strand.group, balcony: balk.group, frost, sill, river: river.group, sea: sea.group };
for (const g of Object.values(SETS)) { g.visible = false; scene.add(g); }

// ============================================================ Hände (POV) ===
const rig = new THREE.Group(); camera.add(rig);
const rightHand = hand(1, "#3a4a5e"); rig.add(rightHand);
const leftHand = hand(-1, "#3a4a5e"); rig.add(leftHand);
const eis = iceCream(); rig.add(eis);
const handy = phone(); rig.add(handy);
const thermo = thermometer(); rig.add(thermo);
const lamp = diveLamp(); rig.add(lamp);
rig.add(plant.group);
const torch = new THREE.SpotLight("#e8f4ff", 0, 14, 0.42, 0.55, 1.1);
torch.position.set(0.12, -0.2, -0.95); camera.add(torch); camera.add(torch.target); torch.target.position.set(0.0, -0.4, -6);

function pose(obj, p, r) { obj.visible = true; obj.position.set(...p); obj.rotation.set(...r); }
const POSES = {
  eis(t) {
    pose(rightHand, [0.13, -0.3, -0.74], [0.75, 0.1, 1.15]); rightHand.userData.curl(1);
    pose(eis, [0.1, -0.235, -0.78], [0.05, 0, -0.1]);
    // Pointe: obere Kugel rutscht runter
    const u = Math.max(0, t - 26.05);
    const top = eis.userData.top;
    top.position.set(u * 0.05, 0.095 - (u > 0.25 ? 4.9 * (u - 0.25) ** 2 : 0) - u * 0.03, u * 0.02);
    top.rotation.z = -u * 2;
    top.visible = top.position.y > -0.6;
  },
  phone() {
    pose(leftHand, [-0.07, -0.235, -0.36], [-0.65, 0.1, -0.15]); leftHand.userData.curl(0.45);
    pose(handy, [-0.065, -0.17, -0.385], [-0.55, 0.12, 0.05]);
  },
  thermo() {
    pose(rightHand, [0.09, -0.27, -0.56], [0.7, 0, 0.2]); rightHand.userData.curl(0.9);
    pose(thermo, [0.075, -0.16, -0.6], [-0.25, -0.15, 0.08]);
  },
  plant() {
    pose(leftHand, [-0.07, -0.33, -0.62], [0.55, 0, -0.1]); leftHand.userData.curl(0.5);
    pose(rightHand, [0.09, -0.3, -0.6], [0.6, 0, 0.6]); rightHand.userData.curl(0.7);
    pose(plant.group, [0.0, -0.33, -0.66], [0.15, 0.4, 0]);
  },
  lamp() {
    pose(rightHand, [0.12, -0.31, -0.7], [0.65, 0, 0.1]); rightHand.userData.curl(1);
    pose(lamp, [0.12, -0.25, -0.8], [0.25, 0, 0]);
  },
};

// ================================================================== Szenen ===
const L = (a, b, u) => [lerp(a[0], b[0], u), lerp(a[1], b[1], u), lerp(a[2], b[2], u)];
const SCENES = [
  { name: "beach", set: "beach", start: 0, end: 9, walk: (t) => (t < EVENT ? 0.6 : 0), hands: ["eis"],
    cam: (t) => { const up = smooth((t - 6.6) / 1.8); return { pos: [0.6, 1.62, 7 - Math.min(t, EVENT) * 0.5], look: [lerp(-6, 0.2, up), lerp(9, 40, up), lerp(-60, -70, up)] }; } },
  { name: "balcony", set: "balcony", start: 9, end: 12, walk: () => 0, hands: ["phone"],
    cam: (t) => { const u = smooth((t - 9) / 2.6); return { pos: [0.1, 1.62, 0.3], look: L([45, 120, -420], [62, 175, -500], u) }; } },
  { name: "frost", set: "frost", start: 12, end: 15, walk: () => 0.5, hands: ["thermo"],
    cam: (t) => { const u = (t - 12) / 3; return { pos: [2.2, 1.65, 10 - u * 3.5], look: [0.5, 2.0, -60] }; } },
  { name: "sill", set: "sill", start: 15, end: 18, walk: () => 0, hands: ["plant"],
    cam: (t) => { const u = smooth((t - 15) / 3); return { pos: L([0.1, 1.6, 0.6], [0.05, 1.55, 0.35], u), look: [0, 1.15, -1.2] }; } },
  { name: "river", set: "river", start: 18, end: 21, walk: () => 0.4, hands: ["thermo"],
    cam: (t) => { const u = (t - 18) / 3; return { pos: [1.5, 1.65, 6 - u * 2.5], look: [0, 7, -70] }; } },
  { name: "sea", set: "sea", start: 21, end: RETURN, walk: () => 0, hands: ["lamp"],
    cam: (t) => { const u = (t - 21) / 3; const sw = Math.sin(t * 0.9) * 0.15; return { pos: [0.3 + sw, 1.8 - u * 0.2, 4 - u * 2.2], look: [0, 1.6, -9] }; } },
  { name: "beach2", set: "beach", start: RETURN, end: BLACK, walk: () => 0, hands: ["eis"],
    cam: (t) => ({ pos: [0.6, 1.62, 4.0], look: [-6, lerp(9, 1.0, smooth((t - 25.9) / 0.6)), -60] }) },
];

function setEnv(o) {
  sky.visible = o.sky !== false;
  if (o.sky !== false) {
    sky.material.uniforms.top.value.set(o.top); sky.material.uniforms.horizon.value.set(o.hor);
    sky.material.uniforms.bottom.value.set(o.hor).multiplyScalar(0.35);
    sky.material.uniforms.sunGlow.value = o.glow ?? 0;
  }
  scene.background = o.sky === false ? new THREE.Color(o.bg || "#000") : null;
  scene.fog.color.set(o.fog || o.hor || o.bg); scene.fog.near = o.near ?? 80; scene.fog.far = o.far ?? 700;
  hemi.color.set(o.hemiSky || "#ffffff"); hemi.groundColor.set(o.hemiGround || "#5a4a3a"); hemi.intensity = o.hemi;
  sun.color.set(o.sunColor || "#fff1d6"); sun.intensity = o.sun ?? 0;
  const a = o.sunA ?? 0.6, el = o.sunEl ?? 0.6;
  sun.userData.dir = new THREE.Vector3(Math.sin(a), el, Math.cos(a)).normalize();
  sky.material.uniforms.sunDir.value.copy(sun.userData.dir);
  sun.castShadow = (o.sun ?? 0) > 0.3;
  stars.material.opacity = o.stars ?? 0;
  renderer.toneMappingExposure = o.exposure ?? 1;
  torch.intensity = o.torch ?? 0;
}
const DAY = { top: "#5f9de0", hor: "#cfe6f5", hemi: 1.35, hemiSky: "#eaf4ff", hemiGround: "#c9b48a", sun: 3.0, sunColor: "#fff1d6", sunA: 0.7, sunEl: 0.9, glow: 0.4 };
const NIGHT = { top: "#03050c", hor: "#0b1222", hemi: 0.5, hemiSky: "#5c6f9e", hemiGround: "#141210", sun: 0.25, sunColor: "#8fa3d6", sunA: 0.7, sunEl: 0.8, stars: 1, glow: 0, near: 40, far: 500, exposure: 1.35 };
const ENV = {
  beach: (t) => (t < EVENT ? DAY : NIGHT),
  balcony: () => ({ ...NIGHT, hemi: 0.45 }),
  frost: () => ({ top: "#060a16", hor: "#1a2340", hemi: 0.75, hemiSky: "#8ea6dc", hemiGround: "#9fb0c8", sun: 0.35, sunColor: "#9fb4e8", sunA: 0.6, sunEl: 0.7, stars: 0.8, near: 15, far: 160, fog: "#26314f", exposure: 1.3 }),
  sill: () => ({ sky: false, bg: "#04060c", fog: "#04060c", near: 20, far: 120, hemi: 0.3, hemiSky: "#6a7db0", hemiGround: "#1a1410", exposure: 1.3 }),
  river: () => ({ top: "#03050c", hor: "#121c36", hemi: 0.8, hemiSky: "#8ea6dc", hemiGround: "#b9cde0", sun: 0.45, sunColor: "#a9bdf0", sunA: 0.4, sunEl: 0.6, stars: 1, near: 30, far: 260, fog: "#1a2442", exposure: 1.4 }),
  sea: () => ({ sky: false, bg: "#010a12", fog: "#021723", near: 4, far: 30, hemi: 0.8, hemiSky: "#3a86a8", hemiGround: "#141a20", torch: 60, exposure: 1.25 }),
  beach2: () => DAY,
};

// ==================================================================== Frame ===
const tmpLook = new THREE.Vector3();
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

  for (const o of [rightHand, leftHand, eis, handy, thermo, lamp, plant.group]) o.visible = false;
  rig.position.set(0, -bob * 0.4, 0);
  for (const h of sc.hands) POSES[h](t);

  if (sc.set === "beach") {
    for (let i = 0; i < B.length; i++) bathers.set(i, batherState(B[i], t));
    bathers.commit();
    strand.water.material.color.set(t >= EVENT && t < RETURN ? "#0c1626" : "#4f86a8");
    sunDisc.visible = sunCore.visible = !(t >= EVENT && t < RETURN);
  }
  if (sc.name === "balcony") {
    // Mond erlischt etwa 1,3 s nach dem letzten Sonnenlicht auf ihm (hier verdichtet)
    const k = 1 - smooth((t - 9.9) / 0.9);
    moon.material.color.set("#141824").lerp(new THREE.Color("#f3efe2"), k);
    moonHalo.material.opacity = 0.55 * k;
    for (const m of balk.blocks) m.emissiveIntensity = 1.4;
    handy.userData.screen.redraw((c, w, h) => phoneScreen(c, w, h, { time: "14:21", title: "Eilmeldung", accent: "#ff5b4a", lines: ["Die Sonne ist", "verschwunden."], battery: 48 }));
  }
  if (sc.name === "frost") { frostSnow.update(t); thermo.userData.setTemp(lerp(2, -17, smooth((t - 12.2) / 2.6))); }
  if (sc.name === "river") { river.update(t); thermo.userData.setTemp(lerp(-48, -73, smooth((t - 18.2) / 2.4))); }
  if (sc.name === "sill") {
    plant.update(smooth((t - 15.2) / 2.6));
    const f = 1 + Math.sin(t * 13) * 0.08 + Math.sin(t * 29) * 0.05;
    sill.userData.candle.intensity = 2.2 * f; sill.userData.flame.scale.set(1, f, 1);
  }
  if (sc.name === "sea") sea.update(t);

  const fadeIn = smooth((t - sc.start) / 0.14);
  canvas.style.filter = `brightness(${sc.start === 0 ? 1 : fadeIn}) saturate(${sc.name === "sea" ? 1.1 : 1.0}) contrast(1.05)`;
  canvas.style.opacity = t < BLACK ? 1 : 0;
  renderer.render(scene, camera);
}

window.addEventListener("hf-seek", (e) => renderAt(e.detail.time));
renderAt(window.__hfThreeTime || 0);
