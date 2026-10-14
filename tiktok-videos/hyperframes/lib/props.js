// Requisiten für POV-Szenen: Hände, Handy, Becher, Geldscheine, Regale, Waren,
// Mülltonnen, Spüle, Bahnsteig, Büro. Alles Low-Poly, flat shading, deterministisch.
import * as THREE from "./three.module.min.js";
import { rng, clamp, smooth, lerp, building, windowTextures } from "./lowpoly.js";

export const mat = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.85, flatShading: true, ...extra });
export const basic = (color, extra = {}) => new THREE.MeshBasicMaterial({ color, ...extra });

export function box(w, h, d, material, x = 0, y = 0, z = 0, parent) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  m.position.set(x, y, z);
  m.castShadow = true; m.receiveShadow = true;
  if (parent) parent.add(m);
  return m;
}
export function cyl(rt, rb, h, seg, material, x = 0, y = 0, z = 0, parent) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), material);
  m.position.set(x, y, z);
  m.castShadow = true; m.receiveShadow = true;
  if (parent) parent.add(m);
  return m;
}

// ------------------------------------------------------------- Texturen ---
/** Canvas-Textur mit Zeichenfunktion draw(ctx, w, h). */
export function canvasTexture(w, h, draw) {
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  const ctx = c.getContext("2d");
  draw(ctx, w, h);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return { tex, ctx, canvas: c, redraw(fn) { fn(ctx, w, h); tex.needsUpdate = true; } };
}

export function tileTexture(color = "#e8e4da", grout = "#b9b3a6", n = 8, size = 512) {
  const { tex } = canvasTexture(size, size, (g, w) => {
    g.fillStyle = grout; g.fillRect(0, 0, w, w);
    const s = w / n;
    g.fillStyle = color;
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) g.fillRect(x * s + 2, y * s + 2, s - 4, s - 4);
  });
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

export function cobbleTexture(seed = 5, size = 512) {
  const r = rng(seed);
  const { tex } = canvasTexture(size, size, (g, w) => {
    g.fillStyle = "#5c5853"; g.fillRect(0, 0, w, w);
    const s = w / 16;
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
      const v = 95 + Math.floor(r() * 50);
      g.fillStyle = `rgb(${v},${v - 4},${v - 10})`;
      g.fillRect(x * s + (y % 2) * s / 2 + 2, y * s + 2, s - 4, s - 4);
    }
  });
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

/** Fläche mit Text (Schilder, Anzeigen). lines = [{ text, size, color, y, font, align }] */
export function textPanel(w, h, pxPerUnit, bg, lines) {
  const { tex } = canvasTexture(Math.round(w * pxPerUnit), Math.round(h * pxPerUnit), (g, cw, ch) => {
    g.fillStyle = bg; g.fillRect(0, 0, cw, ch);
    for (const l of lines) {
      g.fillStyle = l.color || "#fff";
      g.font = `${l.weight || 600} ${l.size}px ${l.font || "Inter, Arial, sans-serif"}`;
      g.textAlign = l.align || "center";
      g.textBaseline = "middle";
      const x = l.align === "left" ? (l.x ?? 0.06) * cw : l.align === "right" ? (l.x ?? 0.94) * cw : cw / 2;
      g.fillText(l.text, x, l.y * ch);
    }
  });
  return new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }));
}

// ---------------------------------------------------------------- Hände ---
// Eine Hand = Ärmel + Handfläche + 4 Finger + Daumen. Ursprung am Handgelenk,
// Finger zeigen nach -z. curl(0..1) krümmt die Finger.
const SKIN = "#e9b892";
export function hand(side = 1, sleeveColor = "#2d3340") {
  const g = new THREE.Group();
  const skin = mat(SKIN, { roughness: 0.7 });
  const sleeve = mat(sleeveColor);
  box(0.105, 0.1, 0.5, sleeve, 0, 0, 0.27, g);
  box(0.095, 0.085, 0.03, mat("#1d2129"), 0, 0, 0.03, g); // Bündchen
  const palm = box(0.085, 0.03, 0.095, skin, 0, 0, -0.045, g);
  const fingers = [];
  for (let i = 0; i < 4; i++) {
    const pivot = new THREE.Group();
    pivot.position.set((-0.03 + i * 0.02) * side, 0, -0.092);
    const len = [0.058, 0.066, 0.062, 0.05][i];
    box(0.017, 0.019, len, skin, 0, 0, -len / 2, pivot);
    g.add(pivot); fingers.push(pivot);
  }
  const thumb = new THREE.Group();
  thumb.position.set(0.045 * side, -0.005, -0.03);
  box(0.02, 0.02, 0.055, skin, 0, 0, -0.027, thumb);
  thumb.rotation.y = 0.55 * side;
  g.add(thumb);
  g.userData = {
    curl(c) {
      fingers.forEach((f, i) => { f.rotation.x = -c * (1.35 + i * 0.05); });
      thumb.rotation.x = -c * 0.8;
    },
  };
  g.userData.curl(0.2);
  g.traverse((o) => { if (o.isMesh) { o.castShadow = false; o.receiveShadow = false; } });
  return g;
}

// ------------------------------------------------------- Handgehaltenes ---
export function coffeeCup() {
  const g = new THREE.Group();
  cyl(0.042, 0.032, 0.13, 10, mat("#f2efe8"), 0, 0, 0, g);
  cyl(0.044, 0.04, 0.05, 10, mat("#9a6a3e"), 0, -0.005, 0, g);    // Papiermanschette
  cyl(0.045, 0.045, 0.014, 10, mat("#2b2b2b"), 0, 0.071, 0, g);   // Deckel
  return g;
}

/** Handy mit Bildschirm-Canvas (draw(ctx, w, h) zum Neuzeichnen). */
export function phone() {
  const g = new THREE.Group();
  box(0.074, 0.152, 0.009, mat("#141518", { roughness: 0.3, metalness: 0.4 }), 0, 0, 0, g);
  const screen = canvasTexture(296, 600, () => {});
  const s = new THREE.Mesh(new THREE.PlaneGeometry(0.068, 0.145), new THREE.MeshBasicMaterial({ map: screen.tex, toneMapped: false }));
  s.position.z = 0.0052; g.add(s);
  g.userData.screen = screen;
  return g;
}

export function phoneScreen(ctx, w, h, { time = "08:00", title = "", lines = [], bg = "#0d1117", accent = "#ff5b4a", battery = 64, net = true }) {
  ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = "#fff"; ctx.font = "600 22px Inter, Arial"; ctx.textAlign = "left"; ctx.textBaseline = "top";
  ctx.fillText(time, 24, 18);
  ctx.textAlign = "right";
  ctx.fillText(net ? `▮▮▮  ${battery}%` : `Kein Netz  ${battery}%`, w - 20, 18);
  ctx.textAlign = "center";
  ctx.font = "600 34px Inter, Arial"; ctx.fillStyle = accent;
  ctx.fillText(title, w / 2, h * 0.36);
  ctx.font = "500 22px Inter, Arial"; ctx.fillStyle = "#c9d1d9";
  lines.forEach((l, i) => ctx.fillText(l, w / 2, h * 0.46 + i * 34));
}

/** Fächer aus Euro-Scheinen. Gibt { group, bills[] } zurück. */
export function billFan() {
  const g = new THREE.Group();
  const notes = [["50", "#e39a4e"], ["20", "#6f9bd1"], ["100", "#7fae86"], ["50", "#e39a4e"], ["10", "#d27a72"]];
  const bills = notes.map(([v, c], i) => {
    const { tex } = canvasTexture(256, 128, (x, w, h) => {
      x.fillStyle = c; x.fillRect(0, 0, w, h);
      x.fillStyle = "rgba(255,255,255,0.35)"; x.fillRect(16, 16, w - 32, h - 32);
      x.fillStyle = "rgba(0,0,0,0.55)"; x.font = "700 54px Inter, Arial"; x.textBaseline = "middle";
      x.fillText(v, 26, h / 2 + 2);
      x.font = "600 18px Inter, Arial"; x.fillText("EURO", w - 92, h - 30);
    });
    const m = new THREE.Mesh(new THREE.PlaneGeometry(0.15, 0.075), new THREE.MeshStandardMaterial({ map: tex, side: THREE.DoubleSide, roughness: 0.9 }));
    const pivot = new THREE.Group();
    m.position.set(0.0, 0.03, 0);
    pivot.add(m);
    pivot.rotation.z = -0.5 + i * 0.25;
    pivot.position.z = i * 0.002;
    g.add(pivot);
    return pivot;
  });
  return { group: g, bills };
}

export function trashBag(scale = 1, color = "#1d1e21") {
  const g = new THREE.Group();
  const m = new THREE.Mesh(new THREE.IcosahedronGeometry(0.2 * scale, 0), mat(color, { roughness: 0.4, metalness: 0.1 }));
  m.scale.set(1, 1.15, 1); g.add(m);
  const knot = new THREE.Mesh(new THREE.ConeGeometry(0.05 * scale, 0.12 * scale, 5), mat(color, { roughness: 0.4 }));
  knot.position.y = 0.24 * scale; g.add(knot);
  return g;
}

