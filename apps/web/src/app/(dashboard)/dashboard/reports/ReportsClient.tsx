'use client';

import { useState } from 'react';
import {
  FileBarChart,
  Download,
  Loader2,
  FileText,
  Mail,
} from 'lucide-react';

// --- Helpers -----------------------------------------------------------------

function getCurrentPeriod(): string {
  const now = new Date();
  return now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

// --- Component ---------------------------------------------------------------

export function ReportsClient() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerateReport() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/reports/cxo');

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
      a.download = `CXO-Executive-Summary-${new Date().toISOString().slice(0, 10)}.pptx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to generate report');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 animate-in">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-2">
          <FileBarChart className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Generate executive reports and cost analysis summaries.
        </p>
      </div>

      {/* CXO Report Card */}
      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
            <FileBarChart className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold">CXO Executive Summary</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              7-slide executive presentation covering KPIs, cost trends, top cost
              drivers, savings, compliance scores, and anomalies. Ready for your
              cadence call.
            </p>

            <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
              <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium">
                Current Period
              </span>
              <span className="font-medium text-foreground">{getCurrentPeriod()}</span>
            </div>

            {/* Error alert */}
            {error && (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
                {error}
              </div>
            )}

            <button
              onClick={handleGenerateReport}
              disabled={loading}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating report...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  Generate &amp; Download PPTX
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Coming Soon Section */}
      <div>
        <h3 className="mb-3 text-sm font-medium text-muted-foreground uppercase tracking-wider">
          Coming Soon
        </h3>
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Detailed Team Breakdown */}
          <div className="relative rounded-xl border bg-card p-6 shadow-sm opacity-60">
            <div className="absolute right-4 top-4">
              <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                Coming Soon
              </span>
            </div>
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted">
                <FileText className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <h3 className="font-semibold text-muted-foreground">
                  Detailed Team Breakdown
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Per-team cost analysis with service drill-down. Coming in v2.1.
                </p>
              </div>
            </div>
          </div>

          {/* Scheduled Email Reports */}
          <div className="relative rounded-xl border bg-card p-6 shadow-sm opacity-60">
            <div className="absolute right-4 top-4">
              <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                Coming Soon
              </span>
            </div>
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted">
                <Mail className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <h3 className="font-semibold text-muted-foreground">
                  Scheduled Email Reports
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Auto-generate and email reports on a schedule. Coming in v2.1.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
