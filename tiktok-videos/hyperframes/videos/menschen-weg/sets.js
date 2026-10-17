// Sets nur für "menschen-weg": Kölner Dom, Hauptbahnhof, Domplatte, Rhein, Hohenzollernbrücke,
// Regionalzug, Gitarre, Ampel, Fuchs, Hund, Tauben, Liebesschlösser, Bewuchs.
// Alles Low-Poly, flat shading, deterministisch (nur rng(seed) und t). lib/ bleibt unverändert.
//
// Weltachsen: −z = Osten (Rhein), +z = Westen, +x = Süden, −x = Norden.
// Westfassade des Doms bei z = 0, x = 0. Hauptbahnhof nördlich (x ≈ −130).
// Rhein zwischen z = −280 (linkes Ufer, Altstadt) und z = −680 (Deutz).
// Hohenzollernbrücke entlang z bei x = −110 … −156, Gehweg Süd x = −110 … −116.
import { THREE, rng, clamp, smooth, lerp, building, windowTextures } from "./lib/lowpoly.js";
import { mat, basic, box, cyl, canvasTexture, textPanel, tileTexture } from "./lib/props.js";

export const BANK_Z = -280;       // Kaimauer linkes Ufer
export const EAST_Z = -680;       // Kaimauer Deutz
export const WATER0 = -6;         // normaler Rheinpegel (Stadt liegt auf y = 0)
export const DECK_Y = 11;         // Gehweg der Brücke
export const RAIL_X = -110;       // Geländer Süd
export const FENCE_X = -116;      // Zaun zwischen Gehweg und Gleisen
export const PIERS = [-400, -560];

const o = new THREE.Object3D();

// Balken zwischen zwei Punkten in eine Matrixliste
function beam(list, a, b, tx, ty = tx) {
  const len = a.distanceTo(b);
  o.position.copy(a).add(b).multiplyScalar(0.5);
  o.lookAt(b);
  o.scale.set(tx, ty, len);
  o.updateMatrix();
  list.push(o.matrix.clone());
}
function instanced(geo, material, mats, shadow = true) {
  const m = new THREE.InstancedMesh(geo, material, Math.max(1, mats.length));
  mats.forEach((mm, i) => m.setMatrixAt(i, mm));
  m.count = mats.length;
  m.castShadow = shadow; m.receiveShadow = true;
  return m;
}
function prism(w, h, len, material) {
  // Dreiecksprisma (Satteldach), First entlang z, Basis bei y = 0
  const s = new THREE.Shape();
  s.moveTo(-w / 2, 0); s.lineTo(w / 2, 0); s.lineTo(0, h); s.lineTo(-w / 2, 0);
  const g = new THREE.ExtrudeGeometry(s, { depth: len, bevelEnabled: false });
  g.translate(0, 0, -len / 2);
  const m = new THREE.Mesh(g, material); m.castShadow = m.receiveShadow = true;
  return m;
}
function lancetGeometry() {
  const s = new THREE.Shape();
  s.moveTo(-0.5, 0); s.lineTo(0.5, 0); s.lineTo(0.5, 0.68);
  s.quadraticCurveTo(0.5, 0.9, 0, 1); s.quadraticCurveTo(-0.5, 0.9, -0.5, 0.68); s.lineTo(-0.5, 0);
  return new THREE.ShapeGeometry(s, 3);
}

