// Sets für "erde-stopp": Ostseestrand Warnemünde (Leuchtturm, Teepott, Westmole, Strandkörbe)
// und das Klassenzimmer mit dem Tischglobus. Nur für dieses Video, lib/ bleibt unverändert.
// Achsen: −z = Osten (Blickrichtung), −x = Norden (Ostsee), +x = Süden (Promenade).
import { THREE, rng, building, windowTextures } from "./lib/lowpoly.js";
import { mat, basic, box, cyl, canvasTexture, textPanel } from "./lib/props.js";

// ------------------------------------------------------------ Strandkorb ---
const STRIPES = ["#2f6fb0", "#d24a3a", "#e8b23a", "#3a8a6a", "#f2f2ee"];
export function strandkorb(seed = 1) {
  const r = rng(seed);
  const g = new THREE.Group();
  const wicker = mat("#d9c39a"), cloth = mat(r.pick(STRIPES)), white = mat("#f4f1ea");
  box(1.25, 0.55, 0.85, wicker, 0, 0.28, 0, g);                 // Sitzkasten
  box(1.25, 0.95, 0.12, wicker, 0, 1.0, 0.38, g);               // Rückwand
  box(0.1, 0.9, 0.8, wicker, -0.6, 0.95, 0.02, g);              // Seiten
  box(0.1, 0.9, 0.8, wicker, 0.6, 0.95, 0.02, g);
  box(1.3, 0.14, 0.95, cloth, 0, 1.5, 0.05, g);                 // Dach
  box(1.06, 0.7, 0.03, cloth, 0, 1.05, 0.31, g);                // Polster
  for (let i = 0; i < 3; i++) box(1.07, 0.08, 0.031, white, 0, 0.82 + i * 0.2, 0.296, g);
  return g;
}

export function umbrella(seed = 1) {
  const r = rng(seed);
  const g = new THREE.Group();
  cyl(0.025, 0.025, 2.2, 5, mat("#eeeeee"), 0, 1.1, 0, g);
  const top = new THREE.Mesh(new THREE.ConeGeometry(1.15, 0.45, 8), mat(r.pick(STRIPES)));
  top.position.y = 2.25; top.castShadow = true; g.add(top);
  return g;
}

// --------------------------------------------------------- Leuchtturm ---
export function leuchtturm() {
  const g = new THREE.Group();
  const white = mat("#f3f1ea", { roughness: 0.7 }), dark = mat("#2f3b3a"), green = mat("#2f6150", { roughness: 0.5 });
  box(7, 3.2, 7, mat("#d8d3c6"), 0, 1.6, 0, g);                                     // Sockel
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(2.3, 3.1, 28, 8), white);
  shaft.position.y = 3.2 + 14; g.add(shaft);
  for (const [y, r] of [[23.5, 3.2], [31.4, 2.9]]) {
    const ring = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.6, 12), dark); ring.position.y = y; g.add(ring);
  }
  const upper = new THREE.Mesh(new THREE.CylinderGeometry(2.0, 2.3, 7.5, 8), white); upper.position.y = 27.5; g.add(upper);
  const lantern = new THREE.Mesh(new THREE.CylinderGeometry(1.7, 1.7, 2.8, 10), new THREE.MeshStandardMaterial({ color: "#cfe3e8", roughness: 0.1, metalness: 0.5, emissive: "#fff2c0", emissiveIntensity: 0.25 }));
  lantern.position.y = 33.1; g.add(lantern);
  const dome = new THREE.Mesh(new THREE.ConeGeometry(2.0, 2.4, 10), green); dome.position.y = 35.7; g.add(dome);
  const tip = new THREE.Mesh(new THREE.SphereGeometry(0.35, 6, 4), green); tip.position.y = 37.1; g.add(tip);
  g.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return g;
}

