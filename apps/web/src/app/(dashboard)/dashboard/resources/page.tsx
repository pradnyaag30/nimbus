import { formatCurrency } from '@/lib/utils';
import { Server } from 'lucide-react';

export const metadata = { title: 'Resources' };

// TODO: Replace with real data
const resources = [
  { name: 'prod-api-01', type: 'EC2 Instance', provider: 'AWS', region: 'us-east-1', cost: 285.50, status: 'running' },
  { name: 'nimbus-db-primary', type: 'RDS Instance', provider: 'AWS', region: 'us-east-1', cost: 412.00, status: 'running' },
  { name: 'dev-vm-west', type: 'Virtual Machine', provider: 'Azure', region: 'westus2', cost: 156.80, status: 'running' },
  { name: 'analytics-bq', type: 'BigQuery Dataset', provider: 'GCP', region: 'us-central1', cost: 89.20, status: 'active' },
  { name: 'staging-cluster', type: 'EKS Cluster', provider: 'AWS', region: 'us-west-2', cost: 198.50, status: 'running' },
  { name: 'blob-archive', type: 'Storage Account', provider: 'Azure', region: 'eastus', cost: 45.60, status: 'active' },
  { name: 'ml-training-gpu', type: 'GCE Instance', provider: 'GCP', region: 'us-central1', cost: 520.00, status: 'stopped' },
  { name: 'cdn-distribution', type: 'CloudFront', provider: 'AWS', region: 'global', cost: 134.20, status: 'active' },
];

const statusStyles: Record<string, string> = {
  running: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  active: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  stopped: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
};

export default function ResourcesPage() {
  return (
    <div className="space-y-6 animate-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Resources</h1>
        <p className="text-sm text-muted-foreground">
          Inventory of all discovered cloud resources with cost attribution.
        </p>
      </div>

      <div className="rounded-xl border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="px-4 py-3 font-medium text-muted-foreground">Resource</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">Type</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">Provider</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">Region</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Monthly Cost</th>
              </tr>
            </thead>
            <tbody>
              {resources.map((resource) => (
                <tr key={resource.name} className="border-b last:border-0 hover:bg-muted/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Server className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{resource.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{resource.type}</td>
                  <td className="px-4 py-3">{resource.provider}</td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{resource.region}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusStyles[resource.status]}`}>
                      {resource.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-medium">{formatCurrency(resource.cost)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
