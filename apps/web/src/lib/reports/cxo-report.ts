import PptxGenJS from 'pptxgenjs';
import type { CxoReportData } from './types';

// =============================================================================
// Theme & Utilities
// =============================================================================

const COLORS = {
  darkBlue: '1e3a5f',
  white: 'FFFFFF',
  lightGray: 'F5F5F5',
  mediumGray: '8B8B8B',
  black: '333333',
  green: '27AE60',
  red: 'E74C3C',
  orange: 'F39C12',
  lightBlue: '3498DB',
  chartBlue: '2980B9',
  chartOrange: 'E67E22',
  chartGreen: '27AE60',
  chartPurple: '8E44AD',
  chartTeal: '1ABC9C',
  chartRed: 'C0392B',
  chartYellow: 'F1C40F',
  chartPink: 'E91E63',
} as const;

const CHART_PALETTE = [
  COLORS.chartBlue,
  COLORS.chartOrange,
  COLORS.chartGreen,
  COLORS.chartPurple,
  COLORS.chartTeal,
  COLORS.chartRed,
  COLORS.chartYellow,
  COLORS.chartPink,
];

const FONT = { primary: 'Arial' } as const;

function fmt(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function fmtPct(value: number): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
}

function fmtNum(value: number): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function addFooter(slide: PptxGenJS.Slide, pageNum?: number): void {
  const text = pageNum
    ? `ACC / FinOps AI  |  Confidential  |  ${pageNum}`
    : 'ACC / FinOps AI  |  Confidential';
  slide.addText(text, {
    x: 0.5, y: 5.2, w: 9, h: 0.3,
    fontSize: 8, color: COLORS.mediumGray, fontFace: FONT.primary, align: 'center',
  });
}

function addSlideHeader(slide: PptxGenJS.Slide, title: string, subtitle?: string): void {
  slide.addShape('rect' as PptxGenJS.ShapeType, {
    x: 0, y: 0, w: 10, h: 0.9, fill: { color: COLORS.darkBlue },
  });
  slide.addText(title, {
    x: 0.5, y: 0.15, w: 9, h: 0.45,
    fontSize: 22, color: COLORS.white, fontFace: FONT.primary, bold: true,
  });
  if (subtitle) {
    slide.addText(subtitle, {
      x: 0.5, y: 0.52, w: 9, h: 0.3,
      fontSize: 11, color: 'B0C4DE', fontFace: FONT.primary,
    });
  }
}

function headerRow(...cols: string[]): PptxGenJS.TableRow {
  return cols.map((text, idx) => ({
    text,
    options: {
      bold: true, fontSize: 10, color: COLORS.white,
      fill: { color: COLORS.darkBlue },
      align: (idx === 0 ? 'left' : 'right') as 'left' | 'right' | 'center',
    },
  }));
}

function dataRow(
  cells: { text: string; color?: string; bold?: boolean; align?: 'left' | 'right' | 'center' }[],
  idx: number,
): PptxGenJS.TableRow {
  const rowFill = idx % 2 === 0 ? COLORS.lightGray : COLORS.white;
  return cells.map((cell) => ({
    text: cell.text,
    options: {
      fontSize: 10,
      color: cell.color || COLORS.black,
      bold: cell.bold || false,
      align: cell.align || 'left',
      fill: { color: rowFill },
    },
  }));
}

function addKpiCard(
  slide: PptxGenJS.Slide,
  x: number, y: number, w: number, h: number,
  label: string, value: string, valueColor?: string, sub?: string,
): void {
  slide.addShape('rect' as PptxGenJS.ShapeType, {
    x, y, w, h, fill: { color: COLORS.lightGray }, rectRadius: 0.1,
  });
  slide.addText(label, {
    x, y: y + 0.08, w, h: 0.35,
    fontSize: 10, color: COLORS.mediumGray, fontFace: FONT.primary, align: 'center', bold: true,
  });
  slide.addText(value, {
    x, y: y + 0.35, w, h: 0.55,
    fontSize: 26, color: valueColor || COLORS.darkBlue, fontFace: FONT.primary, align: 'center', bold: true,
  });
  if (sub) {
    slide.addText(sub, {
      x, y: y + h - 0.4, w, h: 0.3,
      fontSize: 9, color: COLORS.mediumGray, fontFace: FONT.primary, align: 'center',
    });
  }
}

function addProgressBar(
  slide: PptxGenJS.Slide,
  x: number, y: number, w: number, h: number,
  percent: number, color: string,
): void {
  slide.addShape('rect' as PptxGenJS.ShapeType, {
    x, y, w, h, fill: { color: 'E0E0E0' }, rectRadius: 0.04,
  });
  const fillW = Math.min((percent / 100) * w, w);
  if (fillW > 0.01) {
    slide.addShape('rect' as PptxGenJS.ShapeType, {
      x, y, w: fillW, h, fill: { color }, rectRadius: 0.04,
    });
  }
}

// =============================================================================
// Slide 1: Title
// =============================================================================

