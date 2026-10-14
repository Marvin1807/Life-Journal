// Sets und Requisiten nur für "wal-geschluckt" (lib/ bleibt unverändert).
// Meeresgrund vor Cape Cod, Buckelwal (Low-Poly, Maul klappbar), Maul von innen, Meeresoberfläche.
// Alles deterministisch: Zufall nur über rng(seed), Bewegung nur über t.
import { THREE, rng, clamp, smooth, lerp } from "./lib/lowpoly.js";
import { hand, mat, basic, box, cyl, canvasTexture } from "./lib/props.js";

const o3 = new THREE.Object3D();
const keyLerp = (keys, x) => {           // keys: [[x, v], ...] (linear, v Zahl oder Array)
  if (x <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    if (x <= keys[i][0]) {
      const k = (x - keys[i - 1][0]) / (keys[i][0] - keys[i - 1][0]);
      const a = keys[i - 1][1], b = keys[i][1];
      return Array.isArray(a) ? a.map((v, j) => lerp(v, b[j], k)) : lerp(a, b, k);
    }
  }
  return keys[keys.length - 1][1];
};

// ------------------------------------------------------- Neopren-Hand ---
export function gloveHand(side = 1) {
  const g = hand(side, "#1b2a33");
  const neo = mat("#22262b", { roughness: 0.75 });
  g.traverse((o) => {
    if (o.isMesh && o.material.color && o.material.color.getHexString() === "e9b892") o.material = neo;
  });
  // blaue Naht am Handgelenk
  box(0.1, 0.09, 0.012, mat("#2f7fb8"), 0, 0, 0.06, g);
  return g;
}

// ------------------------------------------------------------ Hummer ---
// Lebende Hummer sind dunkel grünbraun (rot werden sie erst beim Kochen).
export function lobster(seed = 1) {
  const r = rng(seed);
  const g = new THREE.Group();
  const shell = mat(r() < 0.5 ? "#3e3a26" : "#4a3a24", { roughness: 0.6 });
  const accent = mat("#7a4a28", { roughness: 0.6 });
  box(0.07, 0.06, 0.14, shell, 0, 0.04, 0.02, g);                      // Panzer
  for (let i = 0; i < 5; i++) box(0.062 - i * 0.006, 0.04, 0.035, shell, 0, 0.035, -0.07 - i * 0.032, g); // Schwanz
  box(0.1, 0.012, 0.04, accent, 0, 0.03, -0.24, g);                    // Schwanzfächer
  for (const s of [-1, 1]) {
    const arm = new THREE.Group(); arm.position.set(0.03 * s, 0.045, 0.08); arm.rotation.y = 0.35 * s; g.add(arm);
    box(0.025, 0.025, 0.09, shell, 0, 0, 0.045, arm);
    const claw = new THREE.Group(); claw.position.set(0, 0, 0.09); claw.rotation.y = -0.25 * s; arm.add(claw);
    box(0.055, 0.035, 0.11, shell, 0, 0, 0.055, claw);
    box(0.02, 0.02, 0.06, accent, 0.012 * s, 0, 0.13, claw);
    for (let k = 0; k < 3; k++) {                                         // Beine
      const leg = box(0.008, 0.008, 0.08, accent, 0.05 * s, 0.015, 0.03 - k * 0.035, g);
      leg.rotation.set(0.6, 1.2 * s, 0.4 * s);
    }
    const ant = cyl(0.003, 0.003, 0.3, 4, accent, 0.015 * s, 0.07, 0.25, g);
    ant.rotation.set(1.2, 0, -0.35 * s);
  }
  g.traverse((o) => { if (o.isMesh) { o.castShadow = false; o.receiveShadow = false; } });
  return g;
}

// -------------------------------------------------------- Fangnetz ---
export function catchBag() {
  const g = new THREE.Group();
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.075, 0.008, 5, 14), mat("#c9c3b6", { metalness: 0.4, roughness: 0.4 }));
  ring.rotation.x = Math.PI / 2; g.add(ring);
  const netGeo = new THREE.SphereGeometry(0.1, 8, 6, 0, Math.PI * 2, Math.PI * 0.35, Math.PI * 0.65);
  netGeo.scale(0.85, 1.6, 0.85); netGeo.translate(0, 0.07, 0);
  const net = new THREE.Mesh(netGeo, new THREE.MeshStandardMaterial({ color: "#d8c84a", wireframe: true }));
  g.add(net);
  const lob = lobster(7); lob.scale.setScalar(0.62); lob.rotation.set(-1.25, 0.4, 0.2); lob.position.set(0, -0.1, 0.0); g.add(lob);
  return g;
}

// ---------------------------------------------------- Lichtstrahlen-Textur ---
function rayTexture() {
  const { tex } = canvasTexture(64, 256, (c, w, h) => {
    const grd = c.createLinearGradient(0, 0, 0, h);
    grd.addColorStop(0, "rgba(255,255,255,0.9)"); grd.addColorStop(0.6, "rgba(255,255,255,0.35)"); grd.addColorStop(1, "rgba(255,255,255,0)");
    c.fillStyle = grd; c.fillRect(0, 0, w, h);
    const side = c.createLinearGradient(0, 0, w, 0);
    side.addColorStop(0, "rgba(0,0,0,1)"); side.addColorStop(0.5, "rgba(0,0,0,0)"); side.addColorStop(1, "rgba(0,0,0,1)");
    c.globalCompositeOperation = "destination-out"; c.fillStyle = side; c.fillRect(0, 0, w, h);
  });
  return tex;
}

