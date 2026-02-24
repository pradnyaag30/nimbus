'use client';

import { useState } from 'react';
import {
  Database,
  Building2,
  Landmark,
  Tag,
  Bell,
  CheckCircle,
  XCircle,
  Info,
} from 'lucide-react';

// --- Types -------------------------------------------------------------------

interface CostCenter {
  id: string;
  code: string;
  name: string;
  ownerEmail: string;
  budgetAmount: number;
  currency: string;
  isActive: boolean;
}

interface BusinessUnit {
  id: string;
  code: string;
  name: string;
  headEmail: string;
  parentCode: string | null;
  isActive: boolean;
}

interface MastersClientProps {
  costCenters: CostCenter[];
  businessUnits: BusinessUnit[];
}

// --- Tab Config --------------------------------------------------------------

type TabKey = 'cost-centers' | 'business-units' | 'tag-policies' | 'alert-config';

const tabs: { key: TabKey; label: string; icon: React.ElementType }[] = [
  { key: 'cost-centers', label: 'Cost Centers', icon: Building2 },
  { key: 'business-units', label: 'Business Units', icon: Landmark },
  { key: 'tag-policies', label: 'Tag Policies', icon: Tag },
  { key: 'alert-config', label: 'Alert Config', icon: Bell },
];

// --- Tag Policy Data ---------------------------------------------------------

const tagPolicies = [
  {
    tagKey: 'CostCenter',
    required: true,
    pattern: 'CC-[A-Z]+',
    description: 'Cost center code for financial allocation and chargeback',
  },
  {
    tagKey: 'BusinessUnit',
    required: true,
    pattern: 'BU-[A-Z]+',
    description: 'Business unit code for organizational cost attribution',
  },
  {
    tagKey: 'Environment',
    required: true,
    pattern: '(production|staging|development|sandbox)',
    description: 'Deployment environment for resource lifecycle tracking',
  },
  {
    tagKey: 'Application',
    required: true,
    pattern: '[a-z0-9-]+',
    description: 'Application identifier for service-level cost analysis',
  },
  {
    tagKey: 'DataClassification',
    required: true,
    pattern: '(public|internal|confidential|restricted)',
    description: 'Data sensitivity level for BFSI compliance and RBI guidelines',
  },
];

// --- Helpers -----------------------------------------------------------------

function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function ActiveBadge({ active }: { active: boolean }) {
  return active ? (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
      <CheckCircle className="h-3 w-3" />
      Active
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700 dark:bg-red-900/30 dark:text-red-400">
      <XCircle className="h-3 w-3" />
      Inactive
    </span>
  );
}

// --- Component ---------------------------------------------------------------

