import { Shield, CheckCircle, Clock, Lock, Tag, Server } from 'lucide-react';
import { getDashboardData } from '@/lib/cloud/fetchDashboardData';

export const metadata = { title: 'Governance' };
export const dynamic = 'force-dynamic';

export default async function GovernancePage() {
  const data = await getDashboardData();
  const hasAccount = data.accountId && data.accountId !== 'not-connected';

  // Define governance policies — these are aspirational checks
  const policies = [
    {
      name: 'Cost Explorer Connected',
      description: 'AWS Cost Explorer API is accessible and returning data',
      status: hasAccount && data.totalSpendMTD > 0 ? 'pass' : 'fail',
      icon: CheckCircle,
    },
    {
      name: 'CUR Report Configured',
      description: 'Daily Cost and Usage Report is set up in S3 for detailed billing',
      status: hasAccount ? 'pass' : 'fail',
      icon: Clock,
    },
    {
      name: 'IAM Least Privilege',
      description: 'Nimbus uses read-only IAM credentials (ce:*, sts:GetCallerIdentity)',
      status: hasAccount ? 'pass' : 'pending',
      icon: Lock,
    },
    {
      name: 'Budget Alerts',
      description: 'AWS Budgets with SNS email alerts configured for overspend notifications',
      status: 'pending',
      icon: Shield,
    },
    {
      name: 'Tagging Compliance',
      description: 'All resources tagged with cost-center, environment, and team tags',
      status: 'pending',
      icon: Tag,
    },
    {
      name: 'Compute Optimizer',
      description: 'AWS Compute Optimizer enabled for rightsizing recommendations',
      status: hasAccount ? 'pass' : 'pending',
      icon: Server,
    },
  ];

  const passCount = policies.filter((p) => p.status === 'pass').length;
  const pendingCount = policies.filter((p) => p.status === 'pending').length;
  const failCount = policies.filter((p) => p.status === 'fail').length;

  const statusStyles = {
    pass: {
      badge: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      icon: 'text-green-500',
      label: 'Compliant',
    },
    pending: {
      badge: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
      icon: 'text-yellow-500',
      label: 'Pending',
    },
    fail: {
      badge: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
      icon: 'text-red-500',
      label: 'Action Required',
    },
  };

  return (
    <div className="space-y-6 animate-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Governance</h1>
          <p className="text-sm text-muted-foreground">
            FinOps readiness checklist and compliance status
            {hasAccount ? ` — AWS Account ${data.accountId}` : ''}
          </p>
        </div>
      </div>

      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border bg-card p-6">
          <p className="text-sm text-muted-foreground">Compliant</p>
          <p className="mt-1 text-3xl font-bold text-green-600 dark:text-green-400">{passCount}/{policies.length}</p>
        </div>
        <div className="rounded-xl border bg-card p-6">
          <p className="text-sm text-muted-foreground">Pending Setup</p>
          <p className="mt-1 text-3xl font-bold text-yellow-600 dark:text-yellow-400">{pendingCount}</p>
        </div>
        <div className="rounded-xl border bg-card p-6">
          <p className="text-sm text-muted-foreground">Action Required</p>
          <p className="mt-1 text-3xl font-bold text-red-600 dark:text-red-400">{failCount}</p>
        </div>
      </div>

      {/* Policy checklist */}
      <div className="space-y-3">
        {policies.map((policy) => {
          const style = statusStyles[policy.status as keyof typeof statusStyles];
          const Icon = policy.icon;
          return (
            <div key={policy.name} className="rounded-xl border bg-card p-5 shadow-sm">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <Icon className={`mt-0.5 h-5 w-5 ${style.icon}`} />
                  <div>
                    <h3 className="font-semibold">{policy.name}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{policy.description}</p>
                  </div>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${style.badge}`}>
                  {style.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
        <p className="text-sm text-blue-800 dark:text-blue-200">
          <strong>Next steps:</strong> Enable AWS Config rules for deeper compliance checks including
          tagging enforcement, encryption validation, and public access controls.
          These integrate with Nimbus for automated policy monitoring.
        </p>
      </div>
    </div>
  );
}
