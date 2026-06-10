import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getClientProfile, createRemark, deleteRemark, sendContractEmail, updateClient, getProperties, getRooms, uploadDocument, deleteDocument, getClientHistory, downloadContractPdf, createContract, generateSignLink, sendContractByEmail, deleteContract } from '../services/api';
import Modal from '../components/Modal';
import FileUpload from '../components/FileUpload';
import StatusBadge from '../components/StatusBadge';
import KPICard from '../components/KPICard';
import { ArrowLeft, User, FileText, DollarSign, Home, Calendar, Mail, Phone, Globe, CreditCard, StickyNote, Send, Trash2, Plus, MessageSquare, BedDouble, Edit2, Download, FileDown, Clock, LogIn, LogOut as LogOutIcon, FileSignature, Tag, Link2 } from 'lucide-react';

const fmt = (v: number) => `€${(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function ClientProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newRemark, setNewRemark] = useState('');
  const [remarkLoading, setRemarkLoading] = useState(false);

  // Edit accommodation modal
  const [showAccomModal, setShowAccomModal] = useState(false);
  const [properties, setProperties] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [accomForm, setAccomForm] = useState<any>({ property_id: '', room_id: '', bed_id: '' });

  // History timeline
  const [history, setHistory] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  // Edit full client modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState<any>({});

  // Email contract modal
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailContractId, setEmailContractId] = useState<number | null>(null);
  const [emailForm, setEmailForm] = useState({ to_email: '', subject: '', message: '' });
  const [emailResult, setEmailResult] = useState<any>(null);
  const [emailSending, setEmailSending] = useState(false);

  // New contract modal
  const [showContractModal, setShowContractModal] = useState(false);
  const [contractForm, setContractForm] = useState<any>({
    type: 'hospedagem', property_id: '', start_date: '', end_date: '',
    value: 0, status: 'pendente', signed: false, notes: ''
  });

  const loadProfile = () => {
    if (!id) return;
    setLoading(true);
    getClientProfile(Number(id))
      .then(r => { setData(r.data); setLoading(false); })
      .catch(() => { setError('Erro ao carregar perfil do cliente'); setLoading(false); });
  };

  useEffect(() => { loadProfile(); }, [id]);

  useEffect(() => {
    if (id) getClientHistory(Number(id)).then(r => setHistory(r.data.events || [])).catch(() => {});
  }, [id]);

  // Load properties & rooms for edit modals
  useEffect(() => {
    getProperties().then(r => setProperties(r.data));
    getRooms().then(r => setRooms(r.data));
  }, []);

  const handleAddRemark = async () => {
    if (!newRemark.trim() || !id) return;
    setRemarkLoading(true);
    try {
      await createRemark(Number(id), newRemark.trim());
      setNewRemark('');
      loadProfile();
    } catch (err) {
      alert('Erro ao adicionar observacao');
    }
    setRemarkLoading(false);
  };

  const handleDeleteRemark = async (remarkId: number) => {
    if (!id || !confirm('Remover esta observacao?')) return;
    await deleteRemark(Number(id), remarkId);
    loadProfile();
  };

  const handleCopySignLink = async (contractId: number) => {
    try {
      const res = await generateSignLink(contractId);
      const token = res.data.sign_token;
      const link = `${window.location.origin}/sign/${token}`;
      try {
        await navigator.clipboard.writeText(link);
        alert(`Link copiado!\n\n${link}\n\nEnvie este link para o cliente assinar o contrato.`);
      } catch {
        prompt('Copie o link abaixo e envie para o cliente:', link);
      }
    } catch (err: any) {
      const detail = err.response?.data?.detail || err.message || 'Erro desconhecido';
      alert(`Erro ao gerar link de assinatura: ${detail}`);
    }
  };

  const handleDeleteContract = async (contractId: number) => {
    if (!confirm('Tem certeza que deseja excluir este contrato? Esta ação não pode ser desfeita.')) return;
    try {
      await deleteContract(contractId);
      loadProfile();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Erro ao excluir contrato');
    }
  };

  const openEmailModal = (ct: any) => {
    setEmailContractId(ct.id);
    setEmailForm({
      to_email: data?.email || '',
      subject: `Contrato Ferri Sistem - ${data?.name || ''} - ${ct.property_name || ''}`,
      message: ''
    });
    setEmailResult(null);
    setShowEmailModal(true);
  };

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailContractId || emailSending) return;
    setEmailSending(true);
    try {
      const res = await sendContractByEmail(emailContractId, emailForm);
      setEmailResult(res.data);
    } catch (err: any) {
      setEmailResult({ success: false, message: err.response?.data?.detail || err.response?.data?.message || `Erro ao enviar: ${err.message}` });
    } finally {
      setEmailSending(false);
    }
  };

  // Open accommodation quick-edit modal
  const openAccomEdit = () => {
    setAccomForm({
      property_id: data?.property_id || '',
      room_id: data?.room_id || '',
      bed_id: data?.bed_id || ''
    });
    setShowAccomModal(true);
  };

  const handleAccomSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    await updateClient(Number(id), {
      property_id: accomForm.property_id ? Number(accomForm.property_id) : null,
      room_id: accomForm.room_id ? Number(accomForm.room_id) : null,
      bed_id: accomForm.bed_id ? Number(accomForm.bed_id) : null
    });
    setShowAccomModal(false);
    loadProfile();
  };

  // Open full edit modal
  const openFullEdit = () => {
    setEditForm({
      name: data?.name || '',
      email: data?.email || '',
      phone: data?.phone || '',
      nationality: data?.nationality || '',
      birth_date: data?.birth_date || '',
      document_id: data?.document_id || '',
      referencia: data?.referencia || '',
      status: data?.status || 'ativo',
      property_id: data?.property_id || '',
      room_id: data?.room_id || '',
      bed_id: data?.bed_id || '',
      check_in: data?.check_in || '',
      check_out: data?.check_out || '',
      monthly_value: data?.monthly_value || 0,
      payment_method: data?.payment_method || '',
      notes: data?.notes || ''
    });
    setShowEditModal(true);
  };

  const handleFullSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    const payload = {
      ...editForm,
      property_id: editForm.property_id ? Number(editForm.property_id) : null,
      room_id: editForm.room_id ? Number(editForm.room_id) : null,
      bed_id: editForm.bed_id ? Number(editForm.bed_id) : null,
      birth_date: editForm.birth_date || null,
      check_in: editForm.check_in || null,
      check_out: editForm.check_out || null
    };
    await updateClient(Number(id), payload);
    setShowEditModal(false);
    loadProfile();
  };

  // Open contract creation modal
  const openContractModal = () => {
    setContractForm({
      type: 'hospedagem',
      property_id: data?.property_id || '',
      start_date: data?.check_in || '',
      end_date: data?.check_out || '',
      value: data?.monthly_value || 0,
      status: 'pendente',
      signed: false,
      notes: ''
    });
    setShowContractModal(true);
  };

  const handleCreateContract = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    try {
      await createContract({
        ...contractForm,
        client_id: Number(id),
        property_id: contractForm.property_id ? Number(contractForm.property_id) : null,
        start_date: contractForm.start_date || null,
        end_date: contractForm.end_date || null,
      });
      setShowContractModal(false);
      loadProfile();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Erro ao criar contrato');
    }
  };

  // Cascading filter helpers
  const getFilteredRooms = (propId: any) => {
    if (!propId) return rooms;
    return rooms.filter((r: any) => r.property_id === Number(propId));
  };

  const getFilteredBeds = (roomId: any) => {
    const room = rooms.find((r: any) => r.id === Number(roomId));
    return room?.beds || [];
  };

  // Find names for display
  const getRoomName = () => {
    if (!data?.room_id) return null;
    const r = rooms.find((rm: any) => rm.id === data.room_id);
    return r?.name || null;
  };
  const getBedName = () => {
    if (!data?.bed_id || !data?.room_id) return null;
    const r = rooms.find((rm: any) => rm.id === data.room_id);
    const b = r?.beds?.find((bd: any) => bd.id === data.bed_id);
    return b?.name || null;
  };

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-400">Carregando...</div>;
  if (error) return <div className="text-center py-8 text-red-500">{error}</div>;
  if (!data) return null;

  const contractTypeMap: Record<string, string> = {
    aluguel: 'Aluguel', hospedagem: 'Hospedagem', parceria: 'Parceria'
  };

  const roomName = getRoomName();
  const bedName = getBedName();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/clientes')} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">
              {data.name?.charAt(0)?.toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                {data.code && <span className="text-blue-500 font-mono text-lg mr-2">{data.code}</span>}
                {data.name}
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <StatusBadge status={data.status} />
                {data.property_name && (
                  <Link to={`/propriedades/${data.property_id}`} className="text-sm text-blue-600 hover:underline flex items-center gap-1">
                    <Home size={14} /> {data.property_name}
                  </Link>
                )}
                {roomName && (
                  <span className="text-sm text-gray-500 flex items-center gap-1">
                    <BedDouble size={14} /> {roomName}{bedName ? ` / ${bedName}` : ''}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
        <button onClick={openFullEdit} className="btn-secondary flex items-center gap-2">
          <Edit2 size={16} /> Editar
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4">
        <KPICard title="Total Recebido" value={fmt(data.total_received)} color="green" />
        <KPICard title="Total Esperado" value={fmt(data.total_expected)} color="blue" />
        <KPICard title="Saldo" value={fmt(data.balance)} color={data.balance >= 0 ? 'green' : 'red'} />
        <KPICard title="Valor Mensal" value={fmt(data.monthly_value)} color="purple" />
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Left Column - Dados Pessoais + Acomodação + Remarks */}
        <div className="col-span-1 space-y-6">
          {/* Dados Pessoais */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <User size={18} className="text-blue-600" /> Dados Pessoais
            </h2>
            <div className="space-y-3">
              <InfoRow icon={<Mail size={15} />} label="Email" value={data.email} />
              <InfoRow icon={<Phone size={15} />} label="Telefone" value={data.phone} />
              <InfoRow icon={<Globe size={15} />} label="Nacionalidade" value={data.nationality} />
              <InfoRow icon={<FileText size={15} />} label="Documento" value={data.document_id} />
              <InfoRow icon={<Tag size={15} />} label="Referência" value={data.referencia} />
              <InfoRow icon={<Calendar size={15} />} label="Nascimento" value={data.birth_date} />
              <InfoRow icon={<CreditCard size={15} />} label="Pagamento" value={data.payment_method} />
              <InfoRow icon={<Calendar size={15} />} label="Check-in" value={data.check_in} />
              <InfoRow icon={<Calendar size={15} />} label="Check-out" value={data.check_out} />
              {data.notes && (
                <div className="pt-2 border-t border-gray-100">
                  <div className="flex items-start gap-2 text-sm">
                    <StickyNote size={15} className="text-gray-400 mt-0.5" />
                    <div>
                      <span className="text-gray-500">Notas</span>
                      <p className="text-gray-700 mt-1">{data.notes}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Acomodação */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <BedDouble size={18} className="text-blue-600" /> Acomodação
              </h2>
              <button onClick={openAccomEdit} className="text-blue-500 hover:text-blue-700 text-sm flex items-center gap-1">
                <Edit2 size={14} /> Alterar
              </button>
            </div>
            <div className="space-y-3">
              <InfoRow icon={<Home size={15} />} label="Propriedade" value={data.property_name} />
              <InfoRow icon={<BedDouble size={15} />} label="Quarto" value={roomName} />
              <InfoRow icon={<BedDouble size={15} />} label="Cama" value={bedName} />
            </div>
            {!data.property_id && !data.room_id && (
              <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-700">Cliente sem acomodação atribuída.</p>
                <button onClick={openAccomEdit} className="text-sm text-blue-600 hover:underline mt-1">Atribuir agora</button>
              </div>
            )}
          </div>

          {/* Remarks / Observacoes */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <MessageSquare size={18} className="text-blue-600" /> Observações ({data.remarks?.length || 0})
            </h2>
            <div className="flex gap-2 mb-4">
              <textarea
                value={newRemark}
                onChange={e => setNewRemark(e.target.value)}
                placeholder="Escrever observação..."
                className="input-field flex-1 text-sm"
                rows={2}
              />
              <button
                onClick={handleAddRemark}
                disabled={remarkLoading || !newRemark.trim()}
                className="btn-primary self-end px-3 py-2 disabled:opacity-50"
              >
                <Plus size={16} />
              </button>
            </div>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {data.remarks && data.remarks.map((r: any) => (
                <div key={r.id} className="bg-gray-50 rounded-lg p-3 relative group">
                  <p className="text-sm text-gray-700">{r.text}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-gray-400">
                      {r.created_by} • {r.created_at?.split('T')[0]}
                    </span>
                    <button
                      onClick={() => handleDeleteRemark(r.id)}
                      className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
              {(!data.remarks || data.remarks.length === 0) && (
                <p className="text-gray-400 text-sm">Nenhuma observação</p>
              )}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="col-span-2 space-y-6">
          {/* Contratos */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <FileText size={18} className="text-blue-600" /> Contratos ({data.contracts?.length || 0})
              </h2>
              <button onClick={openContractModal} className="btn-primary flex items-center gap-2 text-sm px-3 py-1.5">
                <Plus size={14} /> Novo Contrato
              </button>
            </div>
            {data.contracts && data.contracts.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="table-header">Tipo</th>
                      <th className="table-header">Propriedade</th>
                      <th className="table-header">Inicio</th>
                      <th className="table-header">Fim</th>
                      <th className="table-header text-right">Valor</th>
                      <th className="table-header">Status</th>
                      <th className="table-header">Assinado</th>
                      <th className="table-header w-20">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {data.contracts.map((ct: any) => (
                      <tr key={ct.id} className="hover:bg-gray-50">
                        <td className="table-cell">{contractTypeMap[ct.type] || ct.type}</td>
                        <td className="table-cell">{ct.property_name || '-'}</td>
                        <td className="table-cell">{ct.start_date || '-'}</td>
                        <td className="table-cell">{ct.end_date || '-'}</td>
                        <td className="table-cell text-right font-medium">{fmt(ct.value || 0)}</td>
                        <td className="table-cell"><StatusBadge status={ct.status} /></td>
                        <td className="table-cell">{ct.signed ? '✓ Sim' : '✗ Não'}</td>
                        <td className="table-cell">
                          <div className="flex gap-1.5">
                            <button
                              onClick={() => handleCopySignLink(ct.id)}
                              className="text-orange-500 hover:text-orange-700"
                              title="Copiar Link de Assinatura"
                            >
                              <Link2 size={14} />
                            </button>
                            <button
                              onClick={async () => {
                                try {
                                  const res = await downloadContractPdf(ct.id);
                                  const blob = new Blob([res.data], { type: 'application/pdf' });
                                  const url = window.URL.createObjectURL(blob);
                                  const a = document.createElement('a');
                                  a.href = url;
                                  a.download = `contrato_${ct.id}.pdf`;
                                  a.click();
                                } catch { alert('Erro ao gerar PDF'); }
                              }}
                              className="text-blue-500 hover:text-blue-700"
                              title="Baixar PDF"
                            >
                              <FileDown size={14} />
                            </button>
                            <button
                              onClick={() => openEmailModal(ct)}
                              className="text-green-500 hover:text-green-700"
                              title="Enviar por Email"
                            >
                              <Send size={14} />
                            </button>
                            <button
                              onClick={() => handleDeleteContract(ct.id)}
                              className="text-red-500 hover:text-red-700"
                              title="Excluir Contrato"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-400 text-sm">Nenhum contrato encontrado</p>
            )}
          </div>

          {/* Pagamentos do Cliente */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <DollarSign size={18} className="text-blue-600" /> Pagamentos ({data.payments?.length || 0})
            </h2>
            {data.payments && data.payments.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="table-header">Data</th>
                      <th className="table-header">Descrição</th>
                      <th className="table-header">Método</th>
                      <th className="table-header text-right">Bank</th>
                      <th className="table-header text-right">Rent</th>
                      <th className="table-header text-right">Depósito</th>
                      <th className="table-header text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {data.payments.map((p: any) => (
                      <tr key={p.id} className="hover:bg-gray-50">
                        <td className="table-cell">{p.date}</td>
                        <td className="table-cell">{p.description || '-'}</td>
                        <td className="table-cell">{p.method || '-'}</td>
                        <td className="table-cell text-right font-bold text-green-600">{fmt(p.amount)}</td>
                      </tr>
                    ))}
                    <tr className="bg-gray-50 font-bold">
                      <td className="table-cell" colSpan={6}>TOTAL</td>
                      <td className="table-cell text-right text-green-600">{fmt(data.total_received)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-400 text-sm">Nenhum pagamento registrado para este cliente</p>
            )}
          </div>

          {/* Resumo Financeiro Mensal */}
          {data.financial_by_month && data.financial_by_month.length > 0 && (
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <DollarSign size={18} className="text-blue-600" /> Resumo Mensal
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="table-header">Período</th>
                      <th className="table-header text-right">Receita</th>
                      <th className="table-header text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {data.financial_by_month.map((row: any, i: number) => (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="table-cell font-medium">{row.label}</td>
                        <td className="table-cell text-right">{fmt(row.revenue || row.total_revenue || 0)}</td>
                        <td className="table-cell text-right font-bold text-green-600">{fmt(row.total_revenue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Timeline / Historico */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <Clock size={18} className="text-blue-600" /> Historico ({history.length})
              </h2>
              <button onClick={() => setShowHistory(!showHistory)} className="text-sm text-blue-500 hover:text-blue-700">
                {showHistory ? 'Ocultar' : 'Ver tudo'}
              </button>
            </div>
            <div className="space-y-0">
              {(showHistory ? history : history.slice(0, 6)).map((ev: any, i: number) => {
                const iconMap: Record<string, React.ReactNode> = {
                  'user-plus': <User size={14} />,
                  'log-in': <LogIn size={14} />,
                  'log-out': <LogOutIcon size={14} />,
                  'file-signature': <FileSignature size={14} />,
                  'dollar-sign': <DollarSign size={14} />,
                  'file': <FileText size={14} />,
                  'message-circle': <MessageSquare size={14} />,
                };
                const colorMap: Record<string, string> = {
                  blue: 'bg-blue-100 text-blue-600',
                  green: 'bg-green-100 text-green-600',
                  orange: 'bg-orange-100 text-orange-600',
                  purple: 'bg-purple-100 text-purple-600',
                  slate: 'bg-gray-100 text-gray-600',
                  yellow: 'bg-yellow-100 text-yellow-600',
                  red: 'bg-red-100 text-red-600',
                };
                return (
                  <div key={i} className="flex gap-3 pb-4 relative">
                    {i < (showHistory ? history.length : Math.min(history.length, 6)) - 1 && (
                      <div className="absolute left-[15px] top-8 bottom-0 w-px bg-gray-200"></div>
                    )}
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${colorMap[ev.color] || 'bg-gray-100 text-gray-500'}`}>
                      {iconMap[ev.icon] || <Clock size={14} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800">{ev.title}</p>
                      <p className="text-xs text-gray-500 truncate">{ev.description}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{ev.date ? new Date(ev.date).toLocaleDateString('pt-BR') : ''}</p>
                    </div>
                  </div>
                );
              })}
              {history.length === 0 && <p className="text-gray-400 text-sm">Nenhum evento registrado</p>}
            </div>
          </div>

          {/* Documentos */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <FileText size={18} className="text-blue-600" /> Documentos ({data.documents?.length || 0})
            </h2>
            <FileUpload
              onUpload={async (file, category, docType) => {
                await uploadDocument(file, 'client', Number(id), category, docType);
                loadProfile();
              }}
              categories={['Contrato', 'Passaporte', 'Comprovante', 'Foto', 'Outro']}
            />
            {data.documents && data.documents.length > 0 && (
              <div className="space-y-2 mt-3">
                {data.documents.map((doc: any) => (
                  <div key={doc.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg group">
                    <FileText size={16} className="text-gray-400" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-700 truncate">{doc.name}</p>
                      <p className="text-xs text-gray-400">{doc.category || doc.type || 'Documento'}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-gray-400">{doc.uploaded_at?.split('T')[0]}</span>
                      {doc.file_url && (
                        <a href={doc.file_url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-600" title="Baixar">
                          <Download size={14} />
                        </a>
                      )}
                      <button onClick={async () => { if (confirm('Remover documento?')) { await deleteDocument(doc.id); loadProfile(); } }} className="text-red-300 hover:text-red-500 opacity-0 group-hover:opacity-100">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal Alterar Acomodação */}
      <Modal isOpen={showAccomModal} onClose={() => setShowAccomModal(false)} title="Alterar Acomodação" size="lg">
        <form onSubmit={handleAccomSave} className="space-y-4">
          <div>
            <label className="label">Propriedade</label>
            <select value={accomForm.property_id} onChange={e => setAccomForm({...accomForm, property_id: e.target.value, room_id: '', bed_id: ''})} className="select-field">
              <option value="">Sem propriedade</option>
              {properties.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Quarto</label>
            <select value={accomForm.room_id} onChange={e => setAccomForm({...accomForm, room_id: e.target.value, bed_id: ''})} className="select-field" disabled={!accomForm.property_id}>
              <option value="">Sem quarto</option>
              {getFilteredRooms(accomForm.property_id).map((r: any) => (
                <option key={r.id} value={r.id}>
                  {r.name} ({r.room_type}) {r.monthly_value > 0 ? `- €${r.monthly_value}` : ''}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Cama</label>
            <select value={accomForm.bed_id} onChange={e => setAccomForm({...accomForm, bed_id: e.target.value})} className="select-field" disabled={!accomForm.room_id}>
              <option value="">Sem cama específica</option>
              {getFilteredBeds(accomForm.room_id).map((b: any) => (
                <option key={b.id} value={b.id}>
                  {b.name} {b.monthly_value > 0 ? `- €${b.monthly_value}` : ''} {b.occupant_name ? `(ocupada: ${b.occupant_name})` : '(disponível)'}
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowAccomModal(false)} className="btn-secondary">Cancelar</button>
            <button type="submit" className="btn-primary">Salvar</button>
          </div>
        </form>
      </Modal>

      {/* Modal Editar Cliente Completo */}
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title={`Editar: ${data.name}`} size="xl">
        <form onSubmit={handleFullSave} className="grid grid-cols-3 gap-4">
          <div><label className="label">Nome *</label><input value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} className="input-field" required /></div>
          <div><label className="label">Email</label><input type="email" value={editForm.email} onChange={e => setEditForm({...editForm, email: e.target.value})} className="input-field" /></div>
          <div><label className="label">Telefone</label><input value={editForm.phone} onChange={e => setEditForm({...editForm, phone: e.target.value})} className="input-field" /></div>
          <div><label className="label">Nacionalidade</label><input value={editForm.nationality} onChange={e => setEditForm({...editForm, nationality: e.target.value})} className="input-field" /></div>
          <div><label className="label">Data Nascimento</label><input type="date" value={editForm.birth_date} onChange={e => setEditForm({...editForm, birth_date: e.target.value})} className="input-field" /></div>
          <div><label className="label">Documento (ID)</label><input value={editForm.document_id} onChange={e => setEditForm({...editForm, document_id: e.target.value})} className="input-field" /></div>
          <div className="col-span-3"><label className="label">Referência</label><input value={editForm.referencia} onChange={e => setEditForm({...editForm, referencia: e.target.value})} className="input-field" placeholder="Ex: Indicação do João, Facebook, Site, etc." /></div>

          <div className="col-span-3 border-t pt-4 mt-2">
            <h3 className="font-semibold text-gray-700 mb-3">Acomodação</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="label">Propriedade</label>
                <select value={editForm.property_id} onChange={e => setEditForm({...editForm, property_id: e.target.value, room_id: '', bed_id: ''})} className="select-field">
                  <option value="">Selecionar...</option>
                  {properties.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Quarto</label>
                <select value={editForm.room_id} onChange={e => setEditForm({...editForm, room_id: e.target.value, bed_id: ''})} className="select-field" disabled={!editForm.property_id}>
                  <option value="">Selecionar...</option>
                  {getFilteredRooms(editForm.property_id).map((r: any) => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Cama</label>
                <select value={editForm.bed_id} onChange={e => setEditForm({...editForm, bed_id: e.target.value})} className="select-field" disabled={!editForm.room_id}>
                  <option value="">Selecionar...</option>
                  {getFilteredBeds(editForm.room_id).map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div><label className="label">Check-in</label><input type="date" value={editForm.check_in} onChange={e => setEditForm({...editForm, check_in: e.target.value})} className="input-field" /></div>
          <div><label className="label">Check-out</label><input type="date" value={editForm.check_out} onChange={e => setEditForm({...editForm, check_out: e.target.value})} className="input-field" /></div>
          <div><label className="label">Valor Mensal</label><input type="number" step="0.01" value={editForm.monthly_value} onChange={e => setEditForm({...editForm, monthly_value: Number(e.target.value)})} className="input-field" /></div>
          <div><label className="label">Metodo Pagamento</label><input value={editForm.payment_method} onChange={e => setEditForm({...editForm, payment_method: e.target.value})} className="input-field" /></div>
          <div><label className="label">Status</label>
            <select value={editForm.status} onChange={e => setEditForm({...editForm, status: e.target.value})} className="select-field">
              <option value="ativo">Ativo</option><option value="inativo">Inativo</option>
              <option value="prospecto">Prospecto</option><option value="encerrado">Encerrado</option>
            </select>
          </div>
          <div className="col-span-3"><label className="label">Notas</label><textarea value={editForm.notes} onChange={e => setEditForm({...editForm, notes: e.target.value})} className="input-field" rows={2} /></div>
          <div className="col-span-3 flex justify-end gap-3 mt-2">
            <button type="button" onClick={() => setShowEditModal(false)} className="btn-secondary">Cancelar</button>
            <button type="submit" className="btn-primary">Atualizar</button>
          </div>
        </form>
      </Modal>

      {/* Modal Novo Contrato */}
      <Modal isOpen={showContractModal} onClose={() => setShowContractModal(false)} title="Novo Contrato" size="lg">
        <form onSubmit={handleCreateContract} className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Tipo</label>
            <select value={contractForm.type} onChange={e => setContractForm({...contractForm, type: e.target.value})} className="select-field">
              <option value="hospedagem">Hospedagem</option>
              <option value="aluguel">Aluguel</option>
              <option value="parceria">Parceria</option>
            </select>
          </div>
          <div>
            <label className="label">Propriedade</label>
            <select value={contractForm.property_id} onChange={e => setContractForm({...contractForm, property_id: e.target.value})} className="select-field">
              <option value="">Selecionar...</option>
              {properties.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Data Início</label>
            <input type="date" value={contractForm.start_date} onChange={e => setContractForm({...contractForm, start_date: e.target.value})} className="input-field" />
          </div>
          <div>
            <label className="label">Data Fim</label>
            <input type="date" value={contractForm.end_date} onChange={e => setContractForm({...contractForm, end_date: e.target.value})} className="input-field" />
          </div>
          <div>
            <label className="label">Valor (EUR)</label>
            <input type="number" step="0.01" value={contractForm.value} onChange={e => setContractForm({...contractForm, value: Number(e.target.value)})} className="input-field" />
          </div>
          <div>
            <label className="label">Status</label>
            <select value={contractForm.status} onChange={e => setContractForm({...contractForm, status: e.target.value})} className="select-field">
              <option value="pendente">Pendente</option>
              <option value="vigente">Vigente</option>
              <option value="encerrado">Encerrado</option>
              <option value="cancelado">Cancelado</option>
            </select>
          </div>
          <div className="col-span-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={contractForm.signed} onChange={e => setContractForm({...contractForm, signed: e.target.checked})} className="w-4 h-4" />
              <span className="text-sm">Assinado</span>
            </label>
          </div>
          <div className="col-span-2">
            <label className="label">Notas</label>
            <textarea value={contractForm.notes} onChange={e => setContractForm({...contractForm, notes: e.target.value})} className="input-field" rows={2} />
          </div>
          <div className="col-span-2 flex justify-end gap-3 mt-2">
            <button type="button" onClick={() => setShowContractModal(false)} className="btn-secondary">Cancelar</button>
            <button type="submit" className="btn-primary">Criar Contrato</button>
          </div>
        </form>
      </Modal>

      {/* Modal Enviar Contrato por Email */}
      <Modal isOpen={showEmailModal} onClose={() => setShowEmailModal(false)} title="Enviar Contrato por Email">
        {emailResult ? (
          <div className="space-y-4">
            <div className={`p-4 rounded-lg ${emailResult.success ? 'bg-green-50 text-green-800' : 'bg-yellow-50 text-yellow-800'}`}>
              <p className="font-medium">{emailResult.success ? 'Email enviado com sucesso!' : 'Email nao enviado'}</p>
              <p className="text-sm mt-1">{emailResult.message}</p>
              {emailResult.sign_link && (
                <div className="mt-3 p-3 bg-white rounded border">
                  <p className="text-xs font-medium text-gray-600 mb-1">Link de assinatura do cliente:</p>
                  <a href={emailResult.sign_link} target="_blank" className="text-sm text-blue-600 underline break-all">{emailResult.sign_link}</a>
                  <button onClick={() => { navigator.clipboard.writeText(emailResult.sign_link); alert('Link copiado!'); }} className="ml-2 text-xs bg-gray-100 px-2 py-1 rounded hover:bg-gray-200">Copiar</button>
                </div>
              )}
            </div>
            <div className="flex justify-end">
              <button onClick={() => setShowEmailModal(false)} className="btn-primary">Fechar</button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSendEmail} className="space-y-4">
            <div>
              <label className="label">Email do destinatario</label>
              <input type="email" value={emailForm.to_email} onChange={e => setEmailForm({...emailForm, to_email: e.target.value})} className="input-field" required />
            </div>
            <div>
              <label className="label">Assunto</label>
              <input value={emailForm.subject} onChange={e => setEmailForm({...emailForm, subject: e.target.value})} className="input-field" />
            </div>
            <div>
              <label className="label">Mensagem (opcional)</label>
              <textarea value={emailForm.message} onChange={e => setEmailForm({...emailForm, message: e.target.value})} className="input-field" rows={3} placeholder="Deixe em branco para usar mensagem padrao com link de assinatura" />
            </div>
            <p className="text-xs text-gray-500 bg-gray-50 p-2 rounded">O contrato sera gerado em PDF e anexado ao email, junto com um link para o cliente assinar digitalmente.</p>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setShowEmailModal(false)} className="btn-secondary">Cancelar</button>
              <button type="submit" disabled={emailSending} className="btn-primary flex items-center gap-2 disabled:opacity-50">{emailSending ? 'Enviando...' : <><Send size={16} /> Enviar</>}</button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value?: string | null }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-gray-400">{icon}</span>
      <span className="text-gray-500 w-24">{label}</span>
      <span className="text-gray-800 font-medium">{value || '-'}</span>
    </div>
  );
}
