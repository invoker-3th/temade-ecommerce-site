# Email System Overview

This document explains how emails work in this repo and how they can be improved.

## Current Email Flows

### 1) Signup Email Verification (Resend)
- Trigger: user signup (`POST /api/auth/register`)
- File: `app/api/auth/register/route.ts`
- What happens:
  - Creates user (unverified)
  - Generates a JWT verification token + OTP
  - Stores token + OTP in `email_verifications` collection
  - Sends a welcome/verification email with a link and OTP
- Verification:
  - Link: `/auth/verify?token=...&otp=...`
  - API: `GET /api/auth/verify` (`app/api/auth/verify/route.ts`)
  - Sets `isEmailVerified=true` and saves user in localStorage

### 2) Admin Login Alert (Resend)
- Trigger: admin login (`POST /api/auth/login`)
- File: `app/api/auth/login/route.ts`
- Includes: username, email, time, IP, and user-agent

## Email Infrastructure
- File: `lib/email.ts`
- Provider: Resend
- Required env vars:
  - `RESEND_API_KEY`
  - `RESEND_FROM` or `RESEND_FROM_EMAIL`
  - `RESEND_REPLY_TO` (optional)

## Environment Variables Used
```
RESEND_API_KEY=
RESEND_FROM=          # or RESEND_FROM_EMAIL=
RESEND_REPLY_TO=
EMAIL_VERIFICATION_JWT_SECRET=
EMAIL_VERIFICATION_TOKEN_TTL_MINUTES=1440
EMAIL_VERIFICATION_OTP_TTL_MINUTES=30
NEXT_PUBLIC_BASE_URL= # used to build verification link
```

## What Gets Stored
Collection: `email_verifications`
- `userId`
- `email`
- `token`
- `otp`
- `expiresAt`
- `otpExpiresAt`
- `createdAt`
- `usedAt`

## How It Can Be Improved
1. Add “Resend Verification Email”
   - Add a UI button in `/auth/login` when verification fails.
   - Add API route to issue a new token + OTP and send again.
2. Enforce OTP on verification page
   - Currently OTP is not validated server-side.
   - Add OTP check in `GET /api/auth/verify`.
3. Email templates
   - Replace inline HTML strings with reusable templates.
   - Add branded header/footer and consistent styles.
4. Rate limiting
   - Prevent abuse of resend/verification endpoints.
5. Email event logging
   - Save sent email status in DB for audit/history.
6. Deliverability
   - Set up domain SPF/DKIM/DMARC for Resend.
7. Admin alerts configuration
   - Make alert email configurable via env var.
8. Add password-based auth (optional)
   - Currently login is email+username only.
   - Add hashed passwords for stronger security.

