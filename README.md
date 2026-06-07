# SnapDocket

Production-ready, mobile-first white-label onsite invoicing, job, and customer management platform.

**Stack:** Next.js 14 (App Router) · Refine · Supabase (Postgres + Auth + Storage) · TypeScript · Tailwind CSS · Vercel

---

## Quick Start (Local)

### Prerequisites

- Node.js >= 20
- npm >= 10
- [Supabase CLI](https://supabase.com/docs/guides/cli) (`npm install -g supabase`)

### 1. Install dependencies

```bash
npm ci
```

### 2. Configure environment

```bash
cp .env.example .env.local
```

Edit `.env.local` with your Supabase project values:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
WEBHOOK_SECRET=$(openssl rand -hex 32)
CRON_SECRET=$(openssl rand -hex 32)
```

### 3. Start local Supabase

```bash
supabase start
# or
make supabase-start
```

### 4. Run migrations

```bash
supabase db reset
# or
make migrate-local
```

This applies all files in `supabase/migrations/` in order and seeds demo data.

### 5. Start the dev server

```bash
npm run dev
# or
make dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## npm Scripts

| Command              | Description               |
| -------------------- | ------------------------- |
| `npm run dev`        | Start Next.js dev server  |
| `npm run build`      | Production build          |
| `npm run start`      | Start production server   |
| `npm run lint`       | ESLint + TypeScript check |
| `npm run format`     | Prettier format all files |
| `npm test`           | Run Vitest unit tests     |
| `npm run type-check` | TypeScript compiler check |

---

## Makefile Targets

```bash
make setup          # install + supabase start + migrate (first-time setup)
make dev            # start dev server
make migrate        # push migrations to remote Supabase
make migrate-local  # reset local DB and replay migrations
make seed           # reset local DB with demo data
make test           # run test suite
make lint           # lint and type-check
```

---

## Database Migrations

Migration files live in `supabase/migrations/`:

| File           | Description                                         |
| -------------- | --------------------------------------------------- |
| `001_init.sql` | Core domain tables, triggers, auto-profile creation |
| `002_rls.sql`  | Row Level Security policies for multi-tenant RBAC   |

`supabase/seed.sql` — demo data applied automatically by `supabase db reset` (local only, never pushed to remote).

### Run migrations against remote project

```bash
supabase db push --project-ref <your-project-ref>
# or
make migrate
```

---

## Deploy to Vercel

### Option A: Git Integration (recommended)

1. Import the GitHub repo in [Vercel dashboard](https://vercel.com/new)
2. Add environment variables (see `.env.example`) in Vercel project settings
3. Push to `main` — auto-deploys on every commit

### Option B: Vercel CLI

```bash
npm install -g vercel
vercel                     # preview deploy
vercel --prod              # production deploy
```

### Required Vercel environment variables

Set these in Vercel dashboard > Project > Settings > Environment Variables:

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
WEBHOOK_SECRET
CRON_SECRET
```

---

## CI/CD

GitHub Actions workflows in `.github/workflows/`:

- **`ci.yml`** — lint → type-check → test → build → preview deploy (on PRs)
- **`deploy.yml`** — production deploy to Vercel (on push to `main`)

Required GitHub secrets:

```
VERCEL_TOKEN          # Vercel API token
VERCEL_ORG_ID         # Vercel team/org ID
VERCEL_PROJECT_ID     # Vercel project ID
```

---

## Architecture

```
app/
├── (auth)/login/          # Public login page
├── (dashboard)/           # Protected dashboard shell
│   ├── dashboard/         # Overview & stats
│   ├── customers/         # Customer list + detail
│   ├── jobs/              # Job list + detail
│   ├── invoices/          # Invoice list + create + detail
│   └── payments/          # Payment list
├── api/
│   ├── webhooks/          # Incoming webhook receiver
│   ├── invoices/[id]/pdf/ # Invoice data for PDF rendering
│   └── agents/run/        # Cron-triggered agent runner
agents/                    # Automation agents (reminder, reconciliation)
plugins/                   # Extension points (auth, payments, reporting)
lib/
├── supabase/              # Browser + server + middleware clients
├── auth/                  # Refine auth provider
├── data-provider/         # Refine data provider adapter
├── event-bus/             # App-wide event emitter + webhook forwarder
└── theme/                 # CSS variable tokens + runtime loader
supabase/migrations/       # SQL migration files
components/
├── ui/                    # Button, Input, Card, Badge, DataTable
├── layout/                # Sidebar, Header, MobileNav
├── invoice/               # InvoiceForm
└── theme/                 # ThemeProvider
types/index.ts             # All domain types
```

### Multi-tenancy & White-labelling

- Every table has a `tenant_id` column enforced by RLS policies
- Tenant branding (colours, logo, font) is stored as JSONB in `tenants.branding`
- `ThemeProvider` applies CSS variable overrides at runtime — zero page reload
- To white-label for a new tenant: insert a row in `tenants` with custom `branding` JSON

### Agentic Patterns

- **Agents** (`agents/`) implement the `Agent` interface and are called from `/api/agents/run`
- **Plugins** (`plugins/`) define interfaces for auth, payments, and reporting — swap implementations without touching pages
- **Event bus** (`lib/event-bus/`) is a typed EventEmitter3 — emit domain events, subscribe anywhere, forward to webhooks

---

## Security Notes

- RLS is enabled on all tables — users can only access their own tenant's data
- Service role key is server-only and never sent to the browser
- CSP headers are set in `next.config.js` — tighten before production
- Webhook signatures are HMAC-SHA256 verified
- Cron endpoint requires a bearer token (`CRON_SECRET`)
- **TODO:** Enable `enable_confirmations = true` in `supabase/config.toml` for production
- **TODO:** Rotate `SUPABASE_SERVICE_ROLE_KEY` periodically via the Supabase dashboard

---

## Extending

### Add a payment provider

1. Implement `PaymentPlugin` in `plugins/payments/`
2. Register the plugin and call it from the invoice payment flow
3. Handle webhook events in `app/api/webhooks/route.ts`

### Add a new agent

1. Implement `Agent` in `agents/`
2. Register in `agents/runner.ts`
3. Trigger via `POST /api/agents/run` with `{ "agent": "your-agent", "tenantId": "..." }`

### Add server-side PDF

1. Implement `ReportingPlugin` in `plugins/reporting/`
2. Replace the stub in `app/api/invoices/[id]/pdf/route.ts`

---

## Initial Commit

```
chore(scaffold): init refine+supabase+nextjs scaffold
```
