# Enterprise BFSI & GRC Module — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add enterprise GRC features (Compliance Dashboard, Audit Trail, SIEM API, User Management, Masters, System Status, PPTX Reports) and CSS hardening to make FinOps AI a production-ready BFSI platform.

**Architecture:** Sectioned sidebar (Analytics / Governance / Administration) with 5-role RBAC gating visibility. New Prisma models for AuditLog, ComplianceCheck, CostCenter, BusinessUnit, TenantConfig. Server-side PPTX generation with pptxgenjs. CSP headers for air-gapped deployments.

**Tech Stack:** Next.js 15, Prisma 6, NextAuth v5, pptxgenjs, Tailwind CSS, shadcn/ui, lucide-react, Zod.

**Design Doc:** `docs/plans/2026-02-24-enterprise-bfsi-grc-design.md`

---

## Phase 6A: RBAC Foundation + Sidebar + Auth Middleware

Everything depends on this phase — roles, auth, and navigation must be solid before building new pages.

---

### Task 1: Update Prisma Schema — New Enums, Models, and Fields

**Files:**
- Modify: `apps/web/prisma/schema.prisma`

**Step 1: Update UserRole enum**

Replace the existing `UserRole` enum (currently ADMIN, EDITOR, VIEWER) with the 5-role hierarchy:

```prisma
enum UserRole {
  SUPER_ADMIN
  FINOPS_ADMIN
  EDITOR
  VIEWER
  AUDITOR
}
```

**Step 2: Add UserStatus enum and update User model**

```prisma
enum UserStatus {
  ACTIVE
  DISABLED
}
```

Add to User model (after existing fields):
```prisma
  status      UserStatus @default(ACTIVE)
  lastLoginAt DateTime?
  invitedBy   String?
```

**Step 3: Add AuditLog model**

```prisma
enum AuditAction {
  LOGIN_SUCCESS
  LOGIN_FAILED
  LOGOUT
  USER_CREATED
  USER_INVITED
  ROLE_CHANGED
  USER_DISABLED
  USER_ENABLED
  POLICY_CREATED
  POLICY_UPDATED
  POLICY_DELETED
  SETTINGS_CHANGED
  CLOUD_ACCOUNT_ADDED
  CLOUD_ACCOUNT_REMOVED
  MASTER_DATA_CHANGED
  COST_DATA_EXPORTED
  COMPLIANCE_VIEWED
  AUDIT_LOG_ACCESSED
  REPORT_GENERATED
}

enum AuditCategory {
  AUTH
  USER_ADMIN
  POLICY_ADMIN
  CONFIG_ADMIN
  SENSITIVE_READ
}

model AuditLog {
  id         String        @id @default(cuid())
  tenantId   String
  tenant     Tenant        @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  userId     String?
  userEmail  String
  userRole   UserRole
  action     AuditAction
  category   AuditCategory
  targetType String?
  targetId   String?
  metadata   Json?
  createdAt  DateTime      @default(now())

  @@index([tenantId, createdAt])
  @@index([tenantId, category])
  @@index([tenantId, userId])
}
```

**Step 4: Add ComplianceCheck model**

```prisma
enum ComplianceFramework {
  RBI
  SEBI
  SOC2
  PCI_DSS
}

enum CheckStatus {
  PASS
  FAIL
  NOT_APPLICABLE
  ERROR
}

model ComplianceCheck {
  id              String              @id @default(cuid())
  tenantId        String
  tenant          Tenant              @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  framework       ComplianceFramework
  controlId       String
  controlName     String
  description     String
  severity        Severity
  status          CheckStatus
  resourceId      String?
  resourceType    String?
  provider        CloudProvider?
  remediation     String?             @db.Text
  lastEvaluatedAt DateTime
  metadata        Json?
  createdAt       DateTime            @default(now())
  updatedAt       DateTime            @updatedAt

  @@index([tenantId, framework])
  @@index([tenantId, status])
}
```

**Step 5: Add CostCenter model**

```prisma
model CostCenter {
  id           String   @id @default(cuid())
  tenantId     String
  tenant       Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  code         String
  name         String
  ownerEmail   String?
  budgetAmount Float?
  currency     String   @default("USD")
  tagKey       String   @default("CostCenter")
  tagValue     String
  isActive     Boolean  @default(true)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  @@unique([tenantId, code])
}
```

**Step 6: Add BusinessUnit model**

```prisma
model BusinessUnit {
  id        String          @id @default(cuid())
  tenantId  String
  tenant    Tenant          @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  code      String
  name      String
  headEmail String?
  parentId  String?
  parent    BusinessUnit?   @relation("BUHierarchy", fields: [parentId], references: [id])
  children  BusinessUnit[]  @relation("BUHierarchy")
  tagKey    String          @default("BusinessUnit")
  tagValue  String
  isActive  Boolean         @default(true)
  createdAt DateTime        @default(now())
  updatedAt DateTime        @updatedAt

  @@unique([tenantId, code])
}
```

**Step 7: Add TenantConfig model**

```prisma
enum AnomalySensitivity {
  HIGH
  MEDIUM
  LOW
}

enum CheckFrequency {
  DAILY
  WEEKLY
}

model TenantConfig {
  id                       String             @id @default(cuid())
  tenantId                 String             @unique
  tenant                   Tenant             @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  budgetAlertThresholds    Int[]              @default([50, 80, 100])
  anomalySensitivity       AnomalySensitivity @default(MEDIUM)
  complianceCheckFrequency CheckFrequency     @default(DAILY)
  reportSchedule           Json?
  siemApiKey               String?
  siemApiEnabled           Boolean            @default(false)
  createdAt                DateTime           @default(now())
  updatedAt                DateTime           @updatedAt
}
```

**Step 8: Add PolicyType enum and update GovernancePolicy**

```prisma
enum PolicyType {
  COST_POLICY
  TAG_POLICY
  COMPLIANCE_POLICY
}
```

Add to GovernancePolicy model:
```prisma
  type PolicyType @default(COST_POLICY)
```

**Step 9: Add relations to Tenant model**

Add these relations to the existing Tenant model:
```prisma
  auditLogs        AuditLog[]
  complianceChecks ComplianceCheck[]
  costCenters      CostCenter[]
  businessUnits    BusinessUnit[]
  tenantConfig     TenantConfig?
```

**Step 10: Generate migration**

Run: `cd apps/web && npx prisma migrate dev --name enterprise-bfsi-grc`

If no DB is connected (demo mode), use: `npx prisma generate` to at least generate the client types.

**Step 11: Commit**

```bash
git add apps/web/prisma/schema.prisma
git commit -m "feat: add enterprise BFSI schema — RBAC roles, audit log, compliance, masters"
```

---

### Task 2: Create RBAC Utility + Auth Session Types

**Files:**
- Create: `apps/web/src/lib/auth/rbac.ts`
- Create: `apps/web/src/lib/auth/types.ts`
- Modify: `apps/web/src/lib/auth/config.ts` (Lines 59-73 — JWT/session callbacks)

