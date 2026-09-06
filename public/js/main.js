// js/main.js — CLEAN VERSION (ICCHA)
// Cart drawer + checkout + account modal/menu + hero slider + search + WhatsApp bubble

(() => {
  "use strict";

  // ---------- helpers ----------
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const money = (n) => `₹${Number(n || 0).toFixed(0)}`;

  // LocalStorage keys
  const LS_CART = "iccha_cart_v1";
  const LS_USER = "ICCHA_USER";
  const LS_TOKEN = "ICCHA_TOKEN";

  // ---------- CART STATE ----------
  function readCart() {
    try {
      const raw = localStorage.getItem(LS_CART);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  }

  function writeCart(items) {
    localStorage.setItem(LS_CART, JSON.stringify(items));
    updateCartBadge();
  }

  function cartCount(items = readCart()) {
    return items.reduce((sum, it) => sum + (Number(it.qty) || 0), 0);
  }

  function cartSubtotal(items = readCart()) {
    return items.reduce((sum, it) => sum + (Number(it.qty) || 0) * (Number(it.price) || 0), 0);
  }

  function addToCart(item, qty = 1) {
    const items = readCart();
    const q = Math.max(1, Number(qty) || 1);

    const key = `${item.id || item.name}__${item.price || ""}__${item.size || ""}__${item.color || ""}`;

    const idx = items.findIndex((x) => {
      const k = `${x.id || x.name}__${x.price || ""}__${x.size || ""}__${x.color || ""}`;
      return k === key;
    });

    if (idx >= 0) {
        items[idx].qty = (Number(items[idx].qty) || 0) + q;

    }
    else {
        var newItem = Object.assign({}, item);
        newItem.qty = q;
        items.push(newItem);

    }
    writeCart(items);

  }


  function removeFromCart(index) {
    const items = readCart();
    items.splice(index, 1);
    writeCart(items);
    renderCart();
  }

  function setQty(index, qty) {
    const items = readCart();
    if (!items[index]) return;
    const q = Math.max(1, Number(qty) || 1);
    items[index].qty = q;
    writeCart(items);
    renderCart();
  }

  // ---------- USER STATE ----------
  function getUser() {
    try {
      return JSON.parse(localStorage.getItem(LS_USER) || "null");
    } catch (e) {
      return null;
    }
  }

  function setUser(token, user) {
    if (token) localStorage.setItem(LS_TOKEN, token);
    if (user) localStorage.setItem(LS_USER, JSON.stringify(user));
  }

  function clearUser() {
    localStorage.removeItem(LS_TOKEN);
    localStorage.removeItem(LS_USER);
  }

  function resetToLoginView() {
  const registerBlock = document.getElementById("registerBlock");
  const goRegisterBtn = document.getElementById("goRegisterBtn");
  const title = document.getElementById("accountTitle");

  if (registerBlock) registerBlock.hidden = true;
  if (goRegisterBtn) goRegisterBtn.style.display = "inline";
  if (title) title.textContent = "Login";
}


  // ---------- UI ELEMENTS ----------
  function els() {
    return {
      overlay: $("#icchaOverlay"),
      cartDrawer: $("#cartDrawer"),
      cartItems: $("#cartItems"),
      cartSubtotal: $("#cartSubtotal"),
      checkoutBtn: $("#checkoutBtn"),

      accountModal: $("#accountModal"),
      accountLoggedOut: $("#accountLoggedOut"),
      accountLoggedIn: $("#accountLoggedIn"),
      loginBtn: $("#loginBtn"),
      logoutBtn: $("#logoutBtn"),
      registerBtn: $("#registerBtn"),
      goRegisterBtn: $("#goRegisterBtn"),
      registerBlock: $("#registerBlock"),

      profileName: $("#profileName"),
      profileEmail: $("#profileEmail"),

      accountMenu: $("#accountMenu"),
      menuHello: $("#accountHello"),
      menuName: $("#menuName"),
      menuEmail: $("#menuEmail"),
      closeAccountMenu: $("#closeAccountMenu"),
      menuLogout: $("#menuLogout"),

      checkoutModal: $("#checkoutModal"),
      checkoutTotal: $("#checkoutTotal"),
      bankDetails: $("#bankDetails"),
      bankConfirmBtn: $("#bankConfirmBtn"),
    };
  }

  function showOverlay() {
    const { overlay } = els();
    if (overlay) overlay.hidden = false;
  }

  function hideOverlayIfNothingOpen() {
    const { overlay, cartDrawer, accountModal, checkoutModal, accountMenu } = els();
    if (!overlay) return;

    const cartOpen = cartDrawer && !cartDrawer.hidden;
    const accOpen = accountModal && !accountModal.hidden;
    const checkOpen = checkoutModal && !checkoutModal.hidden;
    const menuOpen = accountMenu && !accountMenu.hidden;

    if (!cartOpen && !accOpen && !checkOpen && !menuOpen) overlay.hidden = true;
  }

  // ---------- CART DRAWER ----------
  function openCart() {
  closeAccountModal();
  hideAccountMenu();
  closeCheckout();

  const { cartDrawer } = els();
  if (!cartDrawer) return;

  cartDrawer.hidden = false;
  showOverlay();
  requestAnimationFrame(() => cartDrawer.classList.add("open"));
  renderCart();
}


  function closeCart() {
  const { cartDrawer } = els();
  if (!cartDrawer) return;

  cartDrawer.classList.remove("open");

  setTimeout(() => {
    cartDrawer.hidden = true;
    hideOverlayIfNothingOpen();
  }, 250);
}


  function renderCart() {
    const { cartItems, cartSubtotal: subEl, checkoutBtn } = els();
    if (!cartItems) return;

    const items = readCart();
    if (subEl) subEl.textContent = money(cartSubtotal(items));

    if (!items.length) {
      cartItems.innerHTML = `
        <div class="empty-state">
          <div class="empty-title">Your cart is empty</div>
          <div class="muted">Add a pair you like — and check out in seconds.</div>
        </div>
      `;
      if (checkoutBtn) checkoutBtn.disabled = true;
      return;
    }

    if (checkoutBtn) checkoutBtn.disabled = false;

    cartItems.innerHTML = items
      .map(
        (it, idx) => `
        <div class="cart-row">
          <img class="cart-thumb" src="${it.img || ""}" alt="">
          <div class="cart-meta">
            <div class="cart-name">${it.name || "Item"}</div>
            <div class="muted small">
            ${money(it.price)} • <button class="link" type="button" data-remove="${idx}">Remove</button>

            ${it.size ? "Size: " + it.size : ""}
            ${it.color ? " • Color: " + it.color : ""}

            </div>
            <div class="qty-row">
              <button class="qty-btn" type="button" data-dec="${idx}">−</button>
              <input class="qty-input" type="number" min="1" value="${Number(it.qty) || 1}" data-qty="${idx}">
              <button class="qty-btn" type="button" data-inc="${idx}">+</button>
            </div>
          </div>
          <div class="cart-line">${money((Number(it.qty) || 1) * (Number(it.price) || 0))}</div>
        </div>
      `
      )
      .join("");

    // events
    cartItems.onclick = (e) => {
      const rm = e.target.closest("[data-remove]");
      if (rm) return removeFromCart(Number(rm.getAttribute("data-remove")));

      const dec = e.target.closest("[data-dec]");
      if (dec) {
        const i = Number(dec.getAttribute("data-dec"));
        const items = readCart();
        const cur = items[i] ? Number(items[i].qty) || 1 : 1;
        return setQty(i, Math.max(1, cur - 1));
      }

      const inc = e.target.closest("[data-inc]");
      if (inc) {
        const i = Number(inc.getAttribute("data-inc"));
        const items = readCart();
        const cur = items[i] ? Number(items[i].qty) || 1 : 1;
        return setQty(i, cur + 1);
      }
    };

    cartItems.oninput = (e) => {
      const inp = e.target.closest("[data-qty]");
      if (!inp) return;
      const i = Number(inp.getAttribute("data-qty"));
      setQty(i, inp.value);
    };
  }

  function updateCartBadge() {
    const cartBtn = document.querySelector('button[aria-label="Cart"]');
    if (!cartBtn) return;

    const count = cartCount();
    let badge = cartBtn.querySelector(".cart-badge");
    if (!badge) {
      badge = document.createElement("span");
      badge.className = "cart-badge";
      cartBtn.appendChild(badge);
    }
    badge.textContent = String(count);
    badge.hidden = count === 0;
  }

  function openCheckout() {
  const { checkoutModal, checkoutTotal } = els();

  let items = [];

  const instant = sessionStorage.getItem("ICCHA_INSTANT_BUY");

  if (instant) {
    items = JSON.parse(instant);
  } else {
    items = readCart();
  }

  if (!items.length) {
    openCart();
    return;
  }

  const total = items.reduce((sum, it) =>
    sum + (Number(it.qty) || 0) * (Number(it.price) || 0),
  0);

  if (checkoutTotal) checkoutTotal.textContent = money(total);

  const msgEl = document.getElementById("checkoutMsg");
  if (msgEl) msgEl.textContent = "";

  loadCheckoutAddresses();

  if (checkoutModal) checkoutModal.hidden = false;
  showOverlay();
}

  function closeCheckout() {
    const { checkoutModal } = els();
    if (checkoutModal) checkoutModal.hidden = true;
    hideOverlayIfNothingOpen();
  }

  // Real checkout: COD saves an order via the backend; Online opens Razorpay
  // and verifies payment before the order is saved.
  function bindCheckoutButtons() {
    const { checkoutModal, bankDetails, bankConfirmBtn } = els();
    if (!checkoutModal) return;

    const showNewBtn = document.getElementById("showNewAddressFormBtn");
    if (showNewBtn) {
      showNewBtn.addEventListener("click", function () {
        showCheckoutManualForm(true);
      });
    }

    function getCheckoutItems() {
      const instant = sessionStorage.getItem("ICCHA_INSTANT_BUY");
      return instant ? JSON.parse(instant) : readCart();
    }

    function getCheckoutTotal(items) {
      return items.reduce(function (sum, it) {
        return sum + (Number(it.qty) || 0) * (Number(it.price) || 0);
      }, 0);
    }

    function buildOrderItems(items) {
      return items.map(function (it) {
        return {
          productId: it.id || "",
          name: it.name,
          price: Number(it.price) || 0,
          qty: Number(it.qty) || 1,
          size: it.size || "",
          color: it.color || "",
          img: it.img || "",
        };
      });
    }

    function notifyWhatsapp(items, total, form) {
      let message = "ICCHA Order\n\n";
      items.forEach(function (it) {
        message += "• " + it.name + "\n";
        if (it.size) message += "   Size: " + it.size + "\n";
        if (it.color) message += "   Color: " + it.color + "\n";
        message += "   Qty: " + it.qty + " (" + money(it.price) + ")\n\n";
      });
      message += "Total: " + money(total) + "\n";
      message += "Deliver to: " + form.customerName + ", " + form.phone + "\n";
      message += form.address;
      window.open("https://wa.me/918113827612?text=" + encodeURIComponent(message), "_blank");
    }

    function finishSuccessfulOrder(msgEl) {
      writeCart([]);
      sessionStorage.removeItem("ICCHA_INSTANT_BUY");
      if (msgEl) msgEl.textContent = "✅ Order placed successfully!";
      setTimeout(function () {
        closeCheckout();
        closeCart();
        if (msgEl) msgEl.textContent = "";
      }, 1800);
    }

    checkoutModal.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-pay]");
      if (!btn) return;

      const type = btn.getAttribute("data-pay");
      const msgEl = document.getElementById("checkoutMsg");

      if (type === "bank") {
        if (bankDetails) bankDetails.hidden = false;
        return;
      }

      if (type !== "cod" && type !== "online") return;

      const items = getCheckoutItems();
      if (!items.length) {
        if (msgEl) msgEl.textContent = "Your cart is empty.";
        return;
      }

      const form = getCheckoutFormValues();
      const error = validateCheckoutForm(form);
      if (error) {
        if (msgEl) msgEl.textContent = error;
        return;
      }

      const total = getCheckoutTotal(items);
      const orderItems = buildOrderItems(items);

      btn.disabled = true;
      if (msgEl) msgEl.textContent = "Placing your order...";

      if (type === "cod") {
        apiPost("/api/orders", {
          customerName: form.customerName,
          phone: form.phone,
          email: form.email,
          address: form.address,
          items: orderItems,
          total: total,
        })
          .then(function () {
            return maybeSaveCheckoutAddress(form);
          })
          .then(function () {
            notifyWhatsapp(items, total, form);
            finishSuccessfulOrder(msgEl);
          })
          .catch(function (err) {
            if (msgEl) msgEl.textContent = err.message || "Could not place order. Please try again.";
          })
          .finally(function () {
            btn.disabled = false;
          });
        return;
      }

      // ----- ONLINE PAYMENT (Razorpay) -----
      apiPost("/api/orders/razorpay/create", {
        customerName: form.customerName,
        phone: form.phone,
        email: form.email,
        address: form.address,
        items: orderItems,
        total: total,
      })
        .then(function (data) {
          btn.disabled = false;

          if (typeof Razorpay === "undefined") {
            if (msgEl) msgEl.textContent = "Payment could not be started. Please try again.";
            return;
          }

          const rzp = new Razorpay({
            key: data.keyId,
            amount: data.amount,
            currency: data.currency,
            order_id: data.razorpayOrderId,
            name: "ICCHA",
            description: "Order Payment",
            prefill: {
              name: form.customerName,
              contact: form.phone,
              email: form.email || "",
            },
            theme: { color: "#6b0015" },
            handler: function (response) {
              if (msgEl) msgEl.textContent = "Verifying payment...";

              apiPost("/api/orders/razorpay/verify", {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                customerName: form.customerName,
                phone: form.phone,
                email: form.email,
                address: form.address,
                items: orderItems,
                total: total,
              })
                .then(function () {
                  return maybeSaveCheckoutAddress(form);
                })
                .then(function () {
                  finishSuccessfulOrder(msgEl);
                })
                .catch(function (err) {
                  if (msgEl) msgEl.textContent = err.message || "Payment verification failed. Please contact support.";
                });
            },
            modal: {
              ondismiss: function () {
                if (msgEl) msgEl.textContent = "Payment cancelled.";
              },
            },
          });

          rzp.open();
        })
        .catch(function (err) {
          btn.disabled = false;
          if (msgEl) msgEl.textContent = err.message || "Could not start payment. Please try again.";
        });
    });

    if (bankConfirmBtn) {
      bankConfirmBtn.addEventListener("click", () => {
        alert("Thanks! We'll verify your transfer. (Placeholder)");
        closeCheckout();
        closeCart();
      });
    }
  }

  // ---------- ACCOUNT ----------
  function openAccountModal() {
  closeCart();
  closeCheckout();

  const { accountModal } = els();
  if (!accountModal) return;

  showLoginView();   // 👈 IMPORTANT
  accountModal.hidden = false;
  showOverlay();
  refreshAccountUI();
}

  function closeAccountModal() {
    const { accountModal } = els();
    if (accountModal) accountModal.hidden = true;
    hideOverlayIfNothingOpen();

    // Reset back to the main account view for next time it's opened
    const panel = document.getElementById("accountAddresses");
    const addForm = document.getElementById("addAddressForm");
    const loggedIn = document.getElementById("accountLoggedIn");
    if (panel) panel.hidden = true;
    if (addForm) addForm.hidden = true;
    if (loggedIn && getUser()) loggedIn.hidden = false;
  }

  function showAccountMenu() {
    const { accountMenu } = els();
    if (!accountMenu) return;
    accountMenu.hidden = false;
    refreshAccountUI();
    showOverlay();
  }

  function hideAccountMenu() {
    const { accountMenu } = els();
    if (accountMenu) accountMenu.hidden = true;
    hideOverlayIfNothingOpen();
  }

  function refreshAccountUI() {
    const u = getUser();
    const {
      accountLoggedOut,
      accountLoggedIn,
      profileName,
      profileEmail,
      menuHello,
      menuName,
      menuEmail,
    } = els();

    if (u) {
      if (accountLoggedOut) accountLoggedOut.hidden = true;
      if (accountLoggedIn) accountLoggedIn.hidden = false;

      if (profileName) profileName.textContent = u.name || "Customer";
      if (profileEmail) profileEmail.textContent = u.email || "";

      if (menuHello) menuHello.textContent = `Hello, ${u.name || "Customer"}!`;
      if (menuName) menuName.textContent = u.name || "Customer";
      if (menuEmail) menuEmail.textContent = u.email || "";
    } else {
      if (accountLoggedIn) accountLoggedIn.hidden = true;
      if (accountLoggedOut) accountLoggedOut.hidden = false;

      if (menuHello) menuHello.textContent = "Hello!";
      if (menuName) menuName.textContent = "—";
      if (menuEmail) menuEmail.textContent = "—";
    }
  }

