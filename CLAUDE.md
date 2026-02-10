# Nimbus - Cloud FinOps Platform

## Project Overview

Nimbus is a unified, multi-tenant Cloud FinOps platform built for BFSI (Banking, Financial Services, Insurance) clients. It provides cost visibility, optimization recommendations, budget governance, and forecasting across AWS, Azure, GCP, and Kubernetes.

The architecture draws from 10 best-in-class open-source FinOps projects (OptScale, Komiser, OpenCost, Infracost, Crane, Koku, Microsoft FinOps Toolkit, Cloudforet, AI-for-FinOps, AWS Well-Architected Labs) and combines their strengths into a single deployable product.

## Architecture

### Stack

| Layer              | Technology                                          |
| ------------------ | --------------------------------------------------- |
| Frontend           | Next.js 15 (App Router, RSC, Server Actions)        |
| Styling            | Tailwind CSS + shadcn/ui + Tremor (charts)           |
| Font               | Geist (variable weight)                              |
| Auth               | NextAuth.js v5 (OAuth, SAML, credentials)            |
| ORM                | Prisma (PostgreSQL)                                  |
| Validation         | Zod                                                  |
| Background Jobs    | BullMQ + Redis                                       |
| Database           | PostgreSQL 16 + Redis 7                              |
| Future Analytics   | ClickHouse (when scale demands)                      |
| Language           | TypeScript everywhere                                |
| Monorepo           | pnpm workspaces + Turborepo                          |
| Testing            | Vitest (unit) + Playwright (e2e)                     |
| CI/CD              | GitHub Actions                                       |

### Monorepo Structure

```
nimbus/
├── apps/web/          → Next.js full-stack application
├── packages/db/       → Shared Prisma client + generated types
├── packages/ui/       → Shared UI component library
├── workers/ingestion/ → BullMQ workers for billing data import
└── deploy/            → Docker, Helm, scripts
```

### Data Flow

```
Cloud Billing APIs (CUR, Cost Management, BigQuery Export)
    ↓
Ingestion Workers (BullMQ) → normalize to FOCUS schema
    ↓
PostgreSQL (operational data) + Redis (cache/queues)
    ↓
Next.js API Routes / Server Actions
    ↓
Dashboard (Server Components + Client Charts)
```

### Key Design Decisions

1. **FOCUS Schema**: All cost data normalized to FinOps Foundation FOCUS spec for vendor-neutral storage
2. **Multi-tenant**: Row-Level Security in PostgreSQL. Every query scoped to `tenantId`
3. **Server Components by default**: Only use `"use client"` when interactivity is required
4. **Deploy anywhere**: Docker Compose (simple), Helm (enterprise K8s), Vercel (managed), standalone Node.js (bare metal)
5. **Single language**: TypeScript across frontend, backend, and workers. Go microservices added only when perf demands it

## Coding Conventions

### TypeScript

- Strict mode enabled. No `any` types.
- Use `interface` for object shapes, `type` for unions/intersections
- Prefer named exports over default exports
- Use Zod schemas as the single source of truth for validation, then infer types: `type Foo = z.infer<typeof FooSchema>`

### React / Next.js

- **Server Components** by default. Add `"use client"` only for interactive components (forms, charts, dropdowns)
- **Server Actions** for mutations (form submissions, data writes)
- **Route Handlers** (`app/api/`) only for webhook endpoints and external API consumers
- Use `nuqs` for URL-based state (filters, pagination, date ranges)
- Colocate components with their route: `app/(dashboard)/costs/components/cost-table.tsx`

### Styling

- Tailwind CSS utility classes. No custom CSS unless absolutely necessary.
- Use shadcn/ui components as the base. Customize via CSS variables in `globals.css`
- Design tokens (colors, spacing, radii) defined in `tailwind.config.ts`
- Per-tenant theming via CSS custom properties (primary color, logo, brand name)

### Database

- All tables include `tenant_id` column for multi-tenancy
- Use Prisma migrations. Never modify the database directly.
- Naming: snake_case for tables/columns in PostgreSQL, camelCase in TypeScript
- Soft deletes where appropriate (`deleted_at` timestamp)
- Always include `created_at` and `updated_at` timestamps

### API Design

- Input validation with Zod at the boundary
- Consistent error format: `{ error: { code: string, message: string } }`
- Pagination: cursor-based for large datasets, offset for small ones
- All endpoints require authentication except `/api/health` and `/api/auth/*`

### File Naming

- Components: `PascalCase.tsx` (e.g., `CostTable.tsx`)
- Utilities/libs: `camelCase.ts` (e.g., `formatCurrency.ts`)
- Route files: `page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`
- API routes: `route.ts`

### Git

- Branch naming: `feat/`, `fix/`, `chore/`, `docs/`
- Commit messages: conventional commits (`feat: add cost breakdown chart`)
- PR required for `main`. No direct pushes.

## Environment Variables

All configuration via environment variables. See `.env.example` for the full list.

Critical variables:
- `DATABASE_URL` — PostgreSQL connection string
- `REDIS_URL` — Redis connection string
- `NEXTAUTH_SECRET` — Auth encryption key
- `NEXTAUTH_URL` — Base URL of the app

Cloud provider credentials (per tenant, stored encrypted in DB):
- AWS: Access Key + Secret (or IAM role ARN)
- Azure: Client ID + Secret + Tenant ID
- GCP: Service Account JSON

## Deployment

### Quick Start (Development)

```bash
pnpm install
docker compose up -d    # PostgreSQL + Redis
pnpm db:migrate         # Run Prisma migrations
pnpm dev                # Start Next.js dev server
```

### Production (Docker Compose)

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### Production (Kubernetes)

```bash
helm install nimbus ./deploy/helm/nimbus \
  --set database.url=$DATABASE_URL \
  --set redis.url=$REDIS_URL \
  --set auth.secret=$NEXTAUTH_SECRET
```

### Production (Vercel)

```bash
vercel deploy --prod
# Set env vars in Vercel dashboard
# Use managed PostgreSQL (Neon/Supabase) and Redis (Upstash)
```

## Testing

```bash
pnpm test              # Unit tests (Vitest)
pnpm test:e2e          # E2E tests (Playwright)
pnpm lint              # ESLint + Prettier
pnpm typecheck         # TypeScript type checking
```

## Key Modules

### Cloud Adapters (`lib/cloud/`)
Provider-specific SDK wrappers. Each adapter implements a common interface:
- `listResources()` — discover cloud resources
- `getCosts(dateRange)` — fetch billing data
- `getRecommendations()` — fetch native optimization recommendations

### FOCUS Normalizer (`lib/focus/`)
Maps provider-specific billing formats to the FOCUS schema:
- AWS CUR → FOCUS
- Azure Cost Management → FOCUS
- GCP BigQuery Export → FOCUS

### Ingestion Workers (`workers/ingestion/`)
BullMQ-based background workers that:
1. Pull billing data from cloud APIs on a schedule
2. Normalize to FOCUS schema
3. Store in PostgreSQL
4. Trigger anomaly detection checks

## Multi-Tenancy Model

Each client (tenant) is isolated via:
- `tenant_id` on every database row
- Prisma middleware that auto-injects tenant context
- Separate encryption keys for cloud credentials per tenant
- Tenant-specific theming (colors, logo, name) stored in tenant config

## Performance Targets

- Dashboard page load: < 2s (Server Components + streaming)
- API response (cached): < 100ms
- API response (DB query): < 500ms
- Billing data ingestion: < 5 min for 1M line items
- Docker image size: < 500MB
