// Sets nur für "regen-1000": Berliner Kreuzung mit Altbauten (Stuck, Balkone, Erker, Mansarddächer),
// Plattenbau, Späti, Litfaßsäule, Ampeln mit Ampelmännchen, Tramgleise, gelbe Tram, gelber Doppeldecker,
// elfenbeinfarbene Taxis, Fahrradweg, Linden, Hochhaus-Kulisse mit Fernsehturm im Dunst.
// Dazu Wasser, Regen (instanzierte Streifen), Ringe, Treibgut, Boote, Badeente, Bewuchs.
// Alles Low-Poly, flat shading, deterministisch (nur rng(seed) und t). lib/ bleibt unverändert.
//
// Weltachsen: Allee entlang z (−z = in die Tiefe), Querstraße entlang x bei z = 0.
// Fahrbahn x ∈ [−10, 10], Gehwege bis |x| = 16, Häuser ab |x| = 16. Querstraße z ∈ [−7, 7], Häuser ab |z| = 12.
import { THREE, rng, clamp, smooth, lerp, building, windowTextures, car, fernsehturm, streetLamp, glowTexture } from "./lib/lowpoly.js";
import { mat, basic, box, cyl, canvasTexture, textPanel } from "./lib/props.js";

export const ROAD = 10, WALK = 16, CROSS = 7, BLOCK = 12;
export const LANE_R = 4.9, LANE_L = -4.9, TRACK_R = 1.6, TRACK_L = -1.6, PARK = 9.1;

const o = new THREE.Object3D();
const M = new THREE.Matrix4(), M2 = new THREE.Matrix4(), Q = new THREE.Quaternion(), V = new THREE.Vector3(), S = new THREE.Vector3();
const UP = new THREE.Vector3(0, 1, 0);

// InstancedMesh aus einer Liste { m: Matrix4, c?: Farbe }
function instList(geo, material, list, shadow = true) {
  const im = new THREE.InstancedMesh(geo, material, Math.max(1, list.length));
  const col = new THREE.Color();
  list.forEach((e, i) => { im.setMatrixAt(i, e.m); if (e.c) im.setColorAt(i, col.set(e.c)); });
  im.count = list.length;
  if (im.instanceColor) im.instanceColor.needsUpdate = true;
  im.castShadow = shadow; im.receiveShadow = true;
  return im;
}
const boxMat = (x, y, z, sx, sy, sz, ry = 0) => {
  o.position.set(x, y, z); o.rotation.set(0, ry, 0); o.scale.set(sx, sy, sz); o.updateMatrix();
  return o.matrix.clone();
};

// ================================================================ Straße ===
export function street({ seed = 1201 } = {}) {
  const r = rng(seed);
  const g = new THREE.Group();
  const asphalt = mat("#4c4d51", { roughness: 0.6 });
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(2600, 2600), asphalt);
  ground.rotation.x = -Math.PI / 2; ground.position.set(0, -0.01, -600); ground.receiveShadow = true; g.add(ground);
  // Tramtrasse (heller, Pflaster) mittig
  const trackBed = mat("#5d5b57", { roughness: 0.7 });
  const bed = new THREE.Mesh(new THREE.PlaneGeometry(6.4, 1400), trackBed);
  bed.rotation.x = -Math.PI / 2; bed.position.set(0, 0.005, -500); bed.receiveShadow = true; g.add(bed);
  // Gehwege: je Quadrant ein Block (Oberkante 0,15 m), die Häuser stehen darauf
  const paving = mat("#9a968f", { roughness: 0.8 });
  const walks = [];
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const w = 600, d = sz > 0 ? 260 : 1200;
    const b = box(w, 0.15, d, paving, sx * (ROAD + w / 2), 0.075, sz * (CROSS + d / 2), g);
    b.castShadow = false; walks.push(b);
  }
  // Bordsteinkanten
  const curb = [];
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const d = sz > 0 ? 260 : 1200;
    curb.push({ m: boxMat(sx * (ROAD + 0.12), 0.08, sz * (CROSS + d / 2), 0.25, 0.17, d), c: "#b9b5ad" });
    curb.push({ m: boxMat(sx * (ROAD + 300), 0.08, sz * (CROSS + 0.12), 600, 0.17, 0.25), c: "#b9b5ad" });
  }
  // Fahrradwege (rot) und Markierungen
  const marks = [];
  const white = "#e6e4de";
  for (const sx of [-1, 1]) for (const [z0, z1] of [[CROSS + 5, 260], [-1200, -CROSS - 5]]) {
    const len = z1 - z0, zc = (z0 + z1) / 2;
    marks.push({ m: boxMat(sx * 7.4, 0.012, zc, 1.6, 0.01, len), c: "#8a5d55" });
    marks.push({ m: boxMat(sx * 6.55, 0.016, zc, 0.12, 0.01, len), c: white });
    marks.push({ m: boxMat(sx * 3.3, 0.016, zc, 0.15, 0.01, len), c: white });
    for (let z = z0 + 1; z < z1; z += 9) marks.push({ m: boxMat(sx * 7.4, 0.02, z, 0.5, 0.01, 0.5), c: "#e8e2da" }); // Fahrrad-Symbole (abstrakt)
  }
  // Querstraße: Mittellinie gestrichelt
  for (const sx of [-1, 1]) for (let x = ROAD + 8; x < 500; x += 6) marks.push({ m: boxMat(sx * x, 0.016, 0, 3, 0.01, 0.15), c: white });
  // Zebrastreifen über die Allee und über die Querstraße
  for (const sz of [-1, 1]) {
    for (let x = -ROAD + 0.7; x < ROAD - 0.3; x += 1.1) marks.push({ m: boxMat(x, 0.02, sz * 10.3, 0.55, 0.01, 3.4), c: white });
    marks.push({ m: boxMat(sz * 5, 0.02, sz * 13.0, 9, 0.01, 0.4), c: white }); // Haltelinie
  }
  for (const sx of [-1, 1]) for (let z = -CROSS + 0.6; z < CROSS - 0.3; z += 1.1) marks.push({ m: boxMat(sx * 14.0, 0.17, z, 3.4, 0.01, 0.55), c: white });
  const markMesh = instList(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial({ roughness: 0.7, flatShading: true }), [...curb, ...marks], false);
  g.add(markMesh);
  // Schienen
  const rails = [];
  for (const tx of [TRACK_L, TRACK_R]) for (const off of [-0.72, 0.72]) rails.push({ m: boxMat(tx + off, 0.03, -500, 0.09, 0.05, 1400), c: "#8d8f93" });
  g.add(instList(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial({ roughness: 0.35, metalness: 0.6 }), rails, false));
  // Oberleitung der Tram: Masten + Draht
  const wire = [];
  for (let z = 150; z > -700; z -= 30) {
    if (Math.abs(z) < 14) continue;
    wire.push({ m: boxMat(0, 3.9, z, 0.22, 7.8, 0.22), c: "#3a3d42" });
    wire.push({ m: boxMat(0, 7.2, z, 5.2, 0.12, 0.12), c: "#3a3d42" });
  }
  for (const tx of [TRACK_L, TRACK_R]) wire.push({ m: boxMat(tx, 6.9, -275, 0.04, 0.04, 850), c: "#25272a" });
  const wireMesh = instList(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial({ roughness: 0.6, flatShading: true }), wire, true);
  g.add(wireMesh);
  return { group: g, materials: { asphalt, trackBed, paving }, markMesh, wireMesh };
}

