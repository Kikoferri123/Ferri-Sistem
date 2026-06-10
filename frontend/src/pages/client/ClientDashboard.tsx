import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getClientProperty, getClientAlerts } from '../../services/api';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../i18n/LanguageContext';

const quickActions = [
  { label: 'Contratos', labelKey: 'actionContracts', path: '/cliente/contratos', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
  { label: 'Pedidos', labelKey: 'actionRequests', path: '/cliente/pedidos', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573-1.066c-.426 1.756-2.924 1.756-3.35 0' },
  { label: 'Pagamentos', labelKey: 'actionPayments', path: '/cliente/pagamentos', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
  { label: 'Mensagens', labelKey: 'actionMessages', path: '/cliente/mensagens', icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
  { label: 'Noticias', labelKey: 'actionNews', path: '/cliente/noticias', icon: 'M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2' },
  { label: 'Recompensas', labelKey: 'actionRewards', path: '/cliente/recompensas', icon: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z' },
  { label: 'Check-in', labelKey: 'Check-in', path: '/cliente/contratos', icon: 'M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1' },
  { label: 'Avaliacoes', labelKey: 'Avaliacoes', path: '/cliente/faq', icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z' },
  { label: 'FAQ', labelKey: 'actionFaq', path: '/cliente/faq', icon: 'M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
  { label: 'Indicacoes', labelKey: 'Indicacoes', path: '/cliente/perfil', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
  { label: 'Documentos', labelKey: 'actionDocuments', path: '/cliente/documentos', icon: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z' },
  { label: 'Propriedade', labelKey: 'actionProperty', path: '/cliente/propriedade', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
];

export default function ClientDashboard() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [property, setProperty] = useState<any>(null);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try { const res = await getClientProperty(); setProperty(res.data); } catch {}
      try { const res = await getClientAlerts(); const d = res.data?.alerts || res.data || []; setAlerts(Array.isArray(d) ? d.slice(0, 3) : []); } catch {}
      setLoading(false);
    };
    load();
  }, []);

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 60, color: '#757575' }}>{t('loading')}</div>;

  return (
    <div>
      {/* Welcome */}
      <h1 style={{ fontSize: 24, fontWeight: 700, color: '#212121', margin: '0 0 20px', fontFamily: "'Poppins', 'Inter', sans-serif" }}>{t('welcomeUser')}</h1>

      {/* Property Card */}
      {property && (
        <div onClick={() => navigate('/cliente/propriedade')}
          style={{ background: 'linear-gradient(135deg, #1B4D3E 0%, rgba(27,77,62,0.8) 100%)', borderRadius: 16, padding: 20, color: 'white', marginBottom: 24, cursor: 'pointer' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="white" stroke="white" strokeWidth="1.5"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/></svg>
            <div>
              <p style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>{property.name || property.property_name}</p>
              {property.address && <p style={{ fontSize: 13, margin: '4px 0 0', opacity: 0.85 }}>{property.address}</p>}
              {property.monthly_rent && <p style={{ fontSize: 13, margin: '4px 0 0', opacity: 0.85 }}>{t('monthlyRent')}: EUR {Number(property.monthly_rent).toFixed(2)}/mes</p>}
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <h2 style={{ fontSize: 18, fontWeight: 600, color: '#212121', margin: '0 0 14px', fontFamily: "'Poppins', 'Inter', sans-serif" }}>{t('quickActions')}</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
        {quickActions.map(action => (
          <div key={action.label} onClick={() => navigate(action.path)}
            style={{ background: 'white', borderRadius: 14, padding: '16px 8px', textAlign: 'center', cursor: 'pointer', border: '1px solid #EEEEEE', transition: 'box-shadow 0.2s' }}
            onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)')}
            onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: '#F0F7F4', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1B4D3E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={action.icon} /></svg>
            </div>
            <p style={{ fontSize: 12, color: '#424242', margin: 0, fontWeight: 500 }}>{action.labelKey ? t(action.labelKey as any) : action.label}</p>
          </div>
        ))}
      </div>

      {/* Recent Alerts */}
      {alerts.length > 0 && (
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: '#212121', margin: '0 0 14px', fontFamily: "'Poppins', 'Inter', sans-serif" }}>{t('recentAlerts')}</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {alerts.map((alert: any, i: number) => (
              <div key={alert.id || i} style={{ background: 'white', borderRadius: 12, padding: 16, border: '1px solid #EEEEEE', display: 'flex', alignItems: 'start', gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: alert.severity === 'high' ? '#FFEBEE' : alert.severity === 'medium' ? '#FFF3E0' : '#E3F2FD', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={alert.severity === 'high' ? '#D32F2F' : alert.severity === 'medium' ? '#F57C00' : '#1976D2'} strokeWidth="2">
                    <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                  </svg>
                </div>
                <div>
                  {alert.type && <p style={{ fontSize: 13, fontWeight: 600, color: '#424242', margin: '0 0 2px', textTransform: 'capitalize' }}>{alert.type}</p>}
                  <p style={{ fontSize: 13, color: '#757575', margin: 0 }}>{alert.message}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
