import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { Shield, Search, ChevronLeft, ChevronRight, Filter } from 'lucide-react';

const ACTION_COLORS: Record<string, string> = {
  CREATE: 'bg-green-100 text-green-700',
  UPDATE: 'bg-blue-100 text-blue-700',
  DELETE: 'bg-red-100 text-red-700',
  LOGIN: 'bg-purple-100 text-purple-700',
};

const ENTITY_ICONS: Record<string, string> = {
  client: 'Clientes',
  property: 'Propriedades',
  contract: 'Contratos',
  transaction_in: 'Entradas',
  transaction_out: 'Saidas',
  employee: 'Funcionarios',
  maintenance: 'Manutencao',
  user: 'Usuarios',
};

export default function AuditLogs() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [logs, setLogs] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [entityFilter, setEntityFilter] = useState('');
  const [userFilter, setUserFilter] = useState('');
  const limit = 50;

  useEffect(() => {
    if (user?.role !== 'admin') { navigate('/'); return; }
    loadLogs();
  }, [page, entityFilter, userFilter]);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const params: any = { limit, offset: page * limit };
      if (entityFilter) params.entity_type = entityFilter;
      if (userFilter) params.user_name = userFilter;
      const res = await api.get('/audit/logs', { params });
      setLogs(res.data.logs || []);
      setTotal(res.data.total || 0);
    } catch { }
    setLoading(false);
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Shield size={24} className="text-blue-500" /> Logs de Auditoria
        </h1>
        <span className="text-sm text-gray-500">{total} registros</span>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={userFilter} onChange={e => { setUserFilter(e.target.value); setPage(0); }}
            placeholder="Filtrar por usuario..."
            className="input-field pl-10"
          />
        </div>
        <select
          value={entityFilter} onChange={e => { setEntityFilter(e.target.value); setPage(0); }}
          className="select-field w-48"
        >
          <option value="">Todas Entidades</option>
          {Object.entries(ENTITY_ICONS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="card overflow-x-auto p-0">
        {loading ? (
          <div className="flex items-center justify-center py-12 text-gray-400">Carregando...</div>
        ) : logs.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Shield size={48} className="mx-auto mb-3 opacity-50" />
            <p>Nenhum log encontrado</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="table-header">Data/Hora</th>
                <th className="table-header">Usuario</th>
                <th className="table-header">Acao</th>
                <th className="table-header">Entidade</th>
                <th className="table-header">ID</th>
                <th className="table-header">Detalhes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {logs.map((log: any) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="table-cell text-xs text-gray-500 whitespace-nowrap">
                    {log.created_at ? new Date(log.created_at).toLocaleString('pt-BR') : '-'}
                  </td>
                  <td className="table-cell font-medium text-sm">{log.user_name || 'Sistema'}</td>
                  <td className="table-cell">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${ACTION_COLORS[log.action?.toUpperCase()] || 'bg-gray-100 text-gray-600'}`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="table-cell text-sm">
                    <span className="text-gray-600">{ENTITY_ICONS[log.entity_type] || log.entity_type}</span>
                  </td>
                  <td className="table-cell text-xs font-mono text-gray-400">#{log.entity_id || '-'}</td>
                  <td className="table-cell text-sm text-gray-500 max-w-xs truncate">{log.details || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">
            Mostrando {page * limit + 1}-{Math.min((page + 1) * limit, total)} de {total}
          </span>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
              className="p-2 rounded-lg border hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
              <ChevronLeft size={16} />
            </button>
            <span className="text-sm text-gray-600">Pagina {page + 1} de {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
              className="p-2 rounded-lg border hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
