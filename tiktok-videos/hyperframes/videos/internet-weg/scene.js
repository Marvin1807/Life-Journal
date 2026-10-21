// "Was wäre, wenn das Internet eine Woche lang ausfällt?" – 40 s, Tage-Format wie nur-100, LOOP.
// Sieben Orte, jeder genau einmal, alle ~3,2 s ein Zeitsprung: U-Bahn (Minute 1) → Supermarktkasse (Stunde 2) →
// Bahnhofshalle (Stunde 9) → Späti (Tag 2) → Supermarktgang (Tag 3) → Hinterhof (Tag 5) →
// Wohnzimmer bei Kerzenlicht (Tag 7): Spieleabend, das Netz kommt zurück, alle schauen wieder aufs Handy.
// Ende = Anfang: Die Kamera fährt auf dein Handy, der Feed zeigt dieses Video, dann „Keine Verbindung“ – exakt das
// erste Bild. Durchgehend POV mit sichtbaren Händen und deinem Handy.
import { THREE, rng, clamp, smooth, lerp, shake, createSky, valueAt } from "./lib/lowpoly.js";
import { hand, coffeeCup, shoppingCart, supermarketAisle, mat, box, cyl } from "./lib/props.js";
import { createOverlay, de } from "./lib/ww-overlay.js";
import { folk, heldPhones, bigPhone, subwayCar, checkout, stationHall, paperMap, spaeti, courtyard,
         livingRoom, dice, drawPanel, handFont, TABLE_Y } from "./sets.js";

const DURATION = 40;
// Szenenstarts (je ~3,2 s): U-Bahn 0 · Kasse · Bahnhof · Späti · Regalgang · Hinterhof · Wohnzimmer
const CUT_B = 3.2, CUT_D = 6.4, CUT_E = 9.6, CUT_F = 12.8, CUT_G = 16.0, CUT_H = 19.5;
const LOOKUP = 1.3;        // alle Fahrgäste schauen hoch
const TAP = 3.65;          // Karte ans Terminal
const MAP_UP = 7.7;        // Stadtplan kommt ins Bild
const ROLL = 21.2, LAND = 21.8;   // Würfeln
const BUZZ = 24.0;         // dein Handy vibriert
const FLOOD0 = 25.0, FLOOD1 = 28.0;   // Benachrichtigungs-Zähler
const PHONES_UP = 29.0;    // alle nehmen ihr Handy
const GRAB = 33.3;         // du greifst nach deinem Handy
const FEED = 34.0;         // Feed mit diesem Video
const OFFLINE = 39.35;     // Display springt auf „Keine Verbindung“ (= erstes Bild)
// Blinken des „Keine Verbindung“-Symbols, durchgehend über die Loop-Naht (Ende → Anfang)
const blink = (t) => { const u = t > 30 ? t - DURATION : t; return u > -0.7 && u < 0.75 ? Math.floor((u + 10) * 5) % 2 : 0; };

const SCENES = [
  { name: "U-Bahn-Wagen der U2", set: "ubahn" },
  { name: "Supermarktkasse mit Kartenterminal", set: "kasse" },
  { name: "Bahnhofshalle mit Anzeigetafel", set: "bahnhof" },
  { name: "Späti mit leerem Zeitungsständer", set: "spaeti" },
  { name: "Supermarktgang, Regale leeren sich", set: "regalgang" },
  { name: "Hinterhof mit Nachbarn", set: "hinterhof" },
  { name: "Wohnzimmer bei Kerzenlicht", set: "wohnzimmer" },
];

// --------------------------------------------------------------- Overlay ---
const notifCount = (t) => Math.round(3482 * Math.pow(smooth(clamp((t - FLOOD0) / (FLOOD1 - FLOOD0))), 1.6));
const overlay = createOverlay(document.getElementById("overlay"), {
  title: { text: "Was wäre, wenn das Internet eine Woche lang ausfällt?", accent: "Internet", accentColor: "#7fc4ff", start: 0, end: 2.8 },
  hud: [
    { start: 0.7, end: 3.15, label: "Ohne Internet", value: () => "Minute 1", sub: "Montag · 21:16 Uhr · U2 Richtung Pankow", fadeIn: 0.3, fadeOut: 0.12 },
    { start: 3.28, end: 6.35, label: "Ohne Internet", value: () => "Stunde 2", sub: "23:16 Uhr · Auch die Geldautomaten: außer Betrieb", fadeIn: 0.12, fadeOut: 0.12 },
    { start: 6.48, end: 9.55, label: "Ohne Internet", value: () => "Stunde 9", sub: "19. Juli 2024: Ein fehlerhaftes Update legte weltweit ca. 8,5 Mio. Windows-PCs lahm", fadeIn: 0.12, fadeOut: 0.12 },
    { start: 9.68, end: 12.75, label: "Ohne Internet", value: () => "Tag 2", sub: "Dienstag · Keine Nachrichten-Apps", fadeIn: 0.12, fadeOut: 0.12 },
    { start: 12.88, end: 15.95, label: "Ohne Internet", value: () => "Tag 3", sub: "Mittwoch · Lieferungen bleiben aus", fadeIn: 0.12, fadeOut: 0.12 },
    { start: 16.08, end: 19.45, label: "Ohne Internet", value: () => "Tag 5", sub: "Freitag · Bildschirmzeit: 0 Minuten", fadeIn: 0.12, fadeOut: 0.12 },
    { start: 19.58, end: BUZZ, label: "Ohne Internet", value: () => "Tag 7", sub: "Sonntag · Spieleabend", fadeIn: 0.12, fadeOut: 0.02 },
    { start: BUZZ, end: 33.8, label: "Wieder online", value: () => "Tag 7",
      sub: (t) => t < FLOOD0 + 0.6 ? "21:14 Uhr · Verbindung wiederhergestellt" : t < PHONES_UP ? `21:15 Uhr · ${de(notifCount(t))} Benachrichtigungen` : "21:15 Uhr · Bildschirmzeit läuft wieder", fadeIn: 0.02, fadeOut: 0.4 },
  ],
  subtitles: [
    { start: 0.6, end: 3.1, text: "Minute 1: Alle schauen gleichzeitig hoch." },
    { start: 3.4, end: 6.3, text: "Karte geht nicht. Nur noch Bargeld." },
    { start: 6.6, end: 9.5, text: "Navi weg. Zum ersten Mal: ein Stadtplan aus Papier." },
    { start: 9.8, end: 12.7, text: "Tag 2: Die Zeitung ist ausverkauft." },
    { start: 13.0, end: 15.9, text: "Bestellungen kommen nicht mehr an. Die Regale werden leer." },
    { start: 16.2, end: 19.4, text: "Tag 5: Die Nachbarn reden miteinander." },
    { start: 19.7, end: 23.85, text: "Tag 7: Und irgendwie … ist es schön." },
    { start: 24.4, end: 28.85, text: "Dann ist es wieder da." },
    { start: 29.1, end: 33.85, text: "Und alle schauen wieder runter." },
    { start: 35.0, end: 39.8, text: "Würdest du es überhaupt eine Woche schaffen?" },
  ],
  // Kein Schwarzbild, keine Endkarte: das Video endet im Loop-Bild (Start nach dem Videoende = unsichtbar).
  black: { start: 40.5, end: 40.5 },
  endcard: { start: 40.5, end: 40.5, lines: [
    "19. Juli 2024: ca. 8,5 Mio. Windows-PCs fielen nach einem fehlerhaften Update aus",
    "Würdest du es eine Woche ohne Internet schaffen?",
  ] },
});
const titleEl = document.querySelector("#overlay .ww-title");
// Titel steht im ersten Bild schon voll da und kehrt im letzten Bild zurück (Loop).
const titleOpacity = (t) => (t < 2.8 ? 1 - smooth((t - 2.2) / 0.6) : smooth((t - (OFFLINE - 0.05)) / 0.4));

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
function setShadow(cx, cy, cz, dir, size, dist = 100) {
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

const R = rng(48);
const eu = new THREE.Euler(0, 0, 0, "YXZ");
const tmp = new THREE.Vector3();
const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));
const yawTo = (from, x, z) => Math.atan2(-(x - from.x), -(z - from.z));
const towardCam = (cx, cz, x, z, rotY) => clamp(wrap(Math.atan2(cx - x, cz - z) - rotY), -1.1, 1.1);
function setCam(pos, yaw, pitch, fov = 62, amp = 0.004, roll = 0) {
  camera.position.set(pos[0], pos[1], pos[2]);
  const t = currentT;
  const [sx, sy] = shake(t * 1.1, amp);
  eu.set(pitch + sy, yaw + sx, roll);
  camera.quaternion.setFromEuler(eu);
  camera.fov = fov; camera.updateProjectionMatrix(); camera.updateMatrixWorld();
}
let currentT = 0;

