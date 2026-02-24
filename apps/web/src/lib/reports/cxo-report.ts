import PptxGenJS from 'pptxgenjs';
import type { CxoReportData } from './types';

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
} as const;

const FONT = {
  primary: 'Arial',
} as const;

function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatPercent(value: number): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
}

function addFooter(slide: PptxGenJS.Slide): void {
  slide.addText('ACC / FinOps AI  |  Confidential', {
    x: 0.5,
    y: 5.2,
    w: 9,
    h: 0.3,
    fontSize: 8,
    color: COLORS.mediumGray,
    fontFace: FONT.primary,
    align: 'center',
  });
}

function addSlideHeader(slide: PptxGenJS.Slide, title: string): void {
  slide.addShape('rect' as PptxGenJS.ShapeType, {
    x: 0,
    y: 0,
    w: 10,
    h: 0.9,
    fill: { color: COLORS.darkBlue },
  });

  slide.addText(title, {
    x: 0.5,
    y: 0.15,
    w: 9,
    h: 0.6,
    fontSize: 22,
    color: COLORS.white,
    fontFace: FONT.primary,
    bold: true,
  });
}

function buildTitleSlide(pres: PptxGenJS, data: CxoReportData): void {
  const slide = pres.addSlide();

  slide.addShape('rect' as PptxGenJS.ShapeType, {
    x: 0,
    y: 0,
    w: 10,
    h: 5.63,
    fill: { color: COLORS.darkBlue },
  });

  slide.addText('Cloud FinOps\nExecutive Summary', {
    x: 1,
    y: 0.8,
    w: 8,
    h: 2,
    fontSize: 36,
    color: COLORS.white,
    fontFace: FONT.primary,
    bold: true,
    align: 'center',
    lineSpacingMultiple: 1.2,
  });

  slide.addShape('rect' as PptxGenJS.ShapeType, {
    x: 3,
    y: 2.9,
    w: 4,
    h: 0.04,
    fill: { color: COLORS.lightBlue },
  });

  slide.addText(data.tenantName, {
    x: 1,
    y: 3.2,
    w: 8,
    h: 0.6,
    fontSize: 20,
    color: COLORS.lightBlue,
    fontFace: FONT.primary,
    align: 'center',
  });

  slide.addText(`Reporting Period: ${data.reportPeriod}`, {
    x: 1,
    y: 3.9,
    w: 8,
    h: 0.4,
    fontSize: 14,
    color: COLORS.mediumGray,
    fontFace: FONT.primary,
    align: 'center',
  });

  slide.addText(`Generated: ${data.generatedAt}`, {
    x: 1,
    y: 4.3,
    w: 8,
    h: 0.4,
    fontSize: 12,
    color: COLORS.mediumGray,
    fontFace: FONT.primary,
    align: 'center',
  });

  slide.addText('ACC / FinOps AI  |  Confidential', {
    x: 0.5,
    y: 5.0,
    w: 9,
    h: 0.3,
    fontSize: 8,
    color: COLORS.mediumGray,
    fontFace: FONT.primary,
    align: 'center',
  });
}