// ====================================================== Meeresgrund (Akt 1) ===
// Sandiger Schelf bei y ≈ −15,6 (z > −8), dahinter fällt der Grund in die Tiefe ab.
export function floorY(x, z) {
  const n = Math.sin(x * 0.7 + z * 0.3) * 0.18 + Math.sin(x * 0.23 - z * 0.61) * 0.25;
  const drop = smooth(clamp((-z - 1.5) / 9));
  return -15.6 + n - drop * 34 + Math.sin(x * 0.15) * drop * 3;
}
export function seabed({ seed = 611 } = {}) {
  const r = rng(seed);
  const g = new THREE.Group();
  const geo = new THREE.PlaneGeometry(140, 140, 70, 70); geo.rotateX(-Math.PI / 2);
  const p = geo.attributes.position;
  const cols = new Float32Array(p.count * 3); const c = new THREE.Color();
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), z = p.getZ(i) - 30;
    p.setZ(i, z);
    const y = floorY(x, z);
    p.setY(i, y);
    c.set(y > -17 ? "#b9a77c" : "#7d7556").lerp(new THREE.Color("#8f8565"), r() * 0.5);
    cols.set([c.r, c.g, c.b], i * 3);
  }
  geo.setAttribute("color", new THREE.BufferAttribute(cols, 3));
  geo.computeVertexNormals();
  g.add(new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, flatShading: true })));
  // Steine
  const rockMat = mat("#5d6058");
  for (let i = 0; i < 70; i++) {
    const x = r.range(-14, 14), z = r.range(-24, 9);
    const rock = new THREE.Mesh(new THREE.IcosahedronGeometry(r.range(0.2, 1.1), 0), rockMat);
    rock.position.set(x, floorY(x, z) + 0.1, z); rock.rotation.set(r() * 3, r() * 3, 0); rock.scale.y = r.range(0.5, 0.9);
    g.add(rock);
  }
  // großer Fels mit Hummer davor
  const big = new THREE.Mesh(new THREE.IcosahedronGeometry(0.9, 0), mat("#565a52")); big.scale.set(1.3, 0.7, 1); big.position.set(1.5, -15.4, 0.2); g.add(big);
  const lobs = [];
  [[0.4, 1.5, 0.4, 3], [-1.0, 0.4, -0.6, 5], [2.3, -0.4, 2.6, 9]].forEach(([x, z, ry, s]) => {
    const l = lobster(s); l.position.set(x, floorY(x, z) + 0.02, z); l.rotation.y = ry; l.scale.setScalar(1.25); g.add(l); lobs.push(l);
  });
  // Seegras / Tang
  const W = 420;
  const weedGeo = new THREE.BoxGeometry(0.025, 1, 0.01); weedGeo.translate(0, 0.5, 0);
  const weeds = new THREE.InstancedMesh(weedGeo, mat("#4c7a3a", { side: THREE.DoubleSide }), W);
  const wd = [];
  for (let i = 0; i < W; i++) { const x = r.range(-10, 10), z = r.range(-3, 9); wd.push({ x, z, y: floorY(x, z), h: r.range(0.15, 0.6), ph: r() * 6, ry: r() * 3 }); }
  const wc = new THREE.Color();
  wd.forEach((w, i) => weeds.setColorAt(i, wc.set(r.pick(["#6d9a4a", "#7daa4c", "#8b9a42", "#5f8a4a"]))));
  g.add(weeds);
  // Lichtstrahlen von oben
  const rayTex = rayTexture();
  const rays = [];
  for (let i = 0; i < 16; i++) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(r.range(0.8, 2.2), 26), new THREE.MeshBasicMaterial({ map: rayTex, color: "#d8fff0", transparent: true, opacity: r.range(0.07, 0.16), blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false }));
    m.geometry.translate(0, -13, 0);
    m.position.set(r.range(-12, 12), 0, r.range(-22, 4)); m.rotation.z = 0.18 + r.range(-0.05, 0.05);
    g.add(m); rays.push({ m, ph: r() * 6, base: m.material.opacity });
  }
  // Schwebeteilchen
  const SN = 900;
  const snowPos = new Float32Array(SN * 3);
  for (let i = 0; i < SN; i++) snowPos.set([r.range(-10, 10), r.range(-19, -9), r.range(-16, 6)], i * 3);
  const snowGeo = new THREE.BufferGeometry(); snowGeo.setAttribute("position", new THREE.BufferAttribute(snowPos, 3));
  const snow = new THREE.Points(snowGeo, new THREE.PointsMaterial({ color: "#e6f4ec", size: 0.035, transparent: true, opacity: 0.7 }));
  g.add(snow);
  return {
    group: g, lobsters: lobs,
    update(t, camPos) {
      wd.forEach((w, i) => {
        o3.position.set(w.x, w.y, w.z); o3.rotation.set(Math.sin(t * 0.9 + w.ph) * 0.18, w.ry, Math.sin(t * 0.7 + w.ph) * 0.12);
        o3.scale.set(1, w.h, 1); o3.updateMatrix(); weeds.setMatrixAt(i, o3.matrix);
      });
      weeds.instanceMatrix.needsUpdate = true;
      rays.forEach((ray) => {
        ray.m.rotation.y = Math.atan2(camPos.x - ray.m.position.x, camPos.z - ray.m.position.z);
        ray.m.material.opacity = ray.base * (0.75 + 0.25 * Math.sin(t * 0.8 + ray.ph));
      });
      snow.position.set(Math.sin(t * 0.2) * 0.3, Math.sin(t * 0.13) * 0.2, 0);
    },
    setRays(k) { rays.forEach((ray) => { ray.m.visible = k > 0.01; ray.m.material.opacity = ray.base * k; }); },
  };
}

