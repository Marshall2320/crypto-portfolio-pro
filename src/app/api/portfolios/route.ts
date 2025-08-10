
import { NextResponse } from 'next/server';
import { prisma } from '@/src/lib/db';

export async function GET() {
  const items = await prisma.portfolio.findMany({
    include: { assets: true }
  });
  return NextResponse.json(items);
}

export async function POST(req: Request) {
  const body = await req.json();
  const name: string = body?.name;
  const userEmail: string = body?.userEmail || 'demo@example.com';
  if (!name) return NextResponse.json({ error: 'name required' }, { status: 400 });
  const user = await prisma.user.upsert({
    where: { email: userEmail }, update: {}, create: { email: userEmail, name: 'Demo' }
  });
  const p = await prisma.portfolio.create({
    data: { name, userId: user.id, baseCurrency: (process.env.BASE_CURRENCY||'usd').toLowerCase() }
  });
  return NextResponse.json(p);
}
