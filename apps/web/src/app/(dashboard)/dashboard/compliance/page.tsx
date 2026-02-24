import { auth } from '@/lib/auth/config';
import { redirect } from 'next/navigation';
import { runComplianceChecks, computeFrameworkScores } from '@/lib/compliance/checks';
import { ComplianceClient } from './ComplianceClient';

export const metadata = { title: 'Compliance' };
export const dynamic = 'force-dynamic';

export default async function CompliancePage() {
  const session = await auth();
  if (!session?.user) redirect('/auth/signin');

  const awsConnected = !!(
    process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
  );

  const checks = runComplianceChecks({ awsConnected });
  const scores = computeFrameworkScores(checks);

  return <ComplianceClient checks={checks} scores={scores} />;
}
