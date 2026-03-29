import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import config from '../config';
import {
    Users, Plus, DollarSign, Calendar, Search, Filter,
    CheckCircle, AlertCircle, TrendingUp, History, UserPlus
} from 'lucide-react';

const Teachers = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('LIST'); // LIST, PAYMENTS, HISTORY
    const [teachers, setTeachers] = useState([]); // List of users with role TEACHER
    const [payments, setPayments] = useState([]);
    const [stats, setStats] = useState([]);
    const [loading, setLoading] = useState(false);

    // Forms
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [newPayment, setNewPayment] = useState({
        teacherId: '', amount: '', period: new Date().toISOString().slice(0, 7), type: 'SALARY', notes: '', reference: ''
    });

    // New Teacher Form
    const [showTeacherModal, setShowTeacherModal] = useState(false);
    const [newTeacher, setNewTeacher] = useState({
        firstName: '', lastName: '', email: '', password: 'password123', role: 'TEACHER'
    });

    const API_BASE = config.API_URL;

    useEffect(() => {
        fetchTeachers();
        if (activeTab === 'HISTORY' || activeTab === 'PAYMENTS') {
            fetchPayments();
        }
        if (activeTab === 'PAYMENTS') {
            fetchStats();
        }
    }, [activeTab]);

    const fetchTeachers = async () => {
        try {
            const res = await axios.get(`${API_BASE}/users`, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            const rawData = Array.isArray(res.data) ? res.data : [];
            const teacherList = rawData.filter(u => u.role === 'TEACHER');
            setTeachers(teacherList);
        } catch (error) {
            console.error('Error fetching teachers:', error);
        }
    };

    const fetchPayments = async () => {
        try {
            const res = await axios.get(`${API_BASE}/teacher-payments`, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            setPayments(Array.isArray(res.data) ? res.data : []);
        } catch (error) {
            console.error('Error fetching payments:', error);
        }
    };

    const fetchStats = async () => {
        try {
            const res = await axios.get(`${API_BASE}/teacher-payments/stats`, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            setStats(Array.isArray(res.data) ? res.data : []);
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    const handleCreateTeacher = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`${API_BASE}/users/register`, newTeacher, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            alert('Enseignant ajouté avec succès');
            setShowTeacherModal(false);
            setNewTeacher({ firstName: '', lastName: '', email: '', password: 'password123', role: 'TEACHER' });
            fetchTeachers();
        } catch (error) {
            alert('Erreur lors de la création');
        }
    };

    const handleCreatePayment = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`${API_BASE}/teacher-payments`, newPayment, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            alert('Paiement enregistré');
            setShowPaymentModal(false);
            setNewPayment({ teacherId: '', amount: '', period: new Date().toISOString().slice(0, 7), type: 'SALARY', notes: '', reference: '' });
            fetchPayments();
            fetchStats();
        } catch (error) {
            alert('Erreur lors du paiement');
        }
    };

    return (
        <div style={{ padding: '1rem', maxWidth: '1200px', margin: '0 auto' }}>
            <header className="stack-on-mobile" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', gap: '1rem' }}>
                <div>
                    <h1 style={{ fontSize: '2.2rem', color: 'var(--primary-dark)', display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: '800', margin: 0 }}>
                        <Users size={32} /> Enseignants
                    </h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>Gestion du corps professoral et émoluments.</p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', width: '100%', maxWidth: '400px' }} className="stack-on-mobile">
                    <button
                        className={`btn ${activeTab === 'LIST' ? 'btn-primary' : ''}`}
                        onClick={() => setActiveTab('LIST')}
                        style={{ flex: 1, border: activeTab !== 'LIST' ? '1px solid #e2e8f0' : 'none', height: '45px' }}
                    >
                        Effectif
                    </button>
                    <button
                        className={`btn ${activeTab === 'PAYMENTS' ? 'btn-primary' : ''}`}
                        onClick={() => setActiveTab('PAYMENTS')}
                        style={{ flex: 1, border: activeTab !== 'PAYMENTS' ? '1px solid #e2e8f0' : 'none', height: '45px' }}
                    >
                        Paiements
                    </button>
                </div>
            </header>

            {activeTab === 'LIST' && (
                <div className="fade-in">
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.5rem' }}>
                        <button className="btn btn-primary" style={{ height: '45px', padding: '0 1.5rem' }} onClick={() => setShowTeacherModal(true)}>
                            <UserPlus size={18} style={{ marginRight: '0.5rem' }} /> Nouvel Enseignant
                        </button>
                    </div>

                    <div className="card" style={{ padding: '0', borderRadius: '16px', overflow: 'hidden' }}>
                        <div className="table-container">
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #f1f5f9' }}>
                                    <tr>
                                        <th style={{ padding: '1rem 1.5rem', textAlign: 'left', fontSize: '0.85rem', color: '#64748b' }}>Nom & Prénoms</th>
                                        <th style={{ padding: '1rem 1.5rem', textAlign: 'left', fontSize: '0.85rem', color: '#64748b' }}>Contact / Email</th>
                                        <th style={{ padding: '1rem 1.5rem', textAlign: 'left', fontSize: '0.85rem', color: '#64748b' }}>Statut</th>
                                        <th style={{ padding: '1rem 1.5rem', textAlign: 'right', fontSize: '0.85rem', color: '#64748b' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {Array.isArray(teachers) && teachers.length > 0 ? (
                                        teachers.map(t => (
                                            <tr key={t.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                <td style={{ padding: '1rem 1.5rem' }}>
                                                    <div style={{ fontWeight: '700', color: 'var(--primary-dark)' }}>{t.lastName || '---'} {t.firstName || ''}</div>
                                                    <div className="mobile-only" style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{t.email || '---'}</div>
                                                </td>
                                                <td style={{ padding: '1rem 1.5rem' }}>
                                                    <div style={{ fontSize: '0.9rem' }}>{t.email}</div>
                                                </td>
                                                <td style={{ padding: '1rem 1.5rem' }}>
                                                    <span style={{ padding: '0.3rem 0.6rem', borderRadius: '6px', backgroundColor: '#dcfce7', color: '#166534', fontSize: '0.7rem', fontWeight: '800' }}>ACTIF</span>
                                                </td>
                                                <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
                                                    <button className="btn" style={{ padding: '0.4rem 1rem', fontSize: '0.85rem', fontWeight: 'bold' }} onClick={() => {
                                                        setNewPayment(prev => ({ ...prev, teacherId: t.id }));
                                                        setShowPaymentModal(true);
                                                    }}>
                                                        Rémunérer
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="4" style={{ padding: '4rem 2rem', textAlign: 'center', color: '#94a3b8' }}>
                                                <Users size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                                                <p style={{ fontWeight: '600' }}>Aucun enseignant enregistré</p>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'PAYMENTS' && (
                <div className="fade-in">
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.5rem' }}>
                        <button className="btn btn-primary" style={{ height: '45px', padding: '0 1.5rem' }} onClick={() => setShowPaymentModal(true)}>
                            <DollarSign size={18} style={{ marginRight: '0.5rem' }} /> Nouveau Paiement
                        </button>
                    </div>

                    {/* Stats Cards Responsive */}
                    <div className="grid-resp-3" style={{ gap: '1.5rem', marginBottom: '2rem' }}>
                        {(Array.isArray(stats) ? stats : []).map((s, idx) => (
                            <div key={idx} className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', borderLeft: '4px solid var(--primary)' }}>
                                <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    {s.type === 'SALARY' ? 'Salaires' : s.type === 'HOURLY' ? 'Heures Supp.' : s.type === 'ADVANCE' ? 'Avances' : 'Primes'}
                                </div>
                                <div style={{ fontSize: '1.75rem', fontWeight: '900', color: 'var(--primary-dark)' }}>
                                    {(s._sum?.amount || 0).toLocaleString()} <span style={{ fontSize: '0.9rem', opacity: 0.6 }}>FCFA</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="card" style={{ padding: '0', borderRadius: '16px', overflow: 'hidden' }}>
                        <h3 style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #f1f5f9', fontSize: '1.1rem', fontWeight: '800', margin: 0, color: 'var(--primary-dark)' }}>Historique des Rémunérations</h3>
                        <div className="table-container">
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #f1f5f9' }}>
                                    <tr>
                                        <th style={{ padding: '1rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', color: '#64748b' }}>DATE</th>
                                        <th style={{ padding: '1rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', color: '#64748b' }}>BÉNÉFICIAIRE</th>
                                        <th style={{ padding: '1rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', color: '#64748b' }}>TYPE</th>
                                        <th style={{ padding: '1rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', color: '#64748b' }}>PÉRIODE</th>
                                        <th style={{ padding: '1rem 1.5rem', textAlign: 'right', fontSize: '0.75rem', color: '#64748b' }}>MONTANT</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(Array.isArray(payments) ? payments : []).map(p => (
                                        <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                            <td style={{ padding: '1rem 1.5rem' }}>{p.paymentDate ? new Date(p.paymentDate).toLocaleDateString('fr-FR') : '---'}</td>
                                            <td style={{ padding: '1rem 1.5rem' }}>
                                                <div style={{ fontWeight: '700', color: 'var(--primary-dark)' }}>{p.teacher?.lastName || '---'} {p.teacher?.firstName || ''}</div>
                                            </td>
                                            <td style={{ padding: '1rem 1.5rem' }}>
                                                <span style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--primary)' }}>{p.type}</span>
                                            </td>
                                            <td style={{ padding: '1rem 1.5rem', fontSize: '0.85rem' }}>{p.period || '---'}</td>
                                            <td style={{ padding: '1rem 1.5rem', textAlign: 'right', fontWeight: '900', color: 'var(--primary-dark)' }}>{(p.amount || 0).toLocaleString()} FCFA</td>
                                        </tr>
                                    ))}
                                    {payments.length === 0 && (
                                        <tr><td colSpan="5" style={{ padding: '4rem 2rem', textAlign: 'center', color: '#94a3b8' }}>Aucune transaction enregistrée.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL: New Teacher - Mobile Optimized */}
            {showTeacherModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '1rem' }}>
                    <div className="card fade-in" style={{ width: '100%', maxWidth: '450px', borderRadius: '24px', padding: '2rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                            <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '800', color: 'var(--primary-dark)' }}>Ajouter Enseignant</h3>
                            <button onClick={() => setShowTeacherModal(false)} style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer' }}>×</button>
                        </div>
                        <form onSubmit={handleCreateTeacher}>
                            <div className="grid-resp-2" style={{ gap: '1rem' }}>
                                <div className="form-group">
                                    <label className="form-label">Nom de famille</label>
                                    <input type="text" className="form-input" style={{ height: '48px' }} value={newTeacher.lastName} onChange={e => setNewTeacher({ ...newTeacher, lastName: e.target.value })} required />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Prénoms</label>
                                    <input type="text" className="form-input" style={{ height: '48px' }} value={newTeacher.firstName} onChange={e => setNewTeacher({ ...newTeacher, firstName: e.target.value })} required />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Adresse Email (Login)</label>
                                <input type="email" className="form-input" style={{ height: '48px' }} value={newTeacher.email} onChange={e => setNewTeacher({ ...newTeacher, email: e.target.value })} required />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Mot de passe temporaire</label>
                                <input type="text" className="form-input" style={{ height: '48px' }} value={newTeacher.password} onChange={e => setNewTeacher({ ...newTeacher, password: e.target.value })} required />
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '2.5rem' }}>
                                <button type="button" className="btn" onClick={() => setShowTeacherModal(false)} style={{ flex: 1, height: '48px', background: '#f8fafc' }}>Annuler</button>
                                <button type="submit" className="btn btn-primary" style={{ flex: 1, height: '48px' }}>Enregistrer</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL: Payment - Mobile Optimized */}
            {showPaymentModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '1rem' }}>
                    <div className="card fade-in" style={{ width: '100%', maxWidth: '500px', borderRadius: '24px', padding: '2rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                            <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '800', color: 'var(--primary-dark)' }}>Nouveau Règlement</h3>
                            <button onClick={() => setShowPaymentModal(false)} style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer' }}>×</button>
                        </div>
                        <form onSubmit={handleCreatePayment}>
                            <div className="form-group">
                                <label className="form-label">Professeur</label>
                                <select className="form-input" style={{ height: '48px', fontWeight: '700' }} value={newPayment.teacherId} onChange={e => setNewPayment({ ...newPayment, teacherId: e.target.value })} required>
                                    <option value="">-- Choisir un enseignant --</option>
                                    {(Array.isArray(teachers) ? teachers : []).map(t => <option key={t.id} value={t.id}>{t.lastName} {t.firstName}</option>)}
                                </select>
                            </div>
                            <div className="grid-resp-2" style={{ gap: '1rem' }}>
                                <div className="form-group">
                                    <label className="form-label">Montant (FCFA)</label>
                                    <input type="number" className="form-input" style={{ height: '48px' }} value={newPayment.amount} onChange={e => setNewPayment({ ...newPayment, amount: e.target.value })} required />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Mois / Période</label>
                                    <input type="month" className="form-input" style={{ height: '48px' }} value={newPayment.period} onChange={e => setNewPayment({ ...newPayment, period: e.target.value })} required />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Mode / Type</label>
                                <select className="form-input" style={{ height: '48px' }} value={newPayment.type} onChange={e => setNewPayment({ ...newPayment, type: e.target.value })}>
                                    <option value="SALARY">Salaire Mensuel</option>
                                    <option value="HOURLY">Heures Supplémentaires</option>
                                    <option value="ADVANCE">Avance sur Salaire</option>
                                    <option value="BONUS">Prime / Bonus</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Notes (Chèque, Virement...)</label>
                                <input type="text" className="form-input" style={{ height: '48px' }} placeholder="Référence de paiement" value={newPayment.notes} onChange={e => setNewPayment({ ...newPayment, notes: e.target.value })} />
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '2.5rem' }}>
                                <button type="button" className="btn" onClick={() => setShowPaymentModal(false)} style={{ flex: 1, height: '48px', background: '#f8fafc' }}>Annuler</button>
                                <button type="submit" className="btn btn-primary" style={{ flex: 1, height: '48px' }}>Valider</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Teachers;
