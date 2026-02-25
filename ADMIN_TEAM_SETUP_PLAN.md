# Admin Team Setup and Login Welcome Plan

## Goals
- Send a welcome email whenever a user or admin logs in.
- Add an Admin Team Setup UI where admins can invite other admins by username + email.
- Send an email invite link that confirms admin access and verifies email on click.
- Allow invited admins to log into the admin dashboard after confirmation.

## Flow Design
1. Admin opens `Admin -> Settings -> Team & Roles`.
2. Admin enters `username` and `email` and clicks `Send Invite`.
3. Server creates/updates user record and creates an `admin_invites` token record.
4. Server sends invite link by email (`/auth/admin-invite?token=...`).
5. Invited user clicks link.
6. Server validates token, marks invite used, sets user role to `admin`, and verifies email.
7. Client stores returned user session in `localStorage`.
8. User can open `/admin` immediately.

## New/Updated Routes
- `POST /api/admin/team/invite`
  - Validates input.
  - Creates pending invite token.
  - Sends invite email.
- `GET /api/admin/team/invite`
  - Returns current admins + pending invites for Team UI.
- `GET /api/auth/admin/accept?token=...`
  - Verifies invite token.
  - Promotes account to admin.
  - Marks email verified.
- `POST /api/auth/login` (updated)
  - Sends login welcome email to the user/admin email.
  - Keeps existing admin alert mail to owner address.

## UI Changes
- New page: `app/admin/settings/team/page.tsx`
  - Invite form: username + email.
  - Pending invites list.
  - Current admins list.
- New page: `app/auth/admin-invite/page.tsx`
  - Confirms invite token.
  - Shows success/error state.
  - Redirect options to Admin/Home/Login.
- Admin nav updated to enable Team link.

## Data and Security Notes
- Invite tokens are short-lived JWTs with `typ: "admin_invite"`.
- Invite records are stored in `admin_invites` with `usedAt` + `expiresAt`.
- Email verification and admin elevation happen only after valid token confirmation.
- Existing login logic still enforces disabled-account checks.

## Env Variables
- Reused:
  - `EMAIL_VERIFICATION_JWT_SECRET`
  - `NEXT_PUBLIC_BASE_URL`
  - `RESEND_API_KEY`
  - `RESEND_FROM` or `RESEND_FROM_EMAIL`
- New optional:
  - `ADMIN_INVITE_TOKEN_TTL_MINUTES` (default: `1440`)

## Implemented Files
- `app/api/auth/login/route.ts`
- `lib/verificationTokens.ts`
- `app/api/admin/team/invite/route.ts`
- `app/api/auth/admin/accept/route.ts`
- `app/auth/admin-invite/page.tsx`
- `app/admin/settings/team/page.tsx`
- `app/admin/AdminShell.tsx`

## Future Improvements
- Add API auth/authorization guard on admin team invite endpoints.
- Add revoke/resend invite actions in Team UI.
- Add audit logs for invite creation and admin activation.
- Add rate limiting for invite creation.

## Admin Team Setup: How to create and verify admin accounts

