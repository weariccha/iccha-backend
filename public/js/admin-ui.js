// js/admin-ui.js
// Wraps native <select> elements marked up with a .custom-select
// container into a themed dropdown, while keeping the original
// <select> in the DOM (hidden) so existing code that reads
// `document.getElementById(id).value` keeps working unchanged.

(function () {
  function labelFor(select, value) {
    const opt = Array.from(select.options).find((o) => o.value === value);
    if (opt) return opt.textContent;
    return select.options[0] ? select.options[0].textContent : "";
  }

  function refresh(targetId) {
    const select = document.getElementById(targetId);
    if (!select) return;

    const wrapper = document.querySelector(
      '.custom-select[data-for="' + targetId + '"]'
    );
    if (!wrapper) return;

    const valueEl = wrapper.querySelector(".custom-select-value");
    const menu = wrapper.querySelector(".custom-select-menu");

    const label = labelFor(select, select.value);
    valueEl.textContent = label;
    valueEl.classList.toggle("placeholder", select.value === "");

    menu.querySelectorAll(".custom-select-option").forEach((item) => {
      item.classList.toggle("active", item.dataset.value === select.value);
    });
  }

  function buildOption(select, opt) {
    const item = document.createElement("div");
    item.className = "custom-select-option";
    item.dataset.value = opt.value;
    item.textContent = opt.textContent;

    item.addEventListener("click", () => {
      select.value = opt.value;
      select.dispatchEvent(new Event("change", { bubbles: true }));
      refresh(select.id);
      item.closest(".custom-select").classList.remove("open");
    });

    return item;
  }

  function build(wrapper) {
    const targetId = wrapper.dataset.for;
    const select = document.getElementById(targetId);
    if (!select) return;

    // Keep the real select working for existing JS, just hide it visually
    select.hidden = true;
    select.setAttribute("aria-hidden", "true");
    select.tabIndex = -1;

    const trigger = wrapper.querySelector(".custom-select-trigger");
    const menu = wrapper.querySelector(".custom-select-menu");

    menu.innerHTML = "";
    Array.from(select.children).forEach((child) => {
      if (child.tagName === "OPTGROUP") {
        const groupLabel = document.createElement("div");
        groupLabel.className = "custom-select-group";
        groupLabel.textContent = child.label;
        menu.appendChild(groupLabel);

        Array.from(child.children).forEach((opt) => {
          menu.appendChild(buildOption(select, opt));
        });
      } else if (child.tagName === "OPTION") {
        menu.appendChild(buildOption(select, child));
      }
    });

    trigger.addEventListener("click", (e) => {
      e.stopPropagation();
      document.querySelectorAll(".custom-select.open").forEach((w) => {
        if (w !== wrapper) w.classList.remove("open");
      });
      wrapper.classList.toggle("open");
    });

    refresh(targetId);
  }

  document.addEventListener("click", () => {
    document.querySelectorAll(".custom-select.open").forEach((w) =>
      w.classList.remove("open")
    );
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      document.querySelectorAll(".custom-select.open").forEach((w) =>
        w.classList.remove("open")
      );
    }
  });

  document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll(".custom-select").forEach(build);
  });

  // Exposed so pages can re-sync the visible dropdown after
  // programmatically setting select.value (e.g. loading a product to edit)
  window.ICCHA_ADMIN_UI = { refresh };
})();
