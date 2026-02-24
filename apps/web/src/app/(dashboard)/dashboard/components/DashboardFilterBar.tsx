'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useCallback } from 'react';
import { Cloud, Filter } from 'lucide-react';

const PROVIDERS = [
  { value: 'all', label: 'All Providers' },
  { value: 'AWS', label: 'AWS', connected: true },
  { value: 'AZURE', label: 'Azure', connected: false },
  { value: 'GCP', label: 'GCP', connected: false },
] as const;

interface DashboardFilterBarProps {
  accountId: string;
}

export function DashboardFilterBar({ accountId }: DashboardFilterBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentProvider = searchParams.get('provider') || 'all';

  const setProvider = useCallback(
    (provider: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (provider === 'all') {
        params.delete('provider');
      } else {
        params.set('provider', provider);
      }
      const qs = params.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname);
    },
    [router, pathname, searchParams],
  );

  return (
    <div className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3 shadow-sm">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Filter className="h-4 w-4" />
        <span className="font-medium">Filters</span>
      </div>

      <div className="h-5 w-px bg-border" />

      {/* Provider Toggle */}
      <div className="flex items-center gap-1">
        {PROVIDERS.map((p) => {
          const isActive = currentProvider === p.value;
          const isDisabled = 'connected' in p && !p.connected;

          return (
            <button
              key={p.value}
              onClick={() => !isDisabled && setProvider(p.value)}
              disabled={isDisabled}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                isActive
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : isDisabled
                    ? 'cursor-not-allowed text-muted-foreground/40'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              {p.value !== 'all' && (
                <Cloud className="h-3 w-3" />
              )}
              {p.label}
              {isDisabled && (
                <span className="ml-0.5 text-[10px] opacity-60">(soon)</span>
              )}
            </button>
          );
        })}
      </div>

      <div className="h-5 w-px bg-border" />

      {/* Account Info */}
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <span>Account:</span>
        <span className="rounded-md bg-muted px-2 py-0.5 font-mono text-[11px] font-medium text-foreground">
          {accountId === 'not-connected' ? 'Not connected' : accountId}
        </span>
      </div>
    </div>
  );
}
