import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './components/Login';
import Signup from './components/Signup';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import Dashboard from './components/Dashboard';
import ProtectedRoute from './components/ProtectedRoute';
import './App.css';

// Componente para a página inicial (login/signup/forgot password)
const HomePage = () => {
  const [authMode, setAuthMode] = useState('login'); // 'login', 'signup', 'forgot'
  const { isAuthenticated } = useAuth();

  // Se usuário já está logado, redirecionar para dashboard
  if (isAuthenticated()) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="app-container">
      {authMode === 'login' && (
        <Login 
          onSwitchToSignup={() => setAuthMode('signup')}
          onSwitchToForgotPassword={() => setAuthMode('forgot')}
        />
      )}
      {authMode === 'signup' && (
        <Signup onSwitchToLogin={() => setAuthMode('login')} />
      )}
      {authMode === 'forgot' && (
        <ForgotPassword onBackToLogin={() => setAuthMode('login')} />
      )}
    </div>
  );
};

// Componente principal da aplicação
const AppContent = () => {
  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Rota raiz - mostra login/signup se não logado */}
          <Route path="/" element={<HomePage />} />
          
          {/* Rota para reset de senha */}
          <Route path="/reset-password" element={<ResetPassword />} />
          
          {/* Rota protegida - dashboard */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          
          {/* Rota catch-all - redirecionar para raiz */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
};

// App principal com AuthProvider
const App = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
