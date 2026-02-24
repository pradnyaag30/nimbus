'use client';

import { Calendar } from 'lucide-react';

const PRESETS = [
  { value: '7d', label: '7D' },
  { value: '30d', label: '30D' },
  { value: '90d', label: '90D' },
  { value: '6m', label: '6M' },
  { value: '12m', label: '12M' },
] as const;

interface DateRangePickerProps {
  preset: string;
  startDate?: string;
  endDate?: string;
  onChange: (preset: string, start?: string, end?: string) => void;
}

export function DateRangePicker({
  preset,
  startDate,
  endDate,
  onChange,
}: DateRangePickerProps) {
  const isCustom = preset === 'custom';

  return (
    <div className="flex items-center gap-2">
      <div className="inline-flex items-center rounded-lg border bg-muted/50 p-0.5">
        {PRESETS.map((p) => (
          <button
            key={p.value}
            type="button"
            onClick={() => onChange(p.value)}
            className={`rounded-md px-2.5 py-1.5 text-xs font-medium transition-all ${
              preset === p.value
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {p.label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => onChange('custom', startDate, endDate)}
          className={`flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium transition-all ${
            isCustom
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Calendar className="h-3 w-3" />
          Custom
        </button>
      </div>

      {isCustom && (
        <div className="flex items-center gap-1.5">
          <input
            type="date"
            value={startDate || ''}
            onChange={(e) => onChange('custom', e.target.value, endDate)}
            className="h-8 rounded-md border bg-background px-2 text-xs"
          />
          <span className="text-xs text-muted-foreground">to</span>
          <input
            type="date"
            value={endDate || ''}
            onChange={(e) => onChange('custom', startDate, e.target.value)}
            className="h-8 rounded-md border bg-background px-2 text-xs"
          />
        </div>
      )}
    </div>
  );
}