// ------------------------------------------------------------ Supermarkt ---
const PRODUCT_COLORS = ["#d94f3d", "#f2c94c", "#2f80ed", "#27ae60", "#f2994a", "#9b51e0", "#e0e0e0", "#eb5757", "#56ccf2", "#6fcf97", "#bb6bd9", "#f2f2f2", "#333333"];

/**
 * Gang mit Regalen links und rechts. Gibt { group, update(t) } zurück.
 * emptyFrom/emptyTo: Zeitfenster, in dem die Waren verschwinden.
 */
export function supermarketAisle({ length = 18, emptyFrom = 9.3, emptyTo = 11.6, seed = 31 } = {}) {
  const r = rng(seed);
  const g = new THREE.Group();
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(8, length + 10), new THREE.MeshStandardMaterial({ map: (() => { const t = tileTexture("#e9e6df", "#cfcac0", 8); t.repeat.set(4, (length + 10) / 2); return t; })(), roughness: 0.35 }));
  floor.rotation.x = -Math.PI / 2; floor.position.z = -length / 2 + 2; floor.receiveShadow = true; g.add(floor);
  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(8, length + 10), mat("#d9d9d6"));
  ceil.rotation.x = Math.PI / 2; ceil.position.set(0, 3.6, -length / 2 + 2); g.add(ceil);
  for (let z = 1; z > -length; z -= 3) box(0.5, 0.04, 1.6, basic("#fffaf0"), 0, 3.57, z, g); // Lichtbänder
  // Regale
  const frameMat = mat("#c7cbd1", { metalness: 0.3, roughness: 0.5 });
  const tagMat = mat("#f2d24b");
  const levels = [0.12, 0.55, 0.98, 1.41, 1.84];
  const slots = [];
  for (const s of [-1, 1]) {
    const x = s * 1.55;
    box(0.06, 2.2, length, frameMat, x + s * 0.27, 1.1, -length / 2 + 1, g);
    for (const y of levels) {
      box(0.55, 0.035, length, frameMat, x, y, -length / 2 + 1, g);
      box(0.02, 0.05, length, tagMat, x - s * 0.285, y + 0.01, -length / 2 + 1, g);
    }
    box(0.6, 0.12, length, mat("#9aa0a8"), x, 2.26, -length / 2 + 1, g);
    for (const y of levels) {
      let z = 0.8;
      while (z > -length + 1.2) {
        const kind = r() < 0.3 ? "can" : "box";
        const w = kind === "can" ? 0.11 : r.range(0.12, 0.26);
        const h = kind === "can" ? 0.15 : r.range(0.18, 0.36);
        const color = r.pick(PRODUCT_COLORS);
        const rows = 2;
        for (let k = 0; k < rows; k++) {
          slots.push({ kind, x: x - s * (0.15 - k * 0.2), y: y + 0.02 + h / 2, z: z - w / 2, w, h, d: kind === "can" ? 0.11 : 0.16, color,
                       gone: r() < 0.92 ? lerp(emptyFrom, emptyTo, Math.pow(r(), 0.8)) : 1e9 });
        }
        z -= w + 0.015;
      }
    }
  }
  const boxes = slots.filter((p) => p.kind === "box");
  const cans = slots.filter((p) => p.kind === "can");
  const mkInst = (geo, list) => {
    const m = new THREE.InstancedMesh(geo, mat("#ffffff", { roughness: 0.6 }), list.length);
    const c = new THREE.Color();
    list.forEach((p, i) => m.setColorAt(i, c.set(p.color)));
    m.castShadow = false; m.receiveShadow = true;
    g.add(m);
    return m;
  };
  const boxMesh = mkInst(new THREE.BoxGeometry(1, 1, 1), boxes);
  const canMesh = mkInst(new THREE.CylinderGeometry(0.5, 0.5, 1, 8), cans);
  const d = new THREE.Object3D();
  function place(mesh, list, t) {
    list.forEach((p, i) => {
      const k = t < p.gone ? 1 : 0;
      d.position.set(p.x, p.y, p.z);
      d.scale.set(p.d * k, p.h * k, p.w * k);
      d.updateMatrix(); mesh.setMatrixAt(i, d.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
  }
  // Schild über dem Gang
  const sign = textPanel(1.6, 0.36, 300, "#1f5f3a", [{ text: "Grundnahrungsmittel", size: 40, y: 0.5 }]);
  sign.position.set(0, 2.95, -6); g.add(sign);
  return { group: g, update(t) { place(boxMesh, boxes, t); place(canMesh, cans, t); } };
}

export function shoppingCart() {
  const g = new THREE.Group();
  const wire = new THREE.LineBasicMaterial({ color: "#b9bec6" });
  const basketGeo = new THREE.BoxGeometry(0.5, 0.32, 0.75, 4, 3, 6);
  g.add(new THREE.LineSegments(new THREE.EdgesGeometry(basketGeo, 1), wire));
  const grid = new THREE.LineSegments(new THREE.WireframeGeometry(new THREE.PlaneGeometry(0.5, 0.75, 6, 9)), wire);
  grid.rotation.x = -Math.PI / 2; grid.position.y = -0.16; g.add(grid);
  const handle = cyl(0.018, 0.018, 0.56, 8, mat("#c0392b", { roughness: 0.5 }), 0, 0.2, 0.42, g);
  handle.rotation.z = Math.PI / 2;
  for (const x of [-0.24, 0.24]) box(0.02, 0.2, 0.02, mat("#b9bec6"), x, 0.1, 0.4, g);
  return g;
}

// ------------------------------------------------------------- Hinterhof ---
export function trashCorner({ seed = 41, growFrom = 12.2, growTo = 14.6 } = {}) {
  const r = rng(seed);
  const g = new THREE.Group();
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(14, 14), new THREE.MeshStandardMaterial({ map: (() => { const t = cobbleTexture(); t.repeat.set(5, 5); return t; })(), roughness: 0.95 }));
  ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; g.add(ground);
  const tex = windowTextures(51, "altbau");
  const wall = building({ w: 14, h: 16, d: 1, color: "#cdb497", tex });
  wall.mesh.position.set(0, 0, -3.2); g.add(wall.mesh);
  const side = building({ w: 1, h: 16, d: 10, color: "#bfa98d", tex });
  side.mesh.position.set(-4.2, 0, 1.5); g.add(side.mesh);
  // Tonnen: BSR orange, grau, blau
  const bins = [];
  [["#e5701f", -1.6], ["#5a5f66", -0.7], ["#e5701f", 0.2], ["#2f5aa8", 1.1], ["#5a5f66", 2.0]].forEach(([c, x], i) => {
    const bin = new THREE.Group();
    box(0.68, 1.05, 0.72, mat(c, { roughness: 0.6 }), 0, 0.53, 0, bin);
    const lid = new THREE.Group();
    box(0.72, 0.06, 0.76, mat(c, { roughness: 0.6 }), 0, 0, 0.38, lid);
    lid.position.set(0, 1.07, -0.37);
    lid.rotation.x = -0.6 - r() * 0.7;
    bin.add(lid);
    box(0.6, 0.18, 0.6, mat("#222326"), 0, 1.08, 0, bin); // Müll guckt raus
    bin.position.set(x, 0, -2.4); bin.rotation.y = r.range(-0.12, 0.12);
    g.add(bin); bins.push(bin);
  });
  // wachsende Müllberge
  const N = 70;
  const bagMesh = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.22, 0), mat("#ffffff", { roughness: 0.4, metalness: 0.1 }), N);
  const c = new THREE.Color();
  const bags = [];
  for (let i = 0; i < N; i++) {
    bags.push({ x: r.range(-2.4, 2.6), z: r.range(-2.1, -0.4) + (i / N) * 0.6, s: r.range(0.8, 1.5), at: lerp(growFrom, growTo, i / N) + r() * 0.3, ry: r() * 6, stack: r() * 0.5 });
    bagMesh.setColorAt(i, c.set(r.pick(["#1d1e21", "#2a2c31", "#3a3f2e", "#55585f", "#7a6e5a", "#2e3a4a"])));
  }
  g.add(bagMesh);
  // Fliegen
  const F = 40;
  const flies = new THREE.InstancedMesh(new THREE.BoxGeometry(0.012, 0.012, 0.012), basic("#111111"), F);
  g.add(flies);
  const fd = []; for (let i = 0; i < F; i++) fd.push({ cx: r.range(-1.6, 1.8), cy: r.range(0.8, 1.6), cz: r.range(-2.3, -1.2), r: r.range(0.08, 0.3), sp: r.range(4, 9), ph: r() * 6 });
  const d = new THREE.Object3D();
  return {
    group: g,
    update(t) {
      bags.forEach((b, i) => {
        const k = smooth((t - b.at) / 0.25);
        d.position.set(b.x, 0.2 * b.s + b.stack * k, b.z);
        d.rotation.set(0.2, b.ry, 0.15);
        d.scale.set(b.s * k, b.s * 0.85 * k, b.s * k);
        d.updateMatrix(); bagMesh.setMatrixAt(i, d.matrix);
      });
      bagMesh.instanceMatrix.needsUpdate = true;
      fd.forEach((f, i) => {
        const a = t * f.sp + f.ph;
        d.position.set(f.cx + Math.cos(a) * f.r, f.cy + Math.sin(a * 1.7) * 0.08, f.cz + Math.sin(a) * f.r);
        d.rotation.set(0, 0, 0); d.scale.setScalar(t > 12.3 ? 1 : 0);
        d.updateMatrix(); flies.setMatrixAt(i, d.matrix);
      });
      flies.instanceMatrix.needsUpdate = true;
    },
  };
}

