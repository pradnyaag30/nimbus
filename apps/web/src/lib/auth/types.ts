/**
 * Enterprise RBAC types — defined locally to decouple from Prisma generate.
 * These mirror the enums in schema.prisma and will be reconciled
 * once `prisma migrate` is run for the enterprise models.
 */

export type UserRole =
  | 'VIEWER'
  | 'EDITOR'
  | 'AUDITOR'
  | 'FINOPS_ADMIN'
  | 'SUPER_ADMIN';

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  tenantId: string;
  image?: string | null;
}

declare module 'next-auth' {
  interface Session {
    user: SessionUser;
  }
}
