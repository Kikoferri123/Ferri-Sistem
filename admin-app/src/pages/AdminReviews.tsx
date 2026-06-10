import React, { useState, useEffect } from 'react';
import { Star, AlertCircle, MessageSquare, Trash2 } from 'lucide-react';
import { getAdminReviews } from '../services/api';
import Modal from '../components/Modal';

interface Review {
  id: number;
  client_name: string;
  rating: number;
  comment: string;
  created_at: string;
  response?: string;
  responded_at?: string;
}

export default function AdminReviews() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await getAdminReviews({ limit: 1000 });
        setReviews(res.data || []);
      } catch (err: any) {
        setError('Erro ao carregar avaliações');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, []);

  const handleViewDetails = (review: Review) => {
    setSelectedReview(review);
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

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            size={16}
            className={i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
          />
        ))}
      </div>
    );
  };

  const averageRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando avaliações...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Avaliações</h1>
        <p className="text-gray-600 mt-1">Gerenciar avaliações dos clientes</p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-gap-3">
          <AlertCircle className="text-red-600 flex-shrink-0" size={20} />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Total de Avaliações</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{reviews.length}</p>
            </div>
            <div className="bg-yellow-50 p-3 rounded-lg">
              <Star className="text-yellow-600" size={24} />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Avaliação Média</p>
              <div className="mt-2">{renderStars(Math.round(Number(averageRating)))}</div>
              <p className="text-sm text-gray-600 mt-1">{averageRating} de 5</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Respondidas</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {reviews.filter((r) => r.response).length}
              </p>
            </div>
            <div className="bg-blue-50 p-3 rounded-lg">
              <MessageSquare className="text-blue-600" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-3">
        {reviews.length > 0 ? (
          reviews.map((review) => (
            <div
              key={review.id}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => handleViewDetails(review)}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-bold text-gray-900">{review.client_name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    {renderStars(review.rating)}
                    <span className="text-sm text-gray-600">({review.rating}/5)</span>
                  </div>
                </div>
                {review.response && (
                  <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-medium">
                    <MessageSquare size={14} />
                    Respondida
                  </span>
                )}
              </div>
              <p className="text-gray-700 text-sm line-clamp-2">{review.comment}</p>
              <p className="text-xs text-gray-500 mt-3">{formatDate(review.created_at)}</p>
            </div>
          ))
        ) : (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
            <Star size={40} className="text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500">Nenhuma avaliação encontrada</p>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedReview && (
        <Modal
          isOpen={showDetailModal}
          onClose={() => setShowDetailModal(false)}
          title={`Avaliação de ${selectedReview.client_name}`}
          size="lg"
        >
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Avaliação</h3>
              {renderStars(selectedReview.rating)}
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Comentário</h3>
              <p className="text-gray-700 whitespace-pre-wrap">{selectedReview.comment}</p>
            </div>
            {selectedReview.response && (
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                <h3 className="text-sm font-semibold text-blue-900 mb-2">Sua Resposta</h3>
                <p className="text-sm text-blue-800">{selectedReview.response}</p>
                <p className="text-xs text-blue-600 mt-2">
                  Respondida em {formatDate(selectedReview.responded_at || '')}
                </p>
              </div>
            )}
            <div className="flex gap-2 pt-4 border-t">
              {!selectedReview.response && (
                <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors">
                  Responder
                </button>
              )}
              <button className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
                Fechar
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