// --------------------------------------------------------------- Bahnsteig ---
export function subwayPlatform() {
  const g = new THREE.Group();
  const tiles = tileTexture("#e2cf8e", "#b9a76a", 10);
  tiles.repeat.set(12, 2);
  const wallMat = new THREE.MeshStandardMaterial({ map: tiles, roughness: 0.4 });
  // Boden Bahnsteig (x 0..4), Gleisbett (x -4..0, tiefer)
  box(4.4, 1.0, 60, mat("#8f8a82"), 2.2, -0.5, -20, g);
  box(4.4, 0.02, 60, mat("#6f6a62"), -2.2, -1.0, -20, g);
  box(0.3, 0.012, 60, mat("#f2c318"), 0.25, 0.006, -20, g); // Sicherheitslinie
  for (const x of [-1.5, -2.9]) box(0.08, 0.12, 60, mat("#7b7f86", { metalness: 0.6, roughness: 0.4 }), x, -0.9, -20, g);
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(60, 4), wallMat);
  wall.rotation.y = -Math.PI / 2; wall.position.set(4.4, 1.8, -20); g.add(wall);
  const wall2 = new THREE.Mesh(new THREE.PlaneGeometry(60, 5), wallMat);
  wall2.rotation.y = Math.PI / 2; wall2.position.set(-4.4, 1.5, -20); g.add(wall2);
  box(9, 0.1, 60, mat("#5c5b58"), 0, 3.8, -20, g);
  for (let z = 4; z > -48; z -= 4) box(0.15, 0.05, 1.8, basic("#f4f7ff"), 1.6, 3.73, z, g);
  // Stationsschild
  const sign = textPanel(3.2, 0.5, 200, "#1d3b8f", [{ text: "Alexanderplatz", size: 60, y: 0.52 }]);
  sign.rotation.y = -Math.PI / 2; sign.position.set(4.37, 2.3, -7); g.add(sign);
  // Zug (BVG gelb), Türen offen
  const train = new THREE.Group();
  const yellow = mat("#f2c318", { roughness: 0.5 });
  const dark = mat("#20242a");
  box(2.4, 2.6, 34, yellow, 0, 0.4, 0, train);
  for (let z = -15; z < 16; z += 2.6) box(2.42, 0.9, 1.6, mat("#1b2229", { roughness: 0.2, metalness: 0.5 }), 0, 0.95, z, train);
  for (const z of [-11, -3.4, 4.2, 11.8]) box(0.05, 1.9, 1.3, dark, 1.2, 0.1, z, train); // offene Türen (dunkel)
  train.position.set(-2.2, -0.5, -18);
  g.add(train);
  // Anzeige
  const board = new THREE.Group();
  box(1.9, 0.62, 0.12, mat("#15171a"), 0, 0, 0, board);
  const disp = canvasTexture(560, 180, () => {});
  const dm = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 0.54), new THREE.MeshBasicMaterial({ map: disp.tex, toneMapped: false }));
  dm.position.z = 0.065; board.add(dm);
  cyl(0.02, 0.02, 0.9, 6, mat("#3a3d42"), -0.7, 0.75, 0, board);
  cyl(0.02, 0.02, 0.9, 6, mat("#3a3d42"), 0.7, 0.75, 0, board);
  board.position.set(2.0, 2.75, -5.5);
  g.add(board);
  return {
    group: g,
    update(t) {
      disp.redraw((x, w, h) => {
        x.fillStyle = "#0a0b0c"; x.fillRect(0, 0, w, h);
        x.fillStyle = "#ffb43a"; x.textBaseline = "middle"; x.textAlign = "left";
        x.font = "700 42px 'Courier New', monospace";
        x.fillText("U2  Pankow", 24, 50);
        x.textAlign = "right"; x.fillText("— —", w - 24, 50);
        const blink = Math.floor(t * 2.5) % 2 === 0;
        x.textAlign = "center"; x.font = "700 40px 'Courier New', monospace";
        if (blink) x.fillText("ZUGAUSFALL", w / 2, 128);
      });
    },
  };
}

// ------------------------------------------------------------- Wohnung ---
export function livingRoom({ seed = 61 } = {}) {
  const r = rng(seed);
  const g = new THREE.Group();
  const wallMat = mat("#d8d2c6");
  // Raum 6 x 3 x 5, Fensterwand bei z = -2.5
  box(6, 0.05, 6, mat("#8a6a4a"), 0, 0, 0, g);              // Dielen
  box(6, 0.05, 6, wallMat, 0, 3, 0, g);
  box(0.05, 3, 6, wallMat, -3, 1.5, 0, g);
  box(0.05, 3, 6, wallMat, 3, 1.5, 0, g);
  // Fensterwand mit großem Fenster (Öffnung 3.2 x 2)
  box(1.4, 3, 0.1, wallMat, -2.3, 1.5, -2.5, g);
  box(1.4, 3, 0.1, wallMat, 2.3, 1.5, -2.5, g);
  box(3.2, 0.6, 0.1, wallMat, 0, 0.3, -2.5, g);
  box(3.2, 0.4, 0.1, wallMat, 0, 2.8, -2.5, g);
  const frame = mat("#f1eee8");
  box(3.2, 0.06, 0.12, frame, 0, 0.62, -2.5, g); box(3.2, 0.06, 0.12, frame, 0, 2.58, -2.5, g);
  for (const x of [-1.6, 0, 1.6]) box(0.06, 2, 0.12, frame, x, 1.6, -2.5, g);
  box(0.6, 2.6, 0.08, mat("#7a3b2e"), -1.95, 1.6, -2.35, g); // Vorhang
  // Sofa-Rückenlehne im Vordergrund, Pflanze, Stehlampe
  box(2.6, 0.5, 0.4, mat("#3f4a5a"), 0.4, 0.55, -0.4, g);
  box(2.6, 0.3, 0.9, mat("#3f4a5a"), 0.4, 0.3, -0.95, g);
  const pot = cyl(0.18, 0.14, 0.35, 8, mat("#b5653a"), 2.3, 0.18, -1.9, g);
  for (let i = 0; i < 7; i++) { const l = box(0.06, 0.6, 0.2, mat("#3d6b3a"), 2.3, 0.6, -1.9, g); l.rotation.set(r.range(-0.5, 0.5), i, r.range(-0.6, 0.6)); }
  const lampShade = cyl(0.22, 0.3, 0.3, 10, mat("#f4e6c8", { emissive: new THREE.Color("#ffcf8a"), emissiveIntensity: 0.8 }), -2.4, 1.7, -1.6, g);
  cyl(0.02, 0.02, 1.6, 6, mat("#2b2b2b"), -2.4, 0.8, -1.6, g);
  const ceilLamp = cyl(0.25, 0.25, 0.08, 12, basic("#fff2d6"), 0, 2.95, 0, g);
  const roomLight = new THREE.PointLight("#ffd9a0", 6, 12, 1.5);
  roomLight.position.set(0, 2.6, 0); g.add(roomLight);
  const lampLight = new THREE.PointLight("#ffcf8a", 2.5, 6, 1.5);
  lampLight.position.set(-2.4, 1.6, -1.6); g.add(lampLight);
  // Skyline draußen
  const sky = new THREE.Group();
  const texs = [windowTextures(71, "plattenbau"), windowTextures(72, "altbau"), windowTextures(73, "plattenbau")];
  const towers = [];
  for (let i = 0; i < 70; i++) {
    const dist = r.range(70, 320);
    const x = r.range(-1, 1) * (20 + dist * 0.7);
    const b = building({ w: r.range(10, 22), h: r.range(25, 70), d: r.range(10, 22), color: r.pick(["#9aa0a8", "#b6a99a", "#8d9097", "#c2b8a8"]), tex: r.pick(texs) });
    b.mesh.position.set(x, -40, -dist - 6);
    sky.add(b.mesh);
    towers.push({ m: b.material, off: 15.5 + (1 - dist / 320) * 1.4 + r() * 0.15 });
  }
  g.add(sky);
  return {
    group: g,
    update(t) {
      for (const tw of towers) tw.m.emissiveIntensity = t < tw.off ? 1.7 : (t < tw.off + 0.12 ? 0.5 : 0);
      const roomOn = t < 17.25 ? 1 : (t < 17.4 ? (Math.sin(t * 120) > 0 ? 0.6 : 0) : 0);
      roomLight.intensity = 6 * roomOn; lampLight.intensity = 2.5 * roomOn;
      ceilLamp.material.color.set(roomOn > 0.1 ? "#fff2d6" : "#3a3a3a");
      lampShade.material.emissiveIntensity = 0.8 * roomOn;
    },
  };
}

