// Custom cursor: a jewelled gold quill with a soft, downy feather. The nib (top-left) is the pointer, so aim with the nib.
// The feather flows and waves against the direction you move, then settles. It also twinkles
// and shows a small ring over links and buttons.
// Only for mouse/trackpad users. Touch devices keep their normal behaviour.
(() => {
  if (!matchMedia("(pointer: fine)").matches) return;
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---- Settings you can tweak ----
  const FLOW = reduceMotion ? 0 : 0.00045; // how much the feather bends per px/s of cursor speed (0 = stays still)
  const MAX_BEND = 0.2;                  // largest bend at each joint, in radians (about 11 degrees)
  const SPRING = [220, 170, 130, 100, 80]; // stiffness of each joint, from the handle to the tip (lower = floppier)
  const WAVE = 0.12;                     // 0 = swings back and forth for a long time, 1 = no bounce at all
  const HOVER_SCALE = 1.12;              // wand size over links and buttons
  const PRESS_SCALE = 0.9;               // wand size while clicking
  const SIZE = 64;                       // wand size in px (try 52 for smaller, 76 for bigger)
  const TIP = SIZE * 0.06;               // where the tip sits inside the image
  const INTERACTIVE = "a, button, [role='button'], summary, [data-magnetic]";

  const style = document.createElement("style");
  style.textContent = `
    html.cc-on, html.cc-on a, html.cc-on button, html.cc-on [data-magnetic] { cursor: none; }
    html.cc-on input, html.cc-on textarea, html.cc-on select { cursor: text; }
    .cc-wand { position: fixed; left: 0; top: 0; width: ${SIZE}px; height: ${SIZE}px; pointer-events: none;
               z-index: 60; opacity: 0; transition: opacity .3s ease; will-change: transform;
               transform-origin: ${TIP}px ${TIP}px; filter: drop-shadow(0 0 4px rgba(159,180,255,.45)) drop-shadow(0 0 7px rgba(232,217,168,.25)); }
    .cc-wand.show { opacity: 1; }
    .cc-wand.show.hide { opacity: 0; }
    .cc-wand-svg { position: absolute; inset: 0; width: 100%; height: 100%; display: block; overflow: visible; }
    .cc-glow { position: absolute; left: ${TIP - 12}px; top: ${TIP - 12}px; width: 24px; height: 24px; border-radius: 50%;
               background: radial-gradient(circle, #fff 0%, rgba(232,217,168,.7) 22%, rgba(159,180,255,.2) 52%, transparent 70%);
               animation: cc-pulse 2.4s ease-in-out infinite; }
    .cc-ring { position: absolute; left: ${TIP - 16}px; top: ${TIP - 16}px; width: 32px; height: 32px; border-radius: 50%;
               border: 1px solid rgba(232,217,168,.95); box-shadow: 0 0 16px rgba(63,86,176,.6);
               opacity: 0; transform: scale(.5); transition: opacity .3s ease, transform .35s cubic-bezier(.2,.8,.2,1); }
    .cc-wand.on .cc-ring { opacity: 1; transform: scale(1); }
    .cc-sp { transform-box: fill-box; transform-origin: center; animation: cc-tw 2.2s ease-in-out infinite; }
    .cc-sp.s2 { animation-delay: .7s; }
    .cc-sp.s3 { animation-delay: 1.3s; }
    @keyframes cc-tw { 0%, 100% { opacity: .25; transform: scale(.6); } 50% { opacity: 1; transform: scale(1); } }
    @keyframes cc-pulse { 0%, 100% { opacity: .75; transform: scale(.85); } 50% { opacity: 1; transform: scale(1.1); } }
    @media (prefers-reduced-motion: reduce) { .cc-wand *, .cc-wand { animation: none !important; } }
  `;
  document.head.appendChild(style);

  const wand = document.createElement("div");
  wand.className = "cc-wand";
  wand.setAttribute("aria-hidden", "true");
  wand.innerHTML = `<div class="cc-ring"></div><div class="cc-glow"></div>
<svg class="cc-wand-svg" viewBox="0 0 100 100" width="64" height="64" aria-hidden="true">
  <defs>
    <linearGradient id="ccVane" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset=".6" stop-color="#eef2ff"/><stop offset="1" stop-color="#b9c7ff"/></linearGradient>
    <linearGradient id="ccGold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff3c4"/><stop offset=".5" stop-color="#e8d9a8"/><stop offset="1" stop-color="#b8913f"/></linearGradient>
    <radialGradient id="ccGem" cx=".35" cy=".3"><stop offset="0" stop-color="#ffffff"/><stop offset=".6" stop-color="#dfe6ff"/><stop offset="1" stop-color="#9fb4ff"/></radialGradient>
  </defs>
  <g fill="none" stroke="#f4f7ff" stroke-linecap="round"><g class="cc-bone" data-jx="22.05" data-jy="16.11" data-px="-0.59" data-py="0.81" transform="rotate(0 22.05 16.11)"><path d="M31 23.12 L32.32 22.66 L33.33 22.57 L34.27 22.58 L35.18 22.65 L36.06 22.75 L36.92 22.89 L37.76 23.05 L38.59 23.24 L39.41 23.45 L40.22 23.68 L33.8 30.99 L33.43 30.3 L33.07 29.61 L32.71 28.9 L32.37 28.19 L32.04 27.46 L31.73 26.71 L31.44 25.94 L31.18 25.13 L30.98 24.26 L31 23.12 Z" fill="url(#ccVane)" fill-opacity=".14" stroke="none"/><path d="M36.32 27.65 C40.39 26.36 45.03 25.56 46.49 29.74" stroke-width="0.55" opacity="0.45"/><path d="M26.31 19.35 C28.11 28.96 25.47 35.12 30.81 39.41" stroke-width="0.38" opacity="0.63"/><path d="M31.19 23.27 C41.06 22.03 46.05 16.74 48.18 24.72" stroke-width="0.63" opacity="0.64"/><path d="M33.72 25.4 C41.55 22.7 55.03 24.82 55.99 30.19" stroke-width="0.63" opacity="0.72"/><path d="M36.41 27.73 C46.54 26.78 54.73 24.12 53.13 29.13" stroke-width="0.60" opacity="0.56"/><path d="M24.6 18.02 C28.66 16.64 32.16 14.83 34.94 20.08" stroke-width="0.64" opacity="0.59"/><path d="M34.12 25.75 C34.72 30.3 34.59 34.24 36.52 34.55" stroke-width="0.40" opacity="0.67"/><path d="M31.27 23.34 C30.24 29.51 33.89 39.56 31.03 39.13" stroke-width="0.41" opacity="0.58"/><path d="M27.83 20.54 C26.63 27.61 25.71 34.91 29.72 36.68" stroke-width="0.61" opacity="0.63"/><path d="M26.46 19.46 C29.94 18.15 33.76 17.1 37.91 18.17" stroke-width="0.41" opacity="0.63"/><path d="M24.81 18.18 C28.37 16.29 33.85 15.86 34.31 20.45" stroke-width="0.65" opacity="0.63"/><path d="M28.05 20.72 C29.79 26.99 27.04 29.68 30.21 31.76" stroke-width="0.49" opacity="0.70"/><path d="M31 23.12 Q32.95 22.4 35.76 22.83" stroke-width="0.82" opacity="0.67"/><path d="M31 23.12 Q29.96 24.32 31.11 26.97" stroke-width="0.48" opacity="0.99"/><path d="M32.39 24.28 Q35.43 22.66 40.28 23.33" stroke-width="0.67" opacity="0.86"/><path d="M32.39 24.28 Q31.64 26.62 32.97 30.17" stroke-width="0.64" opacity="0.95"/><path d="M33.79 25.46 Q36.63 23.38 42.17 24.43" stroke-width="0.75" opacity="0.94"/><path d="M33.79 25.46 Q33.39 28.49 33.64 31.46" stroke-width="0.50" opacity="0.81"/><path d="M35.19 26.66 Q38.6 24.12 44.64 24.85" stroke-width="0.70" opacity="0.92"/><path d="M35.19 26.66 Q34.77 29.99 35.55 33.69" stroke-width="0.56" opacity="0.86"/><path d="M22.05 16.11 L23.87 17.47 L25.71 18.88 L27.57 20.34 L29.45 21.85 L31.35 23.4 L33.26 25.01 L35.18 26.66 L37.11 28.35" stroke="#e8d9a8" stroke-width="1.2"/><g class="cc-bone" data-jx="36.55" data-jy="27.86" data-px="-0.66" data-py="0.75" transform="rotate(0 36.55 27.86)"><path d="M40.22 23.68 L42.34 24.37 L44.41 25.17 L46.43 26.07 L48.41 27.05 L50.35 28.11 L52.25 29.25 L54.11 30.45 L55.93 31.73 L57.71 33.07 L59.46 34.47 L45.77 47.92 L44.44 46.3 L43.13 44.67 L41.85 43.02 L40.6 41.36 L39.37 39.69 L38.18 38 L37.03 36.29 L35.91 34.55 L34.83 32.79 L33.8 30.99 Z" fill="url(#ccVane)" fill-opacity=".14" stroke="none"/><path d="M47.02 37.56 C47.83 47.47 45.31 54.13 48.17 53.62" stroke-width="0.62" opacity="0.67"/><path d="M37.02 28.26 C36.67 35.76 34.36 41.53 39.83 43.65" stroke-width="0.63" opacity="0.73"/><path d="M50.4 40.9 C57.17 40.58 64.81 41.14 63.84 46.35" stroke-width="0.40" opacity="0.66"/><path d="M46.73 37.28 C51.62 37.34 57.18 38.07 57.45 38.66" stroke-width="0.53" opacity="0.49"/><path d="M38.29 29.39 C49.93 29.71 57.19 26.1 60.96 34.42" stroke-width="0.46" opacity="0.69"/><path d="M49.72 40.22 C55 40.83 57.2 38.37 60.26 42.69" stroke-width="0.57" opacity="0.46"/><path d="M38.25 29.36 C47.42 29.18 54.62 27.23 54.14 29.28" stroke-width="0.65" opacity="0.52"/><path d="M39.39 30.38 C45.08 27.86 56.55 30.57 55.98 33.38" stroke-width="0.49" opacity="0.49"/><path d="M49.42 39.92 C57.17 38.96 67.52 40.58 65.41 41.59" stroke-width="0.64" opacity="0.52"/><path d="M38.99 30.03 C44.38 29.85 47.49 27.62 51.4 32.19" stroke-width="0.44" opacity="0.60"/><path d="M43.28 33.97 C53.96 34.43 58.11 28.73 66.19 39.9" stroke-width="0.56" opacity="0.48"/><path d="M42.74 33.47 C42.84 43.56 39.34 50.27 48.15 57.98" stroke-width="0.57" opacity="0.65"/><path d="M37.62 28.8 C45.76 27.81 52.43 25.51 54.86 32.31" stroke-width="0.53" opacity="0.49"/><path d="M39.83 30.78 C47.69 28.62 59.92 30.42 59.8 28.56" stroke-width="0.46" opacity="0.63"/><path d="M36.6 27.89 Q40.99 25.64 47.5 26.36" stroke-width="0.73" opacity="0.76"/><path d="M36.6 27.89 Q35.76 31.48 37.38 36.44" stroke-width="0.60" opacity="1.00"/><path d="M38.01 29.14 Q42.71 26.25 50.23 27.17" stroke-width="0.82" opacity="0.86"/><path d="M38.01 29.14 Q36.38 33.02 37.57 38.43" stroke-width="0.52" opacity="0.65"/><path d="M39.43 30.42 Q45.2 27.44 55.18 29.76" stroke-width="0.67" opacity="0.91"/><path d="M39.43 30.42 Q37.53 35.17 39.26 42.03" stroke-width="0.71" opacity="0.94"/><path d="M40.85 31.71 Q47.26 29.19 56.09 30.42" stroke-width="0.83" opacity="0.76"/><path d="M40.85 31.71 Q38.54 36.58 40.19 43.8" stroke-width="0.83" opacity="0.90"/><path d="M42.27 33.03 Q47.69 29.84 55.9 30.75" stroke-width="0.78" opacity="0.92"/><path d="M42.27 33.03 Q40.87 37.9 42.25 44.25" stroke-width="0.62" opacity="0.77"/><path d="M43.7 34.37 Q50.43 31.64 59.13 32.41" stroke-width="0.53" opacity="0.89"/><path d="M43.7 34.37 Q41.33 39.64 43.41 47.75" stroke-width="0.66" opacity="0.77"/><path d="M45.13 35.73 Q51.35 32.86 60.56 34.45" stroke-width="0.75" opacity="0.95"/><path d="M45.13 35.73 Q42.9 41.62 44.17 49.41" stroke-width="0.68" opacity="0.68"/><path d="M46.56 37.1 Q54.84 34.08 67.36 37.18" stroke-width="0.79" opacity="0.67"/><path d="M46.56 37.1 Q44.69 43.6 46.03 51.7" stroke-width="0.81" opacity="0.72"/><path d="M47.99 38.5 Q55.79 36.1 66.89 38.77" stroke-width="0.84" opacity="0.98"/><path d="M47.99 38.5 Q45.92 43.46 48.47 51.68" stroke-width="0.84" opacity="0.73"/><path d="M49.41 39.91 Q58.7 36.8 72.42 40.35" stroke-width="0.67" opacity="0.78"/><path d="M49.41 39.91 Q46.42 44.49 47.78 52.03" stroke-width="0.50" opacity="0.92"/><path d="M50.84 41.35 Q57.83 38.38 67.88 40.33" stroke-width="0.85" opacity="0.72"/><path d="M50.84 41.35 Q48.23 47.34 50.2 56.39" stroke-width="0.67" opacity="0.67"/><path d="M36.55 27.86 L38.5 29.58 L40.45 31.34 L42.4 33.15 L44.36 35 L46.32 36.88 L48.28 38.79 L50.25 40.75 L52.2 42.73" stroke="#e8d9a8" stroke-width="1.2"/><g class="cc-bone" data-jx="51.64" data-jy="42.16" data-px="-0.71" data-py="0.7" transform="rotate(0 51.64 42.16)"><path d="M59.46 34.47 L61.17 35.93 L62.84 37.45 L64.46 39.02 L66.05 40.64 L67.6 42.32 L69.11 44.04 L70.58 45.8 L72.01 47.61 L73.4 49.45 L74.74 51.34 L60.26 63.65 L58.73 62.11 L57.22 60.56 L55.73 59 L54.25 57.44 L52.79 55.87 L51.34 54.3 L49.92 52.72 L48.51 51.13 L47.13 49.53 L45.77 47.92 Z" fill="url(#ccVane)" fill-opacity=".14" stroke="none"/><path d="M52.27 42.8 Q60.52 39.1 72.29 41.2" stroke-width="0.52" opacity="0.91"/><path d="M52.27 42.8 Q49.08 48.82 51.25 58.65" stroke-width="0.81" opacity="0.68"/><path d="M53.69 44.26 Q62.2 41.03 73.13 42.51" stroke-width="0.60" opacity="0.87"/><path d="M53.69 44.26 Q50.78 49.98 52.21 58.61" stroke-width="0.72" opacity="0.76"/><path d="M55.11 45.75 Q62.6 43.32 73.58 46.45" stroke-width="0.69" opacity="0.92"/><path d="M55.11 45.75 Q51.95 51.46 53.54 60.51" stroke-width="0.83" opacity="0.93"/><path d="M56.53 47.25 Q63.68 44.42 73.69 46.54" stroke-width="0.47" opacity="0.83"/><path d="M56.53 47.25 Q53.86 54.47 55.1 64.03" stroke-width="0.45" opacity="1.00"/><path d="M57.94 48.76 Q66.11 46.35 76.63 48.51" stroke-width="0.55" opacity="0.70"/><path d="M57.94 48.76 Q54.38 55.14 55.52 64.72" stroke-width="0.46" opacity="0.84"/><path d="M59.34 50.29 Q67.54 48.21 78.39 51.05" stroke-width="0.62" opacity="0.67"/><path d="M59.34 50.29 Q55.73 56.4 57.79 66.88" stroke-width="0.66" opacity="0.91"/><path d="M60.74 51.83 Q68.56 49.09 79.33 51.71" stroke-width="0.79" opacity="0.99"/><path d="M60.74 51.83 Q57.08 57.18 58.27 66.21" stroke-width="0.53" opacity="0.98"/><path d="M62.13 53.39 Q71.03 51.03 83.56 55.01" stroke-width="0.74" opacity="0.71"/><path d="M62.13 53.39 Q58.56 58.84 59.88 68.07" stroke-width="0.81" opacity="0.84"/><path d="M63.52 54.96 Q71.98 53.05 83.56 56.81" stroke-width="0.68" opacity="0.65"/><path d="M63.52 54.96 Q61.38 61.29 62.83 70.12" stroke-width="0.76" opacity="0.75"/><path d="M64.9 56.54 Q73.99 53.6 84.86 55.16" stroke-width="0.54" opacity="0.83"/><path d="M64.9 56.54 Q61.88 62.9 62.89 72.12" stroke-width="0.74" opacity="0.95"/><path d="M66.26 58.14 Q73.67 55.16 84.25 58.03" stroke-width="0.60" opacity="0.79"/><path d="M66.26 58.14 Q63.43 64.14 65.34 74" stroke-width="0.50" opacity="0.90"/><path d="M51.64 42.16 L53.59 44.16 L55.54 46.2 L57.48 48.27 L59.41 50.37 L61.33 52.49 L63.24 54.64 L65.13 56.81 L67 59.01" stroke="#e8d9a8" stroke-width="1.2"/><g class="cc-bone" data-jx="66.46" data-jy="58.37" data-px="-0.76" data-py="0.65" transform="rotate(0 66.46 58.37)"><path d="M74.74 51.34 L76.05 53.26 L77.31 55.21 L78.53 57.19 L79.7 59.21 L80.84 61.25 L81.93 63.32 L82.97 65.41 L83.98 67.52 L84.93 69.65 L85.85 71.8 L75.96 78.92 L74.37 77.4 L72.78 75.88 L71.19 74.36 L69.61 72.84 L68.03 71.31 L66.46 69.78 L64.9 68.26 L63.34 66.72 L61.79 65.19 L60.26 63.65 Z" fill="url(#ccVane)" fill-opacity=".14" stroke="none"/><path d="M67.62 59.74 Q75.54 57.91 86 61.17" stroke-width="0.52" opacity="0.96"/><path d="M67.62 59.74 Q64.56 65.38 65.68 74.31" stroke-width="0.58" opacity="0.68"/><path d="M68.97 61.36 Q75.75 58.86 85.68 62.11" stroke-width="0.73" opacity="0.67"/><path d="M68.97 61.36 Q66.48 67.63 68.17 77.25" stroke-width="0.46" opacity="0.86"/><path d="M70.31 62.99 Q78.32 60.66 88.29 62.94" stroke-width="0.59" opacity="0.77"/><path d="M70.31 62.99 Q67.92 67.52 69.25 75.26" stroke-width="0.46" opacity="0.80"/><path d="M71.63 64.62 Q78.75 63.06 87.74 65.72" stroke-width="0.58" opacity="0.90"/><path d="M71.63 64.62 Q69.35 68.86 70.12 75.62" stroke-width="0.69" opacity="0.72"/><path d="M72.94 66.27 Q79.51 64.97 87.51 67.23" stroke-width="0.80" opacity="0.75"/><path d="M72.94 66.27 Q70.08 70.29 70.54 77.11" stroke-width="0.72" opacity="0.95"/><path d="M74.24 67.93 Q81.92 66.79 91.6 70.24" stroke-width="0.51" opacity="0.89"/><path d="M74.24 67.93 Q71.32 72.11 72.03 79.53" stroke-width="0.74" opacity="0.98"/><path d="M75.53 69.59 Q80.84 67.82 88.56 70.76" stroke-width="0.61" opacity="0.67"/><path d="M75.53 69.59 Q73.62 73.92 73.39 79.21" stroke-width="0.46" opacity="0.75"/><path d="M76.8 71.26 Q82.91 69.53 91.33 72.65" stroke-width="0.69" opacity="0.92"/><path d="M76.8 71.26 Q75 75.12 75.33 80.67" stroke-width="0.66" opacity="0.66"/><path d="M78.06 72.94 Q83.31 72.28 90.16 75.19" stroke-width="0.50" opacity="0.80"/><path d="M78.06 72.94 Q76.47 76.88 76.87 82.38" stroke-width="0.46" opacity="0.74"/><path d="M79.3 74.62 Q84.02 73.47 91.11 76.95" stroke-width="0.58" opacity="0.78"/><path d="M79.3 74.62 Q77.7 77.74 77.94 82.4" stroke-width="0.64" opacity="0.99"/><path d="M66.46 58.37 L68.32 60.58 L70.17 62.81 L71.98 65.06 L73.78 67.33 L75.55 69.61 L77.29 71.91 L79 74.22 L80.68 76.54" stroke="#e8d9a8" stroke-width="1.2"/><g class="cc-bone" data-jx="80.2" data-jy="75.87" data-px="-0.81" data-py="0.58" transform="rotate(0 80.2 75.87)"><path d="M85.85 71.8 L86.72 73.96 L87.54 76.13 L88.31 78.32 L89.04 80.52 L89.72 82.73 L90.34 84.94 L90.9 87.17 L91.4 89.4 L91.8 91.66 L92 94 L92 94 L90.28 92.56 L88.66 91.07 L87.07 89.55 L85.48 88.04 L83.9 86.52 L82.31 85 L80.73 83.48 L79.14 81.96 L77.55 80.44 L75.96 78.92 Z" fill="url(#ccVane)" fill-opacity=".14" stroke="none"/><path d="M80.52 76.31 Q84.86 75.05 90.53 76.96" stroke-width="0.46" opacity="0.95"/><path d="M80.52 76.31 Q78.28 79.43 78.68 85.1" stroke-width="0.51" opacity="0.99"/><path d="M81.72 78.01 Q86.3 76.84 92.17 78.91" stroke-width="0.74" opacity="0.77"/><path d="M81.72 78.01 Q80.03 80.8 80.25 85.36" stroke-width="0.85" opacity="0.73"/><path d="M82.91 79.71 Q86.85 79.58 91.27 81.21" stroke-width="0.52" opacity="0.88"/><path d="M82.91 79.71 Q81.23 82 81.09 85.66" stroke-width="0.78" opacity="0.77"/><path d="M84.08 81.42 Q87.24 80.92 90.68 81.77" stroke-width="0.68" opacity="0.69"/><path d="M84.08 81.42 Q82.46 83.4 83.08 87.89" stroke-width="0.79" opacity="0.79"/><path d="M85.23 83.13 Q87.96 82.68 91.33 84" stroke-width="0.66" opacity="0.88"/><path d="M85.23 83.13 Q83.99 84.55 83.98 87.22" stroke-width="0.73" opacity="0.71"/><path d="M86.36 84.84 Q88.74 83.84 92.51 85.82" stroke-width="0.65" opacity="0.80"/><path d="M86.36 84.84 Q85.22 86.37 85.13 88.89" stroke-width="0.60" opacity="0.76"/><path d="M87.47 86.56 Q89.16 85.77 92.09 87.54" stroke-width="0.77" opacity="0.68"/><path d="M87.47 86.56 Q86.37 87.05 86.69 89.37" stroke-width="0.47" opacity="0.69"/><path d="M88.55 88.28 Q89.97 88.45 91.4 89.02" stroke-width="0.55" opacity="0.85"/><path d="M88.55 88.28 Q87.62 88.78 87.76 90.62" stroke-width="0.70" opacity="0.69"/><path d="M89.62 90 Q90.39 90.09 91.2 90.45" stroke-width="0.46" opacity="1.00"/><path d="M89.62 90 Q89.56 90.87 89.35 91.29" stroke-width="0.57" opacity="0.88"/><path d="M80.2 75.87 L81.5 77.69 L82.78 79.52 L84.04 81.35 L85.27 83.19 L86.48 85.04 L87.67 86.88 L88.84 88.73 L89.97 90.58" stroke="#e8d9a8" stroke-width="1.2"/></g></g></g></g></g></g>
  <path d="M22.05 16.11 C25.22 13.48 32.46 10.19 36.86 14.96 " fill="none" stroke="#8a6a2a" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"/><path d="M22.05 16.11 C25.22 13.48 32.46 10.19 36.86 14.96 " fill="none" stroke="url(#ccGold)" stroke-width="1.15" stroke-linecap="round" stroke-linejoin="round"/><path d="M37.24 15.21 L38.37 14.25 L39.7 13.73 L41.08 13.68 L42.34 14.06 L43.36 14.8 L44.05 15.8 L44.36 16.91 L44.29 18 L43.88 18.96 L43.22 19.69 L42.4 20.13 L41.53 20.26 L40.73 20.11 L40.07 19.72 L39.61 19.17 L39.39 18.56 L39.39 17.95 L39.59 17.44 L39.92 17.07 L40.32 16.87 L40.71 16.83 L41.03 16.94" fill="none" stroke="#8a6a2a" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"/><path d="M37.24 15.21 L38.37 14.25 L39.7 13.73 L41.08 13.68 L42.34 14.06 L43.36 14.8 L44.05 15.8 L44.36 16.91 L44.29 18 L43.88 18.96 L43.22 19.69 L42.4 20.13 L41.53 20.26 L40.73 20.11 L40.07 19.72 L39.61 19.17 L39.39 18.56 L39.39 17.95 L39.59 17.44 L39.92 17.07 L40.32 16.87 L40.71 16.83 L41.03 16.94" fill="none" stroke="url(#ccGold)" stroke-width="1.15" stroke-linecap="round" stroke-linejoin="round"/><path d="M16.93 12.5 C18.61 10.01 22.97 7.54 26.51 10.69" fill="none" stroke="#8a6a2a" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"/><path d="M16.93 12.5 C18.61 10.01 22.97 7.54 26.51 10.69" fill="none" stroke="url(#ccGold)" stroke-width="1.15" stroke-linecap="round" stroke-linejoin="round"/><path d="M27.08 11.07 L26.8 11.95 L26.79 12.83 L27.04 13.64 L27.5 14.31 L28.12 14.79 L28.82 15.04 L29.53 15.08 L30.18 14.9 L30.72 14.55 L31.11 14.08 L31.33 13.55 L31.36 13.01 L31.24 12.52 L30.98 12.12 L30.64 11.84 L30.26 11.69 L29.89 11.68 L29.56 11.77 L29.31 11.96 L29.15 12.19 L29.1 12.42 L29.12 12.64" fill="none" stroke="#8a6a2a" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"/><path d="M27.08 11.07 L26.8 11.95 L26.79 12.83 L27.04 13.64 L27.5 14.31 L28.12 14.79 L28.82 15.04 L29.53 15.08 L30.18 14.9 L30.72 14.55 L31.11 14.08 L31.33 13.55 L31.36 13.01 L31.24 12.52 L30.98 12.12 L30.64 11.84 L30.26 11.69 L29.89 11.68 L29.56 11.77 L29.31 11.96 L29.15 12.19 L29.1 12.42 L29.12 12.64" fill="none" stroke="url(#ccGold)" stroke-width="1.15" stroke-linecap="round" stroke-linejoin="round"/><path d="M22.05 16.11 C20.48 19.93 18.9 27.52 24.36 30.58 " fill="none" stroke="#8a6a2a" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"/><path d="M22.05 16.11 C20.48 19.93 18.9 27.52 24.36 30.58 " fill="none" stroke="url(#ccGold)" stroke-width="1.15" stroke-linecap="round" stroke-linejoin="round"/><path d="M24.57 30.79 L23.85 32.08 L23.59 33.49 L23.81 34.85 L24.42 36.01 L25.35 36.87 L26.46 37.36 L27.61 37.44 L28.67 37.16 L29.53 36.58 L30.12 35.79 L30.39 34.9 L30.35 34.02 L30.05 33.26 L29.54 32.69 L28.92 32.35 L28.27 32.25 L27.67 32.37 L27.21 32.66 L26.91 33.06 L26.79 33.49 L26.83 33.88 L26.99 34.18" fill="none" stroke="#8a6a2a" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"/><path d="M24.57 30.79 L23.85 32.08 L23.59 33.49 L23.81 34.85 L24.42 36.01 L25.35 36.87 L26.46 37.36 L27.61 37.44 L28.67 37.16 L29.53 36.58 L30.12 35.79 L30.39 34.9 L30.35 34.02 L30.05 33.26 L29.54 32.69 L28.92 32.35 L28.27 32.25 L27.67 32.37 L27.21 32.66 L26.91 33.06 L26.79 33.49 L26.83 33.88 L26.99 34.18" fill="none" stroke="url(#ccGold)" stroke-width="1.15" stroke-linecap="round" stroke-linejoin="round"/><path d="M16.93 12.5 C15.25 14.98 14.32 19.8 18.28 22.02" fill="none" stroke="#8a6a2a" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"/><path d="M16.93 12.5 C15.25 14.98 14.32 19.8 18.28 22.02" fill="none" stroke="url(#ccGold)" stroke-width="1.15" stroke-linecap="round" stroke-linejoin="round"/><path d="M18.71 22.38 L19.47 21.86 L20.31 21.6 L21.16 21.61 L21.93 21.86 L22.56 22.31 L23.01 22.91 L23.25 23.58 L23.27 24.26 L23.09 24.87 L22.75 25.38 L22.3 25.74 L21.79 25.93 L21.28 25.95 L20.83 25.82 L20.46 25.58 L20.21 25.25 L20.09 24.9 L20.09 24.56 L20.19 24.26 L20.37 24.05 L20.58 23.92 L20.8 23.89" fill="none" stroke="#8a6a2a" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"/><path d="M18.71 22.38 L19.47 21.86 L20.31 21.6 L21.16 21.61 L21.93 21.86 L22.56 22.31 L23.01 22.91 L23.25 23.58 L23.27 24.26 L23.09 24.87 L22.75 25.38 L22.3 25.74 L21.79 25.93 L21.28 25.95 L20.83 25.82 L20.46 25.58 L20.21 25.25 L20.09 24.9 L20.09 24.56 L20.19 24.26 L20.37 24.05 L20.58 23.92 L20.8 23.89" fill="none" stroke="url(#ccGold)" stroke-width="1.15" stroke-linecap="round" stroke-linejoin="round"/>
  <polygon points="12.03 7.6 13.5 8.23 14.99 8.9 16.51 9.61 18.06 10.37 19.62 11.16 21.21 11.99 22.82 12.87 24.45 13.78 20.52 19.09 19.21 17.85 17.92 16.65 16.64 15.48 15.38 14.35 14.13 13.25 12.9 12.19 11.69 11.17 10.5 10.18" fill="url(#ccGold)" stroke="#8a6a2a" stroke-width=".5" stroke-linejoin="round"/>
  <polygon points="13.75 7.59 15.28 8.54 12.74 12.61 11.21 11.66" fill="url(#ccGold)" stroke="#8a6a2a" stroke-width=".4" stroke-linejoin="round"/><polygon points="18.78 10 20.26 11.02 16.76 16.13 15.27 15.12" fill="url(#ccGold)" stroke="#8a6a2a" stroke-width=".4" stroke-linejoin="round"/><polygon points="22.86 11.88 24.96 13.41 20.36 19.71 18.26 18.18" fill="url(#ccGold)" stroke="#8a6a2a" stroke-width=".4" stroke-linejoin="round"/>
  <polygon points="6.09 5.82 6.85 6.01 7.62 6.22 8.41 6.44 9.2 6.67 10.01 6.92 10.82 7.18 11.65 7.46 12.48 7.76 10.83 10.5 10.2 9.92 9.57 9.35 8.95 8.79 8.33 8.25 7.72 7.71 7.11 7.19 6.51 6.68 5.91 6.18" fill="#dfe6ff" stroke="#6f86d6" stroke-width=".45" stroke-linejoin="round"/>
  <circle cx="6" cy="6" r="1.1" fill="#26357e"/>
  <circle cx="41.07" cy="17.76" r="1" fill="url(#ccGem)" stroke="#e8d9a8" stroke-width=".35"/><circle cx="40.77" cy="17.46" r="0.3" fill="#fff"/><circle cx="29.66" cy="12.79" r="0.8" fill="url(#ccGem)" stroke="#e8d9a8" stroke-width=".35"/><circle cx="29.42" cy="12.55" r="0.24" fill="#fff"/><circle cx="30.35" cy="13.35" r="0.7" fill="url(#ccGem)" stroke="#e8d9a8" stroke-width=".35"/><circle cx="30.14" cy="13.14" r="0.21" fill="#fff"/><circle cx="34.75" cy="15.04" r="0.7" fill="url(#ccGem)" stroke="#e8d9a8" stroke-width=".35"/><circle cx="34.54" cy="14.83" r="0.21" fill="#fff"/><circle cx="27.81" cy="34.05" r="1" fill="url(#ccGem)" stroke="#e8d9a8" stroke-width=".35"/><circle cx="27.51" cy="33.75" r="0.3" fill="#fff"/><circle cx="21.09" cy="24.36" r="0.8" fill="url(#ccGem)" stroke="#e8d9a8" stroke-width=".35"/><circle cx="20.85" cy="24.12" r="0.24" fill="#fff"/><circle cx="21.64" cy="24.82" r="0.7" fill="url(#ccGem)" stroke="#e8d9a8" stroke-width=".35"/><circle cx="21.43" cy="24.61" r="0.21" fill="#fff"/><circle cx="24.11" cy="28.56" r="0.7" fill="url(#ccGem)" stroke="#e8d9a8" stroke-width=".35"/><circle cx="23.9" cy="28.35" r="0.21" fill="#fff"/><circle cx="22.48" cy="16.43" r="4.1" fill="url(#ccGem)" stroke="#e8d9a8" stroke-width=".9"/><line x1="22.48" y1="16.43" x2="26.38" y2="16.43" stroke="#9fb4ff" stroke-width=".35"/><line x1="22.48" y1="16.43" x2="25.24" y2="19.19" stroke="#9fb4ff" stroke-width=".35"/><line x1="22.48" y1="16.43" x2="22.48" y2="20.33" stroke="#9fb4ff" stroke-width=".35"/><line x1="22.48" y1="16.43" x2="19.73" y2="19.19" stroke="#9fb4ff" stroke-width=".35"/><line x1="22.48" y1="16.43" x2="18.58" y2="16.43" stroke="#9fb4ff" stroke-width=".35"/><line x1="22.48" y1="16.43" x2="19.73" y2="13.68" stroke="#9fb4ff" stroke-width=".35"/><line x1="22.48" y1="16.43" x2="22.48" y2="12.53" stroke="#9fb4ff" stroke-width=".35"/><line x1="22.48" y1="16.43" x2="25.24" y2="13.68" stroke="#9fb4ff" stroke-width=".35"/><circle cx="21.28" cy="15.23" r="1.1" fill="#fff"/>
  <circle cx="14.86" cy="11.13" r="1.5" fill="url(#ccGem)" stroke="#e8d9a8" stroke-width=".35"/><circle cx="14.41" cy="10.68" r="0.45" fill="#fff"/>
  <path class="cc-sp s1" d="M34 22.2 L34.91 25.09 L37.8 26 L34.91 26.91 L34 29.8 L33.09 26.91 L30.2 26 L33.09 25.09 Z" fill="#fff"/>
  <path class="cc-sp s2" d="M14 33 L14.72 35.28 L17 36 L14.72 36.72 L14 39 L13.28 36.72 L11 36 L13.28 35.28 Z" fill="#e8d9a8"/>
  <circle class="cc-sp s3" cx="40" cy="10" r="1" fill="#9fb4ff"/>
</svg>`;
  document.body.appendChild(wand);
  document.documentElement.classList.add("cc-on");

  let mx = -100, my = -100, svx = 0, svy = 0, evX = null, evY = 0, evT = 0;
  let scale = 1, scaleTarget = 1;
  // The feather is a chain of joints. Each one bends a little, and the bends add up along its length.
  const bones = [...wand.querySelectorAll(".cc-bone")].map((el) => ({
    el, jx: +el.dataset.jx, jy: +el.dataset.jy, px: +el.dataset.px, py: +el.dataset.py, a: 0, w: 0
  }));
  const GAIN = [1, 0.95, 0.85, 0.75, 0.65];
  let pressed = false, hovering = false;

  function setTargets() { scaleTarget = pressed ? PRESS_SCALE : hovering ? HOVER_SCALE : 1; }

  addEventListener("pointermove", (e) => {
    if (e.pointerType === "touch") return;
    mx = e.clientX; my = e.clientY;
    if (evX !== null) {
      const dtE = Math.max(e.timeStamp - evT, 4) / 1000;
      const cap = (v) => Math.max(-4000, Math.min(4000, v));
      svx += (cap((mx - evX) / dtE) - svx) * 0.3;     // smoothed cursor speed, px per second
      svy += (cap((my - evY) / dtE) - svy) * 0.3;
    }
    evX = mx; evY = my; evT = e.timeStamp;
    const t = e.target;
    hovering = !!(t.closest && t.closest(INTERACTIVE));
    const overField = !!(t.closest && t.closest("input, textarea, select"));
    wand.classList.toggle("on", hovering);
    wand.classList.toggle("hide", overField);
    wand.classList.add("show");
    setTargets();
    start();
  });
  addEventListener("pointerdown", (e) => { if (e.pointerType !== "touch") { pressed = true; setTargets(); start(); } });
  addEventListener("pointerup", () => { pressed = false; setTargets(); start(); });
  document.documentElement.addEventListener("mouseleave", () => wand.classList.remove("show"));

  let running = false, last = 0;
  function start() {
    if (running) return;
    running = true;
    last = performance.now();
    requestAnimationFrame(loop);
  }

  function loop(now) {
    const dt = Math.max((now - last) / 1000, 0.008);
    last = now;
    // When the mouse stops sending events, the measured speed fades to zero
    const stale = now - evT > 60;
    if (stale) { const k = Math.exp(-dt * 14); svx *= k; svy *= k; }

    let energy = 0;
    if (FLOW) {
      const steps = Math.max(1, Math.ceil(dt / 0.01)), h = dt / steps;
      for (let s = 0; s < steps; s++) {
        bones.forEach((b, i) => {
          // The air pushes the feather against the way you move: a bend toward -velocity, sideways to the feather
          const push = -(svx * b.px + svy * b.py) * FLOW * GAIN[i % GAIN.length];
          const target = Math.max(-MAX_BEND, Math.min(MAX_BEND, push));
          const k = SPRING[i % SPRING.length];
          b.w += (-k * (b.a - target) - 2 * WAVE * Math.sqrt(k) * b.w) * h;   // spring with a little bounce
          b.a += b.w * h;
        });
      }
      for (const b of bones) {
        b.el.setAttribute("transform", `rotate(${(b.a * 57.2958).toFixed(2)} ${b.jx} ${b.jy})`);
        energy += Math.abs(b.a) + Math.abs(b.w) * 0.05;
      }
    }

    scale += (scaleTarget - scale) * 0.2;
    wand.style.transform = `translate3d(${mx - TIP}px, ${my - TIP}px, 0) scale(${scale.toFixed(3)})`;

    const still = stale && Math.abs(svx) + Math.abs(svy) < 2;
    const settled = still && energy < 0.004 && Math.abs(scaleTarget - scale) < 0.005;
    if (settled) running = false; else requestAnimationFrame(loop);
  }
})();