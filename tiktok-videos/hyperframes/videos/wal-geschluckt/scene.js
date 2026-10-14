// "Was wäre, wenn dich ein Wal verschluckt?" – 75 s, klassisch ohne Twist, eine durchgehende POV-Taucherperspektive.
// Akt 1 Meeresgrund vor Cape Cod (Countdown, nur der Zuschauer sieht den Wal kommen) → 20 s Buckelwal schießt
// von unten hoch (Zeitlupe), Maul schließt sich → Akt 2 im Maul (Lampe, Barten, Zunge, Kehle, Schlund)
// → Akt 3 der Wal steigt, Lippenspalt, Licht → HIER: ausgespuckt an der Oberfläche → Schwarz → Endkarte.
// Vorbild: Michael Packard, Juni 2021, Provincetown – 30–40 s im Maul eines Buckelwals, überlebt.
import { THREE, rng, clamp, smooth, lerp, shake, createSky, cameraPath, valueAt } from "./lib/lowpoly.js";
import { diveLamp } from "./lib/props.js";
import { createOverlay, de, countdown, curve } from "./lib/ww-overlay.js";
import { gloveHand, catchBag, seabed, fishSchool, krillCloud, humpback, mouthInterior, seaSurface, THROAT } from "./sets.js";

const DURATION = 75;
const EVENT = 20;        // Countdown 0: der Wal ist da (Zeitlupe bis ENGULF)
const ENGULF = 25;       // Maul zu – ab hier "Im Maul seit"
const SQUEEZE0 = 42.2;   // Wasser wird durch die Barten gepresst
const SHAKE0 = 49.8, SHAKE1 = 53.4;
const RISE = 53.6;       // Wal steigt zur Oberfläche
const GAP0 = 57.4;       // Lippen öffnen sich einen Spalt
const SPIT = 63.5;       // HIER: ausgespuckt
const BLACK = 70;
const END = 70.5;
const DEPTH = 14;        // Tauchtiefe (m)

const inMouth = (t) => Math.max(0, t - ENGULF);                                   // Sekunden im Maul
const liters = (t) => t < ENGULF ? 0 : t < SQUEEZE0 ? curve([[ENGULF, 0], [27.5, 9000], [30, 13500], [33, 15000]], t)
  : curve([[SQUEEZE0, 15000], [44, 11000], [47, 3000], [49, 600]], t);
const toSurface = (t) => t < RISE ? DEPTH : DEPTH * (1 - smooth(clamp((t - RISE) / (SPIT - RISE))) * 0.35 - clamp((t - RISE) / (SPIT - RISE)) * 0.65);

