const API = typeof API_BASE !== "undefined" ? API_BASE : "";

let selectedSizes = new Set();

let selectedImages = [];

document.addEventListener("DOMContentLoaded", () => {

  // SIZE CLICK HANDLER
  document.querySelectorAll(".size-pill").forEach(pill => {
    pill.addEventListener("click", () => {
      const size = pill.dataset.size;

      if (selectedSizes.has(size)) {
        selectedSizes.delete(size);
        pill.classList.remove("active");
      } else {
        selectedSizes.add(size);
        pill.classList.add("active");
      }
    });
  });

  // IMAGE HANDLER (FIXED)
  const imageInput = document.getElementById("images");
  const imageList = document.getElementById("imageList");

  if (imageInput) {
    imageInput.addEventListener("change", function () {

      const newFiles = Array.from(this.files);
      if (!newFiles.length) return;

      newFiles.forEach(file => {
        selectedImages.push(file);
      });

      renderImageList();

      // Reset input so we can select again
      this.value = "";
    });
  }

  // ADD PRODUCT BUTTON
  const addBtn = document.getElementById("addBtn");
  if (addBtn) {
    addBtn.addEventListener("click", addProduct);
  }

function renderImageList() {

  const imageList = document.getElementById("imageList");
  if (!imageList) return;

  imageList.innerHTML = "";

  selectedImages.forEach((file, index) => {

    const item = document.createElement("div");
    item.style.display = "inline-flex";
    item.style.alignItems = "center";
    item.style.gap = "8px";
    item.style.marginRight = "10px";
    item.style.marginBottom = "8px";
    item.style.background = "#1a1d2a";
    item.style.padding = "6px 10px";
    item.style.borderRadius = "6px";
    item.style.fontSize = "14px";

    const name = document.createElement("span");
    name.textContent = file.name;

    const removeBtn = document.createElement("span");
    removeBtn.textContent = "✕";
    removeBtn.style.cursor = "pointer";
    removeBtn.style.color = "#ff4d4d";
    removeBtn.style.fontWeight = "bold";

    removeBtn.onclick = () => {
      selectedImages.splice(index, 1);
      renderImageList();
    };

    item.appendChild(name);
    item.appendChild(removeBtn);
    imageList.appendChild(item);
  });
}

});


async function addProduct() {

  const name = document.getElementById("name").value.trim();
  const brand = document.getElementById("brand").value;
  const mrp = document.getElementById("mrp").value;
  const offerPrice = document.getElementById("offerPrice").value;

  const category = document.getElementById("category").value;

  const gender = document.getElementById("gender").value;
  const colors = document.getElementById("colors").value.trim();
  const details = document.getElementById("details").value.trim();
  const description = document.getElementById("description").value.trim();
  const featured = document.getElementById("featured").checked;
  const msg = document.getElementById("msg");

  if (!category) {
  msg.innerText = "Please select category";
  return;
}

  if (!name || !mrp) {
	msg.innerText = "Name and MRP required";
  	return;
  }
  if (!selectedImages.length) {
    msg.innerText = "Please select at least one image";
    return;
  }

  const formData = new FormData();
  formData.append("name", name);
  formData.append("brand", brand);
  formData.append("mrp", mrp);
  formData.append("offerPrice", document.getElementById("offerPrice").value);
  formData.append("category", category);
  formData.append("gender", gender);
  formData.append("sizes", JSON.stringify(Array.from(selectedSizes)));
  formData.append("colors", colors);
  formData.append("details", details);
  formData.append("description", description);
  formData.append("featured", featured ? "true" : "false");

selectedImages.forEach(file => {
  formData.append("images", file);
});

  try {
    const res = await fetch(API + "/api/products", {
      method: "POST",
      headers: adminAuthHeader(),
      body: formData
    });

    const data = await res.json();

    if (!res.ok) {
      msg.innerText = data.error || "Upload failed";
      return;
    }

    msg.innerText = "✅ Product added successfully";

    // CLEAR FORM
    document.getElementById("name").value = "";
    document.getElementById("brand").value = "";
    document.getElementById("mrp").value = "";
    document.getElementById("offerPrice").value = "";
    document.getElementById("category").value = "";
    document.getElementById("gender").value = "";
    document.getElementById("colors").value = "";
    document.getElementById("details").value = "";
    document.getElementById("description").value = "";
    document.getElementById("images").value = "";

    selectedSizes.clear();
    document.querySelectorAll(".size-pill").forEach(p => p.classList.remove("active"));

    selectedImages = [];

  } catch (err) {
    msg.innerText = "Server error";
    console.error(err);
  }
}

async function loadProducts() {
  const res = await fetch(API + "/api/products");
  const products = await res.json();

  const container = document.getElementById("productList");
  if (!container) return; // prevents error

  container.innerHTML = "";

  products.forEach(p => {
    container.innerHTML += `
      <div style="margin-bottom:10px; border:1px solid #444; padding:10px;">
	<strong>${p.name}</strong><br>
	MRP: ₹${p.mrp || "-"}<br>
	Offer: ₹${p.offerPrice || p.price}<br>
        <button onclick="deleteProduct('${p.id}')" 
          style="background:red; margin-left:10px;">
          Delete
        </button>
      </div>
    `;
  });
}

async function deleteProduct(id) {
  if (!confirm("Delete this product?")) return;

  await fetch(API + "/api/products/" + id, {
    method: "DELETE",
    headers: adminAuthHeader()
  });

  loadProducts();
}
async function toggleSold(id, currentStatus) {
  await fetch(API + "/api/products/" + id, {
    method: "PUT",
    headers: Object.assign({ "Content-Type": "application/json" }, adminAuthHeader()),
    body: JSON.stringify({
      soldOut: !currentStatus
    })
  });

  loadProducts();
}
