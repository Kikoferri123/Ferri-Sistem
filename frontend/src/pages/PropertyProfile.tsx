import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getProperty, getRooms, createRoom, updateRoom, deleteRoom, addBed, deleteBed, uploadDocument, deleteDocument } from '../services/api';
import api from '../services/api';
import FileUpload from '../components/FileUpload';
import StatusBadge from '../components/StatusBadge';
import KPICard from '../components/KPICard';
import Modal from '../components/Modal';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, Building2, DoorOpen, BedDouble, Plus, Trash2, Users, FileSignature, FolderOpen, MessageSquare, Send, ChevronDown, ChevronRight, Image, Download, Edit2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const fmt = (v: number) => v.toLocaleString('en-IE', { style: 'currency', currency: 'EUR' });
const COLORS = ['#3b82f6', '#ef4444', '#f59e0b', '#10b981', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

export default function PropertyProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isFinancial = user?.role === 'admin' || user?.role === 'financeiro';
  const [profile, setProfile] = useState<any>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ rooms: true, clients: true });
  const [remarkText, setRemarkText] = useState('');
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [showBedModal, setShowBedModal] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);
  const [roomForm, setRoomForm] = useState<any>({ name: '', room_type: 'individual', num_beds: 1, monthly_value: 0, auto_create_beds: true });
  const [bedForm, setBedForm] = useState<any>({ name: '', monthly_value: 0 });
  const [showEditRoomModal, setShowEditRoomModal] = useState(false);
  const [editRoomForm, setEditRoomForm] = useState<any>({ name: '', room_type: 'individual', monthly_value: 0 });
  const [editingRoomId, setEditingRoomId] = useState<number | null>(null);

  const load = () => {
    if (id) getProperty(Number(id)).then(r => setProfile(r.data));
  };

  useEffect(() => { load(); }, [id]);

  const toggle = (key: string) => setExpanded(prev => ({ ...prev, [key]: !prev[key] }));

  const handleAddRemark = async () => {
    if (!remarkText.trim() || !id) return;
    await api.post(`/properties/${id}/remarks`, { text: remarkText });
    setRemarkText('');
    load();
  };

  const handleDeleteRemark = async (remarkId: number) => {
    if (!id) return;
    await api.delete(`/properties/${id}/remarks/${remarkId}`);
    load();
  };

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    await createRoom({ ...roomForm, property_id: Number(id), num_beds: Number(roomForm.num_beds), monthly_value: Number(roomForm.monthly_value), auto_create_beds: roomForm.auto_create_beds });
    setShowRoomModal(false);
    setRoomForm({ name: '', room_type: 'individual', num_beds: 1, monthly_value: 0, auto_create_beds: true });
    load();
  };

  const handleCreateBed = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoomId) return;
    await addBed(selectedRoomId, { ...bedForm, monthly_value: Number(bedForm.monthly_value) });
    setShowBedModal(false);
    setBedForm({ name: '', monthly_value: 0 });
    load();
  };

  const openEditRoom = (room: any) => {
    setEditingRoomId(room.id);
    setEditRoomForm({ name: room.name || '', room_type: room.room_type || 'individual', monthly_value: room.monthly_value || 0 });
    setShowEditRoomModal(true);
  };

  const handleUpdateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRoomId) return;
    await updateRoom(editingRoomId, { ...editRoomForm, monthly_value: Number(editRoomForm.monthly_value) });
    setShowEditRoomModal(false);
    setEditingRoomId(null);
    load();
  };

  const handleDeleteRoom = async (roomId: number) => {
    if (confirm('Remover este quarto e todas as camas?')) { await deleteRoom(roomId); load(); }
  };

  const handleDeleteBed = async (bedId: number) => {
    if (confirm('Remover esta cama?')) { await deleteBed(bedId); load(); }
  };

  if (!profile) return <div className="text-center py-20 text-gray-400">Carregando...</div>;

  const pieData = Object.entries(profile.expenses_by_category || {}).sort((a: any, b: any) => b[1] - a[1]).map(([name, value]: any) => ({ name, value: Math.round(value) }));
  const revenueData = (profile.revenue_by_month || []).map((r: any) => ({ name: r.month, Receita: r.receita || 0 }));

  const totalRoomCapacity = (profile.rooms || []).reduce((s: number, r: any) => s + r.capacity, 0);
  const totalRoomOccupied = (profile.rooms || []).reduce((s: number, r: any) => s + r.occupied, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/propriedades')} className="text-gray-400 hover:text-gray-600"><ArrowLeft size={24} /></button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-800">
            {profile.code && <span className="text-blue-500 font-mono text-lg mr-2">{profile.code}</span>}
            {profile.name}
          </h1>
          <p className="text-sm text-gray-500">{profile.address}</p>
        </div>
        <StatusBadge status={profile.status} />
      </div>

      {/* KPIs */}
      <div className={`grid grid-cols-2 ${isFinancial ? 'md:grid-cols-5' : 'md:grid-cols-2'} gap-4`}>
        {isFinancial && <KPICard title="Total Receita" value={fmt(profile.total_receita || 0)} color="blue" />}
        {isFinancial && <KPICard title="Total Despesas" value={fmt(profile.total_expenses)} color="red" />}
        {isFinancial && <KPICard title="Resultado" value={fmt(profile.resultado)} subtitle={`Margem: ${profile.margin_pct}%`} color={profile.resultado >= 0 ? 'green' : 'red'} />}
        <KPICard title="Ocupacao" value={`${totalRoomOccupied}/${totalRoomCapacity}`} subtitle={totalRoomCapacity > 0 ? `${Math.round(totalRoomOccupied / totalRoomCapacity * 100)}%` : 'N/A'} color="purple" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">

          {/* Rooms & Beds */}
          <div className="card p-0 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 bg-gray-50 cursor-pointer" onClick={() => toggle('rooms')}>
              <div className="flex items-center gap-2">
                {expanded.rooms ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                <DoorOpen size={18} className="text-indigo-500" />
                <h3 className="font-semibold text-gray-700">Quartos & Camas</h3>
                <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">{(profile.rooms || []).length}</span>
              </div>
              <button onClick={(e) => { e.stopPropagation(); setShowRoomModal(true); }} className="text-blue-500 hover:text-blue-700 flex items-center gap-1 text-sm">
                <Plus size={16} /> Novo Quarto
              </button>
            </div>
            {expanded.rooms && (
              <div className="p-4 space-y-3">
                {(profile.rooms || []).length === 0 ? (
                  <p className="text-sm text-gray-400 italic text-center py-4">Nenhum quarto cadastrado</p>
                ) : (
                  (profile.rooms || []).map((room: any) => (
                    <div key={room.id} className="border border-gray-200 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <DoorOpen size={16} className="text-indigo-400" />
                          <span className="font-medium">{room.name}</span>
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                            {({ individual: 'Individual', casal: 'Casal', compartilhado: 'Compartilhado', studio: 'Studio', casa_inteira: 'Casa Inteira' } as Record<string, string>)[room.room_type] || room.room_type}
                          </span>
                          <span className={`text-xs font-medium ${room.available > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {room.available}/{room.capacity} livre(s)
                          </span>
                          {room.monthly_value > 0 && <span className="text-xs text-gray-500">{fmt(room.monthly_value)}/mes</span>}
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => openEditRoom(room)} className="text-indigo-400 hover:text-indigo-600" title="Editar quarto"><Edit2 size={14} /></button>
                          <button onClick={() => { setSelectedRoomId(room.id); setShowBedModal(true); }} className="text-blue-400 hover:text-blue-600" title="Adicionar cama"><Plus size={14} /></button>
                          <button onClick={() => handleDeleteRoom(room.id)} className="text-red-400 hover:text-red-600" title="Remover quarto"><Trash2 size={14} /></button>
                        </div>
                      </div>
                      {room.beds.length > 0 && (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                          {room.beds.map((bed: any) => (
                            <div key={bed.id} className={`rounded-lg p-2 border text-sm ${bed.occupied ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1">
                                  <BedDouble size={14} className={bed.occupied ? 'text-red-500' : 'text-green-500'} />
                                  <span className="font-medium">{bed.name}</span>
                                  {bed.monthly_value > 0 && <span className="text-xs text-gray-400">€{bed.monthly_value}</span>}
                                </div>
                                <button onClick={() => handleDeleteBed(bed.id)} className="text-red-300 hover:text-red-500"><Trash2 size={12} /></button>
                              </div>
                              {bed.occupied ? (
                                <p className="text-xs text-red-700 mt-1 cursor-pointer hover:underline" onClick={() => navigate(`/clientes/${bed.client_id}`)}>
                                  {bed.client_name}
                                </p>
                              ) : (
                                <p className="text-xs text-green-700 mt-1">Disponivel</p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                      {room.room_clients && room.room_clients.length > 0 && (
                        <div className="mt-2 text-xs text-gray-600">
                          <span className="font-medium">Clientes no quarto:</span>{' '}
                          {room.room_clients.map((c: any) => (
                            <span key={c.id} className="inline-block bg-orange-100 text-orange-800 px-2 py-0.5 rounded mr-1 cursor-pointer hover:bg-orange-200" onClick={() => navigate(`/clientes/${c.id}`)}>
                              {c.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Contracts */}
          <div className="card p-0 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 bg-gray-50 cursor-pointer" onClick={() => toggle('contracts')}>
              <div className="flex items-center gap-2">
                {expanded.contracts ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                <FileSignature size={18} className="text-blue-500" />
                <h3 className="font-semibold text-gray-700">Contratos</h3>
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{(profile.contracts || []).length}</span>
              </div>
            </div>
            {expanded.contracts && (
              <div className="divide-y divide-gray-100">
                {(profile.contracts || []).length === 0 ? (
                  <p className="text-sm text-gray-400 italic text-center py-6">Nenhum contrato</p>
                ) : (
                  (profile.contracts || []).map((ct: any) => (
                    <div key={ct.id} className="px-4 py-3 flex items-center justify-between hover:bg-gray-50">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{ct.client_name || 'Sem cliente'}</span>
                          <span className={`text-xs px-2 py-0.5 rounded ${ct.status === 'vigente' ? 'bg-green-100 text-green-700' : ct.status === 'pendente' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'}`}>
                            {ct.status}
                          </span>
                          {ct.signed && <span className="text-xs text-green-600">Assinado</span>}
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">{ct.type} | {ct.start_date} a {ct.end_date} | {fmt(ct.value)}/mes</p>
                      </div>
                      {ct.client_id && (
                        <button onClick={() => {
                          const mailto = `mailto:?subject=Contrato Ferri Sistem&body=Contrato de ${ct.type} - ${ct.client_name}`;
                          window.open(mailto);
                        }} className="text-blue-400 hover:text-blue-600" title="Enviar contrato">
                          <Send size={16} />
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Clients */}
          <div className="card p-0 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 bg-gray-50 cursor-pointer" onClick={() => toggle('clients')}>
              <div className="flex items-center gap-2">
                {expanded.clients ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                <Users size={18} className="text-green-500" />
                <h3 className="font-semibold text-gray-700">Clientes</h3>
                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">{(profile.clients || []).length}</span>
              </div>
            </div>
            {expanded.clients && (
              <div className="divide-y divide-gray-100">
                {(profile.clients || []).length === 0 ? (
                  <p className="text-sm text-gray-400 italic text-center py-6">Nenhum cliente vinculado</p>
                ) : (
                  (profile.clients || []).map((c: any) => (
                    <div key={c.id} className="px-4 py-3 flex items-center justify-between hover:bg-gray-50 cursor-pointer" onClick={() => navigate(`/clientes/${c.id}`)}>
                      <div>
                        <span className="font-medium text-sm text-blue-600 hover:underline">{c.name}</span>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {c.room_name ? `${c.room_name}` : ''}{c.bed_name ? ` / ${c.bed_name}` : ''}
                          {c.check_in ? ` | ${c.check_in}` : ''}{c.check_out ? ` → ${c.check_out}` : ''}
                          {c.monthly_value ? ` | ${fmt(c.monthly_value)}/mes` : ''}
                        </p>
                      </div>
                      <StatusBadge status={c.status} />
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Revenue Chart - Financial only */}
          {isFinancial && revenueData.length > 0 && (
            <div className="card">
              <h3 className="font-semibold text-gray-700 mb-4">Receitas por Mes</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: number) => fmt(v)} />
                  <Bar dataKey="Receita" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Info */}
          <div className="card">
            <h3 className="font-semibold text-gray-700 mb-4">Informacoes</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Tipo</span><span className="capitalize">{profile.type}</span></div>
              {isFinancial && <div className="flex justify-between"><span className="text-gray-500">Aluguel Mensal</span><span className="font-medium">{fmt(profile.monthly_rent)}</span></div>}
              <div className="flex justify-between"><span className="text-gray-500">Proprietario</span><span>{profile.owner_name || '-'}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Contato</span><span>{profile.owner_contact || '-'}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Contrato</span><span>{profile.contract_start} a {profile.contract_end}</span></div>
              {isFinancial && <div className="flex justify-between"><span className="text-gray-500">Receita Total</span><span>{fmt(profile.total_receita || 0)}</span></div>}
            </div>
          </div>

          {/* Expenses - Financial only */}
          {isFinancial && <div className="card">
            <h3 className="font-semibold text-gray-700 mb-4">Despesas por Categoria</h3>
            {pieData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" outerRadius={70} dataKey="value">
                      {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v: number) => fmt(v)} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-1 mt-2">
                  {pieData.map((item, i) => (
                    <div key={item.name} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                        <span>{item.name}</span>
                      </div>
                      <span className="font-medium">{fmt(item.value)}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : <p className="text-gray-400 text-sm">Sem dados</p>}
          </div>}

          {/* Remarks */}
          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <MessageSquare size={18} className="text-amber-500" />
              <h3 className="font-semibold text-gray-700">Observacoes</h3>
            </div>
            <div className="flex gap-2 mb-3">
              <input
                value={remarkText}
                onChange={e => setRemarkText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddRemark()}
                placeholder="Adicionar observacao..."
                className="input-field flex-1 text-sm"
              />
              <button onClick={handleAddRemark} className="btn-primary text-sm px-3">+</button>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {(profile.remarks || []).length === 0 ? (
                <p className="text-xs text-gray-400 italic">Nenhuma observacao</p>
              ) : (
                (profile.remarks || []).map((r: any) => (
                  <div key={r.id} className="bg-amber-50 rounded-lg p-2 group relative">
                    <p className="text-sm text-gray-700">{r.text}</p>
                    <div className="flex justify-between items-center mt-1">
                      <p className="text-xs text-gray-400">{r.created_by} - {r.created_at?.split('T')[0]}</p>
                      <button onClick={() => handleDeleteRemark(r.id)} className="text-red-300 hover:text-red-500 opacity-0 group-hover:opacity-100"><Trash2 size={12} /></button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Documents/Photos */}
          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <FolderOpen size={18} className="text-cyan-500" />
              <h3 className="font-semibold text-gray-700">Documentos & Fotos ({(profile.documents || []).length})</h3>
            </div>
            <FileUpload
              onUpload={async (file, category, docType) => {
                await uploadDocument(file, 'property', Number(id), category, docType);
                load();
              }}
              categories={['Contrato', 'Licenca', 'Comprovante', 'Inventario', 'Foto', 'Outro']}
            />
            {(profile.documents || []).length > 0 && (
              <div className="space-y-2 mt-3">
                {(profile.documents || []).map((d: any) => (
                  <div key={d.id} className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded group">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      {d.category === 'Foto' ? <Image size={14} className="text-cyan-500 shrink-0" /> : <FolderOpen size={14} className="text-gray-400 shrink-0" />}
                      <span className="truncate">{d.name}</span>
                      <span className="text-xs bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded shrink-0">{d.category || d.type}</span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0 ml-2">
                      {d.file_url && (
                        <a href={d.file_url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-600" title="Baixar">
                          <Download size={14} />
                        </a>
                      )}
                      <button onClick={async () => { if (confirm('Remover documento?')) { await deleteDocument(d.id); load(); } }} className="text-red-300 hover:text-red-500 opacity-0 group-hover:opacity-100">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Room Modal */}
      <Modal isOpen={showRoomModal} onClose={() => setShowRoomModal(false)} title="Novo Quarto">
        <form onSubmit={handleCreateRoom} className="space-y-4">
          <div><label className="label">Nome do Quarto</label><input value={roomForm.name} onChange={e => setRoomForm({...roomForm, name: e.target.value})} className="input-field" placeholder="Ex: Quarto 1, Suite" required /></div>
          <div><label className="label">Tipo</label>
            <select value={roomForm.room_type} onChange={e => setRoomForm({...roomForm, room_type: e.target.value})} className="select-field">
              <option value="individual">Individual</option>
              <option value="casal">Casal</option>
              <option value="compartilhado">Compartilhado</option>
              <option value="studio">Studio</option>
              <option value="casa_inteira">Casa Inteira</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Num. Camas</label><input type="number" min="1" value={roomForm.num_beds} onChange={e => setRoomForm({...roomForm, num_beds: e.target.value})} className="input-field" /></div>
            <div>
              <label className="label">Valor Total do Quarto (EUR/mes)</label>
              <input type="number" step="0.01" value={roomForm.monthly_value} onChange={e => setRoomForm({...roomForm, monthly_value: e.target.value})} className="input-field" />
              {Number(roomForm.num_beds) > 1 && Number(roomForm.monthly_value) > 0 && (
                <p className="text-xs text-gray-500 mt-1">
                  = €{(Number(roomForm.monthly_value) / Number(roomForm.num_beds)).toFixed(2)} por cama
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="auto_create_beds"
              checked={roomForm.auto_create_beds}
              onChange={e => setRoomForm({...roomForm, auto_create_beds: e.target.checked})}
              className="rounded border-gray-300"
            />
            <label htmlFor="auto_create_beds" className="text-sm text-gray-700">
              Criar camas automaticamente (Cama 1, Cama 2, etc.) com valor dividido
            </label>
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setShowRoomModal(false)} className="btn-secondary">Cancelar</button>
            <button type="submit" className="btn-primary">Criar Quarto</button>
          </div>
        </form>
      </Modal>

      {/* Edit Room Modal */}
      <Modal isOpen={showEditRoomModal} onClose={() => setShowEditRoomModal(false)} title="Editar Quarto">
        <form onSubmit={handleUpdateRoom} className="space-y-4">
          <div><label className="label">Nome do Quarto</label><input value={editRoomForm.name} onChange={e => setEditRoomForm({...editRoomForm, name: e.target.value})} className="input-field" required /></div>
          <div><label className="label">Tipo</label>
            <select value={editRoomForm.room_type} onChange={e => setEditRoomForm({...editRoomForm, room_type: e.target.value})} className="select-field">
              <option value="individual">Individual</option>
              <option value="casal">Casal</option>
              <option value="compartilhado">Compartilhado</option>
              <option value="studio">Studio</option>
              <option value="casa_inteira">Casa Inteira</option>
            </select>
          </div>
          <div><label className="label">Valor Mensal (EUR)</label><input type="number" step="0.01" value={editRoomForm.monthly_value} onChange={e => setEditRoomForm({...editRoomForm, monthly_value: e.target.value})} className="input-field" /></div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setShowEditRoomModal(false)} className="btn-secondary">Cancelar</button>
            <button type="submit" className="btn-primary">Salvar</button>
          </div>
        </form>
      </Modal>

      {/* Add Bed Modal */}
      <Modal isOpen={showBedModal} onClose={() => setShowBedModal(false)} title="Nova Cama">
        <form onSubmit={handleCreateBed} className="space-y-4">
          <div><label className="label">Nome da Cama</label><input value={bedForm.name} onChange={e => setBedForm({...bedForm, name: e.target.value})} className="input-field" placeholder="Ex: Cama 1, Beliche" required /></div>
          <div><label className="label">Valor Mensal (EUR)</label><input type="number" step="0.01" value={bedForm.monthly_value} onChange={e => setBedForm({...bedForm, monthly_value: e.target.value})} className="input-field" /></div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setShowBedModal(false)} className="btn-secondary">Cancelar</button>
            <button type="submit" className="btn-primary">Adicionar Cama</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
