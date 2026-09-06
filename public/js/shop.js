document.addEventListener("DOMContentLoaded", () => {
  console.log("shop.js loaded");

  const GROUP_CATEGORIES = {
    clothes: ["sarees", "kurtis", "co-ord sets", "dresses", "denim", "shirts", "pants", "kids ethnic wear", "kids western wear", "kids party wear"],
    accessories: ["bags", "jewelry", "belts", "scarves", "watches"],
    fragrances: ["perfumes", "deodorants", "attars"],
    footwear: ["heels", "flats", "sneakers", "sandals", "kids footwear"],
  };

  const GROUP_LABELS = {
    clothes: "Clothes",
    accessories: "Accessories",
    fragrances: "Fragrances",
    footwear: "Footwear",
  };

  const currentGroup = (new URLSearchParams(window.location.search).get("group") || "").toLowerCase();

  const groupHeading = document.getElementById("groupHeading");
  if (groupHeading && GROUP_LABELS[currentGroup]) {
    groupHeading.textContent = GROUP_LABELS[currentGroup];
    groupHeading.style.display = "block";
  }

  // Only show the Categories dropdown for the active group; hide the rest.
  // Keep the chip labeled plain "Categories" — the page heading above
  // already says which group we're in, so renaming it here was redundant.
  if (currentGroup && GROUP_CATEGORIES[currentGroup]) {
    document.querySelectorAll(".dd-cat-group").forEach((groupEl) => {
      const isActive = groupEl.dataset.catGroup === currentGroup;
      groupEl.style.display = isActive ? "" : "none";
      const label = groupEl.querySelector(".dd-group-label");
      if (label && isActive) label.style.display = "none";
    });
  }

  // Only Clothes and Footwear need audience (gender) and Style filters —
  // Accessories and Fragrances just get the Categories dropdown.
  const AUDIENCE_STYLE_GROUPS = new Set(["clothes", "footwear"]);
  if (currentGroup && !AUDIENCE_STYLE_GROUPS.has(currentGroup)) {
    const audienceFilters = document.getElementById("audienceFilters");
    if (audienceFilters) audienceFilters.style.display = "none";
    const styleFilter = document.getElementById("styleFilter");
    if (styleFilter) styleFilter.style.display = "none";
  }

  // Footwear only needs Men/Women/Kids — Clothes keeps the full audience set.
  const AUDIENCE_VALUES_BY_GROUP = {
    footwear: ["women", "men", "kids"],
  };
  if (currentGroup && AUDIENCE_VALUES_BY_GROUP[currentGroup]) {
    const allowed = AUDIENCE_VALUES_BY_GROUP[currentGroup];
    document.querySelectorAll('#audienceFilters .filter-pill').forEach((pill) => {
      if (!allowed.includes(pill.dataset.value)) pill.style.display = "none";
    });
  }

  // SORT DROPDOWN TOGGLE
const sortDD = document.getElementById("sortDD");

if (sortDD) {
  const btn = sortDD.querySelector(".dd-btn");
  const menu = sortDD.querySelector(".dd-menu");

  btn.addEventListener("click", function (e) {
    e.stopPropagation();
    menu.classList.toggle("open");
  });

  document.addEventListener("click", function () {
    menu.classList.remove("open");
  });
}

  function updateResultCount() {
  const allProducts = document.querySelectorAll(".product-card");
  const visibleProducts = document.querySelectorAll(".product-card:not([hidden])");
  //const visibleProducts = [...allProducts].filter(p => !p.hidden);

  const total = allProducts.length;
  const visible = visibleProducts.length;

  const resultCount = document.getElementById("resultCount");
  if (resultCount) {
    resultCount.textContent = `Showing ${visible} of ${total} products`;
  }
}

  // ✅ If this is NOT the shop page, stop here (prevents breaking Contact/About/etc)
  const grid = document.getElementById("productGrid");
  if (!grid) return;

// ✅ VIEW TOGGLE (Grid / List)
(function initViewToggle() {
  const gridEl = document.getElementById("productGrid");
  const toggleBtns = document.querySelectorAll(".view-toggle .iconbtn");
  if (!gridEl || !toggleBtns.length) return;

  function setView(view) {
    // button active state
    toggleBtns.forEach((b) => b.classList.toggle("active", b.dataset.view === view));

    // layout classes
    gridEl.classList.toggle("list-view", view === "list");
    gridEl.classList.toggle("grid-view", view === "grid");

    // persist (optional)
    localStorage.setItem("ICCHA_SHOP_VIEW", view);
  }

  // load saved view (optional)
  const saved = localStorage.getItem("ICCHA_SHOP_VIEW");
  setView(saved === "list" ? "list" : "grid");

  // click binding
  document.querySelector(".view-toggle")?.addEventListener("click", (e) => {
    const btn = e.target.closest(".iconbtn[data-view]");
    if (!btn) return;
    setView(btn.dataset.view);
  });
})();

document.querySelectorAll("button").forEach(btn => {
  if (!btn.hasAttribute("type")) {
    btn.setAttribute("type", "button");
  }
});


// 🔥 Close other dropdowns when one opens
document.querySelectorAll(".toolbar-dd").forEach((current) => {
  current.addEventListener("toggle", () => {
    if (current.open) {
      document.querySelectorAll(".toolbar-dd").forEach((other) => {
        if (other !== current) {
          other.removeAttribute("open");
        }
      });
    }
  });
});


// 🔥 Close dropdowns when clicking outside
document.addEventListener("click", (e) => {
  if (!e.target.closest(".toolbar-dd")) {
    document.querySelectorAll(".toolbar-dd").forEach((dd) => {
      dd.removeAttribute("open");
    });
  }
});

  /* =========================
     Helpers
  ========================= */
  function getCards() {
    return Array.from(document.querySelectorAll(".product-card"));
  }

  const resultCountEl = document.getElementById("resultCount");
  const emptyState = document.getElementById("emptyState");
  const saleOnly = document.getElementById("saleOnly");
  // const clearBtn = document.getElementById("clearFilters");

  let selected = {
    gender: new Set(),
    brand: new Set(),
    priceBand: new Set(),
    size: new Set(),
    rating: new Set(),
    category: new Set(),
    styleType: new Set(),
  };

  let userInteracted = false;

  function parseNum(v, fallback = 0) {
    const n = Number(String(v ?? "").trim());
    return Number.isFinite(n) ? n : fallback;
  }

  function priceBandOf(price) {
    if (price < 200) return "under200";
    if (price <= 400) return "200to400";
    return "above400";
  }

  function getSortValue() {
    const hidden = document.getElementById("sortValue");
    return hidden ? hidden.value : "default";
  }

  function updateResultText() {
    if (!resultCountEl) return;

    resultCountEl.hidden = false;
    const visible = getCards().filter((c) => !c.hidden).length;
    resultCountEl.textContent = `Showing ${visible} of ${getCards().length} results`;
  }

function normalize(str = "") {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}


function getSearchQ() {

  // 1️⃣ Check session first (used when already on shop page)
  const temp = sessionStorage.getItem("ICCHA_SEARCH");
  if (temp) {
    sessionStorage.removeItem("ICCHA_SEARCH");

    const headerInput = document.getElementById("headerSearchInput");
    if (headerInput) headerInput.value = temp;

    return temp;
  }

  // 2️⃣ Otherwise check URL (used when coming from other pages)
  const params = new URLSearchParams(window.location.search);
  const q = params.get("q") || "";

  if (q) {
    const headerInput = document.getElementById("headerSearchInput");
    if (headerInput) headerInput.value = q;

    // Clean URL
    window.history.replaceState({}, document.title, "shop.html");
  }

  return q;
}
/*
function applyFiltersAndSort() {

  const rawQ = getSearchQ();
  const searchQ = normalize(rawQ);

  const wantSaleOnly = !!saleOnly?.checked;
  const sortVal = getSortValue();

  const cards = getCards();

  const filtered = cards.filter((card) => {

    const gender = (card.dataset.gender || "").toLowerCase();
    const brand = (card.dataset.brand || "").toLowerCase();
    const price = parseNum(card.dataset.price, 0);
    const sizes = (card.dataset.size || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const rating = parseNum(card.dataset.rating, 0);
    const isSale = String(card.dataset.sale || "").toLowerCase() === "true";
    const isSoldOut = String(card.dataset.soldout || "").toLowerCase() === "true";
    const category = (card.dataset.category || "").toLowerCase();
    const styleType = (card.dataset.styletype || "").toLowerCase();

    // 🔎 SEARCH
    if (searchQ) {
      const text = normalize(
        (card.dataset.name || "") + " " +
        (card.dataset.brand || "")
      );

      if (!text.includes(searchQ)) return false;
    }

    // SALE
    if (wantSaleOnly && (!isSale || isSoldOut)) return false;

    return true;
  });

  // HIDE ALL
  cards.forEach(c => c.hidden = true);

  // SHOW FILTERED
  filtered.forEach(c => {
    c.hidden = false;
    grid.appendChild(c);
  });

  updateResultText();
}
*/

function applyFiltersAndSort() {
  const rawQ = getSearchQ();
  const searchQ = normalize(rawQ);

  const wantSaleOnly = !!saleOnly?.checked;
  const sortVal = getSortValue();

  const cards = getCards();

  const filtered = cards.filter((card) => {
    const gender = (card.dataset.gender || "").toLowerCase();
    const brand = (card.dataset.brand || "").toLowerCase();
    const price = parseNum(card.dataset.price, 0);

    const rating = parseNum(card.dataset.rating, 0);
    const isSale = String(card.dataset.sale || "").toLowerCase() === "true";
    const isSoldOut = String(card.dataset.soldout || "").toLowerCase() === "true";

    const category = (card.dataset.category || "").toLowerCase();
    const styleType = (card.dataset.styletype || "").toLowerCase();

    const sizes = (card.dataset.size || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (currentGroup && GROUP_CATEGORIES[currentGroup]) {
      if (!GROUP_CATEGORIES[currentGroup].includes(category)) return false;
    }


    // 🔎 SEARCH
    if (searchQ) {
      const text = normalize((card.dataset.name || "") + " " + (card.dataset.brand || ""));
      if (!text.includes(searchQ)) return false;
    }

    // ✅ GENDER (Men/Women/Kids include Unisex)
    if (selected.gender.size) {

    // If Men selected → allow men + unisex
      if (selected.gender.has("men")) {
        if (gender !== "men" && gender !== "unisex") return false;
      }

      // If Women selected → allow women + unisex
      if (selected.gender.has("women")) {
        if (gender !== "women" && gender !== "unisex") return false;
      }

      // If Kids selected → allow kids only (no unisex crossover)
      if (selected.gender.has("kids")) {
        if (gender !== "kids") return false;
      }

      // If Boys selected → allow boys only
      if (selected.gender.has("boys")) {
        if (gender !== "boys") return false;
      }

      // If Girls selected → allow girls only
      if (selected.gender.has("girls")) {
        if (gender !== "girls") return false;
      }

      // If Unisex selected → allow unisex only
      if (selected.gender.has("unisex")) {
        if (gender !== "unisex") return false;
      }

    }

    // ✅ CATEGORY
    if (selected.category.size) {
      if (!selected.category.has(category)) return false;
    }

    // ✅ SHOE MODEL (keyword based)
    if (selected.styleType.size) {

      const text = (
      (card.dataset.name || "") + " " +
      (card.dataset.category || "")
    ).toLowerCase();

    let match = false;

    selected.styleType.forEach(type => {
      if (text.includes(type)) {
        match = true;
      }
    });

    if (!match) return false;
    }
    // ✅ SIZE
    if (selected.size.size) {
      const hasSize = sizes.some((s) => selected.size.has(String(s).toLowerCase()));
      if (!hasSize) return false;
    }

    // ✅ PRICE BAND
    if (selected.priceBand.size) {
      const band = priceBandOf(price);
      if (!selected.priceBand.has(band)) return false;
    }

    // ✅ RATING
    if (selected.rating.size) {
      // Example: if you store "4" then rating >= 4
      const ok = Array.from(selected.rating).some((r) => rating >= Number(r));
      if (!ok) return false;
    }

    // ✅ SALE ONLY
    if (wantSaleOnly && (!isSale || isSoldOut)) return false;

    return true;
  });

  // ✅ SORT (basic examples)
  if (sortVal === "priceLow") {
    filtered.sort((a, b) => parseNum(a.dataset.price) - parseNum(b.dataset.price));
  } else if (sortVal === "priceHigh") {
    filtered.sort((a, b) => parseNum(b.dataset.price) - parseNum(a.dataset.price));
  }

  // HIDE ALL
  cards.forEach((c) => (c.hidden = true));

  // SHOW FILTERED
  filtered.forEach((c) => {
    c.hidden = false;
    grid.appendChild(c);
  });

  updateResultText();
}


  // ✅ Add-to-cart click (safe)
  grid.addEventListener("click", (e) => {
    const btn = e.target.closest(".add-to-cart");
    if (!btn) return;

    const card = btn.closest(".product-card");
    if (!card) return;

    const id = card.dataset.id;
    const name = card.querySelector(".product-title")?.innerText || "";
    const price = Number(card.dataset.price || 0);
    const img = card.querySelector("img")?.src || "";

    if (typeof addToCart === "function") {
      addToCart({ id, name, price, img }, 1);
    }
  });

  // Filters (only if your HTML has them)

document.querySelectorAll(".filter-input").forEach((input) => {
  input.addEventListener("change", () => {
    userInteracted = true;

    const key = input.dataset.filter;
    const val = String(input.value || "").toLowerCase();

    if (!selected[key]) selected[key] = new Set();

    if (input.checked) {
      selected[key].add(val);
    } else {
      selected[key].delete(val);
    }

    applyFiltersAndSort();
  });
});

document.querySelectorAll(".filter-pill").forEach((btn) => {
  btn.addEventListener("click", () => {
    userInteracted = true;

    const key = btn.dataset.filter;
    const val = String(btn.dataset.value || "").trim();

    if (!selected[key]) selected[key] = new Set();

    if (key === "gender") {

      // If clicking the same active button → deselect
      if (selected[key].has(val)) {
        selected[key].clear();
        document.querySelectorAll('[data-filter="gender"]')
          .forEach(b => b.classList.remove("active"));
      } else {
        // otherwise switch
        selected[key].clear();
        document.querySelectorAll('[data-filter="gender"]')
          .forEach(b => b.classList.remove("active"));

        selected[key].add(val);
        btn.classList.add("active");
      }

    } else {
      // normal multi-select
      if (selected[key].has(val)) {
        selected[key].delete(val);
        btn.classList.remove("active");
      } else {
        selected[key].add(val);
        btn.classList.add("active");
      }
    }

    applyFiltersAndSort();
  });
});

  saleOnly?.addEventListener("change", () => {
    userInteracted = true;
    applyFiltersAndSort();
  });

// SORT DROPDOWN

document.addEventListener("click", function (e) {
  const btn = e.target.closest(".dd-item");
  if (!btn) return;

  userInteracted = true;

  const value = btn.dataset.value;
  const hiddenInput = document.getElementById("sortValue");
  const label = document.querySelector("#sortDD .dd-label");

  if (hiddenInput) hiddenInput.value = value;
  if (label) label.textContent = btn.textContent;

  applyFiltersAndSort();
});


  /* =========================
     Load products (one fetch)
  ========================= */
  async function loadProducts() {
    try {
      const res = await fetch("/api/products");
      const products = await res.json();

      grid.innerHTML = "";

      products.forEach((p) => {
        const mrp = Number(p.mrp || 0);
        const offer = Number(p.offerPrice || 0);

        const isOnSale = offer > 0 && offer < mrp;
        const finalPrice = isOnSale ? offer : mrp;

        const discountPercent = isOnSale
          ? Math.round(((mrp - offer) / mrp) * 100)
          : 0;

        const rawImage = p.images?.[0] || "";
        const firstImage = rawImage
          ? (/^https?:\/\//i.test(rawImage) ? rawImage : "/" + rawImage.replace(/^\/+/, ""))
          : "https://via.placeholder.com/300";

        grid.innerHTML += `
          <article class="product-card"
            data-id="${p.id || p._id}"
            data-name="${p.name}"
            data-brand="${(p.brand || "").toLowerCase()}"
            data-gender="${(p.gender || "").toLowerCase()}"
            data-size="${(p.sizes || []).join(",")}"
            data-price="${finalPrice}"
            data-sale="${isOnSale}"
            data-soldout="${p.soldOut === true}"

            data-category="${String(p.category || "").toLowerCase()}"
            data-styletype="${String(p.styleType || "").toLowerCase()}"
          >
            ${isOnSale ? `<div class="discount-badge">-${discountPercent}%</div>` : ""}
            ${p.soldOut ? `<div class="soldout-badge">SOLD OUT</div>` : ""}

            <a class="product-media" href="product.html?id=${p.id || p._id}">
              <img src="${firstImage}" alt="${p.name}">
            </a>

            <div class="product-body">
              <h3 class="product-title">${p.name}</h3>
              <p class="product-sub muted">${p.brand || ""}</p>

              <div class="price-row">
                ${
                  isOnSale
                    ? `<span class="price-offer">₹${finalPrice}</span>
                       <span class="price-mrp">₹${mrp}</span>`
                    : `<span class="price">₹${mrp}</span>`
                }
              </div>
            </div>
          </article>
        `;
      });

      applyFiltersAndSort();
    } catch (err) {
      console.error("Failed to load products", err);
      grid.innerHTML = `<p class="muted">Failed to load products.</p>`;
    }
  }

  loadProducts();
});