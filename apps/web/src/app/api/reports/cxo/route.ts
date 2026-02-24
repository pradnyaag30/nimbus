import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { generateCxoReport } from '@/lib/reports/cxo-report';
import { getDashboardData } from '@/lib/cloud/fetchDashboardData';
import { getChargeTypeBreakdown, getRegionCostBreakdown } from '@/lib/cloud/aws-costs';
import type { CxoReportData } from '@/lib/reports/types';

export async function GET() {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
      { status: 401 }
    );
  }

  try {
    const today = new Date();
    const reportMonth = today.toLocaleString('en-US', {
      month: 'long',
      year: 'numeric',
    });
    const dateStr = today.toISOString().split('T')[0];

    // Fetch real data from AWS in parallel
    const [dashboard, chargeTypes, regionBreakdown] = await Promise.all([
      getDashboardData(),
      getChargeTypeBreakdown().catch(() => []),
      getRegionCostBreakdown().catch(() => []),
    ]);

    // Compute savings summary from optimizer + rightsizing + RI/SP recommendations
    const rightsizingSavings = dashboard.ceRightsizing.reduce(
      (sum, r) => sum + r.estimatedMonthlySavings, 0
    );
    const riSavings = dashboard.riRecommendations.reduce(
      (sum, r) => sum + r.estimatedMonthlySavings, 0
    );
    const spSavings = dashboard.spRecommendations.reduce(
      (sum, r) => sum + r.estimatedMonthlySavings, 0
    );
    const totalMonthlySavings =
      rightsizingSavings + riSavings + spSavings + dashboard.optimizerSavings;

    // Build rightsizing categories
    const rightsizingByAction: Record<string, { count: number; savings: number }> = {};
    for (const rec of dashboard.ceRightsizing) {
      const action = rec.action === 'TERMINATE' ? 'Terminate' : 'Rightsize';
      if (!rightsizingByAction[action]) {
        rightsizingByAction[action] = { count: 0, savings: 0 };
      }
      rightsizingByAction[action].count += 1;
      rightsizingByAction[action].savings += rec.estimatedMonthlySavings;
    }

    // Build differential spend (current vs previous)
    const differentialSpend = dashboard.topServices.map((svc) => {
      const currentCost = svc.cost;
      const previousCost = svc.change !== 0
        ? currentCost / (1 + svc.change / 100)
        : currentCost;
      const delta = currentCost - previousCost;
      return {
        service: svc.name,
        currentCost,
        previousCost,
        delta,
        direction: (delta >= 0 ? 'up' : 'down') as 'up' | 'down',
      };
    });

    // Calculate average daily spend
    const dayOfMonth = today.getDate();
    const currentDailyAvg = dayOfMonth > 0 ? dashboard.totalSpendMTD / dayOfMonth : 0;
    const previousDaysInMonth = new Date(today.getFullYear(), today.getMonth(), 0).getDate();
    const previousDailyAvg = previousDaysInMonth > 0
      ? dashboard.previousMonthTotal / previousDaysInMonth
      : 0;

    // Build budget vs actual
    const budgetVsActual = dashboard.awsBudgets?.budgets.map((b) => ({
      name: b.budgetName,
      limit: b.limitAmount,
      actual: b.currentSpend,
      percentUsed: b.percentUsed,
    })) ?? [];

    // Compute budget utilization (overall)
    const budgetUtilization = dashboard.awsBudgets
      ? dashboard.awsBudgets.totalBudgetLimit > 0
        ? Math.round(
            (dashboard.awsBudgets.totalCurrentSpend / dashboard.awsBudgets.totalBudgetLimit) * 100
          )
        : 0
      : 0;

    // Build compliance score from tag compliance
    const complianceScore = dashboard.tagCompliance
      ? Math.round(dashboard.tagCompliance.compliancePercent)
      : 0;

    // Build recommendations from all sources
    const recommendations: CxoReportData['recommendations'] = [];
    if (rightsizingSavings > 0) {
      recommendations.push({
        title: `Right-size ${dashboard.ceRightsizing.length} underutilized EC2 instances`,
        potentialSavings: rightsizingSavings,
        priority: rightsizingSavings > 500 ? 'High' : 'Medium',
      });
    }
    if (riSavings > 0) {
      recommendations.push({
        title: `Purchase Reserved Instances for ${dashboard.riRecommendations.length} workloads`,
        potentialSavings: riSavings,
        priority: riSavings > 500 ? 'High' : 'Medium',
      });
    }
    if (spSavings > 0) {
      recommendations.push({
        title: `Adopt Savings Plans for compute workloads`,
        potentialSavings: spSavings,
        priority: spSavings > 500 ? 'High' : 'Medium',
      });
    }
    if (dashboard.optimizerSavings > 0) {
      recommendations.push({
        title: 'Apply Compute Optimizer recommendations across fleet',
        potentialSavings: dashboard.optimizerSavings,
        priority: 'Medium',
      });
    }
    // Ensure at least one recommendation
    if (recommendations.length === 0) {
      recommendations.push({
        title: 'Review and implement FinOps best practices',
        potentialSavings: 0,
        priority: 'Low',
      });
    }

    const reportData: CxoReportData = {
      tenantName: session.user.name || 'Cloud Account',
      reportPeriod: reportMonth,
      generatedAt: today.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      totalSpend: dashboard.totalSpendMTD,
      previousPeriodSpend: dashboard.previousMonthTotal,
      currency: dashboard.currency,
      topServicesBySpend: dashboard.topServices.map((s) => ({
        service: s.name,
        spend: s.cost,
        change: s.change,
      })),
      spendByProvider: [
        { provider: 'AWS', spend: dashboard.totalSpendMTD, percentage: 100 },
      ],
      anomaliesDetected: dashboard.nativeAnomalies?.activeAnomalies ?? 0,
      budgetUtilization,
      complianceScore,
      recommendations,

      // Cost Optimization
      savingsSummary: {
        monthlySavings: totalMonthlySavings,
        annualizedSavings: totalMonthlySavings * 12,
        byType: [
          ...(rightsizingSavings > 0
            ? [{ type: 'EC2 Rightsizing', amount: rightsizingSavings }]
            : []),
          ...(riSavings > 0
            ? [{ type: 'Reserved Instances', amount: riSavings }]
            : []),
          ...(spSavings > 0
            ? [{ type: 'Savings Plans', amount: spSavings }]
            : []),
          ...(dashboard.optimizerSavings > 0
            ? [{ type: 'Compute Optimizer', amount: dashboard.optimizerSavings }]
            : []),
        ],
      },
      commitmentCoverage: {
        savingsPlansCoverage: dashboard.commitment.savingsPlansCoveragePercent,
        savingsPlansUtilization: dashboard.commitment.savingsPlansUtilizationPercent,
        reservedInstanceCoverage: dashboard.commitment.reservedInstanceCoveragePercent,
        reservedInstanceUtilization: dashboard.commitment.reservedInstanceUtilizationPercent,
        totalOnDemandCost: dashboard.commitment.totalOnDemandCost,
        totalCommittedCost: dashboard.commitment.totalCommittedCost,
      },
      rightsizingRecommendations: {
        totalSavings: rightsizingSavings,
        byCategory: Object.entries(rightsizingByAction).map(([category, data]) => ({
          category,
          count: data.count,
          savings: data.savings,
        })),
      },

      // Financial Analysis
      annualCostTrend: dashboard.monthlyCosts,
      chargeTypeBreakdown: chargeTypes.map((ct) => ({
        chargeType: ct.chargeType,
        cost: ct.cost,
        percentage: ct.percentage,
      })),
      differentialSpend,
      averageDailySpend: {
        current: currentDailyAvg,
        previous: previousDailyAvg,
      },
      dataTransferAnalysis: dashboard.dataTransfer.map((dt) => ({
        category: dt.category,
        cost: dt.cost,
      })),
      regionCostBreakdown: regionBreakdown.map((r) => ({
        region: r.region,
        cost: r.cost,
        percentage: r.percentage,
      })),
      budgetVsActual,
      forecastedSpend: dashboard.forecastedSpend,
    };

    const buffer = await generateCxoReport(reportData);

    return new Response(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'Content-Disposition': `attachment; filename="cxo-report-${dateStr}.pptx"`,
        'Content-Length': buffer.length.toString(),
      },
    });
  } catch (err) {
    console.error('Failed to generate CXO report:', err);
    return NextResponse.json(
      {
        error: {
          code: 'REPORT_GENERATION_FAILED',
          message: 'Failed to generate CXO report',
        },
      },
      { status: 500 }
    );
  }
}