function apiPost(path, data) {

  return fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  })
    .then(function (res) {
      return res
        .json()
        .catch(function () {
          return {};
        })
        .then(function (json) {
          if (!res.ok) {
            throw new Error(json.error || "Request failed");
          }
          return json;
        });
    });

}

// ---------- AUTHENTICATED API HELPER (for the address book) ----------
function getToken() {
  return localStorage.getItem(LS_TOKEN);
}

function apiAuth(path, method, data) {
  const token = getToken();
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = "Bearer " + token;

  return fetch(path, {
    method: method,
    headers: headers,
    body: data !== undefined ? JSON.stringify(data) : undefined,
  }).then(function (res) {
    return res
      .json()
      .catch(function () {
        return {};
      })
      .then(function (json) {
        if (!res.ok) {
          throw new Error(json.error || "Request failed");
        }
        return json;
      });
  });
}

// ---------- ADDRESS BOOK (shared: account modal + checkout) ----------
function formatAddressLine(addr) {
  const parts = [addr.addressLine1];
  if (addr.addressLine2) parts.push(addr.addressLine2);
  parts.push(addr.city + ", " + addr.state + " - " + addr.pincode);
  return parts.join(", ");
}

function renderAddressCard(addr, opts) {
  opts = opts || {};
  const el = document.createElement("div");
  el.className = "address-card";
  el.dataset.id = addr.id;

  let html =
    '<span class="address-card-label">' + (addr.label || "Home") + "</span>" +
    (addr.isDefault ? '<span class="address-card-default">Default</span>' : "") +
    '<div class="address-card-name">' + addr.fullName + " • " + addr.phone + "</div>" +
    '<div class="address-card-detail">' + formatAddressLine(addr) + "</div>";

  if (opts.showActions) {
    html +=
      '<div class="address-card-actions">' +
      (!addr.isDefault ? '<button type="button" data-set-default="' + addr.id + '">Set as default</button>' : "") +
      '<button type="button" class="danger" data-delete-address="' + addr.id + '">Delete</button>' +
      "</div>";
  }

  el.innerHTML = html;
  return el;
}