// ================================================================= Sets ===
const A = subwayCar(); scene.add(A.group);
const B = checkout(); scene.add(B.group);
const D = stationHall(); scene.add(D.group);
const E = spaeti(); scene.add(E.group);
const F = { group: new THREE.Group(), aisle: supermarketAisle({ length: 18, emptyFrom: 13.0, emptyTo: 15.6, seed: 77 }) };
F.group.add(F.aisle.group); scene.add(F.group);
const G = courtyard(); scene.add(G.group);
const H = livingRoom(); scene.add(H.group);
const SETS = { A: A.group, B: B.group, D: D.group, E: E.group, F: F.group, G: G.group, H: H.group };
function only(k) { for (const [n, g] of Object.entries(SETS)) g.visible = n === k; }

// ============================================================ Hände (POV) ===
const SLEEVE = "#3d5a73";
const rig = new THREE.Group(); camera.add(rig);
const rigLight = new THREE.PointLight("#fff0dc", 0.5, 1.4, 1.2); rigLight.position.set(0.05, 0.12, 0.05); rig.add(rigLight);   // Fülllicht für Hände/Handy
const leftHand = hand(-1, SLEEVE); rig.add(leftHand);
const rightHand = hand(1, SLEEVE); rig.add(rightHand);
const handy = bigPhone(); rig.add(handy);
const cup = coffeeCup(); rig.add(cup);
const cart = shoppingCart(); rig.add(cart);
const myMap = paperMap(0.34, 0.25, 11); rig.add(myMap);
const card = new THREE.Group(); rig.add(card);
{
  const { mesh } = drawPanel(0.0856, 0.054, 3000, (c, w, h) => {
    const gr = c.createLinearGradient(0, 0, w, h); gr.addColorStop(0, "#1f4f9a"); gr.addColorStop(1, "#3a86d9");
    c.fillStyle = gr; c.fillRect(0, 0, w, h);
    c.fillStyle = "#e8c35a"; c.fillRect(w * 0.1, h * 0.36, w * 0.14, h * 0.22);
    c.fillStyle = "#ffffff"; c.font = "600 22px Arial"; c.fillText("GIROCARD", w * 0.1, h * 0.85);
  }, { basicMat: false, double: true });
  card.add(mesh);
}
const coins = new THREE.Group(); rig.add(coins);
cyl(0.0125, 0.0125, 0.0023, 14, mat("#d9b45a", { metalness: 0.7, roughness: 0.3 }), 0, 0, 0, coins);
cyl(0.0116, 0.0116, 0.0023, 14, mat("#c9ccd1", { metalness: 0.7, roughness: 0.3 }), 0.02, 0.003, 0.006, coins);
cyl(0.0103, 0.0103, 0.0023, 14, mat("#c98a4a", { metalness: 0.7, roughness: 0.3 }), -0.006, 0.0045, -0.016, coins);
function hands(o = {}) {
  leftHand.visible = !!o.left; rightHand.visible = !!o.right;
  handy.visible = o.left === "phone"; cup.visible = o.right === "cup"; cart.visible = !!o.cart;
  myMap.visible = o.right === "map"; card.visible = o.right === "card"; coins.visible = o.right === "coins";
}

// Handy-Haltung: Hand hängt fest am Handy (relative Matrix aus der nur-100-Haltung).
const HAND_REL = (() => {
  const hm = new THREE.Matrix4().compose(new THREE.Vector3(-0.11, -0.29, -0.47), new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.12, 0.1, -0.15)), new THREE.Vector3(1, 1, 1));
  const pm = new THREE.Matrix4().compose(new THREE.Vector3(-0.103, -0.222, -0.495), new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.55, 0.14, 0.05)), new THREE.Vector3(1, 1, 1));
  return pm.invert().multiply(hm);
})();
const CLOSE = { pos: new THREE.Vector3(0, -0.004, -0.168), quat: new THREE.Quaternion() };   // Loop-Bild
// Hand in der Nahaufnahme: hält das Handy von unten, Ärmel verschwindet nach unten aus dem Bild
const CLOSE_HAND = { pos: new THREE.Vector3(-0.012, -0.175, -0.29), quat: new THREE.Quaternion().setFromEuler(new THREE.Euler(1.2, 0, -0.18)) };
const pose = (x, y, z, rx, ry, rz) => ({ pos: new THREE.Vector3(x, y, z), quat: new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)) });
const HOLD = pose(-0.105, -0.2, -0.43, -0.42, 0.16, 0.05);
const HOLD_LOW = pose(-0.14, -0.235, -0.45, -0.55, 0.2, 0.08);
const _p = new THREE.Vector3(), _q = new THREE.Quaternion(), _m = new THREE.Matrix4(), _one = new THREE.Vector3(1, 1, 1);
function placePhone(a, b, k, grip = 1) {
  _p.copy(a.pos).lerp(b.pos, k); _q.copy(a.quat).slerp(b.quat, k);
  handy.position.copy(_p); handy.quaternion.copy(_q);
  _m.compose(_p, _q, _one).multiply(HAND_REL);
  _m.decompose(leftHand.position, leftHand.quaternion, tmp);
  const ck = b === CLOSE ? k : a === CLOSE ? 1 - k : 0;   // Nähe zur Loop-Nahaufnahme
  if (ck > 0) { const w = smooth(ck); leftHand.position.lerp(CLOSE_HAND.pos, w); leftHand.quaternion.slerp(CLOSE_HAND.quat, w); }
  leftHand.position.y -= (1 - grip) * 0.35;
  leftHand.userData.curl(0.45);
}

