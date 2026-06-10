import React, { useEffect, useState } from 'react';
import { getClientRequests, createClientRequest } from '../../services/api';
import { Wrench, Plus, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
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

export default function ClientRequests() {
  const { t, lang } = useLanguage();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', category: 'maintenance', urgency: 'normal' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { loadRequests(); }, []);

  const loadRequests = async () => {
    try {
      const res = await getClientRequests();
      const data = res.data?.requests || res.data || [];
      setRequests(Array.isArray(data) ? data : []);
    } catch {}
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await createClientRequest(form);
      setShowForm(false);
      setForm({ title: '', description: '', category: 'maintenance', urgency: 'normal' });
      await loadRequests();
    } catch {}
    setSubmitting(false);
  };

  const statusBadge = (status: string) => {
    if (status === 'completed' || status === 'resolved') return <span style={{ padding: '6px 8px', fontSize: '12px', borderRadius: '20px', background: `rgba(${parseInt(COLORS.success.slice(1, 3), 16)}, ${parseInt(COLORS.success.slice(3, 5), 16)}, ${parseInt(COLORS.success.slice(5, 7), 16)}, 0.1)`, color: COLORS.success, display: 'flex', alignItems: 'center', gap: '4px' }}><CheckCircle size={12} />{t('statusResolved')}</span>;
    if (status === 'in_progress' || status === 'em_andamento') return <span style={{ padding: '6px 8px', fontSize: '12px', borderRadius: '20px', background: `rgba(${parseInt(COLORS.info.slice(1, 3), 16)}, ${parseInt(COLORS.info.slice(3, 5), 16)}, ${parseInt(COLORS.info.slice(5, 7), 16)}, 0.1)`, color: COLORS.info, display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={12} />{t('statusInProgress')}</span>;
    if (status === 'pending' || status === 'pendente') return <span style={{ padding: '6px 8px', fontSize: '12px', borderRadius: '20px', background: `rgba(${parseInt(COLORS.warning.slice(1, 3), 16)}, ${parseInt(COLORS.warning.slice(3, 5), 16)}, ${parseInt(COLORS.warning.slice(5, 7), 16)}, 0.1)`, color: COLORS.warning, display: 'flex', alignItems: 'center', gap: '4px' }}><AlertTriangle size={12} />{t('pending')}</span>;
    return <span style={{ padding: '6px 8px', fontSize: '12px', borderRadius: '20px', background: '#F0F0F0', color: COLORS.textSecondary }}>{status}</span>;
  };

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '256px', color: COLORS.textSecondary }}>{t('loading')}</div>;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Wrench size={24} style={{ color: COLORS.primary }} />
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: COLORS.textPrimary, fontFamily: "'Poppins', 'Inter', sans-serif" }}>{t('maintenanceRequests')}</h1>
        </div>
        <button onClick={() => setShowForm(true)} style={{ padding: '8px 16px', background: `linear-gradient(135deg, ${COLORS.primary} 0%, #2D7A62 100%)`, color: 'white', borderRadius: '8px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 500, transition: 'opacity 0.2s' }}>
          <Plus size={16} /> {t('newRequest')}
        </button>
      </div>

      {requests.length === 0 && !showForm ? (
        <div style={{ background: 'white', borderRadius: '16px', padding: '32px', textAlign: 'center', border: '1px solid #EEEEEE' }}>
          <Wrench size={48} style={{ color: '#D0D0D0', margin: '0 auto 12px' }} />
          <p style={{ color: COLORS.textSecondary }}>{t('noRequests')}</p>
          <button onClick={() => setShowForm(true)} style={{ marginTop: '12px', padding: '8px 16px', background: `linear-gradient(135deg, ${COLORS.primary} 0%, #2D7A62 100%)`, color: 'white', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: 500 }}>
            {lang === 'pt' ? 'Criar Primeiro Pedido' : 'Create First Request'}
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {requests.map((r: any, i: number) => (
            <div key={r.id || i} style={{ background: 'white', borderRadius: '16px', padding: '20px', border: '1px solid #EEEEEE' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <p style={{ fontWeight: 600, color: COLORS.textPrimary }}>{r.title || r.subject || `Pedido #${r.id}`}</p>
                  {r.description && <p style={{ fontSize: '14px', color: COLORS.textSecondary, marginTop: '8px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{r.description}</p>}
                  <div style={{ display: 'flex', gap: '12px', marginTop: '8px', fontSize: '12px', color: '#999' }}>
                    {r.category && <span style={{ textTransform: 'capitalize' }}>{r.category}</span>}
                    {r.created_at && <span>{new Date(r.created_at).toLocaleDateString('pt-BR')}</span>}
                  </div>
                </div>
                {statusBadge(r.status)}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New request form */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '16px' }}>
          <div style={{ background: 'white', borderRadius: '16px', maxWidth: '32rem', width: '100%', padding: '24px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px', color: COLORS.textPrimary }}>{t('newRequest')}</h2>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '8px', color: COLORS.textPrimary }}>{t('requestTitle')}</label>
                <input type="text" value={form.title} onChange={e => setForm({...form, title: e.target.value})}
                  style={{ width: '100%', padding: '8px 12px', border: `1px solid #EEEEEE`, borderRadius: '8px', fontSize: '14px', fontFamily: 'inherit' }} required placeholder={lang === 'pt' ? 'Ex: Torneira com vazamento' : 'E.g.: Leaking faucet'} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '8px', color: COLORS.textPrimary }}>{t('requestDescription')}</label>
                <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})}
                  style={{ width: '100%', padding: '8px 12px', border: `1px solid #EEEEEE`, borderRadius: '8px', fontSize: '14px', height: '96px', resize: 'none', fontFamily: 'inherit' }} required placeholder={lang === 'pt' ? 'Descreva o problema...' : 'Describe the issue...'} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '8px', color: COLORS.textPrimary }}>{lang === 'pt' ? 'Categoria' : 'Category'}</label>
                  <select value={form.category} onChange={e => setForm({...form, category: e.target.value})}
                    style={{ width: '100%', padding: '8px 12px', border: `1px solid #EEEEEE`, borderRadius: '8px', fontSize: '14px', fontFamily: 'inherit' }}>
                    <option value="maintenance">{lang === 'pt' ? 'Manutencao' : 'Maintenance'}</option>
                    <option value="cleaning">{lang === 'pt' ? 'Limpeza' : 'Cleaning'}</option>
                    <option value="plumbing">{lang === 'pt' ? 'Canalizar' : 'Plumbing'}</option>
                    <option value="electrical">{lang === 'pt' ? 'Eletricidade' : 'Electrical'}</option>
                    <option value="other">{lang === 'pt' ? 'Outro' : 'Other'}</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '8px', color: COLORS.textPrimary }}>{lang === 'pt' ? 'Urgencia' : 'Urgency'}</label>
                  <select value={form.urgency} onChange={e => setForm({...form, urgency: e.target.value})}
                    style={{ width: '100%', padding: '8px 12px', border: `1px solid #EEEEEE`, borderRadius: '8px', fontSize: '14px', fontFamily: 'inherit' }}>
                    <option value="low">{lang === 'pt' ? 'Baixa' : 'Low'}</option>
                    <option value="normal">{lang === 'pt' ? 'Normal' : 'Normal'}</option>
                    <option value="high">{lang === 'pt' ? 'Alta' : 'High'}</option>
                    <option value="urgent">{lang === 'pt' ? 'Urgente' : 'Urgent'}</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px', paddingTop: '8px' }}>
                <button type="submit" disabled={submitting}
                  style={{ flex: 1, padding: '8px 16px', background: `linear-gradient(135deg, ${COLORS.primary} 0%, #2D7A62 100%)`, color: 'white', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 500, opacity: submitting ? 0.5 : 1, transition: 'opacity 0.2s' }}>
                  {submitting ? `${t('send')}...` : t('submitRequest')}
                </button>
                <button type="button" onClick={() => setShowForm(false)}
                  style={{ flex: 1, padding: '8px 16px', background: '#F5F5F0', color: COLORS.textPrimary, borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 500, transition: 'background 0.2s' }}>{t('cancel')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
