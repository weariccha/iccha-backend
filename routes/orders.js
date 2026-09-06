const express = require("express");
const crypto = require("crypto");

const Order = require("../models/Order");
const razorpay = require("../config/razorpay");
const { requireAdmin } = require("../middleware/requireAdmin");

const router = express.Router();

function validateCustomerDetails(body) {
  const { customerName, phone, address, items, total } = body;
  if (!customerName || !phone || !address) {
    return "Name, phone, and delivery address are required";
  }
  if (!Array.isArray(items) || !items.length) {
    return "Cart is empty";
  }
  if (!total || Number(total) <= 0) {
    return "Invalid order total";
  }
  return null;
}

// POST /api/orders  -> Cash on Delivery orders. Creates the order immediately.
router.post("/", async (req, res) => {
  try {
    const error = validateCustomerDetails(req.body);
    if (error) return res.status(400).json({ error });

    const { customerName, phone, email, address, items, total } = req.body;

    const order = await Order.create({
      customerName,
      phone,
      email: email || "",
      address,
      items,
      total: Number(total),
      paymentMethod: "cod",
      paymentStatus: "pending", // collected on delivery
      orderStatus: "received",
    });

    res.status(201).json({ order });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to place order" });
  }
});

// POST /api/orders/razorpay/create  -> Step 1 of online payment.
// Creates a Razorpay order and returns what the frontend needs to open the
// Razorpay checkout widget. No ICCHA order is saved yet — that happens only
// after payment is verified below, so unpaid attempts never appear as orders.
router.post("/razorpay/create", async (req, res) => {
  try {
    if (!razorpay) {
      return res.status(503).json({
        error: "Online payments aren't set up yet. Please choose Cash on Delivery instead.",
      });
    }

    const error = validateCustomerDetails(req.body);
    if (error) return res.status(400).json({ error });

    const { total } = req.body;

    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(Number(total) * 100), // Razorpay expects paise
      currency: "INR",
      receipt: `iccha_${Date.now()}`,
    });

    res.json({
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to start payment" });
  }
});

// POST /api/orders/razorpay/verify  -> Step 2. Called after the customer
// completes payment in the Razorpay widget. Verifies the payment is genuine
// (via signature check) before saving the order as paid.
router.post("/razorpay/verify", async (req, res) => {
  try {
    if (!razorpay) {
      return res.status(503).json({
        error: "Online payments aren't set up yet. Please choose Cash on Delivery instead.",
      });
    }

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      customerName,
      phone,
      email,
      address,
      items,
      total,
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ error: "Missing payment verification details" });
    }

    const error = validateCustomerDetails(req.body);
    if (error) return res.status(400).json({ error });

    // Recreate the expected signature and compare — this is what proves the
    // payment is genuine and wasn't faked by someone calling this endpoint directly.
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ error: "Payment verification failed" });
    }

    const order = await Order.create({
      customerName,
      phone,
      email: email || "",
      address,
      items,
      total: Number(total),
      paymentMethod: "online",
      paymentStatus: "paid",
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      orderStatus: "received",
    });

    res.status(201).json({ order });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Payment verification failed" });
  }
});

// GET /api/orders  -> admin only, for the orders dashboard
router.get("/", requireAdmin, async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: "Failed to load orders" });
  }
});

// PUT /api/orders/:id  -> admin only, e.g. update orderStatus to "shipped"
router.put("/:id", requireAdmin, async (req, res) => {
  try {
    const updates = {};
    if (req.body.orderStatus) updates.orderStatus = req.body.orderStatus;
    if (req.body.paymentStatus) updates.paymentStatus = req.body.paymentStatus;

    const order = await Order.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!order) return res.status(404).json({ error: "Order not found" });
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: "Failed to update order" });
  }
});

module.exports = router;