// ======================================================= Berliner Häuser ===
const FACADES = ["#c9a46a", "#a9a49c", "#c49a8f", "#d8c8a6", "#b7aa95", "#c7b07e", "#9e9a94", "#cfa79a", "#bfb3a0"];
const ROOFS = ["#4d4a4a", "#5a5352", "#7a4a3a", "#55504d"];

function mansard(front, depth, h, color) {
  const s = new THREE.Shape();
  const top = depth - 5.2;
  s.moveTo(-depth / 2, 0); s.lineTo(depth / 2, 0); s.lineTo(top / 2, h); s.lineTo(-top / 2, h); s.lineTo(-depth / 2, 0);
  const geo = new THREE.ExtrudeGeometry(s, { depth: front, bevelEnabled: false });
  geo.rotateY(Math.PI / 2); // Profil in z, Extrusion entlang x
  geo.translate(-front / 2, 0, -depth / 2);
  const m = new THREE.Mesh(geo, mat(color, { roughness: 0.9 }));
  m.castShadow = m.receiveShadow = true;
  return m;
}

function shopTextures(seed, spaeti = false) {
  const r = rng(seed);
  const draw = (lit) => canvasTexture(512, 128, (c, w, h) => {
    c.fillStyle = lit ? "#000" : "#3d3a37"; c.fillRect(0, 0, w, h);
    const n = 4;
    for (let i = 0; i < n; i++) {
      const x = i * (w / n) + 10, ww = w / n - 20;
      if (!lit) { c.fillStyle = "#24282d"; c.fillRect(x, 26, ww, h - 34); c.fillStyle = "#8c8476"; c.fillRect(x - 4, 14, ww + 8, 10); }
      else {
        const on = spaeti || r() < 0.6;
        c.fillStyle = on ? `rgb(255,${200 + Math.floor(r() * 40)},${130 + Math.floor(r() * 60)})` : "#000";
        c.fillRect(x, 26, ww, h - 34);
      }
    }
  }).tex;
  return { map: draw(false), emissive: draw(true) };
}

function ampelmaennchenTexture(green) {
  return canvasTexture(64, 96, (c, w, h) => {
    c.fillStyle = "#121212"; c.fillRect(0, 0, w, h);
    c.fillStyle = green ? "#48ff7a" : "#ff3b2a";
    if (green) { // gehendes Männchen mit Hut
      c.fillRect(26, 14, 14, 6); c.fillRect(29, 20, 9, 9); c.fillRect(25, 30, 16, 26);
      c.fillRect(16, 32, 10, 5); c.fillRect(40, 34, 9, 5);
      c.beginPath(); c.moveTo(26, 56); c.lineTo(14, 84); c.lineTo(22, 84); c.lineTo(32, 60); c.fill();
      c.beginPath(); c.moveTo(34, 56); c.lineTo(48, 84); c.lineTo(40, 84); c.lineTo(30, 60); c.fill();
    } else { // stehendes Männchen, Arme ausgebreitet
      c.fillRect(25, 12, 16, 6); c.fillRect(28, 18, 10, 9); c.fillRect(24, 28, 18, 30);
      c.fillRect(8, 30, 16, 7); c.fillRect(42, 30, 16, 7);
      c.fillRect(25, 58, 7, 28); c.fillRect(34, 58, 7, 28);
    }
  }).tex;
}

/**
 * Häuser an beiden Straßen. Jede Fassade zeigt lokal nach +z, Front entlang lokal x.
 * Rückgabe: houses [{ mats: [...], x, z, h, top }], balconies [{ x, y, z, ry }], roofSpots [[x, y, z]]
 */
