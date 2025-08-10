
import './globals.css';
import React from 'react';

export const metadata = { title: 'Crypto Portfolio Pro', description: 'Spot • Futures • Farming' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <header className="header">
          <h1>Crypto Portfolio Pro</h1>
          <p>Portafolios múltiples • USD • Precios CoinGecko</p>
        </header>
        <main className="container">{children}</main>
        <footer className="footer">MVP con Next.js + Prisma • No pegues claves privadas</footer>
      </body>
    </html>
  );
}
