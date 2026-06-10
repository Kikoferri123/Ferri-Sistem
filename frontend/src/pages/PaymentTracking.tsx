import React, { useEffect, useState } from 'react';
import { getPayments, getPaymentSummary, getProperties } from '../services/api';
import { DollarSign, AlertTriangle, CheckCircle, Clock, TrendingUp, Filter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const fmt = (v: number) => v.toLocaleString('en-IE', { style: 'currency', currency: 'EUR' });

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  paid: { label: 'Pago', color: 'text-green-700', bg: 'bg-green-100' },
  partial: { label: 'Parcial', color: 'text-yellow-700', bg: 'bg-yellow-100' },
  due: { label: 'A Vencer', color: 'text-blue-700', bg: 'bg-blue-100' },
  overdue: { label: 'Atrasado', color: 'text-red-700', bg: 'bg-red-100' },
};

export default function PaymentTracking() {
  const [payments, setPayments] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [properties, setProperties] = useState<any[]>([]);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterProperty, setFilterProperty] = useState('');
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const navigate = useNavigate();

  const load = () => {
    const params: any = { month, year };
    if (filterStatus !== 'all') params.status = filterStatus;
    if (filterProperty) params.property_id = Number(filterProperty);
    getPayments(params).then(r => setPayments(r.data));
    getPaymentSummary({ month, year }).then(r => setSummary(r.data));
  };

  useEffect(() => { load(); }, [month, year, filterStatus, filterProperty]);
  useEffect(() => { getProperties().then(r => setProperties(r.data)); }, []);

  const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <DollarSign size={24} /> Tracking de Pagamentos
        </h1>
        <div className="flex items-center gap-3">
          <select value={month} onChange={e => setMonth(Number(e.target.value))} className="select-field w-28">
            {monthNames.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
          <select value={year} onChange={e => setYear(Number(e.target.value))} className="select-field w-24">
            <option value={2026}>2026</option>
            <option value={2025}>2025</option>
          </select>
        </div>
      </div>

      {/* Summary KPIs */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <div className="card text-center">
            <p className="text-xs text-gray-500">Esperado</p>
            <p className="text-lg font-bold text-gray-800">{fmt(summary.total_expected)}</p>
          </div>
          <div className="card text-center">
            <p className="text-xs text-gray-500">Recebido</p>
            <p className="text-lg font-bold text-green-600">{fmt(summary.total_received)}</p>
          </div>
          <div className="card text-center">
            <p className="text-xs text-gray-500">Pendente</p>
            <p className="text-lg font-bold text-red-600">{fmt(summary.total_pending)}</p>
          </div>
          <div className="card text-center">
            <p className="text-xs text-gray-500">Taxa Cobranca</p>
            <p className="text-lg font-bold text-blue-600">{summary.collection_rate}%</p>
          </div>
          <div className="card text-center">
            <div className="flex justify-center gap-2">
              <span className="inline-block w-3 h-3 rounded-full bg-green-500 mt-1"></span>
              <div>
                <p className="text-xs text-gray-500">Pagos</p>
                <p className="text-lg font-bold text-green-600">{summary.count_paid}</p>
              </div>
            </div>
          </div>
          <div className="card text-center">
            <div className="flex justify-center gap-2">
              <span className="inline-block w-3 h-3 rounded-full bg-red-500 mt-1"></span>
              <div>
                <p className="text-xs text-gray-500">Atrasados</p>
                <p className="text-lg font-bold text-red-600">{summary.count_overdue}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="card flex flex-wrap gap-4 items-center">
        <Filter size={18} className="text-gray-400" />
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="select-field w-36">
          <option value="all">Todos</option>
          <option value="overdue">Atrasados</option>
          <option value="due">A Vencer</option>
          <option value="partial">Parcial</option>
          <option value="paid">Pagos</option>
        </select>
        <select value={filterProperty} onChange={e => setFilterProperty(e.target.value)} className="select-field w-48">
          <option value="">Todas Propriedades</option>
          {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <span className="ml-auto text-sm text-gray-500">{payments.length} registros</span>
      </div>

      {/* Payment Table */}
      <div className="card p-0 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Cliente</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Propriedade</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Acomodacao</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Esperado</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Recebido</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Saldo</th>
              <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {payments.map((p, i) => {
              const cfg = statusConfig[p.status] || statusConfig.due;
              return (
                <tr
                  key={i}
                  className="hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => navigate(`/clientes/${p.client_id}`)}
                >
                  <td className="px-4 py-3">
                    <span className="font-medium text-gray-800">{p.client_name}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{p.property_name}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {p.room_name && <span>{p.room_name}</span>}
                    {p.bed_name && <span className="text-gray-400"> / {p.bed_name}</span>}
                    {!p.room_name && !p.bed_name && <span className="text-gray-300">-</span>}
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-medium text-gray-700">{fmt(p.expected)}</td>
                  <td className="px-4 py-3 text-right text-sm font-medium text-green-600">{fmt(p.received)}</td>
                  <td className={`px-4 py-3 text-right text-sm font-medium ${p.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {fmt(p.balance)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${cfg.color} ${cfg.bg}`}>
                      {cfg.label}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {payments.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            Nenhum pagamento encontrado para o periodo selecionado
          </div>
        )}
      </div>
    </div>
  );
}
