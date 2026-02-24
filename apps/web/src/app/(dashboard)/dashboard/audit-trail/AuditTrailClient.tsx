'use client';

import { useState, useMemo } from 'react';
import {
  ScrollText,
  Search,
  Download,
  Filter,
  ChevronDown,
  LogIn,
  UserCog,
  ShieldAlert,
  Settings,
  Eye,
} from 'lucide-react';

// --- Types -------------------------------------------------------------------

interface AuditLogRecord {
  id: string;
  tenantId: string;
  userId?: string;
  userEmail: string;
  userRole: string;
  action: string;
  category: string;
  targetType?: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

interface AuditTrailClientProps {
  initialData: AuditLogRecord[];
  totalCount: number;
}

// --- Category Styling --------------------------------------------------------

const categoryConfig: Record<string, { bg: string; icon: React.ElementType; label: string }> = {
  AUTH: {
    bg: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    icon: LogIn,
    label: 'Auth',
  },
  USER_ADMIN: {
    bg: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    icon: UserCog,
    label: 'User Admin',
  },
  POLICY_ADMIN: {
    bg: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    icon: ShieldAlert,
    label: 'Policy Admin',
  },
  CONFIG_ADMIN: {
    bg: 'bg-gray-100 text-gray-600 dark:bg-gray-800/50 dark:text-gray-400',
    icon: Settings,
    label: 'Config Admin',
  },
  SENSITIVE_READ: {
    bg: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    icon: Eye,
    label: 'Sensitive Read',
  },
};

// --- Helpers -----------------------------------------------------------------

const actionLabels: Record<string, string> = {
  LOGIN_SUCCESS: 'Logged in successfully',
  LOGIN_FAILED: 'Login attempt failed',
  LOGOUT: 'Logged out',
  USER_CREATED: 'Created a new user',
  USER_INVITED: 'Invited a user',
  ROLE_CHANGED: 'Changed user role',
  USER_DISABLED: 'Disabled a user account',
  USER_ENABLED: 'Enabled a user account',
  POLICY_CREATED: 'Created a governance policy',
  POLICY_UPDATED: 'Updated a governance policy',
  POLICY_DELETED: 'Deleted a governance policy',
  SETTINGS_CHANGED: 'Updated system settings',
  CLOUD_ACCOUNT_ADDED: 'Connected a cloud account',
  CLOUD_ACCOUNT_REMOVED: 'Removed a cloud account',
  MASTER_DATA_CHANGED: 'Updated master data',
  COST_DATA_EXPORTED: 'Exported cost data',
  COMPLIANCE_VIEWED: 'Viewed compliance report',
  AUDIT_LOG_ACCESSED: 'Accessed audit logs',
  REPORT_GENERATED: 'Generated a report',
};

function formatTimestamp(isoString: string): string {
  const d = new Date(isoString);
  return d.toLocaleDateString('en-IN', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

function buildDetails(record: AuditLogRecord): string {
  const parts: string[] = [];
  if (record.targetType) parts.push(`Target: ${record.targetType}`);
  if (record.targetId) parts.push(`ID: ${record.targetId}`);
  if (record.metadata) {
    const entries = Object.entries(record.metadata);
    for (const [key, value] of entries.slice(0, 3)) {
      parts.push(`${key}: ${String(value)}`);
    }
  }
  return parts.join(' | ') || '-';
}

function exportCsv(data: AuditLogRecord[]): void {
  const headers = ['Timestamp', 'User Email', 'Action', 'Category', 'Target Type', 'Target ID', 'Details'];
  const rows = data.map((r) => [
    formatTimestamp(r.createdAt),
    r.userEmail,
    actionLabels[r.action] || r.action,
    r.category,
    r.targetType || '',
    r.targetId || '',
    r.metadata ? JSON.stringify(r.metadata) : '',
  ]);

  const csv = [headers, ...rows].map((row) => row.map((c) => `"${c}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `audit-trail-${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

// --- Component ---------------------------------------------------------------

const CATEGORIES = ['ALL', 'AUTH', 'USER_ADMIN', 'POLICY_ADMIN', 'CONFIG_ADMIN', 'SENSITIVE_READ'] as const;

export function AuditTrailClient({ initialData, totalCount }: AuditTrailClientProps) {
  const [category, setCategory] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

  const filtered = useMemo(() => {
    let logs = [...initialData];

    if (category !== 'ALL') {
      logs = logs.filter((l) => l.category === category);
    }

    if (search) {
      const q = search.toLowerCase();
      logs = logs.filter(
        (l) =>
          l.userEmail.toLowerCase().includes(q) ||
          (actionLabels[l.action] || l.action).toLowerCase().includes(q) ||
          (l.targetType && l.targetType.toLowerCase().includes(q)) ||
          (l.targetId && l.targetId.toLowerCase().includes(q))
      );
    }

    return logs;
  }, [initialData, category, search]);

  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <ScrollText className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Audit Trail</h1>
            <p className="text-sm text-muted-foreground">
              Track all user actions and system events for compliance.
              {totalCount > 0 && ` ${totalCount} events recorded.`}
            </p>
          </div>
        </div>
        <button
          onClick={() => exportCsv(filtered)}
          className="inline-flex h-9 items-center gap-2 rounded-md border px-4 text-sm font-medium transition-colors hover:bg-accent"
        >
          <Download className="h-4 w-4" />
          Export CSV
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Category Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
            className="inline-flex h-9 items-center gap-2 rounded-md border bg-transparent px-3 text-sm font-medium transition-colors hover:bg-accent"
          >
            <Filter className="h-4 w-4 text-muted-foreground" />
            {category === 'ALL' ? 'All Categories' : categoryConfig[category]?.label || category}
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
          {showCategoryDropdown && (
            <div className="absolute left-0 top-full z-20 mt-1 w-48 rounded-md border bg-popover py-1 shadow-lg">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => {
                    setCategory(cat);
                    setShowCategoryDropdown(false);
                  }}
                  className={`flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors hover:bg-accent ${
                    category === cat ? 'bg-accent font-medium' : ''
                  }`}
                >
                  {cat === 'ALL' ? 'All Categories' : categoryConfig[cat]?.label || cat}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by user, action, or target..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex h-9 w-full rounded-md border bg-transparent pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        {filtered.length !== initialData.length && (
          <span className="text-xs text-muted-foreground">
            Showing {filtered.length} of {initialData.length} events
          </span>
        )}
      </div>

      {/* Click-away backdrop */}
      {showCategoryDropdown && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => setShowCategoryDropdown(false)}
        />
      )}

      {/* Audit Table */}
      {filtered.length > 0 ? (
        <div className="rounded-xl border bg-card shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="px-6 py-3 font-medium text-muted-foreground whitespace-nowrap">Timestamp</th>
                  <th className="px-6 py-3 font-medium text-muted-foreground">User</th>
                  <th className="px-6 py-3 font-medium text-muted-foreground">Action</th>
                  <th className="px-6 py-3 font-medium text-muted-foreground">Category</th>
                  <th className="px-6 py-3 font-medium text-muted-foreground">Details</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((record) => {
                  const cat = categoryConfig[record.category];
                  const CatIcon = cat?.icon || Settings;

                  return (
                    <tr
                      key={record.id}
                      className="border-b last:border-0 hover:bg-muted/50 transition-colors"
                    >
                      <td className="px-6 py-3 whitespace-nowrap font-mono text-xs text-muted-foreground">
                        {formatTimestamp(record.createdAt)}
                      </td>
                      <td className="px-6 py-3">
                        <span className="text-xs">{record.userEmail}</span>
                      </td>
                      <td className="px-6 py-3">
                        <span className="text-xs">
                          {actionLabels[record.action] || record.action}
                        </span>
                      </td>
                      <td className="px-6 py-3">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            cat?.bg || 'bg-gray-100 text-gray-600 dark:bg-gray-800/50 dark:text-gray-400'
                          }`}
                        >
                          <CatIcon className="h-3 w-3" />
                          {cat?.label || record.category}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-xs text-muted-foreground max-w-xs truncate">
                        {buildDetails(record)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-xl border bg-card p-16 text-center shadow-sm">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
            <ScrollText className="h-7 w-7 text-muted-foreground" />
          </div>
          <h2 className="mt-4 text-lg font-semibold">No audit events recorded yet</h2>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Events will appear as users interact with the system. Login attempts, policy changes,
            data exports, and configuration updates are all tracked automatically.
          </p>
        </div>
      )}
    </div>
  );
}
