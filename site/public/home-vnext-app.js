(() => {
  const toggle = document.querySelector(".vnext-menu-toggle");
  const nav = document.querySelector("#vnext-nav");
  if (!toggle || !nav) return;

  const closeMenu = ({ restoreFocus = false } = {}) => {
    nav.classList.remove("is-open");
    document.body.classList.remove("vnext-menu-open");
    toggle.setAttribute("aria-expanded", "false");
    toggle.textContent = "메뉴";
    if (restoreFocus) toggle.focus();
  };

  toggle.addEventListener("click", () => {
    const open = !nav.classList.contains("is-open");
    if (!open) {
      closeMenu();
      return;
    }
    nav.classList.add("is-open");
    document.body.classList.add("vnext-menu-open");
    toggle.setAttribute("aria-expanded", "true");
    toggle.textContent = "닫기";
  });

  nav.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => closeMenu()));

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape" || !nav.classList.contains("is-open")) return;
    closeMenu({ restoreFocus: true });
  });
})();
