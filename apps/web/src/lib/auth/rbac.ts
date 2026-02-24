import type { UserRole } from '@prisma/client';

const ROLE_LEVEL: Record<UserRole, number> = {
  VIEWER: 0,
  EDITOR: 1,
  AUDITOR: 2,
  FINOPS_ADMIN: 3,
  SUPER_ADMIN: 4,
};

export type SidebarSection = 'analytics' | 'reports' | 'governance' | 'administration';

const SECTION_MIN_ROLE: Record<SidebarSection, UserRole> = {
  analytics: 'VIEWER',
  reports: 'EDITOR',
  governance: 'AUDITOR',
  administration: 'FINOPS_ADMIN',
};

export function hasRole(userRole: UserRole, minRole: UserRole): boolean {
  return ROLE_LEVEL[userRole] >= ROLE_LEVEL[minRole];
}

export function canSeeSection(userRole: UserRole, section: SidebarSection): boolean {
  return hasRole(userRole, SECTION_MIN_ROLE[section]);
}

export function canAccessRoute(userRole: UserRole, pathname: string): boolean {
  if (pathname.startsWith('/dashboard/users')) return hasRole(userRole, 'FINOPS_ADMIN');
  if (pathname.startsWith('/dashboard/masters')) return hasRole(userRole, 'FINOPS_ADMIN');
  if (pathname.startsWith('/dashboard/system-status')) return hasRole(userRole, 'FINOPS_ADMIN');
  if (pathname.startsWith('/dashboard/siem-docs')) return hasRole(userRole, 'FINOPS_ADMIN');
  if (pathname.startsWith('/dashboard/compliance')) return hasRole(userRole, 'AUDITOR');
  if (pathname.startsWith('/dashboard/audit-trail')) return hasRole(userRole, 'AUDITOR');
  if (pathname.startsWith('/dashboard/reports')) return hasRole(userRole, 'EDITOR');
  return true;
}