// Teepott: runder Bau mit geschwungenem Schalendach
export function teepott() {
  const g = new THREE.Group();
  const base = new THREE.Mesh(new THREE.CylinderGeometry(11, 11, 4, 24), mat("#e9e6de"));
  base.position.y = 2; g.add(base);
  const glass = new THREE.Mesh(new THREE.CylinderGeometry(11.1, 11.1, 2.2, 24), mat("#5d7a86", { roughness: 0.2, metalness: 0.4 }));
  glass.position.y = 2.4; g.add(glass);
  const roofGeo = new THREE.CylinderGeometry(13, 12, 0.6, 36, 1);
  const p = roofGeo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const a = Math.atan2(p.getZ(i), p.getX(i)), rr = Math.hypot(p.getX(i), p.getZ(i));
    p.setY(i, p.getY(i) + (rr / 13) * 2.2 * Math.cos(3 * a));
  }
  roofGeo.computeVertexNormals();
  const roof = new THREE.Mesh(roofGeo, mat("#f6f4ee")); roof.position.y = 5.6; g.add(roof);
  g.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return g;
}

// ---------------------------------------------------- Rettungsturm ---
export function rettungsturm() {
  const g = new THREE.Group();
  const wood = mat("#b98e5c");
  for (const [x, z] of [[-0.9, -0.9], [0.9, -0.9], [-0.9, 0.9], [0.9, 0.9]]) box(0.14, 2.6, 0.14, wood, x, 1.3, z, g);
  box(2.2, 1.6, 2.2, mat("#f3f1ea"), 0, 3.4, 0, g);
  box(2.25, 0.35, 2.25, mat("#c8352d"), 0, 3.6, 0, g);
  box(2.5, 0.12, 2.5, mat("#5a4636"), 0, 4.26, 0, g);
  box(1.6, 0.5, 0.04, mat("#2c3a44", { roughness: 0.2 }), 0, 3.9, -1.11, g);
  cyl(0.03, 0.03, 2.5, 4, mat("#dddddd"), 0.9, 5.5, 0.9, g);
  box(0.8, 0.5, 0.02, mat("#d33a2c"), 1.3, 6.4, 0.9, g).castShadow = false;
  return g;
}

// ----------------------------------------------------- Strand-Set ---
/**
 * Langer Strand von z = +150 bis zur Westmole bei z = moleZ.
 * Gibt { group, moleZ, water } zurück.
 */
