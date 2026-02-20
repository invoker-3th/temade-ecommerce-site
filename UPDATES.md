# Updates Log

Last updated: 2026-02-20

## Analytics & Tracking
- Replaced/standardized site analytics integration around PostHog.
- Added PostHog client initialization in `app/components/PostHogClient.tsx` with env-driven key/host.
- Wired admin site analysis backend to query PostHog metrics in `app/api/admin/site-analysis/route.ts`.
- Updated admin site analysis UI labels/cards to PostHog-focused output in `app/admin/site-analysis/page.tsx`.
- Added Core Web Vitals capture client in `app/components/WebVitalsClient.tsx` and ingestion route `app/api/web-vitals`.

## SEO & Crawlability
- Added dynamic sitemap endpoint in `app/sitemap.ts`.
- Added robots endpoint in `app/robots.ts` referencing sitemap URL.
- Added sitemap/robots health checks and visibility in site analysis route/UI:
  - `app/api/admin/site-analysis/route.ts`
  - `app/admin/site-analysis/page.tsx`

## CMS Pages (Admin)
- Expanded admin CMS pages experience in `app/admin/cms/pages/page.tsx`:
  - Instructions tab and examples tab.
  - Prompt examples for generating CMS content.
  - Live preview behavior.
  - Cloudinary-oriented image insertion guidance.
- Added admin upload API for media:
  - `app/api/admin/upload/route.ts`
  - `app/api/admin/delete-image/route.ts`

## Auth, Admin Team & Invite Flow
- Added admin team invite management route in `app/api/admin/team/invite/route.ts` and team screen in `app/admin/settings/team/page.tsx`.
- New invite lifecycle actions:
  - Create invite (`POST`)
  - Resend invite (`PATCH`)
  - Revoke invite (`DELETE`)
  - List admins/pending invites (`GET`)
- Added API admin authorization guard for team invite endpoints:
  - `lib/server/adminGuard.ts`
  - Uses `x-admin-email` and verifies admin role/allowlist.
- Added admin invite acceptance flow guard updates in `app/api/auth/admin/accept/route.ts`:
  - Rejects revoked invites.
  - Activates admin and verifies email on valid accept.

## Audit Logging
- Added audit logger `lib/audit.ts` (Mongo collection: `admin_audit_logs`).
- Added audit events:
  - `admin_invite_created`
  - `admin_invite_resent`
  - `admin_invite_revoked`
  - `admin_activated`

## Orders/Finance Operations
- Added/maintained pending-payment verification path for admin orders:
  - `app/api/admin/orders/verify-pending/route.ts`
  - Triggered from admin orders UI (`app/admin/orders/page.tsx`).

## Documentation Added/Updated
- `POSTHOG.md` for tracking setup and behavior.
- `MONGODB_DNS_FIX.md` for local MongoDB DNS/SRV troubleshooting.
- `EMAIL.md` for email flow behavior and improvement notes.
- `ADMIN_TEAM_SETUP_PLAN.md` for admin team/invite rollout plan.
- `seo.md` for SEO/site indexing notes.

## Current Important Notes
- GSC connectivity still depends on external Google setup:
  - Search Console API enabled for the same GCP project as service account.
  - Service account added as owner/user on the exact site property (URL-prefix or domain property).
- PostHog server-side analytics requires valid:
  - `POSTHOG_PERSONAL_API_KEY`
  - `POSTHOG_PROJECT_ID`
  - optional `POSTHOG_HOST`