// ------------------------------------------------------------------ Overlay ---
const overlay = createOverlay(document.getElementById("overlay"), {
  title: { text: "Was wäre, wenn dich ein Wal verschluckt?", accent: "Wal", accentColor: "#7fd6c4", start: 0, end: 3.5 },
  hud: [
    { start: 0, end: 9.5, label: "Buckelwal erreicht dich in", value: (t) => countdown(EVENT - t), sub: "Cape Cod, USA · 14 m Tiefe · Juni", fadeIn: 0.01, fadeOut: 0.01 },
    { start: 9.5, end: EVENT, label: "Buckelwal erreicht dich in", value: (t) => countdown(EVENT - t), sub: "Buckelwal · bis 16 m lang · frisst gerade", fadeIn: 0.01, fadeOut: 0.01 },
    { start: EVENT, end: ENGULF, label: "Maul bis zu dir", value: (t) => `${de(whaleDist(t), 1)} m`, sub: "Zeitlupe", fadeIn: 0.01, fadeOut: 0.01 },
    { start: ENGULF, end: 46, label: "Im Maul seit", value: (t) => `${de(inMouth(t), 1)} s`,
      sub: (t) => `Wasser im Maul: ca. ${de(Math.round(liters(t) / 100) * 100)} Liter (geschätzt)`, fadeIn: 0.01, fadeOut: 0.01 },
    { start: 46, end: RISE, label: "Im Maul seit", value: (t) => `${de(inMouth(t), 1)} s`, sub: "Schlund: ca. 10 cm – du passt nicht durch", fadeIn: 0.01, fadeOut: 0.01 },
    { start: RISE, end: SPIT, label: "Bis zur Oberfläche", value: (t) => `${de(toSurface(t), 1)} m`, sub: (t) => `Im Maul seit ${de(inMouth(t), 1)} s`, fadeIn: 0.01, fadeOut: 0.01 },
    { start: SPIT, end: SPIT + 2.6, label: "Bis zur Oberfläche", value: () => "HIER", sub: "Nach 38,5 Sekunden im Maul", fadeIn: 0.01, fadeOut: 0.3 },
    { start: SPIT + 2.6, end: BLACK, label: "Im Maul", value: () => "38,5 s", sub: "Ausgespuckt. Er hat dich nie gewollt.", fadeIn: 0.3, fadeOut: 0.4 },
  ],
  subtitles: [
    { start: 3.7, end: 7.6, text: "Cape Cod, USA. 14 Meter unter Wasser." },
    { start: 7.8, end: 11.4, text: "Du suchst Hummer. Alles ist ruhig." },
    { start: 11.6, end: 15.4, text: "Dann werden die Fische unruhig." },
    { start: 15.6, end: 19.8, text: "Aus der Tiefe kommt ein Schatten." },
    { start: 20.2, end: 23.4, text: "Ein Buckelwal. Mit offenem Maul." },
    { start: 23.6, end: 26.8, text: "Er frisst gerade. Du bist im Weg." },
    { start: 27.0, end: 30.6, text: "Dann ist es dunkel. Nur deine Lampe." },
    { start: 30.8, end: 34.4, text: "Neben dir: Barten wie ein Vorhang." },
    { start: 34.6, end: 38.2, text: "Unter dir: eine riesige Zunge." },
    { start: 38.4, end: 42.0, text: "Die Kehle dehnt sich. Voller Wasser." },
    { start: 42.2, end: 45.8, text: "Dann presst er das Wasser raus." },
    { start: 46.0, end: 49.6, text: "Schlucken? Sein Schlund ist zu eng." },
    { start: 49.8, end: 53.4, text: "Er schüttelt den Kopf. Hin und her." },
    { start: 53.6, end: 57.2, text: "Und dann steigt er nach oben." },
    { start: 57.4, end: 61.0, text: "Das Maul öffnet sich einen Spalt." },
    { start: 61.2, end: 63.3, text: "Licht." },
    { start: 63.8, end: 66.6, text: "Er spuckt dich einfach aus." },
    { start: 66.8, end: 69.7, text: "Er wollte dich nie fressen." },
  ],
  black: { start: BLACK, end: END },
  endcard: { start: END, end: DURATION, lines: [
    "Ein Buckelwal kann dich nicht schlucken: Sein Schlund ist nur etwa faustgroß",
    "2021 lag Taucher Michael Packard 30–40 Sekunden in einem Walmaul – und überlebte",
    "Welches Tier soll als Nächstes? Schreib es in die Kommentare",
  ] },
});

// ----------------------------------------------------------------- Renderer ---
const canvas = document.getElementById("scene");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1);
renderer.setSize(1080, 1920, false);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
scene.fog = new THREE.Fog("#2f6e66", 1, 48);
const camera = new THREE.PerspectiveCamera(62, 1080 / 1920, 0.03, 3000);
scene.add(camera);
const sky = createSky(1500); scene.add(sky);
const hemi = new THREE.HemisphereLight("#cff5ea", "#24443f", 1.4); scene.add(hemi);
const sun = new THREE.DirectionalLight("#effff6", 1.6); scene.add(sun); scene.add(sun.target);

// Taucherbrille: dunkler Rand am Bildrand (dezent)
const maskRim = document.createElement("div");
maskRim.style.cssText = "position:absolute;inset:0;pointer-events:none;border-radius:150px;box-shadow:inset 0 0 0 26px rgba(8,12,14,0.9), inset 0 0 70px 40px rgba(0,0,0,0.45);";
document.getElementById("root").insertBefore(maskRim, document.getElementById("overlay"));

