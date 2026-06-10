import React, { useEffect, useState, useRef } from 'react';
import { getClientDocuments, uploadClientDocument } from '../../services/api';
import { useLanguage } from '../../i18n/LanguageContext';
import { FolderOpen, Upload, FileText, Download } from 'lucide-react';

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

export default function ClientDocuments() {
  const { t } = useLanguage();
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { loadDocs(); }, []);

  const loadDocs = async () => {
    try {
      const res = await getClientDocuments();
      const data = res.data?.documents || res.data || [];
      setDocuments(Array.isArray(data) ? data : []);
    } catch {}
    setLoading(false);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      await uploadClientDocument(file);
      await loadDocs();
    } catch {}
    setUploading(false);
    if (fileRef.current) fileRef.current.value = '';
  };

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '256px', color: COLORS.textSecondary }}>{t('loading')}</div>;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <FolderOpen size={24} style={{ color: COLORS.primary }} />
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: COLORS.textPrimary, fontFamily: "'Poppins', 'Inter', sans-serif" }}>{t('myDocuments')}</h1>
        </div>
        <label style={{ padding: '8px 16px', background: `linear-gradient(135deg, ${COLORS.primary} 0%, #2D7A62 100%)`, color: 'white', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 500, cursor: 'pointer', opacity: uploading ? 0.5 : 1, transition: 'opacity 0.2s' }}>
          <Upload size={16} />{uploading ? t('uploading') : t('uploadDocument')}
          <input type="file" ref={fileRef} onChange={handleUpload} style={{ display: 'none' }} disabled={uploading} />
        </label>
      </div>

      {documents.length === 0 ? (
        <div style={{ background: 'white', borderRadius: '16px', padding: '32px', textAlign: 'center', border: '1px solid #EEEEEE' }}>
          <FolderOpen size={48} style={{ color: '#D0D0D0', margin: '0 auto 12px' }} />
          <p style={{ color: COLORS.textSecondary }}>{t('noDocuments')}</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
          {documents.map((doc: any, i: number) => (
            <div key={doc.id || i} style={{ background: 'white', borderRadius: '16px', padding: '16px', border: '1px solid #EEEEEE', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ padding: '8px', background: `rgba(${parseInt(COLORS.primary.slice(1, 3), 16)}, ${parseInt(COLORS.primary.slice(3, 5), 16)}, ${parseInt(COLORS.primary.slice(5, 7), 16)}, 0.1)`, borderRadius: '8px' }}><FileText size={24} style={{ color: COLORS.primary }} /></div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontWeight: 500, color: COLORS.textPrimary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.filename || doc.name || `Documento ${doc.id}`}</p>
                <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: COLORS.textSecondary, marginTop: '8px' }}>
                  {doc.category && <span style={{ textTransform: 'capitalize' }}>{doc.category}</span>}
                  {doc.created_at && <span>{new Date(doc.created_at).toLocaleDateString('pt-BR')}</span>}
                </div>
              </div>
              {doc.url && (
                <a href={doc.url} target="_blank" rel="noopener noreferrer"
                  style={{ padding: '8px', color: COLORS.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'background 0.2s' }}><Download size={18} /></a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
