const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema(
  {
    productId: { type: String, default: "" },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    qty: { type: Number, required: true },
    size: { type: String, default: "" },
    color: { type: String, default: "" },
    img: { type: String, default: "" },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    customerName: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, default: "" },
    address: { type: String, required: true },

    items: { type: [orderItemSchema], required: true },
    total: { type: Number, required: true },

    paymentMethod: { type: String, enum: ["cod", "online"], required: true },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed"],
      default: "pending",
    },

    // Only populated for online payments
    razorpayOrderId: { type: String, default: "" },
    razorpayPaymentId: { type: String, default: "" },

    orderStatus: {
      type: String,
      enum: ["received", "processing", "shipped", "delivered", "cancelled"],
      default: "received",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);
