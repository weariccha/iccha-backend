const express = require("express");
const Address = require("../models/Address");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

function validateAddressBody(body) {
  const { fullName, phone, addressLine1, city, state, pincode } = body;
  if (!fullName || !phone || !addressLine1 || !city || !state || !pincode) {
    return "Please fill in name, phone, address, city, state, and pincode";
  }
  return null;
}

// GET /api/addresses -> logged-in user's saved addresses, default first
router.get("/", requireAuth, async (req, res) => {
  try {
    const addresses = await Address.find({ user: req.user.id }).sort({
      isDefault: -1,
      createdAt: -1,
    });
    res.json(addresses);
  } catch (err) {
    res.status(500).json({ error: "Failed to load addresses" });
  }
});

// POST /api/addresses -> save a new address for the logged-in user
router.post("/", requireAuth, async (req, res) => {
  try {
    const error = validateAddressBody(req.body);
    if (error) return res.status(400).json({ error });

    const { label, fullName, phone, addressLine1, addressLine2, city, state, pincode, isDefault } =
      req.body;

    const existingCount = await Address.countDocuments({ user: req.user.id });

    // If this is set as default, or it's the user's very first address,
    // clear the default flag off every other saved address first.
    if (isDefault || existingCount === 0) {
      await Address.updateMany({ user: req.user.id }, { isDefault: false });
    }

    const address = await Address.create({
      user: req.user.id,
      label: label || "Home",
      fullName,
      phone,
      addressLine1,
      addressLine2: addressLine2 || "",
      city,
      state,
      pincode,
      isDefault: isDefault === true || existingCount === 0,
    });

    res.status(201).json(address);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to save address" });
  }
});

// PUT /api/addresses/:id -> edit an address (only the owner can edit their own)
router.put("/:id", requireAuth, async (req, res) => {
  try {
    const address = await Address.findOne({ _id: req.params.id, user: req.user.id });
    if (!address) return res.status(404).json({ error: "Address not found" });

    if (req.body.isDefault === true) {
      await Address.updateMany({ user: req.user.id }, { isDefault: false });
    }

    const allowedFields = [
      "label",
      "fullName",
      "phone",
      "addressLine1",
      "addressLine2",
      "city",
      "state",
      "pincode",
      "isDefault",
    ];
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) address[field] = req.body[field];
    });

    await address.save();
    res.json(address);
  } catch (err) {
    res.status(500).json({ error: "Failed to update address" });
  }
});

// DELETE /api/addresses/:id
router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const address = await Address.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!address) return res.status(404).json({ error: "Address not found" });

    // If the deleted address was the default and other addresses remain,
    // promote the most recently added one to default so there's always
    // a sensible pre-selected choice at checkout.
    if (address.isDefault) {
      const next = await Address.findOne({ user: req.user.id }).sort({ createdAt: -1 });
      if (next) {
        next.isDefault = true;
        await next.save();
      }
    }

    res.json({ message: "Address deleted" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete address" });
  }
});

module.exports = router;
