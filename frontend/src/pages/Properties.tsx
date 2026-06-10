import React, { useEffect, useState } from 'react';
import { getProperties, createProperty, updateProperty, deleteProperty } from '../services/api';
import api from '../services/api';
import { Property } from '../types';
import { useNavigate } from 'react-router-dom';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';
import { Plus, Trash2, Eye, Home, Edit2, Search } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const fmt = (v: number) => v.toLocaleString('en-IE', { style: 'currency', currency: 'EUR' });

export default function Properties() {
  const { user } = useAuth();
  const isFinancial = user?.role === 'admin' || user?.role === 'financeiro';
  const [items, setItems] = useState<Property[]>([]);
  const [landlords, setLandlords] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [editingProp, setEditingProp] = useState<any>(null);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  const emptyForm = {
    name: '', address: '', monthly_rent: 0, type: 'apartamento',
    owner_name: '', owner_contact: '', landlord_id: '', status: 'ativo', notes: '',
    contract_start: '', contract_end: ''
  };
  const [form, setForm] = useState<any>({ ...emptyForm });
  const [editForm, setEditForm] = useState<any>({ ...emptyForm });

  const load = () => getProperties().then(r => setItems(r.data));
  useEffect(() => {
    load();
    api.get('/landlords').then(r => setLandlords(r.data)).catch(() => {});
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = { ...form, contract_start: form.contract_start || null, contract_end: form.contract_end || null, landlord_id: form.landlord_id ? Number(form.landlord_id) : null };
    await createProperty(data);
    setShowModal(false);
    setForm({ ...emptyForm });
    load();
  };

  const openEdit = (p: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingProp(p);
    setEditForm({
      name: p.name || '', address: p.address || '', monthly_rent: p.monthly_rent || 0,
      type: p.type || 'apartamento', owner_name: p.owner_name || '', owner_contact: p.owner_contact || '',
      landlord_id: p.landlord_id || '', status: p.status || 'ativo', notes: p.notes || '',
      contract_start: p.contract_start || '', contract_end: p.contract_end || ''
    });
    setEditModal(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProp) return;
    const data = { ...editForm, contract_start: editForm.contract_start || null, contract_end: editForm.contract_end || null, landlord_id: editForm.landlord_id ? Number(editForm.landlord_id) : null };
    await updateProperty(editingProp.id, data);
    setEditModal(false);
    setEditingProp(null);
    load();
  };

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Remover propriedade?')) { await deleteProperty(id); load(); }
  };

  const totalRent = items.filter(p => p.status === 'ativo').reduce((s, p) => s + p.monthly_rent, 0);

  const renderForm = (f: any, setF: any, onSubmit: any, onCancel: any, submitLabel: string) => (
    <form onSubmit={onSubmit} className="grid grid-cols-2 gap-4">
      <div className="col-span-2"><label className="label">Nome</label><input value={f.name} onChange={e => setF({...f, name: e.target.value})} className="input-field" required /></div>
      <div className="col-span-2"><label className="label">Endereco Completo</label><input value={f.address} onChange={e => setF({...f, address: e.target.value})} className="input-field" /></div>
      {isFinancial && <div><label className="label">Aluguel Mensal (EUR)</label><input type="number" step="0.01" value={f.monthly_rent} onChange={e => setF({...f, monthly_rent: Number(e.target.value)})} className="input-field" /></div>}
      <div><label className="label">Tipo</label>
        <select value={f.type} onChange={e => setF({...f, type: e.target.value})} className="select-field">
          <option value="casa">Casa</option><option value="apartamento">Apartamento</option>
          <option value="quarto">Quarto</option><option value="estudio">Estudio</option><option value="outro">Outro</option>
        </select>
      </div>
      <div><label className="label">Status</label>
        <select value={f.status} onChange={e => setF({...f, status: e.target.value})} className="select-field">
          <option value="ativo">Ativo</option><option value="inativo">Inativo</option><option value="em_negociacao">Em Negociação</option>
        </select>
      </div>
      {isFinancial && (
        <>
          <div><label className="label">Landlord</label>
            <select value={f.landlord_id} onChange={e => setF({...f, landlord_id: e.target.value})} className="select-field">
              <option value="">Selecionar...</option>
              {landlords.map((ll: any) => <option key={ll.id} value={ll.id}>{ll.code} - {ll.name}</option>)}
            </select>
          </div>
          <div><label className="label">Proprietario (legado)</label><input value={f.owner_name} onChange={e => setF({...f, owner_name: e.target.value})} className="input-field" placeholder="Opcional se landlord selecionado" /></div>
          <div><label className="label">Contato Proprietario</label><input value={f.owner_contact} onChange={e => setF({...f, owner_contact: e.target.value})} className="input-field" /></div>
          <div><label className="label">Inicio Contrato</label><input type="date" value={f.contract_start} onChange={e => setF({...f, contract_start: e.target.value})} className="input-field" /></div>
          <div><label className="label">Fim Contrato</label><input type="date" value={f.contract_end} onChange={e => setF({...f, contract_end: e.target.value})} className="input-field" /></div>
        </>
      )}
      <div className="col-span-2"><label className="label">Notas</label><textarea value={f.notes} onChange={e => setF({...f, notes: e.target.value})} className="input-field" rows={2} /></div>
      <div className="col-span-2 flex justify-end gap-3 mt-2">
        <button type="button" onClick={onCancel} className="btn-secondary">Cancelar</button>
        <button type="submit" className="btn-primary">{submitLabel}</button>
      </div>
    </form>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Propriedades</h1>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2"><Plus size={18} /> Nova Propriedade</button>
      </div>

      {isFinancial && (
        <div className="card">
          <p className="text-sm text-gray-500">Aluguel Fixo Mensal Total (Contrato)</p>
          <p className="text-2xl font-bold text-blue-600">{fmt(totalRent)}/mes</p>
          <p className="text-xs text-gray-400 mt-1">{items.filter(p => p.status === 'ativo').length} propriedades ativas</p>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por nome, endereco, codigo ou proprietario..."
          className="input-field pl-10"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.filter(p => {
          if (!search) return true;
          const s = search.toLowerCase();
          return p.name.toLowerCase().includes(s) ||
            (p.address || '').toLowerCase().includes(s) ||
            (p.code || '').toLowerCase().includes(s) ||
            (p.owner_name || '').toLowerCase().includes(s) ||
            ((p as any).landlord_name || '').toLowerCase().includes(s) ||
            (p.type || '').toLowerCase().includes(s);
        }).map(p => (
          <div key={p.id} className="card hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate(`/propriedades/${p.id}`)}>
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Home size={20} className="text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">{p.name}</h3>
                  <p className="text-xs text-gray-500 capitalize">{p.code && <span className="text-blue-500 font-mono mr-1">{p.code}</span>}{p.type}</p>
                </div>
              </div>
              <StatusBadge status={p.status} />
            </div>
            <p className="text-sm text-gray-500 mb-2">{p.address}</p>
            <div className="flex items-center justify-between">
              {isFinancial && <span className="text-lg font-bold text-blue-600">{fmt(p.monthly_rent)}<span className="text-xs text-gray-400">/mes</span></span>}
              <div className="flex gap-2 ml-auto">
                <button onClick={(e) => openEdit(p, e)} className="text-blue-500 hover:text-blue-700" title="Editar"><Edit2 size={16} /></button>
                <button onClick={(e) => { e.stopPropagation(); navigate(`/propriedades/${p.id}`); }} className="text-gray-400 hover:text-gray-600"><Eye size={16} /></button>
                <button onClick={(e) => handleDelete(p.id, e)} className="text-red-400 hover:text-red-600"><Trash2 size={16} /></button>
              </div>
            </div>
            {((p as any).landlord_name || p.owner_name) && <p className="text-xs text-gray-400 mt-2">Dono: {(p as any).landlord_name || p.owner_name}</p>}
          </div>
        ))}
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Nova Propriedade" size="lg">
        {renderForm(form, setForm, handleCreate, () => setShowModal(false), 'Salvar')}
      </Modal>

      <Modal isOpen={editModal} onClose={() => setEditModal(false)} title={`Editar: ${editingProp?.name || ''}`} size="lg">
        {renderForm(editForm, setEditForm, handleUpdate, () => setEditModal(false), 'Atualizar')}
      </Modal>
    </div>
  );
}
