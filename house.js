/* =====================================================================
   house.js – 3D-huset i hero (Three.js r160, ingen build)
   Et parcelhus i ét plan, 11,7 × 7,4 m, bygget af geometri i koden og
   delt i tre fagmodeller:
     Konstruktion (grå)      stribefundament, sokkel, terrændæk, rem og gitterspær
     Arkitekt (hvid/beige)   hulmur med vinduer og døre, skillevægge og taget:
                             lægter, tagsten, rygning, stern, tagrender og gavle
     MEP (orange)            ventilation: aggregat, kanaler, ventiler, taghætter
   Et kald til setLayer('tag', …) fra en ældre lagknap gør ingenting.
   Mål i meter. y = 0 er terræn, og gitteret ligger i terrænhøjde. Fundamentet
   er skjult under terræn, indtil lagene adskilles og det løftes fri.
   ===================================================================== */
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const LAYERS = {
  konstruktion: { label: 'Konstruktion', color: 0x9aa19a },
  arkitekt: { label: 'Arkitekt', color: 0xf0ebe1 },
  mep: { label: 'MEP', color: 0xe08a2e }
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
  canvas.setAttribute('aria-label', 'Interaktiv 3D-model af et parcelhus opdelt i fagmodeller. Træk for at dreje.');
  canvas.setAttribute('role', 'img');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true }); /* kaster fejl uden WebGL */
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.localClippingEnabled = true;                 /* fundamentet skæres af i terrænhøjde */
  stage.prepend(canvas);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 200);
  const TARGET = new THREE.Vector3(0, 2.7, 0);
  const DIST = 33;
  camera.position.setFromSphericalCoords(DIST, THREE.MathUtils.degToRad(66), THREE.MathUtils.degToRad(38)).add(TARGET);

  scene.add(new THREE.HemisphereLight(0xffffff, 0xd9dfd2, 1.15));
  const sun = new THREE.DirectionalLight(0xffffff, 1.9);
  sun.position.set(10, 15, 11);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -15; sun.shadow.camera.right = 15;
  sun.shadow.camera.top = 18; sun.shadow.camera.bottom = -12;
  sun.shadow.camera.near = 1; sun.shadow.camera.far = 60;
  sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.03; sun.shadow.radius = 4;
  scene.add(sun);

  /* Alt står i én gruppe, så modellen kan skaleres, når lagene adskilles */
  const world = new THREE.Group();
  scene.add(world);

  /* ---------- Hovedmål ---------- */
  const L = 11.7, B = 7.4;            /* udvendige mål */
  const FUND = -0.9;                  /* underkant fundament: frostfri dybde */
  const FLOOR = 0.2;                  /* overkant sokkel og terrændæk */
  const WALL_TOP = 2.7;               /* overkant mur: 2,5 m over gulv */
  const WT = 0.4;                     /* hulmur: 110 formur + 190 isolering + 100 bagmur */

  const ground = new THREE.Mesh(new THREE.PlaneGeometry(70, 70), new THREE.ShadowMaterial({ opacity: 0.16 }));
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = 0;
  ground.receiveShadow = true;
  world.add(ground);
  const grid = new THREE.GridHelper(26, 26, 0xc4ccbd, 0xd5dbcf);
  grid.position.y = 0.005;
  grid.material.transparent = true;
  grid.material.opacity = 0.7;
  world.add(grid);

  /* ---------- Byggeklodser ---------- */
  const parts = [];
  const pickables = [];
  const layerState = {};
  Object.keys(LAYERS).forEach((k) => { layerState[k] = { v: 1, hl: 0 }; });

  /* Et materiale pr. overflade. base < 1 er glas: kaster ikke skygge og kan ikke rammes af musen */
  const material = (part, color, base = 1, roughness = 0.88) => {
    const m = new THREE.MeshStandardMaterial({ color, roughness, metalness: 0, transparent: base < 1, opacity: base });
    m.emissive = new THREE.Color(color);
    m.emissiveIntensity = 0;
    part.mats.push({ m, base });
    return m;
  };
  const makePart = (layer, explodeY, order) => {
    const group = new THREE.Group();
    world.add(group);
    const part = { layer, group, explodeY, order, b: reduced ? 1 : 0, mats: [], meshes: [], buckets: new Map() };
    part.mat = material(part, LAYERS[layer].color);
    parts.push(part);
    return part;
  };

  /* Geometrien samles pr. materiale og flettes til ét net til sidst (få tegnekald) */
  const put = (part, geo, mat) => {
    const m = mat || part.mat;
    let list = part.buckets.get(m);
    if (!list) part.buckets.set(m, (list = []));
    list.push(geo.index ? geo.toNonIndexed() : geo);
  };
  const box = (part, w, h, d, x, y, z, mat) => {
    if (w <= 0.001 || h <= 0.001 || d <= 0.001) return;
    put(part, new THREE.BoxGeometry(w, h, d).translate(x, y, z), mat);
  };
  /* Kasse, der følger tagfladen: drejet om x-aksen */
  const slopeBox = (part, w, h, d, rx, x, y, z, mat) =>
    put(part, new THREE.BoxGeometry(w, h, d).rotateX(rx).translate(x, y, z), mat);
  /* Profil tegnet i (z, y) og trukket ud langs x, centreret om x */
  const prismX = (part, pts, t, x, mat) => {
    const shape = new THREE.Shape(pts.map(([z, y]) => new THREE.Vector2(z, y)));
    const geo = new THREE.ExtrudeGeometry(shape, { depth: t, bevelEnabled: false });
    geo.rotateY(-Math.PI / 2).translate(x + t / 2, 0, 0);
    put(part, geo, mat);
  };
  /* En ring langs husets omkreds, fx sokkel eller fundament */
  const ring = (part, hx, hz, w, y0, y1, mat) => {
    const h = y1 - y0, y = (y0 + y1) / 2;
    [1, -1].forEach((s) => {
      box(part, 2 * hx, h, w, 0, y, s * (hz - w / 2), mat);
      box(part, w, h, 2 * (hz - w), s * (hx - w / 2), y, 0, mat);
    });
  };
  /* Et vægstykke med åbninger: piller, brystning og overligger */
  const wallRun = (part, axis, fixed, from, to, thick, openings, mat) => {
    const seg = (u0, u1, ya, yb) => {
      if (u1 - u0 <= 0.001 || yb - ya <= 0.001) return;
      const u = (u0 + u1) / 2, y = (ya + yb) / 2;
      if (axis === 'x') box(part, u1 - u0, yb - ya, thick, u, y, fixed, mat);
      else box(part, thick, yb - ya, u1 - u0, fixed, y, u, mat);
    };
    let cursor = from;
    openings.slice().sort((a, b) => a.c - b.c).forEach((o) => {
      const l = o.c - o.w / 2, r = o.c + o.w / 2;
      seg(cursor, l, FLOOR, WALL_TOP);                       /* pille */
      seg(l, r, FLOOR, FLOOR + o.sill);                      /* brystning */
      seg(l, r, FLOOR + o.head, WALL_TOP);                   /* overligger */
      cursor = r;
    });
    seg(cursor, to, FLOOR, WALL_TOP);
  };

  /* ================= 1 · Konstruktion ================= */
  /* Stribefundament i beton til frostfri dybde og sokkel af letklinkerblokke */
  const fundament = makePart('konstruktion', -FUND, 0);  /* løftes op på terræn, når lagene adskilles */
  const beton = material(fundament, 0x8b928b);
  const terrain = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  fundament.mats.forEach(({ m }) => { m.clippingPlanes = [terrain]; m.clipShadows = true; });
  ring(fundament, L / 2 + 0.05, B / 2 + 0.05, 0.5, FUND, -0.4, beton);
  ring(fundament, L / 2, B / 2, WT, -0.4, FLOOR);

  /* Terrændæk mellem soklerne: 300 mm trykfast isolering og 100 mm betonplade */
  const terraen = makePart('konstruktion', 1.9, 1);
  const eps = material(terraen, 0xc8cdc6);
  box(terraen, L - 2 * WT, 0.3, B - 2 * WT, 0, FLOOR - 0.25, 0, eps);
  box(terraen, L - 2 * WT, 0.1, B - 2 * WT, 0, FLOOR - 0.05, 0);

  /* ================= 2 · Arkitekt ================= */
  const vaegge = makePart('arkitekt', 3.0, 2);
  const iso = material(vaegge, 0xe3d9b8);
  const bagmur = material(vaegge, 0xf8f6f0);
  const karm = material(vaegge, 0xffffff, 1, 0.6);
  const doer = material(vaegge, 0xcfc6b3, 1, 0.7);
  const saal = material(vaegge, 0xd8d1c2);
  const glas = material(vaegge, 0xbcd3d6, 0.42, 0.15);

  /* Åbninger: c = midte langs facaden, sill/head = højde over gulv */
  const front = [                                        /* z = +B/2 */
    { c: -3.3, w: 2.6, sill: 0.6, head: 2.1 },           /* stue */
    { c: 0.65, w: 1.0, sill: 0, head: 2.1, door: true }, /* hoveddør til entré */
    { c: 3.65, w: 1.4, sill: 0.9, head: 2.1 }            /* værelse */
  ];
  const back = [                                         /* z = -B/2 */
    { c: -4.0, w: 1.6, sill: 1.1, head: 2.1 },           /* køkken */
    { c: -1.8, w: 1.8, sill: 0, head: 2.1 },             /* terrassedør */
    { c: 0.65, w: 0.6, sill: 1.3, head: 2.1 },           /* bad */
    { c: 3.65, w: 1.4, sill: 0.9, head: 2.1 }            /* værelse */
  ];
  const west = [{ c: 0, w: 2.0, sill: 0.6, head: 2.1 }]; /* x = -L/2, stue */
  const east = [{ c: -1.5, w: 1.2, sill: 0.9, head: 2.1 }];

  /* Hulmur i tre lag, hvert lag som en ring */
  [[0, 0.11, vaegge.mat], [0.11, 0.3, iso], [0.3, WT, bagmur]].forEach(([a, b, mat]) => {
    const t = b - a, m = (a + b) / 2;
    wallRun(vaegge, 'x', B / 2 - m, -(L / 2 - a), L / 2 - a, t, front, mat);
    wallRun(vaegge, 'x', -(B / 2 - m), -(L / 2 - a), L / 2 - a, t, back, mat);
    wallRun(vaegge, 'z', L / 2 - m, -(B / 2 - b), B / 2 - b, t, east, mat);
    wallRun(vaegge, 'z', -(L / 2 - m), -(B / 2 - b), B / 2 - b, t, west, mat);
  });

  /* Vindue eller dør: karm, poste, rude eller dørblad og sålbænk. Sidder bag formuren */
  const glazing = (axis, face, out, o) => {
    const n = face - out * 0.17;
    const y0 = FLOOR + o.sill, y1 = FLOOR + o.head, ym = (y0 + y1) / 2;
    const K = 0.05, KD = 0.1;
    const at = (wu, h, dn, u, y, mat, nn = n) => (axis === 'x'
      ? box(vaegge, wu, h, dn, u, y, nn, mat)
      : box(vaegge, dn, h, wu, nn, y, u, mat));
    at(o.w, K, KD, o.c, y1 - K / 2, karm);
    at(o.w, K, KD, o.c, y0 + K / 2, karm);
    [-1, 1].forEach((s) => at(K, y1 - y0 - 2 * K, KD, o.c + s * (o.w / 2 - K / 2), ym, karm));
    if (o.door) {
      at(o.w - 2 * K, y1 - y0 - 2 * K, 0.05, o.c, ym, doer);
    } else {
      const panes = Math.max(1, Math.round(o.w / 0.95));
      for (let i = 1; i < panes; i++) at(K, y1 - y0 - 2 * K, KD, o.c - o.w / 2 + (i * o.w) / panes, ym, karm);
      at(o.w - 2 * K, y1 - y0 - 2 * K, 0.02, o.c, ym, glas);
    }
    if (o.sill > 0) at(o.w + 0.06, 0.03, 0.2, o.c, y0 - 0.015, saal, face - out * 0.07);
  };
  front.forEach((o) => glazing('x', B / 2, 1, o));
  back.forEach((o) => glazing('x', -B / 2, -1, o));
  east.forEach((o) => glazing('z', L / 2, 1, o));
  west.forEach((o) => glazing('z', -L / 2, -1, o));

  /* Skillevægge: stue/køkken mod vest, entré og bad i midten, to værelser mod øst */
  const skille = material(vaegge, 0xfbfaf5);
  const IX = L / 2 - WT, IZ = B / 2 - WT;                 /* indvendige mål */
  const dør = (c, w = 0.9) => ({ c, w, sill: 0, head: 2.1 });
  wallRun(vaegge, 'z', -0.5, -IZ, IZ, 0.1, [dør(1.0)], skille);                 /* stue | entré */
  wallRun(vaegge, 'z', 1.8, -IZ, IZ, 0.1, [dør(1.2), dør(-0.3)], skille);       /* entré og bad | værelser */
  wallRun(vaegge, 'x', -0.9, -0.45, 1.75, 0.1, [dør(0.65, 0.8)], skille);       /* entré | bad */
  wallRun(vaegge, 'x', 0.35, 1.85, IX, 0.1, [], skille);                        /* værelse | værelse */

  /* ================= 3 · Konstruktion: rem og gitterspær ================= */
  const spaer = makePart('konstruktion', 6.6, 3);
  const trae = material(spaer, 0xb1b7af);              /* spærtræ, lysere end betonen */

  /* ================= 4 · Arkitekt: taget oven på spærene ================= */
  const tagflade = makePart('arkitekt', 7.9, 5);
  const tegl = material(tagflade, 0xb5a483);           /* tagsten og rygning i mørkere sand */
  const laegte = material(tagflade, 0xddd3bb);
  const gavl = material(tagflade, 0xcabea4);
  const zink = material(tagflade, 0xa6a194, 1, 0.6);

  const PITCH = THREE.MathUtils.degToRad(30);
  const tanP = Math.tan(PITCH), cosP = Math.cos(PITCH), sinP = Math.sin(PITCH);
  const REM_Z = B / 2 - 0.35;                          /* remmen ligger midt på bagmuren */
  const FOD_Y = WALL_TOP + 0.1, FOD_H = 0.15, FOD_TOP = FOD_Y + FOD_H;
  const CHV = 0.2 / cosP;                              /* spærhoved 45×195, målt lodret */
  const TAIL = B / 2 + 0.6;                            /* 600 mm udhæng ved facaden */
  const GABLE = 0.3;                                   /* 300 mm udhæng ved gavlen */
  const LX = L + 2 * GABLE;
  /* Over- og underside af spærhovedet. Spærene har hæl, så der er plads til loftisoleringen ved facaden */
  const yTop = (z) => FOD_Y + FOD_H / 2 + 0.3 + CHV / 2 + (REM_Z - Math.abs(z)) * tanP;
  const yBot = (z) => yTop(z) - CHV;

  /* Rem 100×100 på bagmuren i begge facader */
  [1, -1].forEach((s) => box(spaer, L - 0.6, 0.1, 0.1, 0, WALL_TOP + 0.05, s * REM_Z, trae));

  /* Gitterspær (W-spær): spærfod, to spærhoveder, hæle og fire gitterstænger */
  const web = (x, p, q, w = 0.09) => {
    const dz = q[0] - p[0], dy = q[1] - p[1], len = Math.hypot(dz, dy);
    const nz = (-dy / len) * (w / 2), ny = (dz / len) * (w / 2);
    prismX(spaer, [[p[0] + nz, p[1] + ny], [q[0] + nz, q[1] + ny], [q[0] - nz, q[1] - ny], [p[0] - nz, p[1] - ny]], 0.05, x, trae);
  };
  const SPAN = 2 * REM_Z;
  const truss = (x) => {
    box(spaer, 0.05, FOD_H, SPAN + 0.14, x, FOD_Y + FOD_H / 2, 0, trae);
    [1, -1].forEach((s) => {
      prismX(spaer, [[0, yTop(0)], [s * TAIL, yTop(TAIL)], [s * TAIL, yBot(TAIL)], [0, yBot(0)]], 0.05, x, trae);
      const h0 = REM_Z - 0.12, h1 = REM_Z + 0.07;
      prismX(spaer, [[s * h0, FOD_TOP], [s * h1, FOD_TOP], [s * h1, yBot(h1) + 0.02], [s * h0, yBot(h0) + 0.02]], 0.05, x, trae);
      web(x, [s * SPAN / 6, FOD_TOP - 0.04], [s * SPAN / 4, yBot(SPAN / 4) + 0.04]);
      web(x, [s * SPAN / 6, FOD_TOP - 0.04], [s * 0.04, yBot(0) + 0.02]);
    });
  };
  const TRUSS_X0 = -(L / 2 - 0.35);                    /* gavlspær på gavlens bagmur */
  const BAYS = Math.round((-2 * TRUSS_X0) / 1.0);      /* spær pr. ca. 1,0 m */
  for (let i = 0; i <= BAYS; i++) truss(TRUSS_X0 + (i * -2 * TRUSS_X0) / BAYS);

  /* Lægter på tværs af spærene, fra toplægte til fodlægte */
  const SLOPE = TAIL / cosP;
  const LAEGTER = 16;
  for (let i = 0; i < LAEGTER; i++) {
    const s = 0.07 + (i * (SLOPE - 0.14)) / (LAEGTER - 1);
    const zc = s * cosP + 0.025 * sinP, yc = yTop(0) - s * sinP + 0.025 * cosP;
    [1, -1].forEach((side) => slopeBox(tagflade, LX, 0.05, 0.075, side * PITCH, 0, yc, side * zc, laegte));
  }

  /* Sternbræt og tagrende ved tagfoden */
  [1, -1].forEach((s) => {
    box(tagflade, LX, CHV + 0.03, 0.025, 0, (yTop(TAIL) + yBot(TAIL)) / 2 + 0.015, s * (TAIL + 0.0125), gavl);
    put(tagflade, new THREE.CylinderGeometry(0.065, 0.065, LX, 12).rotateZ(Math.PI / 2)
      .translate(0, yTop(TAIL) - 0.05, s * (TAIL + 0.09)), zink);
  });

  /* Gavltrekanter med lodret bræddebeklædning (1 på 2) og vindskeder */
  [1, -1].forEach((s) => {
    const x = s * (L / 2 - 0.035);
    prismX(tagflade, [[-B / 2, WALL_TOP], [B / 2, WALL_TOP], [B / 2, yTop(B / 2)], [0, yTop(0)], [-B / 2, yTop(B / 2)]], 0.03, x, gavl);
    for (let k = -14; k <= 14; k++) {
      const z0 = k * 0.25 - 0.05, z1 = k * 0.25 + 0.05;
      const pts = [[z0, WALL_TOP], [z1, WALL_TOP], [z1, yTop(z1)]];
      if (k === 0) pts.push([0, yTop(0)]);
      pts.push([z0, yTop(z0)]);
      prismX(tagflade, pts, 0.022, s * (L / 2 - 0.009), gavl);
    }
    const zv = TAIL + 0.025;
    const up = (z) => yTop(z) + 0.05 / cosP, dn = (z) => yTop(z) - 0.15;
    prismX(tagflade, [[-zv, dn(zv)], [0, dn(0)], [zv, dn(zv)], [zv, up(zv)], [0, up(0)], [-zv, up(zv)]], 0.025, s * (LX / 2 + 0.0125), gavl);
  });

  /* Tagdækning og rygning */
  const under = (z) => yTop(z) + 0.05 / cosP;          /* oven på lægterne */
  const over = (z) => under(z) + 0.06 / cosP;
  const EAVE = TAIL + 0.08;
  prismX(tagflade, [[-EAVE, under(EAVE)], [0, under(0)], [EAVE, under(EAVE)], [EAVE, over(EAVE) - 0.03], [0, over(0) - 0.03], [-EAVE, over(EAVE) - 0.03]], LX + 0.08, 0, tegl);
  /* Tagsten i skifter: ét skifte pr. lægte, hvert skifte ligger en anelse fladere end tagfladen */
  const COURSE = (EAVE / cosP) / (LAEGTER - 1);
  const TILT = Math.atan(0.03 / COURSE);
  for (let i = 0; i < LAEGTER - 1; i++) {
    const s = (i + 0.5) * COURSE, n = 0.05 + 0.03 + 0.03;   /* afstand vinkelret fra spærets overside */
    const zc = s * cosP + n * sinP, yc = yTop(0) - s * sinP + n * cosP;
    [1, -1].forEach((side) => slopeBox(tagflade, LX + 0.08, 0.03, COURSE / Math.cos(TILT), side * (PITCH - TILT), 0, yc, side * zc, tegl));
  }
  put(tagflade, new THREE.CylinderGeometry(0.12, 0.12, LX + 0.12, 14).rotateZ(Math.PI / 2).translate(0, over(0) - 0.02, 0), tegl);

  /* ================= 5 · MEP: ventilation i tagrummet ================= */
  const mep = makePart('mep', 3.9, 4);
  const aggregat = material(mep, 0xc9781f);
  const UP = new THREE.Vector3(0, 1, 0);
  const duct = (a, b, r) => {
    const A = new THREE.Vector3(...a), Bv = new THREE.Vector3(...b);
    const geo = new THREE.CylinderGeometry(r, r, A.distanceTo(Bv), 16);
    geo.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(UP, Bv.clone().sub(A).normalize()));
    geo.translate((A.x + Bv.x) / 2, (A.y + Bv.y) / 2, (A.z + Bv.z) / 2);
    put(mep, geo);
  };
  const knee = (p, r) => put(mep, new THREE.SphereGeometry(r, 16, 10).translate(...p));
  const MAIN = 0.09, BRANCH = 0.07;                    /* ø160 hovedkanal og ø125 stik, tegnet lidt kraftigt */
  const YM = FOD_TOP + MAIN;                           /* kanalerne ligger oven på spærfødderne */
  const AX = 1.0;                                      /* aggregatet står mellem to spær over entré og bad */
  box(mep, 0.9, 0.55, 0.6, AX, FOD_TOP + 0.275, 0, aggregat);

  /* Stik fra hovedkanal til ventil i loftet. Stikkene ligger midt mellem to spær */
  const branch = (x, zMain, zEnd) => {
    duct([x, YM, zMain], [x, YM, zEnd], BRANCH);
    knee([x, YM, zEnd], BRANCH);
    duct([x, YM, zEnd], [x, WALL_TOP + 0.08, zEnd], BRANCH);
    put(mep, new THREE.CylinderGeometry(0.14, 0.14, 0.04, 20).translate(x, WALL_TOP + 0.07, zEnd));
  };
  /* Indblæsning (z = +0,18) til stue og værelser. Hovedkanalerne går gennem spærenes midterfelt */
  duct([AX - 0.45, YM, 0.18], [-4, YM, 0.18], MAIN); knee([-4, YM, 0.18], MAIN);
  branch(-4, 0.18, 2.0);
  branch(-2, 0.18, 2.0);
  duct([AX + 0.45, YM, 0.18], [3, YM, 0.18], MAIN); knee([3, YM, 0.18], MAIN);
  branch(3, 0.18, 1.9);
  branch(3, 0.18, -1.6);
  /* Udsugning (z = -0,18) fra køkken og bad */
  duct([AX - 0.45, YM, -0.18], [-3, YM, -0.18], MAIN); knee([-3, YM, -0.18], MAIN);
  branch(-3, -0.18, -2.2);
  branch(0, -0.18, -2.0);
  /* Friskluft og afkast over tag, én taghætte på hver tagflade */
  [1, -1].forEach((s) => {
    const z = s * 1.3, y = FOD_TOP + 0.33, top = over(1.3) + 0.38;
    duct([AX, y, s * 0.3], [AX, y, z], MAIN); knee([AX, y, z], MAIN);
    duct([AX, y, z], [AX, top, z], MAIN);
    put(mep, new THREE.CylinderGeometry(0.17, 0.17, 0.14, 20).translate(AX, top + 0.05, z));
    put(mep, new THREE.CylinderGeometry(0.2, 0.2, 0.025, 20).translate(AX, top + 0.13, z));
  });

  /* ---------- Flet geometrien til ét net pr. materiale ---------- */
  parts.forEach((p) => {
    p.buckets.forEach((list, mat) => {
      const mesh = new THREE.Mesh(mergeGeometries(list, false), mat);
      const solid = mat.opacity === 1;
      mesh.userData.layer = p.layer;
      mesh.userData.cast = solid;
      mesh.castShadow = solid;
      mesh.receiveShadow = p.layer !== 'mep';      /* kanalerne beholder deres farve under taget */
      p.group.add(mesh);
      p.meshes.push(mesh);
      if (solid) pickables.push(mesh);
      list.forEach((g) => g.dispose());
    });
    p.buckets = null;
  });

  /* ---------- Tilstand ---------- */
  const state = { manual: reduced ? 1 : 0, scroll: 0 };
  const TOP = over(0) + 0.1;
  const CENTER_CLOSED = TOP / 2;
  const CENTER_OPEN = (TOP + tagflade.explodeY) / 2;
  const SCALE_OPEN = 0.87;

  /* Intro: huset bygger sig selv op nedefra, lag for lag */
  if (!reduced) parts.forEach((p) => tween(p, { b: 1 }, 0.6, 'power3.out', 0.1 + p.order * 0.13));

  const update = () => {
    const e = reduced ? state.manual : Math.max(state.manual, state.scroll);
    const s = lerp(1, SCALE_OPEN, e);
    world.scale.setScalar(s);
    world.position.y = TARGET.y - s * lerp(CENTER_CLOSED, CENTER_OPEN, e);
    terrain.constant = -world.position.y;

    parts.forEach((p) => {
      const Ls = layerState[p.layer];
      const alpha = p.b * Ls.v;
      p.group.visible = alpha > 0.01;
      p.group.position.y = p.explodeY * e + (1 - p.b) * 1.6 + (1 - Ls.v) * 0.7;
      p.mats.forEach(({ m, base }) => {
        const o = base * alpha;
        const transparent = o < 0.999;
        if (m.transparent !== transparent) { m.transparent = transparent; m.needsUpdate = true; }
        m.opacity = o;
        m.depthWrite = base === 1 ? alpha > 0.5 : false;
        m.emissiveIntensity = (base === 1 ? 0.34 : 0.1) * Ls.hl;
      });
      p.meshes.forEach((mesh) => { mesh.castShadow = mesh.userData.cast && alpha > 0.5; });
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
      .find((h) => h.object.parent.visible && layerState[h.object.userData.layer].v > 0.5 && h.point.y > world.position.y);
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
  let active = true;
  let raf = 0;
  const frame = () => {
    raf = 0;
    if (!inView || !active || document.hidden) return;
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
    setScroll(p) { state.scroll = p; },
    setActive(on) { active = !!on; if (active) start(); }
  };
}