// ------------------------------------------------------------ Fischschwarm ---
// Mühlrad-Schwarm um center; agit (0..1) macht ihn schneller und enger, flee (0..1) sprengt ihn.
export function fishSchool(n = 260, seed = 621) {
  const r = rng(seed);
  const geo = new THREE.ConeGeometry(0.035, 0.2, 4); geo.rotateX(-Math.PI / 2); geo.scale(0.6, 1, 1);
  const mesh = new THREE.InstancedMesh(geo, new THREE.MeshStandardMaterial({ color: "#c9d6d8", metalness: 0.55, roughness: 0.35, flatShading: true }), n);
  const F = [];
  for (let i = 0; i < n; i++) {
    const a = r() * 6.28, el = r.range(-1, 1);
    F.push({ ph: r() * 6.28, rad: r.range(0.8, 3.2), dy: r.range(-1.2, 1.2), w: r.range(0.35, 0.55), fx: Math.cos(a) * Math.sqrt(1 - el * el), fy: el * 0.6 + 0.4, fz: Math.sin(a) * Math.sqrt(1 - el * el), fs: r.range(3, 7), s: r.range(0.8, 1.3) });
  }
  const p0 = new THREE.Vector3(), p1 = new THREE.Vector3();
  const pos = (f, t, center, agit, flee, out) => {
    const tight = lerp(1, 0.65, agit);
    const ang = f.ph + t * f.w * (1 + agit * 1.6);
    out.set(center.x + Math.cos(ang) * f.rad * tight, center.y + f.dy * tight + Math.sin(ang * 2 + f.ph) * 0.15, center.z + Math.sin(ang) * f.rad * tight);
    if (flee > 0) out.add(o3.position.set(f.fx, f.fy, f.fz).multiplyScalar(flee * f.fs));
    return out;
  };
  return {
    mesh,
    update(t, center, agit, flee) {
      for (let i = 0; i < n; i++) {
        const f = F[i];
        pos(f, t, center, agit, flee, p0); pos(f, t + 0.05, center, agit, flee + 0.012, p1);
        o3.position.copy(p0); o3.lookAt(p1); o3.scale.setScalar(f.s * (flee > 2.5 ? 0 : 1));
        o3.updateMatrix(); mesh.setMatrixAt(i, o3.matrix);
      }
      mesh.instanceMatrix.needsUpdate = true;
    },
  };
}

// ---------------------------------------------------------------- Krill ---
export function krillCloud(n = 1400, seed = 631, box3 = [-6, 6, -20, -9, -18, 0]) {
  const r = rng(seed);
  const pos = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) pos.set([r.range(box3[0], box3[1]), r.range(box3[2], box3[3]), r.range(box3[4], box3[5])], i * 3);
  const geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  const pts = new THREE.Points(geo, new THREE.PointsMaterial({ color: "#f0a07a", size: 0.05, transparent: true, opacity: 0.85 }));
  return { points: pts, setDensity(k) { geo.setDrawRange(0, Math.floor(n * clamp(k))); } };
}

// ============================================================== Buckelwal ===
// Kopf zeigt nach +z (Schnauze bei z ≈ 7,2), Schwanz bei −7. Gesamtlänge ≈ 14 m.
// setMouth(open 0..1, throat 0..1): Unterkiefer klappt auf, Kehlfalten dehnen sich.
const PROF = [   // z, a (halbe Breite), bU (oben), bL (unten), yc
  [-7.1, [0.2, 0.26, 0.26, 0.0]],
  [-5.6, [0.42, 0.6, 0.55, 0.05]],
  [-3.6, [0.92, 1.08, 0.98, 0.1]],
  [-1.5, [1.38, 1.32, 1.32, 0.1]],
  [0.5, [1.58, 1.34, 1.55, 0.05]],
  [2.4, [1.64, 1.1, 1.72, 0.15]],
  [4.0, [1.45, 0.74, 1.52, 0.2]],
  [5.5, [1.1, 0.5, 1.02, 0.2]],
  [6.6, [0.66, 0.3, 0.55, 0.16]],
  [7.25, [0.18, 0.12, 0.14, 0.1]],
];
export const WHALE_HINGE = 2.3;
const prof = (z) => keyLerp(PROF, z);