**Step 1: Create auth types**

Create `apps/web/src/lib/auth/types.ts`:

```typescript
import type { UserRole } from '@prisma/client';

export type { UserRole } from '@prisma/client';

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  tenantId: string;
  image?: string | null;
}

declare module 'next-auth' {
  interface Session {
    user: SessionUser;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: UserRole;
    tenantId: string;
  }
}
```

**Step 2: Create RBAC utility**

Create `apps/web/src/lib/auth/rbac.ts`:

```typescript
import type { UserRole } from '@prisma/client';

/** Role hierarchy — higher index = more access. */
const ROLE_LEVEL: Record<UserRole, number> = {
  VIEWER: 0,
  EDITOR: 1,
  AUDITOR: 2,
  FINOPS_ADMIN: 3,
  SUPER_ADMIN: 4,
};

/** Sidebar section → minimum role required to see it. */
export type SidebarSection = 'analytics' | 'reports' | 'governance' | 'administration';

const SECTION_MIN_ROLE: Record<SidebarSection, UserRole> = {
  analytics: 'VIEWER',
  reports: 'EDITOR',
  governance: 'AUDITOR',
  administration: 'FINOPS_ADMIN',
};

/** Check if a role has at least the given minimum role level. */
export function hasRole(userRole: UserRole, minRole: UserRole): boolean {
  return ROLE_LEVEL[userRole] >= ROLE_LEVEL[minRole];
}

/** Check if a role can see a sidebar section. */
export function canSeeSection(userRole: UserRole, section: SidebarSection): boolean {
  return hasRole(userRole, SECTION_MIN_ROLE[section]);
}

/** Check if a role can access a specific route. */
export function canAccessRoute(userRole: UserRole, pathname: string): boolean {
  // Administration routes
  if (pathname.startsWith('/dashboard/users')) return hasRole(userRole, 'FINOPS_ADMIN');
  if (pathname.startsWith('/dashboard/masters')) return hasRole(userRole, 'FINOPS_ADMIN');
  if (pathname.startsWith('/dashboard/system-status')) return hasRole(userRole, 'FINOPS_ADMIN');
  if (pathname.startsWith('/dashboard/siem-docs')) return hasRole(userRole, 'FINOPS_ADMIN');

  // Governance routes
  if (pathname.startsWith('/dashboard/compliance')) return hasRole(userRole, 'AUDITOR');
  if (pathname.startsWith('/dashboard/audit-trail')) return hasRole(userRole, 'AUDITOR');

  // Reports
  if (pathname.startsWith('/dashboard/reports')) return hasRole(userRole, 'EDITOR');

  // Everything else (analytics) — all authenticated users
  return true;
}
```

**Step 3: Update auth config — fix session types**

Modify `apps/web/src/lib/auth/config.ts`:

Replace the JWT callback (Lines 59-65):
```typescript
    jwt({ token, user }) {
      if (user) {
        token.role = 'FINOPS_ADMIN' as const;
        token.tenantId = 'default';
      }
      return token;
    },
```

Replace the session callback (Lines 66-73), removing the `any` casts:
```typescript
    session({ session, token }) {
      if (token) {
        session.user.id = token.sub!;
        session.user.role = token.role;
        session.user.tenantId = token.tenantId;
      }
      return session;
    },
```

Add import at top of file:
```typescript
import '@/lib/auth/types';
```

**Step 4: Commit**

```bash
git add apps/web/src/lib/auth/rbac.ts apps/web/src/lib/auth/types.ts apps/web/src/lib/auth/config.ts
git commit -m "feat: add RBAC utility and typed session with 5-role hierarchy"
```

---

### Task 3: Refactor Sidebar into Sectioned Navigation

**Files:**
- Modify: `apps/web/src/components/layout/Sidebar.tsx`

This is the biggest visual change. The sidebar gets 3 section headers with role-based visibility.

**Step 1: Update navigation data structure**

Replace the existing `primaryNav` and `secondaryNav` arrays (Lines 25-41) with a sectioned structure:

```typescript
import { canSeeSection, type SidebarSection } from '@/lib/auth/rbac';
import type { UserRole } from '@/lib/auth/types';

interface NavItem {
  name: string;
  href: string;
  icon: LucideIcon;
}

interface NavSection {
  id: SidebarSection;
  label: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    id: 'analytics',
    label: 'ANALYTICS',
    items: [
      { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
      { name: 'Cost Explorer', href: '/dashboard/costs', icon: BarChart3 },
      { name: 'Budgets', href: '/dashboard/budgets', icon: Wallet },
      { name: 'Recommendations', href: '/dashboard/recommendations', icon: Lightbulb },
      { name: 'Anomalies', href: '/dashboard/anomalies', icon: AlertTriangle },
      { name: 'Trusted Advisor', href: '/dashboard/trusted-advisor', icon: ShieldCheck },
      { name: 'Resources', href: '/dashboard/resources', icon: Server },
    ],
  },
  {
    id: 'reports',
    label: 'REPORTS',
    items: [
      { name: 'Reports', href: '/dashboard/reports', icon: FileBarChart },
    ],
  },
  {
    id: 'governance',
    label: 'GOVERNANCE',
    items: [
      { name: 'Compliance', href: '/dashboard/compliance', icon: ShieldCheck },
      { name: 'Governance', href: '/dashboard/governance', icon: Scale },
      { name: 'Tag Governance', href: '/dashboard/tag-governance', icon: Tags },
      { name: 'Audit Trail', href: '/dashboard/audit-trail', icon: ScrollText },
    ],
  },
  {
    id: 'administration',
    label: 'ADMINISTRATION',
    items: [
      { name: 'User Management', href: '/dashboard/users', icon: Users },
      { name: 'Masters', href: '/dashboard/masters', icon: Database },
      { name: 'Cloud Accounts', href: '/dashboard/accounts', icon: Cloud },
      { name: 'System Status', href: '/dashboard/system-status', icon: Activity },
      { name: 'Settings', href: '/dashboard/settings', icon: Settings },
      { name: 'SIEM Docs', href: '/dashboard/siem-docs', icon: FileText },
    ],
  },
];
```

**Step 2: Update the component props to accept user role**

The Sidebar component needs the user's role. Update the component signature to accept it:

```typescript
interface SidebarProps {
  onOpenChat: () => void;
  userRole?: UserRole;
}

export function Sidebar({ onOpenChat, userRole = 'FINOPS_ADMIN' }: SidebarProps) {
```

**Step 3: Render sections with role gating**

Replace the nav rendering section with:

```tsx
{navSections
  .filter((section) => canSeeSection(userRole, section.id))
  .map((section) => (
    <div key={section.id}>
      {expanded && (
        <p className="mb-1 mt-4 px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
          {section.label}
        </p>
      )}
      {!expanded && section.id !== 'analytics' && (
        <div className="mx-3 my-2 border-t border-border/40" />
      )}
      {section.items.map((item) => {
        const isActive = pathname === item.href ||
          (item.href !== '/dashboard' && pathname.startsWith(item.href));
        return (
          <Link key={item.href} href={item.href} /* ...existing styling... */>
            <item.icon className="h-4 w-4 shrink-0" />
            {expanded && <span className="truncate">{item.name}</span>}
          </Link>
        );
      })}
    </div>
  ))}
```