// ---------------------------------------------------------------- Küche ---
export function kitchenSink() {
  const g = new THREE.Group();
  const tiles = tileTexture("#e9eef0", "#b7c0c4", 6); tiles.repeat.set(4, 2);
  const back = new THREE.Mesh(new THREE.PlaneGeometry(4, 1.6), new THREE.MeshStandardMaterial({ map: tiles, roughness: 0.3 }));
  back.position.set(0, 1.75, -0.65); g.add(back);
  box(4, 0.06, 0.8, mat("#d8d2c4", { roughness: 0.4 }), 0, 0.92, -0.25, g);   // Arbeitsplatte
  box(4, 0.9, 0.75, mat("#3f4d5c"), 0, 0.45, -0.25, g);                      // Schränke
  box(4, 0.7, 0.4, mat("#3f4d5c"), 0, 2.35, -0.45, g);                       // Oberschränke
  const steel = mat("#b9c0c6", { metalness: 0.75, roughness: 0.25 });
  box(0.62, 0.02, 0.46, mat("#5f666c", { metalness: 0.6, roughness: 0.3 }), 0, 0.78, -0.22, g); // Beckenboden
  box(0.66, 0.16, 0.03, steel, 0, 0.86, 0.02, g); box(0.66, 0.16, 0.03, steel, 0, 0.86, -0.46, g);
  box(0.03, 0.16, 0.48, steel, -0.33, 0.86, -0.22, g); box(0.03, 0.16, 0.48, steel, 0.33, 0.86, -0.22, g);
  // Wasserhahn
  cyl(0.025, 0.03, 0.32, 8, steel, 0, 1.1, -0.48, g);
  const spout = cyl(0.018, 0.018, 0.22, 8, steel, 0, 1.25, -0.38, g); spout.rotation.x = Math.PI / 2;
  const lever = new THREE.Group(); lever.position.set(0, 1.27, -0.5);
  box(0.02, 0.02, 0.14, steel, 0, 0.0, 0.07, lever); g.add(lever);
  const water = cyl(0.012, 0.014, 0.42, 8, new THREE.MeshStandardMaterial({ color: "#bfe4ff", transparent: true, opacity: 0.7, emissive: "#335a7a", emissiveIntensity: 0.6, roughness: 0.1 }), 0, 1.03, -0.28, g);
  const drops = [];
  for (let i = 0; i < 6; i++) { const d = new THREE.Mesh(new THREE.SphereGeometry(0.01, 6, 4), water.material); g.add(d); drops.push(d); }
  return {
    group: g,
    update(t) {
      const open = smooth((t - 18.25) / 0.35);
      lever.rotation.x = -0.6 * open;
      const flow = open * (1 - smooth((t - 18.7) / 0.9));
      water.visible = flow > 0.03;
      water.scale.set(Math.max(flow, 0.05), 1, Math.max(flow, 0.05));
      // Tropfen nach dem Versiegen
      drops.forEach((d, i) => {
        const start = 19.5 + i * 0.32;
        const u = t - start;
        d.visible = u > 0 && u < 0.45 && t < 21;
        d.position.set(0, 1.23 - 0.5 * 9.8 * u * u, -0.28);
      });
    },
  };
}

// --------------------------------------------------------- Späti-Front ---
export function storefront() {
  const g = new THREE.Group();
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(12, 12), mat("#77726b"));
  ground.rotation.x = -Math.PI / 2; ground.position.z = 2; ground.receiveShadow = true; g.add(ground);
  const tex = windowTextures(81, "altbau");
  const b = building({ w: 1.5, h: 15, d: 12, color: "#c9a77f", tex });
  b.mesh.rotation.y = Math.PI / 2; b.mesh.position.set(0, 0, -2.2); g.add(b.mesh);
  box(3.6, 2.4, 0.2, mat("#2a2b2e"), -0.6, 1.3, -1.4, g);                          // Ladenfenster (dunkel)
  const glass = box(3.4, 2.2, 0.05, mat("#16202a", { roughness: 0.1, metalness: 0.6 }), -0.6, 1.3, -1.28, g);
  const shutter = box(3.5, 1.1, 0.06, mat("#8d9298", { metalness: 0.5, roughness: 0.5 }), -0.6, 1.95, -1.22, g);
  const sign = textPanel(3.6, 0.6, 160, "#20252c", [{ text: "SPÄTI", size: 70, y: 0.52, color: "#5b6470" }]);
  sign.position.set(-0.6, 2.85, -1.27); g.add(sign);
  box(1.1, 2.2, 0.08, mat("#3a2e26"), 1.9, 1.1, -1.32, g);                          // Tür
  const note = textPanel(0.42, 0.3, 500, "#f4f1e8", [{ text: "Geschlossen", size: 42, y: 0.42, color: "#222", font: "Georgia, serif", weight: 700 }, { text: "bis auf Weiteres", size: 22, y: 0.74, color: "#555", font: "Georgia, serif" }]);
  note.position.set(1.9, 1.45, -1.27); g.add(note);
  return { group: g };
}

// ----------------------------------------------------------------- Büro ---
export function office({ seed = 91 } = {}) {
  const r = rng(seed);
  const g = new THREE.Group();
  box(16, 0.04, 20, mat("#5d6a78"), 0, 0, -6, g);                     // Teppich
  box(16, 0.05, 20, mat("#e9e9e6"), 0, 3.2, -6, g);
  for (let z = 2; z > -15; z -= 3) for (const x of [-3, 0, 3]) box(1.2, 0.03, 0.6, basic("#fbfbf8"), x, 3.17, z, g);
  // Fensterfront rechts (hell)
  const win = new THREE.Mesh(new THREE.PlaneGeometry(20, 3), basic("#f6e2bf"));
  win.rotation.y = -Math.PI / 2; win.position.set(6, 1.6, -6); g.add(win);
  for (let z = 4; z > -16; z -= 2) box(0.1, 3.2, 0.12, mat("#2b2e33"), 5.95, 1.6, z, g);
  box(0.1, 3.2, 20, mat("#e3e0da"), -6, 1.6, -6, g);
  const seats = [];
  const deskMat = mat("#f2f1ec"), legMat = mat("#3a3d42");
  for (let row = 0; row < 4; row++) for (const x of [-3.4, -1.6, 1.6, 3.4]) {
    const z = -2 - row * 2.6;
    box(1.5, 0.05, 0.8, deskMat, x, 0.74, z, g);
    for (const dx of [-0.7, 0.7]) box(0.04, 0.72, 0.7, legMat, x + dx, 0.37, z, g);
    box(0.55, 0.36, 0.04, mat("#1b1d21"), x, 1.0, z - 0.25, g);
    const screen = box(0.5, 0.31, 0.01, basic(r.pick(["#8fb4e8", "#a9d4c4", "#d9e4f2", "#9cc0f0"])), x, 1.0, z - 0.225, g);
    screen.rotation.y = Math.PI;
    seats.push({ x, z: z + 0.55 });
  }
  // Chefbüro (Glas) hinten
  const glassMat = new THREE.MeshStandardMaterial({ color: "#cfe3ee", transparent: true, opacity: 0.25, roughness: 0.05 });
  box(5, 3.1, 0.05, glassMat, 0, 1.55, -14, g);
  box(0.06, 3.1, 0.06, mat("#2b2e33"), -2.5, 1.55, -14, g); box(0.06, 3.1, 0.06, mat("#2b2e33"), 2.5, 1.55, -14, g);
  const door = textPanel(0.9, 0.32, 300, "#1f2328", [{ text: "CHEF", size: 66, y: 0.55, color: "#e9e4d8", weight: 700 }]);
  door.position.set(0.9, 1.75, -13.96); g.add(door);
  box(2.2, 0.06, 1.0, mat("#5a3b28"), 0, 0.76, -16, g);               // Chefschreibtisch
  const chair = new THREE.Group();
  box(0.7, 0.12, 0.65, mat("#151515", { roughness: 0.4 }), 0, 0.5, 0, chair);
  box(0.7, 0.95, 0.12, mat("#151515", { roughness: 0.4 }), 0, 1.0, 0.3, chair);
  cyl(0.04, 0.04, 0.45, 6, legMat, 0, 0.22, 0, chair);
  chair.position.set(0, 0, -15.2); g.add(chair);
  const plant = cyl(0.2, 0.16, 0.4, 8, mat("#b5653a"), 2.0, 0.2, -16.2, g);
  box(0.2, 0.9, 0.2, mat("#3d6b3a"), 2.0, 0.85, -16.2, g);
  return { group: g, seats, chair };
}

// ======================================================================
// Bausteine für "Sonne verschwindet" (und alles, was Natur/Kälte zeigt)
// ======================================================================

