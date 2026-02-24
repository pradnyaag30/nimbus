import type { AuditContext, AuditEntry, AuditLogRecord } from './types';

// In-memory audit store for demo mode. Production: write to AuditLog table via Prisma.
const auditStore: AuditLogRecord[] = [];
let counter = 0;

export async function logAudit(context: AuditContext, entry: AuditEntry): Promise<void> {
  const record: AuditLogRecord = {
    id: `audit_${++counter}`,
    ...context,
    ...entry,
    createdAt: new Date().toISOString(),
  };

  auditStore.push(record);

  // Keep only last 10,000 entries in memory
  if (auditStore.length > 10_000) {
    auditStore.splice(0, auditStore.length - 10_000);
  }
}

export function getAuditLogs(opts?: {
  tenantId?: string;
  category?: string;
  userId?: string;
  since?: string;
  limit?: number;
  cursor?: string;
  search?: string;
}) {
  let logs = [...auditStore];

  if (opts?.tenantId) logs = logs.filter((l) => l.tenantId === opts.tenantId);
  if (opts?.category) logs = logs.filter((l) => l.category === opts.category);
  if (opts?.userId) logs = logs.filter((l) => l.userId === opts.userId);
  if (opts?.since) logs = logs.filter((l) => l.createdAt >= opts.since!);
  if (opts?.search) {
    const q = opts.search.toLowerCase();
    logs = logs.filter(
      (l) =>
        l.userEmail.toLowerCase().includes(q) ||
        l.action.toLowerCase().includes(q) ||
        (l.targetType && l.targetType.toLowerCase().includes(q))
    );
  }

  // Sort newest first
  logs.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const limit = opts?.limit || 50;
  const startIdx = opts?.cursor ? logs.findIndex((l) => l.id === opts.cursor) + 1 : 0;
  const page = logs.slice(startIdx, startIdx + limit);

  return {
    logs: page,
    total: logs.length,
    cursor: page.length === limit ? page[page.length - 1]?.id : null,
    hasMore: startIdx + limit < logs.length,
  };
}
