// Sets und Requisiten nur für "tsunami-hamburg" (lib/ bleibt unverändert).
// Hafenkante an den Landungsbrücken, Straße mit Stau, Autoinnenraum, Wasser, Welle.
// Alles deterministisch: Zufall nur über rng(seed), Bewegung nur über die Szenen-Zeit.
import { THREE, rng, clamp, smooth, lerp, building, windowTextures, crowd, car } from "./lib/lowpoly.js";
import { mat, box, cyl, canvasTexture, tileTexture } from "./lib/props.js";

const o3 = new THREE.Object3D();

// ------------------------------------------------------------ Fischbrötchen ---
export function fischbroetchen() {
  const g = new THREE.Group();
  const bun = mat("#d49a52", { roughness: 0.8 });
  const bottom = new THREE.Mesh(new THREE.IcosahedronGeometry(0.05, 1), bun);
  bottom.scale.set(1.55, 0.42, 0.9); bottom.position.y = -0.014; g.add(bottom);
  const top = new THREE.Mesh(new THREE.IcosahedronGeometry(0.05, 1), mat("#c98a45", { roughness: 0.75 }));
  top.scale.set(1.5, 0.55, 0.88); top.position.y = 0.03; g.add(top);
  box(0.15, 0.012, 0.075, mat("#5b8f3a"), 0.005, 0.006, 0, g);          // Salat
  box(0.165, 0.014, 0.05, mat("#e6c9c0"), 0.012, 0.012, 0.002, g);      // Hering (Bismarck)
  box(0.165, 0.004, 0.05, mat("#9aa6ad", { roughness: 0.35, metalness: 0.4 }), 0.012, 0.0195, 0.002, g); // Haut
  const onion = mat("#efe3ee");
  for (let i = 0; i < 3; i++) {
    const r = new THREE.Mesh(new THREE.TorusGeometry(0.011, 0.0028, 4, 8), onion);
    r.rotation.x = Math.PI / 2; r.position.set(-0.04 + i * 0.035, 0.021, 0.022 - (i % 2) * 0.01); g.add(r);
  }
  g.traverse((o) => { if (o.isMesh) { o.castShadow = false; o.receiveShadow = false; } });
  return g;
}

// ---------------------------------------------------------- Elbphilharmonie ---
export function elbphilharmonie() {
  const g = new THREE.Group();
  const W = 110, D = 36, H0 = 37;
  const { tex: brickTex } = canvasTexture(256, 128, (c, w, h) => {
    c.fillStyle = "#8a3f2c"; c.fillRect(0, 0, w, h);
    c.fillStyle = "#3a2420";
    for (let y = 0; y < 8; y++) for (let x = 0; x < 24; x++) c.fillRect(4 + x * 10.5, 6 + y * 15, 3, 7);
  });
  const base = new THREE.Mesh(new THREE.BoxGeometry(W, H0, D), new THREE.MeshStandardMaterial({ map: brickTex, roughness: 0.9, flatShading: true }));
  base.position.y = H0 / 2; base.castShadow = base.receiveShadow = true; g.add(base);
  // Glasaufbau mit welligem Dach (Profil in x-y, nach z extrudiert)
  const crest = [[-W / 2, 80], [-42, 96], [-30, 86], [-14, 108], [2, 94], [16, 102], [32, 88], [44, 92], [W / 2, 82]];
  const s = new THREE.Shape();
  s.moveTo(-W / 2, H0);
  crest.forEach(([x, y]) => s.lineTo(x, y));
  s.lineTo(W / 2, H0); s.lineTo(-W / 2, H0);
  const { tex: glassTex } = canvasTexture(128, 128, (c, w, h) => {
    c.fillStyle = "#9fb7c9"; c.fillRect(0, 0, w, h);
    c.fillStyle = "rgba(255,255,255,0.35)";
    for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) if ((x * 7 + y * 3) % 5 === 0) c.fillRect(x * 16 + 3, y * 16 + 3, 9, 9);
    c.fillStyle = "rgba(40,60,80,0.35)"; for (let i = 0; i < 8; i++) { c.fillRect(0, i * 16, w, 2); c.fillRect(i * 16, 0, 2, h); }
  });
  glassTex.wrapS = glassTex.wrapT = THREE.RepeatWrapping; glassTex.repeat.set(1 / 7, 1 / 7);
  const glassGeo = new THREE.ExtrudeGeometry(s, { depth: D, bevelEnabled: false });
  glassGeo.translate(0, 0, -D / 2);
  const glass = new THREE.Mesh(glassGeo, new THREE.MeshStandardMaterial({ map: glassTex, roughness: 0.25, metalness: 0.35, flatShading: true }));
  glass.castShadow = true; g.add(glass);
  // weiße Dachkante
  const cap = new THREE.Shape();
  cap.moveTo(crest[0][0], crest[0][1] + 1.2);
  crest.forEach(([x, y]) => cap.lineTo(x, y + 1.2));
  for (let i = crest.length - 1; i >= 0; i--) cap.lineTo(crest[i][0], crest[i][1] - 2.4);
  const capGeo = new THREE.ExtrudeGeometry(cap, { depth: D + 1, bevelEnabled: false });
  capGeo.translate(0, 0, -(D + 1) / 2);
  g.add(new THREE.Mesh(capGeo, mat("#eef0f0", { roughness: 0.6 })));
  return g;
}

