import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import AuthPage from './components/AuthPage';
import Dashboard from './components/Dashboard';
import Navbar from './components/Navbar';

const AppContent = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="auth-container"><div className="auth-card">Loading...</div></div>;
  }

  if (!user) {
    return <AuthPage />;
  }

  return (
    <>
      <Navbar />
      <Dashboard />
    </>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
