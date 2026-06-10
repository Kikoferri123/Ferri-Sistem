import React, { useState, useEffect } from 'react';
import { LogIn, AlertCircle, Search } from 'lucide-react';
import { getAdminCheckins } from '../services/api';

interface Checkin {
  id: number;
  client_name: string;
  client_email: string;
  check_in_time: string;
  check_out_time?: string;
  status: string;
}

export default function AdminCheckins() {
  const [checkins, setCheckins] = useState<Checkin[]>([]);
  const [filteredCheckins, setFilteredCheckins] = useState<Checkin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchCheckins = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await getAdminCheckins({ limit: 1000 });
        setCheckins(res.data || []);
        setFilteredCheckins(res.data || []);
      } catch (err: any) {
        setError('Erro ao carregar check-ins');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchCheckins();
  }, []);

  useEffect(() => {
    const filtered = checkins.filter(
      (c) =>
        c.client_name.toLowerCase().includes(search.toLowerCase()) ||
        c.client_email.toLowerCase().includes(search.toLowerCase())
    );
    setFilteredCheckins(filtered);
  }, [search, checkins]);

  const formatDate = (date: string | undefined) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { bg: string; text: string }> = {
      'checked-in': { bg: 'bg-green-100', text: 'text-green-800' },
      'checked-out': { bg: 'bg-gray-100', text: 'text-gray-800' },
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
    };

    const style = statusMap[status.toLowerCase()] || statusMap.pending;
    const label = {
      'checked-in': 'Chegou',
      'checked-out': 'Saiu',
      pending: 'Pendente',
    }[status.toLowerCase()] || status;

    return (
      <span className={`px-3 py-1 text-xs font-medium rounded-full ${style.bg} ${style.text}`}>
        {label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando check-ins...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Check-ins</h1>
        <p className="text-gray-600 mt-1">Histórico de entrada e saída de clientes</p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-gap-3">
          <AlertCircle className="text-red-600 flex-shrink-0" size={20} />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Search Bar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
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
        <p className="text-sm text-gray-500 mt-2">
          Mostrando {filteredCheckins.length} de {checkins.length} check-ins
        </p>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {filteredCheckins.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Nome</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Check-in</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Check-out</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredCheckins.map((checkin) => (
                  <tr key={checkin.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900">{checkin.client_name}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-600">{checkin.client_email}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-600">{formatDate(checkin.check_in_time)}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-600">{formatDate(checkin.check_out_time)}</p>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(checkin.status)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <LogIn size={40} className="text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500">Nenhum check-in encontrado</p>
          </div>
        )}
      </div>
    </div>
  );
}
