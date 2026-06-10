#!/usr/bin/env python3
import os
PROJECT = os.path.expanduser("~/Desktop/dream-abroad")

transactions_in = '''import React, { useEffect, useState } from 'react';
import { getTransactionsIn, createTransactionIn, deleteTransactionIn, getProperties, getCategoriesIn, getPaymentMethods, getClients } from '../services/api';
import { TransactionIn, Property, Client } from '../types';
import Modal from '../components/Modal';
import { Plus, Trash2, Search } from 'lucide-react';

const fmt = (v: number) => v.toLocaleString('en-IE', { style: 'currency', currency: 'EUR' });

export default function TransactionsInPage() {
  const [items, setItems] = useState<TransactionIn[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [methods, setMethods] = useState<string[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [filterMonth, setFilterMonth] = useState('');
  const [filterYear, setFilterYear] = useState(2026);
  const [filterProp, setFilterProp] = useState('');
  const [search, setSearch] = useState('');
  const [form, setForm] = useState<any>({
    date: new Date().toISOString().split('T')[0],
    description: '', method: '', amount_bank: 0, amount_rent: 0, amount_deposit: 0,
    category: '', property_id: '', client_id: '', competencia_month: new Date().getMonth() + 1,
    competencia_year: 2026, invoice: '', lodgement: ''
  });

  const load = () => {
    const params: any = { year: filterYear };
    if (filterMonth) params.month = filterMonth;
    if (filterProp) params.property_id = filterProp;
    getTransactionsIn(params).then(r => setItems(r.data));
  };

  useEffect(() => {
    load();
    getProperties().then(r => setProperties(r.data));
    getClients().then(r => setClients(r.data));
    getCategoriesIn().then(r => setCategories(r.data));
    getPaymentMethods().then(r => setMethods(r.data));
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

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = { ...form, property_id: form.property_id ? Number(form.property_id) : null, client_id: form.client_id ? Number(form.client_id) : null };
    await createTransactionIn(data);
    setShowModal(false);
    load();
  };

  const handleDelete = async (id: number) => {
    if (confirm('Remover esta entrada?')) { await deleteTransactionIn(id); load(); }
  };

  const totalBank = filteredItems.reduce((s, t) => s + t.amount_bank, 0);
  const totalRent = filteredItems.reduce((s, t) => s + t.amount_rent, 0);
  const totalDeposit = filteredItems.reduce((s, t) => s + t.amount_deposit, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Entradas (In)</h1>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2"><Plus size={18} /> Nova Entrada</button>
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

      <div className="grid grid-cols-3 gap-4">
        <div className="card text-center"><p className="text-sm text-gray-500">Total Bank</p><p className="text-xl font-bold text-blue-600">{fmt(totalBank)}</p></div>
        <div className="card text-center"><p className="text-sm text-gray-500">Total Rent</p><p className="text-xl font-bold text-green-600">{fmt(totalRent)}</p></div>
        <div className="card text-center"><p className="text-sm text-gray-500">Total Deposit</p><p className="text-xl font-bold text-purple-600">{fmt(totalDeposit)}</p></div>
      </div>

      <div className="card overflow-x-auto p-0">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="table-header">Data</th><th className="table-header">Descricao</th><th className="table-header">Propriedade</th>
              <th className="table-header">Cliente</th><th className="table-header">Categoria</th><th className="table-header">Metodo</th>
              <th className="table-header text-right">Bank</th><th className="table-header text-right">Rent</th><th className="table-header text-right">Deposit</th>
              <th className="table-header">Comp.</th><th className="table-header w-10"></th>
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
                <td className="table-cell text-right font-medium">{fmt(t.amount_bank)}</td>
                <td className="table-cell text-right font-medium">{fmt(t.amount_rent)}</td>
                <td className="table-cell text-right font-medium">{fmt(t.amount_deposit)}</td>
                <td className="table-cell">{t.competencia_month}/{t.competencia_year}</td>
                <td className="table-cell"><button onClick={() => handleDelete(t.id)} className="text-red-400 hover:text-red-600"><Trash2 size={16} /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredItems.length === 0 && <p className="text-center py-8 text-gray-400">{search ? 'Nenhum resultado para a busca' : 'Nenhuma entrada encontrada'}</p>}
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Nova Entrada" size="lg">
        <form onSubmit={handleCreate} className="grid grid-cols-2 gap-4">
          <div><label className="label">Data</label><input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} className="input-field" required /></div>
          <div><label className="label">Metodo</label><select value={form.method} onChange={e => setForm({...form, method: e.target.value})} className="select-field">{methods.map(m => <option key={m} value={m}>{m}</option>)}</select></div>
          <div className="col-span-2"><label className="label">Descricao</label><input value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="input-field" /></div>
          <div><label className="label">Amount Bank</label><input type="number" step="0.01" value={form.amount_bank} onChange={e => setForm({...form, amount_bank: Number(e.target.value)})} className="input-field" /></div>
          <div><label className="label">Amount Rent</label><input type="number" step="0.01" value={form.amount_rent} onChange={e => setForm({...form, amount_rent: Number(e.target.value)})} className="input-field" /></div>
          <div><label className="label">Amount Deposit</label><input type="number" step="0.01" value={form.amount_deposit} onChange={e => setForm({...form, amount_deposit: Number(e.target.value)})} className="input-field" /></div>
          <div><label className="label">Categoria</label><select value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="select-field">{categories.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
          <div><label className="label">Propriedade</label><select value={form.property_id} onChange={e => setForm({...form, property_id: e.target.value, client_id: ''})} className="select-field"><option value="">-</option>{properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
          <div><label className="label">Cliente</label><select value={form.client_id} onChange={e => setForm({...form, client_id: e.target.value})} className="select-field"><option value="">-</option>{filteredClients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
          <div><label className="label">Mes Comp.</label><input type="number" min="1" max="12" value={form.competencia_month} onChange={e => setForm({...form, competencia_month: Number(e.target.value)})} className="input-field" /></div>
          <div><label className="label">Ano Comp.</label><input type="number" value={form.competencia_year} onChange={e => setForm({...form, competencia_year: Number(e.target.value)})} className="input-field" /></div>
          <div><label className="label">Invoice</label><input value={form.invoice} onChange={e => setForm({...form, invoice: e.target.value})} className="input-field" /></div>
          <div className="col-span-2 flex justify-end gap-3 mt-2">
            <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancelar</button>
            <button type="submit" className="btn-primary">Salvar</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
'''