// =====================================================================
// Kölner Dom: zwei Türme (157 m), Mittelschiff, Strebewerk, Querhaus, Chor
// =====================================================================
export function kolnerDom({ seed = 501 } = {}) {
  const r = rng(seed);
  const g = new THREE.Group();
  const stone = new THREE.MeshStandardMaterial({ color: "#7a756c", roughness: 0.95, flatShading: true, emissive: new THREE.Color("#ffc98a"), emissiveIntensity: 0 });
  const stone2 = new THREE.MeshStandardMaterial({ color: "#66625a", roughness: 0.95, flatShading: true, emissive: new THREE.Color("#ffc98a"), emissiveIntensity: 0 });
  const roofM = new THREE.MeshStandardMaterial({ color: "#4b5254", roughness: 0.7, metalness: 0.2, flatShading: true });
  const surf = [];  // Flächen für den Efeu: { x, z, w, d, y0, h }
  const B = (w, h, d, x, y0, z, m = stone, ivy = true) => {
    const b = box(w, h, d, m, x, y0 + h / 2, z, g);
    if (ivy) surf.push({ x, z, w, d, y0, h });
    return b;
  };
  const lancets = [], pins = [];
  const L = (x, y, z, w, h, ry = 0) => { o.position.set(x, y, z); o.rotation.set(0, ry, 0); o.scale.set(w, h, 1); o.updateMatrix(); lancets.push(o.matrix.clone()); };
  const P = (x, y, z, rr, h) => { o.position.set(x, y + h / 2, z); o.rotation.set(0, 0, 0); o.scale.set(rr, h, rr); o.updateMatrix(); pins.push(o.matrix.clone()); };

  // ---- Türme
  const TZ = -11;
  for (const sx of [-1, 1]) {
    const cx = sx * 21;
    const tiers = [[22, 0, 30], [20.5, 30, 28], [19, 58, 22], [16.5, 80, 20]];
    tiers.forEach(([w, y0, h], k) => {
      B(w, h, w, cx, y0, TZ, k % 2 ? stone2 : stone);
      if (k < 3) {
        for (const ex of [-1, 1]) for (const ez of [-1, 1]) {
          B(3.0, h + 3, 3.0, cx + ex * w / 2, y0, TZ + ez * w / 2, stone2, false);
          P(cx + ex * w / 2, y0 + h + 3, TZ + ez * w / 2, 1.5, 9);
        }
        // Wimpergen (Ziergiebel) mittig auf jeder Seite
        P(cx, y0 + h, TZ + w / 2, 1.1, 7);
        P(cx + sx * w / 2, y0 + h, TZ, 1.1, 7);
      }
      // Lanzettfenster vorn (+z) und seitlich
      const fz = TZ + w / 2 + 0.06, fx = cx + sx * (w / 2 + 0.06);
      const n = k === 0 ? 1 : 2, lw = k === 0 ? 6 : 3.4, lh = [15, 20, 17, 14][k], ly = y0 + [4, 4, 2.5, 3][k];
      for (let i = 0; i < n; i++) {
        const off = n === 1 ? 0 : (i - 0.5) * 6.4;
        L(cx + off, ly, fz, lw, lh, 0);
        L(fx, ly, TZ + off, lw, lh, sx * Math.PI / 2);
      }
    });
    // Oktogon + Helm
    const oct = cyl(8.0, 8.5, 13, 8, stone, cx, 106.5, TZ, g); oct.rotation.y = Math.PI / 8;
    surf.push({ x: cx, z: TZ, w: 16, d: 16, y0: 100, h: 13 });
    for (let k = 0; k < 8; k++) {
      const a = k / 8 * Math.PI * 2;
      P(cx + Math.cos(a) * 8.6, 109, TZ + Math.sin(a) * 8.6, 1.2, 10);
      L(cx + Math.cos(a + Math.PI / 8) * 7.95, 102, TZ + Math.sin(a + Math.PI / 8) * 7.95, 2.6, 8, Math.PI / 2 - (a + Math.PI / 8));
    }
    const spire = new THREE.Mesh(new THREE.ConeGeometry(7.2, 41, 8), stone2);
    spire.position.set(cx, 113 + 20.5, TZ); spire.rotation.y = Math.PI / 8; spire.castShadow = true; g.add(spire);
    surf.push({ x: cx, z: TZ, w: 9, d: 9, y0: 113, h: 18 });
    // Krabben am Helm (kleine Höcker an den Kanten)
    for (let k = 0; k < 8; k++) for (let j = 1; j < 7; j++) {
      const a = k / 8 * Math.PI * 2 + Math.PI / 8, f = j / 7, rr = 7.2 * (1 - f) + 0.3;
      P(cx + Math.cos(a) * rr, 113 + 41 * f - 0.5, TZ + Math.sin(a) * rr, 0.55, 1.6);
    }
    // Kreuzblume
    box(1.0, 4.2, 1.0, stone2, cx, 155.1, TZ, g);
    box(3.0, 0.8, 0.8, stone2, cx, 155.6, TZ, g);
    box(0.8, 0.8, 3.0, stone2, cx, 155.6, TZ, g);
  }
  // ---- Mittelteil der Westfassade
  B(20, 46, 9, 0, 0, -4.5);
  const gable = prism(20, 19, 9, stone2); gable.rotation.y = 0; gable.position.set(0, 46, -4.5); g.add(gable);
  P(0, 64.5, -0.5, 1.3, 9); P(-9, 46, -0.2, 1.2, 9); P(9, 46, -0.2, 1.2, 9);
  L(0, 17, 0.06, 9.5, 27); L(0, 0.3, 0.06, 7, 14);
  L(-21, 0.3, 0.06, 5, 11); L(21, 0.3, 0.06, 5, 11);

  // ---- Langhaus
  B(16, 44, 136, 0, 0, -8 - 68);
  const nroof = prism(16.4, 17, 136, roofM); nroof.position.set(0, 44, -76); g.add(nroof);
  for (const sx of [-1, 1]) {
    B(13, 21, 128, sx * 14.5, 0, -12 - 60);
    const ar = box(14, 0.6, 128, roofM, sx * 14.4, 23.4, -72, g); ar.rotation.z = sx * -0.3;
  }
  // Strebewerk mit Fialen + Lanzetten
  for (let z = -14; z > -142; z -= 8.6) {
    const inTransept = z < -62 && z > -86;
    for (const sx of [-1, 1]) {
      if (!inTransept) {
        B(2.6, 30, 3.2, sx * 22.4, 0, z, stone2, false);
        P(sx * 22.4, 30, z, 1.3, 9);
        beam(pins.flyers || (pins.flyers = []), new THREE.Vector3(sx * 22.4, 28.5, z), new THREE.Vector3(sx * 8.2, 39, z), 1.0, 1.4);
        L(sx * 21.06, 4, z - 4.3, 3.2, 12, sx * Math.PI / 2);
      }
      L(sx * 8.06, 24.5, z - 4.3, 3.8, 15, sx * Math.PI / 2);
    }
  }
  // ---- Querhaus
  B(88, 44, 18, 0, 0, -75);
  const troof = prism(18.4, 16, 88, roofM); troof.rotation.y = Math.PI / 2; troof.position.set(0, 44, -75); g.add(troof);
  for (const sx of [-1, 1]) {
    const tg = prism(18, 16, 1.5, stone2); tg.rotation.y = Math.PI / 2; tg.position.set(sx * 44.2, 44, -75); g.add(tg);
    L(sx * 44.07, 16, -75, 8, 24, sx * Math.PI / 2);
    L(sx * 44.07, 0.3, -75, 5.5, 11, sx * Math.PI / 2);
    for (const ez of [-1, 1]) { B(3, 50, 3, sx * 44, 0, -75 + ez * 9, stone2, false); P(sx * 44, 50, -75 + ez * 9, 1.4, 10); }
    for (let k = -2; k <= 2; k++) if (k) L(sx * 20 + k * 6.5 * sx, 4, -65.94, 3.2, 14, 0);
  }
  // Vierungsturm (Dachreiter)
  cyl(2.6, 3.0, 24, 8, roofM, 0, 61 + 12 - 12, -75, g);
  const vt = new THREE.Mesh(new THREE.ConeGeometry(3.0, 34, 8), roofM); vt.position.set(0, 73 + 17 - 12, -75); g.add(vt);
  // ---- Chor mit Kapellenkranz
  const apse = cyl(8, 8, 44, 10, stone, 0, 22, -144, g); surf.push({ x: 0, z: -144, w: 16, d: 16, y0: 0, h: 44 });
  const aroof = new THREE.Mesh(new THREE.ConeGeometry(8.5, 15, 10), roofM); aroof.position.set(0, 51.5, -144); g.add(aroof);
  cyl(21, 21, 21, 14, stone2, 0, 10.5, -134, g); surf.push({ x: 0, z: -134, w: 42, d: 42, y0: 0, h: 21 });
  const croof = new THREE.Mesh(new THREE.ConeGeometry(21.6, 6, 14), roofM); croof.position.set(0, 24, -134); g.add(croof);
  for (let k = 0; k < 9; k++) {
    const a = -Math.PI / 2 + (k / 8) * Math.PI;    // Halbkreis nach Osten
    const nx = Math.sin(a), nz = -Math.cos(a);
    B(2.6, 31, 3, nx * 22.4, 0, -134 + nz * 22.4, stone2, false);
    P(nx * 22.4, 31, -134 + nz * 22.4, 1.3, 9);
    beam(pins.flyers, new THREE.Vector3(nx * 22.4, 29, -134 + nz * 22.4), new THREE.Vector3(nx * 8.5, 39, -144 + nz * 8.5), 1.0, 1.4);
    const b = a + Math.PI / 16;
    L(Math.sin(b) * 21.05, 4, -134 - Math.cos(b) * 21.05, 3.2, 12, Math.atan2(Math.sin(b), -Math.cos(b)));
    L(Math.sin(b) * 8.05, 25, -144 - Math.cos(b) * 8.05, 2.6, 14, Math.atan2(Math.sin(b), -Math.cos(b)));
  }

  // Instanzen: Fialen (Kegel), Strebebögen, Fenster
  const pinMesh = instanced(new THREE.ConeGeometry(1, 1, 6), stone2, pins); g.add(pinMesh);
  const flyMesh = instanced(new THREE.BoxGeometry(1, 1, 1), stone2, pins.flyers); g.add(flyMesh);
  const winMat = new THREE.MeshStandardMaterial({ color: "#26272b", roughness: 0.4, metalness: 0.2, flatShading: true, side: THREE.DoubleSide, emissive: new THREE.Color("#ffb766"), emissiveIntensity: 0 });
  const winMesh = instanced(lancetGeometry(), winMat, lancets, false); g.add(winMesh);

  // Efeu: Blätterklumpen auf den Außenflächen, wachsen von unten nach oben
  const IVY = 2600;
  const ivyMesh = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 0), new THREE.MeshStandardMaterial({ roughness: 0.9, flatShading: true }), IVY);
  const IV = [];
  const totalArea = surf.reduce((a, s) => a + (s.w + s.d) * 2 * s.h, 0);
  const col = new THREE.Color();
  for (let i = 0; i < IVY; i++) {
    let pick = r() * totalArea, s = surf[0];
    for (const q of surf) { pick -= (q.w + q.d) * 2 * q.h; if (pick <= 0) { s = q; break; } }
    const side = Math.floor(r() * 4), u = r() - 0.5;
    const y = s.y0 + s.h * Math.pow(r(), 1.4);
    let x = s.x, z = s.z;
    if (side === 0) { x += u * s.w; z += s.d / 2 + 0.4; }
    else if (side === 1) { x += u * s.w; z -= s.d / 2 + 0.4; }
    else if (side === 2) { x += s.w / 2 + 0.4; z += u * s.d; }
    else { x -= s.w / 2 + 0.4; z += u * s.d; }
    const thr = clamp(y / 160 + r.range(-0.08, 0.08), 0, 1);
    IV.push({ x, y, z, thr, s: r.range(1.2, 3.4), ry: r() * 6 });
    ivyMesh.setColorAt(i, col.set(r.pick(["#3f6b2c", "#4f7d33", "#35602a", "#5b8a3a", "#2f5524"])));
  }
  ivyMesh.castShadow = false; ivyMesh.receiveShadow = true;
  ivyMesh.frustumCulled = false;
  g.add(ivyMesh);
  const stoneBase = stone.color.clone(), stone2Base = stone2.color.clone(), moss = new THREE.Color("#58663f");
  function grow(k) {
    IV.forEach((p, i) => {
      const sc = smooth((k * 1.15 - p.thr) / 0.12) * p.s;
      o.position.set(p.x, p.y, p.z); o.rotation.set(p.ry, p.ry * 1.7, 0); o.scale.setScalar(sc); o.updateMatrix();
      ivyMesh.setMatrixAt(i, o.matrix);
    });
    ivyMesh.instanceMatrix.needsUpdate = true;
    ivyMesh.visible = k > 0.001;
    stone.color.copy(stoneBase).lerp(moss, k * 0.45);
    stone2.color.copy(stone2Base).lerp(moss, k * 0.4);
  }
  grow(0);
  function light(k) { stone.emissiveIntensity = stone2.emissiveIntensity = 0.32 * k; winMat.emissiveIntensity = 0.5 * k; }
  return { group: g, grow, light, stone, stone2 };
}

