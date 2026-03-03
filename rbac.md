## RBAC + Admin Console Status (Temade)

Last verified: 2026-03-03 (Phase 3 security extended + Phase 4 continued)

This file documents the current RBAC implementation, current admin UI behavior, API dependency model, design/style guardrails, and what to build next.

## 1. Current status

### Phase 1 result
- Phase 1 is complete for backend route protection.
- All `app/api/admin/**/route.ts` endpoints now enforce either:
  - `requirePermissionFromRequest(...)`, or
  - `requireAdminFromRequest(...)`.
- Build verification passed after these changes.

### Core RBAC primitives
- `lib/models/Role.ts`
- `lib/server/permissionGuard.ts`
  - Resolves permissions from role assignments.
  - Supports wildcard via super-admin (`*`).
- `lib/server/adminGuard.ts`
  - Strict admin-only guard for high-risk operations.

### Canonical seeded roles
- Seed route: `app/api/admin/roles/seed/route.ts`
- Roles: `admin`, `general_admin`, `manager`, `content_editor`, `support`, `finance`
- Key seeded permission families:
  - `admin:roles:*`, `admin:audit:view`
  - `users:view`, `users:manage`, `email:send`
  - `orders:view`, `orders:edit`, `orders:refunds`
  - `catalog:view`, `catalog:edit`, `content:edit`, `lookbook:edit`, `banner:edit`
  - `seo:view`, `seo:edit`, `site:analytics:view`
  - `finance:reports`, `finance:reconcile`, `payouts:view`

## 2. What was completed in this pass

### API hardening completed
- Added permission/admin guards to remaining unguarded endpoints:
  - Analytics/SEO: `analytics`, `site-analysis`, `clear-analytics`
  - Catalog/content ops: `categories`, `lookbook`, `upload`, `delete-image`
  - Finance: `finance`
  - Orders ops: `orders/process-reminders`, `orders/ship`, `orders/verify-pending`
  - Users exports: `users/export`, `users/[id]/orders`, `users/[id]/orders/export`
  - System seed: `seed`
  - Admin identity endpoint: `me` (admin guard)
  - Notifications: guarded for read/update/create behavior

### Admin client behavior alignment
- Added/normalized `x-admin-email` header usage across admin pages/components that call protected admin APIs.
- Updated `AdminShell` permissions bootstrap call (`/api/admin/me`) to include header identity.
- Prevented public UI regression:
  - `app/components/NewArrivals.tsx` no longer fetches products from admin API.
  - Uses public products search endpoint for storefront-safe behavior.

### Recharts rollout in admin UI
- Installed `recharts`.
- Replaced manual chart rendering in:
  - `app/admin/page.tsx`
  - `app/admin/site-analysis/page.tsx`
- Added chart types now used in admin:
  - Bar charts
  - Line charts
  - Pie chart
- Charts now use responsive containers and shared admin color palette.

### Phase 2 identity hardening (started)
- Added server-side admin session module:
  - `lib/server/sessionAuth.ts`
  - Creates opaque session tokens stored in `admin_auth_sessions` collection.
  - Uses HttpOnly cookie: `temade_admin_session`.
- Updated admin login flow:
  - `app/api/auth/login/route.ts` now creates admin session cookie for admin logins.
- Updated logout flow:
  - `app/api/auth/logout/route.ts` now revokes session token and clears cookie.
- Updated guards:
  - `lib/server/adminGuard.ts` now resolves identity from server session first.
  - `lib/server/permissionGuard.ts` now resolves identity from server session first.
- Legacy header/query identity is now fallback-only via `ALLOW_ADMIN_EMAIL_FALLBACK=true`.
- Fallback is now forcibly disabled in production regardless of env flag.
- Updated admin identity endpoint:
  - `app/api/admin/me/route.ts` now defaults target email to authenticated session email when query email is missing.
- Added phase-2 session tests:
  - `tests/session-auth.test.ts` validates cookie parsing and session states:
    - valid session
    - expired session
    - revoked session
  - test command: `npm run test:session`

