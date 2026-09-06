// Run this once, from your backend's root folder, after you've registered
// a normal account on the site with the email you want to use as admin:
//
//   node scripts/makeAdmin.js youremail@example.com
//
// This is a command-line script, not a web route — it can't be triggered
// by visiting a URL, so it's safe to leave in the repo.

require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../models/User");

const email = process.argv[2];

if (!email) {
  console.log("Usage: node scripts/makeAdmin.js youremail@example.com");
  process.exit(1);
}

mongoose
  .connect(process.env.MONGO_URI)
  .then(async () => {
    const user = await User.findOneAndUpdate(
      { email: email.toLowerCase() },
      { isAdmin: true },
      { new: true }
    );

    if (!user) {
      console.log(
        `No account found for ${email}. Register a normal account on the site first, then run this again.`
      );
    } else {
      console.log(`✅ ${user.email} is now an admin.`);
    }

    process.exit(0);
  })
  .catch((err) => {
    console.error("Could not connect to the database:", err.message);
    process.exit(1);
  });
