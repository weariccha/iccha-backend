# ICCHA Backend

A complete backend for your site — login/register, product listing, the
admin panel (add/edit/delete products with image uploads), and now **real
orders with Cash on Delivery and online payment (UPI/Card/Netbanking via
Razorpay)**. Built to match exactly what your existing frontend files
already call.

This server also serves your frontend files directly (see Step 3), so your
whole site — frontend and backend — runs as one deployment on one domain.
That matters because your `main.js`, `products.js`, and `shop.js` call the
API using relative paths like `fetch("/api/products")`, which only works if
both are on the same origin.

---

## What you need to sign up for first (all free to start)

1. **MongoDB Atlas** — your database. https://www.mongodb.com/cloud/atlas/register
   - Create a free (M0) cluster
   - Create a database user (username + password)
   - Under Network Access, allow access from anywhere (0.0.0.0/0) — simplest for now
   - Get your connection string (Connect → Drivers → copy the `mongodb+srv://...` URL)

2. **Cloudinary** — where product images get stored. https://cloudinary.com/users/register/free
   - After signup, your dashboard homepage shows: Cloud Name, API Key, API Secret

3. **Razorpay** — for UPI/Card/Netbanking payments. https://dashboard.razorpay.com/signup
   - Start in **Test Mode** (free, no real charges) — Settings → API Keys gives you a test Key ID and Secret
   - Switch to Live Mode (requires business KYC docs) only once you're ready for real payments

4. **Render** (or Railway) — where this backend runs. https://render.com

---

## Step 1: Add your frontend files

Copy ALL of your frontend files (every `.html` file, the `css/`, `js/`, and
`images/` folders) into a new folder here called `public/`, so it looks like:

```
iccha-backend/
  public/
    index.html
    shop.html
    ... (all your other .html files)
    css/
    js/
    images/
  server.js
  ...
```

**Then replace these specific files with the patched versions included in
this package** (they contain the real order/payment logic and the admin
security fix — your originals won't work with this backend):

| Included file | Replaces |
|---|---|
| `public_index.html` | `public/index.html` |
| `public_about.html` | `public/about.html` |
| `public_contact.html` | `public/contact.html` |
| `public_product.html` | `public/product.html` |
| `public_shop.html` | `public/shop.html` |
| `public_admin.html` | `public/admin.html` |
| `public_admin-orders.html` | `public/admin-orders.html` (**new page** — doesn't exist in your original site) |
| `public_admin_js_source.js` | `public/js/admin.js` |
| `public_admin_edit_source.html` | `public/admin-edit.html` |
| `public_main_js_source.js` | `public/js/main.js` |
| `public_products_js_source.js` | `public/js/products.js` |

(Just drop the "public_" prefix and matching extension when placing each one
— e.g. `public_main_js_source.js` becomes `public/js/main.js`.)

**Before using them**, open `public_admin_js_source.js`,
`public_admin_edit_source.html`, and `public_admin-orders.html` and change
this line in each to a password only you know:
```js
const ADMIN_KEY = "CHANGE_ME_TO_MATCH_YOUR_BACKEND_ENV";
```
Use the **exact same value** for `ADMIN_KEY` in your `.env` file (Step 2).

**Two things still need your real info** before this is truly launch-ready:
- `index.html`'s WhatsApp bubble still links to the placeholder text
  `"WHATSAPP LINK"` instead of your real WhatsApp number
- Your social media links (Instagram/Facebook/TikTok) are still placeholder text too

Send me those and I'll wire them in.

## Step 2: Set your environment variables

Copy `.env.example` to `.env` and fill in the values from Atlas, Cloudinary,
and Razorpay above, plus:
- `JWT_SECRET` — any long random string (generate one at https://generate-secret.vercel.app/32)
- `ADMIN_KEY` — must match exactly what you put in the admin files above

(SMTP/email settings can stay blank for now — password reset links will just
print to your server logs instead of emailing, until you set those up.)

## Step 3: Test it locally (recommended before deploying)

```
npm install
npm start
```
Visit `http://localhost:5000`. Try the full flow:
1. Add a product through `/admin.html` — confirm the image uploads and it shows on `/shop.html`
2. Add it to cart, go to checkout, fill in your details, and place a **Cash on Delivery** order
3. Check `/admin-orders.html` — your order should appear there
4. Try **Pay Online** too — Razorpay's test mode gives you fake card numbers to test with at
   https://razorpay.com/docs/payments/payments/test-card-upi-details/

## Step 4: Deploy to Render

1. Push this whole folder (with your `public/` files inside it) to a GitHub repo
2. On Render: New → Web Service → connect that repo
3. Build command: `npm install`
4. Start command: `npm start`
5. Add all the same environment variables from your `.env` file in Render's
   Environment settings (Render doesn't read your local `.env` file — you
   re-enter these in their dashboard)
6. Deploy — Render gives you a live URL like `https://iccha-backend.onrender.com`

## Step 5: Connect your domain

In Render, under your service's Settings → Custom Domain, add `theiccha.com`
(and `www.theiccha.com` if you want both). Render will give you DNS records
to add at wherever you registered the domain — once that propagates,
`https://theiccha.com` serves your whole live site.

## Step 6: Update config.js

Once live, send me the final URL and I'll update `config.js` to point at it
instead of the old `stepr-backend.onrender.com`.

## Step 7: Go live with real payments

Once you've tested everything in Razorpay Test Mode and it all works,
complete Razorpay's KYC/business verification to switch to Live Mode, then
swap your `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` in Render's
environment settings for your live keys (not the test ones).

---

## API reference (for your own testing)

| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | /api/auth/register | — | Create account → `{token, user}` |
| POST | /api/auth/login | — | Log in → `{token, user}` |
| GET | /api/me | Bearer token | Get current logged-in user |
| POST | /api/auth/forgot-password | — | Request reset link (not yet wired to the UI) |
| POST | /api/auth/reset-password | — | Consume reset token, set new password |
| GET | /api/products | — | List all products |
| POST | /api/products | `x-admin-key` header | Add product (multipart form, `images` field for files) |
| PUT | /api/products/:id | `x-admin-key` header | Update product (partial updates allowed) |
| DELETE | /api/products/:id | `x-admin-key` header | Delete product |
| POST | /api/orders | — | Place a Cash on Delivery order |
| POST | /api/orders/razorpay/create | — | Start an online payment |
| POST | /api/orders/razorpay/verify | — | Confirm payment, save the order |
| GET | /api/orders | `x-admin-key` header | List all orders (used by admin-orders.html) |
| PUT | /api/orders/:id | `x-admin-key` header | Update order status (processing/shipped/etc.) |

## A note on the "Forget Password?" link

Your account modal has a "Forget Password?" link, but it isn't currently
wired up to call the API — clicking it does nothing right now. The backend
endpoint (`/api/auth/forgot-password`) is ready whenever you want that
connected; just let me know and I'll wire up the click handler in `main.js`.