// ------------------------------------------------------------------- Michel ---
export function michel() {
  const g = new THREE.Group();
  const brick = mat("#86503a"), copper = mat("#5f9c87", { roughness: 0.7 }), stone = mat("#cfc6b6");
  box(36, 26, 58, brick, 0, 13, -30, g);                        // Kirchenschiff
  const roof = box(26, 26, 58, copper, 0, 26, -30, g); roof.rotation.z = Math.PI / 4; roof.scale.set(1, 0.55, 1);
  box(15, 70, 15, brick, 0, 35, 4, g);                          // Turmschaft
  box(15.6, 1.4, 15.6, stone, 0, 70, 4, g);
  cyl(6.2, 7.2, 13, 8, brick, 0, 77, 4, g);                     // Achteck
  cyl(5.4, 6.2, 11, 8, copper, 0, 89, 4, g);                    // Kupfer mit Uhr
  cyl(3.8, 4.6, 9, 8, stone, 0, 98.5, 4, g);                    // Säulenkranz
  cyl(3.0, 3.8, 7, 8, copper, 0, 106, 4, g);
  const spire = new THREE.Mesh(new THREE.ConeGeometry(3.0, 22, 8), copper); spire.position.set(0, 120.5, 4); spire.castShadow = true; g.add(spire);
  cyl(0.25, 0.25, 4, 4, mat("#d8b24a"), 0, 133, 4, g);
  return g;
}

// -------------------------------------------------------------------- Möwen ---
export function gulls(n, seed, area) {
  const r = rng(seed);
  const body = new THREE.InstancedMesh(new THREE.BoxGeometry(0.16, 0.14, 0.5), mat("#f4f4f2"), n);
  const wingGeo = new THREE.BoxGeometry(0.62, 0.03, 0.2); wingGeo.translate(0.31, 0, 0);
  const wingMat = mat("#d9dde0");
  const wl = new THREE.InstancedMesh(wingGeo, wingMat, n), wr = new THREE.InstancedMesh(wingGeo, wingMat, n);
  const g = new THREE.Group(); g.add(body, wl, wr);
  const B = [];
  for (let i = 0; i < n; i++) B.push({ cx: r.range(area.x0, area.x1), cz: r.range(area.z0, area.z1), y: r.range(area.y0, area.y1),
    rad: r.range(6, 18), w: r.range(0.15, 0.32) * (r() < 0.5 ? -1 : 1), ph: r() * 6.28, fl: r.range(5, 8) });
  const M = new THREE.Matrix4(), W = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), v = new THREE.Vector3(), one = new THREE.Vector3(1.5, 1.5, 1.5);
  return {
    group: g,
    update(t) {
      B.forEach((b, i) => {
        const a = b.ph + t * b.w;
        v.set(b.cx + Math.cos(a) * b.rad, b.y + Math.sin(t * 0.7 + b.ph) * 1.2, b.cz + Math.sin(a) * b.rad);
        const yaw = -a + (b.w > 0 ? 0 : Math.PI);
        M.compose(v, q.setFromEuler(e.set(0, yaw, Math.sin(t + b.ph) * 0.2)), one);
        body.setMatrixAt(i, M);
        const flap = Math.sin(t * b.fl + b.ph) * 0.55 + 0.15;
        W.copy(M).multiply(new THREE.Matrix4().makeRotationZ(flap)); wr.setMatrixAt(i, W);
        W.copy(M).multiply(new THREE.Matrix4().makeRotationY(Math.PI)).multiply(new THREE.Matrix4().makeRotationZ(flap)); wl.setMatrixAt(i, W);
      });
      body.instanceMatrix.needsUpdate = wl.instanceMatrix.needsUpdate = wr.instanceMatrix.needsUpdate = true;
    },
  };
}

// ------------------------------------------------------- Wasser (Low-Poly) ---
// Ebene mit Vertex-Wellen; level(t) und amp setzt der Aufrufer pro Frame.
export function waterPlane(w, d, sx, sz, color, extra = {}) {
  const geo = new THREE.PlaneGeometry(w, d, sx, sz); geo.rotateX(-Math.PI / 2);
  const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color, roughness: 0.28, metalness: 0.15, flatShading: true, ...extra }));
  m.receiveShadow = true;
  const base = geo.attributes.position.array.slice();
  m.userData.wave = (t, level, amp, fz = 0) => {
    const p = geo.attributes.position.array;
    const ox = m.position.x, oz = m.position.z;
    for (let i = 0; i < p.length; i += 3) {
      const x = base[i] + ox, z = base[i + 2] + oz;
      p[i + 1] = level + amp * (Math.sin(x * 0.21 + t * 1.6) * 0.5 + Math.sin(z * 0.17 - t * 1.1 + x * 0.05) * 0.35 + Math.sin((x + z) * 0.53 + t * 2.3 + fz * z) * 0.15);
    }
    geo.attributes.position.needsUpdate = true;
  };
  return m;
}

