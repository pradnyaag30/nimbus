/**
 * Audit logging types — defined locally to decouple from Prisma generate.
 * These mirror the enums in schema.prisma and will be reconciled
 * once `prisma migrate` is run for the enterprise models.
 */
import type { UserRole } from '@/lib/auth/types';

export type AuditAction =
  | 'LOGIN'
  | 'LOGOUT'
  | 'CREATE_USER'
  | 'UPDATE_USER'
  | 'DELETE_USER'
  | 'UPDATE_ROLE'
  | 'VIEW_COSTS'
  | 'EXPORT_DATA'
  | 'CREATE_BUDGET'
  | 'UPDATE_BUDGET'
  | 'DELETE_BUDGET'
  | 'VIEW_RECOMMENDATIONS'
  | 'APPLY_RECOMMENDATION'
  | 'CREATE_POLICY'
  | 'UPDATE_POLICY'
  | 'RUN_COMPLIANCE_CHECK'
  | 'UPDATE_SETTINGS'
  | 'API_KEY_CREATED'
  | 'API_KEY_REVOKED';

export type AuditCategory =
  | 'AUTH'
  | 'USER_ADMIN'
  | 'COST_MANAGEMENT'
  | 'BUDGET'
  | 'OPTIMIZATION'
  | 'GOVERNANCE'
  | 'SYSTEM'
  | 'API';

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
