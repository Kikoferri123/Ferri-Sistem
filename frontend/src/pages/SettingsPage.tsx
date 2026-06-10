import React, { useEffect, useState } from 'react';
import { getSettings, createSetting, deleteSetting, getUsers, registerUser, updateUser } from '../services/api';
import Modal from '../components/Modal';
import { Settings, Plus, Trash2, Users, Edit2, UserCheck, UserX } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function SettingsPage() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [showSettingModal, setShowSettingModal] = useState(false);
  const [tab, setTab] = useState<'categories' | 'users'>('categories');
  const [newSetting, setNewSetting] = useState({ key: '', value: '', category: 'categories_in' });
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'visualizador' });
  const [editUser, setEditUser] = useState<any>({ id: 0, name: '', email: '', role: 'visualizador', active: true, new_password: '' });

  const load = () => {
    getSettings().then(r => setSettings(r.data));
    if (user?.role === 'admin') getUsers().then(r => setUsers(r.data));
  };

  useEffect(() => { load(); }, []);

  const handleCreateSetting = async (e: React.FormEvent) => {
    e.preventDefault();
    await createSetting(newSetting);
    setShowSettingModal(false);
    load();
  };

  const handleDeleteSetting = async (id: number) => {
    await deleteSetting(id);
    load();
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    await registerUser(newUser);
    setShowUserModal(false);
    setNewUser({ name: '', email: '', password: '', role: 'visualizador' });
    load();
  };

  const openEditUser = (u: any) => {
    setEditUser({ id: u.id, name: u.name, email: u.email, role: u.role, active: u.active, new_password: '' });
    setShowEditUserModal(true);
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const data: any = { name: editUser.name, email: editUser.email, role: editUser.role, active: editUser.active };
    await updateUser(editUser.id, data);
    setShowEditUserModal(false);
    load();
  };

  const toggleUserActive = async (u: any) => {
    await updateUser(u.id, { active: !u.active });
    load();
  };

  const grouped = settings.reduce((acc: any, s: any) => {
    if (!acc[s.category]) acc[s.category] = [];
    acc[s.category].push(s);
    return acc;
  }, {});

  const categoryLabels: Record<string, string> = {
    categories_in: 'Categorias de Entrada', categories_out: 'Categorias de Saida', payment_methods: 'Metodos de Pagamento'
  };

  const roleLabels: Record<string, string> = {
    admin: 'Administrador', financeiro: 'Financeiro', operacional: 'Operacional', visualizador: 'Visualizador'
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2"><Settings size={24} /> Configuracoes</h1>

      <div className="flex gap-2">
        <button onClick={() => setTab('categories')} className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === 'categories' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}>Categorias & Metodos</button>
        {user?.role === 'admin' && <button onClick={() => setTab('users')} className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === 'users' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}>Usuarios</button>}
      </div>

      {tab === 'categories' && (
        <div className="space-y-6">
          {user?.role === 'admin' && (
            <button onClick={() => setShowSettingModal(true)} className="btn-primary flex items-center gap-2"><Plus size={18} /> Nova Configuracao</button>
          )}
          {Object.entries(grouped).map(([category, items]: [string, any]) => (
            <div key={category} className="card">
              <h3 className="font-semibold text-gray-700 mb-3">{categoryLabels[category] || category}</h3>
              <div className="flex flex-wrap gap-2">
                {items.map((s: any) => (
                  <span key={s.id} className="inline-flex items-center gap-1 bg-gray-100 px-3 py-1.5 rounded-lg text-sm">
                    {s.value}
                    {user?.role === 'admin' && (
                      <button onClick={() => handleDeleteSetting(s.id)} className="text-red-400 hover:text-red-600 ml-1"><Trash2 size={14} /></button>
                    )}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'users' && user?.role === 'admin' && (
        <div className="space-y-4">
          <button onClick={() => setShowUserModal(true)} className="btn-primary flex items-center gap-2"><Plus size={18} /> Novo Usuario</button>
          <div className="card overflow-x-auto p-0">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="table-header">Nome</th>
                  <th className="table-header">Email</th>
                  <th className="table-header">Papel</th>
                  <th className="table-header">Ativo</th>
                  <th className="table-header w-24">Acoes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="table-cell font-medium">{u.name}</td>
                    <td className="table-cell">{u.email}</td>
                    <td className="table-cell">
                      <span className="inline-block bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full capitalize">
                        {roleLabels[u.role] || u.role}
                      </span>
                    </td>
                    <td className="table-cell">
                      {u.active
                        ? <span className="inline-flex items-center gap-1 text-green-600 text-sm"><UserCheck size={14} /> Ativo</span>
                        : <span className="inline-flex items-center gap-1 text-red-500 text-sm"><UserX size={14} /> Inativo</span>
                      }
                    </td>
                    <td className="table-cell">
                      <div className="flex gap-2">
                        <button onClick={() => openEditUser(u)} className="text-blue-500 hover:text-blue-700" title="Editar">
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => toggleUserActive(u)}
                          className={u.active ? 'text-red-400 hover:text-red-600' : 'text-green-500 hover:text-green-700'}
                          title={u.active ? 'Desativar' : 'Ativar'}
                        >
                          {u.active ? <UserX size={16} /> : <UserCheck size={16} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* New Setting Modal */}
      <Modal isOpen={showSettingModal} onClose={() => setShowSettingModal(false)} title="Nova Configuracao">
        <form onSubmit={handleCreateSetting} className="space-y-4">
          <div><label className="label">Categoria</label><select value={newSetting.category} onChange={e => setNewSetting({...newSetting, category: e.target.value})} className="select-field"><option value="categories_in">Categorias Entrada</option><option value="categories_out">Categorias Saida</option><option value="payment_methods">Metodos Pagamento</option></select></div>
          <div><label className="label">Valor</label><input value={newSetting.value} onChange={e => setNewSetting({...newSetting, value: e.target.value, key: `custom_${e.target.value.toLowerCase().replace(/\s/g, '_')}`})} className="input-field" required /></div>
          <div className="flex justify-end gap-3"><button type="button" onClick={() => setShowSettingModal(false)} className="btn-secondary">Cancelar</button><button type="submit" className="btn-primary">Salvar</button></div>
        </form>
      </Modal>

      {/* New User Modal */}
      <Modal isOpen={showUserModal} onClose={() => setShowUserModal(false)} title="Novo Usuario">
        <form onSubmit={handleCreateUser} className="space-y-4">
          <div><label className="label">Nome</label><input value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} className="input-field" required /></div>
          <div><label className="label">Email</label><input type="email" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} className="input-field" required /></div>
          <div><label className="label">Senha</label><input type="password" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} className="input-field" required minLength={6} /></div>
          <div><label className="label">Papel</label><select value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value})} className="select-field"><option value="admin">Administrador</option><option value="financeiro">Financeiro</option><option value="operacional">Operacional</option><option value="visualizador">Visualizador</option></select></div>
          <div className="flex justify-end gap-3"><button type="button" onClick={() => setShowUserModal(false)} className="btn-secondary">Cancelar</button><button type="submit" className="btn-primary">Criar Usuario</button></div>
        </form>
      </Modal>

      {/* Edit User Modal */}
      <Modal isOpen={showEditUserModal} onClose={() => setShowEditUserModal(false)} title="Editar Usuario">
        <form onSubmit={handleEditUser} className="space-y-4">
          <div><label className="label">Nome</label><input value={editUser.name} onChange={e => setEditUser({...editUser, name: e.target.value})} className="input-field" required /></div>
          <div><label className="label">Email</label><input type="email" value={editUser.email} onChange={e => setEditUser({...editUser, email: e.target.value})} className="input-field" required /></div>
          <div><label className="label">Papel</label><select value={editUser.role} onChange={e => setEditUser({...editUser, role: e.target.value})} className="select-field"><option value="admin">Administrador</option><option value="financeiro">Financeiro</option><option value="operacional">Operacional</option><option value="visualizador">Visualizador</option></select></div>
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={editUser.active} onChange={e => setEditUser({...editUser, active: e.target.checked})} className="w-4 h-4" />
              <span className="text-sm">Usuario Ativo</span>
            </label>
          </div>
          <div className="flex justify-end gap-3"><button type="button" onClick={() => setShowEditUserModal(false)} className="btn-secondary">Cancelar</button><button type="submit" className="btn-primary">Salvar</button></div>
        </form>
      </Modal>
    </div>
  );
}