// =====================================================================
// Hauptbahnhof: Glas-Tonnendach, Eingangsgebäude mit Schild
// =====================================================================
export const HBF = { x: -130, front: 80, back: -120, r: 30 };
export function hauptbahnhof() {
  const g = new THREE.Group();
  const len = HBF.front - HBF.back, cz = (HBF.front + HBF.back) / 2;
  const glass = new THREE.MeshStandardMaterial({ color: "#a8bfc8", transparent: true, opacity: 0.42, roughness: 0.15, metalness: 0.3, side: THREE.DoubleSide, flatShading: true, emissive: new THREE.Color("#ffe2b0"), emissiveIntensity: 0, depthWrite: false });
  const steel = mat("#3b4248", { metalness: 0.4, roughness: 0.5 });
  const vault = new THREE.Mesh(new THREE.CylinderGeometry(HBF.r, HBF.r, len, 18, 1, true, -Math.PI / 2, Math.PI), glass);
  vault.rotation.x = -Math.PI / 2; vault.scale.set(1, 1, 0.8); vault.position.set(HBF.x, 6, cz); g.add(vault);
  for (let z = HBF.front; z >= HBF.back; z -= 10) {
    const rib = new THREE.Mesh(new THREE.TorusGeometry(HBF.r, 0.35, 4, 18, Math.PI), steel);
    rib.position.set(HBF.x, 6, z); rib.scale.set(1, 0.8, 1); g.add(rib);
  }
  for (const sx of [-1, 1]) {
    box(1.2, 6, len, mat("#9b9488"), HBF.x + sx * HBF.r, 3, cz, g);
    box(0.6, 0.6, len, steel, HBF.x + sx * HBF.r * 0.5, 6 + HBF.r * 0.8 * 0.866, cz, g);
  }
  box(0.8, 0.8, len, steel, HBF.x, 6 + HBF.r * 0.8, cz, g);
  // Stirnseite aus Glas mit Sprossen
  const front = new THREE.Mesh(new THREE.CircleGeometry(HBF.r, 18, 0, Math.PI), glass);
  front.scale.set(1, 0.8, 1); front.position.set(HBF.x, 6, HBF.front); g.add(front);
  for (let k = -4; k <= 4; k++) {
    const x = (k / 5) * HBF.r, h = Math.sqrt(HBF.r * HBF.r - x * x) * 0.8;
    box(0.4, h, 0.4, steel, HBF.x + x, 6 + h / 2, HBF.front + 0.2, g);
  }
  box(62, 6, 0.6, mat("#8d867a"), HBF.x, 3, HBF.front, g);
  // Eingangsgebäude
  const hall = box(70, 11, 16, mat("#b9b3a6"), HBF.x, 5.5, HBF.front + 9, g);
  const glassFront = box(60, 7, 0.3, new THREE.MeshStandardMaterial({ color: "#41525c", roughness: 0.2, metalness: 0.5, emissive: new THREE.Color("#ffd9a0"), emissiveIntensity: 0, flatShading: true }), HBF.x, 3.8, HBF.front + 17.2, g);
  const sign = textPanel(22, 3.4, 40, "#1c3f94", [{ text: "Köln Hbf", size: 96, color: "#ffffff", y: 0.52 }]);
  sign.position.set(HBF.x, 9.2, HBF.front + 17.4); g.add(sign);
  // Bahnsteige + Gleise in der Halle
  for (let k = 0; k < 4; k++) {
    const x = HBF.x + 24 - k * 14;
    box(5, 0.9, len, mat("#a7a196"), x - 7, 0.45, cz, g);
    for (const dx of [-0.75, 0.75]) box(0.12, 0.15, len + 400, mat("#5a554f", { metalness: 0.5 }), x + dx, 0.1, cz - 200, g);
  }
  // Außengleis an der Südseite (hier rollt der Regionalzug aus)
  box(4.2, 0.25, 412, mat("#6a625a"), -89, 0.12, -114, g);
  for (const dx of [-0.75, 0.75]) box(0.12, 0.16, 412, mat("#8a857e", { metalness: 0.6, roughness: 0.4 }), -89 + dx, 0.3, -114, g);
  // Bahndamm Richtung Brücke (Osten)
  box(50, 10.4, 160, mat("#8a6f5a"), -133, 5.2, -200, g);
  return { group: g, glass, glassFront };
}

/** Roter Regionalzug, Spitze bei z = 0, Wagen nach −z, fährt in +z. */
export function regioTrain(cars = 4, color = "#d4132a") {
  const g = new THREE.Group();
  const red = mat(color, { roughness: 0.5 });
  const win = new THREE.MeshStandardMaterial({ color: "#20262c", roughness: 0.25, metalness: 0.5, flatShading: true, emissive: new THREE.Color("#ffe0aa"), emissiveIntensity: 0.15 });
  const grey = mat("#c9c7c2"), dark = mat("#222");
  const bodies = [];
  for (let k = 0; k < cars; k++) {
    const z = -13.2 - k * 26.6;
    bodies.push(box(2.9, 3.6, 26, red, 0, 2.6, z, g));
    box(2.94, 1.0, 24, win, 0, 3.0, z, g);
    box(2.92, 0.35, 26, grey, 0, 1.0, z, g);
    for (const dz of [-9, 9]) box(2.2, 0.7, 2.6, dark, 0, 0.45, z + dz, g);
  }
  const nose = box(2.9, 2.2, 1.6, red, 0, 2.0, 0.6, g);
  box(2.6, 1.0, 0.1, win, 0, 3.3, 0.05, g).rotation.x = -0.35;
  return { group: g, red, win };
}

