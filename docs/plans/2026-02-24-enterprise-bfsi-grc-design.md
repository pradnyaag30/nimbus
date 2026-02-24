# Enterprise BFSI & GRC Module Design

**Date:** 2026-02-24
**Status:** Approved
**Author:** Brainstorming session (Alex + Claude)

---

## Context

CEO feedback: "Nimbus looks like a college project." Anyone can build a FinOps dashboard, but only experienced teams ship GRC features and BFSI compatibility. This design adds the enterprise layer that differentiates FinOps AI from generic tools.

Inspired by the CEO's "Agentic Underwriting" app — which includes Compliance Dashboard, Policy Management, User Management, Audit Trail, SIEM API, Masters, and System Status.

## Scope

- GRC Module (Compliance Dashboard, Audit Trail, SIEM API)
- User & Role Management (5-role RBAC)
- Masters (Configuration Management)
- System Status (Health Monitoring)
- PPTX Report Generation (CXO Executive Summary)
- CSS Hardening (air-gapped BFSI deployment readiness)
- O365 login readiness (Microsoft Entra ID provider slot)

---

## Architecture: Sectioned Sidebar with Role-Based Visibility

Three sidebar sections replace the current flat navigation:

```
ANALYTICS              (all roles)
  Overview, Cost Explorer, Budgets, Recommendations,
  Anomalies, Trusted Advisor, Resources, Reports

GOVERNANCE             (Auditor + Admin roles)
  Compliance Dashboard, Governance Policies,
  Tag Governance, Audit Trail

ADMINISTRATION         (FinOps Admin + Super Admin)
  User Management, Masters, Cloud Accounts,
  System Status, Settings
```

### Role Visibility Matrix

| Section        | SUPER_ADMIN | FINOPS_ADMIN | EDITOR | VIEWER | AUDITOR |
|----------------|:-----------:|:------------:|:------:|:------:|:-------:|
| Analytics      | Y | Y | Y | Y | Y |
| Reports        | Y | Y | Y | - | Y |
| Governance     | Y | Y | - | - | Y |
| Administration | Y | Y | - | - | - |

---

## 1. User Management & RBAC

### Role Hierarchy

```
SUPER_ADMIN        ACC internal. Manages tenants, sees all orgs.
  FINOPS_ADMIN     Client org admin. Manages tenant users, settings.
    EDITOR         Modifies budgets, policies, tags. Cannot manage users.
    VIEWER         Read-only access to analytics dashboards.
    AUDITOR        Read-only analytics + governance + audit logs.
```

### User Management Page (`/dashboard/users`)

- User table: name, email, role, last login, status (active/disabled)
- Invite user: email + role picker
- Edit role: dropdown change
- Disable/Enable: soft toggle (BFSI: never hard-delete user records)
- Super Admin extras: tenant switcher, cross-tenant visibility

### Auth Changes

- Read role from DB instead of hardcoding `'admin'` in JWT callback
- Add proper `role` field to session type (remove `any` cast)
- Route-level middleware: protect admin routes by role
- O365 (Microsoft Entra ID) provider slot ready in env config

### Schema Changes

```prisma
enum UserRole {
  SUPER_ADMIN
  FINOPS_ADMIN
  EDITOR
  VIEWER
  AUDITOR
}

model User {
  // existing fields...
  role        UserRole @default(VIEWER)
  status      UserStatus @default(ACTIVE)
  lastLoginAt DateTime?
  invitedBy   String?
}

enum UserStatus {
  ACTIVE
  DISABLED
}
```

---

## 2. Compliance Dashboard

### Frameworks

| Framework | Focus | Example Checks |
|-----------|-------|----------------|
| RBI (IT Governance) | Data residency, access controls, encryption | S3 in ap-south-1, KMS enabled, MFA on root |
| SEBI (Cybersecurity) | Network security, logging, incident response | VPC flow logs, CloudTrail, GuardDuty |
| SOC 2 (Trust Services) | Availability, security, integrity | Multi-AZ, IAM policies, backups |
| PCI-DSS (Payment Card) | Cardholder data protection | Encryption at rest, network segmentation |

### Page Layout (`/dashboard/compliance`)

