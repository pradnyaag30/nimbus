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
}
