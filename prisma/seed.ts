
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.upsert({
    where: { email: 'demo@example.com' },
    update: {},
    create: { email: 'demo@example.com', name: 'Demo' }
  });
  await prisma.portfolio.create({
    data: {
      name: 'Principal',
      baseCurrency: 'usd',
      userId: user.id,
      assets: {
        create: [
          { symbol: 'BTC', coingeckoId: 'bitcoin' },
          { symbol: 'ETH', coingeckoId: 'ethereum' },
          { symbol: 'SOL', coingeckoId: 'solana' }
        ]
      }
    }
  });
  console.log('Seeded with demo user and portfolio.');
}
main().catch(e=>{ console.error(e); process.exit(1); }).finally(()=>prisma.$disconnect());
