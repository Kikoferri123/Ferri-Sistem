import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { clientRegister } from '../../services/api';
import { useLanguage } from '../../i18n/LanguageContext';

export default function ClientRegister() {
  const { t, lang } = useLanguage();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '', phone: '', nationality: '', birth_date: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) { setError(lang === 'pt' ? 'Senhas nao coincidem' : 'Passwords do not match'); return; }
    if (!agreed) { setError(lang === 'pt' ? 'Voce deve aceitar os Termos e Condicoes' : 'You must agree to the Terms & Conditions'); return; }
    setError('');
    setLoading(true);
    try {
      await clientRegister({ name: form.name, email: form.email, password: form.password, phone: form.phone, nationality: form.nationality, birth_date: form.birth_date || undefined });
      navigate('/cliente/login');
    } catch (err: any) {
      setError(err.response?.data?.detail || (lang === 'pt' ? 'Erro ao criar conta' : 'Failed to create account'));
    }
    setLoading(false);
  };

  const inputStyle: React.CSSProperties = { width: '100%', padding: '16px 16px 16px 48px', border: '1.5px solid #BDBDBD', borderRadius: 28, fontSize: 15, background: 'white', boxSizing: 'border-box', outline: 'none', color: '#212121' };
  const iconStyle: React.CSSProperties = { position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#757575' };

  return (
    <div style={{ minHeight: '100vh', background: '#F5F5F0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Inter', sans-serif", padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 440 }}>
        {/* Back button */}
        <Link to="/cliente/login" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 40, height: 40, borderRadius: '50%', border: '1.5px solid #BDBDBD', background: 'white', textDecoration: 'none', color: '#212121', marginBottom: 16 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15,18 9,12 15,6"/></svg>
        </Link>

        <h1 style={{ fontSize: 28, fontWeight: 700, color: '#212121', margin: 0, fontFamily: "'Poppins', 'Inter', sans-serif" }}>{t('createAccount')}</h1>
        <p style={{ color: '#757575', fontSize: 14, marginTop: 6, marginBottom: 24 }}>{t('joinLeevin')}</p>

        {error && <div style={{ background: '#D32F2F', color: 'white', padding: '12px 16px', borderRadius: 8, fontSize: 14, marginBottom: 16 }}>{error}</div>}

        <form onSubmit={handleSubmit}>
          {/* Full Name */}
          <div style={{ position: 'relative', marginBottom: 14 }}>
            <div style={iconStyle}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></div>
            <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required placeholder={t('fullName')} style={inputStyle}
              onFocus={e => e.target.style.borderColor = '#1B4D3E'} onBlur={e => e.target.style.borderColor = '#BDBDBD'} />
          </div>

          {/* Email */}
          <div style={{ position: 'relative', marginBottom: 14 }}>
            <div style={iconStyle}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg></div>
            <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required placeholder={t('email')} style={inputStyle}
              onFocus={e => e.target.style.borderColor = '#1B4D3E'} onBlur={e => e.target.style.borderColor = '#BDBDBD'} />
          </div>

          {/* Password */}
          <div style={{ position: 'relative', marginBottom: 14 }}>
            <div style={iconStyle}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg></div>
            <input type={showPassword ? 'text' : 'password'} value={form.password} onChange={e => setForm({...form, password: e.target.value})} required placeholder={t('password')} style={{...inputStyle, paddingRight: 48}}
              onFocus={e => e.target.style.borderColor = '#1B4D3E'} onBlur={e => e.target.style.borderColor = '#BDBDBD'} />
            <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#757575', padding: 0 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
            </button>
          </div>

          {/* Confirm Password */}
          <div style={{ position: 'relative', marginBottom: 14 }}>
            <div style={iconStyle}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg></div>
            <input type={showConfirm ? 'text' : 'password'} value={form.confirmPassword} onChange={e => setForm({...form, confirmPassword: e.target.value})} required placeholder={t('confirmPassword')} style={{...inputStyle, paddingRight: 48}}
              onFocus={e => e.target.style.borderColor = '#1B4D3E'} onBlur={e => e.target.style.borderColor = '#BDBDBD'} />
            <button type="button" onClick={() => setShowConfirm(!showConfirm)} style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#757575', padding: 0 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
            </button>
          </div>

          {/* Phone */}
          <div style={{ position: 'relative', marginBottom: 14 }}>
            <div style={iconStyle}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg></div>
            <input type="tel" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder={t('phone')} style={inputStyle}
              onFocus={e => e.target.style.borderColor = '#1B4D3E'} onBlur={e => e.target.style.borderColor = '#BDBDBD'} />
          </div>

          {/* Nationality */}
          <div style={{ position: 'relative', marginBottom: 14 }}>
            <div style={iconStyle}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg></div>
            <input type="text" value={form.nationality} onChange={e => setForm({...form, nationality: e.target.value})} placeholder={t('nationality')} style={inputStyle}
              onFocus={e => e.target.style.borderColor = '#1B4D3E'} onBlur={e => e.target.style.borderColor = '#BDBDBD'} />
          </div>

          {/* Birth Date */}
          <div style={{ position: 'relative', marginBottom: 16 }}>
            <div style={iconStyle}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg></div>
            <input type="date" value={form.birth_date} onChange={e => setForm({...form, birth_date: e.target.value})} placeholder={t('birthDate')} style={inputStyle}
              onFocus={e => e.target.style.borderColor = '#1B4D3E'} onBlur={e => e.target.style.borderColor = '#BDBDBD'} />
          </div>

          {/* Terms */}
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, cursor: 'pointer', fontSize: 14, color: '#424242' }}>
            <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} style={{ width: 18, height: 18, accentColor: '#1B4D3E' }} />
            {t('agreeToTerms')} <span style={{ color: '#1B4D3E', fontWeight: 600 }}>{t('termsAndConditions')}</span>
          </label>

          {/* Submit */}
          <button type="submit" disabled={loading}
            style={{ width: '100%', padding: 16, border: 'none', borderRadius: 28, fontSize: 16, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', color: 'white',
              background: loading ? '#2D7A62' : 'linear-gradient(135deg, #1B4D3E 0%, #2D7A62 100%)', fontFamily: "'Poppins', 'Inter', sans-serif" }}>
            {loading ? `${t('createAccount')}...` : t('createAccount')}
          </button>
        </form>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '24px 0' }}>
          <div style={{ flex: 1, height: 1, background: '#BDBDBD' }} />
          <span style={{ color: '#757575', fontSize: 13 }}>{t('orContinueWith')}</span>
          <div style={{ flex: 1, height: 1, background: '#BDBDBD' }} />
        </div>

        {/* Social */}
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

        <p style={{ textAlign: 'center', marginTop: 24, color: '#757575', fontSize: 14 }}>
          {t('alreadyHaveAccount')} <Link to="/cliente/login" style={{ color: '#1B4D3E', fontWeight: 600, textDecoration: 'none' }}>{t('signIn')}</Link>
        </p>
      </div>
    </div>
  );
}
