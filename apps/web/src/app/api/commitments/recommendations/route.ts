import { NextResponse } from 'next/server';
import { TunableRecommendationParamsSchema } from '@/lib/cloud/commitments/types';
import { getRIPurchaseRecommendations, getSPPurchaseRecommendations } from '@/lib/cloud/aws-costs';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const params = TunableRecommendationParamsSchema.parse(body);

    const [riRecommendations, spRecommendations] = await Promise.all([
      getRIPurchaseRecommendations({
        termInYears: params.termInYears,
        paymentOption: params.paymentOption,
        lookbackPeriod: params.lookbackPeriod,
      }),
      getSPPurchaseRecommendations({
        termInYears: params.termInYears,
        paymentOption: params.paymentOption,
        lookbackPeriod: params.lookbackPeriod,
      }),
    ]);

    return NextResponse.json({ riRecommendations, spRecommendations });
  } catch (error) {
    return NextResponse.json(
      { error: { code: 'INVALID_REQUEST', message: error instanceof Error ? error.message : 'Invalid parameters' } },
      { status: 400 }
    );
  }
}
