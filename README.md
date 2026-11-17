# Fabhouse

Property discovery and listing platform growing across African markets and beyond. Built with Next.js (App Router), TypeScript, MongoDB, NextAuth, and Tailwind.

## Live demo

[View Fabhouse on Vercel](https://fabhouse-app.vercel.app/)

## Screenshots

<p align="center">
  <img src="public/screenshots/home-light.jpg" alt="Fabhouse homepage in light mode" width="49%" />
  <img src="public/screenshots/home-dark.jpg" alt="Fabhouse homepage in dark mode" width="49%" />
</p>

### Homes that feel like home

Illustrative property photos used in the homepage design. They are not active Fabhouse listings.

<p align="center">
  <img src="public/images/homes/modern-villa.jpg" alt="Modern home under mature trees" width="32%" />
  <img src="public/images/homes/city-home.jpg" alt="Contemporary home in daylight" width="32%" />
  <img src="public/images/homes/garden-home.jpg" alt="Contemporary home at dusk" width="32%" />
</p>

Photos: [Unsplash image 1](https://images.unsplash.com/photo-1600585154340-be6161a56a0c), [image 2](https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde), [image 3](https://images.unsplash.com/photo-1600585154526-990dced4db0d). Used under the [Unsplash License](https://unsplash.com/license).

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in the required values, see below
npm run dev
```

Open http://localhost:3000.

### Required env vars (app won't work without these)
- `MONGODB_URI` — MongoDB Atlas connection string
- `NEXTAUTH_SECRET` — any random string (`openssl rand -base64 32`)
- `NEXTAUTH_URL` — `http://localhost:3000` locally, your real domain in production

### Optional env vars (features degrade gracefully without them)
- `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` / `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` — required for photo/video uploads. Configure a signed preset with allowed media formats and 10 MB photo / 100 MB video file-size limits; disable any old unsigned listing-upload preset.
- `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` — server-side only; required to sign uploads, verify media before it can be attached to a listing, and delete removed assets. Without these, listing media uploads cannot be saved.
- `RESEND_API_KEY` — without this, emails (welcome, listing approved/rejected, inquiries, password reset) are logged to your terminal instead of sent. See `lib/email.ts`.
- `CRON_SECRET` — required in Vercel to authenticate the daily listing expiry job (`/api/cron/listing-expiry`). Set a private random value in the Vercel project environment variables; reminders also require `RESEND_API_KEY` to send.
- `PAYSTACK_SECRET_KEY` — only needed once `NEXT_PUBLIC_BILLING_ENABLED=true`. Configure `/api/billing/webhook` in Paystack; use `PAYSTACK_WEBHOOK_SECRET` if Paystack gives you a separate versioned signing secret (otherwise the endpoint supports the legacy signature using `PAYSTACK_SECRET_KEY`).

### Seed sample data (optional, for local testing)

```bash
npm run seed
```

Creates:
- Admin login: `admin@fabhouse.ng` / `changeme123`
- Agent login: `agent@fabhouse.ng` / `changeme123`
- A few sample listings (one pending, so you can test `/admin`)
- Two sample inquiries on the first active listing, so you can test `/dashboard/inquiries` and replying

**Change these passwords / remove these accounts before going to production.**

### Run tests

```bash
npm run test:e2e
```

Playwright smoke tests covering homepage, browsing, pagination, registration, login, and password reset. Requires a running MongoDB pointed to by `MONGODB_URI`.

## How the site is organized

- `/` — homepage with search
- `/listings` — browse/filter listings, paginated (12 per page), partial/case-insensitive keyword search
- `/listings/[id]` — single property page; short-lets have date availability checks and signed-in guests can request a stay
- `/dashboard` — agent/developer's own listings, paginated, with edit/delete actions and inquiry counts
- `/dashboard/new` — post a new listing with photo upload
- `/dashboard/edit/[id]` — edit an existing listing (same form as new, pre-filled)
- `/dashboard/inquiries` — all inquiries across an agent's listings, with an inline reply box and requested dates/guest count for short-let enquiries
- `/dashboard/stays` — host calendar blocks, guest/host stay requests, accept/decline/cancel controls, and support-request status
- `/admin/stay-support` — triage stay support tickets and send a response by email
- `/dashboard/listings/expiry` — review and renew listings; a daily Vercel Cron sends expiry reminders, renews opted-in listings, archives expired listings, expires unpaid stay holds, and cleans up abandoned verification documents. Set `CRON_SECRET` and `RESEND_API_KEY` in Vercel to enable scheduled runs and email delivery. Existing active listings without expiry data get a 30-day grace period on the first run.
- `/admin` — admin-only overview for listing review, identity-verification requests, users, and audit history. Identity badges are granted through the review queue after an ID/CAC document is checked; they do not confirm property title or listing accuracy. Admins can suspend or unsuspend accounts; suspension blocks sign-in without deleting account data.
- `/pricing` — public pricing page
- `/billing/upgrade` — plan checkout via Paystack (inactive until billing is turned on)
- `/login` and `/register` — shared responsive auth layout with a property photograph, desktop split view, mobile welcome panel, accessible field labels, and browser autofill hints
- `/forgot-password`, `/reset-password` — password reset via emailed token link (expires in 1 hour)

## African markets and international reach

The product currently supports listing and search localization for Nigeria, Ghana, Kenya, and South Africa, with selected international currencies available for eligible listings. This is product support, not worldwide inventory or a promise that transactions can be completed in every country. Expand city by city after supply, local moderation, support, payment methods, consumer rules, tax, address formats, and privacy/terms review are ready. Keep the property details specific to each place rather than flattening local conventions:
- **Currency** defaults to the selected market (NGN, GHS, KES, or ZAR); GBP/USD are available for eligible diaspora-priced listings
- **Price qualifiers** include "Negotiable" — the term actually used in Nigerian listings — alongside the UK-style "Offers Over" / "Guide Price" options, in case you list UK property too
- **Tenure** leads with C of O and Governor's Consent (the two that matter for Nigerian land) before Freehold/Leasehold
- **Land size** is a free-text field ("2 plots", "5,000 sqm", "half hectare") rather than a forced sq ft number — Nigerian land is sold in plots and hectares as often as square meters, and forcing one unit would make agents enter meaningless numbers just to satisfy the form

## Setting yourself up as the founding agent

Since you're both the operator and, for now, the one posting real listings, here's the fastest path:

1. Register a normal account at `/register` with role **Agent** (or Developer) — this is your real, public-facing account that buyers will see and message.
2. Separately, get an **admin** account so you can review/approve listings. Easiest way: run `npm run seed` once against your real database — it creates `admin@fabhouse.ng` / `changeme123` — then **change that password immediately** from a database tool or by adding a change-password flow later.
3. In your agent account, open `/account`, upload an ID or CAC document, and submit it for review. An admin reviews it from the verification queue. The identity badge does not prove property ownership or listing accuracy.
4. After review, post real listings from `/dashboard/new` and provide clear evidence for each listing's accuracy and availability.

Admins cannot grant identity badges directly from the user list; badges follow the document-review flow. Admins also cannot suspend or change their own role from that screen, to avoid accidentally locking themselves out.

## Rightmove-style listing details

Listings now support the same core spec fields UK portals like Rightmove show:
- **Price qualifiers** — Fixed, Offers Over, Offers in Region of, Guide Price, or Price on Application (POA)
- **Price reduction tracking** — editing a listing to a lower price automatically stamps `priceReducedAt` and shows a "Reduced on DD/MM/YYYY" badge on the card and detail page
- **Size** — entered in sq ft, auto-converted and displayed in both sq ft and sq m
- **Tenure** — Freehold, Leasehold, or Nigeria-specific options (Governor's Consent, C of O)
- **Postcode** — separate field, included in the full address shown on the detail page
- **"Can you afford it?"** — a mortgage affordability calculator on the detail page (deposit %, rate, term, optional income check) for sale listings. It's a rough estimate with a disclaimer, not financial advice.
- **For Sale / To Rent** — direct header nav links, not just a filter dropdown

## Photos and videos

Agents can upload JPG, PNG, or WebP photos (up to 10 MB each) and MP4, MOV, or WebM walkthrough videos (up to 100 MB each, 3 per listing) through server-signed Cloudinary uploads into user-specific folders. Listing APIs verify the asset's Cloudinary location, media type, and size before saving it. Changing listing media sends the listing back to pending review; admin approval requires a manual review of all photos/videos. This moderation is not proof of property ownership or listing accuracy. Videos play inline on the detail page, with a "Video" badge on listing cards. Deleting or editing a listing cleans up removed videos from Cloudinary the same way it does for photos.

## Listing status

- **Pending → Active/Rejected** is admin-only, via `/admin` (the review workflow).
- **Once a listing is Active**, its owner can self-manage status from `/dashboard` — a dropdown lets them mark it **Sold** (or **Rented**, if the listing is for rent), **Withdrawn**, or back to **Active** — no admin involvement needed. Owners can't touch status while a listing is still Pending or Rejected; that stays admin-controlled.
- Non-active listings (sold/rented/withdrawn/pending/rejected) drop out of public `/listings` search automatically. If someone has a direct link to a sold/rented/withdrawn listing, the detail page shows a clear banner and hides the contact/inquiry options, instead of silently pretending it's still available.

## What happens on delete / edit

- **Deleting a listing** removes the database record and deletes its photos from Cloudinary (if `CLOUDINARY_API_KEY`/`CLOUDINARY_API_SECRET` are set), so storage doesn't quietly fill up with orphaned images.
- **Editing a listing** and removing a photo does the same cleanup for just the removed photo — untouched photos stay.

## Inquiries & replying

Buyers message agents through the inquiry form on a listing page (not a raw `mailto:` link). Each message is:
1. Saved to the database (`Inquiry` model)
2. Emailed to the listing owner immediately

Agents see all inquiries at `/dashboard/inquiries` (or filtered to one listing from the dashboard table) and can reply inline. If the buyer left an email address, the reply is emailed to them; if they left a phone number, the reply is saved for the agent's records but flagged as "not emailed" — with a nudge to call instead.

## Search

`/listings` and `/api/properties` use case-insensitive partial matching across title, description, city, state, and address — not MongoDB's stricter whole-word `$text` search. "lekk" or "3 bed lagos" will still surface relevant results instead of returning nothing.

## Free now, paid later — how it works

Everything related to charging lives behind **one flag**: `BILLING_ENABLED` in `config/features.ts`.

- **Right now**, it's `false`. Every user gets the `UNRESTRICTED_PLAN` (unlimited listings, all features unlocked). The navbar and pricing page both show an honest "free during launch" message.
- **The data model is already in place** — `User.planTier`, `Property.isFeatured` / `targetDiaspora`.
- **The enforcement logic already exists** in `lib/billing.ts` (`canPerform()`, `getEffectivePlan()`) and is already called from `POST /api/properties`.
- **The checkout flow is implemented but gated** — `/api/billing/initialize` and `/api/billing/verify` use server-set prices and persisted references; `/api/billing/webhook` verifies signed Paystack events and applies successful payment once. The endpoints return 404 while billing is off.

### When you're ready to start charging

1. Approve the Nigeria price points and support/refund process; these amounts are assumptions until agents validate them.
2. Add `PAYSTACK_SECRET_KEY`, set `NEXT_PUBLIC_BILLING_ENABLED=true`, and configure the Paystack webhook URL as `https://<your-domain>/api/billing/webhook` (plus `PAYSTACK_WEBHOOK_SECRET` if supplied).
3. Run Paystack test payments and test success/failure callbacks, duplicate webhook delivery, expiry, and support handling before accepting live payments. Each payment gives one month of access and does not auto-renew.

No listing, dashboard, or admin code needs to change when you flip the switch.

## Privacy foundations and market compliance

- **`/privacy`** and **`/terms`** — real policy pages reflecting how Fabhouse actually collects and processes data, written with the Nigeria Data Protection Act 2023 in mind. **Both are flagged in-page as drafts that need a lawyer's review before going live** — especially retention periods, international transfers, obligations under Nigeria's current data-protection framework, and the laws and regulator requirements in each new market.
- **Consent at registration** — signup requires explicitly agreeing to the Privacy Policy and Terms; this is enforced server-side (`consent: true` required by the API, not just a UI checkbox), and the acceptance is timestamped on the user record (`consentedToTermsAt`).
- **Professional identity documents** — new ID/CAC uploads use Cloudinary authenticated storage and are deleted after the admin decision. Admin access uses a short-lived signed document link. The badge is described as an identity check; it does not verify property title or every listing claim.
- **`/account`** — self-service page for account data rights:
  - **Download my data** (`/api/account/export`) — JSON export of account, listings, sent/received inquiries, saved searches, written reviews, stay requests/support tickets, and plan-payment records; authentication secrets and private verification-document links are excluded.
  - **Delete my account** (`/api/account/delete`) — removes the account, listings, hosted media, related inquiries, saved searches, reviews, unpaid stay requests, and related support tickets. Password accounts re-enter their password; Google accounts confirm from their active signed-in session.
- **Footer** — links to Privacy/Terms and a data-protection note on every page.

These features provide basic account-data export and deletion controls. They do not establish legal compliance by themselves. Nigeria's NDP Act 2023 and the NDPC's 2025 implementation guidance have replaced NDPR as the current framework; each launch market needs its own qualified legal review before relying on these pages.

## Recently added: discovery, trust, and growth features

**WhatsApp inquiries** — the property detail page has a "Message on WhatsApp" button (`lib/whatsapp.ts`) using a `wa.me` deep link with a pre-filled message. No WhatsApp Business API or key needed.

**Map view** — `/listings` has a Grid/Map toggle (`components/ListingsMap.tsx`, Leaflet + OpenStreetMap tiles, no API key required). Listings are auto-geocoded via OpenStreetMap's free Nominatim service (`lib/geocode.ts`) whenever created or when their address changes on edit — best-effort, never blocks the listing from saving if geocoding fails.

**Open Graph tags** — property listing pages now generate real `<meta>` tags (title, description, image) via `generateMetadata()`, so links shared on WhatsApp, Twitter, etc. show a proper preview card instead of nothing.

**Sitemap & robots.txt** — `/sitemap.xml` lists every active listing plus static pages (regenerated dynamically, not a static file), and `/robots.txt` points crawlers to it while blocking `/dashboard`, `/admin`, `/account`, and `/api/`.

**Image optimization** — the public-facing images (property cards, detail page gallery) use `next/image` instead of raw `<img>` tags, with Cloudinary configured as an allowed remote image domain in `next.config.mjs`.

**Agent public profiles** — `/agents/[id]` shows an agent's verification status, active listing count, sold/rented count, and all their live listings. Linked from the agent's name on every listing they own.

**Saved listings (favorites)** — a heart icon on every listing card and detail page (`components/SaveListingButton.tsx`) lets signed-in buyers bookmark properties, viewable at `/saved`.

**Saved search alerts** — an "Alert me" button on `/listings` saves the current filters (`models/SearchAlert.ts`); when an admin approves a new listing, it's checked against every saved alert and matching users get an email immediately (`lib/searchAlerts.ts`, triggered from the admin approval route — not a polling job). Manage/delete alerts at `/saved-searches`.

**Agent document verification** — agents/developers can upload an ID or CAC certificate photo from `/account` to request the verified badge. Admins review submissions at `/admin/verifications` (new tab) and approve/reject with an optional reason emailed back to the applicant.

## What NOT to assume about the above

- Nominatim (the free geocoder) has a fair-use policy — fine at Fabhouse's current volume (one geocode per listing create/edit), but if listing volume gets very high, consider a paid geocoding provider instead.
- The map view needs listings to actually have coordinates — older listings created before this feature won't show a pin until they're edited (which re-triggers geocoding) or manually backfilled.
- Search alert emails go out immediately on admin approval, not in a batched digest — fine at low volume, worth revisiting if you get many saved alerts and many approvals per day.
- Verification is a photo of a document reviewed by a human admin, not an automated ID-verification service — appropriate for a small team, not a substitute for real KYC tooling at scale.

## Multi-currency search, audit log, and admin dashboard

**Local-currency price search** — new searches compare prices within the selected market currency (NGN, GHS, KES, or ZAR), so a GHS filter does not silently compare against a Nigerian price. GBP and USD remain available for eligible listings. `priceNGN` remains only as a legacy compatibility field; do not use it for new African-market search filters or financial transactions.

**Admin audit log** — every admin action that changes something (approve/reject a listing, verify/suspend a user, approve/reject a verification document) is now recorded in `models/AuditLog.ts` via `lib/auditLog.ts`, and viewable at `/admin/audit-log` with filtering by action type. Logging is best-effort and never blocks the actual admin action if it fails.

**Admin stats dashboard** — `/admin` is now an overview page (`/api/admin/stats`) showing pending-review counts, pending verifications, admin actions this week, total users by role, and total listings by status — all clickable through to the relevant filtered list. The old pending-review queue moved to `/admin/pending`.

## Password & session security

- **Passwords** are hashed with bcrypt (`bcryptjs`, cost factor 10) before being stored — the plaintext password is never saved anywhere, and hashing is one-way (can't be reversed to recover the password).
- **Sessions** use signed JWTs (via NextAuth, `session: { strategy: "jwt" }`) — this is a separate concern from password storage. Hash passwords, sign session tokens; that's the correct split and it's already in place.
- **Suspended accounts** are blocked at the `authorize()` step in `lib/auth.ts` — a suspended user can't get a session even with the correct password.

## Rate limiting

MongoDB-backed (not in-memory, so it survives serverless cold starts) via `lib/rateLimit.ts`:
- Registration: 8 accounts per IP per hour
- Inquiries: 5 messages per IP per 10 minutes
- Forgot-password requests: 5 per IP per hour

## Deploying (Vercel + MongoDB Atlas — recommended, both have free tiers)

1. **MongoDB Atlas**: create a free cluster at mongodb.com/atlas → Database Access (create a user) → Network Access (allow 0.0.0.0/0) → copy the connection string into `MONGODB_URI`.
2. **Push this project to a GitHub repo.**
3. **Vercel**: import the repo at vercel.com/new → add all env vars from `.env.local` in Project Settings → Environment Variables → deploy.
4. Update `NEXTAUTH_URL` to your real Vercel URL and redeploy.
5. Run `npm run seed` locally pointed at your **production** `MONGODB_URI` if you want the admin account to exist in production too — or register normally and manually flip a user's `role` to `admin` in Atlas's data browser.

## Still to build

- **Africa market rollout:** the listing model and search now carry country and local currency for Nigeria, Ghana, Kenya, and South Africa; country/city metadata and sitemap routes are country-aware. The UI can accept listings in these markets, but this is technical readiness, not proof that Fabhouse has verified actual local inventory or support operations. Verify supply and local operations city by city before launch.
- **Short-let stays have a pre-payment request flow only.** Hosts can block dates; guests can see blocked/held dates and request a stay; host acceptance places a 24-hour unpaid hold; either party can cancel before payment. These are requests and unpaid holds, not confirmed bookings. Stay checkout, paid cancellation/refund handling, and host payouts are not implemented.
- **Paid short-let launch is blocked on market-specific rules and a verified payment and settlement process:** approve local check-in rules, calendar/time-zone and offline booking processes, guest/host cancellation and refund policies, checkout, provider-approved settlement and reconciliation, and complete an end-to-end incident/refund/payout drill. Assign support staff and response coverage. See [`docs/market-launch-readiness.md`](docs/market-launch-readiness.md) for the gate and decision record. Do not treat a transfer split as escrow or delayed host payout.
- **Realistic revenue order:** keep ordinary buyer/renter discovery free while building local supply and response rates; test optional agent visibility and team tools against measurable leads; then earn a clearly disclosed booking/service fee on completed short stays after payment, cancellation, refund, and host-support operations are working. Do not sell verification badges or charge guests before a booking can be fulfilled. The interview plan and per-market go/no-go checklist are in [`docs/market-launch-readiness.md`](docs/market-launch-readiness.md).
- **Agent plan payments:** the Paystack path uses market-specific configured currency and price, checks the signed-in account and stored amount, stores payment references idempotently, extends access by one month, and accepts signed webhooks. Plans are one-time access, not auto-renewing subscriptions. Billing remains disabled by default. Only Nigeria has draft prices; validate them through agent interviews and configure approved local prices, support, receipts, terms, and payment policies before opening any other market.
- **Featured listings:** paid-plan entitlements are connected to a feature/unfeature action with plan limits. This is part of the optional agent value proposition; confirm the plans and slot limits against real agent usage before enabling billing.
- Diaspora-specific landing page / campaign placement logic
- Configure and verify the production Cloudinary signed upload preset's allowed formats and file-size limits, and disable the legacy unsigned listing-upload preset; server-side listing validation and required manual admin media review are implemented
- Verify actual local inventory, assign support staff and response coverage, and get qualified local counsel to review terms and privacy pages market by market before enabling transactions or actively launching each country