// ============================================================= Handy-Display ===
const SCR = handy.userData.screen;
let lastScreen = "";
function statusBar(c, w, time, battery, net) {
  c.fillStyle = "#ffffff"; c.font = "600 34px Arial"; c.textBaseline = "middle"; c.textAlign = "left";
  c.fillText(time, 44, 52);
  c.textAlign = "right"; c.font = "600 28px Arial";
  c.fillText(net ? "LTE" : "Kein Netz", w - 140, 52);
  c.strokeStyle = "#ffffff"; c.lineWidth = 3; c.strokeRect(w - 118, 38, 58, 28); c.fillRect(w - 58, 46, 5, 12);
  c.fillStyle = battery < 25 ? "#ff6b5b" : "#ffffff"; c.fillRect(w - 114, 42, 50 * battery / 100, 20);
  c.fillStyle = "#ffffff"; c.font = "600 26px Arial"; c.fillText(`${battery}%`, w - 128 - (net ? 72 : 150), 52);
}
function wifiOff(c, x, y, s) {
  c.strokeStyle = "#8b95a7"; c.lineCap = "round"; c.lineWidth = s * 0.09;
  for (let i = 1; i <= 3; i++) { c.beginPath(); c.arc(x, y + s * 0.35, s * 0.24 * i, -Math.PI * 0.78, -Math.PI * 0.22); c.stroke(); }
  c.fillStyle = "#8b95a7"; c.beginPath(); c.arc(x, y + s * 0.33, s * 0.07, 0, 6.3); c.fill();
  c.strokeStyle = "#ff5b4a"; c.lineWidth = s * 0.1; c.beginPath(); c.moveTo(x - s * 0.55, y - s * 0.5); c.lineTo(x + s * 0.55, y + s * 0.5); c.stroke();
}
function wallpaper(c, w, h, a = "#2b3d6b", b = "#7a4a6a") {
  const gr = c.createLinearGradient(0, 0, w * 0.4, h); gr.addColorStop(0, a); gr.addColorStop(1, b);
  c.fillStyle = gr; c.fillRect(0, 0, w, h);
}
function roundRect(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
function card2(c, x, y, w, h, title, text, col = "rgba(255,255,255,0.86)") {
  c.fillStyle = col; roundRect(c, x, y, w, h, 26); c.fill();
  c.fillStyle = "#1a1c22"; c.textAlign = "left"; c.textBaseline = "middle";
  c.font = "700 30px Arial"; c.fillText(title, x + 28, y + h * 0.34);
  c.font = "500 27px Arial"; c.fillStyle = "#3a3f4a"; c.fillText(text, x + 28, y + h * 0.7);
}
const SCREENS = {
  offline(c, w, h, s) {   // = erstes und letztes Bild (s.b = Blinkphase)
    const gr = c.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, "#151b28"); gr.addColorStop(1, "#0a0d14");
    c.fillStyle = gr; c.fillRect(0, 0, w, h);
    statusBar(c, w, "21:16", 64, false);
    if (s.b) { c.fillStyle = "rgba(255,91,74,0.16)"; c.beginPath(); c.arc(w / 2, h * 0.5, 200, 0, 6.3); c.fill(); }
    c.globalAlpha = s.b ? 1 : 0.55; wifiOff(c, w / 2, h * 0.5, 190); c.globalAlpha = 1;
    c.fillStyle = "#ffffff"; c.textAlign = "center"; c.textBaseline = "middle";
    c.font = "800 62px Arial"; c.fillText("Keine", w / 2, h * 0.655); c.fillText("Verbindung", w / 2, h * 0.71);
    c.fillStyle = "#9aa3b5"; c.font = "500 30px Arial"; c.fillText("Überprüfe deine", w / 2, h * 0.775); c.fillText("Internetverbindung.", w / 2, h * 0.805);
    c.strokeStyle = "#7fc4ff"; c.lineWidth = 4; roundRect(c, w * 0.22, h * 0.85, w * 0.56, 76, 38); c.stroke();
    c.fillStyle = "#7fc4ff"; c.font = "700 30px Arial"; c.fillText("Erneut versuchen", w / 2, h * 0.85 + 39);
  },
  lock(c, w, h, s) {
    wallpaper(c, w, h, s.a, s.b);
    statusBar(c, w, "", s.battery, false);
    c.fillStyle = "#ffffff"; c.textAlign = "center"; c.textBaseline = "middle";
    c.font = "500 36px Arial"; c.fillText(s.date, w / 2, h * 0.13);
    c.font = "300 190px Arial"; c.fillText(s.time, w / 2, h * 0.25);
    s.cards.forEach(([a, b], i) => card2(c, 30, h * 0.42 + i * 150, w - 60, 128, a, b));
  },
  navi(c, w, h) {
    c.fillStyle = "#e9e5dc"; c.fillRect(0, 0, w, h);
    const r = rng(5); c.strokeStyle = "#ffffff"; c.lineWidth = 22;
    for (let i = 0; i < 9; i++) { c.beginPath(); c.moveTo(r() * w, 0); c.lineTo(r() * w, h); c.stroke(); c.beginPath(); c.moveTo(0, r() * h); c.lineTo(w, r() * h); c.stroke(); }
    c.fillStyle = "#cfe3c0"; c.fillRect(w * 0.55, h * 0.55, 180, 220);
    c.fillStyle = "rgba(0,0,0,0.45)"; c.fillRect(0, 0, w, h);
    c.fillStyle = "#c0392b"; roundRect(c, 24, 110, w - 48, 210, 28); c.fill();
    c.fillStyle = "#ffffff"; c.textAlign = "center"; c.textBaseline = "middle";
    c.font = "800 44px Arial"; c.fillText("Route kann nicht", w / 2, 175); c.fillText("geladen werden", w / 2, 228);
    c.font = "500 28px Arial"; c.fillText("Keine Internetverbindung", w / 2, 285);
    c.fillStyle = "#2f80ed"; c.beginPath(); c.arc(w / 2, h * 0.62, 26, 0, 6.3); c.fill();
    c.strokeStyle = "#ffffff"; c.lineWidth = 8; c.stroke();
    c.fillStyle = "#1a1c22"; c.font = "700 40px Arial"; c.fillText("Ziel: ?", w / 2, h * 0.86);
    statusBar(c, w, "06:16", 41, false);
  },
  list(c, w, h) {
    c.fillStyle = "#fbf7e9"; c.fillRect(0, 0, w, h);
    c.fillStyle = "#1a1c22"; c.textAlign = "left"; c.textBaseline = "middle";
    c.font = "800 60px Arial"; c.fillText("Einkaufsliste", 40, 190);
    const items = [["Nudeln", true], ["Milch", false], ["Brot", false], ["Kerzen", false], ["Batterien", false], ["Spiele für Sonntag", false]];
    items.forEach(([n, done], i) => {
      const y = 300 + i * 92;
      c.strokeStyle = "#c08a2a"; c.lineWidth = 5; roundRect(c, 40, y - 26, 52, 52, 12); c.stroke();
      if (done) { c.strokeStyle = "#27ae60"; c.lineWidth = 8; c.beginPath(); c.moveTo(50, y); c.lineTo(64, y + 14); c.lineTo(86, y - 16); c.stroke(); }
      c.fillStyle = done ? "#9a9a9a" : "#1a1c22"; c.font = "600 44px Arial"; c.fillText(n, 118, y + 2);
    });
    c.fillStyle = "#c0392b"; roundRect(c, 30, h - 210, w - 60, 100, 24); c.fill();
    c.fillStyle = "#ffffff"; c.textAlign = "center"; c.font = "700 32px Arial"; c.fillText("Offline · nicht synchronisiert", w / 2, h - 160);
    c.fillStyle = "#1a1c22"; c.textAlign = "left"; c.font = "600 34px Arial"; c.fillText("10:42", 44, 52);
    c.textAlign = "right"; c.font = "600 28px Arial"; c.fillText("Kein Netz  38%", w - 40, 52);
  },
  dark(c, w, h) { c.fillStyle = "#06070a"; c.fillRect(0, 0, w, h); c.fillStyle = "rgba(255,255,255,0.05)"; c.fillRect(0, 0, w, h * 0.4); },
  restored(c, w, h, s) {
    wallpaper(c, w, h, "#20365e", "#5a3a5e");
    statusBar(c, w, s.time, 62, true);
    c.fillStyle = "#27ae60"; roundRect(c, 30, 100, w - 60, 96, 48); c.fill();
    c.fillStyle = "#ffffff"; c.textAlign = "center"; c.textBaseline = "middle"; c.font = "700 32px Arial";
    c.fillText("✓ Verbindung wiederhergestellt", w / 2, 149);
    if (s.n > 0) {
      c.font = "800 150px Arial"; c.fillText(de(s.n), w / 2, 330);
      c.font = "600 40px Arial"; c.fillText("Benachrichtigungen", w / 2, 430);
      const list = [["Familie (Gruppe)", "412 neue Nachrichten"], ["Mama", "Bist du okay??"], ["Arbeit", "96 ungelesene E-Mails"], ["Nachrichten", "Internet ist zurück"], ["Kalender", "7 verpasste Termine"], ["Lieferdienst", "Bestellung verspätet"]];
      const k = Math.min(list.length, Math.ceil(s.n / 400));
      for (let i = 0; i < k; i++) card2(c, 30, 500 + i * 128, w - 60, 112, list[i][0], list[i][1]);
    } else {
      c.font = "300 190px Arial"; c.fillText(s.time, w / 2, h * 0.3);
    }
  },
  feed(c, w, h, s) {
    // Ein Feed wie bei Kurzvideo-Apps (ohne Logo) – er zeigt genau dieses Video: Titelbild mit Handy „Keine Verbindung“.
    const gr = c.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, "#2a3346"); gr.addColorStop(0.55, "#4a4030"); gr.addColorStop(1, "#151820");
    c.fillStyle = gr; c.fillRect(0, 0, w, h);
    // U-Bahn-Andeutung
    c.fillStyle = "rgba(242,195,24,0.35)"; c.fillRect(0, h * 0.72, w, 16);
    c.fillStyle = "rgba(255,255,255,0.12)"; for (let i = 0; i < 5; i++) c.fillRect(30 + i * 120, h * 0.2, 80, h * 0.12);
    // kleines Handy mit „Keine Verbindung“
    const px = w * 0.27, py = h * 0.37, pw = w * 0.46, ph = h * 0.47;
    c.fillStyle = "#17181c"; roundRect(c, px - 10, py - 10, pw + 20, ph + 20, 34); c.fill();
    c.fillStyle = "#121722"; roundRect(c, px, py, pw, ph, 26); c.fill();
    wifiOff(c, px + pw / 2, py + ph * 0.42, 90);
    c.fillStyle = "#ffffff"; c.textAlign = "center"; c.textBaseline = "middle"; c.font = "800 30px Arial";
    c.fillText("Keine", px + pw / 2, py + ph * 0.66); c.fillText("Verbindung", px + pw / 2, py + ph * 0.73);
    // Titel wie im Video
    c.font = "500 44px Georgia, 'DejaVu Serif', serif"; c.fillStyle = "#ffffff";
    const L = ["Was wäre, wenn das", "Internet eine Woche", "lang ausfällt?"];
    L.forEach((l, i) => c.fillText(l, w / 2, h * 0.215 + i * 54));
    c.fillStyle = "#7fc4ff"; // Akzentwort nachzeichnen
    const iw = c.measureText("Internet").width, lw = c.measureText(L[1]).width;
    c.fillText("Internet", w / 2 - lw / 2 + iw / 2, h * 0.215 + 54);
    // Oberfläche: Tabs, Seitenleiste, Name
    c.fillStyle = "rgba(255,255,255,0.65)"; c.font = "600 32px Arial"; c.fillText("Folge ich", w * 0.33, 118);
    c.fillStyle = "#ffffff"; c.font = "800 32px Arial"; c.fillText("Für dich", w * 0.66, 118);
    c.fillRect(w * 0.66 - 30, 142, 60, 5);
    const sx = w - 62;
    c.fillStyle = "#ffffff"; c.beginPath(); c.arc(sx, h * 0.58, 34, 0, 6.3); c.fill();
    const icon = (y, draw, label) => { draw(y); c.fillStyle = "#ffffff"; c.font = "700 24px Arial"; c.fillText(label, sx, y + 50); };
    icon(h * 0.68, (y) => { c.fillStyle = "#ff3b5c"; c.beginPath(); c.moveTo(sx, y + 22); c.bezierCurveTo(sx - 46, y - 6, sx - 22, y - 34, sx, y - 12); c.bezierCurveTo(sx + 22, y - 34, sx + 46, y - 6, sx, y + 22); c.fill(); }, "1,2 Mio.");
    icon(h * 0.77, (y) => { c.fillStyle = "#ffffff"; c.beginPath(); c.ellipse(sx, y, 30, 24, 0, 0, 6.3); c.fill(); c.beginPath(); c.moveTo(sx - 14, y + 18); c.lineTo(sx - 24, y + 32); c.lineTo(sx + 2, y + 22); c.fill(); }, "8.431");
    icon(h * 0.86, (y) => { c.fillStyle = "#ffffff"; c.beginPath(); c.moveTo(sx + 28, y - 4); c.lineTo(sx - 4, y - 28); c.lineTo(sx - 4, y - 14); c.quadraticCurveTo(sx - 30, y - 10, sx - 30, y + 24); c.quadraticCurveTo(sx - 18, y + 4, sx - 4, y + 6); c.lineTo(sx - 4, y + 20); c.fill(); }, "Teilen");
    c.textAlign = "left"; c.fillStyle = "#ffffff"; c.font = "700 32px Arial"; c.fillText("@waswaerewenn", 34, h * 0.885);
    c.font = "500 26px Arial"; c.fillText("Nur eine Simulation #wasWäreWenn", 34, h * 0.925);
    c.fillStyle = "rgba(255,255,255,0.3)"; c.fillRect(0, h - 10, w, 6); c.fillStyle = "#ffffff"; c.fillRect(0, h - 10, w * s.p, 6);
    statusBar(c, w, "21:16", 64, true);
  },
};
function screen(kind, s = {}) {
  const key = kind + JSON.stringify(s);
  if (key === lastScreen) return;
  lastScreen = key;
  SCR.redraw((c, w, h) => SCREENS[kind](c, w, h, s));
}

