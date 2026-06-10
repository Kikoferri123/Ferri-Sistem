import React, { useEffect, useState } from 'react';
import { getPnLCaixa, getPnLCompetencia } from '../services/api';
import { PnLRow } from '../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const fmt = (v: number) => v.toLocaleString('en-IE', { style: 'currency', currency: 'EUR' });

export default function PnL({ mode }: { mode: 'caixa' | 'competencia' }) {
  const [data, setData] = useState<PnLRow[]>([]);
  const [year, setYear] = useState(2026);

  useEffect(() => {
    const fn = mode === 'caixa' ? getPnLCaixa : getPnLCompetencia;
    fn({ year }).then(r => setData(r.data));
  }, [year, mode]);

  const title = mode === 'caixa' ? 'P&L Caixa (Cash Basis)' : 'P&L Competencia (Accrual Basis)';

  // Collect all OPEX categories
  const allCategories = new Set<string>();
  data.forEach(r => Object.keys(r.opex_by_category).forEach(c => allCategories.add(c)));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
        <select value={year} onChange={e => setYear(Number(e.target.value))} className="select-field w-28">
          <option value={2026}>2026</option><option value={2025}>2025</option>
        </select>
      </div>

      {/* Evolution Chart */}
      <div className="card">
        <h3 className="font-semibold text-gray-700 mb-4">Evolucao Mensal</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="label" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip formatter={(v: number) => fmt(v)} />
            <Legend />
            <Line type="monotone" dataKey="total_revenue" name="Receita" stroke="#3b82f6" strokeWidth={2} />
            <Line type="monotone" dataKey="total_opex" name="OPEX" stroke="#ef4444" strokeWidth={2} />
            <Line type="monotone" dataKey="ebitda" name="EBITDA" stroke="#10b981" strokeWidth={2} />
            <Line type="monotone" dataKey="free_cash_flow" name="FCF" stroke="#8b5cf6" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* PnL Table */}
      <div className="card overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="table-header sticky left-0 bg-gray-50">Linha</th>
              {data.map(r => <th key={r.label} className="table-header text-right">{r.label}</th>)}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            <tr className="bg-blue-50 font-semibold">
              <td className="table-cell sticky left-0 bg-blue-50">Receita</td>
              {data.map(r => <td key={r.label} className="table-cell text-right">{fmt(r.receita || 0)}</td>)}
            </tr>
            <tr className="bg-blue-50 font-bold">
              <td className="table-cell sticky left-0 bg-blue-50">Receita Total</td>
              {data.map(r => <td key={r.label} className="table-cell text-right text-blue-700">{fmt(r.total_revenue)}</td>)}
            </tr>

            {/* OPEX by category */}
            {Array.from(allCategories).sort().map(cat => (
              <tr key={cat}>
                <td className="table-cell sticky left-0 bg-white text-gray-500 pl-8">{cat}</td>
                {data.map(r => <td key={r.label} className="table-cell text-right text-red-500">{fmt(r.opex_by_category[cat] || 0)}</td>)}
              </tr>
            ))}

            <tr className="bg-red-50 font-bold">
              <td className="table-cell sticky left-0 bg-red-50">Total OPEX</td>
              {data.map(r => <td key={r.label} className="table-cell text-right text-red-700">{fmt(r.total_opex)}</td>)}
            </tr>
            <tr className="bg-green-50 font-bold">
              <td className="table-cell sticky left-0 bg-green-50">EBITDA</td>
              {data.map(r => <td key={r.label} className="table-cell text-right text-green-700">{fmt(r.ebitda)}</td>)}
            </tr>
            <tr>
              <td className="table-cell sticky left-0 bg-white">Pro-Labore</td>
              {data.map(r => <td key={r.label} className="table-cell text-right">{fmt(r.pro_labore)}</td>)}
            </tr>
            <tr className="font-bold">
              <td className="table-cell sticky left-0 bg-white">Resultado</td>
              {data.map(r => <td key={r.label} className="table-cell text-right">{fmt(r.resultado)}</td>)}
            </tr>
            <tr>
              <td className="table-cell sticky left-0 bg-white">CAPEX</td>
              {data.map(r => <td key={r.label} className="table-cell text-right">{fmt(r.capex)}</td>)}
            </tr>
            <tr className="bg-purple-50 font-bold">
              <td className="table-cell sticky left-0 bg-purple-50">Free Cash Flow</td>
              {data.map(r => <td key={r.label} className="table-cell text-right text-purple-700">{fmt(r.free_cash_flow)}</td>)}
            </tr>
            <tr className="bg-gray-50">
              <td className="table-cell sticky left-0 bg-gray-50">Margem EBITDA %</td>
              {data.map(r => <td key={r.label} className="table-cell text-right">{r.margem_ebitda_pct}%</td>)}
            </tr>
            <tr className="bg-gray-50">
              <td className="table-cell sticky left-0 bg-gray-50">Margem FCF %</td>
              {data.map(r => <td key={r.label} className="table-cell text-right">{r.margem_fcf_pct}%</td>)}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