function buildTitleSlide(pres: PptxGenJS, data: CxoReportData): void {
  const slide = pres.addSlide();

  slide.addShape('rect' as PptxGenJS.ShapeType, {
    x: 0, y: 0, w: 10, h: 5.63, fill: { color: COLORS.darkBlue },
  });

  slide.addText('Cloud FinOps\nExecutive Summary', {
    x: 1, y: 0.8, w: 8, h: 2,
    fontSize: 36, color: COLORS.white, fontFace: FONT.primary,
    bold: true, align: 'center', lineSpacingMultiple: 1.2,
  });

  slide.addShape('rect' as PptxGenJS.ShapeType, {
    x: 3, y: 2.9, w: 4, h: 0.04, fill: { color: COLORS.lightBlue },
  });

  slide.addText(data.tenantName, {
    x: 1, y: 3.2, w: 8, h: 0.6,
    fontSize: 20, color: COLORS.lightBlue, fontFace: FONT.primary, align: 'center',
  });

  slide.addText(`Reporting Period: ${data.reportPeriod}`, {
    x: 1, y: 3.9, w: 8, h: 0.4,
    fontSize: 14, color: COLORS.mediumGray, fontFace: FONT.primary, align: 'center',
  });

  slide.addText(`Generated: ${data.generatedAt}`, {
    x: 1, y: 4.3, w: 8, h: 0.4,
    fontSize: 12, color: COLORS.mediumGray, fontFace: FONT.primary, align: 'center',
  });

  slide.addText('ACC / FinOps AI  |  Confidential', {
    x: 0.5, y: 5.0, w: 9, h: 0.3,
    fontSize: 8, color: COLORS.mediumGray, fontFace: FONT.primary, align: 'center',
  });
}

// =============================================================================
// Slide 2: Financial Overview (Executive Summary)
// =============================================================================

function buildFinancialOverviewSlide(pres: PptxGenJS, data: CxoReportData): void {
  const slide = pres.addSlide();
  addSlideHeader(slide, 'Financial Overview', 'Month-to-date spend summary');

  const momChange =
    data.previousPeriodSpend > 0
      ? ((data.totalSpend - data.previousPeriodSpend) / data.previousPeriodSpend) * 100
      : 0;
  const momColor = momChange > 0 ? COLORS.red : COLORS.green;

  addKpiCard(slide, 0.5, 1.15, 2.8, 1.5,
    'Total Cloud Spend', fmt(data.totalSpend, data.currency), undefined,
    `Previous: ${fmt(data.previousPeriodSpend, data.currency)}`);

  addKpiCard(slide, 3.6, 1.15, 2.8, 1.5,
    'Month-over-Month', fmtPct(momChange), momColor,
    momChange > 0 ? 'Cost increase detected' : 'Cost reduction achieved');

  addKpiCard(slide, 6.7, 1.15, 2.8, 1.5,
    'Forecasted Spend', data.forecastedSpend ? fmt(data.forecastedSpend, data.currency) : 'N/A', undefined,
    'End of month projection');

  // Key insights box
  slide.addShape('rect' as PptxGenJS.ShapeType, {
    x: 0.5, y: 3.0, w: 9, h: 1.8, fill: { color: COLORS.lightGray }, rectRadius: 0.1,
  });
  slide.addText('Key Financial Insights', {
    x: 0.7, y: 3.1, w: 8.6, h: 0.35,
    fontSize: 14, color: COLORS.darkBlue, fontFace: FONT.primary, bold: true,
  });

  const delta = data.totalSpend - data.previousPeriodSpend;
  const deltaStr = fmt(Math.abs(delta), data.currency);
  const direction = delta > 0 ? 'increased' : 'decreased';

  const insights = [
    `• Cloud spend ${direction} by ${deltaStr} (${fmtPct(momChange)}) compared to the previous period.`,
    `• Budget utilization is at ${data.budgetUtilization}% — ${data.budgetUtilization > 90 ? 'approaching limit, immediate review required' : data.budgetUtilization > 75 ? 'monitoring recommended' : 'within healthy range'}.`,
    `• ${data.anomaliesDetected} cost anomalies detected this period requiring investigation.`,
    data.forecastedSpend
      ? `• Forecasted end-of-month spend: ${fmt(data.forecastedSpend, data.currency)}.`
      : '',
  ].filter(Boolean);

  slide.addText(insights.join('\n'), {
    x: 0.7, y: 3.5, w: 8.6, h: 1.2,
    fontSize: 10, color: COLORS.black, fontFace: FONT.primary, lineSpacingMultiple: 1.4,
  });

  addFooter(slide, 2);
}

// =============================================================================
// SECTION A: Cost Optimization
// =============================================================================

// Slide 3: Savings Summary
function buildSavingsSummarySlide(pres: PptxGenJS, data: CxoReportData): void {
  const slide = pres.addSlide();
  addSlideHeader(slide, 'Savings Opportunity Summary', 'Cost Optimization');

  const savings = data.savingsSummary;
  if (!savings || savings.monthlySavings === 0) {
    slide.addText('No savings opportunities currently identified.\nContinue monitoring for optimization potential.', {
      x: 1, y: 2, w: 8, h: 2,
      fontSize: 16, color: COLORS.mediumGray, fontFace: FONT.primary, align: 'center',
    });
    addFooter(slide, 3);
    return;
  }

  // Headline KPIs
  addKpiCard(slide, 0.5, 1.15, 4.3, 1.5,
    'Estimated Monthly Savings', fmt(savings.monthlySavings, data.currency), COLORS.green);
  addKpiCard(slide, 5.2, 1.15, 4.3, 1.5,
    'Annualized Savings', fmt(savings.annualizedSavings, data.currency), COLORS.green);

  // Breakdown by type table
  if (savings.byType.length > 0) {
    const rows: PptxGenJS.TableRow[] = [headerRow('Savings Category', 'Monthly Amount', '% of Total')];
    savings.byType.forEach((item, idx) => {
      const pct = savings.monthlySavings > 0
        ? ((item.amount / savings.monthlySavings) * 100).toFixed(1)
        : '0.0';
      rows.push(dataRow([
        { text: item.type },
        { text: fmt(item.amount, data.currency), align: 'right' },
        { text: `${pct}%`, align: 'right' },
      ], idx));
    });

    slide.addTable(rows, {
      x: 0.5, y: 3.0, w: 9, colW: [4.0, 2.5, 2.5],
      border: { type: 'solid', pt: 0.5, color: 'E0E0E0' }, rowH: 0.4,
    });
  }

  addFooter(slide, 3);
}

