// Fades items in as they scroll into view. Skipped entirely for reduced motion.
(() => {
  const items = [...document.querySelectorAll(".reveal")];
  if (!items.length || !("IntersectionObserver" in window)) return;
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  document.documentElement.classList.add("js");
  for (const el of items) el.style.setProperty("--d", [...el.parentElement.children].indexOf(el) % 5);

  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
    }
  }, { threshold: 0.15, rootMargin: "0px 0px -6% 0px" });
  items.forEach((el) => io.observe(el));
})();