// js/products.js
document.addEventListener("DOMContentLoaded", function () {

  const params = new URLSearchParams(location.search);
  const id = params.get("id");

  if (!id) {
    location.href = "shop.html";
    return;
  }

  fetch(`/api/products`)
    .then(res => res.json())
    .then(products => {

      const p = products.find(x => String(x.id) === String(id));

      if (!p) {
        location.href = "shop.html";
        return;
      }

      renderProduct(p);
    });

function renderProduct(p) {
  const mrp = Number(p.mrp || 0);
  const offer = Number(p.offerPrice || 0);
  const isOnSale = offer > 0 && offer < mrp;
  const finalPrice = isOnSale ? offer : mrp;

  let selectedSize = "";
  let selectedColor = "";

  const viewCartBtn = document.getElementById("viewCartBtn");

if (viewCartBtn) {
  viewCartBtn.onclick = () => {
    ICCHA_OPEN_CART();
  };
}

  // BASIC FIELDS
  document.getElementById("productBrand").textContent = p.brand || "";
  document.getElementById("productName").textContent = p.name || "";
  document.getElementById("productSubtitle").textContent = p.description || "";
  document.getElementById("productPrice").textContent = `₹${finalPrice}`;

  const oldPriceEl = document.getElementById("productOldPrice");
  oldPriceEl.textContent = isOnSale ? `₹${mrp}` : "";

  // =====================
// SOLD OUT LOGIC
// =====================

const stockEl = document.querySelector(".stock");
const addBtn = document.getElementById("addToCartBtn");
const buyBtn = document.getElementById("buyNowBtn");

if (p.soldOut === true) {

  // Change stock label
  if (stockEl) {
    stockEl.textContent = "Sold out";
    stockEl.classList.remove("in-stock");
    stockEl.classList.add("sold-out");
  }

  // Disable buttons
  if (addBtn) {
    addBtn.disabled = true;
    addBtn.innerHTML = "<span>Sold Out</span>";
  }

  if (buyBtn) {
    buyBtn.disabled = true;
    buyBtn.innerHTML = "<span>Unavailable</span>";
  }
}

  // ✅ ALWAYS HIDE BADGE (even if element exists)
  const badge = document.getElementById("discountBadge");
  if (badge) badge.style.display = "none";

  // IMAGES
  const mainImg = document.getElementById("mainProductImage");
  const thumbs = document.getElementById("thumbs");
  thumbs.innerHTML = "";

  //const imgs = Array.isArray(p.images) ? p.images : [];

  let imgs = [];

if (Array.isArray(p.images)) {
  imgs = p.images;
} else if (typeof p.images === "string" && p.images.trim() !== "") {
  imgs = [p.images];
}

  let currentIndex = 0;

function updateMainImage(index) {
  if (!imgs.length) return;

  currentIndex = (index + imgs.length) % imgs.length;
  mainImg.src = imgs[currentIndex];

  thumbs.querySelectorAll("img").forEach(x => x.classList.remove("active"));
  if (thumbs.children[currentIndex]) {
    thumbs.children[currentIndex].classList.add("active");
  }
}

// Arrow buttons
const prevBtn = document.getElementById("imgPrev");
const nextBtn = document.getElementById("imgNext");

if (prevBtn) {
  prevBtn.onclick = () => updateMainImage(currentIndex - 1);
}

if (nextBtn) {
  nextBtn.onclick = () => updateMainImage(currentIndex + 1);
}

// Keyboard navigation
document.addEventListener("keydown", (e) => {
  if (e.key === "ArrowLeft") {
    updateMainImage(currentIndex - 1);
  }
  if (e.key === "ArrowRight") {
    updateMainImage(currentIndex + 1);
  }
});


//mainImg.src = imgs[0] || "";

mainImg.src = imgs[0] || "images/placeholder.jpg";

  imgs.forEach((src, i) => {
    const img = document.createElement("img");
    img.src = src;
    if (i === 0) img.classList.add("active");

    img.onclick = () => {
      mainImg.src = src;
      thumbs.querySelectorAll("img").forEach(x => x.classList.remove("active"));
      img.classList.add("active");
    };

    thumbs.appendChild(img);
  });

  // ===== COLORS RENDER =====
const colorsContainer = document.getElementById("colors");
const colorBlock = document.getElementById("colorBlock");

if (colorsContainer && colorBlock) {

  colorsContainer.innerHTML = "";

  if (p.colors && p.colors.trim() !== "") {

    const colorList = p.colors.split("/");
    //let selectedColor = "";

    colorBlock.style.display = "block";

    colorList.forEach(color => {
      const btn = document.createElement("button");
      btn.className = "color-btn";
      btn.textContent = color.trim();

      btn.onclick = () => {
        document.querySelectorAll(".color-btn")
          .forEach(b => b.classList.remove("active"));

        btn.classList.add("active");
        selectedColor = color.trim();
      };

      colorsContainer.appendChild(btn);
    });

  } else {
    colorBlock.style.display = "none";
  }
}
  // ✅ SIZES (render + selection required)
  const sizesWrap = document.getElementById("sizes");
  //let selectedSize = "";
  //let selectedColor = "";

  const sizes = Array.isArray(p.sizes) ? p.sizes : [];
  sizesWrap.innerHTML = sizes.length
    ? sizes.map(s => `<button type="button" class="size-pill" data-size="${s}">${s}</button>`).join("")
    : `<div class="muted small">Sizes not available</div>`;

  sizesWrap.onclick = (e) => {
    const btn = e.target.closest(".size-pill");
    if (!btn) return;

    selectedSize = btn.dataset.size || "";
    sizesWrap.querySelectorAll(".size-pill").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
  };

  // ✅ QTY (+ / -)
  const qtyInput = document.getElementById("qtyInput");
  const minus = document.getElementById("qtyMinus");
  const plus = document.getElementById("qtyPlus");

  const getQty = () => Math.max(1, Number(qtyInput.value) || 1);

  if (minus) minus.onclick = () => { qtyInput.value = Math.max(1, getQty() - 1); };
  if (plus) plus.onclick = () => { qtyInput.value = getQty() + 1; };

  // ✅ Add / Buy requires size
  const mustPickSize = () => {
    if (!sizes.length) return true; // no sizes listed, allow
    if (!selectedSize) {
      alert("Please select a size first.");
      return false;
    }
    return true;
  };


const buildCartItem = () => ({
  id: p.id,
  name: p.name,
  price: finalPrice,
  img: imgs[0] || "",
  size: selectedSize || "",
  color: selectedColor || ""
});

if (addBtn) {
  addBtn.onclick = () => {

    if (!mustPickSize()) return;

    const selectedColorBtn = document.querySelector(".color-btn.active");
    if (p.colors && !selectedColorBtn) {
      alert("Please select a color.");
      return;
    }

    // 🔥 Animation
    addBtn.classList.add("btn-cart-animate");
    setTimeout(() => addBtn.classList.remove("btn-cart-animate"), 350);

    // 🔥 Mobile vibration
    if (navigator.vibrate) {
      navigator.vibrate(40);
    }

    ICCHA_ADD_TO_CART(buildCartItem(), getQty());

    //clear selected areas in add to cart

    qtyInput.value = 1;

    selectedSize = "";
    sizesWrap.querySelectorAll(".size-pill")
    .forEach(b => b.classList.remove("active"));

    document.querySelectorAll(".color-btn")
    .forEach(b => b.classList.remove("active"));

    // add to cart popup

    const toast = document.getElementById("cartToast");
if (toast) {
  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
  }, 2500);
}

  };
}

/*

document.getElementById("buyNowBtn").onclick = (e) => {

  e.stopPropagation();

  if (!mustPickSize()) return;

  const selectedColorBtn = document.querySelector(".color-btn.active");
  if (p.colors && !selectedColorBtn) {
    alert("Please select a color.");
    return;
  }

  const instantItem = {
    id: p.id,
    name: p.name,
    price: finalPrice,
    img: imgs[0] || "",
    size: selectedSize,
    color: selectedColor,
    qty: getQty()
  };

  // Store temporary checkout item
  sessionStorage.setItem("ICCHA_INSTANT_BUY", JSON.stringify([instantItem]));

  // Open checkout directly
  const checkoutBtn = document.getElementById("checkoutBtn");
  if (checkoutBtn) checkoutBtn.click();
};
*/

document.getElementById("buyNowBtn").onclick = (e) => {

  e.stopPropagation();

  if (!mustPickSize()) return;

  const selectedColorBtn = document.querySelector(".color-btn.active");
  if (p.colors && !selectedColorBtn) {
    alert("Please select a color.");
    return;
  }

  const instantItem = {
    id: p.id,
    name: p.name,
    price: finalPrice,
    img: imgs[0] || "",
    size: selectedSize,
    color: selectedColor,
    qty: getQty()
  };

  // Store temporary checkout item
  sessionStorage.setItem("ICCHA_INSTANT_BUY", JSON.stringify([instantItem]));

  // 🔥 CLEAR UI SELECTIONS (ADD THIS PART)

  qtyInput.value = 1;

  selectedSize = "";
  selectedColor = "";

  sizesWrap.querySelectorAll(".size-pill")
    .forEach(b => b.classList.remove("active"));

  document.querySelectorAll(".color-btn")
    .forEach(b => b.classList.remove("active"));

  // Open checkout
  /*const checkoutBtn = document.getElementById("checkoutBtn");
  if (checkoutBtn) checkoutBtn.click();
*/
  if (window.ICCHA_OPEN_CHECKOUT) {
    window.ICCHA_OPEN_CHECKOUT();
  }
};


  // ✅ Product Details tab uses admin “details”
  document.getElementById("tab-details").innerHTML = `
    <div class="product-details-content">
      ${p.details ? p.details : "No additional details available."}
    </div>
  `;

// =========================
// Load Similar Products
// =========================

try {
  fetch("/api/products")
  .then(res => res.json())
  .then(allProducts => {

    const similar = allProducts
     // .filter(item => item.category === p.category && item.id !== p.id)
      .filter(item => item.brand === p.brand && item.id !== p.id)
      .slice(0, 4);

    const container = document.getElementById("similarProducts");
    container.innerHTML = similar.length
    ? ""
    : `<div class="muted">No similar products available.</div>`;

    similar.forEach(item => {

      const mrp = Number(item.mrp || 0);
      const offer = Number(item.offerPrice || 0);
      const finalPrice = offer > 0 && offer < mrp ? offer : mrp;

      container.innerHTML += `
<div class="product-card" onclick="location.href='product.html?id=${item.id}'">

  <div class="product-media">
    <img src="${item.images?.[0] || ''}" alt="${item.name}">
  </div>

  <div class="product-body">
    <h3 class="product-title">${item.name}</h3>

    <div class="price">
      ₹${finalPrice}
    </div>
  </div>

</div>
`;

    });

  });
} catch (e) {
  console.log("Similar products failed:", e);
}
}

// ACCORDION TOGGLE
document.addEventListener("click", function (e) {
  const head = e.target.closest(".accordion-head");
  if (!head) return;

  const body = head.nextElementSibling;
  const isOpen = body.classList.contains("show");

  document.querySelectorAll(".accordion-body").forEach(b => b.classList.remove("show"));
  document.querySelectorAll(".accordion-head").forEach(h => h.classList.remove("active"));

  if (!isOpen) {
    body.classList.add("show");
    head.classList.add("active");
  }
});

// PRODUCT TABS SWITCH
document.addEventListener("click", function (e) {

  const tabBtn = e.target.closest(".tab");
  if (!tabBtn) return;

  const tabName = tabBtn.dataset.tab;

  // remove active from all tabs
  document.querySelectorAll(".tab").forEach(t => {
    t.classList.remove("active");
  });

  // remove active from all contents
  document.querySelectorAll(".tab-content").forEach(c => {
    c.classList.remove("active");
  });

  // activate clicked tab
  tabBtn.classList.add("active");

  const activeContent = document.getElementById("tab-" + tabName);
  if (activeContent) {
    activeContent.classList.add("active");
  }

});

});
