import type { AuditAction, AuditCategory, UserRole } from '@prisma/client';

export type { AuditAction, AuditCategory } from '@prisma/client';

export interface AuditContext {
  tenantId: string;
  userId?: string;
  userEmail: string;
  userRole: UserRole;
}

export interface AuditEntry {
  action: AuditAction;
  category: AuditCategory;
  targetType?: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
}

export interface AuditLogRecord extends AuditContext, AuditEntry {
  id: string;
  createdAt: string;
}
