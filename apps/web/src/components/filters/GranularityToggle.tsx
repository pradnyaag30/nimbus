'use client';

import { Info } from 'lucide-react';

interface GranularityToggleProps {
  value: 'DAILY' | 'MONTHLY';
  onChange: (v: 'DAILY' | 'MONTHLY') => void;
}

export function GranularityToggle({ value, onChange }: GranularityToggleProps) {
  return (
    <div className="flex items-center gap-2">
      <div className="inline-flex rounded-lg border bg-muted/50 p-0.5">
        {(['MONTHLY', 'DAILY'] as const).map((g) => (
          <button
            key={g}
            type="button"
            onClick={() => onChange(g)}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
              value === g
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {g === 'MONTHLY' ? 'Monthly' : 'Daily'}
          </button>
        ))}
      </div>
      {value === 'DAILY' && (
        <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <Info className="h-3 w-3" />
          Max 14 days
        </span>
      )}
    </div>
  );
}
