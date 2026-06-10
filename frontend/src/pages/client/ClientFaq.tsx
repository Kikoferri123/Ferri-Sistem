import React, { useEffect, useState } from 'react';
import { getClientFaq } from '../../services/api';
import { useLanguage } from '../../i18n/LanguageContext';
import { HelpCircle, ChevronDown } from 'lucide-react';

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

export default function ClientFaq() {
  const { t } = useLanguage();
  const [faqs, setFaqs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<number | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getClientFaq();
        const data = res.data?.faqs || res.data || [];
        setFaqs(Array.isArray(data) ? data : []);
      } catch {}
      setLoading(false);
    };
    load();
  }, []);

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '256px', color: COLORS.textSecondary }}>{t('loading')}</div>;

  return (
    <div style={{ maxWidth: '512px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <HelpCircle size={24} style={{ color: COLORS.primary }} />
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: COLORS.textPrimary, fontFamily: "'Poppins', 'Inter', sans-serif" }}>{t('faqTitle')}</h1>
      </div>

      {faqs.length === 0 ? (
        <div style={{ background: 'white', borderRadius: '16px', padding: '32px', textAlign: 'center', border: '1px solid #EEEEEE' }}>
          <HelpCircle size={48} style={{ color: '#D0D0D0', margin: '0 auto 12px' }} />
          <p style={{ color: COLORS.textSecondary }}>{t('noFaq')}</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {faqs.map((faq: any, i: number) => {
            const isOpen = openId === (faq.id || i);
            return (
              <div key={faq.id || i} style={{ background: 'white', borderRadius: '16px', border: '1px solid #EEEEEE', overflow: 'hidden' }}>
                <button onClick={() => setOpenId(isOpen ? null : (faq.id || i))}
                  style={{ width: '100%', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', textAlign: 'left', background: 'white', border: 'none', cursor: 'pointer', transition: 'background 0.2s' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#F5F5F0')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'white')}>
                  <span style={{ fontWeight: 500, color: COLORS.textPrimary, paddingRight: '16px' }}>{faq.question}</span>
                  <ChevronDown size={18} style={{ color: COLORS.textSecondary, flexShrink: 0, transition: 'transform 0.2s', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} />
                </button>
                {isOpen && (
                  <div style={{ padding: '0 20px 16px', fontSize: '14px', color: COLORS.textSecondary, lineHeight: '1.6', borderTop: `1px solid #EEEEEE`, paddingTop: '12px' }}>
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
