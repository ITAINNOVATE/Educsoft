import { BrowserRouter as Router, Routes, Route, Navigate, Link, NavLink, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Configuration from './pages/Configuration';
import Students from './pages/Students';
import Payments from './pages/Payments';
import Dashboard from './pages/Dashboard';

import Users from './pages/Users';
import Accounting from './pages/Accounting';
import SuperAdmin from './pages/SuperAdmin';

import { useState, useEffect } from 'react';
import axios from 'axios';
import config from './config';
import './index.css';

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


// Sidebar Layout for Dashboard-ish pages
const Layout = () => {
  const { user, logout, switchEstablishment } = useAuth();
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
    if (!result.success) {
      alert(result.message);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar - Simple version for now */}
      <aside style={{ width: '260px', backgroundColor: 'var(--primary-dark)', color: 'white', padding: '2rem 1rem', display: 'flex', flexDirection: 'column' }}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', textAlign: 'center' }}>EDUSOFT</h2>
        
        {user?.role === 'SUPER_ADMIN' ? (
          <div style={{ marginBottom: '2rem' }}>
            <label style={{ fontSize: '0.65rem', opacity: 0.7, marginBottom: '0.4rem', display: 'block', textTransform: 'uppercase' }}>Établissement Actif</label>
            <select
              value={user.establishmentId}
              onChange={(e) => handleSwitch(e.target.value)}
              style={{ 
                width: '100%', 
                padding: '0.6rem', 
                borderRadius: '6px', 
                background: 'rgba(255,255,255,0.15)', 
                color: 'white', 
                border: '1px solid rgba(255,255,255,0.1)', 
                fontSize: '0.8rem', 
                outline: 'none',
                cursor: 'pointer'
              }}
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
          {/* Dashboard - Visible to all */}
          <SidebarLink to="/dashboard" label="Tableau de Bord" />

          {/* Configuration - Admin only */}
          {user && (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') && (
            <SidebarLink to="/configuration" label="Configuration" />
          )}

          {/* Students - Admin, Secretary, Accountant (read-only), and Super Admin */}
          {user && (user.role === 'ADMIN' || user.role === 'SECRETARY' || user.role === 'ACCOUNTANT' || user.role === 'SUPER_ADMIN') && (
            <SidebarLink to="/students" label="Gestion des Élèves" />
          )}

          {/* Payments - Admin and Accountant */}
          {user && (user.role === 'ADMIN' || user.role === 'ACCOUNTANT' || user.role === 'SUPER_ADMIN') && (
            <SidebarLink to="/payments" label="Paiements" />
          )}

          {/* Accounting - Admin and Accountant */}
          {user && (user.role === 'ADMIN' || user.role === 'ACCOUNTANT' || user.role === 'SUPER_ADMIN') && (
            <SidebarLink to="/accounting" label="Comptabilité" />
          )}



          {/* Users - Admin only */}
          {(user && (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN')) && (
            <SidebarLink to="/users" label="Utilisateurs" />
          )}

          {/* System Admin - Super Admin only */}
          {user && user.role === 'SUPER_ADMIN' && (
            <SidebarLink to="/system" label="🏠 Établissements" />
          )}

          <button onClick={logout} style={{ marginTop: '1.5rem', padding: '0.75rem', borderRadius: '8px', border: 'none', backgroundColor: '#c62828', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}>Déconnexion</button>

          <div style={{ marginTop: 'auto', paddingTop: '2rem' }}>
            <label style={{ fontSize: '0.75rem', opacity: 0.7, marginBottom: '0.5rem', display: 'block' }}>Année Scolaire</label>
            <select
              value={schoolYear}
              onChange={(e) => setSchoolYear(e.target.value)}
              style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', background: 'rgba(255,255,255,0.1)', color: 'white', border: 'none', fontSize: '0.875rem', outline: 'none' }}
            >
              <option value="2025-2026">2025-2026</option>
              <option value="2024-2025">2024-2025</option>
            </select>
          </div>
        </nav>
      </aside>
      <main style={{ flex: 1, overflowY: 'auto', backgroundColor: 'var(--bg-main)', position: 'relative' }}>
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
    onMouseEnter={e => { if (!e.target.classList.contains('active')) e.target.style.background = 'rgba(255,255,255,0.05)' }}
    onMouseLeave={e => { if (!e.target.classList.contains('active')) e.target.style.background = 'transparent' }}
  >
    {label}
  </NavLink>
);

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route path="/dashboard" element={<Dashboard />} />
            {/* Payments - Admin and Accountant */}
            <Route element={<ProtectedRoute roleRequired={['ADMIN', 'ACCOUNTANT']} />}>
              <Route path="/payments" element={<Payments />} />
            </Route>

            {/* Configuration - Admin only */}
            <Route element={<ProtectedRoute roleRequired="ADMIN" />}>
              <Route path="/configuration" element={<Configuration />} />
            </Route>

            {/* Students - Admin, Secretary (full access), Accountant (read-only) */}
            <Route element={<ProtectedRoute roleRequired={['ADMIN', 'SECRETARY', 'ACCOUNTANT']} />}>
              <Route path="/students" element={<Students />} />
            </Route>



            {/* Users - Admin only */}
            <Route element={<ProtectedRoute roleRequired="ADMIN" />}>
              <Route path="/users" element={<Users />} />
            </Route>

            {/* Accounting - Admin and Accountant */}
            <Route element={<ProtectedRoute roleRequired={['ADMIN', 'ACCOUNTANT']} />}>
              <Route path="/accounting" element={<Accounting />} />
            </Route>

            {/* Super Admin - System Management */}
            <Route element={<ProtectedRoute roleRequired="SUPER_ADMIN" />}>
              <Route path="/system" element={<SuperAdmin />} />
            </Route>
          </Route>

          <Route path="/" element={<Navigate to="/dashboard" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