/** Eiswaffel mit zwei Kugeln. userData.top = obere Kugel (zum Runterrutschen). */
export function iceCream() {
  const g = new THREE.Group();
  const cone = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.13, 8), mat("#d4a25e"));
  cone.rotation.x = Math.PI; cone.position.y = -0.04; g.add(cone);
  const s1 = new THREE.Mesh(new THREE.IcosahedronGeometry(0.04, 1), mat("#f3e7c9", { roughness: 0.6 }));
  s1.position.y = 0.035; g.add(s1);
  const s2 = new THREE.Mesh(new THREE.IcosahedronGeometry(0.037, 1), mat("#ef8fa3", { roughness: 0.6 }));
  s2.position.y = 0.095; g.add(s2);
  g.userData.top = s2;
  return g;
}

/** Digitales Thermometer. setTemp(°C) zeichnet die Anzeige neu. */
export function thermometer() {
  const g = new THREE.Group();
  box(0.07, 0.15, 0.022, mat("#e9e9e4", { roughness: 0.5 }), 0, 0, 0, g);
  const disp = canvasTexture(240, 150, () => {});
  const d = new THREE.Mesh(new THREE.PlaneGeometry(0.058, 0.036), new THREE.MeshBasicMaterial({ map: disp.tex, toneMapped: false }));
  d.position.set(0, 0.035, 0.0115); g.add(d);
  box(0.02, 0.06, 0.02, mat("#b8b8b2"), 0, -0.1, 0, g);
  g.userData.setTemp = (c) => disp.redraw((x, w, h) => {
    x.fillStyle = "#b9c7b4"; x.fillRect(0, 0, w, h);
    x.fillStyle = "#1c2420"; x.font = "700 62px 'Courier New', monospace"; x.textAlign = "right"; x.textBaseline = "middle";
    const v = (c < 0 ? "-" : "") + Math.abs(c).toFixed(1).replace(".", ",");
    x.fillText(v, w - 52, h / 2 + 4);
    x.font = "700 34px Arial"; x.fillText("°C", w - 8, h / 2 - 18);
  });
  g.userData.setTemp(20);
  return g;
}

export function diveLamp() {
  const g = new THREE.Group();
  const body = cyl(0.03, 0.026, 0.16, 10, mat("#f2c318", { roughness: 0.4 }), 0, 0, 0, g);
  body.rotation.x = Math.PI / 2;
  const lens = cyl(0.033, 0.033, 0.01, 12, basic("#cfc8a8"), 0, 0, -0.085, g);
  lens.rotation.x = Math.PI / 2;
  return g;
}

/** Topfpflanze; update(k) lässt sie welken (0 = frisch, 1 = tot). */
export function pottedPlant(seed = 7) {
  const r = rng(seed);
  const g = new THREE.Group();
  cyl(0.075, 0.06, 0.11, 10, mat("#b5653a"), 0, 0.055, 0, g);
  cyl(0.07, 0.07, 0.01, 10, mat("#3b2a1d"), 0, 0.108, 0, g);
  const leaves = [];
  const green = new THREE.Color("#4f9a3c"), brown = new THREE.Color("#6b4f2a");
  for (let i = 0; i < 14; i++) {
    const stem = new THREE.Group();
    stem.position.set(r.range(-0.03, 0.03), 0.11, r.range(-0.03, 0.03));
    stem.rotation.y = r() * 6.28;
    const m = new THREE.MeshStandardMaterial({ color: green.clone(), roughness: 0.8, flatShading: true, side: THREE.DoubleSide });
    const leaf = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.008, 0.06), m);
    const h = r.range(0.05, 0.16);
    leaf.position.set(0, h, 0.03);
    stem.add(leaf);
    const stalk = cyl(0.003, 0.003, h, 4, mat("#3e7a30"), 0, h / 2, 0, stem);
    g.add(stem);
    leaves.push({ stem, leaf, m, base: r.range(-0.5, -0.2), h });
  }
  return {
    group: g,
    update(k) {
      for (const l of leaves) {
        l.stem.rotation.x = lerp(l.base, 1.2, smooth(k));
        l.m.color.copy(green).lerp(brown, smooth(k * 1.3));
        l.leaf.scale.set(1, 1, lerp(1, 0.6, k));
      }
    },
  };
}

/** Strandbad: Sand, See, Strandkörbe, Schirme, Bäume am Ufer gegenüber. */
export function beach({ seed = 111 } = {}) {
  const r = rng(seed);
  const g = new THREE.Group();
  const sand = new THREE.Mesh(new THREE.PlaneGeometry(200, 120), mat("#e6d3a3", { roughness: 1 }));
  sand.rotation.x = -Math.PI / 2; sand.position.z = 30; sand.receiveShadow = true; g.add(sand);
  const water = new THREE.Mesh(new THREE.PlaneGeometry(1200, 600), new THREE.MeshStandardMaterial({ color: "#4f86a8", roughness: 0.25, metalness: 0.3, flatShading: true }));
  water.rotation.x = -Math.PI / 2; water.position.set(0, -0.05, -330); g.add(water);
  // Ufer gegenüber mit Bäumen
  const shore = new THREE.Mesh(new THREE.PlaneGeometry(1200, 80), mat("#4d6b3a"));
  shore.rotation.x = -Math.PI / 2; shore.position.set(0, 0.02, -470); g.add(shore);
  const treeMat = mat("#3f6a35");
  for (let i = 0; i < 120; i++) {
    const t = new THREE.Mesh(new THREE.ConeGeometry(r.range(4, 7), r.range(12, 22), 6), treeMat);
    t.position.set(r.range(-450, 450), 8, r.range(-440, -500)); g.add(t);
  }
  // Segelboote
  for (let i = 0; i < 6; i++) {
    const b = new THREE.Group();
    box(4, 0.8, 1.4, mat("#f2f2ee"), 0, 0.4, 0, b);
    const sail = new THREE.Mesh(new THREE.ConeGeometry(2.2, 8, 3), mat("#fbfbf6"));
    sail.position.y = 4.8; sail.scale.z = 0.15; b.add(sail);
    b.position.set(r.range(-120, 120), 0, r.range(-120, -300)); b.rotation.y = r() * 3; g.add(b);
  }
  // Strandkörbe und Schirme
  const wicker = mat("#d9c39a"), stripe = [mat("#2f6fb0"), mat("#d24a3a"), mat("#e8b23a")];
  for (let i = 0; i < 22; i++) {
    const x = r.range(-22, 22), z = r.range(-26, -2);
    if (Math.abs(x) < 2.5 && z > -8) continue;
    if (r() < 0.5) {
      const k = new THREE.Group();
      box(1.3, 1.0, 0.9, wicker, 0, 0.5, 0, k);
      box(1.3, 0.7, 0.2, wicker, 0, 1.35, 0.35, k);
      box(1.32, 0.12, 0.9, r.pick(stripe), 0, 1.7, 0.1, k);
      k.position.set(x, 0, z); k.rotation.y = r.range(2.6, 3.6); g.add(k);
    } else {
      const u = new THREE.Group();
      cyl(0.03, 0.03, 2.2, 5, mat("#eeeeee"), 0, 1.1, 0, u);
      const top = new THREE.Mesh(new THREE.ConeGeometry(1.2, 0.5, 8), r.pick(stripe));
      top.position.y = 2.3; top.castShadow = true; u.add(top);
      u.position.set(x, 0, z); g.add(u);
    }
    const towel = box(0.8, 0.02, 1.8, r.pick(stripe), x + r.range(-1.5, 1.5), 0.01, z + 1.6, g);
  }
  return { group: g, water };
}

/** Balkon mit Geländer; Blick auf eine Stadt. */
export function balcony({ seed = 121 } = {}) {
  const r = rng(seed);
  const g = new THREE.Group();
  box(3.2, 0.12, 1.6, mat("#8d8780"), 0, 0, -0.4, g);
  const rail = mat("#2b2e33", { metalness: 0.4 });
  box(3.2, 0.05, 0.05, rail, 0, 1.0, -1.18, g);
  for (let x = -1.55; x <= 1.56; x += 0.16) box(0.02, 1.0, 0.02, rail, x, 0.5, -1.18, g);
  for (const x of [-1.6, 1.6]) box(0.05, 1.0, 1.6, rail, x, 0.5, -0.4, g);
  const pot = cyl(0.14, 0.11, 0.25, 8, mat("#b5653a"), 1.3, 0.18, -0.9, g);
  const city = new THREE.Group();
  const texs = [windowTextures(131, "plattenbau"), windowTextures(132, "altbau")];
  const blocks = [];
  for (let i = 0; i < 90; i++) {
    const dist = r.range(30, 380);
    const b = building({ w: r.range(10, 24), h: r.range(14, 50), d: r.range(10, 24), color: r.pick(["#9aa0a8", "#b6a99a", "#c2b8a8"]), tex: r.pick(texs) });
    b.mesh.position.set(r.range(-1, 1) * (30 + dist * 0.9), -22, -dist - 10);
    city.add(b.mesh); blocks.push(b.material);
  }
  g.add(city);
  return { group: g, blocks };
}

