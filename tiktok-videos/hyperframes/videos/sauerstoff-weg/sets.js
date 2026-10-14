// Sets nur für "sauerstoff-weg": Oberbaumbrücke, U1-Zug, Ausflugsdampfer, Spree,
// Ufer mit Kaimauer, Grill, Flammen, Club-Mate-Flasche, Feuerzeug, Bäume.
// Alles Low-Poly, flat shading, deterministisch (nur rng(seed) und t).
import { THREE, rng, building, windowTextures } from "./lib/lowpoly.js";
import { mat, basic, box, cyl, canvasTexture } from "./lib/props.js";

// ------------------------------------------------------------ Geometrie ---
// Koordinaten: Spree läuft entlang z, Wasser x ∈ [-RIVER, RIVER], Wasserspiegel WATER_Y.
// Ufer (Boden) liegt bei y = 0. Brücke kreuzt bei z = BRIDGE_Z entlang x.
export const RIVER = 60;
export const WATER_Y = -1.5;
export const BRIDGE_Z = -140;
export const DECK_Y = 8;        // Fahrbahn
export const TRACK_Y = 14.2;    // Oberkante U-Bahn-Gleis
export const BRIDGE_HALF = 95;  // halbe Brückenlänge

const BRICK = "#a24a30";
const BRICK_DARK = "#7e3523";

function archShape(len, bottom, top, arches, archW, springY, holeExtra = 0) {
  const s = new THREE.Shape();
  s.moveTo(-len / 2, bottom); s.lineTo(len / 2, bottom); s.lineTo(len / 2, top); s.lineTo(-len / 2, top); s.lineTo(-len / 2, bottom);
  for (const cx of arches) {
    const h = new THREE.Path();
    const r = archW / 2;
    h.moveTo(cx - r, bottom - holeExtra);
    h.lineTo(cx - r, springY);
    h.absarc(cx, springY, r, Math.PI, 0, true);
    h.lineTo(cx + r, bottom - holeExtra);
    h.lineTo(cx - r, bottom - holeExtra);
    s.holes.push(h);
  }
  return s;
}

/** Oberbaumbrücke: Backstein-Bögen, Fahrbahn, Arkaden-Viadukt der U1, zwei Türme mit Zinnen. */
export function oberbaumbruecke() {
  const g = new THREE.Group();
  const brick = mat(BRICK, { roughness: 0.95 });
  const dark = mat(BRICK_DARK, { roughness: 0.95 });
  const stone = mat("#c9b9a0");
  // Unterbau mit 7 Flussbögen
  const arches = []; for (let i = -3; i <= 3; i++) arches.push(i * 17);
  const lower = new THREE.ExtrudeGeometry(archShape(BRIDGE_HALF * 2, WATER_Y - 1, DECK_Y, arches, 12.5, 1.8), { depth: 22, bevelEnabled: false, curveSegments: 5 });
  lower.translate(0, 0, -11);
  const lowerMesh = new THREE.Mesh(lower, brick); lowerMesh.castShadow = lowerMesh.receiveShadow = true; g.add(lowerMesh);
  // Gesims + Fahrbahn
  box(BRIDGE_HALF * 2, 0.5, 23, stone, 0, DECK_Y + 0.05, 0, g);
  box(BRIDGE_HALF * 2, 0.06, 13, mat("#4a4a4c"), 0, DECK_Y + 0.33, 3.5, g);
  // Brüstung zur Kamera hin (niedrig, damit Autos sichtbar bleiben)
  box(BRIDGE_HALF * 2, 0.22, 0.3, brick, 0, DECK_Y + 0.4, 11.3, g);
  // Arkaden-Viadukt der U1 auf der Rückseite
  const arc = []; for (let x = -BRIDGE_HALF + 4; x <= BRIDGE_HALF - 4; x += 5.2) arc.push(x);
  const upper = new THREE.ExtrudeGeometry(archShape(BRIDGE_HALF * 2, DECK_Y + 0.3, TRACK_Y - 0.4, arc, 3.2, DECK_Y + 3.4, 0.01), { depth: 6, bevelEnabled: false, curveSegments: 3 });
  upper.translate(0, 0, -9);
  const upperMesh = new THREE.Mesh(upper, brick); upperMesh.castShadow = true; g.add(upperMesh);
  box(BRIDGE_HALF * 2, 0.4, 7, stone, 0, TRACK_Y - 0.2, -6, g);
  // Gleise
  for (const z of [-7.4, -4.6]) box(BRIDGE_HALF * 2, 0.12, 1.5, mat("#3a3530"), 0, TRACK_Y + 0.06, z, g);
  // Gotische Zinnen auf der Arkade
  for (let x = -BRIDGE_HALF + 1; x < BRIDGE_HALF; x += 2.6) box(1.2, 0.8, 0.5, brick, x, TRACK_Y + 0.4, -2.8, g);
  // Zwei Türme in der Mitte
  for (const sx of [-1, 1]) {
    const t = new THREE.Group();
    box(6, 30, 6, brick, 0, 15, 0, t);
    box(6.6, 0.8, 6.6, stone, 0, 24, 0, t);
    // Zinnenkranz + Ecktürmchen
    for (let k = -2; k <= 2; k++) for (const [ax, az] of [[k * 1.3, 3.1], [k * 1.3, -3.1], [3.1, k * 1.3], [-3.1, k * 1.3]]) box(0.7, 1.2, 0.7, brick, ax, 30.6, az, t);
    for (const cx of [-2.9, 2.9]) for (const cz of [-2.9, 2.9]) {
      cyl(0.9, 0.9, 5, 6, brick, cx, 31, cz, t);
      const cap = new THREE.Mesh(new THREE.ConeGeometry(1.1, 2.6, 6), dark); cap.position.set(cx, 34.8, cz); t.add(cap);
    }
    // Spitzbogenfenster (dunkle Schlitze) auf der Vorderseite
    for (const y of [17, 21, 26]) box(1.2, 2.6, 0.1, mat("#2a1d18"), 0, y, 3.02, t);
    t.position.set(sx * 9, DECK_Y - 1, -6);
    g.add(t);
  }
  // Uferpfeiler-Türmchen an den Brückenenden
  for (const sx of [-1, 1]) for (const z of [-10, 10]) { cyl(1.4, 1.6, 6, 8, brick, sx * 62, DECK_Y + 2.8, z, g); const c = new THREE.Mesh(new THREE.ConeGeometry(1.7, 2.4, 8), dark); c.position.set(sx * 62, DECK_Y + 7, z); g.add(c); }
  // Viadukt läuft an Land weiter
  for (const sx of [-1, 1]) {
    box(140, TRACK_Y, 7, brick, sx * (BRIDGE_HALF + 70), TRACK_Y / 2, -6, g);
    box(140, 0.4, 7, stone, sx * (BRIDGE_HALF + 70), TRACK_Y - 0.2, -6, g);
  }
  g.position.z = BRIDGE_Z;
  return { group: g };
}

