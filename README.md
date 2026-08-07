# Nityavastra

TypeScript Next.js 15 (App Router) storefront + admin for sarees, daily wear, and home essentials.

**Stack:** TypeScript · Next.js Route Handlers · Supabase (Auth, Postgres, Storage, RLS) · Razorpay · Shiprocket

## New Supabase setup (required)

Create a **new** Supabase project, then in **SQL Editor** apply these two files **in order**:

1. [`supabase/schema.sql`](supabase/schema.sql) — full schema (tables, RLS, triggers, storage)
2. [`supabase/seed.sql`](supabase/seed.sql) — categories, products, banners, CMS, coupons

Do not skip the seed step if you want demo catalog/CMS data.

Then enable **Email** auth under Authentication → Providers.

### Create admin user

```bash
node scripts/create-admin.mjs admin@nityavastra.com YourSecurePassword Admin
```

Or sign up at `/login`, then in SQL:

```sql
UPDATE profiles SET role = 'admin' WHERE email = 'your@email.com';
```

## Local run

```bash
cp .env.example .env.local
# set NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
npm install
npm run dev
```

Open http://localhost:3000

## Environment

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role (server only) |
| `NEXT_PUBLIC_SITE_URL` | Canonical URL |
| `CRON_SECRET` | Bearer token for `/api/cron/shiprocket-poll` |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` | Payments (optional; mock pay if unset) |
| `SHIPROCKET_*` | Shipping (optional) |

## Deploy to Cloudflare Workers

Uses [`@opennextjs/cloudflare`](https://opennext.js.org/cloudflare).

1. **Build-time env (required for Git CI)** — In Cloudflare → Worker → Settings → Build → Variables and secrets, add at least:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_SITE_URL`  
   Without these, `next build` fails while prerendering `/_not-found`.

2. **Deploy**
   ```bash
   npm run deploy
   ```
   Or connect the repo and set the Workers Builds deploy command to `npx opennextjs-cloudflare build && npx opennextjs-cloudflare deploy` (or `upload`).

3. **Runtime secrets**
   ```bash
   npm run cf-sync-env
   ```
   Syncs `.env.local` to Worker secrets (including `CRON_SECRET`).

Shiprocket polling runs via a Cloudflare Cron Trigger every 15 minutes (`wrangler.jsonc` → `triggers.crons`).

## Scripts

- `npm run dev` — development
- `npm run build` — Next.js production build
- `npm start` — serve Node build
- `npm run preview` — OpenNext build + local Workers preview
- `npm run deploy` — OpenNext build + deploy to Cloudflare
- `npm run cf-sync-env` — upload `.env.local` as Worker secrets

## Project layout

```
app/           App Router pages + API routes (TypeScript)
components/    UI + storefront components
context/       Auth + Cart providers
lib/           Supabase, payments, Shiprocket helpers
types/         Shared TypeScript types
supabase/      schema.sql + seed.sql
```