export function MastersClient({ costCenters, businessUnits }: MastersClientProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('cost-centers');

  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <Database className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Masters</h1>
          <p className="text-sm text-muted-foreground">
            Manage cost centers, business units, tagging policies, and alert configuration.
          </p>
        </div>
      </div>

      {/* Tab Bar */}
      <div className="border-b">
        <nav className="-mb-px flex gap-6">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key;
            const TabIcon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 border-b-2 px-1 py-3 text-sm transition-colors ${
                  isActive
                    ? 'border-primary font-bold text-foreground'
                    : 'border-transparent font-medium text-muted-foreground hover:border-border hover:text-foreground'
                }`}
              >
                <TabIcon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'cost-centers' && (
        <div className="rounded-xl border bg-card shadow-sm">
          <div className="p-6 pb-3">
            <h3 className="font-semibold">Cost Centers</h3>
            <p className="text-sm text-muted-foreground">
              Financial allocation centers for cloud cost chargeback and showback.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-t text-left">
                  <th className="px-6 py-3 font-medium text-muted-foreground">Code</th>
                  <th className="px-6 py-3 font-medium text-muted-foreground">Name</th>
                  <th className="px-6 py-3 font-medium text-muted-foreground">Owner</th>
                  <th className="px-6 py-3 text-right font-medium text-muted-foreground">Budget</th>
                  <th className="px-6 py-3 font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {costCenters.map((cc) => (
                  <tr
                    key={cc.id}
                    className="border-b last:border-0 hover:bg-muted/50 transition-colors"
                  >
                    <td className="px-6 py-3">
                      <span className="rounded bg-muted px-2 py-0.5 font-mono text-xs">
                        {cc.code}
                      </span>
                    </td>
                    <td className="px-6 py-3 font-medium">{cc.name}</td>
                    <td className="px-6 py-3 text-xs text-muted-foreground">{cc.ownerEmail}</td>
                    <td className="px-6 py-3 text-right font-mono text-sm font-medium">
                      {formatCurrency(cc.budgetAmount, cc.currency)}
                    </td>
                    <td className="px-6 py-3">
                      <ActiveBadge active={cc.isActive} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'business-units' && (
        <div className="rounded-xl border bg-card shadow-sm">
          <div className="p-6 pb-3">
            <h3 className="font-semibold">Business Units</h3>
            <p className="text-sm text-muted-foreground">
              Organizational hierarchy for cost attribution and reporting.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-t text-left">
                  <th className="px-6 py-3 font-medium text-muted-foreground">Code</th>
                  <th className="px-6 py-3 font-medium text-muted-foreground">Name</th>
                  <th className="px-6 py-3 font-medium text-muted-foreground">Head</th>
                  <th className="px-6 py-3 font-medium text-muted-foreground">Parent BU</th>
                  <th className="px-6 py-3 font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {businessUnits.map((bu) => (
                  <tr
                    key={bu.id}
                    className="border-b last:border-0 hover:bg-muted/50 transition-colors"
                  >
                    <td className="px-6 py-3">
                      <span className="rounded bg-muted px-2 py-0.5 font-mono text-xs">
                        {bu.code}
                      </span>
                    </td>
                    <td className="px-6 py-3 font-medium">{bu.name}</td>
                    <td className="px-6 py-3 text-xs text-muted-foreground">{bu.headEmail}</td>
                    <td className="px-6 py-3">
                      {bu.parentCode ? (
                        <span className="rounded bg-muted px-2 py-0.5 font-mono text-xs">
                          {bu.parentCode}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="px-6 py-3">
                      <ActiveBadge active={bu.isActive} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'tag-policies' && (
        <div className="rounded-xl border bg-card shadow-sm">
          <div className="p-6 pb-3">
            <h3 className="font-semibold">Required Tag Policies</h3>
            <p className="text-sm text-muted-foreground">
              Mandatory tagging rules enforced across all cloud resources for BFSI compliance.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-t text-left">
                  <th className="px-6 py-3 font-medium text-muted-foreground">Tag Key</th>
                  <th className="px-6 py-3 font-medium text-muted-foreground">Required</th>
                  <th className="px-6 py-3 font-medium text-muted-foreground">Pattern</th>
                  <th className="px-6 py-3 font-medium text-muted-foreground">Description</th>
                </tr>
              </thead>
              <tbody>
                {tagPolicies.map((tp) => (
                  <tr
                    key={tp.tagKey}
                    className="border-b last:border-0 hover:bg-muted/50 transition-colors"
                  >
                    <td className="px-6 py-3">
                      <span className="rounded bg-muted px-2 py-0.5 font-mono text-xs font-semibold">
                        {tp.tagKey}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
                        <CheckCircle className="h-3 w-3" />
                        Yes
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      <code className="rounded bg-muted px-2 py-0.5 text-xs">
                        {tp.pattern}
                      </code>
                    </td>
                    <td className="px-6 py-3 text-xs text-muted-foreground max-w-sm">
                      {tp.description}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Info */}
          <div className="m-6 mt-3 flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
            <Info className="mt-0.5 h-5 w-5 shrink-0 text-blue-600 dark:text-blue-400" />
            <div>
              <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                Tag Enforcement
              </p>
              <p className="mt-1 text-xs text-blue-700 dark:text-blue-300">
                Resources missing required tags will be flagged in the Tag Governance dashboard.
                Patterns are validated using regex matching during compliance checks.
              </p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'alert-config' && (
        <div className="space-y-4">
          <div className="rounded-xl border bg-card p-6 shadow-sm">
            <h3 className="font-semibold">Budget Alert Thresholds</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Percentage thresholds that trigger budget alerts when spend approaches limits.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              {[50, 80, 100].map((threshold) => (
                <div
                  key={threshold}
                  className="flex items-center gap-3 rounded-lg border p-4 min-w-[140px]"
                >
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold ${
                      threshold <= 50
                        ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                        : threshold <= 80
                          ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                          : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                    }`}
                  >
                    {threshold}%
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      {threshold <= 50
                        ? 'Warning'
                        : threshold <= 80
                          ? 'Critical'
                          : 'Exceeded'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {threshold <= 50
                        ? 'Email notification'
                        : threshold <= 80
                          ? 'Email + Slack alert'
                          : 'Escalation to FinOps Admin'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border bg-card p-6 shadow-sm">
            <h3 className="font-semibold">Anomaly Detection Sensitivity</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Determines how aggressively cost anomalies are flagged.
            </p>
            <div className="mt-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                <Bell className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium">Medium</p>
                <p className="text-xs text-muted-foreground">
                  Alerts triggered when cost exceeds 2 standard deviations from the 30-day rolling
                  average.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border bg-card p-6 shadow-sm">
            <h3 className="font-semibold">Compliance Check Frequency</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              How often automated compliance checks run against cloud resources.
            </p>
            <div className="mt-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                <CheckCircle className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium">Daily</p>
                <p className="text-xs text-muted-foreground">
                  Compliance checks run every 24 hours at 02:00 UTC. Results available on the
                  Governance and Tag Governance dashboards.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
