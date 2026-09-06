document.addEventListener("DOMContentLoaded", () => {
  // Smooth scroll with sticky header offset
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener("click", (e) => {
      const id = a.getAttribute("href");
      const el = document.querySelector(id);
      if (!el) return;

      e.preventDefault();
      const headerOffset = 90;
      const y = el.getBoundingClientRect().top + window.pageYOffset - headerOffset;
      window.scrollTo({ top: y, behavior: "smooth" });
    });
  });
});
