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
      name: 'Pushpak Patil',
      email: 'pushpak.patil@acc.ltd',
      role: 'SUPER_ADMIN' as const,
      status: 'ACTIVE' as const,
      lastLoginAt: new Date().toISOString(),
    },
  ];

  return <UsersClient users={demoUsers} currentUserEmail={session.user.email} />;
}
