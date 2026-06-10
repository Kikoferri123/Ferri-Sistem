import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { UserCircle, Save, Lock, Mail, User as UserIcon } from 'lucide-react';
import api from '../services/api';

export default function UserProfile() {
  const { user, logout } = useAuth();
  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
  });
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [saving, setSaving] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [message, setMessage] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');
  const [error, setError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');
    try {
      await api.put('/auth/me', { name: form.name, email: form.email });
      setMessage('Perfil atualizado com sucesso! Faca login novamente para ver as mudancas.');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Erro ao atualizar perfil');
    }
    setSaving(false);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setPasswordError('As senhas nao coincidem');
      return;
    }
    if (passwordForm.new_password.length < 6) {
      setPasswordError('A nova senha deve ter no minimo 6 caracteres');
      return;
    }
    setSavingPassword(true);
    setPasswordMessage('');
    setPasswordError('');
    try {
      await api.put('/auth/me', {
        current_password: passwordForm.current_password,
        new_password: passwordForm.new_password,
      });
      setPasswordMessage('Senha alterada com sucesso!');
      setPasswordForm({ current_password: '', new_password: '', confirm_password: '' });
    } catch (err: any) {
      setPasswordError(err.response?.data?.detail || 'Erro ao alterar senha');
    }
    setSavingPassword(false);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
        <UserCircle size={24} /> Meu Perfil
      </h1>

      {/* Profile Info */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">Informacoes Pessoais</h2>
        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <div>
            <label className="label flex items-center gap-2"><UserIcon size={14} /> Nome</label>
            <input
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              className="input-field"
              required
            />
          </div>
          <div>
            <label className="label flex items-center gap-2"><Mail size={14} /> Email</label>
            <input
              type="email"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              className="input-field"
              required
            />
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">Funcao:</span>
            <span className="inline-block bg-blue-100 text-blue-700 text-sm px-3 py-1 rounded-full font-medium capitalize">
              {user?.role}
            </span>
          </div>

          {message && <p className="text-sm text-green-600 bg-green-50 p-3 rounded-lg">{message}</p>}
          {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</p>}

          <div className="flex justify-end">
            <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
              <Save size={16} /> {saving ? 'Salvando...' : 'Salvar Alteracoes'}
            </button>
          </div>
        </form>
      </div>

      {/* Change Password */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
          <Lock size={18} /> Alterar Senha
        </h2>
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="label">Senha Atual</label>
            <input
              type="password"
              value={passwordForm.current_password}
              onChange={e => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
              className="input-field"
              required
            />
          </div>
          <div>
            <label className="label">Nova Senha</label>
            <input
              type="password"
              value={passwordForm.new_password}
              onChange={e => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
              className="input-field"
              required
              minLength={6}
            />
          </div>
          <div>
            <label className="label">Confirmar Nova Senha</label>
            <input
              type="password"
              value={passwordForm.confirm_password}
              onChange={e => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
              className="input-field"
              required
            />
          </div>

          {passwordMessage && <p className="text-sm text-green-600 bg-green-50 p-3 rounded-lg">{passwordMessage}</p>}
          {passwordError && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{passwordError}</p>}

          <div className="flex justify-end">
            <button type="submit" disabled={savingPassword} className="btn-primary flex items-center gap-2">
              <Lock size={16} /> {savingPassword ? 'Alterando...' : 'Alterar Senha'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
