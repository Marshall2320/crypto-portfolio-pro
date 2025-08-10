
import { NextResponse } from 'next/server';
import { prisma } from '@/src/lib/db';

function parseCSV(text: string) {
  const lines = text.trim().split(/\r?\n/);
  const headers = lines[0].split(',').map(h=>h.trim());
  return lines.slice(1).map(line => {
    const cols = line.split(',').map(c=>c.trim());
    const obj: Record<string,string> = {};
    headers.forEach((h, i)=> obj[h]=cols[i]??'');
    return obj;
  });
}

function mapExchangeRow(row: Record<string,string>) {
  if ('Date(UTC)' in row && 'Side' in row && 'Price' in row && ('Amount' in row || 'Executed' in row)) {
    return {
      type: 'spot',
      date: new Date(row['Date(UTC)']),
      asset: (row['Asset'] || (row['Pair']?.split(row['Asset']||' ')[0]) || '').toUpperCase() || 'UNKNOWN',
      side: String(row['Side']||'buy').toLowerCase(),
      qty: Number(row['Amount']||row['Executed']||0),
      price: Number(row['Price']||0),
      fee: Number(row['Fee']||0),
      note: 'binance-import'
    };
  }
  if (('Open time' in row || 'Open Time' in row) && 'Symbol' in row && 'Side' in row && 'Entry Price' in row && 'Qty' in row) {
    return {
      type: 'futures',
      date: new Date(row['Open time'] || row['Open Time']),
      asset: String(row['Symbol']).toUpperCase(),
      side: String(row['Side']||'long').toLowerCase(),
      qty: Number(row['Qty']||0),
      entry: Number(row['Entry Price']||0),
      fee: Number(row['Fee']||0),
      note: 'futures-import'
    };
  }
  return null;
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const text = await req.text();
  if (!text?.trim()) return NextResponse.json({ error: 'CSV vacío' }, { status: 400 });
  const rows = parseCSV(text);
  let spot = 0, fut = 0, skipped = 0;
  for (const r of rows) {
    const mapped = mapExchangeRow(r);
    if (!mapped) { skipped++; continue; }
    if (mapped.type === 'spot') {
      await prisma.spotTx.create({ data: { portfolioId: params.id, ...mapped } as any });
      spot++;
    } else if (mapped.type === 'futures') {
      await prisma.futuresPos.create({ data: { portfolioId: params.id, isOpen: true, ...mapped } as any });
      fut++;
    }
  }
  return NextResponse.json({ imported: { spot, futures: fut, skipped } });
}