export function berlinHouses({ seed = 1301 } = {}) {
  const r = rng(seed);
  const g = new THREE.Group();
  const texA = [windowTextures(seed + 1, "altbau"), windowTextures(seed + 2, "altbau"), windowTextures(seed + 3, "altbau")];
  const texP = windowTextures(seed + 4, "plattenbau");
  const parts = [];
  const houses = [], balconies = [], roofSpots = [];
  let spaetiDone = false;
  let spaeti = null;

  function house({ x, z, ry, front, depth = 22, kind = "altbau", h, color, shop = true, spaetiHere = false }) {
    const H = new THREE.Matrix4().compose(V.set(x, 0.15, z), Q.setFromAxisAngle(UP, ry), S.set(1, 1, 1));
    const add = (lx, ly, lz, sx, sy, sz, c) => parts.push({ m: new THREE.Matrix4().multiplyMatrices(H, boxMat(lx, ly, lz, sx, sy, sz)), c });
    const grp = new THREE.Group(); grp.position.set(x, 0.15, z); grp.rotation.y = ry; g.add(grp);
    const mats = [];
    if (kind === "platte") {
      const b = building({ w: front, h, d: depth, color: color || "#bcb6a8", tex: texP, roof: "#6b6862" });
      b.mesh.position.set(0, 0, -depth / 2); grp.add(b.mesh); mats.push(b.material);
      for (let k = -2; k <= 2; k++) add(k * front / 5.2, h / 2, 0.55, 2.6, h - 3, 1.1, "#a8a296"); // Loggia-Bänder
      for (let f = 1; f < h / 2.8; f++) add(0, f * 2.8, 0.06, front, 0.1, 0.12, "#8f8a80"); // Plattenfugen
      add(0, h + 0.4, -depth / 2, front + 0.2, 0.8, depth + 0.2, "#77736b");
      for (let i = 0; i < 4; i++) roofSpots.push(new THREE.Vector3(r.range(-front / 2 + 3, front / 2 - 3), h + 0.8, -r.range(3, depth - 3)).applyMatrix4(H));
      houses.push({ mats, x, z, h, top: h + 0.8, kind });
      return;
    }
    const tex = r.pick(texA);
    const b = building({ w: front, h, d: depth, color, tex, roof: "#5b5650" });
    b.mesh.position.set(0, 0, -depth / 2); grp.add(b.mesh); mats.push(b.material);
    const stone = new THREE.Color(color).lerp(new THREE.Color("#efe8da"), 0.35).getStyle();
    // Stuck: Gesimse, Stockwerksbänder, Fensterverdachungen (angedeutet)
    add(0, h - 0.35, 0.3, front + 0.4, 0.7, 0.6, stone);
    add(0, h - 1.0, 0.18, front + 0.1, 0.25, 0.36, stone);
    add(0, 4.45, 0.22, front, 0.4, 0.44, stone);
    for (let f = 2; f * 3.4 < h - 2; f++) add(0, f * 3.4 + 0.05, 0.1, front, 0.16, 0.2, stone);
    const bays = Math.floor(front / 3.6);
    for (let f = 1; f * 3.4 + 3.2 < h - 1; f++) for (let k = 0; k < bays; k++) add(-front / 2 + 1.8 + k * 3.6, f * 3.4 + 3.05, 0.1, 1.5, 0.14, 0.2, stone);
    // Ladenzone im Erdgeschoss
    if (shop) {
      const st = shopTextures(seed + houses.length * 7, spaetiHere);
      const sm = new THREE.MeshStandardMaterial({ map: st.map, emissiveMap: st.emissive, emissive: new THREE.Color("#ffd49a"), emissiveIntensity: 0, roughness: 0.6, flatShading: true });
      const shopBand = new THREE.Mesh(new THREE.BoxGeometry(front - 0.4, 3.6, 0.3), sm);
      shopBand.position.set(0, 1.95, 0.15); grp.add(shopBand); mats.push(sm);
    }
    // Erker über 3–4 Geschosse
    if (front > 14 && r() < 0.75) {
      const ew = 3.8, eh = Math.min(h - 6.8, 4 * 3.4);
      const ex = r.pick([-1, 1]) * r.range(0, front / 2 - 4);
      const e = building({ w: ew, h: eh, d: 1.3, color, tex });
      e.mesh.position.set(ex, 3.4 * 2 - 0.2, 0.65); grp.add(e.mesh); mats.push(e.material);
      add(ex, 3.4 * 2 - 0.3 + eh + 0.15, 0.7, ew + 0.3, 0.3, 1.6, stone);
      add(ex, 3.4 * 2 - 0.35, 0.7, ew + 0.1, 0.3, 1.5, stone);
    }
    // Balkone mit Gitter
    for (let f = 2; f <= Math.floor((h - 2) / 3.4) - 1; f++) for (let k = 0; k < bays; k++) {
      if (r() > 0.33) continue;
      const bx = -front / 2 + 1.8 + k * 3.6, by = f * 3.4 - 0.1;
      add(bx, by, 0.55, 2.7, 0.22, 1.1, stone);
      add(bx, by + 0.55, 1.08, 2.7, 0.9, 0.06, "#2a2b2d");
      add(bx - 1.32, by + 0.55, 0.55, 0.06, 0.9, 1.1, "#2a2b2d");
      add(bx + 1.32, by + 0.55, 0.55, 0.06, 0.9, 1.1, "#2a2b2d");
      const p = new THREE.Vector3(bx, by + 0.1, 0.55).applyMatrix4(H);
      balconies.push({ x: p.x, y: p.y, z: p.z, ry });
    }
    // Mansarddach mit Gauben
    const roofC = r.pick(ROOFS);
    const roof = mansard(front, depth, 4.4, roofC);
    roof.position.set(0, h, 0); grp.add(roof);
    for (let k = 0; k < bays; k += 2) add(-front / 2 + 1.8 + k * 3.6, h + 1.8, -1.6, 1.4, 1.6, 1.4, stone);
    for (let k = 0; k < 2; k++) add(r.range(-front / 2 + 2, front / 2 - 2), h + 5.2, -depth / 2, 0.8, 1.8, 0.8, "#7d6a5e"); // Schornsteine
    for (let i = 0; i < 3; i++) roofSpots.push(new THREE.Vector3(r.range(-front / 2 + 2, front / 2 - 2), h + 4.4, -r.range(5, depth - 5)).applyMatrix4(H));
    const entry = { mats, x, z, h, top: h + 4.4, kind };
    houses.push(entry);
    if (spaetiHere) spaeti = { H: H.clone(), front, grp };
  }

  // Reihen entlang der Allee
  const row = (sx, sz, from, to) => {
    let z = from;
    let n = 0;
    while (sz > 0 ? z < to : z > to) {
      const front = r.range(15, 22);
      const isPlatte = (sx < 0 && sz < 0 && n === 3) || (sx > 0 && sz < 0 && n === 6);
      const f = isPlatte ? 34 : front;
      const zc = z + sz * f / 2;
      const ry = sx < 0 ? Math.PI / 2 : -Math.PI / 2;
      house({
        x: sx * WALK, z: zc, ry, front: f, kind: isPlatte ? "platte" : "altbau",
        h: isPlatte ? 30.8 : n === 0 ? 22.1 : r.pick([18.7, 19.5, 20.4, 21.2]), color: n === 0 && sz < 0 && sx < 0 ? "#c49a8f" : r.pick(FACADES),
        spaetiHere: sx < 0 && sz < 0 && n === 0,
      });
      z += sz * (f + 0.05);
      n++;
    }
  };
  row(-1, 1, BLOCK, 180);
  row(-1, -1, -BLOCK, -640);
  row(1, 1, BLOCK, 180);
  row(1, -1, -BLOCK, -640);
  // Reihen entlang der Querstraße
  const crossRow = (sx, sz) => {
    let x = WALK + 22;
    while (x < 420) {
      const front = r.range(15, 22);
      house({ x: sx * (x + front / 2), z: sz * BLOCK, ry: sz > 0 ? Math.PI : 0, front, h: r.pick([18.7, 19.5, 20.4, 21.2]), color: r.pick(FACADES), shop: x < 120 });
      x += front + 0.05;
    }
  };
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) crossRow(sx, sz);

  const partsMesh = instList(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial({ roughness: 0.85, flatShading: true }), parts, true);
  g.add(partsMesh);

  // Späti: Markise, Schild, Getränkekisten, Aufsteller (Ecke vorne links)
  let spaetiParts = null;
  if (spaeti) {
    const sg = new THREE.Group();
    const awning = canvasTexture(256, 64, (c, w, h) => {
      for (let i = 0; i < 16; i++) { c.fillStyle = i % 2 ? "#e9e3d6" : "#2e7a4f"; c.fillRect(i * w / 16, 0, w / 16, h); }
    }).tex;
    const aw = new THREE.Mesh(new THREE.BoxGeometry(9, 0.12, 2.2), new THREE.MeshStandardMaterial({ map: awning, roughness: 0.8 }));
    aw.position.set(-spaeti.front / 2 + 5.5, 3.55, 1.25); aw.rotation.x = 0.32; aw.castShadow = true; sg.add(aw);
    const sign = textPanel(6, 0.9, 64, "#1d4d33", [{ text: "SPÄTI", size: 44, color: "#ffe9a8", y: 0.55, weight: 700 }]);
    sign.position.set(-spaeti.front / 2 + 5.5, 4.25, 0.36); sg.add(sign);
    const crates = [];
    for (let i = 0; i < 6; i++) crates.push({ m: boxMat(-spaeti.front / 2 + 8.5 + (i % 3) * 0.5, 0.2 + Math.floor(i / 3) * 0.32, 1.0 + (i % 2) * 0.1, 0.42, 0.3, 0.32), c: i % 2 ? "#c9302c" : "#2b5aa0" });
    sg.add(instList(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial({ roughness: 0.8 }), crates));
    box(0.8, 1.0, 0.06, mat("#2a2a2a"), -spaeti.front / 2 + 3.2, 0.5, 1.6, sg).rotation.x = -0.25; // Aufsteller
    spaeti.grp.add(sg);
    spaetiParts = { sign };
  }
  return { group: g, houses, balconies, roofSpots, partsMesh, spaeti: spaetiParts };
}

