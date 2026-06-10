import React, { useState, useEffect } from 'react';
import { MessageSquare, AlertCircle, Reply, Trash2 } from 'lucide-react';
import { getAdminMessages } from '../services/api';
import Modal from '../components/Modal';

interface Message {
  id: number;
  client_name: string;
  client_email: string;
  message: string;
  is_read: boolean;
  created_at: string;
  replied_at?: string;
}

export default function AdminMessages() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [filterRead, setFilterRead] = useState<'all' | 'unread' | 'read'>('all');

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await getAdminMessages({ limit: 1000 });
        setMessages(res.data || []);
      } catch (err: any) {
        setError('Erro ao carregar mensagens');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, []);

  const handleViewDetails = (message: Message) => {
    setSelectedMessage(message);
    setShowDetailModal(true);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const filteredMessages = messages.filter((msg) => {
    if (filterRead === 'unread') return !msg.is_read;
    if (filterRead === 'read') return msg.is_read;
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando mensagens...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Mensagens</h1>
        <p className="text-gray-600 mt-1">Gerenciar mensagens dos clientes</p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-gap-3">
          <AlertCircle className="text-red-600 flex-shrink-0" size={20} />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterRead('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filterRead === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Todas ({messages.length})
          </button>
          <button
            onClick={() => setFilterRead('unread')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filterRead === 'unread'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Não lidas ({messages.filter((m) => !m.is_read).length})
          </button>
          <button
            onClick={() => setFilterRead('read')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filterRead === 'read'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Lidas ({messages.filter((m) => m.is_read).length})
          </button>
        </div>
      </div>

      {/* Messages List */}
      <div className="space-y-3">
        {filteredMessages.length > 0 ? (
          filteredMessages.map((msg) => (
            <div
              key={msg.id}
              className={`bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow cursor-pointer ${
                !msg.is_read ? 'border-blue-200' : ''
              }`}
              onClick={() => handleViewDetails(msg)}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  <div className={`w-3 h-3 rounded-full flex-shrink-0 mt-2 ${
                    msg.is_read ? 'bg-gray-300' : 'bg-blue-600'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-gray-900">{msg.client_name}</h3>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        msg.is_read
                          ? 'bg-gray-100 text-gray-600'
                          : 'bg-blue-100 text-blue-600'
                      }`}>
                        {msg.is_read ? 'Lido' : 'Não lido'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">{msg.client_email}</p>
                    <p className="text-sm text-gray-700 mt-2 line-clamp-2">{msg.message}</p>
                    <p className="text-xs text-gray-500 mt-2">{formatDate(msg.created_at)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleViewDetails(msg);
                    }}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Reply size={18} />
                  </button>
                  <button className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
            <MessageSquare size={40} className="text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500">Nenhuma mensagem encontrada</p>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedMessage && (
        <Modal
          isOpen={showDetailModal}
          onClose={() => setShowDetailModal(false)}
          title={`Mensagem de ${selectedMessage.client_name}`}
          size="lg"
        >
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-1">De</h3>
              <p className="text-gray-900">{selectedMessage.client_name}</p>
              <p className="text-sm text-gray-600">{selectedMessage.client_email}</p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-1">Mensagem</h3>
              <p className="text-gray-700 whitespace-pre-wrap">{selectedMessage.message}</p>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-2 border-t">
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-1">Recebida em</h3>
                <p className="text-sm text-gray-600">{formatDate(selectedMessage.created_at)}</p>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-1">Status</h3>
                <p className="text-sm text-gray-600">
                  {selectedMessage.is_read ? 'Lida' : 'Não lida'}
                </p>
              </div>
            </div>
            <div className="flex gap-2 pt-4 border-t">
              <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2">
                <Reply size={18} />
                Responder
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