// ================================================ Figuren und ihre Handys ===
const yellowLook = { shirt: "#e0b25b" };

// ============================================================ A: U-Bahn ===
const CAM_A = new THREE.Vector3(0, 1.62, 1.45);
const aSeats = A.seatSpots.filter((s) => s.z < 0.9).filter((s, i) => (i * 7 + 3) % 10 < 8);
const NA = aSeats.length + 3;
const aFolk = folk(NA, 211); A.group.add(aFolk.group);
const aPh = heldPhones(NA); A.group.add(aPh.group);
const aPeople = aSeats.map((s) => ({ ...s, sit: true, ph: R() * 6.28, d: R.range(-0.06, 0.08), shrug: R() < 0.3, lookCam: R() < 0.45 }));
aPeople.push({ x: 0.36, z: -2.1, rotY: 0.25, sit: false, ph: 1, d: 0.02, shrug: true, lookCam: true });
aPeople.push({ x: -0.32, z: -3.9, rotY: -0.3, sit: false, ph: 2, d: -0.03, shrug: false, lookCam: false });
aPeople.push({ x: 0.3, z: -9.3, rotY: 3.0, sit: false, ph: 3, d: 0.05, shrug: false, lookCam: false });
function renderSubway(t) {
  only("A");
  const sway = Math.sin(t * 2.1) * 0.006;
  const yaw = 0.0 + 0.02 * Math.sin(t * 0.6), pitch = lerp(-0.2, -0.13, smooth((t - LOOKUP) / 0.8));
  setCam([CAM_A.x + sway, CAM_A.y, CAM_A.z], yaw, pitch, 62, 0.004, sway * 2);
  // Licht: Wagenbeleuchtung, im ersten Moment noch gedimmt (Blick aufs Display)
  const wake = 0.45 + 0.55 * smooth((t - 0.15) / 0.8);
  look({ hemiSky: "#fff6e6", hemiGround: "#6a6258", hemiI: 1.25 * wake, bg: "#05070b", exposure: 1.15 * (0.75 + 0.25 * wake), fog: [30, 60], fogColor: "#0a0c10" });
  A.lights.forEach((l) => { l.intensity = 4 * wake; });
  A.update(t);
  aPeople.forEach((p, i) => {
    const up = smooth((t - LOOKUP - p.d) / 0.35);
    const shrug = p.shrug ? smooth((t - LOOKUP - 0.6 - p.d) / 0.35) * (1 - smooth((t - 2.75) / 0.35)) : 0;
    const toCam = towardCam(CAM_A.x, CAM_A.z, p.x, p.z, p.rotY);
    const yawLook = p.lookCam ? toCam * 0.85 : 0.6 * Math.sin(p.ph + t * 0.8);
    aFolk.set(i, { x: p.x, z: p.z, rotY: p.rotY, sit: p.sit,
      headPitch: lerp(0.5, -0.06, up), headYaw: lerp(0.05 * Math.sin(p.ph), yawLook, up), headTilt: 0.08 * up * Math.sin(p.ph),
      armL: lerp(1.0, 0.45, up) + 0.5 * shrug, armR: lerp(1.0, 0.45, up) + (p.sit ? 0.5 : 0.2) * shrug, spreadL: lerp(-0.22, 0, up) + 0.45 * shrug, spreadR: lerp(-0.22, 0, up) + 0.45 * shrug,
      visible: true });
    aPh.set(i, { x: p.x, z: p.z, rotY: p.rotY, sit: p.sit, lift: 1 - up * 0.9, visible: true, rest: "lap" });
  });
  aFolk.commit(); aPh.commit();
  // Dein Handy: erstes Bild ganz nah (= letztes Bild), dann runter in die normale Haltung
  hands({ left: "phone" });
  placePhone(HOLD, CLOSE, 1 - smooth((t - 0.15) / 1.0));
  screen("offline", { b: blink(t) });
  rig.position.set(0, 0, 0);
  canvas.style.filter = "saturate(1.05) contrast(1.03)";
  return 1;
}