// ======================================================= Hochhaus-Kulisse ===
export function skyline({ seed = 1401 } = {}) {
  const r = rng(seed);
  const g = new THREE.Group();
  const tex = windowTextures(seed, "plattenbau");
  const towers = [];
  // nahe Hochhäuser hinter dem Block links (füllen den oberen Bildteil wie in der Referenz), dahinter weitere im Dunst
  const spots = [[-62, -70, 78], [-95, -150, 96], [-60, -230, 70], [-130, -60, 64], [-150, -260, 110], [55, -170, 72], [70, -320, 90],
    [-60, -520], [40, -560], [-150, -620], [120, -640], [-20, -700], [-240, -720], [200, -760], [-110, -820], [60, -860],
    [-300, -560], [-380, -680], [300, -620], [-200, -940], [150, -980], [0, -1050], [-90, -420], [90, -470]];
  for (const [x, z, hh] of spots) {
    const h = hh ?? r.range(55, 135), w = r.range(20, 34), d = r.range(18, 30);
    const b = building({ w, h, d, color: r.pick(["#c8c6c0", "#b5b8bb", "#d6d0c4", "#a9adb3"]), tex, roof: "#6e7074" });
    b.mesh.position.set(x + r.range(-10, 10), 0, z); g.add(b.mesh); towers.push(b);
  }
  const tv = fernsehturm();
  tv.group.position.set(-170, 0, -1500); tv.group.scale.setScalar(0.95); g.add(tv.group);
  return { group: g, towers, tv };
}

