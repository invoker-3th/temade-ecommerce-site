# PostHog Tracking - Current State and Improvements

This document reflects the current PostHog integration in this repo and the remaining prioritized improvements.

## Current Tracking
- Client-side PostHog initialization:
  - File: `app/components/PostHogClient.tsx`
  - Loaded only after cookie consent is `"accepted"`.
  - Uses `posthog-js` with:
    - `api_host`: `NEXT_PUBLIC_POSTHOG_HOST` (default `https://us.i.posthog.com`)
    - `defaults`: `"2026-01-30"`
- Standardized pageview properties:
  - `$pageview` includes `pathname`, `page_title`, and `referrer`.
  - Implemented in `app/components/PostHogClient.tsx`.
- User identification:
  - `posthog.identify(userId, { email, userName, role })` runs after successful login and on restored session.
  - Implemented in `app/context/AuthContext.tsx`.
- E-commerce event tracking (in `lib/analytics.ts`):
  - `product_viewed`
  - `add_to_cart`
  - `remove_from_cart`
  - `begin_checkout`
  - `purchase_completed`
  - Payloads include product IDs, names, prices, quantities, currency, and order/transaction ID where available.

## Current Admin Analytics (PostHog)
The admin Site Analysis API (`app/api/admin/site-analysis/route.ts`) reads from PostHog using HogQL queries:
- Active users: `count(DISTINCT distinct_id)` of `$pageview`
- Page views: `count()` of `$pageview`
- Sessions: `count()` of `$session_start`
- Avg session duration: `avg(properties.$session_duration)` from `$session_end`
- Top pages: grouped by `properties.$pathname` or `properties.$current_url`

## Gaps / Risks
- If users do not grant consent, PostHog event volume will be lower.
- No server-side tracking yet for purchases, refunds, or back-office actions.
- Client-side purchase tracking can miss events if the user closes the tab early.

## Improvements (Prioritized)
1. Server-side purchase confirmation
   - Track `purchase_completed` from the Paystack webhook (authoritative).
   - Benefit: avoids client-side loss when users close the tab.
2. Consent-aware tracking controls
   - Add explicit opt-out/in handlers and update PostHog tracking state when consent changes.
3. Error/health events
   - Track critical failures (`checkout_failed`, payment verification failures, important API errors).

## Admin Access (How It Works)
- Login flow (`/api/auth/login`):
  - Requires email + username.
  - Admins are determined by:
    - `user.role === "admin"` OR
    - email in `NEXT_PUBLIC_ADMIN_EMAILS`.
  - If admin, username must match `NEXT_PUBLIC_ADMIN_USERNAME` (if set).
  - Non-admin users must be email-verified to log in.
- Admin UI access gate (`app/admin/AdminShell.tsx`):
  - Uses the same admin checks (role or allowlisted email).
  - Non-admins see `Access denied`.
- Admin management:
  - Team invites/activation through `app/api/admin/team/invite/route.ts` and `app/api/auth/admin/accept/route.ts`.

## Environment Variables
Frontend:
- `NEXT_PUBLIC_POSTHOG_KEY`
- `NEXT_PUBLIC_POSTHOG_HOST` (optional, default `https://us.i.posthog.com`)

Server (Admin analytics):
- `POSTHOG_PROJECT_ID`
- `POSTHOG_PERSONAL_API_KEY`
- `POSTHOG_HOST` (optional, default `https://app.posthog.com`)

Server (Webhook event capture):
- `POSTHOG_PROJECT_API_KEY` (recommended; falls back to `NEXT_PUBLIC_POSTHOG_KEY`)
- `POSTHOG_INGEST_HOST` (optional; falls back to `NEXT_PUBLIC_POSTHOG_HOST` or region default)
