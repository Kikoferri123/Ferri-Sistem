import React, { useState, useEffect } from 'react';
import { Palette, AlertCircle, Save } from 'lucide-react';
import { getBranding, updateBranding } from '../services/api';

interface BrandingConfig {
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  logo_url?: string;
  brand_name: string;
  brand_tagline: string;
}

export default function BrandingPage() {
  const [branding, setBranding] = useState<BrandingConfig>({
    primary_color: '#3B82F6',
    secondary_color: '#1F2937',
    accent_color: '#F59E0B',
    logo_url: '',
    brand_name: 'Dream Abroad',
    brand_tagline: 'Admin Panel',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchBranding = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await getBranding();
        if (res.data) {
          setBranding(res.data);
        }
      } catch (err: any) {
        setError('Erro ao carregar configurações de marca');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchBranding();
  }, []);

  const handleChange = (field: keyof BrandingConfig, value: string) => {
    setBranding((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      await updateBranding(branding);
      setSuccess('Configurações de marca atualizadas com sucesso!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError('Erro ao salvar configurações');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando configurações...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Marca / Branding</h1>
        <p className="text-gray-600 mt-1">Configurar cores e identidade visual</p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-gap-3">
          <AlertCircle className="text-red-600 flex-shrink-0" size={20} />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-700">{success}</p>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Brand Information */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Palette size={20} />
              Informações da Marca
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome da Marca
                </label>
                <input
                  type="text"
                  value={branding.brand_name}
                  onChange={(e) => handleChange('brand_name', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tagline
                </label>
                <input
                  type="text"
                  value={branding.brand_tagline}
                  onChange={(e) => handleChange('brand_tagline', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  URL do Logo
                </label>
                <input
                  type="url"
                  value={branding.logo_url || ''}
                  onChange={(e) => handleChange('logo_url', e.target.value)}
                  placeholder="https://example.com/logo.png"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                />
              </div>
            </div>
          </div>

          {/* Color Palette */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Paleta de Cores</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cor Primária
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={branding.primary_color}
                    onChange={(e) => handleChange('primary_color', e.target.value)}
                    className="w-16 h-10 rounded-lg cursor-pointer"
                  />
                  <input
                    type="text"
                    value={branding.primary_color}
                    onChange={(e) => handleChange('primary_color', e.target.value)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition font-mono text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cor Secundária
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={branding.secondary_color}
                    onChange={(e) => handleChange('secondary_color', e.target.value)}
                    className="w-16 h-10 rounded-lg cursor-pointer"
                  />
                  <input
                    type="text"
                    value={branding.secondary_color}
                    onChange={(e) => handleChange('secondary_color', e.target.value)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition font-mono text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cor de Destaque
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={branding.accent_color}
                    onChange={(e) => handleChange('accent_color', e.target.value)}
                    className="w-16 h-10 rounded-lg cursor-pointer"
                  />
                  <input
                    type="text"
                    value={branding.accent_color}
                    onChange={(e) => handleChange('accent_color', e.target.value)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition font-mono text-sm"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Preview</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <p className="text-sm text-gray-700 font-medium">Cor Primária</p>
              <div
                className="h-20 rounded-lg border-2 border-gray-200"
                style={{ backgroundColor: branding.primary_color }}
              />
              <p className="text-xs text-gray-600 text-center">{branding.primary_color}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-gray-700 font-medium">Cor Secundária</p>
              <div
                className="h-20 rounded-lg border-2 border-gray-200"
                style={{ backgroundColor: branding.secondary_color }}
              />
              <p className="text-xs text-gray-600 text-center">{branding.secondary_color}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-gray-700 font-medium">Cor de Destaque</p>
              <div
                className="h-20 rounded-lg border-2 border-gray-200"
                style={{ backgroundColor: branding.accent_color }}
              />
              <p className="text-xs text-gray-600 text-center">{branding.accent_color}</p>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-3 rounded-lg transition-colors flex items-center gap-2 font-medium"
          >
            <Save size={20} />
            {saving ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </div>
      </form>
    </div>
  );
}
