import React, { useEffect, useState } from 'react';
import { getAlerts, markAlertRead, markAllAlertsRead, generateAlerts } from '../services/api';
import { Alert } from '../types';
import StatusBadge from '../components/StatusBadge';
import { Bell, Check, CheckCheck, RefreshCw, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Alerts() {
  const [items, setItems] = useState<Alert[]>([]);
  const [filterSeverity, setFilterSeverity] = useState('');
  const [showUnread, setShowUnread] = useState(false);
  const navigate = useNavigate();

  const load = () => {
    const params: any = {};
    if (filterSeverity) params.severity = filterSeverity;
    if (showUnread) params.unread_only = true;
    getAlerts(params).then(r => setItems(r.data));
  };

  useEffect(() => { load(); }, [filterSeverity, showUnread]);

  const handleMarkRead = async (id: number) => { await markAlertRead(id); load(); };
  const handleMarkAll = async () => { await markAllAlertsRead(); load(); };
  const handleGenerate = async () => { await generateAlerts(); load(); };

  const severityIcon: Record<string, string> = { info: '🔵', warning: '🟡', critical: '🔴' };

  const navigateToEntity = (a: Alert) => {
    if (!a.entity_type || !a.entity_id) return;
    if (a.entity_type === 'client') navigate(`/clientes/${a.entity_id}`);
    else if (a.entity_type === 'property') navigate(`/propriedades/${a.entity_id}`);
    else if (a.entity_type === 'contract') navigate(`/contratos`);
  };

  const typeLabels: Record<string, string> = {
    contrato_vencendo: 'Contrato',
    checkout_proximo: 'Check-out',
    propriedade_vazia: 'Propriedade',
    documento_pendente: 'Documento',
    aluguel_fixo_pendente: 'Aluguel',
    pagamento_atrasado: 'Pagamento',
    propriedade_atencao: 'Atencao',
    despesa_acima_media: 'Despesa',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2"><Bell size={24} /> Alertas</h1>
        <div className="flex gap-2">
          <button onClick={handleGenerate} className="btn-secondary flex items-center gap-2"><RefreshCw size={16} /> Gerar Alertas</button>
          <button onClick={handleMarkAll} className="btn-secondary flex items-center gap-2"><CheckCheck size={16} /> Marcar Todos Lidos</button>
        </div>
      </div>

      <div className="card flex flex-wrap gap-4 items-center">
        <select value={filterSeverity} onChange={e => setFilterSeverity(e.target.value)} className="select-field w-36">
          <option value="">Todas severidades</option>
          <option value="info">Info</option><option value="warning">Warning</option><option value="critical">Critical</option>
        </select>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={showUnread} onChange={e => setShowUnread(e.target.checked)} className="w-4 h-4" />
          <span className="text-sm">Somente nao lidos</span>
        </label>
        <span className="ml-auto text-sm text-gray-500">{items.length} alertas</span>
      </div>

      <div className="space-y-2">
        {items.map(a => (
          <div key={a.id} className={`card flex items-center gap-4 ${a.read ? 'opacity-60' : ''}`}>
            <span className="text-xl">{severityIcon[a.severity] || '⚪'}</span>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-medium">
                  {typeLabels[a.type] || a.type}
                </span>
              </div>
              <p className={`text-sm ${a.read ? 'text-gray-500' : 'text-gray-800 font-medium'}`}>{a.message}</p>
              <p className="text-xs text-gray-400 mt-1">{a.created_at ? new Date(a.created_at).toLocaleString('pt-BR') : ''}</p>
            </div>
            <StatusBadge status={a.severity} />
            {a.entity_type && a.entity_id && (
              <button
                onClick={() => navigateToEntity(a)}
                className="text-blue-500 hover:text-blue-700"
                title="Ver detalhes"
              >
                <ExternalLink size={16} />
              </button>
            )}
            {!a.read && (
              <button onClick={() => handleMarkRead(a.id)} className="text-blue-500 hover:text-blue-700" title="Marcar como lido">
                <Check size={18} />
              </button>
            )}
          </div>
        ))}
        {items.length === 0 && <div className="card text-center text-gray-400 py-12">Nenhum alerta encontrado</div>}
      </div>
    </div>
  );
}
