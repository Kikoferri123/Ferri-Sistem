import React, { useEffect, useState } from 'react';
import { getPropertiesRanking } from '../services/api';
import { RankingProperty } from '../types';
import StatusBadge from '../components/StatusBadge';
import { useNavigate } from 'react-router-dom';
import { Trophy } from 'lucide-react';

const fmt = (v: number) => v.toLocaleString('en-IE', { style: 'currency', currency: 'EUR' });

export default function Ranking() {
  const [items, setItems] = useState<RankingProperty[]>([]);
  const [year, setYear] = useState(2026);
  const navigate = useNavigate();

  useEffect(() => {
    getPropertiesRanking({ year }).then(r => setItems(r.data));
  }, [year]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2"><Trophy size={24} className="text-yellow-500" /> Ranking Propriedades</h1>
        <select value={year} onChange={e => setYear(Number(e.target.value))} className="select-field w-28">
          <option value={2026}>2026</option><option value={2025}>2025</option>
        </select>
      </div>

      <div className="card overflow-x-auto p-0">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="table-header">#</th>
              <th className="table-header">Propriedade</th>
              <th className="table-header text-right">Total Receita</th>
              <th className="table-header text-right">Total Despesas</th>
              <th className="table-header text-right">Resultado</th>
              <th className="table-header text-right">Margem %</th>
              <th className="table-header">Classificacao</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {items.map((r, i) => (
              <tr key={r.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => navigate(`/propriedades/${r.id}`)}>
                <td className="table-cell font-bold text-gray-400">{i + 1}</td>
                <td className="table-cell font-medium">{r.name}</td>
                <td className="table-cell text-right font-medium text-blue-600">{fmt(r.total_receita)}</td>
                <td className="table-cell text-right text-red-600">{fmt(r.total_despesas)}</td>
                <td className={`table-cell text-right font-bold ${r.resultado >= 0 ? 'text-green-600' : 'text-red-600'}`}>{fmt(r.resultado)}</td>
                <td className={`table-cell text-right font-bold ${r.margin_pct >= 30 ? 'text-green-600' : r.margin_pct >= 10 ? 'text-yellow-600' : 'text-red-600'}`}>{r.margin_pct}%</td>
                <td className="table-cell"><StatusBadge status={r.classification} /></td>
              </tr>
            ))}
          </tbody>
        </table>
        {items.length === 0 && <p className="text-center py-8 text-gray-400">Sem dados</p>}
      </div>
    </div>
  );
}
