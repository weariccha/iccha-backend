const express = require("express");
const Product = require("../models/Product");
const upload = require("../config/upload");
const { requireAdmin } = require("../middleware/requireAdmin");

const router = express.Router();

// GET /api/products  -> public, used by shop.html, product.html, index.html, admin panel
router.get("/", async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: "Failed to load products" });
  }
});

// POST /api/products  -> admin only, matches admin.js addProduct() FormData
router.post("/", requireAdmin, upload.array("images", 6), async (req, res) => {
  try {
    const { name, brand, mrp, offerPrice, category, gender, colors, details, description, featured, stock } =
      req.body;

    if (!name || !mrp) {
      return res.status(400).json({ error: "Name and MRP are required" });
    }

    let sizes = [];
    try {
      sizes = req.body.sizes ? JSON.parse(req.body.sizes) : [];
    } catch {
      sizes = [];
    }

    const images = (req.files || []).map((f) => f.path); // Cloudinary secure URL

    if (!images.length) {
      return res.status(400).json({ error: "Please select at least one image" });
    }

    const hasStock = stock !== undefined && stock !== "" && stock !== null;
    const stockCount = hasStock ? Math.max(0, Number(stock)) : null;

    const product = await Product.create({
      name,
      brand: brand || "",
      mrp: Number(mrp),
      offerPrice: offerPrice ? Number(offerPrice) : 0,
      category: category || "",
      gender: gender || "",
      sizes,
      colors: colors || "",
      details: details || "",
      description: description || "",
      featured: featured === "true" || featured === true,
      stock: stockCount,
      soldOut: hasStock ? stockCount <= 0 : false,
      images,
    });

    res.status(201).json(product);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to add product" });
  }
});

// PUT /api/products/:id  -> admin only. Used for both full edits (admin-edit.html)
// and quick toggles like "mark sold out" (admin-products.html), so this accepts
// a partial body and only updates whatever fields are actually sent.
router.put("/:id", requireAdmin, async (req, res) => {
  try {
    const updates = { ...req.body };

    // admin-edit.html currently sends "shortDescription" instead of "description" —
    // this line makes sure it still lands in the right field either way.
    if (updates.shortDescription !== undefined && updates.description === undefined) {
      updates.description = updates.shortDescription;
      delete updates.shortDescription;
    }

    if (updates.mrp !== undefined) updates.mrp = Number(updates.mrp);
    if (updates.offerPrice !== undefined) updates.offerPrice = Number(updates.offerPrice);

    // Stock tracking is optional — an empty string means "stop tracking stock
    // for this product" (falls back to the manual Sold Out toggle instead).
    if (updates.stock !== undefined) {
      if (updates.stock === "" || updates.stock === null) {
        updates.stock = null;
      } else {
        updates.stock = Math.max(0, Number(updates.stock));
        // Only auto-flip soldOut here if the request didn't already specify
        // it explicitly (e.g. the admin's manual "Mark Sold Out" toggle).
        if (updates.soldOut === undefined) {
          updates.soldOut = updates.stock <= 0;
        }
      }
    }

    if (updates.sizes !== undefined && typeof updates.sizes === "string") {
      try {
        updates.sizes = JSON.parse(updates.sizes);
      } catch {
        delete updates.sizes;
      }
    }

    const product = await Product.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });

    if (!product) return res.status(404).json({ error: "Product not found" });
    res.json(product);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update product" });
  }
});

// DELETE /api/products/:id  -> admin only
router.delete("/:id", requireAdmin, async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ error: "Product not found" });
    res.json({ message: "Product deleted" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete product" });
  }
});

module.exports = router;