function shellGeo(z0, z1, nz, th0, th1, nA, colorFn) {
  const pos = [], col = [], idx = [];
  const c = new THREE.Color();
  for (let i = 0; i <= nz; i++) {
    const z = lerp(z0, z1, i / nz);
    const [a, bU, bL, yc] = prof(z);
    for (let j = 0; j <= nA; j++) {
      const th = lerp(th0, th1, j / nA);
      const s = Math.sin(th);
      pos.push(a * Math.cos(th), yc + (s >= 0 ? bU : bL) * s, z);
      colorFn(c, z, th, j); col.push(c.r, c.g, c.b);
    }
  }
  for (let i = 0; i < nz; i++) for (let j = 0; j < nA; j++) {
    const a = i * (nA + 1) + j, b = a + nA + 1;
    idx.push(a, a + 1, b, b, a + 1, b + 1);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
  geo.setIndex(idx); geo.computeVertexNormals();
  return geo;
}

export function humpback({ seed = 641 } = {}) {
  const r = rng(seed);
  const g = new THREE.Group();
  const DARK = new THREE.Color("#2b3036"), MID = new THREE.Color("#4a5056"), WHITE = new THREE.Color("#d9d8d2"), GROOVE = new THREE.Color("#7c7f80");
  const skin = (c, z, th, j) => {
    const s = Math.sin(th);
    if (s > -0.25) return c.copy(DARK).lerp(MID, clamp(-s * 2 + 0.2) * 0.6);
    const pleated = z > -1.6;
    if (pleated) return c.copy(j % 2 ? WHITE : GROOVE);
    return c.copy(MID).lerp(WHITE, 0.4);
  };
  const outer = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.55, metalness: 0.05, flatShading: true });
  const throatIn = new THREE.MeshStandardMaterial({ color: "#3a1e22", roughness: 0.9, flatShading: true, side: THREE.BackSide });
  const palateIn = new THREE.MeshStandardMaterial({ color: "#4b3337", roughness: 0.9, flatShading: true, side: THREE.BackSide });
  const jawIn = new THREE.MeshStandardMaterial({ color: "#b0706e", roughness: 0.8, flatShading: true, side: THREE.BackSide });
  const H = WHALE_HINGE;
  // Rumpf
  const bodyGeo = shellGeo(-7.1, H + 0.05, 26, 0, Math.PI * 2, 26, skin);
  g.add(new THREE.Mesh(bodyGeo, outer), new THREE.Mesh(bodyGeo, throatIn));
  // Oberkiefer (Rostrum)
  const upGeo = shellGeo(H - 0.15, 7.25, 14, 0, Math.PI, 14, skin);
  g.add(new THREE.Mesh(upGeo, outer), new THREE.Mesh(upGeo, palateIn));
  // Unterkiefer mit Kehlfalten, klappbar am Gelenk
  const [, , , ycH] = prof(H);
  const jaw = new THREE.Group(); jaw.position.set(0, ycH, H - 0.15); g.add(jaw);
  const lowGeo = shellGeo(H - 0.15, 7.25, 16, Math.PI, Math.PI * 2, 30, skin);
  lowGeo.translate(0, -ycH, -(H - 0.15));
  jaw.add(new THREE.Mesh(lowGeo, outer), new THREE.Mesh(lowGeo, jawIn));
  const tongue = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 1), mat("#b98580", { roughness: 0.7 }));
  tongue.scale.set(1.0, 0.45, 1.9); tongue.position.set(0, -0.95, 1.6); jaw.add(tongue);
  // Barten am Oberkiefer
  const plates = [];
  for (let z = H + 0.2; z < 6.7; z += 0.055) for (const s of [-1, 1]) plates.push({ z, s });
  const plateGeo = new THREE.BoxGeometry(0.22, 1, 0.014); plateGeo.translate(0, -0.5, 0);
  const baleen = new THREE.InstancedMesh(plateGeo, mat("#2a2420", { roughness: 0.9 }), plates.length);
  plates.forEach((pl, i) => {
    const [a, , , yc] = prof(pl.z);
    const L = 0.18 + 0.62 * Math.sqrt(clamp(1 - (pl.z - H) / (7 - H)));
    o3.position.set(pl.s * a * 0.9, yc, pl.z); o3.rotation.set(0, 0, -pl.s * 0.15); o3.scale.set(1, L, 1);
    o3.updateMatrix(); baleen.setMatrixAt(i, o3.matrix);
  });
  g.add(baleen);
  // Knubbel (Tuberkel) auf dem Kopf
  const bumpMat = mat("#22262b");
  for (let i = 0; i < 34; i++) {
    const z = r.range(H + 0.6, 7.0), th = Math.PI / 2 + r.range(-0.6, 0.6);
    const [a, bU, , yc] = prof(z);
    const b = new THREE.Mesh(new THREE.IcosahedronGeometry(r.range(0.07, 0.12), 0), bumpMat);
    b.position.set(a * Math.cos(th) * 0.98, yc + bU * Math.sin(th) * 0.98, z); g.add(b);
  }
  // Auge
  for (const s of [-1, 1]) { const e = new THREE.Mesh(new THREE.SphereGeometry(0.07, 6, 4), basic("#0c0c0e")); e.position.set(s * 1.6, 0.05, H - 0.2); g.add(e); }
  // Brustflossen: sehr lang (≈ 1/3 der Körperlänge), weiß, mit Höckern an der Vorderkante
  const finGeo = new THREE.BoxGeometry(4.4, 0.1, 0.8, 10, 1, 1); finGeo.translate(2.2, 0, 0);
  const fp = finGeo.attributes.position;
  for (let i = 0; i < fp.count; i++) {
    const k = fp.getX(i) / 4.4;
    fp.setZ(i, fp.getZ(i) * lerp(1, 0.32, k) + lerp(0, -0.25, k));
    fp.setY(i, fp.getY(i) * lerp(1.2, 0.5, k));
  }
  finGeo.computeVertexNormals();
  const finMat = mat("#dedcd6", { roughness: 0.6, side: THREE.DoubleSide });
  const fins = [];
  for (const s of [-1, 1]) {
    const pivot = new THREE.Group(); pivot.position.set(s * 1.2, -0.85, 0.9); g.add(pivot);
    const inner = new THREE.Group(); pivot.add(inner);
    if (s < 0) inner.scale.x = -1;
    inner.add(new THREE.Mesh(finGeo, finMat));
    for (let k = 0; k < 7; k++) { const b = new THREE.Mesh(new THREE.IcosahedronGeometry(0.075, 0), finMat); b.position.set(0.5 + k * 0.52, 0, 0.38 * lerp(1, 0.32, (0.5 + k * 0.52) / 4.4) - 0.05 * k / 7); inner.add(b); }
    fins.push({ pivot, s });
  }
  // Rückenfinne mit Buckel
  const dorsal = new THREE.Mesh(new THREE.ConeGeometry(0.35, 0.55, 4), outer.clone());
  dorsal.material.vertexColors = false; dorsal.material.color.set("#2b3036");
  dorsal.scale.set(0.35, 1, 1.6); dorsal.position.set(0, 1.12, -3.0); dorsal.rotation.x = -0.35; g.add(dorsal);
  // Fluke: oben dunkel, Unterseite weiß
  const sh = new THREE.Shape();
  sh.moveTo(0, -0.1); sh.lineTo(0.6, 0.15); sh.lineTo(1.5, 0.55); sh.lineTo(2.25, 1.35); sh.lineTo(1.7, 1.25);
  sh.lineTo(1.0, 1.0); sh.lineTo(0.35, 1.05); sh.lineTo(0, 0.88); sh.lineTo(-0.35, 1.05); sh.lineTo(-1.0, 1.0);
  sh.lineTo(-1.7, 1.25); sh.lineTo(-2.25, 1.35); sh.lineTo(-1.5, 0.55); sh.lineTo(-0.6, 0.15); sh.lineTo(0, -0.1);
  const flGeo = new THREE.ShapeGeometry(sh); flGeo.rotateX(-Math.PI / 2);   // Shape-y → −z (nach hinten)
  const fluke = new THREE.Group(); fluke.position.set(0, 0.0, -7.0); g.add(fluke);
  const flTop = new THREE.Mesh(flGeo, mat("#2b3036", { side: THREE.DoubleSide })); flTop.position.y = 0.035;
  const flBot = new THREE.Mesh(flGeo, mat("#e4e2dc", { side: THREE.DoubleSide })); flBot.position.y = -0.035;
  // schwarze Zeichnung auf der Unterseite
  const spotGeo = new THREE.CircleGeometry(0.35, 6); spotGeo.rotateX(Math.PI / 2);
  for (const [x, z, s] of [[0.9, -0.75, 1], [-1.2, -0.9, 0.8], [0.2, -0.35, 0.6], [1.7, -1.1, 0.5]]) {
    const sp = new THREE.Mesh(spotGeo, mat("#2b3036", { side: THREE.DoubleSide })); sp.position.set(x, -0.05, z); sp.scale.setScalar(s); fluke.add(sp);
  }
  fluke.add(flTop, flBot);
  g.traverse((o) => { if (o.isMesh) { o.castShadow = false; o.receiveShadow = false; } });
  return {
    group: g, jaw, fluke,
    setMouth(open, throat) {
      jaw.rotation.x = open * 0.95;
      jaw.scale.set(1 + throat * 0.12, 1 + throat * 0.55, 1);
      baleen.visible = open > 0.02;
    },
    swim(t, amp = 1) {
      fluke.rotation.x = Math.sin(t * 1.6) * 0.32 * amp;
      fins.forEach((f) => { f.pivot.rotation.set(0.2 + Math.sin(t * 0.8) * 0.12 * amp, f.s * 0.75, f.s * (-0.45 + Math.sin(t * 0.8 + 1) * 0.1 * amp), "YXZ"); });
    },
  };
}