export function warnemuende({ moleZ = -1292, seed = 301 } = {}) {
  const r = rng(seed);
  const g = new THREE.Group();
  const LEN = 1750, Z0 = 160;
  // Sand mit Körnung, damit man die Bewegung sieht
  const { tex: sandTex } = canvasTexture(512, 512, (x, w, h) => {
    x.fillStyle = "#e4d0a0"; x.fillRect(0, 0, w, h);
    const rr = rng(77);
    for (let i = 0; i < 1400; i++) {
      const v = rr();
      x.fillStyle = v < 0.5 ? "rgba(150,120,70,0.22)" : v < 0.8 ? "rgba(255,248,225,0.35)" : "rgba(110,90,60,0.25)";
      const s = rr.range(2, 9);
      x.fillRect(rr() * w, rr() * h, s, s * rr.range(0.5, 1.5));
    }
    // Fußspuren / Rippel
    for (let i = 0; i < 26; i++) {
      x.fillStyle = "rgba(140,110,70,0.25)";
      x.beginPath(); x.ellipse(rr() * w, rr() * h, 10, 16, rr() * 3, 0, 6.28); x.fill();
    }
  });
  sandTex.wrapS = sandTex.wrapT = THREE.RepeatWrapping;
  sandTex.repeat.set(8, LEN / 6);
  const sand = new THREE.Mesh(new THREE.PlaneGeometry(48, LEN), mat("#ffffff", { map: sandTex, roughness: 1 }));
  sand.rotation.x = -Math.PI / 2; sand.position.set(10, 0, Z0 - LEN / 2); sand.receiveShadow = true; g.add(sand);
  const wet = new THREE.Mesh(new THREE.PlaneGeometry(5, LEN), mat("#b9a57a", { roughness: 0.6 }));
  wet.rotation.x = -Math.PI / 2; wet.position.set(-12.5, 0.01, Z0 - LEN / 2); wet.receiveShadow = true; g.add(wet);
  const foam = new THREE.Mesh(new THREE.PlaneGeometry(1.2, LEN), basic("#f4f8f8"));
  foam.rotation.x = -Math.PI / 2; foam.position.set(-15.2, 0.02, Z0 - LEN / 2); g.add(foam);
  // Ostsee
  const water = new THREE.Mesh(new THREE.PlaneGeometry(4000, 4000), new THREE.MeshStandardMaterial({ color: "#3d7ea6", roughness: 0.22, metalness: 0.25, flatShading: true }));
  water.rotation.x = -Math.PI / 2; water.position.set(-2015, -0.05, -800); g.add(water);
  // Düne, Promenade
  const dune = new THREE.Mesh(new THREE.BoxGeometry(12, 2.2, LEN), mat("#c9c08a"));
  dune.position.set(40, 0.6, Z0 - LEN / 2); dune.rotation.z = 0.12; dune.receiveShadow = true; g.add(dune);
  const grassMat = mat("#7f9a55");
  const grass = new THREE.InstancedMesh(new THREE.ConeGeometry(0.5, 1.1, 4), grassMat, 700);
  const o = new THREE.Object3D();
  for (let i = 0; i < 700; i++) {
    o.position.set(r.range(35, 46), 1.4, r.range(Z0, moleZ)); o.rotation.set(0, r() * 3, 0); o.scale.setScalar(r.range(0.6, 1.3)); o.updateMatrix();
    grass.setMatrixAt(i, o.matrix);
  }
  g.add(grass);
  const prom = new THREE.Mesh(new THREE.PlaneGeometry(12, LEN), mat("#a9a49b"));
  prom.rotation.x = -Math.PI / 2; prom.position.set(52, 1.9, Z0 - LEN / 2); prom.receiveShadow = true; g.add(prom);
  const town = new THREE.Mesh(new THREE.PlaneGeometry(300, LEN + 400), mat("#8e8a80"));
  town.rotation.x = -Math.PI / 2; town.position.set(200, 1.85, Z0 - LEN / 2); g.add(town);
  // Laternen an der Promenade
  const LAMPS = Math.floor((Z0 - moleZ) / 28);
  const pole = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.08, 0.12, 4.5, 5), mat("#2d3338"), LAMPS);
  const head = new THREE.InstancedMesh(new THREE.SphereGeometry(0.32, 8, 6), mat("#f6f2e2", { emissive: "#fff0c0", emissiveIntensity: 0.2 }), LAMPS);
  for (let i = 0; i < LAMPS; i++) {
    const z = Z0 - 10 - i * 28;
    o.position.set(47, 1.9 + 2.25, z); o.rotation.set(0, 0, 0); o.scale.setScalar(1); o.updateMatrix(); pole.setMatrixAt(i, o.matrix);
    o.position.y = 1.9 + 4.6; o.updateMatrix(); head.setMatrixAt(i, o.matrix);
  }
  pole.castShadow = true; g.add(pole, head);
  // Häuser: weiße Bäderarchitektur, dazu das Hotel-Hochhaus
  const texA = windowTextures(31, "altbau"), texB = windowTextures(32, "plattenbau");
  const COLORS = ["#f4f1ea", "#efe6d2", "#e9eef0", "#f2e3d3", "#dfe6e8", "#f6efe2", "#e7dccb"];
  let z = Z0 - 5;
  while (z > moleZ + 40) {
    const d = r.range(14, 24), w = r.range(14, 22), h = r.range(9, 19);
    const b = building({ w, h, d, color: r.pick(COLORS), tex: r() < 0.75 ? texA : texB, roof: r.pick(["#8a4a3a", "#5b5650", "#6e3d34"]) });
    b.mesh.position.set(62 + w / 2 + r.range(0, 4), 1.9, z - d / 2); g.add(b.mesh);
    z -= d + r.range(2, 8);
  }
  const hotel = building({ w: 24, h: 62, d: 40, color: "#eef0ee", tex: texB, roof: "#4e5258" });
  hotel.mesh.position.set(66 + 12, 1.9, -760); g.add(hotel.mesh);
  // Buhnen: Holzpfähle vom Strand ins Wasser (fest im Boden)
  const posts = [];
  for (let zz = -45; zz > moleZ + 60; zz -= 105) for (let x = -7; x > -46; x -= 1.15) posts.push([x, zz + r.range(-0.15, 0.15), r.range(0.9, 1.4)]);
  const buhne = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.14, 0.16, 1, 6), mat("#5b4532"), posts.length);
  posts.forEach(([x, zz, h], i) => { o.position.set(x, h / 2 - 0.2, zz); o.rotation.set(0, 0, 0); o.scale.set(1, h + 0.2, 1); o.updateMatrix(); buhne.setMatrixAt(i, o.matrix); });
  buhne.castShadow = true; g.add(buhne);
  // Rettungstürme
  for (let zz = -95; zz > moleZ + 80; zz -= 190) {
    const t = rettungsturm(); t.position.set(-8.5, 0, zz); t.rotation.y = Math.PI; g.add(t);
  }
  // Westmole quer über den Strand bis weit in die See, Leuchtturm + Teepott am Fuß
  const stone = mat("#8f9194", { roughness: 0.95 });
  const mole = new THREE.Mesh(new THREE.BoxGeometry(360, 3.6, 9), stone);
  mole.position.set(-160, 1.6, moleZ - 4.5); mole.castShadow = mole.receiveShadow = true; g.add(mole);
  const moleTop = new THREE.Mesh(new THREE.BoxGeometry(360, 0.3, 4), mat("#b9b5ac"));
  moleTop.position.set(-160, 3.5, moleZ - 4.5); g.add(moleTop);
  const blocks = new THREE.InstancedMesh(new THREE.DodecahedronGeometry(1.4, 0), stone, 160);
  for (let i = 0; i < 160; i++) {
    o.position.set(r.range(-335, 10), r.range(0, 1.2), moleZ + r.range(-1.5, 1.5)); o.rotation.set(r() * 3, r() * 3, r() * 3); o.scale.setScalar(r.range(0.6, 1.3)); o.updateMatrix();
    blocks.setMatrixAt(i, o.matrix);
  }
  g.add(blocks);
  const tipTower = new THREE.Group();
  cyl(1.3, 1.6, 10, 8, mat("#f3f1ea"), 0, 5, 0, tipTower);
  cyl(1.35, 1.35, 2.2, 8, mat("#2f8a4a"), 0, 8.2, 0, tipTower);
  cyl(0.9, 0.9, 1.4, 8, mat("#2f3b3a"), 0, 10.6, 0, tipTower);
  tipTower.position.set(-334, 3.4, moleZ - 4.5); g.add(tipTower);
  const lt = leuchtturm(); lt.position.set(27, 1.9, moleZ - 18); g.add(lt);
  const tp = teepott(); tp.position.set(52, 1.9, moleZ - 26); g.add(tp);
  // Gegenüberliegendes Ufer (Hohe Düne)
  const far = new THREE.Mesh(new THREE.PlaneGeometry(2400, 500), mat("#56703f"));
  far.rotation.x = -Math.PI / 2; far.position.set(0, 0.3, moleZ - 330); g.add(far);
  const treeMat = mat("#3e6534");
  const trees = new THREE.InstancedMesh(new THREE.ConeGeometry(5, 16, 6), treeMat, 160);
  for (let i = 0; i < 160; i++) {
    o.position.set(r.range(-900, 600), 8, moleZ - r.range(120, 260)); o.rotation.set(0, 0, 0); o.scale.setScalar(r.range(0.7, 1.3)); o.updateMatrix(); trees.setMatrixAt(i, o.matrix);
  }
  g.add(trees);
  // Fähre/Kreuzfahrtschiff draußen auf der Ostsee
  const ship = new THREE.Group();
  box(140, 14, 22, mat("#f6f6f2"), 0, 7, 0, ship);
  box(110, 10, 20, mat("#eef0f2"), -6, 19, 0, ship);
  box(141, 1.4, 22.5, mat("#2a5b8a"), 0, 1.2, 0, ship);
  box(12, 8, 9, mat("#d23a2c"), -40, 28, 0, ship);
  ship.position.set(-900, 0, -2200); ship.rotation.y = 0.35; g.add(ship);
  for (let i = 0; i < 5; i++) {
    const b = new THREE.Group();
    box(4, 0.8, 1.4, mat("#f2f2ee"), 0, 0.4, 0, b);
    const sail = new THREE.Mesh(new THREE.ConeGeometry(2.2, 8, 3), mat("#fbfbf6"));
    sail.position.y = 4.8; sail.scale.z = 0.15; b.add(sail);
    b.position.set(r.range(-500, -120), 0, r.range(-200, -900)); b.rotation.y = r() * 3; g.add(b);
  }
  return { group: g, moleZ, water };
}