function openAddressesPanel() {
  const loggedIn = document.getElementById("accountLoggedIn");
  const panel = document.getElementById("accountAddresses");
  if (loggedIn) loggedIn.hidden = true;
  if (panel) panel.hidden = false;
  loadAddressBook();
}

function backToAccountMain() {
  const loggedIn = document.getElementById("accountLoggedIn");
  const panel = document.getElementById("accountAddresses");
  if (panel) panel.hidden = true;
  if (loggedIn) loggedIn.hidden = false;
}

function clearAddAddressForm() {
  ["addrLabel", "addrFullName", "addrPhone", "addrLine1", "addrLine2", "addrCity", "addrState", "addrPincode"].forEach(
    function (id) {
      const el = document.getElementById(id);
      if (el) el.value = "";
    }
  );
  const def = document.getElementById("addrIsDefault");
  if (def) def.checked = false;
}

function loadAddressBook() {
  const list = document.getElementById("addressBookList");
  const msg = document.getElementById("addressBookMsg");
  if (!list) return;

  list.innerHTML = '<p class="muted small">Loading...</p>';
  if (msg) msg.textContent = "";

  apiAuth("/api/addresses", "GET")
    .then(function (addresses) {
      list.innerHTML = "";
      if (!addresses.length) {
        list.innerHTML = '<p class="muted small">No saved addresses yet.</p>';
        return;
      }
      addresses.forEach(function (addr) {
        list.appendChild(renderAddressCard(addr, { showActions: true }));
      });
    })
    .catch(function (e) {
      list.innerHTML = "";
      if (msg) msg.textContent = e.message;
    });
}