// =====================================================================
// Domplatte: Pflaster, Straße, Poller, Häuser im Süden, Laternen
// =====================================================================
export function domplatte({ seed = 601 } = {}) {
  const r = rng(seed);
  const g = new THREE.Group();
  const tiles = tileTexture("#cbc6bb", "#a8a297", 4); tiles.repeat.set(70, 90);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(700, 900), new THREE.MeshStandardMaterial({ map: tiles, roughness: 0.92 }));
  ground.rotation.x = -Math.PI / 2; ground.position.set(0, 0, 170); ground.receiveShadow = true; g.add(ground);
  // Straße (Trankgasse) zwischen Dom und Bahnhof
  const road = new THREE.Mesh(new THREE.PlaneGeometry(26, 520), mat("#4a4a4d", { roughness: 0.95 }));
  road.rotation.x = -Math.PI / 2; road.position.set(-74, 0.02, 160); road.receiveShadow = true; g.add(road);
  for (let z = -90; z < 420; z += 9) box(0.2, 0.01, 4, basic("#e9e6dd"), -74, 0.04, z, g);
  const bollards = [];
  for (let z = 60; z < 260; z += 3.2) { const b = cyl(0.13, 0.15, 0.9, 6, mat("#2f3236"), -60.5, 0.45, z, g); bollards.push(b); }
  // Stufen vor der Westfassade
  for (let k = 0; k < 4; k++) box(80, 0.18, 1.2, mat("#bdb7ab"), 0, 0.09 + k * 0.18, 9 + (3 - k) * 1.2 - 2, g);
  // Häuser im Süden (Domhotel, Museum) und Westen
  const texA = windowTextures(611, "altbau"), texB = windowTextures(612, "plattenbau");
  const houses = [];
  const add = (w, h, d, x, z, ry, c, tex) => {
    const b = building({ w, h, d, color: c, tex, roof: "#6b5f55" });
    b.mesh.position.set(x, 0, z); b.mesh.rotation.y = ry; g.add(b.mesh); houses.push(b); return b;
  };
  add(60, 22, 20, 78, 10, Math.PI / 2, "#d9cfbd", texA);
  add(40, 20, 20, 82, 70, Math.PI / 2, "#cdbfa8", texA);
  add(46, 18, 22, 84, 125, Math.PI / 2, "#c9c3b4", texB);
  add(50, 16, 30, 60, -60, 0, "#b9b8b1", texB);     // Museum (südlich vom Dom)
  for (let i = 0; i < 8; i++) add(r.range(24, 34), r.range(16, 24), 18, 80 + r.range(0, 8), 180 + i * 34, Math.PI / 2, r.pick(["#d9cfbd", "#e0d4c0", "#cbbfae"]), texA);
  // Häuser hinter dem Bahnhof (Norden)
  for (let i = 0; i < 6; i++) add(r.range(30, 40), r.range(18, 28), 20, -205, 120 - i * 50, Math.PI / 2, r.pick(["#c8c0b0", "#b8b4aa"]), texB);
  return { group: g, houses, bollards };
}

// Ampel (drei Lichter, zeigt nach +z)
export function ampel() {
  const g = new THREE.Group();
  cyl(0.07, 0.09, 3.0, 6, mat("#2a2d31"), 0, 1.5, 0, g);
  box(0.36, 0.95, 0.28, mat("#1d1f22"), 0, 3.25, 0, g);
  const cols = ["#ff3826", "#ffb020", "#36e070"];
  const lamps = cols.map((c, i) => {
    const m = new THREE.MeshBasicMaterial({ color: c, toneMapped: false });
    const l = new THREE.Mesh(new THREE.CircleGeometry(0.1, 10), m);
    l.position.set(0, 3.55 - i * 0.29, 0.145); g.add(l);
    return { m, base: new THREE.Color(c) };
  });
  return {
    group: g,
    set(state) {   // state: 0 rot, 1 gelb, 2 grün, -1 aus
      lamps.forEach((l, i) => l.m.color.copy(l.base).multiplyScalar(i === state ? 1 : 0.07));
    },
  };
}

/** Gitarre (Korpus + Hals), Ursprung am Korpus, Hals zeigt nach +x. */
export function guitar() {
  const g = new THREE.Group();
  const wood = mat("#b5793a", { roughness: 0.6 });
  const body = cyl(0.2, 0.2, 0.09, 10, wood, 0, 0, 0, g); body.rotation.x = Math.PI / 2;
  const body2 = cyl(0.16, 0.16, 0.09, 10, wood, 0.24, 0, 0, g); body2.rotation.x = Math.PI / 2;
  const hole = cyl(0.055, 0.055, 0.092, 8, mat("#1a120c"), 0.12, 0, 0, g); hole.rotation.x = Math.PI / 2;
  box(0.62, 0.055, 0.04, mat("#3a2616"), 0.66, 0, 0.02, g);
  box(0.16, 0.08, 0.04, mat("#3a2616"), 1.03, 0, 0.02, g);
  return g;
}

/** Offener Gitarrenkoffer mit ein paar Münzen. */
export function guitarCase() {
  const g = new THREE.Group();
  box(1.05, 0.1, 0.42, mat("#1c1c1e"), 0, 0.05, 0, g);
  box(0.98, 0.02, 0.36, mat("#7a2030"), 0, 0.1, 0, g);
  for (let i = 0; i < 6; i++) cyl(0.012, 0.012, 0.004, 6, mat("#d8b45a", { metalness: 0.7, roughness: 0.3 }), -0.3 + i * 0.1, 0.113, (i % 2) * 0.06 - 0.03, g);
  return g;
}

/** Vierbeiner (Fuchs oder Hund). update(phase) bewegt die Beine. Front zeigt nach +z. */
export function quadruped(kind = "fox") {
  const g = new THREE.Group();
  const fox = kind === "fox";
  const fur = mat(fox ? "#c8642a" : "#6b5038"), light = mat(fox ? "#f1e6d8" : "#3a2c20"), dark = mat("#1e1712");
  const S = fox ? 1 : 1.35;
  const body = box(0.24 * S, 0.24 * S, 0.62 * S, fur, 0, 0.42 * S, 0, g);
  const head = new THREE.Group(); head.position.set(0, 0.56 * S, 0.36 * S); g.add(head);
  box(0.2 * S, 0.18 * S, 0.2 * S, fur, 0, 0, 0, head);
  box(0.1 * S, 0.08 * S, 0.16 * S, fox ? light : fur, 0, -0.03 * S, 0.15 * S, head);
  box(0.04 * S, 0.04 * S, 0.03 * S, dark, 0, -0.01 * S, 0.24 * S, head);
  for (const sx of [-1, 1]) { const e = new THREE.Mesh(new THREE.ConeGeometry(0.045 * S, 0.12 * S, 4), fox ? fur : dark); e.position.set(sx * 0.06 * S, 0.13 * S, -0.02 * S); head.add(e); }
  const legs = [];
  for (const [x, z] of [[-0.08, 0.22], [0.08, 0.22], [-0.08, -0.22], [0.08, -0.22]]) {
    const p = new THREE.Group(); p.position.set(x * S, 0.34 * S, z * S); g.add(p);
    box(0.06 * S, 0.34 * S, 0.06 * S, fox ? dark : fur, 0, -0.17 * S, 0, p);
    legs.push(p);
  }
  const tail = new THREE.Group(); tail.position.set(0, 0.46 * S, -0.3 * S); g.add(tail);
  const tl = box(fox ? 0.13 : 0.06, fox ? 0.13 : 0.06, fox ? 0.42 : 0.32 * S, fur, 0, 0, -0.2 * S, tail);
  if (fox) box(0.1, 0.1, 0.1, light, 0, 0, -0.44, tail);
  tail.rotation.x = fox ? 0.45 : -0.6;
  g.traverse((m) => { if (m.isMesh) m.castShadow = true; });
  return {
    group: g,
    update(ph, sniff = 0) {
      legs.forEach((l, i) => { l.rotation.x = Math.sin(ph + (i === 0 || i === 3 ? 0 : Math.PI)) * 0.5; });
      head.rotation.x = sniff * 0.6;
      tail.rotation.y = Math.sin(ph * 0.5) * 0.25;
    },
  };
}