// ================================================================ Hafenkante ===
// Promenade bei x < 0, Kaimauer bei x = 0, Elbe bei x 0…330, Gegenufer mit Kränen.
const RIVER_W = 330;
export function bedY(x, z = 0) {
  const nz = Math.sin(z * 0.05 + x * 0.13) * 0.35 + Math.sin(z * 0.17 - x * 0.07) * 0.2;
  let y;
  if (x < 8) y = -4.6;
  else if (x < 110) y = lerp(-4.6, -7.6, smooth((x - 8) / 102));
  else if (x < 270) y = lerp(-7.6, -12, Math.sin(Math.PI * (x - 110) / 160));
  else y = lerp(-7.6, -3.2, smooth((x - 270) / 60));
  return y + nz;
}

export function hafen({ seed = 401 } = {}) {
  const r = rng(seed);
  const g = new THREE.Group();
  const tex = windowTextures(seed, "altbau");

  // Promenade + Kaimauer + Geländer
  const tile = tileTexture("#a9a399", "#7d786f", 8); tile.repeat.set(12, 120);
  const prom = new THREE.Mesh(new THREE.PlaneGeometry(70, 620), new THREE.MeshStandardMaterial({ map: tile, roughness: 0.95 }));
  prom.rotation.x = -Math.PI / 2; prom.position.set(-35, 0, -260); prom.receiveShadow = true; g.add(prom);
  box(2, 16, 620, mat("#4f4a43"), -1, -8, -260, g);
  box(0.7, 0.26, 620, mat("#a39d92"), -0.35, 0.13, -260, g);
  const railMat = mat("#2f4d55", { roughness: 0.6 });
  const POSTS = 130;
  const posts = new THREE.InstancedMesh(new THREE.BoxGeometry(0.06, 1.05, 0.06), railMat, POSTS);
  for (let i = 0; i < POSTS; i++) { o3.position.set(-0.4, 0.52, 6 - i * 2.4); o3.rotation.set(0, 0, 0); o3.scale.set(1, 1, 1); o3.updateMatrix(); posts.setMatrixAt(i, o3.matrix); }
  g.add(posts);
  box(0.07, 0.07, 312, railMat, -0.4, 1.05, -150, g);
  box(0.04, 0.04, 312, railMat, -0.4, 0.55, -150, g);

  // Straße hinter der Promenade
  const road = new THREE.Mesh(new THREE.PlaneGeometry(10, 620), mat("#3d3f43", { roughness: 0.95 }));
  road.rotation.x = -Math.PI / 2; road.position.set(-27, 0.01, -260); road.receiveShadow = true; g.add(road);
  const cars = [];
  for (let i = 0; i < 9; i++) {
    const c = car(430 + i, i === 4 ? "bus" : "car");
    const lane = i % 2;
    c.rotation.y = lane ? 0 : Math.PI;
    g.add(c);
    cars.push({ g: c, x: lane ? -24.8 : -29.2, z0: -20 - i * 34, v: (lane ? -1 : 1) * r.range(5, 8) });
  }

  // Landungsbrücken-Gebäude (Sandstein, Kupfertürme) + Altbauten dahinter
  const lb = building({ w: 14, h: 13, d: 170, color: "#c4b195", tex }); lb.mesh.position.set(-40, 0, -95); g.add(lb.mesh);
  const copper = mat("#5f9c87", { roughness: 0.7 });
  for (const z of [-12, -95, -178]) {
    box(7, z === -95 ? 30 : 24, 7, mat("#b9a688"), -40, z === -95 ? 15 : 12, z, g);
    const dome = new THREE.Mesh(new THREE.ConeGeometry(4.6, 9, 8), copper); dome.position.set(-40, (z === -95 ? 30 : 24) + 4.5, z); g.add(dome);
  }
  for (let i = 0; i < 18; i++) {
    const h = r.range(16, 26), d = r.range(14, 22);
    const b = building({ w: 16, h, d, color: r.pick(["#c9bba3", "#a85b43", "#8c4a36", "#d6cdbd", "#b9a48a"]), tex });
    b.mesh.position.set(-62 - r.range(0, 6), 0, 20 - i * 24); g.add(b.mesh);
  }

  // Elbe: Schlick (Bett) + Wasserfläche
  const bedGeo = new THREE.PlaneGeometry(RIVER_W, 1400, 66, 140); bedGeo.rotateX(-Math.PI / 2);
  const bp = bedGeo.attributes.position;
  for (let i = 0; i < bp.count; i++) { const x = bp.getX(i) + RIVER_W / 2, z = bp.getZ(i) - 500; bp.setY(i, bedY(x, z)); }
  bedGeo.computeVertexNormals();
  const bed = new THREE.Mesh(bedGeo, mat("#5b5240", { roughness: 0.45, metalness: 0.05 }));
  bed.position.set(RIVER_W / 2, 0, -500); bed.receiveShadow = true; g.add(bed);
  // Steine/Reifen/Pfähle im Schlick
  const junk = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.5, 0), mat("#3e3a33"), 80);
  for (let i = 0; i < 80; i++) { const x = r.range(3, 60), z = r.range(-160, 0); o3.position.set(x, bedY(x, z) + 0.1, z); o3.rotation.set(r(), r(), r()); o3.scale.setScalar(r.range(0.4, 1.4)); o3.updateMatrix(); junk.setMatrixAt(i, o3.matrix); }
  g.add(junk);
  const water = waterPlane(RIVER_W + 40, 1400, 60, 160, "#3d6b80");
  water.position.set(RIVER_W / 2, 0, -500); g.add(water);

  // Pontons mit Dächern, Gangways
  const pontoons = [];
  for (const [zc, len] of [[-34, 40], [-80, 44], [-128, 40]]) {
    const p = new THREE.Group();
    box(10, 1.2, len, mat("#6c7277"), 0, 0, 0, p);
    box(10.2, 0.25, len, mat("#2d3b41"), 0, -0.45, 0, p);
    const roofM = mat("#3f6f5c");
    box(4.5, 2.2, 7, mat("#e4dccb"), 0, 1.7, -len * 0.2, p);
    box(5.0, 0.3, 7.6, roofM, 0, 2.95, -len * 0.2, p);
    p.position.set(9, -1, zc); g.add(p);
    const gw = new THREE.Group();
    const plank = box(5, 0.25, 2.4, mat("#555c60"), 2.5, 0, 0, gw);
    box(5, 0.9, 0.06, railMat, 2.5, 0.5, 1.2, gw); box(5, 0.9, 0.06, railMat, 2.5, 0.5, -1.2, gw);
    gw.position.set(-0.2, 0.05, zc + len / 2 - 6); g.add(gw);
    pontoons.push({ p, gw, x: 9, z: zc, len, plank });
  }

  // Hafenfähre (weiß/grün), Barkasse, Containerschiff
  const ferry = new THREE.Group();
  box(6.5, 1.8, 26, mat("#f0efe9"), 0, 0, 0, ferry);
  box(6.6, 0.45, 26.1, mat("#2f7a52"), 0, -0.55, 0, ferry);
  box(5.6, 2.2, 15, mat("#f4f3ee"), 0, 2.0, 0.5, ferry);
  box(5.7, 0.7, 14, mat("#24313a"), 0, 2.2, 0.5, ferry);
  box(3.6, 1.6, 3.5, mat("#f4f3ee"), 0, 3.9, -4.5, ferry);
  box(3.7, 0.5, 3.6, mat("#24313a"), 0, 4.0, -4.5, ferry);
  ferry.position.set(19, -1, -46); ferry.rotation.y = 0.04; g.add(ferry);
  const barkasse = new THREE.Group();
  box(3.6, 1.3, 15, mat("#1f2b3a"), 0, 0, 0, barkasse);
  box(3.0, 1.2, 8, mat("#e8e2d4"), 0, 1.2, 1, barkasse);
  box(3.1, 0.25, 8.2, mat("#a8382d"), 0, 1.9, 1, barkasse);
  barkasse.position.set(34, -1, -100); barkasse.rotation.y = 0.35; g.add(barkasse);
  const ship = new THREE.Group();
  box(28, 14, 190, mat("#22313f"), 0, 0, 0, ship);
  box(28.2, 4, 190.2, mat("#8a2b22"), 0, -6, 0, ship);
  const CN = 6 * 3 * 22;
  const cont = new THREE.InstancedMesh(new THREE.BoxGeometry(4.2, 2.6, 6.1), mat("#ffffff"), CN);
  const col = new THREE.Color(); let k = 0;
  for (let a = 0; a < 6; a++) for (let b = 0; b < 3; b++) for (let c = 0; c < 22; c++) {
    o3.position.set(-10.5 + a * 4.2, 8.3 + b * 2.6, -78 + c * 6.3); o3.rotation.set(0, 0, 0); o3.scale.set(1, 1, 1); o3.updateMatrix();
    cont.setMatrixAt(k, o3.matrix); cont.setColorAt(k, col.set(r.pick(["#b8352b", "#2b5d9a", "#d9a12e", "#3c7a4a", "#d8d4cc", "#6b3c7a", "#c8622a"]))); k++;
  }
  ship.add(cont);
  box(24, 16, 12, mat("#efefe8"), 0, 15, 84, ship);
  box(10, 4, 8, mat("#22313f"), 0, 25, 84, ship);
  ship.position.set(196, -3, -330); ship.rotation.y = 0.05; g.add(ship);

  // Gegenufer: Kai, Kräne, Docks, Containerstapel
  const far = box(600, 16, 1700, mat("#7b7c74"), RIVER_W + 300, -8, -500, g);
  far.receiveShadow = true;
  for (let i = 0; i < 7; i++) {
    const cr = new THREE.Group(); const cm = mat(i % 2 ? "#b8352b" : "#2f62a0");
    box(1.4, 32, 1.4, cm, 0, 16, -8, cr); box(1.4, 32, 1.4, cm, 0, 16, 8, cr);
    box(1.4, 32, 1.4, cm, 14, 16, -8, cr); box(1.4, 32, 1.4, cm, 14, 16, 8, cr);
    box(16, 3, 18, cm, 7, 33, 0, cr);
    box(70, 2.4, 2.6, cm, -14, 38, 0, cr);
    cr.position.set(RIVER_W + 12, 0, -60 - i * 70); g.add(cr);
  }
  for (let i = 0; i < 5; i++) { const hall = box(70, r.range(18, 30), 110, mat(r.pick(["#8d9196", "#9a8f80", "#6f7a84"])), RIVER_W + 90, 12, -40 - i * 140, g); }
  const stacks = new THREE.InstancedMesh(new THREE.BoxGeometry(6, 2.6, 12), mat("#ffffff"), 160);
  for (let i = 0; i < 160; i++) { o3.position.set(RIVER_W + 34 + (i % 8) * 6.4, 1.3 + Math.floor(i / 8) % 4 * 2.6, -80 - Math.floor(i / 32) * 30 - (i % 3) * 0.1); o3.rotation.set(0, 0, 0); o3.scale.set(1, 1, 1); o3.updateMatrix(); stacks.setMatrixAt(i, o3.matrix); stacks.setColorAt(i, col.set(r.pick(["#b8352b", "#2b5d9a", "#d9a12e", "#3c7a4a", "#c8622a"]))); }
  g.add(stacks);

  // Kehrwieder-Spitze mit Elbphilharmonie, Speicherstadt, Michel
  box(220, 16, 140, mat("#7b7c74"), 10, -8, -680, g);
  const elphi = elbphilharmonie(); elphi.position.set(30, 0, -650); elphi.rotation.y = 0.12; g.add(elphi);
  for (let i = 0; i < 6; i++) {
    const b = building({ w: 30, h: r.range(20, 26), d: 26, color: "#9a4a33", tex, roof: "#4f7f6c" });
    b.mesh.position.set(-60 - (i % 3) * 34, 0, -620 - Math.floor(i / 3) * 40); g.add(b.mesh);
  }
  const mi = michel(); mi.position.set(-150, 0, -600); mi.rotation.y = 0.5; g.add(mi);

  // Menschen auf der Promenade
  const N = 70;
  const people = crowd(N, seed + 7); g.add(people.group);
  const P = [];
  for (let i = 0; i < N; i++) {
    const dir = r() < 0.5 ? 1 : -1, v = r.range(0.8, 1.3);
    const z0 = dir > 0 ? r.range(-150, -34) : r.range(-150, -9);
    P.push({ x: r.range(-14, -2.5), z0, dir, v, ph: r() * 6.3, photo: r() < 0.62, arrive: r.range(8.6, 13.5), rx: -1.05 - r.range(0, 1.6) });
  }

  const gl = gulls(22, seed + 9, { x0: 4, x1: 60, z0: -110, z1: -25, y0: 7, y1: 22 }); g.add(gl.group);

  // Wasserstand: -1,3 m → -5,8 m (fällt ab t 6,5)
  const LEVEL0 = -1.3, LEVEL1 = -5.8;
  const level = (t) => lerp(LEVEL0, LEVEL1, smooth((t - 6.5) / 7.5));

  function float(obj, x, z, draft, keel, t, tiltMax, tiltDir = 1) {
    const lv = level(t);
    const ground = bedY(x, z) + keel;
    const y = Math.max(lv - draft, ground);
    const sit = clamp((ground - (lv - draft)) / 1.5);
    obj.position.y = y + (sit > 0 ? 0 : Math.sin(t * 1.3 + x) * 0.06);
    obj.rotation.z = tiltDir * tiltMax * smooth(sit) + (sit > 0 ? 0 : Math.sin(t * 0.9 + z) * 0.012);
  }

  return {
    group: g, level,
    update(t) {
      water.userData.wave(t, level(t), 0.14);
      for (const c of cars) {
        const span = 300;
        let z = c.z0 + c.v * t; z = -280 + ((((z + 280) % span) + span) % span);
        c.g.position.set(c.x, 0, z);
      }
      for (const pn of pontoons) {
        float(pn.p, pn.x, pn.z, 0.3, 0.75, t, 0.05);
        const top = pn.p.position.y + 0.6;
        pn.gw.rotation.z = Math.atan2(top - 0.05, 5.0);
        pn.plank.scale.x = Math.hypot(top - 0.05, 5) / 5;
      }
      float(ferry, 19, -46, 1.0, 1.0, t, 0.09);
      float(barkasse, 34, -100, 0.6, 0.7, t, -0.16);
      float(ship, 196, -330, 9.0, 7.0, t, 0.04);
      for (let i = 0; i < N; i++) {
        const p = P[i];
        const walkZ = p.z0 + p.dir * p.v * Math.min(t, p.photo ? p.arrive : 99);
        if (!p.photo || t < p.arrive) {
          people.set(i, { x: p.x, z: walkZ, rotY: p.dir > 0 ? 0 : Math.PI, swing: Math.sin(t * p.v * 4.2 + p.ph) * 0.5, visible: true });
        } else {
          const u = smooth((t - p.arrive) / 1.6);
          const lift = smooth((t - p.arrive - 1.2) / 0.8);
          people.set(i, { x: lerp(p.x, p.rx, u), z: walkZ, rotY: lerp(p.dir > 0 ? 0 : Math.PI, Math.PI / 2, u),
            swing: (1 - u) * Math.sin(t * p.v * 4.2 + p.ph) * 0.5, armRaise: 1.45 * lift + Math.sin(t * 2 + p.ph) * 0.05 * lift, visible: true });
        }
      }
      people.commit();
      gl.update(t);
    },
  };
}

