import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import Modal from '../components/Modal';
import KPICard from '../components/KPICard';
import StatusBadge from '../components/StatusBadge';
import { Plus, Trash2, Edit2, Search, Users2, Clock, DollarSign, Palmtree, Check, X } from 'lucide-react';

const fmt = (v: number) => v.toLocaleString('en-IE', { style: 'currency', currency: 'EUR' });

interface Employee {
  id: number; code?: string; name: string; email?: string; phone?: string;
  role_title?: string; status: string; hire_date?: string;
  hourly_rate: number; monthly_salary: number; document_id?: string;
  iban?: string; notes?: string;
}

export default function HR() {
  const [tab, setTab] = useState<'employees' | 'timesheet' | 'payroll' | 'timeoffs'>('employees');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [timesheets, setTimesheets] = useState<any[]>([]);
  const [payrolls, setPayrolls] = useState<any[]>([]);
  const [properties, setProperties] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>({});
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showTsModal, setShowTsModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [showToModal, setShowToModal] = useState(false);
  const [timeOffs, setTimeOffs] = useState<any[]>([]);
  const [editModal, setEditModal] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);
  const navigate = useNavigate();

  const now = new Date();
  const [filterMonth, setFilterMonth] = useState(now.getMonth() + 1);
  const [filterYear, setFilterYear] = useState(now.getFullYear());

  const emptyForm = { name: '', email: '', phone: '', role_title: '', status: 'ativo', hire_date: '', hourly_rate: 0, monthly_salary: 0, document_id: '', iban: '', notes: '' };
  const [form, setForm] = useState<any>({ ...emptyForm });
  const [editForm, setEditForm] = useState<any>({ ...emptyForm });
  const [tsForm, setTsForm] = useState<any>({ employee_id: '', date: '', hours: 0, property_id: '', description: '' });
  const [payForm, setPayForm] = useState<any>({ employee_id: '', month: filterMonth, year: filterYear, base_salary: 0, hours_worked: 0, hourly_amount: 0, bonus: 0, deductions: 0, total_paid: 0, paid: false, paid_date: '', notes: '' });
  const [toForm, setToForm] = useState<any>({ employee_id: '', type: 'ferias', start_date: '', end_date: '', days: 1, reason: '' });

  const loadEmployees = () => {
    const params: any = {};
    if (search.trim()) params.search = search.trim();
    api.get('/hr/employees', { params }).then(r => setEmployees(r.data)).catch(() => setEmployees([]));
  };

  const loadTimesheets = () => {
    api.get('/hr/timesheets', { params: { month: filterMonth, year: filterYear } }).then(r => setTimesheets(r.data)).catch(() => setTimesheets([]));
  };

  const loadPayroll = () => {
    api.get('/hr/payroll', { params: { month: filterMonth, year: filterYear } }).then(r => setPayrolls(r.data)).catch(() => setPayrolls([]));
  };

  const loadTimeOffs = () => {
    api.get('/hr/time-offs').then(r => setTimeOffs(r.data)).catch(() => setTimeOffs([]));
  };

  const loadSummary = () => {
    api.get('/hr/summary').then(r => setSummary(r.data)).catch(() => {});
  };

  useEffect(() => {
    loadEmployees();
    loadSummary();
    loadTimeOffs();
    api.get('/properties').then(r => setProperties(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => loadEmployees(), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => { loadTimesheets(); loadPayroll(); }, [filterMonth, filterYear]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.post('/hr/employees', { ...form, hire_date: form.hire_date || null });
    setShowModal(false);
    setForm({ ...emptyForm });
    loadEmployees();
    loadSummary();
  };

  const openEdit = (emp: Employee, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditing(emp);
    setEditForm({ name: emp.name || '', email: emp.email || '', phone: emp.phone || '', role_title: emp.role_title || '', status: emp.status || 'ativo', hire_date: emp.hire_date || '', hourly_rate: emp.hourly_rate || 0, monthly_salary: emp.monthly_salary || 0, document_id: emp.document_id || '', iban: emp.iban || '', notes: emp.notes || '' });
    setEditModal(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    await api.put(`/hr/employees/${editing.id}`, { ...editForm, hire_date: editForm.hire_date || null });
    setEditModal(false);
    setEditing(null);
    loadEmployees();
  };

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Remover funcionario?')) { await api.delete(`/hr/employees/${id}`); loadEmployees(); loadSummary(); }
  };

  const handleCreateTs = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.post('/hr/timesheets', { ...tsForm, employee_id: Number(tsForm.employee_id), property_id: tsForm.property_id ? Number(tsForm.property_id) : null });
    setShowTsModal(false);
    setTsForm({ employee_id: '', date: '', hours: 0, property_id: '', description: '' });
    loadTimesheets();
  };

  const handleCreatePay = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.post('/hr/payroll', { ...payForm, employee_id: Number(payForm.employee_id), paid_date: payForm.paid_date || null });
    setShowPayModal(false);
    loadPayroll();
    loadSummary();
  };

  const handleCreateTimeOff = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.post('/hr/time-offs', { ...toForm, employee_id: Number(toForm.employee_id) });
    setShowToModal(false);
    setToForm({ employee_id: '', type: 'ferias', start_date: '', end_date: '', days: 1, reason: '' });
    loadTimeOffs();
  };

  const handleApproveTO = async (toId: number) => { await api.put(`/hr/time-offs/${toId}`, { status: 'aprovado' }); loadTimeOffs(); };
  const handleRejectTO = async (toId: number) => { await api.put(`/hr/time-offs/${toId}`, { status: 'rejeitado' }); loadTimeOffs(); };

  const TYPE_LABELS: any = { ferias: 'Ferias', sick_day: 'Atestado', licenca: 'Licenca', folga: 'Folga' };
  const STATUS_COLORS: any = { pendente: 'bg-yellow-100 text-yellow-700', aprovado: 'bg-green-100 text-green-700', rejeitado: 'bg-red-100 text-red-700', cancelado: 'bg-gray-100 text-gray-500' };

  const tabClass = (t: string) => `px-4 py-2 text-sm font-medium rounded-lg transition-colors ${tab === t ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2"><Users2 size={24} /> Sistema RH</h1>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard title="Funcionarios Ativos" value={String(summary.total_employees || 0)} color="blue" />
        <KPICard title="Folha Mensal" value={fmt(summary.total_monthly_salary || 0)} color="purple" />
        <KPICard title="Horas Este Mes" value={`${summary.hours_this_month || 0}h`} color="green" />
        <KPICard title="Pago Este Mes" value={fmt(summary.payroll_this_month || 0)} color="red" />
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button onClick={() => setTab('employees')} className={tabClass('employees')}>Funcionarios</button>
        <button onClick={() => setTab('timesheet')} className={tabClass('timesheet')}>Timesheet</button>
        <button onClick={() => setTab('payroll')} className={tabClass('payroll')}>Folha de Pagamento</button>
        <button onClick={() => setTab('timeoffs')} className={tabClass('timeoffs')}>Ferias/Ausencias</button>
      </div>

      {/* Employees Tab */}
      {tab === 'employees' && (
        <div className="space-y-4">
          <div className="card flex gap-4 items-center">
            <div className="relative flex-1 max-w-sm">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar..." className="input-field pl-10" />
            </div>
            <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2"><Plus size={18} /> Novo Funcionario</button>
          </div>
          <div className="card overflow-x-auto p-0">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="table-header">Codigo</th>
                  <th className="table-header">Nome</th>
                  <th className="table-header">Funcao</th>
                  <th className="table-header">Telefone</th>
                  <th className="table-header text-right">Salario/mes</th>
                  <th className="table-header text-right">Taxa/hora</th>
                  <th className="table-header">Status</th>
                  <th className="table-header w-20"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {employees.map(emp => (
                  <tr key={emp.id} className="hover:bg-blue-50 cursor-pointer transition-colors" onClick={() => navigate(`/rh/funcionarios/${emp.id}`)}>
                    <td className="table-cell font-mono text-xs text-blue-500">{emp.code || '-'}</td>
                    <td className="table-cell font-medium text-blue-600">{emp.name}</td>
                    <td className="table-cell">{emp.role_title || '-'}</td>
                    <td className="table-cell">{emp.phone || '-'}</td>
                    <td className="table-cell text-right font-medium">{emp.monthly_salary > 0 ? fmt(emp.monthly_salary) : '-'}</td>
                    <td className="table-cell text-right">{emp.hourly_rate > 0 ? `€${emp.hourly_rate}/h` : '-'}</td>
                    <td className="table-cell"><StatusBadge status={emp.status} /></td>
                    <td className="table-cell">
                      <div className="flex items-center gap-1">
                        <button onClick={(e) => openEdit(emp, e)} className="text-blue-400 hover:text-blue-600"><Edit2 size={16} /></button>
                        <button onClick={(e) => handleDelete(emp.id, e)} className="text-red-400 hover:text-red-600"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {employees.length === 0 && <p className="text-center py-8 text-gray-400">Nenhum funcionario cadastrado</p>}
          </div>
        </div>
      )}

      {/* Timesheet Tab */}
      {tab === 'timesheet' && (
        <div className="space-y-4">
          <div className="card flex gap-4 items-center">
            <select value={filterMonth} onChange={e => setFilterMonth(Number(e.target.value))} className="select-field w-32">
              {['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'].map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
            </select>
            <select value={filterYear} onChange={e => setFilterYear(Number(e.target.value))} className="select-field w-24">
              {[2024,2025,2026,2027].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <button onClick={() => setShowTsModal(true)} className="btn-primary flex items-center gap-2 ml-auto"><Plus size={18} /> Registrar Horas</button>
          </div>
          <div className="card overflow-x-auto p-0">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="table-header">Data</th>
                  <th className="table-header">Funcionario</th>
                  <th className="table-header text-right">Horas</th>
                  <th className="table-header">Propriedade</th>
                  <th className="table-header">Descricao</th>
                  <th className="table-header w-16"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {timesheets.map(ts => (
                  <tr key={ts.id}>
                    <td className="table-cell">{ts.date}</td>
                    <td className="table-cell font-medium">{ts.employee_name || '-'}</td>
                    <td className="table-cell text-right font-medium">{ts.hours}h</td>
                    <td className="table-cell">{ts.property_name || '-'}</td>
                    <td className="table-cell text-gray-500">{ts.description || '-'}</td>
                    <td className="table-cell">
                      <button onClick={async () => { await api.delete(`/hr/timesheets/${ts.id}`); loadTimesheets(); }} className="text-red-400 hover:text-red-600"><Trash2 size={16} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {timesheets.length === 0 && <p className="text-center py-8 text-gray-400">Nenhum registro de horas</p>}
          </div>
          <div className="text-right text-sm text-gray-500">
            Total: <strong>{timesheets.reduce((s: number, t: any) => s + t.hours, 0).toFixed(1)}h</strong>
          </div>
        </div>
      )}

      {/* Payroll Tab */}
      {tab === 'payroll' && (
        <div className="space-y-4">
          <div className="card flex gap-4 items-center">
            <select value={filterMonth} onChange={e => setFilterMonth(Number(e.target.value))} className="select-field w-32">
              {['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'].map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
            </select>
            <select value={filterYear} onChange={e => setFilterYear(Number(e.target.value))} className="select-field w-24">
              {[2024,2025,2026,2027].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <button onClick={() => { setPayForm({...payForm, month: filterMonth, year: filterYear}); setShowPayModal(true); }} className="btn-primary flex items-center gap-2 ml-auto"><Plus size={18} /> Nova Folha</button>
          </div>
          <div className="card overflow-x-auto p-0">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="table-header">Funcionario</th>
                  <th className="table-header text-right">Salario Base</th>
                  <th className="table-header text-right">Horas</th>
                  <th className="table-header text-right">Valor Horas</th>
                  <th className="table-header text-right">Bonus</th>
                  <th className="table-header text-right">Descontos</th>
                  <th className="table-header text-right">Total</th>
                  <th className="table-header">Pago</th>
                  <th className="table-header w-16"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {payrolls.map(p => (
                  <tr key={p.id}>
                    <td className="table-cell font-medium">{p.employee_name || '-'}</td>
                    <td className="table-cell text-right">{fmt(p.base_salary)}</td>
                    <td className="table-cell text-right">{p.hours_worked}h</td>
                    <td className="table-cell text-right">{fmt(p.hourly_amount)}</td>
                    <td className="table-cell text-right text-green-600">{p.bonus > 0 ? fmt(p.bonus) : '-'}</td>
                    <td className="table-cell text-right text-red-600">{p.deductions > 0 ? fmt(p.deductions) : '-'}</td>
                    <td className="table-cell text-right font-bold">{fmt(p.total_paid)}</td>
                    <td className="table-cell">{p.paid ? <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">Sim</span> : <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full">Nao</span>}</td>
                    <td className="table-cell">
                      <button onClick={async () => { await api.delete(`/hr/payroll/${p.id}`); loadPayroll(); }} className="text-red-400 hover:text-red-600"><Trash2 size={16} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {payrolls.length === 0 && <p className="text-center py-8 text-gray-400">Nenhuma folha de pagamento</p>}
          </div>
          <div className="text-right text-sm text-gray-500">
            Total Folha: <strong>{fmt(payrolls.reduce((s: number, p: any) => s + p.total_paid, 0))}</strong>
          </div>
        </div>
      )}

      {/* Time Offs Tab */}
      {tab === 'timeoffs' && (
        <div className="space-y-4">
          <div className="card flex gap-4 items-center">
            <span className="text-sm text-gray-500">Todos os pedidos de ferias e ausencias</span>
            <button onClick={() => setShowToModal(true)} className="btn-primary flex items-center gap-2 ml-auto"><Plus size={18} /> Novo Pedido</button>
          </div>
          <div className="card overflow-x-auto p-0">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="table-header">Funcionario</th>
                  <th className="table-header">Tipo</th>
                  <th className="table-header">Periodo</th>
                  <th className="table-header text-right">Dias</th>
                  <th className="table-header">Motivo</th>
                  <th className="table-header">Status</th>
                  <th className="table-header w-24">Acoes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {timeOffs.map((to: any) => (
                  <tr key={to.id}>
                    <td className="table-cell font-medium">{to.employee_name || '-'}</td>
                    <td className="table-cell">{TYPE_LABELS[to.type] || to.type}</td>
                    <td className="table-cell">{to.start_date} → {to.end_date}</td>
                    <td className="table-cell text-right font-medium">{to.days}</td>
                    <td className="table-cell text-gray-500">{to.reason || '-'}</td>
                    <td className="table-cell">
                      <span className={`text-xs px-2 py-1 rounded-full ${STATUS_COLORS[to.status] || 'bg-gray-100 text-gray-500'}`}>
                        {to.status}
                      </span>
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center gap-1">
                        {to.status === 'pendente' && (
                          <>
                            <button onClick={() => handleApproveTO(to.id)} className="text-green-500 hover:text-green-700" title="Aprovar"><Check size={16} /></button>
                            <button onClick={() => handleRejectTO(to.id)} className="text-red-400 hover:text-red-600" title="Rejeitar"><X size={16} /></button>
                          </>
                        )}
                        <button onClick={async () => { if (confirm('Remover?')) { await api.delete(`/hr/time-offs/${to.id}`); loadTimeOffs(); }}} className="text-red-400 hover:text-red-600"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {timeOffs.length === 0 && <p className="text-center py-8 text-gray-400">Nenhum pedido registrado</p>}
          </div>
        </div>
      )}

      {/* Modal Novo Pedido Ferias/Ausencia */}
      <Modal isOpen={showToModal} onClose={() => setShowToModal(false)} title="Novo Pedido de Ferias/Ausencia" size="md">
        <form onSubmit={handleCreateTimeOff} className="grid grid-cols-2 gap-4">
          <div className="col-span-2"><label className="label">Funcionario *</label>
            <select value={toForm.employee_id} onChange={e => setToForm({...toForm, employee_id: e.target.value})} className="select-field" required>
              <option value="">Selecionar...</option>
              {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.code} - {emp.name}</option>)}
            </select>
          </div>
          <div className="col-span-2"><label className="label">Tipo *</label>
            <select value={toForm.type} onChange={e => setToForm({...toForm, type: e.target.value})} className="select-field">
              <option value="ferias">Ferias</option>
              <option value="sick_day">Atestado / Sick Day</option>
              <option value="licenca">Licenca</option>
              <option value="folga">Folga</option>
            </select>
          </div>
          <div><label className="label">Data Inicio *</label><input type="date" value={toForm.start_date} onChange={e => setToForm({...toForm, start_date: e.target.value})} className="input-field" required /></div>
          <div><label className="label">Data Fim *</label><input type="date" value={toForm.end_date} onChange={e => setToForm({...toForm, end_date: e.target.value})} className="input-field" required /></div>
          <div><label className="label">Dias</label><input type="number" value={toForm.days} onChange={e => setToForm({...toForm, days: Number(e.target.value)})} className="input-field" min={1} /></div>
          <div className="col-span-2"><label className="label">Motivo</label><input value={toForm.reason} onChange={e => setToForm({...toForm, reason: e.target.value})} className="input-field" placeholder="Motivo..." /></div>
          <div className="col-span-2 flex justify-end gap-3 mt-2">
            <button type="button" onClick={() => setShowToModal(false)} className="btn-secondary">Cancelar</button>
            <button type="submit" className="btn-primary">Registrar</button>
          </div>
        </form>
      </Modal>

      {/* Modal Novo Funcionario */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Novo Funcionario" size="lg">
        <form onSubmit={handleCreate} className="grid grid-cols-2 gap-4">
          <div className="col-span-2"><label className="label">Nome *</label><input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="input-field" required /></div>
          <div><label className="label">Email</label><input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="input-field" /></div>
          <div><label className="label">Telefone</label><input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="input-field" /></div>
          <div><label className="label">Funcao</label><input value={form.role_title} onChange={e => setForm({...form, role_title: e.target.value})} className="input-field" placeholder="ex: Limpeza, Manutencao" /></div>
          <div><label className="label">Data Contratacao</label><input type="date" value={form.hire_date} onChange={e => setForm({...form, hire_date: e.target.value})} className="input-field" /></div>
          <div><label className="label">Salario Mensal (EUR)</label><input type="number" step="0.01" value={form.monthly_salary} onChange={e => setForm({...form, monthly_salary: Number(e.target.value)})} className="input-field" /></div>
          <div><label className="label">Taxa por Hora (EUR)</label><input type="number" step="0.01" value={form.hourly_rate} onChange={e => setForm({...form, hourly_rate: Number(e.target.value)})} className="input-field" /></div>
          <div><label className="label">Documento (ID)</label><input value={form.document_id} onChange={e => setForm({...form, document_id: e.target.value})} className="input-field" /></div>
          <div><label className="label">IBAN</label><input value={form.iban} onChange={e => setForm({...form, iban: e.target.value})} className="input-field" /></div>
          <div className="col-span-2"><label className="label">Notas</label><textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} className="input-field" rows={2} /></div>
          <div className="col-span-2 flex justify-end gap-3 mt-2">
            <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancelar</button>
            <button type="submit" className="btn-primary">Salvar</button>
          </div>
        </form>
      </Modal>

      {/* Modal Editar Funcionario */}
      <Modal isOpen={editModal} onClose={() => setEditModal(false)} title={`Editar: ${editing?.name || ''}`} size="lg">
        <form onSubmit={handleUpdate} className="grid grid-cols-2 gap-4">
          <div className="col-span-2"><label className="label">Nome *</label><input value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} className="input-field" required /></div>
          <div><label className="label">Email</label><input type="email" value={editForm.email} onChange={e => setEditForm({...editForm, email: e.target.value})} className="input-field" /></div>
          <div><label className="label">Telefone</label><input value={editForm.phone} onChange={e => setEditForm({...editForm, phone: e.target.value})} className="input-field" /></div>
          <div><label className="label">Funcao</label><input value={editForm.role_title} onChange={e => setEditForm({...editForm, role_title: e.target.value})} className="input-field" /></div>
          <div><label className="label">Status</label>
            <select value={editForm.status} onChange={e => setEditForm({...editForm, status: e.target.value})} className="select-field">
              <option value="ativo">Ativo</option><option value="inativo">Inativo</option><option value="ferias">Ferias</option><option value="desligado">Desligado</option>
            </select>
          </div>
          <div><label className="label">Salario Mensal (EUR)</label><input type="number" step="0.01" value={editForm.monthly_salary} onChange={e => setEditForm({...editForm, monthly_salary: Number(e.target.value)})} className="input-field" /></div>
          <div><label className="label">Taxa por Hora (EUR)</label><input type="number" step="0.01" value={editForm.hourly_rate} onChange={e => setEditForm({...editForm, hourly_rate: Number(e.target.value)})} className="input-field" /></div>
          <div><label className="label">IBAN</label><input value={editForm.iban} onChange={e => setEditForm({...editForm, iban: e.target.value})} className="input-field" /></div>
          <div><label className="label">Data Contratacao</label><input type="date" value={editForm.hire_date} onChange={e => setEditForm({...editForm, hire_date: e.target.value})} className="input-field" /></div>
          <div className="col-span-2"><label className="label">Notas</label><textarea value={editForm.notes} onChange={e => setEditForm({...editForm, notes: e.target.value})} className="input-field" rows={2} /></div>
          <div className="col-span-2 flex justify-end gap-3 mt-2">
            <button type="button" onClick={() => setEditModal(false)} className="btn-secondary">Cancelar</button>
            <button type="submit" className="btn-primary">Atualizar</button>
          </div>
        </form>
      </Modal>

      {/* Modal Registrar Horas */}
      <Modal isOpen={showTsModal} onClose={() => setShowTsModal(false)} title="Registrar Horas" size="md">
        <form onSubmit={handleCreateTs} className="grid grid-cols-2 gap-4">
          <div className="col-span-2"><label className="label">Funcionario *</label>
            <select value={tsForm.employee_id} onChange={e => setTsForm({...tsForm, employee_id: e.target.value})} className="select-field" required>
              <option value="">Selecionar...</option>
              {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.code} - {emp.name}</option>)}
            </select>
          </div>
          <div><label className="label">Data *</label><input type="date" value={tsForm.date} onChange={e => setTsForm({...tsForm, date: e.target.value})} className="input-field" required /></div>
          <div><label className="label">Horas *</label><input type="number" step="0.5" value={tsForm.hours} onChange={e => setTsForm({...tsForm, hours: Number(e.target.value)})} className="input-field" required /></div>
          <div className="col-span-2"><label className="label">Propriedade</label>
            <select value={tsForm.property_id} onChange={e => setTsForm({...tsForm, property_id: e.target.value})} className="select-field">
              <option value="">Nenhuma</option>
              {properties.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div className="col-span-2"><label className="label">Descricao</label><input value={tsForm.description} onChange={e => setTsForm({...tsForm, description: e.target.value})} className="input-field" /></div>
          <div className="col-span-2 flex justify-end gap-3 mt-2">
            <button type="button" onClick={() => setShowTsModal(false)} className="btn-secondary">Cancelar</button>
            <button type="submit" className="btn-primary">Registrar</button>
          </div>
        </form>
      </Modal>

      {/* Modal Nova Folha */}
      <Modal isOpen={showPayModal} onClose={() => setShowPayModal(false)} title="Nova Folha de Pagamento" size="lg">
        <form onSubmit={handleCreatePay} className="grid grid-cols-2 gap-4">
          <div className="col-span-2"><label className="label">Funcionario *</label>
            <select value={payForm.employee_id} onChange={e => {
              const empId = Number(e.target.value);
              const emp = employees.find(x => x.id === empId);
              setPayForm({...payForm, employee_id: e.target.value, base_salary: emp?.monthly_salary || 0, total_paid: emp?.monthly_salary || 0 });
            }} className="select-field" required>
              <option value="">Selecionar...</option>
              {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.code} - {emp.name}</option>)}
            </select>
          </div>
          <div><label className="label">Salario Base</label><input type="number" step="0.01" value={payForm.base_salary} onChange={e => { const v = Number(e.target.value); setPayForm({...payForm, base_salary: v, total_paid: v + payForm.hourly_amount + payForm.bonus - payForm.deductions }); }} className="input-field" /></div>
          <div><label className="label">Horas Trabalhadas</label><input type="number" step="0.5" value={payForm.hours_worked} onChange={e => setPayForm({...payForm, hours_worked: Number(e.target.value)})} className="input-field" /></div>
          <div><label className="label">Valor Horas</label><input type="number" step="0.01" value={payForm.hourly_amount} onChange={e => { const v = Number(e.target.value); setPayForm({...payForm, hourly_amount: v, total_paid: payForm.base_salary + v + payForm.bonus - payForm.deductions }); }} className="input-field" /></div>
          <div><label className="label">Bonus</label><input type="number" step="0.01" value={payForm.bonus} onChange={e => { const v = Number(e.target.value); setPayForm({...payForm, bonus: v, total_paid: payForm.base_salary + payForm.hourly_amount + v - payForm.deductions }); }} className="input-field" /></div>
          <div><label className="label">Descontos</label><input type="number" step="0.01" value={payForm.deductions} onChange={e => { const v = Number(e.target.value); setPayForm({...payForm, deductions: v, total_paid: payForm.base_salary + payForm.hourly_amount + payForm.bonus - v }); }} className="input-field" /></div>
          <div><label className="label">Total a Pagar</label><input type="number" step="0.01" value={payForm.total_paid} onChange={e => setPayForm({...payForm, total_paid: Number(e.target.value)})} className="input-field font-bold" /></div>
          <div><label className="label flex items-center gap-2"><input type="checkbox" checked={payForm.paid} onChange={e => setPayForm({...payForm, paid: e.target.checked})} /> Pago</label></div>
          {payForm.paid && <div><label className="label">Data Pagamento</label><input type="date" value={payForm.paid_date} onChange={e => setPayForm({...payForm, paid_date: e.target.value})} className="input-field" /></div>}
          <div className="col-span-2"><label className="label">Notas</label><input value={payForm.notes} onChange={e => setPayForm({...payForm, notes: e.target.value})} className="input-field" /></div>
          <div className="col-span-2 flex justify-end gap-3 mt-2">
            <button type="button" onClick={() => setShowPayModal(false)} className="btn-secondary">Cancelar</button>
            <button type="submit" className="btn-primary">Salvar</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