// ========================================================= B: Kasse ===
const CAM_B = new THREE.Vector3(0.02, 1.6, 0.42);
const NB = 10;
const bFolk = folk(NB, 222); B.group.add(bFolk.group);
bFolk.look(0, { shirt: "#c8282e", pants: "#2c2a28", hair: "#7a5232", long: 1.0, skin: "#f1c8a5" });   // Kassiererin
const bPeople = [
  { x: 1.32, z: -1.1, rotY: -Math.PI / 2, sit: true, cashier: true },
  { x: 0.05, z: -2.4, rotY: 0.05 }, { x: -0.05, z: -3.2, rotY: -0.1 }, { x: 0.08, z: -4.0, rotY: 0.1 }, { x: -0.1, z: -4.8, rotY: 0 },
  { x: -2.0, z: -0.9, rotY: 0.2 }, { x: -2.05, z: -1.8, rotY: 0 }, { x: -1.95, z: -2.7, rotY: 0.1 }, { x: -2.1, z: -3.6, rotY: -0.1 }, { x: -2.0, z: -4.5, rotY: 0 },
].map((p) => ({ ...p, ph: R() * 6.28 }));
function drawTerminal(state) {
  B.term.redraw((c, w, h) => {
    c.fillStyle = state === "fail" ? "#fff1f0" : "#eef3f8"; c.fillRect(0, 0, w, h);
    c.textAlign = "center"; c.textBaseline = "middle";
    if (state === "fail") {
      c.fillStyle = "#c0392b"; c.fillRect(0, 0, w, h * 0.2);
      c.fillStyle = "#ffffff"; c.font = "800 34px Arial"; c.fillText("FEHLER", w / 2, h * 0.1);
      c.fillStyle = "#b02a20"; c.font = "800 44px Arial"; c.fillText("Verbindung", w / 2, h * 0.42);
      c.fillText("fehlgeschlagen", w / 2, h * 0.62);
      c.fillStyle = "#333"; c.font = "600 26px Arial"; c.fillText("Bitte bar zahlen", w / 2, h * 0.85);
    } else {
      c.fillStyle = "#1a1c22"; c.font = "800 40px Arial"; c.fillText("23,47 EUR", w / 2, h * 0.3);
      c.font = "600 30px Arial"; c.fillText("Karte bitte", w / 2, h * 0.55);
      c.fillStyle = "#2f80ed"; c.font = "600 26px Arial"; c.fillText("Verbinde …", w / 2, h * 0.8);
    }
  });
}
let termState = "";
function renderCheckout(t) {
  only("B");
  const lt = t - CUT_B;
  const yaw = lerp(-0.13, -0.18, smooth(lt / 2.8)), pitch = lerp(-0.4, -0.34, smooth(lt / 2.8));
  setCam([CAM_B.x, CAM_B.y, CAM_B.z], yaw, pitch, lerp(62, 54, smooth((lt - 0.5) / 2.2)), 0.003);
  look({ hemiSky: "#fffaf0", hemiGround: "#9a8f80", hemiI: 1.6, sunColor: "#fff4e0", sunI: 0.9, sunDir: new THREE.Vector3(-0.3, 1, 0.4).normalize(), shadowAt: [0, 0, -2], shadowSize: 6, bg: "#efe9df", exposure: 1.08, fog: [12, 30], fogColor: "#efe9df" });
  const st = t < TAP + 0.25 ? "wait" : "fail";
  if (st !== termState) { drawTerminal(st); termState = st; }
  bPeople.forEach((p, i) => {
    if (p.cashier) {
      const shrug = smooth((t - TAP - 0.5) / 0.4) * (1 - smooth((t - (TAP + 2.0)) / 0.4));
      bFolk.set(i, { x: p.x, z: p.z, rotY: p.rotY, sit: true, headYaw: lerp(0.0, -0.35, smooth((t - TAP) / 0.5)), headPitch: 0.05, headTilt: 0.12 * shrug,
        armL: 0.9 + 0.35 * shrug, armR: 0.9 + 0.35 * shrug, spreadL: 0.5 * shrug, spreadR: 0.5 * shrug, visible: true });
      return;
    }
    const lean = Math.sin(t * 0.7 + p.ph);
    const nosy = smooth((t - TAP - 0.3 - i * 0.05) / 0.5);
    bFolk.set(i, { x: p.x, z: p.z, rotY: p.rotY, headYaw: lerp(0.2 * lean, towardCam(CAM_B.x, CAM_B.z, p.x, p.z, p.rotY) * 0.6, nosy), headPitch: 0.05, headTilt: 0.05 * lean,
      armL: 0.15 + (i % 3 === 0 ? 0.8 : 0), armR: 0.12, visible: true });
  });
  bFolk.commit();
  // Hände: rechts die Karte, links das Handy
  hands({ left: "phone", right: "card" });
  const tap = smooth((t - (TAP - 0.4)) / 0.4) * (1 - smooth((t - (TAP + 0.6)) / 0.5));
  rightHand.position.set(lerp(0.2, 0.26, tap), lerp(-0.33, -0.38, tap), lerp(-0.42, -0.52, tap)); rightHand.rotation.set(0.15, -0.3, 0.25); rightHand.userData.curl(0.55);
  card.position.set(rightHand.position.x - 0.03, rightHand.position.y + 0.02, rightHand.position.z - 0.12); card.rotation.set(-1.2, -0.25, 0.3);
  placePhone(HOLD_LOW, HOLD_LOW, 0);
  screen("lock", { a: "#3a2b5a", b: "#b0566a", battery: 61, date: "Montag, 9. März", time: "23:16", cards: [["Kein Netz", "Mobiles Bezahlen nicht verfügbar"]] });
  canvas.style.filter = "saturate(1.04) contrast(1.03)";
  return smooth(lt / 0.14);
}

// ===================================================== D: Bahnhofshalle ===
const CAM_D = new THREE.Vector3(1.0, 1.62, 3.6);
const ND = 26;
const dFolk = folk(ND, 244); D.group.add(dFolk.group);
const dPeople = [];
for (let i = 0; i < ND; i++) {
  const x = R.range(-9, 9), z = R.range(-10, 0.5);
  if (Math.hypot(x - CAM_D.x, z - CAM_D.z) < 2.6) { i--; continue; }
  dPeople.push({ x, z, rotY: Math.PI + R.range(-0.5, 0.5), ph: R() * 6.28, map: false, walk: R() < 0.25 ? R.range(-1, 1) : 0 });
}
// zwei Leute mit Papierplan, nah am Bild
Object.assign(dPeople[0], { x: -0.9, z: -0.6, rotY: 0.55, map: true, walk: 0 });
Object.assign(dPeople[1], { x: -0.1, z: -1.1, rotY: -0.45, map: false, walk: 0, point: true });
Object.assign(dPeople[2], { x: 2.6, z: -2.2, rotY: -0.3, map: true, walk: 0 });
const dMaps = [paperMap(0.62, 0.44, 21), paperMap(0.62, 0.44, 22)];
dMaps.forEach((m) => D.group.add(m));
const _mm = new THREE.Matrix4(), _ml = new THREE.Matrix4();
function renderStation(t) {
  only("D");
  const lt = t - CUT_D;
  setCam([CAM_D.x - 0.12 * lt, CAM_D.y, CAM_D.z - 0.18 * lt], lerp(0.08, 0.02, smooth(lt / 3.2)), lerp(0.1, -0.02, smooth((lt - 0.9) / 1.3)), 62, 0.004);
  const SUN = new THREE.Vector3(-0.45, 0.85, 0.3).normalize();
  look({ hemiSky: "#fff4e6", hemiGround: "#9a8c78", hemiI: 1.35, sunColor: "#ffe2b8", sunI: 1.8, sunDir: SUN, shadowAt: [0, 0, -6], shadowSize: 16, bg: "#dfe8ef", exposure: 1.05, fog: [30, 90], fogColor: "#e6e0d6" });
  let mi = 0;
  dPeople.forEach((p, i) => {
    const x = p.x + p.walk * lt, rotY = p.walk ? (p.walk > 0 ? Math.PI / 2 : -Math.PI / 2) : p.rotY;
    let s = { x, z: p.z, rotY, swing: p.walk ? Math.sin(lt * 5 + p.ph) * 0.45 : 0, headPitch: -0.3 + 0.05 * Math.sin(t + p.ph), headYaw: 0.2 * Math.sin(t * 0.5 + p.ph), armL: 0.1, armR: 0.1, visible: true };
    if (p.map) {
      s = { ...s, headPitch: 0.42, headYaw: 0.1 * Math.sin(t * 0.8 + p.ph), armL: 0.95, armR: 0.95, spreadL: -0.12, spreadR: -0.12 };
      const m = dMaps[mi++];
      _mm.compose(tmp.set(x, 0, p.z), _q.setFromEuler(new THREE.Euler(0, rotY, 0)), _one);
      _ml.compose(new THREE.Vector3(0, 1.2, 0.5), new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.75, 0, 0)), _one);
      _mm.multiply(_ml); _mm.decompose(m.position, m.quaternion, m.scale);
    }
    if (p.point) s = { ...s, headPitch: 0.25, headYaw: 0.5, armR: 1.1, spreadR: -0.5, twist: 0.3 };
    dFolk.set(i, s);
  });
  dFolk.commit();
  // Hände: links das Navi, dann kommt rechts der Stadtplan ins Bild
  const mu = smooth((t - MAP_UP) / 0.7);
  hands({ left: "phone", right: mu > 0.01 ? "map" : null });
  placePhone(HOLD, HOLD_LOW, mu);
  screen("navi");
  rightHand.position.set(0.2, lerp(-0.6, -0.31, mu), -0.5); rightHand.rotation.set(0.35, -0.2, 0.9); rightHand.userData.curl(0.6);
  myMap.position.set(lerp(0.12, 0.07, mu), lerp(-0.5, -0.19, mu), -0.56); myMap.rotation.set(-0.55, -0.12, 0.08);
  canvas.style.filter = "saturate(1.04) contrast(1.02)";
  return smooth(lt / 0.14);
}