// ============================================================ Straßenmöbel ===
export function furniture({ seed = 1501 } = {}) {
  const r = rng(seed);
  const g = new THREE.Group();
  // Linden auf beiden Gehwegen
  const trees = [];
  for (const sx of [-1, 1]) for (let z = 150; z > -600; z -= r.range(10, 13)) {
    if (Math.abs(z) < 17) continue;
    trees.push({ x: sx * 12.4 + r.range(-0.2, 0.2), z, s: r.range(0.85, 1.15), c: r.pick(["#4f7a3a", "#5a8442", "#46703a", "#62894a"]) });
  }
  const trunk = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.16, 0.24, 1, 6), mat("#4a3b30"), trees.length);
  const crown = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 0), new THREE.MeshStandardMaterial({ roughness: 0.9, flatShading: true }), trees.length);
  const col = new THREE.Color();
  trees.forEach((tr, i) => {
    o.position.set(tr.x, 2.4 * tr.s, tr.z); o.rotation.set(0, 0, 0); o.scale.set(1, 4.8 * tr.s, 1); o.updateMatrix(); trunk.setMatrixAt(i, o.matrix);
    crown.setColorAt(i, col.set(tr.c));
  });
  trunk.castShadow = crown.castShadow = true; trunk.frustumCulled = crown.frustumCulled = false;
  g.add(trunk, crown);
  const crownBase = trees.map((tr) => new THREE.Color(tr.c));
  function setCrowns(k, tint) {
    trees.forEach((tr, i) => {
      const s = tr.s * k;
      o.position.set(tr.x, (5.6 + 0.8 * k) * tr.s, tr.z); o.rotation.set(0, i, 0); o.scale.set(2.9 * s + 0.001, 2.6 * s + 0.001, 2.9 * s + 0.001); o.updateMatrix(); crown.setMatrixAt(i, o.matrix);
      crown.setColorAt(i, col.copy(crownBase[i]).lerp(tint.c, tint.k));
    });
    crown.instanceMatrix.needsUpdate = true; crown.instanceColor.needsUpdate = true;
    crown.visible = k > 0.002;
  }
  setCrowns(1, { c: new THREE.Color("#000"), k: 0 });

  // Laternen
  const glow = glowTexture();
  const lamps = [];
  for (const sx of [-1, 1]) for (let z = 140; z > -500; z -= 28) {
    if (Math.abs(z) < 16) continue;
    const l = streetLamp(glow); l.group.position.set(sx * 10.5, 0.15, z + (sx > 0 ? 14 : 0)); l.group.scale.setScalar(1.15); g.add(l.group); lamps.push(l);
  }
  // Ampeln an allen vier Ecken (Auto- und Fußgängersignal mit Ampelmännchen)
  const red = ampelmaennchenTexture(false), green = ampelmaennchenTexture(true);
  const signals = [];
  const lampCols = ["#ff3826", "#ffb020", "#36e070"];
  const pole = mat("#2a2d31");
  for (const [sx, sz] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) {
    const a = new THREE.Group();
    a.position.set(sx * 10.6, 0.15, sz * 13.2);
    cyl(0.08, 0.1, 4.4, 6, pole, 0, 2.2, 0, a);
    const facing = sz > 0 ? 0 : Math.PI; // Signal zeigt dem Verkehr entgegen
    const head = new THREE.Group(); head.rotation.y = facing; a.add(head);
    box(0.42, 1.1, 0.3, mat("#1b1d20"), 0, 3.9, 0, head);
    const lamps3 = lampCols.map((c, i) => {
      const m = new THREE.MeshBasicMaterial({ color: c, toneMapped: false });
      const l = new THREE.Mesh(new THREE.CircleGeometry(0.12, 10), m); l.position.set(0, 4.22 - i * 0.32, 0.16); head.add(l);
      return { m, base: new THREE.Color(c) };
    });
    // Fußgängersignal quer zur Fahrbahn
    const ped = new THREE.Group(); ped.rotation.y = sx > 0 ? -Math.PI / 2 : Math.PI / 2; a.add(ped);
    box(0.36, 0.95, 0.24, mat("#1b1d20"), 0, 2.55, 0, ped);
    const pr = new THREE.Mesh(new THREE.PlaneGeometry(0.28, 0.4), new THREE.MeshBasicMaterial({ map: red, toneMapped: false })); pr.position.set(0, 2.78, 0.125); ped.add(pr);
    const pg = new THREE.Mesh(new THREE.PlaneGeometry(0.28, 0.4), new THREE.MeshBasicMaterial({ map: green, toneMapped: false })); pg.position.set(0, 2.33, 0.125); ped.add(pg);
    g.add(a);
    signals.push({ lamps3, pr, pg, sx, sz });
  }
  function setSignals(t, power) {
    // Zyklus 12 s: Allee grün 0–5, gelb 5–6, rot 6–11,5 …
    const ph = ((t + 3) % 12) / 12;
    const allee = ph < 0.42 ? 2 : ph < 0.5 ? 1 : 0;
    for (const s of signals) {
      s.lamps3.forEach((l, i) => l.m.color.copy(l.base).multiplyScalar(power > 0.5 && i === allee ? 1 : 0.06));
      const walk = allee === 2; // parallel zur Allee
      s.pg.material.color.setScalar(power > 0.5 && walk ? 1 : 0.12);
      s.pr.material.color.setScalar(power > 0.5 && !walk ? 1 : 0.12);
    }
  }
  // Litfaßsäule (Ecke vorne links)
  const posters = canvasTexture(512, 256, (c, w, h) => {
    const pr = rng(seed + 9);
    c.fillStyle = "#d9d2c0"; c.fillRect(0, 0, w, h);
    const cols = ["#c83a2e", "#2e5aa8", "#f0c234", "#1f1f1f", "#e8e2d4", "#3a8a5a", "#e07a2e"];
    for (let i = 0; i < 9; i++) { c.fillStyle = pr.pick(cols); c.fillRect((i % 5) * w / 5 + 6, Math.floor(i / 5) * h / 2 + 8, w / 5 - 12, h / 2 - 16); }
  }).tex;
  const lf = new THREE.Group(); lf.position.set(-12.8, 0.15, -16.5);
  cyl(0.75, 0.75, 2.8, 12, new THREE.MeshStandardMaterial({ map: posters, roughness: 0.8, flatShading: true }), 0, 1.6, 0, lf);
  cyl(0.82, 0.82, 0.25, 12, mat("#2d4a3a"), 0, 0.12, 0, lf);
  cyl(0.88, 0.88, 0.18, 12, mat("#2d4a3a"), 0, 3.08, 0, lf);
  const dome = new THREE.Mesh(new THREE.SphereGeometry(0.8, 10, 5, 0, Math.PI * 2, 0, Math.PI / 2), mat("#2d4a3a")); dome.position.y = 3.15; lf.add(dome);
  g.add(lf);
  // Fahrradständer + Poller an den Ecken
  const small = [];
  for (const sx of [-1, 1]) for (let z = 20; z < 60; z += 1.2) small.push({ m: boxMat(sx * 10.9, 0.55, z, 0.05, 0.75, 0.7), c: "#5e6266" });
  g.add(instList(new THREE.BoxGeometry(1, 1, 1), mat("#ffffff"), small));
  return { group: g, trees, setCrowns, lamps, setSignals, litfass: lf };
}

