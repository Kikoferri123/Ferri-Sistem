import React, { useEffect, useState } from 'react';
import { getAvailability, getRooms, deleteRoom, addBed, deleteBed, getProperties, getClients } from '../services/api';
import { Building2, DoorOpen, BedDouble, Plus, Trash2, Users, ChevronDown, ChevronRight, Calendar, List } from 'lucide-react';
import Modal from '../components/Modal';

export default function AvailabilityPage() {
  const [data, setData] = useState<any[]>([]);
  const [properties, setProperties] = useState<any[]>([]);
  const [allClients, setAllClients] = useState<any[]>([]);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [showBedModal, setShowBedModal] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'map' | 'calendar'>('map');
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth());
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());
  const [calendarPropertyId, setCalendarPropertyId] = useState<number | 0>(0);
  const [bedForm, setBedForm] = useState<any>({ name: '', monthly_value: 0 });

  const load = () => {
    getAvailability().then(r => setData(r.data));
    getProperties().then(r => setProperties(r.data));
    getClients({ status: 'ativo' }).then(r => setAllClients(r.data)).catch(() => {});
  };

  useEffect(() => { load(); }, []);

  const toggle = (key: string) => setExpanded(prev => ({ ...prev, [key]: !prev[key] }));

  const handleCreateBed = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoomId) return;
    await addBed(selectedRoomId, { ...bedForm, monthly_value: Number(bedForm.monthly_value) });
    setShowBedModal(false);
    setBedForm({ name: '', monthly_value: 0 });
    load();
  };

  const handleDeleteRoom = async (id: number) => {
    if (confirm('Remover este quarto e todas as camas?')) { await deleteRoom(id); load(); }
  };

  const handleDeleteBed = async (id: number) => {
    if (confirm('Remover esta cama?')) { await deleteBed(id); load(); }
  };

  const totalCapacity = data.reduce((s, p) => s + p.total_capacity, 0);
  const totalOccupied = data.reduce((s, p) => s + p.total_occupied, 0);
  const totalAvailable = totalCapacity - totalOccupied;
  const occupancyRate = totalCapacity > 0 ? ((totalOccupied / totalCapacity) * 100).toFixed(1) : '0';

  // Calendar logic
  const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(calendarYear, calendarMonth, 1).getDay();
  const monthNames = ['Janeiro', 'Fevereiro', 'Marco', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

  const filteredClients = allClients.filter(c => {
    if (calendarPropertyId && c.property_id !== calendarPropertyId) return false;
    return true;
  });

  const getClientsForDay = (day: number) => {
    const dateStr = `${calendarYear}-${String(calendarMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const d = new Date(dateStr);
    return filteredClients.filter(c => {
      const ci = c.check_in ? new Date(c.check_in) : null;
      const co = c.check_out ? new Date(c.check_out) : null;
      if (ci && d < ci) return false;
      if (co && d > co) return false;
      if (ci) return true;
      return false;
    });
  };

  const prevMonth = () => {
    if (calendarMonth === 0) { setCalendarMonth(11); setCalendarYear(calendarYear - 1); }
    else setCalendarMonth(calendarMonth - 1);
  };
  const nextMonth = () => {
    if (calendarMonth === 11) { setCalendarMonth(0); setCalendarYear(calendarYear + 1); }
    else setCalendarMonth(calendarMonth + 1);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Mapa de Disponibilidade</h1>
        <div className="flex items-center gap-2">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('map')}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors flex items-center gap-1 ${viewMode === 'map' ? 'bg-white shadow text-blue-600 font-medium' : 'text-gray-500'}`}
            >
              <List size={16} /> Mapa
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors flex items-center gap-1 ${viewMode === 'calendar' ? 'bg-white shadow text-blue-600 font-medium' : 'text-gray-500'}`}
            >
              <Calendar size={16} /> Calendario
            </button>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4">
        <div className="card text-center">
          <p className="text-sm text-gray-500">Capacidade Total</p>
          <p className="text-2xl font-bold text-blue-600">{totalCapacity}</p>
        </div>
        <div className="card text-center">
          <p className="text-sm text-gray-500">Ocupados</p>
          <p className="text-2xl font-bold text-red-600">{totalOccupied}</p>
        </div>
        <div className="card text-center">
          <p className="text-sm text-gray-500">Disponiveis</p>
          <p className="text-2xl font-bold text-green-600">{totalAvailable}</p>
        </div>
        <div className="card text-center">
          <p className="text-sm text-gray-500">Taxa Ocupacao</p>
          <p className="text-2xl font-bold text-purple-600">{occupancyRate}%</p>
        </div>
      </div>

      {/* CALENDAR VIEW */}
      {viewMode === 'calendar' && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <button onClick={prevMonth} className="btn-secondary px-3 py-1">←</button>
              <h3 className="text-lg font-semibold text-gray-700">{monthNames[calendarMonth]} {calendarYear}</h3>
              <button onClick={nextMonth} className="btn-secondary px-3 py-1">→</button>
            </div>
            <select
              value={calendarPropertyId}
              onChange={e => setCalendarPropertyId(Number(e.target.value))}
              className="select-field w-48"
            >
              <option value={0}>Todas Propriedades</option>
              {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-lg overflow-hidden">
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'].map(d => (
              <div key={d} className="bg-gray-50 text-center text-xs font-medium text-gray-500 py-2">{d}</div>
            ))}
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <div key={`empty-${i}`} className="bg-white min-h-[80px]"></div>
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dayClients = getClientsForDay(day);
              const isToday = day === new Date().getDate() && calendarMonth === new Date().getMonth() && calendarYear === new Date().getFullYear();
              return (
                <div key={day} className={`bg-white min-h-[80px] p-1 ${isToday ? 'ring-2 ring-blue-500 ring-inset' : ''}`}>
                  <span className={`text-xs font-medium ${isToday ? 'text-blue-600' : 'text-gray-600'}`}>{day}</span>
                  <div className="mt-1 space-y-0.5">
                    {dayClients.slice(0, 3).map(c => (
                      <div key={c.id} className="text-[10px] bg-blue-100 text-blue-800 rounded px-1 py-0.5 truncate" title={`${c.name} - ${c.property_name || ''}`}>
                        {c.name.split(' ')[0]}
                      </div>
                    ))}
                    {dayClients.length > 3 && (
                      <div className="text-[10px] text-gray-400">+{dayClients.length - 3} mais</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1"><span className="w-3 h-3 bg-blue-100 rounded"></span> Cliente hospedado</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 ring-2 ring-blue-500 rounded"></span> Hoje</span>
          </div>
        </div>
      )}

      {/* MAP VIEW */}
      {viewMode === 'map' && (
        <>
          {data.map(prop => (
            <div key={prop.id} className="card p-0 overflow-hidden">
              <div
                className="flex items-center justify-between px-4 py-3 bg-gray-50 cursor-pointer hover:bg-gray-100"
                onClick={() => toggle(`prop-${prop.id}`)}
              >
                <div className="flex items-center gap-3">
                  {expanded[`prop-${prop.id}`] ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                  <Building2 size={20} className="text-blue-600" />
                  <span className="font-semibold text-gray-800">{prop.name}</span>
                  <span className="text-sm text-gray-500">({prop.type})</span>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-green-600 font-medium">{prop.total_available} livre(s)</span>
                  <span className="text-red-600 font-medium">{prop.total_occupied} ocupado(s)</span>
                  <span className="text-gray-500">{prop.rooms.length} quarto(s)</span>
                </div>
              </div>

              {expanded[`prop-${prop.id}`] && (
                <div className="p-4 space-y-3">
                  {prop.direct_clients.length > 0 && (
                    <div className="bg-yellow-50 rounded-lg p-3">
                      <p className="text-sm font-medium text-yellow-800 mb-1">Clientes diretos (sem quarto atribuido):</p>
                      {prop.direct_clients.map((c: any) => (
                        <span key={c.id} className="inline-block bg-yellow-200 text-yellow-900 text-xs px-2 py-1 rounded mr-2 mb-1">
                          {c.name} {c.check_out ? `(ate ${c.check_out})` : ''}
                        </span>
                      ))}
                    </div>
                  )}

                  {prop.rooms.map((room: any) => (
                    <div key={room.id} className="border border-gray-200 rounded-lg overflow-hidden">
                      <div
                        className="flex items-center justify-between px-4 py-2 bg-white cursor-pointer hover:bg-gray-50"
                        onClick={() => toggle(`room-${room.id}`)}
                      >
                        <div className="flex items-center gap-3">
                          {expanded[`room-${room.id}`] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                          <DoorOpen size={18} className="text-indigo-500" />
                          <span className="font-medium">{room.name}</span>
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                            {room.room_type === 'compartilhado' ? 'Compartilhado' : room.room_type === 'casa_inteira' ? 'Casa Inteira' : 'Individual'}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                          <span className={`font-medium ${room.available > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {room.available}/{room.capacity} livre(s)
                          </span>
                          <button
                            onClick={(e) => { e.stopPropagation(); setSelectedRoomId(room.id); setShowBedModal(true); }}
                            className="text-blue-500 hover:text-blue-700" title="Adicionar cama"
                          >
                            <Plus size={16} />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDeleteRoom(room.id); }}
                            className="text-red-400 hover:text-red-600" title="Remover quarto"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      {expanded[`room-${room.id}`] && (
                        <div className="px-4 py-2 bg-gray-50 space-y-2">
                          {room.room_clients.length > 0 && (
                            <div className="text-sm text-gray-600">
                              <span className="font-medium">No quarto:</span>{' '}
                              {room.room_clients.map((c: any) => (
                                <span key={c.id} className="inline-block bg-orange-100 text-orange-800 text-xs px-2 py-0.5 rounded mr-1">
                                  {c.name}
                                </span>
                              ))}
                            </div>
                          )}
                          {room.beds.length === 0 ? (
                            <p className="text-sm text-gray-400 italic">Nenhuma cama cadastrada</p>
                          ) : (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                              {room.beds.map((bed: any) => (
                                <div
                                  key={bed.id}
                                  className={`rounded-lg p-3 border ${bed.occupied ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}
                                >
                                  <div className="flex items-center justify-between mb-1">
                                    <div className="flex items-center gap-2">
                                      <BedDouble size={16} className={bed.occupied ? 'text-red-500' : 'text-green-500'} />
                                      <span className="font-medium text-sm">{bed.name}</span>
                                    </div>
                                    <button onClick={() => handleDeleteBed(bed.id)} className="text-red-400 hover:text-red-600">
                                      <Trash2 size={12} />
                                    </button>
                                  </div>
                                  {bed.occupied ? (
                                    <div className="text-xs text-red-700">
                                      <Users size={12} className="inline mr-1" />
                                      {bed.client_name}
                                      {bed.check_out && <span className="ml-1">(ate {bed.check_out})</span>}
                                    </div>
                                  ) : (
                                    <span className="text-xs text-green-700 font-medium">Disponivel</span>
                                  )}
                                  {bed.monthly_value > 0 && (
                                    <p className="text-xs text-gray-500 mt-1">EUR {bed.monthly_value}/mes</p>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}

                  {prop.rooms.length === 0 && (
                    <p className="text-sm text-gray-400 italic text-center py-4">Nenhum quarto cadastrado nesta propriedade</p>
                  )}
                </div>
              )}
            </div>
          ))}

          {data.length === 0 && (
            <div className="card text-center py-12 text-gray-400">
              Nenhuma propriedade ativa encontrada. Cadastre propriedades e quartos para ver o mapa.
            </div>
          )}
        </>
      )}

      {/* Add Bed Modal */}
      <Modal isOpen={showBedModal} onClose={() => setShowBedModal(false)} title="Nova Cama">
        <form onSubmit={handleCreateBed} className="space-y-4">
          <div>
            <label className="label">Nome da Cama</label>
            <input value={bedForm.name} onChange={e => setBedForm({...bedForm, name: e.target.value})} className="input-field" placeholder="Ex: Cama 1, Beliche Superior" required />
          </div>
          <div>
            <label className="label">Valor Mensal (EUR)</label>
            <input type="number" step="0.01" value={bedForm.monthly_value} onChange={e => setBedForm({...bedForm, monthly_value: e.target.value})} className="input-field" />
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setShowBedModal(false)} className="btn-secondary">Cancelar</button>
            <button type="submit" className="btn-primary">Adicionar Cama</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
