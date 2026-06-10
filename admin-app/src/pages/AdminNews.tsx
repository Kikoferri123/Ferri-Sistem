import React, { useEffect, useState } from 'react';
import { Newspaper, Pencil, Trash2, Plus } from 'lucide-react';
import { getAdminNews, createNews, updateNews, deleteNews } from '../services/api';
import Modal from '../components/Modal';

interface NewsItem {
  id: number;
  titulo: string;
  body: string;
  categoria: string;
  image_url?: string;
  published: boolean;
  created_at: string;
}

interface FormData {
  titulo: string;
  body: string;
  categoria: string;
  image_url: string;
  published: boolean;
}

export default function AdminNews() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState<FormData>({
    titulo: '',
    body: '',
    categoria: 'geral',
    image_url: '',
    published: false,
  });

  const categories = ['geral', 'manutencao', 'eventos', 'atualizacoes'];

  useEffect(() => {
    fetchNews();
  }, []);

  const fetchNews = async () => {
    try {
      setLoading(true);
      const response = await getAdminNews();
      setNews(response.data);
    } catch (err: any) {
      setError('Erro ao carregar notícias');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (item?: NewsItem) => {
    if (item) {
      setFormData({
        titulo: item.titulo,
        body: item.body,
        categoria: item.categoria,
        image_url: item.image_url || '',
        published: item.published,
      });
      setEditingId(item.id);
    } else {
      setFormData({
        titulo: '',
        body: '',
        categoria: 'geral',
        image_url: '',
        published: false,
      });
      setEditingId(null);
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateNews(editingId, formData);
      } else {
        await createNews(formData);
      }
      fetchNews();
      closeModal();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao salvar notícia');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Tem certeza que deseja deletar?')) return;
    try {
      await deleteNews(id);
      fetchNews();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao deletar notícia');
    }
  };

  const filteredNews = news.filter((item) => {
    const matchesSearch =
      item.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.body.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !categoryFilter || item.categoria === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Newspaper className="text-blue-600" size={28} />
          <h1 className="text-3xl font-bold text-gray-900">Noticias</h1>
        </div>
        <button
          onClick={() => openModal()}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={20} />
          Nova Noticia
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div className="card p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <input
            type="text"
            placeholder="Buscar notícias..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field"
          />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="select-field"
          >
            <option value="">Todas as Categorias</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="text-center py-8">Carregando...</div>
        ) : filteredNews.length === 0 ? (
          <div className="text-center py-8 text-gray-500">Nenhuma notícia encontrada</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="table-header text-left">Titulo</th>
                  <th className="table-header text-left">Categoria</th>
                  <th className="table-header text-left">Status</th>
                  <th className="table-header text-left">Data</th>
                  <th className="table-header text-right">Acoes</th>
                </tr>
              </thead>
              <tbody>
                {filteredNews.map((item) => (
                  <tr key={item.id} className="border-b hover:bg-gray-50">
                    <td className="table-cell font-medium">{item.titulo}</td>
                    <td className="table-cell">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                        {item.categoria}
                      </span>
                    </td>
                    <td className="table-cell">
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          item.published
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {item.published ? 'Publicado' : 'Rascunho'}
                      </span>
                    </td>
                    <td className="table-cell text-sm text-gray-600">
                      {new Date(item.created_at).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="table-cell text-right space-x-2">
                      <button
                        onClick={() => openModal(item)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <Pencil size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingId ? 'Editar Noticia' : 'Nova Noticia'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Titulo</label>
            <input
              type="text"
              value={formData.titulo}
              onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
              className="input-field"
              required
            />
          </div>

          <div>
            <label className="label">Conteudo</label>
            <textarea
              value={formData.body}
              onChange={(e) => setFormData({ ...formData, body: e.target.value })}
              className="input-field min-h-[150px]"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Categoria</label>
              <select
                value={formData.categoria}
                onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                className="select-field"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">URL da Imagem</label>
              <input
                type="url"
                value={formData.image_url}
                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                className="input-field"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="published"
              checked={formData.published}
              onChange={(e) => setFormData({ ...formData, published: e.target.checked })}
              className="rounded"
            />
            <label htmlFor="published" className="text-sm font-medium text-gray-700">
              Publicar agora
            </label>
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <button
              type="button"
              onClick={closeModal}
              className="btn-secondary"
            >
              Cancelar
            </button>
            <button type="submit" className="btn-primary">
              Salvar
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
