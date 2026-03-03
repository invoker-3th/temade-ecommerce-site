# Admin Team Setup Plan (Owner-Friendly)

Last updated: 2026-03-03

This guide explains how a non-technical site owner can:
- add team members from the Admin UI,
- assign and change permissions using Roles,
- create new roles safely,
- understand what each permission allows in plain language.

## 1. What is already live

Team and Roles are already available in Admin:
- Team page: `app/admin/settings/team/page.tsx`
- Roles page: `app/admin/settings/roles/page.tsx`

Supporting APIs:
- `GET/POST/PATCH/DELETE /api/admin/team/invite`
- `GET/POST/PATCH/DELETE /api/admin/roles`
- `POST/DELETE /api/admin/roles/assign`
- `POST /api/admin/roles/set`

## 2. How to add a team member from UI

Path: `Admin -> Settings -> Team`

Steps:
1. Open `Invite New Admin`.
2. Enter `Full name`, `Username`, `Email`.
3. Click `Send Invite`.
4. Confirm the user appears under `Pending Invites`.
5. User clicks the email invite link and completes verification.
6. After acceptance, user appears under `Current Admins`.

If needed:
- `Resend` sends a fresh invite link.
- `Revoke` cancels an active invite.

## 3. How to add permissions to an existing account (UI)

You can do this in two ways.

### Option A: Team page (best for user-by-user edits)
Path: `Admin -> Settings -> Team -> Current Admins -> Manage`

Steps:
1. Click `Manage` for the target user.
2. Check or uncheck roles in the modal.
3. Click `Save`.

### Option B: Roles page (best for role-centric edits)
Path: `Admin -> Settings -> Roles -> Assign roles`

Steps:
1. Search for the user.
2. Select the user from results.
3. Check or uncheck roles.
4. Click `Save assignments`.

Important:
- Users do not get direct permission toggles; they receive permissions through assigned roles.
- A user can have multiple roles. Permissions are merged.

## 4. How a site owner creates a new role in UI

Path: `Admin -> Settings -> Roles -> Create role`

Steps:
1. Enter role `Name` (example: `seo_specialist`).
2. Add a short `Description` explaining responsibility.
3. Add permissions:
   - one permission per line, or
   - click quick-add permission chips.
4. Add email events (optional) for notifications this role should receive.
5. Click `Save role`.
6. Open `Assign roles` and attach the new role to users.

Best practice for owners:
- Start with minimum permissions.
- Add more only when the user is blocked by missing access.

## 5. Plain-English permission glossary

Use this section when deciding what to grant.

### Role administration
- `admin:roles:view`: can view all roles.
- `admin:roles:create`: can create new roles.
- `admin:roles:edit`: can edit existing roles.
- `admin:roles:delete`: can delete roles.
- `admin:roles:assign`: can attach or remove roles for users.
- `admin:audit:view`: can view admin audit logs.

### User and messaging
- `users:view`: can view user list and details.
- `users:manage`: can change user status and details.
- `email:send`: can send manual emails from admin tools.

### Orders and support
- `orders:view`: can view orders.
- `orders:edit`: can update order workflow and status.
- `orders:refunds`: can process and manage refunds.
- `support:ticket:view`: can view support tickets.
- `support:ticket:reply`: can reply to support tickets.

### Catalog and content
- `catalog:view`: can view catalog data in admin.
- `catalog:edit`: can create, update, and delete products and categories.
- `content:edit`: can edit site content and CMS pages.
- `lookbook:edit`: can update lookbook content.
- `banner:edit`: can edit top bar and promo banners.

### SEO and analytics
- `seo:view`: can view SEO and site analysis data.
- `seo:edit`: can change SEO settings and metadata content.
- `site:analytics:view`: can view analytics dashboards.
- `site:analytics:manage`: can run high-impact analytics actions (for example clear or reset operations).

### Finance
- `finance:reports`: can view finance reports.
- `finance:reconcile`: can perform reconciliation tasks.
- `payouts:view`: can view payout records.

## 6. Recommended starter role bundles for non-technical owners

Use these templates when creating roles:

- Content Manager:
  - `catalog:view`, `catalog:edit`, `content:edit`, `lookbook:edit`, `banner:edit`
- Support Agent:
  - `users:view`, `orders:view`, `support:ticket:view`, `support:ticket:reply`
- Operations Manager:
  - `users:view`, `orders:view`, `orders:edit`, `catalog:view`, `site:analytics:view`
- Finance Analyst:
  - `finance:reports`, `finance:reconcile`, `payouts:view`, `orders:refunds`
- SEO Specialist:
  - `seo:view`, `seo:edit`, `site:analytics:view`, `content:edit`

## 7. Owner checklist before giving access

1. Confirm the person's business function (support, content, finance, and so on).
2. Assign only one minimal role first.
3. Test by asking the user to sign in and confirm they can do their task.
4. Add more permissions only if needed.
5. Review assignments monthly and remove stale access.

## 8. Next implementation step (to make this easier for owners)

To reduce owner confusion further, implement:
1. A read-only "Permission Meaning" panel directly in Roles UI (same wording as this file).
2. Prebuilt role templates selectable in the `Create role` modal.
3. Warning badges for high-risk permissions (`users:manage`, `orders:refunds`, `site:analytics:manage`, and role admin permissions).
4. A "Clone role" action so owners can duplicate and tweak existing roles.