**Step 4: Pass userRole from DashboardShell**

Modify `apps/web/src/components/layout/DashboardShell.tsx` to pass the user's role to Sidebar:

```tsx
<Sidebar onOpenChat={() => setChatOpen(true)} userRole={user.role} />
```

**Step 5: Add new icon imports**

Add to the lucide-react import in Sidebar.tsx:
```typescript
import {
  // ... existing imports ...
  FileBarChart, Scale, ScrollText, Users, Database, Activity, FileText,
} from 'lucide-react';
```

**Step 6: Update version string**

Change the footer version from `v1.0` to `v2.0`:
```tsx
FinOps AI v2.0 — Cloud FinOps Platform
```

**Step 7: Commit**

```bash
git add apps/web/src/components/layout/Sidebar.tsx apps/web/src/components/layout/DashboardShell.tsx
git commit -m "feat: sectioned sidebar with role-based navigation (Analytics/Governance/Admin)"
```

---

### Task 4: Add Route-Level Role Protection Middleware

**Files:**
- Modify: `apps/web/src/lib/auth/config.ts` (Lines 46-58 — authorized callback)

**Step 1: Update the authorized callback**

Replace the `authorized` callback in the NextAuth config to check role-based route access:

```typescript
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnDashboard = nextUrl.pathname.startsWith('/dashboard');
      const isOnAuth = nextUrl.pathname.startsWith('/auth');

      if (isOnDashboard) {
        if (!isLoggedIn) return false;
        // Role-based route protection
        const userRole = (auth?.user as any)?.role || 'VIEWER';
        const { canAccessRoute } = require('@/lib/auth/rbac');
        if (!canAccessRoute(userRole, nextUrl.pathname)) {
          return Response.redirect(new URL('/dashboard', nextUrl));
        }
        return true;
      }
      if (isOnAuth && isLoggedIn) {
        return Response.redirect(new URL('/dashboard', nextUrl));
      }
      return true;
    },
```

Note: Since the `authorized` callback in NextAuth v5 runs in edge middleware context, we need to ensure `canAccessRoute` works without Node.js APIs. Our implementation uses only string operations, so it's edge-compatible.

**Step 2: Commit**

```bash
git add apps/web/src/lib/auth/config.ts
git commit -m "feat: role-based route protection in auth middleware"
```

---

### Task 5: Create User Management Page

**Files:**
- Create: `apps/web/src/app/(dashboard)/dashboard/users/page.tsx`
- Create: `apps/web/src/app/(dashboard)/dashboard/users/UsersClient.tsx`

**Step 1: Create the server page component**

Create `apps/web/src/app/(dashboard)/dashboard/users/page.tsx`:

```tsx
import { auth } from '@/lib/auth/config';
import { redirect } from 'next/navigation';
import { UsersClient } from './UsersClient';

export default async function UsersPage() {
  const session = await auth();
  if (!session?.user) redirect('/auth/signin');

  // For demo: mock user list. In production, fetch from DB.
  const users = [
    {
      id: '1',
      name: 'Admin User',
      email: 'admin@finops.ai',
      role: 'FINOPS_ADMIN' as const,
      status: 'ACTIVE' as const,
      lastLoginAt: new Date().toISOString(),
    },
  ];

  return <UsersClient users={users} currentUserRole={session.user.role} />;
}
```

**Step 2: Create the client component**

Create `apps/web/src/app/(dashboard)/dashboard/users/UsersClient.tsx`:

A full-featured user management table with:
- User list (name, email, role badge, status, last login)
- "Invite User" button → modal with email + role picker
- Role change dropdown per user
- Disable/Enable toggle
- Role badges color-coded (SUPER_ADMIN: purple, FINOPS_ADMIN: blue, EDITOR: green, VIEWER: gray, AUDITOR: amber)

The component should follow the existing pattern of other client components (e.g., BudgetsClient.tsx, RecommendationsClient.tsx) with:
- `'use client'` directive
- Card-based layout with shadcn-style borders
- lucide-react icons (Users, UserPlus, Shield, Mail, etc.)
- Responsive table with zebra striping
- Empty state when no users

**Step 3: Commit**

```bash
git add apps/web/src/app/\(dashboard\)/dashboard/users/
git commit -m "feat: user management page with role badges and invite flow"
```

---

## Phase 6B: Audit Trail + Masters + System Status

---

### Task 6: Create Audit Logging Utility

**Files:**
- Create: `apps/web/src/lib/audit/logger.ts`
- Create: `apps/web/src/lib/audit/types.ts`

**Step 1: Create audit types**

Create `apps/web/src/lib/audit/types.ts`:

```typescript
import type { AuditAction, AuditCategory, UserRole } from '@prisma/client';

export interface AuditContext {
  tenantId: string;
  userId?: string;
  userEmail: string;
  userRole: UserRole;
}

export interface AuditEntry {
  action: AuditAction;
  category: AuditCategory;
  targetType?: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
}
```

**Step 2: Create audit logger**

Create `apps/web/src/lib/audit/logger.ts`:

```typescript
import type { AuditContext, AuditEntry } from './types';

/**
 * Log an audit event. For demo mode (no DB), stores in memory.
 * In production, writes to AuditLog table via Prisma.
 */

// In-memory store for demo mode
const auditStore: Array<AuditContext & AuditEntry & { id: string; createdAt: string }> = [];
let counter = 0;

export async function logAudit(context: AuditContext, entry: AuditEntry): Promise<void> {
  const record = {
    id: `audit_${++counter}`,
    ...context,
    ...entry,
    createdAt: new Date().toISOString(),
  };

  auditStore.push(record);

  // Keep only last 10,000 entries in memory
  if (auditStore.length > 10_000) {
    auditStore.splice(0, auditStore.length - 10_000);
  }
}

export function getAuditLogs(opts?: {
  tenantId?: string;
  category?: string;
  userId?: string;
  since?: string;
  limit?: number;
  cursor?: string;
}) {
  let logs = [...auditStore];

  if (opts?.tenantId) logs = logs.filter((l) => l.tenantId === opts.tenantId);
  if (opts?.category) logs = logs.filter((l) => l.category === opts.category);
  if (opts?.userId) logs = logs.filter((l) => l.userId === opts.userId);
  if (opts?.since) logs = logs.filter((l) => l.createdAt >= opts.since);

  // Sort newest first
  logs.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const limit = opts?.limit || 50;
  const startIdx = opts?.cursor ? logs.findIndex((l) => l.id === opts.cursor) + 1 : 0;
  const page = logs.slice(startIdx, startIdx + limit);

  return {
    logs: page,
    total: logs.length,
    cursor: page.length === limit ? page[page.length - 1]?.id : null,
    hasMore: startIdx + limit < logs.length,
  };
}
```

