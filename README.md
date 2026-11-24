# Code Escape Master

A responsive coding-game starter built with Next.js, React, TypeScript, Tailwind CSS, and Supabase. Its first playable slice opens with an original forest-trail adventure intro and includes a 100-level nature-themed campaign, interactive JavaScript challenges, XP and coins, daily rewards and streaks, achievements, a Supabase-backed leaderboard, and an explorer shop.

The current demo includes original illustrated forest artwork and a fictional cricket-inspired field captain, 20 authored JavaScript multiple-choice challenges, campaign/world progression, XP ranks with a level-up celebration, persistent character selection, daily rewards, heart-based retries, optional browser speech for challenge briefings, and a Hall of Fame with the campaign completion date. Supabase can provide Google OAuth, email magic-link sign-in, cloud progress, and a public leaderboard. Google AdSense Auto ads are included as an opt-in integration and remain off until configured. The challenge set currently rotates through the 100 campaign levels; it is not yet a complete 100-question curriculum.

## Run locally

Requirements: Node.js 20.9 or newer.

```bash
npm install
npm run dev
```

The app runs without provider credentials in local demo mode. To enable Supabase locally:

1. Create a Supabase project and run [`supabase/schema.sql`](./supabase/schema.sql) in its SQL Editor.
2. Copy `.env.example` to `.env.local` and set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` from the project's API settings. These are browser-visible publishable values; **never** use a service-role key in the browser or commit credentials.
3. In Supabase Authentication settings, set the site URL and add `http://localhost:3000` to the allowed redirect URLs.
4. Enable Google under Authentication → Sign In / Providers. Create a Google OAuth client, set its authorized redirect URI to `https://<project-ref>.supabase.co/auth/v1/callback`, and enter the Google client ID and secret in Supabase's Google provider settings. The app starts the OAuth flow; Supabase completes the callback and returns the user to the app.
5. Configure a production email sender/SMTP provider in Supabase before relying on email magic links for real users.

The leaderboard view selects from a database view that exposes only display name, avatar, XP, completed levels, and update time. Row-level security restricts profile reads and writes to the signed-in owner. Scores are currently client-authoritative, so users can alter their own XP through browser tools; move challenge validation and reward grants to trusted server-side code before using this leaderboard for prizes or high-stakes competition.

## GitHub and Vercel deployment

Import the GitHub repository into a Vercel project and use the standard Next.js build settings. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` to the Vercel project's environment variables, then redeploy. Add the deployed site's origin to Supabase's allowed redirect URLs and set it as the Supabase site URL. Never add a Supabase service-role key to `NEXT_PUBLIC_*` variables.

## Google AdSense

The root layout includes the AdSense Auto ads loader, but it does not load ads unless both `NEXT_PUBLIC_ADSENSE_ENABLED=true` and `NEXT_PUBLIC_ADSENSE_CLIENT_ID` are set. Add the publisher client ID only after AdSense approves the deployed site. Ad serving also depends on Google's review and consent requirements; use a Google-certified consent management platform where required (including relevant EEA, UK, and Swiss traffic). The integration is intentionally off by default.

For local development, create `.env.local` by copying the example file. Never commit `.env.local` or provider secrets.

Open [http://localhost:3000](http://localhost:3000).

Before deploying, run:

```bash
npm run lint
npm run build
```

## Current release scope

- Anonymous demo progress is saved in this browser using `localStorage`.
- Signing in syncs the current profile/progress to Supabase; existing cloud progress replaces the local demo state for that signed-in account.
- Completed trail challenges can be replayed for practice without earning campaign rewards again.
- The Hall of Fame completion date is saved locally and in the signed-in cloud profile when the 100th campaign level is completed.
- The challenge flow is an interactive starter example, not the complete 4,000-question curriculum.
- The app does not create Supabase or Google Cloud projects for you. Provider dashboards must be configured using the steps above before cloud sign-in, data sync, or ad serving can work.

This separation is intentional: shared accounts, competitive rankings, and trusted rewards require a configured identity provider and database. Add those credentials and server-side authorization before deploying those features as live services.
