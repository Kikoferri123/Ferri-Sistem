import React, { useEffect, useState } from 'react';
import { getClientPortalProfile, updateClientPortalProfile, changeClientPassword } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../i18n/LanguageContext';
import { User, Save, CheckCircle, Lock, Eye, EyeOff } from 'lucide-react';

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

export default function ClientProfile() {
  const { refreshUser } = useAuth();
  const { t, lang, setLang } = useLanguage();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', nationality: '', birth_date: '' });
  const [pwForm, setPwForm] = useState({ current_password: '', new_password: '', confirm_password: '' });
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMsg, setPwMsg] = useState('');
  const [pwError, setPwError] = useState('');
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getClientPortalProfile();
        const data = res.data;
        setProfile(data);
        setForm({
          name: data.name || '',
          email: data.email || '',
          phone: data.phone || '',
          nationality: data.nationality || '',
          birth_date: data.birth_date || '',
        });
      } catch {}
      setLoading(false);
    };
    load();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateClientPortalProfile(form);
      await refreshUser();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {}
    setSaving(false);
  };

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '256px', color: COLORS.textSecondary }}>{t('loading')}</div>;

  return (
    <div style={{ maxWidth: '512px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <User size={24} style={{ color: COLORS.primary }} />
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: COLORS.textPrimary, fontFamily: "'Poppins', 'Inter', sans-serif" }}>{t('myProfile')}</h1>
      </div>

      <div style={{ background: 'white', borderRadius: '16px', padding: '24px', border: '1px solid #EEEEEE' }}>
        {saved && (
          <div style={{ marginBottom: '16px', padding: '12px', background: `rgba(${parseInt(COLORS.success.slice(1, 3), 16)}, ${parseInt(COLORS.success.slice(3, 5), 16)}, ${parseInt(COLORS.success.slice(5, 7), 16)}, 0.1)`, border: `1px solid ${COLORS.success}`, color: COLORS.success, borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
            <CheckCircle size={16} /> {lang === 'pt' ? 'Perfil atualizado com sucesso!' : 'Profile updated successfully!'}
          </div>
        )}

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: COLORS.textPrimary, marginBottom: '8px' }}>{t('fullName')}</label>
            <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})}
              style={{ width: '100%', padding: '8px 12px', border: `1px solid #EEEEEE`, borderRadius: '8px', fontSize: '14px', fontFamily: 'inherit' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: COLORS.textPrimary, marginBottom: '8px' }}>{t('email')}</label>
            <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})}
              style={{ width: '100%', padding: '8px 12px', border: `1px solid #EEEEEE`, borderRadius: '8px', fontSize: '14px', background: '#F5F5F0', fontFamily: 'inherit', cursor: 'not-allowed' }} disabled />
            <p style={{ fontSize: '12px', color: COLORS.textSecondary, marginTop: '8px' }}>{lang === 'pt' ? 'Email nao pode ser alterado' : 'Email cannot be changed'}</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: COLORS.textPrimary, marginBottom: '8px' }}>{t('phoneNumber')}</label>
              <input type="tel" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})}
                style={{ width: '100%', padding: '8px 12px', border: `1px solid #EEEEEE`, borderRadius: '8px', fontSize: '14px', fontFamily: 'inherit' }} placeholder="+351 xxx xxx xxx" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: COLORS.textPrimary, marginBottom: '8px' }}>{t('nationality')}</label>
              <input type="text" value={form.nationality} onChange={e => setForm({...form, nationality: e.target.value})}
                style={{ width: '100%', padding: '8px 12px', border: `1px solid #EEEEEE`, borderRadius: '8px', fontSize: '14px', fontFamily: 'inherit' }} placeholder="Portuguesa" />
            </div>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: COLORS.textPrimary, marginBottom: '8px' }}>{t('birthDate')}</label>
            <input type="date" value={form.birth_date} onChange={e => setForm({...form, birth_date: e.target.value})}
              style={{ width: '100%', padding: '8px 12px', border: `1px solid #EEEEEE`, borderRadius: '8px', fontSize: '14px', fontFamily: 'inherit' }} />
          </div>

          {/* Language selector */}
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: COLORS.textPrimary, marginBottom: '8px' }}>{t('language')}</label>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button type="button" onClick={() => setLang('pt')}
                style={{
                  flex: 1, padding: '12px', border: lang === 'pt' ? `2px solid ${COLORS.primary}` : '2px solid #EEEEEE',
                  borderRadius: '12px', background: lang === 'pt' ? 'rgba(27,77,62,0.05)' : 'white',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  fontSize: '14px', fontWeight: lang === 'pt' ? 600 : 400, color: lang === 'pt' ? COLORS.primary : COLORS.textSecondary,
                  transition: 'all 0.2s'
                }}>
                <span style={{ fontSize: '20px' }}>🇧🇷</span> Portugues
              </button>
              <button type="button" onClick={() => setLang('en')}
                style={{
                  flex: 1, padding: '12px', border: lang === 'en' ? `2px solid ${COLORS.primary}` : '2px solid #EEEEEE',
                  borderRadius: '12px', background: lang === 'en' ? 'rgba(27,77,62,0.05)' : 'white',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  fontSize: '14px', fontWeight: lang === 'en' ? 600 : 400, color: lang === 'en' ? COLORS.primary : COLORS.textSecondary,
                  transition: 'all 0.2s'
                }}>
                <span style={{ fontSize: '20px' }}>🇬🇧</span> English
              </button>
            </div>
          </div>

          <button type="submit" disabled={saving}
            style={{ width: '100%', padding: '10px 16px', background: `linear-gradient(135deg, ${COLORS.primary} 0%, #2D7A62 100%)`, color: 'white', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', opacity: saving ? 0.5 : 1, transition: 'opacity 0.2s' }}>
            <Save size={16} />{saving ? `${t('save')}...` : (lang === 'pt' ? 'Salvar Alteracoes' : 'Save Changes')}
          </button>
        </form>
      </div>

      {/* Change Password */}
      <div style={{ marginTop: '24px', background: 'white', borderRadius: '16px', padding: '24px', border: '1px solid #EEEEEE' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <Lock size={18} style={{ color: COLORS.primary }} />
          <h2 style={{ fontWeight: 600, color: COLORS.textPrimary, margin: 0 }}>{lang === 'pt' ? 'Alterar Senha' : 'Change Password'}</h2>
        </div>
        {pwMsg && <div style={{ marginBottom: '12px', padding: '10px', background: 'rgba(56,142,60,0.1)', border: `1px solid ${COLORS.success}`, color: COLORS.success, borderRadius: '8px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}><CheckCircle size={14} />{pwMsg}</div>}
        {pwError && <div style={{ marginBottom: '12px', padding: '10px', background: 'rgba(211,47,47,0.1)', border: `1px solid ${COLORS.error}`, color: COLORS.error, borderRadius: '8px', fontSize: '13px' }}>{pwError}</div>}
        <form onSubmit={async (e) => {
          e.preventDefault();
          setPwMsg(''); setPwError('');
          if (pwForm.new_password !== pwForm.confirm_password) {
            setPwError(lang === 'pt' ? 'As senhas nao coincidem' : 'Passwords do not match');
            return;
          }
          if (pwForm.new_password.length < 6) {
            setPwError(lang === 'pt' ? 'A senha deve ter pelo menos 6 caracteres' : 'Password must be at least 6 characters');
            return;
          }
          setPwSaving(true);
          try {
            await changeClientPassword(pwForm.current_password, pwForm.new_password);
            setPwMsg(lang === 'pt' ? 'Senha alterada com sucesso!' : 'Password changed successfully!');
            setPwForm({ current_password: '', new_password: '', confirm_password: '' });
            setTimeout(() => setPwMsg(''), 4000);
          } catch (err: any) {
            setPwError(err.response?.data?.detail || (lang === 'pt' ? 'Erro ao alterar senha' : 'Error changing password'));
          }
          setPwSaving(false);
        }} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ position: 'relative' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: COLORS.textPrimary, marginBottom: '6px' }}>{lang === 'pt' ? 'Senha Atual' : 'Current Password'}</label>
            <input type={showCurrentPw ? 'text' : 'password'} value={pwForm.current_password} onChange={e => setPwForm({...pwForm, current_password: e.target.value})} required
              style={{ width: '100%', padding: '8px 36px 8px 12px', border: '1px solid #EEEEEE', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }} />
            <button type="button" onClick={() => setShowCurrentPw(!showCurrentPw)} style={{ position: 'absolute', right: '8px', top: '30px', background: 'none', border: 'none', cursor: 'pointer', color: COLORS.textSecondary }}>
              {showCurrentPw ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <div style={{ position: 'relative' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: COLORS.textPrimary, marginBottom: '6px' }}>{lang === 'pt' ? 'Nova Senha' : 'New Password'}</label>
            <input type={showNewPw ? 'text' : 'password'} value={pwForm.new_password} onChange={e => setPwForm({...pwForm, new_password: e.target.value})} required
              style={{ width: '100%', padding: '8px 36px 8px 12px', border: '1px solid #EEEEEE', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }} />
            <button type="button" onClick={() => setShowNewPw(!showNewPw)} style={{ position: 'absolute', right: '8px', top: '30px', background: 'none', border: 'none', cursor: 'pointer', color: COLORS.textSecondary }}>
              {showNewPw ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: COLORS.textPrimary, marginBottom: '6px' }}>{lang === 'pt' ? 'Confirmar Nova Senha' : 'Confirm New Password'}</label>
            <input type="password" value={pwForm.confirm_password} onChange={e => setPwForm({...pwForm, confirm_password: e.target.value})} required
              style={{ width: '100%', padding: '8px 12px', border: '1px solid #EEEEEE', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }} />
          </div>
          <button type="submit" disabled={pwSaving}
            style={{ width: '100%', padding: '10px', background: COLORS.primary, color: 'white', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', opacity: pwSaving ? 0.5 : 1 }}>
            <Lock size={14} />{pwSaving ? '...' : (lang === 'pt' ? 'Alterar Senha' : 'Change Password')}
          </button>
        </form>
      </div>

      {/* Additional info */}
      {profile && (
        <div style={{ marginTop: '24px', background: 'white', borderRadius: '16px', padding: '24px', border: '1px solid #EEEEEE' }}>
          <h2 style={{ fontWeight: 600, color: COLORS.textPrimary, marginBottom: '12px' }}>{lang === 'pt' ? 'Informacoes da Conta' : 'Account Information'}</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px' }}>
            {profile.property_name && <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: COLORS.textSecondary }}>{lang === 'pt' ? 'Propriedade' : 'Property'}</span><span style={{ color: COLORS.textPrimary }}>{profile.property_name}</span></div>}
            {profile.check_in && <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: COLORS.textSecondary }}>Check-in</span><span style={{ color: COLORS.textPrimary }}>{new Date(profile.check_in).toLocaleDateString('pt-BR')}</span></div>}
            {profile.check_out && <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: COLORS.textSecondary }}>Check-out</span><span style={{ color: COLORS.textPrimary }}>{new Date(profile.check_out).toLocaleDateString('pt-BR')}</span></div>}
            {profile.document_id && <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: COLORS.textSecondary }}>{lang === 'pt' ? 'Documento' : 'Document'}</span><span style={{ color: COLORS.textPrimary }}>{profile.document_id}</span></div>}
          </div>
        </div>
      )}
    </div>
  );
}
