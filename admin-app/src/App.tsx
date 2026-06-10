import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ClientList from './pages/ClientList';
import AdminNews from './pages/AdminNews';
import AdminMessages from './pages/AdminMessages';
import AdminRewards from './pages/AdminRewards';
import AdminCheckins from './pages/AdminCheckins';
import AdminReviews from './pages/AdminReviews';
import AdminFaq from './pages/AdminFaq';
import AdminReferrals from './pages/AdminReferrals';
import BrandingPage from './pages/BrandingPage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Layout>{children}</Layout>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/clientes"
        element={
          <ProtectedRoute>
            <ClientList />
          </ProtectedRoute>
        }
      />
      <Route
        path="/noticias"
        element={
          <ProtectedRoute>
            <AdminNews />
          </ProtectedRoute>
        }
      />
      <Route
        path="/mensagens"
        element={
          <ProtectedRoute>
            <AdminMessages />
          </ProtectedRoute>
        }
      />
      <Route
        path="/recompensas"
        element={
          <ProtectedRoute>
            <AdminRewards />
          </ProtectedRoute>
        }
      />
      <Route
        path="/checkins"
        element={
          <ProtectedRoute>
            <AdminCheckins />
          </ProtectedRoute>
        }
      />
      <Route
        path="/avaliacoes"
        element={
          <ProtectedRoute>
            <AdminReviews />
          </ProtectedRoute>
        }
      />
      <Route
        path="/faq"
        element={
          <ProtectedRoute>
            <AdminFaq />
          </ProtectedRoute>
        }
      />
      <Route
        path="/indicacoes"
        element={
          <ProtectedRoute>
            <AdminReferrals />
          </ProtectedRoute>
        }
      />
      <Route
        path="/branding"
        element={
          <ProtectedRoute>
            <BrandingPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
