// Low-Poly-Baukasten für "Was wäre wenn"-Szenen (Three.js).
// Alles deterministisch: Zufall nur über seeded rng(), Bewegung nur über t.
import * as THREE from "./three.module.min.js";

export { THREE };

// ---------------------------------------------------------------- Zufall ---
export function rng(seed = 1) {
  let a = seed >>> 0;
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let x = a;
    x = Math.imul(x ^ (x >>> 15), x | 1);
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
  next.range = (lo, hi) => lo + (hi - lo) * next();
  next.pick = (arr) => arr[Math.floor(next() * arr.length)];
  return next;
}

export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const smooth = (x) => { x = clamp(x); return x * x * (3 - 2 * x); };
export const lerp = (a, b, x) => a + (b - a) * x;

// ------------------------------------------------------- Farb-Keyframes ---
// keys: [[t, "#rrggbb"], ...] -> THREE.Color (geteilt, nicht speichern)
const _c0 = new THREE.Color(), _c1 = new THREE.Color(), _out = new THREE.Color();
export function colorAt(keys, t, target = _out) {
  if (t <= keys[0][0]) return target.set(keys[0][1]);
  for (let i = 1; i < keys.length; i++) {
    if (t <= keys[i][0]) {
      const x = smooth((t - keys[i - 1][0]) / (keys[i][0] - keys[i - 1][0]));
      _c0.set(keys[i - 1][1]); _c1.set(keys[i][1]);
      return target.copy(_c0).lerp(_c1, x);
    }
  }
  return target.set(keys[keys.length - 1][1]);
}
export function valueAt(keys, t) {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    if (t <= keys[i][0]) {
      const x = smooth((t - keys[i - 1][0]) / (keys[i][0] - keys[i - 1][0]));
      return lerp(keys[i - 1][1], keys[i][1], x);
    }
  }
  return keys[keys.length - 1][1];
}

// ------------------------------------------------------------ Kamera ---
// keys: [{ t, pos: [x,y,z], look: [x,y,z] }]; Catmull-Rom über die Zeit.
function catmull(p0, p1, p2, p3, s) {
  const s2 = s * s, s3 = s2 * s;
  return 0.5 * (2 * p1 + (-p0 + p2) * s + (2 * p0 - 5 * p1 + 4 * p2 - p3) * s2 + (-p0 + 3 * p1 - 3 * p2 + p3) * s3);
}
export function cameraPath(keys) {
  const pick = (i) => keys[Math.max(0, Math.min(keys.length - 1, i))];
  return function at(t, outPos, outLook) {
    let i = 0;
    while (i < keys.length - 2 && t > keys[i + 1].t) i++;
    const k1 = pick(i), k2 = pick(i + 1);
    const s = smooth(clamp((t - k1.t) / (k2.t - k1.t))) * 0.35 + clamp((t - k1.t) / (k2.t - k1.t)) * 0.65;
    const k0 = pick(i - 1), k3 = pick(i + 2);
    for (let a = 0; a < 3; a++) {
      outPos.setComponent(a, catmull(k0.pos[a], k1.pos[a], k2.pos[a], k3.pos[a], s));
      outLook.setComponent(a, catmull(k0.look[a], k1.look[a], k2.look[a], k3.look[a], s));
    }
  };
}

// Handkamera-Wackeln (deterministisch, Summe aus Sinus)
export function shake(t, amp) {
  return [
    amp * (Math.sin(t * 1.7) * 0.6 + Math.sin(t * 4.3 + 1.2) * 0.3 + Math.sin(t * 11.1 + 0.5) * 0.1),
    amp * (Math.sin(t * 1.3 + 2.0) * 0.6 + Math.sin(t * 3.7 + 0.3) * 0.3 + Math.sin(t * 9.7 + 2.2) * 0.1),
  ];
}

// --------------------------------------------------------------- Himmel ---
export function createSky(radius = 1500) {
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: {
      top: { value: new THREE.Color("#7fa0c8") },
      horizon: { value: new THREE.Color("#f0c9a0") },
      bottom: { value: new THREE.Color("#3a3a40") },
      sunDir: { value: new THREE.Vector3(0.3, 0.2, 1).normalize() },
      sunColor: { value: new THREE.Color("#ffd9a0") },
      sunGlow: { value: 0.6 },
    },
    vertexShader: `varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: `uniform vec3 top; uniform vec3 horizon; uniform vec3 bottom; uniform vec3 sunDir; uniform vec3 sunColor; uniform float sunGlow;
      varying vec3 vDir;
      void main(){
        float h = vDir.y;
        vec3 c = h > 0.0 ? mix(horizon, top, pow(clamp(h,0.0,1.0), 0.55)) : mix(horizon, bottom, clamp(-h*4.0,0.0,1.0));
        float d = max(dot(normalize(vDir), normalize(sunDir)), 0.0);
        c += sunColor * (pow(d, 12.0) * 0.45 + pow(d, 400.0) * 1.2) * sunGlow;
        gl_FragColor = vec4(c, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, 32, 16), mat);
  mesh.renderOrder = -10;
  return mesh;
}

