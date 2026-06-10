import React, { useEffect, useState } from 'react';
import { getBranding, updateBranding } from '../services/api';
import { Palette, Save, Eye } from 'lucide-react';

export default function BrandingPage() {
  const [branding, setBranding] = useState({
    company_name: '',
    company_logo_url: '',
    app_description: '',
    welcome_message: '',
    footer_text: '',
    primary_color: '#3b82f6',
    accent_color: '#f59e0b',
    background_color: '#f3f4f6',
    contact_email: '',
    contact_phone: '',
    contact_address: ''
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      const response = await getBranding();
      setBranding(response.data);
    } catch (error) {
      console.error('Erro ao carregar branding:', error);
      setMessage({ type: 'error', text: 'Erro ao carregar configuracoes de branding' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleChange = (field: string, value: string) => {
    setBranding(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      await updateBranding(branding);
      setMessage({ type: 'success', text: 'Configuracoes de branding salvas com sucesso!' });
      setTimeout(() => setMessage(null), 5000);
    } catch (error) {
      console.error('Erro ao salvar branding:', error);
      setMessage({ type: 'error', text: 'Erro ao salvar configuracoes de branding' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-400">Carregando configuracoes de branding...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
        <Palette size={24} /> Marca / Branding
      </h1>

      {message && (
        <div className={`p-4 rounded-lg ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Secao 1: Identidade da Empresa */}
        <div className="card space-y-4">
          <h2 className="text-lg font-semibold text-gray-700 border-b pb-3">Identidade da Empresa</h2>

          <div>
            <label className="label">Nome da Empresa</label>
            <input
              type="text"
              value={branding.company_name}
              onChange={e => handleChange('company_name', e.target.value)}
              className="input-field"
              placeholder="Ex: Ferri Sistem"
            />
          </div>

          <div>
            <label className="label">URL do Logo</label>
            <input
              type="text"
              value={branding.company_logo_url}
              onChange={e => handleChange('company_logo_url', e.target.value)}
              className="input-field"
              placeholder="https://example.com/logo.png"
            />
          </div>

          <div>
            <label className="label">Descricao do App</label>
            <input
              type="text"
              value={branding.app_description}
              onChange={e => handleChange('app_description', e.target.value)}
              className="input-field"
              placeholder="Descricao breve do aplicativo"
            />
          </div>

          <div>
            <label className="label">Mensagem de Boas-vindas</label>
            <textarea
              value={branding.welcome_message}
              onChange={e => handleChange('welcome_message', e.target.value)}
              className="input-field"
              placeholder="Mensagem exibida na tela inicial"
              rows={3}
            />
          </div>

          <div>
            <label className="label">Texto do Rodape</label>
            <input
              type="text"
              value={branding.footer_text}
              onChange={e => handleChange('footer_text', e.target.value)}
              className="input-field"
              placeholder="Ex: Copyright 2024 Ferri Sistem"
            />
          </div>
        </div>

        {/* Secao 2: Cores */}
        <div className="card space-y-4">
          <h2 className="text-lg font-semibold text-gray-700 border-b pb-3">Cores</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="label">Cor Primaria</label>
              <div className="flex gap-3 items-center">
                <input
                  type="color"
                  value={branding.primary_color}
                  onChange={e => handleChange('primary_color', e.target.value)}
                  className="w-16 h-16 rounded-lg cursor-pointer border border-gray-300"
                />
                <div>
                  <input
                    type="text"
                    value={branding.primary_color}
                    onChange={e => handleChange('primary_color', e.target.value)}
                    className="input-field text-sm w-32"
                    placeholder="#3b82f6"
                  />
                  <div className="text-xs text-gray-500 mt-1">Preview:</div>
                  <div
                    className="w-32 h-8 rounded mt-1 border"
                    style={{ backgroundColor: branding.primary_color }}
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="label">Cor de Destaque</label>
              <div className="flex gap-3 items-center">
                <input
                  type="color"
                  value={branding.accent_color}
                  onChange={e => handleChange('accent_color', e.target.value)}
                  className="w-16 h-16 rounded-lg cursor-pointer border border-gray-300"
                />
                <div>
                  <input
                    type="text"
                    value={branding.accent_color}
                    onChange={e => handleChange('accent_color', e.target.value)}
                    className="input-field text-sm w-32"
                    placeholder="#f59e0b"
                  />
                  <div className="text-xs text-gray-500 mt-1">Preview:</div>
                  <div
                    className="w-32 h-8 rounded mt-1 border"
                    style={{ backgroundColor: branding.accent_color }}
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="label">Cor de Fundo</label>
              <div className="flex gap-3 items-center">
                <input
                  type="color"
                  value={branding.background_color}
                  onChange={e => handleChange('background_color', e.target.value)}
                  className="w-16 h-16 rounded-lg cursor-pointer border border-gray-300"
                />
                <div>
                  <input
                    type="text"
                    value={branding.background_color}
                    onChange={e => handleChange('background_color', e.target.value)}
                    className="input-field text-sm w-32"
                    placeholder="#f3f4f6"
                  />
                  <div className="text-xs text-gray-500 mt-1">Preview:</div>
                  <div
                    className="w-32 h-8 rounded mt-1 border"
                    style={{ backgroundColor: branding.background_color }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Secao 3: Contato */}
        <div className="card space-y-4">
          <h2 className="text-lg font-semibold text-gray-700 border-b pb-3">Contato</h2>

          <div>
            <label className="label">Email de Contato</label>
            <input
              type="email"
              value={branding.contact_email}
              onChange={e => handleChange('contact_email', e.target.value)}
              className="input-field"
              placeholder="contato@exemplo.com"
            />
          </div>

          <div>
            <label className="label">Telefone de Contato</label>
            <input
              type="text"
              value={branding.contact_phone}
              onChange={e => handleChange('contact_phone', e.target.value)}
              className="input-field"
              placeholder="+55 11 9999-9999"
            />
          </div>

          <div>
            <label className="label">Endereco</label>
            <textarea
              value={branding.contact_address}
              onChange={e => handleChange('contact_address', e.target.value)}
              className="input-field"
              placeholder="Endereco completo"
              rows={3}
            />
          </div>
        </div>

        {/* Secao 4: Preview */}
        <div className="card space-y-4">
          <h2 className="text-lg font-semibold text-gray-700 border-b pb-3 flex items-center gap-2">
            <Eye size={18} /> Preview
          </h2>

          <div
            className="rounded-lg p-6 text-white"
            style={{ backgroundColor: branding.primary_color }}
          >
            <div className="flex items-start gap-4">
              {branding.company_logo_url && (
                <img
                  src={branding.company_logo_url}
                  alt="Logo"
                  className="w-16 h-16 rounded object-cover"
                />
              )}
              <div className="flex-1">
                <h3 className="text-2xl font-bold">{branding.company_name || 'Nome da Empresa'}</h3>
                <p className="text-sm opacity-90">{branding.app_description || 'Descricao do aplicativo'}</p>
              </div>
            </div>

            <div className="mt-4 p-3 rounded" style={{ backgroundColor: branding.background_color, color: '#333' }}>
              <p className="text-sm">{branding.welcome_message || 'Mensagem de boas-vindas aparecera aqui'}</p>
            </div>

            <div className="mt-4 pt-4 border-t border-white/20 text-xs opacity-75">
              <p>{branding.contact_email}</p>
              <p>{branding.contact_phone}</p>
            </div>

            <div className="mt-4 pt-4 border-t border-white/20 text-xs opacity-75">
              {branding.footer_text}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mt-4">
            <div className="text-center">
              <div
                className="w-full h-12 rounded mb-2"
                style={{ backgroundColor: branding.accent_color }}
              />
              <p className="text-xs text-gray-600">Cor de Destaque</p>
            </div>
            <div className="text-center">
              <div
                className="w-full h-12 rounded mb-2"
                style={{ backgroundColor: branding.primary_color }}
              />
              <p className="text-xs text-gray-600">Cor Primaria</p>
            </div>
            <div className="text-center">
              <div
                className="w-full h-12 rounded mb-2 border border-gray-300"
                style={{ backgroundColor: branding.background_color }}
              />
              <p className="text-xs text-gray-600">Cor de Fundo</p>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end gap-3">
          <button
            type="submit"
            disabled={saving}
            className="btn-primary flex items-center gap-2"
          >
            <Save size={18} /> {saving ? 'Salvando...' : 'Salvar Alteracoes'}
          </button>
        </div>
      </form>
    </div>
  );
}
