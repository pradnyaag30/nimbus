'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useState, useEffect, useCallback, useRef } from 'react';
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
  ChevronDown,
  FileBarChart,
  Scale,
  ScrollText,
  Users,
  Database,
  Activity,
  FileText,
  BookmarkCheck,
  Calculator,
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
  icon: LucideIcon;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    id: 'analytics',
    label: 'Analytics',
    icon: BarChart3,
    items: [
      { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
      { name: 'Cost Explorer', href: '/dashboard/costs', icon: BarChart3 },
      { name: 'Budgets', href: '/dashboard/budgets', icon: Wallet },
      { name: 'Recommendations', href: '/dashboard/recommendations', icon: Lightbulb },
      { name: 'Commitments', href: '/dashboard/commitments', icon: BookmarkCheck },
      { name: 'Anomalies', href: '/dashboard/anomalies', icon: AlertTriangle },
      { name: 'Trusted Advisor', href: '/dashboard/trusted-advisor', icon: ShieldCheck },
      { name: 'Resources', href: '/dashboard/resources', icon: Server },
      { name: 'Workload Planner', href: '/dashboard/workload-planner', icon: Calculator },
    ],
  },
  {
    id: 'reports',
    label: 'Reports',
    icon: FileBarChart,
    items: [
      { name: 'CXO Summary', href: '/dashboard/reports', icon: FileBarChart },
    ],
  },
  {
    id: 'governance',
    label: 'Governance',
    icon: ShieldCheck,
    items: [
      { name: 'Compliance', href: '/dashboard/compliance', icon: ShieldCheck },
      { name: 'Governance', href: '/dashboard/governance', icon: Scale },
      { name: 'Tag Governance', href: '/dashboard/tag-governance', icon: Tags },
      { name: 'Audit Trail', href: '/dashboard/audit-trail', icon: ScrollText },
    ],
  },
  {
    id: 'administration',
    label: 'Administration',
    icon: Settings,
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
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});
  const collapseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const visibleSections = navSections.filter((section) =>
    canSeeSection(userRole, section.id),
  );

  // Auto-open the section that contains the active route
  const getActiveSection = useCallback(() => {
    for (const section of visibleSections) {
      for (const item of section.items) {
        const isActive = item.href === '/dashboard'
          ? pathname === '/dashboard'
          : pathname.startsWith(item.href);
        if (isActive) return section.id;
      }
    }
    return 'analytics';
  }, [pathname, visibleSections]);

  useEffect(() => {
    const activeSection = getActiveSection();
    setOpenSections((prev) => ({ ...prev, [activeSection]: true }));
  }, [pathname, getActiveSection]);

  // Debounced expand/collapse to prevent race conditions with link clicks
  function handleMouseEnter() {
    if (collapseTimer.current) {
      clearTimeout(collapseTimer.current);
      collapseTimer.current = null;
    }
    setExpanded(true);
  }

  function handleMouseLeave() {
    collapseTimer.current = setTimeout(() => {
      setExpanded(false);
    }, 400);
  }

  function toggleSection(sectionId: string) {
    setOpenSections((prev) => ({ ...prev, [sectionId]: !prev[sectionId] }));
  }

  // Collapse sidebar on link click — do NOT call e.preventDefault()
  // so that Next.js Link handles navigation naturally via its built-in handler
  function handleNavClick() {
    if (collapseTimer.current) {
      clearTimeout(collapseTimer.current);
      collapseTimer.current = null;
    }
    setExpanded(false);
  }

  return (
    <>
      {/* Hover trigger strip — always visible */}
      <div
        className="fixed inset-y-0 left-0 z-40 w-3 cursor-pointer"
        onMouseEnter={handleMouseEnter}
      />

      {/* Backdrop overlay when expanded */}
      {expanded && (
        <div
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[1px] transition-opacity lg:hidden"
          onClick={() => setExpanded(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex flex-col border-r bg-sidebar transition-all duration-300 ease-in-out',
          expanded ? 'w-64' : 'w-14',
        )}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Logo */}
        <div className="flex h-14 items-center border-b px-3">
          <Link href="/dashboard" onClick={handleNavClick} className="flex items-center gap-2 overflow-hidden">
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
          {visibleSections.map((section) => {
            const isOpen = openSections[section.id] ?? false;
            const hasActiveChild = section.items.some((item) =>
              item.href === '/dashboard'
                ? pathname === '/dashboard'
                : pathname.startsWith(item.href),
            );

            // When sidebar is expanded: show items only if section is open (CSS-based, no unmount)
            // When sidebar is collapsed: always show items (icon-only mode)
            const shouldShowItems = expanded ? isOpen : true;

            return (
              <div key={section.id}>
                {/* Section Header — collapsible */}
                {expanded ? (
                  <button
                    onClick={() => toggleSection(section.id)}
                    className={cn(
                      'flex w-full items-center justify-between rounded-md px-3 py-2 text-sm font-medium transition-colors',
                      hasActiveChild
                        ? 'text-foreground'
                        : 'text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/30',
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <section.icon className="h-4 w-4 shrink-0" />
                      <span className="truncate">{section.label}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {hasActiveChild && !isOpen && (
                        <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                      )}
                      <ChevronDown
                        className={cn(
                          'h-3.5 w-3.5 text-muted-foreground transition-transform duration-200',
                          isOpen && 'rotate-180',
                        )}
                      />
                    </div>
                  </button>
                ) : (
                  <div className="my-1.5 border-t" />
                )}

                {/* Section Items — CSS visibility, never unmounted */}
                <div
                  className={cn(
                    'overflow-hidden transition-all duration-200',
                    expanded && 'ml-2 mt-0.5 space-y-0.5 border-l border-border/50 pl-2',
                    expanded && !shouldShowItems && 'max-h-0 opacity-0',
                    expanded && shouldShowItems && 'max-h-[600px] opacity-100',
                    !expanded && 'max-h-[600px]',
                  )}
                >
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
                        onClick={handleNavClick}
                        className={cn(
                          'flex items-center gap-3 rounded-md px-2 py-1.5 text-sm transition-colors',
                          expanded ? 'px-2.5' : 'justify-center py-2',
                          isActive
                            ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                            : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground',
                        )}
                      >
                        <item.icon className="h-4 w-4 shrink-0" />
                        {expanded && <span className="truncate">{item.name}</span>}
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
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
