import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { type CostSummary, buildCostContextPrompt } from '@/lib/ai/cost-context';
import { generateLocalResponse } from '@/lib/ai/local-engine';
import { getDashboardData } from '@/lib/cloud/fetchDashboardData';
import {
  checkCurAvailability,
  getResourceCostBreakdown,
  getHourlyCostSpike,
  getTagCostAllocation,
  getUntaggedResourceCosts,
  getCostsByResourceId,
} from '@/lib/cloud/aws-cur';
import { z } from 'zod';

const requestSchema = z.object({
  message: z.string().min(1).max(1000),
  history: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string(),
      }),
    )
    .max(20)
    .optional(),
});

// --- CUR Question Detection --------------------------------------------------

interface CurQueryIntent {
  shouldFetchTopResources: boolean;
  shouldFetchHourlyCosts: boolean;
  shouldFetchTagAllocation: boolean;
  shouldFetchUntaggedCosts: boolean;
  shouldFetchResourceDetail: boolean;
  dateHint?: string;
  tagKeyHint?: string;
  resourceIdHint?: string;
}

/**
 * Detect if a user's question would benefit from CUR (resource-level) data.
 * Returns which CUR queries to run based on question patterns.
 */
function detectCurIntent(message: string): CurQueryIntent {
  const lower = message.toLowerCase();

  const intent: CurQueryIntent = {
    shouldFetchTopResources: false,
    shouldFetchHourlyCosts: false,
    shouldFetchTagAllocation: false,
    shouldFetchUntaggedCosts: false,
    shouldFetchResourceDetail: false,
  };

  // Resource-level questions
  if (
    lower.includes('which resource') ||
    lower.includes('top resource') ||
    lower.includes('most expensive resource') ||
    lower.includes('resource cost') ||
    lower.includes('resource breakdown') ||
    lower.includes('resource level') ||
    lower.includes('biggest spender')
  ) {
    intent.shouldFetchTopResources = true;
  }

  // Spike / time-based questions
  if (
    lower.includes('spike') ||
    lower.includes('why did cost') ||
    lower.includes('what happened on') ||
    lower.includes('cost increase on') ||
    lower.includes('hourly') ||
    lower.includes('when did')
  ) {
    intent.shouldFetchHourlyCosts = true;
    intent.shouldFetchTopResources = true;

    // Try to extract a date (YYYY-MM-DD pattern)
    const dateMatch = message.match(/(\d{4}-\d{2}-\d{2})/);
    if (dateMatch) {
      intent.dateHint = dateMatch[1];
    } else {
      // Check for relative date references
      const today = new Date();
      if (lower.includes('yesterday')) {
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        intent.dateHint = yesterday.toISOString().split('T')[0];
      } else if (lower.includes('today')) {
        intent.dateHint = today.toISOString().split('T')[0];
      }
      // Default: use yesterday for spike queries without a date
      if (!intent.dateHint) {
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        intent.dateHint = yesterday.toISOString().split('T')[0];
      }
    }
  }

  // Tag / team / project / department questions
  if (
    lower.includes('team') ||
    lower.includes('project') ||
    lower.includes('department') ||
    lower.includes('cost center') ||
    lower.includes('costcenter') ||
    lower.includes('chargeback') ||
    lower.includes('allocation') ||
    lower.includes('by tag')
  ) {
    intent.shouldFetchTagAllocation = true;

    // Detect which tag key
    if (lower.includes('team')) intent.tagKeyHint = 'Team';
    else if (lower.includes('project')) intent.tagKeyHint = 'Project';
    else if (lower.includes('cost center') || lower.includes('costcenter'))
      intent.tagKeyHint = 'CostCenter';
    else if (lower.includes('department')) intent.tagKeyHint = 'CostCenter';
    else if (lower.includes('owner')) intent.tagKeyHint = 'Owner';
    else intent.tagKeyHint = 'Team'; // default
  }

  // Untagged resource questions
  if (
    lower.includes('untag') ||
    lower.includes('missing tag') ||
    lower.includes('tag compliance') ||
    lower.includes('untagged cost')
  ) {
    intent.shouldFetchUntaggedCosts = true;
  }

  // Specific resource ID lookup
  const arnMatch = message.match(/(arn:aws:[a-z0-9-]+:[a-z0-9-]*:\d{12}:[^\s]+)/i);
  const instanceMatch = message.match(/(i-[0-9a-f]{8,17})/i);
  if (arnMatch) {
    intent.shouldFetchResourceDetail = true;
    intent.resourceIdHint = arnMatch[1];
  } else if (instanceMatch) {
    intent.shouldFetchResourceDetail = true;
    intent.resourceIdHint = instanceMatch[1];
  }

  return intent;
}

