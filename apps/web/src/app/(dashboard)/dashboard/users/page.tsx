import { auth } from '@/lib/auth/config';
import { redirect } from 'next/navigation';
import { UsersClient } from './UsersClient';

export const metadata = { title: 'User Management' };
export const dynamic = 'force-dynamic';

export default async function UsersPage() {
  const session = await auth();
  if (!session?.user) redirect('/auth/signin');

  const demoUsers = [
    {
      id: 'usr_1',
      name: 'Rajesh Sharma',
      email: 'rajesh.sharma@acmebank.in',
      role: 'SUPER_ADMIN' as const,
      status: 'ACTIVE' as const,
      lastLoginAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    },
    {
      id: 'usr_2',
      name: 'Priya Nair',
      email: 'priya.nair@acmebank.in',
      role: 'FINOPS_ADMIN' as const,
      status: 'ACTIVE' as const,
      lastLoginAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    },
    {
      id: 'usr_3',
      name: 'Amit Patel',
      email: 'amit.patel@acmebank.in',
      role: 'EDITOR' as const,
      status: 'ACTIVE' as const,
      lastLoginAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    },
    {
      id: 'usr_4',
      name: 'Sneha Deshmukh',
      email: 'sneha.deshmukh@acmebank.in',
      role: 'AUDITOR' as const,
      status: 'DISABLED' as const,
      lastLoginAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString(),
    },
  ];

  return <UsersClient users={demoUsers} currentUserEmail={session.user.email} />;
}
