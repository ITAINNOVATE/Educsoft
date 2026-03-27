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
    const { user } = useAuth();
    const navigate = useNavigate();

    const API_BASE = `${config.API_URL}/accounting`;

    useEffect(() => {
        if (user?.token) {
            fetchStats();
        }
    }, [user]);

    const fetchStats = async () => {
        try {
            setLoading(true);
            const authHeader = { headers: { Authorization: `Bearer ${user.token}` } };
            const [statsRes, debtsRes] = await Promise.all([
                axios.get(`${API_BASE}/stats`, authHeader),
                axios.get(`${API_BASE}/debts`, authHeader)
            ]);

            // Transform stats for chart if needed, or expect backend to send chartData
            const statsData = statsRes.data;
            if (!statsData.chartData) {
                // Mock chart data if not provided by backend yet
                statsData.chartData = [
                    { label: 'Lun', amount: 150000 },
                    { label: 'Mar', amount: 230000 },
                    { label: 'Mer', amount: 180000 },
                    { label: 'Jeu', amount: 320000 },
                    { label: 'Ven', amount: 290000 },
                    { label: 'Sam', amount: 120000 },
                    { label: 'Dim', amount: 0 }
                ];
            }

            setStats(statsData);
            setDebts(debtsRes.data);
        } catch (error) {
            console.error('Error fetching dashboard stats:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading || !stats) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', padding: '2rem' }}>
                <div style={{ textAlign: 'center' }}>
                    <p style={{ color: 'var(--text-muted)' }}>Chargement du tableau de bord...</p>
                </div>
            </div>
        );
    }

    const totalRevenue = stats.revenueTotal || 0;
    const totalDebt = debts.reduce((acc, curr) => acc + curr.balance, 0);
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
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <span style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', background: '#eee', borderRadius: '4px' }}>7 derniers jours</span>
                            </div>
                        </div>

                        {/* Dynamic SVG Revenue Chart */}
                        <div style={{ width: '100%', height: '220px', position: 'relative', marginTop: '1rem' }}>
                            {stats?.chartData && stats.chartData.length > 0 ? (
                                <svg width="100%" height="100%" viewBox="0 0 800 200" preserveAspectRatio="none">
                                    {/* Grid Lines */}
                                    <line x1="0" y1="150" x2="800" y2="150" stroke="#eee" strokeWidth="1" />
                                    <line x1="0" y1="100" x2="800" y2="100" stroke="#eee" strokeWidth="1" />
                                    <line x1="0" y1="50" x2="800" y2="50" stroke="#eee" strokeWidth="1" />

                                    {/* Area Path */}
                                    <path
                                        d={`M 0 200 ${stats.chartData.map((d, i) => {
                                            const x = (i / (stats.chartData.length - 1)) * 800;
                                            const y = 200 - (d.amount / (Math.max(...stats.chartData.map(d => d.amount)) || 1)) * 180;
                                            return `L ${x} ${y}`;
                                        }).join(' ')} L 800 200 Z`}
                                        fill="rgba(46, 125, 50, 0.1)"
                                    />

                                    {/* Line Path */}
                                    <path
                                        d={`M 0 ${200 - (stats.chartData[0].amount / (Math.max(...stats.chartData.map(d => d.amount)) || 1)) * 180} ${stats.chartData.map((d, i) => {
                                            const x = (i / (stats.chartData.length - 1)) * 800;
                                            const y = 200 - (d.amount / (Math.max(...stats.chartData.map(d => d.amount)) || 1)) * 180;
                                            return `L ${x} ${y}`;
                                        }).join(' ')}`}
                                        fill="none"
                                        stroke="var(--primary)"
                                        strokeWidth="3"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />

                                    {/* Data Points */}
                                    {stats.chartData.map((d, i) => {
                                        const x = (i / (stats.chartData.length - 1)) * 800;
                                        const y = 200 - (d.amount / (Math.max(...stats.chartData.map(d => d.amount)) || 1)) * 180;
                                        return (
                                            <circle key={i} cx={x} cy={y} r="4" fill="white" stroke="var(--primary)" strokeWidth="2" />
                                        );
                                    })}
                                </svg>
                            ) : (
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#999', fontSize: '0.9rem' }}>
                                    Pas assez de données pour afficher le graphique
                                </div>
                            )}

                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                                {stats?.chartData?.map((d, i) => (
                                    <span key={i}>{d.label}</span>
                                ))}
                            </div>
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
                                    {debts.slice(0, 4).map(debt => (
                                        <tr key={debt.id} style={{ borderBottom: '1px solid #f9f9f9' }}>
                                            <td style={{ padding: '0.75rem', fontWeight: '600', fontSize: '0.9rem' }}>{debt.name}</td>
                                            <td style={{ padding: '0.75rem', fontSize: '0.85rem' }}>{debt.className}</td>
                                            <td style={{ padding: '0.75rem', color: 'var(--error)', fontWeight: '700' }}>{debt.balance.toLocaleString()}</td>
                                            <td style={{ padding: '0.75rem' }}><ArrowUpRight size={16} color="var(--primary)" /></td>
                                        </tr>
                                    ))}
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
