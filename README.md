
# Crypto Portfolio Pro (Next.js + Prisma)

**USD por defecto**, múltiples carteras, **precios CoinGecko con caché**, importación **CSV** (Binance/Bitget/Weex, MVP),
**FIFO** para Spot (servicio incluido) y dashboards básicos con Chart.js.

## Requisitos
- Node 18+
- PNPM/NPM/Yarn
- (Dev) SQLite; para producción, cambia `DATABASE_URL` (Postgres recomendado).

## Instalación local
```bash
npm install
npm run prisma:generate
npm run prisma:migrate -- --name init
npm run seed
npm run dev
```
Abre `http://localhost:3000`.

## Variables de entorno
Copia `.env.example` a `.env` y ajusta si quieres:
```
DATABASE_URL="file:./dev.db"
BASE_CURRENCY="usd"
COINGECKO_API_BASE="https://api.coingecko.com/api/v3"
CACHE_TTL_SECONDS="60"
```

## Endpoints (resumen)
- `POST /api/prices` — `{ ids: string[], vs?: string }` → precios (con caché en DB).
- `GET/POST /api/portfolios` — Lista/crea carteras.
- `POST /api/portfolios/:id/assets` — Mapeo símbolo↔CoinGecko.
- `GET/POST /api/portfolios/:id/spot` — Movimientos Spot.
- `GET/POST /api/portfolios/:id/futures` — Posiciones Futuros.
- `GET/POST /api/portfolios/:id/farming` — Posiciones Farming.
- `POST /api/portfolios/:id/import` — Importador CSV (MVP, campos comunes).

## Próximos pasos
- NextAuth (auth), parsers específicos por exchange, dashboards de equity/drawdown, reporte fiscal (FIFO/LIFO/HIFO).
