## Admin Roles and Permissions

This document reflects the current RBAC behavior in the Temade admin console.

## 1. Canonical seeded roles

Seed source: `app/api/admin/roles/seed/route.ts`

- `admin`
  - Purpose: owner/super-admin.
  - Effective permissions: `["*"]`.
  - Notes: full platform control.

- `manager`
  - Purpose: operations manager.
  - Permissions:
    - `seo:view`
    - `site:analytics:view`
    - `content:edit`
    - `catalog:edit`
    - `orders:view`, `orders:edit`
    - `users:view`

- `content_editor`
  - Purpose: content and merchandising operations.
  - Permissions:
    - `content:edit`
    - `catalog:view`
    - `lookbook:edit`
    - `banner:edit`

- `support`
  - Purpose: customer support operations.
  - Permissions:
    - `support:ticket:view`, `support:ticket:reply`
    - `orders:view`
    - `users:view`

- `finance`
  - Purpose: finance and reconciliation.
  - Permissions:
    - `finance:reports`
    - `payouts:view`
    - `orders:refunds`
    - `finance:reconcile`

## 2. Permission resolution model

Primary implementation: `lib/server/permissionGuard.ts`

- Super-admin wildcard:
  - `user.role === "admin"` or email in `NEXT_PUBLIC_ADMIN_EMAILS` => `["*"]`.
- Otherwise:
  - resolve assigned role documents and merge unique permissions.
- Users can hold multiple roles; permissions are unioned.

## 3. Identity and guard model

Primary identity model:
- server-validated HttpOnly admin session cookie (`temade_admin_session`)
- session logic in `lib/server/sessionAuth.ts`

Guard types:
- `requirePermissionFromRequest(...)`
  - for feature-level permission checks.
- `requireAdminFromRequest(...)`
  - for sensitive admin-only operations (seed, invites, etc.).

Legacy fallback:
- `x-admin-email` / `?email=` fallback exists only when `ALLOW_ADMIN_EMAIL_FALLBACK=true`
- fallback is forcibly disabled in production.

## 4. Current admin UI role behavior

Sidebar and route visibility:
- `app/admin/AdminShell.tsx` fetches `/api/admin/me` and filters nav items by permissions.
- If a nav item has a permission key, user must have that key or `*`.

Roles UI:
- `app/admin/settings/roles/page.tsx` is active (not placeholder).
- Supports role CRUD + assignment workflows.

Team UI:
- `app/admin/settings/team/page.tsx` handles invite and role assignment flows.
- Invite operations are guarded with strict admin guard on API.

## 5. Current permission highlights

- Banner editing:
  - nav + API are controlled by `banner:edit`
  - endpoint: `app/api/admin/site-content/top-bar/route.ts`

- SEO / Site Analysis:
  - `app/api/admin/site-analysis/route.ts` uses `seo:view`
  - `app/api/admin/analytics/route.ts` uses `site:analytics:view`
  - `app/api/admin/clear-analytics/route.ts` uses `site:analytics:manage`

- Orders:
  - read = `orders:view`
  - mutate workflow (status/ship/reminders/verify pending) = `orders:edit`

- Users:
  - read/export/orders export = `users:view`
  - mutate user = `users:manage`
  - manual outbound email = `email:send`

## 6. Suggested next role additions

- `seo_specialist`
  - `seo:view`, `seo:edit`, `site:analytics:view`, `banner:edit`, `content:edit`

- `analytics_viewer`
  - `seo:view`, `site:analytics:view`

- `order_manager`
  - `orders:view`, `orders:edit`, optional `orders:refunds`, `users:view`

## 7. Open taxonomy decisions

- Current migration status:
  - `catalog:edit` is introduced and routes now accept:
    - `catalog:edit` OR legacy `content:edit` for catalog writes.
  - `site:analytics:manage` is introduced and required for analytics clear operation.
- Remaining decision:
  - when to remove legacy `content:edit` compatibility for catalog mutation routes.
