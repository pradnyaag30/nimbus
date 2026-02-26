# FinOps AI — Cloud Cost Intelligence Platform
## Product Capability & Positioning Deck
### By: Applied Cloud Computing (ACC)
### www.acc.ltd | February 2026

---

---

## SLIDE 1: Title

# FinOps AI
### Cloud Cost Intelligence Platform

**See your cloud costs clearly. Act on them intelligently.**

An AI-powered, enterprise-grade FinOps platform built for BFSI organizations
that need real-time visibility, compliance, and control over cloud spend.

Applied Cloud Computing (ACC) | www.acc.ltd

---

---

## SLIDE 2: The Problem We Solve

### Cloud Spend Is Growing. Visibility Isn't.

Organizations across BFSI face a common reality:

| Problem | What Happens |
|---------|-------------|
| **Fragmented visibility** | Teams log into AWS Console, Azure Portal, GCP Console separately. No unified view. |
| **Manual reporting** | Engineers spend 8-12 hours/week building cost reports in Excel for leadership. |
| **Reactive optimization** | Savings opportunities discovered after budget overruns — not before. |
| **Compliance blind spots** | Untagged resources, unused commitments, security misconfigurations go unnoticed. |
| **No FinOps practice** | No structured framework for cost governance, accountability, or continuous optimization. |

**Industry benchmark:** Organizations without a FinOps practice overspend 20-35% on cloud infrastructure.

**FinOps AI eliminates these gaps with a single platform.**

---

---

## SLIDE 3: What Is FinOps AI?

### One Platform. Real Data. AI Intelligence. Enterprise Compliance.

FinOps AI is a **unified cloud cost intelligence platform** that connects directly to your cloud accounts and delivers:

- **Real-time cost visibility** — Live data from cloud provider APIs, not stale exports
- **AI-powered insights** — Claude AI (via AWS Bedrock) analyzes your cost data and surfaces what matters
- **Actionable optimization** — Every recommendation links to the specific cloud resource for immediate action
- **BFSI-grade compliance** — RBI, SEBI, SOC 2, PCI-DSS compliance frameworks built in
- **Executive reporting** — One-click CXO-ready PPTX reports with 17 slides of real data
- **Role-based governance** — 5-tier RBAC, audit trail, and SIEM integration

**Your data stays in your cloud environment.** FinOps AI connects via read-only APIs — no data export required.

---

---

## SLIDE 4: Platform Architecture

### How FinOps AI Works

```
Your Cloud Accounts (AWS / Azure / GCP / OCI)
        |
        v
  [Cloud API Integrations]
  Cost Explorer | Compute Optimizer | Trusted Advisor
  Budgets | Config | Resource Explorer | Tagging API
  Anomaly Detection | CUR via Athena | Savings Plans
        |
        v
  [FinOps AI Platform]
  Data normalization (FOCUS schema)
  + AI analysis (Claude via AWS Bedrock)
  + Compliance engine (50+ checks)
        |
        v
  [Interactive Dashboard]
  19 pages | 30+ live cards | AI chatbot
  CXO Reports | Audit Trail | SIEM API
```

**Key design principles:**
- **Read-only access** — We never modify your cloud resources
- **FOCUS schema** — All data normalized to FinOps Foundation standard for vendor-neutral analytics
- **24-hour intelligent caching** — Minimizes API costs (~$6-9/month total for AWS)
- **Server-side security** — Credentials never exposed to the browser

---

---

## SLIDE 5: Platform Modules at a Glance

### 19 Pages Across 4 Functional Sections

| Section | Pages | Who Uses It |
|---------|-------|-------------|
| **ANALYTICS** | Overview, Cost Explorer, Budgets, Recommendations, Anomalies, Trusted Advisor, Resources | Everyone (Viewer+) |
| **REPORTS** | Executive Reports (CXO PPTX), AI Reports | Editors, Admins, Auditors |
| **GOVERNANCE** | Compliance Dashboard, Governance Policies, Tag Governance, Audit Trail | Auditors, Admins |
| **ADMINISTRATION** | User Management, Masters Config, Cloud Accounts, System Status, Settings, SIEM Docs | FinOps Admins only |

**Plus:** AI Chatbot (accessible from every page) and Executive TV Mode (wall-screen display)

---

---

## SLIDE 6: Analytics — Main Dashboard

### 19+ Live Cards. Zero Manual Work.

The Overview dashboard provides an instant executive snapshot:

**Spend Intelligence:**
- Month-to-date spend (live from AWS Cost Explorer)
- Forecasted end-of-month spend (ML-powered)
- Month-over-month change percentage
- 13-month historical cost trend chart

**AI-Generated Insights (4 categories, auto-refreshed):**
- Idle resources with savings quantification
- Cost spikes with root cause identification
- Unused commitment gaps (Savings Plans & RIs)
- Anomaly alerts with dollar impact