// ============================================================ E: Späti ===
const CAM_E = new THREE.Vector3(0.75, 1.62, 3.1);
const NE = 7;
const eFolk = folk(NE, 255); E.group.add(eFolk.group);
eFolk.look(0, { shirt: "#3f5468", hair: "#9a9a9a", beard: 1, beardColor: "#bdbdb6", long: 0 });   // Späti-Besitzer
const ePeople = [
  { x: -1.0, z: -3.45, rotY: 0, seller: true },
  { x: -0.95, z: -2.25, rotY: Math.PI + 0.1 }, { x: -0.8, z: -1.45, rotY: Math.PI }, { x: -0.55, z: -0.65, rotY: Math.PI - 0.1 }, { x: -0.35, z: 0.15, rotY: Math.PI },
  { x: 2.3, z: -1.2, rotY: 2.6, paper: true }, { x: 4.2, z: -1.4, rotY: -2.2 },
].map((p) => ({ ...p, ph: R() * 6.28 }));
const lastPaper = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.02, 0.22), mat("#ecebe4")); E.group.add(lastPaper);
function renderSpaeti(t) {
  only("E");
  const lt = t - CUT_E;
  const tgt = new THREE.Vector3(lerp(-0.7, 0.95, smooth((lt - 0.3) / 2.0)), 1.35, -2.2);
  const pos = [CAM_E.x, CAM_E.y, CAM_E.z - 0.1 * lt];
  setCam(pos, yawTo({ x: pos[0], z: pos[2] }, tgt.x, tgt.z), Math.atan2(tgt.y - pos[1], Math.hypot(tgt.x - pos[0], tgt.z - pos[2])), 62, 0.004);
  const SUN = new THREE.Vector3(0.6, 0.55, 0.55).normalize();
  look({ hemiSky: "#ffeedd", hemiGround: "#8a7a66", hemiI: 1.15, sunColor: "#ffd8a8", sunI: 2.4, sunDir: SUN, shadowAt: [0, 0, -1], shadowSize: 9, skyCols: ["#7aa6d8", "#f4dcb8", "#8a8070", 0.5], exposure: 1.05, fog: [40, 200], fogColor: "#e8d8c0" });
  ePeople.forEach((p, i) => {
    let s = { x: p.x, z: p.z, rotY: p.rotY, headYaw: 0.25 * Math.sin(t * 0.5 + p.ph), headPitch: 0.04, armL: 0.1, armR: 0.1, visible: true };
    if (p.seller) {   // zeigt bedauernd auf den leeren Ständer
      const gest = smooth((lt - 0.6) / 0.5) * (1 - smooth((lt - 2.6) / 0.4));
      s = { ...s, y: 0, armL: 0.9, armR: 0.9 + 0.5 * gest, spreadR: -0.6 * gest, headYaw: -0.4 * gest, headTilt: 0.1 * gest };
    }
    if (i === 1) s = { ...s, headYaw: -0.5 * smooth((lt - 0.9) / 0.5), headPitch: 0.1 };
    if (p.paper) {   // hat die letzte Zeitung ergattert und liest im Gehen
      const x = p.x + 0.55 * lt, z = p.z + 0.05 * lt;
      s = { ...s, x, z, rotY: Math.PI / 2 + 0.4, swing: Math.sin(lt * 4.6) * 0.3, armL: 1.0, armR: 1.0, spreadL: -0.15, spreadR: -0.15, headPitch: 0.4 };
      _mm.compose(tmp.set(x, 0, z), _q.setFromEuler(new THREE.Euler(0, s.rotY, 0)), _one);
      _ml.compose(new THREE.Vector3(0, 1.22, 0.5), new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.7, 0, 0)), _one);
      _mm.multiply(_ml); _mm.decompose(lastPaper.position, lastPaper.quaternion, lastPaper.scale);
    }
    eFolk.set(i, s);
  });
  eFolk.commit();
  hands({ left: "phone", right: "coins" });
  placePhone(HOLD_LOW, HOLD_LOW, 0);
  screen("lock", { a: "#2b5a6b", b: "#d0a060", battery: 47, date: "Dienstag, 10. März", time: "07:52", cards: [["Kein Netz", "Nachrichten konnten nicht geladen werden"]] });
  rightHand.position.set(0.17, -0.34, -0.5); rightHand.rotation.set(0.25, -0.15, Math.PI - 0.15); rightHand.userData.curl(0.15);
  coins.position.set(0.175, -0.322, -0.56); coins.rotation.set(0.25, 0, 0.1);
  canvas.style.filter = "saturate(1.06) contrast(1.03)";
  return smooth(lt / 0.14);
}

// =================================================== F: Supermarktgang ===
const NF = 4;
const fFolk = folk(NF, 266); F.group.add(fFolk.group);
const fPeople = [
  { x: -0.95, z: -3.6, rotY: -Math.PI / 2 }, { x: 0.9, z: -6.2, rotY: Math.PI / 2 }, { x: -0.2, z: -9.5, rotY: Math.PI }, { x: 0.3, z: -12.5, rotY: 0.2 },
].map((p) => ({ ...p, ph: R() * 6.28 }));
const delivery = drawPanel(0.5, 0.32, 900, (c, w, h) => {
  c.fillStyle = "#fbf8ee"; c.fillRect(0, 0, w, h); c.fillStyle = "#c0392b"; c.fillRect(0, 0, w, 16);
  c.fillStyle = "#1a1a1a"; c.textAlign = "center"; c.textBaseline = "middle";
  c.font = handFont(66); c.fillText("Lieferung", w / 2, h * 0.36); c.fillText("fällt aus!", w / 2, h * 0.64);
  c.font = handFont(30); c.fillStyle = "#555"; c.fillText("Bestellsystem offline", w / 2, h * 0.88);
}, { basicMat: false });
delivery.mesh.position.set(1.22, 1.55, -3.6); delivery.mesh.rotation.y = -Math.PI / 2 + 0.25; F.group.add(delivery.mesh);
function renderAisle(t) {
  only("F");
  const lt = t - CUT_F;
  const z = 1.2 - 0.55 * lt;
  const bob = Math.sin(lt * Math.PI * 2 * 0.9) * 0.012;
  setCam([0.05, 1.62 + bob, z], 0.04 * Math.sin(lt * 0.7) - 0.06, -0.2, 62, 0.003);
  look({ hemiSky: "#fffaf0", hemiGround: "#9a9a90", hemiI: 1.7, sunColor: "#ffffff", sunI: 0.5, sunDir: new THREE.Vector3(0.2, 1, 0.3).normalize(), shadowAt: [0, 0, z - 4], shadowSize: 8, bg: "#e6e6e2", exposure: 1.05, fog: [10, 26], fogColor: "#e4e2dc" });
  F.aisle.update(t);
  fPeople.forEach((p, i) => {
    let s = { x: p.x, z: p.z, rotY: p.rotY, headYaw: 0.3 * Math.sin(t * 0.7 + p.ph), headPitch: 0.05, armL: 0.1, armR: 0.1, visible: true };
    if (i === 0) { const reach = Math.max(0, Math.sin(lt * 1.6)); s = { ...s, armR: 0.3 + 1.1 * reach, headPitch: -0.1, headYaw: 0.25 * Math.sin(lt) }; }
    if (i === 1) { const shrug = smooth((lt - 1.0) / 0.5); s = { ...s, twist: -0.4 * shrug, headYaw: -0.7 * shrug, armL: 0.12 + 0.4 * shrug, armR: 0.12 + 0.4 * shrug, spreadL: 0.45 * shrug, spreadR: 0.45 * shrug }; }
    if (i === 2) s = { ...s, z: p.z - 0.6 * lt, swing: Math.sin(lt * 4.8) * 0.4 };
    fFolk.set(i, s);
  });
  fFolk.commit();
  hands({ left: "phone", right: "cart", cart: true });
  cart.position.set(0.04, -1.02, -0.95); cart.rotation.set(0.02, 0, 0);
  rightHand.position.set(0.13, -0.79, -0.5); rightHand.rotation.set(0.75, 0.05, 1.4); rightHand.userData.curl(0.95);
  placePhone(HOLD, HOLD, 0);
  screen("list");
  rig.position.set(0, -bob * 0.4, 0);
  canvas.style.filter = "saturate(1.05) contrast(1.02)";
  return smooth(lt / 0.14);
}

