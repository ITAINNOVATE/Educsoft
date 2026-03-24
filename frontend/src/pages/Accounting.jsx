import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import config from '../config';
import {
    TrendingUp,
    AlertTriangle,
    Download,
    FileText,
    Search,
    Filter,
    ArrowUpRight,
    CheckCircle
} from 'lucide-react';

const Accounting = () => {
    const [stats, setStats] = useState(null);
    const [debts, setDebts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const { user } = useAuth();

    const [dateRange, setDateRange] = useState({ start: '', end: '' });

    const API_BASE = `${config.API_URL}/accounting`;

    useEffect(() => {
        if (user?.token) {
            fetchData();
        }
    }, [user, dateRange]); // Re-fetch when date range changes

    const fetchData = async () => {
        try {
            setLoading(true);
            const authHeader = { headers: { Authorization: `Bearer ${user.token}` } };
            let query = '';
            if (dateRange.start && dateRange.end) {
                query = `?startDate=${dateRange.start}&endDate=${dateRange.end}`;
            }

            const [statsRes, debtsRes] = await Promise.all([
                axios.get(`${API_BASE}/stats${query}`, authHeader),
                axios.get(`${API_BASE}/debts`, authHeader)
            ]);
            setStats(statsRes.data);
            setDebts(debtsRes.data);
        } catch (error) {
            console.error('Error fetching accounting data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleExport = () => {
        // Implementation for export with date range
        alert(`Exportation du rapport du ${dateRange.start || 'début'} au ${dateRange.end || 'aujourd\'hui'}`);
    };

    // ... existing filter logic ...

    const filteredDebts = debts.filter(debt =>
        debt.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        debt.regNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        debt.className.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalDebt = debts.reduce((acc, curr) => acc + curr.balance, 0);

    if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><div className="spinner"></div></div>;

    return (
        <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
            <header style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h1 style={{ fontSize: '2rem', color: 'var(--primary-dark)', fontWeight: '800' }}>Comptabilité</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Suivi financier, recettes et gestion des arriérés.</p>
                </div>

                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label style={{ fontSize: '0.75rem', fontWeight: '600', color: '#666', marginBottom: '0.25rem', display: 'block' }}>Du</label>
                        <input type="date" className="form-input" style={{ padding: '0.5rem' }} value={dateRange.start} onChange={e => setDateRange({ ...dateRange, start: e.target.value })} />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label style={{ fontSize: '0.75rem', fontWeight: '600', color: '#666', marginBottom: '0.25rem', display: 'block' }}>Au</label>
                        <input type="date" className="form-input" style={{ padding: '0.5rem' }} value={dateRange.end} onChange={e => setDateRange({ ...dateRange, end: e.target.value })} />
                    </div>
                    <button onClick={handleExport} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', height: '38px' }}>
                        <Download size={18} /> Exporter Rapport
                    </button>
                </div>
            </header>

            {/* Stats Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
                <StatCard
                    label="Recettes Totales"
                    value={`${(stats?.revenueTotal || 0).toLocaleString()} FCFA`}
                    icon={<TrendingUp color="#2e7d32" />}
                    color="#e8f5e9"
                />
                <StatCard
                    label="Total des Arriérés"
                    value={`${totalDebt.toLocaleString()} FCFA`}
                    icon={<AlertTriangle color="#c62828" />}
                    color="#ffebee"
                />
                <StatCard
                    label="Recettes ce Mois"
                    value={`${(stats?.revenueMonth || 0).toLocaleString()} FCFA`}
                    icon={<TrendingUp color="#1565c0" />}
                    color="#e3f2fd"
                />
                <StatCard
                    label="Taux de Recouvrement"
                    value={`${stats?.revenueTotal ? Math.round((stats.revenueTotal / (stats.revenueTotal + totalDebt)) * 100) : 0}%`}
                    icon={<CheckCircle color="#6a1b9a" />}
                    color="#f3e5f5"
                />
            </div>

            {/* Debts Table */}
            <section className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                    <h2 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <AlertTriangle color="#c62828" size={20} /> Liste des Élèves Endettés
                    </h2>

                    <div style={{ position: 'relative' }}>
                        <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input
                            type="text"
                            placeholder="Rechercher un élève..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{
                                padding: '0.6rem 1rem 0.6rem 2.5rem',
                                borderRadius: '8px',
                                border: '1px solid #ddd',
                                width: '300px',
                                outline: 'none'
                            }}
                        />
                    </div>
                </div>

                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ textAlign: 'left', borderBottom: '2px solid #eee', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                                <th style={{ padding: '1rem' }}>Matricule</th>
                                <th style={{ padding: '1rem' }}>Élève</th>
                                <th style={{ padding: '1rem' }}>Classe</th>
                                <th style={{ padding: '1rem' }}>Total Frais</th>
                                <th style={{ padding: '1rem' }}>Payé</th>
                                <th style={{ padding: '1rem' }}>Reste à Payer</th>
                                <th style={{ padding: '1rem' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredDebts.map(debt => (
                                <tr key={debt.id} style={{ borderBottom: '1px solid #f9f9f9', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.backgroundColor = '#fcfcfc'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                                    <td style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>{debt.regNumber}</td>
                                    <td style={{ padding: '1rem', fontWeight: '500' }}>{debt.name}</td>
                                    <td style={{ padding: '1rem' }}>{debt.className}</td>
                                    <td style={{ padding: '1rem' }}>{debt.totalFees.toLocaleString()}</td>
                                    <td style={{ padding: '1rem', color: '#2e7d32' }}>{debt.paid.toLocaleString()}</td>
                                    <td style={{ padding: '1rem' }}>
                                        <div style={{ color: 'var(--error)', fontWeight: 'bold' }}>{debt.balance.toLocaleString()}</div>
                                        <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
                                            {debt.breakdown.obligatory > 0 && (
                                                <span title="Obligatoire" style={{ padding: '2px 6px', background: '#ffebee', color: '#c62828', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 'bold' }}>
                                                    OBL: {debt.breakdown.obligatory.toLocaleString()}
                                                </span>
                                            )}
                                            {debt.breakdown.optional > 0 && (
                                                <span title="Optionnel" style={{ padding: '2px 6px', background: '#fff3e0', color: '#ef6c00', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 'bold' }}>
                                                    OPT: {debt.breakdown.optional.toLocaleString()}
                                                </span>
                                            )}
                                            {debt.breakdown.occasional > 0 && (
                                                <span title="Occasionnel" style={{ padding: '2px 6px', background: '#f5f5f5', color: '#616161', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 'bold' }}>
                                                    OCC: {debt.breakdown.occasional.toLocaleString()}
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <button style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                            <FileText size={16} /> Relancer
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {filteredDebts.length === 0 && (
                        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                            {searchTerm ? 'Aucun résultat pour cette recherche.' : 'Aucun arriéré de paiement pour le moment.'}
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
};

const StatCard = ({ icon, label, value, color }) => (
    <div className="card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
        <div style={{ padding: '1rem', borderRadius: '12px', backgroundColor: color }}>{icon}</div>
        <div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{label}</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 'bold', marginTop: '0.25rem' }}>{value}</div>
        </div>
    </div>
);

export default Accounting;
