// js/admin-auth.js
// Replaces the old hardcoded ADMIN_KEY approach. Admin pages now require a
// real login (same email/password system as customer accounts, just gated
// behind an isAdmin flag on the account), and every admin API call sends
// "Authorization: Bearer <token>" instead of a static key anyone could read
// out of the page source.

const ADMIN_TOKEN_KEY = "ICCHA_ADMIN_TOKEN";
const ADMIN_USER_KEY = "ICCHA_ADMIN_USER";

function getAdminToken() {
  return localStorage.getItem(ADMIN_TOKEN_KEY);
}

function getAdminUser() {
  try {
    return JSON.parse(localStorage.getItem(ADMIN_USER_KEY) || "null");
  } catch {
    return null;
  }
}

function setAdminSession(token, user) {
  localStorage.setItem(ADMIN_TOKEN_KEY, token);
  localStorage.setItem(ADMIN_USER_KEY, JSON.stringify(user));
}

function clearAdminSession() {
  localStorage.removeItem(ADMIN_TOKEN_KEY);
  localStorage.removeItem(ADMIN_USER_KEY);
}

function adminAuthHeader() {
  const token = getAdminToken();
  return token ? { Authorization: "Bearer " + token } : {};
}

// Call this at the top of every admin page. Shows a login overlay until a
// verified admin session exists; reveals the real page content only after.
function requireAdminLogin(onReady) {
  const overlay = document.getElementById("adminLoginOverlay");
  const shell = document.querySelector(".admin-shell");

  function showLogin() {
    if (overlay) overlay.hidden = false;
    if (shell) shell.style.display = "none";
  }

  function showApp() {
    if (overlay) overlay.hidden = true;
    if (shell) shell.style.display = "";
    if (typeof onReady === "function") onReady();
  }

  const token = getAdminToken();
  const user = getAdminUser();

  if (!token || !user || !user.isAdmin) {
    showLogin();
    return;
  }

  // Verify the token is still valid (not expired / not revoked) before
  // trusting it, rather than just trusting whatever's in localStorage.
  fetch((typeof API_BASE !== "undefined" ? API_BASE : "") + "/api/me", {
    headers: adminAuthHeader(),
  })
    .then(function (res) {
      if (!res.ok) throw new Error("Session expired");
      return res.json();
    })
    .then(function (data) {
      if (!data.user || !data.user.isAdmin) throw new Error("Not an admin account");
      setAdminSession(token, data.user);
      showApp();
    })
    .catch(function () {
      clearAdminSession();
      showLogin();
    });
}

function bindAdminLoginForm() {
  const form = document.getElementById("adminLoginForm");
  if (!form) return;

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    const email = document.getElementById("adminLoginEmail").value.trim();
    const password = document.getElementById("adminLoginPassword").value;
    const msg = document.getElementById("adminLoginMsg");
    const btn = document.getElementById("adminLoginBtn");

    if (!email || !password) {
      if (msg) msg.textContent = "Please enter your email and password.";
      return;
    }

    if (btn) btn.disabled = true;
    if (msg) msg.textContent = "Signing in...";

    fetch((typeof API_BASE !== "undefined" ? API_BASE : "") + "/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    })
      .then(function (res) {
        return res.json().then(function (data) {
          if (!res.ok) throw new Error(data.error || "Login failed");
          return data;
        });
      })
      .then(function (data) {
        if (!data.user.isAdmin) {
          throw new Error("This account doesn't have admin access.");
        }
        setAdminSession(data.token, data.user);
        window.location.reload();
      })
      .catch(function (err) {
        if (msg) msg.textContent = err.message;
        if (btn) btn.disabled = false;
      });
  });
}

function bindAdminLogout() {
  const btn = document.getElementById("adminLogoutBtn");
  if (!btn) return;
  btn.addEventListener("click", function () {
    clearAdminSession();
    window.location.reload();
  });
}

document.addEventListener("DOMContentLoaded", function () {
  bindAdminLoginForm();
  bindAdminLogout();
});
