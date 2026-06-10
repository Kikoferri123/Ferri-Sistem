import React, { useEffect, useState } from 'react';
import { getContracts, createContract, updateContract, deleteContract, getProperties, getClients, downloadContractPdf, sendContractByEmail, saveContractSignature, generateSignLink } from '../services/api';
import { Contract, Property, Client } from '../types';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';
import SignaturePad from '../components/SignaturePad';
import { Plus, Trash2, FileSignature, AlertTriangle, Edit2, FileDown, Send, PenTool, Link2 } from 'lucide-react';

const fmt = (v: number) => v.toLocaleString('en-IE', { style: 'currency', currency: 'EUR' });

export default function Contracts() {
  const [items, setItems] = useState<Contract[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [emailContractId, setEmailContractId] = useState<number | null>(null);
  const [emailForm, setEmailForm] = useState({ to_email: '', subject: '', message: '' });
  const [emailResult, setEmailResult] = useState<any>(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');
  const [showSignModal, setShowSignModal] = useState(false);
  const [signingContract, setSigningContract] = useState<Contract | null>(null);
  const [signatureType, setSignatureType] = useState<'licensee' | 'licensor'>('licensee');
  const [savingSignature, setSavingSignature] = useState(false);
  const [form, setForm] = useState<any>({
    type: 'hospedagem', client_ids: [] as number[], property_id: '', start_date: '',
    end_date: '', value: 0, status: 'pendente', signed: false, notes: ''
  });

  const load = () => {
    const params: any = {};
    if (filterStatus) params.status = filterStatus;
    if (filterType) params.type = filterType;
    getContracts(params).then(r => setItems(r.data));
  };

  useEffect(() => { load(); getProperties().then(r => setProperties(r.data)); getClients().then(r => setClients(r.data)); }, [filterStatus, filterType]);

  const resetForm = () => setForm({
    type: 'hospedagem', client_ids: [] as number[], property_id: '', start_date: '',
    end_date: '', value: 0, status: 'pendente', signed: false, notes: ''
  });

  const openCreate = () => { resetForm(); setEditingId(null); setShowModal(true); };

  const openEdit = (c: Contract) => {
    setForm({
      type: c.type, client_ids: c.client_ids || (c.client_id ? [c.client_id] : []),
      property_id: c.property_id || '',
      start_date: c.start_date || '', end_date: c.end_date || '', value: c.value,
      status: c.status, signed: c.signed, notes: c.notes || ''
    });
    setEditingId(c.id);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const clientIds = (form.client_ids || []).map(Number).filter(Boolean);
    const data = {
      ...form,
      client_id: clientIds.length > 0 ? clientIds[0] : null,
      client_ids: clientIds.length > 0 ? clientIds : null,
      property_id: form.property_id ? Number(form.property_id) : null,
      start_date: form.start_date || null,
      end_date: form.end_date || null,
      value: Number(form.value)
    };
    if (editingId) {
      await updateContract(editingId, data);
    } else {
      await createContract(data);
    }
    setShowModal(false);
    load();
  };

  const handleDelete = async (id: number) => {
    if (confirm('Remover contrato?')) { await deleteContract(id); load(); }
  };

  const handleDownloadPdf = async (id: number) => {
    try {
      const res = await downloadContractPdf(id);
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `contrato_${id}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Erro ao gerar PDF');
    }
  };

  const openEmailModal = (c: Contract) => {
    const clientNames = c.client_names && c.client_names.length > 0
      ? c.client_names.join(' & ')
      : c.client_name || '';
    const firstClient = c.clients && c.clients.length > 0
      ? c.clients[0]
      : clients.find(cl => cl.id === c.client_id);
    setEmailContractId(c.id);
    setEmailForm({
      to_email: firstClient?.email || '',
      subject: `Contrato Ferri Sistem - ${clientNames} - ${c.property_name || ''}`,
      message: ''
    });
    setEmailResult(null);
    setShowEmailModal(true);
  };

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailContractId) return;
    try {
      const res = await sendContractByEmail(emailContractId, emailForm);
      setEmailResult(res.data);
    } catch (err: any) {
      setEmailResult({ detail: err.response?.data?.detail || 'Erro ao enviar', email_sent: false });
    }
  };

  const handleCopySignLink = async (c: Contract) => {
    try {
      const res = await generateSignLink(c.id);
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

  const openSignModal = (c: Contract) => {
    setSigningContract(c);
    setSignatureType('licensee');
    setShowSignModal(true);
  };

  const handleSaveSignature = async (dataUrl: string) => {
    if (!signingContract) return;
    setSavingSignature(true);
    try {
      const payload = signatureType === 'licensee'
        ? { signature_licensee: dataUrl }
        : { signature_licensor: dataUrl };
      await saveContractSignature(signingContract.id, payload);
      load();
      if (signatureType === 'licensee') {
        setSignatureType('licensor');
      } else {
        setShowSignModal(false);
        setSigningContract(null);
      }
    } catch (err) {
      alert('Erro ao salvar assinatura');
    } finally {
      setSavingSignature(false);
    }
  };

  const today = new Date();
  const expiringSoon = items.filter(c => {
    if (c.status !== 'vigente' || !c.end_date) return false;
    const diff = (new Date(c.end_date).getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
    return diff <= 30 && diff >= 0;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2"><FileSignature size={24} /> Contratos</h1>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2"><Plus size={18} /> Novo Contrato</button>
      </div>

      {expiringSoon.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle size={20} className="text-yellow-600 mt-0.5" />
          <div>
            <p className="font-medium text-yellow-800">{expiringSoon.length} contrato(s) vencem nos proximos 30 dias</p>
            <div className="mt-2 space-y-1">{expiringSoon.map(c => (
              <p key={c.id} className="text-sm text-yellow-700">{c.client_names && c.client_names.length > 0 ? c.client_names.join(' & ') : c.client_name || c.property_name} - vence em {c.end_date}</p>
            ))}</div>
          </div>
        </div>
      )}

      <div className="card flex gap-4">
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="select-field w-36"><option value="">Todos status</option><option value="vigente">Vigente</option><option value="expirado">Expirado</option><option value="pendente">Pendente</option><option value="cancelado">Cancelado</option></select>
        <select value={filterType} onChange={e => setFilterType(e.target.value)} className="select-field w-40"><option value="">Todos tipos</option><option value="aluguel">Aluguel</option><option value="hospedagem">Hospedagem</option><option value="parceria">Parceria</option></select>
        <span className="ml-auto text-sm text-gray-500">{items.length} contrato(s)</span>
      </div>

      <div className="card overflow-x-auto p-0">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="table-header">Tipo</th>
              <th className="table-header">Propriedade</th>
              <th className="table-header">Cliente</th>
              <th className="table-header">Inicio</th>
              <th className="table-header">Fim</th>
              <th className="table-header text-right">Valor</th>
              <th className="table-header">Assinado</th>
              <th className="table-header">Status</th>
              <th className="table-header w-32">Acoes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {items.map(c => (
              <tr key={c.id} className="hover:bg-gray-50">
                <td className="table-cell capitalize">{c.type}</td>
                <td className="table-cell">{c.property_name || '-'}</td>
                <td className="table-cell">{c.client_names && c.client_names.length > 0 ? c.client_names.join(' & ') : c.client_name || '-'}</td>
                <td className="table-cell">{c.start_date || '-'}</td>
                <td className="table-cell">{c.end_date || '-'}</td>
                <td className="table-cell text-right font-medium">{fmt(c.value)}</td>
                <td className="table-cell">{c.signed ? <span className="text-green-600">Sim</span> : <span className="text-red-500">Nao</span>}</td>
                <td className="table-cell"><StatusBadge status={c.status} /></td>
                <td className="table-cell">
                  <div className="flex gap-1.5">
                    <button onClick={() => handleCopySignLink(c)} className="text-orange-500 hover:text-orange-700" title="Copiar Link de Assinatura">
                      <Link2 size={16} />
                    </button>
                    <button onClick={() => openSignModal(c)} className="text-purple-500 hover:text-purple-700" title="Assinar (Licensor)">
                      <PenTool size={16} />
                    </button>
                    <button onClick={() => handleDownloadPdf(c.id)} className="text-blue-500 hover:text-blue-700" title="Baixar PDF">
                      <FileDown size={16} />
                    </button>
                    <button onClick={() => openEmailModal(c)} className="text-green-500 hover:text-green-700" title="Enviar por Email">
                      <Send size={16} />
                    </button>
                    <button onClick={() => openEdit(c)} className="text-gray-500 hover:text-gray-700" title="Editar">
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => handleDelete(c.id)} className="text-red-400 hover:text-red-600" title="Excluir">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {items.length === 0 && <p className="text-center py-8 text-gray-400">Nenhum contrato encontrado</p>}
      </div>

      {/* Create/Edit Contract Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingId ? 'Editar Contrato' : 'Novo Contrato'} size="lg">
        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
          <div><label className="label">Tipo</label><select value={form.type} onChange={e => setForm({...form, type: e.target.value})} className="select-field"><option value="hospedagem">Hospedagem</option><option value="aluguel">Aluguel</option><option value="parceria">Parceria</option></select></div>
          <div><label className="label">Status</label><select value={form.status} onChange={e => setForm({...form, status: e.target.value})} className="select-field"><option value="pendente">Pendente</option><option value="vigente">Vigente</option><option value="expirado">Expirado</option><option value="cancelado">Cancelado</option></select></div>
          <div><label className="label">Propriedade</label><select value={form.property_id} onChange={e => setForm({...form, property_id: e.target.value})} className="select-field"><option value="">-</option>{properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
          <div>
            <label className="label">Clientes <span className="text-xs text-gray-400 font-normal">(selecione 1 ou mais)</span></label>
            <div className="border rounded-lg max-h-40 overflow-y-auto p-2 space-y-1 bg-white">
              {clients.map(c => (
                <label key={c.id} className="flex items-center gap-2 px-2 py-1 rounded hover:bg-blue-50 cursor-pointer text-sm">
                  <input
                    type="checkbox"
                    className="w-4 h-4 accent-blue-600"
                    checked={(form.client_ids || []).includes(c.id)}
                    onChange={e => {
                      const ids = form.client_ids || [];
                      if (e.target.checked) {
                        setForm({...form, client_ids: [...ids, c.id]});
                      } else {
                        setForm({...form, client_ids: ids.filter((id: number) => id !== c.id)});
                      }
                    }}
                  />
                  {c.name}
                </label>
              ))}
            </div>
            {(form.client_ids || []).length > 1 && (
              <p className="text-xs text-blue-600 mt-1">Contrato compartilhado: {(form.client_ids || []).length} pessoas</p>
            )}
          </div>
          <div><label className="label">Data Inicio</label><input type="date" value={form.start_date} onChange={e => setForm({...form, start_date: e.target.value})} className="input-field" /></div>
          <div><label className="label">Data Fim</label><input type="date" value={form.end_date} onChange={e => setForm({...form, end_date: e.target.value})} className="input-field" /></div>
          <div><label className="label">Valor (EUR)</label><input type="number" step="0.01" value={form.value} onChange={e => setForm({...form, value: e.target.value})} className="input-field" /></div>
          <div className="flex items-end"><label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={form.signed} onChange={e => setForm({...form, signed: e.target.checked})} className="w-4 h-4" /><span>Assinado</span></label></div>
          <div className="col-span-2"><label className="label">Notas</label><textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} className="input-field" rows={2} /></div>
          <div className="col-span-2 flex justify-end gap-3 mt-2">
            <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancelar</button>
            <button type="submit" className="btn-primary">{editingId ? 'Atualizar' : 'Salvar'}</button>
          </div>
        </form>
      </Modal>

      {/* Signature Modal */}
      <Modal isOpen={showSignModal} onClose={() => { setShowSignModal(false); setSigningContract(null); }} title="Assinar Contrato" size="lg">
        <div className="space-y-4">
          {signingContract && (
            <>
              <div className="bg-gray-50 rounded-lg p-3 text-sm">
                <p><strong>Cliente(s):</strong> {signingContract.client_names && signingContract.client_names.length > 0 ? signingContract.client_names.join(' & ') : signingContract.client_name || '-'}</p>
                <p><strong>Propriedade:</strong> {signingContract.property_name || '-'}</p>
                <p><strong>Periodo:</strong> {signingContract.start_date} a {signingContract.end_date}</p>
              </div>

              <div className="flex gap-2 mb-2">
                <button
                  onClick={() => setSignatureType('licensee')}
                  className={`px-3 py-1.5 text-sm rounded-md ${signatureType === 'licensee' ? 'bg-blue-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                  Assinatura do Licensee (Cliente)
                </button>
                <button
                  onClick={() => setSignatureType('licensor')}
                  className={`px-3 py-1.5 text-sm rounded-md ${signatureType === 'licensor' ? 'bg-blue-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                  Assinatura do Licensor (Ferri Sistem)
                </button>
              </div>

              {(signingContract as any)?.[`signature_${signatureType}`] && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-3">
                  <img src={(signingContract as any)[`signature_${signatureType}`]} alt="Assinatura existente" className="h-12 border rounded bg-white" />
                  <span className="text-sm text-green-700">Assinatura ja registrada. Desenhe novamente para substituir.</span>
                </div>
              )}

              <SignaturePad
                key={signatureType}
                label={signatureType === 'licensee' ? 'Assinatura do Licensee (Cliente)' : 'Assinatura do Licensor (Ferri Sistem)'}
                existingSignature={(signingContract as any)?.[`signature_${signatureType}`]}
                onSave={handleSaveSignature}
                onCancel={() => { setShowSignModal(false); setSigningContract(null); }}
              />

              {savingSignature && <p className="text-sm text-blue-600 text-center">Salvando assinatura...</p>}
            </>
          )}
        </div>
      </Modal>

      {/* Email Modal */}
      <Modal isOpen={showEmailModal} onClose={() => setShowEmailModal(false)} title="Enviar Contrato por Email">
        {emailResult ? (
          <div className="space-y-4">
            <div className={`p-4 rounded-lg ${emailResult.success ? 'bg-green-50 text-green-800' : 'bg-yellow-50 text-yellow-800'}`}>
              <p className="font-medium">{emailResult.success ? 'Email enviado com sucesso!' : 'Email nao enviado'}</p>
              <p className="text-sm mt-1">{emailResult.message}</p>
              {emailResult.pdf_url && (
                <a href={`http://localhost:8000${emailResult.pdf_url}`} target="_blank" className="text-sm text-blue-600 underline mt-2 block">
                  Baixar PDF gerado
                </a>
              )}
              {emailResult.sign_link && (
                <div className="mt-3 p-3 bg-white rounded border">
                  <p className="text-xs font-medium text-gray-600 mb-1">Link de assinatura do cliente:</p>
                  <a href={emailResult.sign_link} target="_blank" className="text-sm text-blue-600 underline break-all">
                    {emailResult.sign_link}
                  </a>
                  <button
                    onClick={() => { navigator.clipboard.writeText(emailResult.sign_link); alert('Link copiado!'); }}
                    className="ml-2 text-xs bg-gray-100 px-2 py-1 rounded hover:bg-gray-200"
                  >
                    Copiar
                  </button>
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
              <textarea value={emailForm.message} onChange={e => setEmailForm({...emailForm, message: e.target.value})} className="input-field" rows={3} placeholder="Deixe em branco para usar mensagem padrao" />
            </div>
            <p className="text-xs text-gray-500 bg-gray-50 p-2 rounded">O contrato sera gerado em PDF e anexado ao email, junto com um link para o cliente assinar digitalmente. Se o SMTP nao estiver configurado, o PDF e o link serao exibidos para envio manual.</p>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setShowEmailModal(false)} className="btn-secondary">Cancelar</button>
              <button type="submit" className="btn-primary flex items-center gap-2"><Send size={16} /> Enviar</button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
