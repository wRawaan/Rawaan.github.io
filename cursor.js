// Concept 1: shimmering diamond + dot cursor trail, and magnetic buttons.
// Only runs for mouse/trackpad users who haven't asked for reduced motion.
(() => {
  if (!matchMedia("(pointer: fine)").matches) return;
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  // ---- Settings you can tweak ----
  const MAX_PARTICLES = 180;
  const DIAMOND_CHANCE = 0.45;  // share of particles that are diamonds (rest are dots)
  const MAGNET_SELECTOR = ".btn, .nav nav a, .links a, [data-magnetic]";
  const MAGNET_RANGE = 70;
  const MAGNET_STRENGTH = 0.3;
  const COLORS = ["#f4f1ea", "#e8d9a8", "#9fb4ff", "#ffffff"]; // pearl, gold, blue, white

  // ---- Canvas overlay (never blocks clicks) ----
  const cv = document.createElement("canvas");
  cv.setAttribute("aria-hidden", "true");
  Object.assign(cv.style, {
    position: "fixed", inset: "0", width: "100%", height: "100%",
    pointerEvents: "none", zIndex: "50"
  });
  document.body.appendChild(cv);
  const ctx = cv.getContext("2d");
  let dpr = 1;

  function resize() {
    dpr = Math.min(devicePixelRatio || 1, 2);
    cv.width = innerWidth * dpr;
    cv.height = innerHeight * dpr;
  }
  addEventListener("resize", resize);
  resize();

  // Soft halo sprite, drawn faintly behind each shape for the shimmer
  const halo = document.createElement("canvas");
  halo.width = halo.height = 64;
  {
    const c = halo.getContext("2d");
    const g = c.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, "rgba(255,255,255,0.9)");
    g.addColorStop(0.35, "rgba(255,255,255,0.25)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    c.fillStyle = g;
    c.fillRect(0, 0, 64, 64);
  }

  // ---- Particles ----
  const particles = [];
  function spawn(x, y, burst) {
    if (particles.length >= MAX_PARTICLES) particles.shift();
    const diamond = Math.random() < DIAMOND_CHANCE;
    const speed = burst ? 50 + Math.random() * 110 : 26;
    const angle = Math.random() * Math.PI * 2;
    particles.push({
      x: x + (Math.random() - 0.5) * 6,
      y: y + (Math.random() - 0.5) * 6,
      vx: burst ? Math.cos(angle) * speed : (Math.random() - 0.5) * speed,
      vy: burst ? Math.sin(angle) * speed : 8 + Math.random() * 28,
      diamond,
      size: diamond ? 3 + Math.random() * 4.5 : 1.1 + Math.random() * 1.8,
      rot: Math.random() * Math.PI,
      spin: (Math.random() - 0.5) * 3,
      color: COLORS[(Math.random() * COLORS.length) | 0],
      tw: Math.random() * 6.28,
      twSpeed: 10 + Math.random() * 14,  // twinkle rate
      age: 0,
      life: 1,
      decay: 0.75 + Math.random() * 0.7
    });
  }

  // ---- Magnetic elements ----
  const magnets = [...document.querySelectorAll(MAGNET_SELECTOR)].map((el) => {
    el.style.willChange = "transform";
    return { el, x: 0, y: 0, tx: 0, ty: 0 };
  });

  function updateMagnetTargets(mx, my) {
    for (const m of magnets) {
      const r = m.el.getBoundingClientRect();
      const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      const dx = mx - cx, dy = my - cy;
      const reach = Math.max(r.width, r.height) / 2 + MAGNET_RANGE;
      if (Math.hypot(dx, dy) < reach) {
        m.tx = Math.max(-14, Math.min(14, dx * MAGNET_STRENGTH));
        m.ty = Math.max(-14, Math.min(14, dy * MAGNET_STRENGTH));
      } else {
        m.tx = m.ty = 0;
      }
    }
  }
  function resetMagnets() { for (const m of magnets) m.tx = m.ty = 0; }

  // ---- Input ----
  let lx = null, ly = null;
  addEventListener("pointermove", (e) => {
    if (e.pointerType === "touch") return;
    if (lx !== null) {
      const dist = Math.hypot(e.clientX - lx, e.clientY - ly);
      const steps = Math.min(5, Math.ceil(dist / 10));
      for (let i = 1; i <= steps; i++) {
        spawn(lx + ((e.clientX - lx) * i) / steps, ly + ((e.clientY - ly) * i) / steps, false);
      }
    }
    lx = e.clientX; ly = e.clientY;
    updateMagnetTargets(lx, ly);
    start();
  });
  addEventListener("pointerdown", (e) => {
    if (e.pointerType === "touch") return;
    for (let i = 0; i < 18; i++) spawn(e.clientX, e.clientY, true);
    start();
  });
  document.documentElement.addEventListener("mouseleave", () => { lx = ly = null; resetMagnets(); start(); });

  // ---- Drawing ----
  function drawDiamond(s) {
    ctx.beginPath();
    ctx.moveTo(0, -s);
    ctx.lineTo(s * 0.62, 0);
    ctx.lineTo(0, s);
    ctx.lineTo(-s * 0.62, 0);
    ctx.closePath();
    ctx.fill();
  }

  function drawParticle(p) {
    // Twinkle: brightness and size pulse quickly, on top of the slow fade-out
    const tw = 0.5 + 0.5 * Math.sin(p.age * p.twSpeed + p.tw);
    const fade = Math.max(0, p.life);
    const alpha = fade * (0.35 + 0.65 * tw);
    const s = p.size * (0.4 + 0.6 * fade) * (0.8 + 0.4 * tw);
    const cos = Math.cos(p.rot), sin = Math.sin(p.rot);

    ctx.setTransform(dpr * cos, dpr * sin, -dpr * sin, dpr * cos, p.x * dpr, p.y * dpr);

    // Halo
    ctx.globalAlpha = alpha * 0.4;
    ctx.drawImage(halo, -s * 2.4, -s * 2.4, s * 4.8, s * 4.8);

    ctx.globalAlpha = alpha;
    ctx.fillStyle = p.color;
    if (p.diamond) {
      drawDiamond(s);
      // Bright glint in the centre
      ctx.fillStyle = "#ffffff";
      ctx.globalAlpha = alpha * tw;
      drawDiamond(s * 0.45);
    } else {
      ctx.beginPath();
      ctx.arc(0, 0, s, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // ---- Loop: only runs while something is moving ----
  let running = false, last = 0;
  function start() {
    if (running) return;
    running = true;
    last = performance.now();
    requestAnimationFrame(loop);
  }

  function loop(now) {
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx * dt; p.y += p.vy * dt;
      p.vx *= 0.97; p.vy *= 0.99;
      p.rot += p.spin * dt;
      p.age += dt;
      p.life -= p.decay * dt;
      if (p.life <= 0) particles.splice(i, 1);
    }

    let magnetsMoving = false;
    for (const m of magnets) {
      m.x += (m.tx - m.x) * 0.16;
      m.y += (m.ty - m.y) * 0.16;
      const settled = Math.abs(m.x - m.tx) < 0.05 && Math.abs(m.y - m.ty) < 0.05;
      if (settled) { m.x = m.tx; m.y = m.ty; } else { magnetsMoving = true; }
      m.el.style.transform = m.x || m.y ? `translate3d(${m.x.toFixed(2)}px, ${m.y.toFixed(2)}px, 0)` : "";
    }

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, cv.width, cv.height);
    ctx.globalCompositeOperation = "lighter";
    for (const p of particles) drawParticle(p);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;

    if (particles.length || magnetsMoving) requestAnimationFrame(loop);
    else running = false;
  }
})();