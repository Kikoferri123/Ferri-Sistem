import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  LayoutDashboard, ArrowDownCircle, ArrowUpCircle, FileText, BarChart3,
  Home, Users, FileSignature, FolderOpen, Bell, Settings, LogOut,
  Menu, X, ChevronDown, DollarSign, TrendingUp, Building2, BedDouble,
  CreditCard, Wrench, FileBarChart, HelpCircle, Wallet, Shield, AlertTriangle,
  Newspaper, MessageSquare, Award, LogIn, Star, UserPlus, Palette, Globe
} from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

const allNavItems = [
  { path: '/', labelKey: 'dashboard', icon: LayoutDashboard, roles: ['admin', 'financeiro', 'operacional', 'visualizador'] },
  { labelKey: 'financial', icon: DollarSign, roles: ['admin', 'financeiro', 'operacional'], children: [
    { path: '/entradas', labelKey: 'entriesIn', icon: ArrowDownCircle, roles: ['admin', 'financeiro', 'operacional'] },
    { path: '/saidas', labelKey: 'entriesOut', icon: ArrowUpCircle, roles: ['admin', 'financeiro', 'operacional'] },
    { path: '/pagamentos', labelKey: 'payments', icon: CreditCard, roles: ['admin', 'financeiro', 'operacional'] },
    { path: '/pnl-caixa', labelKey: 'pnlCash', icon: FileText, roles: ['admin', 'financeiro'] },
    { path: '/pnl-competencia', labelKey: 'pnlAccrual', icon: TrendingUp, roles: ['admin', 'financeiro'] },
    { path: '/depositos', labelKey: 'deposits', icon: Wallet, roles: ['admin', 'financeiro'] },
    { path: '/inadimplencia', labelKey: 'delinquency', icon: AlertTriangle, roles: ['admin', 'financeiro'] },
  ]},
  { labelKey: 'properties', icon: Building2, roles: ['admin', 'financeiro', 'operacional', 'visualizador'], children: [
    { path: '/propriedades', labelKey: 'list', icon: Home, roles: ['admin', 'financeiro', 'operacional', 'visualizador'] },
    { path: '/ranking', labelKey: 'ranking', icon: BarChart3, roles: ['admin', 'financeiro'] },
  ]},
  { path: '/disponibilidade', labelKey: 'availability', icon: BedDouble, roles: ['admin', 'financeiro', 'operacional', 'visualizador'] },
  { path: '/clientes', labelKey: 'clients', icon: Users, roles: ['admin', 'financeiro', 'operacional', 'visualizador'] },
  { path: '/landlords', labelKey: 'landlords', icon: Building2, roles: ['admin', 'financeiro'] },
  { path: '/rh', labelKey: 'hr', icon: Users, roles: ['admin'] },
  { path: '/contratos', labelKey: 'contracts', icon: FileSignature, roles: ['admin', 'financeiro', 'operacional', 'visualizador'] },
  { path: '/documentos', labelKey: 'documents', icon: FolderOpen, roles: ['admin', 'financeiro', 'operacional', 'visualizador'] },
  { path: '/manutencao', labelKey: 'maintenanceRequests', icon: Wrench, roles: ['admin', 'operacional'] },
  { path: '/alertas', labelKey: 'alerts', icon: Bell, roles: ['admin', 'financeiro', 'operacional', 'visualizador'] },
  { path: '/relatorios', labelKey: 'reports', icon: FileBarChart, roles: ['admin', 'financeiro'] },
  { labelKey: 'mobileApp', icon: Newspaper, roles: ['admin', 'operacional'], children: [
    { path: '/admin/noticias', labelKey: 'news', icon: Newspaper, roles: ['admin', 'operacional'] },
    { path: '/admin/mensagens', labelKey: 'messages', icon: MessageSquare, roles: ['admin', 'operacional'] },
    { path: '/admin/recompensas', labelKey: 'rewards', icon: Award, roles: ['admin', 'operacional'] },
    { path: '/admin/checkins', labelKey: 'checkins', icon: LogIn, roles: ['admin', 'operacional'] },
    { path: '/admin/avaliacoes', labelKey: 'reviews', icon: Star, roles: ['admin', 'operacional'] },
    { path: '/admin/faq', labelKey: 'faq', icon: HelpCircle, roles: ['admin', 'operacional'] },
    { path: '/admin/indicacoes', labelKey: 'referrals', icon: UserPlus, roles: ['admin', 'operacional'] },
  ]},
  { path: '/branding', labelKey: 'branding', icon: Palette, roles: ['admin'] },
  { path: '/ajuda', labelKey: 'help', icon: HelpCircle, roles: ['admin', 'financeiro', 'operacional', 'visualizador'] },
  { path: '/auditoria', labelKey: 'audit', icon: Shield, roles: ['admin'] },
  { path: '/configuracoes', labelKey: 'settings', icon: Settings, roles: ['admin'] },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const { ta, lang, setLang } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 1024);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState<string[]>(['financial', 'properties']);
  const userRole = user?.role || 'visualizador';

  const toggleGroup = (label: string) => {
    setOpenGroups(prev => prev.includes(label) ? prev.filter((g: string) => g !== label) : [...prev, label]);
  };

  const isActive = (path: string) => location.pathname === path;

  const navItems = allNavItems.filter(item => item.roles?.includes(userRole)).map(item => {
    if (item.children) {
      return { ...item, children: item.children.filter(child => child.roles?.includes(userRole)) };
    }
    return item;
  }).filter(item => !item.children || (item.children && item.children.length > 0));

  // Close mobile menu on navigation
  const handleNavClick = (path: string) => {
    navigate(path);
    if (window.innerWidth < 1024) setMobileMenuOpen(false);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setMobileMenuOpen(false)} />
      )}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-gradient-to-b from-neutral-950 to-neutral-900 text-white transition-all duration-300 flex flex-col
        fixed lg:relative z-50 h-full ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="p-4 flex items-center gap-3 border-b border-neutral-800">
          <div className="w-10 h-10 rounded-lg bg-amber-500 flex items-center justify-center font-bold text-lg shrink-0">FS</div>
          {sidebarOpen && (
            <div>
              <h1 className="font-bold text-lg leading-tight">Ferri Sistem</h1>
              <p className="text-xs text-neutral-400">Property Management</p>
            </div>
          )}
        </div>
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {navItems.map((item: any) => {
            if (item.children) {
              const isOpen = openGroups.includes(item.labelKey);
              const Icon = item.icon;
              return (
                <div key={item.labelKey}>
                  <button onClick={() => toggleGroup(item.labelKey)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-neutral-300 hover:bg-neutral-800/50 transition-colors">
                    <Icon size={20} />
                    {sidebarOpen && (
                      <>
                        <span className="flex-1 text-left text-sm">{ta(item.labelKey as any)}</span>
                        <ChevronDown size={16} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                      </>
                    )}
                  </button>
                  {isOpen && sidebarOpen && (
                    <div className="ml-4 mt-1 space-y-1">
                      {item.children.map((child: any) => {
                        const ChildIcon = child.icon;
                        return (
                          <Link key={child.path} to={child.path}
                            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${isActive(child.path) ? 'bg-amber-500 text-white' : 'text-neutral-400 hover:bg-neutral-800/50 hover:text-white'}`}>
                            <ChildIcon size={16} /><span>{ta(child.labelKey as any)}</span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }
            const Icon = item.icon;
            return (
              <Link key={item.path} to={item.path!}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${isActive(item.path!) ? 'bg-amber-500 text-white' : 'text-neutral-300 hover:bg-neutral-800/50 hover:text-white'}`}>
                <Icon size={20} />{sidebarOpen && <span className="text-sm">{ta(item.labelKey as any)}</span>}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center text-sm font-bold shrink-0 cursor-pointer hover:bg-amber-400 transition-colors"
              onClick={() => navigate('/perfil')} title={ta('profile')}>
              {user?.name?.charAt(0) || 'U'}
            </div>
            {sidebarOpen && (
              <div className="flex-1 min-w-0 cursor-pointer" onClick={() => navigate('/perfil')}>
                <p className="text-sm font-medium truncate hover:text-amber-300 transition-colors">{user?.name}</p>
                <p className="text-xs text-neutral-400 capitalize">{user?.role}</p>
              </div>
            )}
            <button onClick={logout} className="text-neutral-400 hover:text-white p-1" title={ta('logout')}><LogOut size={18} /></button>
          </div>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">
        <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between sticky top-0 z-10">
          <button onClick={() => {
            if (window.innerWidth < 1024) {
              setMobileMenuOpen(!mobileMenuOpen);
            } else {
              setSidebarOpen(!sidebarOpen);
            }
          }} className="text-gray-500 hover:text-gray-700">
            {(sidebarOpen || mobileMenuOpen) ? <X size={20} /> : <Menu size={20} />}
          </button>
          <div className="flex items-center gap-4">
            {/* Language Switcher */}
            <div className="flex items-center bg-gray-100 rounded-full p-1 gap-1">
              <button onClick={() => setLang('pt')}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${lang === 'pt' ? 'bg-amber-500 text-white' : 'text-gray-500 hover:text-gray-700'}`}>
                PT
              </button>
              <button onClick={() => setLang('en')}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${lang === 'en' ? 'bg-amber-500 text-white' : 'text-gray-500 hover:text-gray-700'}`}>
                EN
              </button>
            </div>
            <span className="text-xs px-2 py-1 rounded-full bg-amber-100 text-amber-700 font-medium capitalize">{userRole}</span>
            <div className="text-sm text-gray-500">
              {new Date().toLocaleDateString(lang === 'pt' ? 'pt-BR' : 'en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          </div>
        </header>
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
