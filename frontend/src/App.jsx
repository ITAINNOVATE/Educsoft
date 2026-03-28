import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Configuration from './pages/Configuration';
import Students from './pages/Students';
import Payments from './pages/Payments';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Accounting from './pages/Accounting';
import SuperAdmin from './pages/SuperAdmin';
import axios from 'axios';
import config from './config';
import './index.css';
import { AlertTriangle } from 'lucide-react';

// Error Boundary for UI Resilience
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error("UI Crash caught by Boundary:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2rem', textAlign: 'center', height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', backgroundColor: '#fdf2f2' }}>
          <AlertTriangle size={64} color="#c62828" style={{ marginBottom: '1.5rem' }} />
          <h1 style={{ color: '#c62828', marginBottom: '1rem' }}>Une erreur d'affichage est survenue</h1>
          <p style={{ color: '#7f1d1d', maxWidth: '500px', marginBottom: '2rem' }}>
            L'interface a rencontré un problème inattendu. Veuillez rafraîchir la page ou contacter l'administration si le problème persiste.
          </p>
          <button 
            onClick={() => window.location.reload()} 
            style={{ padding: '0.75rem 1.5rem', backgroundColor: '#c62828', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            Rafraîchir la page
          </button>
          <pre style={{ marginTop: '2rem', textAlign: 'left', fontSize: '0.75rem', padding: '1rem', backgroundColor: '#fff', borderRadius: '4px', maxWidth: '90vw', overflow: 'auto' }}>
            {this.state.error?.name}: {this.state.error?.message}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

const ProtectedRoute = ({ children, roleRequired }) => {
  const { user, loading } = useAuth();

  if (loading) return <div>Chargement...</div>;
  if (!user) return <Navigate to="/login" />;

  if (roleRequired) {
    const roles = Array.isArray(roleRequired) ? roleRequired : [roleRequired];
    if (!roles.includes(user.role) && user.role !== 'SUPER_ADMIN') {
      return <Navigate to="/dashboard" />;
    }
  }

  return children ? children : <Outlet />;
};

const Layout = () => {
  const { user, logout, switchEstablishment } = useAuth();
  const navigate = useNavigate();
  const [schoolYear, setSchoolYear] = useState('2025-2026');
  const [establishments, setEstablishments] = useState([]);

  useEffect(() => {
    if (user?.role === 'SUPER_ADMIN') {
      const fetchEsts = async () => {
        try {
          const res = await axios.get(`${config.API_URL}/establishments`, {
            headers: { Authorization: `Bearer ${user.token}` }
          });
          setEstablishments(res.data);
        } catch (err) {
          console.error("Failed to fetch establishments", err);
        }
      };
      fetchEsts();
    }
  }, [user]);

  const handleSwitch = async (id) => {
    const result = await switchEstablishment(id);
    if (result.success) {
      navigate('/dashboard');
    } else {
      alert(result.message);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <aside style={{ width: '260px', backgroundColor: 'var(--primary-dark)', color: 'white', padding: '2rem 1rem', display: 'flex', flexDirection: 'column' }}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', textAlign: 'center' }}>EDUSOFT</h2>
        
        {user?.role === 'SUPER_ADMIN' ? (
          <div style={{ marginBottom: '2rem' }}>
            <label style={{ fontSize: '0.65rem', opacity: 0.7, marginBottom: '0.4rem', display: 'block', textTransform: 'uppercase' }}>Établissement Actif</label>
            <select
              value={user.establishmentId}
              onChange={(e) => handleSwitch(e.target.value)}
              style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', background: 'rgba(255,255,255,0.15)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', fontSize: '0.8rem', outline: 'none', cursor: 'pointer' }}
            >
              {establishments.map(est => (
                <option key={est.id} value={est.id} style={{ color: 'black' }}>{est.name}</option>
              ))}
            </select>
          </div>
        ) : (
          <div style={{ fontSize: '0.7rem', opacity: 0.8, textAlign: 'center', marginBottom: '2rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
            {user?.establishmentName || 'SYSTÈME GLOBAL'}
          </div>
        )}

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
          <SidebarLink to="/dashboard" label="Tableau de Bord" />
          {user && (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') && (
            <SidebarLink to="/configuration" label="Configuration" />
          )}
          {user && (user.role === 'ADMIN' || user.role === 'SECRETARY' || user.role === 'ACCOUNTANT' || user.role === 'SUPER_ADMIN') && (
            <SidebarLink to="/students" label="Gestion des Élèves" />
          )}
          {user && (user.role === 'ADMIN' || user.role === 'ACCOUNTANT' || user.role === 'SUPER_ADMIN') && (
            <SidebarLink to="/payments" label="Paiements" />
          )}
          {user && (user.role === 'ADMIN' || user.role === 'ACCOUNTANT' || user.role === 'SUPER_ADMIN') && (
            <SidebarLink to="/accounting" label="Comptabilité" />
          )}
          {(user && (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN')) && (
            <SidebarLink to="/users" label="Utilisateurs" />
          )}
          {user && user.role === 'SUPER_ADMIN' && (
            <SidebarLink to="/system" label="🏠 Établissements" />
          )}
          <button onClick={logout} style={{ marginTop: '1.5rem', padding: '0.75rem', borderRadius: '8px', border: 'none', backgroundColor: '#c62828', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}>Déconnexion</button>
        </nav>
      </aside>
      <main style={{ flex: 1, overflowY: 'auto', backgroundColor: 'var(--bg-main)', position: 'relative' }}>
        {user?.role === 'SUPER_ADMIN' && user?.establishmentId && (
          <div style={{ backgroundColor: '#fffbeb', borderBottom: '1px solid #fef3c7', padding: '0.5rem 2rem', color: '#b45309', fontSize: '0.75rem', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>MODE GESTION : {user.establishmentName || 'Établissement sélectionné'}</span>
            <Link to="/system" style={{ color: '#b45309', textDecoration: 'underline' }}>Changer</Link>
          </div>
        )}
        <Outlet />
      </main>
    </div>
  );
};

const SidebarLink = ({ to, label }) => (
  <NavLink
    to={to}
    style={({ isActive }) => ({
      padding: '0.75rem 1rem',
      borderRadius: '8px',
      color: 'white',
      textDecoration: 'none',
      fontSize: '0.875rem',
      transition: 'all 0.2s',
      background: isActive ? 'rgba(255,255,255,0.1)' : 'transparent',
      fontWeight: isActive ? '600' : 'normal',
      display: 'block'
    })}
  >
    {label}
  </NavLink>
);

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route element={<ProtectedRoute roleRequired={['ADMIN', 'ACCOUNTANT']} />}>
                <Route path="/payments" element={<Payments />} />
              </Route>
              <Route element={<ProtectedRoute roleRequired="ADMIN" />}>
                <Route path="/configuration" element={<Configuration />} />
              </Route>
              <Route element={<ProtectedRoute roleRequired={['ADMIN', 'SECRETARY', 'ACCOUNTANT']} />}>
                <Route path="/students" element={<Students />} />
              </Route>
              <Route element={<ProtectedRoute roleRequired="ADMIN" />}>
                <Route path="/users" element={<Users />} />
              </Route>
              <Route element={<ProtectedRoute roleRequired={['ADMIN', 'ACCOUNTANT']} />}>
                <Route path="/accounting" element={<Accounting />} />
              </Route>
              <Route element={<ProtectedRoute roleRequired="SUPER_ADMIN" />}>
                <Route path="/system" element={<SuperAdmin />} />
              </Route>
            </Route>
            <Route path="/superadmin" element={<Navigate to="/system" replace />} />
            <Route path="/establishments" element={<Navigate to="/system" replace />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </AuthProvider>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
