import { auth } from '@/lib/auth/config';
import { redirect } from 'next/navigation';
import { MastersClient } from './MastersClient';

export const metadata = { title: 'Masters' };
export const dynamic = 'force-dynamic';

export default async function MastersPage() {
  const session = await auth();
  if (!session?.user) redirect('/auth/signin');

  const costCenters = [
    {
      id: 'cc_1',
      code: 'CC-INFRA',
      name: 'Cloud Infrastructure',
      ownerEmail: 'rajesh.sharma@acmebank.in',
      budgetAmount: 250000,
      currency: 'USD',
      isActive: true,
    },
    {
      id: 'cc_2',
      code: 'CC-DATA',
      name: 'Data & Analytics',
      ownerEmail: 'priya.nair@acmebank.in',
      budgetAmount: 180000,
      currency: 'USD',
      isActive: true,
    },
    {
      id: 'cc_3',
      code: 'CC-SECOPS',
      name: 'Security Operations',
      ownerEmail: 'amit.patel@acmebank.in',
      budgetAmount: 120000,
      currency: 'USD',
      isActive: false,
    },
  ];

  const businessUnits = [
    {
      id: 'bu_1',
      code: 'BU-RETAIL',
      name: 'Retail Banking',
      headEmail: 'vp.retail@acmebank.in',
      parentCode: null,
      isActive: true,
    },
    {
      id: 'bu_2',
      code: 'BU-CORP',
      name: 'Corporate Banking',
      headEmail: 'vp.corporate@acmebank.in',
      parentCode: null,
      isActive: true,
    },
    {
      id: 'bu_3',
      code: 'BU-WEALTH',
      name: 'Wealth Management',
      headEmail: 'vp.wealth@acmebank.in',
      parentCode: 'BU-RETAIL',
      isActive: true,
    },
  ];

  return <MastersClient costCenters={costCenters} businessUnits={businessUnits} />;
}