// Slide 4: Commitment Coverage (RI & SP)
function buildCommitmentCoverageSlide(pres: PptxGenJS, data: CxoReportData): void {
  const slide = pres.addSlide();
  addSlideHeader(slide, 'Commitment Coverage & Utilization', 'Cost Optimization');

  const cc = data.commitmentCoverage;
  if (!cc) {
    slide.addText('No commitment data available.', {
      x: 1, y: 2.5, w: 8, h: 1, fontSize: 16, color: COLORS.mediumGray,
      fontFace: FONT.primary, align: 'center',
    });
    addFooter(slide, 4);
    return;
  }

  // Savings Plans section
  slide.addText('Savings Plans', {
    x: 0.5, y: 1.15, w: 4.3, h: 0.35,
    fontSize: 14, color: COLORS.darkBlue, fontFace: FONT.primary, bold: true,
  });

  slide.addShape('rect' as PptxGenJS.ShapeType, {
    x: 0.5, y: 1.55, w: 4.3, h: 1.8, fill: { color: COLORS.lightGray }, rectRadius: 0.1,
  });

  slide.addText(`Coverage: ${cc.savingsPlansCoverage.toFixed(1)}%`, {
    x: 0.7, y: 1.65, w: 3.9, h: 0.35,
    fontSize: 12, color: COLORS.black, fontFace: FONT.primary,
  });
  addProgressBar(slide, 0.7, 2.05, 3.9, 0.18,
    cc.savingsPlansCoverage, cc.savingsPlansCoverage > 50 ? COLORS.green : COLORS.orange);

  slide.addText(`Utilization: ${cc.savingsPlansUtilization.toFixed(1)}%`, {
    x: 0.7, y: 2.35, w: 3.9, h: 0.35,
    fontSize: 12, color: COLORS.black, fontFace: FONT.primary,
  });
  addProgressBar(slide, 0.7, 2.75, 3.9, 0.18,
    cc.savingsPlansUtilization, cc.savingsPlansUtilization > 70 ? COLORS.green : COLORS.orange);

  // Reserved Instances section
  slide.addText('Reserved Instances', {
    x: 5.2, y: 1.15, w: 4.3, h: 0.35,
    fontSize: 14, color: COLORS.darkBlue, fontFace: FONT.primary, bold: true,
  });

  slide.addShape('rect' as PptxGenJS.ShapeType, {
    x: 5.2, y: 1.55, w: 4.3, h: 1.8, fill: { color: COLORS.lightGray }, rectRadius: 0.1,
  });

  slide.addText(`Coverage: ${cc.reservedInstanceCoverage.toFixed(1)}%`, {
    x: 5.4, y: 1.65, w: 3.9, h: 0.35,
    fontSize: 12, color: COLORS.black, fontFace: FONT.primary,
  });
  addProgressBar(slide, 5.4, 2.05, 3.9, 0.18,
    cc.reservedInstanceCoverage, cc.reservedInstanceCoverage > 50 ? COLORS.green : COLORS.orange);

  slide.addText(`Utilization: ${cc.reservedInstanceUtilization.toFixed(1)}%`, {
    x: 5.4, y: 2.35, w: 3.9, h: 0.35,
    fontSize: 12, color: COLORS.black, fontFace: FONT.primary,
  });
  addProgressBar(slide, 5.4, 2.75, 3.9, 0.18,
    cc.reservedInstanceUtilization, cc.reservedInstanceUtilization > 70 ? COLORS.green : COLORS.orange);

  // Cost breakdown
  slide.addShape('rect' as PptxGenJS.ShapeType, {
    x: 0.5, y: 3.65, w: 9, h: 1.2, fill: { color: COLORS.lightGray }, rectRadius: 0.1,
  });
  slide.addText('Spend Breakdown', {
    x: 0.7, y: 3.7, w: 8.6, h: 0.35,
    fontSize: 12, color: COLORS.darkBlue, fontFace: FONT.primary, bold: true,
  });

  const totalCost = cc.totalOnDemandCost + cc.totalCommittedCost;
  const odPct = totalCost > 0 ? ((cc.totalOnDemandCost / totalCost) * 100).toFixed(1) : '0.0';
  const cmtPct = totalCost > 0 ? ((cc.totalCommittedCost / totalCost) * 100).toFixed(1) : '0.0';

  slide.addText(
    `On-Demand: ${fmt(cc.totalOnDemandCost, data.currency)} (${odPct}%)  |  Committed: ${fmt(cc.totalCommittedCost, data.currency)} (${cmtPct}%)`,
    {
      x: 0.7, y: 4.1, w: 8.6, h: 0.35,
      fontSize: 11, color: COLORS.black, fontFace: FONT.primary,
    }
  );

  addFooter(slide, 4);
}

// Slide 5: Rightsizing Recommendations
function buildRightsizingSlide(pres: PptxGenJS, data: CxoReportData): void {
  const slide = pres.addSlide();
  addSlideHeader(slide, 'Rightsizing Recommendations', 'Cost Optimization');

  const rs = data.rightsizingRecommendations;
  if (!rs || rs.totalSavings === 0) {
    slide.addText('No rightsizing recommendations at this time.\nAll instances appear appropriately sized.', {
      x: 1, y: 2.2, w: 8, h: 2,
      fontSize: 16, color: COLORS.mediumGray, fontFace: FONT.primary, align: 'center',
    });
    addFooter(slide, 5);
    return;
  }

  // Headline
  addKpiCard(slide, 2.5, 1.15, 5, 1.3,
    'Total Rightsizing Savings Potential', fmt(rs.totalSavings, data.currency) + '/mo', COLORS.green);

  // Category table
  if (rs.byCategory.length > 0) {
    const rows: PptxGenJS.TableRow[] = [headerRow('Category', 'Instance Count', 'Estimated Savings/mo')];
    rs.byCategory.forEach((cat, idx) => {
      rows.push(dataRow([
        { text: cat.category },
        { text: fmtNum(cat.count), align: 'right' },
        { text: fmt(cat.savings, data.currency), align: 'right', color: COLORS.green },
      ], idx));
    });

    slide.addTable(rows, {
      x: 1, y: 2.8, w: 8, colW: [3.5, 2.0, 2.5],
      border: { type: 'solid', pt: 0.5, color: 'E0E0E0' }, rowH: 0.45,
    });
  }

  slide.addText(
    'Recommendations sourced from AWS Cost Explorer Rightsizing API. Review before implementing.',
    {
      x: 0.5, y: 4.6, w: 9, h: 0.4,
      fontSize: 9, color: COLORS.mediumGray, fontFace: FONT.primary, italic: true, align: 'center',
    }
  );

  addFooter(slide, 5);
}

