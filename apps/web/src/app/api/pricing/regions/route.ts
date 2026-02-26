import { NextResponse } from 'next/server';
import { getNormalizedRegions } from '@/lib/cloud/pricing/pricing-service';

export async function GET() {
  const regions = getNormalizedRegions();
  return NextResponse.json({ regions });
}