// ============================================================= Straße + Stau ===
// Straße läuft entlang z (landeinwärts = -z). Ego-Auto rechts (x = 1,75).
export function strasse({ seed = 501 } = {}) {
  const r = rng(seed);
  const g = new THREE.Group();
  const tex = windowTextures(seed, "altbau");

  const road = new THREE.Mesh(new THREE.PlaneGeometry(14, 900), mat("#47494d", { roughness: 0.95 }));
  road.rotation.x = -Math.PI / 2; road.position.set(0, 0, -100); road.receiveShadow = true; g.add(road);
  for (const s of [-1, 1]) {
    const walk = box(5.5, 0.14, 900, mat("#a19d96"), s * 9.75, 0.07, -100, g); walk.receiveShadow = true;
  }
  const dash = new THREE.InstancedMesh(new THREE.BoxGeometry(0.14, 0.02, 3), mat("#e8e6e0"), 3 * 120);
  let di = 0;
  for (const x of [-3.5, 0, 3.5]) for (let i = 0; i < 120; i++) { o3.position.set(x, 0.015, 300 - i * 7.5); o3.rotation.set(0, 0, 0); o3.scale.set(1, 1, x === 0 ? 3 : 1); o3.updateMatrix(); dash.setMatrixAt(di++, o3.matrix); }
  g.add(dash);

  // Häuser beidseitig (bis z = 40, dahinter offener Platz Richtung Hafen)
  const houses = [];
  for (const s of [-1, 1]) {
    let z = 40;
    while (z > -420) {
      const d = r.range(12, 22), h = r.range(15, 27);
      const b = building({ w: 16, h, d, color: r.pick(["#8c4a36", "#a85b43", "#c9bba3", "#d6cdbd", "#7a3d2e", "#b9a48a"]), tex });
      b.mesh.position.set(s * 20.5, 0, z - d / 2); g.add(b.mesh); houses.push(b);
      z -= d + 0.3;
    }
  }
  // offener Platz/Park Richtung Hafen, Michel, Kräne
  const park = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), mat("#5e7a4b", { roughness: 1 }));
  park.rotation.x = -Math.PI / 2; park.position.set(0, -0.02, 250); g.add(park);
  const trees = new THREE.InstancedMesh(new THREE.ConeGeometry(2.6, 8, 6), mat("#3f6a35"), 50);
  for (let i = 0; i < 50; i++) { const x = (r() < 0.5 ? -1 : 1) * r.range(14, 90), z = r.range(55, 220); o3.position.set(x, 5, z); o3.rotation.set(0, 0, 0); o3.scale.setScalar(r.range(0.8, 1.3)); o3.updateMatrix(); trees.setMatrixAt(i, o3.matrix); }
  g.add(trees);
  const mi = michel(); mi.position.set(62, 0, 300); mi.rotation.y = Math.PI + 0.6; g.add(mi);
  for (let i = 0; i < 8; i++) {
    const b = building({ w: 30, h: r.range(14, 24), d: 20, color: r.pick(["#8c4a36", "#a85b43", "#c9bba3"]), tex });
    b.mesh.position.set(-140 + i * 38, 0, 330 + (i % 2) * 14); g.add(b.mesh);
  }
  for (let i = 0; i < 4; i++) {
    const cr = new THREE.Group(); const cm = mat(i % 2 ? "#b8352b" : "#2f62a0");
    box(1.4, 30, 1.4, cm, -7, 15, 0, cr); box(1.4, 30, 1.4, cm, 7, 15, 0, cr); box(16, 3, 3, cm, 0, 31, 0, cr); box(2.6, 2.4, 60, cm, 0, 36, 10, cr);
    cr.position.set(-110 + i * 60, 0, 520); g.add(cr);
  }

  // Stau: Autos in allen 4 Spuren, alle Richtung -z
  const jam = [];
  const lanes = [-5.25, -1.75, 1.75, 5.25];
  lanes.forEach((x, li) => {
    for (let k = -6; k <= 9; k++) {
      if (li === 2 && k <= 0) continue;                // Ego-Platz
      const z = -k * 7.4 - (li % 2) * 2.6 + r.range(-0.6, 0.6);
      if (z > 60) continue;
      const kind = (li === 0 && k === 3) || (li === 3 && k === -4) ? "bus" : "car";
      if (kind === "bus" && false) continue;
      const c = car(520 + li * 40 + k, kind);
      const rear = new THREE.MeshBasicMaterial({ color: "#ff2a1a" });
      const len = kind === "bus" ? 6.02 : 2.16;
      box(0.32, 0.14, 0.04, rear, -0.68, 0.95, len, c); box(0.32, 0.14, 0.04, rear, 0.68, 0.95, len, c);
      const head = new THREE.MeshBasicMaterial({ color: "#fff4d6" });
      box(0.3, 0.14, 0.04, head, -0.65, 0.85, -len, c); box(0.3, 0.14, 0.04, head, 0.65, 0.85, -len, c);
      c.position.set(x + r.range(-0.15, 0.15), 0, z); g.add(c);
      jam.push({ g: c, x: c.position.x, z, ph: r() * 6.3, drift: r.range(-1, 1), spin: r.range(-0.4, 0.4), bus: kind === "bus", roof: r() < 0.18 && kind === "car" });
    }
  });

  // Menschen: rennen auf den Gehwegen landeinwärts, später auf Autodächern
  const NP = 46;
  const people = crowd(NP, seed + 3); g.add(people.group);
  const P = [];
  for (let i = 0; i < NP; i++) P.push({ x: (r() < 0.5 ? -1 : 1) * r.range(8.0, 11.5), z0: r.range(-40, 25), v: r.range(2.6, 4.2), ph: r() * 6.3 });
  const roofers = jam.filter((j) => j.roof).slice(0, 8);
  const ROOF = crowd(roofers.length, seed + 5); g.add(ROOF.group);

  // Straßenwasser: Ebene mit Wellen, vorne abgeschnitten (clipping plane)
  const clip = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
  const { tex: flowTex } = canvasTexture(256, 256, (c, w, h) => {
    c.fillStyle = "#6f7f62"; c.fillRect(0, 0, w, h);
    const rr = rng(77);
    for (let i = 0; i < 90; i++) { c.fillStyle = `rgba(240,238,228,${0.25 + rr() * 0.45})`; c.fillRect(rr() * w, rr() * h, 3 + rr() * 6, 12 + rr() * 50); }
  });
  flowTex.wrapS = flowTex.wrapT = THREE.RepeatWrapping; flowTex.repeat.set(4, 60);
  const sw = waterPlane(60, 900, 40, 300, "#ffffff", { map: flowTex, clippingPlanes: [clip], roughness: 0.22, emissive: "#25301f" });
  sw.position.set(0, 0, -100); g.add(sw);
  const foam = box(60, 0.4, 1.6, mat("#efece2", { roughness: 0.9 }), 0, 0, 0, g);

  // Zweite Welle: Keil mit überhängender Lippe und Schaumkrone
  const wave = new THREE.Group();
  const WW = 90;
  const prof = new THREE.Shape();
  const pts = [[-60, 0], [-60, 4.6], [-26, 5.6], [-10, 6.6], [-3.5, 7.4], [-0.5, 7.5], [1.6, 7.0], [2.6, 6.0], [1.8, 5.4], [0.4, 5.6], [-0.6, 4.6], [-0.4, 2.8], [0.6, 1.2], [2.4, 0]];
  prof.moveTo(...pts[0]); pts.slice(1).forEach((p) => prof.lineTo(...p)); prof.lineTo(...pts[0]);
  const wg = new THREE.ExtrudeGeometry(prof, { depth: WW, bevelEnabled: false, curveSegments: 1 });
  const wp = wg.attributes.position;
  for (let i = 0; i < wp.count; i++) { const sx = wp.getX(i), sy = wp.getY(i), sz = wp.getZ(i); wp.setXYZ(i, sz - WW / 2, sy + Math.sin(sz * 0.4) * 0.25 * (sy / 7.5), sx); }
  wg.computeVertexNormals();
  const waveMat = new THREE.MeshStandardMaterial({ color: "#557f74", emissive: "#1c2e2a", roughness: 0.35, metalness: 0.1, flatShading: true, side: THREE.DoubleSide });
  wave.add(new THREE.Mesh(wg, waveMat));
  const FOAM = 220;
  const crestFoam = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.6, 0), mat("#f2f2ee", { roughness: 0.9 }), FOAM);
  const FD = []; for (let i = 0; i < FOAM; i++) FD.push({ x: r.range(-WW / 2, WW / 2), y: r.range(5.4, 8.2), z: r.range(-2.5, 2.6), s: r.range(0.6, 1.8), ph: r() * 6.3, foot: r() < 0.3 });
  wave.add(crestFoam);
  const debris = [];
  for (let i = 0; i < 4; i++) { const c = car(590 + i); wave.add(c); debris.push({ g: c, x: -9 + i * 6 + r.range(-1, 1), z: r.range(3, 6), ph: r() * 6.3, sp: r.range(0.6, 1.4) }); }
  const crates = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), mat("#8a6a46"), 20);
  const CD = []; for (let i = 0; i < 20; i++) CD.push({ x: r.range(-14, 14), z: r.range(2, 7), s: r.range(0.4, 1.2), ph: r() * 6.3 });
  wave.add(crates);
  wave.rotation.y = Math.PI;            // Front zeigt Richtung -z (auf dich zu)
  g.add(wave);

  return {
    group: g, jam, wave, sw, clip, foam,
    update(t, { level, front, waveZ, lift, egoZ = 0 }) {
      // Wasser
      const wet = front < 400;
      sw.visible = foam.visible = wet;
      if (wet) {
        clip.constant = -front;
        sw.userData.wave(t, level, 0.05 + Math.min(level, 1.3) * 0.12, 0.2);
        flowTex.offset.y = -t * 0.35;
        foam.position.set(0, level + 0.12, front + 0.8);
      }
      // Stau: schwimmt ab ~35 cm, treibt leicht landeinwärts
      jam.forEach((j) => {
        const L = j.bus ? Math.max(0, lift - 0.5) * 0.6 : lift;
        j.g.position.set(j.x + j.drift * L * 0.8, L + (L > 0 ? Math.sin(t * 1.4 + j.ph) * 0.05 : 0), j.z - L * 2.5 * (1 + j.drift * 0.3));
        j.g.rotation.set(L > 0 ? Math.sin(t * 1.1 + j.ph) * 0.04 : 0, j.spin * L * 0.6, L > 0 ? Math.sin(t * 0.9 + j.ph) * 0.05 : 0);
      });
      // Menschen auf den Gehwegen
      P.forEach((p, i) => {
        const z = p.z0 - p.v * Math.max(0, t - 15);
        people.set(i, { x: p.x, z, rotY: Math.PI, swing: Math.sin(t * p.v * 2.6 + p.ph) * 0.75, visible: z > -160 && level < 0.5 });
      });
      people.commit();
      roofers.forEach((j, i) => {
        const on = t > 30;
        ROOF.set(i, { x: j.g.position.x, y: j.g.position.y + 1.68, z: j.g.position.z + 0.2, rotY: j.ph, armRaise: 2.4 + Math.sin(t * 5 + j.ph) * 0.4, visible: on });
      });
      ROOF.commit();
      // Welle
      wave.visible = waveZ < 400;
      if (wave.visible) {
        wave.position.set(0, Math.max(0, level - 0.6), waveZ);
        FD.forEach((f, i) => {
          const jig = Math.sin(t * 3 + f.ph);
          if (f.foot) o3.position.set(f.x, 0.5 + jig * 0.3, 2.4 + f.z * 0.3 + jig * 0.4);
          else o3.position.set(f.x, f.y + jig * 0.35, f.z + Math.cos(t * 2.4 + f.ph) * 0.4);
          o3.rotation.set(t + f.ph, f.ph, 0); o3.scale.setScalar(f.s * (1 + 0.2 * jig)); o3.updateMatrix(); crestFoam.setMatrixAt(i, o3.matrix);
        });
        crestFoam.instanceMatrix.needsUpdate = true;
        debris.forEach((d) => {
          d.g.visible = waveZ - d.z - egoZ > 5;
          d.g.position.set(d.x, 1.2 + Math.sin(t * d.sp + d.ph) * 0.8, d.z);
          d.g.rotation.set(Math.sin(t * 0.8 * d.sp + d.ph) * 0.9, t * 0.3 * d.sp + d.ph, Math.cos(t * 0.6 + d.ph) * 0.7);
        });
        CD.forEach((c, i) => {
          o3.position.set(c.x, 0.8 + Math.sin(t * 1.7 + c.ph) * 0.6, c.z); o3.rotation.set(t + c.ph, t * 0.7, c.ph); o3.scale.setScalar(waveZ - c.z - egoZ > 4 ? c.s : 0); o3.updateMatrix(); crates.setMatrixAt(i, o3.matrix);
        });
        crates.instanceMatrix.needsUpdate = true;
      }
    },
  };
}