/** Gelber U1-Zug (Kleinprofil) aus zwei Wagen, Länge ≈ 27 m, fährt entlang x. */
export function u1Train() {
  const g = new THREE.Group();
  const yellow = mat("#f3c21b", { roughness: 0.55 });
  const glass = new THREE.MeshStandardMaterial({ color: "#2b2a28", emissive: new THREE.Color("#ffd9a0"), emissiveIntensity: 0.55, roughness: 0.3, flatShading: true });
  const darkm = mat("#262626");
  for (let k = 0; k < 2; k++) {
    const x = k * 13.6;
    box(13.2, 2.9, 2.3, yellow, x, 1.75, 0, g);
    box(12.6, 0.9, 2.34, glass, x, 2.25, 0, g);
    box(13.2, 0.25, 2.2, mat("#d9d4c8"), x, 3.3, 0, g);
    for (const dx of [-4.5, 4.5]) box(1.8, 0.5, 2.0, darkm, x + dx, 0.35, 0, g);
  }
  // Stirnfenster
  box(0.1, 0.9, 1.8, glass, -6.65, 2.3, 0, g);
  box(0.1, 0.9, 1.8, glass, 13.6 + 6.65, 2.3, 0, g);
  return g;
}

/** Ausflugsdampfer (weiß-blau), Bug zeigt nach +z. */
export function steamer(seed = 7) {
  const r = rng(seed);
  const g = new THREE.Group();
  const white = mat("#eeeae0"), blue = mat("#244a7a"), dark = mat("#262a30");
  const glass = new THREE.MeshStandardMaterial({ color: "#2d3b48", emissive: new THREE.Color("#ffd7a0"), emissiveIntensity: 0.4, roughness: 0.25, flatShading: true });
  box(7, 2.0, 30, white, 0, 0.4, 0, g);
  box(7.05, 0.6, 30.05, blue, 0, -0.3, 0, g);
  const bow = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 3.5, 5, 3, 1), white); bow.rotation.x = Math.PI / 2; bow.rotation.y = 0; bow.position.set(0, 0.4, 17.4); bow.scale.set(1, 1, 0.55); g.add(bow);
  box(6, 2.2, 20, white, 0, 2.5, -2, g);
  box(6.05, 1.0, 19.6, glass, 0, 2.7, -2, g);
  box(6.4, 0.2, 21, mat("#c9c3b5"), 0, 3.7, -2, g);
  // Sonnendeck: Geländer, Sonnenschirme
  box(6.4, 0.6, 0.08, white, 0, 4.1, 8.4, g);
  for (const sx of [-1, 1]) box(0.08, 0.6, 21, white, sx * 3.2, 4.1, -2, g);
  for (let i = 0; i < 3; i++) {
    cyl(0.04, 0.04, 2, 4, mat("#ddd"), 0, 4.8, -9 + i * 6, g);
    const um = new THREE.Mesh(new THREE.ConeGeometry(1.6, 0.7, 6), mat(r.pick(["#c0392b", "#f2f0ea", "#2f6f9f"]))); um.position.set(0, 5.9, -9 + i * 6); g.add(um);
  }
  // Schornstein
  const stack = cyl(0.55, 0.65, 2.2, 8, mat("#e9e6dd"), 0, 4.9, -10.5, g);
  box(1.12, 0.4, 1.12, dark, 0, 6.0, -10.5, g);
  g.userData.stackTop = new THREE.Vector3(0, 6.3, -10.5);
  return g;
}