// ======================================================= G: Hinterhof ===
const CAM_G = new THREE.Vector3(0.4, 1.62, 3.2);
const NG = 8;
const gFolk = folk(NG, 277); G.group.add(gFolk.group);
const KIDS = [0, 1, 2];
gFolk.look(0, { shirt: "#e74c3c", hair: "#c9a16a", long: 0.9 }); gFolk.look(1, { shirt: "#2f80ed", hair: "#2a1e17", long: 0 }); gFolk.look(2, { shirt: "#f1c40f", hair: "#7a5232", long: 0.6 });
gFolk.look(6, { shirt: "#5d6b3a", hair: "#4a3222", beard: 1, long: 0 });   // Gitarrist
function renderCourtyard(t) {
  only("G");
  const lt = t - CUT_G;
  setCam([CAM_G.x - 0.12 * lt, CAM_G.y, CAM_G.z - 0.1 * lt], lerp(0.3, -0.3, smooth(lt / 3.5)), lerp(-0.1, -0.13, smooth(lt / 3.5)), 62, 0.004);
  const SUN = new THREE.Vector3(-0.5, 0.75, 0.45).normalize();
  look({ hemiSky: "#fff1dc", hemiGround: "#7a7060", hemiI: 1.15, sunColor: "#ffe2b0", sunI: 2.6, sunDir: SUN, shadowAt: [0, 0, -4], shadowSize: 11, skyCols: ["#6f9cd4", "#f2e0c0", "#8a8070", 0.6], exposure: 1.06, fog: [50, 200], fogColor: "#eadcc4" });
  // Kinder rennen dem Ball hinterher
  const bc = { x: 1.1, z: -4.4 };
  const ba = lt * 1.5;
  const ballX = bc.x + Math.cos(ba) * 1.5, ballZ = bc.z + Math.sin(ba) * 0.9;
  G.ball.position.set(ballX, 0.13 + Math.abs(Math.sin(lt * 5.5)) * 0.45, ballZ);
  KIDS.forEach((k, j) => {
    const a = ba - 0.55 - j * 0.6;
    const x = bc.x + Math.cos(a) * 1.75, z = bc.z + Math.sin(a) * 1.1;
    const dir = Math.atan2(-Math.sin(a) * 1.75, Math.cos(a) * 1.1);
    gFolk.set(k, { x, y: Math.abs(Math.sin(lt * 7 + j)) * 0.08, z, rotY: dir, scale: [0.6, 0.66, 0.55][j], headScale: 1.15, swing: Math.sin(lt * 9 + j) * 0.7, armL: j === 0 ? 0.3 : 0, armR: j === 2 ? 1.6 + 0.3 * Math.sin(lt * 6) : 0, visible: true });
  });
  // Nachbarn im Gespräch
  const grp = [[-1.5, -3.6, 2.4], [-0.75, -4.25, -0.9], [-2.2, -4.35, 0.95]];
  grp.forEach(([x, z, ry], j) => {
    const talk = Math.max(0, Math.sin(lt * 1.3 + j * 2.1));
    const laugh = smooth((lt - 1.4 - j * 0.15) / 0.3) * (1 - smooth((lt - 2.6) / 0.4));
    gFolk.set(3 + j, { x, z, rotY: ry, headYaw: 0.25 * Math.sin(lt * 0.9 + j), headPitch: -0.06 - 0.12 * laugh, headTilt: 0.12 * laugh, armR: 0.2 + 0.7 * talk * (j === 0 ? 1 : 0.6), spreadR: -0.2 * talk, armL: 0.15 + 0.3 * laugh, visible: true });
  });
  // Gitarrist auf der Bank
  const strum = Math.sin(lt * 9.5);
  gFolk.set(6, { x: 4.6, z: -6.75, rotY: -0.25, sit: true, armL: 1.2, spreadL: -0.4, armR: 0.75 + 0.12 * strum, spreadR: -0.35, headPitch: 0.1, headTilt: 0.1 * Math.sin(lt * 1.2), visible: true });
  G.guitar.position.set(4.62, 0.82, -6.4); G.guitar.rotation.set(0.15, -0.25, 1.15);
  // Nachbarin gießt Blumen
  gFolk.set(7, { x: 1.4, z: -8.9, rotY: Math.PI + 0.3, armR: 0.9, headPitch: 0.3, visible: true });
  gFolk.commit();
  hands({ left: "phone", right: "cup" });
  placePhone(HOLD_LOW, HOLD_LOW, 0);
  screen("lock", { a: "#3a7a6a", b: "#e0b060", battery: 58, date: "Freitag, 13. März", time: "17:40", cards: [["Kein Netz", "Bildschirmzeit diese Woche: −94 %"]] });
  rightHand.position.set(0.15, -0.29, -0.55); rightHand.rotation.set(0.15, 0.3, 1.25); rightHand.userData.curl(0.95);
  cup.position.set(0.105, -0.235, -0.585); cup.rotation.set(0.05, -0.6, -0.04);
  canvas.style.filter = "saturate(1.1) contrast(1.03)";
  return smooth(lt / 0.14);
}