// -------------------------------------------------- Erde als Textur ---
const LAND = [
  [[-168, 66], [-140, 70], [-110, 73], [-85, 70], [-80, 63], [-65, 60], [-55, 52], [-66, 45], [-70, 42], [-76, 35], [-81, 31], [-80, 25], [-83, 29], [-90, 29], [-97, 26], [-97, 21], [-90, 21], [-87, 15], [-83, 9], [-79, 8], [-86, 12], [-92, 15], [-105, 20], [-112, 30], [-117, 33], [-124, 40], [-124, 48], [-133, 57], [-150, 60], [-165, 62]],
  [[-52, 60], [-44, 60], [-20, 70], [-20, 80], [-40, 83], [-60, 80], [-70, 77], [-55, 70]],
  [[-79, 8], [-72, 12], [-62, 10], [-50, 1], [-35, -7], [-40, -22], [-48, -28], [-58, -38], [-65, -42], [-68, -54], [-74, -50], [-73, -38], [-71, -30], [-70, -18], [-76, -13], [-81, -5], [-80, 1]],
  [[-10, 36], [-9, 43], [-2, 44], [-5, 48], [2, 51], [8, 54], [8, 57], [5, 59], [5, 62], [14, 67], [20, 70], [30, 71], [41, 67], [45, 68], [60, 68], [60, 50], [50, 45], [40, 45], [36, 41], [28, 41], [26, 38], [22, 36], [20, 40], [16, 38], [12, 44], [8, 44], [3, 43], [0, 38], [-6, 36]],
  [[-5, 50], [1, 51], [2, 53], [-2, 56], [-2, 58], [-5, 59], [-6, 56], [-5, 54], [-3, 54], [-5, 52]],
  [[-10, 52], [-6, 52], [-6, 55], [-8, 55], [-10, 54]],
  [[-17, 21], [-16, 28], [-10, 30], [-6, 36], [10, 37], [11, 33], [20, 31], [32, 31], [34, 28], [43, 12], [51, 12], [50, 2], [40, -5], [40, -15], [35, -24], [32, -29], [27, -34], [20, -35], [17, -29], [12, -18], [13, -8], [9, -1], [9, 4], [4, 6], [-8, 4], [-13, 8], [-17, 14]],
  [[26, 41], [36, 36], [35, 32], [43, 13], [52, 16], [58, 22], [56, 26], [50, 30], [57, 25], [62, 25], [67, 24], [72, 21], [77, 8], [80, 15], [87, 22], [92, 21], [98, 16], [100, 13], [103, 1], [105, 10], [109, 12], [108, 21], [117, 24], [122, 30], [121, 40], [125, 40], [129, 35], [130, 43], [141, 48], [140, 54], [135, 55], [156, 61], [163, 60], [180, 66], [180, 72], [160, 70], [140, 73], [110, 77], [80, 73], [68, 70], [60, 68], [60, 50], [50, 45], [40, 45], [36, 41]],
  [[114, -22], [114, -34], [118, -35], [124, -34], [131, -31], [138, -35], [146, -39], [150, -37], [153, -30], [153, -25], [145, -15], [142, -11], [136, -12], [130, -12], [123, -17]],
  [[130, 31], [135, 34], [140, 36], [142, 40], [141, 45], [139, 42], [136, 36], [131, 33]],
  [[95, 5], [105, -6], [115, -8], [120, -9], [118, -3], [110, -1], [104, 2], [98, 4]],
  [[44, -25], [48, -24], [50, -16], [49, -12], [44, -16]],
  [[-180, -70], [180, -70], [180, -90], [-180, -90]],
];
const BALTIC = [[10, 54], [14, 54], [20, 55], [21, 57], [24, 59], [30, 60], [22, 60], [22, 65], [25, 66], [18, 63], [17, 60], [16, 56], [12, 56]];

