
'use client';
import React, { useEffect, useMemo, useState } from 'react';
import type { ChartData } from 'chart.js';
import { Chart } from 'chart.js/auto';

type Portfolio = { id: string; name: string; baseCurrency: string; assets: { id:string; symbol:string; coingeckoId:string }[] };

export default function Home() {
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [selected, setSelected] = useState<string>('');
  const [assets, setAssets] = useState<{symbol:string; coingeckoId:string}[]>([]);
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [totals, setTotals] = useState<{spot:number; fut:number; farm:number; realized:number;} | null>(null);

  useEffect(()=>{
    fetch('/api/portfolios').then(r=>r.json()).then((rows:Portfolio[])=>{
      setPortfolios(rows);
      if (rows.length) setSelected(rows[0].id);
    });
  },[]);

  useEffect(()=>{
    if (!selected) return;
    const p = portfolios.find(x=>x.id===selected);
    if (!p) return;
    setAssets(p.assets.map(a=>({ symbol:a.symbol, coingeckoId:a.coingeckoId })));
  },[selected, portfolios]);

  useEffect(()=>{
    const ids = assets.map(a=>a.coingeckoId);
    if (!ids.length) return;
    fetch('/api/prices',{ method:'POST', body: JSON.stringify({ ids }) }).then(r=>r.json()).then(({data})=> setPrices(data||{}));
  },[assets]);

  useEffect(()=>{
    if (!selected) return;
    Promise.all([
      fetch(`/api/portfolios/${selected}/spot`).then(r=>r.json()),
      fetch(`/api/portfolios/${selected}/futures`).then(r=>r.json()),
      fetch(`/api/portfolios/${selected}/farming`).then(r=>r.json()),
    ]).then(([spot, fut, farm])=>{
      let spotVal = 0, realized = 0;
      const byAsset: Record<string, { qty:number; cost:number; realized:number }> = {};
      for (const t of spot) {
        const s = t.asset;
        byAsset[s] = byAsset[s] || { qty:0, cost:0, realized:0 };
        if (t.side==='buy') { byAsset[s].qty += Number(t.qty); byAsset[s].cost += Number(t.qty)*Number(t.price); }
        else { byAsset[s].qty -= Number(t.qty); byAsset[s].cost -= Number(t.qty)*Number(t.price); }
      }
      for (const [sym, agg] of Object.entries(byAsset)) {
        const id = assets.find(a=>a.symbol===sym)?.coingeckoId;
        const px = id ? prices[id] : 0;
        spotVal += (agg.qty>0 && px) ? agg.qty * px : 0;
      }

      let futUnreal = 0;
      for (const p of fut) {
        const id = assets.find(a=>a.symbol===p.asset)?.coingeckoId;
        const px = id ? prices[id] : 0;
        const side = p.side==='long' ? 1 : -1;
        futUnreal += (px - Number(p.entry)) * Number(p.qty) * side - Number(p.fee||0);
      }

      let farmVal = 0;
      for (const f of farm) {
        const idMain = assets.find(a=>a.symbol===f.asset)?.coingeckoId;
        const pxMain = idMain ? prices[idMain] : 0;
        farmVal += Number(f.qty) * (pxMain||0);
        if (f.rewardsAsset) {
          const idR = assets.find(a=>a.symbol===f.rewardsAsset)?.coingeckoId;
          const pxR = idR ? prices[idR] : 0;
          farmVal += Number(f.rewardsQty||0) * (pxR||0);
        }
      }
      setTotals({ spot: spotVal, fut: futUnreal, farm: farmVal, realized });
    });
  },[selected, assets, prices]);

  useEffect(()=>{
    const el = document.getElementById('pie') as HTMLCanvasElement;
    if (!el || !totals) return;
    const ctx = el.getContext('2d');
    if (!ctx) return;
    new Chart(ctx, { type:'doughnut', data: { labels:['Spot','Futuros (PnL)','Farming'], datasets:[{ data:[totals.spot, totals.fut, totals.farm] }] } });
  },[totals]);

  async function createPortfolio() {
    const name = prompt('Nombre del portafolio');
    if (!name) return;
    const p = await fetch('/api/portfolios', { method:'POST', body: JSON.stringify({ name }) }).then(r=>r.json());
    setPortfolios(prev=>[...prev, p]);
    setSelected(p.id);
  }

  async function addAsset() {
    const sym = prompt('Símbolo (p.ej. BTC)')?.toUpperCase();
    const id = prompt('CoinGecko ID (p.ej. bitcoin)')?.toLowerCase();
    if (!sym || !id || !selected) return;
    await fetch(`/api/portfolios/${selected}/assets`, { method:'POST', body: JSON.stringify({ symbol: sym, coingeckoId: id }) });
    const rows = await fetch('/api/portfolios').then(r=>r.json());
    setPortfolios(rows);
  }

  async function importCSV() {
    if (!selected) return;
    const text = prompt('Pega aquí el CSV (cabecera incluida)');
    if (!text) return;
    const res = await fetch(`/api/portfolios/${selected}/import`, { method:'POST', body: text });
    const json = await res.json();
    alert('Importado: ' + JSON.stringify(json));
  }

  const sel = portfolios.find(p=>p.id===selected);

  return (
    <div>
      <div className="card">
        <div className="row">
          <select value={selected} onChange={(e)=>setSelected(e.target.value)}>
            {portfolios.map(p=>(<option key={p.id} value={p.id}>{p.name}</option>))}
          </select>
          <button onClick={createPortfolio}>Nuevo portafolio</button>
          <button onClick={addAsset}>Añadir activo (CoinGecko)</button>
          <button onClick={importCSV}>Importar CSV (Binance/Bitget/Weex)</button>
        </div>
        <div style={{marginTop:8, color:'var(--muted)'}}>
          Base: <span className="tag">{sel?.baseCurrency?.toUpperCase()||'USD'}</span> • Activos mapeados: {assets.length}
        </div>
      </div>

      <div className="card">
        <h3>Resumen</h3>
        <div className="row">
          <div className="tag">Spot: {totals ? totals.spot.toFixed(2) : '—'}</div>
          <div className="tag">Futuros (PnL no realizado): {totals ? totals.fut.toFixed(2) : '—'}</div>
          <div className="tag">Farming: {totals ? totals.farm.toFixed(2) : '—'}</div>
        </div>
        <div style={{maxWidth:420}}>
          <canvas id="pie"></canvas>
        </div>
      </div>

      <div className="card">
        <h3>Cómo empezar</h3>
        <ol>
          <li>Crear portafolio o usar el existente.</li>
          <li>Añadir activos con su CoinGecko ID (ej.: BTC→bitcoin, ETH→ethereum).</li>
          <li>Importar CSV de Binance/Bitget/Weex (MVP tolerante con cabeceras típicas).</li>
          <li>Consultar dashboards.</li>
        </ol>
      </div>
    </div>
  );
}