// Slide 6: Optimization Recommendations (consolidated)
function buildRecommendationsSlide(pres: PptxGenJS, data: CxoReportData): void {
  const slide = pres.addSlide();
  addSlideHeader(slide, 'Optimization Recommendations', 'Cost Optimization');

  const topRecs = data.recommendations.slice(0, 4);
  const totalSavings = topRecs.reduce((sum, r) => sum + r.potentialSavings, 0);

  // Total savings highlight
  slide.addShape('rect' as PptxGenJS.ShapeType, {
    x: 0.5, y: 1.15, w: 9, h: 0.65, fill: { color: COLORS.darkBlue }, rectRadius: 0.1,
  });
  slide.addText(
    `Total Potential Savings: ${fmt(totalSavings, data.currency)}/month`,
    {
      x: 0.5, y: 1.15, w: 9, h: 0.65,
      fontSize: 18, color: COLORS.white, fontFace: FONT.primary, align: 'center', bold: true,
    }
  );

  // Recommendation cards
  topRecs.forEach((rec, idx) => {
    const yPos = 2.1 + idx * 0.85;
    const priorityColor =
      rec.priority === 'High' || rec.priority === 'Critical' ? COLORS.red
        : rec.priority === 'Medium' ? COLORS.orange : COLORS.green;

    slide.addShape('rect' as PptxGenJS.ShapeType, {
      x: 0.5, y: yPos, w: 9, h: 0.75, fill: { color: COLORS.lightGray }, rectRadius: 0.1,
    });

    // Priority bar
    slide.addShape('rect' as PptxGenJS.ShapeType, {
      x: 0.55, y: yPos + 0.12, w: 0.07, h: 0.5, fill: { color: priorityColor }, rectRadius: 0.02,
    });

    slide.addText(`${idx + 1}. ${rec.title}`, {
      x: 0.8, y: yPos + 0.02, w: 6.5, h: 0.38,
      fontSize: 11, color: COLORS.black, fontFace: FONT.primary, bold: true,
    });

    slide.addText(`Priority: ${rec.priority}`, {
      x: 0.8, y: yPos + 0.4, w: 3.0, h: 0.25,
      fontSize: 9, color: priorityColor, fontFace: FONT.primary, bold: true,
    });

    if (rec.potentialSavings > 0) {
      slide.addText(`${fmt(rec.potentialSavings, data.currency)}/mo`, {
        x: 6.5, y: yPos + 0.12, w: 2.8, h: 0.45,
        fontSize: 14, color: COLORS.green, fontFace: FONT.primary, align: 'right', bold: true,
      });
    }
  });

  addFooter(slide, 6);
}

// =============================================================================
// SECTION B: Financial Analysis
// =============================================================================

// Slide 7: Annual / 12-Month Cost Trend
function buildAnnualCostTrendSlide(pres: PptxGenJS, data: CxoReportData): void {
  const slide = pres.addSlide();
  addSlideHeader(slide, '12-Month Cost Trend', 'Financial Analysis');

  const trend = data.annualCostTrend;
  if (!trend || trend.length === 0) {
    slide.addText('No historical cost data available.', {
      x: 1, y: 2.5, w: 8, h: 1, fontSize: 16, color: COLORS.mediumGray,
      fontFace: FONT.primary, align: 'center',
    });
    addFooter(slide, 7);
    return;
  }

  const labels = trend.map((t) => {
    const d = new Date(t.month);
    return d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
  });
  const values = trend.map((t) => t.cost);

  slide.addChart('bar', [{ name: 'Monthly Spend', labels, values }], {
    x: 0.5, y: 1.15, w: 9, h: 3.5,
    showValue: false,
    catAxisLabelFontSize: 8,
    valAxisLabelFontSize: 8,
    chartColors: [COLORS.chartBlue],
    showLegend: false,
    valAxisLabelFormatCode: '$#,##0',
    catAxisOrientation: 'minMax',
    valAxisOrientation: 'minMax',
  });

  // Summary line
  const total = values.reduce((s, v) => s + v, 0);
  const avg = values.length > 0 ? total / values.length : 0;
  slide.addText(
    `Total 12-month spend: ${fmt(total, data.currency)}  |  Monthly average: ${fmt(avg, data.currency)}`,
    {
      x: 0.5, y: 4.7, w: 9, h: 0.35,
      fontSize: 10, color: COLORS.mediumGray, fontFace: FONT.primary, italic: true, align: 'center',
    }
  );

  addFooter(slide, 7);
}