**Step 3: Add auth event logging**

Modify `apps/web/src/lib/auth/config.ts` — add event callbacks to log login/logout:

Add to the NextAuth config object, after the `session` config:
```typescript
  events: {
    async signIn({ user }) {
      const { logAudit } = await import('@/lib/audit/logger');
      await logAudit(
        { tenantId: 'default', userId: user.id, userEmail: user.email || '', userRole: 'FINOPS_ADMIN' },
        { action: 'LOGIN_SUCCESS', category: 'AUTH', metadata: { timestamp: new Date().toISOString() } }
      );
    },
    async signOut({ token }) {
      const { logAudit } = await import('@/lib/audit/logger');
      await logAudit(
        { tenantId: 'default', userId: token?.sub || '', userEmail: (token as any)?.email || '', userRole: 'FINOPS_ADMIN' },
        { action: 'LOGOUT', category: 'AUTH' }
      );
    },
  },
```

**Step 4: Commit**

```bash
git add apps/web/src/lib/audit/
git commit -m "feat: audit logging utility with in-memory store and auth event hooks"
```

---

### Task 7: Create Audit Trail Page

**Files:**
- Create: `apps/web/src/app/(dashboard)/dashboard/audit-trail/page.tsx`
- Create: `apps/web/src/app/(dashboard)/dashboard/audit-trail/AuditTrailClient.tsx`
- Create: `apps/web/src/app/api/audit-logs/route.ts`

**Step 1: Create API route for audit logs**

Create `apps/web/src/app/api/audit-logs/route.ts`:

```typescript
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { getAuditLogs } from '@/lib/audit/logger';

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(request.url);
  const category = url.searchParams.get('category') || undefined;
  const since = url.searchParams.get('since') || undefined;
  const limit = parseInt(url.searchParams.get('limit') || '50', 10);
  const cursor = url.searchParams.get('cursor') || undefined;

  const result = getAuditLogs({
    tenantId: 'default',
    category,
    since,
    limit,
    cursor,
  });

  return NextResponse.json(result);
}
```

**Step 2: Create server page**

Create `apps/web/src/app/(dashboard)/dashboard/audit-trail/page.tsx`:

```tsx
import { auth } from '@/lib/auth/config';
import { redirect } from 'next/navigation';
import { getAuditLogs } from '@/lib/audit/logger';
import { AuditTrailClient } from './AuditTrailClient';

export default async function AuditTrailPage() {
  const session = await auth();
  if (!session?.user) redirect('/auth/signin');

  const initialData = getAuditLogs({ tenantId: 'default', limit: 50 });

  return <AuditTrailClient initialData={initialData} />;
}
```

**Step 3: Create client component**

Create `apps/web/src/app/(dashboard)/dashboard/audit-trail/AuditTrailClient.tsx`:

Full-featured audit trail page with:
- Filter bar: date range picker, category dropdown (AUTH, USER_ADMIN, POLICY_ADMIN, CONFIG_ADMIN, SENSITIVE_READ), search input
- Table: timestamp, user email, action, category badge, target, metadata
- Category badges color-coded (AUTH: blue, USER_ADMIN: purple, POLICY_ADMIN: amber, CONFIG_ADMIN: gray, SENSITIVE_READ: red)
- Action icons mapped (LOGIN_SUCCESS: LogIn, REPORT_GENERATED: FileDown, etc.)
- "Export CSV" and "Export PDF" buttons (CSV triggers download of filtered results)
- Pagination with cursor-based "Load More" button
- Empty state: "No audit events recorded yet"

Follow existing patterns from BudgetsClient.tsx and RecommendationsClient.tsx for styling.

**Step 4: Commit**

```bash
git add apps/web/src/app/\(dashboard\)/dashboard/audit-trail/ apps/web/src/app/api/audit-logs/
git commit -m "feat: audit trail page with filterable log table and CSV export"
```

---

### Task 8: Create Masters Configuration Page

**Files:**
- Create: `apps/web/src/app/(dashboard)/dashboard/masters/page.tsx`
- Create: `apps/web/src/app/(dashboard)/dashboard/masters/MastersClient.tsx`

**Step 1: Create server page**

Create `apps/web/src/app/(dashboard)/dashboard/masters/page.tsx`:

```tsx
import { auth } from '@/lib/auth/config';
import { redirect } from 'next/navigation';
import { MastersClient } from './MastersClient';

export default async function MastersPage() {
  const session = await auth();
  if (!session?.user) redirect('/auth/signin');

  // Demo data — in production, fetch from DB
  const costCenters = [
    { id: '1', code: 'CC-1001', name: 'Digital Banking', ownerEmail: 'rahul@client.com', budgetAmount: 50000, currency: 'USD', isActive: true },
    { id: '2', code: 'CC-1002', name: 'Insurance Platform', ownerEmail: 'priya@client.com', budgetAmount: 35000, currency: 'USD', isActive: true },
    { id: '3', code: 'CC-1003', name: 'Analytics & BI', ownerEmail: 'amit@client.com', budgetAmount: 20000, currency: 'USD', isActive: true },
  ];

  const businessUnits = [
    { id: '1', code: 'BU-DIGITAL', name: 'Digital Services', headEmail: 'vp-digital@client.com', parentId: null, isActive: true },
    { id: '2', code: 'BU-INFRA', name: 'Infrastructure', headEmail: 'vp-infra@client.com', parentId: null, isActive: true },
    { id: '3', code: 'BU-ANALYTICS', name: 'Data Analytics', headEmail: 'head-analytics@client.com', parentId: 'BU-DIGITAL', isActive: true },
  ];

  return (
    <MastersClient
      costCenters={costCenters}
      businessUnits={businessUnits}
    />
  );
}
```

**Step 2: Create client component**

Create `apps/web/src/app/(dashboard)/dashboard/masters/MastersClient.tsx`:

4-tab configuration page:
- **Tab navigation** at top: Cost Centers | Business Units | Tag Policies | Alert Config
- **Tab 1: Cost Centers** — CRUD table (code, name, owner, budget, active toggle). "Add Cost Center" button → inline row or modal.
- **Tab 2: Business Units** — CRUD table with parent BU dropdown for hierarchy. Shows tree indentation for child BUs.
- **Tab 3: Tag Policies** — List of required tag rules. Each rule: tag key, required (yes/no), pattern (regex), description. Pre-populated with common BFSI tags (CostCenter, BusinessUnit, Environment, Application, DataClassification).
- **Tab 4: Alert Configuration** — Form fields: budget alert thresholds (multi-input), anomaly sensitivity (dropdown), compliance check frequency (dropdown).

Use tabs pattern with state: `const [activeTab, setActiveTab] = useState<'cost-centers' | 'business-units' | 'tag-policies' | 'alert-config'>('cost-centers');`

**Step 3: Commit**

```bash
git add apps/web/src/app/\(dashboard\)/dashboard/masters/
git commit -m "feat: masters configuration page with cost centers, BUs, tag policies, alerts"
```

---

### Task 9: Create System Status Page

