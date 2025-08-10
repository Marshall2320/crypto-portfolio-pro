
import { prisma } from './db';

const API_BASE = process.env.COINGECKO_API_BASE || 'https://api.coingecko.com/api/v3';
const TTL = Number(process.env.CACHE_TTL_SECONDS || '60');
const BASE = (process.env.BASE_CURRENCY || 'usd').toLowerCase();

export async function getPrices(ids: string[], vs: string = BASE) {
  const now = Date.now();
  const cached = await prisma.priceCache.findMany({
    where: { coingeckoId: { in: ids } }
  });
  const fresh: Record<string, number> = {};
  const missing: string[] = [];
  for (const id of ids) {
    const c = cached.find(x => x.coingeckoId === id);
    if (c) {
      const age = now - new Date(c.updatedAt).getTime();
      if (age < TTL*1000 && c.currency === vs) {
        fresh[id] = Number(c.price);
        continue;
      }
    }
    missing.push(id);
  }
  if (missing.length) {
    const url = `${API_BASE}/simple/price?ids=${encodeURIComponent(missing.join(','))}&vs_currencies=${encodeURIComponent(vs)}`;
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error('CoinGecko HTTP '+res.status);
    const data = await res.json() as Record<string, Record<string, number>>;
    for (const m of missing) {
      const price = data[m]?.[vs];
      if (typeof price === 'number') {
        fresh[m] = price;
        await prisma.priceCache.upsert({
          where: { coingeckoId: m },
          update: { price, currency: vs },
          create: { coingeckoId: m, price, currency: vs }
        });
      }
    }
  }
  for (const c of cached) {
    if (!(c.coingeckoId in fresh) && c.currency === vs) {
      const age = now - new Date(c.updatedAt).getTime();
      if (age < TTL*1000) fresh[c.coingeckoId] = Number(c.price);
    }
  }
  return fresh;
}
