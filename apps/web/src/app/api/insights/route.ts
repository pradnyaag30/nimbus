import { NextResponse } from 'next/server';
import { getDashboardData, type DashboardPayload } from '@/lib/cloud/fetchDashboardData';

// --- Types -------------------------------------------------------------------

export interface AiInsight {
  id: string;
  title: string;
  description: string;
  category: 'idle-resources' | 'cost-spike' | 'unused-commitments' | 'anomaly';
  severity: 'info' | 'warning' | 'critical';
  estimatedSavings: number; // USD
  recommendation: string;
}

// --- In-memory cache (24 h) --------------------------------------------------

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
let cachedInsights: AiInsight[] | null = null;
let cachedAt = 0;

// --- Deterministic local fallback --------------------------------------------

function generateLocalInsights(data: DashboardPayload): AiInsight[] {
  const insights: AiInsight[] = [];

  // 1. Idle / underutilized resources
  const terminateRecs = data.ceRightsizing.filter(
    (r) => r.action.toUpperCase() === 'TERMINATE',
  );
  const terminateSavings = terminateRecs.reduce(
    (s, r) => s + r.estimatedMonthlySavings,
    0,
  );
  const optimizerCount = data.optimizerByType.reduce(
    (s, t) => s + t.count,
    0,
  );

  if (terminateRecs.length > 0 || optimizerCount > 0) {
    insights.push({
      id: 'idle-resources',
      title: `${terminateRecs.length + optimizerCount} Idle Resources Detected`,
      description: `${terminateRecs.length} EC2 instance${terminateRecs.length !== 1 ? 's' : ''} recommended for termination and ${optimizerCount} resources flagged by Compute Optimizer for rightsizing.`,
      category: 'idle-resources',
      severity: terminateSavings > 500 ? 'critical' : 'warning',
      estimatedSavings: terminateSavings + data.optimizerSavings,
      recommendation:
        'Review and terminate idle instances, then rightsize over-provisioned resources to match actual usage.',
    });
  } else {
    insights.push({
      id: 'idle-resources',
      title: 'No Idle Resources Found',
      description:
        'All EC2 instances are actively utilized. Compute Optimizer has no rightsizing recommendations at this time.',
      category: 'idle-resources',
      severity: 'info',
      estimatedSavings: 0,
      recommendation:
        'Continue monitoring — enroll all instance families in Compute Optimizer for ongoing analysis.',
    });
  }

  // 2. Cost spikes
  const spikingServices = data.topServices.filter((s) => s.change > 30);
  const anomalyImpact = data.nativeAnomalies?.totalImpact ?? 0;
  const activeAnomalies = data.nativeAnomalies?.activeAnomalies ?? 0;

  if (spikingServices.length > 0 || activeAnomalies > 0) {
    const topSpike = spikingServices[0];
    insights.push({
      id: 'cost-spike',
      title: `${spikingServices.length} Service${spikingServices.length !== 1 ? 's' : ''} Spiking${activeAnomalies > 0 ? `, ${activeAnomalies} Anomal${activeAnomalies !== 1 ? 'ies' : 'y'}` : ''}`,
      description: topSpike
        ? `${topSpike.name} increased ${topSpike.change.toFixed(0)}% month-over-month ($${topSpike.cost.toFixed(0)} MTD).${activeAnomalies > 0 ? ` AWS detected ${activeAnomalies} cost anomal${activeAnomalies !== 1 ? 'ies' : 'y'} with $${anomalyImpact.toFixed(0)} total impact.` : ''}`
        : `AWS detected ${activeAnomalies} cost anomal${activeAnomalies !== 1 ? 'ies' : 'y'} with $${anomalyImpact.toFixed(0)} total impact.`,
      category: 'cost-spike',
      severity: anomalyImpact > 1000 || spikingServices.some((s) => s.change > 50) ? 'critical' : 'warning',
      estimatedSavings: anomalyImpact,
      recommendation:
        'Investigate spiking services for unexpected usage patterns. Check if new deployments or misconfigurations are driving the increase.',
    });
  } else {
    insights.push({
      id: 'cost-spike',
      title: 'No Cost Spikes Detected',
      description:
        'All services are within normal spending patterns. No anomalies detected by AWS Cost Anomaly Detection.',
      category: 'cost-spike',
      severity: 'info',
      estimatedSavings: 0,
      recommendation:
        'Spending is stable. Continue monitoring for unexpected changes.',
    });
  }

  // 3. Unused commitments
  const spUtilization = data.commitment.savingsPlansUtilizationPercent;
  const spCoverage = data.commitment.savingsPlansCoveragePercent;
  const riSavings = data.riRecommendations.reduce(
    (s, r) => s + r.estimatedMonthlySavings,
    0,
  );
  const spSavings = data.spRecommendations.reduce(
    (s, r) => s + r.estimatedMonthlySavings,
    0,
  );

  if (spUtilization > 0 && spUtilization < 80) {
    insights.push({
      id: 'unused-commitments',
      title: `Savings Plans Utilization at ${spUtilization.toFixed(0)}%`,
      description: `Your Savings Plans are only ${spUtilization.toFixed(0)}% utilized — ${(100 - spUtilization).toFixed(0)}% of committed spend is being wasted. Coverage is at ${spCoverage.toFixed(0)}%.`,
      category: 'unused-commitments',
      severity: spUtilization < 60 ? 'critical' : 'warning',
      estimatedSavings:
        data.commitment.totalCommittedCost * ((100 - spUtilization) / 100),
      recommendation:
        'Review workload distribution to maximize Savings Plans coverage, or consider modifying plan commitments.',
    });
  } else if (riSavings + spSavings > 0) {
    insights.push({
      id: 'unused-commitments',
      title: `$${(riSavings + spSavings).toFixed(0)}/mo in RI/SP Opportunities`,
      description: `${data.riRecommendations.length} Reserved Instance and ${data.spRecommendations.length} Savings Plans purchase recommendations available. Current SP utilization: ${spUtilization > 0 ? spUtilization.toFixed(0) + '%' : 'N/A'}.`,
      category: 'unused-commitments',
      severity: riSavings + spSavings > 1000 ? 'warning' : 'info',
      estimatedSavings: riSavings + spSavings,
      recommendation:
        'Evaluate RI and Savings Plans purchases for stable, predictable workloads to reduce on-demand costs.',
    });
  } else {
    insights.push({
      id: 'unused-commitments',
      title: 'Commitments Well Utilized',
      description:
        spUtilization > 0
          ? `Savings Plans utilization is strong at ${spUtilization.toFixed(0)}%. No additional RI/SP purchase recommendations at this time.`
          : 'No active Savings Plans or Reserved Instance recommendations. Consider purchasing commitments for steady-state workloads.',
      category: 'unused-commitments',
      severity: 'info',
      estimatedSavings: 0,
      recommendation:
        spUtilization > 0
          ? 'Maintain current commitment levels. Review quarterly as workload patterns evolve.'
          : 'Analyze workload stability and consider 1-year Savings Plans for consistent compute usage.',
    });
  }

  // 4. Data transfer / anomalies
  const highTransfer = (data.dataTransfer || []).filter(
    (d) => d.change > 30,
  );
  const totalTransferCost = (data.dataTransfer || []).reduce(
    (s, d) => s + d.cost,
    0,
  );

  if (highTransfer.length > 0) {
    const top = highTransfer[0];
    insights.push({
      id: 'anomaly',
      title: `Data Transfer Cost Spike: ${top.category}`,
      description: `${top.category} increased ${top.change.toFixed(0)}% MoM ($${top.cost.toFixed(2)} MTD). Total data transfer: $${totalTransferCost.toFixed(2)} across ${data.dataTransfer.length} categories.`,
      category: 'anomaly',
      severity: top.change > 100 ? 'critical' : 'warning',
      estimatedSavings: totalTransferCost * 0.2,
      recommendation:
        'Review cross-AZ and internet egress patterns. Consider CloudFront for repeated content delivery and VPC endpoints for AWS service traffic.',
    });
  } else if (totalTransferCost > 0) {
    insights.push({
      id: 'anomaly',
      title: `Data Transfer: $${totalTransferCost.toFixed(0)} MTD`,
      description: `${data.dataTransfer.length} data transfer categories tracked. All within normal ranges. No significant month-over-month increases.`,
      category: 'anomaly',
      severity: 'info',
      estimatedSavings: 0,
      recommendation:
        'Data transfer costs are stable. Review periodically for cross-region or internet egress optimization.',
    });
  } else {
    insights.push({
      id: 'anomaly',
      title: 'Monitoring Data Transfer',
      description:
        'Data transfer costs are minimal or not yet tracked. Enable usage type group monitoring for visibility into egress charges.',
      category: 'anomaly',
      severity: 'info',
      estimatedSavings: 0,
      recommendation:
        'No action needed. Data transfer monitoring is active and will flag anomalies.',
    });
  }

  return insights;
}

