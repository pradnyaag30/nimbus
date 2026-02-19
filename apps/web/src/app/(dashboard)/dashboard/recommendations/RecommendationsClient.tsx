'use client';

import { useState } from 'react';
import {
  Lightbulb, Server, Zap, ExternalLink,
  CheckCircle, Clock, AlertTriangle, Cpu, Database, ArrowRight,
} from 'lucide-react';
import { useCurrency } from '@/components/providers/CurrencyProvider';

// --- Types -------------------------------------------------------------------

interface OptimizationRecommendation {
  resourceId: string;
  resourceType: 'EC2' | 'AutoScaling' | 'Lambda' | 'EBS';
  finding: string;
  currentConfig: string;
  recommendedConfig: string;
  estimatedMonthlySavings: number;
  estimatedSavingsPercentage: number;
  risk: 'VeryLow' | 'Low' | 'Medium' | 'High';
  region: string;
}

interface CERightsizingRecommendation {
  instanceId: string;
  instanceType: string;
  action: string;
  targetInstanceType: string;
  estimatedMonthlySavings: number;
}

interface RIPurchaseRecommendation {
  instanceType: string;
  estimatedMonthlySavings: number;
}

interface SPPurchaseRecommendation {
  savingsPlanType: string;
  estimatedMonthlySavings: number;
}

interface RecommendationsClientProps {
  topServices: { name: string; provider: string; cost: number; change: number }[];
  totalSpendMTD: number;
  forecastedSpend: number;
  accountId: string;
  error?: string;
  optimizerRecs: OptimizationRecommendation[];
  optimizerStatus: 'active' | 'collecting' | 'not-enrolled' | 'error';
  optimizerSavings: number;
  optimizerErrorMessage?: string;
  ceRightsizing: CERightsizingRecommendation[];
  riRecommendations: RIPurchaseRecommendation[];
  spRecommendations: SPPurchaseRecommendation[];
}

// --- Styles ------------------------------------------------------------------

