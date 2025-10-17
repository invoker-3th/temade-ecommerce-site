# Temade E‑commerce

A modern e-commerce platform built with Next.js 15, TypeScript, MongoDB, and Tailwind CSS.

## Features
- Product catalog (admin-managed), color variants, sizes, wishlist, cart
- Currency selection (₦ / $ / £) via Region dialog and Profile preferences
- Checkout with Paystack (client init + server-side webhook verification)
- Orders admin: analytics, invoices, status updates
- Lookbook admin with Cloudinary uploads and UI gallery
- New Arrivals carousel: best-seller first, then category representatives

## Tech Stack
- Next.js 15 (App Router), TypeScript, TailwindCSS
- MongoDB (native driver), Cloudinary (images hosted via URLs)
- Paystack payments with secure webhook

---

## How Paystack Works in this App
1. User completes delivery form on `/checkout` and clicks Paystack.
2. The app creates a PENDING order via `POST /api/orders` and stores `orderId` on the client (sessionStorage).
3. Paystack checkout opens (client) with `metadata.orderId` and `amount`.
4. On payment success, Paystack calls our webhook `POST /api/webhooks/paystack`.
5. Webhook verifies signature (`x-paystack-signature`) using `PAYSTACK_SECRET_KEY`, confirms the charge, and updates the order:
   - `paymentStatus = completed`
   - `orderStatus = processing`
   - attaches invoice & reference
   - creates an admin notification
6. Client shows a success overlay and clears the cart; the server remains the source of truth.

Why this is secure
- The client never marks an order as paid. Only Paystack’s webhook can confirm.
- HMAC signature verification prevents spoofed webhooks.
- Amount and reference can be validated server-side.

Webhook URL to set in Paystack Dashboard
- `https://YOUR_DOMAIN.com/api/webhooks/paystack`

Required headers handled by the app
- `x-paystack-signature: <computed by Paystack>`

---

## Lookbook – How it displays in the UI
- Admin uploads/removes images in `Admin → Lookbook` (`/admin/lookbook`).
- Backend API: `/api/lookbook` and `/api/admin/lookbook` manage Cloudinary URLs by material/section.
- Public UI page at `/lookbook` renders grouped images by material; changes in admin are reflected immediately.

---

## Getting Started (Local)
1. Install dependencies
```bash
pnpm install
```
2. Create `.env.local`
```bash
# Mongo
MONGODB_URI=mongodb+srv://<user>:<pass>@<cluster>/<db>?retryWrites=true&w=majority

# Paystack
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_xxx
PAYSTACK_SECRET_KEY=sk_test_xxx

# Admin
NEXT_PUBLIC_ADMIN_EMAILS=admin@example.com

# Optional
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```
3. Run the dev server
```bash
pnpm dev
```
4. Visit `http://localhost:3000`

---

## Environment Variables
- `MONGODB_URI` – Mongo connection string
- `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` – Paystack public key (test/live)
- `PAYSTACK_SECRET_KEY` – Paystack secret key (for webhook HMAC)
- `NEXT_PUBLIC_ADMIN_EMAILS` – Comma-separated admin emails
- `NEXT_PUBLIC_BASE_URL` – Base URL (used for notifications/webhook calls in some flows)

---

## Testing Payments (Paystack)
- Keep public/secret keys in test mode.
- Use Paystack test cards (e.g., `4084084084084081`).
- Confirm that after paying:
  - Order in admin shows `paymentStatus: completed`
  - Notification is created
  - Invoice data is attached

If payments appear as pending
- Ensure webhook is configured and reachable over HTTPS
- Verify `PAYSTACK_SECRET_KEY` is set and correct
- Check server logs for signature mismatch or amount mismatch

---

## Admin Dashboard
- `/admin` – analytics & shortcuts
- `/admin/inventory` – products & categories
- `/admin/orders` – order status, invoices (processing → shipped → delivered)
- `/admin/lookbook` – Cloudinary image management

Admin access is controlled by `NEXT_PUBLIC_ADMIN_EMAILS`.

---

## Deployment (Vercel Recommended)
1. Push your repo to GitHub.
2. Import the project in Vercel.
3. Add Environment Variables in Vercel Project Settings:
   - `MONGODB_URI`
   - `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY`
   - `PAYSTACK_SECRET_KEY`
   - `NEXT_PUBLIC_ADMIN_EMAILS`
   - `NEXT_PUBLIC_BASE_URL=https://YOUR_DOMAIN.com` (once DNS is set)
4. Deploy.

### Domain (Custom)
If you have a domain name:
- In Vercel → Domains, add your domain (e.g., `temadestore.com`).
- Follow DNS instructions to point to Vercel (set the A/ALIAS or CNAME depending on registrar support).
- Once verified, set `NEXT_PUBLIC_BASE_URL=https://temadestore.com`.
- In Paystack Dashboard, set webhook to `https://temadestore.com/api/webhooks/paystack`.

If you don’t want to point the root yet:
- Use a subdomain (e.g., `app.temadestore.com`) and set DNS CNAME to Vercel.

### Build & Runtime Notes
- Next.js App Router; no custom server required.
- Webhook route: `app/api/webhooks/paystack/route.ts`.
- Ensure HTTPS for webhook delivery.

---

## Troubleshooting
- Mongo connection errors: verify `MONGODB_URI` and IP allowlist in Atlas.
- Webhook 401/Invalid signature: confirm `PAYSTACK_SECRET_KEY` matches your Paystack account and environment.
- Orders stuck in pending: confirm webhook URL in Paystack Dashboard and that your deployment is live over HTTPS.
- Images not loading: ensure your Cloudinary URLs are correct and allowed in `next.config.js` (images domains) if using `next/image` remote patterns.

---

## Scripts
```bash
pnpm dev       # local development
pnpm build     # production build
pnpm start     # start production server (after build)
```

## License
MIT