// --- Claude-powered insights -------------------------------------------------

async function generateAiInsights(
  data: DashboardPayload,
): Promise<AiInsight[]> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return generateLocalInsights(data);

  // Build a concise data summary (avoid sending full payload to minimize tokens)
  const summary = {
    totalSpendMTD: data.totalSpendMTD,
    forecastedSpend: data.forecastedSpend,
    previousMonthTotal: data.previousMonthTotal,
    changePercentage: data.changePercentage,
    topServices: data.topServices.slice(0, 10),
    ceRightsizing: data.ceRightsizing.slice(0, 10),
    riRecommendations: data.riRecommendations.slice(0, 5),
    spRecommendations: data.spRecommendations.slice(0, 5),
    commitment: data.commitment,
    dataTransfer: data.dataTransfer,
    nativeAnomalies: data.nativeAnomalies
      ? {
          activeAnomalies: data.nativeAnomalies.activeAnomalies,
          totalImpact: data.nativeAnomalies.totalImpact,
          status: data.nativeAnomalies.status,
          anomalies: data.nativeAnomalies.anomalies.slice(0, 5),
        }
      : null,
    trustedAdvisor: data.trustedAdvisor
      ? {
          totalEstimatedSavings: data.trustedAdvisor.totalEstimatedSavings,
          status: data.trustedAdvisor.status,
          costOptimizing: data.trustedAdvisor.byCategoryScore.cost_optimizing,
        }
      : null,
    optimizerSavings: data.optimizerSavings,
    optimizerByType: data.optimizerByType,
    tagCompliance: data.tagCompliance
      ? {
          totalResources: data.tagCompliance.totalResources,
          compliancePercent: data.tagCompliance.compliancePercent,
          untaggedResources: data.tagCompliance.untaggedResources,
        }
      : null,
  };

  const systemPrompt = `You are a Cloud FinOps analyst. Analyze the AWS cost data and return exactly 4 JSON insight objects.

RULES:
- Each insight MUST be based on REAL data below. NEVER fabricate numbers or resources.
- estimatedSavings MUST come from actual data fields (ceRightsizing savings, optimizer savings, etc.)
- Return ONLY a valid JSON array with exactly 4 objects. No markdown, no explanations.

CATEGORIES (one insight per category):
1. "idle-resources": Idle/underutilized resources (from ceRightsizing terminate recommendations, optimizerByType)
2. "cost-spike": Cost spikes (from topServices with high MoM change, nativeAnomalies)
3. "unused-commitments": Unused or low-utilization commitments (from commitment data, RI/SP recommendations)
4. "anomaly": Data transfer or spending anomalies (from dataTransfer, nativeAnomalies)

SCHEMA for each object:
{
  "id": string (category value),
  "title": string (concise, max 60 chars),
  "description": string (2-3 sentences with specific numbers from the data),
  "category": "idle-resources" | "cost-spike" | "unused-commitments" | "anomaly",
  "severity": "info" | "warning" | "critical",
  "estimatedSavings": number (USD, monthly, from real data only — use 0 if no savings),
  "recommendation": string (one actionable sentence)
}`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 2048,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: `Analyze this AWS cost data and return 4 insights:\n\n${JSON.stringify(summary, null, 2)}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      console.warn('[Insights] Claude API error, falling back to local:', response.status);
      return generateLocalInsights(data);
    }

    const result = await response.json();
    const text = result.content?.[0]?.text || '';

    // Parse JSON — handle potential markdown code fences
    const jsonStr = text.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(jsonStr) as AiInsight[];

    if (!Array.isArray(parsed) || parsed.length === 0) {
      return generateLocalInsights(data);
    }

    // Validate and sanitize
    return parsed.slice(0, 4).map((insight, i) => ({
      id: insight.id || `insight-${i}`,
      title: String(insight.title || 'Insight'),
      description: String(insight.description || ''),
      category: (['idle-resources', 'cost-spike', 'unused-commitments', 'anomaly'] as const).includes(
        insight.category,
      )
        ? insight.category
        : (['idle-resources', 'cost-spike', 'unused-commitments', 'anomaly'] as const)[i] ?? 'anomaly',
      severity: (['info', 'warning', 'critical'] as const).includes(insight.severity)
        ? insight.severity
        : 'info',
      estimatedSavings: typeof insight.estimatedSavings === 'number' ? insight.estimatedSavings : 0,
      recommendation: String(insight.recommendation || ''),
    }));
  } catch (error) {
    console.warn('[Insights] Failed to generate AI insights, falling back to local:', error);
    return generateLocalInsights(data);
  }
}

// --- GET handler -------------------------------------------------------------

export async function GET() {
  // Return cached insights if fresh
  if (cachedInsights && Date.now() - cachedAt < CACHE_TTL_MS) {
    return NextResponse.json({ insights: cachedInsights, source: cachedInsights.length > 0 ? 'cached' : 'local' });
  }

  try {
    const data = await getDashboardData();

    if (data.error && data.totalSpendMTD === 0) {
      return NextResponse.json(
        { insights: [], source: 'error', error: data.error },
        { status: 200 },
      );
    }

    const insights = await generateAiInsights(data);

    // Cache the result
    cachedInsights = insights;
    cachedAt = Date.now();

    return NextResponse.json({
      insights,
      source: process.env.ANTHROPIC_API_KEY ? 'ai' : 'local',
    });
  } catch (error) {
    console.error('[Insights] Error:', error);
    return NextResponse.json(
      { insights: [], source: 'error', error: 'Failed to generate insights' },
      { status: 500 },
    );
  }
}