// --- CUR Data Fetcher --------------------------------------------------------

async function fetchCurDataForChat(
  intent: CurQueryIntent,
): Promise<CostSummary['curData']> {
  const curData: CostSummary['curData'] = {};

  const today = new Date();
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const startDate = monthStart.toISOString().split('T')[0];
  const endDate = today.toISOString().split('T')[0];

  const promises: Promise<void>[] = [];

  if (intent.shouldFetchTopResources) {
    promises.push(
      getResourceCostBreakdown(startDate, endDate)
        .then((r) => { curData.topResources = r.rows as CostSummary['curData'] extends undefined ? never : NonNullable<CostSummary['curData']>['topResources']; })
        .catch(() => { /* CUR not available, skip */ }),
    );
  }

  if (intent.shouldFetchHourlyCosts && intent.dateHint) {
    promises.push(
      getHourlyCostSpike(intent.dateHint)
        .then((r) => { curData.hourlyCosts = r.rows as CostSummary['curData'] extends undefined ? never : NonNullable<CostSummary['curData']>['hourlyCosts']; })
        .catch(() => { /* CUR not available, skip */ }),
    );
  }

  if (intent.shouldFetchTagAllocation && intent.tagKeyHint) {
    promises.push(
      getTagCostAllocation(intent.tagKeyHint, startDate, endDate)
        .then((r) => { curData.tagAllocation = r.rows as CostSummary['curData'] extends undefined ? never : NonNullable<CostSummary['curData']>['tagAllocation']; })
        .catch(() => { /* CUR not available, skip */ }),
    );
  }

  if (intent.shouldFetchUntaggedCosts) {
    promises.push(
      getUntaggedResourceCosts(startDate, endDate)
        .then((r) => { curData.untaggedCosts = r.rows as CostSummary['curData'] extends undefined ? never : NonNullable<CostSummary['curData']>['untaggedCosts']; })
        .catch(() => { /* CUR not available, skip */ }),
    );
  }

  if (intent.shouldFetchResourceDetail && intent.resourceIdHint) {
    promises.push(
      getCostsByResourceId(intent.resourceIdHint, startDate, endDate)
        .then((r) => { curData.resourceDetail = r.rows as CostSummary['curData'] extends undefined ? never : NonNullable<CostSummary['curData']>['resourceDetail']; })
        .catch(() => { /* CUR not available, skip */ }),
    );
  }

  await Promise.allSettled(promises);
  return curData;
}

