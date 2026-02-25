## RBAC overview for Temade admin

This document explains the **current RBAC implementation**, what’s already in place, what’s still in progress, and concrete areas for improvement.

### 1. Current architecture

- **Role model**
  - Defined in `lib/models/Role.ts` as:
    - `name: string`
    - `description?: string`
    - `permissions: string[]`
    - `emailSubscriptions: string[]`
  - Seeded canonical roles live in `app/api/admin/roles/seed/route.ts`:
    - `admin`, `manager`, `content_editor`, `support`, `finance`.

- **Permission resolution**
  - Implemented in `lib/server/permissionGuard.ts`:
    - Looks up the user by email from the `users` collection.
    - Treats `user.role === "admin"` or any email in `NEXT_PUBLIC_ADMIN_EMAILS` as **super-admin** and returns `permissions: ["*"]`.
    - Otherwise:
      - Reads `user.roles` (IDs or names).
      - Loads matching `roles` documents from Mongo.
      - Flattens their `permissions` arrays and uniques them into a final list for that user.
  - `GET /api/admin/me` (`app/api/admin/me/route.ts`) exposes:
    - Basic user info.
    - The resolved `permissions`.
    - The resolved `roles` documents.

- **Server-side permission guard**
  - `requirePermissionFromRequest(request, permissionKey)`:
    - Reads `x-admin-email` header or `email` query param.
    - Uses `getPermissionsForUser` to compute permissions.
    - Returns `{ ok: true, adminEmail, userId }` if the user has `"*"` or the specific permission.
    - Returns `{ ok: false, status, error }` otherwise.
  - Used in various admin APIs, e.g.:
    - `app/api/admin/roles/seed/route.ts` (`admin:roles:create`).
    - `app/api/admin/roles/set/route.ts` (`admin:roles:assign`).
    - `app/api/admin/audit/route.ts` (`admin:audit:view`).

- **Legacy admin guard**
  - `lib/server/adminGuard.ts` (`requireAdminFromRequest`):
    - Uses `x-admin-email` and checks:
      - `user.role === "admin"` **or**
      - email in `NEXT_PUBLIC_ADMIN_EMAILS`.
    - Used for:
      - `app/api/admin/team/invite/route.ts` (admin invites).
      - (Previously) `app/api/admin/site-content/top-bar/route.ts` (now migrated to RBAC below).
  - This is intentionally **stricter** than RBAC: only true admins can invite new admins.

- **Admin shell and navigation**
  - `app/admin/AdminShell.tsx`:
    - Uses `useAuth` + `/api/admin/me` to load the current user and permissions.
    - Computes `isAdmin` as:
      - `user.role === "admin"` or email in `NEXT_PUBLIC_ADMIN_EMAILS`.
      - If not admin ⇒ access denied for the entire admin UI.
    - For each nav item:
      - If a `permission` is set, the item is only shown when:
        - `permissions` includes `"*"` **or** the specific permission string.
    - Examples:
      - **Site Analysis** ⇒ `seo:view`.
      - **SEO Settings** ⇒ `seo:edit`.
      - **Banner Settings** ⇒ `banner:edit`.
      - **Team & Roles / Roles** ⇒ `admin:roles:view`.

### 2. What’s been done specifically for SEO & the banner

- **Promo banner editing** (top bar):
  - UI: `app/admin/settings/banner/page.tsx`.
  - API: `app/api/admin/site-content/top-bar/route.ts`.
  - Previously this API used `requireAdminFromRequest`, meaning only:
    - Users with `role === "admin"` or emails in `NEXT_PUBLIC_ADMIN_EMAILS` could edit the banner.
  - **Now updated**:
    - The route uses `requirePermissionFromRequest(request, "banner:edit")` for both `GET` and `PUT`.
    - `updatedBy` is recorded as `perm.adminEmail`.
    - The admin nav entry uses `permission: "banner:edit"` instead of `content:edit`.
  - Result:
    - Any role that includes `banner:edit` (e.g. `content_editor` from the seed) can:
      - See the **Banner Settings** menu item.
      - Read & update the banner text.
    - This is how **SEO/content teams** can be allowed to manage the banner without being full admins.

### 3. What is still in pipeline / partially implemented

