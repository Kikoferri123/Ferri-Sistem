import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';

export default function Login() {
  const [email, setEmail] = useState('admin@ferrisystem.com');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const { ta, lang, setLang } = useLanguage();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.detail || (lang === 'pt' ? 'Erro ao fazer login' : 'Login failed'));
    }
    setLoading(false);
  };

  return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'linear-gradient(135deg,#0a0a0a,#1a1a1a,#0a0a0a)',position:'relative'}}>
      {/* Language Switcher */}
      <div style={{position:'fixed',top:20,right:24,display:'flex',gap:4,background:'rgba(255,255,255,0.15)',borderRadius:20,padding:'4px 6px',zIndex:1000}}>
        <button onClick={() => setLang('pt')}
          style={{padding:'6px 14px',border:'none',borderRadius:16,fontSize:13,fontWeight:600,cursor:'pointer',
            background:lang==='pt'?'#d4af37':'transparent',color:lang==='pt'?'#0a0a0a':'rgba(255,255,255,0.7)',transition:'all 0.2s'}}>
          PT
        </button>
        <button onClick={() => setLang('en')}
          style={{padding:'6px 14px',border:'none',borderRadius:16,fontSize:13,fontWeight:600,cursor:'pointer',
            background:lang==='en'?'#d4af37':'transparent',color:lang==='en'?'#0a0a0a':'rgba(255,255,255,0.7)',transition:'all 0.2s'}}>
          EN
        </button>
      </div>

      <div style={{background:'white',borderRadius:16,boxShadow:'0 25px 50px rgba(0,0,0,0.25)',width:'100%',maxWidth:400,overflow:'hidden'}}>
        <div style={{background:'linear-gradient(90deg,#1a1a1a,#0a0a0a)',padding:32,textAlign:'center'}}>
          <h1 style={{fontSize:24,fontWeight:'bold',color:'white',margin:0}}>Ferri Sistem</h1>
          <p style={{color:'#d4af37',fontSize:14,marginTop:4}}>Property Management System</p>
        </div>
        <form onSubmit={handleSubmit} style={{padding:32}}>
          {error && <div style={{background:'#fef2f2',border:'1px solid #fecaca',color:'#dc2626',padding:12,borderRadius:8,fontSize:14,marginBottom:16}}>{error}</div>}
          <div style={{marginBottom:16}}>
            <label style={{display:'block',fontSize:14,fontWeight:500,marginBottom:4}}>{ta('email')}</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              style={{width:'100%',padding:'10px 12px',border:'1px solid #d1d5db',borderRadius:8,fontSize:14,boxSizing:'border-box'}} required />
          </div>
          <div style={{marginBottom:20}}>
            <label style={{display:'block',fontSize:14,fontWeight:500,marginBottom:4}}>{ta('password')}</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              style={{width:'100%',padding:'10px 12px',border:'1px solid #d1d5db',borderRadius:8,fontSize:14,boxSizing:'border-box'}} required />
          </div>
          <button type="submit" disabled={loading}
            style={{width:'100%',padding:12,background:loading?'#b8962e':'#d4af37',color:'#0a0a0a',border:'none',borderRadius:8,fontSize:16,fontWeight:600,cursor:loading?'not-allowed':'pointer'}}>
            {loading ? (lang === 'pt' ? 'Entrando...' : 'Signing in...') : ta('signIn')}
          </button>
          <div style={{marginTop:16,textAlign:'center'}}>
            <Link to="/cliente/login" style={{color:'#d4af37',fontSize:13,textDecoration:'none'}}>{lang === 'pt' ? 'Portal do Cliente' : 'Client Portal'} →</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
