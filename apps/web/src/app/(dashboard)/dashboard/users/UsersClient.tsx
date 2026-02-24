'use client';

import { useState } from 'react';
import {
  Users,
  UserPlus,
  Shield,
  ShieldCheck,
  Pencil,
  Eye,
  ClipboardCheck,
  Search,
  Info,
} from 'lucide-react';

// --- Types -------------------------------------------------------------------

interface UserRecord {
  id: string;
  name: string;
  email: string;
  role: 'SUPER_ADMIN' | 'FINOPS_ADMIN' | 'EDITOR' | 'VIEWER' | 'AUDITOR';
  status: 'ACTIVE' | 'DISABLED';
  lastLoginAt: string;
}

interface UsersClientProps {
  users: UserRecord[];
  currentUserEmail: string;
}

// --- Role / Status Styling ---------------------------------------------------

const roleBadge: Record<UserRecord['role'], { bg: string; label: string; icon: React.ElementType }> = {
  SUPER_ADMIN: {
    bg: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    label: 'Super Admin',
    icon: Shield,
  },
  FINOPS_ADMIN: {
    bg: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    label: 'FinOps Admin',
    icon: ShieldCheck,
  },
  EDITOR: {
    bg: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    label: 'Editor',
    icon: Pencil,
  },
  VIEWER: {
    bg: 'bg-gray-100 text-gray-600 dark:bg-gray-800/50 dark:text-gray-400',
    label: 'Viewer',
    icon: Eye,
  },
  AUDITOR: {
    bg: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    label: 'Auditor',
    icon: ClipboardCheck,
  },
};

const statusBadge: Record<UserRecord['status'], { bg: string; dot: string; label: string }> = {
  ACTIVE: {
    bg: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    dot: 'bg-green-500',
    label: 'Active',
  },
  DISABLED: {
    bg: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    dot: 'bg-red-500',
    label: 'Disabled',
  },
};

// --- Helpers -----------------------------------------------------------------

function formatRelativeTime(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(isoString).toLocaleDateString('en-IN', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

// --- Component ---------------------------------------------------------------

export function UsersClient({ users, currentUserEmail }: UsersClientProps) {
  const [search, setSearch] = useState('');
  const [showTooltip, setShowTooltip] = useState(false);

  const filtered = users.filter((u) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.role.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <Users className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">User Management</h1>
            <p className="text-sm text-muted-foreground">
              Manage user accounts, roles, and access control.
            </p>
          </div>
        </div>
        <div className="relative">
          <button
            disabled
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow opacity-60 cursor-not-allowed"
          >
            <UserPlus className="h-4 w-4" />
            Invite User
          </button>
          {showTooltip && (
            <div className="absolute right-0 top-full mt-2 z-10 rounded-md border bg-popover px-3 py-1.5 text-xs text-popover-foreground shadow-md whitespace-nowrap">
              Coming soon
            </div>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search users by name, email, or role..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex h-9 w-full rounded-md border bg-transparent pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>

      {/* Users Table */}
      {filtered.length > 0 ? (
        <div className="rounded-xl border bg-card shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="px-6 py-3 font-medium text-muted-foreground">User</th>
                  <th className="px-6 py-3 font-medium text-muted-foreground">Role</th>
                  <th className="px-6 py-3 font-medium text-muted-foreground">Status</th>
                  <th className="px-6 py-3 font-medium text-muted-foreground">Last Login</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((user) => {
                  const role = roleBadge[user.role];
                  const status = statusBadge[user.status];
                  const RoleIcon = role.icon;
                  const isCurrentUser = user.email === currentUserEmail;

                  return (
                    <tr
                      key={user.id}
                      className="border-b last:border-0 hover:bg-muted/50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                            {user.name
                              .split(' ')
                              .map((n) => n[0])
                              .join('')
                              .toUpperCase()
                              .slice(0, 2)}
                          </div>
                          <div>
                            <p className="font-medium">
                              {user.name}
                              {isCurrentUser && (
                                <span className="ml-2 text-xs text-muted-foreground">(you)</span>
                              )}
                            </p>
                            <p className="text-xs text-muted-foreground">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${role.bg}`}
                        >
                          <RoleIcon className="h-3 w-3" />
                          {role.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${status.bg}`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
                          {status.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {formatRelativeTime(user.lastLoginAt)}
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
            <Users className="h-7 w-7 text-muted-foreground" />
          </div>
          <h2 className="mt-4 text-lg font-semibold">No users found</h2>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            {search
              ? `No users match "${search}". Try adjusting your search.`
              : 'No users have been added yet. Invite team members to get started.'}
          </p>
        </div>
      )}

      {/* Info */}
      <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
        <Info className="mt-0.5 h-5 w-5 shrink-0 text-blue-600 dark:text-blue-400" />
        <div>
          <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
            Role-Based Access Control
          </p>
          <p className="mt-1 text-xs text-blue-700 dark:text-blue-300">
            Super Admins can manage all users and settings. FinOps Admins manage costs and budgets.
            Editors can create reports and recommendations. Viewers have read-only access. Auditors
            can view compliance data and audit trails.
          </p>
        </div>
      </div>
    </div>
  );
}
