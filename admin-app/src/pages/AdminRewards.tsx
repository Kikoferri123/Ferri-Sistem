import React, { useState, useEffect } from 'react';
import { Award, AlertCircle, Plus, TrendingUp } from 'lucide-react';
import { getAdminRewards } from '../services/api';
import Modal from '../components/Modal';

interface Reward {
  id: number;
  client_name: string;
  points: number;
  reason: string;
  date: string;
  created_at: string;
}

export default function AdminRewards() {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    const fetchRewards = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await getAdminRewards({ limit: 1000 });
        setRewards(res.data || []);
      } catch (err: any) {
        setError('Erro ao carregar recompensas');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchRewards();
  }, []);

  const totalPoints = rewards.reduce((sum, r) => sum + (r.points || 0), 0);

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando recompensas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Recompensas</h1>
          <p className="text-gray-600 mt-1">Gerenciar pontos de recompensa</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
        >
          <Plus size={20} />
          Adicionar Pontos
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-gap-3">
          <AlertCircle className="text-red-600 flex-shrink-0" size={20} />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Total de Pontos</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{totalPoints}</p>
            </div>
            <div className="bg-orange-50 p-3 rounded-lg">
              <Award className="text-orange-600" size={24} />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Transações</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{rewards.length}</p>
            </div>
            <div className="bg-blue-50 p-3 rounded-lg">
              <TrendingUp className="text-blue-600" size={24} />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Média por Transação</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {rewards.length > 0 ? Math.round(totalPoints / rewards.length) : 0}
              </p>
            </div>
            <div className="bg-green-50 p-3 rounded-lg">
              <Award className="text-green-600" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Transactions List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Histórico de Transações</h2>
        </div>
        {rewards.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Cliente</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Pontos</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Motivo</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Data</th>
                </tr>
              </thead>
              <tbody>
                {rewards.map((reward) => (
                  <tr key={reward.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900">{reward.client_name}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-semibold text-green-600">+{reward.points}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-600">{reward.reason}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-600">{formatDate(reward.created_at)}</p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <Award size={40} className="text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500">Nenhuma transação encontrada</p>
          </div>
        )}
      </div>

      {/* Add Points Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Adicionar Pontos"
        size="md"
      >
        <form className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Cliente</label>
            <input
              type="text"
              placeholder="Selecionar cliente"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Pontos</label>
            <input
              type="number"
              placeholder="0"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Motivo</label>
            <textarea
              placeholder="Descrever motivo"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition min-h-[100px]"
            />
          </div>
          <div className="flex gap-2 justify-end pt-4">
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Adicionar
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
