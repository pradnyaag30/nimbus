'use client';

import { useState } from 'react';
import {
  Shield,
  CheckCircle2,
  XCircle,
  MinusCircle,
  ChevronDown,
  ChevronRight,
  Filter,
} from 'lucide-react';

// --- Types -------------------------------------------------------------------

interface ComplianceCheck {
  controlId: string;
  controlName: string;
  description: string;
  category: string;
  framework: string;
  severity: string;
  status: string;
  resourceType: string;
  provider: string;
  remediation: string;
  lastEvaluatedAt: string;
}

interface FrameworkScore {
  framework: string;
  label: string;
  total: number;
  passed: number;
  failed: number;
  notApplicable: number;
  score: number;
}

interface ComplianceClientProps {
  checks: ComplianceCheck[];
  scores: FrameworkScore[];
}

// --- Helpers -----------------------------------------------------------------

function scoreColor(score: number): string {
  if (score >= 80) return 'text-green-600 dark:text-green-400';
  if (score >= 60) return 'text-amber-600 dark:text-amber-400';
  return 'text-red-600 dark:text-red-400';
}

function scoreBarColor(score: number): string {
  if (score >= 80) return 'bg-green-500';
  if (score >= 60) return 'bg-amber-500';
  return 'bg-red-500';
}

const severityStyles: Record<string, string> = {
  CRITICAL: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  HIGH: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  MEDIUM: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  LOW: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
};

const frameworkBadgeStyles: Record<string, string> = {
  RBI: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
  SEBI: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  SOC2: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
  PCI_DSS: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
};

const frameworkDisplayName: Record<string, string> = {
  RBI: 'RBI',
  SEBI: 'SEBI',
  SOC2: 'SOC 2',
  PCI_DSS: 'PCI-DSS',
};

function StatusIcon({ status }: { status: string }) {
  switch (status) {
    case 'PASS':
      return <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />;
    case 'FAIL':
      return <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />;
    default:
      return <MinusCircle className="h-4 w-4 text-gray-400" />;
  }
}

// --- Component ---------------------------------------------------------------