### Phase 3 docs and permission taxonomy work (started)
- Added a route-to-permission matrix in this file (see Section 5A).
- Synced role documentation with current implementation:
  - `ROLES_README.md` updated to remove stale placeholder references.
  - Document now reflects session-cookie identity + current Roles UI behavior.
- Clarified sensitive-operation model:
  - Admin-only routes (seed, clear analytics, team invites, admin identity endpoint).
  - Permission-scoped routes for operational/admin features.

### Phase 3 taxonomy implementation (continued)
- Introduced new explicit permissions:
  - `catalog:edit`
  - `site:analytics:manage`
- Added permission helper:
  - `requireAnyPermissionFromRequest(...)` in `lib/server/permissionGuard.ts`
  - Used for migration-safe dual permission checks.
- Migrated catalog mutation routes to explicit taxonomy:
  - `app/api/admin/products/route.ts` (`POST/PUT/DELETE`)
  - `app/api/admin/products/[id]/route.ts` (`PUT/DELETE`)
  - `app/api/admin/categories/route.ts` (`POST/PUT/DELETE`)
  - Current check: `catalog:edit` only
- Migrated analytics destructive operation:
  - `app/api/admin/clear-analytics/route.ts`
  - from admin-only guard -> permission `site:analytics:manage`
- Updated role/permission authoring surfaces:
  - `app/api/admin/roles/seed/route.ts` now includes `catalog:edit` in `manager`.
  - `app/admin/settings/roles/page.tsx` known permissions now include:
    - `catalog:edit`
    - `site:analytics:manage`

### Phase 3 owner UX improvements (continued)
- Updated role editor modal UX in `app/admin/settings/roles/page.tsx`:
  - responsive modal container
  - blurred background overlay
  - body scroll lock while modal is open
  - modal-internal scrolling for long content
- Implemented in-UI permission meanings (item 8.1):
  - selected role panel now shows plain-language meaning per permission key.
- Extended permission-meaning UX inside Edit Role modal:
  - permission chips are now explain-first.
  - clicking a permission shows what it does before adding it to the role.
  - explicit `Add selected permission` action reduces accidental grants.
- Team/Invite role assignment flow updated for owner safety:
  - role is required at invite time (`/api/admin/team/invite`).
  - invite email now includes assigned role + plain-language permission list.
  - Team page uses single-role assign/edit/remove UX per invited account.
  - top `Manage Roles` shortcut removed from Team page.
- Admin Logs navigation visibility:
  - `Admin Logs` is now in the sidebar (route: `/admin/audit`).
  - intended for owners and general admins with audit permission.
- Team page visibility and message flow for general admins:
  - general admins can open Team view (read-only for invite/revoke).
  - general admins can send team messages to verified admin accounts.
  - messages can be delivered to in-app notifications by all team members with `team:message`.
  - direct team email delivery is restricted to accounts with `email:send` (general admin + owner/super-admin).
  - notifications now support click-to-open message details with sender + timestamp.
  - Team cards now include compact status badges: `No role`, `Pending`, `Assigned`.
- Team UI/notification styling upgraded:
  - motion/animation added to cards and message modals.
  - animated transitions on message viewer and compose dialog.

### Phase 3 role catalog update
- Added canonical `general_admin` role in seed defaults (`app/api/admin/roles/seed/route.ts`):
  - includes operational permissions + `admin:audit:view` + `email:send` + team permissions.
- Updated seed behavior from "insert only when empty" to per-role upsert:
  - existing role docs are refreshed to current defaults.
  - missing default roles are created.
- Added explicit team permissions and seeded across team roles:
  - `team:view`
  - `team:message`

### Phase 3 admin UI behavior normalization (single dashboard model)
- Updated login/session issuance:
  - `app/api/auth/login/route.ts` now issues admin session cookie for users with assigned RBAC roles (not only `role === "admin"`).
- Updated current-user endpoint:
  - `app/api/admin/me/route.ts` now supports session-based self lookup for any admin-console session user.
  - Cross-user lookup remains strict-admin only.
