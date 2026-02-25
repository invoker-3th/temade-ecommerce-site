# Vercel Analytics — Connect Admin to View App Analytics

This guide shows how to enable Vercel Analytics for this project and give your admin users access to view analytics in the Vercel dashboard. It also covers the small in-app step already completed (client component) and troubleshooting notes.

## Summary of what we added in the app

- A client component is available at `app/components/VercelAnalytics.tsx` which renders `@vercel/analytics/react`.
- The component is imported and rendered in `app/layout.tsx` so analytics events are emitted when the app is deployed on Vercel.

## Steps to enable Analytics and give admin access

1. Create or sign in to your Vercel account
   - https://vercel.com/
   - If you use a team, decide which Vercel team will own the project.

2. Add the project to Vercel (if not already deployed)
   - From Vercel dashboard, click **New Project** → import your Git repository (GitHub/GitLab/Bitbucket).
   - Configure build settings (Next.js is auto-detected). The project root for this repo is the workspace root.

3. Install dependencies and deploy from your repo
   - Locally run:

```bash
pnpm install
pnpm build
# or start dev: pnpm dev
```

   - Push changes and let Vercel create a deployment. The `@vercel/analytics` package is already added to `package.json` and the client component is included in the app; a production deployment is required for analytics to report.

4. Enable Analytics for the project in Vercel
   - In the Project on Vercel, open **Settings → Analytics**.
   - Toggle analytics on for the project. (Some advanced features may require a Pro/Enterprise team — check Vercel pricing if any option is unavailable.)

5. Grant admin users access in Vercel
   - In Vercel, open the Team or Project **Members** settings.
   - Invite each admin's email and give them the appropriate role (Developer/Administrator) so they can view Analytics in the dashboard.

6. Verify analytics events
   - After a production deployment, open the Vercel project and go to the **Analytics** tab.
   - It may take a few minutes to surface data. You should see page views, web vitals, and other metrics.

## Optional: Custom events or server-side analytics

- The `@vercel/analytics/react` client component sends automatic page view metrics when deployed on Vercel. For custom events (e.g., purchases), consult Vercel docs for the server or client APIs.

## Troubleshooting

- No data appears in Analytics
  - Confirm the app is deployed to Vercel (production) and not just running locally.
  - Ensure `@vercel/analytics` is installed and included in a client component that renders in production (we added `VercelAnalytics.tsx` and included it in `app/layout.tsx`).
  - Check the Vercel Project Analytics settings are enabled.

- Access/permissions
  - If an admin can't see Analytics, verify they are a member of the same Vercel team or project and have at least `Developer` privileges.

- Build / runtime errors after adding analytics
  - Run `pnpm install` locally, then `pnpm build` to reproduce errors and fix them before pushing.

## Useful Links

- Vercel Analytics docs: https://vercel.com/docs/analytics
- @vercel/analytics package: https://www.npmjs.com/package/@vercel/analytics

If you want, I can also:
- Add instructions to show a link in your admin dashboard that opens the Vercel Analytics page for convenience.
- Add a small README snippet in the admin UI with a link to the project's Vercel analytics view.
