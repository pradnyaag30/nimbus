'use client';

import { AlertTriangle, Clock } from 'lucide-react';
import type { ExpirationAlert } from '@/lib/cloud/commitments/types';

interface ExpirationTimelineProps {
  alerts: ExpirationAlert[];
}

export function ExpirationTimeline({ alerts }: ExpirationTimelineProps) {
  const urgencyColor = (days: number) => {
    if (days <= 30) return 'border-red-200 bg-red-50';
    if (days <= 60) return 'border-amber-200 bg-amber-50';
    return 'border-yellow-200 bg-yellow-50';
  };

  const urgencyIcon = (days: number) => {
    if (days <= 30) return 'text-red-600';
    if (days <= 60) return 'text-amber-600';
    return 'text-yellow-600';
  };

  return (
    <div className="rounded-xl border bg-card p-6 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <AlertTriangle className="h-5 w-5 text-amber-500" />
        <h3 className="text-lg font-semibold">Expiring Commitments</h3>
        <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
          {alerts.length} alert{alerts.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="space-y-3">
        {alerts.map((alert) => (
          <div
            key={alert.commitmentId}
            className={`flex items-center gap-4 rounded-lg border p-4 ${urgencyColor(alert.daysRemaining)}`}
          >
            <Clock className={`h-5 w-5 shrink-0 ${urgencyIcon(alert.daysRemaining)}`} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{alert.commitmentName}</p>
              <p className="text-xs text-muted-foreground">
                {alert.provider} &middot;{' '}
                {alert.commitmentType === 'RESERVED_INSTANCE'
                  ? 'Reserved Instance'
                  : alert.commitmentType === 'SAVINGS_PLAN'
                    ? 'Savings Plan'
                    : 'CUD'}
              </p>
            </div>
            <div className="text-right">
              <p className={`text-sm font-bold ${urgencyIcon(alert.daysRemaining)}`}>
                {alert.daysRemaining} days
              </p>
              <p className="text-xs text-muted-foreground">
                {alert.endDate.toLocaleDateString()}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
