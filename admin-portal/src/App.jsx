import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Weapons from './pages/Weapons';
import Skins from './pages/Skins';
import Bosses from './pages/Bosses';
import Enemies from './pages/Enemies';
import Powerups from './pages/Powerups';
import Waves from './pages/Waves';
import WaveEditor from './pages/WaveEditor';
import Shop from './pages/Shop';

// Context
import { AuthProvider, useAuth } from './context/AuthContext';

// Layout
import Layout from './components/Layout';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#ff4444',
    },
    secondary: {
      main: '#ffa500',
    },
    background: {
      default: '#0a0a0a',
      paper: '#1a1a1a',
    },
  },
});

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (user.role !== 'admin' && user.role !== 'super_admin') {
    return <div>Access Denied. Admin only.</div>;
  }

  return <Layout>{children}</Layout>;
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/"
              element={
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              }
            />
            <Route
              path="/weapons"
              element={
                <PrivateRoute>
                  <Weapons />
                </PrivateRoute>
              }
            />
            <Route
              path="/skins"
              element={
                <PrivateRoute>
                  <Skins />
                </PrivateRoute>
              }
            />
            <Route
              path="/bosses"
              element={
                <PrivateRoute>
                  <Bosses />
                </PrivateRoute>
              }
            />
            <Route
              path="/enemies"
              element={
                <PrivateRoute>
                  <Enemies />
                </PrivateRoute>
              }
            />
            <Route
              path="/powerups"
              element={
                <PrivateRoute>
                  <Powerups />
                </PrivateRoute>
              }
            />
            <Route
              path="/waves"
              element={
                <PrivateRoute>
                  <Waves />
                </PrivateRoute>
              }
            />
            <Route
              path="/wave-editor"
              element={
                <PrivateRoute>
                  <WaveEditor />
                </PrivateRoute>
              }
            />
            <Route
              path="/shop"
              element={
                <PrivateRoute>
                  <Shop />
                </PrivateRoute>
              }
            />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
