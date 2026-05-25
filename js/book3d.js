import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// Costruisce l'avatar 3D del volume e fornisce un'API per aggiornare il livello di degrado.
export function createBookScene(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x1a1410, 8, 18);

  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
  camera.position.set(3.2, 2.4, 4.6);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.target.set(0, 0.4, 0);
  controls.minDistance = 3; controls.maxDistance = 9;
  controls.maxPolarAngle = Math.PI * 0.49;

  // Luci ambient + faretto caldo
  scene.add(new THREE.AmbientLight(0x6a4f33, 0.45));
  const key = new THREE.DirectionalLight(0xffd9a0, 1.1);
  key.position.set(4, 6, 3);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.left = -4; key.shadow.camera.right = 4;
  key.shadow.camera.top = 4; key.shadow.camera.bottom = -4;
  scene.add(key);
  const rim = new THREE.DirectionalLight(0x8090c0, 0.35);
  rim.position.set(-4, 3, -3); scene.add(rim);

  // Piano (leggio)
  const deskTex = makeWoodTexture();
  const desk = new THREE.Mesh(
    new THREE.CircleGeometry(5.5, 64),
    new THREE.MeshStandardMaterial({ map: deskTex, roughness: 0.85, metalness: 0.05 })
  );
  desk.rotation.x = -Math.PI / 2;
  desk.receiveShadow = true;
  scene.add(desk);

  // --- Il libro ---
  const book = new THREE.Group();
  book.position.y = 0.18;
  scene.add(book);

  const W = 2.2, H = 0.55, D = 1.6; // larghezza, altezza (spessore), profondità

  // Texture procedurali (canvas) per cuoio e taglio carte
  const leatherTex = makeLeatherTexture();
  const edgeTex = makePagesEdgeTexture();
  const foxingTex = makeFoxingTexture();

  // Copertina (parallelepipedo con bordi smussati simulati da più mesh)
  const coverMat = new THREE.MeshStandardMaterial({
    color: 0x6b3a1f, map: leatherTex, roughness: 0.75, metalness: 0.05
  });
  // overlay foxing/sporco controllato via emissive scaling
  const damageMat = new THREE.MeshStandardMaterial({
    map: foxingTex, transparent: true, opacity: 0, roughness: 1
  });

  const coverGeo = new THREE.BoxGeometry(W, H, D, 1, 1, 1);
  const cover = new THREE.Mesh(coverGeo, coverMat);
  cover.castShadow = true; cover.receiveShadow = true;
  book.add(cover);

  // Overlay di degrado su una sottile placca sopra la copertina
  const overlay = new THREE.Mesh(
    new THREE.PlaneGeometry(W * 0.98, D * 0.98),
    damageMat
  );
  overlay.rotation.x = -Math.PI / 2;
  overlay.position.y = H / 2 + 0.001;
  book.add(overlay);

  // Pagine (blocco interno)
  const pagesGeo = new THREE.BoxGeometry(W * 0.95, H * 0.78, D * 0.96);
  const pagesMat = new THREE.MeshStandardMaterial({
    color: 0xf2e2bf, map: edgeTex, roughness: 0.95
  });
  const pages = new THREE.Mesh(pagesGeo, pagesMat);
  pages.position.y = 0;
  pages.castShadow = true; pages.receiveShadow = true;
  book.add(pages);

  // Decoro dorato sulla copertina (cornice)
  const goldMat = new THREE.MeshStandardMaterial({ color: 0xc89b3c, metalness: 0.85, roughness: 0.35 });
  const frameTop = new THREE.Mesh(
    new THREE.BoxGeometry(W * 0.78, 0.02, 0.025),
    goldMat
  );
  frameTop.position.set(0, H / 2 + 0.012, -D * 0.34);
  book.add(frameTop);
  const frameBot = frameTop.clone(); frameBot.position.z = D * 0.34; book.add(frameBot);
  const frameL = new THREE.Mesh(
    new THREE.BoxGeometry(0.025, 0.02, D * 0.7),
    goldMat
  );
  frameL.position.set(-W * 0.38, H / 2 + 0.012, 0);
  book.add(frameL);
  const frameR = frameL.clone(); frameR.position.x = W * 0.38; book.add(frameR);

  // Borchie agli angoli
  const studGeo = new THREE.SphereGeometry(0.05, 16, 12);
  [[-1,-1],[1,-1],[-1,1],[1,1]].forEach(([sx, sz]) => {
    const s = new THREE.Mesh(studGeo, goldMat);
    s.position.set(sx * W * 0.42, H / 2 + 0.02, sz * D * 0.42);
    book.add(s);
  });

  // Costa del libro (lato esterno) con nervature
  const spineGroup = new THREE.Group();
  spineGroup.position.set(-W / 2 - 0.005, 0, 0);
  book.add(spineGroup);
  for (let i = -2; i <= 2; i++) {
    const nerv = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.04, D * 0.95, 16),
      coverMat
    );
    nerv.rotation.x = Math.PI / 2;
    nerv.position.set(0, i * 0.1, 0);
    spineGroup.add(nerv);
  }

  // Posizione iniziale leggermente inclinata
  book.rotation.y = -0.35;

  // Ridimensionamento responsivo
  function resize() {
    const w = canvas.clientWidth || canvas.parentElement.clientWidth;
    const h = canvas.clientHeight || canvas.parentElement.clientHeight;
    if (w === 0 || h === 0) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  resize();
  const ro = new ResizeObserver(resize); ro.observe(canvas);

  // Stato di degrado applicato
  const state = {
    damage: 0,        // 0..1
    targetDamage: 0,
    materialColor: new THREE.Color(0x6b3a1f),
    pagesColor: new THREE.Color(0xf2e2bf)
  };

  function setDamage(value01, palette = {}) {
    state.targetDamage = Math.max(0, Math.min(1, value01));
    if (palette.coverBase) state.materialColor.set(palette.coverBase);
    if (palette.pagesBase) state.pagesColor.set(palette.pagesBase);
  }

  // Loop di rendering
  let t = 0;
  function tick() {
    requestAnimationFrame(tick);
    state.damage += (state.targetDamage - state.damage) * 0.06;

    const d = state.damage;
    // copertina: scurisce, opacizza, perde dorature
    const cover = state.materialColor.clone().lerp(new THREE.Color(0x2a1208), d * 0.7);
    coverMat.color.copy(cover);
    coverMat.roughness = 0.6 + d * 0.4;

    // pagine: ingialliscono e si scuriscono ai bordi
    const pg = state.pagesColor.clone().lerp(new THREE.Color(0x6e4a22), d * 0.85);
    pagesMat.color.copy(pg);

    // foxing/macchie diventano visibili
    damageMat.opacity = Math.min(0.92, d * 1.15);

    // oro si appanna
    goldMat.metalness = 0.85 * (1 - d * 0.7);
    goldMat.color.setHex(0xc89b3c).lerp(new THREE.Color(0x3a2a10), d * 0.6);

    // deformazione: leggera ondulazione
    t += 0.01;
    pages.scale.y = 1 + Math.sin(t) * 0.002;
    book.rotation.z = d * 0.05 * Math.sin(t * 0.4);

    controls.update();
    renderer.render(scene, camera);
  }
  tick();

  return { setDamage, scene, camera, controls };
}