/** Zugefrorener Fluss mit Backsteinbrücke (Oberbaumbrücke-artig). */
export function frozenRiver({ seed = 141 } = {}) {
  const r = rng(seed);
  const g = new THREE.Group();
  const { tex } = canvasTexture(512, 512, (x, w, h) => {
    x.fillStyle = "#cfe0ea"; x.fillRect(0, 0, w, h);
    x.strokeStyle = "rgba(255,255,255,0.8)"; x.lineWidth = 2;
    for (let i = 0; i < 40; i++) { x.beginPath(); let px = r() * w, py = r() * h; x.moveTo(px, py); for (let k = 0; k < 5; k++) { px += r.range(-60, 60); py += r.range(-60, 60); x.lineTo(px, py); } x.stroke(); }
  });
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(8, 16);
  const ice = new THREE.Mesh(new THREE.PlaneGeometry(60, 400), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.2, metalness: 0.1 }));
  ice.rotation.x = -Math.PI / 2; ice.position.z = -150; ice.receiveShadow = true; g.add(ice);
  for (const s of [-1, 1]) {
    box(20, 3, 400, mat("#8d877d"), s * 40, 1.0, -150, g);                  // Kaimauern
    for (let i = 0; i < 14; i++) {
      const b = building({ w: 18, h: r.range(16, 30), d: 16, color: r.pick(["#9aa0a8", "#b6a99a"]), tex: windowTextures(150 + i, "plattenbau") });
      b.mesh.position.set(s * r.range(45, 60), 2.5, -i * 28 + 10); g.add(b.mesh);
    }
  }
  // Brücke
  const brick = mat("#9a4a32"), roof = mat("#3f5f55");
  const bridge = new THREE.Group();
  box(60, 2.2, 10, brick, 0, 7.5, 0, bridge);
  for (let i = -3; i <= 3; i++) { box(2.2, 6.4, 10, brick, i * 8.6, 3.2, 0, bridge); }
  for (const x of [-4.3, 4.3]) {
    box(3, 14, 3, brick, x, 15, 0, bridge);
    const cap = new THREE.Mesh(new THREE.ConeGeometry(2.3, 4, 4), roof); cap.position.set(x, 24, 0); cap.rotation.y = Math.PI / 4; bridge.add(cap);
  }
  bridge.position.z = -70; g.add(bridge);
  // eingefrorene Boote
  for (let i = 0; i < 3; i++) {
    const b = new THREE.Group();
    box(3.4, 1.2, 9, mat(r.pick(["#e9e6dd", "#3a5a7a"])), 0, 0.3, 0, b);
    box(2.6, 1.0, 4, mat("#d8d4c8"), 0, 1.3, -1, b);
    b.position.set(r.range(-14, 14), -0.3, -25 - i * 14); b.rotation.set(0.04, r.range(-0.4, 0.4), r.range(-0.08, 0.08)); g.add(b);
  }
  // Schnee
  const S = 500;
  const snow = new THREE.InstancedMesh(new THREE.BoxGeometry(0.04, 0.04, 0.04), basic("#ffffff"), S);
  const sd = []; for (let i = 0; i < S; i++) sd.push({ x: r.range(-15, 15), y: r.range(0, 12), z: r.range(-25, 4), sp: r.range(0.6, 1.4), ph: r() * 6 });
  g.add(snow);
  const d = new THREE.Object3D();
  return {
    group: g,
    update(t) {
      sd.forEach((s, i) => {
        d.position.set(s.x + Math.sin(t * 0.8 + s.ph) * 0.4, ((s.y - t * s.sp) % 12 + 12) % 12, s.z);
        d.updateMatrix(); snow.setMatrixAt(i, d.matrix);
      });
      snow.instanceMatrix.needsUpdate = true;
    },
  };
}

/** Tiefsee mit schwarzen Rauchern, Röhrenwürmern, Krebsen und Blasen. */
export function deepSeaVents({ seed = 161 } = {}) {
  const r = rng(seed);
  const g = new THREE.Group();
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(80, 80, 30, 30), mat("#2b3036", { roughness: 1 }));
  floor.rotation.x = -Math.PI / 2;
  const pa = floor.geometry.attributes.position;
  for (let i = 0; i < pa.count; i++) pa.setZ(i, r.range(-0.4, 0.4));
  floor.geometry.computeVertexNormals(); g.add(floor);
  for (let i = 0; i < 40; i++) {
    const rock = new THREE.Mesh(new THREE.IcosahedronGeometry(r.range(0.3, 1.5), 0), mat("#23272c"));
    rock.position.set(r.range(-20, 20), 0, r.range(-30, 2)); rock.rotation.set(r() * 3, r() * 3, 0); g.add(rock);
  }
  const vents = [];
  const chimneyMat = mat("#1b1c1e", { roughness: 1 });
  [[-1.2, -5, 3.2], [1.6, -7.5, 4.5], [-3.5, -10, 2.4], [3.8, -12, 3.8]].forEach(([x, z, h]) => {
    const c = new THREE.Group();
    let y = 0;
    for (let k = 0; k < 5; k++) { const seg = h / 5; cyl(0.45 - k * 0.07, 0.55 - k * 0.07, seg, 7, chimneyMat, r.range(-0.06, 0.06), y + seg / 2, 0, c); y += seg; }
    const glow = new THREE.PointLight("#ff7a2a", 3, 4, 2); glow.position.y = 0.4; c.add(glow);
    const ember = cyl(0.5, 0.6, 0.15, 7, basic("#ff8a3a"), 0, 0.05, 0, c);
    c.position.set(x, 0, z); g.add(c);
    vents.push({ x, z, top: h });
  });
  // Rauchsäulen als Partikel
  const P = 360;
  const smoke = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.22, 0), new THREE.MeshStandardMaterial({ color: "#121314", roughness: 1, transparent: true, opacity: 0.85 }), P);
  const pd = []; for (let i = 0; i < P; i++) pd.push({ v: i % vents.length, ph: r(), sp: r.range(0.6, 1.0), dx: r.range(-0.3, 0.3), s: r.range(0.6, 1.6) });
  g.add(smoke);
  // Röhrenwürmer
  const W = 160;
  const tubes = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.035, 0.04, 1, 6), mat("#ece6da"), W);
  const plumes = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.06, 0), mat("#d42c2c", { emissive: "#5a0a0a" }), W);
  const wd = []; for (let i = 0; i < W; i++) { const v = vents[i % vents.length]; const a = r() * 6.28, rr = r.range(0.7, 2.0); wd.push({ x: v.x + Math.cos(a) * rr, z: v.z + Math.sin(a) * rr, h: r.range(0.4, 1.2), ph: r() * 6 }); }
  g.add(tubes); g.add(plumes);
  // Blasen
  const B = 36;
  const bubbles = new THREE.InstancedMesh(new THREE.SphereGeometry(0.018, 6, 4), new THREE.MeshBasicMaterial({ color: "#bfe6ff", transparent: true, opacity: 0.6 }), B);
  const bd = []; for (let i = 0; i < B; i++) bd.push({ x: r.range(-1.5, 1.5), z: r.range(-3, 0.5), y: r.range(0, 4), sp: r.range(0.5, 1.2) });
  g.add(bubbles);
  const d = new THREE.Object3D();
  return {
    group: g,
    update(t) {
      pd.forEach((p, i) => {
        const v = vents[p.v];
        const u = ((t * 0.35 * p.sp + p.ph) % 1);
        d.position.set(v.x + p.dx * u * 3 + Math.sin(t + i) * 0.1, v.top + u * 6, v.z + p.dx * u);
        d.scale.setScalar(p.s * (0.5 + u * 2)); d.rotation.set(i, t * 0.3, 0);
        d.updateMatrix(); smoke.setMatrixAt(i, d.matrix);
      });
      smoke.instanceMatrix.needsUpdate = true;
      wd.forEach((w, i) => {
        const sway = Math.sin(t * 1.4 + w.ph) * 0.08;
        d.position.set(w.x, w.h / 2, w.z); d.rotation.set(sway, 0, sway * 0.5); d.scale.set(1, w.h, 1);
        d.updateMatrix(); tubes.setMatrixAt(i, d.matrix);
        d.position.set(w.x + sway * w.h * 0.5, w.h + 0.03, w.z + sway * w.h * 0.5); d.scale.setScalar(1); d.updateMatrix(); plumes.setMatrixAt(i, d.matrix);
      });
      tubes.instanceMatrix.needsUpdate = true; plumes.instanceMatrix.needsUpdate = true;
      bd.forEach((b, i) => { d.position.set(b.x + Math.sin(t * 2 + i) * 0.05, ((b.y + t * b.sp) % 4), b.z); d.scale.setScalar(1); d.updateMatrix(); bubbles.setMatrixAt(i, d.matrix); });
      bubbles.instanceMatrix.needsUpdate = true;
    },
  };
}

