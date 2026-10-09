// Concept 3: kinetic typography.
// Add data-kinetic to any heading. Letters gain weight, glow gold and lift as the cursor nears them,
// and a soft wave sweeps through the text once on load.
(() => {
  const els = [...document.querySelectorAll("[data-kinetic]")];
  if (!els.length) return;
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return; // leave the text static

  // ---- Settings you can tweak ----
  const MIN_WEIGHT = 300;      // resting weight
  const WEIGHT_GAIN = 300;     // extra weight at full effect (300 + 300 = 600)
  const LIFT_PX = 5;           // how far letters rise
  const REACH = 1.4;           // glow radius, as a multiple of the font size
  const SMOOTHING = 0.16;      // lower = softer, slower response
  const INTRO_DELAY = 900;     // ms before the intro wave (lets the page fade in first)

  const style = document.createElement("style");
  style.textContent = `
    .kw { display: inline-block; white-space: nowrap; }
    .kc {
      display: inline-flex; justify-content: center;
      font-weight: calc(${MIN_WEIGHT} + var(--i, 0) * ${WEIGHT_GAIN});
      color: color-mix(in srgb, var(--halo) calc(var(--i, 0) * 100%), var(--star));
      text-shadow: 0 0 calc(18px + var(--i, 0) * 30px) rgba(232, 217, 168, calc(0.3 + var(--i, 0) * 0.55));
      transform: translateY(calc(var(--i, 0) * -${LIFT_PX}px));
    }
  `;
  document.head.appendChild(style);

  // ---- Split text into letters (words stay together so wrapping still works) ----
  const letters = [];
  for (const el of els) {
    const text = el.textContent.trim();
    el.setAttribute("aria-label", text); // screen readers read the heading, not single letters
    el.textContent = "";
    const words = text.split(/\s+/);
    words.forEach((word, wi) => {
      const kw = document.createElement("span");
      kw.className = "kw";
      for (const ch of word) {
        const kc = document.createElement("span");
        kc.className = "kc";
        kc.textContent = ch;
        kc.setAttribute("aria-hidden", "true");
        kw.appendChild(kc);
        letters.push({ el: kc, cur: 0, cx: 0, cy: 0, reach: 160, order: letters.length });
      }
      el.appendChild(kw);
      if (wi < words.length - 1) el.appendChild(document.createTextNode(" "));
    });
  }

  // Lock each letter to its resting width so growing bolder doesn't push neighbours around
  function measure() {
    for (const l of letters) l.el.style.width = "";
    for (const l of letters) {
      l.w = l.el.getBoundingClientRect().width;
      const size = parseFloat(getComputedStyle(l.el).fontSize) || 64;
      l.reach = Math.max(110, Math.min(240, size * REACH));
    }
    for (const l of letters) l.el.style.width = l.w + "px";
  }

  // ---- Pointer ----
  let px = -9999, py = -9999, active = false;
  function point(e) { px = e.clientX; py = e.clientY; active = true; start(); }
  addEventListener("pointermove", point);
  addEventListener("pointerdown", point);
  addEventListener("pointerup", (e) => { if (e.pointerType === "touch") { active = false; start(); } });
  addEventListener("pointercancel", () => { active = false; start(); });
  document.documentElement.addEventListener("mouseleave", () => { active = false; start(); });
  addEventListener("scroll", () => start(), { passive: true });

  let resizeTimer;
  addEventListener("resize", () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(() => { measure(); start(); }, 150); });

  // ---- Intro wave ----
  let introStart = 0;
  const INTRO_STEP = 70, INTRO_LEN = 750; // ms between letters, ms per bump

  function introValue(l, now) {
    if (!introStart) return 0;
    const t = now - introStart - l.order * INTRO_STEP;
    if (t < 0 || t > INTRO_LEN) return 0;
    return 0.85 * Math.sin((Math.PI * t) / INTRO_LEN);
  }
  function introRunning(now) {
    return introStart && now - introStart < letters.length * INTRO_STEP + INTRO_LEN;
  }

  // ---- Loop (runs only while letters are changing) ----
  let running = false, ready = false;
  function start() { if (ready && !running) { running = true; requestAnimationFrame(loop); } }

  function loop(now) {
    // Read all positions first, then write, to avoid layout thrashing
    for (const l of letters) {
      const r = l.el.getBoundingClientRect();
      l.cx = r.left + r.width / 2;
      l.cy = r.top + r.height / 2;
      l.offscreen = r.bottom < 0 || r.top > innerHeight;
    }

    let busy = introRunning(now);
    for (const l of letters) {
      let target = 0;
      if (!l.offscreen) {
        if (active) {
          const t = Math.max(0, 1 - Math.hypot(px - l.cx, py - l.cy) / l.reach);
          target = t * t * (3 - 2 * t); // smoothstep
        }
        target = Math.max(target, introValue(l, now));
      }
      l.cur += (target - l.cur) * SMOOTHING;
      if (Math.abs(target - l.cur) < 0.003) l.cur = target; else busy = true;
      l.el.style.setProperty("--i", l.cur.toFixed(3));
    }

    if (busy) requestAnimationFrame(loop); else running = false;
  }

  document.fonts.ready.then(() => {
    measure();
    ready = true;
    setTimeout(() => { introStart = performance.now(); start(); }, INTRO_DELAY);
  });
})();