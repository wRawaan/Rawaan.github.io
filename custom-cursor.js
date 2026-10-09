// Custom cursor: a bright star core that tracks exactly, inside a gold halo ring that glides behind.
// Only for mouse/trackpad users. Touch devices keep their normal behaviour.
(() => {
  if (!matchMedia("(pointer: fine)").matches) return;
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---- Settings tweak ----
  const FOLLOW = reduceMotion ? 1 : 0.18; // 1 = ring sticks to the core, lower = floatier
  const HOVER_SCALE = 1.25;               // ring size over links and buttons
  const PRESS_SCALE = 0.7;                // ring size while clicking
  const INTERACTIVE = "a, button, [role='button'], summary, [data-magnetic]";

  const style = document.createElement("style");
  style.textContent = `
    html.cc-on, html.cc-on a, html.cc-on button, html.cc-on [data-magnetic] { cursor: none; }
    html.cc-on input, html.cc-on textarea, html.cc-on select { cursor: text; }
    .cc { position: fixed; left: 0; top: 0; pointer-events: none; z-index: 60;
          opacity: 0; transition: opacity .3s ease; will-change: transform; }
    .cc.show { opacity: 1; }
    .cc.show.hide { opacity: 0; }
    .cc-core { width: 8px; height: 8px; border-radius: 50%; background: #f4f1ea;
               box-shadow: 0 0 10px 2px rgba(232,217,168,.8), 0 0 24px 6px rgba(159,180,255,.35); }
    .cc-ring { width: 28px; height: 28px; border-radius: 50%;
               border: 1px solid rgba(232,217,168,.7);
               box-shadow: 0 0 18px rgba(232,217,168,.25), inset 0 0 12px rgba(232,217,168,.12);
               transition: opacity .3s ease, background .3s ease, border-color .3s ease; }
    .cc-ring.hover { background: rgba(232,217,168,.1); border-color: #e8d9a8; }
  `;
  document.head.appendChild(style);

  const ring = document.createElement("div");
  ring.className = "cc cc-ring";
  const core = document.createElement("div");
  core.className = "cc cc-core";
  for (const el of [ring, core]) { el.setAttribute("aria-hidden", "true"); document.body.appendChild(el); }
  document.documentElement.classList.add("cc-on");

  let mx = -100, my = -100, rx = -100, ry = -100;
  let ringScale = 1, ringTarget = 1, coreScale = 1, coreTarget = 1;
  let pressed = false, hovering = false, first = true;

  function setTargets() {
    ringTarget = pressed ? PRESS_SCALE : hovering ? HOVER_SCALE : 1;
    coreTarget = pressed ? 1.5 : hovering ? 0.55 : 1;
  }

  addEventListener("pointermove", (e) => {
    if (e.pointerType === "touch") return;
    mx = e.clientX; my = e.clientY;
    if (first) { rx = mx; ry = my; first = false; }

    const t = e.target;
    hovering = !!(t.closest && t.closest(INTERACTIVE));
    const overGame = !!(t.closest && t.closest("#game-canvas")); // the game has its own halo
    const overField = !!(t.closest && t.closest("input, textarea, select"));
    ring.classList.toggle("hover", hovering);
    ring.classList.toggle("hide", overGame || overField);
    core.classList.toggle("hide", overField);
    ring.classList.add("show");
    core.classList.add("show");
    setTargets();
    start();
  });

  addEventListener("pointerdown", (e) => { if (e.pointerType !== "touch") { pressed = true; setTargets(); start(); } });
  addEventListener("pointerup", () => { pressed = false; setTargets(); start(); });
  document.documentElement.addEventListener("mouseleave", () => {
    ring.classList.remove("show"); core.classList.remove("show");
  });

  let running = false;
  function start() { if (!running) { running = true; requestAnimationFrame(loop); } }

  function loop() {
    rx += (mx - rx) * FOLLOW;
    ry += (my - ry) * FOLLOW;
    ringScale += (ringTarget - ringScale) * 0.2;
    coreScale += (coreTarget - coreScale) * 0.25;

    ring.style.transform = `translate3d(${rx}px, ${ry}px, 0) translate(-50%, -50%) scale(${ringScale})`;
    core.style.transform = `translate3d(${mx}px, ${my}px, 0) translate(-50%, -50%) scale(${coreScale})`;

    const settled =
      Math.abs(mx - rx) < 0.1 && Math.abs(my - ry) < 0.1 &&
      Math.abs(ringTarget - ringScale) < 0.005 && Math.abs(coreTarget - coreScale) < 0.005;
    if (settled) running = false; else requestAnimationFrame(loop);
  }
})();