import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { downloadFinancialReport, downloadOccupancyReport, downloadExcelExport, sendReminders, downloadDelinquencyReport } from '../services/api';
import { FileBarChart, Download, FileText, Table2, BedDouble, Mail, Loader2, AlertTriangle } from 'lucide-react';

export default function Reports() {
  const { user } = useAuth();
  const [loading, setLoading] = useState('');
  const [year, setYear] = useState(2026);
  const [month, setMonth] = useState<number | ''>('');
  const [notifResult, setNotifResult] = useState<any>(null);
  const isFinancial = user?.role === 'admin' || user?.role === 'financeiro';

  const download = async (type: string) => {
    setLoading(type);
    try {
      let res;
      let filename;
      if (type === 'financial') {
        const params: any = { year };
        if (month) params.month = month;
        res = await downloadFinancialReport(params);
        filename = `relatorio_financeiro_${year}.pdf`;
      } else if (type === 'occupancy') {
        res = await downloadOccupancyReport();
        filename = 'relatorio_ocupacao.pdf';
      } else if (type === 'delinquency') {
        res = await downloadDelinquencyReport();
        filename = 'relatorio_inadimplencia.pdf';
      } else {
        res = await downloadExcelExport({ year });
        filename = `ferri_sistem_${year}.csv`;
      }
      const url = URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url; a.download = filename;
      a.click(); URL.revokeObjectURL(url);
    } catch (e: any) {
      alert(e.response?.status === 403 ? 'Acesso restrito a dados financeiros' : 'Erro ao gerar relatorio');
    }
    setLoading('');
  };

  const handleNotifications = async () => {
    setLoading('notif');
    try {
      const res = await sendReminders();
      setNotifResult(res.data);
    } catch { alert('Erro ao enviar notificacoes'); }
    setLoading('');
  };

  if (!isFinancial) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2"><FileBarChart size={24} /> Relatorios</h1>
        <div className="card">
          <h3 className="font-semibold mb-3">Relatorio de Ocupacao</h3>
          <p className="text-sm text-gray-500 mb-4">Gera um PDF com a ocupacao atual de todas as propriedades.</p>
          <button onClick={() => download('occupancy')} disabled={!!loading} className="btn-primary flex items-center gap-2">
            {loading === 'occupancy' ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />} Baixar PDF
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2"><FileBarChart size={24} /> Relatorios & Exportacao</h1>

      <div className="flex gap-3 items-center">
        <select value={year} onChange={e => setYear(Number(e.target.value))} className="select-field w-32">
          <option value={2026}>2026</option><option value={2025}>2025</option>
        </select>
        <select value={month} onChange={e => setMonth(e.target.value ? Number(e.target.value) : '')} className="select-field w-40">
          <option value="">Ano Completo</option>
          {[...Array(12)].map((_, i) => <option key={i+1} value={i+1}>{['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'][i]}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center"><FileText size={20} className="text-blue-600" /></div>
            <h3 className="font-semibold">Relatorio Financeiro</h3>
          </div>
          <p className="text-sm text-gray-500 mb-4">PDF com receita, despesas, EBITDA, resultado por propriedade e categorias.</p>
          <button onClick={() => download('financial')} disabled={!!loading} className="btn-primary flex items-center gap-2 w-full justify-center">
            {loading === 'financial' ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />} Baixar PDF
          </button>
        </div>

        <div className="card">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center"><BedDouble size={20} className="text-green-600" /></div>
            <h3 className="font-semibold">Relatorio de Ocupacao</h3>
          </div>
          <p className="text-sm text-gray-500 mb-4">PDF com ocupacao por propriedade, quartos, camas e lista de clientes.</p>
          <button onClick={() => download('occupancy')} disabled={!!loading} className="btn-primary flex items-center gap-2 w-full justify-center">
            {loading === 'occupancy' ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />} Baixar PDF
          </button>
        </div>

        <div className="card">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center"><Table2 size={20} className="text-purple-600" /></div>
            <h3 className="font-semibold">Exportar Excel/CSV</h3>
          </div>
          <p className="text-sm text-gray-500 mb-4">Exporta todas as entradas e saidas do ano em formato CSV (abre no Excel).</p>
          <button onClick={() => download('excel')} disabled={!!loading} className="btn-primary flex items-center gap-2 w-full justify-center">
            {loading === 'excel' ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />} Baixar CSV
          </button>
        </div>

        <div className="card">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center"><AlertTriangle size={20} className="text-red-600" /></div>
            <h3 className="font-semibold">Inadimplencia</h3>
          </div>
          <p className="text-sm text-gray-500 mb-4">PDF com clientes inadimplentes, divida por mes e totais.</p>
          <button onClick={() => download('delinquency')} disabled={!!loading} className="btn-primary flex items-center gap-2 w-full justify-center">
            {loading === 'delinquency' ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />} Baixar PDF
          </button>
        </div>
      </div>

      {/* Notifications */}
      <div className="card">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center"><Mail size={20} className="text-orange-600" /></div>
          <div>
            <h3 className="font-semibold">Enviar Notificacoes Automaticas</h3>
            <p className="text-sm text-gray-500">Envia lembretes de check-out, contratos e pagamentos por email.</p>
          </div>
        </div>
        <button onClick={handleNotifications} disabled={!!loading} className="btn-primary flex items-center gap-2">
          {loading === 'notif' ? <Loader2 size={16} className="animate-spin" /> : <Mail size={16} />} Enviar Lembretes
        </button>
        {notifResult && (
          <div className="mt-3 p-3 bg-gray-50 rounded-lg text-sm">
            <p className="font-medium">{notifResult.message}</p>
            {!notifResult.smtp_configured && (
              <p className="text-orange-600 mt-1">Configure as variaveis SMTP_USER e SMTP_PASS para envio real.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
