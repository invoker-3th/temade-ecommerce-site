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