transactions_out = '''import React, { useEffect, useState } from 'react';
import { getTransactionsOut, createTransactionOut, deleteTransactionOut, getProperties, getCategoriesOut, getPaymentMethods } from '../services/api';
import { TransactionOut, Property } from '../types';
import Modal from '../components/Modal';
import { Plus, Trash2, Search } from 'lucide-react';

const fmt = (v: number) => v.toLocaleString('en-IE', { style: 'currency', currency: 'EUR' });

export default function TransactionsOutPage() {
  const [items, setItems] = useState<TransactionOut[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [methods, setMethods] = useState<string[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [filterYear, setFilterYear] = useState(2026);
  const [filterMonth, setFilterMonth] = useState('');
  const [filterProp, setFilterProp] = useState('');
  const [search, setSearch] = useState('');
  const [form, setForm] = useState<any>({
    date: new Date().toISOString().split('T')[0],
    description: '', method: '', total_paid: 0, category: '',
    property_id: '', competencia_month: new Date().getMonth() + 1, competencia_year: 2026
  });

  const load = () => {
    const params: any = { year: filterYear };
    if (filterMonth) params.month = filterMonth;
    if (filterProp) params.property_id = filterProp;
    getTransactionsOut(params).then(r => setItems(r.data));
  };

  useEffect(() => {
    load();
    getProperties().then(r => setProperties(r.data));
    getCategoriesOut().then(r => setCategories(r.data));
    getPaymentMethods().then(r => setMethods(r.data));
  }, [filterYear, filterMonth, filterProp]);

  const filteredItems = search.trim()
    ? items.filter(t => {
        const s = search.toLowerCase();
        return (t.description || '').toLowerCase().includes(s)
          || (t.property_name || '').toLowerCase().includes(s)
          || (t.category || '').toLowerCase().includes(s)
          || (t.method || '').toLowerCase().includes(s)
          || (t.date || '').includes(s);
      })
    : items;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = { ...form, property_id: form.property_id ? Number(form.property_id) : null };
    await createTransactionOut(data);
    setShowModal(false);
    load();
  };

  const handleDelete = async (id: number) => {
    if (confirm('Remover esta saida?')) { await deleteTransactionOut(id); load(); }
  };

  const total = filteredItems.reduce((s, t) => s + t.total_paid, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Saidas (Out)</h1>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2"><Plus size={18} /> Nova Saida</button>
      </div>

      <div className="card flex flex-wrap gap-4 items-center">
        <select value={filterYear} onChange={e => setFilterYear(Number(e.target.value))} className="select-field w-28"><option value={2026}>2026</option><option value={2025}>2025</option></select>
        <select value={filterMonth} onChange={e => setFilterMonth(e.target.value)} className="select-field w-32"><option value="">Todos os meses</option>{[1,2,3,4,5,6,7,8,9,10,11,12].map(m => <option key={m} value={m}>Mes {m}</option>)}</select>
        <select value={filterProp} onChange={e => setFilterProp(e.target.value)} className="select-field w-48"><option value="">Todas propriedades</option>{properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por descricao, propriedade, categoria..." className="input-field w-full pl-9" />
        </div>
        <div className="card py-2 px-4"><span className="text-sm text-gray-500">Total: </span><span className="font-bold text-red-600">{fmt(total)}</span></div>
        {search && <span className="text-xs text-gray-500">{filteredItems.length} de {items.length}</span>}
      </div>

      <div className="card overflow-x-auto p-0">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="table-header">Data</th><th className="table-header">Descricao</th><th className="table-header">Propriedade</th>
              <th className="table-header">Categoria</th><th className="table-header">Metodo</th><th className="table-header text-right">Valor</th>
              <th className="table-header">Comp.</th><th className="table-header w-10"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredItems.map(t => (
              <tr key={t.id} className="hover:bg-gray-50">
                <td className="table-cell whitespace-nowrap">{t.date}</td>
                <td className="table-cell max-w-[200px] truncate">{t.description}</td>
                <td className="table-cell">{t.property_name || '-'}</td>
                <td className="table-cell">{t.category}</td>
                <td className="table-cell">{t.method}</td>
                <td className="table-cell text-right font-medium text-red-600">{fmt(t.total_paid)}</td>
                <td className="table-cell">{t.competencia_month}/{t.competencia_year}</td>
                <td className="table-cell"><button onClick={() => handleDelete(t.id)} className="text-red-400 hover:text-red-600"><Trash2 size={16} /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredItems.length === 0 && <p className="text-center py-8 text-gray-400">{search ? 'Nenhum resultado para a busca' : 'Nenhuma saida encontrada'}</p>}
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Nova Saida" size="lg">
        <form onSubmit={handleCreate} className="grid grid-cols-2 gap-4">
          <div><label className="label">Data</label><input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} className="input-field" required /></div>
          <div><label className="label">Metodo</label><select value={form.method} onChange={e => setForm({...form, method: e.target.value})} className="select-field">{methods.map(m => <option key={m} value={m}>{m}</option>)}</select></div>
          <div className="col-span-2"><label className="label">Descricao</label><input value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="input-field" /></div>
          <div><label className="label">Valor Pago</label><input type="number" step="0.01" value={form.total_paid} onChange={e => setForm({...form, total_paid: Number(e.target.value)})} className="input-field" required /></div>
          <div><label className="label">Categoria</label><select value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="select-field">{categories.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
          <div><label className="label">Propriedade</label><select value={form.property_id} onChange={e => setForm({...form, property_id: e.target.value})} className="select-field"><option value="">-</option>{properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
          <div><label className="label">Mes Comp.</label><input type="number" min="1" max="12" value={form.competencia_month} onChange={e => setForm({...form, competencia_month: Number(e.target.value)})} className="input-field" /></div>
          <div><label className="label">Ano Comp.</label><input type="number" value={form.competencia_year} onChange={e => setForm({...form, competencia_year: Number(e.target.value)})} className="input-field" /></div>
          <div className="col-span-2 flex justify-end gap-3 mt-2">
            <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancelar</button>
            <button type="submit" className="btn-primary">Salvar</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
'''

for rel, content in [("frontend/src/pages/TransactionsIn.tsx", transactions_in), ("frontend/src/pages/TransactionsOut.tsx", transactions_out)]:
    path = os.path.join(PROJECT, rel)
    with open(path, 'w') as f:
        f.write(content)
    print(f"  [OK] {rel}")
print("Busca adicionada!")
