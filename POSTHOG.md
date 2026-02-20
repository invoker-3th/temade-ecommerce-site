# PostHog Tracking - Current State and Improvements

This document reflects the current PostHog integration in this repo and a prioritized list of improvements.

## Current Tracking
- Client-side PostHog initialization:
  - File: `app/components/PostHogClient.tsx`
  - Loaded only after cookie consent is `"accepted"`.
  - Uses `posthog-js` with:
    - `api_host`: `NEXT_PUBLIC_POSTHOG_HOST` (default `https://us.i.posthog.com`)
    - `defaults`: `"2026-01-30"`
- Expected captured events (from PostHog defaults and common web events):
  - `$pageview` (page views)
  - `$session_start`, `$session_end` (session counts)
  - `$autocapture` (clicks, inputs, etc., if enabled by PostHog defaults)

## Current Admin Analytics (PostHog)
The admin Site Analysis API (`app/api/admin/site-analysis/route.ts`) reads from PostHog using HogQL queries:
- Active users: `count(DISTINCT distinct_id)` of `$pageview`
- Page views: `count()` of `$pageview`
- Sessions: `count()` of `$session_start`
- Avg session duration: `avg(properties.$session_duration)` from `$session_end`
- Top pages: grouped by `properties.$pathname` or `properties.$current_url`

## Gaps / Risks
- No explicit identification (`posthog.identify`) after login, so users are tracked anonymously.
- No explicit e‑commerce funnel events for key actions.
- Admin analytics depends on PostHog events being present; if defaults change or autocapture is disabled, data may be incomplete.
- No server-side tracking for purchases, refunds, or back-office actions.

## Improvements (Prioritized)
1. Identify users after login
   - Call `posthog.identify(userId, { email, userName, role })` after successful login.
   - Benefit: enables user-level analysis, cohorts, and funnels.
2. Add ecommerce event tracking
   - Track core events:
     - `product_viewed`
     - `add_to_cart`
     - `remove_from_cart`
     - `begin_checkout`
     - `purchase_completed`
   - Include product IDs, names, prices, quantities, currency, and order IDs.
3. Standardize page properties
   - Always include `pathname`, `page_title`, and `referrer` on `$pageview`.
   - Benefit: more accurate top pages and attribution.
4. Server-side purchase confirmation
   - Track `purchase_completed` from the Paystack webhook (authoritative).
   - Benefit: avoids client-side loss when users close the tab.
5. Consent-aware tracking controls
   - Add a method to opt out/in and update PostHog settings on consent changes.
6. Error/health events
   - Track critical errors (failed checkout, API failures) with a lightweight schema.

## Admin Access (How It Works)
- Login flow (`/api/auth/login`):
  - Requires email + username.
  - Admins are determined by:
    - `user.role === "admin"` OR
    - email in `NEXT_PUBLIC_ADMIN_EMAILS`.
  - If admin, username must match `NEXT_PUBLIC_ADMIN_USERNAME` (if set).
  - Non-admin users must be email-verified to log in.
  - Admin logins send an alert email to `enjayjerey@gmail.com`.
- Admin UI access gate (`app/admin/AdminShell.tsx`):
  - Uses the same admin checks (role or allowlisted email).
  - Non-admins see “Access denied”.
- Admin management (`/admin/users`):
  - Admins can create new admin users.
  - Admins can update user roles (customer/admin/editor/viewer).

## Environment Variables
Frontend:
- `NEXT_PUBLIC_POSTHOG_KEY`
- `NEXT_PUBLIC_POSTHOG_HOST` (optional, default `https://us.i.posthog.com`)

Server (Admin analytics):
- `POSTHOG_PROJECT_ID`
- `POSTHOG_PERSONAL_API_KEY`
- `POSTHOG_HOST` (optional, default `https://app.posthog.com`)
