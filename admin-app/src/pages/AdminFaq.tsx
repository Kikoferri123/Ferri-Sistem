import React, { useState, useEffect } from 'react';
import { HelpCircle, AlertCircle, Plus, Pencil, Trash2, ChevronDown } from 'lucide-react';
import { getAdminFaq } from '../services/api';
import Modal from '../components/Modal';

interface FaqItem {
  id: number;
  question: string;
  answer: string;
  category: string;
  order: number;
  created_at: string;
}

export default function AdminFaq() {
  const [faqItems, setFaqItems] = useState<FaqItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const fetchFaq = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await getAdminFaq({ limit: 1000 });
        setFaqItems(res.data || []);
      } catch (err: any) {
        setError('Erro ao carregar FAQ');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchFaq();
  }, []);

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const categories = [...new Set(faqItems.map((item) => item.category))];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando FAQ...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">FAQ</h1>
          <p className="text-gray-600 mt-1">Gerenciar perguntas frequentes</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
        >
          <Plus size={20} />
          Nova Pergunta
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-gap-3">
          <AlertCircle className="text-red-600 flex-shrink-0" size={20} />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* FAQ Items by Category */}
      {categories.length > 0 ? (
        <div className="space-y-6">
          {categories.map((category) => (
            <div key={category}>
              <h2 className="text-lg font-bold text-gray-900 mb-4 px-4 py-2 bg-gray-50 rounded-lg">
                {category}
              </h2>
              <div className="space-y-2">
                {faqItems
                  .filter((item) => item.category === category)
                  .map((item) => (
                    <div
                      key={item.id}
                      className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
                    >
                      <button
                        onClick={() =>
                          setExpandedId(expandedId === item.id ? null : item.id)
                        }
                        className="w-full flex items-start justify-between p-6 hover:bg-gray-50 transition-colors text-left"
                      >
                        <div className="flex-1">
                          <h3 className="font-bold text-gray-900">{item.question}</h3>
                          <p className="text-xs text-gray-500 mt-1">
                            Criada em {formatDate(item.created_at)}
                          </p>
                        </div>
                        <ChevronDown
                          size={20}
                          className={`text-gray-400 flex-shrink-0 ml-4 transition-transform ${
                            expandedId === item.id ? 'rotate-180' : ''
                          }`}
                        />
                      </button>
                      {expandedId === item.id && (
                        <>
                          <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
                            <p className="text-gray-700 whitespace-pre-wrap">
                              {item.answer}
                            </p>
                          </div>
                          <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 flex items-center gap-2 justify-end">
                            <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                              <Pencil size={18} />
                            </button>
                            <button className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
          <HelpCircle size={40} className="text-gray-300 mx-auto mb-2" />
          <p className="text-gray-500">Nenhuma pergunta encontrada</p>
        </div>
      )}

      {/* Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Nova Pergunta FAQ"
        size="lg"
      >
        <form className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Pergunta
            </label>
            <input
              type="text"
              placeholder="Digite a pergunta"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Resposta
            </label>
            <textarea
              placeholder="Digite a resposta"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition min-h-[150px]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Categoria
            </label>
            <input
              type="text"
              placeholder="Digite a categoria"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
            />
          </div>
          <div className="flex gap-2 justify-end pt-4">
            <button
              type="button"
              onClick={() => setShowModal(false)}
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