// ================================================================== Sets ===
const bed = seabed(); scene.add(bed.group);
const school = fishSchool(); scene.add(school.mesh);
const krill = krillCloud(); scene.add(krill.points);
const whale = humpback(); scene.add(whale.group);
const mouth = mouthInterior(); scene.add(mouth.group);
const surf = seaSurface(); scene.add(surf.group);

const SCENES = [
  { name: "meeresgrund", start: 0, end: ENGULF },
  { name: "walmaul", start: ENGULF, end: SPIT },
  { name: "oberflaeche", start: SPIT, end: BLACK },
];

// ============================================================ Hände (POV) ===
const rig = new THREE.Group(); camera.add(rig);
const leftHand = gloveHand(-1), rightHand = gloveHand(1);
const lamp = diveLamp(); const bag = catchBag();
rig.add(leftHand, rightHand, lamp, bag);
const torch = new THREE.SpotLight("#fff3dc", 0, 10, 0.46, 0.6, 1.1);
camera.add(torch); camera.add(torch.target);
const fill = new THREE.PointLight("#ffc9b8", 0, 4.5, 1.2); camera.add(fill); fill.position.set(0, 0.1, -0.4);
// Atemblasen (Kamera-Koordinaten)
const BUB = 46;
const bubbles = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.006, 1), new THREE.MeshBasicMaterial({ color: "#d9f4ee", transparent: true, opacity: 0.75 }), BUB);
const BD = []; const R = rng(919);
for (let i = 0; i < BUB; i++) BD.push({ x: (i % 2 ? 1 : -1) * R.range(0.17, 0.3), z: R.range(-0.7, -0.45), v: R.range(0.35, 0.8), ph: R(), s: R.range(0.5, 1.6) });
camera.add(bubbles);

// ============================================================ Wal-Pfad ===
const M_LOCAL = new THREE.Vector3(0, -0.55, 5.6);            // Punkt zwischen den Kiefern
const CAM0 = (t) => new THREE.Vector3(0.3 * Math.sin(t * 0.21), -14.2 + 0.6 * smooth(clamp((t - 9) / 8)) + 0.04 * Math.sin(t * Math.PI * 2 / 4.2), 4.5 - 6 * smooth(clamp((t - 7) / 10)));
const WPATH = cameraPath([
  { t: 9, pos: [30, -36, -30], look: [0, 0, 0] },
  { t: 13, pos: [17, -33, -25], look: [0, 0, 0] },
  { t: 17, pos: [5, -29, -19], look: [0, 0, 0] },
  { t: 20, pos: [0.8, -26, -12], look: [0, 0, 0] },
  { t: 22.5, pos: [0.3, -20, -6.5], look: [0, 0, 0] },
  { t: ENGULF, pos: [0, -13.65, -1.5], look: [0, 0, 0] },
  { t: 27, pos: [0, -10, 2], look: [0, 0, 0] },
]);
const wp = new THREE.Vector3(), wq = new THREE.Vector3(), wd = new THREE.Vector3(), dummy = new THREE.Vector3();
const whaleMouthAt = (t, out) => { WPATH(t, out, dummy); return out; };
function whaleDist(t) { whaleMouthAt(t, wp); return Math.max(0, wp.distanceTo(CAM0(t)) - 0.4); }
const aim = new THREE.Object3D();
function placeWhale(mouthPos, dir) {
  aim.position.set(0, 0, 0); aim.up.set(0, 1, 0); aim.lookAt(dir);
  whale.group.quaternion.copy(aim.quaternion);
  whale.group.position.copy(mouthPos).sub(wq.copy(M_LOCAL).applyQuaternion(aim.quaternion));
}