export function createStars(count = 900, radius = 1400, seed = 99) {
  const r = rng(seed);
  const pos = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const u = r(), v = r() * 0.95 + 0.04;
    const th = u * Math.PI * 2, y = v;
    const rr = Math.sqrt(1 - y * y);
    pos.set([Math.cos(th) * rr * radius, y * radius, Math.sin(th) * rr * radius], i * 3);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  const m = new THREE.PointsMaterial({ color: 0xffffff, size: 2.2, sizeAttenuation: false, transparent: true, opacity: 0, fog: false, depthWrite: false });
  return new THREE.Points(g, m);
}

// -------------------------------------------------------- Fenster-Textur ---
// 8×8 Fensterachsen pro Kachel. map = Fassade (weiß, wird eingefärbt),
// emissive = zufällig erleuchtete Fenster.
export function windowTextures(seed = 3, style = "altbau") {
  const r = rng(seed);
  const N = 8, S = 64, W = N * S;
  const mk = () => { const c = document.createElement("canvas"); c.width = c.height = W; return c; };
  const cm = mk(), ce = mk();
  const gm = cm.getContext("2d"), ge = ce.getContext("2d");
  gm.fillStyle = "#ffffff"; gm.fillRect(0, 0, W, W);
  ge.fillStyle = "#000000"; ge.fillRect(0, 0, W, W);
  for (let y = 0; y < N; y++) {
    // Gesims-Linie pro Etage
    gm.fillStyle = "rgba(0,0,0,0.10)"; gm.fillRect(0, y * S + S - 5, W, 3);
    for (let x = 0; x < N; x++) {
      const wx = x * S + (style === "altbau" ? 18 : 10), wy = y * S + (style === "altbau" ? 12 : 14);
      const ww = style === "altbau" ? 28 : 44, wh = style === "altbau" ? 40 : 34;
      gm.fillStyle = "rgba(0,0,0,0.22)"; gm.fillRect(wx - 3, wy - 3, ww + 6, wh + 6); // Laibung
      gm.fillStyle = "#3a4250"; gm.fillRect(wx, wy, ww, wh); // Glas
      gm.fillStyle = "rgba(255,255,255,0.18)"; gm.fillRect(wx, wy, ww, 4); // Reflex
      gm.fillStyle = "#d9d4cc"; gm.fillRect(wx + ww / 2 - 1, wy, 2, wh); // Sprosse
      if (r() < 0.42) {
        const warm = r() < 0.8;
        ge.fillStyle = warm ? `rgb(255,${190 + Math.floor(r() * 40)},${110 + Math.floor(r() * 50)})` : "rgb(200,220,255)";
        ge.fillRect(wx, wy, ww, wh);
      }
    }
  }
  const map = new THREE.CanvasTexture(cm);
  const emissive = new THREE.CanvasTexture(ce);
  for (const t of [map, emissive]) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
  }
  return { map, emissive };
}

// UVs einer BoxGeometry so skalieren, dass 1 Fensterachse = bay Meter.
function scaleBoxUVs(geo, w, h, d, bay = 3.6, floorH = 3.4) {
  const uv = geo.attributes.uv;
  // Flächenreihenfolge: +x, -x, +y, -y, +z, -z (je 4 Vertices)
  const faces = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
  for (let f = 0; f < 6; f++) {
    const [fw, fh] = faces[f];
    for (let v = 0; v < 4; v++) {
      const i = f * 4 + v;
      uv.setXY(i, uv.getX(i) * (fw / bay) / 8, uv.getY(i) * (fh / floorH) / 8);
    }
  }
  uv.needsUpdate = true;
}

/** Ein Haus. Gibt { mesh, material } zurück; material.emissiveIntensity steuert das Licht. */
export function building({ w, h, d, color, tex, roof = "#5b5650" }) {
  const geo = new THREE.BoxGeometry(w, h, d);
  scaleBoxUVs(geo, w, h, d);
  geo.translate(0, h / 2, 0);
  const facade = new THREE.MeshStandardMaterial({
    color, map: tex.map, emissiveMap: tex.emissive, emissive: new THREE.Color("#ffcf8a"),
    emissiveIntensity: 0, roughness: 0.92, metalness: 0, flatShading: true,
  });
  const roofMat = new THREE.MeshStandardMaterial({ color: roof, roughness: 1, flatShading: true });
  const mesh = new THREE.Mesh(geo, [facade, facade, roofMat, roofMat, facade, facade]);
  mesh.castShadow = true; mesh.receiveShadow = true;
  return { mesh, material: facade };
}

