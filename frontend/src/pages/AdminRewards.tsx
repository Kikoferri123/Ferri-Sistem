import React, { useEffect, useState } from 'react';
import { getAdminRewards, addRewardPoints, getRewardTransactions, getClients } from '../services/api';
import Modal from '../components/Modal';
import { Plus, Award } from 'lucide-react';

const getLevelColor = (level: string) => {
  const colors: Record<string, string> = {
    'Bronze': 'bg-yellow-100',
    'Silver': 'bg-gray-100',
    'Gold': 'bg-yellow-50',
    'Platinum': 'bg-purple-50'
  };
  return colors[level] || 'bg-gray-50';
};

const getLevelBadgeColor = (level: string) => {
  const colors: Record<string, { text: string; bg: string }> = {
    'Bronze': { text: 'text-yellow-700', bg: 'bg-yellow-100' },
    'Silver': { text: 'text-gray-700', bg: 'bg-gray-100' },
    'Gold': { text: 'text-yellow-700', bg: 'bg-yellow-100' },
    'Platinum': { text: 'text-purple-700', bg: 'bg-purple-100' }
  };
  return colors[level] || { text: 'text-gray-700', bg: 'bg-gray-100' };
};

export default function AdminRewards() {
  const [activeTab, setActiveTab] = useState<'points' | 'transactions'>('points');
  const [rewards, setRewards] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form state
  const [form, setForm] = useState({
    client_id: '',
    points: '',
    type: 'payment',
    description: ''
  });

  const loadRewards = async () => {
    try {
      const res = await getAdminRewards();
      setRewards(res.data || []);
    } catch (e) {
      console.error('Error loading rewards:', e);
    }
  };

  const loadTransactions = async () => {
    try {
      const res = await getRewardTransactions();
      setTransactions(res.data || []);
    } catch (e) {
      console.error('Error loading transactions:', e);
    }
  };

  const loadClients = async () => {
    try {
      const res = await getClients();
      setClients(res.data || []);
    } catch (e) {
      console.error('Error loading clients:', e);
    }
  };

  useEffect(() => {
    loadRewards();
    loadTransactions();
    loadClients();
  }, []);

  const handleAddPoints = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.client_id || !form.points) {
      alert('Preencha os campos obrigatorios');
      return;
    }

    setLoading(true);
    try {
      const data = {
        client_id: Number(form.client_id),
        points: Number(form.points),
        type: form.type,
        description: form.description
      };
      await addRewardPoints(data);
      setShowModal(false);
      setForm({ client_id: '', points: '', type: 'payment', description: '' });
      loadRewards();
      loadTransactions();
    } catch (e: any) {
      alert('Erro ao adicionar pontos: ' + (e.response?.data?.detail || e.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Award size={24} /> Recompensas
        </h1>
        <button
          onClick={() => setShowModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={18} /> Adicionar Pontos
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab('points')}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${
            activeTab === 'points'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-600'
          }`}
        >
          Pontos por Cliente
        </button>
        <button
          onClick={() => setActiveTab('transactions')}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${
            activeTab === 'transactions'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-600'
          }`}
        >
          Transacoes
        </button>
      </div>

      {/* Tab 1: Points per Client */}
      {activeTab === 'points' && (
        <div className="card overflow-x-auto p-0">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="table-header">Cliente</th>
                <th className="table-header text-right">Pontos Totais</th>
                <th className="table-header">Nivel</th>
                <th className="table-header text-center">Streak (meses)</th>
                <th className="table-header w-20"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rewards.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-gray-400">
                    Nenhum cliente com pontos
                  </td>
                </tr>
              ) : (
                rewards.map((item: any) => {
                  const levelConfig = getLevelBadgeColor(item.level || 'Bronze');
                  return (
                    <tr key={item.client_id} className="hover:bg-gray-50">
                      <td className="table-cell font-medium text-blue-600">
                        {item.client_name}
                      </td>
                      <td className="table-cell text-right font-semibold text-gray-800">
                        {item.total_points || 0}
                      </td>
                      <td className="table-cell">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${levelConfig.text} ${levelConfig.bg}`}
                        >
                          {item.level || 'Bronze'}
                        </span>
                      </td>
                      <td className="table-cell text-center">
                        {item.streak_months || 0}
                      </td>
                      <td className="table-cell"></td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 2: Transactions */}
      {activeTab === 'transactions' && (
        <div className="card overflow-x-auto p-0">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="table-header">Cliente</th>
                <th className="table-header text-right">Pontos</th>
                <th className="table-header">Tipo</th>
                <th className="table-header">Descricao</th>
                <th className="table-header">Data</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-gray-400">
                    Nenhuma transacao registrada
                  </td>
                </tr>
              ) : (
                transactions.map((item: any, idx: number) => {
                  const typeLabels: Record<string, string> = {
                    payment: 'Pagamento',
                    referral: 'Indicacao',
                    bonus: 'Bonus',
                    streak: 'Streak'
                  };
                  const typeColors: Record<string, string> = {
                    payment: 'text-blue-600',
                    referral: 'text-green-600',
                    bonus: 'text-purple-600',
                    streak: 'text-yellow-600'
                  };
                  return (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="table-cell font-medium text-blue-600">
                        {item.client_name}
                      </td>
                      <td className="table-cell text-right font-semibold">
                        {item.points > 0 ? '+' : ''}{item.points}
                      </td>
                      <td className={`table-cell font-medium ${typeColors[item.type] || 'text-gray-600'}`}>
                        {typeLabels[item.type] || item.type}
                      </td>
                      <td className="table-cell text-gray-600">
                        {item.description || '-'}
                      </td>
                      <td className="table-cell text-gray-500 text-sm">
                        {item.created_at
                          ? new Date(item.created_at).toLocaleDateString('pt-BR')
                          : '-'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal: Add Points */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Adicionar Pontos"
        size="md"
      >
        <form onSubmit={handleAddPoints} className="space-y-4">
          <div>
            <label className="label">Cliente *</label>
            <select
              value={form.client_id}
              onChange={(e) => setForm({ ...form, client_id: e.target.value })}
              className="select-field"
              required
            >
              <option value="">Selecionar cliente...</option>
              {clients.map((c: any) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Pontos *</label>
            <input
              type="number"
              value={form.points}
              onChange={(e) => setForm({ ...form, points: e.target.value })}
              className="input-field"
              placeholder="Ex: 100"
              required
            />
          </div>

          <div>
            <label className="label">Tipo *</label>
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              className="select-field"
              required
            >
              <option value="payment">Pagamento</option>
              <option value="referral">Indicacao</option>
              <option value="bonus">Bonus</option>
              <option value="streak">Streak</option>
            </select>
          </div>

          <div>
            <label className="label">Descricao</label>
            <input
              type="text"
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              className="input-field"
              placeholder="Ex: Pagamento em dia..."
            />
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="btn-secondary"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
            >
              {loading ? 'Processando...' : 'Adicionar'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
