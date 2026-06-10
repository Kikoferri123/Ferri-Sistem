import React, { useState, useEffect } from 'react';
import { Search, AlertCircle } from 'lucide-react';
import { getClients } from '../services/api';

interface Client {
  id: number;
  name: string;
  email: string;
  phone: string;
  status: string;
  check_in?: string;
  check_out?: string;
}

export default function ClientList() {
  const [clients, setClients] = useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchClients = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await getClients({ limit: 1000 });
        setClients(res.data || []);
        setFilteredClients(res.data || []);
      } catch (err: any) {
        setError('Erro ao carregar clientes');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchClients();
  }, []);

  useEffect(() => {
    const filtered = clients.filter(
      (client) =>
        client.name.toLowerCase().includes(search.toLowerCase()) ||
        client.email.toLowerCase().includes(search.toLowerCase()) ||
        client.phone.includes(search)
    );
    setFilteredClients(filtered);
  }, [search, clients]);

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { bg: string; text: string }> = {
      active: { bg: 'bg-green-100', text: 'text-green-800' },
      inactive: { bg: 'bg-gray-100', text: 'text-gray-800' },
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
      blocked: { bg: 'bg-red-100', text: 'text-red-800' },
    };

    const style = statusMap[status.toLowerCase()] || statusMap.pending;
    const label = {
      active: 'Ativo',
      inactive: 'Inativo',
      pending: 'Pendente',
      blocked: 'Bloqueado',
    }[status.toLowerCase()] || status;

    return (
      <span className={`px-3 py-1 text-xs font-medium rounded-full ${style.bg} ${style.text}`}>
        {label}
      </span>
    );
  };

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando clientes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Clientes</h1>
        <p className="text-gray-600 mt-1">Gerenciar e visualizar todos os clientes</p>
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
            placeholder="Buscar por nome, email ou telefone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
          />
        </div>
        <p className="text-sm text-gray-500 mt-2">
          Mostrando {filteredClients.length} de {clients.length} clientes
        </p>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {filteredClients.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Nome</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Telefone</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Check-in</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Check-out</th>
                </tr>
              </thead>
              <tbody>
                {filteredClients.map((client) => (
                  <tr key={client.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900">{client.name}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-600">{client.email}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-600">{client.phone}</p>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(client.status)}
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-600">{formatDate(client.check_in)}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-600">{formatDate(client.check_out)}</p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500">Nenhum cliente encontrado</p>
          </div>
        )}
      </div>
    </div>
  );
}
