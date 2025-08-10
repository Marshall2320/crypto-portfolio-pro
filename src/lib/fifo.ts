
export type SpotTx = { date: Date; asset: string; side: 'buy'|'sell'; qty: number; price: number; fee?: number };

export function fifoPnL(txs: SpotTx[]) {
  const lots: { qty: number; price: number; fee: number }[] = [];
  let realized = 0;
  let fees = 0;
  for (const t of txs) {
    const fee = t.fee || 0;
    fees += fee;
    if (t.side === 'buy') {
      lots.push({ qty: t.qty, price: t.price, fee });
    } else {
      let qtyToSell = t.qty;
      while (qtyToSell > 0 && lots.length > 0) {
        const lot = lots[0];
        const used = Math.min(lot.qty, qtyToSell);
        realized += used * (t.price - lot.price);
        lot.qty -= used;
        qtyToSell -= used;
        if (lot.qty <= 1e-12) lots.shift();
      }
    }
  }
  const remainingQty = lots.reduce((s,l)=>s+l.qty,0);
  const avgCost = remainingQty>0 ? (lots.reduce((s,l)=>s+l.qty*l.price,0)/remainingQty) : 0;
  return { remainingQty, avgCost, realizedPnL: realized - fees };
}
