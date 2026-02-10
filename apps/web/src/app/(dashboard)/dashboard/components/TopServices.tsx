import { formatCurrency, formatPercentage } from '@/lib/utils';

// TODO: Replace with real data
const services = [
  { name: 'Amazon EC2', provider: 'AWS', cost: 8420, change: -2.1 },
  { name: 'Azure SQL Database', provider: 'Azure', cost: 5230, change: 5.3 },
  { name: 'Amazon S3', provider: 'AWS', cost: 4180, change: -0.8 },
  { name: 'GCE Instances', provider: 'GCP', cost: 3950, change: 12.1 },
  { name: 'Amazon RDS', provider: 'AWS', cost: 3620, change: -4.5 },
  { name: 'Azure Virtual Machines', provider: 'Azure', cost: 3210, change: 1.2 },
  { name: 'Cloud Storage', provider: 'GCP', cost: 2890, change: -1.5 },
  { name: 'Amazon EKS', provider: 'AWS', cost: 2450, change: 8.7 },
];

const providerColors: Record<string, string> = {
  AWS: 'bg-orange-500',
  Azure: 'bg-blue-500',
  GCP: 'bg-green-500',
};

export function TopServices() {
  return (
    <div className="rounded-xl border bg-card p-6 shadow-sm">
      <div className="mb-4">
        <h3 className="font-semibold">Top Services by Cost</h3>
        <p className="text-sm text-muted-foreground">Highest spending services this month</p>
      </div>
      <div className="space-y-3">
        {services.map((service) => (
          <div key={service.name} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`h-2 w-2 rounded-full ${providerColors[service.provider]}`} />
              <div>
                <p className="text-sm font-medium">{service.name}</p>
                <p className="text-xs text-muted-foreground">{service.provider}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium">{formatCurrency(service.cost)}</p>
              <p
                className={`text-xs ${
                  service.change < 0
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-red-600 dark:text-red-400'
                }`}
              >
                {formatPercentage(service.change)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
