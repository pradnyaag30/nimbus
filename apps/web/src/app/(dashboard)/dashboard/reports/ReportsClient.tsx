'use client';

import { useState } from 'react';
import {
  FileBarChart,
  Download,
  Loader2,
  FileText,
  Mail,
  PieChart,
  TrendingUp,
  Users,
  DollarSign,
  BarChart3,
  type LucideIcon,
} from 'lucide-react';

// --- Helpers -----------------------------------------------------------------

function getCurrentPeriod(): string {
  const now = new Date();
  return now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

// --- Types -------------------------------------------------------------------

interface ReportType {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  endpoint: string;
  filePrefix: string;
  fileExt: string;
  available: boolean;
  badge?: string;
}

const REPORT_TYPES: ReportType[] = [
  {
    id: 'cxo-summary',
    name: 'CXO Executive Summary',
    description: '17-slide executive presentation covering KPIs, cost trends, top cost drivers, savings, compliance scores, and anomalies. Ready for your cadence call.',
    icon: FileBarChart,
    endpoint: '/api/reports/cxo',
    filePrefix: 'CXO-Executive-Summary',
    fileExt: 'pptx',
    available: true,
  },
  {
    id: 'cost-allocation',
    name: 'Cost Allocation Report',
    description: 'Detailed cost breakdown by team, project, and cost center. Includes chargeback data and untagged resource attribution.',
    icon: PieChart,
    endpoint: '/api/reports/cost-allocation',
    filePrefix: 'Cost-Allocation-Report',
    fileExt: 'xlsx',
    available: false,
    badge: 'v2.1',
  },
  {
    id: 'optimization',
    name: 'Optimization Savings Report',
    description: 'Comprehensive savings analysis — rightsizing, RI/SP coverage gaps, idle resources, and Compute Optimizer recommendations with projected annual savings.',
    icon: TrendingUp,
    endpoint: '/api/reports/optimization',
    filePrefix: 'Optimization-Report',
    fileExt: 'pptx',
    available: false,
    badge: 'v2.1',
  },
  {
    id: 'team-breakdown',
    name: 'Team Cost Breakdown',
    description: 'Per-team cost analysis with service drill-down, MoM trends, and budget tracking. Ideal for engineering leadership.',
    icon: Users,
    endpoint: '/api/reports/team-breakdown',
    filePrefix: 'Team-Cost-Breakdown',
    fileExt: 'xlsx',
    available: false,
    badge: 'v2.1',
  },
  {
    id: 'commitment-roi',
    name: 'Commitment ROI Report',
    description: 'RI and Savings Plan ROI analysis — utilization rates, coverage gaps, expiring commitments, and recommended purchases.',
    icon: DollarSign,
    endpoint: '/api/reports/commitment-roi',
    filePrefix: 'Commitment-ROI-Report',
    fileExt: 'pptx',
    available: false,
    badge: 'v2.1',
  },
  {
    id: 'monthly-variance',
    name: 'Monthly Variance Analysis',
    description: 'Service-by-service variance analysis comparing current month vs previous month and vs budget with root cause indicators.',
    icon: BarChart3,
    endpoint: '/api/reports/monthly-variance',
    filePrefix: 'Monthly-Variance',
    fileExt: 'xlsx',
    available: false,
    badge: 'v2.2',
  },
];

// --- Component ---------------------------------------------------------------

export function ReportsClient() {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerateReport(report: ReportType) {
    setLoadingId(report.id);
    setError(null);

    try {
      const res = await fetch(report.endpoint);

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(
          data?.error?.message || `Report generation failed (${res.status})`,
        );
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${report.filePrefix}-${new Date().toISOString().slice(0, 10)}.${report.fileExt}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to generate report');
    } finally {
      setLoadingId(null);
    }
  }

  const availableReports = REPORT_TYPES.filter((r) => r.available);
  const upcomingReports = REPORT_TYPES.filter((r) => !r.available);

  return (
    <div className="space-y-6 animate-in">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-2">
          <FileBarChart className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Generate executive reports and cost analysis summaries &middot; {getCurrentPeriod()}
        </p>
      </div>

      {/* Error alert */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Available Reports */}
      <div>
        <h3 className="mb-3 text-sm font-medium text-muted-foreground uppercase tracking-wider">
          Available Reports
        </h3>
        <div className="grid gap-4 sm:grid-cols-2">
          {availableReports.map((report) => (
            <div key={report.id} className="rounded-xl border bg-card p-6 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                  <report.icon className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-semibold">{report.name}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{report.description}</p>

                  <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium">
                      {report.fileExt.toUpperCase()}
                    </span>
                    <span className="font-medium text-foreground">{getCurrentPeriod()}</span>
                  </div>

                  <button
                    onClick={() => handleGenerateReport(report)}
                    disabled={loadingId !== null}
                    className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {loadingId === report.id ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4" />
                        Generate &amp; Download
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Upcoming Reports */}
      <div>
        <h3 className="mb-3 text-sm font-medium text-muted-foreground uppercase tracking-wider">
          Upcoming Reports
        </h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {upcomingReports.map((report) => (
            <div key={report.id} className="relative rounded-xl border bg-card p-5 shadow-sm opacity-70">
              <div className="absolute right-4 top-4">
                <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                  {report.badge || 'Coming Soon'}
                </span>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted">
                  <report.icon className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold text-muted-foreground">{report.name}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">{report.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Scheduled Reports */}
      <div className="rounded-xl border bg-card p-6 shadow-sm opacity-70">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted">
            <Mail className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-muted-foreground">Scheduled Email Reports</h3>
              <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">v2.2</span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Auto-generate and email reports on a daily, weekly, or monthly schedule to stakeholders. Configure recipients, report types, and delivery cadence.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
