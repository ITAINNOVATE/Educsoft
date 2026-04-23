import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import config from '../config';
import { useNavigate, Link } from 'react-router-dom';
import {
    TrendingUp,
    Users,
    BookOpen,
    ArrowUpRight,
    Download,
    CreditCard,
    UserPlus,
    FileText,
    Calendar,
    GraduationCap,
    Clock
} from 'lucide-react';

const Dashboard = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { user } = useAuth();
    const navigate = useNavigate();

    const API_URL = `${config.API_URL}/dashboard/summary`;

    useEffect(() => {
        let isMounted = true;
        const load = async () => {
            if (user?.token) {
                if (user.role === 'SUPER_ADMIN' && !user.establishmentId) {
                    setLoading(false);
                    return;
                }
                try {
                    const res = await axios.get(API_URL, {
                        headers: { Authorization: `Bearer ${user.token}` }
                    });
                    if (isMounted) setData(res.data);
                } catch (err) {
                    console.error('Error fetching dashboard summary:', err);
                    if (isMounted) setError('Impossible de charger les données du tableau de bord');
                } finally {
                    if (isMounted) setLoading(false);
                }
            }
        };
        load();
        return () => { isMounted = false; };
    }, [user, user?.establishmentId, user?.token]);

    if (loading) return <LoadingScreen />;
    if (user.role === 'SUPER_ADMIN' && !user.establishmentId) return <SuperAdminWelcome navigate={navigate} />;
    if (error || !data) return <ErrorScreen error={error} retry={() => window.location.reload()} />;

    return (
        <div className="responsive-container" style={{ maxWidth: '1400px', margin: '0 auto' }}>
            {/* Common Header */}
            <header className="stack-on-mobile" style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1.5rem', background: 'white', padding: '1.5rem', borderRadius: '24px', border: '1px solid #f1f5f9', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                <div>
                    <h1 style={{ fontSize: '2rem', color: 'var(--primary-dark)', fontWeight: '900', margin: 0 }}>Tableau de Bord</h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '1rem', margin: '0.5rem 0 0 0' }}>Bonjour, <span style={{ color: 'var(--primary)', fontWeight: '700' }}>{user.firstName}</span>. {dashboardMotto(user.role)}</p>
                </div>
                <div className="desktop-only" style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.9rem', fontWeight: '800', color: 'var(--primary)', background: 'rgba(var(--primary-rgb), 0.1)', padding: '0.4rem 1rem', borderRadius: '10px' }}>
                        {new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </div>
                </div>
            </header>

            {/* Role-Specific Content */}
            {renderDashboardByRole(user.role, data, navigate)}
        </div>
    );
};

// --- MOTO SELECTOR ---
const dashboardMotto = (role) => {
    switch (role) {
        case 'ADMIN':
        case 'SUPER_ADMIN': return "Voici l'état global de votre établissement.";
        case 'FOUNDER':     return "Vue d'ensemble de votre établissement.";
        case 'ACCOUNTANT':  return "Aperçu de la situation financière aujourd'hui.";
        case 'SECRETARY':   return "Inscriptions et gestion administrative en cours.";
        case 'TEACHER':     return "Suivi de vos classes et notes.";
        case 'DIRECTOR':    return "Pilotage pédagogique et administratif.";
        case 'CENSEUR':     return "Suivi académique et discipline de l'établissement.";
        case 'SURVEILLANT_GENERAL': return "Surveillance générale et suivi des élèves.";
        default: return "Bienvenue sur votre espace de gestion.";
    }
};

// --- RENDER LOGIC ---
const renderDashboardByRole = (role, data, navigate) => {
    switch (role) {
        case 'ADMIN':
        case 'ACCOUNTANT':
        case 'FOUNDER':
        case 'SUPER_ADMIN':
            return <ManagementDashboard data={data} navigate={navigate} />;
        case 'SECRETARY':
            return <SecretaryDashboard data={data} navigate={navigate} />;
        case 'TEACHER':
            return <TeacherDashboard data={data} navigate={navigate} />;
        case 'DIRECTOR':
        case 'CENSEUR':
        case 'SURVEILLANT_GENERAL':
            return <DirectorDashboard data={data} navigate={navigate} />;
        default:
            return <DefaultDashboard data={data} />;
    }
};