- Updated admin shell access logic:
  - `app/admin/AdminShell.tsx` now allows admin console entry for users who either:
    - are strict admins, or
    - have any resolved RBAC permission.
  - Mobile nav now applies the same permission filtering as desktop nav.
- Updated single dashboard behavior:
  - `app/admin/page.tsx` now adapts content to permission set.
  - Analytics modules render only for users with `site:analytics:view`.
  - Clear Analytics action renders only for users with `site:analytics:manage`.
  - Quick action cards and notifications are filtered by relevant permissions (`catalog:*`, `orders:view`, `lookbook:edit`).

## 3. Current admin behavior

### Access model
- Admin shell access now uses session + RBAC permissions:
  - strict admin users always allowed.
  - RBAC-assigned users allowed when they have at least one admin permission.
- Sidebar and dashboard modules are permission-driven from `/api/admin/me`.

### Navigation behavior
- `app/admin/AdminShell.tsx` filters menu items by permission key.
- If a nav item has a `permission`, it is shown only when user has:
  - `*`, or
  - that exact permission.
- Desktop and mobile nav now use the same permission filtering logic.

### API call behavior
- Protected admin routes expect an identity for authorization checks.
- Current primary identity transport:
  - HttpOnly session cookie (`temade_admin_session`), validated server-side.
- Compatibility fallback (temporary):
  - `x-admin-email` header / `?email=` query only when `ALLOW_ADMIN_EMAIL_FALLBACK=true`.
- `/api/admin/me` behavior:
  - session user can fetch self identity/permissions.
  - querying another user requires strict admin guard.
- Team API behavior:
  - `GET /api/admin/team/invite` now requires `team:view` (compatibility accepts `users:view`) and returns team roster + pending invites.
  - invite lifecycle mutations (`POST/PATCH/DELETE`) remain strict-admin only.
- Team messaging behavior:
  - `POST /api/admin/team/messages` requires `team:message`.
  - direct email delivery path requires `email:send`.
  - recipient must have verified email.
  - stores in-app notification entries with sender identity and timestamp.
- Admin login security behavior:
  - owner allowlisted email(s) can still use direct admin login.
  - all other admin-console users use one-time OTP login links sent to verified email.
  - OTP link route: `/auth/admin-otp` -> `/api/auth/admin/otp/verify`.
  - OTP links are single-use, expiring, and required again after explicit logout.

## 4. Admin layout and UI architecture

### Layout structure
- Shell container: `app/admin/AdminShell.tsx`
- Left desktop nav + mobile slideout nav
- Route pages mounted in shared shell main content region
- `react-hot-toast` used globally for admin feedback

### Page groups
- Overview: dashboard, site analysis
- Operations: users, orders, finance
- Catalog/CMS: inventory, lookbook, CMS pages
- Settings: banner, SEO, team & roles, roles

### API dependency map (high-level)
- Dashboard: `/api/admin/analytics`, `/api/admin/clear-analytics`, `/api/admin/notifications`
- Site Analysis / SEO: `/api/admin/site-analysis`
- Orders: `/api/admin/orders`, `/api/admin/orders/ship`, `/api/admin/orders/verify-pending`, `/api/admin/orders/process-reminders`
- Inventory/Categories: `/api/admin/products*`, `/api/admin/categories*`, `/api/admin/upload`, `/api/admin/delete-image`
- CMS pages: `/api/admin/pages*`, `/api/admin/upload`
- Users: `/api/admin/users*`, `/api/admin/users/export`
- Roles/Team: `/api/admin/roles*`, `/api/admin/roles/set`, `/api/admin/team/invite`
- Team Messaging: `/api/admin/team/messages`
- Admin OTP: `/api/auth/admin/otp/verify`
- Finance: `/api/admin/finance`

## 5A. Route-to-Permission Matrix