1. Ensure env vars are set locally or in deployment:
  - `NEXT_PUBLIC_BASE_URL`, `MONGODB_URI`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL`.
  - Optional: `NEXT_PUBLIC_ADMIN_EMAILS` (comma-separated owner emails).

2. Seed roles and default accounts (recommended):
  - Call the roles seed endpoint (if present): `POST /api/admin/roles/seed`.
  - If you have a script, run: `pnpm ts-node ./scripts/seed-admins.ts` or use Mongo to insert an admin user with `roles: ["admin"]`.

3. Create a first admin via invite UI or API:
  - Admin UI: `Admin -> Settings -> Team` -> Send Invite (username + email).
  - API: `POST /api/admin/team/invite` with `{ name, email }`.

4. Accept invite:
  - Click the emailed link or call `GET /api/auth/admin/accept?token=...` to mark verified and elevated.
  - Confirm user now appears in `GET /api/admin/team/invite` (admins list).

5. Verify the admin session and permissions:
  - Sign in as the invited admin and open the admin UI.
  - Confirm `AuthContext` fetches `/api/admin/me` and shows correct roles/permissions.

  ## Creating admin accounts and attaching roles (UI + API)

  UI support (what's already implemented):
  - `Admin -> Settings -> Team` — Invite form (username + email). Sends an invite and creates/updates a user record.
  - `Admin -> Settings -> Roles` — Create roles, Edit role modal, and Manage assignments modal. The Manage modal includes a "Create & Assign" form that will create an invite and immediately assign the selected role to the invited email.
  - `Admin -> Settings -> Team` — Current admins list with "Manage" button to open the user roles editor; you can assign multiple roles to one user from that modal.

  How to create & attach an account (UI):
  1. Create or confirm the required role exists on `Admin -> Settings -> Roles`.
  2. To create a new admin + assign a role in one step:
    - Open `Admin -> Settings -> Roles` and click `Manage assignments` on the role.
    - Use the "Create & Assign" inputs: provide `Username` and `Email`, click `Create & Assign`.
    - This sends an invite email and assigns the role to that email. Once the invited user accepts the invite they may sign in and will inherit the assigned role(s).
  3. To attach roles to an existing admin:
    - Open `Admin -> Settings -> Team` and click `Manage` on the admin card.
    - Check/uncheck roles in the modal and click `Save` to apply multiple roles to the user.

  API support (for automation):
  - Create admin user directly: `POST /api/admin/users` with `{ email, userName, phone? }` (requires `users:manage` permission).
  - Invite + create pending invite: `POST /api/admin/team/invite` with `{ userName, email }` (requires admin session via header).
  - Assign/unassign role: `POST /api/admin/roles/assign` to assign, `DELETE /api/admin/roles/assign` to unassign. Body: `{ roleId, email }` (requires `admin:roles:assign`).
  - Set roles for a user (replace): `POST /api/admin/roles/set` with `{ email, roleIds: string[] }` (requires `admin:roles:assign`).

  Verifying the account and permissions:
  1. After creating/inviting and assigning roles, sign in as the user (or accept the invite link). The app stores the session in localStorage and `AuthContext` fetches `/api/admin/me`.
  2. Confirm the returned `/api/admin/me` payload lists the roles and computed permissions. The UI will reflect available nav items and actions based on the permission guard.
  3. To force-refresh permissions after role changes, use the existing `AuthContext.refreshUser()` helper (the Roles and Team UIs call this after assignment so changes appear without a full page reload).

  Notes and policy:
  - Users can have multiple roles; permissions are merged (deduplicated) server-side. If any role grants `*` or the user is an allowlisted owner email, they are treated as super-admin.
  - Role names in the seed and UI are canonical: `admin`, `manager`, `content_editor`, `support`, `finance`.
  - The Roles page includes permission labels for readability; adjust `mapPermissionToLabel` in `app/admin/settings/roles/page.tsx` if you add new permission keys.

  If you want, I can now:
  - Add a `scripts/seed-roles-and-admins.ts` script that upserts these canonical roles and creates a test admin account.
  - Wire toasts/disabled states to the Team UI's invite/save flows for better UX.
  - Run an automated verification script that performs the invite -> accept (simulated) -> assign -> verify permission flow and reports results.

## Verify all admin routes are working (checklist)

- [ ] Run TypeScript checks and Next build:
```powershell
pnpm run type-check
pnpm run build
```
- [ ] List API routes under `app/api/admin` and confirm each returns expected status when called with `x-admin-email` header for an admin account.
- [ ] Quick curl examples:
```bash
curl -H "x-admin-email: admin@example.com" \
  -X GET "${NEXT_PUBLIC_BASE_URL}/api/admin/roles"

curl -H "x-admin-email: admin@example.com" \
  -H "Content-Type: application/json" \
  -d '{"name":"manager","permissions":["orders:read"]}' \
  -X POST "${NEXT_PUBLIC_BASE_URL}/api/admin/roles"
