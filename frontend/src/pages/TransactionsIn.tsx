import React, { useEffect, useState } from 'react';
import { getTransactionsIn, getTransactionsInSummary, createTransactionIn, updateTransactionIn, deleteTransactionIn, getProperties, getCategoriesIn, getPaymentMethods, getClients } from '../services/api';
import { TransactionIn, Property, Client } from '../types';
import Modal from '../components/Modal';
import { Plus, Trash2, Search, Pencil } from 'lucide-react';

const fmt = (v: number) => v.toLocaleString('en-IE', { style: 'currency', currency: 'EUR' });

const emptyForm = {
  date: new Date().toISOString().split('T')[0],
  description: '', method: '', amount: 0,
  category: '', property_id: '', client_id: '', competencia_month: new Date().getMonth() + 1,
  competencia_year: 2026, invoice: '', lodgement: ''
};

export default function TransactionsInPage() {
  const [items, setItems] = useState<TransactionIn[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [methods, setMethods] = useState<string[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [filterMonth, setFilterMonth] = useState('');
  const [filterYear, setFilterYear] = useState(2026);
  const [filterProp, setFilterProp] = useState('');
  const [search, setSearch] = useState('');
  const [form, setForm] = useState<any>({ ...emptyForm });
  const [serverTotal, setServerTotal] = useState<number>(0);
  const [totalCount, setTotalCount] = useState<number>(0);

  const load = () => {
    const params: any = { year: filterYear };
    if (filterMonth) params.month = filterMonth;
    if (filterProp) params.property_id = filterProp;
    getTransactionsIn(params).then(r => setItems(Array.isArray(r.data) ? r.data : [])).catch(() => setItems([]));
    getTransactionsInSummary(params).then(r => { setServerTotal(r.data.total_amount); setTotalCount(r.data.count); }).catch(() => {});
  };

  useEffect(() => {
    load();
    getProperties().then(r => setProperties(Array.isArray(r.data) ? r.data : [])).catch(() => {});
    getClients().then(r => setClients(Array.isArray(r.data) ? r.data : [])).catch(() => {});
    getCategoriesIn().then(r => setCategories(Array.isArray(r.data) ? r.data : [])).catch(() => {});
    getPaymentMethods().then(r => setMethods(Array.isArray(r.data) ? r.data : [])).catch(() => {});
  }, [filterMonth, filterYear, filterProp]);

  const filteredClients = form.property_id
    ? clients.filter(c => c.property_id === Number(form.property_id))
    : clients;

  const filteredItems = search.trim()
    ? items.filter(t => {
        const s = search.toLowerCase();
        return (t.description || '').toLowerCase().includes(s)
          || (t.property_name || '').toLowerCase().includes(s)
          || ((t as any).client_name || '').toLowerCase().includes(s)
          || (t.category || '').toLowerCase().includes(s)
          || (t.method || '').toLowerCase().includes(s)
          || (t.invoice || '').toLowerCase().includes(s)
          || (t.date || '').includes(s);
      })
    : items;

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...emptyForm });
    setShowModal(true);
  };

  const openEdit = (t: TransactionIn) => {
    setEditingId(t.id);
    setForm({
      date: t.date || '',
      description: t.description || '',
      method: t.method || '',
      amount: t.amount || 0,
      category: t.category || '',
      property_id: t.property_id || '',
      client_id: (t as any).client_id || '',
      competencia_month: t.competencia_month || 1,
      competencia_year: t.competencia_year || 2026,
      invoice: t.invoice || '',
      lodgement: t.lodgement || '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      ...form,
      property_id: form.property_id ? Number(form.property_id) : null,
      client_id: form.client_id ? Number(form.client_id) : null,
      amount: Number(form.amount) || 0,
      method: form.method || null,
      category: form.category || null,
      competencia_month: Number(form.competencia_month) || null,
      competencia_year: Number(form.competencia_year) || null,
    };
    try {
      if (editingId) {
        await updateTransactionIn(editingId, data);
      } else {
        await createTransactionIn(data);
      }
      setShowModal(false);
      setEditingId(null);
      load();
    } catch (err: any) {
      const msg = err?.response?.data?.detail || 'Erro ao salvar entrada';
      alert(typeof msg === 'string' ? msg : JSON.stringify(msg));
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Remover esta entrada?')) { await deleteTransactionIn(id); load(); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Entradas (In)</h1>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2"><Plus size={18} /> Nova Entrada</button>
      </div>

      <div className="card flex flex-wrap gap-4 items-center">
        <select value={filterYear} onChange={e => setFilterYear(Number(e.target.value))} className="select-field w-28">
          <option value={2026}>2026</option><option value={2025}>2025</option>
        </select>
        <select value={filterMonth} onChange={e => setFilterMonth(e.target.value)} className="select-field w-32">
          <option value="">Todos os meses</option>
          {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => <option key={m} value={m}>Mes {m}</option>)}
        </select>
        <select value={filterProp} onChange={e => setFilterProp(e.target.value)} className="select-field w-48">
          <option value="">Todas propriedades</option>
          {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por descricao, cliente, propriedade..." className="input-field w-full pl-9" />
        </div>
        {search && <span className="text-xs text-gray-500">{filteredItems.length} de {items.length}</span>}
      </div>

      <div className="card text-center">
        <p className="text-sm text-gray-500">Total{totalCount > items.length ? ` (${totalCount} transacoes)` : ''}</p>
        <p className="text-2xl font-bold text-blue-600">{fmt(serverTotal)}</p>
      </div>

      <div className="card overflow-x-auto p-0">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="table-header">Data</th><th className="table-header">Descricao</th><th className="table-header">Propriedade</th>
              <th className="table-header">Cliente</th><th className="table-header">Categoria</th><th className="table-header">Metodo</th>
              <th className="table-header text-right">Amount</th>
              <th className="table-header">Comp.</th><th className="table-header w-20"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredItems.map(t => (
              <tr key={t.id} className="hover:bg-gray-50">
                <td className="table-cell whitespace-nowrap">{t.date}</td>
                <td className="table-cell max-w-[200px] truncate">{t.description}</td>
                <td className="table-cell">{t.property_name || '-'}</td>
                <td className="table-cell">{(t as any).client_name || '-'}</td>
                <td className="table-cell">{t.category}</td>
                <td className="table-cell">{t.method}</td>
                <td className="table-cell text-right font-medium">{fmt(t.amount || 0)}</td>
                <td className="table-cell">{t.competencia_month}/{t.competencia_year}</td>
                <td className="table-cell flex gap-2">
                  <button onClick={() => openEdit(t)} className="text-blue-400 hover:text-blue-600"><Pencil size={16} /></button>
                  <button onClick={() => handleDelete(t.id)} className="text-red-400 hover:text-red-600"><Trash2 size={16} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredItems.length === 0 && <p className="text-center py-8 text-gray-400">{search ? 'Nenhum resultado para a busca' : 'Nenhuma entrada encontrada'}</p>}
      </div>

      <Modal isOpen={showModal} onClose={() => { setShowModal(false); setEditingId(null); }} title={editingId ? 'Editar Entrada' : 'Nova Entrada'} size="lg">
        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
          <div><label className="label">Data</label><input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} className="input-field" required /></div>
          <div><label className="label">Metodo</label><select value={form.method} onChange={e => setForm({...form, method: e.target.value})} className="select-field">{methods.map(m => <option key={m} value={m}>{m}</option>)}</select></div>
          <div className="col-span-2"><label className="label">Descricao</label><input value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="input-field" /></div>
          <div><label className="label">Amount</label><input type="number" step="0.01" value={form.amount} onChange={e => setForm({...form, amount: Number(e.target.value)})} className="input-field" /></div>
          <div><label className="label">Categoria</label><select value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="select-field">{categories.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
          <div><label className="label">Propriedade</label><select value={form.property_id} onChange={e => setForm({...form, property_id: e.target.value, client_id: ''})} className="select-field"><option value="">-</option>{properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
          <div><label className="label">Cliente</label><select value={form.client_id} onChange={e => setForm({...form, client_id: e.target.value})} className="select-field"><option value="">-</option>{filteredClients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
          <div><label className="label">Mes Comp.</label><input type="number" min="1" max="12" value={form.competencia_month} onChange={e => setForm({...form, competencia_month: Number(e.target.value)})} className="input-field" /></div>
          <div><label className="label">Ano Comp.</label><input type="number" value={form.competencia_year} onChange={e => setForm({...form, competencia_year: Number(e.target.value)})} className="input-field" /></div>
          <div><label className="label">Invoice</label><input value={form.invoice} onChange={e => setForm({...form, invoice: e.target.value})} className="input-field" /></div>
          <div className="col-span-2 flex justify-end gap-3 mt-2">
            <button type="button" onClick={() => { setShowModal(false); setEditingId(null); }} className="btn-secondary">Cancelar</button>
            <button type="submit" className="btn-primary">{editingId ? 'Atualizar' : 'Salvar'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
