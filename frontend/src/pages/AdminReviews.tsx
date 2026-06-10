import React, { useEffect, useState } from 'react';
import { getAdminReviews, respondReview } from '../services/api';
import Modal from '../components/Modal';
import { Search, Star, MessageSquare } from 'lucide-react';

export default function AdminReviews() {
  const [items, setItems] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedReview, setSelectedReview] = useState<any>(null);
  const [response, setResponse] = useState('');

  const load = () => {
    const params: any = {};
    if (search.trim()) params.search = search.trim();
    getAdminReviews(params).then(r => setItems(r.data));
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => load(), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const openRespond = (item: any) => {
    setSelectedReview(item);
    setResponse(item.company_response || '');
    setShowModal(true);
  };

  const saveResponse = async () => {
    if (!response.trim()) {
      alert('Resposta eh obrigatoria');
      return;
    }

    await respondReview(selectedReview.id, { response: response.trim() });
    setShowModal(false);
    load();
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map(i => (
          <Star
            key={i}
            size={16}
            className={i <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
          />
        ))}
        <span className="ml-2 text-sm font-medium">{rating}/5</span>
      </div>
    );
  };

  const truncate = (text: string, length: number = 100): string => {
    if (!text) return '-';
    return text.length > length ? text.substring(0, length) + '...' : text;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Star size={24} /> Avaliacoes
        </h1>
      </div>

      <div className="card flex gap-4 items-center">
        <div className="relative flex-1 max-w-sm">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por cliente ou propriedade..."
            className="input-field pl-10"
          />
        </div>
        <span className="ml-auto text-sm text-gray-500">{items.length} avaliacoes</span>
      </div>

      <div className="card overflow-x-auto p-0">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="table-header">Cliente</th>
              <th className="table-header">Propriedade</th>
              <th className="table-header">Nota</th>
              <th className="table-header">Comentario</th>
              <th className="table-header">Resposta Empresa</th>
              <th className="table-header">Data</th>
              <th className="table-header w-24"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {items.map(item => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="table-cell font-medium text-gray-800">{item.client_name || '-'}</td>
                <td className="table-cell text-gray-600">{item.property_name || '-'}</td>
                <td className="table-cell">{renderStars(item.rating || 0)}</td>
                <td className="table-cell text-gray-600 text-sm">{truncate(item.comment, 80)}</td>
                <td className="table-cell text-gray-600 text-sm">
                  {truncate(item.company_response, 80)}
                </td>
                <td className="table-cell text-gray-500">
                  {item.created_at
                    ? new Date(item.created_at).toLocaleDateString('pt-BR')
                    : '-'}
                </td>
                <td className="table-cell">
                  <div className="flex items-center gap-2">
                    {!item.company_response ? (
                      <button
                        onClick={() => openRespond(item)}
                        className="text-green-500 hover:text-green-700 flex items-center gap-1"
                        title="Responder"
                      >
                        <MessageSquare size={16} />
                        <span className="text-xs">Responder</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => openRespond(item)}
                        className="text-blue-500 hover:text-blue-700"
                        title="Editar resposta"
                      >
                        <MessageSquare size={16} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {items.length === 0 && (
          <p className="text-center py-8 text-gray-400">Nenhuma avaliacao encontrada</p>
        )}
      </div>

      {showModal && selectedReview && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold mb-4">
              Responder Avaliacao
            </h2>
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">
                  <strong>Cliente:</strong> {selectedReview.client_name}
                </p>
                <p className="text-sm text-gray-600 mb-2">
                  <strong>Propriedade:</strong> {selectedReview.property_name}
                </p>
                <p className="text-sm text-gray-600 mb-2">
                  <strong>Nota:</strong> {renderStars(selectedReview.rating || 0)}
                </p>
                <p className="text-sm text-gray-600 mb-2">
                  <strong>Comentario:</strong> {selectedReview.comment}
                </p>
              </div>
              <div>
                <label className="label">Resposta da Empresa *</label>
                <textarea
                  placeholder="Digite a resposta..."
                  value={response}
                  onChange={e => setResponse(e.target.value)}
                  className="input-field w-full"
                  rows={6}
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
              <button
                onClick={() => setShowModal(false)}
                className="btn-secondary"
              >
                Cancelar
              </button>
              <button onClick={saveResponse} className="btn-primary">
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
