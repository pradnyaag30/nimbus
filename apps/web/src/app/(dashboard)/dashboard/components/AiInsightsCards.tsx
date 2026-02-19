'use client';

import { useEffect, useState } from 'react';
import {
  Server,
  TrendingUp,
  CreditCard,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  type LucideIcon,
} from 'lucide-react';
import Link from 'next/link';
import { useCurrency } from '@/components/providers/CurrencyProvider';

// --- Types -------------------------------------------------------------------

interface AiInsight {
  id: string;
  title: string;
  description: string;
  category: 'idle-resources' | 'cost-spike' | 'unused-commitments' | 'anomaly';
  severity: 'info' | 'warning' | 'critical';
  estimatedSavings: number;
  recommendation: string;
}

// --- Category config ---------------------------------------------------------

const categoryConfig: Record<
  AiInsight['category'],
  { icon: LucideIcon; colors: string; iconBg: string; label: string; href: string }
> = {
  'idle-resources': {
    icon: Server,
    colors: 'text-orange-600 dark:text-orange-400',
    iconBg: 'bg-orange-50 dark:bg-orange-900/20',
    label: 'Idle Resources',
    href: '/dashboard/recommendations',
  },
  'cost-spike': {
    icon: TrendingUp,
    colors: 'text-red-600 dark:text-red-400',
    iconBg: 'bg-red-50 dark:bg-red-900/20',
    label: 'Cost Spike',
    href: '/dashboard/anomalies',
  },
  'unused-commitments': {
    icon: CreditCard,
    colors: 'text-purple-600 dark:text-purple-400',
    iconBg: 'bg-purple-50 dark:bg-purple-900/20',
    label: 'Commitments',
    href: '/dashboard/recommendations',
  },
  anomaly: {
    icon: AlertTriangle,
    colors: 'text-yellow-600 dark:text-yellow-400',
    iconBg: 'bg-yellow-50 dark:bg-yellow-900/20',
    label: 'Anomaly',
    href: '/dashboard/anomalies',
  },
};

const severityBadge: Record<AiInsight['severity'], string> = {
  info: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  warning:
    'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  critical:
    'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

// --- Skeleton ----------------------------------------------------------------

function InsightSkeleton() {
  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm animate-pulse">
      <div className="flex items-start gap-3">
        <div className="h-9 w-9 rounded-lg bg-muted" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-3/4 rounded bg-muted" />
          <div className="h-3 w-full rounded bg-muted" />
          <div className="h-3 w-2/3 rounded bg-muted" />
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between">
        <div className="h-5 w-20 rounded bg-muted" />
        <div className="h-4 w-16 rounded-full bg-muted" />
      </div>
    </div>
  );
}

// --- Single Insight Card -----------------------------------------------------

function InsightCard({ insight }: { insight: AiInsight }) {
  const { format } = useCurrency();
  const config = categoryConfig[insight.category];
  const Icon = config.icon;

  return (
    <Link
      href={config.href}
      className="block rounded-xl border bg-card p-5 shadow-sm transition-all hover:shadow-md hover:border-primary/50 cursor-pointer"
    >
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className={`rounded-lg p-2 ${config.iconBg}`}>
          <Icon className={`h-5 w-5 ${config.colors}`} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-semibold leading-tight truncate">
              {insight.title}
            </h4>
          </div>
          <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
            {insight.description}
          </p>
        </div>
      </div>

      {/* Recommendation */}
      <p className="mt-3 text-xs text-muted-foreground/80 italic line-clamp-2">
        {insight.recommendation}
      </p>

      {/* Footer: savings + severity */}
      <div className="mt-3 flex items-center justify-between border-t pt-3">
        {insight.estimatedSavings > 0 ? (
          <span className="text-sm font-bold text-green-600 dark:text-green-400">
            {format(insight.estimatedSavings)}/mo
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">No action needed</span>
        )}
        <span
          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${severityBadge[insight.severity]}`}
        >
          {insight.severity}
        </span>
      </div>

      {/* View Details link */}
      <div className="mt-2 flex items-center justify-end gap-1 text-xs font-medium text-primary">
        View Details <ArrowRight className="h-3 w-3" />
      </div>
    </Link>
  );
}

// --- Main Component ----------------------------------------------------------

export function AiInsightsCards() {
  const [insights, setInsights] = useState<AiInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState<string>('');

  useEffect(() => {
    let cancelled = false;

    async function fetchInsights() {
      try {
        const res = await fetch('/api/insights');
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        if (!cancelled) {
          setInsights(data.insights || []);
          setSource(data.source || '');
        }
      } catch {
        // Silently fail — dashboard works without insights
        if (!cancelled) setInsights([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchInsights();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div>
      {/* Section header */}
      <div className="mb-4 flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-primary" />
        <div>
          <h2 className="text-lg font-semibold">AI-Powered Insights</h2>
          <p className="text-xs text-muted-foreground">
            {source === 'ai'
              ? 'Powered by Nimbus AI'
              : source === 'cached'
                ? 'Powered by Nimbus AI (cached)'
                : 'Powered by Nimbus analytics'}
          </p>
        </div>
      </div>

      {/* Cards grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {loading ? (
          <>
            <InsightSkeleton />
            <InsightSkeleton />
            <InsightSkeleton />
            <InsightSkeleton />
          </>
        ) : insights.length > 0 ? (
          insights.map((insight) => (
            <InsightCard key={insight.id} insight={insight} />
          ))
        ) : (
          <div className="col-span-full rounded-xl border bg-card p-8 text-center shadow-sm">
            <Sparkles className="mx-auto h-8 w-8 text-muted-foreground/30" />
            <p className="mt-3 text-sm text-muted-foreground">
              AI insights will appear once cost data is available.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
