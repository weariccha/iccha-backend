const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Protects admin-only routes. Expects "Authorization: Bearer <token>" from a
// user who has logged in via POST /api/auth/login AND has isAdmin: true on
// their account. This replaces the old static ADMIN_KEY header check —
// that key was hardcoded in public frontend JS, which meant anyone could
// read it and hit these endpoints directly.
async function requireAdmin(req, res, next) {
  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

    if (!token) {
      return res.status(401).json({ error: "Admin login required" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user || !user.isAdmin) {
      return res.status(403).json({ error: "Admin access required" });
    }

    req.user = { id: user._id.toString(), isAdmin: true };
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired admin session" });
  }
}

module.exports = { requireAdmin };
