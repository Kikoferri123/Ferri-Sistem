import React, { useEffect, useState } from 'react';
import { getClientContracts, getClientContract, signClientContract } from '../../services/api';
import { FileSignature, Eye, CheckCircle, Clock, XCircle } from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';

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

export default function ClientContracts() {
  const { t, lang } = useLanguage();
  const [contracts, setContracts] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [signing, setSigning] = useState(false);

  useEffect(() => {
    loadContracts();
  }, []);

  const loadContracts = async () => {
    try {
      const res = await getClientContracts();
      const data = res.data?.contracts || res.data || [];
      setContracts(Array.isArray(data) ? data : []);
    } catch {}
    setLoading(false);
  };

  const viewContract = async (id: number) => {
    try {
      const res = await getClientContract(id);
      setSelected(res.data);
    } catch {}
  };

  const handleSign = async (id: number) => {
    setSigning(true);
    try {
      await signClientContract(id, { signed: true });
      await loadContracts();
      setSelected(null);
    } catch {}
    setSigning(false);
  };

  const statusBadge = (status: string, signed: boolean) => {
    if (signed) return <span style={{ padding: '6px 8px', fontSize: '12px', borderRadius: '20px', background: `rgba(${parseInt(COLORS.success.slice(1, 3), 16)}, ${parseInt(COLORS.success.slice(3, 5), 16)}, ${parseInt(COLORS.success.slice(5, 7), 16)}, 0.1)`, color: COLORS.success, display: 'flex', alignItems: 'center', gap: '4px' }}><CheckCircle size={12} />{lang === 'pt' ? 'Assinado' : 'Signed'}</span>;
    if (status === 'active') return <span style={{ padding: '6px 8px', fontSize: '12px', borderRadius: '20px', background: `rgba(${parseInt(COLORS.info.slice(1, 3), 16)}, ${parseInt(COLORS.info.slice(3, 5), 16)}, ${parseInt(COLORS.info.slice(5, 7), 16)}, 0.1)`, color: COLORS.info, display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={12} />{t('active')}</span>;
    if (status === 'expired') return <span style={{ padding: '6px 8px', fontSize: '12px', borderRadius: '20px', background: '#F0F0F0', color: COLORS.textSecondary, display: 'flex', alignItems: 'center', gap: '4px' }}><XCircle size={12} />{t('expired')}</span>;
    return <span style={{ padding: '6px 8px', fontSize: '12px', borderRadius: '20px', background: `rgba(${parseInt(COLORS.warning.slice(1, 3), 16)}, ${parseInt(COLORS.warning.slice(3, 5), 16)}, ${parseInt(COLORS.warning.slice(5, 7), 16)}, 0.1)`, color: COLORS.warning }}>{status}</span>;
  };

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '256px', color: COLORS.textSecondary }}>{t('loading')}</div>;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <FileSignature size={24} style={{ color: COLORS.primary }} />
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: COLORS.textPrimary, fontFamily: "'Poppins', 'Inter', sans-serif" }}>{t('myContracts')}</h1>
      </div>

      {contracts.length === 0 ? (
        <div style={{ background: 'white', borderRadius: '16px', padding: '32px', textAlign: 'center', border: '1px solid #EEEEEE' }}>
          <FileSignature size={48} style={{ color: '#D0D0D0', margin: '0 auto 12px' }} />
          <p style={{ color: COLORS.textSecondary }}>{t('noContracts')}</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {contracts.map((c: any) => (
            <div key={c.id} style={{ background: 'white', borderRadius: '16px', padding: '20px', border: '1px solid #EEEEEE' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <p style={{ fontWeight: 600, color: COLORS.textPrimary }}>{c.type || (lang === 'pt' ? 'Contrato' : 'Contract')} #{c.id}</p>
                  {c.property_name && <p style={{ fontSize: '14px', color: COLORS.textSecondary }}>{c.property_name}</p>}
                  <div style={{ display: 'flex', gap: '16px', marginTop: '8px', fontSize: '14px', color: COLORS.textSecondary }}>
                    {c.start_date && <span>{t('startDate')}: {new Date(c.start_date).toLocaleDateString('pt-BR')}</span>}
                    {c.end_date && <span>{t('endDate')}: {new Date(c.end_date).toLocaleDateString('pt-BR')}</span>}
                    {c.value && <span style={{ fontWeight: 500, color: COLORS.textPrimary }}>EUR {Number(c.value).toFixed(2)}</span>}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {statusBadge(c.status, c.signed)}
                  <button onClick={() => viewContract(c.id)} style={{ padding: '6px 12px', background: `rgba(${parseInt(COLORS.primary.slice(1, 3), 16)}, ${parseInt(COLORS.primary.slice(3, 5), 16)}, ${parseInt(COLORS.primary.slice(5, 7), 16)}, 0.1)`, color: COLORS.primary, borderRadius: '8px', fontSize: '14px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', transition: 'background 0.2s' }}>
                    <Eye size={14} /> {lang === 'pt' ? 'Ver' : 'View'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail modal */}
      {selected && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '16px' }}>
          <div style={{ background: 'white', borderRadius: '16px', maxWidth: '32rem', width: '100%', maxHeight: '80vh', overflowY: 'auto', padding: '24px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px', color: COLORS.textPrimary }}>{lang === 'pt' ? 'Contrato' : 'Contract'} #{selected.id}</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: COLORS.textSecondary }}>{lang === 'pt' ? 'Tipo' : 'Type'}</span><span style={{ color: COLORS.textPrimary }}>{selected.type}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: COLORS.textSecondary }}>{lang === 'pt' ? 'Propriedade' : 'Property'}</span><span style={{ color: COLORS.textPrimary }}>{selected.property_name}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: COLORS.textSecondary }}>{t('startDate')}</span><span style={{ color: COLORS.textPrimary }}>{selected.start_date ? new Date(selected.start_date).toLocaleDateString('pt-BR') : '-'}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: COLORS.textSecondary }}>{t('endDate')}</span><span style={{ color: COLORS.textPrimary }}>{selected.end_date ? new Date(selected.end_date).toLocaleDateString('pt-BR') : '-'}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: COLORS.textSecondary }}>{t('amount')}</span><span style={{ fontWeight: 500, color: COLORS.textPrimary }}>EUR {Number(selected.value || 0).toFixed(2)}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: COLORS.textSecondary }}>Status</span>{statusBadge(selected.status, selected.signed)}</div>
              {selected.notes && <div style={{ padding: '12px', background: '#F5F5F0', borderRadius: '8px', color: COLORS.textSecondary }}>{selected.notes}</div>}
            </div>
            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              {!selected.signed && (
                <button onClick={() => handleSign(selected.id)} disabled={signing}
                  style={{ flex: 1, padding: '8px 16px', background: `linear-gradient(135deg, ${COLORS.primary} 0%, #2D7A62 100%)`, color: 'white', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 500, opacity: signing ? 0.5 : 1, transition: 'opacity 0.2s' }}>
                  {signing ? `${lang === 'pt' ? 'Assinando' : 'Signing'}...` : (lang === 'pt' ? 'Assinar Contrato' : 'Sign Contract')}
                </button>
              )}
              <button onClick={() => setSelected(null)} style={{ flex: 1, padding: '8px 16px', background: '#F5F5F0', color: COLORS.textPrimary, borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 500, transition: 'background 0.2s' }}>{t('close')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
