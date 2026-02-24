'use client';

import { useState } from 'react';
import { ChevronRight } from 'lucide-react';

interface Resource {
  arn: string;
  resourceType: string;
  service: string;
  region: string;
}

interface ServiceInventoryRowProps {
  service: string;
  count: number;
  maxCount: number;
  regions: string[];
  resources: Resource[];
}

function truncateArn(arn: string): string {
  const parts = arn.split('/');
  if (parts.length > 1) return parts[parts.length - 1];
  const colonParts = arn.split(':');
  return colonParts[colonParts.length - 1] || arn;
}

export function ServiceInventoryRow({
  service,
  count,
  maxCount,
  regions,
  resources,
}: ServiceInventoryRowProps) {
  const [expanded, setExpanded] = useState(false);
  const barWidth = maxCount > 0 ? (count / maxCount) * 100 : 0;

  return (
    <>
      <tr
        className="border-b cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <td className="px-6 py-3">
          <div className="flex items-center gap-2">
            <ChevronRight
              className={`h-4 w-4 text-muted-foreground transition-transform ${expanded ? 'rotate-90' : ''}`}
            />
            <span className="font-medium">{service}</span>
          </div>
        </td>
        <td className="px-6 py-3">
          <span className="inline-flex h-6 min-w-[40px] items-center justify-center rounded-full bg-primary/10 px-2 text-xs font-bold text-primary">
            {count}
          </span>
        </td>
        <td className="px-6 py-3">
          <div className="flex flex-wrap gap-1">
            {regions.slice(0, 3).map((r) => (
              <span key={r} className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                {r}
              </span>
            ))}
            {regions.length > 3 && (
              <span className="text-[10px] text-muted-foreground">+{regions.length - 3}</span>
            )}
          </div>
        </td>
        <td className="px-6 py-3 min-w-[120px]">
          <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${Math.max(barWidth, 2)}%` }}
            />
          </div>
        </td>
      </tr>
      {expanded && resources.length > 0 && (
        <tr>
          <td colSpan={4} className="bg-muted/30 px-6 py-0">
            <div className="py-3">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-left text-muted-foreground">
                    <th className="pb-2 font-medium">Resource Type</th>
                    <th className="pb-2 font-medium">Resource ID</th>
                    <th className="pb-2 font-medium">Region</th>
                  </tr>
                </thead>
                <tbody>
                  {resources.slice(0, 50).map((r, i) => (
                    <tr key={i} className="border-t border-border/50">
                      <td className="py-1.5 font-mono text-[11px]">{r.resourceType}</td>
                      <td className="py-1.5 font-mono text-[11px] text-muted-foreground">{truncateArn(r.arn)}</td>
                      <td className="py-1.5">
                        <span className="rounded bg-muted px-1.5 py-0.5 text-[10px]">{r.region}</span>
                      </td>
                    </tr>
                  ))}
                  {resources.length > 50 && (
                    <tr>
                      <td colSpan={3} className="pt-2 text-center text-[11px] text-muted-foreground">
                        Showing 50 of {resources.length} resources
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
