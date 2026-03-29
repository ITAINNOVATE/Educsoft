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
        <div style={{ padding: '1rem', maxWidth: '1400px', margin: '0 auto' }}>
            <header className="stack-on-mobile animate-fade-in" style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1.5rem', background: 'white', padding: '1.5rem', borderRadius: '24px', border: '1px solid #f1f5f9', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                <div>
                    <h1 style={{ fontSize: '2.2rem', color: 'var(--primary-dark)', fontWeight: '900', lineHeight: 1.1, margin: 0, letterSpacing: '-0.02em' }}>Tableau de Bord</h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '1rem', margin: '0.5rem 0 0 0', fontWeight: '500' }}>Ravi de vous revoir, <span style={{ color: 'var(--primary)', fontWeight: '700' }}>{user.firstName}</span>. Voici l'activité de l'école.</p>
                </div>
                <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '0.25rem' }} className="desktop-only">
                    <div style={{ fontSize: '0.9rem', fontWeight: '800', color: 'var(--primary)', background: 'rgba(var(--primary-rgb), 0.1)', padding: '0.4rem 1rem', borderRadius: '10px' }}>
                        {new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: '600' }}>Session: {user.role}</div>
                </div>
            </header>

            {/* Stats Cards */}
            <div className="grid-resp-2" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', marginBottom: '3rem', gap: '1.5rem' }}>
                <StatCard 
                    icon={<TrendingUp size={28} />} 
                    label="Recettes du Mois" 
                    value={`${(stats?.revenueMonth || 0).toLocaleString()} FCFA`} 
                    trend="+12.5% ce mois" 
                    color="var(--primary)"
                    bg="rgba(var(--primary-rgb), 0.1)"
                />
                <StatCard 
                    icon={<AlertTriangle size={28} />} 
                    label="Arriérés Totaux" 
                    value={`${totalDebt.toLocaleString()} FCFA`} 
                    color="#ef4444"
                    bg="#fef2f2"
                />
                <StatCard 
                    icon={<Users size={28} />} 
                    label="Élèves Inscrits" 
                    value={stats?.stats?.students || 0} 
                    color="#0ea5e9"
                    bg="#f0f9ff"
                />
                <StatCard 
                    icon={<BookOpen size={28} />} 
                    label="Classes Actives" 
                    value={stats?.stats?.classes || 0} 
                    color="#8b5cf6"
                    bg="#f5f3ff"
                />
            </div>

            <div className="grid-resp-2" style={{ gridTemplateColumns: '2fr 1.2fr', gap: '2rem' }} id="dashboard-grid">
                <style>{`
                    @media (max-width: 1100px) {
                        #dashboard-grid { grid-template-columns: 1fr !important; }
                    }
                `}</style>

                {/* Main Content Area */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    <section className="card fade-in" style={{ padding: '1.5rem', borderRadius: '24px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                            <div>
                                <h2 style={{ fontSize: '1.35rem', fontWeight: '800', color: 'var(--primary-dark)', margin: 0 }}>Flux de Trésorerie</h2>
                                <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>Aperçu des 7 derniers jours</p>
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'var(--primary)' }}></span>
                                <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748b' }}>Recettes</span>
                            </div>
                        </div>
                        <div style={{ height: '240px', width: '100%', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', padding: '1rem 0', gap: '12px' }}>
                            {stats?.chartData?.map((item, index) => {
                                const maxAmount = Math.max(...stats.chartData.map(d => d.amount), 1);
                                const height = (item.amount / maxAmount) * 100;
                                return (
                                    <div key={index} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', height: '100%' }}>
                                        <div style={{ flex: 1, width: '100%', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
                                            <div style={{ 
                                                width: '100%', 
                                                maxWidth: '40px',
                                                height: `${height}%`, 
                                                background: 'linear-gradient(180deg, var(--primary) 0%, var(--primary-dark) 100%)', 
                                                borderRadius: '10px 10px 4px 4px',
                                                transition: 'height 1.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                                                minHeight: item.amount > 0 ? '6px' : '0',
                                                position: 'relative',
                                                boxShadow: '0 4px 12px rgba(var(--primary-rgb), 0.2)'
                                            }}>
                                                {height > 15 && (
                                                    <div style={{ 
                                                        position: 'absolute', 
                                                        top: '-25px', 
                                                        left: '50%', 
                                                        transform: 'translateX(-50%)', 
                                                        fontSize: '0.7rem',
                                                        fontWeight: '900',
                                                        color: 'var(--primary-dark)',
                                                        whiteSpace: 'nowrap'
                                                    }}>
                                                        {item.amount >= 1000 ? `${(item.amount / 1000).toFixed(1)}k` : item.amount}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{item.day}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </section>

                    <section className="card fade-in" style={{ padding: 0, borderRadius: '24px', overflow: 'hidden' }}>
                        <div style={{ padding: '1.5rem', borderBottom: '1px solid #f1f5f9', background: '#f8fafc' }}>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--primary-dark)', margin: 0 }}>Arriérés Critiques</h2>
                            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>Élèves avec les soldes les plus élevés</p>
                        </div>
                        <div className="table-container">
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ textAlign: 'left', background: 'white', borderBottom: '2px solid #f1f5f9', fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                                        <th style={{ padding: '1.25rem 1.5rem', fontWeight: '800' }}>Identité de L'élève</th>
                                        <th style={{ padding: '1.25rem 1.5rem', fontWeight: '800' }}>Classe</th>
                                        <th style={{ padding: '1.25rem 1.5rem', fontWeight: '800', textAlign: 'right' }}>Reste à Payer</th>
                                        <th style={{ padding: '1.25rem 1.5rem', fontWeight: '800', textAlign: 'center' }}>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {Array.isArray(debts) && debts.length > 0 ? debts.slice(0, 5).map(debt => (
                                        <tr key={debt.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.2s' }}>
                                            <td style={{ padding: '1.25rem 1.5rem' }}>
                                                <div style={{ fontWeight: '800', color: 'var(--primary-dark)', fontSize: '0.95rem' }}>{debt.name}</div>
                                                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>#{debt.id.substring(0, 8)}</div>
                                            </td>
                                            <td style={{ padding: '1.25rem 1.5rem' }}>
                                                <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#64748b', background: '#f1f5f9', padding: '0.3rem 0.8rem', borderRadius: '8px' }}>{debt.className}</span>
                                            </td>
                                            <td style={{ padding: '1.25rem 1.5rem', textAlign: 'right' }}>
                                                <div style={{ color: '#ef4444', fontWeight: '900', fontSize: '1rem' }}>{(Number(debt.balance) || 0).toLocaleString()} <small>FCFA</small></div>
                                            </td>
                                            <td style={{ padding: '1.25rem 1.5rem', textAlign: 'center' }}>
                                                <button onClick={() => navigate('/payments')} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', padding: '0.5rem', borderRadius: '8px', transition: 'background 0.2s' }}>
                                                    <ArrowUpRight size={20} />
                                                </button>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan="4" style={{ padding: '4rem 2rem', textAlign: 'center' }}>
                                                <div style={{ color: '#cbd5e1', marginBottom: '1rem' }}><Users size={48} /></div>
                                                <p style={{ color: '#94a3b8', fontSize: '1rem', fontWeight: '600' }}>Aucun arriéré de paiement identifié</p>
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
                    <section className="card fade-in" style={{ background: 'linear-gradient(135deg, var(--primary-dark) 0%, #1e293b 100%)', color: 'white', padding: '2rem', borderRadius: '24px', position: 'relative', overflow: 'hidden' }}>
                        <div style={{ position: 'absolute', top: '-20px', right: '-20px', opacity: 0.1 }}>
                            <TrendingUp size={120} />
                        </div>
                        <h3 style={{ fontSize: '1.1rem', marginBottom: '2rem', fontWeight: '700', opacity: 0.9 }}>Taux de Recouvrement</h3>
                        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                            <div style={{ fontSize: '4rem', fontWeight: '900', color: '#fbbf24', lineHeight: 1 }}>{collectionRate}%</div>
                            <div style={{ fontSize: '0.9rem', opacity: 0.7, marginTop: '0.5rem', fontWeight: '600' }}>Objectif Global: 95%</div>
                        </div>
                        <div style={{ width: '100%', height: '12px', background: 'rgba(255,255,255,0.1)', borderRadius: '6px', overflow: 'hidden', padding: '2px' }}>
                            <div style={{ width: `${collectionRate}%`, height: '100%', background: 'linear-gradient(90deg, #f59e0b 0%, #fbbf24 100%)', borderRadius: '4px', transition: 'width 1.5s ease-out' }}></div>
                        </div>
                    </section>

                    <section className="card fade-in" style={{ padding: '1.5rem', borderRadius: '24px' }}>
                        <h3 style={{ fontSize: '1.1rem', marginBottom: '1.5rem', fontWeight: '800', color: 'var(--primary-dark)' }}>Actions Stratégiques</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {(user.role === 'ADMIN' || user.role === 'ACCOUNTANT' || user.role === 'SUPER_ADMIN') && (
                                <ActionButton icon={<Download size={20} />} label="Rapports Mensuels" />
                            )}
                            <ActionButton icon={<Users size={20} />} label="Annuaire des Élèves" onClick={() => navigate('/students')} />
                            {(user.role === 'ADMIN' || user.role === 'ACCOUNTANT' || user.role === 'SUPER_ADMIN') && (
                                <ActionButton icon={<CreditCard size={20} />} label="Encaisser un Paiement" primary onClick={() => navigate('/payments')} />
                            )}
                        </div>
                    </section>

                    <section className="card fade-in" style={{ border: '2px dashed var(--primary-light)', backgroundColor: 'rgba(var(--primary-rgb), 0.05)', borderRadius: '24px', padding: '1.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                            <div style={{ background: 'var(--primary)', color: 'white', padding: '0.5rem', borderRadius: '8px' }}>
                                <TrendingUp size={16} />
                            </div>
                            <h3 style={{ fontSize: '1rem', fontWeight: '800', color: 'var(--primary)', margin: 0 }}>Assistant IA</h3>
                        </div>
                        <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1.25rem', lineHeight: 1.5, fontWeight: '500' }}>Analysez vos tendances de paiement ou générez des lettres de rappel automatiquement.</p>
                        <button className="btn btn-primary" style={{ width: '100%', padding: '0.8rem', borderRadius: '12px', fontWeight: '800' }}>Consulter l'IA</button>
                    </section>
                </div>
            </div>
        </div>
    );
};

const StatCard = ({ icon, label, value, trend, color, bg }) => (
    <div className="card fade-in" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.5rem', borderRadius: '24px', border: '1px solid #f1f5f9', transition: 'all 0.3s ease' }}>
        <div style={{ 
            padding: '1.25rem', 
            borderRadius: '20px', 
            backgroundColor: bg, 
            color: color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: `0 4px 12px ${color}15`
        }}>
            {icon}
        </div>
        <div>
            <div style={{ color: '#94a3b8', fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.025em' }}>{label}</div>
            <div style={{ fontSize: '1.6rem', fontWeight: '900', color: 'var(--primary-dark)', margin: '0.1rem 0' }}>{value}</div>
            {trend && <div style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <ArrowUpRight size={12} /> {trend}
            </div>}
        </div>
    </div>
);

const ActionButton = ({ icon, label, primary, onClick }) => (
    <button onClick={onClick} className="btn" style={{
        display: 'flex', alignItems: 'center', gap: '1rem',
        backgroundColor: primary ? 'var(--primary)' : 'white',
        color: primary ? 'white' : 'var(--primary-dark)',
        width: '100%', textAlign: 'left', padding: '1rem 1.25rem',
        border: primary ? 'none' : '1px solid #e2e8f0',
        borderRadius: '16px',
        fontWeight: '800',
        fontSize: '0.9rem',
        transition: 'all 0.2s ease',
        boxShadow: primary ? '0 8px 15px -3px rgba(var(--primary-rgb), 0.3)' : '0 2px 4px rgba(0,0,0,0.02)'
    }}>
        <div style={{ opacity: primary ? 1 : 0.7 }}>{icon}</div>
        <span>{label}</span>
    </button>
);

export default Dashboard;
