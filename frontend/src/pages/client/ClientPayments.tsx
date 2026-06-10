import React, { useEffect, useState } from 'react';
import { getClientPayments } from '../../services/api';
import { CreditCard, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';

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

export default function ClientPayments() {
  const { t, lang } = useLanguage();
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getClientPayments();
        const data = res.data?.payments || res.data || [];
        setPayments(Array.isArray(data) ? data : []);
      } catch {}
      setLoading(false);
    };
    load();
  }, []);

  const statusIcon = (status: string) => {
    if (status === 'paid' || status === 'pago') return <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: COLORS.success }}><CheckCircle size={14} />{t('paid')}</span>;
    if (status === 'pending' || status === 'pendente') return <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: COLORS.warning }}><Clock size={14} />{t('pending')}</span>;
    if (status === 'overdue' || status === 'atrasado') return <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: COLORS.error }}><AlertTriangle size={14} />{lang === 'pt' ? 'Atrasado' : 'Overdue'}</span>;
    return <span style={{ color: COLORS.textSecondary }}>{status}</span>;
  };

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '256px', color: COLORS.textSecondary }}>{t('loading')}</div>;

  // Calculate summary
  const totalPaid = payments.filter(p => p.status === 'paid' || p.status === 'pago').reduce((s, p) => s + (p.amount || p.value || 0), 0);
  const totalPending = payments.filter(p => p.status === 'pending' || p.status === 'pendente').reduce((s, p) => s + (p.amount || p.value || 0), 0);
  const totalOverdue = payments.filter(p => p.status === 'overdue' || p.status === 'atrasado').reduce((s, p) => s + (p.amount || p.value || 0), 0);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <CreditCard size={24} style={{ color: COLORS.primary }} />
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: COLORS.textPrimary, fontFamily: "'Poppins', 'Inter', sans-serif" }}>{t('paymentsTitle')}</h1>
      </div>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div style={{ background: 'white', borderRadius: '16px', padding: '16px', border: '1px solid #EEEEEE' }}>
          <p style={{ fontSize: '14px', color: COLORS.textSecondary }}>{lang === 'pt' ? 'Total Pago' : 'Total Paid'}</p>
          <p style={{ fontSize: '18px', fontWeight: 700, color: COLORS.success }}>EUR {totalPaid.toFixed(2)}</p>
        </div>
        <div style={{ background: 'white', borderRadius: '16px', padding: '16px', border: '1px solid #EEEEEE' }}>
          <p style={{ fontSize: '14px', color: COLORS.textSecondary }}>{t('pending')}</p>
          <p style={{ fontSize: '18px', fontWeight: 700, color: COLORS.warning }}>EUR {totalPending.toFixed(2)}</p>
        </div>
        <div style={{ background: 'white', borderRadius: '16px', padding: '16px', border: '1px solid #EEEEEE' }}>
          <p style={{ fontSize: '14px', color: COLORS.textSecondary }}>{lang === 'pt' ? 'Atrasado' : 'Overdue'}</p>
          <p style={{ fontSize: '18px', fontWeight: 700, color: COLORS.error }}>EUR {totalOverdue.toFixed(2)}</p>
        </div>
      </div>

      {payments.length === 0 ? (
        <div style={{ background: 'white', borderRadius: '16px', padding: '32px', textAlign: 'center', border: '1px solid #EEEEEE' }}>
          <CreditCard size={48} style={{ color: '#D0D0D0', margin: '0 auto 12px' }} />
          <p style={{ color: COLORS.textSecondary }}>{t('noPayments')}</p>
        </div>
      ) : (
        <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #EEEEEE', overflow: 'hidden' }}>
          <table style={{ width: '100%', fontSize: '14px' }}>
            <thead style={{ background: '#F5F5F0', borderBottom: `1px solid #EEEEEE` }}>
              <tr>
                <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 500, color: COLORS.textSecondary }}>{lang === 'pt' ? 'Data' : 'Date'}</th>
                <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 500, color: COLORS.textSecondary }}>{lang === 'pt' ? 'Descricao' : 'Description'}</th>
                <th style={{ textAlign: 'right', padding: '12px 16px', fontWeight: 500, color: COLORS.textSecondary }}>{t('amount')}</th>
                <th style={{ textAlign: 'center', padding: '12px 16px', fontWeight: 500, color: COLORS.textSecondary }}>Status</th>
              </tr>
            </thead>
            <tbody style={{ borderTop: `1px solid #EEEEEE` }}>
              {payments.map((p: any, i: number) => (
                <tr key={p.id || i} style={{ borderBottom: `1px solid #EEEEEE`, background: i % 2 === 0 ? 'white' : '#FAFAF8' }}>
                  <td style={{ padding: '12px 16px', color: COLORS.textPrimary }}>{p.date || p.due_date ? new Date(p.date || p.due_date).toLocaleDateString('pt-BR') : '-'}</td>
                  <td style={{ padding: '12px 16px', color: COLORS.textPrimary }}>{p.description || p.reference || `Pagamento #${p.id}`}</td>
                  <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 500, color: COLORS.textPrimary }}>EUR {Number(p.amount || p.value || 0).toFixed(2)}</td>
                  <td style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px' }}>{statusIcon(p.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
