import { NextResponse } from 'next/server';
import { WorkloadDefinitionSchema } from '@/lib/cloud/pricing/types';
import { comparePricing } from '@/lib/cloud/pricing/pricing-service';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const workload = WorkloadDefinitionSchema.parse(body);
    const comparison = await comparePricing(workload);
    return NextResponse.json(comparison);
  } catch (error) {
    return NextResponse.json(
      { error: { code: 'INVALID_REQUEST', message: error instanceof Error ? error.message : 'Invalid workload definition' } },
      { status: 400 }
    );
  }
}
