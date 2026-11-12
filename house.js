/* =====================================================================
   house.js – 3D-huset i hero (Three.js r160, ingen build)
   Huset er bygget af kasser i koden og delt i fire fagmodeller:
   Konstruktion (grå), Arkitekt (hvid/beige), MEP (orange) og Tag (grøn).
   ===================================================================== */
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const LAYERS = {
  konstruktion: { label: 'Konstruktion', color: 0x9aa19a },
  arkitekt: { label: 'Arkitekt', color: 0xf0ebe1 },
  mep: { label: 'MEP', color: 0xe08a2e },
  tag: { label: 'Tag', color: 0x4e7d3a }
};

/* Lille hjælper: brug GSAP (samme easings som resten af siden), hvis det findes */
const tween = (obj, props, duration, ease, delay) => {
  if (window.gsap && duration > 0) window.gsap.to(obj, { ...props, duration, ease, delay: delay || 0, overwrite: 'auto' });
  else Object.assign(obj, props);
};
const lerp = (a, b, t) => a + (b - a) * t;

export function init(stage, opts = {}) {
  const reduced = !!opts.reduced;
  const labelEl = opts.label;

  const canvas = document.createElement('canvas');
  canvas.setAttribute('aria-label', 'Interaktiv 3D-model af et hus opdelt i fagmodeller. Træk for at dreje.');
  canvas.setAttribute('role', 'img');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true }); /* kaster fejl uden WebGL */
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  stage.prepend(canvas);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 200);
  const TARGET = new THREE.Vector3(0, 2.7, 0);
  const DIST = 29;
  camera.position.setFromSphericalCoords(DIST, THREE.MathUtils.degToRad(66), THREE.MathUtils.degToRad(38)).add(TARGET);

  scene.add(new THREE.HemisphereLight(0xffffff, 0xd9dfd2, 1.15));
  const sun = new THREE.DirectionalLight(0xffffff, 1.9);
  sun.position.set(8, 16, 7);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.left = -12; sun.shadow.camera.right = 12;
  sun.shadow.camera.top = 16; sun.shadow.camera.bottom = -8;
  sun.shadow.camera.near = 1; sun.shadow.camera.far = 50;
  sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.03; sun.shadow.radius = 5;
  scene.add(sun);

  /* Alt står i én gruppe, så modellen kan skaleres, når lagene adskilles */
  const world = new THREE.Group();
  scene.add(world);

  const ground = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), new THREE.ShadowMaterial({ opacity: 0.16 }));
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.6;
  ground.receiveShadow = true;
  world.add(ground);
  const grid = new THREE.GridHelper(22, 22, 0xc4ccbd, 0xd5dbcf);
  grid.position.y = -0.595;
  grid.material.transparent = true;
  grid.material.opacity = 0.7;
  world.add(grid);

  /* ---------- Bygningsdele ---------- */
  const parts = [];
  const pickables = [];
  const layerState = {};
  Object.keys(LAYERS).forEach((k) => { layerState[k] = { v: 1, hl: 0 }; });

  const makePart = (layer, explodeY, order) => {
    const group = new THREE.Group();
    world.add(group);
    const mat = new THREE.MeshStandardMaterial({ color: LAYERS[layer].color, roughness: 0.88, metalness: 0 });
    mat.emissive = new THREE.Color(LAYERS[layer].color);
    mat.emissiveIntensity = 0;
    const part = { layer, group, explodeY, order, b: reduced ? 1 : 0, mats: [{ m: mat, base: 1 }], mat };
    parts.push(part);
    return part;
  };
  const extraMat = (part, color, base, opts2 = {}) => {
    const m = new THREE.MeshStandardMaterial({ color, roughness: 0.6, metalness: 0, transparent: base < 1, opacity: base, ...opts2 });
    part.mats.push({ m, base });
    return m;
  };
  const addMesh = (part, geo, x, y, z, mat, pick = true) => {
    const mesh = new THREE.Mesh(geo, mat || part.mat);
    mesh.position.set(x, y, z);
    mesh.castShadow = pick;
    mesh.receiveShadow = true;
    mesh.userData.layer = part.layer;
    part.group.add(mesh);
    if (pick) pickables.push(mesh);
    return mesh;
  };
  const box = (part, w, h, d, x, y, z, mat, pick) => addMesh(part, new THREE.BoxGeometry(w, h, d), x, y, z, mat, pick);

  const W = 8, D = 6, T = 0.3;

  /* En væg med huller: piller mellem åbningerne, brystning under og overligger over */
  const wall = (part, axis, fixed, length, y0, h, openings, glassMat, doorMat) => {
    const put = (u, y, w, hh, mat, thick = T, pick = true) => {
      if (w <= 0.001 || hh <= 0.001) return;
      if (axis === 'x') box(part, w, hh, thick, u, y, fixed, mat, pick);
      else box(part, thick, hh, w, fixed, y, u, mat, pick);
    };
    const sorted = openings.slice().sort((a, b) => a.c - b.c);
    let cursor = -length / 2;
    sorted.forEach((o) => {
      const left = o.c - o.w / 2;
      put((cursor + left) / 2, y0 + h / 2, left - cursor, h);                      /* pille */
      put(o.c, y0 + o.sill / 2, o.w, o.sill);                                      /* brystning */
      put(o.c, y0 + (o.head + h) / 2, o.w, h - o.head);                            /* overligger */
      put(o.c, y0 + (o.sill + o.head) / 2, o.w, o.head - o.sill, o.door ? doorMat : glassMat, o.door ? 0.08 : 0.05, false);
      cursor = o.c + o.w / 2;
    });
    put((cursor + length / 2) / 2, y0 + h / 2, length / 2 - cursor, h);
  };

  /* 1 · Fundament og gulv (Konstruktion) */
  const fundament = makePart('konstruktion', 0, 0);
  box(fundament, W + 0.6, 0.6, D + 0.6, 0, -0.3, 0);
  const gulv = makePart('konstruktion', 0.8, 1);
  box(gulv, W, 0.2, D, 0, 0.1, 0);

  /* 2 · Vægge i stueplan med vindueshuller (Arkitekt) */
  const stue = makePart('arkitekt', 1.9, 2);
  const glas1 = extraMat(stue, 0xbcd3d6, 0.42, { roughness: 0.15 });
  const doer = extraMat(stue, 0xcfc6b3, 1);
  const Y0 = 0.2, H = 2.6;
  wall(stue, 'x', D / 2 - T / 2, W, Y0, H, [
    { c: -2.3, w: 1.0, sill: 0, head: 2.1, door: true },
    { c: 1.2, w: 2.6, sill: 0.75, head: 2.1 }
  ], glas1, doer);
  wall(stue, 'x', -D / 2 + T / 2, W, Y0, H, [
    { c: -2.1, w: 1.4, sill: 0.9, head: 2.1 },
    { c: 2.1, w: 1.4, sill: 0.9, head: 2.1 }
  ], glas1, doer);
  wall(stue, 'z', W / 2 - T / 2, D - 2 * T, Y0, H, [{ c: 0, w: 1.8, sill: 0.9, head: 2.1 }], glas1, doer);
  wall(stue, 'z', -W / 2 + T / 2, D - 2 * T, Y0, H, [{ c: 0.6, w: 1.4, sill: 0.9, head: 2.1 }], glas1, doer);

  /* 3 · MEP-rør (orange) */
  const mep = makePart('mep', 2.9, 5);
  const pipe = (from, to, r = 0.09) => {
    const a = new THREE.Vector3(...from), b = new THREE.Vector3(...to);
    const len = a.distanceTo(b);
    const mesh = addMesh(mep, new THREE.CylinderGeometry(r, r, len, 14), 0, 0, 0);
    mesh.position.copy(a).add(b).multiplyScalar(0.5);
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize());
    [a, b].forEach((p) => addMesh(mep, new THREE.SphereGeometry(r * 1.25, 14, 10), p.x, p.y, p.z));
  };
  pipe([-3.1, 2.45, 1.6], [-3.1, 2.45, -1.3]);
  pipe([-3.1, 2.45, -1.3], [2.6, 2.45, -1.3]);
  pipe([2.6, 0.25, -1.3], [2.6, 6.35, -1.3]);
  pipe([0.2, 2.45, -1.3], [0.2, 2.45, 1.2]);

  /* 4 · Etageadskillelse (Konstruktion) */
  const daek = makePart('konstruktion', 3.8, 3);
  box(daek, W, 0.25, D, 0, 2.925, 0);

  /* 5 · Trempel og gavle (Arkitekt) */
  const sal = makePart('arkitekt', 4.9, 4);
  const glas2 = extraMat(sal, 0xbcd3d6, 0.42, { roughness: 0.15 });
  const Y1 = 3.05, KNEE = 0.85, RIDGE = 6.1;
  box(sal, W - 2 * T, KNEE, T, 0, Y1 + KNEE / 2, D / 2 - T / 2);
  box(sal, W - 2 * T, KNEE, T, 0, Y1 + KNEE / 2, -D / 2 + T / 2);
  const gableShape = new THREE.Shape();
  gableShape.moveTo(-D / 2, Y1); gableShape.lineTo(D / 2, Y1); gableShape.lineTo(D / 2, Y1 + KNEE);
  gableShape.lineTo(0, RIDGE); gableShape.lineTo(-D / 2, Y1 + KNEE); gableShape.closePath();
  const hole = new THREE.Path();
  hole.moveTo(-0.65, 3.95); hole.lineTo(-0.65, 4.95); hole.lineTo(0.65, 4.95); hole.lineTo(0.65, 3.95); hole.closePath();
  gableShape.holes.push(hole);
  const gableGeo = new THREE.ExtrudeGeometry(gableShape, { depth: T, bevelEnabled: false });
  [-W / 2, W / 2 - T].forEach((x) => {
    const g = addMesh(sal, gableGeo, x, 0, 0);
    g.rotation.y = Math.PI / 2;
    box(sal, 0.05, 1.0, 1.3, x + T / 2, 4.45, 0, glas2, false);
  });

  /* 6 · Saddeltag (Tag) */
  const tag = makePart('tag', 6.4, 6);
  const rise = RIDGE - (Y1 + KNEE), run = D / 2;
  const angle = Math.atan2(rise, run);
  const slope = Math.hypot(rise, run) + 0.55;        /* med udhæng */
  const TH = 0.2;
  [1, -1].forEach((side) => {
    const m = box(tag, W + 0.9, TH, slope, 0, 0, 0);
    m.rotation.x = side * angle;
    const along = slope / 2 - 0.02;
    m.position.set(0,
      RIDGE - Math.sin(angle) * along + Math.cos(angle) * (TH / 2),
      side * (Math.cos(angle) * along + Math.sin(angle) * (TH / 2)));
  });
  box(tag, W + 0.9, 0.14, 0.36, 0, RIDGE + 0.2, 0);

  /* ---------- Tilstand ---------- */
  const state = { manual: reduced ? 1 : 0, scroll: 0 };
  const CENTER_CLOSED = 2.7, CENTER_OPEN = 5.9, SCALE_OPEN = 0.68;

  /* Intro: huset bygger sig selv op nedefra, lag for lag */
  if (!reduced) parts.forEach((p) => tween(p, { b: 1 }, 0.6, 'power3.out', 0.1 + p.order * 0.13));

  const update = () => {
    const e = reduced ? state.manual : Math.max(state.manual, state.scroll);
    const s = lerp(1, SCALE_OPEN, e);
    world.scale.setScalar(s);
    world.position.y = TARGET.y - s * lerp(CENTER_CLOSED, CENTER_OPEN, e);

    parts.forEach((p) => {
      const L = layerState[p.layer];
      const alpha = p.b * L.v;
      p.group.visible = alpha > 0.01;
      p.group.position.y = p.explodeY * e + (1 - p.b) * 1.6 + (1 - L.v) * 0.7;
      p.mats.forEach(({ m, base }) => {
        const o = base * alpha;
        const transparent = o < 0.999;
        if (m.transparent !== transparent) { m.transparent = transparent; m.needsUpdate = true; }
        m.opacity = o;
        m.depthWrite = base === 1 ? alpha > 0.5 : false;
        if (m.emissive) m.emissiveIntensity = (m === p.mat ? 0.38 : 0.2) * L.hl;
      });
      p.group.traverse((o) => { if (o.isMesh && o.material === p.mat) o.castShadow = alpha > 0.5; });
    });
  };

  /* ---------- Kamera og styring ---------- */
  const controls = new OrbitControls(camera, canvas);
  controls.target.copy(TARGET);
  controls.enableZoom = false;
  controls.enablePan = false;
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.rotateSpeed = 0.7;
  controls.minPolarAngle = THREE.MathUtils.degToRad(40);
  controls.maxPolarAngle = THREE.MathUtils.degToRad(84);
  controls.autoRotate = !reduced;
  controls.autoRotateSpeed = 0.9;
  canvas.style.touchAction = 'pan-y';     /* lodret swipe scroller stadig siden på mobil */

  let resumeTimer;
  controls.addEventListener('start', () => { controls.autoRotate = false; clearTimeout(resumeTimer); hideLabel(); });
  controls.addEventListener('end', () => {
    if (reduced) return;
    clearTimeout(resumeTimer);
    resumeTimer = setTimeout(() => { controls.autoRotate = true; }, 2500);
  });

  const resize = () => {
    const w = stage.clientWidth, h = stage.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    const dist = DIST / Math.min(1, camera.aspect * 1.02);
    camera.position.sub(controls.target).setLength(dist).add(controls.target);
  };
  new ResizeObserver(resize).observe(stage);
  resize();

  /* ---------- Hover: laget lyser op og får en etiket ---------- */
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  let hovered = null;
  let labelTimer;

  const setHover = (layer) => {
    if (layer === hovered) return;
    hovered = layer;
    Object.keys(layerState).forEach((k) => tween(layerState[k], { hl: k === layer ? 1 : 0 }, 0.2, 'power3.out'));
    if (labelEl) {
      if (layer) labelEl.textContent = LAYERS[layer].label;
      labelEl.classList.toggle('is-on', !!layer);
    }
  };
  function hideLabel() { clearTimeout(labelTimer); setHover(null); }

  const pick = (ev) => {
    const r = canvas.getBoundingClientRect();
    pointer.set(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1);
    raycaster.setFromCamera(pointer, camera);
    const hit = raycaster.intersectObjects(pickables, false)
      .find((h) => h.object.parent.visible && layerState[h.object.userData.layer].v > 0.5);
    if (labelEl && hit) {
      const x = Math.min(r.width - 110, Math.max(4, ev.clientX - r.left + 14));
      const y = Math.max(4, ev.clientY - r.top - 34);
      labelEl.style.transform = 'translate(' + x + 'px,' + y + 'px)';
    }
    return hit ? hit.object.userData.layer : null;
  };
  canvas.addEventListener('pointermove', (ev) => {
    if (ev.pointerType !== 'mouse' || ev.buttons) return;
    setHover(pick(ev));
  });
  canvas.addEventListener('pointerleave', hideLabel);
  canvas.addEventListener('click', (ev) => {          /* tryk på mobil: vis etiketten kort */
    const layer = pick(ev);
    setHover(layer);
    clearTimeout(labelTimer);
    if (layer) labelTimer = setTimeout(() => setHover(null), 1800);
  });

  /* ---------- Render-løkke: pauser, når hero er ude af syne ---------- */
  let inView = true;
  let raf = 0;
  const frame = () => {
    raf = 0;
    if (!inView || document.hidden) return;
    update();
    controls.update();
    renderer.render(scene, camera);
    raf = requestAnimationFrame(frame);
  };
  const start = () => { if (!raf) raf = requestAnimationFrame(frame); };
  new IntersectionObserver(([e]) => { inView = e.isIntersecting; if (inView) start(); }).observe(stage);
  document.addEventListener('visibilitychange', start);
  start();

  return {
    setLayer(name, on) { if (layerState[name]) tween(layerState[name], { v: on ? 1 : 0 }, reduced ? 0 : 0.6, 'power3.out'); },
    setManual(on) { tween(state, { manual: on ? 1 : 0 }, reduced ? 0 : 1.0, 'expo.out'); },
    setScroll(p) { state.scroll = p; }
  };
}