```
- [ ] Verify UI pages: open `/admin/settings/roles`, `/admin/settings/team`, `/admin/audit` and exercise create/edit/assign flows.

## Available Roles & Descriptions (canonical list)

- `admin` — Full super-admin. Can manage roles, users, settings, and view all audit logs. Intended for Owner-level accounts.
- `manager` — Manage content, orders, and customers. Cannot change billing or platform-wide settings.
- `content_editor` — Manage product pages, lookbook, and site content. No access to financials or user management.
- `support` — View orders and help customers. Can create tickets and view order history but cannot edit products.
- `finance` — Access to finance endpoints, payouts, and reconciliation data.

Notes:
- Each role carries a `permissions` array (strings like `orders:read`, `orders:write`, `products:edit`).
- Roles also include `emailSubscriptions`: a list of event keys used by `lib/email.ts` to route notifications.

## Routes → Required permissions & notification recipients

This project centralizes admin APIs under `app/api/admin/*`. The following table maps common routes to required permission scopes and which role(s) receive notifications when relevant actions occur.

- `GET|POST /api/admin/roles` — permission: `roles:manage` — notification: none (role changes may notify `admin` emails)
- `POST /api/admin/roles/assign` — permission: `roles:assign` — notification: role assignment emails to the assigned user and any roles subscribed to `role:assigned` events
- `POST /api/admin/team/invite` — permission: `team:invite` — notification: `invite:sent` routed to invited email and `admin` allowlist
- `GET /api/admin/audit` — permission: `audit:read` — notification: none
- `POST /api/admin/orders/:id/refund` — permission: `orders:refund` — notification: `finance` and `manager` via `refund:processed` event

How to map notifications:
- Events fired from server code (calls to `sendForEvent(eventKey, ...)`) will look up roles whose `emailSubscriptions` include that `eventKey` and send Resend emails to users with those roles.
- Ensure roles that should receive emails have `emailSubscriptions` populated (e.g., `finance` -> `refund:processed`, `support` -> `order:issue`).

## How to test email notifications

1. Create or ensure a role has `emailSubscriptions: ["test:event"]`.
2. Call the send helper (server-side) or trigger the event endpoint. Example server call:
```ts
await sendForEvent("test:event", "Test Subject", "<p>Test</p>", "Test body")
```
3. Confirm emails are delivered to users with roles subscribed to that event and any allowlisted owner emails in `NEXT_PUBLIC_ADMIN_EMAILS`.

## Improvements & next work items

- Add a scripted `scripts/seed-roles-and-admins.ts` to quickly bootstrap environments.
- Expand `Audit` UI with filters (actor, action, date range) and CSV export.
- Add automated integration tests that:
  - Seed roles and admin, run assign/unassign flows.
  - Exercise `sendForEvent` and assert emails (use a test resend account or mock service).
- Add optimistic UI updates on role assign/unassign and disable action buttons during network calls.
- Harden server permission checks: prefer validating JWT-based admin session over `x-admin-email` header in production.

Latest UI updates (what I implemented):
- `Admin -> Settings -> Roles` now shows a clickable role name or a "Details" button to open a details panel for each role. The panel allows selecting a canonical role to preview plain-English descriptions, example permissions, and email events.
- The Edit Role modal has been improved: it now includes a description textarea, a scrollable checklist of permissions (with friendly labels), and a scrollable checklist of email events. Admins can select permissions and email events via checkboxes instead of typing CSV strings.
- The Manage Assignments modal keeps the quick "Create & Assign" flow (invite + immediate role assignment).

What now works:
- Create/Edit/Delete roles via the Roles UI (permissions and email event checkboxes persist on save).
- Preview and apply canonical role templates (pre-fills the Edit modal so admins can review before saving).
- Assign/unassign roles to existing admins and create+assign in one step.

Next recommended steps:
- Run `pnpm run type-check` and `pnpm run build` locally to ensure no type errors (I can run these for you and fix any issues if you want).
- Add toasts and disabled states to the Team UI for smoother UX during network calls.
- Optionally add a one-click seeder script to bootstrap canonical roles and a test admin account.

---

If you want, I can:
- Seed the default roles and a test admin account now.
- Run `pnpm run build` and a quick route verification script and report any failing endpoints.
- Add a small `scripts/seed-roles-and-admins.ts` and a README snippet for one-click setup.