function buildFinancialOverviewSlide(
  pres: PptxGenJS,
  data: CxoReportData
): void {
  const slide = pres.addSlide();
  addSlideHeader(slide, 'Financial Overview');

  const momChange =
    ((data.totalSpend - data.previousPeriodSpend) / data.previousPeriodSpend) *
    100;
  const momColor = momChange > 0 ? COLORS.red : COLORS.green;

  // Total Spend card
  slide.addShape('rect' as PptxGenJS.ShapeType, {
    x: 0.5,
    y: 1.2,
    w: 2.8,
    h: 1.6,
    fill: { color: COLORS.lightGray },
    rectRadius: 0.1,
  });

  slide.addText('Total Cloud Spend', {
    x: 0.5,
    y: 1.3,
    w: 2.8,
    h: 0.4,
    fontSize: 11,
    color: COLORS.mediumGray,
    fontFace: FONT.primary,
    align: 'center',
    bold: true,
  });

  slide.addText(formatCurrency(data.totalSpend, data.currency), {
    x: 0.5,
    y: 1.7,
    w: 2.8,
    h: 0.6,
    fontSize: 28,
    color: COLORS.darkBlue,
    fontFace: FONT.primary,
    align: 'center',
    bold: true,
  });

  slide.addText(`Previous: ${formatCurrency(data.previousPeriodSpend, data.currency)}`, {
    x: 0.5,
    y: 2.3,
    w: 2.8,
    h: 0.3,
    fontSize: 10,
    color: COLORS.mediumGray,
    fontFace: FONT.primary,
    align: 'center',
  });

  // MoM Change card
  slide.addShape('rect' as PptxGenJS.ShapeType, {
    x: 3.6,
    y: 1.2,
    w: 2.8,
    h: 1.6,
    fill: { color: COLORS.lightGray },
    rectRadius: 0.1,
  });

  slide.addText('Month-over-Month Change', {
    x: 3.6,
    y: 1.3,
    w: 2.8,
    h: 0.4,
    fontSize: 11,
    color: COLORS.mediumGray,
    fontFace: FONT.primary,
    align: 'center',
    bold: true,
  });

  slide.addText(formatPercent(momChange), {
    x: 3.6,
    y: 1.7,
    w: 2.8,
    h: 0.6,
    fontSize: 28,
    color: momColor,
    fontFace: FONT.primary,
    align: 'center',
    bold: true,
  });

  slide.addText(
    momChange > 0 ? 'Cost increase detected' : 'Cost reduction achieved',
    {
      x: 3.6,
      y: 2.3,
      w: 2.8,
      h: 0.3,
      fontSize: 10,
      color: COLORS.mediumGray,
      fontFace: FONT.primary,
      align: 'center',
    }
  );

  // Budget Utilization card
  slide.addShape('rect' as PptxGenJS.ShapeType, {
    x: 6.7,
    y: 1.2,
    w: 2.8,
    h: 1.6,
    fill: { color: COLORS.lightGray },
    rectRadius: 0.1,
  });

  slide.addText('Budget Utilization', {
    x: 6.7,
    y: 1.3,
    w: 2.8,
    h: 0.4,
    fontSize: 11,
    color: COLORS.mediumGray,
    fontFace: FONT.primary,
    align: 'center',
    bold: true,
  });

  const budgetColor =
    data.budgetUtilization > 90
      ? COLORS.red
      : data.budgetUtilization > 75
        ? COLORS.orange
        : COLORS.green;

  slide.addText(`${data.budgetUtilization}%`, {
    x: 6.7,
    y: 1.7,
    w: 2.8,
    h: 0.6,
    fontSize: 28,
    color: budgetColor,
    fontFace: FONT.primary,
    align: 'center',
    bold: true,
  });

  // Budget gauge bar background
  slide.addShape('rect' as PptxGenJS.ShapeType, {
    x: 7.1,
    y: 2.4,
    w: 2.0,
    h: 0.15,
    fill: { color: 'E0E0E0' },
    rectRadius: 0.05,
  });

  // Budget gauge bar fill
  const gaugeWidth = Math.min((data.budgetUtilization / 100) * 2.0, 2.0);
  slide.addShape('rect' as PptxGenJS.ShapeType, {
    x: 7.1,
    y: 2.4,
    w: gaugeWidth,
    h: 0.15,
    fill: { color: budgetColor },
    rectRadius: 0.05,
  });

  // Spend trend summary
  slide.addShape('rect' as PptxGenJS.ShapeType, {
    x: 0.5,
    y: 3.2,
    w: 9,
    h: 1.6,
    fill: { color: COLORS.lightGray },
    rectRadius: 0.1,
  });

  slide.addText('Key Financial Insights', {
    x: 0.7,
    y: 3.3,
    w: 8.6,
    h: 0.4,
    fontSize: 14,
    color: COLORS.darkBlue,
    fontFace: FONT.primary,
    bold: true,
  });

  const delta = data.totalSpend - data.previousPeriodSpend;
  const deltaStr = formatCurrency(Math.abs(delta), data.currency);
  const direction = delta > 0 ? 'increased' : 'decreased';

  const insights = [
    `Cloud spend ${direction} by ${deltaStr} (${formatPercent(momChange)}) compared to the previous period.`,
    `Budget utilization is at ${data.budgetUtilization}% — ${data.budgetUtilization > 90 ? 'approaching limit, immediate review required' : data.budgetUtilization > 75 ? 'monitoring recommended' : 'within healthy range'}.`,
    `${data.anomaliesDetected} cost anomalies detected this period requiring investigation.`,
  ];

  slide.addText(insights.join('\n\n'), {
    x: 0.7,
    y: 3.7,
    w: 8.6,
    h: 1.0,
    fontSize: 10,
    color: COLORS.black,
    fontFace: FONT.primary,
    lineSpacingMultiple: 1.3,
  });

  addFooter(slide);
}

