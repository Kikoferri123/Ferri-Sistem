import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import KPICard from '../components/KPICard';
import StatusBadge from '../components/StatusBadge';
import { ArrowLeft, Building, Home, Phone, Mail, MapPin, CreditCard, FileSignature } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const fmt = (v: number) => v.toLocaleString('en-IE', { style: 'currency', currency: 'EUR' });

export default function LandlordProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    if (id) api.get(`/landlords/${id}`).then(r => setData(r.data)).catch(() => navigate('/landlords'));
  }, [id]);

  if (!data) return <div className="flex items-center justify-center h-64 text-gray-400">Carregando...</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/landlords')} className="text-gray-400 hover:text-gray-600"><ArrowLeft size={24} /></button>
        <div className="flex items-center gap-3 flex-1">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">
            {data.name?.charAt(0)?.toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              {data.code && <span className="text-purple-500 font-mono text-lg mr-2">{data.code}</span>}
              {data.name}
            </h1>
            <p className="text-sm text-gray-500">Landlord</p>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard title="Propriedades" value={String(data.total_properties)} color="blue" />
        <KPICard title="Aluguel Mensal Total" value={fmt(data.total_monthly_rent)} color="purple" />
        <KPICard title="Total Aluguel Pago" value={fmt(data.total_rent_paid)} color="red" />
        <KPICard title="Receita das Propriedades" value={fmt(data.total_revenue)} color="green" />
      </div>

      {/* Contact Info */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Informacoes de Contato</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {data.phone && (
            <div className="flex items-center gap-2 text-sm">
              <Phone size={16} className="text-gray-400" />
              <span>{data.phone}</span>
            </div>
          )}
          {data.email && (
            <div className="flex items-center gap-2 text-sm">
              <Mail size={16} className="text-gray-400" />
              <span>{data.email}</span>
            </div>
          )}
          {data.address && (
            <div className="flex items-center gap-2 text-sm">
              <MapPin size={16} className="text-gray-400" />
              <span>{data.address}</span>
            </div>
          )}
          {data.iban && (
            <div className="flex items-center gap-2 text-sm">
              <CreditCard size={16} className="text-gray-400" />
              <span className="font-mono text-xs">{data.iban}</span>
            </div>
          )}
        </div>
        {data.notes && <p className="text-sm text-gray-500 mt-3 pt-3 border-t">{data.notes}</p>}
      </div>

      {/* Properties */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2"><Home size={20} /> Propriedades ({data.properties?.length || 0})</h2>
        {data.properties?.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="table-header">Codigo</th>
                  <th className="table-header">Nome</th>
                  <th className="table-header">Endereco</th>
                  <th className="table-header">Tipo</th>
                  <th className="table-header">Status</th>
                  <th className="table-header text-right">Aluguel/mes</th>
                  <th className="table-header text-right">Aluguel Pago</th>
                  <th className="table-header text-right">Receita</th>
                  <th className="table-header text-center">Clientes</th>
                  <th className="table-header">Contrato</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.properties.map((p: any) => (
                  <tr key={p.id} className="hover:bg-blue-50 cursor-pointer transition-colors" onClick={() => navigate(`/propriedades/${p.id}`)}>
                    <td className="table-cell font-mono text-xs text-blue-500">{p.code || '-'}</td>
                    <td className="table-cell font-medium text-blue-600">{p.name}</td>
                    <td className="table-cell text-gray-500 text-sm">{p.address || '-'}</td>
                    <td className="table-cell capitalize">{p.type || '-'}</td>
                    <td className="table-cell"><StatusBadge status={p.status} /></td>
                    <td className="table-cell text-right font-medium">{fmt(p.monthly_rent)}</td>
                    <td className="table-cell text-right text-red-600">{fmt(p.rent_paid)}</td>
                    <td className="table-cell text-right text-green-600">{fmt(p.revenue)}</td>
                    <td className="table-cell text-center">{p.active_clients}</td>
                    <td className="table-cell text-xs text-gray-500">
                      {p.contract_start && p.contract_end ? `${p.contract_start} - ${p.contract_end}` : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-center py-4 text-gray-400">Nenhuma propriedade vinculada</p>
        )}
      </div>

      {/* Rent Payment History Chart */}
      {data.rent_history?.length > 0 && (
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Historico de Pagamento de Aluguel</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.rent_history}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} />
              <YAxis tickFormatter={(v: number) => `€${v}`} />
              <Tooltip formatter={(v: number) => fmt(v)} />
              <Bar dataKey="amount" fill="#8b5cf6" name="Aluguel Pago" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Contracts */}
      {data.contracts?.length > 0 && (
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2"><FileSignature size={20} /> Contratos ({data.contracts.length})</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="table-header">Tipo</th>
                  <th className="table-header">Propriedade</th>
                  <th className="table-header">Cliente</th>
                  <th className="table-header">Inicio</th>
                  <th className="table-header">Fim</th>
                  <th className="table-header text-right">Valor</th>
                  <th className="table-header">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.contracts.map((ct: any) => (
                  <tr key={ct.id}>
                    <td className="table-cell capitalize">{ct.type}</td>
                    <td className="table-cell">{ct.property_name || '-'}</td>
                    <td className="table-cell">{ct.client_name || '-'}</td>
                    <td className="table-cell">{ct.start_date || '-'}</td>
                    <td className="table-cell">{ct.end_date || '-'}</td>
                    <td className="table-cell text-right font-medium">{fmt(ct.value)}</td>
                    <td className="table-cell"><StatusBadge status={ct.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
