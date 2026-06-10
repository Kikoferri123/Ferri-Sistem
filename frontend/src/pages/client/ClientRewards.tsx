import React, { useEffect, useState } from 'react';
import { getClientRewards } from '../../services/api';
import { useLanguage } from '../../i18n/LanguageContext';
import { Award, Star, Gift } from 'lucide-react';

const COLORS = {
  primary: '#1B4D3E',
  accent: '#E8B931',
  success: '#388E3C',
  error: '#D32F2F',
  warning: '#F57C00',
  info: '#1976D2',
  textPrimary: '#212121',
  textSecondary: '#757575',
};

export default function ClientRewards() {
  const { t } = useLanguage();
  const [rewards, setRewards] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getClientRewards();
        setRewards(res.data);
      } catch {}
      setLoading(false);
    };
    load();
  }, []);

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '256px', color: COLORS.textSecondary }}>{t('loading')}</div>;

  const points = rewards?.points || rewards?.total_points || 0;
  const transactions = rewards?.transactions || rewards?.history || [];

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <Award size={24} style={{ color: COLORS.primary }} />
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: COLORS.textPrimary, fontFamily: "'Poppins', 'Inter', sans-serif" }}>{t('rewardsTitle')}</h1>
      </div>

      {/* Points card */}
      <div style={{ background: `linear-gradient(135deg, ${COLORS.accent} 0%, #D4A028 100%)`, borderRadius: '16px', padding: '24px', color: 'white', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Star size={32} />
          <div>
            <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '14px' }}>{t('yourPoints')}</p>
            <p style={{ fontSize: '28px', fontWeight: 700 }}>{points}</p>
          </div>
        </div>
      </div>

      {/* History */}
      {Array.isArray(transactions) && transactions.length > 0 ? (
        <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #EEEEEE', overflow: 'hidden' }}>
          <div style={{ padding: '16px', borderBottom: '1px solid #EEEEEE' }}><h2 style={{ fontWeight: 600, color: COLORS.textPrimary }}>{t('history')}</h2></div>
          <div>
            {transactions.map((t: any, i: number) => (
              <div key={t.id || i} style={{ padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: i < transactions.length - 1 ? '1px solid #EEEEEE' : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ padding: '6px', borderRadius: '8px', background: t.points > 0 ? `rgba(${parseInt(COLORS.success.slice(1, 3), 16)}, ${parseInt(COLORS.success.slice(3, 5), 16)}, ${parseInt(COLORS.success.slice(5, 7), 16)}, 0.1)` : `rgba(${parseInt(COLORS.error.slice(1, 3), 16)}, ${parseInt(COLORS.error.slice(3, 5), 16)}, ${parseInt(COLORS.error.slice(5, 7), 16)}, 0.1)`, color: t.points > 0 ? COLORS.success : COLORS.error }}>
                    <Gift size={16} />
                  </div>
                  <div>
                    <p style={{ fontSize: '14px', fontWeight: 500, color: COLORS.textPrimary }}>{t.description || t.reason || t('transaction')}</p>
                    {t.created_at && <p style={{ fontSize: '12px', color: COLORS.textSecondary }}>{new Date(t.created_at).toLocaleDateString('pt-BR')}</p>}
                  </div>
                </div>
                <span style={{ fontWeight: 700, color: t.points > 0 ? COLORS.success : COLORS.error }}>
                  {t.points > 0 ? '+' : ''}{t.points}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div style={{ background: 'white', borderRadius: '16px', padding: '32px', textAlign: 'center', border: '1px solid #EEEEEE' }}>
          <Gift size={48} style={{ color: '#D0D0D0', margin: '0 auto 12px' }} />
          <p style={{ color: COLORS.textSecondary }}>{t('noTransactions')}</p>
        </div>
      )}
    </div>
  );
}
