import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Newspaper,
  MessageSquare,
  Award,
  LogIn,
  Star,
  HelpCircle,
  UserPlus,
  Palette,
  Menu,
  X,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', path: '/', icon: <LayoutDashboard size={20} /> },
  { label: 'Clientes', path: '/clientes', icon: <Users size={20} /> },
  { label: 'Noticias', path: '/noticias', icon: <Newspaper size={20} /> },
  { label: 'Mensagens', path: '/mensagens', icon: <MessageSquare size={20} /> },
  { label: 'Recompensas', path: '/recompensas', icon: <Award size={20} /> },
  { label: 'Check-ins', path: '/checkins', icon: <LogIn size={20} /> },
  { label: 'Avaliacoes', path: '/avaliacoes', icon: <Star size={20} /> },
  { label: 'FAQ', path: '/faq', icon: <HelpCircle size={20} /> },
  { label: 'Indicacoes', path: '/indicacoes', icon: <UserPlus size={20} /> },
  { label: 'Marca / Branding', path: '/branding', icon: <Palette size={20} /> },
];

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();
  const { user, logout } = useAuth();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } bg-gradient-to-b from-slate-900 to-slate-800 text-white transition-all duration-300 flex flex-col overflow-hidden`}
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded flex items-center justify-center font-bold text-sm">
                DA
              </div>
              {sidebarOpen && <span className="font-semibold text-sm">Admin Panel</span>}
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive(item.path)
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-300 hover:bg-slate-700/50'
              }`}
              title={!sidebarOpen ? item.label : undefined}
            >
              <span className="flex-shrink-0">{item.icon}</span>
              {sidebarOpen && <span className="text-sm">{item.label}</span>}
            </Link>
          ))}
        </nav>

        {/* User Info & Logout */}
        <div className="p-4 border-t border-slate-700">
          <div className="mb-3">
            {sidebarOpen && (
              <div>
                <p className="text-xs text-slate-400">Logado como</p>
                <p className="text-sm font-medium truncate">{user?.name || 'Admin'}</p>
                <p className="text-xs text-slate-400 truncate">{user?.email}</p>
              </div>
            )}
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm transition-colors"
            title={!sidebarOpen ? 'Logout' : undefined}
          >
            <LogOut size={18} />
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <div className="bg-white border-b border-gray-200 p-4 flex items-center">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <h1 className="ml-4 text-xl font-semibold text-gray-800">Admin Panel</h1>
        </div>

        {/* Page Content */}
        <div className="flex-1 overflow-auto">
          <div className="p-6">{children}</div>
        </div>
      </div>
    </div>
  );
}