/** Tauben (instanziert, einzeln ein-/ausblendbar). */
export function pigeonFlock(n, seed, area) {
  const r = rng(seed);
  const geo = new THREE.BoxGeometry(0.2, 0.15, 0.33);
  const mesh = new THREE.InstancedMesh(geo, mat("#ffffff"), n);
  const head = new THREE.InstancedMesh(new THREE.BoxGeometry(0.09, 0.09, 0.1), mat("#ffffff"), n);
  const col = new THREE.Color();
  const D = [];
  for (let i = 0; i < n; i++) {
    const c = r.pick(["#7f8792", "#6f7781", "#9097a0", "#5c636c", "#a9aeb4", "#8a8f96"]);
    mesh.setColorAt(i, col.set(c)); head.setColorAt(i, col.set(c).multiplyScalar(0.85));
    D.push({ x: r.range(area[0], area[1]), z: r.range(area[2], area[3]), ph: r() * 6.28, dir: r() * 6.28, sp: r.range(0.15, 0.5), at: r() });
  }
  mesh.castShadow = true;
  const hm = new THREE.Matrix4(), off = new THREE.Matrix4().makeTranslation(0, 0.1, 0.17);
  return {
    group: (() => { const g = new THREE.Group(); g.add(mesh, head); return g; })(),
    D,
    /** fn(p, i) → { visible, x, z, y } oder null für Standard */
    update(t, fn) {
      D.forEach((p, i) => {
        const s = fn ? fn(p, i) : { visible: true };
        const x = s.x ?? p.x + Math.sin(t * p.sp + p.ph) * 0.6;
        const z = s.z ?? p.z + Math.cos(t * p.sp * 0.8 + p.ph) * 0.6;
        const peck = Math.max(0, Math.sin(t * 5 + p.ph * 3)) ** 6;
        o.position.set(x, (s.y ?? 0) + 0.11, z);
        o.rotation.set(0, p.dir + Math.sin(t * 0.4 + p.ph) * 1.2, 0);
        o.scale.setScalar(s.visible ? 1 : 0); o.updateMatrix(); mesh.setMatrixAt(i, o.matrix);
        hm.copy(o.matrix).multiply(off).multiply(new THREE.Matrix4().makeRotationX(peck * 0.9));
        head.setMatrixAt(i, hm);
      });
      mesh.instanceMatrix.needsUpdate = head.instanceMatrix.needsUpdate = true;
    },
  };
}

// =====================================================================
// Rhein, Ufer, Altstadt, Bäume
// =====================================================================
export function rhine() {
  const geo = new THREE.PlaneGeometry(3000, 1400, 60, 40);
  geo.rotateX(-Math.PI / 2);
  geo.translate(-200, 0, -480);
  const base = geo.attributes.position.array.slice();
  const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: "#56778a", roughness: 0.28, metalness: 0.15, flatShading: true }));
  m.receiveShadow = true;
  return {
    mesh: m,
    update(t, level) {
      const p = geo.attributes.position.array;
      for (let i = 0; i < p.length; i += 3) {
        const x = base[i], z = base[i + 2];
        p[i + 1] = level + Math.sin(x * 0.05 + t * 0.9) * 0.18 + Math.sin(z * 0.08 - t * 1.3 + x * 0.01) * 0.14;
      }
      geo.attributes.position.needsUpdate = true;
      geo.computeVertexNormals();
    },
  };
}

export function riverbanks({ seed = 701 } = {}) {
  const r = rng(seed);
  const g = new THREE.Group();
  const quay = mat("#8d877c"), pave = mat("#b4ad9f");
  // Unterer Uferweg (Rheingarten) auf y = −2, Kaimauer bis ins Wasser
  box(1200, 0.4, 30, pave, 100, -2.2, BANK_Z + 15, g);
  box(1200, 2.2, 1.2, quay, 100, -1.1, BANK_Z + 30, g);
  box(1200, 9, 2, quay, 100, -6.5, BANK_Z, g);
  // Deutzer Ufer
  box(1400, 10, 2, quay, 0, -5, EAST_Z, g);
  box(1400, 0.4, 600, mat("#6f8a4a"), 0, -0.2, EAST_Z - 300, g);
  // Grund zwischen Dom und Rhein (Heinrich-Böll-Platz, Museum Ludwig)
  box(1200, 0.4, 230, mat("#bfb8aa"), 100, -0.2, -135, g);
  const texA = windowTextures(711, "altbau"), texB = windowTextures(712, "plattenbau");
  const houses = [];
  const add = (w, h, d, x, z, c, tex, roof) => { const b = building({ w, h, d, color: c, tex, roof }); b.mesh.position.set(x, 0, z); g.add(b.mesh); houses.push(b); return b; };
  add(70, 14, 40, -40, -205, "#9ea3a6", texB, "#6c7378");        // Museum Ludwig
  add(40, 16, 30, 40, -210, "#c9c2b4", texB, "#5d6064");
  // Altstadt-Häuser am Ufer südlich (bunte, schmale Giebelhäuser)
  const COLS = ["#d8a25a", "#c9584a", "#e3d7b8", "#7fa0b3", "#e7c46a", "#b5806a", "#d9d2c4", "#9fb08a"];
  for (let i = 0; i < 30; i++) {
    const x = 70 + i * 9.5, w = 9, h = r.range(12, 18);
    add(w, h, 14, x, BANK_Z + 34 + r.range(0, 2), r.pick(COLS), texA, "#5e3a30");
    const gb = prism(w, 5, 14, mat("#6b3b30")); gb.rotation.y = Math.PI / 2; gb.position.set(x, h, BANK_Z + 34); g.add(gb);
  }
  // Groß St. Martin (Turm mit vier Ecktürmchen)
  const gsm = new THREE.Group();
  box(16, 48, 16, mat("#b9ab92"), 0, 24, 0, gsm);
  const sp = new THREE.Mesh(new THREE.ConeGeometry(9, 26, 4), mat("#4a5a54")); sp.position.y = 61; sp.rotation.y = Math.PI / 4; gsm.add(sp);
  for (const ex of [-1, 1]) for (const ez of [-1, 1]) { cyl(1.8, 1.8, 50, 8, mat("#b9ab92"), ex * 7.5, 25, ez * 7.5, gsm); const c = new THREE.Mesh(new THREE.ConeGeometry(2.2, 9, 8), mat("#4a5a54")); c.position.set(ex * 7.5, 54.5, ez * 7.5); gsm.add(c); }
  gsm.position.set(200, 0, BANK_Z + 70); g.add(gsm);
  return { group: g, houses };
}

/** Bäume, die wachsen: grow(k) 0 = nichts, 1 = ausgewachsen. */
export function forest(n, seed, place) {
  const r = rng(seed);
  const trunk = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.25, 0.4, 1, 5), mat("#5a4433"), n);
  const crown = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 0), new THREE.MeshStandardMaterial({ roughness: 0.9, flatShading: true }), n);
  const col = new THREE.Color();
  const T = [];
  for (let i = 0; i < n; i++) {
    const [x, y, z] = place(r, i);
    T.push({ x, y, z, h: r.range(9, 22), c: r.range(3.5, 7), at: r.range(0, 0.55), ph: r() * 6 });
    crown.setColorAt(i, col.set(r.pick(["#3f6f30", "#4d7f38", "#5a8a3c", "#36602b", "#6a9444"])));
  }
  trunk.castShadow = crown.castShadow = true;
  trunk.frustumCulled = crown.frustumCulled = false;
  const g = new THREE.Group(); g.add(trunk, crown);
  return {
    group: g,
    grow(k) {
      T.forEach((p, i) => {
        const f = smooth((k - p.at) / 0.45);
        const h = p.h * f;
        o.position.set(p.x, p.y + h * 0.35, p.z); o.rotation.set(0, p.ph, 0); o.scale.set(f * 1.2 + 0.001, h * 0.7 + 0.001, f * 1.2 + 0.001); o.updateMatrix(); trunk.setMatrixAt(i, o.matrix);
        o.position.set(p.x, p.y + h * 0.75, p.z); o.scale.set(p.c * f + 0.001, p.c * 1.15 * f + 0.001, p.c * f + 0.001); o.updateMatrix(); crown.setMatrixAt(i, o.matrix);
      });
      trunk.instanceMatrix.needsUpdate = crown.instanceMatrix.needsUpdate = true;
      g.visible = k > 0.001;
    },
  };
}