**Operational Metrics:**
- Top 10 services by spend with MoM change
- Daily burn rate and consumption velocity
- Budget tracking against real AWS Budgets
- Savings Plans and Reserved Instance coverage
- Data transfer costs breakdown
- Trusted Advisor 5-pillar scorecard
- Tag compliance percentage
- FinOps maturity score (10 dimensions)

**Every card is interactive — click to drill down into the detail page.**

---

---

## SLIDE 7: Analytics — Cost Explorer

### Drill Into Every Dollar

The Cost Explorer provides granular cost analysis with a full filter bar:

**Filters available:**
- Date range (7d, 30d, 90d, 6m, 12m, custom)
- Granularity (Daily / Monthly)
- Service (multi-select)
- Region (multi-select)
- Charge type (On-Demand / Reserved / Savings Plan / Spot)
- Cloud provider and account

**Visualization:**
- Bar chart (daily or monthly view)
- Top services table with MoM comparison
- Cost breakdown by any dimension

**Data source:** AWS Cost Explorer API with real-time queries. Supports CUR (Cost and Usage Reports) via Athena for line-item, resource-level granularity.

---

---

## SLIDE 8: Analytics — Optimization Engine

### 3 Sources of Real Recommendations. No Guesswork.

FinOps AI aggregates optimization recommendations from three native AWS engines:

**1. AWS Compute Optimizer**
- EC2, Auto Scaling, Lambda, EBS rightsizing
- Over-provisioned and under-provisioned detection
- Estimated monthly savings per resource

**2. Cost Explorer Rightsizing**
- Instance-level modify or terminate recommendations
- Specific instance IDs with direct AWS Console links
- Target instance types with savings estimates

**3. Reserved Instance & Savings Plans Advisor**
- RI purchase recommendations (instance type, term, payment option)
- Savings Plans recommendations (Compute SP coverage)
- Estimated savings from each commitment purchase

**Every recommendation shows:**
- The resource ID
- The recommended action
- The estimated monthly savings
- A direct link to execute it in AWS

---

---

## SLIDE 9: Analytics — Anomaly Detection & Budgets

### Catch Cost Spikes Before Month-End

**Anomaly Detection:**
- Powered by AWS Cost Anomaly Detection (ML-based)
- Root cause analysis for each anomaly
- Dollar impact quantification
- Real-time alerting — not end-of-month surprises

**Budget Management:**
- Connected to real AWS Budgets (not estimates)
- Current spend vs. budget limit with visual progress bars
- Forecasted spend vs. budget — will you exceed?
- Alert levels: OK (green) | Warning at 75% (yellow) | Critical at 90% (red)
- Daily burn rate tracking

**Trusted Advisor Integration:**
- 5-pillar best practice scorecard: Cost, Security, Performance, Fault Tolerance, Service Limits
- Expandable checks with flagged resources
- Remediation guidance for every finding
- Direct links to AWS Console for action

---

---

## SLIDE 10: AI Intelligence — Claude via AWS Bedrock

### Your 24/7 FinOps Analyst