/** Spree als unterteilte Fläche; update(t, fn) setzt die Höhe pro Vertex. */
export function river(len = 2000, segX = 40, segZ = 260) {
  const geo = new THREE.PlaneGeometry(RIVER * 2 + 4, len, segX, segZ);
  geo.rotateX(-Math.PI / 2);
  geo.translate(0, WATER_Y, -300);
  const base = geo.attributes.position.array.slice();
  const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: "#5a8698", roughness: 0.25, metalness: 0.12, flatShading: true }));
  m.receiveShadow = true;
  return {
    mesh: m,
    update(fn) {
      const p = geo.attributes.position.array;
      for (let i = 0; i < p.length; i += 3) p[i + 1] = WATER_Y + fn(base[i], base[i + 2]);
      geo.attributes.position.needsUpdate = true;
      geo.computeVertexNormals();
    },
  };
}

/** Ufer: Kaimauern, Gehweg/Wiese, Häuser auf beiden Seiten, Bäume. */
export function banks(seed = 301) {
  const r = rng(seed);
  const g = new THREE.Group();
  const quay = mat("#8e877b"), pave = mat("#b9b1a2"), grass = mat("#6f8a45");
  for (const sx of [-1, 1]) {
    box(6, 6, 2000, quay, sx * (RIVER + 3), -3, -300, g);          // Kaimauer
    box(0.9, 0.3, 2000, mat("#a49c8f"), sx * (RIVER + 0.45), 0.12, -300, g); // Kante
    box(14, 0.2, 2000, pave, sx * (RIVER + 7), -0.1, -300, g);     // Uferweg
    box(200, 0.2, 2000, grass, sx * (RIVER + 114), -0.12, -300, g); // Wiese/Hinterland
  }
  // Häuser (Kreuzberg gegenüber, Friedrichshain hinter dir)
  const texs = [windowTextures(311, "altbau"), windowTextures(312, "altbau"), windowTextures(313, "plattenbau")];
  const houses = [];
  for (const sx of [-1, 1]) {
    for (let i = 0; i < 44; i++) {
      const z = 600 - i * 32 + r.range(-3, 3);
      if (Math.abs(z - BRIDGE_Z) < 22) continue;
      const b = building({ w: 16, h: r.range(16, 24), d: 30, color: r.pick(["#d9c7a8", "#c8b59a", "#e3d6c0", "#b8a48c", "#cfc2b3"]), tex: r.pick(texs) });
      b.mesh.position.set(sx * (RIVER + r.range(30, 38)), 0, z);
      g.add(b.mesh); houses.push(b);
    }
  }
  // Bäume entlang der Ufer
  const leaf = mat("#4f7a38"), leaf2 = mat("#5f8a3f"), trunk = mat("#5a4433");
  const trees = [];
  for (const sx of [-1, 1]) for (let i = 0; i < 56; i++) {
    const z = 500 - i * 22 + r.range(-4, 4);
    if (Math.abs(z - BRIDGE_Z) < 16) continue;
    const x = sx * (RIVER + r.range(9, 15));
    if (sx > 0 && z > -80 && z < 20 && x < RIVER + 12) continue; // freie Sicht am Kamerastandort
    const t = new THREE.Group();
    cyl(0.25, 0.35, 4, 5, trunk, 0, 2, 0, t);
    const crown = new THREE.Mesh(new THREE.IcosahedronGeometry(r.range(2.6, 3.6), 0), r() < 0.5 ? leaf : leaf2);
    crown.position.y = 5.6; crown.castShadow = true; t.add(crown);
    t.position.set(x, 0, z); g.add(t); trees.push({ group: t, crown, ph: r() * 6 });
  }
  return { group: g, houses, trees };
}