// ==================================================== Maul-Kamera ===
const MOUTHCAM = cameraPath([
  { t: 25.0, pos: [0, 0.1, 0.4], look: [0.6, -0.8, -3] },
  { t: 27.0, pos: [0, 0.05, 0.5], look: [-0.6, -0.3, -3] },
  { t: 30.0, pos: [0.1, 0.05, 0.4], look: [0.7, -0.2, -3] },
  { t: 31.6, pos: [0.35, 0.05, 0.3], look: [1.6, -0.15, -0.5] },
  { t: 34.2, pos: [0.55, 0.0, 0.25], look: [1.6, -0.25, 0.7] },
  { t: 35.6, pos: [0.3, 0.15, 0.3], look: [0.4, -1.1, -1.4] },
  { t: 38.0, pos: [0.2, 0.2, 0.4], look: [0, -1.0, -1.9] },
  { t: 39.6, pos: [0, 0.25, 0.7], look: [0, -0.7, -3.0] },
  { t: 42.0, pos: [0, 0.25, 0.7], look: [-0.5, -0.5, -3] },
  { t: 43.6, pos: [-0.25, 0.2, 0.5], look: [-1.6, -0.35, -0.6] },
  { t: 45.6, pos: [-0.35, 0.2, 0.6], look: [-1.6, -0.35, 0.5] },
  { t: 47.0, pos: [0, 0.0, 1.5], look: [0, -0.62, 3.05] },
  { t: 49.6, pos: [0, -0.3, 2.1], look: [0, -0.62, 3.05] },
  { t: 51.5, pos: [0, -0.1, 1.5], look: [0, -0.45, 3] },
  { t: 53.3, pos: [0, 0.0, 1.0], look: [1.6, 0.1, 0.8] },
  { t: 54.8, pos: [0, 0.1, 0.5], look: [0.2, 0.25, -3] },
  { t: GAP0, pos: [0, 0.08, 0.2], look: [0, 0.1, -3.3] },
  { t: 61.0, pos: [0, 0.05, -0.7], look: [0, 0.0, -3.4] },
  { t: SPIT, pos: [0, 0.0, -1.7], look: [0, 0.0, -3.6] },
]);

// ==================================================================== Frame ===
const tmp = new THREE.Vector3(), cp = new THREE.Vector3(), cl = new THREE.Vector3();
const SUN_DIR = new THREE.Vector3(-0.3, 1, 0.35).normalize();
const SURF_SUN = new THREE.Vector3(0.5, 0.55, 0.6).normalize();

function pose(o, p, r) { o.position.set(...p); o.rotation.set(...r); }