FinOps AI integrates Claude (Anthropic's AI) via **AWS Bedrock** — enterprise-grade, SOC 2 compliant, data stays in your AWS region.

**Layer 1: AI Chatbot (Interactive)**
- Natural language Q&A about your cloud costs
- Full access to all dashboard data: spend, recommendations, anomalies, budgets, tags
- Example queries:
  - "What are my top savings opportunities?"
  - "Show me cost anomalies this month"
  - "Give me an executive summary for the CFO"
  - "Which EC2 instances should we rightsize first?"

**Layer 2: Automated AI Insights (Proactive)**
- 4 insight categories analyzed and refreshed automatically
- Severity scoring: INFO | WARNING | CRITICAL
- Clickable cards that navigate to detail pages

**Layer 3: CXO Report Generation (On-Demand)**
- 17-slide PowerPoint generated from real AWS data
- Financial analysis, cost optimization, compliance — all automated
- One click from the Reports page

**AI Cost:** Usage-based via Bedrock. ~$0.012 per chatbot question. ~$4-18/month depending on team usage (light to heavy).

---

---

## SLIDE 11: Executive Reporting — CXO PPTX

### One-Click Executive Reports With Real Data

The Reports page generates a **17-slide CXO PowerPoint deck** from live AWS data:

**Section A — Cost Optimization (Slides 1-6):**
- Financial overview with KPIs (MTD spend, forecast, MoM change)
- Savings summary (monthly + annualized, by optimization type)
- Commitment coverage (Savings Plans + RI utilization with progress bars)
- Rightsizing opportunities by category
- Prioritized recommendations with savings estimates

**Section B — Financial Analysis (Slides 7-14):**
- 12-month cost trend (bar chart)
- Charge type breakdown (On-Demand vs Reserved vs Savings Plans)
- Top 10 services with MoM comparison
- Differential spend analysis (what went up, what went down)
- Daily burn rate and projection
- Data transfer cost analysis
- Region cost breakdown
- Budget vs. actual with utilization bars

**Section C — Governance (Slides 15-17):**
- Anomaly summary
- Tag compliance score
- Cloud provider breakdown

**Every number in the PPTX matches the live dashboard — no manual data entry.**

---

---

## SLIDE 12: Cloud Inventory (Resources / CMDB)

### Know What You Have Before Optimizing It

The Resources page provides a cloud inventory view:

**Summary Dashboard:**
- Total resources, services, and regions at a glance
- Service cards with counts (EC2: 75, RDS: 35, Lambda: 274, S3: 42...)

**Inventory Table:**
- Grouped by service with resource counts
- Expandable rows to see individual resources within each service
- Columns: Service | Count | Regions | Resource Types
- Filterable by service, region, resource type, and search

**Data source:** AWS Resource Explorer — discovers all resources across all enabled regions.

---

---

## SLIDE 13: Governance & Compliance

### Enterprise-Grade for BFSI

**Compliance Dashboard — 4 Regulatory Frameworks:**

| Framework | Focus | Example Checks |
|-----------|-------|----------------|
| **RBI** (IT Governance) | Data residency, access controls, encryption | S3 in ap-south-1, KMS enabled, MFA on root |
| **SEBI** (Cybersecurity) | Network security, logging, incident response | VPC flow logs, CloudTrail, GuardDuty |
| **SOC 2** (Trust Services) | Availability, security, integrity | Multi-AZ, IAM policies, backups |
| **PCI-DSS** (Payment Card) | Cardholder data protection | Encryption at rest, network segmentation |

- 50+ pre-built compliance checks across all 4 frameworks
- Score cards with pass/total and percentage per framework
- Remediation guidance for every finding

**Tag Governance:**
- Required tags: Environment, Team, CostCenter, ProjectName, ProjectOwner
- Compliance percentage tracking across all resources
- Untagged resource identification with cost impact

**AWS Config Compliance:**
- Organization-wide compliance rules evaluation
- Compliant vs. non-compliant resource counts per rule

---

---

## SLIDE 14: Administration & RBAC

### 5-Tier Role-Based Access Control

| Role | Access | Use Case |
|------|--------|----------|
| **SUPER_ADMIN** | Everything + cross-tenant | ACC internal management |
| **FINOPS_ADMIN** | Everything within tenant | Client FinOps team lead |
| **EDITOR** | Analytics + Reports, modify budgets/tags | FinOps practitioners |
| **VIEWER** | Analytics only (read-only) | Engineering, finance teams |
| **AUDITOR** | Analytics + Governance + Audit Trail | Internal audit, compliance officers |

**User Management:**
- Invite users by email with role assignment
- Enable/disable users (soft toggle — BFSI requirement: never hard-delete)
- Last login tracking

**Authentication:**
- Microsoft 365 / Entra ID (Azure AD) — SSO for enterprise clients
- OAuth (Google, GitHub) for team login
- Credential-based authentication as fallback

---

---

## SLIDE 15: Audit Trail & SIEM Integration

### Full Traceability for Regulated Industries

**Audit Trail (UI):**
- Every action logged: logins, role changes, settings modifications, report generations
- Filterable by date range, user, category, action type
- Export: CSV and PDF
- Visible to Auditors and Admins

**5 Event Categories Tracked:**

| Category | Example Events |
|----------|---------------|
| Authentication | Login success/failure, logout, session expiry |
| User Admin | User created, role changed, disabled/enabled |
| Policy Admin | Compliance config changed, tag policy updated |
| Config Admin | Settings modified, cloud account connected |
| Sensitive Reads | Cost data exported, compliance report viewed, PPTX generated |

**SIEM API:**
- REST endpoint for integration with Splunk, QRadar, Sentinel, ELK
- API key authentication (encrypted, per-tenant)
- Cursor-based pagination for high-volume log retrieval
- Interactive API documentation page with curl examples

---

---

## SLIDE 16: Masters & Configuration Management

### Centralized FinOps Configuration

**Cost Centers:**
- Define cost center codes, owners, and budgets
- Map directly to cloud resource tags for automatic cost allocation

**Business Units:**
- Hierarchical structure (parent-child BU relationships)
- Link to cloud tags for department-level chargeback

**Tag Policies:**
- Define required tags per resource type
- Auto-remediation suggestions for non-compliant resources

**Alert Configuration:**
- Budget alert thresholds (configurable: 50%, 80%, 100%)
- Anomaly detection sensitivity (High / Medium / Low)
- Compliance check frequency (Daily / Weekly)

---

---

## SLIDE 17: Multi-Cloud Architecture

### Built for Multi-Cloud From Day One

| Provider | Status | Integrations |
|----------|--------|-------------|
| **AWS** | LIVE | 10+ service integrations — full coverage |
| **Microsoft Azure** | Architecture Ready | Azure Cost Management API, Resource Graph, Advisor |
| **Google Cloud** | Architecture Ready | BigQuery Billing Export, Cloud Asset Inventory, Recommender |
| **Oracle Cloud** | Architecture Ready | OCI Usage API, Search API, Cloud Advisor |

**How it works:**
- Every cloud provider implements a common adapter interface
- All billing data normalized to the **FOCUS schema** (FinOps Foundation standard)
- Adding a new cloud = one adapter file — the entire dashboard, AI, compliance, and reporting layer works automatically

**Multi-cloud means:**
- Unified cost dashboard across all providers
- Compare AWS vs Azure vs GCP costs side-by-side
- Single compliance view across all clouds
- One CXO report covering total cloud spend

**Credential strategy:** One credential per cloud, connected at the organization/tenant level. No per-account configuration needed.

---

---

## SLIDE 18: How FinOps AI Serves Your FinOps Team

### From Crawl to Run — Your FinOps Maturity Partner

FinOps AI maps directly to the FinOps Foundation lifecycle:

**INFORM (Visibility & Allocation)**
- Real-time cost dashboards with drill-down by service, region, account
- Tag governance for cost allocation to teams and projects
- Automated daily/monthly cost reports for leadership
- Cloud resource inventory (know what you have)

**OPTIMIZE (Rates & Usage)**
- 3 recommendation engines working together (Compute Optimizer + Rightsizing + RI/SP)
- Commitment coverage tracking (are your Savings Plans being used?)
- Anomaly detection catches waste early
- AI chatbot answers "where should we optimize next?"

**OPERATE (Continuous Improvement)**
- Budget governance with forecast alerts
- Compliance frameworks for regulated industries
- Audit trail for accountability and traceability
- FinOps maturity score across 10 dimensions — tracks your improvement over time
- CXO reports that show month-over-month progress

**Your team doesn't need to become AWS experts. FinOps AI translates cloud complexity into actionable business insights.**

---

---

## SLIDE 19: Technology Stack

### Enterprise-Grade. Modern. Secure.

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 15 (App Router, Server Components) |
| **UI** | Tailwind CSS + shadcn/ui + Tremor charts |
| **Language** | TypeScript (strict mode, everywhere) |
| **AI Engine** | Claude Sonnet 4 via AWS Bedrock (Mumbai region) |
| **Database** | PostgreSQL 16 with Row-Level Security |
| **Cache** | Redis 7 (job queues, session storage) |
| **Auth** | NextAuth.js v5 (O365/Entra ID, OAuth, SAML) |
| **Reporting** | pptxgenjs (server-side PPTX generation) |
| **Data Schema** | FinOps Foundation FOCUS spec |
| **Deployment** | Docker, Kubernetes (Helm), Vercel, standalone |

**Security highlights:**
- Multi-tenant architecture with complete data isolation (Row-Level Security)
- All cloud credentials encrypted per-tenant in database
- CSP headers for air-gapped BFSI deployment readiness
- No external CSS/font/CDN dependencies — fully self-contained
- Read-only cloud access — no write permissions required

---

---

## SLIDE 20: Deployment Options

### Deploy Anywhere Your Security Team Approves

| Option | Best For | Infrastructure |
|--------|----------|---------------|
| **Docker Compose** | Quick setup, PoC, small teams | Single server |
| **Kubernetes (Helm)** | Enterprise production, auto-scaling, HA | K8s cluster |
| **Vercel** | Managed hosting, zero-ops | Cloud-managed |
| **Standalone Node.js** | On-premises, bare metal, air-gapped | Any server |

**Client's AWS account deployment:** FinOps AI can be deployed inside your own AWS VPC. Data never leaves your environment.

**External dependencies:**
- PostgreSQL 16 (RDS, Neon, Supabase, or self-hosted)
- Redis 7 (ElastiCache, Upstash, or self-hosted)
- AWS Bedrock (for AI features — ap-south-1 Mumbai)

---

---

## SLIDE 21: What We Need From You

### 30-Minute Setup to Live Dashboard

**To get started, we need:**

1. **AWS Access** — Read-only IAM credentials or cross-account role
   - Cost Explorer, Compute Optimizer, Trusted Advisor, Budgets, Config, Resource Explorer
   - No write access required
   - Guide provided: detailed step-by-step IAM setup document

2. **Your priorities** — Which capabilities matter most?
   - Cost visibility? Optimization? Compliance? Reporting?

3. **Authentication preference** — Microsoft 365 (Entra ID) / Google SSO / credentials

4. **Multi-cloud scope** — Do you use Azure, GCP, or OCI alongside AWS?

5. **Your branding** — Logo and brand colors for a white-labeled experience

**Timeline:** From credentials to live dashboard in under 1 hour.

---

---

## SLIDE 22: Why FinOps AI Over Alternatives?

### Built Different. Built for BFSI.

| Capability | Native AWS Console | Generic FinOps Tools | **FinOps AI** |
|------------|-------------------|---------------------|---------------|
| Unified multi-cloud view | No | Yes | **Yes** |
| AI-powered chatbot | No | Some | **Yes (Claude via Bedrock)** |
| BFSI compliance (RBI, SEBI) | No | No | **Yes (50+ checks)** |
| CXO PPTX reports | No | Manual | **One-click, 17 slides** |
| 5-tier RBAC | Basic IAM | Basic | **Full (5 roles, audit trail)** |
| SIEM integration | CloudTrail only | No | **REST API, any SIEM** |
| Tag governance | AWS-native only | Varies | **Cross-cloud, policy-driven** |
| Deploy on-premises | N/A | Rare | **Docker, K8s, standalone** |
| White-label branding | No | Rare | **Per-tenant theming** |
| AI cost analysis | No | Varies | **Claude Sonnet — best-in-class reasoning** |
| Setup time | Hours of configuration | Days-weeks | **Under 1 hour** |

---

---

## SLIDE 23: Deployment Architecture — Docker on EC2 (Recommended)

### Single Server. Everything Included. ~$33/month.

The recommended deployment for BFSI clients — FinOps AI runs as a single Docker Compose stack on an EC2 instance behind the client's existing Application Load Balancer. No public IP needed.

```
                    ┌──────────────────────────────────────┐
                    │       CLIENT'S AWS VPC                │
                    │       (Private Subnet)                │
                    │                                      │
Users (O365 SSO) ──┤  ┌──────────────────────────┐        │
                    │  │  Client's Existing ALB    │        │
                    │  │  HTTPS :443 (TLS)         │        │
                    │  └────────────┬───────────────┘        │
                    │               │                        │
                    │               v                        │
                    │  ┌────────────────────────────────┐   │
                    │  │     EC2 t3a.medium              │   │
                    │  │     2 vCPU | 4 GB RAM (AMD)     │   │
                    │  │     30 GB EBS gp3               │   │
                    │  │     No Public IP                │   │
                    │  │                                │   │
                    │  │  ┌─────────────────────────┐   │   │
                    │  │  │   Docker Compose Stack   │   │   │
                    │  │  │                         │   │   │
                    │  │  │  ┌───────────────────┐  │   │   │
                    │  │  │  │ Next.js Standalone │  │   │   │
                    │  │  │  │ (App + API + SSR)  │  │   │   │
                    │  │  │  │ ~400-600 MB RAM    │  │   │   │
                    │  │  │  └───────────────────┘  │   │   │
                    │  │  │  ┌───────────────────┐  │   │   │
                    │  │  │  │ PostgreSQL 16      │  │   │   │
                    │  │  │  │ (RLS, encrypted)   │  │   │   │
                    │  │  │  │ ~500-800 MB RAM    │  │   │   │
                    │  │  │  └───────────────────┘  │   │   │
                    │  │  │  ┌───────────────────┐  │   │   │
                    │  │  │  │ Redis 7            │  │   │   │
                    │  │  │  │ (Cache + Queues)   │  │   │   │
                    │  │  │  │ ~256 MB RAM        │  │   │   │
                    │  │  │  └───────────────────┘  │   │   │
                    │  │  └─────────────────────────┘   │   │
                    │  └────────────────────────────────┘   │
                    │               │                        │
                    └───────────────┼────────────────────────┘
                                    │
             ┌──────────────────────┼──────────────────────┐
             │                      │                      │
             v                      v                      v
    ┌──────────────┐    ┌────────────────┐    ┌────────────────┐
    │ AWS Bedrock   │    │ AWS Cost APIs   │    │ Microsoft      │
    │ (Claude AI)   │    │ (CE + CUR +     │    │ Entra ID       │
    │ ap-south-1    │    │  10+ services)  │    │ (O365 SSO)     │
    └──────────────┘    └────────────────┘    └────────────────┘
```

**Why this architecture works for ≤10 users:**

| Component | RAM Usage | CPU Usage |
|-----------|-----------|-----------|
| Next.js standalone (SSR + API) | ~400-600 MB | 0.3-0.5 vCPU |
| PostgreSQL 16 (shared_buffers) | ~500-800 MB | 0.1-0.3 vCPU |
| Redis 7 (cache + queues) | ~256 MB | 0.05 vCPU |
| Docker + OS overhead | ~500 MB | 0.15 vCPU |
| **Total baseline** | **~1.7-2.2 GB** | **~0.6-1.0 vCPU** |
| **Peak (report gen + users)** | **~2.5-3.0 GB** | **~1.5 vCPU** |

**t3a.medium (4 GB)** gives ~1.5 GB headroom above baseline — comfortably handles report generation spikes and concurrent users.

**Deployment command:**
```bash
docker compose up -d   # That's it. App + DB + Cache in one command.
```

---

---

## SLIDE 24: Deployment Architecture — ECS Fargate (Serverless)

### Fully Managed. No Servers. ~$61/month.

For clients who prefer serverless — no EC2 instances to manage, AWS handles scaling, patching, and availability.

```
                    ┌──────────────────────────────────────┐
                    │       CLIENT'S AWS VPC                │
                    │                                      │
Users (O365 SSO) ──┤  ┌──────────────────────────┐        │
                    │  │  Application Load Balancer │        │
                    │  │  HTTPS :443 (TLS)         │        │
                    │  └────────────┬───────────────┘        │
                    │               │                        │
                    │               v                        │
                    │  ┌────────────────────────────────┐   │
                    │  │  ECS Fargate Task               │   │
                    │  │  0.5 vCPU | 1 GB RAM            │   │
                    │  │  Always-on (24/7)               │   │
                    │  │                                │   │
                    │  │  ┌───────────────────────────┐ │   │
                    │  │  │  Next.js Standalone App    │ │   │
                    │  │  │  (App + API + SSR)         │ │   │
                    │  │  └───────────────────────────┘ │   │
                    │  └───────────┬────────┬───────────┘   │
                    │              │        │                │
                    │    ┌─────────┘        └─────────┐     │
                    │    v                            v     │
                    │  ┌──────────────┐  ┌──────────────┐  │
                    │  │ RDS Postgres  │  │ ElastiCache   │  │
                    │  │ db.t4g.micro  │  │ cache.t4g.micro│ │
                    │  │ 20 GB gp3     │  │ (Redis 7)     │  │
                    │  └──────────────┘  └──────────────┘  │
                    │                                      │
                    └──────────────────────────────────────┘
```

**ECS Fargate cost breakdown:**

| Component | Service | Spec | Monthly |
|-----------|---------|------|---------|
| App Task | Fargate | 0.5 vCPU, 1 GB, always-on | $14.57 |
| Database | RDS PostgreSQL | db.t4g.micro, 20 GB gp3 | $12.41 |
| Cache | ElastiCache Redis | cache.t4g.micro | $9.50 |
| Load Balancer | ALB | HTTPS, single target | $16.20 |
| **Infra total** | | | **$52.68** |

**Note:** RDS db.t4g.micro is **free-tier eligible** for 12 months — first year infra cost drops to ~$40/month.

**When to choose Fargate over Docker:**
- Client doesn't want to manage EC2 instances
- Need automatic OS patching and security updates
- Want AWS-managed scaling for future growth
- Compliance requirement for managed services

---

---

## SLIDE 25: AWS API & Data Costs

### What the Client Pays AWS for Cloud Data Access

FinOps AI uses both **CUR (Cost & Usage Reports)** via Athena and **Cost Explorer API** for comprehensive coverage. Most AWS APIs used are completely free.

**Cost Explorer API ($0.01/request, ~19 calls/day):**

| API Call | What It Powers | Frequency | Monthly |
|----------|---------------|-----------|---------|
| GetCostAndUsage (MTD) | Current month spend card | 1x/day | $0.30 |
| GetCostAndUsage (13-mo trend) | Historical trend chart | 1x/day | $0.30 |
| GetCostAndUsage (top services) | Service breakdown table | 1x/day | $0.30 |
| GetCostForecast | ML-based month-end forecast | 1x/day | $0.30 |
| GetSavingsPlansCoverage | SP coverage percentage | 1x/day | $0.30 |
| GetSavingsPlansUtilization | SP utilization percentage | 1x/day | $0.30 |
| GetReservationCoverage | RI coverage percentage | 1x/day | $0.30 |
| GetReservationUtilization | RI utilization percentage | 1x/day | $0.30 |
| GetRightsizingRecommendation | EC2 rightsizing suggestions | 1x/day | $0.30 |
| GetReservationPurchaseRec | RI purchase recommendations | 1x/day | $0.30 |
| GetSavingsPlansPurchaseRec | SP purchase recommendations | 1x/day | $0.30 |
| Ad-hoc filter queries | User-initiated Cost Explorer | ~5/day | $1.50 |
| **CE API subtotal** | | ~19 calls/day | **~$5.70** |

**CUR + Athena (resource-level granularity):**

| Item | Detail | Monthly |
|------|--------|---------|
| CUR Export to S3 | Daily Parquet, RESOURCES included | $0 (free) |
| S3 Storage | 10-30 GB compressed Parquet | $0.25-0.75 |
| Athena Queries | ~20 queries/day, ~5 MB each (partitioned) | $0.02 |
| **CUR subtotal** | | **~$0.30-0.80** |

**Free AWS APIs ($0/month):**
- Compute Optimizer (EC2/Lambda/EBS rightsizing)
- Trusted Advisor (5-pillar best practice checks)
- AWS Budgets (budget status + forecasts)
- Cost Anomaly Detection (ML anomaly alerts)
- Resource Explorer (cloud resource inventory)
- STS (account validation)
- Tagging API (tag compliance)

**AWS Config:** ~$2.50/month (50 compliance rule evaluations)

**Total AWS data costs: ~$8.50-9.00/month**

---

---

## SLIDE 26: Bedrock AI Costs — Usage-Based Pricing

### You Pay Only for Questions Asked

FinOps AI uses **Claude Sonnet via AWS Bedrock** (ap-south-1 Mumbai). Cost is purely usage-based — depends on how many questions your team asks the AI chatbot and how often AI insights are regenerated.

**Per-question cost:** ~$0.012 per chatbot question (avg 1,000 input + 500 output tokens)

**Bedrock rates (Claude Sonnet, ap-south-1):**
- Input: $3.00 / 1M tokens
- Output: $15.00 / 1M tokens

**Usage scenarios:**

| Scenario | Description | Chat + Insights + Reports | Monthly |
|----------|-------------|--------------------------|---------|
| **Light** | Small team, occasional questions | 5 q/day + daily insights | ~$4.31 |
| **Medium** | Active FinOps team | 15 q/day + daily insights | ~$7.46 |
| **Heavy** | Power users, frequent reporting | 50 q/day + daily insights + CXO reports | ~$18.48 |

**What each tier includes:**

| Component | Light | Medium | Heavy |
|-----------|-------|--------|-------|
| Chatbot questions | 5/day (~150/mo) | 15/day (~450/mo) | 50/day (~1,500/mo) |
| AI Insight generation (auto) | 1x/day | 1x/day | 1x/day |
| CXO Report generation | — | — | ~4/month |
| **Monthly AI cost** | **~$4.31** | **~$7.46** | **~$18.48** |

**Without Bedrock:** $0 AI cost. Platform works fully — dashboards, recommendations, compliance, reports all function. Only AI chatbot and AI-generated insights are unavailable.

---

---

## SLIDE 27: Cost Comparison — All Deployment Options

### Side-by-Side: Docker vs ECS vs On-Premises

**Docker on EC2 t3a.medium (Recommended for single-tenant BFSI):**

| Category | No AI | Light AI | Medium AI | Heavy AI |
|----------|-------|----------|-----------|----------|
| EC2 + EBS (no public IP) | $24.60 | $24.60 | $24.60 | $24.60 |
| CUR (S3 + Athena) | $0.50 | $0.50 | $0.50 | $0.50 |
| CE API calls (~19/day) | $5.70 | $5.70 | $5.70 | $5.70 |
| AWS Config | $2.50 | $2.50 | $2.50 | $2.50 |
| Bedrock AI | $0 | $4.31 | $7.46 | $18.48 |
| **TOTAL** | **$33.30** | **$37.61** | **$40.76** | **$51.78** |

**ECS Fargate (Serverless):**

| Category | No AI | Light AI | Medium AI | Heavy AI |
|----------|-------|----------|-----------|----------|
| Fargate + RDS + Redis + ALB | $52.68 | $52.68 | $52.68 | $52.68 |
| CUR (S3 + Athena) | $0.50 | $0.50 | $0.50 | $0.50 |
| CE API calls (~19/day) | $5.70 | $5.70 | $5.70 | $5.70 |
| AWS Config | $2.50 | $2.50 | $2.50 | $2.50 |
| Bedrock AI | $0 | $4.31 | $7.46 | $18.48 |
| **TOTAL** | **$61.38** | **$65.69** | **$68.84** | **$79.86** |

**On-Premises (Client's own server):**

| Category | No AI | Medium AI |
|----------|-------|-----------|
| Server hardware | $0 (existing) | $0 (existing) |
| CUR (S3 + Athena) | $0.50 | $0.50 |
| CE API calls | $5.70 | $5.70 |
| AWS Config | $2.50 | $2.50 |
| Bedrock AI | $0 | $7.46 |
| **TOTAL** | **$8.70** | **$16.16** |

**Key takeaway:** Full FinOps AI platform runs for **~$33-52/month** on Docker or **~$61-80/month** on ECS Fargate — less than the cost of one hour of a FinOps consultant.

---

---

## SLIDE 28: On-Premises & Air-Gapped Deployment

### Run FinOps AI on Your Existing Infrastructure

For clients with existing data center capacity or air-gapped environments:

| Requirement | Specification |
|-------------|--------------|
| **Server** | 2 vCPU, 4 GB RAM minimum (any Linux server) |
| **Storage** | 30 GB SSD (app + database + Docker images) |
| **Software** | Docker Compose or Node.js 20+ |
| **Database** | PostgreSQL 16 (runs inside Docker Compose) |
| **Cache** | Redis 7 (runs inside Docker Compose) |
| **Network** | Outbound HTTPS to AWS APIs only |
| **AI (optional)** | Outbound access to Bedrock endpoint (ap-south-1) |

**On-premises monthly cost:** Only AWS API charges apply — **$8.70/month without AI, $16.16/month with medium AI usage.**

**Deployment:**
```bash
docker compose up -d   # App + PostgreSQL + Redis — single command
```

**Air-gapped considerations:**
- Platform works fully without internet (dashboards, RBAC, audit trail, compliance)
- Cloud API sync requires scheduled outbound access windows
- Bedrock AI requires outbound access to AWS endpoint — optional feature
- CXO reports, tag governance, and user management work offline

---

---

## SLIDE 29: Scaling Guide — When to Upgrade

### Right-Size Your Deployment as You Grow

| Stage | Users | Data Volume | Recommended Deployment | Monthly |
|-------|-------|-------------|----------------------|---------|
| **Starter** | 1-10 | Single AWS account | Docker on t3a.medium | ~$33-52 |
| **Growth** | 10-25 | 2-5 AWS accounts | Docker on t3a.large (8 GB) | ~$55-74 |
| **Professional** | 25-50 | 5-20 accounts, multi-cloud | ECS Fargate + RDS | ~$61-80 |
| **Enterprise** | 50+ | 20+ accounts, heavy CUR | EKS (Kubernetes) + RDS Multi-AZ | ~$150-200 |

**Upgrade triggers (move to next tier when):**
- PostgreSQL data exceeds 15 GB → upgrade EBS or move to RDS
- Peak RAM consistently above 3.5 GB → upgrade to t3a.large
- Need HA/zero-downtime deploys → move to ECS or EKS
- Multiple cloud providers active → add CUR-equivalent data sources
- User count exceeds 25 → consider dedicated RDS for query performance

**Scaling is non-disruptive:**
- Docker → ECS: Containerize the same Docker image, add managed DB
- ECS → EKS: Helm chart deployment, same image, add HPA
- On-prem → Cloud: Export PostgreSQL dump, import to RDS, update env vars

---

---

## SLIDE 30: Commercial Overview

### Platform Pricing

| Tier | Target | Includes | Monthly |
|------|--------|----------|---------|
| **Starter** | Single AWS account, small team | Dashboard + Recommendations + AI Chatbot | Contact Us |
| **Professional** | Multi-account, departments | + Budgets + Governance + Reports + RBAC | Contact Us |
| **Enterprise** | Multi-cloud, BFSI compliance | + Compliance + Audit Trail + SIEM + Custom Branding + SSO | Contact Us |

**What's included in every tier:**
- Real-time cloud data (no stale reports)
- AI chatbot powered by Claude (when Bedrock enabled)
- 24/7 platform access
- Software updates and new features
- Technical support and onboarding assistance

**Total cost to client (all-inclusive estimate):**

| Deployment | Without AI | With AI (Medium) | Notes |
|-----------|-----------|-----------------|-------|
| **Docker on EC2** | **~$33/mo** | **~$41/mo** | Recommended for most clients |
| **ECS Fargate** | **~$61/mo** | **~$69/mo** | Fully managed, no servers |
| **On-Premises** | **~$9/mo** | **~$16/mo** | Only AWS API charges |
| **Platform license (ACC)** | Contact Us | Contact Us | Per-tenant licensing |

**ROI:** Typical FinOps AI client identifies $5,000-50,000/month in optimization opportunities. Platform pays for itself in the first week.

---

---

## SLIDE 31: Roadmap & Vision

### What's Coming Next

**Q1 2026 (Now — Live):**
- Full AWS integration (10+ services)
- AI chatbot and automated insights
- CXO PPTX reports (17 slides, real data)
- BFSI compliance frameworks (RBI, SEBI, SOC 2, PCI-DSS)
- RBAC, audit trail, SIEM API
- Cost Explorer with full filter bar

**Q2 2026:**
- Azure Cost Management adapter
- Scheduled email reports (weekly/monthly)
- Auto-remediation workflows (stop idle EC2, purchase RIs)
- CUR 2.0 deep integration for resource-level cost tracking

**Q3 2026:**
- GCP BigQuery billing adapter
- Department-level chargeback module
- Predictive AI (forecast anomalies before they happen)
- Carbon footprint tracking

**Q4 2026:**
- Oracle Cloud adapter
- Custom compliance framework builder
- AWS Marketplace listing (self-service onboarding)
- Multi-tenant SaaS general availability

---

---

## SLIDE 32: Thank You

# Thank You

### FinOps AI — See your cloud costs clearly. Act on them intelligently.

**Applied Cloud Computing (ACC)**
www.acc.ltd

---

**Next Steps:**
1. Schedule a live demo (30 minutes)
2. Share read-only AWS credentials
3. Go live in under 1 hour

---

*FinOps AI is a product of Applied Cloud Computing (ACC), built by FinOps Certified Practitioners with deep expertise in AWS, Azure, and GCP cost optimization for Banking, Financial Services, and Insurance organizations.*
