import React, { useEffect, useState } from 'react';
import { getClientNews } from '../../services/api';
import { useLanguage } from '../../i18n/LanguageContext';
import { Newspaper } from 'lucide-react';

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

export default function ClientNews() {
  const { t } = useLanguage();
  const [news, setNews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getClientNews();
        const data = res.data?.news || res.data || [];
        setNews(Array.isArray(data) ? data : []);
      } catch {}
      setLoading(false);
    };
    load();
  }, []);

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '256px', color: COLORS.textSecondary }}>{t('loading')}</div>;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <Newspaper size={24} style={{ color: COLORS.primary }} />
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: COLORS.textPrimary, fontFamily: "'Poppins', 'Inter', sans-serif" }}>{t('newsTitle')}</h1>
      </div>

      {news.length === 0 ? (
        <div style={{ background: 'white', borderRadius: '16px', padding: '32px', textAlign: 'center', border: '1px solid #EEEEEE' }}>
          <Newspaper size={48} style={{ color: '#D0D0D0', margin: '0 auto 12px' }} />
          <p style={{ color: COLORS.textSecondary }}>{t('noNews')}</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {news.map((item: any, i: number) => (
            <div key={item.id || i} style={{ background: 'white', borderRadius: '16px', padding: '20px', border: '1px solid #EEEEEE' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 600, color: COLORS.textPrimary }}>{item.title}</h2>
              {item.created_at && <p style={{ fontSize: '12px', color: COLORS.textSecondary, marginTop: '8px' }}>{new Date(item.created_at).toLocaleDateString('pt-BR')}</p>}
              <p style={{ color: COLORS.textSecondary, marginTop: '12px', fontSize: '14px', lineHeight: '1.6' }}>{item.content || item.body}</p>
              {item.image_url && <img src={item.image_url} alt={item.title} style={{ marginTop: '12px', borderRadius: '8px', maxHeight: '192px', objectFit: 'cover', width: '100%' }} />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
