import React, { useState, useEffect } from 'react';
import { UserPlus, AlertCircle, Search, CheckCircle, Clock } from 'lucide-react';
import { getAdminReferrals } from '../services/api';

interface Referral {
  id: number;
  referrer_name: string;
  referrer_email: string;
  referred_name: string;
  referred_email: string;
  status: string;
  created_at: string;
}

export default function AdminReferrals() {
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [filteredReferrals, setFilteredReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved'>('all');

  useEffect(() => {
    const fetchReferrals = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await getAdminReferrals({ limit: 1000 });
        setReferrals(res.data || []);
        setFilteredReferrals(res.data || []);
      } catch (err: any) {
        setError('Erro ao carregar indicações');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchReferrals();
  }, []);

  useEffect(() => {
    let filtered = referrals.filter(
      (r) =>
        r.referrer_name.toLowerCase().includes(search.toLowerCase()) ||
        r.referred_name.toLowerCase().includes(search.toLowerCase()) ||
        r.referrer_email.toLowerCase().includes(search.toLowerCase()) ||
        r.referred_email.toLowerCase().includes(search.toLowerCase())
    );

    if (statusFilter !== 'all') {
      filtered = filtered.filter((r) => r.status === statusFilter);
    }

    setFilteredReferrals(filtered);
  }, [search, statusFilter, referrals]);

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
      pending: {
        bg: 'bg-yellow-100',
        text: 'text-yellow-800',
        icon: <Clock size={14} />,
      },
      approved: {
        bg: 'bg-green-100',
        text: 'text-green-800',
        icon: <CheckCircle size={14} />,
      },
      rejected: {
        bg: 'bg-red-100',
        text: 'text-red-800',
        icon: <AlertCircle size={14} />,
      },
    };

    const style = statusMap[status.toLowerCase()] || statusMap.pending;
    const label = {
      pending: 'Pendente',
      approved: 'Aprovada',
      rejected: 'Rejeitada',
    }[status.toLowerCase()] || status;

    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-full ${style.bg} ${style.text}`}>
        {style.icon}
        {label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando indicações...</p>
        </div>
      </div>
    );
  }

  const pendingCount = referrals.filter((r) => r.status === 'pending').length;
  const approvedCount = referrals.filter((r) => r.status === 'approved').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Indicações</h1>
        <p className="text-gray-600 mt-1">Gerenciar referências de clientes</p>
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
              <p className="text-gray-600 text-sm font-medium">Total de Indicações</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{referrals.length}</p>
            </div>
            <div className="bg-purple-50 p-3 rounded-lg">
              <UserPlus className="text-purple-600" size={24} />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Pendentes</p>
              <p className="text-3xl font-bold text-yellow-600 mt-2">{pendingCount}</p>
            </div>
            <div className="bg-yellow-50 p-3 rounded-lg">
              <Clock className="text-yellow-600" size={24} />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Aprovadas</p>
              <p className="text-3xl font-bold text-green-600 mt-2">{approvedCount}</p>
            </div>
            <div className="bg-green-50 p-3 rounded-lg">
              <CheckCircle className="text-green-600" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-3 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Buscar por nome ou email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              statusFilter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Todas
          </button>
          <button
            onClick={() => setStatusFilter('pending')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              statusFilter === 'pending'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Pendentes
          </button>
          <button
            onClick={() => setStatusFilter('approved')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              statusFilter === 'approved'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Aprovadas
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {filteredReferrals.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Quem Indicou</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Quem Foi Indicado</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Data</th>
                </tr>
              </thead>
              <tbody>
                {filteredReferrals.map((referral) => (
                  <tr key={referral.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900">{referral.referrer_name}</p>
                      <p className="text-sm text-gray-600">{referral.referrer_email}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900">{referral.referred_name}</p>
                      <p className="text-sm text-gray-600">{referral.referred_email}</p>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(referral.status)}
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-600">{formatDate(referral.created_at)}</p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <UserPlus size={40} className="text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500">Nenhuma indicação encontrada</p>
          </div>
        )}
      </div>
    </div>
  );
}
