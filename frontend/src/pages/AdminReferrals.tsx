import React, { useEffect, useState } from 'react';
import { getAdminReferrals, updateReferralStatus } from '../services/api';
import Modal from '../components/Modal';
import { Search, UserPlus } from 'lucide-react';

export default function AdminReferrals() {
  const [items, setItems] = useState<any[]>([]);
  const [filterStatus, setFilterStatus] = useState('');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedReferral, setSelectedReferral] = useState<any>(null);
  const [newStatus, setNewStatus] = useState('');

  const load = () => {
    const params: any = {};
    if (filterStatus) params.status = filterStatus;
    if (search.trim()) params.search = search.trim();
    getAdminReferrals(params).then(r => setItems(r.data));
  };

  useEffect(() => {
    load();
  }, [filterStatus]);

  useEffect(() => {
    const timer = setTimeout(() => load(), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const openChangeStatus = (item: any) => {
    setSelectedReferral(item);
    setNewStatus(item.status || '');
    setShowModal(true);
  };

  const saveStatus = async () => {
    if (!newStatus.trim()) {
      alert('Status eh obrigatorio');
      return;
    }

    await updateReferralStatus(selectedReferral.id, { status: newStatus });
    setShowModal(false);
    load();
  };

  const getStatusBadge = (status: string) => {
    const statusStyles: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-700',
      contacted: 'bg-blue-100 text-blue-700',
      converted: 'bg-green-100 text-green-700',
      rejected: 'bg-red-100 text-red-700'
    };

    const statusLabels: Record<string, string> = {
      pending: 'Pendente',
      contacted: 'Contatado',
      converted: 'Convertido',
      rejected: 'Rejeitado'
    };

    const style = statusStyles[status] || 'bg-gray-100 text-gray-700';
    const label = statusLabels[status] || status;

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${style}`}>
        {label}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <UserPlus size={24} /> Indicacoes
        </h1>
      </div>

      <div className="card flex gap-4 items-center">
        <div className="relative flex-1 max-w-sm">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por cliente ou amigo..."
            className="input-field pl-10"
          />
        </div>
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="select-field"
        >
          <option value="">Todas</option>
          <option value="pending">Pendente</option>
          <option value="contacted">Contatado</option>
          <option value="converted">Convertido</option>
          <option value="rejected">Rejeitado</option>
        </select>
        <span className="ml-auto text-sm text-gray-500">{items.length} indicacoes</span>
      </div>

      <div className="card overflow-x-auto p-0">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="table-header">Cliente Origem</th>
              <th className="table-header">Amigo (Nome)</th>
              <th className="table-header">Email Amigo</th>
              <th className="table-header">Telefone</th>
              <th className="table-header">Status</th>
              <th className="table-header">Pontos</th>
              <th className="table-header">Data</th>
              <th className="table-header w-24"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {items.map(item => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="table-cell font-medium text-gray-800">{item.client_name || '-'}</td>
                <td className="table-cell text-gray-600">{item.friend_name || '-'}</td>
                <td className="table-cell text-gray-600 text-sm">{item.friend_email || '-'}</td>
                <td className="table-cell text-gray-600 text-sm">{item.friend_phone || '-'}</td>
                <td className="table-cell">{getStatusBadge(item.status)}</td>
                <td className="table-cell text-center font-medium text-gray-800">
                  {item.points || 0}
                </td>
                <td className="table-cell text-gray-500">
                  {item.created_at
                    ? new Date(item.created_at).toLocaleDateString('pt-BR')
                    : '-'}
                </td>
                <td className="table-cell">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openChangeStatus(item)}
                      className="text-blue-500 hover:text-blue-700 text-sm font-medium"
                      title="Alterar status"
                    >
                      Alterar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {items.length === 0 && (
          <p className="text-center py-8 text-gray-400">Nenhuma indicacao encontrada</p>
        )}
      </div>

      {showModal && selectedReferral && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold mb-4">
              Alterar Status da Indicacao
            </h2>
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">
                  <strong>Cliente:</strong> {selectedReferral.client_name}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Amigo:</strong> {selectedReferral.friend_name}
                </p>
              </div>
              <div>
                <label className="label">Novo Status *</label>
                <select
                  value={newStatus}
                  onChange={e => setNewStatus(e.target.value)}
                  className="select-field w-full"
                >
                  <option value="">Selecione um status</option>
                  <option value="pending">Pendente</option>
                  <option value="contacted">Contatado</option>
                  <option value="converted">Convertido</option>
                  <option value="rejected">Rejeitado</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
              <button
                onClick={() => setShowModal(false)}
                className="btn-secondary"
              >
                Cancelar
              </button>
              <button onClick={saveStatus} className="btn-primary">
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
