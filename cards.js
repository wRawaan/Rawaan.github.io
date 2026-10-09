// Concept 4: tilt + cursor light + preview parallax for .card elements.
(() => {
  const cards = [...document.querySelectorAll(".card")];
  if (!cards.length) return;
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