| Route | Methods | Guard Type | Required Permission |
|---|---|---|---|
| `/api/admin/me` | `GET` | admin-only | `requireAdminFromRequest` |
| `/api/admin/team/invite` | `GET` | permission | `team:view` (compat `users:view`) |
| `/api/admin/team/invite` | `POST/PATCH/DELETE` | admin-only | `requireAdminFromRequest` |
| `/api/admin/team/messages` | `POST` | permission | `team:message` (+ `email:send` for direct email path) |
| `/api/admin/seed` | `POST` | admin-only | `requireAdminFromRequest` |
| `/api/admin/clear-analytics` | `DELETE` | permission | `site:analytics:manage` |
| `/api/admin/audit` | `GET` | permission | `admin:audit:view` |
| `/api/admin/roles` | `GET` | permission | `admin:roles:view` |
| `/api/admin/roles` | `POST` | permission | `admin:roles:create` |
| `/api/admin/roles` | `PATCH` | permission | `admin:roles:edit` |
| `/api/admin/roles` | `DELETE` | permission | `admin:roles:delete` |
| `/api/admin/roles/assign` | `GET/POST` | permission | `admin:roles:assign` |
| `/api/admin/roles/set` | `POST` | permission | `admin:roles:assign` |
| `/api/admin/roles/seed` | `POST` | permission | `admin:roles:create` |
| `/api/admin/users` | `GET` | permission | `users:view` |
| `/api/admin/users` | `PATCH` | permission | `users:manage` |
| `/api/admin/users/export` | `GET` | permission | `users:view` |
| `/api/admin/users/[id]` | `GET` | permission | `users:view` |
| `/api/admin/users/[id]` | `PATCH` | permission | `users:manage` |
| `/api/admin/users/[id]/email` | `POST` | permission | `email:send` |
| `/api/admin/users/[id]/orders` | `GET` | permission | `users:view` |
| `/api/admin/users/[id]/orders/export` | `GET` | permission | `users:view` |
| `/api/admin/orders` | `GET` | permission | `orders:view` |
| `/api/admin/orders` | `PATCH` | permission | `orders:edit` |
| `/api/admin/orders/ship` | `POST` | permission | `orders:edit` |
| `/api/admin/orders/process-reminders` | `POST` | permission | `orders:edit` |
| `/api/admin/orders/verify-pending` | `POST` | permission | `orders:edit` |
| `/api/admin/notifications` | `GET` | permission | any of `orders:view`, `users:view`, `email:send`, `team:message` |
| `/api/admin/notifications` | `POST` | permission | `orders:edit` |
| `/api/admin/notifications` | `PATCH` | permission | any of `orders:view`, `users:view`, `email:send`, `team:message` |
| `/api/auth/admin/otp/verify` | `GET` | token verification | valid unused `admin_otp` token |
| `/api/admin/products` | `GET` | permission | `catalog:view` |
| `/api/admin/products` | `POST/PUT/DELETE` | permission | `catalog:edit` |
| `/api/admin/products/[id]` | `GET` | permission | `catalog:view` |
| `/api/admin/products/[id]` | `PUT/DELETE` | permission | `catalog:edit` |
| `/api/admin/categories` | `GET` | permission | `catalog:view` |
| `/api/admin/categories` | `POST/PUT/DELETE` | permission | `catalog:edit` |
| `/api/admin/pages` | `GET/POST` | permission | `content:edit` |
| `/api/admin/pages/[id]` | `GET/PUT/DELETE` | permission | `content:edit` |
| `/api/admin/upload` | `POST` | permission | `content:edit` |
| `/api/admin/delete-image` | `POST` | permission | `content:edit` |
| `/api/admin/lookbook` | `POST/DELETE` | permission | `lookbook:edit` |
| `/api/admin/site-content/top-bar` | `GET/PUT` | permission | `banner:edit` |
| `/api/admin/analytics` | `GET` | permission | `site:analytics:view` |
| `/api/admin/site-analysis` | `GET` | permission | `seo:view` |
| `/api/admin/finance` | `GET` | permission | `finance:reports` |

## 6. Admin style guide (current + target)