export function earthTexture() {
  const W = 2048, H = 1024;
  const { tex } = canvasTexture(W, H, (x) => {
    const P = ([lon, lat]) => [((lon + 180) / 360) * W, ((90 - lat) / 180) * H];
    x.fillStyle = "#2c6aa0"; x.fillRect(0, 0, W, H);
    const poly = (pts, fill) => { x.fillStyle = fill; x.beginPath(); pts.forEach((p, i) => { const [a, b] = P(p); i ? x.lineTo(a, b) : x.moveTo(a, b); }); x.closePath(); x.fill(); };
    LAND.forEach((pts, i) => poly(pts, i === LAND.length - 1 ? "#eef2f4" : i === 1 ? "#e6edf0" : "#79a85a"));
    poly([[-15, 30], [30, 30], [32, 22], [20, 15], [-15, 16]], "#d6c088");   // Sahara
    poly([[40, 28], [55, 26], [52, 17], [44, 15]], "#d6c088");
    poly([[125, -20], [140, -22], [140, -30], [125, -30]], "#d2b37a");
    poly(BALTIC, "#2c6aa0");
    // Gradnetz alle 15°
    x.strokeStyle = "rgba(255,255,255,0.55)"; x.lineWidth = 2;
    for (let lon = -180; lon <= 180; lon += 15) { const [a] = P([lon, 0]); x.beginPath(); x.moveTo(a, 0); x.lineTo(a, H); x.stroke(); }
    for (let lat = -75; lat <= 75; lat += 15) { const [, b] = P([0, lat]); x.beginPath(); x.moveTo(0, b); x.lineTo(W, b); x.stroke(); }
    x.strokeStyle = "rgba(255,230,140,0.8)"; x.lineWidth = 3;
    x.beginPath(); x.moveTo(0, H / 2); x.lineTo(W, H / 2); x.stroke();
    // Warnemünde
    const [wx, wy] = P([12.08, 54.18]);
    x.fillStyle = "#e0302a"; x.beginPath(); x.arc(wx, wy, 6, 0, 6.28); x.fill();
  });
  return tex;
}