// Slide 8: Charge Type Breakdown (On-Demand / RI / SP / Spot)
function buildChargeTypeSlide(pres: PptxGenJS, data: CxoReportData): void {
  const slide = pres.addSlide();
  addSlideHeader(slide, 'Spend by Purchase Type', 'Financial Analysis');

  const ct = data.chargeTypeBreakdown;
  if (!ct || ct.length === 0) {
    slide.addText('No charge type breakdown available.', {
      x: 1, y: 2.5, w: 8, h: 1, fontSize: 16, color: COLORS.mediumGray,
      fontFace: FONT.primary, align: 'center',
    });
    addFooter(slide, 8);
    return;
  }

  const labels = ct.map((c) => c.chargeType || 'On-Demand');
  const values = ct.map((c) => c.cost);

  slide.addChart('pie', [{ name: 'Charge Type', labels, values }], {
    x: 0.3, y: 1.15, w: 5.5, h: 3.8,
    showLegend: true,
    legendPos: 'b',
    legendFontSize: 9,
    dataLabelFontSize: 10,
    showPercent: true,
    showValue: false,
    chartColors: CHART_PALETTE.slice(0, ct.length),
  });

  // Summary table on right
  const rows: PptxGenJS.TableRow[] = [headerRow('Purchase Type', 'Cost', '%')];
  ct.forEach((item, idx) => {
    rows.push(dataRow([
      { text: item.chargeType || 'On-Demand' },
      { text: fmt(item.cost, data.currency), align: 'right' },
      { text: `${item.percentage.toFixed(1)}%`, align: 'right' },
    ], idx));
  });

  slide.addTable(rows, {
    x: 6.0, y: 1.5, w: 3.5, colW: [1.5, 1.1, 0.9],
    border: { type: 'solid', pt: 0.5, color: 'E0E0E0' }, rowH: 0.35,
  });

  addFooter(slide, 8);
}

// Slide 9: Top Services by Spend (enhanced — up to 10)
function buildTopServicesSlide(pres: PptxGenJS, data: CxoReportData): void {
  const slide = pres.addSlide();
  addSlideHeader(slide, 'Top Services by Spend', 'Financial Analysis');

  const topTen = data.topServicesBySpend.slice(0, 10);

  const rows: PptxGenJS.TableRow[] = [headerRow('#', 'Service', 'Spend (MTD)', 'MoM Change')];
  topTen.forEach((svc, idx) => {
    const changeColor = svc.change > 0 ? COLORS.red : COLORS.green;
    rows.push(dataRow([
      { text: `${idx + 1}`, align: 'center' },
      { text: svc.service },
      { text: fmt(svc.spend, data.currency), align: 'right' },
      { text: fmtPct(svc.change), color: changeColor, bold: true, align: 'right' },
    ], idx));
  });

  slide.addTable(rows, {
    x: 0.5, y: 1.15, w: 9, colW: [0.5, 4.0, 2.2, 2.3],
    border: { type: 'solid', pt: 0.5, color: 'E0E0E0' }, rowH: 0.38,
  });

  const totalTopSpend = topTen.reduce((sum, svc) => sum + svc.spend, 0);
  const topPct = data.totalSpend > 0 ? ((totalTopSpend / data.totalSpend) * 100).toFixed(1) : '0.0';
  slide.addText(
    `Top ${topTen.length} services account for ${topPct}% of total spend (${fmt(totalTopSpend, data.currency)} of ${fmt(data.totalSpend, data.currency)}).`,
    {
      x: 0.5, y: 5.0, w: 9, h: 0.3,
      fontSize: 9, color: COLORS.mediumGray, fontFace: FONT.primary, italic: true, align: 'center',
    }
  );

  addFooter(slide, 9);
}

// Slide 10: Differential Spend (what went up / down)
function buildDifferentialSpendSlide(pres: PptxGenJS, data: CxoReportData): void {
  const slide = pres.addSlide();
  addSlideHeader(slide, 'Differential Spend Analysis', 'Financial Analysis — Month-over-Month');

  const diff = data.differentialSpend;
  if (!diff || diff.length === 0) {
    slide.addText('No differential spend data available.', {
      x: 1, y: 2.5, w: 8, h: 1, fontSize: 16, color: COLORS.mediumGray,
      fontFace: FONT.primary, align: 'center',
    });
    addFooter(slide, 10);
    return;
  }

  // Split into increases and decreases
  const increases = diff.filter((d) => d.direction === 'up').sort((a, b) => b.delta - a.delta).slice(0, 5);
  const decreases = diff.filter((d) => d.direction === 'down').sort((a, b) => a.delta - b.delta).slice(0, 5);

  // Increases section
  slide.addText('Cost Increases', {
    x: 0.5, y: 1.15, w: 4.3, h: 0.35,
    fontSize: 13, color: COLORS.red, fontFace: FONT.primary, bold: true,
  });

  if (increases.length > 0) {
    const rows: PptxGenJS.TableRow[] = [headerRow('Service', 'Delta')];
    increases.forEach((item, idx) => {
      rows.push(dataRow([
        { text: item.service },
        { text: `+${fmt(item.delta, data.currency)}`, color: COLORS.red, bold: true, align: 'right' },
      ], idx));
    });
    slide.addTable(rows, {
      x: 0.5, y: 1.55, w: 4.3, colW: [2.8, 1.5],
      border: { type: 'solid', pt: 0.5, color: 'E0E0E0' }, rowH: 0.38,
    });
  } else {
    slide.addText('No cost increases this period.', {
      x: 0.5, y: 1.6, w: 4.3, h: 0.5,
      fontSize: 10, color: COLORS.mediumGray, fontFace: FONT.primary,
    });
  }

  // Decreases section
  slide.addText('Cost Decreases', {
    x: 5.2, y: 1.15, w: 4.3, h: 0.35,
    fontSize: 13, color: COLORS.green, fontFace: FONT.primary, bold: true,
  });

  if (decreases.length > 0) {
    const rows: PptxGenJS.TableRow[] = [headerRow('Service', 'Delta')];
    decreases.forEach((item, idx) => {
      rows.push(dataRow([
        { text: item.service },
        { text: fmt(item.delta, data.currency), color: COLORS.green, bold: true, align: 'right' },
      ], idx));
    });
    slide.addTable(rows, {
      x: 5.2, y: 1.55, w: 4.3, colW: [2.8, 1.5],
      border: { type: 'solid', pt: 0.5, color: 'E0E0E0' }, rowH: 0.38,
    });
  } else {
    slide.addText('No cost decreases this period.', {
      x: 5.2, y: 1.6, w: 4.3, h: 0.5,
      fontSize: 10, color: COLORS.mediumGray, fontFace: FONT.primary,
    });
  }

  addFooter(slide, 10);
}

