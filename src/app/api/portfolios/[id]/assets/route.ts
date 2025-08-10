
import { NextResponse } from 'next/server';
import { prisma } from '@/src/lib/db';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const body = await req.json();
  const symbol = (body?.symbol||'').toUpperCase();
  const coingeckoId = (body?.coingeckoId||'').toLowerCase();
  if (!symbol || !coingeckoId) return NextResponse.json({ error: 'symbol & coingeckoId required' }, { status: 400 });
  const a = await prisma.assetMap.upsert({
    where: { portfolioId_symbol: { portfolioId: params.id, symbol } },
    update: { coingeckoId },
    create: { portfolioId: params.id, symbol, coingeckoId }
  });
  return NextResponse.json(a);
}