function bindAddressBook() {
  const addressesBtn = document.getElementById("addressesBtn");
  const backBtn = document.getElementById("backToAccountBtn");
  const showFormBtn = document.getElementById("showAddAddressFormBtn");
  const cancelBtn = document.getElementById("cancelAddAddressBtn");
  const saveBtn = document.getElementById("saveAddressBtn");
  const form = document.getElementById("addAddressForm");
  const list = document.getElementById("addressBookList");

  if (addressesBtn) {
    addressesBtn.addEventListener("click", openAddressesPanel);
  }

  if (backBtn) {
    backBtn.addEventListener("click", function () {
      if (form) form.hidden = true;
      backToAccountMain();
    });
  }

  if (showFormBtn) {
    showFormBtn.addEventListener("click", function () {
      clearAddAddressForm();
      if (form) form.hidden = false;
    });
  }

  if (cancelBtn) {
    cancelBtn.addEventListener("click", function () {
      if (form) form.hidden = true;
    });
  }

  if (saveBtn) {
    saveBtn.addEventListener("click", function () {
      const msg = document.getElementById("addressBookMsg");
      const val = function (id) {
        const el = document.getElementById(id);
        return el ? el.value.trim() : "";
      };

      const payload = {
        label: val("addrLabel") || "Home",
        fullName: val("addrFullName"),
        phone: val("addrPhone"),
        addressLine1: val("addrLine1"),
        addressLine2: val("addrLine2"),
        city: val("addrCity"),
        state: val("addrState"),
        pincode: val("addrPincode"),
        isDefault: !!(document.getElementById("addrIsDefault") || {}).checked,
      };

      if (!payload.fullName || !payload.phone || !payload.addressLine1 || !payload.city || !payload.state || !payload.pincode) {
        if (msg) msg.textContent = "Please fill in all required fields.";
        return;
      }

      apiAuth("/api/addresses", "POST", payload)
        .then(function () {
          if (form) form.hidden = true;
          loadAddressBook();
        })
        .catch(function (e) {
          if (msg) msg.textContent = e.message;
        });
    });
  }

  if (list) {
    list.addEventListener("click", function (e) {
      const delBtn = e.target.closest("[data-delete-address]");
      if (delBtn) {
        if (!confirm("Delete this address?")) return;
        apiAuth("/api/addresses/" + delBtn.getAttribute("data-delete-address"), "DELETE")
          .then(loadAddressBook)
          .catch(function (e) {
            alert(e.message);
          });
        return;
      }

      const defBtn = e.target.closest("[data-set-default]");
      if (defBtn) {
        apiAuth("/api/addresses/" + defBtn.getAttribute("data-set-default"), "PUT", { isDefault: true })
          .then(loadAddressBook)
          .catch(function (e) {
            alert(e.message);
          });
      }
    });
  }
}

