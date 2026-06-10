import React, { useEffect, useState } from 'react';
import { getAdminFaq, createFaq, updateFaq, deleteFaq } from '../services/api';
import Modal from '../components/Modal';
import { Plus, Trash2, Edit2, Search, HelpCircle } from 'lucide-react';

export default function AdminFaq() {
  const [items, setItems] = useState<any[]>([]);
  const [filterCategory, setFilterCategory] = useState('');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({
    question: '',
    answer: '',
    category: '',
    sort_order: 0
  });

  const load = () => {
    const params: any = {};
    if (filterCategory) params.category = filterCategory;
    if (search.trim()) params.search = search.trim();
    getAdminFaq(params).then(r => setItems(r.data));
  };

  useEffect(() => {
    load();
  }, [filterCategory]);

  useEffect(() => {
    const timer = setTimeout(() => load(), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const openCreate = () => {
    setEditing(null);
    setForm({
      question: '',
      answer: '',
      category: '',
      sort_order: 0
    });
    setShowModal(true);
  };

  const openEdit = (item: any) => {
    setEditing(item);
    setForm({
      question: item.question || '',
      answer: item.answer || '',
      category: item.category || '',
      sort_order: item.sort_order || 0
    });
    setShowModal(true);
  };

  const save = async () => {
    if (!form.question.trim()) {
      alert('Pergunta eh obrigatoria');
      return;
    }
    if (!form.answer.trim()) {
      alert('Resposta eh obrigatoria');
      return;
    }
    if (!form.category.trim()) {
      alert('Categoria eh obrigatoria');
      return;
    }

    if (editing) {
      await updateFaq(editing.id, form);
    } else {
      await createFaq(form);
    }
    setShowModal(false);
    load();
  };

  const handleDelete = async (id: number) => {
    if (confirm('Excluir pergunta?')) {
      await deleteFaq(id);
      load();
    }
  };

  const truncate = (text: string, length: number = 100): string => {
    if (!text) return '';
    return text.length > length ? text.substring(0, length) + '...' : text;
  };

  const getCategories = (): string[] => {
    const categories = new Set<string>();
    items.forEach(item => {
      if (item.category) categories.add(item.category);
    });
    return Array.from(categories).sort();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <HelpCircle size={24} /> FAQ
        </h1>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Nova Pergunta
        </button>
      </div>

      <div className="card flex gap-4 items-center">
        <div className="relative flex-1 max-w-sm">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por pergunta..."
            className="input-field pl-10"
          />
        </div>
        <select
          value={filterCategory}
          onChange={e => setFilterCategory(e.target.value)}
          className="select-field"
        >
          <option value="">Todas</option>
          {getCategories().map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
        <span className="ml-auto text-sm text-gray-500">{items.length} perguntas</span>
      </div>

      <div className="card overflow-x-auto p-0">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="table-header">Pergunta</th>
              <th className="table-header">Resposta</th>
              <th className="table-header">Categoria</th>
              <th className="table-header">Ordem</th>
              <th className="table-header w-24"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {items.map(item => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="table-cell font-medium text-gray-800">{truncate(item.question, 80)}</td>
                <td className="table-cell text-gray-600 text-sm">{truncate(item.answer, 80)}</td>
                <td className="table-cell">
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                    {item.category}
                  </span>
                </td>
                <td className="table-cell text-gray-500 text-center">{item.sort_order || '-'}</td>
                <td className="table-cell">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openEdit(item)}
                      className="text-blue-500 hover:text-blue-700"
                      title="Editar"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="text-red-500 hover:text-red-700"
                      title="Remover"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {items.length === 0 && (
          <p className="text-center py-8 text-gray-400">Nenhuma pergunta encontrada</p>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold mb-4">
              {editing ? 'Editar' : 'Nova'} Pergunta
            </h2>
            <div className="space-y-4">
              <div>
                <label className="label">Pergunta *</label>
                <textarea
                  placeholder="Digite a pergunta"
                  value={form.question}
                  onChange={e => setForm({ ...form, question: e.target.value })}
                  className="input-field w-full"
                  rows={3}
                />
              </div>
              <div>
                <label className="label">Resposta *</label>
                <textarea
                  placeholder="Digite a resposta"
                  value={form.answer}
                  onChange={e => setForm({ ...form, answer: e.target.value })}
                  className="input-field w-full"
                  rows={6}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Categoria *</label>
                  <input
                    placeholder="Ex: Geral, Propriedades, Reservas..."
                    value={form.category}
                    onChange={e => setForm({ ...form, category: e.target.value })}
                    className="input-field w-full"
                  />
                </div>
                <div>
                  <label className="label">Ordem de Exibicao</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={form.sort_order}
                    onChange={e => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })}
                    className="input-field w-full"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
              <button
                onClick={() => setShowModal(false)}
                className="btn-secondary"
              >
                Cancelar
              </button>
              <button onClick={save} className="btn-primary">
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
