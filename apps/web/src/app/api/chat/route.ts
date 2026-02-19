import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { type CostSummary, buildCostContextPrompt } from '@/lib/ai/cost-context';
import { generateLocalResponse } from '@/lib/ai/local-engine';
import { getDashboardData } from '@/lib/cloud/fetchDashboardData';
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
  });
}
