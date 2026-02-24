import { NextResponse } from 'next/server';
import { getAuditLogs } from '@/lib/audit/logger';

const SIEM_API_KEY = process.env.SIEM_API_KEY || 'demo-siem-key-change-me';

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '');

  if (token !== SIEM_API_KEY) {
    return NextResponse.json({ error: 'Invalid or missing API key' }, { status: 401 });
  }

  const url = new URL(request.url);
  const since = url.searchParams.get('since') || undefined;
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '100', 10), 1000);
  const cursor = url.searchParams.get('cursor') || undefined;
  const category = url.searchParams.get('category') || undefined;

  const result = getAuditLogs({ tenantId: 'default', since, limit, cursor, category });

  return NextResponse.json(result, {
    headers: {
      'X-Total-Count': result.total.toString(),
      'X-Has-More': result.hasMore.toString(),
    },
  });
}