export function ComplianceClient({ checks, scores }: ComplianceClientProps) {
  const [frameworkFilter, setFrameworkFilter] = useState('All');
  const [severityFilter, setSeverityFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  // Apply filters
  const filteredChecks = checks.filter((check) => {
    if (frameworkFilter !== 'All' && check.framework !== frameworkFilter) return false;
    if (severityFilter !== 'All' && check.severity !== severityFilter) return false;
    if (statusFilter !== 'All' && check.status !== statusFilter) return false;
    return true;
  });

  // Summary stats
  const totalChecks = filteredChecks.length;
  const passingChecks = filteredChecks.filter((c) => c.status === 'PASS').length;
  const passingPercent = totalChecks > 0 ? Math.round((passingChecks / totalChecks) * 100) : 0;
  const criticalFailures = filteredChecks.filter(
    (c) => c.status === 'FAIL' && c.severity === 'CRITICAL',
  ).length;

  function toggleRow(controlId: string, framework: string) {
    const key = `${controlId}-${framework}`;
    setExpandedRow((prev) => (prev === key ? null : key));
  }

  return (
    <div className="space-y-6 animate-in">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-2">
          <Shield className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight">Compliance</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          BFSI regulatory compliance checks across RBI, SEBI, SOC 2, and PCI-DSS frameworks.
        </p>
      </div>

      {/* Score Cards Row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {scores.map((fw) => (
          <div key={fw.framework} className="rounded-xl border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">{fw.label}</p>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className={`mt-1 text-3xl font-bold ${scoreColor(fw.score)}`}>
              {fw.score}%
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {fw.passed}/{fw.total} checks passing
            </p>
            {/* Progress bar */}
            <div className="mt-3 h-2 w-full rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${scoreBarColor(fw.score)}`}
                style={{ width: `${fw.score}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border bg-card p-4 shadow-sm">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <div className="flex items-center gap-2">
          <label htmlFor="fw-filter" className="text-xs font-medium text-muted-foreground">
            Framework
          </label>
          <select
            id="fw-filter"
            value={frameworkFilter}
            onChange={(e) => setFrameworkFilter(e.target.value)}
            className="rounded-md border bg-background px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="All">All</option>
            <option value="RBI">RBI</option>
            <option value="SEBI">SEBI</option>
            <option value="SOC2">SOC 2</option>
            <option value="PCI_DSS">PCI-DSS</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="sev-filter" className="text-xs font-medium text-muted-foreground">
            Severity
          </label>
          <select
            id="sev-filter"
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="rounded-md border bg-background px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="All">All</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="status-filter" className="text-xs font-medium text-muted-foreground">
            Status
          </label>
          <select
            id="status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-md border bg-background px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="All">All</option>
            <option value="PASS">Pass</option>
            <option value="FAIL">Fail</option>
          </select>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="flex items-center gap-4 rounded-lg bg-muted/50 px-4 py-2.5 text-sm text-muted-foreground">
        <span>
          Total: <strong className="text-foreground">{totalChecks}</strong> checks
        </span>
        <span className="text-border">|</span>
        <span>
          Passing:{' '}
          <strong
            className={
              passingPercent >= 80
                ? 'text-green-600 dark:text-green-400'
                : passingPercent >= 60
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-red-600 dark:text-red-400'
            }
          >
            {passingPercent}%
          </strong>
        </span>
        <span className="text-border">|</span>
        <span>
          Critical Failures:{' '}
          <strong className={criticalFailures > 0 ? 'text-red-600 dark:text-red-400' : 'text-foreground'}>
            {criticalFailures}
          </strong>
        </span>
      </div>

      {/* Checks Table */}
      <div className="rounded-xl border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="px-4 py-3 font-medium text-muted-foreground w-10">Status</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">Control</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">Category</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">Framework</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">Severity</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">Resource</th>
                <th className="px-4 py-3 font-medium text-muted-foreground w-8" />
              </tr>
            </thead>
            <tbody>
              {filteredChecks.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-16 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <MinusCircle className="h-8 w-8 text-muted-foreground/50" />
                      <p className="text-muted-foreground">No compliance checks match the current filters.</p>
                      <button
                        onClick={() => {
                          setFrameworkFilter('All');
                          setSeverityFilter('All');
                          setStatusFilter('All');
                        }}
                        className="text-xs text-primary hover:underline"
                      >
                        Reset filters
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredChecks.map((check) => {
                  const rowKey = `${check.controlId}-${check.framework}`;
                  const isExpanded = expandedRow === rowKey;

                  return (
                    <tr key={rowKey} className="group border-b last:border-0">
                      {/* Main row - clickable */}
                      <td
                        colSpan={7}
                        className="p-0"
                      >
                        <button
                          type="button"
                          onClick={() => toggleRow(check.controlId, check.framework)}
                          className="flex w-full items-center text-left hover:bg-muted/50 transition-colors"
                        >
                          {/* Status */}
                          <span className="flex items-center justify-center px-4 py-3 w-10 shrink-0">
                            <StatusIcon status={check.status} />
                          </span>

                          {/* Control ID + Name */}
                          <span className="px-4 py-3 min-w-0 flex-1">
                            <span className="font-mono text-xs font-bold">{check.controlId}</span>
                            <span className="ml-2 text-xs">{check.controlName}</span>
                          </span>

                          {/* Category */}
                          <span className="hidden px-4 py-3 md:block shrink-0">
                            <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                              {check.category}
                            </span>
                          </span>

                          {/* Framework */}
                          <span className="hidden px-4 py-3 lg:block shrink-0">
                            <span
                              className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                                frameworkBadgeStyles[check.framework] || 'bg-gray-100 text-gray-700'
                              }`}
                            >
                              {frameworkDisplayName[check.framework] || check.framework}
                            </span>
                          </span>

                          {/* Severity */}
                          <span className="hidden px-4 py-3 sm:block shrink-0">
                            <span
                              className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                                severityStyles[check.severity] || ''
                              }`}
                            >
                              {check.severity}
                            </span>
                          </span>

                          {/* Resource */}
                          <span className="hidden px-4 py-3 xl:block shrink-0 text-xs text-muted-foreground">
                            {check.resourceType}
                          </span>

                          {/* Expand icon */}
                          <span className="px-4 py-3 shrink-0">
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            )}
                          </span>
                        </button>

                        {/* Expanded remediation */}
                        {isExpanded && (
                          <div className="border-t bg-muted/30 px-6 py-4">
                            <div className="grid gap-3 sm:grid-cols-2">
                              <div>
                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                  Description
                                </p>
                                <p className="mt-1 text-sm">{check.description}</p>
                              </div>
                              <div>
                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                  Remediation
                                </p>
                                <p className="mt-1 text-sm">{check.remediation}</p>
                              </div>
                            </div>
                            <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
                              <span>
                                Provider: <strong className="text-foreground">{check.provider}</strong>
                              </span>
                              <span>
                                Resource: <strong className="text-foreground">{check.resourceType}</strong>
                              </span>
                              <span>
                                Evaluated: <strong className="text-foreground">{new Date(check.lastEvaluatedAt).toLocaleString()}</strong>
                              </span>

                              {/* Show framework + severity on mobile since hidden in the table row */}
                              <span className="sm:hidden">
                                Severity:{' '}
                                <span
                                  className={`inline-flex rounded-full px-1.5 py-0.5 text-xs font-medium ${
                                    severityStyles[check.severity] || ''
                                  }`}
                                >
                                  {check.severity}
                                </span>
                              </span>
                              <span className="lg:hidden">
                                Framework:{' '}
                                <span
                                  className={`inline-flex rounded-full px-1.5 py-0.5 text-xs font-medium ${
                                    frameworkBadgeStyles[check.framework] || ''
                                  }`}
                                >
                                  {frameworkDisplayName[check.framework] || check.framework}
                                </span>
                              </span>
                            </div>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
