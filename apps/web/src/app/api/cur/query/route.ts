import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { executeCurQuery, checkCurAvailability, type CurQueryType } from '@/lib/cloud/aws-cur';

// --- Request Validation ------------------------------------------------------

const CurQuerySchema = z.object({
  queryType: z.enum([
    'resourceCostBreakdown',
    'costsByResourceId',
    'hourlyCostSpike',
    'tagCostAllocation',
    'untaggedResourceCosts',
    'serviceResourceBreakdown',
    'commitmentWaste',
    'dataTransferByResource',
  ]),
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD')
    .optional(),
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD')
    .optional(),
  resourceId: z.string().optional(),
  tagKey: z.string().optional(),
  serviceName: z.string().optional(),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD')
    .optional(),
});

// --- POST /api/cur/query -----------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = CurQuerySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request body',
            details: parsed.error.flatten().fieldErrors,
          },
        },
        { status: 400 },
      );
    }

    const result = await executeCurQuery(parsed.data as { queryType: CurQueryType } & Record<string, string | undefined>);

    return NextResponse.json({
      success: true,
      data: result.rows,
      meta: {
        columns: result.columns,
        rowCount: result.rows.length,
        queryExecutionId: result.queryExecutionId,
        dataScannedBytes: result.dataScannedBytes,
        executionTimeMs: result.executionTimeMs,
        estimatedCost: `$${((result.dataScannedBytes / (1024 * 1024 * 1024 * 1024)) * 5).toFixed(6)}`,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[CUR API] Query error:', message);

    return NextResponse.json(
      { error: { code: 'QUERY_ERROR', message } },
      { status: 500 },
    );
  }
}

// --- GET /api/cur/query (health check) ---------------------------------------

export async function GET() {
  try {
    const status = await checkCurAvailability();
    return NextResponse.json({
      cur: status,
      queryTypes: [
        { name: 'resourceCostBreakdown', description: 'Top resources by cost', requiredParams: ['startDate?', 'endDate?'] },
        { name: 'costsByResourceId', description: 'Cost history for a specific resource', requiredParams: ['resourceId', 'startDate?', 'endDate?'] },
        { name: 'hourlyCostSpike', description: 'Hourly cost breakdown for a date', requiredParams: ['date'] },
        { name: 'tagCostAllocation', description: 'Cost by tag value (Team, Project, etc.)', requiredParams: ['tagKey', 'startDate?', 'endDate?'] },
        { name: 'untaggedResourceCosts', description: 'Cost of resources missing required tags', requiredParams: ['startDate?', 'endDate?'] },
        { name: 'serviceResourceBreakdown', description: 'Resources within a service', requiredParams: ['serviceName', 'startDate?', 'endDate?'] },
        { name: 'commitmentWaste', description: 'RI/SP underutilization details', requiredParams: ['startDate?', 'endDate?'] },
        { name: 'dataTransferByResource', description: 'Network transfer costs by resource', requiredParams: ['startDate?', 'endDate?'] },
      ],
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: { code: 'HEALTH_CHECK_ERROR', message } },
      { status: 500 },
    );
  }
}
