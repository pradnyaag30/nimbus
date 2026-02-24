'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { canSeeSection, type SidebarSection } from '@/lib/auth/rbac';
import type { UserRole } from '@/lib/auth/types';
import {
  LayoutDashboard,
  BarChart3,
  Wallet,
  Lightbulb,
  AlertTriangle,
  ShieldCheck,
  Server,
  Cloud,
  Settings,
  Tags,
  ChevronRight,
  FileBarChart,
  Scale,
  ScrollText,
  Users,
  Database,
  Activity,
  FileText,
  type LucideIcon,
} from 'lucide-react';

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
      { name: 'Users', href: '/dashboard/users', icon: Users },
      { name: 'Masters', href: '/dashboard/masters', icon: Database },
      { name: 'Cloud Accounts', href: '/dashboard/accounts', icon: Cloud },
      { name: 'System Status', href: '/dashboard/system-status', icon: Activity },
      { name: 'Settings', href: '/dashboard/settings', icon: Settings },
      { name: 'SIEM Docs', href: '/dashboard/siem-docs', icon: FileText },
    ],
  },
];

interface SidebarProps {
  userRole?: UserRole;
}

export function Sidebar({ userRole = 'FINOPS_ADMIN' }: SidebarProps) {
  const pathname = usePathname();
  const [expanded, setExpanded] = useState(false);

  const visibleSections = navSections.filter((section) =>
    canSeeSection(userRole, section.id),
  );

  return (
    <>
      {/* Hover trigger strip — always visible */}
      <div
        className="fixed inset-y-0 left-0 z-40 w-3 cursor-pointer"
        onMouseEnter={() => setExpanded(true)}
      />

      {/* Backdrop overlay when expanded */}
      {expanded && (
        <div
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[1px] transition-opacity lg:hidden"
          onClick={() => setExpanded(false)}
        />
      )}

      {/* Collapsed icon strip */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex flex-col border-r bg-sidebar transition-all duration-300 ease-in-out',
          expanded ? 'w-64' : 'w-14',
        )}
        onMouseEnter={() => setExpanded(true)}
        onMouseLeave={() => setExpanded(false)}
      >
        {/* Logo */}
        <div className="flex h-14 items-center border-b px-3">
          <Link href="/dashboard" className="flex items-center gap-2 overflow-hidden">
            {expanded ? (
              <div className="flex items-center gap-2">
                <Image src="/images/acc-logo.png" alt="ACC" width={32} height={15} className="h-5 w-auto shrink-0" />
                <span className="bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-lg font-bold text-transparent">
                  FinOps AI
                </span>
              </div>
            ) : (
              <Image src="/images/acc-logo.png" alt="ACC" width={24} height={12} className="h-4 w-auto shrink-0" />
            )}
          </Link>
        </div>

        {/* Expand indicator */}
        {!expanded && (
          <div className="flex justify-center py-2">
            <ChevronRight className="h-3 w-3 text-muted-foreground/50" />
          </div>
        )}

        {/* Main Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto overflow-x-hidden px-2 py-3">
          {visibleSections.map((section, sectionIndex) => (
            <div key={section.id}>
              {/* Section divider — border when collapsed, label when expanded */}
              {expanded ? (
                <div
                  className={cn(
                    'mb-2 px-2 text-xs font-medium uppercase tracking-wider text-muted-foreground',
                    sectionIndex > 0 && 'mt-5',
                  )}
                >
                  {section.label}
                </div>
              ) : (
                sectionIndex > 0 && <div className="my-3 border-t" />
              )}

              {/* Section items */}
              {section.items.map((item) => {
                const isActive =
                  item.href === '/dashboard'
                    ? pathname === '/dashboard'
                    : pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    title={item.name}
                    className={cn(
                      'flex items-center gap-3 rounded-md px-2 py-2 text-sm font-medium transition-colors',
                      expanded ? 'px-3' : 'justify-center',
                      isActive
                        ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                        : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground',
                    )}
                  >
                    <item.icon className="h-4 w-4 shrink-0" />
                    {expanded && <span className="truncate">{item.name}</span>}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Footer */}
        {expanded && (
          <div className="border-t px-2 py-3">
            <div className="rounded-md bg-sidebar-accent/50 px-3 py-2">
              <div className="flex items-center gap-2">
                <Image src="/images/acc-logo.png" alt="ACC" width={40} height={19} className="h-4 w-auto" />
              </div>
              <p className="mt-1 text-[10px] text-muted-foreground">FinOps AI v2.0 — Cloud FinOps Platform</p>
            </div>
          </div>
        )}
      </aside>

      {/* Spacer to push content right of collapsed sidebar */}
      <div className="w-14 shrink-0" />
    </>
  );
}
