
import { NextResponse } from 'next/server';
import { prisma } from '@/src/lib/db';

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const rows = await prisma.futuresPos.findMany({ where: { portfolioId: params.id }, orderBy: { date: 'desc' } });
  return NextResponse.json(rows);
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const body = await req.json();
  const p = await prisma.futuresPos.create({
    data: {
      portfolioId: params.id,
      date: new Date(body.date || Date.now()),
      asset: String(body.asset||'').toUpperCase(),
      side: String(body.side||'long').toLowerCase(),
      qty: body.qty,
      entry: body.entry,
      leverage: body.leverage||0,
      tp: body.tp||null,
      sl: body.sl||null,
      fee: body.fee||0,
      note: body.note||null
    }
  });
  return NextResponse.json(p);
}