// =====================================================================
// Hohenzollernbrücke: drei Bogenfelder, Fachwerk-Stahlbögen, Gehweg Süd,
// Geländer, Zaun mit Liebesschlössern, Gleise
// =====================================================================
export function hohenzollernbruecke({ seed = 801, camZ = -420 } = {}) {
  const r = rng(seed);
  const g = new THREE.Group();
  const steel = new THREE.MeshStandardMaterial({ color: "#7e9290", roughness: 0.6, metalness: 0.35, flatShading: true });
  const stoneM = mat("#7f776c");
  const spans = [[BANK_Z, PIERS[0], 20], [PIERS[0], PIERS[1], 26], [PIERS[1], EAST_Z, 20]];
  const ribs = [-117, -133, -149];
  const beams = [];
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  for (const [z0, z1, rise] of spans) {
    const n = 14;
    for (const x of ribs) {
      const top = [], bot = [];
      for (let k = 0; k <= n; k++) {
        const s = k / n, z = lerp(z0, z1, s);
        top.push(V(x, DECK_Y + 0.5 + rise * 4 * s * (1 - s) + 2.2, z));
        bot.push(V(x, DECK_Y - 0.4, z));
      }
      for (let k = 0; k < n; k++) {
        beam(beams, top[k], top[k + 1], 1.0, 1.5);
        beam(beams, bot[k], bot[k + 1], 0.8, 1.8);
        beam(beams, bot[k], top[k], 0.35, 0.5);
        beam(beams, k % 2 ? bot[k] : top[k], k % 2 ? top[k + 1] : bot[k + 1], 0.3, 0.45);
      }
      beam(beams, bot[n], top[n], 0.35, 0.5);
    }
    // Querverband oben zwischen den Bögen
    for (let k = 2; k <= n - 2; k += 2) {
      const s = k / n, z = lerp(z0, z1, s), y = DECK_Y + 0.5 + rise * 4 * s * (1 - s) + 2.2;
      beam(beams, V(ribs[0], y, z), V(ribs[2], y, z), 0.3, 0.3);
    }
  }
  const steelMesh = instanced(new THREE.BoxGeometry(1, 1, 1), steel, beams); g.add(steelMesh);
  // Pfeiler (ragen nach Süden über den Gehweg hinaus) und Widerlager
  const piers = [];
  for (const z of PIERS) {
    const p = box(58, 20, 10, stoneM, -131, DECK_Y - 3 - 10, z, g); piers.push(p);
    const cw = new THREE.Mesh(new THREE.CylinderGeometry(5, 5, 20, 6), stoneM); cw.position.set(-102, DECK_Y - 13, z); cw.castShadow = true; g.add(cw);
  }
  box(50, 18, 10, stoneM, -133, DECK_Y - 9.6, BANK_Z + 4, g);
  box(50, 18, 10, stoneM, -133, DECK_Y - 9.6, EAST_Z - 4, g);
  // Gleisdeck
  const L = BANK_Z - EAST_Z, cz = (BANK_Z + EAST_Z) / 2;
  box(36, 1.2, L, mat("#5c5650"), -133, DECK_Y - 0.9, cz, g);
  for (let k = 0; k < 6; k++) for (const dx of [-0.75, 0.75]) box(0.12, 0.16, L, mat("#6c6862", { metalness: 0.6, roughness: 0.4 }), -120 - k * 5.6 + dx, DECK_Y - 0.2, cz, g);
  // Gehweg Süd – Teil um die Kamera ist eine eigene Gruppe (bricht ab)
  const walkMat = mat("#8f8a82");
  const BREAK = [camZ + 14, camZ - 16];
  box(6, 0.5, BANK_Z - BREAK[0], walkMat, -113, DECK_Y - 0.25, (BANK_Z + BREAK[0]) / 2, g);
  box(6, 0.5, BREAK[1] - EAST_Z, walkMat, -113, DECK_Y - 0.25, (BREAK[1] + EAST_Z) / 2, g);
  const slab = new THREE.Group(); g.add(slab);
  slab.position.set(-113, DECK_Y, BREAK[0]);  // Drehpunkt: westliche Bruchkante
  const slabLen = BREAK[0] - BREAK[1];
  box(6, 0.5, slabLen, walkMat, 0, -0.25, -slabLen / 2, slab);
  // Geländer (Pfosten + Handlauf + Stäbe) – auch auf der Platte
  const railBits = [], slabBits = [];
  const RAIL_TOP = 1.32;
  for (let z = BANK_Z - 0.5; z > EAST_Z; z -= 1.6) {
    const onSlab = z < BREAK[0] && z > BREAK[1];
    const list = onSlab ? slabBits : railBits;
    const zz = onSlab ? z - BREAK[0] : z;
    const xx = onSlab ? RAIL_X - (-113) : RAIL_X, yy = onSlab ? 0 : DECK_Y;
    o.position.set(xx, yy + RAIL_TOP / 2, zz); o.rotation.set(0, 0, 0); o.scale.set(0.07, RAIL_TOP, 0.07); o.updateMatrix(); list.push(o.matrix.clone());
    for (let b = 1; b < 4; b++) { o.position.set(xx, yy + 0.62, zz - b * 0.4); o.scale.set(0.025, 1.2, 0.025); o.updateMatrix(); list.push(o.matrix.clone()); }
  }
  const railMat = new THREE.MeshStandardMaterial({ color: "#5d6b6a", roughness: 0.5, metalness: 0.4, flatShading: true });
  g.add(instanced(new THREE.BoxGeometry(1, 1, 1), railMat, railBits, false));
  slab.add(instanced(new THREE.BoxGeometry(1, 1, 1), railMat, slabBits, false));
  const handrail = (z0, z1, parent, x, y, zOff = 0) => box(0.09, 0.06, z0 - z1, railMat, x, y + RAIL_TOP, (z0 + z1) / 2 - zOff, parent);
  handrail(BANK_Z, BREAK[0], g, RAIL_X, DECK_Y);
  handrail(BREAK[1], EAST_Z, g, RAIL_X, DECK_Y);
  handrail(BREAK[0], BREAK[1], slab, RAIL_X + 113, 0, BREAK[0]);
  box(0.06, 0.04, L, railMat, RAIL_X, DECK_Y + 0.15, cz, g);
  // Zaun zwischen Gehweg und Gleisen (Gitter), Liebesschlösser dicht daran
  const { tex: meshTex } = canvasTexture(64, 64, (c, w, h) => {
    c.clearRect(0, 0, w, h); c.strokeStyle = "#ffffff"; c.lineWidth = 5;
    c.strokeRect(0, 0, w, h); c.beginPath(); c.moveTo(w / 2, 0); c.lineTo(w / 2, h); c.moveTo(0, h / 2); c.lineTo(w, h / 2); c.stroke();
  });
  meshTex.wrapS = meshTex.wrapT = THREE.RepeatWrapping; meshTex.repeat.set(L / 0.3, 2.2 / 0.3);
  const fenceMat = new THREE.MeshStandardMaterial({ color: "#5d6b6a", map: meshTex, alphaTest: 0.5, transparent: false, side: THREE.DoubleSide, roughness: 0.5, metalness: 0.4 });
  const fence = new THREE.Mesh(new THREE.PlaneGeometry(L, 2.2), fenceMat); fence.rotation.y = Math.PI / 2; fence.position.set(FENCE_X, DECK_Y + 1.1, cz); g.add(fence);
  box(0.1, 0.1, L, railMat, FENCE_X, DECK_Y + 2.2, cz, g);
  // Liebesschlösser
  const LOCK_COLS = ["#c9a227", "#d33a2c", "#2f6fb0", "#e8e4dc", "#3a9a5a", "#e07fb0", "#8a8f96", "#f0c419", "#7b3fa0", "#e8742a", "#b9b9b9", "#c6a15b"];
  const lockGeo = new THREE.BoxGeometry(0.045, 0.055, 0.018);
  const LOCKS = [], SLOCKS = [], lockCols = [], slockCols = [];
  for (let i = 0; i < 9000; i++) {
    const z = camZ + r.range(-150, 260);
    if (z > BANK_Z || z < EAST_Z) continue;
    o.position.set(FENCE_X + 0.05 * (r() < 0.5 ? 1 : -1), DECK_Y + 0.15 + Math.pow(r(), 0.8) * 1.95, z);
    o.rotation.set(r.range(-0.3, 0.3), Math.PI / 2 + r.range(-0.4, 0.4), r.range(-0.3, 0.3)); o.scale.setScalar(r.range(0.8, 1.6)); o.updateMatrix();
    LOCKS.push(o.matrix.clone()); lockCols.push(r.pick(LOCK_COLS));
  }
  // am Geländer, dicht bei den Händen (auf der Platte)
  for (let i = 0; i < 1400; i++) {
    const zl = -r.range(0, slabLen);
    const y = r() < 0.55 ? RAIL_TOP - 0.06 - r.range(0, 0.12) : r.range(0.2, 1.15);
    o.position.set(RAIL_X + 113 + r.range(-0.05, 0.05), y, zl);
    o.rotation.set(r.range(-0.4, 0.4), Math.PI / 2 + r.range(-0.6, 0.6), r.range(-0.5, 0.5)); o.scale.setScalar(r.range(0.9, 1.7)); o.updateMatrix();
    SLOCKS.push(o.matrix.clone()); slockCols.push(r.pick(LOCK_COLS));
  }
  for (let i = 0; i < 1600; i++) {
    const z = camZ + r.range(16, 140);
    if (z > BANK_Z) continue;
    const y = r() < 0.55 ? RAIL_TOP - 0.06 - r.range(0, 0.12) : r.range(0.2, 1.15);
    o.position.set(RAIL_X + r.range(-0.05, 0.05), DECK_Y + y, z);
    o.rotation.set(r.range(-0.4, 0.4), Math.PI / 2 + r.range(-0.6, 0.6), r.range(-0.5, 0.5)); o.scale.setScalar(r.range(0.9, 1.7)); o.updateMatrix();
    LOCKS.push(o.matrix.clone()); lockCols.push(r.pick(LOCK_COLS));
  }
  const lockMat = new THREE.MeshStandardMaterial({ roughness: 0.35, metalness: 0.55, flatShading: true });
  const lockMesh = instanced(lockGeo, lockMat, LOCKS, false); g.add(lockMesh);
  const slockMesh = instanced(lockGeo, lockMat, SLOCKS, false); slab.add(slockMesh);
  const col = new THREE.Color();
  const baseCols = lockCols.map((c) => new THREE.Color(c)), sbaseCols = slockCols.map((c) => new THREE.Color(c));
  const rustC = new THREE.Color("#6e3a1e"), rustC2 = new THREE.Color("#8a4b25");
  const lockRust = lockCols.map(() => r()), slockRust = slockCols.map(() => r());
  function rustLocks(k) {
    baseCols.forEach((c, i) => lockMesh.setColorAt(i, col.copy(c).lerp(lockRust[i] < 0.5 ? rustC : rustC2, clamp(k * 1.3 - lockRust[i] * 0.3))));
    sbaseCols.forEach((c, i) => slockMesh.setColorAt(i, col.copy(c).lerp(slockRust[i] < 0.5 ? rustC : rustC2, clamp(k * 1.3 - slockRust[i] * 0.3))));
    lockMesh.instanceColor.needsUpdate = slockMesh.instanceColor.needsUpdate = true;
  }
  rustLocks(0);
  // Schlösser fallen ab: ein Teil rutscht vom Gitter und landet auf dem Gehweg
  const _p = new THREE.Vector3(), _q = new THREE.Quaternion(), _s = new THREE.Vector3();
  const LD = LOCKS.map((m, i) => { m.decompose(_p, _q, _s); return { p: _p.clone(), q: _q.clone(), s: _s.clone(), thr: lockRust[i], floor: DECK_Y + 0.02 }; });
  const SD = SLOCKS.map((m, i) => { m.decompose(_p, _q, _s); return { p: _p.clone(), q: _q.clone(), s: _s.clone(), thr: slockRust[i], floor: 0.02 }; });
  const flatQ = new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 2, 0, 0));
  const _m = new THREE.Matrix4();
  function dropLocks(k) {
    for (const [list, mesh] of [[LD, lockMesh], [SD, slockMesh]]) {
      list.forEach((L, i) => {
        const d = L.thr < 0.7 ? clamp((k * 1.2 - L.thr) * 3) : 0;
        _p.copy(L.p); _p.y = lerp(L.p.y, L.floor, d * d);
        _p.x += d * (L.thr - 0.35) * 1.2;
        _q.copy(L.q).slerp(flatQ, d);
        _m.compose(_p, _q, L.s); mesh.setMatrixAt(i, _m);
      });
      mesh.instanceMatrix.needsUpdate = true;
    }
  }
  // Bewuchs auf Gehweg und Gleisen
  const weedsN = 900;
  const weeds = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.55, 0), new THREE.MeshStandardMaterial({ roughness: 0.9, flatShading: true }), weedsN);
  const W = [];
  for (let i = 0; i < weedsN; i++) {
    const onTrack = r() < 0.5;
    const x = onTrack ? r.range(-148, -118) : r.range(-115.6, -110.3);
    const z = camZ + r.range(-60, 140);
    W.push({ x, z, s: r.range(0.25, 1.1) * (onTrack ? 1.6 : 1), at: r.range(0, 0.7), ry: r() * 6 });
    weeds.setColorAt(i, col.set(r.pick(["#5f8a3a", "#6f9a42", "#4f7a30", "#88a050", "#3f6a2a"])));
  }
  weeds.frustumCulled = false; g.add(weeds);
  // Birken auf dem Gleisdeck
  const birch = forest(36, seed + 5, (rr) => [rr.range(-148, -119), DECK_Y - 0.3, camZ + rr.range(10, 130)]);
  g.add(birch.group);
  // Steel colours
  const steelBase = steel.color.clone(), steelRust = new THREE.Color("#7b4226");
  const railBase = railMat.color.clone();
  function age(k) {   // 0..1: Rost
    steel.color.copy(steelBase).lerp(steelRust, smooth(k));
    railMat.color.copy(railBase).lerp(new THREE.Color("#6a3a20"), smooth(k * 1.2));
    steel.metalness = lerp(0.35, 0.05, k); steel.roughness = lerp(0.6, 0.95, k);
  }
  function overgrow(k) {
    W.forEach((p, i) => {
      const f = smooth((k - p.at) / 0.3);
      o.position.set(p.x, DECK_Y + 0.05 + p.s * f * 0.45, p.z); o.rotation.set(0, p.ry, 0); o.scale.set(p.s * f + 0.001, p.s * f * 0.9 + 0.001, p.s * f + 0.001); o.updateMatrix();
      weeds.setMatrixAt(i, o.matrix);
    });
    weeds.instanceMatrix.needsUpdate = true;
    weeds.visible = k > 0.001;
  }
  overgrow(0);
  return { group: g, slab, slabLen, BREAK, RAIL_TOP, steel, age, overgrow, rustLocks, dropLocks, birch };
}

