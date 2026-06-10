import React, { useEffect, useState } from 'react';
import { getDepositsSummary } from '../services/api';
import KPICard from '../components/KPICard';
import { Wallet, ArrowDownCircle, ArrowUpCircle, Scale } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const fmt = (v: number) => v.toLocaleString('en-IE', { style: 'currency', currency: 'EUR' });

interface DepositRow {
  property_id: number;
  property_name: string;
  deposits_received: number;
  deposits_returned: number;
  net_balance: number;
}

interface DepositData {
  total_received: number;
  total_returned: number;
  total_balance: number;
  rows: DepositRow[];
}

export default function DepositTracking() {
  const [data, setData] = useState<DepositData | null>(null);
  const [year, setYear] = useState(2026);
  const navigate = useNavigate();

  useEffect(() => {
    getDepositsSummary({ year }).then(r => setData(r.data)).catch(() => setData(null));
  }, [year]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Wallet size={24} className="text-blue-500" /> Depositos
        </h1>
        <select value={year} onChange={e => setYear(Number(e.target.value))} className="select-field w-28">
          <option value={2026}>2026</option><option value={2025}>2025</option>
        </select>
      </div>

      {/* KPIs */}
      {data && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <KPICard title="Depositos Recebidos" value={fmt(data.total_received)} icon={<ArrowDownCircle size={24} />} color="green" />
          <KPICard title="Depositos Devolvidos" value={fmt(data.total_returned)} icon={<ArrowUpCircle size={24} />} color="red" />
          <KPICard title="Saldo Liquido" value={fmt(data.total_balance)} icon={<Scale size={24} />} color={data.total_balance >= 0 ? 'blue' : 'red'} />
        </div>
      )}

      {/* Table */}
      <div className="card overflow-x-auto p-0">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="table-header">Propriedade</th>
              <th className="table-header text-right">Recebidos</th>
              <th className="table-header text-right">Devolvidos</th>
              <th className="table-header text-right">Saldo</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data && data.rows.map(r => (
              <tr key={r.property_id} className="hover:bg-gray-50 cursor-pointer" onClick={() => navigate(`/propriedades/${r.property_id}`)}>
                <td className="table-cell font-medium">{r.property_name}</td>
                <td className="table-cell text-right text-green-600">{fmt(r.deposits_received)}</td>
                <td className="table-cell text-right text-red-600">{fmt(r.deposits_returned)}</td>
                <td className={`table-cell text-right font-bold ${r.net_balance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>{fmt(r.net_balance)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {(!data || data.rows.length === 0) && <p className="text-center py-8 text-gray-400">Nenhum deposito encontrado</p>}
      </div>
    </div>
  );
}
