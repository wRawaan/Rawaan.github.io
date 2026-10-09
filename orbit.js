// "Transmissions": shows one fun fact at a time with a button for the next.
// Without JavaScript all the facts stay visible as a normal list.
(() => {
  const box = document.querySelector(".tx");
  if (!box) return;
  const items = [...box.querySelectorAll(".tx-list li")];
  const btn = box.querySelector(".tx-btn");
  const count = box.querySelector(".tx-count");
  if (items.length < 2 || !btn || !count) return;

  let i = 0;
  const pad = (n) => String(n).padStart(2, "0");

  function show(n) {
    items.forEach((li, k) => li.classList.toggle("active", k === n));
    count.textContent = pad(n + 1) + " / " + pad(items.length);
  }

  box.classList.add("is-js");
  show(i);
  btn.addEventListener("click", () => { i = (i + 1) % items.length; show(i); });
})();