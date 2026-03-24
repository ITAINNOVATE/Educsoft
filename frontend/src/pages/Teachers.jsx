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
            // Re-using the /users endpoint but filtering for TEACHER locally or if API supports it
            // Assuming /users returns all users for admin
            const res = await axios.get(`${API_BASE}/users`, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            // Filter only teachers
            const teacherList = res.data.filter(u => u.role === 'TEACHER');
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
            setPayments(res.data);
        } catch (error) {
            console.error('Error fetching payments:', error);
        }
    };

    const fetchStats = async () => {
        try {
            const res = await axios.get(`${API_BASE}/teacher-payments/stats`, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            setStats(res.data);
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
        <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '2rem', color: 'var(--primary-dark)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <Users /> Gestion des Enseignants
                    </h1>
                    <p style={{ color: 'var(--text-muted)' }}>Suivi des effectifs et des paiements</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button
                        className={`btn ${activeTab === 'LIST' ? 'btn-primary' : ''}`}
                        onClick={() => setActiveTab('LIST')}
                        style={{ border: activeTab !== 'LIST' ? '1px solid #ddd' : 'none' }}
                    >
                        Liste
                    </button>
                    <button
                        className={`btn ${activeTab === 'PAYMENTS' ? 'btn-primary' : ''}`}
                        onClick={() => setActiveTab('PAYMENTS')}
                        style={{ border: activeTab !== 'PAYMENTS' ? '1px solid #ddd' : 'none' }}
                    >
                        Paiements
                    </button>
                </div>
            </header>

            {activeTab === 'LIST' && (
                <div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.5rem' }}>
                        <button className="btn btn-primary" onClick={() => setShowTeacherModal(true)}>
                            <UserPlus size={18} style={{ marginRight: '0.5rem' }} /> Ajouter un Enseignant
                        </button>
                    </div>

                    <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead style={{ backgroundColor: '#f5f5f5', borderBottom: '2px solid #e0e0e0' }}>
                                <tr>
                                    <th style={{ padding: '1rem', textAlign: 'left' }}>Nom & Prénoms</th>
                                    <th style={{ padding: '1rem', textAlign: 'left' }}>Email</th>
                                    <th style={{ padding: '1rem', textAlign: 'left' }}>Statut</th>
                                    <th style={{ padding: '1rem', textAlign: 'right' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {teachers.length > 0 ? (
                                    teachers.map(t => (
                                        <tr key={t.id} style={{ borderBottom: '1px solid #eee' }}>
                                            <td style={{ padding: '1rem', fontWeight: 'bold' }}>{t.lastName} {t.firstName}</td>
                                            <td style={{ padding: '1rem' }}>{t.email}</td>
                                            <td style={{ padding: '1rem' }}><span style={{ padding: '0.25rem 0.5rem', borderRadius: '4px', backgroundColor: '#e8f5e9', color: '#2e7d32', fontSize: '0.75rem', fontWeight: 'bold' }}>ACTIF</span></td>
                                            <td style={{ padding: '1rem', textAlign: 'right' }}>
                                                <button className="btn" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }} onClick={() => {
                                                    setNewPayment(prev => ({ ...prev, teacherId: t.id }));
                                                    setShowPaymentModal(true);
                                                }}>
                                                    Payer
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="4" style={{ padding: '2rem', textAlign: 'center', color: '#888' }}>Aucun enseignant trouvé. Commencez par en ajouter un.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === 'PAYMENTS' && (
                <div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.5rem' }}>
                        <button className="btn btn-primary" onClick={() => setShowPaymentModal(true)}>
                            <DollarSign size={18} style={{ marginRight: '0.5rem' }} /> Nouveau Paiement
                        </button>
                    </div>

                    {/* Stats Cards */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                        {stats.map(s => (
                            <div key={s.type} className="card" style={{ padding: '1.5rem', textAlign: 'center' }}>
                                <div style={{ fontSize: '0.85rem', color: '#777', textTransform: 'uppercase', marginBottom: '0.5rem' }}>{s.type}</div>
                                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--primary-dark)' }}>{(s._sum.amount || 0).toLocaleString()} <span style={{ fontSize: '0.8rem' }}>FCFA</span></div>
                            </div>
                        ))}
                    </div>

                    <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
                        <h3 style={{ padding: '1rem', borderBottom: '1px solid #eee', fontSize: '1.1rem' }}>Historique des Paiements</h3>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead style={{ backgroundColor: '#f5f5f5', borderBottom: '2px solid #e0e0e0' }}>
                                <tr>
                                    <th style={{ padding: '1rem', textAlign: 'left' }}>Date</th>
                                    <th style={{ padding: '1rem', textAlign: 'left' }}>Enseignant</th>
                                    <th style={{ padding: '1rem', textAlign: 'left' }}>Type</th>
                                    <th style={{ padding: '1rem', textAlign: 'left' }}>Période</th>
                                    <th style={{ padding: '1rem', textAlign: 'right' }}>Montant</th>
                                </tr>
                            </thead>
                            <tbody>
                                {payments.map(p => (
                                    <tr key={p.id} style={{ borderBottom: '1px solid #eee' }}>
                                        <td style={{ padding: '1rem' }}>{new Date(p.paymentDate).toLocaleDateString()}</td>
                                        <td style={{ padding: '1rem', fontWeight: 'bold' }}>{p.teacher.lastName} {p.teacher.firstName}</td>
                                        <td style={{ padding: '1rem' }}>{p.type}</td>
                                        <td style={{ padding: '1rem' }}>{p.period}</td>
                                        <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 'bold' }}>{p.amount.toLocaleString()} FCFA</td>
                                    </tr>
                                ))}
                                {payments.length === 0 && (
                                    <tr><td colSpan="5" style={{ padding: '2rem', textAlign: 'center', color: '#888' }}>Aucun historique de paiement.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* MODAL: New Teacher */}
            {showTeacherModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div className="card" style={{ width: '100%', maxWidth: '400px' }}>
                        <h3 style={{ marginBottom: '1.5rem', textAlign: 'center' }}>Ajouter un Enseignant</h3>
                        <form onSubmit={handleCreateTeacher}>
                            <div className="form-group">
                                <label className="form-label">Nom</label>
                                <input type="text" className="form-input" value={newTeacher.lastName} onChange={e => setNewTeacher({ ...newTeacher, lastName: e.target.value })} required />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Prénom</label>
                                <input type="text" className="form-input" value={newTeacher.firstName} onChange={e => setNewTeacher({ ...newTeacher, firstName: e.target.value })} required />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Email (Connexion)</label>
                                <input type="email" className="form-input" value={newTeacher.email} onChange={e => setNewTeacher({ ...newTeacher, email: e.target.value })} required />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Mot de passe par défaut</label>
                                <input type="text" className="form-input" value={newTeacher.password} onChange={e => setNewTeacher({ ...newTeacher, password: e.target.value })} required />
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                                <button type="button" className="btn" onClick={() => setShowTeacherModal(false)} style={{ flex: 1 }}>Annuler</button>
                                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Créer</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL: Payment */}
            {showPaymentModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div className="card" style={{ width: '100%', maxWidth: '450px' }}>
                        <h3 style={{ marginBottom: '1.5rem', textAlign: 'center' }}>Nouveau Paiement Enseignant</h3>
                        <form onSubmit={handleCreatePayment}>
                            <div className="form-group">
                                <label className="form-label">Enseignant</label>
                                <select className="form-input" value={newPayment.teacherId} onChange={e => setNewPayment({ ...newPayment, teacherId: e.target.value })} required>
                                    <option value="">Sélectionner...</option>
                                    {teachers.map(t => <option key={t.id} value={t.id}>{t.lastName} {t.firstName}</option>)}
                                </select>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="form-group">
                                    <label className="form-label">Montant (FCFA)</label>
                                    <input type="number" className="form-input" value={newPayment.amount} onChange={e => setNewPayment({ ...newPayment, amount: e.target.value })} required />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Période (Mois)</label>
                                    <input type="month" className="form-input" value={newPayment.period} onChange={e => setNewPayment({ ...newPayment, period: e.target.value })} required />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Type de Paiement</label>
                                <select className="form-input" value={newPayment.type} onChange={e => setNewPayment({ ...newPayment, type: e.target.value })}>
                                    <option value="SALARY">Salaire Mensuel</option>
                                    <option value="HOURLY">Heures Supplémentaires</option>
                                    <option value="ADVANCE">Avance sur Salaire</option>
                                    <option value="BONUS">Prime / Bonus</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Notes / Référence</label>
                                <input type="text" className="form-input" placeholder="Ex: Chèque N° 123456" value={newPayment.notes} onChange={e => setNewPayment({ ...newPayment, notes: e.target.value })} />
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                                <button type="button" className="btn" onClick={() => setShowPaymentModal(false)} style={{ flex: 1 }}>Annuler</button>
                                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Valider Paiement</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Teachers;