// ===================================================== H: Wohnzimmer ===
const TZ = H.tz;
const CAM_H = new THREE.Vector3(0, 1.2, 0.18);
const hFolk = folk(3, 288); H.group.add(hFolk.group);
hFolk.look(0, { shirt: "#7a2e3e", hair: "#a8552e", long: 1.1 });
hFolk.look(1, { shirt: "#5d6b3a", hair: "#2a1e17", long: 0, beard: 1 });
hFolk.look(2, { shirt: "#3f6a8a", hair: "#c9a16a", long: 0.8 });
const hPh = heldPhones(3); H.group.add(hPh.group);
const FRIENDS = H.chairs.map(([x, z, ry], i) => ({ x: i === 2 ? x * 0.97 : x, z: i < 2 ? z + 0.05 : z, rotY: ry, ph: i * 2.1 }));
const phoneLights = FRIENDS.map(() => { const l = new THREE.PointLight("#9ec4ff", 0, 1.6, 1.5); H.group.add(l); return l; });
const myPhoneLight = new THREE.PointLight("#9ec4ff", 0, 1.2, 1.5); H.group.add(myPhoneLight);
const tablePhone = handy.clone(); H.group.add(tablePhone);
const TP = { x: -0.36, z: -0.5 };
const die = dice(); H.group.add(die);
const DIE_END = new THREE.Vector3(0.06, TABLE_Y + 0.014, TZ + 0.06);
const _hw = new THREE.Vector3();
const HK = {
  yaw: [[CUT_H, 0.04], [ROLL - 0.4, 0.02], [LAND + 0.1, 0.0], [BUZZ - 0.4, 0.06], [BUZZ + 0.15, 0.06], [BUZZ + 0.9, 0.55], [PHONES_UP - 0.5, 0.55], [PHONES_UP + 0.4, 0.02], [GRAB - 0.1, 0.0], [GRAB + 0.5, 0.25], [FEED + 0.3, 0.12], [DURATION, 0.05]],
  pitch: [[CUT_H, -0.2], [ROLL - 0.4, -0.25], [LAND + 0.1, -0.27], [BUZZ - 0.4, -0.2], [BUZZ + 0.15, -0.2], [BUZZ + 0.9, -0.68], [PHONES_UP - 0.5, -0.68], [PHONES_UP + 0.4, -0.2], [GRAB - 0.1, -0.22], [GRAB + 0.5, -0.55], [FEED + 0.3, -0.2], [DURATION, -0.12]],
  fwd: [[CUT_H, 0], [BUZZ + 0.15, 0], [BUZZ + 0.9, 0.35], [PHONES_UP - 0.5, 0.35], [PHONES_UP + 0.4, 0], [DURATION, 0]],
  fov: [[CUT_H, 62], [BUZZ + 0.15, 62], [BUZZ + 0.9, 34], [PHONES_UP - 0.5, 34], [PHONES_UP + 0.4, 62], [DURATION, 62]],
};
function renderLiving(t) {
  only("H");
  const lt = t - CUT_H;
  const fwd = valueAt(HK.fwd, t);
  const breath = Math.sin(t * Math.PI * 2 * 0.24) * 0.004;
  setCam([CAM_H.x - 0.12 * fwd, CAM_H.y + 0.12 * fwd + breath, CAM_H.z - 0.45 * fwd], valueAt(HK.yaw, t), valueAt(HK.pitch, t), valueAt(HK.fov, t), 0.003);
  look({ hemiSky: "#ffc890", hemiGround: "#2a1a10", hemiI: 0.42, bg: "#0c0a0a", exposure: 1.3, fog: [8, 20], fogColor: "#140e0a" });
  // Kerzen flackern
  H.candles.forEach((c, i) => {
    const fl = 1 + 0.1 * Math.sin(t * 11 + i * 2) + 0.06 * Math.sin(t * 23 + i) + (t > PHONES_UP ? 0.08 * Math.sin(t * 37 + i) : 0);
    c.f.scale.set(0.09 * fl, 0.14 * fl, 1); c.light.intensity = 2.2 * fl;
  });
  // Freunde
  const online = smooth((t - (BUZZ + 0.3)) / 0.2);
  FRIENDS.forEach((f, i) => {
    const pick = smooth((t - PHONES_UP - i * 0.25) / 0.7);
    const cheer = i === 0 ? smooth((t - LAND - 0.1) / 0.3) * (1 - smooth((t - (LAND + 1.1)) / 0.4)) : 0;
    const laugh = smooth((t - LAND) / 0.3) * (1 - smooth((t - (LAND + 1.5)) / 0.4));
    const glance = smooth((t - BUZZ - 0.4 - i * 0.1) / 0.4) * (1 - pick);
    const toCam = towardCam(CAM_H.x, CAM_H.z, f.x, f.z, f.rotY);
    let headYaw = lerp(0.3 * Math.sin(t * 0.6 + f.ph) + toCam * 0.4 * Math.max(0, Math.sin(t * 0.45 + f.ph)), 0, glance);
    let headPitch = lerp(0.3 - 0.15 * laugh, 0.55, Math.max(glance, pick));
    hFolk.set(i, { x: f.x, z: f.z, rotY: f.rotY, sit: true, headYaw: lerp(headYaw, 0, pick), headPitch, headTilt: 0.12 * laugh * Math.sin(f.ph + 1),
      armL: lerp(0.95, 1.35, pick) + 1.6 * cheer, armR: lerp(0.95, 1.35, pick) + 1.6 * cheer, spreadL: lerp(0.05, -0.2, pick) + 0.3 * cheer, spreadR: lerp(0.05, -0.2, pick) + 0.3 * cheer, visible: true });
    hPh.set(i, { x: f.x, z: f.z, rotY: f.rotY, sit: true, rest: "table", lift: pick, visible: true, on: online > 0.5 });
    _mm.compose(tmp.set(f.x, -0.43, f.z), _q.setFromEuler(new THREE.Euler(0, f.rotY, 0)), _one);
    phoneLights[i].position.set(0, 1.35, 0.35).applyMatrix4(_mm);
    phoneLights[i].intensity = 0.25 * online + 0.9 * pick;
  });
  hFolk.commit(); hPh.commit();
  // Würfel: in der rechten Hand schütteln, werfen, landet auf der 6
  const throwK = smooth((t - (ROLL - 0.15)) / 0.3);
  const handOn = t < GRAB - 0.1;
  hands({ right: handOn ? "dice" : null, left: t >= GRAB ? "phone" : null });
  const shakeY = t < ROLL ? 0.012 * Math.sin(t * 34) * smooth((t - (CUT_H + 0.3)) / 0.3) : 0;
  const rest = smooth((t - (ROLL + 0.5)) / 0.6);
  rightHand.position.set(lerp(0.13, 0.15, throwK), lerp(-0.34, -0.39, throwK) + shakeY - 0.05 * rest, lerp(-0.44, -0.6, throwK) + 0.06 * rest);
  rightHand.rotation.set(0.5 + 0.3 * throwK, 0.2, 1.2 - 0.9 * throwK); rightHand.userData.curl(lerp(0.85, 0.25, throwK));
  if (t < ROLL) {
    rightHand.updateMatrixWorld(true);
    rightHand.localToWorld(_hw.set(0.0, 0.03, -0.07));
    die.position.copy(_hw); die.rotation.set(t * 9, t * 7, 0);
  } else {
    const k = clamp((t - ROLL) / (LAND - ROLL));
    rightHand.updateMatrixWorld(true);
    const start = rightHand.localToWorld(new THREE.Vector3(0.0, 0.03, -0.07));
    const e = 1 - Math.pow(1 - k, 2);
    die.position.set(lerp(start.x, DIE_END.x, e), lerp(start.y, DIE_END.y, e) + Math.sin(k * Math.PI) * 0.12 + (k >= 1 ? 0 : 0), lerp(start.z, DIE_END.z, e));
    const spin = 1 - smooth(k);
    die.rotation.set(9 * spin, 7 * spin, 4 * spin);
  }
  // Dein Handy: liegt auf dem Tisch, vibriert, dann greifst du danach
  const buzz = (t > BUZZ && t < BUZZ + 0.45) || (t > BUZZ + 0.6 && t < BUZZ + 1.05) ? 1 : 0;
  tablePhone.position.set(TP.x + buzz * 0.0025 * Math.sin(t * 190), TABLE_Y + 0.006, TP.z + buzz * 0.002 * Math.sin(t * 150));
  tablePhone.rotation.set(-Math.PI / 2, 0, 0.35 + buzz * 0.02 * Math.sin(t * 170));
  myPhoneLight.position.set(TP.x, TABLE_Y + 0.25, TP.z); myPhoneLight.intensity = 0.35 * online;
  if (t < BUZZ) screen("dark");
  else if (t < FEED) {
    const tm = t < FLOOD0 + 0.6 ? "21:14" : t < GRAB ? "21:15" : "21:16";
    screen("restored", { time: tm, n: t < FLOOD0 ? 0 : notifCount(t) });
  } else if (t < OFFLINE) screen("feed", { p: Math.round(clamp((t - FEED) / 4) * 40) / 40 });
  else screen("offline", { b: blink(t) });
  if (t < GRAB) {
    tablePhone.visible = true; handy.visible = false;
  } else {
    // Tischhandy-Pose in Kamerakoordinaten → Haltung → Loop-Nahaufnahme
    tablePhone.visible = false; handy.visible = true;
    tablePhone.updateMatrixWorld(true);
    _m.copy(camera.matrixWorld).invert().multiply(tablePhone.matrixWorld);
    const TABLE_POSE = { pos: new THREE.Vector3(), quat: new THREE.Quaternion() };
    _m.decompose(TABLE_POSE.pos, TABLE_POSE.quat, tmp);
    const reach = smooth((t - GRAB) / 0.45);
    const lift = smooth((t - (GRAB + 0.45)) / 0.6);
    const close = smooth((t - (FEED + 0.5)) / (DURATION - 0.3 - FEED - 0.5));
    if (lift <= 0) {
      placePhone(TABLE_POSE, TABLE_POSE, 0, reach);
    } else if (close <= 0) {
      placePhone(TABLE_POSE, HOLD, lift);
    } else placePhone(HOLD, CLOSE, close);
  }
  rig.position.set(0, 0, 0);
  canvas.style.filter = "saturate(1.08) contrast(1.04)";
  return smooth(lt / 0.14);
}

// ================================================================= Frame ===
function renderAt(t) {
  t = clamp(t, 0, DURATION);
  currentT = t;
  overlay.update(t);
  titleEl.style.opacity = titleOpacity(t);
  let k;
  if (t < CUT_B) k = renderSubway(t);
  else if (t < CUT_D) k = renderCheckout(t);
  else if (t < CUT_E) k = renderStation(t);
  else if (t < CUT_F) k = renderSpaeti(t);
  else if (t < CUT_G) k = renderAisle(t);
  else if (t < CUT_H) k = renderCourtyard(t);
  else k = renderLiving(t);
  canvas.style.opacity = clamp(k);
  renderer.render(scene, camera);
}

window.addEventListener("hf-seek", (e) => renderAt(e.detail.time));
renderAt(window.__hfThreeTime || 0);
