// Cost data context for the AI chatbot.
// Provides live AWS data to the Claude system prompt.

export interface CostSummary {
  totalSpendMTD: number;
  forecastedSpend: number;
  savingsIdentified: number;
  activeAnomalies: number;
  providers: { name: string; spend: number; change: number }[];
  topServices: { name: string; provider: string; cost: number; change: number }[];
  budgets: { name: string; limit: number; spent: number; provider: string }[];
  recommendations: { category: string; count: number; savings: number }[];
  anomalies: { title: string; provider: string; service: string; impact: number; status: string }[];

  // Phase 2-3 fields (optional for backward compat with local engine)
  previousMonthTotal?: number;
  changePercentage?: number;
  ceRightsizing?: { instanceId: string; instanceType: string; action: string; targetInstanceType: string; estimatedMonthlySavings: number }[];
  riRecommendations?: { instanceType: string; estimatedMonthlySavings: number }[];
  spRecommendations?: { savingsPlanType: string; estimatedMonthlySavings: number }[];
  commitment?: { savingsPlansCoveragePercent: number; savingsPlansUtilizationPercent: number; totalOnDemandCost: number; totalCommittedCost: number; estimatedSavingsFromCommitments: number };
  dataTransfer?: { category: string; cost: number; change: number }[];
  trustedAdvisor?: { status: string; totalEstimatedSavings: number; checks: { checkId: string; name: string; category: string; status: string; estimatedMonthlySavings: number }[]; byCategoryScore: { cost_optimizing: { ok: number; warning: number; error: number; estimatedSavings: number }; security: { ok: number; warning: number; error: number }; fault_tolerance: { ok: number; warning: number; error: number }; performance: { ok: number; warning: number; error: number }; service_limits: { ok: number; warning: number; error: number } } } | null;
  awsBudgets?: { budgets: { budgetName: string; budgetType: string; limitAmount: number; currentSpend: number; forecastedSpend: number; percentUsed: number; alertLevel: string }[]; totalBudgetLimit: number; totalCurrentSpend: number; budgetsInAlarm: number; status: string } | null;
  tagCompliance?: { totalResources: number; taggedResources: number; untaggedResources: number; compliancePercent: number; status: string } | null;
  nativeAnomalies?: { anomalies: { anomalyId: string; dimensionValue: string; rootCauses: { service: string; region: string; usageType: string }[]; impact: { totalImpact: number; maxImpact: number; totalActualSpend: number; totalExpectedSpend: number } }[]; totalImpact: number; activeAnomalies: number; status: string } | null;
  optimizerSavings?: number;
  optimizerByType?: { type: string; count: number; savings: number }[];
}

