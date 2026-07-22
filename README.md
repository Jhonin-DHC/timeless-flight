# The Aviators Watch

Luxury watch storefront built with Next.js App Router.

## Admin Dashboard

- URL: `/admin/login`
- Left navigation: **Listings**, **Search**, **Settings**
- Auth: email/password stored in MongoDB (seeded from `ADMIN_EMAIL` + `ADMIN_PASSWORD`)

## Environment

Copy `.env.example` to `.env.local` and fill in values:

```bash
MONGODB_URI=
AUTH_SECRET=
ADMIN_EMAIL=
ADMIN_PASSWORD=
EBAY_CLIENT_ID=
EBAY_CLIENT_SECRET=
EBAY_MARKETPLACE_ID=EBAY_US
CRON_SECRET=
NEXT_PUBLIC_API_BASE_URL=
NEXT_PUBLIC_STOREFRONT_CLIENT_ID=
```

## Database setup

```bash
npm run seed
```

This seeds:
- initial listings (if empty)
- default eBay search query (Rolex Steel Sports example)
- first admin user (if missing)

## R2 image uploads

Set these in `.env.local`:

```bash
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET=timeless-images
R2_PUBLIC_BASE_URL=https://images.theaviatorswatch.com
```

`R2_PUBLIC_BASE_URL` is the public bucket URL from Cloudflare R2 (Settings → Public access).

For admin video uploads (direct-to-R2), add a CORS policy on the bucket allowing `PUT` from your site origins (e.g. `https://www.theaviatorswatch.com`, `http://localhost:3000`).

Upload images in **Admin → Listings** when creating/editing a watch.

## eBay search

Search is **manual only** (no Vercel cron).

Admin UI (`/admin/search`):
- add keyword watches
- click **Run** on a single query, or **Run all enabled searches**
- review results, filter “Show only new”, mark seen

Optional CLI:

```bash
npm run search:ebay
```

Environment:
- `EBAY_CLIENT_ID` / `EBAY_CLIENT_SECRET` — App ID + Cert ID from eBay developer keyset
- `EBAY_ENV=sandbox` or `production` (Sandbox keys contain `SBX` and only work against sandbox)
- `EBAY_MARKETPLACE_ID=EBAY_US` (optional)

## Storefront Checkout Environment

Set these environment variables in `.env.local`:

```bash
NEXT_PUBLIC_API_BASE_URL=https://your-api-domain.com
NEXT_PUBLIC_STOREFRONT_CLIENT_ID=your-storefront-client-id
```

### Endpoint assumptions

This app sends checkout traffic only to storefront-scoped routes:

- `POST /storefront/{clientId}/coupon/validate`
- `POST /storefront/{clientId}/checkout`
- `POST /storefront/{clientId}/checkout/confirm` (attempted when checkout response has `checkoutId` and no direct payment URL)

### Checkout response expectations

Checkout is considered successful when response includes either:

- `paymentUrl`, or
- `paymentLink`

Either field may be top-level or nested under `data`.

### Coupon behavior

- Coupon validation uses backend response as source of truth.
- UI displays subtotal, backend-provided discount, and updated total.
- Checkout only sends `couponCode`; it does **not** send client-calculated discount amounts.