function buildProviderBreakdownSlide(
  pres: PptxGenJS,
  data: CxoReportData
): void {
  const slide = pres.addSlide();
  addSlideHeader(slide, 'Cost by Cloud Provider');

  const chartColors = [
    COLORS.chartBlue,
    COLORS.chartOrange,
    COLORS.chartGreen,
    COLORS.chartPurple,
  ];

  const labels = data.spendByProvider.map((p) => p.provider);
  const values = data.spendByProvider.map((p) => p.spend);

  slide.addChart('bar', [
    {
      name: 'Spend',
      labels,
      values,
    },
  ], {
    x: 0.5,
    y: 1.2,
    w: 5.5,
    h: 3.5,
    barDir: 'bar',
    showValue: true,
    dataLabelFontSize: 10,
    catAxisLabelFontSize: 11,
    valAxisLabelFontSize: 9,
    chartColors: chartColors.slice(0, data.spendByProvider.length),
    showLegend: false,
    catAxisOrientation: 'minMax',
    valAxisOrientation: 'minMax',
    dataLabelFormatCode: '$#,##0',
  });

  // Provider summary table on the right
  slide.addText('Provider Summary', {
    x: 6.3,
    y: 1.2,
    w: 3.2,
    h: 0.4,
    fontSize: 14,
    color: COLORS.darkBlue,
    fontFace: FONT.primary,
    bold: true,
  });

  const tableRows: PptxGenJS.TableRow[] = [
    [
      {
        text: 'Provider',
        options: {
          bold: true,
          fontSize: 10,
          color: COLORS.white,
          fill: { color: COLORS.darkBlue },
          align: 'left',
        },
      },
      {
        text: 'Spend',
        options: {
          bold: true,
          fontSize: 10,
          color: COLORS.white,
          fill: { color: COLORS.darkBlue },
          align: 'right',
        },
      },
      {
        text: '%',
        options: {
          bold: true,
          fontSize: 10,
          color: COLORS.white,
          fill: { color: COLORS.darkBlue },
          align: 'right',
        },
      },
    ],
  ];

  for (const provider of data.spendByProvider) {
    tableRows.push([
      {
        text: provider.provider,
        options: { fontSize: 10, color: COLORS.black, align: 'left' },
      },
      {
        text: formatCurrency(provider.spend, data.currency),
        options: { fontSize: 10, color: COLORS.black, align: 'right' },
      },
      {
        text: `${provider.percentage.toFixed(1)}%`,
        options: { fontSize: 10, color: COLORS.black, align: 'right' },
      },
    ]);
  }

  slide.addTable(tableRows, {
    x: 6.3,
    y: 1.7,
    w: 3.2,
    colW: [1.3, 1.1, 0.8],
    border: { type: 'solid', pt: 0.5, color: 'E0E0E0' },
    rowH: 0.35,
  });

  addFooter(slide);
}