export function buildCostContextPrompt(data: CostSummary): string {
  const totalReco = data.recommendations.reduce((s, r) => s + r.savings, 0);
  const openAnomalies = data.anomalies.filter((a) => a.status === 'open');

  // Build Phase 2-3 sections if data is available
  let extendedSections = '';

  if (data.ceRightsizing && data.ceRightsizing.length > 0) {
    extendedSections += `\nCE RIGHTSIZING RECOMMENDATIONS:\n${data.ceRightsizing.map((r) => `- ${r.instanceId} (${r.instanceType}): ${r.action}${r.action.toUpperCase() !== 'TERMINATE' && r.targetInstanceType ? ` → ${r.targetInstanceType}` : ''}, save $${r.estimatedMonthlySavings.toFixed(0)}/mo`).join('\n')}\n`;
  }

  if (data.riRecommendations && data.riRecommendations.length > 0) {
    extendedSections += `\nRI PURCHASE RECOMMENDATIONS:\n${data.riRecommendations.map((r) => `- ${r.instanceType}: save $${r.estimatedMonthlySavings.toFixed(0)}/mo`).join('\n')}\n`;
  }

  if (data.spRecommendations && data.spRecommendations.length > 0) {
    extendedSections += `\nSAVINGS PLANS RECOMMENDATIONS:\n${data.spRecommendations.map((r) => `- ${r.savingsPlanType}: save $${r.estimatedMonthlySavings.toFixed(0)}/mo`).join('\n')}\n`;
  }

  if (data.commitment) {
    extendedSections += `\nCOMMITMENT COVERAGE:
- SP Coverage: ${data.commitment.savingsPlansCoveragePercent.toFixed(1)}%
- SP Utilization: ${data.commitment.savingsPlansUtilizationPercent.toFixed(1)}%
- On-Demand Cost: $${data.commitment.totalOnDemandCost.toFixed(0)}
- Committed Cost: $${data.commitment.totalCommittedCost.toFixed(0)}
- Estimated Savings: $${data.commitment.estimatedSavingsFromCommitments.toFixed(0)}\n`;
  }

  if (data.dataTransfer && data.dataTransfer.length > 0) {
    extendedSections += `\nDATA TRANSFER COSTS:\n${data.dataTransfer.map((d) => `- ${d.category}: $${d.cost.toFixed(2)} (${d.change >= 0 ? '+' : ''}${d.change.toFixed(1)}% MoM)`).join('\n')}\n`;
  }

  if (data.trustedAdvisor && data.trustedAdvisor.status === 'active') {
    const ta = data.trustedAdvisor;
    extendedSections += `\nTRUSTED ADVISOR:
- Total Estimated Savings: $${ta.totalEstimatedSavings.toFixed(0)}
- Cost Optimization: ${ta.byCategoryScore.cost_optimizing.warning} warnings, ${ta.byCategoryScore.cost_optimizing.error} errors
- Security: ${ta.byCategoryScore.security.warning} warnings, ${ta.byCategoryScore.security.error} errors
- Fault Tolerance: ${ta.byCategoryScore.fault_tolerance.warning} warnings
- Performance: ${ta.byCategoryScore.performance.warning} warnings\n`;
  }

  if (data.awsBudgets && data.awsBudgets.status === 'active') {
    extendedSections += `\nAWS BUDGETS:\n${data.awsBudgets.budgets.map((b) => `- ${b.budgetName}: $${b.currentSpend.toFixed(0)}/$${b.limitAmount.toFixed(0)} (${b.percentUsed.toFixed(0)}%) — ${b.alertLevel}`).join('\n')}\n`;
  }

  if (data.tagCompliance && data.tagCompliance.status === 'active') {
    extendedSections += `\nTAG COMPLIANCE:
- Total Resources: ${data.tagCompliance.totalResources}
- Compliance: ${data.tagCompliance.compliancePercent.toFixed(1)}%
- Untagged: ${data.tagCompliance.untaggedResources}\n`;
  }

  if (data.nativeAnomalies && data.nativeAnomalies.status === 'active') {
    const na = data.nativeAnomalies;
    extendedSections += `\nNATIVE ANOMALIES:
- Active: ${na.activeAnomalies}
- Total Impact: $${na.totalImpact.toFixed(0)}
${na.anomalies.slice(0, 5).map((a) => `- ${a.rootCauses[0]?.service || a.dimensionValue}: $${a.impact.totalImpact.toFixed(0)} impact`).join('\n')}\n`;
  }

  if (data.optimizerSavings && data.optimizerSavings > 0) {
    extendedSections += `\nCOMPUTE OPTIMIZER:
- Total Savings: $${data.optimizerSavings.toFixed(0)}/mo
${data.optimizerByType?.map((t) => `- ${t.type}: ${t.count} resources, $${t.savings.toFixed(0)}/mo savings`).join('\n') || ''}\n`;
  }

  return `You are Nimbus AI, an expert Cloud FinOps assistant for a BFSI enterprise. You help teams understand their cloud spending, identify optimization opportunities, and answer billing questions.

CURRENT COST DATA (Month-to-Date):
- Total Spend MTD: $${data.totalSpendMTD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
- Forecasted Monthly Spend: $${data.forecastedSpend.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
- Identified Savings: $${totalReco.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}/month
${data.previousMonthTotal !== undefined ? `- Previous Month Total: $${data.previousMonthTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n- MoM Change: ${data.changePercentage !== undefined ? (data.changePercentage >= 0 ? '+' : '') + data.changePercentage.toFixed(1) + '%' : 'N/A'}` : ''}

SPEND BY PROVIDER:
${data.providers.map((p) => `- ${p.name}: $${p.spend.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (${p.change >= 0 ? '+' : ''}${p.change.toFixed(1)}% MoM)`).join('\n')}

TOP SERVICES BY COST:
${data.topServices.map((s) => `- ${s.name} (${s.provider}): $${s.cost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (${s.change >= 0 ? '+' : ''}${s.change.toFixed(1)}% MoM)`).join('\n')}

BUDGET STATUS:
${data.budgets.map((b) => `- ${b.name}: $${b.spent.toLocaleString('en-US')} / $${b.limit.toLocaleString('en-US')} (${((b.spent / b.limit) * 100).toFixed(1)}%)`).join('\n')}

OPTIMIZATION RECOMMENDATIONS:
${data.recommendations.map((r) => `- ${r.category}: ${r.count} items, $${r.savings.toLocaleString('en-US')}/mo potential savings`).join('\n')}

ACTIVE ANOMALIES:
${openAnomalies.length > 0 ? openAnomalies.map((a) => `- ${a.title} (${a.provider}/${a.service}): $${a.impact.toLocaleString('en-US')} impact`).join('\n') : 'None detected'}
${extendedSections}
INSTRUCTIONS:
- You are Nimbus AI, an expert Cloud FinOps assistant for enterprise teams
- Answer concisely and precisely using ONLY the data above. Never fabricate numbers.
- Use $ (USD) for all currency values since all source data is in USD
- When asked about savings: cross-reference CE Rightsizing, RI, SP, Compute Optimizer, and Trusted Advisor data
- When asked about anomalies: use both native AWS anomaly detection data AND services with high MoM changes
- When asked about commitments: reference SP coverage/utilization percentages and RI/SP purchase recommendations
- When asked about budgets: use real AWS Budgets data
- Highlight specific resource IDs and instance types when available
- Provide actionable recommendations with estimated dollar impact
- If data is not available for a topic, say so clearly
- Keep responses focused and NOC-room friendly (brief, actionable)`;
}