// ======================================================================
// Bausteine für Alternativgeschichte / Dystopie (ohne jede NS-Symbolik)
// ======================================================================

/** Große Kuppelhalle (Größenordnung Speer-Planung, 290 m) für Fernsicht. */
export function greatDome() {
  const g = new THREE.Group();
  const stone = mat("#b9b3a6", { roughness: 0.95 });
  box(315, 74, 315, stone, 0, 37, 0, g);                                   // Sockelbau
  for (let i = -6; i <= 6; i++) box(5, 60, 5, mat("#a7a196"), i * 22, 30, 160, g); // Säulenfront
  const dome = new THREE.Mesh(new THREE.SphereGeometry(125, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), mat("#7f8a86", { roughness: 0.6, metalness: 0.2 }));
  dome.position.y = 74; dome.scale.y = 1.55; g.add(dome);
  const lantern = cyl(10, 14, 22, 10, stone, 0, 74 + 125 * 1.55 + 8, 0, g);
  g.traverse((o) => { if (o.isMesh) { o.castShadow = false; o.receiveShadow = false; } });
  return g;
}

/** Breite Prachtachse mit kolossalen, grauen Steinbauten links und rechts. */
export function monumentalAxis({ seed = 171 } = {}) {
  const r = rng(seed);
  const g = new THREE.Group();
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(200, 2000), mat("#8f8a82", { roughness: 1 }));
  ground.rotation.x = -Math.PI / 2; ground.position.z = -800; ground.receiveShadow = true; g.add(ground);
  const road = new THREE.Mesh(new THREE.PlaneGeometry(90, 2000), mat("#5d5b58"));
  road.rotation.x = -Math.PI / 2; road.position.set(0, 0.01, -800); road.receiveShadow = true; g.add(road);
  const stone = mat("#c4bdb0", { roughness: 0.95 }), pillar = mat("#b3ac9f");
  for (const s of [-1, 1]) {
    let z = 20;
    while (z > -1100) {
      const w = r.range(60, 110), h = r.range(38, 60);
      const b = box(40, h, w, stone, s * 85, h / 2, z - w / 2, g);
      for (let k = 0; k < Math.floor(w / 8); k++) box(2.4, h * 0.8, 2.4, pillar, s * 64, h * 0.4, z - 4 - k * 8, g);
      box(44, 3, w + 2, mat("#9d968a"), s * 85, h + 1.5, z - w / 2, g);
      z -= w + 20;
    }
  }
  // kleiner Reichstag zum Größenvergleich
  const rt = new THREE.Group();
  box(40, 22, 28, mat("#c9bea8"), 0, 11, 0, rt);
  for (const x of [-18, 18]) for (const zz of [-12, 12]) box(6, 30, 6, mat("#c9bea8"), x, 15, zz, rt);
  rt.position.set(-75, 0, -330); rt.rotation.y = 0.3; g.add(rt);
  // Menschen als winzige Punkte auf dem Platz
  const P = 400;
  const dots = new THREE.InstancedMesh(new THREE.BoxGeometry(0.5, 1.7, 0.4), mat("#3b3d42"), P);
  const d = new THREE.Object3D();
  for (let i = 0; i < P; i++) { d.position.set(r.range(-40, 40), 0.85, r.range(-500, -40)); d.updateMatrix(); dots.setMatrixAt(i, d.matrix); }
  g.add(dots);
  const dome = greatDome(); dome.position.set(0, 0, -1250); g.add(dome);
  return { group: g, dome };
}

/** Grauer Ausweis (ohne Symbole). */
export function idCard() {
  const g = new THREE.Group();
  const { tex } = canvasTexture(400, 256, (x, w, h) => {
    x.fillStyle = "#cfcac0"; x.fillRect(0, 0, w, h);
    x.fillStyle = "#8a857c"; x.fillRect(20, 60, 110, 140);                    // Foto
    x.fillStyle = "#3a3a3a"; x.font = "700 30px Georgia, serif"; x.fillText("KENNKARTE", 150, 46);
    x.font = "400 20px Georgia, serif";
    ["Name: ________", "Geb.: ________", "Wohnort: Berlin", "Nr. 0 471 233"].forEach((l, i) => x.fillText(l, 150, 96 + i * 34));
  });
  const card = new THREE.Mesh(new THREE.PlaneGeometry(0.1, 0.064), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.8, side: THREE.DoubleSide }));
  g.add(card);
  return g;
}

/** Kontrollpunkt: Schlagbaum, Häuschen, Scheinwerfer, Kamera. */
export function checkpoint() {
  const g = new THREE.Group();
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(60, 120), mat("#4a4a4c"));
  ground.rotation.x = -Math.PI / 2; ground.position.z = -30; ground.receiveShadow = true; g.add(ground);
  const tex = windowTextures(181, "plattenbau");
  for (const s of [-1, 1]) for (let i = 0; i < 6; i++) {
    const b = building({ w: 14, h: 24, d: 16, color: "#8d8f93", tex });
    b.mesh.position.set(s * 18, 0, -i * 17 + 4); g.add(b.mesh);
  }
  const booth = new THREE.Group();
  box(2.2, 2.6, 2.2, mat("#5d6066"), 0, 1.3, 0, booth);
  box(2.0, 0.8, 0.05, basic("#e8e2c8"), 0, 1.8, 1.11, booth);
  booth.position.set(3.6, 0, -6); g.add(booth);
  // Schlagbaum rot-weiß
  const boom = new THREE.Group();
  for (let i = 0; i < 8; i++) box(0.75, 0.14, 0.14, mat(i % 2 ? "#e9e6dd" : "#b8302a"), -i * 0.75 - 0.4, 0, 0, boom);
  boom.position.set(2.4, 1.05, -5); g.add(boom);
  cyl(0.12, 0.15, 1.1, 8, mat("#3a3d42"), 2.4, 0.55, -5, g);
  // Scheinwerfer + Lichtkegel
  const flood = new THREE.SpotLight("#f4f1e4", 140, 40, 0.6, 0.5, 1.2);
  flood.position.set(4.5, 6, -7); flood.target.position.set(0.3, 0.8, -3.2); g.add(flood); g.add(flood.target);
  box(0.6, 0.4, 0.5, basic("#fffbe8"), 4.5, 6, -7, g);
  cyl(0.06, 0.08, 6, 6, mat("#2b2e33"), 4.5, 3, -7.2, g);
  // Überwachungskameras
  for (const [x, z] of [[-6, -3], [6.5, -12], [-6, -20]]) {
    cyl(0.05, 0.07, 4, 6, mat("#2b2e33"), x, 2, z, g);
    const cam = box(0.45, 0.22, 0.22, mat("#d9d9d4"), x - Math.sign(x) * 0.3, 4.0, z, g);
    cam.rotation.y = Math.sign(x) * 0.6;
    box(0.04, 0.04, 0.04, basic("#ff3020"), x - Math.sign(x) * 0.52, 4.05, z + 0.08, g);
  }
  return { group: g, boom };
}

/** Altes Röhrenradio mit leuchtender Skala; Decke als dunkle Höhle darüber. */
export function radioUnderBlanket() {
  const g = new THREE.Group();
  const wood = mat("#5a3a24", { roughness: 0.7 });
  box(0.42, 0.3, 0.22, wood, 0, 0, 0, g);
  box(0.2, 0.2, 0.01, mat("#c9b48a"), -0.08, 0.0, 0.112, g);                 // Lautsprecherstoff
  const dial = box(0.13, 0.06, 0.01, basic("#ffcf7a"), 0.12, 0.05, 0.112, g);
  for (const x of [0.07, 0.17]) { const k = cyl(0.018, 0.018, 0.02, 10, mat("#2a1d14"), x, -0.07, 0.115, g); k.rotation.x = Math.PI / 2; }
  const glow = new THREE.PointLight("#ffb35a", 1.6, 2.5, 1.6); glow.position.set(0.1, 0.05, 0.3); g.add(glow);
  // Decke: halbe Röhre aus Stoff rund um die Szene
  const blanket = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 2.4, 14, 1, true, 0, Math.PI), new THREE.MeshStandardMaterial({ color: "#3d4a5c", roughness: 1, side: THREE.DoubleSide, flatShading: true }));
  blanket.rotation.z = Math.PI / 2; blanket.rotation.y = Math.PI / 2; blanket.position.set(0, -0.15, 0.2);
  const sheet = new THREE.Mesh(new THREE.PlaneGeometry(2, 2.4), mat("#6e6a62"));
  sheet.rotation.x = -Math.PI / 2; sheet.position.set(0, -0.16, 0.2);
  const set = new THREE.Group(); set.add(blanket); set.add(sheet);
  return { radio: g, set, dial, glow };
}