- Score cards: one per framework showing pass/total and percentage
- Filter bar: framework, severity, status
- Check list: each check shows control ID, affected resource, remediation guidance
- Checks map to multiple frameworks (e.g., encryption check covers RBI + SOC2 + PCI-DSS)

### Data Sources

1. AWS Trusted Advisor (already integrated) for security checks
2. AWS Config rules (new adapter) for compliance evaluations
3. Custom rules engine querying existing resource metadata

### Compliance Score

`(passing checks / total checks) x 100` per framework.

Ship with ~50 pre-built checks covering critical controls across all 4 frameworks.

### Schema

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
  tenant          Tenant              @relation(fields: [tenantId], references: [id])
  framework       ComplianceFramework
  controlId       String              // e.g., "RBI-4.2.1"
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

---

## 3. Audit Trail & SIEM API

### Events Tracked

| Category | Events |
|----------|--------|
| Auth | Login success/fail, logout, password change, session expired |
| User Admin | User created, role changed, disabled/enabled, invited |
| Policy Admin | Policy created/updated/deleted, compliance config changed |
| Config Admin | Settings modified, cloud account added/removed, master data changed |
| Sensitive Reads | Cost data exported, compliance report viewed, audit log accessed, PPTX generated |

### Audit Trail Page (`/dashboard/audit-trail`)

- Filterable table: date range, user, category, search
- Export: CSV and PDF
- Pagination: cursor-based for large datasets
- Visible to AUDITOR, FINOPS_ADMIN, SUPER_ADMIN roles

### SIEM API (`/api/siem/audit-logs`)

- REST endpoint with API key authentication (stored encrypted in TenantConfig)
- Cursor-based pagination: `?since=ISO_DATE&limit=1000`
- Filterable by date, category, action
- Rate limited: 1000 req/min
- SIEM API Docs page (`/dashboard/siem-docs`) with endpoint reference and curl examples

### Schema

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
  tenant     Tenant        @relation(fields: [tenantId], references: [id])
  userId     String?
  userEmail  String
  userRole   UserRole
  action     AuditAction
  category   AuditCategory
  targetType String?
  targetId   String?
  metadata   Json?         // IP, user agent, details
  createdAt  DateTime      @default(now())

  @@index([tenantId, createdAt])
  @@index([tenantId, category])
  @@index([tenantId, userId])
}
```

---

## 4. Masters (Configuration Management)

### Masters Page (`/dashboard/masters`)

4-tab configuration page:

**Tab 1: Cost Centers** — CRUD: code, name, owner email, budget, active flag. Maps to cloud tags.

**Tab 2: Business Units** — CRUD: code, name, head, parent BU (hierarchy). Maps to cloud tags.

**Tab 3: Tag Policies** — Required tags per resource type, key patterns, auto-remediation suggestions.

**Tab 4: Alert Configuration** — Budget thresholds, anomaly sensitivity, compliance check frequency, report schedule defaults.

### Schema

```prisma
model CostCenter {
  id           String  @id @default(cuid())
  tenantId     String
  tenant       Tenant  @relation(fields: [tenantId], references: [id])
  code         String
  name         String
  ownerEmail   String?
  budgetAmount Float?
  currency     String  @default("USD")
  tagKey       String  @default("CostCenter")
  tagValue     String
  isActive     Boolean @default(true)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  @@unique([tenantId, code])
}

