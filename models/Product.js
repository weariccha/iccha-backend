const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    brand: { type: String, default: "" },
    mrp: { type: Number, required: true },
    offerPrice: { type: Number, default: 0 },
    category: { type: String, default: "" },
    gender: { type: String, default: "" },
    sizes: { type: [String], default: [] },
    colors: { type: String, default: "" }, // stored as "/"-separated string, matching product.html's p.colors.split("/")
    details: { type: String, default: "" },
    description: { type: String, default: "" },
    featured: { type: Boolean, default: false },
    soldOut: { type: Boolean, default: false },
    stock: { type: Number, default: null }, // null = stock not tracked for this product; a number = auto sold-out at 0
    images: { type: [String], default: [] }, // Cloudinary URLs
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.id = ret._id.toString(); // frontend reads p.id everywhere
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

module.exports = mongoose.model("Product", productSchema);
