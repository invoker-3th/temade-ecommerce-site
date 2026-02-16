# Admin / CMS / Analytics / SEO Status and Roadmap

## Overview
This document summarizes what the repo currently provides, what has been implemented, and what remains to be done for Admin, SEO, CMS, Analytics, and Email.

## Implemented

### Admin UI Routes
- /admin (Dashboard KPIs + charts + time-range filters + notifications)
- /admin/site-analysis (GA4/GSC reporting UI)
- /admin/orders
- /admin/inventory
- /admin/lookbook
- /admin/users
- /admin/finance
- /admin/cms/pages

### Admin APIs
- /api/admin/analytics
- /api/admin/clear-analytics
- /api/admin/site-analysis
- /api/admin/orders
- /api/admin/products
- /api/admin/products/[id]
- /api/admin/categories
- /api/admin/lookbook
- /api/admin/upload
- /api/admin/delete-image
- /api/admin/notifications
- /api/admin/users
- /api/admin/users/[id]
- /api/admin/users/[id]/orders
- /api/admin/users/export
- /api/admin/finance
- /api/admin/pages
- /api/admin/pages/[id]
- /api/admin/seed

### Public APIs
- /api/pages/[slug] (published CMS pages only)

### CMS (Marketing Pages)
- Admin CMS with title, slug, excerpt, content
- SEO fields: meta title, meta description, canonical, OG image, JSON-LD
- Public rendering at /<slug> (published only)

### Analytics
- GA4 tag wired in layout
- PostHog loader with cookie consent
- Events tracked: add_to_cart, remove_from_cart, view_item, view_item_list, view_cart, begin_checkout, purchase

### Email
- Resend integration for order confirmation emails (Paystack webhook)

### Finance
- Revenue + order trends, currency + status breakdowns
- Recent orders table
- CSV export via /api/admin/finance?format=csv

### Users
- List/search, profile details, order history
- Role + disable actions
- CSV export via /api/admin/users/export

---

## Remaining Work (High Priority)
- Analytics: PostHog (free tier) - finalize project + verify events in production
- Core Web Vitals: web-vitals + PageSpeed API
- Crawl checks: custom internal crawler
- CMS media uploads: Cloudinary
- Sitemap/robots: native Next.js
- GSC verification: free verification method
- Cookie consent: custom lightweight banner (added, needs verification)
- Email templates (branding) + admin alert emails

---

## Recommended Next Steps
1. Finalize PostHog setup and verify event tracking in production
2. Implement web-vitals collection + PageSpeed API reporting
3. Add sitemap + robots with Next.js native route handlers
4. Add GSC verification + sitemap submission
5. Add CMS media uploads (Cloudinary) for OG images + page assets
6. Implement internal crawler for broken links
7. Add branded email templates + admin alerts

---

## Notes
- Admin access is fully driven by NEXT_PUBLIC_ADMIN_EMAILS.
- GA4 Measurement ID is set in app/layout.tsx and can be overridden via env.
- Public CMS pages render only when status is published.
