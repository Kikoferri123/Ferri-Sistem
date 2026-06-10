import React, { useEffect, useState } from 'react';
import { getAdminCheckins } from '../services/api';
import { Search, LogIn } from 'lucide-react';

export default function AdminCheckins() {
  const [items, setItems] = useState<any[]>([]);
  const [filterType, setFilterType] = useState('');
  const [search, setSearch] = useState('');

  const load = () => {
    const params: any = {};
    if (filterType) params.type = filterType;
    if (search.trim()) params.search = search.trim();
    getAdminCheckins(params).then(r => setItems(r.data));
  };

  useEffect(() => {
    load();
  }, [filterType]);

  useEffect(() => {
    const timer = setTimeout(() => load(), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const getTypeBadge = (type: string) => {
    if (type === 'checkin') {
      return (
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
          Check-in
        </span>
      );
    }
    if (type === 'checkout') {
      return (
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
          Check-out
        </span>
      );
    }
    return <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">{type}</span>;
  };

  const truncate = (text: string, length: number = 100): string => {
    if (!text) return '-';
    return text.length > length ? text.substring(0, length) + '...' : text;
  };

  const openImage = (url: string) => {
    if (url) window.open(url, '_blank');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <LogIn size={24} /> Check-ins / Check-outs
        </h1>
      </div>

      <div className="card flex gap-4 items-center">
        <div className="relative flex-1 max-w-sm">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por cliente..."
            className="input-field pl-10"
          />
        </div>
        <select
          value={filterType}
          onChange={e => setFilterType(e.target.value)}
          className="select-field"
        >
          <option value="">Todos</option>
          <option value="checkin">Check-in</option>
          <option value="checkout">Check-out</option>
        </select>
        <span className="ml-auto text-sm text-gray-500">{items.length} registros</span>
      </div>

      <div className="card overflow-x-auto p-0">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="table-header">Cliente</th>
              <th className="table-header">Tipo</th>
              <th className="table-header">Notas</th>
              <th className="table-header">Foto</th>
              <th className="table-header">Data</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {items.map(item => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="table-cell font-medium text-gray-800">{item.client_name || '-'}</td>
                <td className="table-cell">{getTypeBadge(item.type)}</td>
                <td className="table-cell text-gray-600 text-sm">{truncate(item.notes, 80)}</td>
                <td className="table-cell">
                  {item.photo_url ? (
                    <button
                      onClick={() => openImage(item.photo_url)}
                      className="text-blue-500 hover:text-blue-700 text-sm font-medium"
                    >
                      Ver Foto
                    </button>
                  ) : (
                    <span className="text-gray-400 text-sm">-</span>
                  )}
                </td>
                <td className="table-cell text-gray-500">
                  {item.created_at
                    ? new Date(item.created_at).toLocaleDateString('pt-BR')
                    : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {items.length === 0 && (
          <p className="text-center py-8 text-gray-400">Nenhum registro encontrado</p>
        )}
      </div>
    </div>
  );
}
