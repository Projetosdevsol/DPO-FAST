
import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LandingPage } from './components/LandingPage';
import { Login } from './components/Login';
import { Register } from './components/Register';
import { Dashboard } from './components/Dashboard';
import { AdminPanel } from './components/AdminPanel';
import { TermsOfUse } from './components/TermsOfUse';
import { PrivacyPolicy } from './components/PrivacyPolicy';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { Pricing } from './components/Pricing';
import { SuccessPay } from './components/SuccessPay';

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { authState } = useAuth();
  if (authState.loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  return authState.isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
};

const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { authState } = useAuth();
  if (authState.loading) return <div className="h-screen flex items-center justify-center">Carregando...</div>;
  
  // Verifica se está logado E se é admin
  if (authState.isAuthenticated && authState.user?.isAdmin) {
    return <>{children}</>;
  }
  
  return <Navigate to="/dashboard" />;
};

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <HashRouter>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/termos" element={<TermsOfUse />} />
            <Route path="/privacidade" element={<PrivacyPolicy />} />
            <Route path="/planos" element={<Pricing />} />
            <Route path="/success" element={<SuccessPay />} />
            
            <Route 
              path="/dashboard/*" 
              element={
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              } 
            />

            <Route 
              path="/admin/*" 
              element={
                <AdminRoute>
                  <AdminPanel />
                </AdminRoute>
              } 
            />
            
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </HashRouter>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