// ================================================================ Fahrzeuge ===
export const headMat = new THREE.MeshBasicMaterial({ color: "#fff1c8", toneMapped: false });
export const tailMat = new THREE.MeshBasicMaterial({ color: "#ff2a1a", toneMapped: false });
function lights(g, halfLen, w = 0.68, y = 0.85) {
  box(0.3, 0.14, 0.05, headMat, -w, y, -halfLen, g).castShadow = false;
  box(0.3, 0.14, 0.05, headMat, w, y, -halfLen, g).castShadow = false;
  box(0.3, 0.14, 0.05, tailMat, -w, y + 0.1, halfLen, g).castShadow = false;
  box(0.3, 0.14, 0.05, tailMat, w, y + 0.1, halfLen, g).castShadow = false;
}
/** Auto, Front zeigt nach −z. */
export function vehicle(seed, kind = "car") {
  if (kind === "taxi") {
    const c = car(seed);
    const paint = c.children[0].material; paint.color.set("#ece2c2");
    const sign = textPanel(0.62, 0.2, 200, "#f2cc3d", [{ text: "TAXI", size: 30, color: "#111", y: 0.55, weight: 800 }]);
    sign.position.set(0, 1.81, -0.2); c.add(sign);
    const sign2 = sign.clone(); sign2.rotation.y = Math.PI; sign2.position.z = -0.19; c.add(sign2);
    box(0.64, 0.2, 0.06, mat("#f2cc3d"), 0, 1.8, -0.2, c);
    lights(c, 2.16);
    c.userData.paint = paint; c.userData.len = 4.3;
    return c;
  }
  if (kind === "decker") return doubleDecker();
  if (kind === "tram") return tram();
  const c = car(seed);
  lights(c, 2.16);
  c.userData.paint = c.children[0].material; c.userData.len = 4.3;
  return c;
}

export function doubleDecker() {
  const g = new THREE.Group();
  const paint = mat("#f2c318", { roughness: 0.5 });
  const glass = mat("#1c242c", { roughness: 0.25, metalness: 0.5 });
  const dark = mat("#161616");
  box(2.55, 3.9, 11.4, paint, 0, 2.35, 0, g);
  box(2.6, 0.95, 10.4, glass, 0, 1.95, 0.3, g);
  box(2.6, 0.95, 10.8, glass, 0, 3.55, 0, g);
  box(2.4, 1.9, 0.06, glass, 0, 2.6, -5.72, g);
  box(2.58, 0.35, 11.42, dark, 0, 0.62, 0, g);
  box(2.56, 0.1, 11.42, mat("#e8e8e8"), 0, 4.32, 0, g);
  for (const z of [-3.8, 3.4]) for (const x of [-1.15, 1.15]) cyl(0.5, 0.5, 0.3, 10, dark, x, 0.5, z, g).rotation.z = Math.PI / 2;
  const dest = textPanel(1.8, 0.3, 120, "#111", [{ text: "M41 Hbf", size: 24, color: "#ffb43a", y: 0.55 }]);
  dest.position.set(0, 4.0, -5.73); dest.rotation.y = Math.PI; g.add(dest);
  lights(g, 5.72, 0.9, 0.9);
  g.userData.paint = paint; g.userData.len = 11.4;
  return g;
}

export function tram() {
  const g = new THREE.Group();
  const paint = mat("#f2c318", { roughness: 0.5 });
  const glass = mat("#1c242c", { roughness: 0.25, metalness: 0.5 });
  const dark = mat("#1a1a1a");
  const L = 30, segs = 5, sl = L / segs;
  for (let i = 0; i < segs; i++) {
    const z = -L / 2 + sl * (i + 0.5);
    box(2.4, 3.0, sl - 0.25, paint, 0, 1.9, z, g);
    box(2.45, 1.25, sl - 0.9, glass, 0, 2.3, z, g);
    box(2.42, 0.4, sl - 0.25, dark, 0, 0.55, z, g);
    box(2.2, 0.1, sl - 0.3, mat("#d9d9d9"), 0, 3.45, z, g);
    if (i === 1 || i === 3) box(1.4, 0.4, 2.2, mat("#55585c"), 0, 3.65, z, g);
  }
  box(2.2, 1.6, 0.05, glass, 0, 2.4, -L / 2 - 0.02, g);
  // Stromabnehmer
  const pan = mat("#2b2b2b");
  box(0.08, 1.3, 0.08, pan, 0, 4.3, -3, g).rotation.x = 0.6;
  box(1.6, 0.06, 0.1, pan, 0, 4.85, -3.4, g);
  lights(g, L / 2 + 0.02, 0.8, 0.9);
  const dest = textPanel(1.8, 0.3, 120, "#111", [{ text: "M10 Warschauer Str.", size: 18, color: "#ffb43a", y: 0.55 }]);
  dest.position.set(0, 3.25, -L / 2 - 0.04); dest.rotation.y = Math.PI; g.add(dest);
  g.userData.paint = paint; g.userData.len = L;
  return g;
}

// ================================================================ Schirme ===
export function umbrellas(n, seed = 1601) {
  const r = rng(seed);
  const canopy = new THREE.InstancedMesh(new THREE.ConeGeometry(0.62, 0.28, 8), new THREE.MeshStandardMaterial({ roughness: 0.6, flatShading: true }), n);
  const stick = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.015, 0.015, 0.9, 4), mat("#222"), n);
  const col = new THREE.Color();
  for (let i = 0; i < n; i++) canopy.setColorAt(i, col.set(r.pick(["#1d1f24", "#1d1f24", "#2d58a8", "#b33a2e", "#f0c234", "#2f6b4a", "#e8e4dc", "#7a2e5e"])));
  canopy.castShadow = true; canopy.frustumCulled = stick.frustumCulled = false;
  const g = new THREE.Group(); g.add(canopy, stick);
  const zero = new THREE.Matrix4().makeScale(0, 0, 0);
  return {
    group: g,
    set(i, s) {
      if (!s) { canopy.setMatrixAt(i, zero); stick.setMatrixAt(i, zero); return; }
      const k = s.open ?? 1;
      o.position.set(s.x, s.y + 2.12, s.z); o.rotation.set(0.12 * Math.sin(s.rotY), 0, 0.12 * Math.cos(s.rotY)); o.scale.set(k + 0.01, 1, k + 0.01); o.updateMatrix(); canopy.setMatrixAt(i, o.matrix);
      o.position.set(s.x, s.y + 1.65, s.z); o.rotation.set(0, 0, 0); o.scale.set(1, 1, 1); o.updateMatrix(); stick.setMatrixAt(i, o.matrix);
    },
    commit() { canopy.instanceMatrix.needsUpdate = stick.instanceMatrix.needsUpdate = true; },
  };
}