// ===== Texture procedurali su canvas =====
function makeCanvas(size = 512) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  return c;
}

function makeLeatherTexture() {
  const c = makeCanvas(512);
  const ctx = c.getContext('2d');
  // base
  const g = ctx.createLinearGradient(0, 0, 512, 512);
  g.addColorStop(0, '#7a4321');
  g.addColorStop(1, '#5a2e16');
  ctx.fillStyle = g; ctx.fillRect(0, 0, 512, 512);
  // grana
  for (let i = 0; i < 4000; i++) {
    const x = Math.random() * 512, y = Math.random() * 512;
    const r = Math.random() * 1.2;
    ctx.fillStyle = `rgba(${20 + Math.random()*30 | 0}, ${10 + Math.random()*20 | 0}, 0, ${Math.random() * 0.35})`;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  }
  // graffi sottili
  for (let i = 0; i < 60; i++) {
    ctx.strokeStyle = `rgba(40,20,8,${0.2 + Math.random() * 0.3})`;
    ctx.lineWidth = Math.random() * 0.8 + 0.2;
    ctx.beginPath();
    ctx.moveTo(Math.random() * 512, Math.random() * 512);
    ctx.bezierCurveTo(Math.random()*512, Math.random()*512, Math.random()*512, Math.random()*512, Math.random()*512, Math.random()*512);
    ctx.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(1, 1);
  return t;
}

function makePagesEdgeTexture() {
  const c = makeCanvas(512);
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#f2e2bf'; ctx.fillRect(0, 0, 512, 512);
  for (let y = 0; y < 512; y += 2) {
    const shade = 220 + Math.sin(y * 0.6) * 12 + Math.random() * 10;
    ctx.fillStyle = `rgb(${shade}, ${shade - 25}, ${shade - 60})`;
    ctx.fillRect(0, y, 512, 1);
  }
  // bordi più scuri
  const grad = ctx.createLinearGradient(0, 0, 0, 512);
  grad.addColorStop(0, 'rgba(60, 30, 10, 0.45)');
  grad.addColorStop(0.5, 'rgba(60, 30, 10, 0)');
  grad.addColorStop(1, 'rgba(60, 30, 10, 0.45)');
  ctx.fillStyle = grad; ctx.fillRect(0, 0, 512, 512);
  const t = new THREE.CanvasTexture(c);
  return t;
}

function makeFoxingTexture() {
  const c = makeCanvas(512);
  const ctx = c.getContext('2d');
  ctx.clearRect(0, 0, 512, 512);
  // macchie irregolari color ruggine
  for (let i = 0; i < 80; i++) {
    const x = Math.random() * 512, y = Math.random() * 512;
    const r = 4 + Math.random() * 28;
    const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
    grad.addColorStop(0, `rgba(${80 + Math.random()*40 | 0}, ${30 + Math.random()*20 | 0}, 10, ${0.5 + Math.random() * 0.3})`);
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  }
  // crepe
  for (let i = 0; i < 25; i++) {
    ctx.strokeStyle = `rgba(20, 8, 0, ${0.4 + Math.random() * 0.3})`;
    ctx.lineWidth = Math.random() * 1.2 + 0.3;
    ctx.beginPath();
    let x = Math.random() * 512, y = Math.random() * 512;
    ctx.moveTo(x, y);
    for (let k = 0; k < 5; k++) {
      x += (Math.random() - 0.5) * 80;
      y += (Math.random() - 0.5) * 80;
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  return new THREE.CanvasTexture(c);
}

function makeWoodTexture() {
  const c = makeCanvas(512);
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#2a1a10'; ctx.fillRect(0, 0, 512, 512);
  for (let y = 0; y < 512; y++) {
    ctx.fillStyle = `rgba(${50 + Math.sin(y * 0.1) * 20 | 0}, ${25 + Math.sin(y * 0.07) * 10 | 0}, 12, 0.4)`;
    ctx.fillRect(0, y, 512, 1);
  }
  for (let i = 0; i < 600; i++) {
    ctx.fillStyle = `rgba(20,10,5,${Math.random() * 0.4})`;
    ctx.fillRect(Math.random() * 512, Math.random() * 512, Math.random() * 3, 1);
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}