// ======================================================== Autoinnenraum (POV) ===
// Lokale Koordinaten des Ego-Autos (Boden = 0, Fahrtrichtung -z). Fahrer sitzt links (x = -0,37).
export const DRIVER = new THREE.Vector3(-0.37, 1.24, 0.3);
export function egoCar() {
  const g = new THREE.Group();
  const paint = mat("#7a1f22", { roughness: 0.45, metalness: 0.2 });
  const dark = mat("#3a3d43", { roughness: 0.9 }), trim = mat("#4c5058", { roughness: 0.8 }), liner = mat("#b5b6b8", { roughness: 1 });
  // Karosserie außen (Haube, Kotflügel)
  box(1.8, 0.2, 1.5, paint, 0, 0.98, -1.55, g);
  // Armaturenbrett
  box(1.72, 0.24, 0.55, dark, 0, 0.98, -0.78, g);
  box(0.46, 0.1, 0.24, trim, DRIVER.x, 1.13, -0.66, g);         // Tacho-Haube
  box(0.22, 0.14, 0.05, mat("#0c0d10"), 0.05, 1.06, -0.52, g);  // Mittelkonsole/Display
  // Lenkrad
  const wheel = new THREE.Group();
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.185, 0.022, 6, 18), dark); wheel.add(rim);
  box(0.34, 0.04, 0.03, dark, 0, -0.02, 0, wheel);
  box(0.03, 0.15, 0.03, dark, 0, -0.1, 0, wheel);
  box(0.09, 0.07, 0.05, trim, 0, -0.02, 0.01, wheel);
  wheel.position.set(DRIVER.x, 0.95, -0.38); wheel.rotation.x = -0.42; g.add(wheel);
  box(0.06, 0.06, 0.3, dark, DRIVER.x, 0.92, -0.52, g).rotation.x = -0.42;
  // Säulen, Dachhimmel, Türen
  for (const s of [-1, 1]) {
    const pil = box(0.09, 0.85, 0.09, trim, s * 0.8, 1.42, -0.62, g); pil.rotation.x = -0.75; pil.rotation.z = -s * 0.1;
    box(0.08, 0.55, 1.6, mat("#3b3e44"), s * 0.88, 0.85, 0.0, g);
  }
  box(1.7, 0.05, 1.4, liner, 0, 1.66, 0.25, g);
  box(1.7, 0.08, 0.08, trim, 0, 1.63, -0.42, g);
  box(0.24, 0.07, 0.03, mat("#202226"), 0.02, 1.53, -0.47, g);   // Rückspiegel
  g.traverse((o) => { if (o.isMesh) { o.castShadow = false; o.receiveShadow = false; } });
  const lamp = new THREE.PointLight("#fff3e0", 1.6, 3.5, 1.5); lamp.position.set(-0.3, 1.55, 0.35); g.add(lamp);
  return { group: g, wheel };
}
