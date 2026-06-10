import React, { useState, useEffect } from 'react';
import {
  Users,
  MessageSquare,
  Star,
  UserPlus,
  Newspaper,
  Award,
  TrendingUp,
  AlertCircle,
} from 'lucide-react';
import {
  getClients,
  getAdminMessages,
  getAdminReviews,
  getAdminReferrals,
  getAdminNews,
  getAdminRewards,
} from '../services/api';

interface StatCard {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}

interface Message {
  id: number;
  client_name: string;
  message: string;
  created_at: string;
  is_read: boolean;
}

export default function Dashboard() {
  const [stats, setStats] = useState<StatCard[]>([]);
  const [recentMessages, setRecentMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');

        const [clientsRes, messagesRes, reviewsRes, referralsRes, newsRes, rewardsRes] = await Promise.all([
          getClients({ limit: 1000 }),
          getAdminMessages({ limit: 1000 }),
          getAdminReviews({ limit: 1000 }),
          getAdminReferrals({ limit: 1000 }),
          getAdminNews({ limit: 1000 }),
          getAdminRewards({ limit: 1000 }),
        ]);

        const clientCount = clientsRes.data?.length || 0;
        const unreadMessages = messagesRes.data?.filter((m: any) => !m.is_read)?.length || 0;
        const recentReviews = reviewsRes.data?.length || 0;
        const pendingReferrals = referralsRes.data?.filter((r: any) => r.status === 'pending')?.length || 0;
        const publishedNews = newsRes.data?.filter((n: any) => n.is_published)?.length || 0;
        const totalPoints = rewardsRes.data?.reduce((sum: number, r: any) => sum + (r.points || 0), 0) || 0;

        setStats([
          {
            label: 'Total Clientes',
            value: clientCount,
            icon: <Users size={24} />,
            color: 'text-blue-600',
            bgColor: 'bg-blue-50',
          },
          {
            label: 'Mensagens Não Lidas',
            value: unreadMessages,
            icon: <MessageSquare size={24} />,
            color: 'text-green-600',
            bgColor: 'bg-green-50',
          },
          {
            label: 'Avaliações Recentes',
            value: recentReviews,
            icon: <Star size={24} />,
            color: 'text-yellow-600',
            bgColor: 'bg-yellow-50',
          },
          {
            label: 'Indicações Pendentes',
            value: pendingReferrals,
            icon: <UserPlus size={24} />,
            color: 'text-purple-600',
            bgColor: 'bg-purple-50',
          },
          {
            label: 'Notícias Publicadas',
            value: publishedNews,
            icon: <Newspaper size={24} />,
            color: 'text-orange-600',
            bgColor: 'bg-orange-50',
          },
          {
            label: 'Pontos Distribuídos',
            value: totalPoints,
            icon: <Award size={24} />,
            color: 'text-red-600',
            bgColor: 'bg-red-50',
          },
        ]);

        setRecentMessages(messagesRes.data?.slice(0, 5) || []);
      } catch (err: any) {
        setError('Erro ao carregar dados do dashboard');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Bem-vindo ao painel administrativo</p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-gap-3">
          <AlertCircle className="text-red-600 flex-shrink-0" size={20} />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((stat, idx) => (
          <div
            key={idx}
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">{stat.label}</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
              </div>
              <div className={`${stat.bgColor} p-3 rounded-lg`}>
                <div className={stat.color}>{stat.icon}</div>
              </div>
            </div>
            <div className="flex items-center gap-1 mt-4 text-xs text-gray-500">
              <TrendingUp size={14} />
              <span>Atualizado agora</span>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Atividade Recente</h2>
        {recentMessages.length > 0 ? (
          <div className="space-y-3">
            {recentMessages.map((message) => (
              <div
                key={message.id}
                className="flex items-start gap-4 pb-3 border-b border-gray-100 last:border-0 last:pb-0"
              >
                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
                  <MessageSquare size={18} className="text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-gray-900">{message.client_name}</p>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      message.is_read
                        ? 'bg-gray-100 text-gray-600'
                        : 'bg-blue-100 text-blue-600'
                    }`}>
                      {message.is_read ? 'Lido' : 'Não lido'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1 truncate">{message.message}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(message.created_at).toLocaleDateString('pt-BR', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <MessageSquare size={40} className="text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500">Nenhuma mensagem recente</p>
          </div>
        )}
      </div>
    </div>
  );
}