function renderAt(t) {
  t = clamp(t, 0, DURATION);
  overlay.update(t);
  const sc = t < ENGULF ? "meeresgrund" : t < SPIT ? "walmaul" : "oberflaeche";
  bed.group.visible = school.mesh.visible = krill.points.visible = sc === "meeresgrund";
  mouth.group.visible = sc === "walmaul";
  surf.group.visible = sc === "oberflaeche";
  whale.group.visible = sc !== "walmaul";
  bag.visible = sc === "meeresgrund";
  let bright = 1, filter = "";

  if (sc === "meeresgrund") {
    // ----------------------------------------------------------- Meeresgrund
    const cam = CAM0(t);
    const lunge = smooth(clamp((t - EVENT) / (ENGULF - EVENT)));
    const jolt = t > EVENT && t < EVENT + 1.2 ? Math.exp(-(t - EVENT) * 4) * 0.06 : 0;
    const [sx, sy] = shake(t * 1.2, 0.006 + jolt + lunge * 0.02);
    camera.position.set(cam.x + sx, cam.y + sy, cam.z);
    // Wal
    whaleMouthAt(t, wp); whaleMouthAt(t + 0.25, wd); wd.sub(wp).normalize();
    whale.group.visible = t > 9;
    placeWhale(wp, wd);
    whale.setMouth(smooth(clamp((t - 18.3) / 3)), smooth(clamp((t - 20.5) / 3.2)));
    whale.swim(t, 1 - lunge * 0.6);
    // Blick: Hummer → Fischschwarm → hinab in die Tiefe → Wal
    const lk = [
      [0, [0.35, -15.8, 0.6]], [6.8, [0.5, -15.7, 0.9]], [10.4, [-0.6, -15.6, 0.5]], [12.6, [-1.0, -12.9, -6]], [14.4, [-0.4, -13.2, -7]],
      [16.4, [5, -30, -18]], [19.0, [1.5, -27, -12]],
    ];
    const base = (() => { let a = lk[0][1]; for (let i = 1; i < lk.length; i++) { if (t <= lk[i][0]) { const k = smooth((t - lk[i - 1][0]) / (lk[i][0] - lk[i - 1][0])); return lk[i - 1][1].map((v, j) => lerp(v, lk[i][1][j], k)); } a = lk[i][1]; } return a; })();
    const follow = smooth(clamp((t - 18.6) / 1.8));
    tmp.set(...base).lerp(wp, follow);
    camera.lookAt(tmp.x + sx * 3, tmp.y + sy * 3, tmp.z);
    camera.updateMatrixWorld();
    // Umgebung
    bed.update(t, camera.position);
    const agit = smooth(clamp((t - 11.2) / 3)), flee = Math.max(0, (t - 16.8) * 0.75);
    school.update(t, tmp.set(-1, -12.6, -6), agit, flee);
    krill.setDensity(0.25 + 0.75 * smooth(clamp((t - 9) / 9)));
    const dim = smooth(clamp((t - 15.5) / 6));
    scene.fog.color.set("#2f6e66").lerp(new THREE.Color("#1d4a46"), dim * 0.6);
    scene.fog.near = 1; scene.fog.far = lerp(48, 40, dim);
    scene.background = null; sky.visible = true;
    sky.material.uniforms.top.value.set("#a6e4d2"); sky.material.uniforms.horizon.value.set("#3b8077");
    sky.material.uniforms.bottom.value.copy(scene.fog.color); sky.material.uniforms.sunGlow.value = 0.25;
    sky.material.uniforms.sunDir.value.copy(SUN_DIR);
    hemi.color.set("#cff5ea"); hemi.groundColor.set("#24443f"); hemi.intensity = lerp(1.45, 1.05, dim);
    sun.intensity = lerp(1.6, 1.1, dim); sun.position.copy(camera.position).addScaledVector(SUN_DIR, 60); sun.target.position.copy(camera.position);
    renderer.toneMappingExposure = 1.12;
    torch.intensity = 5; fill.intensity = 0;
    // Hände: links Taucherlampe, rechts Fangnetz mit Hummer
    const swimK = 1 - lunge;
    const sw = Math.sin(t * 1.5) * 0.008 * swimK;
    pose(leftHand, [-0.16, -0.37 + sw, -0.7], [0.15, -0.25, -1.25]); leftHand.userData.curl(0.95);
    pose(lamp, [-0.115, -0.32 + sw, -0.74], [0.06, 0.0, 0]);
    pose(rightHand, [0.18, -0.39 - sw, -0.72], [0.2, 0.25, 1.25]); rightHand.userData.curl(0.9);
    pose(bag, [0.15, -0.45 - sw, -0.78], [0.15, 0, 0.05 + Math.sin(t * 0.8) * 0.05]);
    // Abblende: alles wird dunkel
    bright = 1 - smooth(clamp((t - 24.3) / 0.7));
    filter = `saturate(1.05) contrast(1.04)`;
  } else if (sc === "walmaul") {
    // ------------------------------------------------------------- Im Maul
    MOUTHCAM(t, cp, cl);
    const shakeK = smooth(clamp((t - SHAKE0) / 0.6)) * (1 - smooth(clamp((t - SHAKE1 + 0.5) / 0.8)));
    const tumble = Math.exp(-(t - ENGULF) * 1.2) * 0.25;
    const [sx, sy] = shake(t * 1.4, 0.01 + tumble * 0.2 + shakeK * 0.08);
    camera.position.set(cp.x + sx, cp.y + sy, cp.z);
    camera.lookAt(cl.x + sx * 2, cl.y + sy * 2, cl.z);
    camera.rotateZ(Math.sin(t * 3.1) * 0.28 * shakeK + Math.sin(t * 2.3) * tumble + Math.sin(t * 0.5) * 0.03);
    camera.updateMatrixWorld();
    const expand = smooth(clamp((t - 37.5) / 3.5));
    const squeeze = smooth(clamp((t - SQUEEZE0) / 3.6));
    const gap = t < GAP0 ? 0 : 0.05 * smooth(clamp((t - GAP0) / 2)) + 0.5 * smooth(clamp((t - 60.6) / 2.9));
    mouth.update(t, { expand, squeeze, gap });
    scene.background = new THREE.Color("#140909"); sky.visible = false;
    scene.fog.color.set("#170b0c"); scene.fog.near = 1.6; scene.fog.far = 8.5;
    hemi.color.set("#ffd6cc"); hemi.groundColor.set("#2a1214"); hemi.intensity = 0.5 + clamp(gap * 3) * 0.6;
    sun.intensity = 0;
    renderer.toneMappingExposure = 1.3;
    torch.intensity = 34; fill.intensity = 1.3;
    // Hände: links die Lampe, rechts tastet
    const reach = 0.35 * smooth(clamp((t - 46.6) / 1.6)) * (1 - smooth(clamp((t - 49.4) / 0.8)));
    const brace = smooth(clamp((t - 31.4) / 1.2)) * (1 - smooth(clamp((t - 34.0) / 1)));
    pose(leftHand, [-0.16, -0.36, -0.7], [0.15, -0.25, -1.25]); leftHand.userData.curl(0.95);
    pose(lamp, [-0.115, -0.315, -0.74], [0.04, 0.0, 0]);
    pose(rightHand, [lerp(lerp(0.18, 0.22, brace), 0.09, reach), lerp(-0.39, -0.31, reach), lerp(lerp(-0.7, -0.74, brace), -0.8, reach)],
      [lerp(0.35, 0.55, reach), lerp(0.2, -0.1, brace), lerp(0.25, 0.05, reach)]);
    rightHand.userData.curl(lerp(0.3, 0.95, reach));
    // Ein- und Ausblenden
    bright = smooth(clamp((t - ENGULF - 0.35) / 1.1)) * (t < 26.6 ? 0.75 + 0.25 * Math.abs(Math.sin(t * 9)) : 1);
    bright *= 1 + 1.6 * smooth(clamp((t - 62.6) / 0.9));
    filter = `saturate(1.12) contrast(1.06)`;
  } else {
    // --------------------------------------------------------- Oberfläche
    const u = t - SPIT;
    const bob = Math.sin(t * 1.3) * 0.12 + Math.sin(t * 0.8) * 0.06;
    const pop = u < 0.6 ? lerp(-0.25, 0.4, smooth(u / 0.6)) : 0.4;
    const [sx, sy] = shake(t * 1.1, 0.012 + Math.exp(-u * 3) * 0.05);
    camera.position.set(sx, pop + bob * 0.5 + sy, 0.6);
    camera.lookAt(-1.2 + sx * 3, 0.9 + bob * 0.3 + sy * 3, -12);
    camera.rotateZ(Math.sin(t * 0.9) * 0.04);
    camera.updateMatrixWorld();
    surf.update(t, u);
    // Wal: Kopf taucht vor dir ab, später die Fluke in der Ferne
    whale.group.visible = true;
    if (u < 2.8) {
      const sink = smooth(clamp((u - 0.3) / 2.5));
      wp.set(-0.4, lerp(2.6, -4.5, sink), lerp(-6.5, -8, sink));
      wd.set(0.1, lerp(0.55, -0.2, sink), 0.85).normalize();
      placeWhale(wp, wd);
      whale.setMouth(lerp(0.45, 0, smooth(clamp(u / 1.4))), 0.3);
      whale.swim(t, 0.3);
    } else {
      const k = (u - 2.8) / 3.6;
      const tipY = k < 0.45 ? lerp(-2, 2.9, smooth(k / 0.45)) : lerp(2.9, -3, smooth((k - 0.45) / 0.55));
      wd.set(0.15, -0.88, -0.45).normalize();
      // Schwanzspitze (lokal z = −8,3) soll auf tipY liegen
      wq.set(0, 0, -8.3); aim.position.set(0, 0, 0); aim.up.set(0, 1, 0); aim.lookAt(wd);
      whale.group.quaternion.copy(aim.quaternion);
      wq.applyQuaternion(aim.quaternion);
      whale.group.position.set(1.5 - wq.x, tipY - wq.y, -22 - wq.z);
      whale.setMouth(0, 0); whale.swim(t * 0.4, 0.2);
      whale.fluke.rotation.x = -0.25 + smooth(k) * 0.4;
    }
    scene.background = null; sky.visible = true;
    sky.material.uniforms.top.value.set("#5f97d6"); sky.material.uniforms.horizon.value.set("#dbe9f0");
    sky.material.uniforms.bottom.value.set("#5d8a90"); sky.material.uniforms.sunGlow.value = 0.45;
    sky.material.uniforms.sunDir.value.copy(SURF_SUN);
    scene.fog.color.set("#d3e3ea"); scene.fog.near = 60; scene.fog.far = 900;
    hemi.color.set("#eaf3ff"); hemi.groundColor.set("#5a7a7a"); hemi.intensity = 1.35;
    sun.intensity = 2.4; sun.position.copy(camera.position).addScaledVector(SURF_SUN, 80); sun.target.position.set(0, 0, -10);
    renderer.toneMappingExposure = 1.05;
    torch.intensity = 0; fill.intensity = 0;
    const fl = Math.sin(t * 1.3) * 0.01;
    pose(leftHand, [-0.19, -0.36 + fl, -0.7], [0.35, -0.2, -0.35]); leftHand.userData.curl(0.9);
    pose(lamp, [-0.165, -0.33 + fl, -0.75], [0.4, 0.15, 0]);
    pose(rightHand, [0.2, -0.37 - fl, -0.7], [0.3, 0.2, 0.25]); rightHand.userData.curl(0.3);
    bright = 1 + 1.4 * (1 - smooth(clamp(u / 0.6))) - 0.15 * smooth(clamp((t - 68.8) / 1.2));
    filter = `saturate(1.08) contrast(1.03)`;
  }

  // Lampe: Lichtkegel folgt der Hand
  torch.position.set(-0.115, -0.31, -0.85); torch.target.position.set(0.15, -0.6, -6);

  // Atemblasen (unter Wasser): alle ~4 s ein Schwall, im Maul schneller
  const under = sc !== "oberflaeche";
  const period = sc === "meeresgrund" ? 4.2 : 2.8;
  BD.forEach((b, i) => {
    const cyc = (t + b.ph * 0.6) / period;
    const u = (cyc - Math.floor(cyc)) * period;
    const vis = under && u < 1.3 && i % 3 !== 0;
    tmp.set(b.x + Math.sin(u * 5 + i) * 0.02, -0.32 + u * b.v * (sc === "walmaul" && t > RISE ? 1.6 : 1), b.z);
    o3m.compose(tmp, qI, sI.setScalar(vis ? b.s : 0));
    bubbles.setMatrixAt(i, o3m);
  });
  bubbles.instanceMatrix.needsUpdate = true;

  canvas.style.filter = `brightness(${bright.toFixed(3)}) ${filter}`;
  canvas.style.opacity = t < BLACK ? 1 : 0;
  maskRim.style.opacity = t < BLACK ? 1 : 0;
  renderer.render(scene, camera);
}
const o3m = new THREE.Matrix4(), qI = new THREE.Quaternion(), sI = new THREE.Vector3();

window.addEventListener("hf-seek", (e) => renderAt(e.detail.time));
renderAt(window.__hfThreeTime || 0);
