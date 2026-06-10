import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../i18n/LanguageContext';

const bottomNavItems = [
  { path: '/cliente', labelKey: 'home', iconDefault: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6', iconFilled: 'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z' },
  { path: '/cliente/contratos', labelKey: 'contracts', iconDefault: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
  { path: '/cliente/pedidos', labelKey: 'requests', iconDefault: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z', isBuild: true },
  { path: '/cliente/pagamentos', labelKey: 'payments', iconDefault: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01' },
  { path: '/cliente/perfil', labelKey: 'profile', iconDefault: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
];

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const { t, lang, setLang } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path: string) => location.pathname === path;

  return (
    <div style={{ minHeight: '100vh', background: '#F5F5F0', fontFamily: "'Inter', sans-serif", paddingBottom: 72 }}>
      {/* Top App Bar */}
      <header style={{ background: 'white', padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #EEEEEE', position: 'sticky', top: 0, zIndex: 50 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: '#1B4D3E', margin: 0, fontFamily: "'Poppins', 'Inter', sans-serif" }}>{t('appTitle')}</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Language Switcher */}
          <div style={{ display: 'flex', gap: 4, backgroundColor: '#F5F5F5', padding: '4px 6px', borderRadius: '16px' }}>
            <button
              onClick={() => setLang('pt')}
              style={{
                background: lang === 'pt' ? '#1B4D3E' : 'transparent',
                color: lang === 'pt' ? 'white' : '#757575',
                border: 'none',
                cursor: 'pointer',
                padding: '4px 10px',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: 600,
                transition: 'all 0.2s ease',
              }}
            >
              PT
            </button>
            <button
              onClick={() => setLang('en')}
              style={{
                background: lang === 'en' ? '#1B4D3E' : 'transparent',
                color: lang === 'en' ? 'white' : '#757575',
                border: 'none',
                cursor: 'pointer',
                padding: '4px 10px',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: 600,
                transition: 'all 0.2s ease',
              }}
            >
              EN
            </button>
          </div>
          {/* Notifications bell */}
          <button onClick={() => navigate('/cliente/mensagens')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#424242', padding: 4 }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>
          </button>
          {/* Logout */}
          <button onClick={logout} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#757575', padding: 4 }} title={t('logout')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16,17 21,12 16,7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          </button>
        </div>
      </header>

      {/* Main content */}
      <main style={{ padding: 20, maxWidth: 800, margin: '0 auto' }}>
        {children}
      </main>

      {/* Bottom Navigation Bar */}
      <nav style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, background: 'white',
        borderTop: '1px solid #EEEEEE', display: 'flex', justifyContent: 'space-around',
        padding: '8px 0 12px', zIndex: 50,
        boxShadow: '0 -2px 10px rgba(0,0,0,0.05)'
      }}>
        {bottomNavItems.map(item => {
          const active = isActive(item.path);
          return (
            <Link key={item.path} to={item.path} style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, minWidth: 56 }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill={active ? '#1B4D3E' : 'none'} stroke={active ? '#1B4D3E' : '#757575'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d={item.iconDefault} />
              </svg>
              <span style={{ fontSize: 11, fontWeight: active ? 600 : 400, color: active ? '#1B4D3E' : '#757575' }}>{t(item.labelKey as any)}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
