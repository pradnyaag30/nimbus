'use client';

import { BarChart3, Tags, AlertCircle } from 'lucide-react';
import type { TagExplorerData } from '@/lib/cloud/tags/types';

interface TagExplorerProps {
  data: TagExplorerData;
}

function getCoverageColor(percent: number): string {
  if (percent >= 80) return 'bg-green-500';
  if (percent >= 60) return 'bg-blue-500';
  if (percent >= 40) return 'bg-yellow-500';
  return 'bg-red-500';
}

function getCoverageBadge(percent: number): string {
  if (percent >= 80) return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
  if (percent >= 60) return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
  if (percent >= 40) return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
  return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
}

export function TagExplorer({ data }: TagExplorerProps) {
  const { totalResources, tagUsage, unmappedTags } = data;

  // Sort by coverage descending
  const sortedUsage = [...tagUsage].sort((a, b) => b.coveragePercent - a.coveragePercent);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border bg-card p-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Total Resources</p>
            <Tags className="h-4 w-4 text-primary" />
          </div>
          <p className="mt-1 text-3xl font-bold">{totalResources}</p>
        </div>
        <div className="rounded-xl border bg-card p-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Unique Tag Keys</p>
            <BarChart3 className="h-4 w-4 text-blue-500" />
          </div>
          <p className="mt-1 text-3xl font-bold">{tagUsage.length}</p>
        </div>
        <div className="rounded-xl border bg-card p-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Unmapped Tags</p>
            <AlertCircle className="h-4 w-4 text-amber-500" />
          </div>
          <p className="mt-1 text-3xl font-bold text-amber-600 dark:text-amber-400">{unmappedTags.length}</p>
        </div>
      </div>

      {/* Unmapped Tags Alert */}
      {unmappedTags.length > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/20">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
              {unmappedTags.length} tag{unmappedTags.length !== 1 ? 's' : ''} not mapped to business dimensions
            </p>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {unmappedTags.map((tag) => (
              <span key={tag} className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Tag Usage Chart */}
      <div className="rounded-xl border bg-card shadow-sm">
        <div className="p-6 pb-3">
          <h3 className="font-semibold">Tag Coverage by Key</h3>
          <p className="text-sm text-muted-foreground">
            Resource coverage percentage for each tag key across your cloud estate.
          </p>
        </div>
        <div className="space-y-3 p-6 pt-2">
          {sortedUsage.map((tag) => (
            <div key={tag.tagKey} className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-medium">{tag.tagKey}</span>
                  <span className="text-xs text-muted-foreground">
                    {tag.resourceCount} of {totalResources} resources
                  </span>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${getCoverageBadge(tag.coveragePercent)}`}>
                  {tag.coveragePercent.toFixed(1)}%
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${getCoverageColor(tag.coveragePercent)}`}
                  style={{ width: `${Math.max(tag.coveragePercent, 1)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top Values per Tag */}
      <div className="rounded-xl border bg-card shadow-sm">
        <div className="p-6 pb-3">
          <h3 className="font-semibold">Tag Value Distribution</h3>
          <p className="text-sm text-muted-foreground">
            Most common values for each tag key.
          </p>
        </div>
        <div className="grid gap-4 p-6 pt-2 sm:grid-cols-2 lg:grid-cols-3">
          {sortedUsage.slice(0, 6).map((tag) => (
            <div key={tag.tagKey} className="rounded-lg border p-4">
              <p className="font-mono text-xs font-semibold">{tag.tagKey}</p>
              <div className="mt-3 space-y-2">
                {tag.topValues.slice(0, 4).map((v) => {
                  const pct = tag.resourceCount > 0 ? (v.count / tag.resourceCount) * 100 : 0;
                  return (
                    <div key={v.value} className="flex items-center gap-2 text-xs">
                      <div className="h-1.5 flex-1 rounded-full bg-muted overflow-hidden">
                        <div className="h-full rounded-full bg-primary/60" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="w-20 truncate text-muted-foreground" title={v.value}>{v.value}</span>
                      <span className="w-8 text-right font-medium">{v.count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
