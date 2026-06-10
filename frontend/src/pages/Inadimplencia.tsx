import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import KPICard from '../components/KPICard';
import { AlertTriangle, Download, Users, DollarSign, Calendar, ArrowLeft, Loader2, Search } from 'lucide-react';

const fmt = (v: number) => v.toLocaleString('en-IE', { style: 'currency', currency: 'EUR' });
const MONTH_NAMES = ['', 'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

export default function Inadimplencia() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isFinancial = user?.role === 'admin' || user?.role === 'financeiro';
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [search, setSearch] = useState('');
  const [expandedClient, setExpandedClient] = useState<number | null>(null);

  useEffect(() => {
    if (!isFinancial) { navigate('/'); return; }
    api.get('/dashboard/delinquency').then(r => { setData(r.data); setLoading(false); }).catch(() => setLoading(false));
  }, [isFinancial]);

  const handleDownloadPdf = async () => {
    setDownloading(true);
    try {
      const res = await api.get('/reports/delinquency-pdf', { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url; a.download = 'relatorio_inadimplencia.pdf';
      a.click(); URL.revokeObjectURL(url);
    } catch { alert('Erro ao gerar PDF'); }
    setDownloading(false);
  };

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-400">Carregando...</div>;
  if (!data) return <div className="text-center py-12 text-gray-400">Erro ao carregar dados</div>;

  const filtered = (data.delinquents || []).filter((d: any) =>
    d.client_name.toLowerCase().includes(search.toLowerCase()) ||
    d.property_name?.toLowerCase().includes(search.toLowerCase()) ||
    d.client_code?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/')} className="text-gray-400 hover:text-gray-600"><ArrowLeft size={24} /></button>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <AlertTriangle size={24} className="text-red-500" /> Inadimplencia
          </h1>
        </div>
        <button onClick={handleDownloadPdf} disabled={downloading} className="btn-primary flex items-center gap-2">
          {downloading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />} Baixar PDF
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KPICard title="Clientes Devedores" value={data.total_delinquents} icon={<Users size={24} />} color="red" />
        <KPICard title="Divida Total" value={fmt(data.total_debt)} icon={<DollarSign size={24} />} color="red" />
        <KPICard title="Media por Devedor" value={data.total_delinquents > 0 ? fmt(data.total_debt / data.total_delinquents) : '€0'} icon={<AlertTriangle size={24} />} color="orange" />
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por cliente, propriedade ou codigo..."
          className="input-field pl-10"
        />
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="card text-center py-12">
          <AlertTriangle size={48} className="mx-auto mb-3 text-green-400" />
          <p className="text-gray-500 text-lg">Nenhum cliente inadimplente!</p>
          <p className="text-gray-400 text-sm mt-1">Todos os pagamentos estao em dia.</p>
        </div>
      ) : (
        <div className="card overflow-x-auto p-0">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="table-header">Codigo</th>
                <th className="table-header">Cliente</th>
                <th className="table-header">Propriedade</th>
                <th className="table-header text-right">Valor Mensal</th>
                <th className="table-header text-right">Divida Total</th>
                <th className="table-header text-center">Meses Atraso</th>
                <th className="table-header">Desde</th>
                <th className="table-header">Check-in</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((d: any) => (
                <React.Fragment key={d.client_id}>
                  <tr
                    className="hover:bg-red-50 cursor-pointer transition-colors"
                    onClick={() => setExpandedClient(expandedClient === d.client_id ? null : d.client_id)}
                  >
                    <td className="table-cell font-mono text-xs text-blue-600">{d.client_code || '-'}</td>
                    <td className="table-cell">
                      <span className="font-medium text-gray-800 hover:text-blue-600 cursor-pointer"
                        onClick={e => { e.stopPropagation(); navigate(`/clientes/${d.client_id}`); }}>
                        {d.client_name}
                      </span>
                    </td>
                    <td className="table-cell text-gray-500">{d.property_name}</td>
                    <td className="table-cell text-right">{fmt(d.monthly_value)}</td>
                    <td className="table-cell text-right font-bold text-red-600">{fmt(d.total_debt)}</td>
                    <td className="table-cell text-center">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${d.months_overdue_count >= 3 ? 'bg-red-100 text-red-700' : d.months_overdue_count >= 2 ? 'bg-orange-100 text-orange-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {d.months_overdue_count} mes(es)
                      </span>
                    </td>
                    <td className="table-cell text-sm text-gray-500">
                      {MONTH_NAMES[d.oldest_debt_month]}/{d.oldest_debt_year}
                    </td>
                    <td className="table-cell text-sm text-gray-400">{d.check_in || '-'}</td>
                  </tr>
                  {expandedClient === d.client_id && d.months_overdue && (
                    <tr>
                      <td colSpan={8} className="p-4 bg-red-50/50">
                        <p className="text-xs font-medium text-gray-500 mb-2 uppercase">Detalhamento por Mes</p>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
                          {d.months_overdue.map((mo: any, i: number) => (
                            <div key={i} className="bg-white rounded-lg p-3 border border-red-200">
                              <div className="text-xs font-medium text-gray-500">{MONTH_NAMES[mo.month]}/{mo.year}</div>
                              <div className="flex justify-between mt-1">
                                <span className="text-xs text-gray-400">Esperado:</span>
                                <span className="text-xs font-medium">{fmt(mo.expected)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-xs text-gray-400">Recebido:</span>
                                <span className="text-xs font-medium text-green-600">{fmt(mo.received)}</span>
                              </div>
                              <div className="flex justify-between mt-1 pt-1 border-t">
                                <span className="text-xs text-gray-400">Faltando:</span>
                                <span className="text-xs font-bold text-red-600">{fmt(mo.missing)}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