// ---------- CHECKOUT: saved-address selection ----------
let selectedCheckoutAddressId = null;

function fillCheckoutFieldsFromAddress(addr) {
  const map = {
    checkoutName: addr.fullName,
    checkoutPhone: addr.phone,
    checkoutAddressLine1: addr.addressLine1,
    checkoutAddressLine2: addr.addressLine2 || "",
    checkoutCity: addr.city,
    checkoutState: addr.state,
    checkoutPincode: addr.pincode,
  };
  Object.keys(map).forEach(function (id) {
    const el = document.getElementById(id);
    if (el) el.value = map[id];
  });
}

function showCheckoutManualForm(clear) {
  selectedCheckoutAddressId = null;
  const form = document.getElementById("checkoutAddressForm");
  const saveWrap = document.getElementById("saveAddressWrap");
  if (form) form.hidden = false;
  if (saveWrap) saveWrap.hidden = !getUser();

  if (clear) {
    ["checkoutName", "checkoutPhone", "checkoutEmail", "checkoutAddressLine1", "checkoutAddressLine2", "checkoutCity", "checkoutState", "checkoutPincode"].forEach(
      function (id) {
        const el = document.getElementById(id);
        if (el) el.value = "";
      }
    );
  }

  document.querySelectorAll("#savedAddressList .address-card").forEach(function (c) {
    c.classList.remove("selected");
  });
}

function selectCheckoutAddress(addr) {
  selectedCheckoutAddressId = addr.id;
  fillCheckoutFieldsFromAddress(addr);

  const form = document.getElementById("checkoutAddressForm");
  const saveWrap = document.getElementById("saveAddressWrap");
  if (form) form.hidden = true;
  if (saveWrap) saveWrap.hidden = true;

  document.querySelectorAll("#savedAddressList .address-card").forEach(function (c) {
    c.classList.toggle("selected", c.dataset.id === addr.id);
  });
}

function loadCheckoutAddresses() {
  const section = document.getElementById("savedAddressSection");
  const list = document.getElementById("savedAddressList");
  const saveWrap = document.getElementById("saveAddressWrap");

  const u = getUser();
  if (!u) {
    if (section) section.hidden = true;
    showCheckoutManualForm(true);
    if (saveWrap) saveWrap.hidden = true; // guests can't save addresses
    return;
  }

  apiAuth("/api/addresses", "GET")
    .then(function (addresses) {
      if (!addresses.length) {
        if (section) section.hidden = true;
        showCheckoutManualForm(true);
        if (saveWrap) saveWrap.hidden = false;
        return;
      }

      if (section) section.hidden = false;
      if (list) {
        list.innerHTML = "";
        addresses.forEach(function (addr) {
          const card = renderAddressCard(addr, {});
          card.addEventListener("click", function () {
            selectCheckoutAddress(addr);
          });
          list.appendChild(card);
        });
      }

      const defaultAddr = addresses.filter(function (a) { return a.isDefault; })[0] || addresses[0];
      selectCheckoutAddress(defaultAddr);
    })
    .catch(function () {
      if (section) section.hidden = true;
      showCheckoutManualForm(true);
    });
}

function getCheckoutFormValues() {
  const val = function (id) {
    const el = document.getElementById(id);
    return el ? el.value.trim() : "";
  };

  const addressParts = [val("checkoutAddressLine1")];
  if (val("checkoutAddressLine2")) addressParts.push(val("checkoutAddressLine2"));
  addressParts.push(val("checkoutCity") + ", " + val("checkoutState") + " - " + val("checkoutPincode"));

  return {
    customerName: val("checkoutName"),
    phone: val("checkoutPhone"),
    email: val("checkoutEmail"),
    address: addressParts.join(", "),
    _raw: {
      addressLine1: val("checkoutAddressLine1"),
      addressLine2: val("checkoutAddressLine2"),
      city: val("checkoutCity"),
      state: val("checkoutState"),
      pincode: val("checkoutPincode"),
    },
  };
}

function validateCheckoutForm(form) {
  if (!form.customerName) return "Please enter your full name";
  if (!form.phone) return "Please enter your phone number";
  if (!form._raw.addressLine1) return "Please enter your address";
  if (!form._raw.city) return "Please enter your city";
  if (!form._raw.state) return "Please enter your state";
  if (!form._raw.pincode) return "Please enter your pincode";
  return null;
}

