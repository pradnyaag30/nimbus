'use client';

import { useState, useCallback } from 'react';
import { Filter, ChevronDown, RotateCcw, Loader2 } from 'lucide-react';
import { GranularityToggle } from '@/components/filters/GranularityToggle';
import { DateRangePicker } from '@/components/filters/DateRangePicker';
import { MultiSelectCombobox } from '@/components/filters/MultiSelectCombobox';
import type { CostExplorerFilters } from '../actions';

interface CostExplorerFilterBarProps {
  availableServices: string[];
  availableRegions: string[];
  onFiltersChange: (filters: CostExplorerFilters) => void;
  isLoading?: boolean;
}

const DEFAULT_FILTERS: CostExplorerFilters = {
  granularity: 'MONTHLY',
  datePreset: '12m',
  services: [],
  regions: [],
  providers: [],
  accounts: [],
  chargeTypes: [],
};

const CHARGE_TYPE_OPTIONS = [
  { value: 'Usage', label: 'On-Demand / Usage' },
  { value: 'SavingsPlanCoveredUsage', label: 'Savings Plan' },
  { value: 'DiscountedUsage', label: 'Reserved Instance' },
  { value: 'SavingsPlanNegation', label: 'SP Negation' },
];

export function CostExplorerFilterBar({
  availableServices,
  availableRegions,
  onFiltersChange,
  isLoading = false,
}: CostExplorerFilterBarProps) {
  const [filters, setFilters] = useState<CostExplorerFilters>(DEFAULT_FILTERS);
  const [moreOpen, setMoreOpen] = useState(false);

  const serviceOptions = availableServices.map((s) => ({ value: s, label: s }));
  const regionOptions = availableRegions.map((r) => ({ value: r, label: r }));

  const update = useCallback(
    (patch: Partial<CostExplorerFilters>) => {
      setFilters((prev) => {
        const next = { ...prev, ...patch };
        // Auto-cap DAILY to 14 days
        if (next.granularity === 'DAILY' && !['7d', 'custom'].includes(next.datePreset)) {
          next.datePreset = '7d';
        }
        return next;
      });
    },
    [],
  );

  const apply = () => onFiltersChange(filters);
  const reset = () => {
    setFilters(DEFAULT_FILTERS);
    onFiltersChange(DEFAULT_FILTERS);
  };

  const hasActiveFilters =
    filters.services.length > 0 ||
    filters.regions.length > 0 ||
    filters.chargeTypes.length > 0 ||
    filters.granularity !== 'MONTHLY' ||
    filters.datePreset !== '12m';

  return (
    <div className="space-y-3 rounded-xl border bg-card p-4 shadow-sm">
      {/* Primary row */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Filter className="h-4 w-4" />
          <span className="text-xs font-semibold uppercase tracking-wider">Filters</span>
        </div>

        <div className="h-5 w-px bg-border" />

        <GranularityToggle
          value={filters.granularity}
          onChange={(g) => update({ granularity: g })}
        />

        <div className="h-5 w-px bg-border" />

        <DateRangePicker
          preset={filters.datePreset}
          startDate={filters.startDate}
          endDate={filters.endDate}
          onChange={(preset, start, end) =>
            update({ datePreset: preset, startDate: start, endDate: end })
          }
        />
      </div>

      {/* Filter dropdowns row */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-[180px]">
          <MultiSelectCombobox
            options={serviceOptions}
            selected={filters.services}
            onChange={(v) => update({ services: v })}
            placeholder="All Services"
            label="Service"
          />
        </div>

        <div className="min-w-[160px]">
          <MultiSelectCombobox
            options={regionOptions}
            selected={filters.regions}
            onChange={(v) => update({ regions: v })}
            placeholder="All Regions"
            label="Region"
          />
        </div>

        {/* More filters toggle */}
        <button
          type="button"
          onClick={() => setMoreOpen(!moreOpen)}
          className="flex h-9 items-center gap-1.5 rounded-lg border px-3 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted"
        >
          More
          <ChevronDown className={`h-3 w-3 transition-transform ${moreOpen ? 'rotate-180' : ''}`} />
        </button>

        <div className="ml-auto flex items-center gap-2">
          {hasActiveFilters && (
            <button
              type="button"
              onClick={reset}
              className="flex h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted"
            >
              <RotateCcw className="h-3 w-3" />
              Reset
            </button>
          )}
          <button
            type="button"
            onClick={apply}
            disabled={isLoading}
            className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-xs font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 disabled:opacity-60"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin" />
                Loading...
              </>
            ) : (
              'Apply Filters'
            )}
          </button>
        </div>
      </div>

      {/* Extended filters */}
      {moreOpen && (
        <div className="flex flex-wrap items-end gap-3 border-t pt-3">
          <div className="min-w-[180px]">
            <MultiSelectCombobox
              options={CHARGE_TYPE_OPTIONS}
              selected={filters.chargeTypes}
              onChange={(v) => update({ chargeTypes: v })}
              placeholder="All Charge Types"
              label="Charge Type"
            />
          </div>
        </div>
      )}
    </div>
  );
}
