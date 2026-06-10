import React, { useEffect, useState } from 'react';
import { getClientMessages, sendClientMessage, markClientMessageRead } from '../../services/api';
import { MessageSquare, Send, Check, CheckCheck } from 'lucide-react';
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

export default function ClientMessages() {
  const { t, lang } = useLanguage();
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMsg, setNewMsg] = useState({ subject: '', message: '' });
  const [sending, setSending] = useState(false);
  const [showCompose, setShowCompose] = useState(false);

  useEffect(() => { loadMessages(); }, []);

  const loadMessages = async () => {
    try {
      const res = await getClientMessages();
      const data = res.data?.messages || res.data || [];
      setMessages(Array.isArray(data) ? data : []);
    } catch {}
    setLoading(false);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    try {
      await sendClientMessage(newMsg);
      setNewMsg({ subject: '', message: '' });
      setShowCompose(false);
      await loadMessages();
    } catch {}
    setSending(false);
  };

  const handleMarkRead = async (id: number) => {
    try {
      await markClientMessageRead(id);
      setMessages(prev => prev.map(m => m.id === id ? { ...m, read: true } : m));
    } catch {}
  };

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '256px', color: COLORS.textSecondary }}>{t('loading')}</div>;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <MessageSquare size={24} style={{ color: COLORS.primary }} />
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: COLORS.textPrimary, fontFamily: "'Poppins', 'Inter', sans-serif" }}>{t('messagesTitle')}</h1>
        </div>
        <button onClick={() => setShowCompose(true)} style={{ padding: '8px 16px', background: `linear-gradient(135deg, ${COLORS.primary} 0%, #2D7A62 100%)`, color: 'white', borderRadius: '8px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 500, transition: 'opacity 0.2s' }}>
          <Send size={16} /> {lang === 'pt' ? 'Nova Mensagem' : 'New Message'}
        </button>
      </div>

      {messages.length === 0 && !showCompose ? (
        <div style={{ background: 'white', borderRadius: '16px', padding: '32px', textAlign: 'center', border: '1px solid #EEEEEE' }}>
          <MessageSquare size={48} style={{ color: '#D0D0D0', margin: '0 auto 12px' }} />
          <p style={{ color: COLORS.textSecondary }}>{t('noMessages')}</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {messages.map((m: any, i: number) => (
            <div key={m.id || i}
              onClick={() => !m.read && m.id && handleMarkRead(m.id)}
              style={{ background: 'white', borderRadius: '16px', padding: '16px', border: m.read ? '1px solid #EEEEEE' : `1px solid ${COLORS.primary}`, cursor: 'pointer', transition: 'box-shadow 0.2s', boxShadow: 'none' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <p style={{ fontWeight: m.read ? 500 : 600, color: COLORS.textPrimary }}>
                      {m.subject || m.title || 'Mensagem'}
                    </p>
                    {m.read ? <CheckCheck size={14} style={{ color: COLORS.primary }} /> : <Check size={14} style={{ color: COLORS.textSecondary }} />}
                  </div>
                  <p style={{ fontSize: '14px', color: COLORS.textSecondary, marginTop: '8px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{m.message || m.body || m.content || ''}</p>
                  <div style={{ display: 'flex', gap: '12px', marginTop: '8px', fontSize: '12px', color: '#999' }}>
                    {m.from_name && <span>De: {m.from_name}</span>}
                    {m.created_at && <span>{new Date(m.created_at).toLocaleDateString('pt-BR')}</span>}
                  </div>
                </div>
              </div>
              {m.reply && (
                <div style={{ marginTop: '12px', padding: '12px', background: '#F5F5F0', borderRadius: '8px', fontSize: '14px', color: COLORS.textSecondary, borderLeft: `3px solid ${COLORS.primary}` }}>
                  <p style={{ fontSize: '12px', color: COLORS.primary, fontWeight: 500, marginBottom: '8px' }}>{lang === 'pt' ? 'Resposta da gestao:' : 'Management reply:'}</p>
                  {m.reply}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Compose modal */}
      {showCompose && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '16px' }}>
          <div style={{ background: 'white', borderRadius: '16px', maxWidth: '32rem', width: '100%', padding: '24px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px', color: COLORS.textPrimary }}>{lang === 'pt' ? 'Nova Mensagem' : 'New Message'}</h2>
            <form onSubmit={handleSend} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '8px', color: COLORS.textPrimary }}>{lang === 'pt' ? 'Assunto' : 'Subject'}</label>
                <input type="text" value={newMsg.subject} onChange={e => setNewMsg({...newMsg, subject: e.target.value})}
                  style={{ width: '100%', padding: '8px 12px', border: `1px solid #EEEEEE`, borderRadius: '8px', fontSize: '14px', fontFamily: 'inherit' }} required placeholder={lang === 'pt' ? 'Assunto da mensagem' : 'Message subject'} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '8px', color: COLORS.textPrimary }}>{lang === 'pt' ? 'Mensagem' : 'Message'}</label>
                <textarea value={newMsg.message} onChange={e => setNewMsg({...newMsg, message: e.target.value})}
                  style={{ width: '100%', padding: '8px 12px', border: `1px solid #EEEEEE`, borderRadius: '8px', fontSize: '14px', height: '128px', resize: 'none', fontFamily: 'inherit' }} required placeholder={t('typeMessage')} />
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="submit" disabled={sending}
                  style={{ flex: 1, padding: '8px 16px', background: `linear-gradient(135deg, ${COLORS.primary} 0%, #2D7A62 100%)`, color: 'white', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', opacity: sending ? 0.5 : 1, transition: 'opacity 0.2s' }}>
                  <Send size={16} />{sending ? `${t('send')}...` : t('send')}
                </button>
                <button type="button" onClick={() => setShowCompose(false)}
                  style={{ flex: 1, padding: '8px 16px', background: '#F5F5F0', color: COLORS.textPrimary, borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 500, transition: 'background 0.2s' }}>{t('cancel')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