// ===================================================== Maul von innen (Akt 2) ===
// Kamera nahe (0, 0, 0.6). Vorne (−z) die geschlossenen Lippen, hinten (+z) der Schlund.
// Seiten x = ±1,6: Bartenvorhang. Boden: Zunge im Unterkiefer, Decke: Gaumen.
export const THROAT = new THREE.Vector3(0, -0.62, 3.05);
export function mouthInterior({ seed = 651 } = {}) {
  const r = rng(seed);
  const g = new THREE.Group();
  const LEN = 7.0, Z0 = -3.4;
  // Gaumen (Decke)
  const palGeo = new THREE.CylinderGeometry(1.95, 1.95, LEN, 20, 6, true, -Math.PI / 2, Math.PI);
  palGeo.rotateZ(Math.PI / 2); palGeo.rotateY(Math.PI / 2);
  const palate = new THREE.Mesh(palGeo, mat("#5a3a3c", { side: THREE.DoubleSide, roughness: 0.9 }));
  palate.scale.set(1, 0.62, 1); palate.position.set(0, 0.05, Z0 + LEN / 2 - 0.2); g.add(palate);
  box(0.3, 0.12, LEN, mat("#6b4446"), 0, 1.22, Z0 + LEN / 2 - 0.2, g);           // Mittelgrat
  for (let i = 0; i < 26; i++) {                                                    // Querrillen im Gaumen
    const z = Z0 + 0.3 + i * 0.25;
    const rib = new THREE.Mesh(new THREE.TorusGeometry(1.5, 0.035, 3, 16, Math.PI * 0.7), mat("#73494b"));
    rib.rotation.set(0, 0, Math.PI * 0.15); rib.scale.set(1, 0.6, 1); rib.position.set(0, 0.1, z); g.add(rib);
  }
  // Unterkiefer-Schale (dehnbar) + Zunge
  const floor = new THREE.Group(); g.add(floor);
  const bowlGeo = new THREE.CylinderGeometry(2.0, 2.0, LEN, 28, 6, true, Math.PI / 2, Math.PI);
  bowlGeo.rotateZ(Math.PI / 2); bowlGeo.rotateY(Math.PI / 2);
  const bc = new Float32Array(bowlGeo.attributes.position.count * 3); const cc = new THREE.Color();
  for (let i = 0; i < bowlGeo.attributes.position.count; i++) {
    const a = Math.atan2(bowlGeo.attributes.position.getY(i), bowlGeo.attributes.position.getX(i));
    cc.set(Math.floor((a + 4) * 9) % 2 ? "#c4807a" : "#9c5e5c"); bc.set([cc.r, cc.g, cc.b], i * 3);
  }
  bowlGeo.setAttribute("color", new THREE.BufferAttribute(bc, 3));
  const bowl = new THREE.Mesh(bowlGeo, new THREE.MeshStandardMaterial({ vertexColors: true, side: THREE.DoubleSide, roughness: 0.75, flatShading: true }));
  bowl.scale.set(1, 0.75, 1); bowl.position.set(0, 0.0, Z0 + LEN / 2 - 0.2); floor.add(bowl);
  const tGeo = new THREE.IcosahedronGeometry(1, 3);
  const tp = tGeo.attributes.position;
  for (let i = 0; i < tp.count; i++) { const k = 1 + Math.sin(tp.getX(i) * 9 + tp.getZ(i) * 5) * 0.03 + Math.sin(tp.getZ(i) * 13) * 0.02; tp.setXYZ(i, tp.getX(i) * k, tp.getY(i) * k, tp.getZ(i) * k); }
  tGeo.computeVertexNormals();
  const tongue = new THREE.Mesh(tGeo, mat("#c48e88", { roughness: 0.6 }));
  tongue.scale.set(1.35, 0.62, 2.6); tongue.position.set(0, -1.45, 0.1); floor.add(tongue);
  // Barten: Vorhang links und rechts, mit Fransen an der Innenkante
  const plates = [];
  for (let z = Z0 + 0.3; z < 2.6; z += 0.05) for (const s of [-1, 1]) plates.push({ z, s, L: lerp(1.15, 1.75, clamp((z - Z0) / 5)) + r.range(-0.05, 0.05) });
  const plGeo = new THREE.BoxGeometry(0.34, 1, 0.012); plGeo.translate(0, -0.5, 0);
  const baleen = new THREE.InstancedMesh(plGeo, mat("#2e2824", { roughness: 0.85 }), plates.length);
  const bcol = new THREE.Color();
  plates.forEach((p, i) => {
    o3.position.set(p.s * 1.62, 1.0, p.z); o3.rotation.set(0, 0, p.s * 0.08); o3.scale.set(1, p.L, 1); o3.updateMatrix();
    baleen.setMatrixAt(i, o3.matrix); baleen.setColorAt(i, bcol.set(r() < 0.3 ? "#3d342c" : "#2a2420"));
  });
  g.add(baleen);
  const FR = 2400;
  const frGeo = new THREE.BoxGeometry(0.006, 0.34, 0.006); frGeo.translate(0, -0.17, 0);
  const fringe = new THREE.InstancedMesh(frGeo, mat("#a8957a", { roughness: 1 }), FR);
  for (let i = 0; i < FR; i++) {
    const s = i % 2 ? 1 : -1, z = r.range(Z0 + 0.3, 2.6);
    const L = lerp(1.15, 1.75, clamp((z - Z0) / 5));
    o3.position.set(s * r.range(1.42, 1.5), 1.0 - r.range(0.1, L - 0.05), z);
    o3.rotation.set(r.range(-0.4, 0.4), 0, s * r.range(0.1, 0.7)); o3.scale.set(1, r.range(0.5, 1.4), 1); o3.updateMatrix();
    fringe.setMatrixAt(i, o3.matrix); fringe.setColorAt(i, bcol.set(r.pick(["#a8957a", "#8a7862", "#c2b296", "#6e604e"])));
  }
  g.add(fringe);
  // Hinten: Rachenwand mit Falten und dem winzigen Schlund (≈ 10 cm)
  const back = new THREE.Mesh(new THREE.CircleGeometry(2.0, 24), mat("#9a5c5a", { side: THREE.DoubleSide }));
  back.scale.set(1, 0.85, 1); back.position.set(0, 0, 3.15); back.rotation.y = Math.PI; g.add(back);
  for (const [rad, th] of [[0.09, 0.025], [0.17, 0.03], [0.28, 0.04], [0.42, 0.05], [0.6, 0.06]]) {
    const fold = new THREE.Mesh(new THREE.TorusGeometry(rad, th, 5, 18), mat("#b27270"));
    fold.position.set(THROAT.x, THROAT.y, 3.1); fold.scale.set(1, 0.8, 0.6); g.add(fold);
  }
  const hole = new THREE.Mesh(new THREE.CircleGeometry(0.05, 14), basic("#050203"));
  hole.position.set(THROAT.x, THROAT.y, 3.06); hole.rotation.y = Math.PI; g.add(hole);
  // Vorne: Lippen, die sich einen Spalt öffnen; dahinter Tageslicht
  const lipMat = mat("#3e3034", { side: THREE.DoubleSide });
  const lipUp = box(4.2, 1.6, 0.25, lipMat, 0, 0.8, Z0 - 0.05, g);
  const lipLo = box(4.2, 1.8, 0.25, lipMat, 0, -0.9, Z0 - 0.05, g);
  const light = new THREE.Mesh(new THREE.PlaneGeometry(6, 4), basic("#cfffee", { toneMapped: false, fog: false }));
  light.position.set(0, 0, Z0 - 0.6); g.add(light);
  const rayTex = rayTexture();
  const shafts = [];
  for (let i = 0; i < 9; i++) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(r.range(0.3, 0.7), 5), new THREE.MeshBasicMaterial({ map: rayTex, color: "#c8fff0", transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false }));
    m.geometry.rotateX(Math.PI / 2); m.geometry.translate(0, 0, 2.5);
    m.position.set(r.range(-1.2, 1.2), 0, Z0); m.rotation.set(r.range(-0.15, 0.1), r.range(-0.25, 0.25), 0);
    g.add(m); shafts.push({ m, base: r.range(0.12, 0.25) });
  }
  const gapLight = new THREE.PointLight("#cfffee", 0, 9, 1.4); gapLight.position.set(0, 0, Z0 + 0.4); g.add(gapLight);
  // Krill und kleine Fische im Maul (Strömung durch die Barten)
  const KN = 520;
  const kr = new THREE.InstancedMesh(new THREE.TetrahedronGeometry(0.018, 0), mat("#ef9a6e", { emissive: "#4a1a0a" }), KN);
  const KD = [];
  for (let i = 0; i < KN; i++) KD.push({ x: r.range(-1.3, 1.3), y: r.range(-0.7, 0.8), z: r.range(Z0 + 0.4, 2.6), ph: r() * 6, stuck: r() < 0.35, d: r.range(0, 1.2) });
  g.add(kr);
  const FN = 14;
  const fishGeo = new THREE.ConeGeometry(0.03, 0.18, 4); fishGeo.rotateX(-Math.PI / 2); fishGeo.scale(0.6, 1, 1);
  const fish = new THREE.InstancedMesh(fishGeo, new THREE.MeshStandardMaterial({ color: "#c9d6d8", metalness: 0.5, roughness: 0.35, flatShading: true }), FN);
  const FD = []; for (let i = 0; i < FN; i++) FD.push({ x: r.range(-1, 1), y: r.range(-0.5, 0.6), z: r.range(-2.6, -0.8), ph: r() * 6, w: r.range(0.8, 1.6) });
  g.add(fish);
  const p0 = new THREE.Vector3(), p1 = new THREE.Vector3();
  return {
    group: g,
    // expand: Kehle gedehnt (0..1), squeeze: Wasser wird rausgepresst (0..1), gap: Lippenspalt (m)
    update(t, { expand = 0, squeeze = 0, gap = 0 }) {
      const ex = expand - squeeze * 0.8;
      floor.scale.set(1 + ex * 0.22, 1 + ex * 0.45, 1);
      floor.position.y = -ex * 0.25;
      lipUp.position.y = 0.8 + gap * 0.5; lipLo.position.y = -0.9 - gap * 0.5;
      light.visible = gap > 0.001;
      shafts.forEach((s) => { s.m.material.opacity = s.base * clamp(gap * 6); s.m.visible = gap > 0.001; });
      gapLight.intensity = clamp(gap * 5) * 9;
      KD.forEach((k, i) => {
        const out = smooth(clamp((squeeze * 1.3 - k.d * 0.3)));
        const reach = k.stuck ? 1.44 : 2.4;
        const x = lerp(k.x, Math.sign(k.x || 1) * reach, out);
        o3.position.set(x + Math.sin(t * 0.7 + k.ph) * 0.05 * (1 - out), k.y + Math.sin(t * 0.5 + k.ph) * 0.08 - ex * 0.1, k.z + Math.cos(t * 0.6 + k.ph) * 0.05);
        o3.rotation.set(t + k.ph, t * 0.7, 0); o3.scale.setScalar(Math.abs(x) > 1.9 ? 0 : 1); o3.updateMatrix(); kr.setMatrixAt(i, o3.matrix);
      });
      kr.instanceMatrix.needsUpdate = true;
      FD.forEach((f, i) => {
        const out = smooth(clamp(squeeze * 1.2 - 0.1));
        const at = (tt, o) => o.set(lerp(f.x + Math.sin(tt * f.w + f.ph) * 0.6, Math.sign(f.x || 1) * 2.4, out), f.y + Math.sin(tt * 0.9 + f.ph) * 0.2, f.z + Math.cos(tt * f.w + f.ph) * 0.8);
        at(t, p0); at(t + 0.05, p1);
        o3.position.copy(p0); o3.lookAt(p1); o3.scale.setScalar(Math.abs(p0.x) > 1.7 ? 0 : 0.6); o3.updateMatrix(); fish.setMatrixAt(i, o3.matrix);
      });
      fish.instanceMatrix.needsUpdate = true;
    },
  };
}