- **Roles UI**
  - `app/admin/settings/roles/page.tsx` currently displays a placeholder:
    - “The detailed roles management UI is temporarily disabled while build issues are being fixed.”
  - The underlying APIs (`/api/admin/roles`, `/api/admin/roles/set`, `/api/admin/me`) and seed logic are live, but:
    - There is no fully wired UI at the moment to create/edit roles or toggle permissions from the browser.

- **Mixed guards**
  - Some admin APIs use **RBAC** (`requirePermissionFromRequest`).
  - Others use the legacy **admin-only** guard (`requireAdminFromRequest`) for sensitive operations such as:
    - Creating, resending, and revoking admin invites.
  - This is intentional for now, but it means:
    - Not all admin operations are assignable via arbitrary roles yet.

- **Permission naming & coverage**
  - Many scopes exist (`seo:view`, `seo:edit`, `banner:edit`, `content:edit`, `admin:roles:assign`, etc.).
  - There isn’t yet a formal matrix that maps **all** admin routes to their permission keys.
  - Some planned/mentioned scopes in docs may not be fully wired to endpoints yet.

### 4. Recommended improvements

- **A. Solidify an SEO-focused role**
  - Add a canonical `seo_specialist` or `seo_manager` role in the seed or via UI with:
    - `seo:view`, `seo:edit`
    - `site:analytics:view`
    - `content:edit`
    - `banner:edit`
  - Document in `ROLES_README.md` that:
    - SEO owners should get this role to manage analytics, SEO settings, and promo banners.

- **B. Finish and restore the Roles UI**
  - Re-implement `app/admin/settings/roles/page.tsx` to:
    - List all roles with descriptions.
    - Support create/update/delete of roles.
    - Offer checklists for:
      - Permissions (with friendly labels).
      - Email event subscriptions.
    - Provide an “Assignments” modal to:
      - Attach/detach roles to a given user.
  - Ensure the UI calls:
    - `/api/admin/roles` for CRUD.
    - `/api/admin/roles/set` for setting role arrays on users.

- **C. Route-to-permission matrix**
  - Add a simple markdown table (can live here or in `ROLES_README.md`) mapping:
    - `HTTP method + path` → required permission.
  - Use this to:
    - Verify every `app/api/admin/*` route has a clear permission.
    - Avoid “hidden” admin-only operations that bypass RBAC unintentionally.

- **D. Gradually replace ad-hoc admin checks with RBAC (where appropriate)**
  - For highly sensitive flows (e.g. team invites), continue to require:
    - `requireAdminFromRequest`, OR
    - A very specific high-privilege permission (e.g. `admin:team:manage`) held only by owners.
  - For all other admin features (pages, content, reports, exports), standardize on:
    - `requirePermissionFromRequest(request, "<feature-scope>")`.
  - This makes it much easier to:
    - Create new roles with specific scopes (like SEO or marketing).
    - Audit who can do what just by inspecting roles and permissions.

- **E. Hardening & DX**
  - Optionally, migrate from `x-admin-email` headers to a JWT/session-based admin identity for production.
  - Add integration tests that:
    - Seed roles and a few test accounts.
    - Assert that permissions like `seo:view`, `banner:edit`, `admin:roles:assign` gate the correct endpoints.
  - Enhance audit logging to include:
    - Which permission (or wildcard) allowed a given action.

### 5. How to reason about “who can edit what”

When planning new roles or adjusting existing ones, use this checklist:

1. **Identify the feature’s permission key**
   - Example: promo banner ⇒ `banner:edit`.
2. **Check which routes and UI pieces use that permission**
   - API: `requirePermissionFromRequest(request, "banner:edit")`.
   - UI: nav or buttons check `permissions.includes("banner:edit")` (or `"*"`).
3. **Attach that permission only to roles that should truly own it**
   - Example for SEO:
     - `seo_specialist` + `content_editor` might both get `banner:edit`.
4. **Assign those roles to specific users from the Team/Roles flows**
   - Team page: attach roles to admins.
   - Roles page (once fully restored): edit roles and their permission sets.

With the current setup and the `banner:edit` change, **SEO/content owners can edit the site-wide promo banner without elevating them to full super-admins**, and the RBAC model is ready to support more granular roles as needed.


