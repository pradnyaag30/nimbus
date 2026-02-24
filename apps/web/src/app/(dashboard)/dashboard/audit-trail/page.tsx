import { auth } from '@/lib/auth/config';
import { redirect } from 'next/navigation';
import { getAuditLogs } from '@/lib/audit/logger';
import { AuditTrailClient } from './AuditTrailClient';

export const metadata = { title: 'Audit Trail' };
export const dynamic = 'force-dynamic';

export default async function AuditTrailPage() {
  const session = await auth();
  if (!session?.user) redirect('/auth/signin');

  const result = getAuditLogs({
    tenantId: session.user.tenantId,
    limit: 200,
  });

  return (
    <AuditTrailClient
      initialData={result.logs}
      totalCount={result.total}
    />
  );
}