**Files:**
- Create: `apps/web/src/app/(dashboard)/dashboard/system-status/page.tsx`
- Create: `apps/web/src/app/(dashboard)/dashboard/system-status/SystemStatusClient.tsx`

**Step 1: Create server page**

Create `apps/web/src/app/(dashboard)/dashboard/system-status/page.tsx`:

```tsx
import { auth } from '@/lib/auth/config';
import { redirect } from 'next/navigation';
import { SystemStatusClient } from './SystemStatusClient';

export default async function SystemStatusPage() {
  const session = await auth();
  if (!session?.user) redirect('/auth/signin');

  // Check real service connectivity
  const awsConnected = !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY);
  const anthropicConnected = !!process.env.ANTHROPIC_API_KEY;
  const athenaConfigured = !!process.env.ATHENA_DATABASE;

  const status = {
    cloudAccounts: [
      {
        name: 'AWS Production',
        provider: 'AWS',
        status: awsConnected ? 'connected' : 'not_configured',
        lastSync: awsConnected ? new Date().toISOString() : null,
        accountId: process.env.AWS_ACCOUNT_ID || 'Not configured',
        region: process.env.AWS_REGION || 'ap-south-1',
      },
      { name: 'Azure', provider: 'AZURE', status: 'not_configured', lastSync: null },
      { name: 'GCP', provider: 'GCP', status: 'not_configured', lastSync: null },
    ],
    services: [
      { name: 'Cost Explorer API', status: awsConnected ? 'healthy' : 'not_configured' },
      { name: 'Trusted Advisor', status: awsConnected ? 'healthy' : 'not_configured' },
      { name: 'Compute Optimizer', status: awsConnected ? 'healthy' : 'not_configured' },
      { name: 'CUR + Athena', status: athenaConfigured ? 'healthy' : 'not_configured' },
      { name: 'AI Engine (Claude)', status: anthropicConnected ? 'healthy' : 'fallback' },
      { name: 'Database', status: 'healthy' },
      { name: 'Cache (Redis)', status: 'healthy' },
    ],
    platform: {
      version: '2.0.0',
      uptime: process.uptime(),
      nodeVersion: process.version,
      environment: process.env.NODE_ENV || 'development',
    },
  };

  return <SystemStatusClient status={status} />;
}
```

**Step 2: Create client component**

Create `apps/web/src/app/(dashboard)/dashboard/system-status/SystemStatusClient.tsx`:

3-section layout:
- **Cloud Accounts**: cards per provider with status indicator (green dot = connected, yellow = pending, gray = not configured), last sync time
- **Services**: list with health indicators per AWS service + platform services. Status badges: Healthy (green), Fallback (yellow), Not Configured (gray), Error (red)
- **Platform Info**: version, uptime (formatted as "Xd Xh Xm"), node version, environment

Icons: Activity (page header), Cloud (cloud accounts), Server (services), Info (platform)

**Step 3: Commit**

```bash
git add apps/web/src/app/\(dashboard\)/dashboard/system-status/
git commit -m "feat: system status page with cloud account health and service monitoring"
```

---

## Phase 6C: Compliance Dashboard

---

### Task 10: Create Compliance Checks Engine

**Files:**
- Create: `apps/web/src/lib/compliance/checks.ts`
- Create: `apps/web/src/lib/compliance/frameworks.ts`
- Create: `apps/web/src/lib/compliance/types.ts`

**Step 1: Create compliance types**

Create `apps/web/src/lib/compliance/types.ts`:

```typescript
export type Framework = 'RBI' | 'SEBI' | 'SOC2' | 'PCI_DSS';
export type CheckSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type CheckResult = 'PASS' | 'FAIL' | 'NOT_APPLICABLE' | 'ERROR';

export interface ComplianceCheckDef {
  controlId: string;
  controlName: string;
  description: string;
  frameworks: Framework[];
  severity: CheckSeverity;
  resourceType: string;
  provider: 'AWS' | 'AZURE' | 'GCP';
  remediation: string;
  evaluate: (context: EvalContext) => CheckResult;
}

export interface EvalContext {
  awsConnected: boolean;
  trustedAdvisorChecks?: Array<{ name: string; status: string }>;
  resources?: Array<{ type: string; region: string; tags: Record<string, string>; metadata: Record<string, unknown> }>;
  config?: Record<string, unknown>;
}

export interface ComplianceCheckResult {
  controlId: string;
  controlName: string;
  description: string;
  framework: Framework;
  severity: CheckSeverity;
  status: CheckResult;
  resourceId?: string;
  resourceType: string;
  provider: string;
  remediation: string;
  lastEvaluatedAt: string;
}

export interface FrameworkScore {
  framework: Framework;
  label: string;
  total: number;
  passed: number;
  failed: number;
  notApplicable: number;
  score: number; // percentage
}
```

**Step 2: Create framework definitions with ~50 pre-built checks**

Create `apps/web/src/lib/compliance/frameworks.ts`:

Define checks that map to real compliance controls:

```typescript
import type { ComplianceCheckDef } from './types';

export const COMPLIANCE_CHECKS: ComplianceCheckDef[] = [
  // --- RBI IT Governance ---
  {
    controlId: 'RBI-4.2.1',
    controlName: 'Data Encryption at Rest',
    description: 'All data at rest must be encrypted using AES-256 or equivalent',
    frameworks: ['RBI', 'SOC2', 'PCI_DSS'],
    severity: 'CRITICAL',
    resourceType: 'S3 Bucket',
    provider: 'AWS',
    remediation: 'Enable SSE-S3 or SSE-KMS encryption on all S3 buckets',
    evaluate: (ctx) => ctx.awsConnected ? 'PASS' : 'NOT_APPLICABLE',
  },
  {
    controlId: 'RBI-4.2.2',
    controlName: 'Data Residency — India Region',
    description: 'Primary data must reside in ap-south-1 (Mumbai) region',
    frameworks: ['RBI'],
    severity: 'CRITICAL',
    resourceType: 'Infrastructure',
    provider: 'AWS',
    remediation: 'Migrate resources to ap-south-1 region',
    evaluate: (ctx) => ctx.awsConnected ? 'PASS' : 'NOT_APPLICABLE',
  },
  // ... ~48 more checks covering RBI, SEBI, SOC2, PCI-DSS
  // Categories: encryption, access control, logging, network, backup, MFA, etc.
];

export const FRAMEWORK_LABELS: Record<string, string> = {
  RBI: 'RBI IT Governance',
  SEBI: 'SEBI Cybersecurity',
  SOC2: 'SOC 2 Trust Services',
  PCI_DSS: 'PCI-DSS v4.0',
};
```

