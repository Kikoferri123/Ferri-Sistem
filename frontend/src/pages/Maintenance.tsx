import React, { useEffect, useState } from 'react';
import { getMaintenance, getMaintenanceSummary, createMaintenance, updateMaintenance, deleteMaintenance, getProperties } from '../services/api';
import { Wrench, Plus, Edit2, Trash2, AlertCircle, CheckCircle, Clock, XCircle } from 'lucide-react';

const statusLabels: Record<string, string> = { aberto: 'Aberto', em_andamento: 'Em Andamento', concluido: 'Concluido', cancelado: 'Cancelado' };
const statusColors: Record<string, string> = { aberto: 'bg-red-100 text-red-700', em_andamento: 'bg-yellow-100 text-yellow-700', concluido: 'bg-green-100 text-green-700', cancelado: 'bg-gray-100 text-gray-500' };
const priorityLabels: Record<string, string> = { baixa: 'Baixa', media: 'Media', alta: 'Alta', urgente: 'Urgente' };
const priorityColors: Record<string, string> = { baixa: 'bg-blue-100 text-blue-700', media: 'bg-yellow-100 text-yellow-700', alta: 'bg-orange-100 text-orange-700', urgente: 'bg-red-100 text-red-700' };
const fmt = (v: number) => v.toLocaleString('en-IE', { style: 'currency', currency: 'EUR' });

export default function Maintenance() {
  const [items, setItems] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [properties, setProperties] = useState<any[]>([]);
  const [filter, setFilter] = useState({ property_id: '', status: '' });
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ property_id: '', title: '', description: '', priority: 'media', cost: 0 });

  const load = () => {
    const params: any = {};
    if (filter.property_id) params.property_id = filter.property_id;
    if (filter.status) params.status = filter.status;
    getMaintenance(params).then(r => setItems(r.data));
    getMaintenanceSummary().then(r => setSummary(r.data));
  };

  useEffect(() => { load(); getProperties().then(r => setProperties(r.data)); }, []);
  useEffect(() => { load(); }, [filter]);

  const openCreate = () => { setEditing(null); setForm({ property_id: '', title: '', description: '', priority: 'media', cost: 0 }); setShowModal(true); };
  const openEdit = (m: any) => { setEditing(m); setForm({ property_id: m.property_id, title: m.title, description: m.description || '', priority: m.priority, cost: m.cost }); setShowModal(true); };

  const save = async () => {
    if (editing) {
      await updateMaintenance(editing.id, form);
    } else {
      await createMaintenance({ ...form, property_id: Number(form.property_id) });
    }
    setShowModal(false);
    load();
  };

  const changeStatus = async (id: number, status: string) => {
    await updateMaintenance(id, { status });
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2"><Wrench size={24} /> Manutencao</h1>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2"><Plus size={16} /> Nova Solicitacao</button>
      </div>

      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="card text-center"><p className="text-2xl font-bold text-gray-800">{summary.total}</p><p className="text-xs text-gray-500">Total</p></div>
          <div className="card text-center"><p className="text-2xl font-bold text-red-600">{summary.aberto}</p><p className="text-xs text-gray-500">Aberto</p></div>
          <div className="card text-center"><p className="text-2xl font-bold text-yellow-600">{summary.em_andamento}</p><p className="text-xs text-gray-500">Em Andamento</p></div>
          <div className="card text-center"><p className="text-2xl font-bold text-green-600">{summary.concluido}</p><p className="text-xs text-gray-500">Concluido</p></div>
          <div className="card text-center"><p className="text-2xl font-bold text-blue-600">{fmt(summary.total_cost)}</p><p className="text-xs text-gray-500">Custo Total</p></div>
        </div>
      )}

      <div className="flex gap-3">
        <select value={filter.property_id} onChange={e => setFilter(f => ({ ...f, property_id: e.target.value }))} className="select-field">
          <option value="">Todas propriedades</option>
          {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <select value={filter.status} onChange={e => setFilter(f => ({ ...f, status: e.target.value }))} className="select-field">
          <option value="">Todos status</option>
          <option value="aberto">Aberto</option><option value="em_andamento">Em Andamento</option>
          <option value="concluido">Concluido</option><option value="cancelado">Cancelado</option>
        </select>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="border-b text-left text-gray-500">
            <th className="pb-3">Titulo</th><th className="pb-3">Propriedade</th><th className="pb-3">Prioridade</th>
            <th className="pb-3">Status</th><th className="pb-3">Custo</th><th className="pb-3">Criado em</th><th className="pb-3">Acoes</th>
          </tr></thead>
          <tbody>
            {items.map(m => (
              <tr key={m.id} className="border-b hover:bg-gray-50">
                <td className="py-3 font-medium">{m.title}</td>
                <td className="py-3">{m.property_name}</td>
                <td className="py-3"><span className={`px-2 py-1 rounded-full text-xs font-medium ${priorityColors[m.priority]}`}>{priorityLabels[m.priority]}</span></td>
                <td className="py-3"><span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[m.status]}`}>{statusLabels[m.status]}</span></td>
                <td className="py-3">{fmt(m.cost)}</td>
                <td className="py-3 text-gray-500">{m.created_at ? new Date(m.created_at).toLocaleDateString('pt-BR') : '-'}</td>
                <td className="py-3 flex gap-1">
                  {m.status === 'aberto' && <button onClick={() => changeStatus(m.id, 'em_andamento')} className="p-1 text-yellow-500 hover:bg-yellow-50 rounded" title="Iniciar"><Clock size={16} /></button>}
                  {m.status === 'em_andamento' && <button onClick={() => changeStatus(m.id, 'concluido')} className="p-1 text-green-500 hover:bg-green-50 rounded" title="Concluir"><CheckCircle size={16} /></button>}
                  <button onClick={() => openEdit(m)} className="p-1 text-blue-500 hover:bg-blue-50 rounded"><Edit2 size={16} /></button>
                  <button onClick={async () => { if(confirm('Excluir?')){ await deleteMaintenance(m.id); load(); }}} className="p-1 text-red-500 hover:bg-red-50 rounded"><Trash2 size={16} /></button>
                </td>
              </tr>
            ))}
            {items.length === 0 && <tr><td colSpan={7} className="py-8 text-center text-gray-400">Nenhuma solicitacao de manutencao</td></tr>}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg">
            <h2 className="text-lg font-bold mb-4">{editing ? 'Editar' : 'Nova'} Solicitacao</h2>
            <div className="space-y-3">
              <select value={form.property_id} onChange={e => setForm(f => ({...f, property_id: e.target.value}))} className="input-field w-full">
                <option value="">Selecione a propriedade</option>
                {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <input placeholder="Titulo" value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))} className="input-field w-full" />
              <textarea placeholder="Descricao" value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} className="input-field w-full" rows={3} />
              <div className="grid grid-cols-2 gap-3">
                <select value={form.priority} onChange={e => setForm(f => ({...f, priority: e.target.value}))} className="input-field">
                  <option value="baixa">Baixa</option><option value="media">Media</option>
                  <option value="alta">Alta</option><option value="urgente">Urgente</option>
                </select>
                <input type="number" placeholder="Custo estimado" value={form.cost} onChange={e => setForm(f => ({...f, cost: Number(e.target.value)}))} className="input-field" />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-4">
              <button onClick={() => setShowModal(false)} className="btn-secondary">Cancelar</button>
              <button onClick={save} className="btn-primary">Salvar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
