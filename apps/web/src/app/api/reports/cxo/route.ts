import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { generateCxoReport } from '@/lib/reports/cxo-report';
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

    const reportData: CxoReportData = {
      tenantName: 'Poonawalla Fincorp Ltd.',
      reportPeriod: reportMonth,
      generatedAt: today.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      totalSpend: 452387,
      previousPeriodSpend: 438210,
      currency: 'USD',
      topServicesBySpend: [
        { service: 'Amazon EC2', spend: 142500, change: 4.2 },
        { service: 'Azure SQL Database', spend: 87300, change: -2.1 },
        { service: 'Amazon RDS', spend: 63200, change: 8.7 },
        { service: 'Google BigQuery', spend: 45800, change: 12.3 },
        { service: 'Amazon S3', spend: 38900, change: -1.5 },
      ],
      spendByProvider: [
        { provider: 'AWS', spend: 267450, percentage: 59.1 },
        { provider: 'Azure', spend: 134200, percentage: 29.7 },
        { provider: 'GCP', spend: 50737, percentage: 11.2 },
      ],
      anomaliesDetected: 7,
      budgetUtilization: 82,
      complianceScore: 78,
      recommendations: [
        {
          title: 'Right-size underutilized EC2 instances (47 instances below 15% CPU)',
          potentialSavings: 18500,
          priority: 'High',
        },
        {
          title: 'Convert on-demand RDS instances to Reserved Instances (3-year term)',
          potentialSavings: 12800,
          priority: 'Medium',
        },
        {
          title: 'Enable S3 Intelligent-Tiering for infrequently accessed data buckets',
          potentialSavings: 6200,
          priority: 'Medium',
        },
      ],
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