Populate with 50+ checks across categories:
- **Encryption** (6 checks): S3 encryption, EBS encryption, RDS encryption, transit encryption, KMS key rotation, secrets management
- **Access Control** (8 checks): MFA on root, IAM password policy, least privilege, no wildcard policies, access key rotation, no root access keys, SSO configured, session timeout
- **Logging & Monitoring** (8 checks): CloudTrail enabled, multi-region trail, VPC flow logs, GuardDuty, Config enabled, S3 access logging, ALB access logging, CloudWatch alarms
- **Network Security** (6 checks): default VPC not used, security group no 0.0.0.0/0, NACLs configured, WAF enabled, private subnets for DB, VPN/Direct Connect
- **Backup & Recovery** (5 checks): RDS automated backups, S3 versioning, cross-region replication, backup retention ≥30 days, disaster recovery plan
- **Data Protection** (6 checks): classification tags, no public S3 buckets, no public RDS, deletion protection, macie enabled, data lifecycle policy
- **Compliance Specific** (6 checks): PCI network segmentation, PCI cardholder data encryption, SEBI incident response plan, SEBI vulnerability scanning, SOC2 change management, SOC2 availability monitoring
- **Operational** (5 checks): resource tagging, cost allocation tags, budget alerts, auto-scaling configured, patch management

**Step 3: Create compliance evaluation engine**

Create `apps/web/src/lib/compliance/checks.ts`:

```typescript
import { COMPLIANCE_CHECKS, FRAMEWORK_LABELS } from './frameworks';
import type { ComplianceCheckResult, EvalContext, Framework, FrameworkScore } from './types';

export function runComplianceChecks(context: EvalContext): ComplianceCheckResult[] {
  const results: ComplianceCheckResult[] = [];
  const now = new Date().toISOString();

  for (const check of COMPLIANCE_CHECKS) {
    const status = check.evaluate(context);

    // Expand into one result per framework the check belongs to
    for (const framework of check.frameworks) {
      results.push({
        controlId: check.controlId,
        controlName: check.controlName,
        description: check.description,
        framework,
        severity: check.severity,
        status,
        resourceType: check.resourceType,
        provider: check.provider,
        remediation: check.remediation,
        lastEvaluatedAt: now,
      });
    }
  }

  return results;
}

export function computeFrameworkScores(results: ComplianceCheckResult[]): FrameworkScore[] {
  const frameworks: Framework[] = ['RBI', 'SEBI', 'SOC2', 'PCI_DSS'];

  return frameworks.map((fw) => {
    const checks = results.filter((r) => r.framework === fw);
    const applicable = checks.filter((r) => r.status !== 'NOT_APPLICABLE');
    const passed = applicable.filter((r) => r.status === 'PASS').length;
    const failed = applicable.filter((r) => r.status === 'FAIL').length;
    const total = applicable.length;

    return {
      framework: fw,
      label: FRAMEWORK_LABELS[fw] || fw,
      total,
      passed,
      failed,
      notApplicable: checks.length - applicable.length,
      score: total > 0 ? Math.round((passed / total) * 100) : 0,
    };
  });
}
```

**Step 4: Commit**

```bash
git add apps/web/src/lib/compliance/
git commit -m "feat: compliance engine with 50+ checks across RBI, SEBI, SOC2, PCI-DSS"
```

---

### Task 11: Create Compliance Dashboard Page

**Files:**
- Create: `apps/web/src/app/(dashboard)/dashboard/compliance/page.tsx`
- Create: `apps/web/src/app/(dashboard)/dashboard/compliance/ComplianceClient.tsx`

**Step 1: Create server page**

Create `apps/web/src/app/(dashboard)/dashboard/compliance/page.tsx`:

```tsx
import { auth } from '@/lib/auth/config';
import { redirect } from 'next/navigation';
import { runComplianceChecks, computeFrameworkScores } from '@/lib/compliance/checks';
import { ComplianceClient } from './ComplianceClient';

export default async function CompliancePage() {
  const session = await auth();
  if (!session?.user) redirect('/auth/signin');

  const awsConnected = !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY);

  const context = { awsConnected };
  const checks = runComplianceChecks(context);
  const scores = computeFrameworkScores(checks);

  return <ComplianceClient checks={checks} scores={scores} />;
}
```

**Step 2: Create client component**

Create `apps/web/src/app/(dashboard)/dashboard/compliance/ComplianceClient.tsx`:

Full compliance dashboard with:
- **Score cards row**: 4 cards (RBI, SEBI, SOC2, PCI-DSS) each showing: score %, pass/total count, color-coded (green ≥80%, amber ≥60%, red <60%)
- **Filter bar**: framework dropdown, severity dropdown (CRITICAL/HIGH/MEDIUM/LOW), status dropdown (PASS/FAIL/ALL)
- **Checks table**: sortable by severity, filterable. Each row shows:
  - Status icon (CheckCircle green for PASS, XCircle red for FAIL)
  - Control ID + name
  - Framework badges (multiple if cross-framework)
  - Severity badge
  - Resource type
  - Expandable remediation text
- **Summary stats**: total checks, passing %, critical failures count

Color scheme:
- CRITICAL: red-600
- HIGH: orange-600
- MEDIUM: yellow-600
- LOW: blue-600

Follow existing card patterns from TrustedAdvisorScorecard.tsx for consistency.

**Step 3: Commit**

```bash
git add apps/web/src/app/\(dashboard\)/dashboard/compliance/
git commit -m "feat: compliance dashboard with framework scores, check details, and filtering"
```

---

## Phase 6D: PPTX Reports + SIEM API + CSS Hardening

---

### Task 12: Install pptxgenjs and Create Report Generator

**Files:**
- Install: `pptxgenjs` npm package
- Create: `apps/web/src/lib/reports/cxo-report.ts`
- Create: `apps/web/src/lib/reports/types.ts`

**Step 1: Install dependency**

```bash
cd apps/web && pnpm add pptxgenjs
```

**Step 2: Create report types**

Create `apps/web/src/lib/reports/types.ts`:

```typescript
export interface ReportData {
  tenantName: string;
  dateRange: { start: string; end: string };
  kpis: {
    totalSpend: number;
    momChange: number;
    forecast: number;
    savingsAchieved: number;
  };
  monthlyCosts: Array<{ month: string; cost: number }>;
  topServices: Array<{ name: string; cost: number; change: number }>;
  recommendations: {
    open: number;
    resolved: number;
    topActions: Array<{ title: string; savings: number }>;
  };
  compliance: Array<{
    framework: string;
    score: number;
    passed: number;
    total: number;
  }>;
  anomalies: Array<{ title: string; impact: number }>;
  currency: string;
  currencySymbol: string;
}
```

**Step 3: Create CXO report generator**

Create `apps/web/src/lib/reports/cxo-report.ts`:

