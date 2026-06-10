import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import Modal from '../components/Modal';
import KPICard from '../components/KPICard';
import StatusBadge from '../components/StatusBadge';
import {
  ArrowLeft, Clock, DollarSign, Phone, Mail, CreditCard, FileText,
  Calendar, Palmtree, Thermometer, Plus, Trash2, Check, X, MessageSquare,
  FolderOpen, Send
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const fmt = (v: number) => v.toLocaleString('en-IE', { style: 'currency', currency: 'EUR' });

const TYPE_LABELS: any = { ferias: 'Ferias', sick_day: 'Atestado', licenca: 'Licenca', folga: 'Folga' };
const STATUS_COLORS: any = {
  pendente: 'bg-yellow-100 text-yellow-700',
  aprovado: 'bg-green-100 text-green-700',
  rejeitado: 'bg-red-100 text-red-700',
  cancelado: 'bg-gray-100 text-gray-500',
};

export default function EmployeeProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [tab, setTab] = useState<'overview' | 'timeoffs' | 'docs' | 'remarks' | 'reviews'>('overview');
  const [showTimeOffModal, setShowTimeOffModal] = useState(false);
  const [showDocModal, setShowDocModal] = useState(false);
  const [remarkText, setRemarkText] = useState('');

  const [toForm, setToForm] = useState<any>({
    employee_id: '', type: 'ferias', start_date: '', end_date: '', days: 1, reason: ''
  });
  const [docForm, setDocForm] = useState<any>({ name: '', type: '', file_url: '' });
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewForm, setReviewForm] = useState<any>({
    reviewer_name: '', period: '', rating: 3, punctuality: 3, quality: 3, teamwork: 3, communication: 3, notes: ''
  });

  const load = () => {
    if (id) api.get(`/hr/employees/${id}`).then(r => setData(r.data)).catch(() => navigate('/rh'));
  };

  useEffect(() => { load(); }, [id]);

  const handleCreateTimeOff = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.post('/hr/time-offs', { ...toForm, employee_id: Number(id) });
    setShowTimeOffModal(false);
    setToForm({ employee_id: '', type: 'ferias', start_date: '', end_date: '', days: 1, reason: '' });
    load();
  };

  const handleApprove = async (toId: number) => {
    await api.put(`/hr/time-offs/${toId}`, { status: 'aprovado' });
    load();
  };

  const handleReject = async (toId: number) => {
    await api.put(`/hr/time-offs/${toId}`, { status: 'rejeitado' });
    load();
  };

  const handleDeleteTimeOff = async (toId: number) => {
    if (confirm('Remover este registro?')) { await api.delete(`/hr/time-offs/${toId}`); load(); }
  };

  const handleAddDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.post(`/hr/employees/${id}/docs`, docForm);
    setShowDocModal(false);
    setDocForm({ name: '', type: '', file_url: '' });
    load();
  };

  const handleDeleteDoc = async (docId: number) => {
    if (confirm('Remover documento?')) { await api.delete(`/hr/employees/${id}/docs/${docId}`); load(); }
  };

  const handleAddRemark = async () => {
    if (!remarkText.trim()) return;
    await api.post(`/hr/employees/${id}/remarks`, { text: remarkText });
    setRemarkText('');
    load();
  };

  const handleDeleteRemark = async (remarkId: number) => {
    if (confirm('Remover observacao?')) { await api.delete(`/hr/employees/${id}/remarks/${remarkId}`); load(); }
  };

  const handleAddReview = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.post(`/hr/employees/${id}/reviews`, reviewForm);
    setShowReviewModal(false);
    setReviewForm({ reviewer_name: '', period: '', rating: 3, punctuality: 3, quality: 3, teamwork: 3, communication: 3, notes: '' });
    load();
  };

  const handleDeleteReview = async (reviewId: number) => {
    if (confirm('Remover avaliacao?')) { await api.delete(`/hr/employees/${id}/reviews/${reviewId}`); load(); }
  };

  const starRating = (value: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i} className={`text-lg ${i < value ? 'text-yellow-400' : 'text-gray-300'}`}>★</span>
    ));
  };

  // Calculate days between dates
  const calcDays = (start: string, end: string) => {
    if (!start || !end) return 1;
    const s = new Date(start); const e = new Date(end);
    const diff = Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return diff > 0 ? diff : 1;
  };

  if (!data) return <div className="flex items-center justify-center h-64 text-gray-400">Carregando...</div>;

  const tabClass = (t: string) => `px-4 py-2 text-sm font-medium rounded-lg transition-colors ${tab === t ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/rh')} className="text-gray-400 hover:text-gray-600"><ArrowLeft size={24} /></button>
        <div className="flex items-center gap-3 flex-1">
          <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">
            {data.name?.charAt(0)?.toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              {data.code && <span className="text-green-500 font-mono text-lg mr-2">{data.code}</span>}
              {data.name}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <StatusBadge status={data.status} />
              {data.role_title && <span className="text-sm text-gray-500">{data.role_title}</span>}
            </div>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <KPICard title="Salario Mensal" value={fmt(data.monthly_salary || 0)} color="blue" />
        <KPICard title="Taxa/Hora" value={data.hourly_rate > 0 ? `€${data.hourly_rate}/h` : '-'} color="purple" />
        <KPICard title="Horas Este Mes" value={`${data.hours_this_month || 0}h`} color="green" />
        <KPICard title="Total Pago" value={fmt(data.total_paid || 0)} color="red" />
        <KPICard title="Ferias Restantes" value={`${data.vacation_balance ?? 0} dias`} color="cyan" />
        <KPICard title="Atestados (Ano)" value={`${data.sick_days_used ?? 0} dias`} color="orange" />
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button onClick={() => setTab('overview')} className={tabClass('overview')}>Visao Geral</button>
        <button onClick={() => setTab('timeoffs')} className={tabClass('timeoffs')}>Ferias / Ausencias ({data.time_offs?.length || 0})</button>
        <button onClick={() => setTab('docs')} className={tabClass('docs')}>Documentos ({data.documents?.length || 0})</button>
        <button onClick={() => setTab('remarks')} className={tabClass('remarks')}>Observacoes ({data.remarks?.length || 0})</button>
        <button onClick={() => setTab('reviews')} className={tabClass('reviews')}>Avaliacoes ({data.reviews?.length || 0})</button>
      </div>

      {/* Overview Tab */}
      {tab === 'overview' && (
        <>
          {/* Contact Info */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Informacoes</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              {data.phone && <div className="flex items-center gap-2"><Phone size={16} className="text-gray-400" />{data.phone}</div>}
              {data.email && <div className="flex items-center gap-2"><Mail size={16} className="text-gray-400" />{data.email}</div>}
              {data.iban && <div className="flex items-center gap-2"><CreditCard size={16} className="text-gray-400" /><span className="font-mono text-xs">{data.iban}</span></div>}
              {data.document_id && <div className="flex items-center gap-2"><FileText size={16} className="text-gray-400" />{data.document_id}</div>}
              {data.hire_date && <div className="flex items-center gap-2"><Calendar size={16} className="text-gray-400" />Contratado: {data.hire_date}</div>}
              <div className="flex items-center gap-2"><Palmtree size={16} className="text-gray-400" />Ferias/ano: {data.vacation_days_year || 22} dias</div>
            </div>
            {data.notes && <p className="text-sm text-gray-500 mt-3 pt-3 border-t">{data.notes}</p>}
          </div>

          {/* Vacation Summary Card */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2"><Palmtree size={20} /> Saldo de Ferias ({new Date().getFullYear()})</h2>
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{data.vacation_allowance || 22}</div>
                <div className="text-xs text-gray-500">Direito</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{data.vacation_used || 0}</div>
                <div className="text-xs text-gray-500">Usados</div>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{data.vacation_balance ?? 0}</div>
                <div className="text-xs text-gray-500">Restantes</div>
              </div>
              <div className="text-center p-3 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">{data.sick_days_used || 0}</div>
                <div className="text-xs text-gray-500">Atestados</div>
              </div>
            </div>
          </div>

          {/* Recent Timesheets */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2"><Clock size={20} /> Ultimas Horas ({data.timesheets?.length || 0})</h2>
            {data.timesheets?.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="table-header">Data</th>
                      <th className="table-header text-right">Horas</th>
                      <th className="table-header">Propriedade</th>
                      <th className="table-header">Descricao</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {data.timesheets.slice(0, 20).map((ts: any) => (
                      <tr key={ts.id}>
                        <td className="table-cell">{ts.date}</td>
                        <td className="table-cell text-right font-medium">{ts.hours}h</td>
                        <td className="table-cell">{ts.property_name || '-'}</td>
                        <td className="table-cell text-gray-500">{ts.description || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : <p className="text-center py-4 text-gray-400">Nenhum registro</p>}
            <div className="text-right text-sm text-gray-500 mt-2">Total Horas: <strong>{data.total_hours || 0}h</strong></div>
          </div>

          {/* Payroll History */}
          {data.payrolls?.length > 0 && (
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2"><DollarSign size={20} /> Historico de Pagamento</h2>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={[...data.payrolls].reverse()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                  <YAxis tickFormatter={(v: number) => `€${v}`} />
                  <Tooltip formatter={(v: number) => fmt(v)} />
                  <Bar dataKey="total_paid" fill="#10b981" name="Total Pago" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
              <div className="overflow-x-auto mt-4">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="table-header">Periodo</th>
                      <th className="table-header text-right">Base</th>
                      <th className="table-header text-right">Horas</th>
                      <th className="table-header text-right">Bonus</th>
                      <th className="table-header text-right">Descontos</th>
                      <th className="table-header text-right">Total</th>
                      <th className="table-header">Pago</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {data.payrolls.map((p: any) => (
                      <tr key={p.id}>
                        <td className="table-cell font-medium">{p.label}</td>
                        <td className="table-cell text-right">{fmt(p.base_salary)}</td>
                        <td className="table-cell text-right">{p.hours_worked}h / {fmt(p.hourly_amount)}</td>
                        <td className="table-cell text-right text-green-600">{p.bonus > 0 ? fmt(p.bonus) : '-'}</td>
                        <td className="table-cell text-right text-red-600">{p.deductions > 0 ? fmt(p.deductions) : '-'}</td>
                        <td className="table-cell text-right font-bold">{fmt(p.total_paid)}</td>
                        <td className="table-cell">{p.paid ? <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">Sim</span> : <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full">Nao</span>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* Time Offs Tab */}
      {tab === 'timeoffs' && (
        <div className="space-y-4">
          <div className="card flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2"><Palmtree size={20} /> Ferias e Ausencias</h2>
            <button onClick={() => setShowTimeOffModal(true)} className="btn-primary flex items-center gap-2"><Plus size={18} /> Novo Pedido</button>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center p-3 bg-blue-50 rounded-lg border">
              <div className="text-2xl font-bold text-blue-600">{data.vacation_allowance || 22}</div>
              <div className="text-xs text-gray-500">Direito Anual</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg border">
              <div className="text-2xl font-bold text-green-600">{data.vacation_used || 0}</div>
              <div className="text-xs text-gray-500">Ferias Usadas</div>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg border">
              <div className="text-2xl font-bold text-purple-600">{data.vacation_balance ?? 0}</div>
              <div className="text-xs text-gray-500">Ferias Restantes</div>
            </div>
            <div className="text-center p-3 bg-orange-50 rounded-lg border">
              <div className="text-2xl font-bold text-orange-600">{data.sick_days_used || 0}</div>
              <div className="text-xs text-gray-500">Atestados (Ano)</div>
            </div>
          </div>

          <div className="card overflow-x-auto p-0">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="table-header">Tipo</th>
                  <th className="table-header">Periodo</th>
                  <th className="table-header text-right">Dias</th>
                  <th className="table-header">Motivo</th>
                  <th className="table-header">Status</th>
                  <th className="table-header">Aprovado por</th>
                  <th className="table-header w-28">Acoes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(data.time_offs || []).map((to: any) => (
                  <tr key={to.id}>
                    <td className="table-cell font-medium">{TYPE_LABELS[to.type] || to.type}</td>
                    <td className="table-cell">{to.start_date} → {to.end_date}</td>
                    <td className="table-cell text-right font-medium">{to.days}</td>
                    <td className="table-cell text-gray-500">{to.reason || '-'}</td>
                    <td className="table-cell">
                      <span className={`text-xs px-2 py-1 rounded-full ${STATUS_COLORS[to.status] || 'bg-gray-100 text-gray-500'}`}>
                        {to.status}
                      </span>
                    </td>
                    <td className="table-cell text-gray-500">{to.approved_by || '-'}</td>
                    <td className="table-cell">
                      <div className="flex items-center gap-1">
                        {to.status === 'pendente' && (
                          <>
                            <button onClick={() => handleApprove(to.id)} className="text-green-500 hover:text-green-700" title="Aprovar"><Check size={16} /></button>
                            <button onClick={() => handleReject(to.id)} className="text-red-400 hover:text-red-600" title="Rejeitar"><X size={16} /></button>
                          </>
                        )}
                        <button onClick={() => handleDeleteTimeOff(to.id)} className="text-red-400 hover:text-red-600" title="Remover"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {(!data.time_offs || data.time_offs.length === 0) && <p className="text-center py-8 text-gray-400">Nenhum registro de ferias/ausencias</p>}
          </div>
        </div>
      )}

      {/* Documents Tab */}
      {tab === 'docs' && (
        <div className="space-y-4">
          <div className="card flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2"><FolderOpen size={20} /> Documentos do Funcionario</h2>
            <button onClick={() => setShowDocModal(true)} className="btn-primary flex items-center gap-2"><Plus size={18} /> Novo Documento</button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(data.documents || []).map((doc: any) => (
              <div key={doc.id} className="card flex items-start gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
                  <FileText size={20} className="text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-800 truncate">{doc.name}</h3>
                  {doc.type && <p className="text-xs text-gray-500">{doc.type}</p>}
                  {doc.file_url && (
                    <a href={doc.file_url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline truncate block">
                      {doc.file_url}
                    </a>
                  )}
                  {doc.uploaded_at && <p className="text-xs text-gray-400 mt-1">{new Date(doc.uploaded_at).toLocaleDateString('pt-BR')}</p>}
                </div>
                <button onClick={() => handleDeleteDoc(doc.id)} className="text-red-400 hover:text-red-600 shrink-0"><Trash2 size={16} /></button>
              </div>
            ))}
          </div>
          {(!data.documents || data.documents.length === 0) && (
            <div className="card text-center py-8 text-gray-400">
              <FolderOpen size={40} className="mx-auto mb-2 opacity-50" />
              <p>Nenhum documento adicionado</p>
            </div>
          )}
        </div>
      )}

      {/* Remarks Tab */}
      {tab === 'remarks' && (
        <div className="space-y-4">
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2"><MessageSquare size={20} /> Observacoes</h2>
            <div className="flex gap-2">
              <input
                value={remarkText}
                onChange={e => setRemarkText(e.target.value)}
                placeholder="Adicionar observacao..."
                className="input-field flex-1"
                onKeyDown={e => { if (e.key === 'Enter') handleAddRemark(); }}
              />
              <button onClick={handleAddRemark} className="btn-primary flex items-center gap-2"><Send size={18} /></button>
            </div>
          </div>

          <div className="space-y-3">
            {(data.remarks || []).map((r: any) => (
              <div key={r.id} className="card flex items-start gap-3">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                  <MessageSquare size={14} className="text-purple-600" />
                </div>
                <div className="flex-1">
                  <p className="text-gray-800">{r.text}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                    {r.created_by && <span>por {r.created_by}</span>}
                    {r.created_at && <span>{new Date(r.created_at).toLocaleString('pt-BR')}</span>}
                  </div>
                </div>
                <button onClick={() => handleDeleteRemark(r.id)} className="text-red-400 hover:text-red-600 shrink-0"><Trash2 size={16} /></button>
              </div>
            ))}
          </div>
          {(!data.remarks || data.remarks.length === 0) && (
            <div className="card text-center py-8 text-gray-400">
              <MessageSquare size={40} className="mx-auto mb-2 opacity-50" />
              <p>Nenhuma observacao adicionada</p>
            </div>
          )}
        </div>
      )}

      {/* Reviews Tab */}
      {tab === 'reviews' && (
        <div className="space-y-4">
          <div className="card flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <span className="text-yellow-400 text-xl">★</span> Avaliacoes de Desempenho
            </h2>
            <button onClick={() => setShowReviewModal(true)} className="btn-primary flex items-center gap-2"><Plus size={18} /> Nova Avaliacao</button>
          </div>

          {/* Average Rating Card */}
          {data.reviews?.length > 0 && (
            <div className="card">
              <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                <div className="text-center p-3 bg-yellow-50 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">{(data.avg_rating || 0).toFixed(1)}</div>
                  <div className="text-xs text-gray-500">Media Geral</div>
                </div>
                {['punctuality', 'quality', 'teamwork', 'communication'].map(cat => {
                  const avg = data.reviews.reduce((a: number, r: any) => a + (r[cat] || 3), 0) / data.reviews.length;
                  const labels: Record<string, string> = { punctuality: 'Pontualidade', quality: 'Qualidade', teamwork: 'Trabalho em Equipe', communication: 'Comunicacao' };
                  return (
                    <div key={cat} className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-xl font-bold text-gray-700">{avg.toFixed(1)}</div>
                      <div className="text-xs text-gray-500">{labels[cat]}</div>
                    </div>
                  );
                })}
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{data.reviews.length}</div>
                  <div className="text-xs text-gray-500">Total Aval.</div>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-3">
            {(data.reviews || []).map((r: any) => (
              <div key={r.id} className="card">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-semibold text-gray-800">{r.period || 'Sem periodo'}</span>
                      <div className="flex">{starRating(r.rating)}</div>
                      <span className="text-sm text-gray-500">por {r.reviewer_name || 'Anonimo'}</span>
                    </div>
                    <div className="grid grid-cols-4 gap-4 text-sm mt-2">
                      <div><span className="text-gray-400">Pontualidade:</span> <span className="font-medium">{r.punctuality}/5</span></div>
                      <div><span className="text-gray-400">Qualidade:</span> <span className="font-medium">{r.quality}/5</span></div>
                      <div><span className="text-gray-400">Equipe:</span> <span className="font-medium">{r.teamwork}/5</span></div>
                      <div><span className="text-gray-400">Comunicacao:</span> <span className="font-medium">{r.communication}/5</span></div>
                    </div>
                    {r.notes && <p className="text-sm text-gray-500 mt-2 pt-2 border-t">{r.notes}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">{r.created_at ? new Date(r.created_at).toLocaleDateString('pt-BR') : ''}</span>
                    <button onClick={() => handleDeleteReview(r.id)} className="text-red-400 hover:text-red-600"><Trash2 size={16} /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {(!data.reviews || data.reviews.length === 0) && (
            <div className="card text-center py-8 text-gray-400">
              <span className="text-4xl block mb-2">★</span>
              <p>Nenhuma avaliacao registrada</p>
            </div>
          )}
        </div>
      )}

      {/* Modal Nova Avaliacao */}
      <Modal isOpen={showReviewModal} onClose={() => setShowReviewModal(false)} title="Nova Avaliacao de Desempenho" size="md">
        <form onSubmit={handleAddReview} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Avaliador *</label>
              <input value={reviewForm.reviewer_name} onChange={e => setReviewForm({...reviewForm, reviewer_name: e.target.value})}
                className="input-field" required placeholder="Nome do avaliador" />
            </div>
            <div>
              <label className="label">Periodo *</label>
              <input value={reviewForm.period} onChange={e => setReviewForm({...reviewForm, period: e.target.value})}
                className="input-field" required placeholder="ex: Q1 2026, Mar 2026" />
            </div>
          </div>
          <div className="grid grid-cols-5 gap-3">
            {[
              { key: 'rating', label: 'Nota Geral' },
              { key: 'punctuality', label: 'Pontualidade' },
              { key: 'quality', label: 'Qualidade' },
              { key: 'teamwork', label: 'Equipe' },
              { key: 'communication', label: 'Comunicacao' },
            ].map(({ key, label }) => (
              <div key={key}>
                <label className="label text-xs">{label}</label>
                <select value={reviewForm[key]} onChange={e => setReviewForm({...reviewForm, [key]: Number(e.target.value)})} className="select-field">
                  {[1, 2, 3, 4, 5].map(v => <option key={v} value={v}>{v} ★</option>)}
                </select>
              </div>
            ))}
          </div>
          <div>
            <label className="label">Observacoes</label>
            <textarea value={reviewForm.notes} onChange={e => setReviewForm({...reviewForm, notes: e.target.value})}
              className="input-field" rows={3} placeholder="Pontos fortes, areas de melhoria..." />
          </div>
          <div className="flex justify-end gap-3 mt-2">
            <button type="button" onClick={() => setShowReviewModal(false)} className="btn-secondary">Cancelar</button>
            <button type="submit" className="btn-primary">Salvar Avaliacao</button>
          </div>
        </form>
      </Modal>

      {/* Modal Novo Pedido de Ferias/Ausencia */}
      <Modal isOpen={showTimeOffModal} onClose={() => setShowTimeOffModal(false)} title="Novo Pedido de Ferias/Ausencia" size="md">
        <form onSubmit={handleCreateTimeOff} className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="label">Tipo *</label>
            <select value={toForm.type} onChange={e => setToForm({...toForm, type: e.target.value})} className="select-field">
              <option value="ferias">Ferias</option>
              <option value="sick_day">Atestado / Sick Day</option>
              <option value="licenca">Licenca</option>
              <option value="folga">Folga</option>
            </select>
          </div>
          <div>
            <label className="label">Data Inicio *</label>
            <input type="date" value={toForm.start_date} onChange={e => {
              const start = e.target.value;
              const days = calcDays(start, toForm.end_date || start);
              setToForm({...toForm, start_date: start, days, end_date: toForm.end_date || start});
            }} className="input-field" required />
          </div>
          <div>
            <label className="label">Data Fim *</label>
            <input type="date" value={toForm.end_date} onChange={e => {
              const end = e.target.value;
              const days = calcDays(toForm.start_date || end, end);
              setToForm({...toForm, end_date: end, days});
            }} className="input-field" required />
          </div>
          <div>
            <label className="label">Dias</label>
            <input type="number" value={toForm.days} onChange={e => setToForm({...toForm, days: Number(e.target.value)})} className="input-field" min={1} />
          </div>
          <div className="col-span-2">
            <label className="label">Motivo</label>
            <input value={toForm.reason} onChange={e => setToForm({...toForm, reason: e.target.value})} className="input-field" placeholder="Motivo da ausencia..." />
          </div>
          <div className="col-span-2 flex justify-end gap-3 mt-2">
            <button type="button" onClick={() => setShowTimeOffModal(false)} className="btn-secondary">Cancelar</button>
            <button type="submit" className="btn-primary">Registrar</button>
          </div>
        </form>
      </Modal>

      {/* Modal Novo Documento */}
      <Modal isOpen={showDocModal} onClose={() => setShowDocModal(false)} title="Adicionar Documento" size="md">
        <form onSubmit={handleAddDoc} className="space-y-4">
          <div>
            <label className="label">Nome do Documento *</label>
            <input value={docForm.name} onChange={e => setDocForm({...docForm, name: e.target.value})} className="input-field" required placeholder="ex: Contrato de Trabalho" />
          </div>
          <div>
            <label className="label">Tipo</label>
            <select value={docForm.type} onChange={e => setDocForm({...docForm, type: e.target.value})} className="select-field">
              <option value="">Selecionar...</option>
              <option value="contrato">Contrato</option>
              <option value="identidade">Identidade</option>
              <option value="comprovante">Comprovante</option>
              <option value="atestado">Atestado</option>
              <option value="certificado">Certificado</option>
              <option value="outro">Outro</option>
            </select>
          </div>
          <div>
            <label className="label">URL do Arquivo</label>
            <input value={docForm.file_url} onChange={e => setDocForm({...docForm, file_url: e.target.value})} className="input-field" placeholder="https://..." />
          </div>
          <div className="flex justify-end gap-3 mt-2">
            <button type="button" onClick={() => setShowDocModal(false)} className="btn-secondary">Cancelar</button>
            <button type="submit" className="btn-primary">Adicionar</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