// --------------------------------------------------------- Fernsehturm ---
export function fernsehturm() {
  const g = new THREE.Group();
  const concrete = new THREE.MeshStandardMaterial({ color: "#c9c6c0", roughness: 0.9, flatShading: true });
  const sphereMat = new THREE.MeshStandardMaterial({ color: "#b8b6b2", roughness: 0.45, metalness: 0.4, flatShading: true });
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(4.5, 9, 200, 10), concrete);
  shaft.position.y = 100; g.add(shaft);
  const ball = new THREE.Mesh(new THREE.IcosahedronGeometry(16, 1), sphereMat);
  ball.position.y = 210; g.add(ball);
  const ring = new THREE.Mesh(new THREE.CylinderGeometry(16.5, 16.5, 4, 14), concrete);
  ring.position.y = 207; g.add(ring);
  const top = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 3.5, 40, 8), concrete);
  top.position.y = 245; g.add(top);
  const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 1.6, 100, 6),
    new THREE.MeshStandardMaterial({ color: "#d8d2c8", roughness: 0.8, flatShading: true }));
  antenna.position.y = 315; g.add(antenna);
  // Flugwarnlichter
  const red = new THREE.MeshBasicMaterial({ color: "#ff3020", fog: false, transparent: true });
  const lights = [];
  for (const y of [230, 290, 362]) {
    const l = new THREE.Mesh(new THREE.SphereGeometry(1.6, 6, 4), red);
    l.position.y = y; g.add(l); lights.push(l);
  }
  g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  return { group: g, warnLightMaterial: red };
}

// -------------------------------------------------------------- Figuren ---
// Instanzierte Low-Poly-Menschen: Beine, Rumpf, Arme, Kopf, Haare.
const PARTS = [
  // name, size [w,h,d], pivot (Gelenk) [x,y,z], offset vom Gelenk [x,y,z], Farbe
  ["legL", [0.17, 0.86, 0.2], [-0.11, 0.88, 0], [0, -0.43, 0], "pants"],
  ["legR", [0.17, 0.86, 0.2], [0.11, 0.88, 0], [0, -0.43, 0], "pants"],
  ["torso", [0.48, 0.66, 0.27], [0, 0.88, 0], [0, 0.34, 0], "shirt"],
  ["armL", [0.12, 0.6, 0.14], [-0.31, 1.48, 0], [0, -0.29, 0], "shirt"],
  ["armR", [0.12, 0.6, 0.14], [0.31, 1.48, 0], [0, -0.29, 0], "shirt"],
  ["head", [0.23, 0.27, 0.24], [0, 1.56, 0], [0, 0.15, 0], "skin"],
  ["hair", [0.25, 0.1, 0.26], [0, 1.56, 0], [0, 0.31, -0.01], "hair"],
];
const SHIRTS = ["#2f3a4f", "#7a2e2e", "#d9d4c7", "#3f5e4a", "#c98b3a", "#5a5f6b", "#e4e0d6", "#8a4f6f", "#1f2a33", "#b5492f"];
const PANTS = ["#24272d", "#3b4250", "#5b4a3a", "#2b3340", "#6b6f78"];
const SKIN = ["#f1c8a5", "#e2b08a", "#c68d64", "#8d5a3b", "#f5d3b8"];
const HAIR = ["#2a1e17", "#4a3222", "#c9a16a", "#1a1a1a", "#7a5232", "#9a9a9a"];

