export interface CxoReportData {
  tenantName: string;
  reportPeriod: string;
  generatedAt: string;
  totalSpend: number;
  previousPeriodSpend: number;
  currency: string;
  topServicesBySpend: Array<{ service: string; spend: number; change: number }>;
  spendByProvider: Array<{ provider: string; spend: number; percentage: number }>;
  anomaliesDetected: number;
  budgetUtilization: number;
  complianceScore: number;
  recommendations: Array<{
    title: string;
    potentialSavings: number;
    priority: string;
  }>;

  // --- Cost Optimization section ---
  savingsSummary?: {
    monthlySavings: number;
    annualizedSavings: number;
    byType: { type: string; amount: number }[];
  };
  commitmentCoverage?: {
    savingsPlansCoverage: number;
    savingsPlansUtilization: number;
    reservedInstanceCoverage: number;
    reservedInstanceUtilization: number;
    totalOnDemandCost: number;
    totalCommittedCost: number;
  };
  rightsizingRecommendations?: {
    totalSavings: number;
    byCategory: { category: string; count: number; savings: number }[];
  };

  // --- Financial Analysis section ---
  annualCostTrend?: { month: string; cost: number }[];
  chargeTypeBreakdown?: { chargeType: string; cost: number; percentage: number }[];
  differentialSpend?: { service: string; currentCost: number; previousCost: number; delta: number; direction: 'up' | 'down' }[];
  averageDailySpend?: { current: number; previous: number };
  dataTransferAnalysis?: { category: string; cost: number }[];
  regionCostBreakdown?: { region: string; cost: number; percentage: number }[];
  budgetVsActual?: { name: string; limit: number; actual: number; percentUsed: number }[];
  forecastedSpend?: number;
}
