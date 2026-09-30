(() => {
  const toggle = document.querySelector(".homev2-menu-toggle");
  const nav = document.querySelector("#homev2-nav");
  if (!toggle || !nav) return;

  const close = () => {
    nav.classList.remove("is-open");
    document.body.classList.remove("homev2-menu-open");
    toggle.setAttribute("aria-expanded", "false");
  };

  toggle.addEventListener("click", () => {
    const open = toggle.getAttribute("aria-expanded") === "true";
    if (open) {
      close();
      return;
    }
    nav.classList.add("is-open");
    document.body.classList.add("homev2-menu-open");
    toggle.setAttribute("aria-expanded", "true");
  });

  nav.addEventListener("click", (event) => {
    if (event.target.closest("a")) close();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && nav.classList.contains("is-open")) {
      close();
      toggle.focus();
    }
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 1024) close();
  });
})();