model BusinessUnit {
  id        String  @id @default(cuid())
  tenantId  String
  tenant    Tenant  @relation(fields: [tenantId], references: [id])
  code      String
  name      String
  headEmail String?
  parentId  String?
  parent    BusinessUnit? @relation("BUHierarchy", fields: [parentId], references: [id])
  children  BusinessUnit[] @relation("BUHierarchy")
  tagKey    String  @default("BusinessUnit")
  tagValue  String
  isActive  Boolean @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([tenantId, code])
}

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
  tenant                   Tenant             @relation(fields: [tenantId], references: [id])
  budgetAlertThresholds    Int[]              @default([50, 80, 100])
  anomalySensitivity       AnomalySensitivity @default(MEDIUM)
  complianceCheckFrequency CheckFrequency     @default(DAILY)
  reportSchedule           Json?
  siemApiKey               String?            // encrypted
  siemApiEnabled           Boolean            @default(false)
  createdAt                DateTime           @default(now())
  updatedAt                DateTime           @updatedAt
}
```

Tag policies extend existing `GovernancePolicy` with a `type` field:
```prisma
enum PolicyType {
  COST_POLICY
  TAG_POLICY
  COMPLIANCE_POLICY
}
```

---

## 5. System Status Page (`/dashboard/system-status`)

Health monitoring for connected services:

- **Cloud Accounts**: connection status, last sync time
- **AWS Services**: Cost Explorer, Trusted Advisor, Compute Optimizer, CUR+Athena health
- **Platform Services**: AI Engine (Claude), Database, Redis
- **Recent Sync Jobs**: from existing SyncJob table

Data source: existing tables + lightweight health pings. No new external integrations.

---

## 6. PPTX Report Generation (`/dashboard/reports`)

### CXO Executive Summary (7 slides)

| Slide | Content |
|-------|---------|
| 1. Title | "FinOps AI Monthly Cost Report" + tenant name + date range + ACC logo |
| 2. KPIs | Total spend, MoM change %, forecast, savings achieved |
| 3. Cost Trend | Monthly cost trend chart (bar/line) |
| 4. Top Cost Drivers | Top 5 services by spend with change % |
| 5. Savings | Savings achieved, open recommendations, top 3 actions |
| 6. Compliance | Framework scores (RBI, SEBI, SOC2, PCI-DSS) |
| 7. Anomalies | Key anomalies, budget utilization |

### Tech Stack

- `pptxgenjs` npm library (server-side generation)
- Charts rendered as static images
- Data from existing `getDashboardData()` + new compliance scores
- Server Action: `generateCxoReport(tenantId, dateRange)` returns PPTX blob
- Audit log entry on generation

---

## 7. CSS Hardening

### Current state: clean (no external CSS/font/CDN dependencies)

### Additional hardening:

1. **CSP headers** in next.config.ts:
   ```
   default-src 'self';
   style-src 'self' 'unsafe-inline';
   font-src 'self';
   img-src 'self' data:;
   connect-src 'self' https://api.anthropic.com;
   ```

2. **Remove remote image patterns** (Google/GitHub avatars) — use initials-based avatar component instead.

3. **Exchange rate API fallback** — hardcoded rate when external API unreachable, with "last updated" warning.

4. **Preload critical CSS** to eliminate flash of unstyled content.

---

## New Routes Summary

| Route | Page | Min Role |
|-------|------|----------|
| `/dashboard/reports` | PPTX Report Generation | EDITOR |
| `/dashboard/compliance` | Compliance Dashboard | AUDITOR |
| `/dashboard/audit-trail` | Audit Trail | AUDITOR |
| `/dashboard/users` | User Management | FINOPS_ADMIN |
| `/dashboard/masters` | Masters Configuration | FINOPS_ADMIN |
| `/dashboard/system-status` | System Status | FINOPS_ADMIN |
| `/dashboard/siem-docs` | SIEM API Documentation | FINOPS_ADMIN |
| `/api/siem/audit-logs` | SIEM REST Endpoint | API Key |

---

## Implementation Phases

| Phase | Features | Dependencies |
|-------|----------|--------------|
| 6A | RBAC + User Management + Sidebar sections + Auth middleware | Foundation for everything |
| 6B | Audit Trail + Masters + System Status | Needs RBAC for role gating |
| 6C | Compliance Dashboard + checks engine | Needs Masters for config |
| 6D | PPTX Reports + SIEM API + CSS hardening | Needs compliance data for reports |

---

## NOT in Scope (explicitly deferred)

- Email delivery of reports (Phase 2 — needs SMTP/SES setup)
- O365 login implementation (waiting for CEO to provide Azure AD credentials)
- AWS Config rules adapter (compliance checks use existing TA + resource metadata first)
- Custom compliance framework builder (ship with 4 fixed frameworks, extend later)
- Real-time WebSocket notifications (audit events are pull-based via SIEM API)