// Gradnetz als feine Linien (für den Himmel und den Übergang ins All)
export function gridLines(radius = 1500, color = "#5d7fa8") {
  const pts = [];
  const push = (a, b) => pts.push(a.x, a.y, a.z, b.x, b.y, b.z);
  const v = (lon, lat) => new THREE.Vector3(Math.cos(lat) * Math.cos(lon), Math.sin(lat), -Math.cos(lat) * Math.sin(lon)).multiplyScalar(radius);
  const D = Math.PI / 180;
  for (let lon = 0; lon < 360; lon += 15) for (let lat = -90; lat < 90; lat += 3) push(v(lon * D, lat * D), v(lon * D, (lat + 3) * D));
  for (let lat = -75; lat <= 75; lat += 15) for (let lon = 0; lon < 360; lon += 3) push(v(lon * D, lat * D), v((lon + 3) * D, lat * D));
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
  const m = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0, fog: false, depthWrite: false });
  return new THREE.LineSegments(geo, m);
}

// ------------------------------------------------- Klassenzimmer ---
/** Raum mit Pult, Tischglobus und Schülern. Gibt { group, globe, spin, globeCenter, R } zurück. */
export function classroom({ seed = 401 } = {}) {
  const r = rng(seed);
  const g = new THREE.Group();
  const plane = (w, h, color, x, y, z, rx = 0, ry = 0, extra = {}) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat(color, { roughness: 0.9, ...extra }));
    m.position.set(x, y, z); m.rotation.set(rx, ry, 0); m.receiveShadow = true; g.add(m); return m;
  };
  plane(9, 10, "#9c7650", 0, 0, -2.5, -Math.PI / 2);                // Parkett
  plane(9, 3.4, "#e8e1cf", 0, 1.7, -6.2);                            // Rückwand
  plane(10, 3.4, "#efe8d6", -4.4, 1.7, -1.5, 0, Math.PI / 2);        // Fensterwand
  plane(10, 3.4, "#e5dcc6", 4.4, 1.7, -1.5, 0, -Math.PI / 2);        // Wand rechts
  plane(9, 10, "#f4f1ea", 0, 3.4, -2.5, Math.PI / 2);                // Decke
  for (const z of [-0.5, -2.7, -4.9]) {                              // Fenster (hell)
    plane(1.7, 1.6, "#fff6dc", -4.38, 1.85, z, 0, Math.PI / 2, { emissive: "#fff3d6", emissiveIntensity: 0.9 });
    plane(1.8, 0.08, "#f8f8f4", -4.37, 1.05, z, 0, Math.PI / 2);
  }
  // Weltkarte und Klassenplakat an der Rückwand
  const map = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1.2), new THREE.MeshStandardMaterial({ map: earthTexture(), roughness: 0.9 }));
  map.position.set(-1.2, 1.9, -6.18); g.add(map);
  const sign = textPanel(1.4, 0.5, 200, "#2f5a46", [{ text: "Klasse 7b", size: 46, color: "#f4f1ea", y: 0.5 }]);
  sign.position.set(1.6, 2.2, -6.18); g.add(sign);
  for (let i = 0; i < 4; i++) box(0.9, 1.1, 0.45, mat(["#7aa0b8", "#d9a35b", "#a6b98a", "#c97b6a"][i]), 1.0 + i * 0.95, 0.55, -5.9, g);
  // Lehrerpult
  const wood = mat("#b88a5a", { roughness: 0.6 });
  box(1.7, 0.06, 0.8, wood, 0, 0.78, 0.25, g);
  box(1.7, 0.72, 0.04, mat("#9b7148"), 0, 0.39, -0.13, g);
  box(0.04, 0.72, 0.8, mat("#9b7148"), -0.83, 0.39, 0.25, g);
  box(0.04, 0.72, 0.8, mat("#9b7148"), 0.83, 0.39, 0.25, g);
  // Bücher, Kreide
  box(0.24, 0.05, 0.32, mat("#2f5a8a"), -0.55, 0.835, 0.35, g);
  box(0.22, 0.04, 0.3, mat("#c8432f"), -0.54, 0.88, 0.34, g).rotation.y = 0.15;
  box(0.08, 0.012, 0.012, mat("#f6f4ee"), 0.5, 0.817, 0.45, g);
  // Schülertische
  const desks = [];
  for (const z of [-2.3, -3.6, -4.9]) for (const x of [-2.5, -0.85, 0.85, 2.5]) {
    box(1.25, 0.05, 0.6, mat("#c9a978"), x, 0.72, z, g);
    box(1.2, 0.68, 0.04, mat("#7d8a8f"), x, 0.36, z - 0.28, g);
    desks.push([x, z]);
  }
  // Tischglobus
  const globeCenter = new THREE.Vector3(0.02, 1.08, 0.22);
  const R = 0.15;
  const stand = new THREE.Group(); stand.position.copy(globeCenter); g.add(stand);
  const brass = mat("#c9a14a", { metalness: 0.6, roughness: 0.35 });
  cyl(0.1, 0.11, 0.03, 20, mat("#5a3b26", { roughness: 0.5 }), 0, 0.81 - globeCenter.y + 0.015, 0, stand);
  cyl(0.012, 0.016, 0.1, 8, brass, 0, 0.81 - globeCenter.y + 0.08, 0, stand);
  const tilt = new THREE.Group(); tilt.rotation.x = 23.44 * Math.PI / 180; stand.add(tilt);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(R + 0.018, 0.006, 6, 48, Math.PI), brass);
  ring.rotation.z = -Math.PI / 2; ring.rotation.y = Math.PI / 2; tilt.add(ring);
  for (const s of [1, -1]) { const ax = cyl(0.004, 0.004, 0.03, 6, brass, 0, s * (R + 0.008), 0, tilt); }
  const spin = new THREE.Group(); tilt.add(spin);
  const earth = new THREE.Mesh(new THREE.SphereGeometry(R, 64, 40), new THREE.MeshStandardMaterial({ map: earthTexture(), roughness: 0.45, metalness: 0.05 }));
  earth.castShadow = true; spin.add(earth);
  return { group: g, desks, globeCenter, R, spin, tilt, earth, stand };
}
