import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import config from '../config';
import { useNavigate } from 'react-router-dom';
import {
    TrendingUp,
    AlertTriangle,
    Users,
    BookOpen,
    ArrowUpRight,
    Download,
    CreditCard
} from 'lucide-react';

const Dashboard = () => {
    const [stats, setStats] = useState(null);
    const [debts, setDebts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { user } = useAuth();
    const navigate = useNavigate();

    const API_BASE = `${config.API_URL}/accounting`;

    useEffect(() => {
        let isMounted = true;
        let timeoutId;

        const load = async () => {
            if (user?.token) {
                if (user.role === 'SUPER_ADMIN' && !user.establishmentId) {
                    if (isMounted) setLoading(false);
                    return;
                }
                
                // Safety timeout to prevent infinite loading if API hangs
                timeoutId = setTimeout(() => {
                    if (isMounted && loading) {
                        console.warn("Dashboard timeout reached. Forcing loading false.");
                        setLoading(false);
                    }
                }, 8000);

                await fetchStats();
                if (isMounted) setLoading(false);
            }
        };

        load();

        return () => {
            isMounted = false;
            if (timeoutId) clearTimeout(timeoutId);
        };
    }, [user, user?.establishmentId, user?.token]);

    const fetchStats = async () => {
        const authHeader = { headers: { Authorization: `Bearer ${user.token}` } };
        
        try {
            const [statsRes, debtsRes] = await Promise.all([
                axios.get(`${API_BASE}/stats`, authHeader),
                axios.get(`${API_BASE}/debts`, authHeader)
            ]);

            setStats(statsRes.data || { stats: {} });
            setDebts(Array.isArray(debtsRes.data) ? debtsRes.data : []);
            setError(null);
        } catch (error) {
            console.error('Error fetching dashboard stats:', error);
            setError('Certaines données n\'ont pas pu être chargées');
            // Don't crash, just show what we have (null/0)
        }
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', gap: '1rem' }}>
                <div className="spinner" style={{ width: '40px', height: '40px', border: '4px solid #f3f3f3', borderTop: '4px solid var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Chargement du tableau de bord...</p>
                <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    if (user.role === 'SUPER_ADMIN' && !user.establishmentId) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh', padding: '2rem' }}>
                <div className="card" style={{ maxWidth: '500px', textAlign: 'center', padding: '3rem' }}>
                    <div style={{ backgroundColor: '#e3f2fd', width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', color: '#1976d2' }}>
                        <TrendingUp size={40} />
                    </div>
                    <h2 style={{ marginBottom: '1rem' }}>Bienvenue, Super Admin</h2>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
                        Pour consulter les statistiques, veuillez d'abord sélectionner un établissement dans le module d'administration.
                    </p>
                    <button className="btn btn-primary" onClick={() => navigate('/system')} style={{ width: '100%' }}>
                        Accéder à la Gestion des Établissements
                    </button>
                </div>
            </div>
        );
    }

    if (error || !stats) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh', padding: '2rem' }}>
                <div className="card" style={{ maxWidth: '500px', textAlign: 'center', padding: '3rem' }}>
                    <div style={{ backgroundColor: '#ffebee', width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', color: '#c62828' }}>
                        <AlertTriangle size={40} />
                    </div>
                    <h2 style={{ marginBottom: '1rem' }}>Attention</h2>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
                        {error || 'Impossible de charger les statistiques du tableau de bord.'}
                    </p>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button className="btn btn-outline" onClick={() => fetchStats()} style={{ flex: 1 }}>
                            Réessayer
                        </button>
                        {user.role === 'SUPER_ADMIN' && (
                            <button className="btn btn-primary" onClick={() => navigate('/system')} style={{ flex: 1 }}>
                                Changer d'école
                            </button>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    const totalRevenue = stats?.revenueTotal || 0;
    const totalDebt = Array.isArray(debts) ? debts.reduce((acc, curr) => acc + (Number(curr.balance) || 0), 0) : 0;
    const collectionRate = (totalRevenue + totalDebt) > 0 ? Math.round((totalRevenue / (totalRevenue + totalDebt)) * 100) : 0;

    return (
        <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
            <header style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                    <h1 style={{ fontSize: '2rem', color: 'var(--primary-dark)', fontWeight: '800' }}>Tableau de Bord</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Bienvenue, {user.firstName}. Voici l'état actuel de l'établissement.</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.875rem', fontWeight: '700', color: 'var(--primary)', marginBottom: '0.25rem' }}>{new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Session active: {user.role}</div>
                </div>
            </header>

            {/* Stats Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
                <StatCard icon={<TrendingUp color="#2e7d32" />} label="Recettes du Mois" value={`${(stats?.revenueMonth || 0).toLocaleString()} FCFA`} trend="+15% vs mois dernier" color="#e8f5e9" />
                <StatCard icon={<AlertTriangle color="#c62828" />} label="Arriérés Totaux" value={`${totalDebt.toLocaleString()} FCFA`} color="#ffebee" />
                <StatCard icon={<Users color="var(--primary)" />} label="Élèves Actifs" value={stats?.stats?.students || 0} color="#f4f7f6" />
                <StatCard icon={<BookOpen color="#6a1b9a" />} label="Classes" value={stats?.stats?.classes || 0} color="#f3e5f5" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1fr', gap: '2rem' }}>

                {/* Main Analytics Card */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    <section className="card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: '700' }}>Analyses des Revenus</h2>
                            <span style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', background: '#eee', borderRadius: '4px' }}>Données en cours</span>
                        </div>
                        <div style={{ padding: '2rem', textAlign: 'center', backgroundColor: '#f8f9fa', borderRadius: '8px', color: 'var(--text-muted)' }}>
                            Graphique temporairement indisponible (en cours de maintenance)
                        </div>
                    </section>

                    <section className="card">
                        <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', fontWeight: '700' }}>Derniers Impayés</h2>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ textAlign: 'left', borderBottom: '1px solid #eee', fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                                        <th style={{ padding: '0.75rem' }}>Élève</th>
                                        <th style={{ padding: '0.75rem' }}>Classe</th>
                                        <th style={{ padding: '0.75rem' }}>Reste</th>
                                        <th style={{ padding: '0.75rem' }}></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {Array.isArray(debts) && debts.length > 0 ? debts.slice(0, 4).map(debt => (
                                        <tr key={debt.id} style={{ borderBottom: '1px solid #f9f9f9' }}>
                                            <td style={{ padding: '0.75rem', fontWeight: '600', fontSize: '0.9rem' }}>{debt.name}</td>
                                            <td style={{ padding: '0.75rem', fontSize: '0.85rem' }}>{debt.className}</td>
                                            <td style={{ padding: '0.75rem', color: 'var(--error)', fontWeight: '700' }}>{(Number(debt.balance) || 0).toLocaleString()}</td>
                                            <td style={{ padding: '0.75rem' }}><ArrowUpRight size={16} color="var(--primary)" /></td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan="4" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                                                Aucun impayé trouvé
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </section>
                </div>

                {/* Side Panel */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <section className="card" style={{ background: 'var(--primary-dark)', color: 'white' }}>
                        <h3 style={{ fontSize: '1rem', marginBottom: '1.5rem', opacity: 0.9 }}>Taux de Recouvrement</h3>
                        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                            <div style={{ fontSize: '3rem', fontWeight: '800' }}>{collectionRate}%</div>
                            <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>Objectif: 95%</div>
                        </div>
                        <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                            <div style={{ width: `${collectionRate}%`, height: '100%', background: '#ffca28', borderRadius: '4px' }}></div>
                        </div>
                    </section>

                    <section className="card">
                        <h3 style={{ fontSize: '1rem', marginBottom: '1.25rem', fontWeight: '700' }}>Actions Rapides</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {(user.role === 'ADMIN' || user.role === 'ACCOUNTANT' || user.role === 'SUPER_ADMIN') && (
                                <ActionButton icon={<Download size={18} />} label="Rapport Comptable" />
                            )}
                            <ActionButton icon={<Users size={18} />} label="Liste des Éleves" onClick={() => navigate('/students')} />
                            {(user.role === 'ADMIN' || user.role === 'ACCOUNTANT' || user.role === 'SUPER_ADMIN') && (
                                <ActionButton icon={<CreditCard size={18} />} label="Nouveau Paiement" primary onClick={() => navigate('/payments')} />
                            )}
                        </div>
                    </section>


                    <section className="card" style={{ border: '1px solid var(--primary-light)', backgroundColor: '#f0f4f8' }}>
                        <h3 style={{ fontSize: '0.9rem', marginBottom: '0.5rem', color: 'var(--primary)' }}>Assistant IA</h3>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-main)', marginBottom: '1rem' }}>Besoin d'aide pour une analyse ou un document ?</p>
                        <button className="btn btn-primary" style={{ width: '100%', fontSize: '0.8rem' }}>Démarrer Chat</button>
                    </section>
                </div>

            </div>
        </div>
    );
};

const StatCard = ({ icon, label, value, trend, color }) => (
    <div className="card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
        <div style={{ padding: '1rem', borderRadius: '12px', backgroundColor: color }}>{icon}</div>
        <div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{label}</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: '0.25rem 0' }}>{value}</div>
            {trend && <div style={{ fontSize: '0.75rem', color: '#2e7d32' }}>{trend}</div>}
        </div>
    </div>
);

const ActionButton = ({ icon, label, primary, onClick }) => (
    <button onClick={onClick} className="btn" style={{
        display: 'flex', alignItems: 'center', gap: '0.75rem',
        backgroundColor: primary ? 'var(--primary)' : '#f8f9fa',
        color: primary ? 'white' : 'var(--text-main)',
        width: '100%', textAlign: 'left', padding: '0.8rem',
        border: '1px solid #eee'
    }}>
        {icon} <span style={{ fontSize: '0.85rem' }}>{label}</span>
    </button>
);

export default Dashboard;
