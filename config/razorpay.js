const Razorpay = require("razorpay");

let razorpay = null;

if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
  razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
} else {
  // Don't crash the whole server just because online payments aren't
  // configured yet — Cash on Delivery and everything else should still work.
  // The /api/orders/razorpay/* routes check for this and respond with a
  // clear error instead of a server crash.
  console.warn(
    "[razorpay] RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET not set — online payments are disabled until these are added in your environment variables."
  );
}

module.exports = razorpay;