function buildTopServicesSlide(pres: PptxGenJS, data: CxoReportData): void {
  const slide = pres.addSlide();
  addSlideHeader(slide, 'Top Services by Spend');

  const topFive = data.topServicesBySpend.slice(0, 5);

  const tableRows: PptxGenJS.TableRow[] = [
    [
      {
        text: '#',
        options: {
          bold: true,
          fontSize: 11,
          color: COLORS.white,
          fill: { color: COLORS.darkBlue },
          align: 'center',
        },
      },
      {
        text: 'Service',
        options: {
          bold: true,
          fontSize: 11,
          color: COLORS.white,
          fill: { color: COLORS.darkBlue },
          align: 'left',
        },
      },
      {
        text: 'Spend',
        options: {
          bold: true,
          fontSize: 11,
          color: COLORS.white,
          fill: { color: COLORS.darkBlue },
          align: 'right',
        },
      },
      {
        text: 'Change',
        options: {
          bold: true,
          fontSize: 11,
          color: COLORS.white,
          fill: { color: COLORS.darkBlue },
          align: 'right',
        },
      },
    ],
  ];

  topFive.forEach((svc, idx) => {
    const changeColor = svc.change > 0 ? COLORS.red : COLORS.green;
    const rowFill = idx % 2 === 0 ? COLORS.lightGray : COLORS.white;

    tableRows.push([
      {
        text: `${idx + 1}`,
        options: {
          fontSize: 11,
          color: COLORS.black,
          align: 'center',
          fill: { color: rowFill },
        },
      },
      {
        text: svc.service,
        options: {
          fontSize: 11,
          color: COLORS.black,
          align: 'left',
          fill: { color: rowFill },
        },
      },
      {
        text: formatCurrency(svc.spend, data.currency),
        options: {
          fontSize: 11,
          color: COLORS.black,
          align: 'right',
          fill: { color: rowFill },
        },
      },
      {
        text: formatPercent(svc.change),
        options: {
          fontSize: 11,
          color: changeColor,
          align: 'right',
          bold: true,
          fill: { color: rowFill },
        },
      },
    ]);
  });

  slide.addTable(tableRows, {
    x: 0.8,
    y: 1.3,
    w: 8.4,
    colW: [0.6, 3.8, 2.0, 2.0],
    border: { type: 'solid', pt: 0.5, color: 'E0E0E0' },
    rowH: 0.5,
  });

  // Summary note
  const totalTopSpend = topFive.reduce((sum, svc) => sum + svc.spend, 0);
  const topPercent = ((totalTopSpend / data.totalSpend) * 100).toFixed(1);

  slide.addText(
    `Top 5 services account for ${topPercent}% of total cloud spend (${formatCurrency(totalTopSpend, data.currency)} of ${formatCurrency(data.totalSpend, data.currency)}).`,
    {
      x: 0.8,
      y: 4.2,
      w: 8.4,
      h: 0.4,
      fontSize: 11,
      color: COLORS.mediumGray,
      fontFace: FONT.primary,
      italic: true,
    }
  );

  addFooter(slide);
}

function buildAnomaliesSlide(pres: PptxGenJS, data: CxoReportData): void {
  const slide = pres.addSlide();
  addSlideHeader(slide, 'Cost Anomalies');

  // Anomaly count highlight
  slide.addShape('rect' as PptxGenJS.ShapeType, {
    x: 3.0,
    y: 1.3,
    w: 4.0,
    h: 1.6,
    fill: { color: COLORS.lightGray },
    rectRadius: 0.1,
  });

  slide.addText('Anomalies Detected', {
    x: 3.0,
    y: 1.4,
    w: 4.0,
    h: 0.4,
    fontSize: 13,
    color: COLORS.mediumGray,
    fontFace: FONT.primary,
    align: 'center',
    bold: true,
  });

  const anomalyColor =
    data.anomaliesDetected > 10
      ? COLORS.red
      : data.anomaliesDetected > 5
        ? COLORS.orange
        : COLORS.green;

  slide.addText(`${data.anomaliesDetected}`, {
    x: 3.0,
    y: 1.8,
    w: 4.0,
    h: 0.8,
    fontSize: 48,
    color: anomalyColor,
    fontFace: FONT.primary,
    align: 'center',
    bold: true,
  });

  // Summary section
  slide.addShape('rect' as PptxGenJS.ShapeType, {
    x: 0.5,
    y: 3.2,
    w: 9,
    h: 1.8,
    fill: { color: COLORS.lightGray },
    rectRadius: 0.1,
  });

  slide.addText('Anomaly Summary', {
    x: 0.7,
    y: 3.3,
    w: 8.6,
    h: 0.4,
    fontSize: 14,
    color: COLORS.darkBlue,
    fontFace: FONT.primary,
    bold: true,
  });

  const severityText =
    data.anomaliesDetected > 10
      ? 'High'
      : data.anomaliesDetected > 5
        ? 'Medium'
        : 'Low';

  const summaryLines = [
    `Overall Severity: ${severityText}`,
    `${data.anomaliesDetected} cost anomalies were detected during the reporting period using statistical analysis and ML-based detection.`,
    'Anomalies include unexpected spend spikes, unusual resource provisioning patterns, and deviations from historical baselines.',
    'Detailed anomaly breakdown with root cause analysis is available in the full FinOps dashboard.',
  ];

  slide.addText(summaryLines.join('\n\n'), {
    x: 0.7,
    y: 3.75,
    w: 8.6,
    h: 1.15,
    fontSize: 10,
    color: COLORS.black,
    fontFace: FONT.primary,
    lineSpacingMultiple: 1.2,
  });

  addFooter(slide);
}

