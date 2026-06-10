import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getClients, createClient, updateClient, deleteClient, getProperties, getRooms } from '../services/api';
import { Client, Property } from '../types';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';
import { Plus, Trash2, Users, Search, Edit2 } from 'lucide-react';

export default function Clients() {
  const [items, setItems] = useState<Client[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [editingClient, setEditingClient] = useState<any>(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  const emptyForm = {
    name: '', email: '', phone: '', nationality: '', birth_date: '',
    document_id: '', referencia: '', status: 'ativo', property_id: '', room_id: '', bed_id: '',
    check_in: '', check_out: '', monthly_value: 0, payment_method: '', notes: ''
  };
  const [form, setForm] = useState<any>({ ...emptyForm });
  const [editForm, setEditForm] = useState<any>({ ...emptyForm });

  const load = () => {
    const params: any = {};
    if (filterStatus) params.status = filterStatus;
    if (search.trim()) params.search = search.trim();
    getClients(params).then(r => setItems(r.data));
  };

  useEffect(() => {
    load();
    getProperties().then(r => setProperties(r.data));
    getRooms().then(r => setRooms(r.data));
  }, [filterStatus]);

  useEffect(() => {
    const timer = setTimeout(() => load(), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      ...form,
      property_id: form.property_id ? Number(form.property_id) : null,
      room_id: form.room_id ? Number(form.room_id) : null,
      bed_id: form.bed_id ? Number(form.bed_id) : null,
      birth_date: form.birth_date || null,
      check_in: form.check_in || null,
      check_out: form.check_out || null
    };
    await createClient(data);
    setShowModal(false);
    setForm({ ...emptyForm });
    load();
  };

  const openEdit = (client: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingClient(client);
    setEditForm({
      name: client.name || '',
      email: client.email || '',
      phone: client.phone || '',
      nationality: client.nationality || '',
      birth_date: client.birth_date || '',
      document_id: client.document_id || '',
      referencia: (client as any).referencia || '',
      status: client.status || 'ativo',
      property_id: client.property_id || '',
      room_id: client.room_id || '',
      bed_id: client.bed_id || '',
      check_in: client.check_in || '',
      check_out: client.check_out || '',
      monthly_value: client.monthly_value || 0,
      payment_method: client.payment_method || '',
      notes: client.notes || ''
    });
    setEditModal(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClient) return;
    const data = {
      ...editForm,
      property_id: editForm.property_id ? Number(editForm.property_id) : null,
      room_id: editForm.room_id ? Number(editForm.room_id) : null,
      bed_id: editForm.bed_id ? Number(editForm.bed_id) : null,
      birth_date: editForm.birth_date || null,
      check_in: editForm.check_in || null,
      check_out: editForm.check_out || null
    };
    await updateClient(editingClient.id, data);
    setEditModal(false);
    setEditingClient(null);
    load();
  };

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Remover cliente?')) { await deleteClient(id); load(); }
  };

  // Cascading filter helpers
  const getFilteredRooms = (propId: any) => {
    if (!propId) return rooms;
    return rooms.filter((r: any) => r.property_id === Number(propId));
  };

  const getFilteredBeds = (roomId: any) => {
    const room = rooms.find((r: any) => r.id === Number(roomId));
    return room?.beds || [];
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2"><Users size={24} /> Clientes</h1>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2"><Plus size={18} /> Novo Cliente</button>
      </div>

      <div className="card flex gap-4 items-center">
        <div className="relative flex-1 max-w-sm">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nome, referência, código, email..."
            className="input-field pl-10"
          />
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="select-field w-40">
          <option value="">Todos status</option>
          <option value="ativo">Ativo</option><option value="inativo">Inativo</option>
          <option value="prospecto">Prospecto</option><option value="encerrado">Encerrado</option>
        </select>
        <span className="ml-auto text-sm text-gray-500">{items.length} clientes</span>
      </div>

      <div className="card overflow-x-auto p-0">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="table-header">ID</th>
              <th className="table-header">Nome</th>
              <th className="table-header">Email</th>
              <th className="table-header">Telefone</th>
              <th className="table-header">Nacionalidade</th>
              <th className="table-header">Referência</th>
              <th className="table-header">Propriedade</th>
              <th className="table-header">Quarto</th>
              <th className="table-header">Check-in</th>
              <th className="table-header">Check-out</th>
              <th className="table-header text-right">Valor/mes</th>
              <th className="table-header">Status</th>
              <th className="table-header w-20"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {items.map(c => (
              <tr key={c.id} className="hover:bg-blue-50 cursor-pointer transition-colors" onClick={() => navigate(`/clientes/${c.id}`)}>
                <td className="table-cell font-mono text-xs text-blue-500">{(c as any).code || '-'}</td>
                <td className="table-cell font-medium text-blue-600">{c.name}</td>
                <td className="table-cell text-gray-500">{c.email || '-'}</td>
                <td className="table-cell">{c.phone || '-'}</td>
                <td className="table-cell">{c.nationality || '-'}</td>
                <td className="table-cell">{(c as any).referencia || '-'}</td>
                <td className="table-cell">{c.property_name || '-'}</td>
                <td className="table-cell">{(c as any).room_name || '-'}{(c as any).bed_name ? ` / ${(c as any).bed_name}` : ''}</td>
                <td className="table-cell">{c.check_in || '-'}</td>
                <td className="table-cell">{c.check_out || '-'}</td>
                <td className="table-cell text-right font-medium">{c.monthly_value > 0 ? `€${c.monthly_value}` : '-'}</td>
                <td className="table-cell"><StatusBadge status={c.status} /></td>
                <td className="table-cell">
                  <div className="flex items-center gap-1">
                    <button onClick={(e) => openEdit(c, e)} className="text-blue-400 hover:text-blue-600" title="Editar"><Edit2 size={16} /></button>
                    <button onClick={(e) => handleDelete(c.id, e)} className="text-red-400 hover:text-red-600" title="Remover"><Trash2 size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {items.length === 0 && <p className="text-center py-8 text-gray-400">Nenhum cliente encontrado</p>}
      </div>

      {/* Modal Novo Cliente */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Novo Cliente" size="xl">
        <form onSubmit={handleCreate} className="grid grid-cols-3 gap-4">
          <div><label className="label">Nome *</label><input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="input-field" required /></div>
          <div><label className="label">Email</label><input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="input-field" /></div>
          <div><label className="label">Telefone</label><input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="input-field" /></div>
          <div><label className="label">Nacionalidade</label><input value={form.nationality} onChange={e => setForm({...form, nationality: e.target.value})} className="input-field" /></div>
          <div><label className="label">Data Nascimento</label><input type="date" value={form.birth_date} onChange={e => setForm({...form, birth_date: e.target.value})} className="input-field" /></div>
          <div><label className="label">Documento (ID)</label><input value={form.document_id} onChange={e => setForm({...form, document_id: e.target.value})} className="input-field" /></div>
          <div className="col-span-3"><label className="label">Referência</label><input value={form.referencia} onChange={e => setForm({...form, referencia: e.target.value})} className="input-field" placeholder="Ex: Indicação do João, Facebook, Site..." /></div>

          <div className="col-span-3 border-t pt-4 mt-2">
            <h3 className="font-semibold text-gray-700 mb-3">Acomodação</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="label">Propriedade</label>
                <select value={form.property_id} onChange={e => setForm({...form, property_id: e.target.value, room_id: '', bed_id: ''})} className="select-field">
                  <option value="">Selecionar...</option>
                  {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Quarto</label>
                <select value={form.room_id} onChange={e => setForm({...form, room_id: e.target.value, bed_id: ''})} className="select-field" disabled={!form.property_id}>
                  <option value="">Selecionar...</option>
                  {getFilteredRooms(form.property_id).map((r: any) => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Cama</label>
                <select value={form.bed_id} onChange={e => setForm({...form, bed_id: e.target.value})} className="select-field" disabled={!form.room_id}>
                  <option value="">Selecionar...</option>
                  {getFilteredBeds(form.room_id).map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div><label className="label">Check-in</label><input type="date" value={form.check_in} onChange={e => setForm({...form, check_in: e.target.value})} className="input-field" /></div>
          <div><label className="label">Check-out</label><input type="date" value={form.check_out} onChange={e => setForm({...form, check_out: e.target.value})} className="input-field" /></div>
          <div><label className="label">Valor Mensal</label><input type="number" step="0.01" value={form.monthly_value} onChange={e => setForm({...form, monthly_value: Number(e.target.value)})} className="input-field" /></div>
          <div><label className="label">Metodo Pagamento</label><input value={form.payment_method} onChange={e => setForm({...form, payment_method: e.target.value})} className="input-field" /></div>
          <div><label className="label">Status</label><select value={form.status} onChange={e => setForm({...form, status: e.target.value})} className="select-field"><option value="ativo">Ativo</option><option value="inativo">Inativo</option><option value="prospecto">Prospecto</option><option value="encerrado">Encerrado</option></select></div>
          <div className="col-span-3"><label className="label">Notas</label><textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} className="input-field" rows={2} /></div>
          <div className="col-span-3 flex justify-end gap-3 mt-2">
            <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancelar</button>
            <button type="submit" className="btn-primary">Salvar</button>
          </div>
        </form>
      </Modal>

      {/* Modal Editar Cliente */}
      <Modal isOpen={editModal} onClose={() => setEditModal(false)} title={`Editar: ${editingClient?.name || ''}`} size="xl">
        <form onSubmit={handleUpdate} className="grid grid-cols-3 gap-4">
          <div><label className="label">Nome *</label><input value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} className="input-field" required /></div>
          <div><label className="label">Email</label><input type="email" value={editForm.email} onChange={e => setEditForm({...editForm, email: e.target.value})} className="input-field" /></div>
          <div><label className="label">Telefone</label><input value={editForm.phone} onChange={e => setEditForm({...editForm, phone: e.target.value})} className="input-field" /></div>
          <div><label className="label">Nacionalidade</label><input value={editForm.nationality} onChange={e => setEditForm({...editForm, nationality: e.target.value})} className="input-field" /></div>
          <div><label className="label">Data Nascimento</label><input type="date" value={editForm.birth_date} onChange={e => setEditForm({...editForm, birth_date: e.target.value})} className="input-field" /></div>
          <div><label className="label">Documento (ID)</label><input value={editForm.document_id} onChange={e => setEditForm({...editForm, document_id: e.target.value})} className="input-field" /></div>
          <div className="col-span-3"><label className="label">Referência</label><input value={editForm.referencia} onChange={e => setEditForm({...editForm, referencia: e.target.value})} className="input-field" placeholder="Ex: Indicação do João, Facebook, Site..." /></div>

          <div className="col-span-3 border-t pt-4 mt-2">
            <h3 className="font-semibold text-gray-700 mb-3">Acomodação</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="label">Propriedade</label>
                <select value={editForm.property_id} onChange={e => setEditForm({...editForm, property_id: e.target.value, room_id: '', bed_id: ''})} className="select-field">
                  <option value="">Selecionar...</option>
                  {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Quarto</label>
                <select value={editForm.room_id} onChange={e => setEditForm({...editForm, room_id: e.target.value, bed_id: ''})} className="select-field" disabled={!editForm.property_id}>
                  <option value="">Selecionar...</option>
                  {getFilteredRooms(editForm.property_id).map((r: any) => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Cama</label>
                <select value={editForm.bed_id} onChange={e => setEditForm({...editForm, bed_id: e.target.value})} className="select-field" disabled={!editForm.room_id}>
                  <option value="">Selecionar...</option>
                  {getFilteredBeds(editForm.room_id).map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div><label className="label">Check-in</label><input type="date" value={editForm.check_in} onChange={e => setEditForm({...editForm, check_in: e.target.value})} className="input-field" /></div>
          <div><label className="label">Check-out</label><input type="date" value={editForm.check_out} onChange={e => setEditForm({...editForm, check_out: e.target.value})} className="input-field" /></div>
          <div><label className="label">Valor Mensal</label><input type="number" step="0.01" value={editForm.monthly_value} onChange={e => setEditForm({...editForm, monthly_value: Number(e.target.value)})} className="input-field" /></div>
          <div><label className="label">Metodo Pagamento</label><input value={editForm.payment_method} onChange={e => setEditForm({...editForm, payment_method: e.target.value})} className="input-field" /></div>
          <div><label className="label">Status</label><select value={editForm.status} onChange={e => setEditForm({...editForm, status: e.target.value})} className="select-field"><option value="ativo">Ativo</option><option value="inativo">Inativo</option><option value="prospecto">Prospecto</option><option value="encerrado">Encerrado</option></select></div>
          <div className="col-span-3"><label className="label">Notas</label><textarea value={editForm.notes} onChange={e => setEditForm({...editForm, notes: e.target.value})} className="input-field" rows={2} /></div>
          <div className="col-span-3 flex justify-end gap-3 mt-2">
            <button type="button" onClick={() => setEditModal(false)} className="btn-secondary">Cancelar</button>
            <button type="submit" className="btn-primary">Atualizar</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