/** Build a CostSummary from live AWS dashboard data — uses real Phase 2-3 data */
async function buildLiveCostSummary(): Promise<CostSummary> {
  const data = await getDashboardData();

  const services = data.topServices;
  const totalMTD = data.totalSpendMTD;

  // Use REAL CE rightsizing + RI + SP + optimizer for recommendations
  const ceRightsizingSavings = data.ceRightsizing.reduce((s, r) => s + r.estimatedMonthlySavings, 0);
  const riSavings = data.riRecommendations.reduce((s, r) => s + r.estimatedMonthlySavings, 0);
  const spSavings = data.spRecommendations.reduce((s, r) => s + r.estimatedMonthlySavings, 0);

  const recommendations = [
    { category: 'CE Rightsizing', count: data.ceRightsizing.length, savings: ceRightsizingSavings },
    { category: 'Reserved Instances', count: data.riRecommendations.length, savings: riSavings },
    { category: 'Savings Plans', count: data.spRecommendations.length, savings: spSavings },
    { category: 'Compute Optimizer', count: data.optimizerByType.reduce((s, t) => s + t.count, 0), savings: data.optimizerSavings },
    { category: 'Trusted Advisor', count: data.trustedAdvisor?.checks.filter((c) => c.status !== 'ok').length ?? 0, savings: data.trustedAdvisor?.totalEstimatedSavings ?? 0 },
  ].filter((r) => r.count > 0 || r.savings > 0);

  // Use REAL native anomalies + service spikes
  const nativeAnoms = (data.nativeAnomalies?.anomalies ?? []).map((a) => ({
    title: `${a.rootCauses[0]?.service || a.dimensionValue} anomaly`,
    provider: 'AWS',
    service: a.rootCauses[0]?.service || a.dimensionValue,
    impact: a.impact.totalImpact,
    status: 'open',
  }));
  const serviceSpikes = services
    .filter((s) => s.change > 30)
    .map((s) => ({
      title: `${s.name} cost spike (${s.change.toFixed(0)}% MoM)`,
      provider: s.provider,
      service: s.name,
      impact: s.cost * (s.change / 100),
      status: 'open',
    }));
  const anomalies = [...nativeAnoms, ...serviceSpikes];

  // Use REAL AWS Budgets
  const budgets = (data.awsBudgets?.budgets ?? []).map((b) => ({
    name: b.budgetName,
    limit: b.limitAmount,
    spent: b.currentSpend,
    provider: 'AWS',
  }));
  // Fallback if no real budgets
  if (budgets.length === 0 && data.forecastedSpend > 0) {
    budgets.push({ name: 'AWS Monthly (estimated)', limit: data.forecastedSpend * 1.1, spent: totalMTD, provider: 'AWS' });
  }

  const totalSavings = recommendations.reduce((s, r) => s + r.savings, 0);

  return {
    totalSpendMTD: totalMTD,
    forecastedSpend: data.forecastedSpend,
    savingsIdentified: totalSavings,
    activeAnomalies: data.nativeAnomalies?.activeAnomalies ?? anomalies.length,
    providers: [
      { name: 'AWS', spend: totalMTD, change: data.changePercentage },
    ],
    topServices: services,
    budgets,
    recommendations,
    anomalies,
    // Pass through all Phase 2-3 data for expanded prompt
    previousMonthTotal: data.previousMonthTotal,
    changePercentage: data.changePercentage,
    ceRightsizing: data.ceRightsizing,
    riRecommendations: data.riRecommendations,
    spRecommendations: data.spRecommendations,
    commitment: data.commitment,
    dataTransfer: data.dataTransfer,
    trustedAdvisor: data.trustedAdvisor,
    awsBudgets: data.awsBudgets,
    tagCompliance: data.tagCompliance,
    nativeAnomalies: data.nativeAnomalies,
    optimizerSavings: data.optimizerSavings,
    optimizerByType: data.optimizerByType,
  };
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Sign in required' } }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: 'INVALID_INPUT', message: 'Invalid request body' } },
      { status: 400 },
    );
  }

  const { message } = parsed.data;

  // Get live cost data (cached, so no extra API calls)
  const costData = await buildLiveCostSummary();

  // Detect if the user's question needs CUR (resource-level) data
  const curIntent = detectCurIntent(message);
  const needsCur =
    curIntent.shouldFetchTopResources ||
    curIntent.shouldFetchHourlyCosts ||
    curIntent.shouldFetchTagAllocation ||
    curIntent.shouldFetchUntaggedCosts ||
    curIntent.shouldFetchResourceDetail;

  if (needsCur) {
    // Check CUR availability first (cached check)
    const curStatus = await checkCurAvailability().catch(() => ({ available: false }));
    costData.curAvailable = curStatus.available;

    if (curStatus.available) {
      // Fetch relevant CUR data based on question intent
      try {
        costData.curData = await fetchCurDataForChat(curIntent);
      } catch {
        console.warn('[Chat] CUR data fetch failed, continuing without resource-level data');
      }
    }
  }

  // If an AI API key is configured, use external LLM
  const aiApiKey = process.env.ANTHROPIC_API_KEY || process.env.OPENAI_API_KEY;

  if (aiApiKey && process.env.ANTHROPIC_API_KEY) {
    try {
      const systemPrompt = buildCostContextPrompt(costData);
      const messages = [
        ...(parsed.data.history || []).map((m) => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        })),
        { role: 'user' as const, content: message },
      ];

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-5-20250929',
          max_tokens: 2048,
          system: systemPrompt,
          messages,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        return NextResponse.json({
          message: data.content[0].text,
          source: 'ai',
          curDataIncluded: needsCur && costData.curAvailable,
        });
      }
    } catch {
      // Fall through to local engine
    }
  }

  // Local smart engine (no API key needed)
  const reply = generateLocalResponse(message, costData);
  return NextResponse.json({
    message: reply,
    source: 'local',
    curDataIncluded: needsCur && costData.curAvailable,
  });
}