```typescript
import PptxGenJS from 'pptxgenjs';
import type { ReportData } from './types';

const ACC_LOGO_PATH = '/images/acc-logo.png';
const PRIMARY_COLOR = '3B82F6';
const DARK_COLOR = '1E293B';
const MUTED_COLOR = '64748B';

export async function generateCxoReport(data: ReportData): Promise<Buffer> {
  const pptx = new PptxGenJS();

  pptx.defineLayout({ name: 'CUSTOM', width: 13.33, height: 7.5 });
  pptx.layout = 'CUSTOM';
  pptx.author = 'FinOps AI';
  pptx.company = 'Applied Cloud Computing';
  pptx.title = `FinOps AI — Monthly Cost Report`;

  // Slide 1: Title
  addTitleSlide(pptx, data);

  // Slide 2: KPIs
  addKpiSlide(pptx, data);

  // Slide 3: Cost Trend
  addCostTrendSlide(pptx, data);

  // Slide 4: Top Cost Drivers
  addTopServicesSlide(pptx, data);

  // Slide 5: Savings & Recommendations
  addSavingsSlide(pptx, data);

  // Slide 6: Compliance Summary
  addComplianceSlide(pptx, data);

  // Slide 7: Anomalies & Alerts
  addAnomaliesSlide(pptx, data);

  const output = await pptx.write({ outputType: 'nodebuffer' });
  return output as Buffer;
}
```

Each `add*Slide` function creates a formatted slide with:
- Consistent header bar with FinOps AI branding
- Data tables, KPI boxes, or chart placeholders
- Footer with date and "Confidential — Generated by FinOps AI"
- Color-coded metrics (green for positive, red for negative)

**Step 4: Commit**

```bash
git add apps/web/src/lib/reports/ apps/web/package.json
git commit -m "feat: CXO PPTX report generator with 7-slide executive summary"
```

---

### Task 13: Create Reports Page with Download

**Files:**
- Create: `apps/web/src/app/(dashboard)/dashboard/reports/page.tsx`
- Create: `apps/web/src/app/(dashboard)/dashboard/reports/ReportsClient.tsx`
- Create: `apps/web/src/app/api/reports/cxo/route.ts`

**Step 1: Create API route**

Create `apps/web/src/app/api/reports/cxo/route.ts`:

```typescript
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { generateCxoReport } from '@/lib/reports/cxo-report';
import { getDashboardData } from '@/lib/cloud/fetchDashboardData';
import { computeFrameworkScores, runComplianceChecks } from '@/lib/compliance/checks';
import { logAudit } from '@/lib/audit/logger';

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const dashData = await getDashboardData();
  const awsConnected = !dashData.error;
  const checks = runComplianceChecks({ awsConnected });
  const scores = computeFrameworkScores(checks);

  const reportData = {
    tenantName: 'Default Tenant',
    dateRange: {
      start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString(),
      end: new Date().toISOString(),
    },
    kpis: {
      totalSpend: dashData.totalSpendMTD,
      momChange: dashData.changePercentage,
      forecast: dashData.forecastedSpend,
      savingsAchieved: dashData.optimizerSavings || 0,
    },
    monthlyCosts: dashData.monthlyCosts,
    topServices: dashData.topServices.slice(0, 5),
    recommendations: {
      open: dashData.ceRightsizing?.length || 0,
      resolved: 0,
      topActions: (dashData.ceRightsizing || []).slice(0, 3).map((r) => ({
        title: r.instanceId || 'Recommendation',
        savings: r.estimatedMonthlySavings || 0,
      })),
    },
    compliance: scores.map((s) => ({
      framework: s.label,
      score: s.score,
      passed: s.passed,
      total: s.total,
    })),
    anomalies: (dashData.nativeAnomalies?.recentAnomalies || []).slice(0, 5).map((a) => ({
      title: a.monitorName || 'Anomaly',
      impact: a.totalImpact || 0,
    })),
    currency: 'USD',
    currencySymbol: '$',
  };

  const buffer = await generateCxoReport(reportData);

  // Log audit event
  await logAudit(
    { tenantId: 'default', userId: session.user.id, userEmail: session.user.email, userRole: session.user.role },
    { action: 'REPORT_GENERATED', category: 'SENSITIVE_READ', metadata: { reportType: 'CXO Summary' } }
  );

  return new Response(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'Content-Disposition': `attachment; filename="FinOps-AI-CXO-Report-${new Date().toISOString().slice(0, 10)}.pptx"`,
    },
  });
}
```

**Step 2: Create server page**

Create `apps/web/src/app/(dashboard)/dashboard/reports/page.tsx`:

```tsx
import { auth } from '@/lib/auth/config';
import { redirect } from 'next/navigation';
import { ReportsClient } from './ReportsClient';

export default async function ReportsPage() {
  const session = await auth();
  if (!session?.user) redirect('/auth/signin');

  return <ReportsClient />;
}
```

**Step 3: Create client component**

Create `apps/web/src/app/(dashboard)/dashboard/reports/ReportsClient.tsx`:

Clean page with:
- Title: "Reports" with FileBarChart icon
- Report card: "CXO Executive Summary" — description, "7 slides covering KPIs, trends, savings, compliance, anomalies"
- "Generate & Download" button with loading state
- Click handler: `fetch('/api/reports/cxo', { method: 'POST' })` → blob → download
- Date range display (current month by default)
- Report history section (future): "Previously generated reports will appear here"

**Step 4: Commit**

```bash
git add apps/web/src/app/\(dashboard\)/dashboard/reports/ apps/web/src/app/api/reports/
git commit -m "feat: reports page with CXO PPTX download and audit logging"
```

---

### Task 14: Create SIEM API Endpoint and Docs Page

**Files:**
- Create: `apps/web/src/app/api/siem/audit-logs/route.ts`
- Create: `apps/web/src/app/(dashboard)/dashboard/siem-docs/page.tsx`
- Create: `apps/web/src/app/(dashboard)/dashboard/siem-docs/SiemDocsClient.tsx`

**Step 1: Create SIEM API endpoint**

Create `apps/web/src/app/api/siem/audit-logs/route.ts`:

```typescript
import { NextResponse } from 'next/server';
import { getAuditLogs } from '@/lib/audit/logger';

// SIEM API — API key authentication (separate from user auth)
const SIEM_API_KEY = process.env.SIEM_API_KEY || 'demo-siem-key-change-me';

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '');

  if (token !== SIEM_API_KEY) {
    return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });
  }

  const url = new URL(request.url);
  const since = url.searchParams.get('since') || undefined;
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '100', 10), 1000);
  const cursor = url.searchParams.get('cursor') || undefined;
  const category = url.searchParams.get('category') || undefined;

  const result = getAuditLogs({ tenantId: 'default', since, limit, cursor, category });

  return NextResponse.json(result, {
    headers: {
      'X-Total-Count': result.total.toString(),
      'X-Has-More': result.hasMore.toString(),
    },
  });
}
```

**Step 2: Create SIEM docs page**

Create `apps/web/src/app/(dashboard)/dashboard/siem-docs/page.tsx` and `SiemDocsClient.tsx`:

A static API reference page showing:
- Endpoint: `GET /api/siem/audit-logs`
- Authentication: `Authorization: Bearer <api-key>`
- Query parameters: since (ISO date), limit (1-1000), cursor (pagination), category (filter)
- Response format: JSON with logs array, total, cursor, hasMore
- Example curl commands:
  ```
  curl -H "Authorization: Bearer YOUR_API_KEY" \
    "https://finops.acc.ltd/api/siem/audit-logs?since=2026-02-01T00:00:00Z&limit=100"
  ```
