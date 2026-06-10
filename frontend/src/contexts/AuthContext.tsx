import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { login as apiLogin, getMe, clientLogin as apiClientLogin, getClientPortalProfile } from '../services/api';

type AuthMode = 'admin' | 'client';

interface AuthContextType {
  user: User | null;
  token: string | null;
  mode: AuthMode;
  login: (email: string, password: string) => Promise<void>;
  clientLogin: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  loading: boolean;
  isClient: boolean;
}

const AuthContext = createContext<AuthContextType>(null!);

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [mode, setMode] = useState<AuthMode>((localStorage.getItem('auth_mode') as AuthMode) || 'admin');
  const [loading, setLoading] = useState(true);

  const loadUser = async () => {
    if (token) {
      try {
        if (mode === 'client') {
          const res = await getClientPortalProfile();
          setUser(res.data);
        } else {
          const res = await getMe();
          setUser(res.data);
        }
      } catch {
        localStorage.removeItem('token');
        localStorage.removeItem('auth_mode');
        setToken(null);
        setUser(null);
      }
    }
    setLoading(false);
  };

  useEffect(() => { loadUser(); }, [token]);

  const login = async (email: string, password: string) => {
    const res = await apiLogin(email, password);
    const { access_token, user: userData } = res.data;
    localStorage.setItem('token', access_token);
    localStorage.setItem('auth_mode', 'admin');
    setMode('admin');
    setToken(access_token);
    setUser(userData);
  };

  const clientLogin = async (email: string, password: string) => {
    const res = await apiClientLogin(email, password);
    const { access_token, user: userData } = res.data;
    localStorage.setItem('token', access_token);
    localStorage.setItem('auth_mode', 'client');
    setMode('client');
    setToken(access_token);
    setUser(userData);
  };

  const logout = () => {
    const wasClient = mode === 'client';
    localStorage.removeItem('token');
    localStorage.removeItem('auth_mode');
    setToken(null);
    setUser(null);
    setMode('admin');
    if (wasClient) {
      window.location.href = '/cliente/login';
    }
  };

  const refreshUser = async () => {
    try {
      if (mode === 'client') {
        const res = await getClientPortalProfile();
        setUser(res.data);
      } else {
        const res = await getMe();
        setUser(res.data);
      }
    } catch {}
  };

  const isClient = mode === 'client';

  return (
    <AuthContext.Provider value={{ user, token, mode, login, clientLogin, logout, refreshUser, loading, isClient }}>
      {children}
    </AuthContext.Provider>
  );
}