const riskStyles: Record<string, string> = {
  VeryLow: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  Low: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  Medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  High: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

const typeIcons: Record<string, typeof Cpu> = {
  EC2: Cpu,
  AutoScaling: Server,
  Lambda: Zap,
  EBS: Database,
};

type TabKey = 'optimizer' | 'rightsizing' | 'ri-sp';

// --- Component ---------------------------------------------------------------

export function RecommendationsClient({
  topServices,
  totalSpendMTD,
  forecastedSpend,
  accountId,
  error,
  optimizerRecs,
  optimizerStatus,
  optimizerSavings,
  optimizerErrorMessage,
  ceRightsizing,
  riRecommendations,
  spRecommendations,
}: RecommendationsClientProps) {
  const { format } = useCurrency();
  const [activeTab, setActiveTab] = useState<TabKey>('optimizer');

  if (error || totalSpendMTD === 0) {
    return (
      <div className="space-y-6 animate-in">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Recommendations</h1>
          <p className="text-sm text-muted-foreground">
            AI-powered optimization recommendations across all cloud providers.
          </p>
        </div>
        <div className="rounded-xl border bg-card p-12 text-center">
          <Lightbulb className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <p className="mt-4 text-muted-foreground">No cost data available for analysis.</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Connect a cloud account to get optimization recommendations.
          </p>
        </div>
      </div>
    );
  }

  const ceSavings = ceRightsizing.reduce((s, r) => s + r.estimatedMonthlySavings, 0);
  const riSavings = riRecommendations.reduce((s, r) => s + r.estimatedMonthlySavings, 0);
  const spSavings = spRecommendations.reduce((s, r) => s + r.estimatedMonthlySavings, 0);
  const totalSavings = optimizerSavings + ceSavings + riSavings + spSavings;

  return (
    <div className="space-y-6 animate-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Recommendations</h1>
        <p className="text-sm text-muted-foreground">
          Cost optimization opportunities — AWS Account {accountId}
        </p>
      </div>

      {/* Summary KPIs */}
      <div className="grid gap-4 sm:grid-cols-4">
        <div className="rounded-xl border bg-card p-6">
          <p className="text-sm text-muted-foreground">Total Estimated Savings</p>
          <p className="mt-1 text-3xl font-bold text-green-600 dark:text-green-400">
            {format(totalSavings)}
            <span className="text-base font-normal text-muted-foreground">/mo</span>
          </p>
        </div>
        <div className="rounded-xl border bg-card p-6">
          <p className="text-sm text-muted-foreground">Compute Optimizer</p>
          <p className="mt-1 text-3xl font-bold text-green-600 dark:text-green-400">
            {format(optimizerSavings)}
            <span className="text-base font-normal text-muted-foreground">/mo</span>
          </p>
        </div>
        <div className="rounded-xl border bg-card p-6">
          <p className="text-sm text-muted-foreground">CE Rightsizing + RI/SP</p>
          <p className="mt-1 text-3xl font-bold text-green-600 dark:text-green-400">
            {format(ceSavings + riSavings + spSavings)}
            <span className="text-base font-normal text-muted-foreground">/mo</span>
          </p>
        </div>
        <div className="rounded-xl border bg-card p-6">
          <p className="text-sm text-muted-foreground">Annualized Savings</p>
          <p className="mt-1 text-3xl font-bold text-green-600 dark:text-green-400">
            {format(totalSavings * 12)}
          </p>
        </div>
      </div>

      {/* Optimizer Status Banner */}
      {optimizerStatus === 'collecting' && (
        <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
          <Clock className="mt-0.5 h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0" />
          <div>
            <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
              Compute Optimizer is collecting data
            </p>
            <p className="mt-1 text-xs text-blue-700 dark:text-blue-300">
              {optimizerErrorMessage || 'Precise rightsizing recommendations will be available after ~14 days of utilization data collection.'}
            </p>
          </div>
        </div>
      )}

      {optimizerStatus === 'not-enrolled' && (
        <div className="flex items-start gap-3 rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-900/20">
          <AlertTriangle className="mt-0.5 h-5 w-5 text-yellow-600 dark:text-yellow-400 shrink-0" />
          <div>
            <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
              Compute Optimizer not enabled
            </p>
            <p className="mt-1 text-xs text-yellow-700 dark:text-yellow-300">
              Enable AWS Compute Optimizer from the AWS Console for free rightsizing recommendations. It analyzes EC2, Lambda, EBS, and Auto Scaling utilization.
            </p>
          </div>
        </div>
      )}

      {optimizerStatus === 'error' && optimizerErrorMessage && (
        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
          <AlertTriangle className="mt-0.5 h-5 w-5 text-red-600 dark:text-red-400 shrink-0" />
          <div>
            <p className="text-sm font-medium text-red-800 dark:text-red-200">
              Compute Optimizer error
            </p>
            <p className="mt-1 text-xs text-red-700 dark:text-red-300">{optimizerErrorMessage}</p>
          </div>
        </div>
      )}

      {/* Tab Switcher — 3 tabs */}
      <div className="flex gap-1 rounded-lg bg-muted p-1">
        <button
          onClick={() => setActiveTab('optimizer')}
          className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'optimizer'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Cpu className="mr-2 inline h-4 w-4" />
          Compute Optimizer ({optimizerRecs.length})
        </button>
        <button
          onClick={() => setActiveTab('rightsizing')}
          className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'rightsizing'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Server className="mr-2 inline h-4 w-4" />
          CE Rightsizing ({ceRightsizing.length})
        </button>
        <button
          onClick={() => setActiveTab('ri-sp')}
          className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'ri-sp'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Zap className="mr-2 inline h-4 w-4" />
          RI & SP ({riRecommendations.length + spRecommendations.length})
        </button>
      </div>

      {/* Compute Optimizer Tab */}
      {activeTab === 'optimizer' && (
        <>
          {optimizerRecs.length === 0 ? (
            <div className="rounded-xl border bg-card p-8 text-center">
              {optimizerStatus === 'active' ? (
                <>
                  <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
                  <p className="mt-4 font-semibold text-green-700 dark:text-green-300">All Optimized</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    AWS Compute Optimizer found no rightsizing opportunities. All resources are properly sized.
                  </p>
                </>
              ) : (
                <>
                  <Clock className="mx-auto h-12 w-12 text-muted-foreground/50" />
                  <p className="mt-4 font-semibold">Awaiting Data</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Compute Optimizer recommendations will appear here once enough utilization data is collected.
                  </p>
                </>
              )}
            </div>
          ) : (
            <div className="rounded-xl border bg-card shadow-sm">
              <div className="p-6 pb-3">
                <h3 className="font-semibold">Rightsizing Recommendations</h3>
                <p className="text-sm text-muted-foreground">
                  From AWS Compute Optimizer — based on real utilization metrics
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-t text-left">
                      <th className="px-6 py-3 font-medium text-muted-foreground">Resource</th>
                      <th className="px-6 py-3 font-medium text-muted-foreground">Type</th>
                      <th className="px-6 py-3 font-medium text-muted-foreground">Finding</th>
                      <th className="px-6 py-3 font-medium text-muted-foreground">Current</th>
                      <th className="px-6 py-3 font-medium text-muted-foreground">Recommended</th>
                      <th className="px-6 py-3 text-right font-medium text-muted-foreground">Savings</th>
                      <th className="px-6 py-3 font-medium text-muted-foreground">Risk</th>
                    </tr>
                  </thead>
                  <tbody>
                    {optimizerRecs.map((rec) => {
                      const Icon = typeIcons[rec.resourceType] || Server;
                      return (
                        <tr key={`${rec.resourceType}-${rec.resourceId}`} className="border-b last:border-0 hover:bg-muted/50">
                          <td className="px-6 py-3">
                            <a
                              href={`https://console.aws.amazon.com/ec2/v2/home?region=${rec.region}#InstanceDetails:instanceId=${rec.resourceId}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 font-mono text-xs text-primary hover:underline"
                            >
                              {rec.resourceId}
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </td>
                          <td className="px-6 py-3">
                            <span className="inline-flex items-center gap-1.5">
                              <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                              {rec.resourceType}
                            </span>
                          </td>
                          <td className="px-6 py-3">
                            <span className="text-xs">{rec.finding}</span>
                          </td>
                          <td className="px-6 py-3">
                            <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{rec.currentConfig}</code>
                          </td>
                          <td className="px-6 py-3">
                            <code className="rounded bg-green-100 dark:bg-green-900/30 px-1.5 py-0.5 text-xs text-green-700 dark:text-green-400">
                              {rec.recommendedConfig}
                            </code>
                          </td>
                          <td className="px-6 py-3 text-right">
                            <span className="font-semibold text-green-600 dark:text-green-400">
                              {format(rec.estimatedMonthlySavings)}/mo
                            </span>
                          </td>
                          <td className="px-6 py-3">
                            <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${riskStyles[rec.risk] || riskStyles.Low}`}>
                              {rec.risk}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* CE Rightsizing Tab */}
      {activeTab === 'rightsizing' && (
        <>
          {ceRightsizing.length === 0 ? (
            <div className="rounded-xl border bg-card p-8 text-center">
              <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
              <p className="mt-4 font-semibold text-green-700 dark:text-green-300">No Rightsizing Recommendations</p>
              <p className="mt-2 text-sm text-muted-foreground">
                AWS Cost Explorer found no rightsizing opportunities at this time.
              </p>
            </div>
          ) : (
            <div className="rounded-xl border bg-card shadow-sm">
              <div className="p-6 pb-3">
                <h3 className="font-semibold">Cost Explorer Rightsizing</h3>
                <p className="text-sm text-muted-foreground">
                  EC2 rightsizing recommendations from AWS Cost Explorer — {format(ceSavings)}/mo potential savings
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-t text-left">
                      <th className="px-6 py-3 font-medium text-muted-foreground">Instance ID</th>
                      <th className="px-6 py-3 font-medium text-muted-foreground">Current Type</th>
                      <th className="px-6 py-3 font-medium text-muted-foreground">Action</th>
                      <th className="px-6 py-3 font-medium text-muted-foreground">Target Type</th>
                      <th className="px-6 py-3 text-right font-medium text-muted-foreground">Est. Savings</th>
                      <th className="px-6 py-3 font-medium text-muted-foreground" />
                    </tr>
                  </thead>
                  <tbody>
                    {ceRightsizing.map((rec) => {
                      const isTerminate = rec.action.toUpperCase() === 'TERMINATE';
                      return (
                        <tr key={rec.instanceId} className="border-b last:border-0 hover:bg-muted/50">
                          <td className="px-6 py-3">
                            <a
                              href={`https://console.aws.amazon.com/ec2/v2/home#InstanceDetails:instanceId=${rec.instanceId}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 font-mono text-xs text-primary hover:underline"
                            >
                              {rec.instanceId}
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </td>
                          <td className="px-6 py-3">
                            <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{rec.instanceType}</code>
                          </td>
                          <td className="px-6 py-3">
                            <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                              isTerminate
                                ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                            }`}>
                              {rec.action}
                            </span>
                          </td>
                          <td className="px-6 py-3">
                            {isTerminate ? (
                              <span className="text-xs text-muted-foreground">—</span>
                            ) : (
                              <code className="rounded bg-green-100 dark:bg-green-900/30 px-1.5 py-0.5 text-xs text-green-700 dark:text-green-400">
                                {rec.targetInstanceType}
                              </code>
                            )}
                          </td>
                          <td className="px-6 py-3 text-right">
                            <span className="font-semibold text-green-600 dark:text-green-400">
                              {format(rec.estimatedMonthlySavings)}/mo
                            </span>
                          </td>
                          <td className="px-6 py-3">
                            <a
                              href={`https://console.aws.amazon.com/ec2/v2/home#InstanceDetails:instanceId=${rec.instanceId}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                            >
                              View in AWS <ArrowRight className="h-3 w-3" />
                            </a>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* RI & SP Tab */}
      {activeTab === 'ri-sp' && (
        <div className="space-y-6">
          {/* Reserved Instance Recommendations */}
          <div className="rounded-xl border bg-card shadow-sm">
            <div className="p-6 pb-3">
              <h3 className="font-semibold">Reserved Instance Recommendations</h3>
              <p className="text-sm text-muted-foreground">
                {riRecommendations.length > 0
                  ? `${riRecommendations.length} RI purchase opportunities — ${format(riSavings)}/mo potential savings`
                  : 'No RI purchase recommendations available'}
              </p>
            </div>
            {riRecommendations.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-t text-left">
                      <th className="px-6 py-3 font-medium text-muted-foreground">Instance Type</th>
                      <th className="px-6 py-3 text-right font-medium text-muted-foreground">Est. Monthly Savings</th>
                      <th className="px-6 py-3 font-medium text-muted-foreground" />
                    </tr>
                  </thead>
                  <tbody>
                    {riRecommendations.map((rec, i) => (
                      <tr key={`ri-${i}`} className="border-b last:border-0 hover:bg-muted/50">
                        <td className="px-6 py-3">
                          <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{rec.instanceType}</code>
                        </td>
                        <td className="px-6 py-3 text-right">
                          <span className="font-semibold text-green-600 dark:text-green-400">
                            {format(rec.estimatedMonthlySavings)}/mo
                          </span>
                        </td>
                        <td className="px-6 py-3">
                          <a
                            href="https://console.aws.amazon.com/ec2/v2/home#ReservedInstances:"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                          >
                            Purchase in AWS <ExternalLink className="h-3 w-3" />
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="px-6 pb-6">
                <p className="text-sm text-muted-foreground">
                  No Reserved Instance recommendations at this time. Your current RI coverage is optimal.
                </p>
              </div>
            )}
          </div>

          {/* Savings Plans Recommendations */}
          <div className="rounded-xl border bg-card shadow-sm">
            <div className="p-6 pb-3">
              <h3 className="font-semibold">Savings Plans Recommendations</h3>
              <p className="text-sm text-muted-foreground">
                {spRecommendations.length > 0
                  ? `${spRecommendations.length} SP purchase opportunities — ${format(spSavings)}/mo potential savings`
                  : 'No Savings Plans recommendations available'}
              </p>
            </div>
            {spRecommendations.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-t text-left">
                      <th className="px-6 py-3 font-medium text-muted-foreground">Savings Plan Type</th>
                      <th className="px-6 py-3 text-right font-medium text-muted-foreground">Est. Monthly Savings</th>
                      <th className="px-6 py-3 font-medium text-muted-foreground" />
                    </tr>
                  </thead>
                  <tbody>
                    {spRecommendations.map((rec, i) => (
                      <tr key={`sp-${i}`} className="border-b last:border-0 hover:bg-muted/50">
                        <td className="px-6 py-3">
                          <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{rec.savingsPlanType}</code>
                        </td>
                        <td className="px-6 py-3 text-right">
                          <span className="font-semibold text-green-600 dark:text-green-400">
                            {format(rec.estimatedMonthlySavings)}/mo
                          </span>
                        </td>
                        <td className="px-6 py-3">
                          <a
                            href="https://console.aws.amazon.com/savingsplans/home#/purchase"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                          >
                            Purchase in AWS <ExternalLink className="h-3 w-3" />
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="px-6 pb-6">
                <p className="text-sm text-muted-foreground">
                  No Savings Plans recommendations at this time. Your current SP coverage is optimal.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Data Sources Info */}
      <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
        <Lightbulb className="mt-0.5 h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0" />
        <div>
          <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
            All recommendations are from real AWS data
          </p>
          <p className="mt-1 text-xs text-blue-700 dark:text-blue-300">
            <strong>Compute Optimizer</strong> — utilization-based rightsizing (EC2, Lambda, EBS, Auto Scaling).{' '}
            <strong>CE Rightsizing</strong> — Cost Explorer recommendations with instance-level detail.{' '}
            <strong>RI & SP</strong> — Reserved Instance and Savings Plans purchase recommendations from AWS.
          </p>
        </div>
      </div>
    </div>
  );
}