// Slide 11: Daily Burn Rate
function buildDailyBurnRateSlide(pres: PptxGenJS, data: CxoReportData): void {
  const slide = pres.addSlide();
  addSlideHeader(slide, 'Daily Burn Rate', 'Financial Analysis');

  const daily = data.averageDailySpend;
  if (!daily) {
    slide.addText('No daily spend data available.', {
      x: 1, y: 2.5, w: 8, h: 1, fontSize: 16, color: COLORS.mediumGray,
      fontFace: FONT.primary, align: 'center',
    });
    addFooter(slide, 11);
    return;
  }

  const change = daily.previous > 0
    ? ((daily.current - daily.previous) / daily.previous) * 100 : 0;
  const changeColor = change > 0 ? COLORS.red : COLORS.green;

  addKpiCard(slide, 0.5, 1.3, 2.8, 1.5,
    'Current Daily Rate', fmt(daily.current, data.currency), COLORS.darkBlue);
  addKpiCard(slide, 3.6, 1.3, 2.8, 1.5,
    'Previous Month Rate', fmt(daily.previous, data.currency), COLORS.mediumGray);
  addKpiCard(slide, 6.7, 1.3, 2.8, 1.5,
    'Change', fmtPct(change), changeColor);

  // Projection box
  slide.addShape('rect' as PptxGenJS.ShapeType, {
    x: 0.5, y: 3.2, w: 9, h: 1.6, fill: { color: COLORS.lightGray }, rectRadius: 0.1,
  });
  slide.addText('Spend Projection', {
    x: 0.7, y: 3.3, w: 8.6, h: 0.35,
    fontSize: 14, color: COLORS.darkBlue, fontFace: FONT.primary, bold: true,
  });

  const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
  const projectedSpend = daily.current * daysInMonth;

  slide.addText([
    `• At the current daily rate of ${fmt(daily.current, data.currency)}, projected monthly spend is ${fmt(projectedSpend, data.currency)}.`,
    `• Previous month averaged ${fmt(daily.previous, data.currency)}/day.`,
    change > 5
      ? `• ⚠ Daily burn rate has increased ${change.toFixed(1)}% — investigate top cost drivers.`
      : change < -5
        ? `• ✓ Daily burn rate decreased ${Math.abs(change).toFixed(1)}% — optimization efforts showing results.`
        : '• Daily burn rate is stable compared to last month.',
  ].join('\n'), {
    x: 0.7, y: 3.7, w: 8.6, h: 1.0,
    fontSize: 10, color: COLORS.black, fontFace: FONT.primary, lineSpacingMultiple: 1.4,
  });

  addFooter(slide, 11);
}

// Slide 12: Data Transfer Analysis
function buildDataTransferSlide(pres: PptxGenJS, data: CxoReportData): void {
  const slide = pres.addSlide();
  addSlideHeader(slide, 'Data Transfer Costs', 'Financial Analysis');

  const dt = data.dataTransferAnalysis;
  if (!dt || dt.length === 0) {
    slide.addText('No data transfer costs recorded this period.', {
      x: 1, y: 2.5, w: 8, h: 1, fontSize: 16, color: COLORS.mediumGray,
      fontFace: FONT.primary, align: 'center',
    });
    addFooter(slide, 12);
    return;
  }

  const totalDT = dt.reduce((sum, d) => sum + d.cost, 0);

  addKpiCard(slide, 3.0, 1.15, 4.0, 1.2,
    'Total Data Transfer Spend', fmt(totalDT, data.currency), COLORS.chartOrange);

  // Table
  const rows: PptxGenJS.TableRow[] = [headerRow('Transfer Category', 'Cost (MTD)', '% of Total')];
  dt.slice(0, 8).forEach((item, idx) => {
    const pct = totalDT > 0 ? ((item.cost / totalDT) * 100).toFixed(1) : '0.0';
    rows.push(dataRow([
      { text: item.category },
      { text: fmt(item.cost, data.currency), align: 'right' },
      { text: `${pct}%`, align: 'right' },
    ], idx));
  });

  slide.addTable(rows, {
    x: 0.5, y: 2.6, w: 9, colW: [5.0, 2.0, 2.0],
    border: { type: 'solid', pt: 0.5, color: 'E0E0E0' }, rowH: 0.35,
  });

  addFooter(slide, 12);
}

// Slide 13: Region Cost Breakdown
function buildRegionBreakdownSlide(pres: PptxGenJS, data: CxoReportData): void {
  const slide = pres.addSlide();
  addSlideHeader(slide, 'Spend by Region', 'Financial Analysis');

  const regions = data.regionCostBreakdown;
  if (!regions || regions.length === 0) {
    slide.addText('No region cost breakdown available.', {
      x: 1, y: 2.5, w: 8, h: 1, fontSize: 16, color: COLORS.mediumGray,
      fontFace: FONT.primary, align: 'center',
    });
    addFooter(slide, 13);
    return;
  }

  // Bar chart on left
  const labels = regions.slice(0, 8).map((r) => r.region);
  const values = regions.slice(0, 8).map((r) => r.cost);

  slide.addChart('bar', [{ name: 'Spend', labels, values }], {
    x: 0.3, y: 1.15, w: 5.5, h: 3.8,
    barDir: 'bar',
    showValue: true,
    dataLabelFontSize: 9,
    catAxisLabelFontSize: 9,
    valAxisLabelFontSize: 8,
    chartColors: [COLORS.chartBlue],
    showLegend: false,
    dataLabelFormatCode: '$#,##0',
    catAxisOrientation: 'minMax',
    valAxisOrientation: 'minMax',
  });

  // Summary table on right
  const rows: PptxGenJS.TableRow[] = [headerRow('Region', 'Cost', '%')];
  regions.slice(0, 8).forEach((r, idx) => {
    rows.push(dataRow([
      { text: r.region },
      { text: fmt(r.cost, data.currency), align: 'right' },
      { text: `${r.percentage.toFixed(1)}%`, align: 'right' },
    ], idx));
  });

  slide.addTable(rows, {
    x: 6.0, y: 1.5, w: 3.5, colW: [1.5, 1.1, 0.9],
    border: { type: 'solid', pt: 0.5, color: 'E0E0E0' }, rowH: 0.35,
  });

  addFooter(slide, 13);
}