function maybeSaveCheckoutAddress(form) {
  const u = getUser();
  const saveWrap = document.getElementById("saveAddressWrap");
  const saveCheckbox = document.getElementById("saveAddressCheckbox");

  // Only save when: logged in, this was a manually-entered address (not
  // already a saved one), and the "save this address" box is checked.
  if (!u || selectedCheckoutAddressId || !saveCheckbox || !saveWrap || saveWrap.hidden || !saveCheckbox.checked) {
    return Promise.resolve();
  }

  return apiAuth("/api/addresses", "POST", {
    label: "Home",
    fullName: form.customerName,
    phone: form.phone,
    addressLine1: form._raw.addressLine1,
    addressLine2: form._raw.addressLine2,
    city: form._raw.city,
    state: form._raw.state,
    pincode: form._raw.pincode,
  }).catch(function () {
    // Non-fatal — the order itself already succeeded, so don't block on this.
  });
}
  function showRegisterView() {
  const loginBlock = document.getElementById("loginBlock");
  const loginHeading = document.getElementById("loginHeading");
  const registerBlock = document.getElementById("registerBlock");
  const title = document.getElementById("accountTitle");

  if (loginBlock) loginBlock.hidden = true;
  if (loginHeading) loginHeading.hidden = true;
  if (registerBlock) registerBlock.hidden = false;
  if (title) title.textContent = "Register";
}

function showLoginView() {
  const loginBlock = document.getElementById("loginBlock");
  const loginHeading = document.getElementById("loginHeading");
  const registerBlock = document.getElementById("registerBlock");
  const title = document.getElementById("accountTitle");

  if (loginBlock) loginBlock.hidden = false;
  if (loginHeading) loginHeading.hidden = false;
  if (registerBlock) registerBlock.hidden = true;
  if (title) title.textContent = "Login";
}

  function bindAccount() {
  const {
    loginBtn,
    logoutBtn,
    registerBtn,
    goRegisterBtn,
  } = els();

  // 👉 Switch to Register view
  if (goRegisterBtn) {
    goRegisterBtn.addEventListener("click", (e) => {
      e.preventDefault();
      showRegisterView();
    });
  }
  
  // 👉 Login
if (loginBtn) {
  loginBtn.addEventListener("click", function () {
    try {
      var emailEl = document.getElementById("loginEmail");
var passEl = document.getElementById("loginPassword");

      var email = emailEl ? emailEl.value.trim() : "";
      var password = passEl ? passEl.value.trim() : "";

      if (!email || !password) {
        alert("Enter email & password");
        return;
      }

      apiPost("/api/auth/login", { email: email, password: password })
        .then(function (out) {
          setUser(out.token, out.user);
          refreshAccountUI();
          closeAccountModal();
        })
        .catch(function (e) {
          alert(e.message);
        });
    } catch (e) {
      alert(e.message);
    }
  });
}

// 👉 Register
if (registerBtn) {
  registerBtn.addEventListener("click", function () {
    try {
      var nameEl = $("#accName");
      var emailEl = $("#accEmail");
      var passEl = $("#accPassword");

      var name = nameEl ? nameEl.value.trim() : "";
      var email = emailEl ? emailEl.value.trim() : "";
      var password = passEl ? passEl.value.trim() : "";

      if (!name || !email || !password) {
        alert("Enter name, email & password");
        return;
      }

      apiPost("/api/auth/register", {
        name: name,
        email: email,
        password: password
      })
        .then(function (out) {
          setUser(out.token, out.user);
          refreshAccountUI();
          closeAccountModal();
        })
        .catch(function (e) {
          alert(e.message);
        });
    } catch (e) {
      alert(e.message);
    }
  });
}

  // 👉 Logout (modal)
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      clearUser();
      showLoginView();
      refreshAccountUI();
      closeAccountModal();
    });
  }

  // 👉 Logout (menu)
  const { menuLogout } = els();
  if (menuLogout) {
    menuLogout.addEventListener("click", () => {
      clearUser();
      showLoginView();
      refreshAccountUI();
      hideAccountMenu();
    });
  }
  const backToLoginBtn = document.getElementById("backToLoginBtn");

if (backToLoginBtn) {
  backToLoginBtn.addEventListener("click", showLoginView);
}

// 👉 Forgot Password
const forgotPwdBtn = document.getElementById("forgotPwd");

if (forgotPwdBtn) {
  forgotPwdBtn.addEventListener("click", function (e) {
    e.preventDefault();

    var emailEl = document.getElementById("loginEmail");
    var email = emailEl ? emailEl.value.trim() : "";

    if (!email) {
      email = (prompt("Enter the email address for your account:") || "").trim();
    }

    if (!email) return;

    apiPost("/api/auth/forgot-password", { email: email })
      .then(function (out) {
        alert(out.message || "If that email exists, a reset link has been sent.");
      })
      .catch(function (e) {
        alert(e.message || "Could not process request. Please try again.");
      });
  });
}

}
    // menu close button
    const { closeAccountMenu } = els();
    if (closeAccountMenu) closeAccountMenu.addEventListener("click", hideAccountMenu);

    // click outside menu closes it
    document.addEventListener("click", (e) => {
      const { accountMenu } = els();
      if (!accountMenu || accountMenu.hidden) return;
      if (e.target.closest("#accountMenu")) return;
      if (e.target.closest("#openAccountBtn")) return;
      hideAccountMenu();
    });


  // ---------- GLOBAL CLOSES ----------
  function bindGlobalClose() {
    const { overlay } = els();
    if (overlay) {
      overlay.addEventListener("click", () => {
        closeCart();
        closeAccountModal();
        closeCheckout();
        hideAccountMenu();
      });
    }

    document.addEventListener("keydown", (e) => {
      if (e.key !== "Escape") return;
      closeCart();
      closeAccountModal();
      closeCheckout();
      hideAccountMenu();
    });

    // your close buttons with data-close
    document.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-close]");
      if (!btn) return;
      const what = btn.getAttribute("data-close");
      if (what === "cart") closeCart();
      if (what === "account") closeAccountModal();
      if (what === "checkout") closeCheckout();
    });

    // checkout button inside cart drawer
    const { checkoutBtn } = els();
    if (checkoutBtn) checkoutBtn.addEventListener("click", openCheckout);
  }


  // ---------- GLOBAL OPEN HANDLERS (CART + ACCOUNT) ----------