### Visual tokens in use
- Base text: `#16161A`
- Brand accent: `#8D2741`
- Secondary accent: `#CA6F86`
- Neutral dark: `#2C2C2C`
- Background: `#FFFBEB`
- Card background: white with soft shadow and rounded corners

### Typography
- Primary admin font: `Work Sans`
- Heading pattern: bold, large title + muted helper text

### Components
- Cards: rounded-xl, subtle shadow, consistent inner padding (`p-5`/`p-6`)
- Controls: outlined buttons for secondary, filled accent for primary
- Lists/tables: bordered rows with readable spacing
- Dialogs: centered overlays for destructive confirmations

### Charting standard (new)
- Use `recharts` for all dashboard/analytics charts.
- Default chart set:
  - Bar for categorical/count comparisons
  - Line for trend over time
  - Pie for composition breakdown
- Use `ResponsiveContainer` for mobile/desktop resilience.
- Reuse admin palette; avoid ad hoc random chart colors.

## 7. Known design debt

### Identity trust model
- Session-cookie identity is now implemented as primary.
- Remaining debt:
  - legacy fallback path still exists for migration safety.
  - fallback should be disabled permanently after client migration/stabilization.

### Dual guard model
- System uses both permission guard and strict admin guard.
- This is intentional, but guard choice must stay explicitly documented per route.

## 8. Next phase (post-Phase 1)

### Phase 2: Identity hardening
- Completed:
  - Primary identity switched to server-verified session cookie.
  - Fallback identity gated behind explicit `ALLOW_ADMIN_EMAIL_FALLBACK` flag.
  - Production hard-block on fallback path.
  - Session behavior tests added and passing.
- Remaining:
  - Remove fallback path entirely after rollout window.
  - Add session expiry/rotation policy docs and broader guard integration tests.

### Phase 3: Permission taxonomy + docs sync
- Completed in this pass:
  - Route-to-permission matrix added to this file.
  - `ROLES_README.md` synced with current behavior.
  - `catalog:edit` introduced and now fully enforced on catalog writes.
  - `site:analytics:manage` introduced and applied to analytics clear operation.
  - Admin shell + dashboard behavior updated to be permission-driven for a single shared dashboard UX.
  - Roles page now includes plain-language permission meanings and responsive modal behavior.
- Remaining:
  - Assign/seed `site:analytics:manage` only for privileged operations owners.

### Phase 4: Test and audit coverage
- Started:
  - Added RBAC guard unit tests in `tests/rbac-permissions.test.ts`:
    - exact match allow
    - wildcard allow
    - deny on missing permission
    - known/unknown permission meaning behavior
  - Added test command: `npm run test:rbac`
- Continued:
  - Added team/admin messaging route and recipient-scoped notification read model.
  - build verified after Team messaging + animated UI changes.
  - Added OTP-link admin login flow for non-owner admin accounts.
- Remaining:
  - Add integration tests per role for allow/deny paths on critical admin endpoints.
  - Add integration tests for new Team controls:
    - team-role users can `GET /api/admin/team/invite` and send in-app messages.
    - only owner/super-admin can `POST/PATCH/DELETE` invites.
    - only `email:send` holders can deliver direct team email.
    - team_message notifications are visible only to recipient account.
  - Add OTP login integration tests:
    - non-owner admin login returns `requiresAdminOtp`.
    - owner allowlisted login remains direct session.
    - OTP tokens expire and are single-use.
  - Enrich audit records to include permission key used for authorization.

## 9. Immediate execution backlog

1. Add RBAC integration tests for:
   - `admin`, `manager`, `content_editor`, `support`, `finance`
2. Add role integration tests for `general_admin` (new seeded role).
3. Add guard integration tests using real route handlers + session cookie fixture.
4. Add Team route integration tests:
   - invite read vs write behavior by role
   - team message send + recipient visibility + email path restriction.
5. Add OTP flow integration tests (owner direct login vs non-owner OTP).
6. Add permission key used to audit metadata for protected route writes.
7. Confirm seeded/assigned ownership policy for `site:analytics:manage` and restrict to privileged roles.