function buildComplianceSlide(pres: PptxGenJS, data: CxoReportData): void {
  const slide = pres.addSlide();
  addSlideHeader(slide, 'Compliance Posture');

  // Overall score
  slide.addShape('rect' as PptxGenJS.ShapeType, {
    x: 3.0,
    y: 1.3,
    w: 4.0,
    h: 1.8,
    fill: { color: COLORS.lightGray },
    rectRadius: 0.1,
  });

  slide.addText('Overall Compliance Score', {
    x: 3.0,
    y: 1.4,
    w: 4.0,
    h: 0.4,
    fontSize: 13,
    color: COLORS.mediumGray,
    fontFace: FONT.primary,
    align: 'center',
    bold: true,
  });

  const complianceColor =
    data.complianceScore >= 80
      ? COLORS.green
      : data.complianceScore >= 60
        ? COLORS.orange
        : COLORS.red;

  slide.addText(`${data.complianceScore}%`, {
    x: 3.0,
    y: 1.8,
    w: 4.0,
    h: 0.8,
    fontSize: 48,
    color: complianceColor,
    fontFace: FONT.primary,
    align: 'center',
    bold: true,
  });

  // Score gauge bar
  slide.addShape('rect' as PptxGenJS.ShapeType, {
    x: 3.5,
    y: 2.7,
    w: 3.0,
    h: 0.15,
    fill: { color: 'E0E0E0' },
    rectRadius: 0.05,
  });

  const compGaugeWidth = Math.min((data.complianceScore / 100) * 3.0, 3.0);
  slide.addShape('rect' as PptxGenJS.ShapeType, {
    x: 3.5,
    y: 2.7,
    w: compGaugeWidth,
    h: 0.15,
    fill: { color: complianceColor },
    rectRadius: 0.05,
  });

  // Framework breakdown table
  const frameworks = [
    { name: 'RBI IT Governance', score: Math.min(data.complianceScore + 5, 100), status: 'Compliant' },
    { name: 'SEBI Cyber Security', score: Math.max(data.complianceScore - 3, 0), status: data.complianceScore >= 75 ? 'Compliant' : 'Needs Review' },
    { name: 'ISO 27001 Controls', score: Math.max(data.complianceScore - 8, 0), status: data.complianceScore >= 70 ? 'Partial' : 'Needs Review' },
    { name: 'SOC 2 Type II', score: Math.max(data.complianceScore + 2, 0), status: 'Compliant' },
    { name: 'PCI DSS v4.0', score: Math.max(data.complianceScore - 5, 0), status: data.complianceScore >= 73 ? 'Compliant' : 'Needs Review' },
  ];

  const fwTableRows: PptxGenJS.TableRow[] = [
    [
      {
        text: 'Framework',
        options: {
          bold: true,
          fontSize: 10,
          color: COLORS.white,
          fill: { color: COLORS.darkBlue },
          align: 'left',
        },
      },
      {
        text: 'Score',
        options: {
          bold: true,
          fontSize: 10,
          color: COLORS.white,
          fill: { color: COLORS.darkBlue },
          align: 'center',
        },
      },
      {
        text: 'Status',
        options: {
          bold: true,
          fontSize: 10,
          color: COLORS.white,
          fill: { color: COLORS.darkBlue },
          align: 'center',
        },
      },
    ],
  ];

  frameworks.forEach((fw, idx) => {
    const rowFill = idx % 2 === 0 ? COLORS.lightGray : COLORS.white;
    const statusColor =
      fw.status === 'Compliant'
        ? COLORS.green
        : fw.status === 'Partial'
          ? COLORS.orange
          : COLORS.red;

    fwTableRows.push([
      {
        text: fw.name,
        options: {
          fontSize: 10,
          color: COLORS.black,
          align: 'left',
          fill: { color: rowFill },
        },
      },
      {
        text: `${fw.score}%`,
        options: {
          fontSize: 10,
          color: COLORS.black,
          align: 'center',
          fill: { color: rowFill },
        },
      },
      {
        text: fw.status,
        options: {
          fontSize: 10,
          color: statusColor,
          align: 'center',
          bold: true,
          fill: { color: rowFill },
        },
      },
    ]);
  });

  slide.addTable(fwTableRows, {
    x: 1.5,
    y: 3.2,
    w: 7.0,
    colW: [3.0, 1.5, 2.5],
    border: { type: 'solid', pt: 0.5, color: 'E0E0E0' },
    rowH: 0.35,
  });

  addFooter(slide);
}

