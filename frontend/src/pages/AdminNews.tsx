import React, { useEffect, useState } from 'react';
import { getAdminNews, createNews, updateNews, deleteNews } from '../services/api';
import { Plus, Trash2, Edit2, Search, Newspaper } from 'lucide-react';

export default function AdminNews() {
  const [items, setItems] = useState<any[]>([]);
  const [filterCategory, setFilterCategory] = useState('');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({
    title: '',
    body: '',
    category: 'geral',
    image_url: '',
    published: false
  });

  const load = () => {
    const params: any = {};
    if (filterCategory) params.category = filterCategory;
    if (search.trim()) params.search = search.trim();
    getAdminNews(params).then(r => setItems(r.data));
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
      title: '',
      body: '',
      category: 'geral',
      image_url: '',
      published: false
    });
    setShowModal(true);
  };

  const openEdit = (item: any) => {
    setEditing(item);
    setForm({
      title: item.title || '',
      body: item.body || '',
      category: item.category || 'geral',
      image_url: item.image_url || '',
      published: item.published || false
    });
    setShowModal(true);
  };

  const save = async () => {
    if (!form.title.trim()) {
      alert('Titulo eh obrigatorio');
      return;
    }
    if (!form.body.trim()) {
      alert('Conteudo eh obrigatorio');
      return;
    }

    if (editing) {
      await updateNews(editing.id, form);
    } else {
      await createNews(form);
    }
    setShowModal(false);
    load();
  };

  const handleDelete = async (id: number) => {
    if (confirm('Excluir noticia?')) {
      await deleteNews(id);
      load();
    }
  };

  const getCategoryLabel = (category: string): string => {
    const labels: Record<string, string> = {
      geral: 'Geral',
      manutencao: 'Manutencao',
      eventos: 'Eventos',
      atualizacoes: 'Atualizacoes'
    };
    return labels[category] || category;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Newspaper size={24} /> Noticias
        </h1>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Nova Noticia
        </button>
      </div>

      <div className="card flex gap-4 items-center">
        <div className="relative flex-1 max-w-sm">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por titulo..."
            className="input-field pl-10"
          />
        </div>
        <select
          value={filterCategory}
          onChange={e => setFilterCategory(e.target.value)}
          className="select-field"
        >
          <option value="">Todas</option>
          <option value="geral">Geral</option>
          <option value="manutencao">Manutencao</option>
          <option value="eventos">Eventos</option>
          <option value="atualizacoes">Atualizacoes</option>
        </select>
        <span className="ml-auto text-sm text-gray-500">{items.length} noticias</span>
      </div>

      <div className="card overflow-x-auto p-0">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="table-header">Titulo</th>
              <th className="table-header">Categoria</th>
              <th className="table-header">Publicado</th>
              <th className="table-header">Data Criacao</th>
              <th className="table-header w-24"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {items.map(item => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="table-cell font-medium text-gray-800">{item.title}</td>
                <td className="table-cell">
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                    {getCategoryLabel(item.category)}
                  </span>
                </td>
                <td className="table-cell">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      item.published
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {item.published ? 'Sim' : 'Nao'}
                  </span>
                </td>
                <td className="table-cell text-gray-500">
                  {item.created_at
                    ? new Date(item.created_at).toLocaleDateString('pt-BR')
                    : '-'}
                </td>
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
          <p className="text-center py-8 text-gray-400">Nenhuma noticia encontrada</p>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold mb-4">
              {editing ? 'Editar' : 'Nova'} Noticia
            </h2>
            <div className="space-y-4">
              <div>
                <label className="label">Titulo *</label>
                <input
                  placeholder="Titulo da noticia"
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  className="input-field w-full"
                />
              </div>
              <div>
                <label className="label">Conteudo *</label>
                <textarea
                  placeholder="Conteudo da noticia"
                  value={form.body}
                  onChange={e => setForm({ ...form, body: e.target.value })}
                  className="input-field w-full"
                  rows={6}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Categoria</label>
                  <select
                    value={form.category}
                    onChange={e => setForm({ ...form, category: e.target.value })}
                    className="select-field w-full"
                  >
                    <option value="geral">Geral</option>
                    <option value="manutencao">Manutencao</option>
                    <option value="eventos">Eventos</option>
                    <option value="atualizacoes">Atualizacoes</option>
                  </select>
                </div>
                <div>
                  <label className="label">URL da Imagem (opcional)</label>
                  <input
                    placeholder="https://exemplo.com/imagem.jpg"
                    value={form.image_url}
                    onChange={e =>
                      setForm({ ...form, image_url: e.target.value })
                    }
                    className="input-field w-full"
                  />
                </div>
              </div>
              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="published"
                  checked={form.published}
                  onChange={e =>
                    setForm({ ...form, published: e.target.checked })
                  }
                  className="w-4 h-4 rounded border-gray-300"
                />
                <label htmlFor="published" className="text-sm text-gray-700 cursor-pointer">
                  Publicar noticia
                </label>
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
