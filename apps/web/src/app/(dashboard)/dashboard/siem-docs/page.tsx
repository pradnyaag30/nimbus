import { auth } from '@/lib/auth/config';
import { redirect } from 'next/navigation';
import { SiemDocsClient } from './SiemDocsClient';

export const metadata = { title: 'SIEM API Documentation' };

export default async function SiemDocsPage() {
  const session = await auth();
  if (!session?.user) redirect('/auth/signin');

  return <SiemDocsClient />;
}