/** Kugelgrill mit Glut, Rost, Würstchen. */
export function grill() {
  const g = new THREE.Group();
  const black = mat("#1c1c1e", { roughness: 0.5, metalness: 0.3 });
  const bowl = new THREE.Mesh(new THREE.SphereGeometry(0.3, 10, 6, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), black);
  bowl.position.y = 0.72; g.add(bowl);
  for (let k = 0; k < 3; k++) { const a = k / 3 * Math.PI * 2; const l = cyl(0.015, 0.015, 0.75, 4, mat("#888"), Math.cos(a) * 0.2, 0.37, Math.sin(a) * 0.2, g); l.rotation.set(Math.sin(a) * 0.25, 0, -Math.cos(a) * 0.25); }
  const ember = new THREE.MeshStandardMaterial({ color: "#3a1a10", emissive: new THREE.Color("#ff5a1a"), emissiveIntensity: 1.6, flatShading: true });
  const coals = cyl(0.26, 0.26, 0.04, 10, ember, 0, 0.68, 0, g);
  cyl(0.29, 0.29, 0.01, 12, mat("#9a9a9a", { metalness: 0.6, wireframe: true }), 0, 0.73, 0, g);
  const sausages = [];
  for (let k = 0; k < 4; k++) { const s = cyl(0.022, 0.022, 0.18, 6, mat("#a5502a"), -0.12 + k * 0.08, 0.75, 0.02, g); s.rotation.x = Math.PI / 2; sausages.push(s); }
  return { group: g, ember, coals };
}

/** Flamme aus zwei Kegeln (außen orange, innen gelb). Ursprung am Fuß. */
export function flame(size = 1) {
  const g = new THREE.Group();
  const outer = new THREE.Mesh(new THREE.ConeGeometry(0.5, 1.6, 6), basic("#ff7a1c", { transparent: true, opacity: 0.85, depthWrite: false }));
  outer.position.y = 0.8;
  const inner = new THREE.Mesh(new THREE.ConeGeometry(0.28, 1.0, 6), basic("#ffe48a", { transparent: true, opacity: 0.95, depthWrite: false }));
  inner.position.y = 0.5;
  g.add(outer, inner);
  g.scale.setScalar(size);
  g.userData.base = size;
  return g;
}

/** Club-Mate-artige Flasche (braunes Glas, helles Etikett, ohne Schriftzug). */
export function mateBottle() {
  const g = new THREE.Group();
  const glass = mat("#5a2e12", { roughness: 0.25, metalness: 0.1, transparent: true, opacity: 0.95 });
  cyl(0.033, 0.033, 0.15, 10, glass, 0, 0, 0, g);
  cyl(0.014, 0.033, 0.06, 10, glass, 0, 0.105, 0, g);
  cyl(0.013, 0.013, 0.045, 8, glass, 0, 0.155, 0, g);
  cyl(0.0145, 0.0145, 0.012, 8, mat("#d8d4c8", { metalness: 0.6, roughness: 0.3 }), 0, 0.182, 0, g);
  cyl(0.0335, 0.0335, 0.07, 10, mat("#f0e6c8"), 0, -0.01, 0, g);
  cyl(0.034, 0.034, 0.018, 10, mat("#1f3c78"), 0, 0.012, 0, g);
  return g;
}

/** Einwegfeuerzeug mit Flamme. */
export function lighter() {
  const g = new THREE.Group();
  box(0.024, 0.075, 0.012, mat("#c0392b", { roughness: 0.4 }), 0, 0, 0, g);
  box(0.022, 0.014, 0.012, mat("#b9bcc0", { metalness: 0.7, roughness: 0.3 }), 0, 0.044, 0, g);
  const f = flame(0.01); f.position.set(0, 0.052, 0); g.add(f);
  g.userData.flame = f;
  return g;
}

/** Teelicht im Glas. */
export function tealight() {
  const g = new THREE.Group();
  cyl(0.045, 0.04, 0.08, 8, mat("#e8eef0", { transparent: true, opacity: 0.45, roughness: 0.1 }), 0, 0.04, 0, g);
  cyl(0.03, 0.03, 0.015, 8, mat("#f4f1ea"), 0, 0.01, 0, g);
  const f = flame(0.022); f.position.y = 0.02; g.add(f);
  g.userData.flame = f;
  return g;
}

/** Weiche Rauch-/Dunst-Textur (Kreis-Verlauf). */
export function puffTexture() {
  const { tex } = canvasTexture(64, 64, (x, w) => {
    const grd = x.createRadialGradient(32, 32, 0, 32, 32, 32);
    grd.addColorStop(0, "rgba(255,255,255,0.9)"); grd.addColorStop(0.5, "rgba(255,255,255,0.35)"); grd.addColorStop(1, "rgba(255,255,255,0)");
    x.fillStyle = grd; x.fillRect(0, 0, w, w);
  });
  return tex;
}
