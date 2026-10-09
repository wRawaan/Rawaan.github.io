// Comet Run: a tiny 3D game built with Three.js.
// Three.js is only downloaded when the visitor presses Play, so it costs nothing until then.
const THREE_URL = "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";

const canvas = document.getElementById("comet-canvas");
const btn = document.getElementById("comet-start");
const hudScore = document.getElementById("c-score");
const hudTime = document.getElementById("c-time");
const hudCombo = document.getElementById("c-combo");

if (canvas && btn) {
  let game = null;
  btn.addEventListener("click", async () => {
    btn.disabled = true;
    btn.textContent = "Loading…";
    try {
      if (!game) {
        const THREE = await import(THREE_URL);
        game = createGame(THREE);
      }
    } catch (err) {
      console.error(err);
      btn.textContent = "Couldn't start the game. Check your connection (and that WebGL is on) and try again.";
      btn.disabled = false;
      return;
    }
    btn.hidden = true;
    btn.disabled = false;
    game.start();
  });
}

function createGame(THREE) {
  // ---- Settings you can tweak ----
  const DURATION = 45;      // seconds per run
  const BASE_SPEED = 18;    // how fast things rush toward you
  const SPEED_RAMP = 0.35;  // extra speed gained per second
  const VOID_CHANCE = 0.26; // share of objects that are dangerous voids
  const LIVES = 3;          // lives per run; each void you hit costs one
  const INVULN = 1.2;       // seconds of protection after a hit

  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const GOLD = 0xe8d9a8, PEARL = 0xf4f1ea, BLUE = 0x9fb4ff, BG = 0x05070f;
  const demo = canvas.closest(".demo");

  // ---- Renderer, scene, camera ----
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  renderer.setClearColor(BG);
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(BG, 0.02);
  const camera = new THREE.PerspectiveCamera(60, 1.6, 0.1, 200);
  camera.position.set(0, 0, 6);
  camera.lookAt(0, 0, -20);

  let boundX = 5, boundY = 3;
  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    const halfH = Math.tan((camera.fov * Math.PI) / 360) * camera.position.z;
    boundY = halfH * 0.8;
    boundX = halfH * camera.aspect * 0.8;
  }
  new ResizeObserver(resize).observe(canvas);
  resize();

  scene.add(new THREE.AmbientLight(0x8899cc, 0.9));
  const key = new THREE.DirectionalLight(0xffffff, 1.5);
  key.position.set(3, 5, 6);
  scene.add(key);

  // ---- Background: stars and tunnel rings that rush past ----
  const BG_COUNT = 500;
  const bgPos = new Float32Array(BG_COUNT * 3);
  for (let i = 0; i < BG_COUNT; i++) {
    bgPos[i * 3] = (Math.random() - 0.5) * 120;
    bgPos[i * 3 + 1] = (Math.random() - 0.5) * 70;
    bgPos[i * 3 + 2] = -Math.random() * 160;
  }
  const bgGeo = new THREE.BufferGeometry();
  bgGeo.setAttribute("position", new THREE.BufferAttribute(bgPos, 3));
  scene.add(new THREE.Points(bgGeo, new THREE.PointsMaterial({
    color: PEARL, size: 0.28, transparent: true, opacity: 0.8, sizeAttenuation: true
  })));

  const ringGeo = new THREE.TorusGeometry(10, 0.05, 6, 64);
  const ringMat = new THREE.MeshBasicMaterial({ color: GOLD, transparent: true, opacity: 0.28 });
  const rings = [];
  for (let i = 0; i < 12; i++) {
    const r = new THREE.Mesh(ringGeo, ringMat);
    r.position.z = -i * 12;
    scene.add(r);
    rings.push(r);
  }

  // ---- Player: a glowing core inside a halo ----
  const player = new THREE.Group();
  const core = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.35, 1),
    new THREE.MeshStandardMaterial({ color: PEARL, emissive: GOLD, emissiveIntensity: 1 })
  );
  const halo = new THREE.Mesh(
    new THREE.TorusGeometry(0.7, 0.035, 8, 48),
    new THREE.MeshBasicMaterial({ color: GOLD })
  );
  halo.rotation.x = Math.PI / 2.3;
  const playerLight = new THREE.PointLight(GOLD, 6, 12);
  player.add(core, halo, playerLight);
  scene.add(player);

  // ---- Things to collect or dodge ----
  function glowTexture() {
    const c = document.createElement("canvas");
    c.width = c.height = 64;
    const g = c.getContext("2d");
    const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, "rgba(255,255,255,1)");
    gr.addColorStop(0.3, "rgba(255,255,255,0.35)");
    gr.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = gr;
    g.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(c);
  }
  const tex = glowTexture();
  const glowMat = (color) => new THREE.SpriteMaterial({
    map: tex, color, transparent: true, opacity: 0.7, depthWrite: false, blending: THREE.AdditiveBlending
  });
  const KINDS = {
    star: {
      geo: new THREE.OctahedronGeometry(0.34),
      mat: new THREE.MeshStandardMaterial({ color: GOLD, emissive: GOLD, emissiveIntensity: 0.9, roughness: 0.4 }),
      glow: glowMat(GOLD), hit: 1.15
    },
    comet: {
      geo: new THREE.IcosahedronGeometry(0.42, 0),
      mat: new THREE.MeshStandardMaterial({ color: BLUE, emissive: BLUE, emissiveIntensity: 1, roughness: 0.3 }),
      glow: glowMat(BLUE), hit: 1.25
    },
    voidk: {
      geo: new THREE.SphereGeometry(0.6, 14, 14),
      mat: new THREE.MeshStandardMaterial({ color: 0x0a0a16, emissive: 0x3b1d7a, emissiveIntensity: 0.8, roughness: 0.8 }),
      hit: 1.0
    }
  };
  const voidRingGeo = new THREE.TorusGeometry(0.9, 0.03, 6, 32);
  const voidRingMat = new THREE.MeshBasicMaterial({ color: 0x8a5cff });

  let objs = [];
  function spawn(z) {
    const r = Math.random();
    const kind = r < VOID_CHANCE ? "voidk" : r < VOID_CHANCE + 0.1 ? "comet" : "star";
    const k = KINDS[kind];
    const mesh = new THREE.Mesh(k.geo, k.mat);
    if (k.glow) {
      const s = new THREE.Sprite(k.glow);
      s.scale.set(1.8, 1.8, 1);
      mesh.add(s);
    } else {
      const ring = new THREE.Mesh(voidRingGeo, voidRingMat);
      ring.rotation.x = Math.PI / 2.4;
      mesh.add(ring);
    }
    mesh.position.set((Math.random() * 2 - 1) * boundX, (Math.random() * 2 - 1) * boundY, z);
    scene.add(mesh);
    objs.push({ mesh, kind });
  }

  // ---- State ----
  let state = "idle", raf = 0, last = 0, visible = true;
  let lives = LIVES, invuln = 0;
  let score = 0, combo = 0, timeLeft = DURATION, elapsed = 0, spawnTimer = 0, shake = 0, pulse = 0;
  let tx = 0, ty = 0, best = 0;
  const keys = {};
  const hud = { score: null, time: null, combo: null };
  try { best = +localStorage.getItem("comet-best") || 0; } catch (e) {}

  // ---- Input ----
  function setPointer(e) {
    const r = canvas.getBoundingClientRect();
    const nx = ((e.clientX - r.left) / r.width) * 2 - 1;
    const ny = -(((e.clientY - r.top) / r.height) * 2 - 1);
    tx = Math.max(-boundX, Math.min(boundX, nx * boundX));
    ty = Math.max(-boundY, Math.min(boundY, ny * boundY));
  }
  canvas.addEventListener("pointermove", (e) => { if (state === "play") setPointer(e); });
  canvas.addEventListener("pointerdown", (e) => { if (state === "play") setPointer(e); });
  addEventListener("keydown", (e) => {
    if (state !== "play") return;
    if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "a", "d", "w", "s"].includes(e.key)) {
      keys[e.key] = true;
      e.preventDefault();
    }
  });
  addEventListener("keyup", (e) => delete keys[e.key]);

  // ---- Lives display (built here, so no HTML change is needed) ----
  const livesEl = document.createElement("div");
  livesEl.className = "comet-lives";
  livesEl.setAttribute("aria-hidden", "true");
  for (let i = 0; i < LIVES; i++) {
    const s = document.createElement("span");
    s.textContent = "✦";
    livesEl.appendChild(s);
  }
  demo.appendChild(livesEl);
  function renderLives() {
    [...livesEl.children].forEach((s, i) => s.classList.toggle("lost", i >= lives));
  }

  // ---- HUD (only touches the page when a value changes) ----
  function setHud() {
    const t = Math.max(0, Math.ceil(timeLeft));
    if (hud.score !== score) { hudScore.textContent = "Stars " + score; hud.score = score; }
    if (hud.time !== t) { hudTime.textContent = t + "s"; hud.time = t; }
    const c = combo >= 5 ? "x" + (1 + Math.floor(combo / 5)) + " streak" : "";
    if (hud.combo !== c) { hudCombo.textContent = c; hud.combo = c; }
  }

  function collect(kind) {
    if (kind === "voidk") {
      lives--;
      invuln = INVULN;
      combo = 0;
      shake = 0.4;
      renderLives();
      const bar = hudScore.parentElement;
      bar.classList.add("hit");
      setTimeout(() => bar.classList.remove("hit"), 350);
      return;
    }
    combo++;
    score += (kind === "comet" ? 3 : 1) * (1 + Math.floor(combo / 5));
    pulse = 1;
  }

  // ---- One step of the game ----
  function update(dt) {
    elapsed += dt;
    timeLeft -= dt;
    const speed = BASE_SPEED + elapsed * SPEED_RAMP;

    if (keys.ArrowLeft || keys.a) tx -= 9 * dt;
    if (keys.ArrowRight || keys.d) tx += 9 * dt;
    if (keys.ArrowUp || keys.w) ty += 9 * dt;
    if (keys.ArrowDown || keys.s) ty -= 9 * dt;
    tx = Math.max(-boundX, Math.min(boundX, tx));
    ty = Math.max(-boundY, Math.min(boundY, ty));

    const px = player.position.x, py = player.position.y;
    const ease = Math.min(1, dt * 9);
    player.position.x += (tx - px) * ease;
    player.position.y += (ty - py) * ease;
    player.rotation.z = -(tx - player.position.x) * 0.25;
    halo.rotation.z += dt * 2;
    core.rotation.y += dt * 1.5;
    pulse = Math.max(0, pulse - dt * 4);
    invuln = Math.max(0, invuln - dt);
    const show = invuln <= 0 || Math.floor(invuln * 10) % 2 === 0; // blink while protected
    core.visible = halo.visible = show;
    core.scale.setScalar(1 + pulse * 0.5);
    playerLight.intensity = 6 + pulse * 8;

    spawnTimer -= dt;
    if (spawnTimer <= 0) {
      spawnTimer = Math.max(0.14, 0.34 - elapsed * 0.004);
      spawn(-90);
    }

    for (let i = objs.length - 1; i >= 0; i--) {
      const o = objs[i], m = o.mesh;
      const prev = m.position.z;
      m.position.z += speed * dt;
      m.rotation.x += dt * 1.2;
      m.rotation.y += dt * 1.6;
      // Check whether this object crossed the player's depth during this step
      if (prev <= 1 && m.position.z >= -1) {
        const d = Math.hypot(m.position.x - player.position.x, m.position.y - player.position.y);
        if (d < KINDS[o.kind].hit && !(o.kind === "voidk" && invuln > 0)) {
          collect(o.kind);
          scene.remove(m);
          objs.splice(i, 1);
          continue;
        }
      }
      if (m.position.z > 5) { scene.remove(m); objs.splice(i, 1); }
    }

    // Background rush
    const arr = bgGeo.attributes.position.array;
    for (let i = 0; i < BG_COUNT; i++) {
      arr[i * 3 + 2] += speed * dt * 0.6;
      if (arr[i * 3 + 2] > 8) arr[i * 3 + 2] = -160;
    }
    bgGeo.attributes.position.needsUpdate = true;
    for (const r of rings) {
      r.position.z += speed * dt;
      if (r.position.z > 6) r.position.z -= 144;
    }

    // Camera shake when you hit a void
    if (shake > 0 && !reduceMotion) {
      shake -= dt;
      camera.position.x = (Math.random() - 0.5) * shake * 1.2;
      camera.position.y = (Math.random() - 0.5) * shake * 1.2;
    } else {
      camera.position.x = camera.position.y = 0;
    }

    setHud();
    if (timeLeft <= 0 || lives <= 0) finish();
  }

  function finish() {
    state = "over";
    cancelAnimationFrame(raf);
    demo.classList.remove("playing");
    let note = "";
    if (score > best) {
      best = score;
      note = " New best!";
      try { localStorage.setItem("comet-best", best); } catch (e) {}
    }
    const why = lives <= 0 ? "Out of lives. " : "Time's up. ";
    core.visible = halo.visible = true;
    btn.textContent = why + "You collected " + score + " stars." + note + " Best: " + best + ". Play again";
    btn.hidden = false;
  }

  function frame(now) {
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    if (state === "play") update(dt);
    renderer.render(scene, camera);
    if (state === "play") raf = requestAnimationFrame(frame);
  }

  function schedule() {
    cancelAnimationFrame(raf);
    last = performance.now();
    raf = requestAnimationFrame(frame);
  }

  // Pause while scrolled out of view
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (!visible) cancelAnimationFrame(raf);
    else if (state === "play") schedule();
  }, { threshold: 0.1 }).observe(canvas);

  return {
    start() {
      for (const o of objs) scene.remove(o.mesh);
      objs = [];
      lives = LIVES; invuln = 0; renderLives();
      score = 0; combo = 0; timeLeft = DURATION; elapsed = 0; spawnTimer = 0; shake = 0; pulse = 0;
      tx = ty = 0;
      player.position.set(0, 0, 0);
      hud.score = hud.time = hud.combo = null;
      for (let i = 0; i < 14; i++) spawn(-8 - Math.random() * 80); // so there is action straight away
      state = "play";
      demo.classList.add("playing");
      setHud();
      schedule();
    }
  };
}