import { Shield, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

export const metadata = { title: 'Governance' };

// TODO: Replace with real data
const policies = [
  {
    name: 'Tagging Compliance',
    description: 'All resources must have cost-center, environment, and team tags',
    compliant: 89,
    total: 263,
    severity: 'high' as const,
  },
  {
    name: 'No Public S3 Buckets',
    description: 'S3 buckets must not allow public access',
    compliant: 42,
    total: 42,
    severity: 'critical' as const,
  },
  {
    name: 'Encryption at Rest',
    description: 'All storage resources must have encryption enabled',
    compliant: 156,
    total: 170,
    severity: 'critical' as const,
  },
  {
    name: 'Resource Naming Convention',
    description: 'Resources must follow [env]-[team]-[service]-[id] naming',
    compliant: 201,
    total: 263,
    severity: 'medium' as const,
  },
  {
    name: 'Max Instance Size',
    description: 'Dev/staging instances capped at medium tier',
    compliant: 45,
    total: 48,
    severity: 'low' as const,
  },
];

const severityColors = {
  critical: 'text-red-600 dark:text-red-400',
  high: 'text-orange-600 dark:text-orange-400',
  medium: 'text-yellow-600 dark:text-yellow-400',
  low: 'text-blue-600 dark:text-blue-400',
};

export default function GovernancePage() {
  return (
    <div className="space-y-6 animate-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Governance</h1>
          <p className="text-sm text-muted-foreground">
            Policy compliance, tagging rules, and cost governance.
          </p>
        </div>
        <button className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90">
          <Shield className="h-4 w-4" />
          New Policy
        </button>
      </div>

      <div className="space-y-4">
        {policies.map((policy) => {
          const pct = (policy.compliant / policy.total) * 100;
          const isFullyCompliant = pct === 100;

          return (
            <div key={policy.name} className="rounded-xl border bg-card p-5 shadow-sm">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  {isFullyCompliant ? (
                    <CheckCircle className="mt-0.5 h-5 w-5 text-green-500" />
                  ) : pct >= 90 ? (
                    <AlertTriangle className="mt-0.5 h-5 w-5 text-yellow-500" />
                  ) : (
                    <XCircle className="mt-0.5 h-5 w-5 text-red-500" />
                  )}
                  <div>
                    <h3 className="font-semibold">{policy.name}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{policy.description}</p>
                  </div>
                </div>
                <span className={`text-xs font-medium uppercase ${severityColors[policy.severity]}`}>
                  {policy.severity}
                </span>
              </div>
              <div className="mt-4">
                <div className="flex justify-between text-sm">
                  <span>
                    {policy.compliant}/{policy.total} compliant
                  </span>
                  <span className="font-medium">{pct.toFixed(1)}%</span>
                </div>
                <div className="mt-1.5 h-2 rounded-full bg-muted">
                  <div
                    className={`h-full rounded-full ${
                      isFullyCompliant
                        ? 'bg-green-500'
                        : pct >= 90
                          ? 'bg-yellow-500'
                          : 'bg-red-500'
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
