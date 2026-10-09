// Concept 2: a constellation that draws itself as you scroll.
// One star per section. Lines draw between stars as you read, the current star pulses,
// and every star is a link that scrolls to its section.
(() => {
  // ---- Find the sections ----
  const hero = document.querySelector(".hero");
  const sections = [...document.querySelectorAll("main > section[id]")];
  const items = [];
  if (hero) items.push({ label: "Welcome", el: hero, href: "#top" });
  for (const s of sections) {
    const h = s.querySelector("h2");
    items.push({ label: s.dataset.label || (h ? h.textContent.trim() : s.id), el: s, href: "#" + s.id });
  }
  const n = items.length;
  if (n < 2) return;

  // ---- Settings you can tweak ----
  const HEIGHT_RATIO = 0.56;                    // constellation height as a share of the window
  const OFFSETS = [8, -14, 12, -10, 6, -16, 10]; // sideways zigzag that gives it a constellation shape
  const TRIGGER = 0.4;                          // reading line, as a share of window height
  const X0 = 66, W = 96, PAD = 14;

  const NS = "http://www.w3.org/2000/svg";
  const make = (tag, attrs = {}, parent) => {
    const el = document.createElementNS(NS, tag);
    for (const k in attrs) el.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(el);
    return el;
  };

  const style = document.createElement("style");
  style.textContent = `
    .cst { position: fixed; right: 1.1rem; top: 50%; transform: translateY(-50%);
           z-index: 20; pointer-events: none; animation: cst-in 1.4s 1.2s ease-out both; }
    .cst-svg { display: block; overflow: visible; }
    .cst a { pointer-events: auto; }
    .cst-base { stroke: rgba(255,255,255,.12); stroke-width: 1; fill: none; }
    .cst-line { stroke: var(--halo); stroke-width: 1.4; stroke-linecap: round; fill: none;
                stroke-dasharray: 1; filter: drop-shadow(0 0 3px rgba(232,217,168,.7)); }
    .cst-star { fill: transparent; stroke: rgba(255,255,255,.35); stroke-width: 1;
                transition: fill .5s ease, stroke .5s ease, transform .5s ease;
                transform-box: fill-box; transform-origin: center; }
    .cst-node.on .cst-star { fill: var(--halo); stroke: var(--halo);
                             filter: drop-shadow(0 0 4px rgba(232,217,168,.8)); }
    .cst-node.cur .cst-star { transform: scale(1.35); }
    .cst-ring { fill: none; stroke: rgba(159,180,255,.55); stroke-width: 1; opacity: 0;
                transform-box: fill-box; transform-origin: center; }
    .cst-node.cur .cst-ring { animation: cst-pulse 2.4s ease-out infinite; }
    .cst-label { fill: var(--text-dim); font: 300 11px var(--sans); letter-spacing: .06em;
                 opacity: 0; transition: opacity .35s ease, fill .35s ease; }
    .cst-node.cur .cst-label { opacity: .9; fill: var(--halo); }
    .cst a:hover .cst-label, .cst a:focus-visible .cst-label { opacity: 1; fill: var(--star); }
    .cst-tip { fill: #fff; filter: drop-shadow(0 0 4px #e8d9a8) drop-shadow(0 0 9px rgba(232,217,168,.8)); }
    @keyframes cst-pulse { from { transform: scale(.6); opacity: .9; } to { transform: scale(1.8); opacity: 0; } }
    @keyframes cst-in { from { opacity: 0; } }
    @media (max-width: 1199px) { .cst { display: none; } }
    @media (prefers-reduced-motion: reduce) {
      .cst, .cst * { animation: none !important; transition: none !important; }
    }
  `;
  document.head.appendChild(style);

  // ---- Build the SVG ----
  const nav = document.createElement("nav");
  nav.className = "cst";
  nav.setAttribute("aria-label", "Page sections");
  const svg = make("svg", { class: "cst-svg", width: W }, nav);

  const bases = [], lines = [];
  for (let i = 0; i < n - 1; i++) bases.push(make("line", { class: "cst-base" }, svg));
  for (let i = 0; i < n - 1; i++) lines.push(make("line", { class: "cst-line", pathLength: 1 }, svg));

  const nodes = items.map((it) => {
    const g = make("g", { class: "cst-node" }, svg);
    const a = make("a", { href: it.href, "aria-label": "Go to " + it.label }, g);
    make("circle", { r: 15, fill: "rgba(0,0,0,0.001)" }, a);                       // generous click target
    make("circle", { class: "cst-ring", r: 8 }, a);
    make("path", { class: "cst-star", d: "M0,-6.5 L3.8,0 L0,6.5 L-3.8,0 Z" }, a);  // diamond star
    const t = make("text", { class: "cst-label", x: -16, y: 4, "text-anchor": "end" }, a);
    t.textContent = it.label;
    return g;
  });
  const tip = make("circle", { class: "cst-tip", r: 2.4 }, svg);                   // glowing pen-tip
  document.body.appendChild(nav);

  // ---- Layout and measurement ----
  let pts = [], tops = [];

  function layout() {
    const H = Math.round(innerHeight * HEIGHT_RATIO);
    svg.setAttribute("height", H);
    pts = items.map((_, i) => ({
      x: X0 + OFFSETS[i % OFFSETS.length],
      y: PAD + (i * (H - PAD * 2)) / (n - 1)
    }));
    for (let i = 0; i < n - 1; i++) {
      for (const el of [bases[i], lines[i]]) {
        el.setAttribute("x1", pts[i].x); el.setAttribute("y1", pts[i].y);
        el.setAttribute("x2", pts[i + 1].x); el.setAttribute("y2", pts[i + 1].y);
      }
    }
    nodes.forEach((g, i) => g.setAttribute("transform", `translate(${pts[i].x} ${pts[i].y})`));
  }

  function measure() {
    tops = items.map((it) => it.el.getBoundingClientRect().top + scrollY);
  }

  // ---- Scroll progress, in "star units" (0 = first star, n-1 = last) ----
  function progress() {
    const doc = document.documentElement;
    if (scrollY + innerHeight >= doc.scrollHeight - 4) return n - 1; // bottom of the page
    const y = scrollY + innerHeight * TRIGGER;
    let i = 0;
    for (let k = 0; k < n; k++) if (tops[k] <= y) i = k;
    if (i >= n - 1) return n - 1;
    const span = tops[i + 1] - tops[i];
    return span > 0 ? i + Math.max(0, Math.min(1, (y - tops[i]) / span)) : i;
  }

  function update() {
    const p = progress();
    const cur = Math.round(p);
    for (let i = 0; i < n - 1; i++) {
      const amt = Math.max(0, Math.min(1, p - i));
      lines[i].style.strokeDashoffset = (1 - amt).toFixed(4);
    }
    nodes.forEach((g, i) => {
      g.classList.toggle("on", p >= i - 0.02);
      g.classList.toggle("cur", i === cur);
    });
    const seg = Math.min(Math.floor(p), n - 2);
    const f = Math.max(0, Math.min(1, p - seg));
    tip.setAttribute("cx", pts[seg].x + (pts[seg + 1].x - pts[seg].x) * f);
    tip.setAttribute("cy", pts[seg].y + (pts[seg + 1].y - pts[seg].y) * f);
  }

  let ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => { update(); ticking = false; });
  }

  function refresh() { layout(); measure(); update(); }

  addEventListener("scroll", onScroll, { passive: true });
  addEventListener("resize", refresh);
  new ResizeObserver(() => { measure(); update(); }).observe(document.body); // page height changes
  document.fonts.ready.then(refresh);
  refresh();
})();