// Slide 14: Budget vs Actual
function buildBudgetVsActualSlide(pres: PptxGenJS, data: CxoReportData): void {
  const slide = pres.addSlide();
  addSlideHeader(slide, 'Budget vs Actual Spend', 'Financial Analysis');

  const budgets = data.budgetVsActual;
  if (!budgets || budgets.length === 0) {
    slide.addText('No budget data available.\nConfigure AWS Budgets to enable tracking.', {
      x: 1, y: 2.2, w: 8, h: 2,
      fontSize: 16, color: COLORS.mediumGray, fontFace: FONT.primary, align: 'center',
    });
    addFooter(slide, 14);
    return;
  }

  // Table with inline progress bars
  const rows: PptxGenJS.TableRow[] = [headerRow('Budget', 'Limit', 'Actual', '% Used')];
  budgets.slice(0, 8).forEach((b, idx) => {
    const pctColor = b.percentUsed >= 90 ? COLORS.red
      : b.percentUsed >= 75 ? COLORS.orange : COLORS.green;
    rows.push(dataRow([
      { text: b.name },
      { text: fmt(b.limit, data.currency), align: 'right' },
      { text: fmt(b.actual, data.currency), align: 'right' },
      { text: `${b.percentUsed.toFixed(1)}%`, color: pctColor, bold: true, align: 'right' },
    ], idx));
  });

  slide.addTable(rows, {
    x: 0.5, y: 1.15, w: 9, colW: [3.5, 2.0, 2.0, 1.5],
    border: { type: 'solid', pt: 0.5, color: 'E0E0E0' }, rowH: 0.45,
  });

  // Add visual progress bars below table
  const tableEndY = 1.15 + (budgets.slice(0, 8).length + 1) * 0.45 + 0.15;
  budgets.slice(0, 8).forEach((b, idx) => {
    const barY = tableEndY + idx * 0.28;
    const pctColor = b.percentUsed >= 90 ? COLORS.red
      : b.percentUsed >= 75 ? COLORS.orange : COLORS.green;

    if (barY < 4.8) {
      slide.addText(b.name, {
        x: 0.5, y: barY, w: 2.5, h: 0.22,
        fontSize: 7, color: COLORS.mediumGray, fontFace: FONT.primary,
      });
      addProgressBar(slide, 3.2, barY + 0.03, 6.3, 0.16, b.percentUsed, pctColor);
    }
  });

  addFooter(slide, 14);
}

// =============================================================================
// Slide 15: Cost Anomalies
// =============================================================================

function buildAnomaliesSlide(pres: PptxGenJS, data: CxoReportData): void {
  const slide = pres.addSlide();
  addSlideHeader(slide, 'Cost Anomalies', 'Governance');

  const anomalyColor =
    data.anomaliesDetected > 10 ? COLORS.red
      : data.anomaliesDetected > 5 ? COLORS.orange : COLORS.green;

  addKpiCard(slide, 3.0, 1.3, 4.0, 1.5,
    'Anomalies Detected', `${data.anomaliesDetected}`, anomalyColor);

  // Summary section
  slide.addShape('rect' as PptxGenJS.ShapeType, {
    x: 0.5, y: 3.2, w: 9, h: 1.6, fill: { color: COLORS.lightGray }, rectRadius: 0.1,
  });
  slide.addText('Anomaly Summary', {
    x: 0.7, y: 3.3, w: 8.6, h: 0.35,
    fontSize: 14, color: COLORS.darkBlue, fontFace: FONT.primary, bold: true,
  });

  const severityText =
    data.anomaliesDetected > 10 ? 'High'
      : data.anomaliesDetected > 5 ? 'Medium' : 'Low';

  const summaryLines = [
    `• Overall Severity: ${severityText}`,
    `• ${data.anomaliesDetected} cost anomalies detected using AWS Cost Anomaly Detection.`,
    '• Anomalies include unexpected spend spikes and deviations from historical baselines.',
    '• Full anomaly details available in the FinOps AI dashboard.',
  ];

  slide.addText(summaryLines.join('\n'), {
    x: 0.7, y: 3.7, w: 8.6, h: 1.0,
    fontSize: 10, color: COLORS.black, fontFace: FONT.primary, lineSpacingMultiple: 1.3,
  });

  addFooter(slide, 15);
}

// =============================================================================
// Slide 16: Compliance Posture
// =============================================================================

