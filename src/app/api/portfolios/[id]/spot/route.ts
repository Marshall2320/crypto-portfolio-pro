
import { NextResponse } from 'next/server';
import { prisma } from '@/src/lib/db';

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const txs = await prisma.spotTx.findMany({ where: { portfolioId: params.id }, orderBy: { date: 'asc' } });
  return NextResponse.json(txs);
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const body = await req.json();
  const tx = await prisma.spotTx.create({
    data: {
      portfolioId: params.id,
      date: new Date(body.date || Date.now()),
      asset: String(body.asset||'').toUpperCase(),
      side: String(body.side||'buy').toLowerCase(),
      qty: body.qty,
      price: body.price,
      fee: body.fee||0,
      note: body.note||null
    }
  });
  return NextResponse.json(tx);
}
