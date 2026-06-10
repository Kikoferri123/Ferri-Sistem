import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { useLanguage } from '../../i18n/LanguageContext';

export default function ClientLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { clientLogin } = useAuth();
  const navigate = useNavigate();
  const { t, lang, setLang } = useLanguage();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await clientLogin(email, password);
      navigate('/cliente');
    } catch (err: any) {
      setError(err.response?.data?.detail || (lang === 'pt' ? 'Email ou senha incorretos' : 'Invalid email or password'));
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#F5F5F0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Inter', sans-serif", padding: 24, position: 'relative' }}>
      {/* Language toggle */}
      <div style={{ position: 'fixed', top: 20, right: 24, display: 'flex', gap: 4, zIndex: 1000 }}>
        <button
          onClick={() => setLang('pt')}
          style={{
            padding: '8px 12px',
            border: 'none',
            borderRadius: 4,
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            background: lang === 'pt' ? '#0a0a0a' : 'transparent',
            color: lang === 'pt' ? 'white' : '#757575',
            transition: 'all 0.2s'
          }}
        >
          PT
        </button>
        <span style={{ color: '#BDBDBD', padding: '8px 4px' }}>|</span>
        <button
          onClick={() => setLang('en')}
          style={{
            padding: '8px 12px',
            border: 'none',
            borderRadius: 4,
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            background: lang === 'en' ? '#0a0a0a' : 'transparent',
            color: lang === 'en' ? 'white' : '#757575',
            transition: 'all 0.2s'
          }}
        >
          EN
        </button>
      </div>

      <div style={{ width: '100%', maxWidth: 440 }}>
        {/* House icon */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#E8E8E0', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#0a0a0a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9,22 9,12 15,12 15,22"/>
            </svg>
          </div>
        </div>

        {/* Title */}
        <h1 style={{ textAlign: 'center', fontSize: 28, fontWeight: 700, color: '#212121', margin: 0, fontFamily: "'Poppins', 'Inter', sans-serif" }}>{t('welcomeBack')}</h1>
        <p style={{ textAlign: 'center', color: '#757575', fontSize: 14, marginTop: 6, marginBottom: 32 }}>{t('signInToContinue')}</p>

        {/* Error */}
        {error && (
          <div style={{ background: '#D32F2F', color: 'white', padding: '12px 16px', borderRadius: 8, fontSize: 14, marginBottom: 16, textAlign: 'center' }}>
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {/* Email input */}
          <div style={{ position: 'relative', marginBottom: 16 }}>
            <div style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#757575' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
            </div>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)} required
              placeholder={t('email')}
              style={{ width: '100%', padding: '16px 16px 16px 48px', border: '1.5px solid #BDBDBD', borderRadius: 28, fontSize: 15, background: 'white', boxSizing: 'border-box', outline: 'none', color: '#212121' }}
              onFocus={e => e.target.style.borderColor = '#0a0a0a'}
              onBlur={e => e.target.style.borderColor = '#BDBDBD'}
            />
          </div>

          {/* Password input */}
          <div style={{ position: 'relative', marginBottom: 8 }}>
            <div style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#757575' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
            </div>
            <input
              type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required
              placeholder={t('password')}
              style={{ width: '100%', padding: '16px 48px 16px 48px', border: '1.5px solid #BDBDBD', borderRadius: 28, fontSize: 15, background: 'white', boxSizing: 'border-box', outline: 'none', color: '#212121' }}
              onFocus={e => e.target.style.borderColor = '#0a0a0a'}
              onBlur={e => e.target.style.borderColor = '#BDBDBD'}
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)}
              style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#757575', padding: 0 }}>
              {showPassword ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
              )}
            </button>
          </div>

          {/* Forgot password */}
          <div style={{ textAlign: 'right', marginBottom: 24 }}>
            <span style={{ color: '#212121', fontSize: 13, cursor: 'pointer', fontWeight: 500 }}>{t('forgotPassword')}</span>
          </div>

          {/* Login button */}
          <button type="submit" disabled={loading}
            style={{
              width: '100%', padding: 16, border: 'none', borderRadius: 28, fontSize: 16, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', color: '#0a0a0a',
              background: loading ? '#b8962e' : '#d4af37',
              fontFamily: "'Poppins', 'Inter', sans-serif", transition: 'all 0.2s'
            }}>
            {loading ? `${t('login')}...` : t('login')}
          </button>
        </form>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '24px 0' }}>
          <div style={{ flex: 1, height: 1, background: '#BDBDBD' }} />
          <span style={{ color: '#757575', fontSize: 13 }}>{t('orContinueWith')}</span>
          <div style={{ flex: 1, height: 1, background: '#BDBDBD' }} />
        </div>

        {/* Social buttons */}
        <div style={{ display: 'flex', gap: 12 }}>
          <button style={{ flex: 1, padding: 14, border: '1.5px solid #BDBDBD', borderRadius: 28, background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 14, fontWeight: 500, color: '#212121' }}>
            <svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
            Google
          </button>
          <button style={{ flex: 1, padding: 14, border: '1.5px solid #BDBDBD', borderRadius: 28, background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 14, fontWeight: 500, color: '#212121' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="#212121"><path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.32 2.32-2.13 4.45-3.74 4.25z"/></svg>
            Apple
          </button>
        </div>

        {/* Register link */}
        <p style={{ textAlign: 'center', marginTop: 24, color: '#757575', fontSize: 14 }}>
          {t('dontHaveAccount')} <Link to="/cliente/register" style={{ color: '#0a0a0a', fontWeight: 600, textDecoration: 'none' }}>{t('register')}</Link>
        </p>

        {/* Admin link */}
        <p style={{ textAlign: 'center', marginTop: 8, fontSize: 13 }}>
          <Link to="/login" style={{ color: '#757575', textDecoration: 'none' }}>{`${t('adminAccess')} →`}</Link>
        </p>
      </div>
    </div>
  );
}