document.addEventListener("click", (e) => {

  const cartBtn = e.target.closest("[data-open='cart']");
  const accBtn  = e.target.closest("[data-open='account']");

  if (cartBtn) {
    e.preventDefault();
    closeAccountModal();
    hideAccountMenu();
    closeCheckout();
    openCart();
    return;
  }

  if (accBtn) {
    e.preventDefault();
    closeCart();
    closeCheckout();

    const u = getUser();
    if (u) showAccountMenu();
    else openAccountModal();
    return;
  }

});


  // ---------- HERO SLIDER ----------
  function initHero() {
    const slides = $$(".slide");
    const dotsWrap = $("#heroDots");
    if (!slides.length) return;

    let current = 0;
    let timer = null;

    function setActive(i) {
      current = (i + slides.length) % slides.length;
      slides.forEach((s, idx) => s.classList.toggle("active", idx === current));
      if (dotsWrap) {
        $$(".hero-dot", dotsWrap).forEach((d, idx) => d.classList.toggle("active", idx === current));
      }
    }

    if (dotsWrap) {
      dotsWrap.innerHTML = slides
        .map((_, idx) => `<button class="hero-dot ${idx === 0 ? "active" : ""}" type="button" data-dot="${idx}" aria-label="Go to slide ${idx + 1}"></button>`)
        .join("");

      dotsWrap.addEventListener("click", (e) => {
        const b = e.target.closest("[data-dot]");
        if (!b) return;
        const i = Number(b.getAttribute("data-dot"));
        setActive(i);
        start();
      });
    }

    function start() {
      if (timer) clearInterval(timer);
      timer = setInterval(() => setActive(current + 1), 5000);
    }

    setActive(0);
    start();
  }

  // ---------- NAV (mobile) ----------
  function initNav() {
    const toggle = $(".nav-toggle");
    const links = $("#navLinks");
    if (!toggle || !links) return;

    toggle.addEventListener("click", () => {
      const expanded = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", String(!expanded));
      links.classList.toggle("open", !expanded);
    });

    links.addEventListener("click", (e) => {
      const a = e.target.closest("a");
      if (!a) return;
      toggle.setAttribute("aria-expanded", "false");
      links.classList.remove("open");
    });
  }

  // ---------- SEARCH ----------
  function initSearch() {
    const openBtn = $("#openSearch");
    const closeBtn = $("#closeSearch");
    const panel = $("#searchPanel");
    const input = $("#searchInput");
    const resultsBox = $("#searchResults");

    if (!openBtn || !closeBtn || !panel || !input || !resultsBox) return;


    function openSearch() {
      panel.hidden = false;
      panel.style.display = "block";
      input.focus();
    }


    function closeSearch() {
      panel.hidden = true;
      panel.style.display = "none";
      resultsBox.hidden = true;
      resultsBox.innerHTML = "";
      input.value = "";
    }

    openBtn.addEventListener("click", openSearch);
    closeBtn.addEventListener("click", closeSearch);

    document.addEventListener("click", (e) => {
      if (panel.hidden) return;
      const within = e.target.closest("#headerSearch");
      if (!within) closeSearch();
    });

    var products = [];
var src = window.ICCHA_PRODUCTS || {};

for (var key in src) {
  if (src.hasOwnProperty(key)) {
    var p = src[key];
    var item = {};

    // copy properties
    for (var prop in p) {
      if (p.hasOwnProperty(prop)) {
        item[prop] = p[prop];
      }
    }

    // default url
    if (!item.url) {
      item.url = "shop.html";
    }

    products.push(item);
  }
}

    input.addEventListener("keydown", (e) => {
      if (e.key !== "Enter") return;
      const q = input.value.trim();
      if (!q) return;
      closeSearch();
      window.location.href = `shop.html?q=${encodeURIComponent(q)}`;
    });
  }

  // expose if needed
  window.ICCHA_ADD_TO_CART = addToCart;
  window.ICCHA_OPEN_CART = openCart;
  window.ICCHA_OPEN_CHECKOUT = openCheckout;

  // ---------- AUTO-CLOSE ON SCROLL ----------
(function () {
  let lastScrollY = window.scrollY;
  let ticking = false;

  function onScroll() {
    const currentY = window.scrollY;

    // Close only if user actually scrolls
    if (Math.abs(currentY - lastScrollY) > 25) {

  const { cartDrawer, accountModal, accountMenu } = els();

  if (
    (cartDrawer && !cartDrawer.hidden) ||
    (accountModal && !accountModal.hidden) ||
    (accountMenu && !accountMenu.hidden)
  ) {
    closeCart();
    closeAccountModal();
    hideAccountMenu();
    // ❗ DO NOT close checkout on scroll
  }
}
    lastScrollY = currentY;
    ticking = false;
  }

  window.addEventListener(
    "scroll",
    () => {
      if (!ticking) {
        window.requestAnimationFrame(onScroll);
        ticking = true;
      }
    },
    { passive: true }
  );
})();

// ---------- FEATURED PRODUCTS ----------
async function loadFeaturedProducts() {
  try {
    const res = await fetch("/api/products");
    const products = await res.json();

    const featured = products
  .filter(p => p.featured === true)
  .sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt))
  .slice(0,12);   // ⭐ LIMIT TO 12 PRODUCTS

    const grid = document.getElementById("featuredGrid");
    if (!grid) return; // only runs on homepage

let index = 0;