function buildRecommendationsSlide(
  pres: PptxGenJS,
  data: CxoReportData
): void {
  const slide = pres.addSlide();
  addSlideHeader(slide, 'Optimization Recommendations');

  const topThree = data.recommendations.slice(0, 3);
  const totalSavings = topThree.reduce((sum, r) => sum + r.potentialSavings, 0);

  // Total savings highlight
  slide.addShape('rect' as PptxGenJS.ShapeType, {
    x: 0.5,
    y: 1.2,
    w: 9,
    h: 0.7,
    fill: { color: COLORS.darkBlue },
    rectRadius: 0.1,
  });

  slide.addText(
    `Total Potential Savings: ${formatCurrency(totalSavings, data.currency)}/month`,
    {
      x: 0.5,
      y: 1.2,
      w: 9,
      h: 0.7,
      fontSize: 18,
      color: COLORS.white,
      fontFace: FONT.primary,
      align: 'center',
      bold: true,
    }
  );

  // Recommendation cards
  topThree.forEach((rec, idx) => {
    const yPos = 2.2 + idx * 1.0;

    const priorityColor =
      rec.priority === 'High' || rec.priority === 'Critical'
        ? COLORS.red
        : rec.priority === 'Medium'
          ? COLORS.orange
          : COLORS.green;

    slide.addShape('rect' as PptxGenJS.ShapeType, {
      x: 0.5,
      y: yPos,
      w: 9,
      h: 0.85,
      fill: { color: COLORS.lightGray },
      rectRadius: 0.1,
    });

    // Priority badge
    slide.addShape('rect' as PptxGenJS.ShapeType, {
      x: 0.6,
      y: yPos + 0.15,
      w: 0.08,
      h: 0.55,
      fill: { color: priorityColor },
      rectRadius: 0.02,
    });

    slide.addText(`${idx + 1}. ${rec.title}`, {
      x: 0.9,
      y: yPos + 0.05,
      w: 6.5,
      h: 0.4,
      fontSize: 12,
      color: COLORS.black,
      fontFace: FONT.primary,
      bold: true,
    });

    slide.addText(`Priority: ${rec.priority}`, {
      x: 0.9,
      y: yPos + 0.45,
      w: 3.0,
      h: 0.3,
      fontSize: 10,
      color: priorityColor,
      fontFace: FONT.primary,
      bold: true,
    });

    slide.addText(
      `Savings: ${formatCurrency(rec.potentialSavings, data.currency)}/mo`,
      {
        x: 6.5,
        y: yPos + 0.15,
        w: 2.8,
        h: 0.5,
        fontSize: 14,
        color: COLORS.green,
        fontFace: FONT.primary,
        align: 'right',
        bold: true,
      }
    );
  });

  addFooter(slide);
}

export async function generateCxoReport(data: CxoReportData): Promise<Buffer> {
  const pres = new PptxGenJS();

  pres.layout = 'LAYOUT_WIDE';
  pres.author = 'ACC / FinOps AI';
  pres.company = data.tenantName;
  pres.subject = 'Cloud FinOps Executive Summary';
  pres.title = `CXO Report - ${data.tenantName} - ${data.reportPeriod}`;

  // Slide 1: Title
  buildTitleSlide(pres, data);

  // Slide 2: Financial Overview
  buildFinancialOverviewSlide(pres, data);

  // Slide 3: Cost by Provider
  buildProviderBreakdownSlide(pres, data);

  // Slide 4: Top Services
  buildTopServicesSlide(pres, data);

  // Slide 5: Cost Anomalies
  buildAnomaliesSlide(pres, data);

  // Slide 6: Compliance Posture
  buildComplianceSlide(pres, data);

  // Slide 7: Recommendations
  buildRecommendationsSlide(pres, data);

  const output = await pres.write({ outputType: 'nodebuffer' });
  return output as Buffer;
}