// ====================================================== Oberfläche (Schluss) ===
export function waterPlane(w, d, sx, sz, color) {
  const geo = new THREE.PlaneGeometry(w, d, sx, sz); geo.rotateX(-Math.PI / 2);
  const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color, roughness: 0.3, metalness: 0.15, flatShading: true }));
  const base = geo.attributes.position.array.slice();
  m.userData.wave = (t, amp) => {
    const p = geo.attributes.position.array;
    for (let i = 0; i < p.length; i += 3) {
      const x = base[i], z = base[i + 2];
      p[i + 1] = amp * (Math.sin(x * 0.35 + t * 1.3) * 0.5 + Math.sin(z * 0.27 - t * 1.0 + x * 0.1) * 0.35 + Math.sin((x + z) * 0.8 + t * 2.1) * 0.15);
    }
    geo.attributes.position.needsUpdate = true;
  };
  return m;
}

export function lobsterBoat() {
  const g = new THREE.Group();
  const white = mat("#eeeae0"), red = mat("#9a2a24"), dark = mat("#2a3038"), wood = mat("#8a6a48");
  const hull = new THREE.Mesh(new THREE.BoxGeometry(3.2, 1.4, 10, 1, 1, 4), white);
  const hp = hull.geometry.attributes.position;
  for (let i = 0; i < hp.count; i++) { const z = hp.getZ(i); if (z < -3) hp.setX(i, hp.getX(i) * lerp(1, 0.15, (-z - 3) / 2)); if (hp.getY(i) < 0) hp.setX(i, hp.getX(i) * 0.75); }
  hull.geometry.computeVertexNormals(); hull.position.y = 0.4; g.add(hull);
  box(3.0, 0.25, 9.0, red, 0, -0.15, 0.3, g);
  box(2.2, 1.6, 2.4, white, 0, 1.9, -0.8, g);              // Steuerhaus
  box(2.25, 0.5, 2.45, dark, 0, 2.2, -0.8, g);             // Fenster
  box(2.6, 0.12, 2.8, mat("#d8d4c8"), 0, 2.75, -0.8, g);   // Dach
  cyl(0.06, 0.06, 3.2, 5, dark, 0, 4.2, -0.6, g);
  for (let i = 0; i < 4; i++) box(0.9, 0.6, 0.7, wood, (i % 2 ? 0.7 : -0.6), 1.4, 2.4 + Math.floor(i / 2) * 0.9, g); // Hummerkörbe
  return g;
}