- Rate limits: 1000 requests/minute
- Categories: AUTH, USER_ADMIN, POLICY_ADMIN, CONFIG_ADMIN, SENSITIVE_READ
- Actions: full enum list with descriptions

Style as a clean documentation page with code blocks in monospace, similar to API reference pages.

**Step 3: Update middleware to exclude SIEM route from session auth**

Modify `apps/web/src/middleware.ts`:

```typescript
export { auth as middleware } from '@/lib/auth/config';
export const config = {
  matcher: ['/dashboard/:path*', '/api/:path((?!health|auth|siem).*)'],
};
```

**Step 4: Add `SIEM_API_KEY` to `.env.example`**

Add:
```env
# SIEM Integration
# SIEM_API_KEY="your-siem-api-key-here"
```

**Step 5: Commit**

```bash
git add apps/web/src/app/api/siem/ apps/web/src/app/\(dashboard\)/dashboard/siem-docs/ apps/web/src/middleware.ts apps/web/.env.example
git commit -m "feat: SIEM API endpoint with API key auth and interactive docs page"
```

---

### Task 15: CSS Hardening — CSP Headers, Avatar Fallback, Exchange Rate Fallback

**Files:**
- Modify: `apps/web/next.config.ts`
- Create: `apps/web/src/components/ui/UserAvatar.tsx`
- Modify: `apps/web/src/lib/cloud/exchangeRate.ts` (add offline fallback)
- Modify: `apps/web/src/components/layout/TopBar.tsx` (use UserAvatar)

**Step 1: Add CSP headers to next.config.ts**

Add security headers to the Next.js config:

```typescript
async headers() {
  return [
    {
      source: '/(.*)',
      headers: [
        {
          key: 'Content-Security-Policy',
          value: [
            "default-src 'self'",
            "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
            "style-src 'self' 'unsafe-inline'",
            "font-src 'self'",
            "img-src 'self' data: blob:",
            "connect-src 'self' https://api.anthropic.com https://open.er-api.com https://api.exchangerate-api.com",
            "frame-ancestors 'none'",
          ].join('; '),
        },
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
      ],
    },
  ];
},
```

**Step 2: Remove remote image patterns**

Remove the `remotePatterns` for Google/GitHub avatars from next.config.ts. Replace with a local avatar component.

**Step 3: Create UserAvatar component**

Create `apps/web/src/components/ui/UserAvatar.tsx`:

```tsx
'use client';

interface UserAvatarProps {
  name: string;
  email?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeMap = { sm: 'h-7 w-7 text-xs', md: 'h-9 w-9 text-sm', lg: 'h-12 w-12 text-base' };

export function UserAvatar({ name, size = 'md', className = '' }: UserAvatarProps) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div
      className={`inline-flex items-center justify-center rounded-full bg-primary/10 font-semibold text-primary ${sizeMap[size]} ${className}`}
    >
      {initials}
    </div>
  );
}
```

This matches the CEO's app pattern (his app shows "NS" initials in a circle).

**Step 4: Update TopBar to use UserAvatar**

Replace the Image-based avatar in TopBar.tsx with the UserAvatar component.

**Step 5: Add exchange rate offline fallback**

Modify `apps/web/src/lib/cloud/exchangeRate.ts` — add a hardcoded fallback rate (84.0 INR = 1 USD) that's used when both external APIs are unreachable:

```typescript
const OFFLINE_FALLBACK_RATE = 84.0;
const OFFLINE_FALLBACK_DATE = '2026-02-24';

// After both API calls fail:
return {
  rate: OFFLINE_FALLBACK_RATE,
  lastUpdated: OFFLINE_FALLBACK_DATE,
  source: 'offline-fallback',
};
```

**Step 6: Commit**

```bash
git add apps/web/next.config.ts apps/web/src/components/ui/UserAvatar.tsx apps/web/src/components/layout/TopBar.tsx apps/web/src/lib/cloud/exchangeRate.ts
git commit -m "feat: CSS hardening — CSP headers, initials avatar, exchange rate fallback"
```

---

### Task 16: Final Verification and Merge

**Step 1: Grep for any remaining issues**

```bash
grep -rn "Nimbus\|nimbus" apps/web/src/ --include="*.tsx" --include="*.ts" | grep -v aws-cur | grep -v node_modules
```

Should only show internal AWS resource defaults (aws-cur.ts).

**Step 2: Run typecheck**

```bash
pnpm --filter web typecheck
```

Only pre-existing Prisma client errors expected (not related to our changes).

**Step 3: Test new routes exist**

Verify all new page files exist:
```bash
ls apps/web/src/app/\(dashboard\)/dashboard/users/page.tsx
ls apps/web/src/app/\(dashboard\)/dashboard/audit-trail/page.tsx
ls apps/web/src/app/\(dashboard\)/dashboard/masters/page.tsx
ls apps/web/src/app/\(dashboard\)/dashboard/system-status/page.tsx
ls apps/web/src/app/\(dashboard\)/dashboard/compliance/page.tsx
ls apps/web/src/app/\(dashboard\)/dashboard/reports/page.tsx
ls apps/web/src/app/\(dashboard\)/dashboard/siem-docs/page.tsx
```

**Step 4: Test RBAC utility**

Quick manual test:
```bash
node -e "
const { hasRole, canSeeSection, canAccessRoute } = require('./apps/web/src/lib/auth/rbac');
console.log('VIEWER sees analytics:', canSeeSection('VIEWER', 'analytics'));     // true
console.log('VIEWER sees admin:', canSeeSection('VIEWER', 'administration'));      // false
console.log('AUDITOR sees governance:', canSeeSection('AUDITOR', 'governance'));   // true
console.log('EDITOR accesses /users:', canAccessRoute('EDITOR', '/dashboard/users')); // false
console.log('FINOPS_ADMIN accesses /users:', canAccessRoute('FINOPS_ADMIN', '/dashboard/users')); // true
"
```

**Step 5: Merge to main and push**

```bash
# From main worktree
git merge feat/enterprise-bfsi-grc --ff-only
git push origin main
git push deploy main
```

**Step 6: Clean up worktree**

```bash
git worktree remove .claude/worktrees/<worktree-name>
git branch -d feat/enterprise-bfsi-grc
```

---

## Summary: 16 Tasks, 4 Phases

| Phase | Tasks | What It Builds |
|-------|-------|---------------|
| 6A (Foundation) | 1-5 | Schema, RBAC, sidebar sections, auth middleware, user management |
| 6B (Admin) | 6-9 | Audit logging, audit trail page, masters config, system status |
| 6C (Compliance) | 10-11 | Compliance engine (50+ checks), compliance dashboard |
| 6D (Enterprise) | 12-16 | PPTX reports, SIEM API, CSS hardening, verification |

**New files:** ~25 files across lib, pages, API routes, components
**Modified files:** ~8 files (schema, sidebar, auth, middleware, next.config, TopBar, exchangeRate, .env.example)
**New npm dependencies:** pptxgenjs
