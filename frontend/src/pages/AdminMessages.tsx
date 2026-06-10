import React, { useEffect, useState } from 'react';
import { getAdminMessages, replyMessage, deleteMessage, getClients } from '../services/api';
import Modal from '../components/Modal';
import { Plus, Trash2, Search, MessageSquare, Send, ChevronDown, ChevronUp } from 'lucide-react';

export default function AdminMessages() {
  const [messages, setMessages] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [filterRead, setFilterRead] = useState('todas');
  const [search, setSearch] = useState('');
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<any>(null);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [replyForm, setReplyForm] = useState({ client_id: '', subject: '', body: '' });

  const load = () => {
    const params: any = {};
    if (filterRead !== 'todas') params.read = filterRead === 'lidas';
    if (search.trim()) params.search = search.trim();
    getAdminMessages(params).then(r => setMessages(r.data));
  };

  useEffect(() => {
    load();
    getClients().then(r => setClients(r.data));
  }, [filterRead]);

  useEffect(() => {
    const timer = setTimeout(() => load(), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const toggleExpand = (id: number) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  const handleReplyClick = (message: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedMessage(message);
    setReplyForm({ client_id: message.client_id?.toString() || '', subject: '', body: '' });
    setShowReplyModal(true);
  };

  const handleDeleteClick = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Remover mensagem?')) {
      await deleteMessage(id);
      load();
    }
  };

  const handleReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyForm.client_id || !replyForm.subject || !replyForm.body) {
      alert('Por favor, preencha todos os campos');
      return;
    }
    await replyMessage({
      client_id: Number(replyForm.client_id),
      subject: replyForm.subject,
      body: replyForm.body
    });
    setShowReplyModal(false);
    setSelectedMessage(null);
    setReplyForm({ client_id: '', subject: '', body: '' });
    load();
  };

  const getMessageType = (type: string) => {
    const types: Record<string, { label: string; color: string }> = {
      client: { label: 'Cliente', color: 'bg-blue-100 text-blue-700' },
      company: { label: 'Empresa', color: 'bg-purple-100 text-purple-700' },
    };
    return types[type] || { label: type, color: 'bg-gray-100 text-gray-700' };
  };

  const readBadgeStyle = (isRead: boolean) => {
    return isRead ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <MessageSquare size={24} /> Mensagens
        </h1>
      </div>

      <div className="card flex gap-4 items-center">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterRead('todas')}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              filterRead === 'todas'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Todas
          </button>
          <button
            onClick={() => setFilterRead('lidas')}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              filterRead === 'lidas'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Lidas
          </button>
          <button
            onClick={() => setFilterRead('nao_lidas')}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              filterRead === 'nao_lidas'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Nao Lidas
          </button>
        </div>

        <div className="relative flex-1 max-w-sm">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por cliente, assunto, remetente..."
            className="input-field pl-10"
          />
        </div>

        <span className="ml-auto text-sm text-gray-500">{messages.length} mensagens</span>
      </div>

      <div className="card overflow-x-auto p-0">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="table-header">Cliente</th>
              <th className="table-header">Assunto</th>
              <th className="table-header">Remetente</th>
              <th className="table-header">Tipo</th>
              <th className="table-header">Lida</th>
              <th className="table-header">Data</th>
              <th className="table-header w-24"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {messages.map(msg => (
              <React.Fragment key={msg.id}>
                <tr
                  className="hover:bg-blue-50 cursor-pointer transition-colors"
                  onClick={() => toggleExpand(msg.id)}
                >
                  <td className="table-cell font-medium text-blue-600">{msg.client_name || msg.client_id || '-'}</td>
                  <td className="table-cell text-gray-800">{msg.subject || '-'}</td>
                  <td className="table-cell text-gray-600">{msg.sender_name || msg.sender_email || '-'}</td>
                  <td className="table-cell">
                    <span className={`text-xs px-2 py-1 rounded font-medium ${getMessageType(msg.sender_type || 'client').color}`}>
                      {getMessageType(msg.sender_type || 'client').label}
                    </span>
                  </td>
                  <td className="table-cell">
                    <span className={`text-xs px-2 py-1 rounded font-medium ${readBadgeStyle(msg.read)}`}>
                      {msg.read ? 'Sim' : 'Nao'}
                    </span>
                  </td>
                  <td className="table-cell text-gray-500 text-sm">
                    {msg.created_at ? new Date(msg.created_at).toLocaleDateString('pt-BR') : '-'}
                  </td>
                  <td className="table-cell">
                    <div className="flex items-center justify-end">
                      {expandedRows.has(msg.id) ? (
                        <ChevronUp size={18} className="text-gray-400" />
                      ) : (
                        <ChevronDown size={18} className="text-gray-400" />
                      )}
                    </div>
                  </td>
                </tr>

                {expandedRows.has(msg.id) && (
                  <tr className="bg-gray-50">
                    <td colSpan={7} className="p-4">
                      <div className="space-y-4">
                        <div>
                          <p className="text-sm font-semibold text-gray-700 mb-2">Corpo da Mensagem:</p>
                          <div className="bg-white p-3 rounded border border-gray-200 text-sm text-gray-700 whitespace-pre-wrap max-h-64 overflow-y-auto">
                            {msg.body || '-'}
                          </div>
                        </div>

                        <div className="flex justify-end gap-2">
                          <button
                            onClick={(e) => handleReplyClick(msg, e)}
                            className="btn-primary flex items-center gap-2"
                          >
                            <Send size={16} /> Responder
                          </button>
                          <button
                            onClick={(e) => handleDeleteClick(msg.id, e)}
                            className="btn-secondary flex items-center gap-2 text-red-600 hover:text-red-700"
                          >
                            <Trash2 size={16} /> Remover
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
        {messages.length === 0 && (
          <p className="text-center py-8 text-gray-400">Nenhuma mensagem encontrada</p>
        )}
      </div>

      <Modal
        isOpen={showReplyModal}
        onClose={() => setShowReplyModal(false)}
        title="Responder Mensagem"
        size="lg"
      >
        <form onSubmit={handleReplySubmit} className="space-y-4">
          <div>
            <label className="label">Cliente *</label>
            <select
              value={replyForm.client_id}
              onChange={e => setReplyForm({ ...replyForm, client_id: e.target.value })}
              className="select-field"
              required
            >
              <option value="">Selecionar cliente...</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Assunto *</label>
            <input
              type="text"
              value={replyForm.subject}
              onChange={e => setReplyForm({ ...replyForm, subject: e.target.value })}
              placeholder="Assunto da mensagem"
              className="input-field"
              required
            />
          </div>

          <div>
            <label className="label">Corpo da Mensagem *</label>
            <textarea
              value={replyForm.body}
              onChange={e => setReplyForm({ ...replyForm, body: e.target.value })}
              placeholder="Digite sua resposta aqui..."
              className="input-field"
              rows={6}
              required
            />
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setShowReplyModal(false)}
              className="btn-secondary"
            >
              Cancelar
            </button>
            <button type="submit" className="btn-primary flex items-center gap-2">
              <Send size={16} /> Enviar Resposta
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