/** Verlassenes Dorf mit Holzhäusern, hohem Gras und einer Schaukel. */
export function emptyVillage({ seed = 191 } = {}) {
  const r = rng(seed);
  const g = new THREE.Group();
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(300, 300), mat("#5d6b4a", { roughness: 1 }));
  ground.rotation.x = -Math.PI / 2; ground.position.z = -100; ground.receiveShadow = true; g.add(ground);
  const path = new THREE.Mesh(new THREE.PlaneGeometry(4, 300), mat("#7a6a52"));
  path.rotation.x = -Math.PI / 2; path.position.set(0, 0.01, -100); g.add(path);
  for (let i = 0; i < 14; i++) {
    const s = i % 2 ? 1 : -1, z = -i * 9 - 6;
    const h = new THREE.Group();
    box(6, 3.2, 5, mat(r.pick(["#6b5a46", "#7a6650", "#5d4f40"])), 0, 1.6, 0, h);
    const roof = new THREE.Mesh(new THREE.ConeGeometry(4.6, 2.6, 4), mat("#4a3f36"));
    roof.position.y = 4.4; roof.rotation.y = Math.PI / 4; roof.scale.set(1.05, 1, 0.85); h.add(roof);
    for (const x of [-1.5, 1.5]) box(0.9, 0.9, 0.05, mat("#14171b"), x, 1.9, 2.52, h);  // dunkle Fenster
    box(1.0, 1.9, 0.05, mat("#2a221b"), 0, 0.95, 2.52, h);
    h.position.set(s * r.range(7, 10), 0, z); h.rotation.y = s > 0 ? -Math.PI / 2 : Math.PI / 2; h.rotation.z = r.range(-0.03, 0.03);
    g.add(h);
  }
  const grass = new THREE.InstancedMesh(new THREE.ConeGeometry(0.06, 0.6, 3), mat("#6f7d52"), 1500);
  const d = new THREE.Object3D();
  for (let i = 0; i < 1500; i++) { d.position.set(r.range(-30, 30), 0.3, r.range(-120, 6)); if (Math.abs(d.position.x) < 2.2) d.position.x += 4; d.rotation.set(r.range(-0.3, 0.3), 0, r.range(-0.3, 0.3)); d.scale.setScalar(r.range(0.6, 1.6)); d.updateMatrix(); grass.setMatrixAt(i, d.matrix); }
  g.add(grass);
  // kahle Bäume
  for (let i = 0; i < 18; i++) {
    const t = new THREE.Group(); const trunk = mat("#3a3029");
    cyl(0.15, 0.25, 5, 5, trunk, 0, 2.5, 0, t);
    for (let k = 0; k < 4; k++) { const b = cyl(0.04, 0.08, 2, 4, trunk, 0, 4 + k * 0.4, 0, t); b.rotation.set(r.range(-0.9, 0.9), k, r.range(-0.9, 0.9)); }
    t.position.set(r.range(-40, 40), 0, r.range(-130, -20)); if (Math.abs(t.position.x) < 12) t.position.x += 14 * Math.sign(t.position.x || 1); g.add(t);
  }
  // Schaukel
  const swing = new THREE.Group();
  const frame = mat("#4a3f36");
  for (const x of [-1, 1]) { const p = cyl(0.06, 0.06, 2.6, 5, frame, x, 1.3, 0, swing); p.rotation.z = x * 0.12; }
  const beam = cyl(0.06, 0.06, 2.3, 5, frame, 0, 2.55, 0, swing); beam.rotation.z = Math.PI / 2;
  const seat = new THREE.Group(); seat.position.y = 2.5;
  for (const x of [-0.3, 0.3]) cyl(0.01, 0.01, 1.9, 3, mat("#8a8378"), x, -0.95, 0, seat);
  box(0.75, 0.05, 0.3, mat("#6b5a46"), 0, -1.9, 0, seat);
  swing.add(seat); swing.position.set(2.4, 0, -6); g.add(swing);
  return { group: g, seat };
}

// ======================================================================
// Alexanderplatz: Platz, Weltzeituhr, Neptunbrunnen, Plattenbauten, Tauben
// ======================================================================
export function alexanderplatz({ seed = 201 } = {}) {
  const r = rng(seed);
  const g = new THREE.Group();
  const tiles = tileTexture("#d8d3c8", "#b9b2a5", 6); tiles.repeat.set(60, 60);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), new THREE.MeshStandardMaterial({ map: tiles, roughness: 0.9 }));
  ground.rotation.x = -Math.PI / 2; ground.position.z = -60; ground.receiveShadow = true; g.add(ground);
  // Plattenbauten rund um den Platz
  const texs = [windowTextures(211, "plattenbau"), windowTextures(212, "plattenbau"), windowTextures(213, "altbau")];
  const ring = [];
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2 + 0.2, d = r.range(70, 95);
    const b = building({ w: r.range(30, 50), h: r.range(22, 45), d: 18, color: r.pick(["#c9c4ba", "#b8bcc0", "#d6cdbd", "#a9adb3"]), tex: r.pick(texs) });
    b.mesh.position.set(Math.cos(a) * d, 0, Math.sin(a) * d - 40); b.mesh.rotation.y = -a + Math.PI / 2; g.add(b.mesh); ring.push(b);
  }
  // Weltzeituhr
  const clock = new THREE.Group();
  const steel = mat("#b9c0c6", { metalness: 0.6, roughness: 0.3 });
  cyl(0.35, 0.45, 5, 10, steel, 0, 2.5, 0, clock);
  const drum = cyl(1.6, 1.6, 1.4, 24, mat("#e9e6dc", { roughness: 0.5 }), 0, 5.8, 0, clock);
  for (let k = 0; k < 24; k++) { const f = box(0.04, 1.3, 0.3, mat("#2a2d33"), Math.cos(k / 24 * Math.PI * 2) * 1.62, 5.8, Math.sin(k / 24 * Math.PI * 2) * 1.62, clock); f.rotation.y = -k / 24 * Math.PI * 2; }
  cyl(1.7, 1.7, 0.12, 24, steel, 0, 6.55, 0, clock);
  const atom = new THREE.Group(); atom.position.y = 8;
  for (let k = 0; k < 3; k++) { const o = new THREE.Mesh(new THREE.TorusGeometry(0.9, 0.04, 6, 24), steel); o.rotation.set(k * 1.0, k * 0.6, 0); atom.add(o); }
  cyl(0.06, 0.06, 1.4, 6, steel, 0, -0.9, 0, atom);
  clock.add(atom);
  clock.position.set(-9, 0, -16); g.add(clock);
  // Neptunbrunnen (Becken mit Wasser und Figurengruppe)
  const fountain = new THREE.Group();
  const stone = mat("#b58e6e", { roughness: 0.8 });
  const rim = new THREE.Mesh(new THREE.TorusGeometry(9, 0.45, 8, 40), stone); rim.rotation.x = Math.PI / 2; rim.position.y = 0.45; fountain.add(rim);
  const water = new THREE.Mesh(new THREE.CircleGeometry(9, 40), new THREE.MeshStandardMaterial({ color: "#5b8fa8", roughness: 0.15, metalness: 0.2 }));
  water.rotation.x = -Math.PI / 2; water.position.y = 0.55; fountain.add(water);
  cyl(2.2, 2.6, 1.6, 12, stone, 0, 1.1, 0, fountain);
  const bronze = mat("#4d5a4c", { roughness: 0.5, metalness: 0.4 });
  cyl(0.7, 0.9, 2.2, 8, bronze, 0, 3.0, 0, fountain);
  const head = new THREE.Mesh(new THREE.IcosahedronGeometry(0.55, 0), bronze); head.position.y = 4.5; fountain.add(head);
  const trident = cyl(0.05, 0.05, 3, 4, bronze, 0.8, 4.2, 0, fountain); trident.rotation.z = -0.2;
  fountain.position.set(14, 0, -48); g.add(fountain);
  // Fernsehturm in der Nähe
  return { group: g, clock, atom, fountain, water, fountainPos: new THREE.Vector3(14, 0, -48), ring };
}

/** Tauben (instanziert). update(t, lift) – lift 0..1 lässt sie hochtreiben. */
export function pigeons(n = 40, seed = 221) {
  const r = rng(seed);
  const body = new THREE.InstancedMesh(new THREE.BoxGeometry(0.22, 0.16, 0.32), mat("#7d8590"), n);
  const d = []; for (let i = 0; i < n; i++) d.push({ x: r.range(-14, 22), z: r.range(-40, 4), ph: r() * 6, sp: r.range(0.6, 1.4), spin: r.range(-2, 2) });
  const o = new THREE.Object3D();
  return {
    mesh: body,
    update(t, y0fn) {
      d.forEach((p, i) => {
        const y = y0fn ? y0fn(p, i) : 0.1;
        o.position.set(p.x + Math.sin(t * 0.7 + p.ph) * 0.3, y + 0.08 + Math.abs(Math.sin(t * 6 + p.ph)) * 0.03, p.z);
        o.rotation.set(y > 0.5 ? t * p.spin * 0.3 : 0, p.ph + (y > 0.5 ? t * 0.5 : 0), 0);
        o.updateMatrix(); body.setMatrixAt(i, o.matrix);
      });
      body.instanceMatrix.needsUpdate = true;
    },
  };
}
