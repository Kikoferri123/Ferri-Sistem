import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import Modal from '../components/Modal';
import { Plus, Trash2, Edit2, Search, Building, Phone, Mail } from 'lucide-react';

interface Landlord {
  id: number; code?: string; name: string; email?: string; phone?: string;
  address?: string; iban?: string; notes?: string; created_at?: string;
  property_count: number;
}

export default function Landlords() {
  const [items, setItems] = useState<Landlord[]>([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [editing, setEditing] = useState<Landlord | null>(null);
  const navigate = useNavigate();

  const emptyForm = { name: '', email: '', phone: '', address: '', iban: '', notes: '' };
  const [form, setForm] = useState<any>({ ...emptyForm });
  const [editForm, setEditForm] = useState<any>({ ...emptyForm });

  const load = () => {
    const params: any = {};
    if (search.trim()) params.search = search.trim();
    api.get('/landlords', { params }).then(r => setItems(r.data)).catch(() => setItems([]));
  };

  useEffect(() => { load(); }, []);
  useEffect(() => {
    const timer = setTimeout(() => load(), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.post('/landlords', form);
    setShowModal(false);
    setForm({ ...emptyForm });
    load();
  };

  const openEdit = (ll: Landlord, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditing(ll);
    setEditForm({
      name: ll.name || '', email: ll.email || '', phone: ll.phone || '',
      address: ll.address || '', iban: ll.iban || '', notes: ll.notes || ''
    });
    setEditModal(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    await api.put(`/landlords/${editing.id}`, editForm);
    setEditModal(false);
    setEditing(null);
    load();
  };

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Remover landlord? As propriedades serao desvinculadas.')) {
      await api.delete(`/landlords/${id}`);
      load();
    }
  };

  const renderForm = (f: any, setF: any, onSubmit: any, onCancel: any, label: string) => (
    <form onSubmit={onSubmit} className="grid grid-cols-2 gap-4">
      <div className="col-span-2"><label className="label">Nome *</label><input value={f.name} onChange={e => setF({...f, name: e.target.value})} className="input-field" required /></div>
      <div><label className="label">Email</label><input type="email" value={f.email} onChange={e => setF({...f, email: e.target.value})} className="input-field" /></div>
      <div><label className="label">Telefone</label><input value={f.phone} onChange={e => setF({...f, phone: e.target.value})} className="input-field" /></div>
      <div className="col-span-2"><label className="label">Endereco</label><input value={f.address} onChange={e => setF({...f, address: e.target.value})} className="input-field" /></div>
      <div><label className="label">IBAN</label><input value={f.iban} onChange={e => setF({...f, iban: e.target.value})} className="input-field" /></div>
      <div><label className="label">Notas</label><input value={f.notes} onChange={e => setF({...f, notes: e.target.value})} className="input-field" /></div>
      <div className="col-span-2 flex justify-end gap-3 mt-2">
        <button type="button" onClick={onCancel} className="btn-secondary">Cancelar</button>
        <button type="submit" className="btn-primary">{label}</button>
      </div>
    </form>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2"><Building size={24} /> Landlords</h1>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2"><Plus size={18} /> Novo Landlord</button>
      </div>

      <div className="card flex gap-4 items-center">
        <div className="relative flex-1 max-w-sm">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nome..." className="input-field pl-10" />
        </div>
        <span className="ml-auto text-sm text-gray-500">{items.length} landlords</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map(ll => (
          <div key={ll.id} className="card hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate(`/landlords/${ll.id}`)}>
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Building size={20} className="text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">{ll.name}</h3>
                  <p className="text-xs text-purple-500 font-mono">{ll.code}</p>
                </div>
              </div>
              <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700 font-medium">
                {ll.property_count} {ll.property_count === 1 ? 'propriedade' : 'propriedades'}
              </span>
            </div>
            <div className="space-y-1 text-sm text-gray-500">
              {ll.phone && <p className="flex items-center gap-1"><Phone size={14} /> {ll.phone}</p>}
              {ll.email && <p className="flex items-center gap-1"><Mail size={14} /> {ll.email}</p>}
            </div>
            <div className="flex justify-end gap-2 mt-3">
              <button onClick={(e) => openEdit(ll, e)} className="text-blue-500 hover:text-blue-700"><Edit2 size={16} /></button>
              <button onClick={(e) => handleDelete(ll.id, e)} className="text-red-400 hover:text-red-600"><Trash2 size={16} /></button>
            </div>
          </div>
        ))}
      </div>
      {items.length === 0 && <p className="text-center py-8 text-gray-400">Nenhum landlord cadastrado</p>}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Novo Landlord" size="lg">
        {renderForm(form, setForm, handleCreate, () => setShowModal(false), 'Salvar')}
      </Modal>

      <Modal isOpen={editModal} onClose={() => setEditModal(false)} title={`Editar: ${editing?.name || ''}`} size="lg">
        {renderForm(editForm, setEditForm, handleUpdate, () => setEditModal(false), 'Atualizar')}
      </Modal>
    </div>
  );
}