export function crowd(count, seed = 11) {
  const r = rng(seed);
  const group = new THREE.Group();
  const meshes = PARTS.map(([, size]) => {
    const geo = new THREE.BoxGeometry(...size);
    const m = new THREE.InstancedMesh(geo, new THREE.MeshStandardMaterial({ roughness: 0.9, flatShading: true }), count);
    m.castShadow = true; m.receiveShadow = false;
    m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    group.add(m);
    return m;
  });
  const palette = { shirt: SHIRTS, pants: PANTS, skin: SKIN, hair: HAIR };
  const col = new THREE.Color();
  for (let i = 0; i < count; i++) {
    const pick = { shirt: r.pick(SHIRTS), pants: r.pick(PANTS), skin: r.pick(SKIN), hair: r.pick(HAIR) };
    PARTS.forEach(([, , , , kind], p) => meshes[p].setColorAt(i, col.set(pick[kind] || palette[kind][0])));
  }
  meshes.forEach((m) => { m.instanceColor.needsUpdate = true; });

  const mRoot = new THREE.Matrix4(), mJoint = new THREE.Matrix4(), mOff = new THREE.Matrix4(), mOut = new THREE.Matrix4();
  const q = new THREE.Quaternion(), e = new THREE.Euler(), v = new THREE.Vector3(), one = new THREE.Vector3(1, 1, 1);
  const zero = new THREE.Matrix4().makeScale(0, 0, 0);

  /** state: { x, y, z, rotY, swing (Bein-/Armwinkel), armRaise, sit, visible, scale } (Front zeigt nach +z) */
  function set(i, s) {
    if (!s.visible) { meshes.forEach((m) => m.setMatrixAt(i, zero)); return; }
    const sc = s.scale ?? 1;
    mRoot.compose(v.set(s.x, s.y ?? 0, s.z), q.setFromEuler(e.set(0, s.rotY, 0)), one.clone().setScalar(sc));
    const sw = s.swing || 0, raise = s.armRaise || 0;
    const legs = s.sit ? -1.45 : null;
    const angles = { legL: legs ?? sw, legR: legs ?? -sw, armL: -sw * 0.8 - raise, armR: sw * 0.8 - raise, torso: 0, head: 0, hair: 0 };
    PARTS.forEach(([name, , pivot, off], p) => {
      mJoint.compose(v.set(...pivot), q.setFromEuler(e.set(angles[name], 0, 0)), one.set(1, 1, 1));
      mOff.makeTranslation(...off);
      mOut.multiplyMatrices(mRoot, mJoint).multiply(mOff);
      meshes[p].setMatrixAt(i, mOut);
    });
  }
  function commit() { meshes.forEach((m) => { m.instanceMatrix.needsUpdate = true; m.computeBoundingSphere(); }); }
  return { group, set, commit, count };
}

// ---------------------------------------------------------------- Autos ---
const CAR_COLORS = ["#c8ccd2", "#1e2228", "#7a1f22", "#2c4a6e", "#e8e6e0", "#5d6268", "#3e5a3c", "#b98a2e"];
export function car(seed, kind = "car") {
  const r = rng(seed);
  const g = new THREE.Group();
  const paint = new THREE.MeshStandardMaterial({ color: kind === "bus" ? "#f2c318" : r.pick(CAR_COLORS), roughness: 0.5, metalness: 0.2, flatShading: true });
  const glass = new THREE.MeshStandardMaterial({ color: "#1d2630", roughness: 0.2, metalness: 0.6, flatShading: true });
  const dark = new THREE.MeshStandardMaterial({ color: "#151515", roughness: 0.9, flatShading: true });
  const box = (w, h, d, m, x, y, z) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(x, y, z); b.castShadow = true; g.add(b); return b; };
  if (kind === "bus") {
    box(2.5, 2.6, 12, paint, 0, 1.75, 0);
    box(2.55, 1.0, 11.2, glass, 0, 2.2, 0);
    box(2.52, 0.3, 12.02, dark, 0, 0.55, 0);
    for (const z of [-4, 4]) for (const x of [-1.15, 1.15]) box(0.3, 0.9, 0.9, dark, x, 0.45, z);
  } else {
    box(1.8, 0.7, 4.3, paint, 0, 0.75, 0);
    box(1.6, 0.6, 2.3, paint, 0, 1.38, -0.2);
    box(1.62, 0.45, 2.1, glass, 0, 1.4, -0.2);
    for (const z of [-1.4, 1.4]) for (const x of [-0.85, 0.85]) box(0.25, 0.62, 0.62, dark, x, 0.36, z);
  }
  return g;
}

// ---------------------------------------------------------- Straßenlampe ---
export function streetLamp(glowTexture) {
  const g = new THREE.Group();
  const metal = new THREE.MeshStandardMaterial({ color: "#2b2e33", roughness: 0.7, flatShading: true });
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.13, 6, 6), metal);
  pole.position.y = 3; pole.castShadow = true; g.add(pole);
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.25, 0.5), metal);
  head.position.y = 6.1; g.add(head);
  const bulbMat = new THREE.MeshBasicMaterial({ color: "#ffd59a", transparent: true });
  const bulb = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.06, 0.4), bulbMat);
  bulb.position.y = 5.96; g.add(bulb);
  const glowMat = new THREE.SpriteMaterial({ map: glowTexture, color: "#ffc477", transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
  const glow = new THREE.Sprite(glowMat);
  glow.position.y = 5.9; glow.scale.set(5, 5, 1); g.add(glow);
  return { group: g, bulbMat, glowMat };
}

export function glowTexture() {
  const c = document.createElement("canvas"); c.width = c.height = 128;
  const x = c.getContext("2d");
  const grd = x.createRadialGradient(64, 64, 0, 64, 64, 64);
  grd.addColorStop(0, "rgba(255,255,255,1)"); grd.addColorStop(0.25, "rgba(255,255,255,0.45)"); grd.addColorStop(1, "rgba(255,255,255,0)");
  x.fillStyle = grd; x.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
