// Concept 4: tilt + cursor light + preview parallax for .card elements.
(() => {
  const cards = [...document.querySelectorAll(".card")];
  if (!cards.length) return;
  // ---- Product videos: play on hover (or focus), pause on leave ----
  // Videos load lazily: data-src is only turned into src when a card is near the screen.
  const videos = [...document.querySelectorAll(".card video")];
  if (videos.length) {
    const canHover = matchMedia("(hover: hover) and (pointer: fine)").matches;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

    const load = (v) => {
      if (!v.getAttribute("src") && v.dataset.src) { v.preload = "auto"; v.src = v.dataset.src; }
    };
    const play = (v) => { load(v); const p = v.play(); if (p && p.catch) p.catch(() => {}); };
    // load() resets the video, which brings the poster image back
    const stop = (v) => { v.pause(); if (v.getAttribute("src")) v.load(); };

    const near = new IntersectionObserver((entries) => {
      for (const e of entries) if (e.isIntersecting) { load(e.target); near.unobserve(e.target); }
    }, { rootMargin: "400px" });
    videos.forEach((v) => near.observe(v));

    if (canHover) {
      for (const card of document.querySelectorAll(".card")) {
        const v = card.querySelector("video");
        if (!v) continue;
        card.addEventListener("pointerenter", (e) => { if (e.pointerType === "mouse") play(v); });
        card.addEventListener("pointerleave", () => stop(v));
        card.addEventListener("focusin", () => play(v));
        card.addEventListener("focusout", () => stop(v));
      }
    } else if (!reduce) {
      // Touch screens can't hover, so play whichever card is mostly in view
      const io = new IntersectionObserver((entries) => {
        for (const e of entries) e.isIntersecting ? play(e.target) : stop(e.target);
      }, { threshold: 0.6 });
      videos.forEach((v) => io.observe(v));
    }
  }

  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  if (!matchMedia("(hover: hover) and (pointer: fine)").matches) return;

  // ---- Settings you can tweak ----
  const MAX_TILT = 7;    // degrees of tilt at the card edges
  const PARALLAX = 10;   // px the preview drifts against the tilt

  for (const card of cards) {
    let frame = 0, ev = null;

    function apply() {
      frame = 0;
      const r = card.getBoundingClientRect();
      const x = (ev.clientX - r.left) / r.width;
      const y = (ev.clientY - r.top) / r.height;
      card.style.setProperty("--ry", ((x - 0.5) * 2 * MAX_TILT).toFixed(2) + "deg");
      card.style.setProperty("--rx", ((0.5 - y) * 2 * MAX_TILT).toFixed(2) + "deg");
      card.style.setProperty("--mx", (x * 100).toFixed(1) + "%");
      card.style.setProperty("--my", (y * 100).toFixed(1) + "%");
      card.style.setProperty("--px", (-(x - 0.5) * 2 * PARALLAX).toFixed(1) + "px");
      card.style.setProperty("--py", (-(y - 0.5) * 2 * PARALLAX).toFixed(1) + "px");
    }

    card.addEventListener("pointerenter", (e) => {
      if (e.pointerType !== "mouse") return;
      card.classList.add("tracking");
    });
    card.addEventListener("pointermove", (e) => {
      if (e.pointerType !== "mouse") return;
      ev = e;
      if (!frame) frame = requestAnimationFrame(apply);
    });
    card.addEventListener("pointerleave", () => {
      cancelAnimationFrame(frame); frame = 0;
      card.classList.remove("tracking");
      for (const v of ["--rx", "--ry", "--mx", "--my", "--px", "--py"]) card.style.removeProperty(v);
    });
  }
})();