export function gulls(n, seed, area) {
  const r = rng(seed);
  const body = new THREE.InstancedMesh(new THREE.BoxGeometry(0.16, 0.14, 0.5), mat("#f4f4f2"), n);
  const wingGeo = new THREE.BoxGeometry(0.62, 0.03, 0.2); wingGeo.translate(0.31, 0, 0);
  const wingMat = mat("#c9ced2");
  const wl = new THREE.InstancedMesh(wingGeo, wingMat, n), wr = new THREE.InstancedMesh(wingGeo, wingMat, n);
  const g = new THREE.Group(); g.add(body, wl, wr);
  const B = [];
  for (let i = 0; i < n; i++) B.push({ cx: r.range(area.x0, area.x1), cz: r.range(area.z0, area.z1), y: r.range(area.y0, area.y1), rad: r.range(5, 12), w: r.range(0.2, 0.35) * (r() < 0.5 ? -1 : 1), ph: r() * 6.28, fl: r.range(5, 8) });
  const M = new THREE.Matrix4(), W = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), v = new THREE.Vector3(), one = new THREE.Vector3(1.5, 1.5, 1.5);
  const rz = new THREE.Matrix4(), ry = new THREE.Matrix4().makeRotationY(Math.PI);
  return {
    group: g,
    update(t) {
      B.forEach((b, i) => {
        const a = b.ph + t * b.w;
        v.set(b.cx + Math.cos(a) * b.rad, b.y + Math.sin(t * 0.7 + b.ph) * 0.8, b.cz + Math.sin(a) * b.rad);
        M.compose(v, q.setFromEuler(e.set(0, -a + (b.w > 0 ? 0 : Math.PI), Math.sin(t + b.ph) * 0.2)), one);
        body.setMatrixAt(i, M);
        rz.makeRotationZ(Math.sin(t * b.fl + b.ph) * 0.55 + 0.15);
        W.copy(M).multiply(rz); wr.setMatrixAt(i, W);
        W.copy(M).multiply(ry).multiply(rz); wl.setMatrixAt(i, W);
      });
      body.instanceMatrix.needsUpdate = wl.instanceMatrix.needsUpdate = wr.instanceMatrix.needsUpdate = true;
    },
  };
}