/** Kleines Vorhängeschloss (für die Hand am Ende). */
export function padlock(color = "#c9a227") {
  const g = new THREE.Group();
  const m = mat(color, { metalness: 0.6, roughness: 0.35 });
  box(0.05, 0.042, 0.018, m, 0, 0, 0, g);
  const sh = new THREE.Mesh(new THREE.TorusGeometry(0.016, 0.004, 5, 10, Math.PI), mat("#b9b9b9", { metalness: 0.8, roughness: 0.3 }));
  sh.position.y = 0.021; g.add(sh);
  return { group: g, m };
}

// =====================================================================
// Zusätze für die schnelle Fassung: Flugzeug, Rauchsäulen, Elefant, Prellbock
// =====================================================================
/** Verkehrsflugzeug, Nase zeigt nach +x. */
export function airliner() {
  const g = new THREE.Group();
  const white = mat("#f2f3f5", { roughness: 0.5 }), grey = mat("#9aa3ab"), blue = mat("#1f3a6b");
  const body = new THREE.Mesh(new THREE.CylinderGeometry(2.0, 2.0, 38, 10), white); body.rotation.z = Math.PI / 2; g.add(body);
  const nose = new THREE.Mesh(new THREE.ConeGeometry(2.0, 4, 10), white); nose.rotation.z = -Math.PI / 2; nose.position.x = 21; g.add(nose);
  const tailc = new THREE.Mesh(new THREE.ConeGeometry(2.0, 6, 10), white); tailc.rotation.z = Math.PI / 2; tailc.position.x = -22; g.add(tailc);
  box(9, 0.5, 36, grey, 1, -0.6, 0, g);                 // Tragflächen
  box(4, 0.4, 13, grey, -21, 0.6, 0, g);                // Höhenleitwerk
  box(5, 7, 0.5, blue, -21, 4, 0, g);                   // Seitenleitwerk
  for (const z of [-7, 7]) cyl(0.9, 0.9, 4, 8, grey, 3, -1.8, z, g).rotation.z = Math.PI / 2;
  return g;
}