function renderProducts(){

  grid.innerHTML = "";

  //const set = featured.slice(index, index + 4);

  const set = [];

for(let i=0;i<4;i++){
  const item = featured[(index+i) % featured.length];
  if(item) set.push(item);
}

  set.forEach(p => {

    const mrp = Number(p.mrp || 0);
    const offer = Number(p.offerPrice || 0);
    const isOnSale = offer > 0 && offer < mrp;
    const finalPrice = isOnSale ? offer : mrp;

    const img = p.images?.[0]
      ? p.images[0]
      : "https://via.placeholder.com/400";


     grid.innerHTML += `
<article class="product-card">

  <div class="product-media">
    <img src="${img}" alt="${p.name}">
  </div>

  <div class="product-body">

    <h3 class="product-title">${p.name}</h3>

    <div class="price-row">
      <span class="price">₹${finalPrice}</span>
      ${isOnSale ? `<span class="price-old">₹${mrp}</span>` : ""}
    </div>

  </div>

</article>
`;
  });

  index += 4;

  if(index >= 12){
    index = 0;
  }

}

renderProducts();

setInterval(renderProducts, 5000);
} catch (err) {
    console.error("Failed to load featured products", err);
  }
}

// Intersection observer (safe)

const observer = new IntersectionObserver(
  entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
      }
    });
  },
  { threshold: 0.2 }
);

document.querySelectorAll(".split-text, .split-image")
  .forEach(el => observer.observe(el));



  // ---------- PRODUCT CARD ACTIONS ----------
document.addEventListener("click", (e) => {
  const card = e.target.closest(".product-card");
  if (!card) return;

  const product = {
    id: card.dataset.id,
    name: card.dataset.name,
    price: Number(card.dataset.price),
    img: card.dataset.img
  };

  if (e.target.classList.contains("add-to-cart")) {
    window.ICCHA_ADD_TO_CART(product);
  }

});

// ⭐ ADD THIS BLOCK HERE
document.addEventListener("DOMContentLoaded", () => {
  initHero();
  initNav();
  initSearch();
  bindGlobalClose();
  bindAccount();
  bindCheckoutButtons();
  bindAddressBook();
  updateCartBadge();
  refreshAccountUI();
  loadFeaturedProducts();
});


})();

// ===============================
// HEADER SEARCH (GLOBAL)
// ===============================
document.addEventListener("DOMContentLoaded", async () => {
  const input = document.getElementById("headerSearchInput");
  const suggestions = document.getElementById("headerSuggestions");
  const clearBtn = document.getElementById("searchClearBtn");

  console.log("[HeaderSearch] init", { input: !!input, suggestions: !!suggestions, clearBtn: !!clearBtn });

  if (!input || !suggestions) return;

  function normalize(str = "") {
    return String(str)
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();
  }

  let PRODUCTS = [];

  async function loadProducts() {
    try {
      console.log("[HeaderSearch] loading /api/products ...");
      const res = await fetch("/api/products", { cache: "no-store" });
      console.log("[HeaderSearch] /api/products status:", res.status);

      const data = await res.json();
      PRODUCTS = Array.isArray(data) ? data : [];

      console.log("[HeaderSearch] products loaded:", PRODUCTS.length);
    } catch (e) {
      console.error("[HeaderSearch] load failed:", e);
      PRODUCTS = [];
    }
  }

  await loadProducts();

  // If user already typed something before load finished, re-run suggestions
  input.dispatchEvent(new Event("input"));

  // Show/hide clear button
  function syncClear() {
    if (!clearBtn) return;
    clearBtn.style.display = input.value.trim() ? "block" : "none";
  }
  syncClear();

  input.addEventListener("input", () => {
    syncClear();

    const q = normalize(input.value);
    if (!q) {
      suggestions.innerHTML = "";
      suggestions.style.display = "none";
      return;
    }

    const matches = PRODUCTS
      .filter((p) => {
        const text = normalize((p.name || "") + " " + (p.brand || ""));
        return text.includes(q);
      })
      .slice(0, 6);

    if (!matches.length) {
      suggestions.innerHTML = `<div class="no-result">No results</div>`;
      suggestions.style.display = "block";
      return;
    }

    suggestions.innerHTML = matches
      .map(
        (p) => `
          <div class="suggestion-item" data-id="${p.id}">
            ${p.name}
          </div>
        `
      )
      .join("");

    suggestions.style.display = "block";
  });

  // Click suggestion -> product page
  suggestions.addEventListener("click", (e) => {
    const item = e.target.closest(".suggestion-item");
    if (!item) return;
    window.location.href = `product.html?id=${item.dataset.id}`;
  });

  // Enter -> go to shop with q
  input.addEventListener("keydown", (e) => {
    if (e.key !== "Enter") return;
    const value = input.value.trim();
    if (!value) return;

    // Always go via URL (no sessionStorage reload)
    window.location.href = `shop.html?q=${encodeURIComponent(value)}`;
  });

  // Click outside hides suggestions
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".search-box")) {
      suggestions.style.display = "none";
    }
  });

  // Clear button
  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      input.value = "";
      suggestions.innerHTML = "";
      suggestions.style.display = "none";
      syncClear();
      input.focus();
    });
  }
});

// ===============================
// WHATSAPP POPUP
// ===============================
const waBtn = document.getElementById("waBtn");
const waPopup = document.getElementById("waPopup");
const waClose = document.getElementById("waClose");

if (waBtn) {
  waBtn.onclick = () => {
    waPopup.classList.toggle("open");
  };
}

if (waClose) {
  waClose.onclick = () => {
    waPopup.classList.remove("open");
  };
}

// ===============================
// WhatsApp popup on scroll
// ===============================
window.addEventListener("scroll", () => {

  const waPopup = document.getElementById("waPopup");

  if (!waPopup) return;

  if (window.scrollY > 250 && !waPopup.classList.contains("opened")) {

    waPopup.classList.add("open");
    waPopup.classList.add("opened");

  }

});

