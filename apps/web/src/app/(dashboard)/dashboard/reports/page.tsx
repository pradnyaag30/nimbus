import { auth } from '@/lib/auth/config';
import { redirect } from 'next/navigation';
import { ReportsClient } from './ReportsClient';

export const metadata = { title: 'Reports' };
export const dynamic = 'force-dynamic';

export default async function ReportsPage() {
  const session = await auth();
  if (!session?.user) redirect('/auth/signin');

  return <ReportsClient />;
}
