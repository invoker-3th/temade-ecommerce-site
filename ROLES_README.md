## Admin roles and permissions

This document describes the **current admin roles**, how they map to permissions, and **implementable roles** you can safely add using the existing RBAC system.

### Current canonical roles (seeded by `/api/admin/roles/seed`)

These roles are defined in `app/api/admin/roles/seed/route.ts` and treated as the canonical baseline:

- **admin**
  - **Purpose**: Owner / super-admin.
  - **Effective permissions**: `["*"]` (all permissions).
  - **Notes**: Can manage roles, users, settings, and view all audit logs. Intended for a very small number of trusted accounts.

- **manager**
  - **Purpose**: Operations / ecommerce manager.
  - **Key permissions**:
    - `seo:view` – View site analysis and SEO health.
    - `site:analytics:view` – View extended analytics dashboards (where present).
    - `content:edit` – Edit CMS pages and high-level content.
    - `orders:view`, `orders:edit` – View and manage orders.
    - `users:view` – View customer information.
  - **Notes**: Cannot assign roles, change billing, or adjust platform-wide settings.

- **content_editor**
  - **Purpose**: CMS / content team (including promo banners).
  - **Key permissions**:
    - `content:edit` – General content editing (CMS, pages, etc.).
    - `catalog:view` – View catalog/inventory.
    - `lookbook:edit` – Manage lookbook entries.
    - `banner:edit` – Edit the top promo banner (used by `Banner Settings`).
  - **Notes**: No access to finance or user management. This is the primary role that can manage the **promo banner** via RBAC.

- **support**
  - **Purpose**: Customer support.
  - **Key permissions**:
    - `support:ticket:view`, `support:ticket:reply` – Work support tickets.
    - `orders:view` – View customer orders.
    - `users:view` – View customer profiles for support.
  - **Notes**: Cannot edit products, CMS, or financial data.

- **finance**
  - **Purpose**: Finance / accounting.
  - **Key permissions**:
    - `finance:reports` – Access financial reports.
    - `payouts:view` – View payouts.
    - `orders:refunds` – Handle refunds.
    - `finance:reconcile` – Reconciliation workflows.
  - **Notes**: No access to CMS/editing or user/role management.

### How SEO can edit the banner

- The **Banner Settings** page is at `/admin/settings/banner` and is now gated by the **`banner:edit`** permission in:
  - `app/admin/AdminShell.tsx` (navigation visibility).
  - `app/api/admin/site-content/top-bar/route.ts` (server-side permission check).
- Any role that includes `banner:edit` (currently `content_editor` from the seed) will:
  - See the **Banner Settings** item in the admin sidebar.
  - Be able to read and update the promo banner text.
- **Recommendation**: Assign the `content_editor` role (or a new SEO-focused role, see below) to SEO practitioners who should own the promo banner.

### Implementable / suggested future roles

You can add more roles by inserting new documents into the `roles` collection that follow the `Role` model (`lib/models/Role.ts`). Some suggested roles:

- **seo_specialist** (not yet seeded)
  - **Intended permissions**:
    - `seo:view`, `seo:edit`
    - `site:analytics:view`
    - `content:edit`
    - `banner:edit`
  - **Use case**: Dedicated SEO owner who can manage SEO settings, analytics, and promo messaging without full CMS or user/finance access.

- **analytics_viewer**
  - **Intended permissions**:
    - `seo:view`
    - `site:analytics:view`
  - **Use case**: Read-only access to SEO/Site Analysis dashboards (no editing).

- **order_manager**
  - **Intended permissions**:
    - `orders:view`, `orders:edit`
    - `orders:refunds` (optional, or keep for finance-only)
    - `users:view`
  - **Use case**: Operations staff focused on orders and customers, no CMS or SEO access.

- **marketing_manager**
  - **Intended permissions**:
    - `content:edit`
    - `banner:edit`
    - `lookbook:edit`
    - `email:send`
  - **Use case**: Campaign/marketing team controlling on-site messaging, lookbooks, and outbound email campaigns.

### How permissions are evaluated

- Permissions for a user are computed in `lib/server/permissionGuard.ts`:
  - Canonical `role` field of `admin` **or** email in `NEXT_PUBLIC_ADMIN_EMAILS` ⇒ treated as super-admin with `["*"]`.
  - Otherwise, the server reads the user’s `roles` array (IDs or names), loads matching `Role` documents, and flattens/uniques all `permissions`.
- The **admin navigation** (`app/admin/AdminShell.tsx`) uses this permission list to decide which sidebar items to show. For example:
  - **Site Analysis** requires `seo:view`.
  - **SEO Settings** requires `seo:edit`.
  - **Banner Settings** requires `banner:edit`.
  - **Team & Roles / Roles** require `admin:roles:view`.

### Practical notes

- Users can be assigned **multiple roles**; permissions are merged.
- The `Team` page (`/admin/settings/team`) is where you:
  - Invite admins by email.
  - Attach one or more roles to an admin via the roles modal.
- The `Roles` page (`/admin/settings/roles`) currently shows a placeholder message while its full management UI is temporarily disabled, but the **underlying RBAC APIs and role model are active**.


