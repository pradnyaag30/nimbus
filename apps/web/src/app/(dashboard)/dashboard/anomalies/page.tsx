'use client';

import { formatDate } from '@/lib/utils';
import { AlertTriangle, CheckCircle } from 'lucide-react';
import { useCurrency } from '@/components/providers/CurrencyProvider';

const anomalies = [
  {
    id: '1',
    title: 'Unusual spike in EC2 data transfer',
    description: 'Data transfer out increased 340% compared to the 30-day average',
    provider: 'AWS',
    service: 'EC2',
    impact: 2840,
    detected: '2026-02-09T14:30:00Z',
    status: 'open' as const,
  },
  {
    id: '2',
    title: 'Azure SQL DTU consumption anomaly',
    description: 'Database throughput units exceeded normal range by 180%',
    provider: 'Azure',
    service: 'SQL Database',
    impact: 1250,
    detected: '2026-02-08T09:15:00Z',
    status: 'open' as const,
  },
  {
    id: '3',
    title: 'GCP BigQuery scan cost spike',
    description: 'Query costs increased 5x from normal pattern',
    provider: 'GCP',
    service: 'BigQuery',
    impact: 890,
    detected: '2026-02-07T22:00:00Z',
    status: 'open' as const,
  },
  {
    id: '4',
    title: 'Lambda invocation count anomaly',
    description: 'Resolved: was caused by scheduled batch processing',
    provider: 'AWS',
    service: 'Lambda',
    impact: 420,
    detected: '2026-02-05T11:00:00Z',
    status: 'resolved' as const,
  },
];

export default function AnomaliesPage() {
  const { format } = useCurrency();
  const openCount = anomalies.filter((a) => a.status === 'open').length;
  const totalImpact = anomalies
    .filter((a) => a.status === 'open')
    .reduce((sum, a) => sum + a.impact, 0);

  return (
    <div className="space-y-6 animate-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Cost Anomalies</h1>
        <p className="text-sm text-muted-foreground">
          Automated detection of unusual spending patterns.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border bg-card p-6">
          <p className="text-sm text-muted-foreground">Open Anomalies</p>
          <p className="mt-1 text-3xl font-bold text-destructive">{openCount}</p>
        </div>
        <div className="rounded-xl border bg-card p-6">
          <p className="text-sm text-muted-foreground">Estimated Impact</p>
          <p className="mt-1 text-3xl font-bold">{format(totalImpact)}</p>
        </div>
      </div>

      <div className="space-y-3">
        {anomalies.map((anomaly) => (
          <div key={anomaly.id} className="rounded-xl border bg-card p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                {anomaly.status === 'open' ? (
                  <AlertTriangle className="mt-0.5 h-5 w-5 text-destructive" />
                ) : (
                  <CheckCircle className="mt-0.5 h-5 w-5 text-green-500" />
                )}
                <div>
                  <h3 className="font-semibold">{anomaly.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{anomaly.description}</p>
                  <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{anomaly.provider}</span>
                    <span>&middot;</span>
                    <span>{anomaly.service}</span>
                    <span>&middot;</span>
                    <span>Detected {formatDate(anomaly.detected)}</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold text-destructive">{format(anomaly.impact)}</p>
                <span
                  className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                    anomaly.status === 'open'
                      ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                  }`}
                >
                  {anomaly.status}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
