require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const mongoose = require("mongoose");

const authRoutes = require("./routes/auth");
const productRoutes = require("./routes/products");
const orderRoutes = require("./routes/orders");

const app = express();

// ===== CORS =====
// Only matters if you ever call this API from a different domain than the one
// serving your frontend. Since this server also serves your frontend files
// below, CORS usually won't come into play — but it's here just in case.
const allowedOrigins = (process.env.CORS_ORIGIN || "*")
  .split(",")
  .map((o) => o.trim());

app.use(
  cors({
    origin: allowedOrigins.includes("*") ? true : allowedOrigins,
    credentials: true,
  })
);

app.use(express.json());

// ===== API routes =====
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);

// ===== Serve your frontend =====
// Put all your HTML/CSS/JS/images files inside a folder named "public"
// right next to this server.js file. See README.md for exact steps.
const publicDir = path.join(__dirname, "public");
app.use(express.static(publicDir));

// Any request that isn't an API call and doesn't match a real file falls
// back to index.html (keeps things working if someone lands on a route
// like /shop without the .html, and avoids raw 404s for typos).
app.get(/^(?!\/api\/).*/, (req, res) => {
  res.sendFile(path.join(publicDir, "index.html"));
});

// ===== Error handler (so unexpected errors return JSON, not an HTML crash page) =====
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || "Server error" });
});

// ===== Connect to MongoDB, then start the server =====
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error("Missing MONGO_URI in environment variables. See .env.example.");
  process.exit(1);
}

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");
    app.listen(PORT, () => console.log(`ICCHA backend running on port ${PORT}`));
  })
  .catch((err) => {
    console.error("MongoDB connection failed:", err.message);
    process.exit(1);
  });