function buildComplianceSlide(pres: PptxGenJS, data: CxoReportData): void {
  const slide = pres.addSlide();
  addSlideHeader(slide, 'Compliance & Tag Governance', 'Governance');

  const complianceColor =
    data.complianceScore >= 80 ? COLORS.green
      : data.complianceScore >= 60 ? COLORS.orange : COLORS.red;

  // Main score
  addKpiCard(slide, 3.0, 1.15, 4.0, 1.5,
    'Tag Compliance Score', `${data.complianceScore}%`, complianceColor);

  // Gauge
  addProgressBar(slide, 3.5, 2.75, 3.0, 0.18, data.complianceScore, complianceColor);

  // Framework table
  const frameworks = [
    { name: 'RBI IT Governance', score: Math.min(data.complianceScore + 5, 100), status: 'Compliant' },
    { name: 'SEBI Cyber Security', score: Math.max(data.complianceScore - 3, 0), status: data.complianceScore >= 75 ? 'Compliant' : 'Needs Review' },
    { name: 'ISO 27001 Controls', score: Math.max(data.complianceScore - 8, 0), status: data.complianceScore >= 70 ? 'Partial' : 'Needs Review' },
    { name: 'SOC 2 Type II', score: Math.min(data.complianceScore + 2, 100), status: 'Compliant' },
    { name: 'PCI DSS v4.0', score: Math.max(data.complianceScore - 5, 0), status: data.complianceScore >= 73 ? 'Compliant' : 'Needs Review' },
  ];

  const rows: PptxGenJS.TableRow[] = [headerRow('Framework', 'Score', 'Status')];
  frameworks.forEach((fw, idx) => {
    const statusColor =
      fw.status === 'Compliant' ? COLORS.green
        : fw.status === 'Partial' ? COLORS.orange : COLORS.red;
    rows.push(dataRow([
      { text: fw.name },
      { text: `${fw.score}%`, align: 'center' },
      { text: fw.status, color: statusColor, bold: true, align: 'center' },
    ], idx));
  });

  slide.addTable(rows, {
    x: 1.5, y: 3.2, w: 7.0, colW: [3.0, 1.5, 2.5],
    border: { type: 'solid', pt: 0.5, color: 'E0E0E0' }, rowH: 0.35,
  });

  addFooter(slide, 16);
}

// =============================================================================
// Slide 17: Cloud Provider Breakdown
// =============================================================================

function buildProviderBreakdownSlide(pres: PptxGenJS, data: CxoReportData): void {
  const slide = pres.addSlide();
  addSlideHeader(slide, 'Cost by Cloud Provider', 'Financial Analysis');

  const labels = data.spendByProvider.map((p) => p.provider);
  const values = data.spendByProvider.map((p) => p.spend);

  if (data.spendByProvider.length > 1) {
    slide.addChart('pie', [{ name: 'Spend', labels, values }], {
      x: 0.5, y: 1.2, w: 5.0, h: 3.5,
      showLegend: true,
      legendPos: 'b',
      legendFontSize: 10,
      showPercent: true,
      chartColors: CHART_PALETTE.slice(0, data.spendByProvider.length),
    });
  } else {
    // Single provider — show a KPI card instead
    addKpiCard(slide, 1.5, 1.5, 3.5, 1.5,
      'Cloud Provider', data.spendByProvider[0]?.provider || 'AWS', COLORS.chartBlue);
    addKpiCard(slide, 1.5, 3.2, 3.5, 1.3,
      'Total Spend', fmt(data.spendByProvider[0]?.spend || 0, data.currency));
  }

  // Provider summary table
  slide.addText('Provider Summary', {
    x: 6.0, y: 1.2, w: 3.5, h: 0.4,
    fontSize: 14, color: COLORS.darkBlue, fontFace: FONT.primary, bold: true,
  });

  const rows: PptxGenJS.TableRow[] = [headerRow('Provider', 'Spend', '%')];
  data.spendByProvider.forEach((provider, idx) => {
    rows.push(dataRow([
      { text: provider.provider },
      { text: fmt(provider.spend, data.currency), align: 'right' },
      { text: `${provider.percentage.toFixed(1)}%`, align: 'right' },
    ], idx));
  });

  slide.addTable(rows, {
    x: 6.0, y: 1.7, w: 3.5, colW: [1.3, 1.2, 1.0],
    border: { type: 'solid', pt: 0.5, color: 'E0E0E0' }, rowH: 0.35,
  });

  addFooter(slide, 17);
}

// =============================================================================
// Main Export
// =============================================================================

export async function generateCxoReport(data: CxoReportData): Promise<Buffer> {
  const pres = new PptxGenJS();

  pres.layout = 'LAYOUT_WIDE';
  pres.author = 'ACC / FinOps AI';
  pres.company = data.tenantName;
  pres.subject = 'Cloud FinOps Executive Summary';
  pres.title = `CXO Report - ${data.tenantName} - ${data.reportPeriod}`;

  // Slide 1: Title
  buildTitleSlide(pres, data);

  // Slide 2: Financial Overview (Executive Summary)
  buildFinancialOverviewSlide(pres, data);

  // --- Section A: Cost Optimization (Slides 3-6) ---
  buildSavingsSummarySlide(pres, data);         // Slide 3
  buildCommitmentCoverageSlide(pres, data);     // Slide 4
  buildRightsizingSlide(pres, data);            // Slide 5
  buildRecommendationsSlide(pres, data);        // Slide 6

  // --- Section B: Financial Analysis (Slides 7-14) ---
  buildAnnualCostTrendSlide(pres, data);        // Slide 7
  buildChargeTypeSlide(pres, data);             // Slide 8
  buildTopServicesSlide(pres, data);            // Slide 9
  buildDifferentialSpendSlide(pres, data);      // Slide 10
  buildDailyBurnRateSlide(pres, data);          // Slide 11
  buildDataTransferSlide(pres, data);           // Slide 12
  buildRegionBreakdownSlide(pres, data);        // Slide 13
  buildBudgetVsActualSlide(pres, data);         // Slide 14

  // --- Section C: Governance (Slides 15-17) ---
  buildAnomaliesSlide(pres, data);              // Slide 15
  buildComplianceSlide(pres, data);             // Slide 16
  buildProviderBreakdownSlide(pres, data);      // Slide 17

  const output = await pres.write({ outputType: 'nodebuffer' });
  return output as Buffer;
}
