import { NextRequest, NextResponse } from 'next/server';
import { fetchTrustedAdvisorCheckDetail } from '@/lib/cloud/aws-trusted-advisor';

export async function GET(request: NextRequest) {
  const checkId = request.nextUrl.searchParams.get('checkId');

  if (!checkId) {
    return NextResponse.json(
      { error: { code: 'MISSING_PARAM', message: 'checkId is required' } },
      { status: 400 },
    );
  }

  try {
    const detail = await fetchTrustedAdvisorCheckDetail(checkId);
    return NextResponse.json(detail);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: { code: 'FETCH_ERROR', message } },
      { status: 500 },
    );
  }
}