/** Rauchsäule: puffs steigen auf. update(t, k) – k 0..1 Stärke. glow = Feuerschein am Fuß. */
export function smokeColumn(seed = 1, height = 220, width = 26, dark = false) {
  const r = rng(seed);
  const n = 46;
  const m = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 0), new THREE.MeshStandardMaterial({ color: dark ? "#262422" : "#5a5753", roughness: 1, flatShading: true, transparent: true, opacity: 0.88, depthWrite: false, emissive: new THREE.Color("#ff6a20"), emissiveIntensity: 0 }), n);
  m.frustumCulled = false;
  const P = []; for (let i = 0; i < n; i++) P.push({ ph: r(), sp: r.range(0.06, 0.11), dx: r.range(-0.5, 0.5), dz: r.range(-0.5, 0.5), s: r.range(0.7, 1.3), rot: r() * 6 });
  const fire = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 0), new THREE.MeshBasicMaterial({ color: "#ff7a2a", transparent: true, opacity: 0.9, fog: false }));
  const g = new THREE.Group(); g.add(m, fire);
  return {
    group: g,
    update(t, k, night = 0) {
      g.visible = k > 0.002;
      P.forEach((p, i) => {
        const a = ((t * p.sp + p.ph) % 1 + 1) % 1;
        const h = a * height * k;
        const w = width * (0.35 + a * 1.4) * p.s * Math.sqrt(k);
        o.position.set(p.dx * width + a * a * height * 0.35, h, p.dz * width);
        o.rotation.set(p.rot, p.rot + a, 0); o.scale.setScalar(w * (a < 0.08 ? a / 0.08 : 1) * (a > 0.85 ? (1 - a) / 0.15 : 1));
        o.updateMatrix(); m.setMatrixAt(i, o.matrix);
      });
      m.instanceMatrix.needsUpdate = true;
      fire.scale.set(width * 0.7 * k, width * 0.9 * k, width * 0.7 * k); fire.position.y = width * 0.6 * k;
      m.material.emissiveIntensity = 0.35 * night;
      fire.material.opacity = 0.35 + 0.6 * night;
      fire.visible = k > 0.05;
    },
  };
}

/** Elefant (Front nach +z). update(phase). */
export function elephant(scale = 1) {
  const g = new THREE.Group();
  const skin = mat("#8c8a86"), dark = mat("#6e6c68"), tusk = mat("#efe8d8");
  const S = scale;
  box(1.5 * S, 1.6 * S, 2.8 * S, skin, 0, 2.3 * S, 0, g);
  const head = new THREE.Group(); head.position.set(0, 2.6 * S, 1.6 * S); g.add(head);
  box(1.2 * S, 1.2 * S, 1.0 * S, skin, 0, 0, 0.1 * S, head);
  for (const sx of [-1, 1]) { const e = box(0.12 * S, 1.1 * S, 0.9 * S, dark, sx * 0.72 * S, 0, -0.1 * S, head); e.rotation.y = sx * 0.35; }
  const trunk = new THREE.Group(); trunk.position.set(0, -0.3 * S, 0.6 * S); head.add(trunk);
  box(0.32 * S, 1.5 * S, 0.32 * S, skin, 0, -0.75 * S, 0, trunk);
  for (const sx of [-1, 1]) { const tk = box(0.1 * S, 0.1 * S, 0.6 * S, tusk, sx * 0.3 * S, -0.45 * S, 0.75 * S, head); tk.rotation.x = 0.5; }
  const legs = [];
  for (const [x, z] of [[-0.5, 0.95], [0.5, 0.95], [-0.5, -0.95], [0.5, -0.95]]) {
    const p = new THREE.Group(); p.position.set(x * S, 1.6 * S, z * S); g.add(p);
    box(0.45 * S, 1.6 * S, 0.45 * S, skin, 0, -0.8 * S, 0, p); legs.push(p);
  }
  const tail = box(0.08 * S, 0.8 * S, 0.08 * S, dark, 0, 2.2 * S, -1.45 * S, g); tail.rotation.x = 0.3;
  g.traverse((m) => { if (m.isMesh) m.castShadow = true; });
  return {
    group: g,
    update(ph) {
      legs.forEach((l, i) => { l.rotation.x = Math.sin(ph + (i === 0 || i === 3 ? 0 : Math.PI)) * 0.28; });
      trunk.rotation.x = 0.25 + Math.sin(ph * 0.5) * 0.25;
      head.rotation.y = Math.sin(ph * 0.25) * 0.08;
    },
  };
}

/** Prellbock (rot-weiß), Front nach −z. */
export function bufferStop() {
  const g = new THREE.Group();
  box(2.6, 1.3, 1.2, mat("#3a3a3c"), 0, 0.65, 0, g);
  box(2.8, 0.5, 0.25, mat("#d8282a"), 0, 1.25, -0.7, g);
  for (const x of [-0.75, 0.75]) cyl(0.18, 0.18, 0.6, 8, mat("#c9c9c9"), x, 1.25, -0.95, g).rotation.x = Math.PI / 2;
  box(0.9, 0.9, 0.06, mat("#f2f2f2"), 0, 2.3, -0.6, g);
  box(0.5, 0.5, 0.07, mat("#d8282a"), 0, 2.3, -0.62, g);
  cyl(0.06, 0.06, 1.6, 6, mat("#555"), 0, 1.4, -0.55, g);
  return g;
}
