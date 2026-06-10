import React, { useEffect, useState } from 'react';
import { getClientProperty } from '../../services/api';
import { useLanguage } from '../../i18n/LanguageContext';
import { Home, MapPin, Bed, Bath, Key } from 'lucide-react';

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

export default function ClientProperty() {
  const { t, lang } = useLanguage();
  const [property, setProperty] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getClientProperty();
        setProperty(res.data);
      } catch {}
      setLoading(false);
    };
    load();
  }, []);

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '256px', color: COLORS.textSecondary }}>{t('loading')}</div>;

  if (!property) {
    return (
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <Home size={24} style={{ color: COLORS.primary }} />
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: COLORS.textPrimary, fontFamily: "'Poppins', 'Inter', sans-serif" }}>{t('myProperty')}</h1>
        </div>
        <div style={{ background: 'white', borderRadius: '16px', padding: '32px', textAlign: 'center', border: '1px solid #EEEEEE' }}>
          <Home size={48} style={{ color: '#D0D0D0', margin: '0 auto 12px' }} />
          <p style={{ color: COLORS.textSecondary }}>{t('noProperty')}</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <Home size={24} style={{ color: COLORS.primary }} />
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: COLORS.textPrimary, fontFamily: "'Poppins', 'Inter', sans-serif" }}>{t('myProperty')}</h1>
      </div>

      <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #EEEEEE', overflow: 'hidden' }}>
        <div style={{ background: `linear-gradient(135deg, ${COLORS.primary} 0%, #2D7A62 100%)`, padding: '24px', color: 'white' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700 }}>{property.name || property.property_name || t('myProperty')}</h2>
          {property.address && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px', color: 'rgba(255,255,255,0.8)' }}>
              <MapPin size={16} /><span>{property.address}</span>
            </div>
          )}
        </div>

        <div style={{ padding: '24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            {property.type && (
              <div style={{ padding: '12px', background: '#F5F5F0', borderRadius: '8px', textAlign: 'center' }}>
                <Key size={20} style={{ color: COLORS.primary, margin: '0 auto 8px', display: 'block' }} />
                <p style={{ fontSize: '12px', color: COLORS.textSecondary }}>{t('propertyType')}</p>
                <p style={{ fontSize: '14px', fontWeight: 500, color: COLORS.textPrimary, textTransform: 'capitalize' }}>{property.type}</p>
              </div>
            )}
            {property.rooms && (
              <div style={{ padding: '12px', background: '#F5F5F0', borderRadius: '8px', textAlign: 'center' }}>
                <Bed size={20} style={{ color: COLORS.primary, margin: '0 auto 8px', display: 'block' }} />
                <p style={{ fontSize: '12px', color: COLORS.textSecondary }}>{t('rooms')}</p>
                <p style={{ fontSize: '14px', fontWeight: 500, color: COLORS.textPrimary }}>{property.rooms}</p>
              </div>
            )}
            {property.bathrooms && (
              <div style={{ padding: '12px', background: '#F5F5F0', borderRadius: '8px', textAlign: 'center' }}>
                <Bath size={20} style={{ color: COLORS.primary, margin: '0 auto 8px', display: 'block' }} />
                <p style={{ fontSize: '12px', color: COLORS.textSecondary }}>{t('bathrooms')}</p>
                <p style={{ fontSize: '14px', fontWeight: 500, color: COLORS.textPrimary }}>{property.bathrooms}</p>
              </div>
            )}
          </div>

          {/* Property details */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px' }}>
            {property.monthly_rent && (
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid #EEEEEE' }}>
                <span style={{ color: COLORS.textSecondary }}>{t('monthlyRent')}</span>
                <span style={{ fontWeight: 500, color: COLORS.textPrimary }}>EUR {Number(property.monthly_rent).toFixed(2)}</span>
              </div>
            )}
            {property.contract_start && (
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid #EEEEEE' }}>
                <span style={{ color: COLORS.textSecondary }}>{t('contractStart')}</span>
                <span style={{ color: COLORS.textPrimary }}>{new Date(property.contract_start).toLocaleDateString('pt-BR')}</span>
              </div>
            )}
            {property.contract_end && (
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid #EEEEEE' }}>
                <span style={{ color: COLORS.textSecondary }}>{t('contractEnd')}</span>
                <span style={{ color: COLORS.textPrimary }}>{new Date(property.contract_end).toLocaleDateString('pt-BR')}</span>
              </div>
            )}
            {property.owner_name && (
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid #EEEEEE' }}>
                <span style={{ color: COLORS.textSecondary }}>{t('manager')}</span>
                <span style={{ color: COLORS.textPrimary }}>{property.owner_name}</span>
              </div>
            )}
            {property.notes && (
              <div style={{ marginTop: '12px', padding: '12px', background: `rgba(${parseInt(COLORS.accent.slice(1, 3), 16)}, ${parseInt(COLORS.accent.slice(3, 5), 16)}, ${parseInt(COLORS.accent.slice(5, 7), 16)}, 0.1)`, borderRadius: '8px', color: COLORS.accent, fontSize: '14px' }}>
                <p style={{ fontWeight: 500, marginBottom: '8px' }}>{`${t('notes')}:`}</p>
                <p>{property.notes}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