// --- DASHBOARD LAYOUTS ---

const ManagementDashboard = ({ data, navigate }) => {
    const { management, totals } = data;
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div className="grid-resp-2" style={{ gap: '1.25rem' }}>
                <StatCard icon={<TrendingUp />} label="Recettes du Mois" value={`${(management.revenueMonth || 0).toLocaleString()} FCFA`} color="var(--primary)" bg="rgba(var(--primary-rgb), 0.1)" />
                <StatCard icon={<Users />} label="Élèves Actifs" value={totals.students} color="#0ea5e9" bg="#f0f9ff" />
                <StatCard icon={<BookOpen />} label="Classes" value={totals.classes} color="#8b5cf6" bg="#f5f3ff" />
                <StatCard icon={<CreditCard />} label="Total Recettes" value={`${(management.revenueTotal || 0).toLocaleString()} FCFA`} color="#10b981" bg="#ecfdf5" />
            </div>

            <div className="grid-resp-2" style={{ gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
                <section className="card" style={{ padding: '1.5rem', borderRadius: '24px' }}>
                    <h3 style={{ marginBottom: '1.5rem', fontWeight: '800' }}>Flux de Trésorerie (7j)</h3>
                    <div style={{ height: '250px', display: 'flex', alignItems: 'flex-end', gap: '15px' }}>
                        {management.chartData.map((d, i) => (
                            <Bar key={i} label={d.day} value={d.amount} max={Math.max(...management.chartData.map(x => x.amount), 1)} />
                        ))}
                    </div>
                </section>
                <section className="card" style={{ padding: '1.5rem', borderRadius: '24px' }}>
                    <h3 style={{ marginBottom: '1.5rem', fontWeight: '800' }}>Actions Rapides</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <QuickAction icon={<CreditCard />} label="Encaisser Frais" onClick={() => navigate('/payments')} primary />
                        <QuickAction icon={<FileText />} label="Rapport Comptable" onClick={() => navigate('/accounting')} />
                        <QuickAction icon={<Download />} label="Extraire Données" onClick={() => navigate('/configuration')} />
                    </div>
                </section>
            </div>

            <section className="card" style={{ padding: 0, overflow: 'hidden', borderRadius: '24px' }}>
                <div style={{ padding: '1.5rem', borderBottom: '1px solid #f1f5f9' }}>
                    <h3 style={{ margin: 0, fontWeight: '800' }}>Derniers Paiements</h3>
                </div>
                <div className="table-container fade-in">
                    <table className="responsive-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ textAlign: 'left', background: '#f8fafc', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                                <th style={{ padding: '1rem 1.5rem' }}>Élève</th>
                                <th style={{ padding: '1rem 1.5rem' }}>Date</th>
                                <th style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>Montant</th>
                            </tr>
                        </thead>
                        <tbody>
                            {management.recentPayments.map(p => (
                                <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                    <td data-label="Élève" style={{ padding: '1rem 1.5rem', fontWeight: '700' }}>{p.student.lastName} {p.student.firstName}</td>
                                    <td data-label="Date" style={{ padding: '1rem 1.5rem', fontSize: '0.85rem', color: '#64748b' }}>{new Date(p.paymentDate).toLocaleDateString()}</td>
                                    <td data-label="Montant" style={{ padding: '1rem 1.5rem', textAlign: 'right', fontWeight: '900', color: 'var(--primary)' }}>{p.amount.toLocaleString()} FCFA</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
};

const SecretaryDashboard = ({ data, navigate }) => {
    const { administrative, totals } = data;
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div className="grid-resp-2" style={{ gap: '1.25rem' }}>
                <StatCard icon={<UserPlus />} label="Nouveaux Élèves (30j)" value={administrative.newStudentsMonth} color="var(--primary)" bg="rgba(var(--primary-rgb), 0.1)" />
                <StatCard icon={<Clock />} label="Inscriptions en Attente" value={administrative.pendingEnrollments} color="#f59e0b" bg="#fffbeb" />
                <StatCard icon={<Users />} label="Effectif Total" value={totals.students} color="#0ea5e9" bg="#f0f9ff" />
                <StatCard icon={<BookOpen />} label="Classes Actives" value={totals.classes} color="#8b5cf6" bg="#f5f3ff" />
            </div>

            <div className="grid-resp-2" style={{ gap: '1.5rem' }}>
                <section className="card" style={{ padding: 0, overflow: 'hidden', borderRadius: '24px' }}>
                    <div style={{ padding: '1.5rem', borderBottom: '1px solid #f1f5f9' }}>
                        <h3 style={{ margin: 0, fontWeight: '800' }}>Dernières Inscriptions</h3>
                    </div>
                    <div className="table-container">
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <tbody>
                                {administrative.latestStudents.map(s => (
                                    <tr key={s.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                        <td style={{ padding: '1.2rem 1.5rem' }}>
                                            <div style={{ fontWeight: '800' }}>{s.name}</div>
                                            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{s.class}</div>
                                        </td>
                                        <td style={{ padding: '1.2rem 1.5rem', textAlign: 'right', color: '#64748b', fontSize: '0.85rem' }}>
                                            {new Date(s.date).toLocaleDateString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>
                <section className="card" style={{ padding: '1.5rem', borderRadius: '24px' }}>
                    <h3 style={{ marginBottom: '1.5rem', fontWeight: '800' }}>Gestion Administrative</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <QuickAction icon={<UserPlus />} label="Nouvelle Inscription" onClick={() => navigate('/students')} primary />
                        <QuickAction icon={<Calendar />} label="Planning & Classes" onClick={() => navigate('/configuration')} />
                        <QuickAction icon={<Download />} label="Certificat Scolarité" onClick={() => navigate('/students')} />
                    </div>
                </section>
            </div>
        </div>
    );
};

const TeacherDashboard = ({ data, navigate }) => {
    const { academic, totals } = data;
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div className="grid-resp-2" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem' }}>
                <StatCard icon={<GraduationCap />} label="Mes Matières" value={academic.subjectCount} color="#8b5cf6" bg="#f5f3ff" />
                <StatCard icon={<Users />} label="Mes Élèves" value={totals.students} color="#0ea5e9" bg="#f0f9ff" />
                <StatCard icon={<BookOpen />} label="Mes Classes" value={totals.classes} color="var(--primary)" bg="rgba(var(--primary-rgb), 0.1)" />
            </div>

            <div className="grid-resp-2" style={{ gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
                <section className="card" style={{ padding: 0, overflow: 'hidden', borderRadius: '24px' }}>
                    <div style={{ padding: '1.5rem', borderBottom: '1px solid #f1f5f9' }}>
                        <h3 style={{ margin: 0, fontWeight: '800' }}>Dernières Notes Saisies</h3>
                    </div>
                    <div className="table-container">
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <tbody>
                                {academic.recentGrades.map(g => (
                                    <tr key={g.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                        <td style={{ padding: '1.2rem 1.5rem' }}>
                                            <div style={{ fontWeight: '800' }}>{g.studentName}</div>
                                            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{g.subject}</div>
                                        </td>
                                        <td style={{ padding: '1.2rem 1.5rem', textAlign: 'right' }}>
                                            <div style={{ fontWeight: '900', color: g.value >= 10 ? '#10b981' : '#ef4444' }}>{g.value.toFixed(2)} / 20</div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>
                <section className="card" style={{ padding: '1.5rem', borderRadius: '24px' }}>
                    <h3 style={{ marginBottom: '1.5rem', fontWeight: '800' }}>Espace Pédagogique</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <QuickAction icon={<FileText />} label="Saisir des Notes" onClick={() => navigate('/grades')} primary />
                        <QuickAction icon={<Users />} label="Liste de Classe" onClick={() => navigate('/students')} />
                        <QuickAction icon={<Calendar />} label="Bulletins" onClick={() => navigate('/grades')} />
                    </div>
                </section>
            </div>
        </div>
    );
};

const DirectorDashboard = ({ data, navigate }) => {
    const { administrative, academic, totals } = data;
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div className="grid-resp-2" style={{ gap: '1.25rem' }}>
                <StatCard icon={<Users />} label="Élèves Actifs" value={totals.students} color="#0ea5e9" bg="#f0f9ff" />
                <StatCard icon={<BookOpen />} label="Classes Totales" value={totals.classes} color="#8b5cf6" bg="#f5f3ff" />
                <StatCard icon={<UserPlus />} label="Inscr. Mensuelles" value={administrative.newStudentsMonth} color="var(--primary)" bg="rgba(var(--primary-rgb), 0.1)" />
                <StatCard icon={<Clock />} label="Alertes Admin" value={administrative.pendingEnrollments} color="#f59e0b" bg="#fffbeb" />
            </div>
            
            <div className="grid-resp-2" style={{ gap: '1.5rem' }}>
                <section className="card" style={{ padding: '1.5rem', borderRadius: '24px' }}>
                    <h3 style={{ marginBottom: '1.5rem', fontWeight: '800' }}>Dernières Notes</h3>
                    {academic.recentGrades.map((g, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0', borderBottom: '1px solid #f1f5f9' }}>
                            <span style={{ fontSize: '0.9rem', fontWeight: '600' }}>{g.studentName}</span>
                            <span style={{ fontWeight: '800', color: 'var(--primary)' }}>{g.value}</span>
                        </div>
                    ))}
                </section>
                <section className="card" style={{ padding: '1.5rem', borderRadius: '24px' }}>
                    <h3 style={{ marginBottom: '1.5rem', fontWeight: '800' }}>Pilotage</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <QuickAction icon={<FileText />} label="Bulletins Scolaires" onClick={() => navigate('/grades')} primary />
                        <QuickAction icon={<TrendingUp />} label="Analyses Académiques" onClick={() => navigate('/dashboard')} />
                    </div>
                </section>
            </div>
        </div>
    );
};

// --- GENERIC COMPONENTS ---

const StatCard = ({ icon, label, value, color, bg }) => (
    <div className="card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.5rem', borderRadius: '24px' }}>
        <div style={{ padding: '1rem', borderRadius: '16px', backgroundColor: bg, color: color }}>{icon}</div>
        <div>
            <div style={{ color: '#94a3b8', fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase' }}>{label}</div>
            <div style={{ fontSize: '1.5rem', fontWeight: '900', color: 'var(--primary-dark)' }}>{value}</div>
        </div>
    </div>
);

const QuickAction = ({ icon, label, primary, onClick }) => (
    <button onClick={onClick} style={{
        display: 'flex', alignItems: 'center', gap: '1rem', width: '100%', padding: '1rem',
        backgroundColor: primary ? 'var(--primary)' : 'white',
        color: primary ? 'white' : 'var(--primary-dark)',
        border: primary ? 'none' : '1px solid #e2e8f0',
        borderRadius: '16px', fontWeight: '800', cursor: 'pointer', transition: 'transform 0.2s'
    }}>
        {icon} <span>{label}</span>
    </button>
);

const Bar = ({ label, value, max }) => {
    const height = (value / max) * 100;
    return (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', gap: '10px' }}>
            <div style={{ flex: 1, width: '100%', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
                <div style={{ width: '100%', maxWidth: '30px', height: `${height}%`, background: 'var(--primary)', borderRadius: '6px' }} />
            </div>
            <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: '700' }}>{label}</span>
        </div>
    );
};

const LoadingScreen = () => (
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '80vh', gap: '1rem' }}>
        <div className="spinner" style={{ width: '40px', height: '40px', border: '4px solid #f3f3f3', borderTop: '4px solid var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
    </div>
);

const ErrorScreen = ({ error, retry }) => (
    <div style={{ textAlign: 'center', padding: '4rem' }}>
        <h2 style={{ color: '#ef4444' }}>Oups !</h2>
        <p>{error}</p>
        <button className="btn btn-primary" onClick={retry}>Réessayer</button>
    </div>
);

const SuperAdminWelcome = ({ navigate }) => (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <div className="card" style={{ maxWidth: '500px', textAlign: 'center', padding: '3rem' }}>
            <h2>Bienvenue, Super Admin</h2>
            <p>Veuillez sélectionner un établissement pour accéder aux données.</p>
            <button className="btn btn-primary" onClick={() => navigate('/system')}>Sélecteur d'école</button>
        </div>
    </div>
);

const DefaultDashboard = ({ data }) => (
    <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
        <h2>Bienvenue sur EduSoft</h2>
        <p>Vous êtes connecté en tant que {data.role}.</p>
    </div>
);

export default Dashboard;
