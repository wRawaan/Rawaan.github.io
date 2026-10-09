const canvas = document.getElementById("stars");
const ctx = canvas.getContext("2d");
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
let stars = [];
let mouseX = 0, mouseY = 0;

function init() {
  canvas.width = innerWidth;
  canvas.height = innerHeight;
  const count = innerWidth < 600 ? 90 : 170;
  stars = Array.from({ length: count }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    r: Math.random() * 1.2 + 0.2,
    phase: Math.random() * Math.PI * 2,
    speed: Math.random() * 0.02 + 0.005,
    depth: Math.random() * 0.8 + 0.2, // larger depth = moves more with the mouse
    gold: Math.random() < 0.12
  }));
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (const s of stars) {
    s.phase += s.speed;
    const alpha = reduceMotion ? 0.7 : 0.35 + 0.65 * Math.abs(Math.sin(s.phase));
    const x = s.x + mouseX * s.depth * 14;
    const y = s.y + mouseY * s.depth * 14;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = s.gold ? "#e8d9a8" : "#f4f1ea";
    ctx.shadowBlur = s.r > 1 ? 8 : 0;
    ctx.shadowColor = "#e8d9a8";
    ctx.beginPath();
    ctx.arc(x, y, s.r, 0, Math.PI * 2);
    ctx.fill();
  }
  if (!reduceMotion) requestAnimationFrame(draw);
}

addEventListener("resize", () => { init(); if (reduceMotion) draw(); });
addEventListener("mousemove", (e) => {
  mouseX = e.clientX / innerWidth - 0.5;
  mouseY = e.clientY / innerHeight - 0.5;
});

document.getElementById("year").textContent = new Date().getFullYear();
init();
draw();