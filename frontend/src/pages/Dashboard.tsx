import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getDashboardKPIs, getAlerts, getPaymentSummary, getDashboardOps, getOccupancyTrend, getPnLCaixa } from '../services/api';
import api from '../services/api';
import { DashboardKPIs, Alert, PnLRow } from '../types';
import KPICard from '../components/KPICard';
import StatusBadge from '../components/StatusBadge';
import { DollarSign, TrendingUp, TrendingDown, Home, Users, PiggyBank, AlertTriangle, CreditCard, BedDouble, FileSignature, Wrench, Bell, Calendar, Clock, Check } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line, Area, AreaChart } from 'recharts';
import { useNavigate } from 'react-router-dom';

const fmt = (v: number) => v.toLocaleString('en-IE', { style: 'currency', currency: 'EUR' });

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isFinancial = user?.role === 'admin' || user?.role === 'financeiro';

  // Financial state
  const [kpis, setKpis] = useState<DashboardKPIs | null>(null);
  const [pnl, setPnl] = useState<PnLRow[]>([]);
  const [paymentSummary, setPaymentSummary] = useState<any>(null);

  // Ops state
  const [opsKpis, setOpsKpis] = useState<any>(null);
  const [occupancyTrend, setOccupancyTrend] = useState<any[]>([]);

  // Common
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [year, setYear] = useState(2026);

  // New widgets
  const [contractAlerts, setContractAlerts] = useState<any>(null);
  const [delinquency, setDelinquency] = useState<any>(null);
  const [projection, setProjection] = useState<any>(null);

  useEffect(() => {
    getAlerts({ unread_only: true }).then(r => setAlerts(r.data.slice(0, 5))).catch(() => {});
    getDashboardOps().then(r => setOpsKpis(r.data)).catch(() => {});
    getOccupancyTrend().then(r => setOccupancyTrend(r.data)).catch(() => {});
    api.get('/dashboard/contract-alerts').then(r => setContractAlerts(r.data)).catch(e => console.error('contract-alerts error:', e));

    if (isFinancial) {
      getDashboardKPIs({ year }).then(r => setKpis(r.data)).catch(() => {});
      getPnLCaixa({ year }).then(r => setPnl(r.data)).catch(() => {});
      getPaymentSummary().then(r => setPaymentSummary(r.data)).catch(() => {});
      api.get('/dashboard/delinquency').then(r => setDelinquency(r.data)).catch(e => console.error('delinquency error:', e));
      api.get('/dashboard/revenue-projection').then(r => setProjection(r.data)).catch(e => console.error('projection error:', e));
    }
  }, [year, isFinancial]);

  const chartData = pnl.map(r => ({ name: r.label, Receita: r.total_revenue, OPEX: r.total_opex, EBITDA: r.ebitda }));
  const opexByCat: Record<string, number> = {};
  pnl.forEach(r => { Object.entries(r.opex_by_category).forEach(([cat, val]) => { opexByCat[cat] = (opexByCat[cat] || 0) + val; }); });
  const pieData = Object.entries(opexByCat).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([name, value]) => ({ name, value: Math.round(value) }));
  const COLORS = ['#3b82f6', '#ef4444', '#f59e0b', '#10b981', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

  const sevColor = (s: string) => s === 'critical' ? 'bg-red-100 text-red-700' : s === 'warning' ? 'bg-yellow-100 text-yellow-700' : s === 'expired' ? 'bg-gray-200 text-gray-600' : 'bg-blue-100 text-blue-700';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        {isFinancial && (
          <select value={year} onChange={e => setYear(Number(e.target.value))} className="select-field w-32">
            <option value={2026}>2026</option><option value={2025}>2025</option>
          </select>
        )}
      </div>

      {/* Financial KPIs - Admin/Financeiro only */}
      {isFinancial && kpis && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard title="Receita Bruta" value={fmt(kpis.receita_bruta)} icon={<DollarSign size={24} />} color="blue" />
            <KPICard title="Total OPEX" value={fmt(kpis.total_opex)} icon={<TrendingDown size={24} />} color="red" />
            <KPICard title="EBITDA" value={fmt(kpis.ebitda)} subtitle={`Margem: ${kpis.margem_ebitda_pct}%`} icon={<TrendingUp size={24} />} color="green" />
            <KPICard title="Free Cash Flow" value={fmt(kpis.free_cash_flow)} subtitle={`Margem: ${kpis.margem_fcf_pct}%`} icon={<PiggyBank size={24} />} color="purple" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <KPICard title="Pro-Labore" value={fmt(kpis.pro_labore)} color="orange" />
            <KPICard title="Propriedades Ativas" value={kpis.total_properties} subtitle={`Aluguel: ${fmt(kpis.aluguel_fixo_total)}/mes`} icon={<Home size={24} />} color="slate" />
            <KPICard title="Clientes Ativos" value={kpis.total_clients} icon={<Users size={24} />} color="blue" />
          </div>
        </>
      )}

      {/* Operational KPIs - All users */}
      {!isFinancial && opsKpis && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard title="Propriedades" value={opsKpis.total_properties} icon={<Home size={24} />} color="blue" />
          <KPICard title="Clientes Ativos" value={opsKpis.total_clients} icon={<Users size={24} />} color="green" />
          <KPICard title="Check-outs Proximos" value={opsKpis.checkouts_soon} subtitle="Proximos 7 dias" icon={<BedDouble size={24} />} color="orange" />
          <KPICard title="Ocupacao" value={`${opsKpis.occupancy_rate}%`} subtitle={`${opsKpis.occupied_beds}/${opsKpis.total_beds} camas`} icon={<BedDouble size={24} />} color="purple" />
        </div>
      )}
      {!isFinancial && opsKpis && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <KPICard title="Contratos Ativos" value={opsKpis.contracts_active} icon={<FileSignature size={24} />} color="blue" />
          <KPICard title="Contratos Pendentes" value={opsKpis.contracts_pending} icon={<FileSignature size={24} />} color="orange" />
          <KPICard title="Manutencao Aberta" value={opsKpis.maintenance_open} icon={<Wrench size={24} />} color="red" />
          <KPICard title="Alertas" value={opsKpis.alerts_unread} icon={<Bell size={24} />} color="yellow" />
        </div>
      )}

      {/* Contract Expiry Alerts - All users */}
      {contractAlerts && (
        <div className={`card border-l-4 ${(contractAlerts.client_contracts?.length > 0 || contractAlerts.property_contracts?.length > 0) ? 'border-orange-400' : contractAlerts.expired_contracts?.length > 0 ? 'border-gray-400' : 'border-green-400'}`}>
          <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2"><Calendar size={18} className="text-orange-500" /> Contratos</h3>
          {(contractAlerts.client_contracts?.length > 0 || contractAlerts.property_contracts?.length > 0 || contractAlerts.expired_contracts?.length > 0) ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {contractAlerts.client_contracts?.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-2 uppercase">Vencendo em 60 dias</p>
                  <div className="space-y-2">
                    {contractAlerts.client_contracts.slice(0, 5).map((c: any) => (
                      <div key={c.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100" onClick={() => navigate(`/clientes/${c.client_id}`)}>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${sevColor(c.severity)}`}>{c.days_left}d</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{c.client_name}</p>
                          <p className="text-xs text-gray-400">{c.property_name} | Vence: {c.end_date}</p>
                        </div>
                        {isFinancial && <span className="text-xs font-medium text-gray-500">{fmt(c.value)}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {contractAlerts.expired_contracts?.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-red-500 mb-2 uppercase">Expirados (ultimos 30 dias)</p>
                  <div className="space-y-2">
                    {contractAlerts.expired_contracts.slice(0, 5).map((c: any) => (
                      <div key={c.id} className="flex items-center gap-3 p-2 bg-red-50 rounded-lg cursor-pointer hover:bg-red-100" onClick={() => navigate(`/clientes/${c.client_id}`)}>
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-red-100 text-red-700">-{c.days_ago}d</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{c.client_name}</p>
                          <p className="text-xs text-gray-400">{c.property_name} | Expirou: {c.end_date}</p>
                        </div>
                        {isFinancial && <span className="text-xs font-medium text-gray-500">{fmt(c.value)}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {contractAlerts.property_contracts?.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-2 uppercase">Contratos de Aluguel (Propriedade)</p>
                  <div className="space-y-2">
                    {contractAlerts.property_contracts.slice(0, 5).map((p: any) => (
                      <div key={p.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100" onClick={() => navigate(`/propriedades/${p.id}`)}>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${sevColor(p.severity)}`}>{p.days_left}d</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{p.property_name}</p>
                          <p className="text-xs text-gray-400">{p.landlord_name} | Vence: {p.end_date}</p>
                        </div>
                        {isFinancial && <span className="text-xs font-medium text-gray-500">{fmt(p.monthly_rent)}/mes</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-green-600 flex items-center gap-2"><Check size={16} /> Nenhum contrato vencendo nos proximos 60 dias.</p>
          )}
        </div>
      )}

      {/* Payment Summary - Financial only */}
      {isFinancial && paymentSummary && (
        <div className="card cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/pagamentos')}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-700 flex items-center gap-2"><CreditCard size={18} className="text-blue-500" /> Pagamentos do Mes</h3>
            <span className="text-xs text-blue-500 font-medium">Ver detalhes →</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div><p className="text-xs text-gray-500">Esperado</p><p className="text-sm font-bold text-gray-800">{fmt(paymentSummary.total_expected)}</p></div>
            <div><p className="text-xs text-gray-500">Recebido</p><p className="text-sm font-bold text-green-600">{fmt(paymentSummary.total_received)}</p></div>
            <div><p className="text-xs text-gray-500">Pendente</p><p className="text-sm font-bold text-red-600">{fmt(paymentSummary.total_pending)}</p></div>
            <div><p className="text-xs text-gray-500">Taxa Cobranca</p><p className="text-sm font-bold text-blue-600">{paymentSummary.collection_rate}%</p></div>
            <div className="flex gap-3">
              <span className="text-xs"><span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-1"></span>{paymentSummary.count_paid} pagos</span>
              <span className="text-xs"><span className="inline-block w-2 h-2 rounded-full bg-red-500 mr-1"></span>{paymentSummary.count_overdue} atrasados</span>
            </div>
          </div>
        </div>
      )}

      {/* Delinquency Widget - Financial only */}
      {isFinancial && delinquency && (
        <div className={`card border-l-4 ${delinquency.total_delinquents > 0 ? 'border-red-400 cursor-pointer hover:shadow-md' : 'border-green-400'} transition-shadow`}
          onClick={() => delinquency.total_delinquents > 0 && navigate('/inadimplencia')}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-700 flex items-center gap-2"><AlertTriangle size={18} className={delinquency.total_delinquents > 0 ? 'text-red-500' : 'text-green-500'} /> Inadimplencia</h3>
            {delinquency.total_delinquents > 0 && <span className="text-xs text-red-500 font-medium">Ver detalhes →</span>}
          </div>
          {delinquency.total_delinquents > 0 ? (
            <>
              <div className="grid grid-cols-3 gap-4 mb-3">
                <div><p className="text-xs text-gray-500">Clientes Devedores</p><p className="text-lg font-bold text-red-600">{delinquency.total_delinquents}</p></div>
                <div><p className="text-xs text-gray-500">Divida Total</p><p className="text-lg font-bold text-red-600">{fmt(delinquency.total_debt)}</p></div>
                <div><p className="text-xs text-gray-500">Maior Devedor</p><p className="text-sm font-bold text-red-600">{delinquency.delinquents?.[0]?.client_name || '-'}</p></div>
              </div>
              <div className="space-y-1">
                {delinquency.delinquents?.slice(0, 3).map((d: any) => (
                  <div key={d.client_id} className="flex items-center justify-between text-sm p-2 bg-red-50 rounded">
                    <span className="font-medium">{d.client_name}</span>
                    <span className="text-gray-500">{d.property_name}</span>
                    <span className="font-bold text-red-600">{fmt(d.total_debt)}</span>
                    <span className="text-xs text-gray-400">{d.months_overdue_count} mes(es)</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-sm text-green-600 flex items-center gap-2"><Check size={16} /> Todos os pagamentos estao em dia!</p>
          )}
        </div>
      )}

      {/* Revenue Projection - Financial only */}
      {isFinancial && projection && projection.projections?.length > 0 && (
        <div className="card">
          <h3 className="font-semibold text-gray-700 mb-4 flex items-center gap-2"><TrendingUp size={18} className="text-green-500" /> Projecao de Receita (12 meses)</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-xl font-bold text-green-600">{fmt(projection.current_monthly_revenue)}</div>
              <div className="text-xs text-gray-500">Receita Mensal Atual</div>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-xl font-bold text-blue-600">{fmt(projection.projected_annual_revenue)}</div>
              <div className="text-xs text-gray-500">Projecao Anual</div>
            </div>
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <div className="text-xl font-bold text-red-600">{fmt(projection.total_monthly_rent)}</div>
              <div className="text-xs text-gray-500">Aluguel Mensal</div>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <div className="text-xl font-bold text-purple-600">{fmt(projection.current_monthly_revenue - projection.total_monthly_rent)}</div>
              <div className="text-xs text-gray-500">Margem Bruta/Mes</div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={projection.projections}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={(v: number) => `€${(v/1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v: number) => fmt(v)} />
              <Area type="monotone" dataKey="projected_revenue" stroke="#10b981" fill="#d1fae5" fillOpacity={0.5} name="Receita Projetada" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Occupancy Trend - All users */}
      {occupancyTrend.length > 0 && (
        <div className="card">
          <h3 className="font-semibold text-gray-700 mb-4">Tendencia de Ocupacao (12 meses)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={occupancyTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v: number) => `${v}%`} />
              <Area type="monotone" dataKey="rate" stroke="#3b82f6" fill="#93c5fd" fillOpacity={0.3} name="Ocupacao %" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Financial Charts - Admin/Financeiro only */}
      {isFinancial && chartData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="card lg:col-span-2">
            <h3 className="font-semibold text-gray-700 mb-4">Receita vs OPEX vs EBITDA (Mensal)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v: number) => fmt(v)} />
                <Legend />
                <Bar dataKey="Receita" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="OPEX" fill="#ef4444" radius={[4, 4, 0, 0]} />
                <Bar dataKey="EBITDA" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="card">
            <h3 className="font-semibold text-gray-700 mb-4">OPEX por Categoria</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                  {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v: number) => fmt(v)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="card">
          <h3 className="font-semibold text-gray-700 mb-4 flex items-center gap-2"><AlertTriangle size={18} className="text-yellow-500" /> Alertas Recentes</h3>
          <div className="space-y-2">
            {alerts.map(a => (
              <div key={a.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <StatusBadge status={a.severity} />
                <span className="text-sm text-gray-700">{a.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