export function seaSurface({ seed = 661 } = {}) {
  const r = rng(seed);
  const g = new THREE.Group();
  const water = waterPlane(260, 260, 80, 80, "#2d6b74"); g.add(water);
  const boat = lobsterBoat(); boat.position.set(-9, 0, -26); boat.rotation.y = 0.9; g.add(boat);
  // Küste von Cape Cod: flache Dünen
  const dunes = new THREE.Mesh(new THREE.CylinderGeometry(600, 600, 6, 60, 1, true, Math.PI * 0.8, Math.PI * 0.5), mat("#c8b48a", { side: THREE.DoubleSide }));
  dunes.position.set(0, 0, 0); g.add(dunes);
  const gl = gulls(9, 671, { x0: -16, x1: 8, z0: -30, z1: -10, y0: 5, y1: 11 }); g.add(gl.group);
  // Schaum, wo der Wal war
  const foam = new THREE.Mesh(new THREE.CircleGeometry(2.2, 18), new THREE.MeshBasicMaterial({ color: "#e8f6f4", transparent: true, opacity: 0.0, depthWrite: false }));
  foam.rotation.x = -Math.PI / 2; foam.position.set(-0.4, 0.12, -8); g.add(foam);
  // Spritzer
  const SP = 140;
  const drops = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.025, 0), new THREE.MeshStandardMaterial({ color: "#e9fbff", roughness: 0.1, transparent: true, opacity: 0.85 }), SP);
  const SD = []; for (let i = 0; i < SP; i++) { const a = r() * 6.28; SD.push({ x: r.range(-2.5, 2.5), z: r.range(-6, -2.5), vx: Math.cos(a) * r.range(0.4, 2.2), vz: Math.sin(a) * r.range(0.3, 1.5), vy: r.range(2.5, 6), s: r.range(0.6, 1.8) }); }
  g.add(drops);
  return {
    group: g, water, boat, foam,
    update(t, u /* Sekunden seit dem Ausspucken */) {
      water.userData.wave(t, 0.22);
      boat.position.y = Math.sin(t * 1.1) * 0.12; boat.rotation.z = Math.sin(t * 0.9) * 0.04; boat.rotation.x = Math.sin(t * 0.7) * 0.02;
      gl.update(t);
      foam.material.opacity = u < 0 ? 0 : 0.45 * (1 - smooth(clamp((u - 1.2) / 4)));
      foam.scale.setScalar(1 + u * 0.15);
      SD.forEach((d, i) => {
        const k = u * 0.9;
        const vis = u > 0 && u < 1.6;
        o3.position.set(d.x + d.vx * k, 0.1 + d.vy * k - 4.9 * k * k, d.z + d.vz * k);
        o3.rotation.set(0, 0, 0); o3.scale.setScalar(vis && o3.position.y > -0.1 ? d.s : 0); o3.updateMatrix(); drops.setMatrixAt(i, o3.matrix);
      });
      drops.instanceMatrix.needsUpdate = true;
    },
  };
}