// =================================================================== Boote ===
export function kayak(color = "#b8262a") {
  const g = new THREE.Group();
  const m = mat(color, { roughness: 0.5 });
  box(0.72, 0.32, 2.6, m, 0, 0.12, 0, g);
  for (const s of [-1, 1]) {
    const c = new THREE.Mesh(new THREE.ConeGeometry(0.42, 1.1, 4), m);
    c.rotation.x = s * Math.PI / 2; c.rotation.y = Math.PI / 4; c.scale.set(1.2, 1, 0.55); c.position.set(0, 0.12, s * 1.85); c.castShadow = true; g.add(c);
  }
  box(0.5, 0.06, 0.8, mat("#1a1a1a"), 0, 0.29, 0.1, g);
  const pad = box(0.05, 0.05, 2.4, mat("#222"), 0, 0.75, 0.1, g); pad.rotation.z = 1.4; pad.rotation.y = 1.2;
  return g;
}
export function dinghy(color = "#e0662a") {
  const g = new THREE.Group();
  const m = mat(color, { roughness: 0.7 });
  for (const s of [-1, 1]) cyl(0.26, 0.26, 3.2, 8, m, s * 0.85, 0.2, 0, g).rotation.x = Math.PI / 2;
  const f = cyl(0.26, 0.26, 1.7, 8, m, 0, 0.2, 1.6, g); f.rotation.z = Math.PI / 2;
  const b = cyl(0.26, 0.26, 1.7, 8, m, 0, 0.2, -1.6, g); b.rotation.z = Math.PI / 2;
  box(1.5, 0.08, 3.1, mat("#3a3d42"), 0, 0.02, 0, g);
  box(0.25, 0.4, 0.35, mat("#222"), 0, 0.3, 1.75, g); // Außenborder
  return g;
}
export function duck() {
  const g = new THREE.Group();
  const y = mat("#f5c518", { roughness: 0.4 });
  const body = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 1), y); body.scale.set(0.95, 0.6, 1.25); body.position.y = 0.25; body.castShadow = true; g.add(body);
  const head = new THREE.Mesh(new THREE.IcosahedronGeometry(0.5, 1), y); head.position.set(0, 1.05, -0.85); head.castShadow = true; g.add(head);
  box(0.36, 0.14, 0.4, mat("#f07a1a"), 0, 0.98, -1.35, g);
  box(0.08, 0.1, 0.06, mat("#111"), 0.25, 1.18, -1.2, g);
  box(0.08, 0.1, 0.06, mat("#111"), -0.25, 1.18, -1.2, g);
  return g;
}
export function rowboat() {
  const g = new THREE.Group();
  const wood = mat("#7a5638");
  box(1.7, 0.55, 4.6, wood, 0, 0.12, 0, g);
  box(1.4, 0.1, 4.2, mat("#5a3e28"), 0, 0.36, 0, g);
  const bow = new THREE.Mesh(new THREE.ConeGeometry(0.95, 1.2, 4), wood); bow.rotation.x = -Math.PI / 2; bow.rotation.y = Math.PI / 4; bow.scale.set(1.25, 1, 0.42); bow.position.set(0, 0.12, -2.85); g.add(bow);
  for (const z of [-1.2, 0.4]) box(1.6, 0.08, 0.3, mat("#9a7550"), 0, 0.42, z, g);
  return g;
}

// ================================================================== Wasser ===
export function water() {
  const geo = new THREE.PlaneGeometry(1600, 1600, 96, 96);
  geo.rotateX(-Math.PI / 2);
  geo.translate(0, 0, -500);
  const base = geo.attributes.position.array.slice();
  const material = new THREE.MeshStandardMaterial({ color: "#4f5a52", roughness: 0.55, metalness: 0.0, flatShading: true, side: THREE.DoubleSide });
  const m = new THREE.Mesh(geo, material);
  m.receiveShadow = true;
  return {
    mesh: m, material,
    update(t, level, amp) {
      const p = geo.attributes.position.array;
      for (let i = 0; i < p.length; i += 3) {
        const x = base[i], z = base[i + 2];
        p[i + 1] = level + amp * (Math.sin(x * 0.11 + t * 1.4) * 0.5 + Math.sin(z * 0.09 - t * 1.0 + x * 0.03) * 0.35 + Math.sin((x - z) * 0.31 + t * 2.1) * 0.15);
      }
      geo.attributes.position.needsUpdate = true;
      geo.computeVertexNormals();
    },
  };
}

// ======================================================= Regen (Streifen) ===
// Basispunkte im Sichtkegel der festen Kamera; jeder Tropfen fällt periodisch durch eine Spanne.
export function rain(camera, n = 9000, seed = 1701) {
  const r = rng(seed);
  const pos = new Float32Array(n * 6);
  const B = [];
  camera.updateMatrixWorld();
  const fwd = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
  const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
  const up = new THREE.Vector3(0, 1, 0).applyQuaternion(camera.quaternion);
  const tv = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)), th = tv * camera.aspect;
  for (let i = 0; i < n; i++) {
    const d = 3.5 + 75 * Math.pow(r(), 1.4);
    const u = r.range(-1.15, 1.15), v = r.range(-1.15, 1.15);
    const p = camera.position.clone().addScaledVector(fwd, d).addScaledVector(right, u * th * d).addScaledVector(up, v * tv * d);
    B.push({ x: p.x, y: p.y, z: p.z, ph: r(), sp: r.range(0.85, 1.15), span: 6 + d * 0.25, len: 0.35 + d * 0.012 });
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  const material = new THREE.LineBasicMaterial({ color: "#dfe6ea", transparent: true, opacity: 0.28, depthWrite: false, fog: false });
  const lines = new THREE.LineSegments(geo, material);
  lines.frustumCulled = false;
  return {
    lines, material,
    update(t, intensity, wind = 0.12, floor = -1e9) {
      const count = Math.floor(n * clamp(intensity));
      for (let i = 0; i < count; i++) {
        const b = B[i];
        const fall = ((t * 14 * b.sp / b.span + b.ph) % 1) * b.span;
        let y = b.y + b.span / 2 - fall;
        const vis = y > floor;
        const x = b.x + wind * (b.span / 2 - fall), z = b.z;
        if (!vis) y = -1000;
        pos[i * 6] = x; pos[i * 6 + 1] = y; pos[i * 6 + 2] = z;
        pos[i * 6 + 3] = x - wind * b.len; pos[i * 6 + 4] = y + b.len; pos[i * 6 + 5] = z;
      }
      geo.setDrawRange(0, count * 2);
      geo.attributes.position.needsUpdate = true;
      lines.visible = count > 0;
    },
  };
}

