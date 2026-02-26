'use client';

import { useState } from 'react';
import type { CommitmentItemData } from '@/lib/cloud/commitments/types';

interface CommitmentTableProps {
  items: CommitmentItemData[];
  format: (value: number) => string;
}

type SortField = 'provider' | 'commitmentType' | 'endDate' | 'status' | 'hourlyCommitment';

export function CommitmentTable({ items, format }: CommitmentTableProps) {
  const [sortField, setSortField] = useState<SortField>('endDate');
  const [sortAsc, setSortAsc] = useState(true);
  const [filterProvider, setFilterProvider] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const filteredItems = items.filter((item) => {
    if (filterProvider !== 'all' && item.provider !== filterProvider) return false;
    if (filterType !== 'all' && item.commitmentType !== filterType) return false;
    return true;
  });

  const sortedItems = [...filteredItems].sort((a, b) => {
    const multiplier = sortAsc ? 1 : -1;
    switch (sortField) {
      case 'provider':
        return multiplier * a.provider.localeCompare(b.provider);
      case 'commitmentType':
        return multiplier * a.commitmentType.localeCompare(b.commitmentType);
      case 'endDate':
        return multiplier * (a.endDate.getTime() - b.endDate.getTime());
      case 'status':
        return multiplier * a.status.localeCompare(b.status);
      case 'hourlyCommitment':
        return multiplier * (a.hourlyCommitment - b.hourlyCommitment);
      default:
        return 0;
    }
  });

  const providers = [...new Set(items.map((i) => i.provider))];
  const types = [...new Set(items.map((i) => i.commitmentType))];

  const daysRemaining = (endDate: Date) => {
    const days = Math.ceil((endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return days;
  };

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      ACTIVE: 'bg-green-100 text-green-800',
      EXPIRED: 'bg-gray-100 text-gray-800',
      PENDING: 'bg-yellow-100 text-yellow-800',
      CANCELLED: 'bg-red-100 text-red-800',
    };
    return (
      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
        {status}
      </span>
    );
  };

  const expirationBadge = (endDate: Date) => {
    const days = daysRemaining(endDate);
    if (days <= 0) return <span className="text-xs text-gray-500">Expired</span>;
    if (days <= 30) return <span className="text-xs font-medium text-red-600">{days}d left</span>;
    if (days <= 60) return <span className="text-xs font-medium text-amber-600">{days}d left</span>;
    if (days <= 90) return <span className="text-xs font-medium text-yellow-600">{days}d left</span>;
    return <span className="text-xs text-muted-foreground">{days}d left</span>;
  };

  return (
    <div className="rounded-xl border bg-card shadow-sm">
      <div className="border-b p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h3 className="text-lg font-semibold">All Commitments</h3>
          <div className="flex gap-2">
            <select
              value={filterProvider}
              onChange={(e) => setFilterProvider(e.target.value)}
              className="rounded-md border bg-background px-3 py-1.5 text-sm"
            >
              <option value="all">All Providers</option>
              {providers.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="rounded-md border bg-background px-3 py-1.5 text-sm"
            >
              <option value="all">All Types</option>
              {types.map((t) => (
                <option key={t} value={t}>
                  {t === 'RESERVED_INSTANCE' ? 'Reserved Instance' : t === 'SAVINGS_PLAN' ? 'Savings Plan' : 'CUD'}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {sortedItems.length === 0 ? (
        <div className="p-12 text-center text-muted-foreground">
          <p className="text-lg font-medium">No commitments found</p>
          <p className="mt-1 text-sm">
            Connect your cloud account to discover active Reserved Instances, Savings Plans, and CUDs.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                {[
                  { field: 'provider' as SortField, label: 'Provider' },
                  { field: 'commitmentType' as SortField, label: 'Type' },
                  { field: null, label: 'Name' },
                  { field: null, label: 'Service' },
                  { field: null, label: 'Term' },
                  { field: 'hourlyCommitment' as SortField, label: 'Hourly Cost' },
                  { field: 'status' as SortField, label: 'Status' },
                  { field: 'endDate' as SortField, label: 'Expiration' },
                ].map((col) => (
                  <th
                    key={col.label}
                    className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground ${col.field ? 'cursor-pointer hover:text-foreground' : ''}`}
                    onClick={col.field ? () => handleSort(col.field!) : undefined}
                  >
                    {col.label}
                    {col.field && sortField === col.field && (
                      <span className="ml-1">{sortAsc ? '↑' : '↓'}</span>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {sortedItems.map((item) => (
                <tr key={item.commitmentId} className="hover:bg-muted/30">
                  <td className="px-4 py-3 text-sm font-medium">{item.provider}</td>
                  <td className="px-4 py-3 text-sm">
                    {item.commitmentType === 'RESERVED_INSTANCE'
                      ? 'RI'
                      : item.commitmentType === 'SAVINGS_PLAN'
                        ? 'SP'
                        : 'CUD'}
                  </td>
                  <td className="max-w-[200px] truncate px-4 py-3 text-sm" title={item.commitmentName}>
                    {item.commitmentName}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {item.serviceType}
                    {item.instanceFamily && ` (${item.instanceFamily})`}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {item.term} / {item.paymentOption}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium">
                    {format(item.hourlyCommitment)}/hr
                  </td>
                  <td className="px-4 py-3">{statusBadge(item.status)}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col">
                      <span className="text-sm">
                        {item.endDate.toLocaleDateString()}
                      </span>
                      {expirationBadge(item.endDate)}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
