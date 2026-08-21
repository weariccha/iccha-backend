const jwt = require("jsonwebtoken");

// Verifies the Bearer token sent from the frontend (see api.js -> getMe()).
// Attaches the decoded { id } payload to req.user so routes can use it.
function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

// Simple shared-secret gate for admin-only actions (add/edit/delete products).
// Your current admin.html has no login screen of its own, so for now this checks
// a fixed key instead of a full admin user system. See README for how this works
// and how to tighten it later.
function requireAdminKey(req, res, next) {
  const key = req.headers["x-admin-key"];
  if (!process.env.ADMIN_KEY) {
    return res.status(500).json({ error: "Server missing ADMIN_KEY configuration" });
  }
  if (key !== process.env.ADMIN_KEY) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}

module.exports = { requireAuth, requireAdminKey };