// Ringe auf dem Wasser, wo Tropfen einschlagen
export function ripples(n = 500, seed = 1801) {
  const r = rng(seed);
  const im = new THREE.InstancedMesh(new THREE.RingGeometry(0.85, 1, 14), new THREE.MeshBasicMaterial({ color: "#cfd8d6", transparent: true, opacity: 0.2, side: THREE.DoubleSide, depthWrite: false }), n);
  const P = [];
  for (let i = 0; i < n; i++) P.push({ x: r.range(-22, 22), z: lerp(62, -40, Math.pow(r(), 0.8)), ph: r(), sp: r.range(0.9, 1.6) });
  im.frustumCulled = false;
  return {
    mesh: im,
    update(t, level, k) {
      P.forEach((p, i) => {
        const f = (t * p.sp + p.ph) % 1;
        const s = (0.05 + f * 0.3) * (i < n * k ? 1 : 0) + 0.0001;
        o.position.set(p.x + Math.floor(t * p.sp + p.ph) * 3.7 % 9 - 4.5, level + 0.04, p.z); o.rotation.set(-Math.PI / 2, 0, 0); o.scale.set(s, s, s); o.updateMatrix(); im.setMatrixAt(i, o.matrix);
      });
      im.instanceMatrix.needsUpdate = true;
      im.material.opacity = 0.22 * k * (1 - 0.5);
      im.visible = k > 0.01;
    },
  };
}

// ======================================================== Treibgut/Partikel ===
/** Instanzierte Kisten. place(r, i) → { x, y, z, sx, sy, sz, c } */
export function boxes(n, seed, place, material) {
  const r = rng(seed);
  const im = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), material || new THREE.MeshStandardMaterial({ roughness: 0.85, flatShading: true }), n);
  const col = new THREE.Color();
  const P = [];
  for (let i = 0; i < n; i++) { const p = place(r, i); p.rx = r() * 6.28; p.ry = r() * 6.28; p.ph = r() * 6.28; p.sp = r.range(0.3, 1); P.push(p); im.setColorAt(i, col.set(p.c)); }
  im.instanceColor.needsUpdate = true;
  im.castShadow = true; im.frustumCulled = false;
  return {
    mesh: im, P,
    /** fn(p, i) → { x, y, z, rx, ry, rz, s } | null */
    update(fn) {
      P.forEach((p, i) => {
        const s = fn(p, i);
        if (!s) { o.position.set(0, -999, 0); o.scale.setScalar(0); }
        else { o.position.set(s.x, s.y, s.z); o.rotation.set(s.rx || 0, s.ry || 0, s.rz || 0); o.scale.set(p.sx * (s.s ?? 1), p.sy * (s.s ?? 1), p.sz * (s.s ?? 1)); }
        o.updateMatrix(); im.setMatrixAt(i, o.matrix);
      });
      im.instanceMatrix.needsUpdate = true;
    },
  };
}

// Lichtbahnen unter Wasser (additiv)
export function lightShafts(n = 10, seed = 1901) {
  const r = rng(seed);
  const tex = canvasTexture(64, 256, (c, w, h) => {
    const gr = c.createLinearGradient(0, 0, 0, h);
    gr.addColorStop(0, "rgba(255,255,255,0.9)"); gr.addColorStop(1, "rgba(255,255,255,0)");
    c.fillStyle = gr; c.fillRect(0, 0, w, h);
  }).tex;
  const g = new THREE.Group();
  const material = new THREE.MeshBasicMaterial({ map: tex, color: "#bfeee0", transparent: true, opacity: 0.12, blending: THREE.AdditiveBlending, depthWrite: false, fog: false, side: THREE.DoubleSide });
  const S = [];
  for (let i = 0; i < n; i++) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(r.range(1.5, 4.5), 60), material);
    S.push({ m, x: r.range(-25, 20), z: r.range(-10, 45), ph: r() * 6, ry: r.range(-0.6, 0.6) });
    g.add(m);
  }
  return {
    group: g, material,
    update(t, top) {
      S.forEach((s) => {
        s.m.position.set(s.x + Math.sin(t * 0.3 + s.ph) * 2, top - 30, s.z);
        s.m.rotation.set(0, s.ry, 0.35);
      });
    },
  };
}

// ============================================================ Neuer Wald ===
export function forest(n, seed, place) {
  const r = rng(seed);
  const trunk = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.25, 0.4, 1, 5), mat("#5a4433"), n);
  const crown = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 0), new THREE.MeshStandardMaterial({ roughness: 0.9, flatShading: true }), n);
  const col = new THREE.Color();
  const T = [];
  for (let i = 0; i < n; i++) {
    const [x, y, z, big] = place(r, i);
    T.push({ x, y, z, h: r.range(6, 11) * (big ?? 1), c: r.range(2.0, 3.6) * (big ?? 1), at: r.range(0, 0.5), ph: r() * 6 });
    crown.setColorAt(i, col.set(r.pick(["#3f6f30", "#4d7f38", "#5a8a3c", "#36602b", "#6a9444", "#7a9c48"])));
  }
  trunk.castShadow = crown.castShadow = true;
  trunk.frustumCulled = crown.frustumCulled = false;
  const g = new THREE.Group(); g.add(trunk, crown);
  return {
    group: g,
    grow(k) {
      T.forEach((p, i) => {
        const f = smooth((k - p.at) / 0.5);
        const h = p.h * f;
        o.position.set(p.x, p.y + h * 0.35, p.z); o.rotation.set(0, p.ph, 0); o.scale.set(f * 1.1 + 0.001, h * 0.7 + 0.001, f * 1.1 + 0.001); o.updateMatrix(); trunk.setMatrixAt(i, o.matrix);
        o.position.set(p.x, p.y + h * 0.78, p.z); o.scale.set(p.c * f + 0.001, p.c * 1.1 * f + 0.001, p.c * f + 0.001); o.updateMatrix(); crown.setMatrixAt(i, o.matrix);
      });
      trunk.instanceMatrix.needsUpdate = crown.instanceMatrix.needsUpdate = true;
      g.visible = k > 0.001;
    },
  };
}
