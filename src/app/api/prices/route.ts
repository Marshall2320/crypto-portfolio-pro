
import { NextResponse } from 'next/server';
import { getPrices } from '@/src/lib/coingecko';

export async function POST(req: Request) {
  const body = await req.json();
  const ids: string[] = body?.ids || [];
  const vs: string = body?.vs || process.env.BASE_CURRENCY || 'usd';
  if (!Array.isArray(ids) || ids.length===0) {
    return NextResponse.json({ error: 'ids required' }, { status: 400 });
  }
  const data = await getPrices(ids, vs);
  return NextResponse.json({ data, vs });
}
