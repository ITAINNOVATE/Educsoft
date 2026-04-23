import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import config from '../config';
import {
    UserPlus, Trash2, UserCheck, Pencil, X, ArrowLeft,
    Building2, Shield, Users
} from 'lucide-react';

const ROLE_LABELS = {
    SUPER_ADMIN: { label: 'Super Admin', bg: '#fef3c7', color: '#92400e' },
    ADMIN:       { label: 'Administrateur', bg: '#fee2e2', color: '#991b1b' },
    FOUNDER:     { label: 'Fondateur', bg: '#fde8ff', color: '#7e22ce' },
    ACCOUNTANT:  { label: 'Comptable', bg: '#dcfce7', color: '#166534' },
    SECRETARY:   { label: 'Secrétaire', bg: '#dbeafe', color: '#1e40af' },
    TEACHER:     { label: 'Enseignant', bg: '#f3e8ff', color: '#6b21a8' },
    DIRECTOR:    { label: 'Directeur', bg: '#fef9c3', color: '#854d0e' },
};

const EstablishmentUsers = () => {
    const { id: establishmentId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [establishment, setEstablishment] = useState(null);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        firstName: '', lastName: '', email: '', password: '', role: 'SECRETARY'
    });

    const API_USERS = `${config.API_URL}/users`;
    const API_EST   = `${config.API_URL}/establishments`;
    const authHeader = { Authorization: `Bearer ${user.token}` };

    useEffect(() => {
        Promise.all([fetchEstablishment(), fetchUsers()]).finally(() => setLoading(false));
    }, [establishmentId]);

    const fetchEstablishment = async () => {
        try {
            const res = await axios.get(API_EST, { headers: authHeader });
            const ests = Array.isArray(res.data) ? res.data : [];
            setEstablishment(ests.find(e => e.id === establishmentId) || null);
        } catch (err) {
            console.error('Error fetching establishment:', err);
        }
    };

    const fetchUsers = async () => {
        try {
            const res = await axios.get(`${API_USERS}?establishmentId=${establishmentId}`, { headers: authHeader });
            setUsers(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            console.error('Error fetching users:', err);
        }
    };

    const resetForm = () => {
        setFormData({ firstName: '', lastName: '', email: '', password: '', role: 'SECRETARY' });
        setEditingId(null);
        setShowForm(false);
    };

    const handleEdit = (u) => {
        setEditingId(u.id);
        setFormData({ firstName: u.firstName, lastName: u.lastName, email: u.email, password: '', role: u.role });
        setShowForm(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            if (editingId) {
                await axios.put(`${API_USERS}/${editingId}`, formData, { headers: authHeader });
            } else {
                await axios.post(API_USERS, { ...formData, establishmentId }, { headers: authHeader });
            }
            resetForm();
            fetchUsers();
        } catch (err) {
            alert(err.response?.data?.message || 'Erreur lors de l\'opération');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (uid) => {
        if (!window.confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) return;
        try {
            await axios.delete(`${API_USERS}/${uid}`, { headers: authHeader });
            fetchUsers();
        } catch (err) {
            alert(err.response?.data?.message || 'Erreur lors de la suppression');
        }
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4rem', gap: '1rem' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '4px solid var(--primary-light)', borderTopColor: 'var(--primary)', animation: 'spin 0.8s linear infinite' }} />
                <span style={{ color: 'var(--text-muted)' }}>Chargement...</span>
            </div>
        );
    }

    return (
        <div style={{ padding: '1rem', maxWidth: '1000px', margin: '0 auto' }}>
            {/* Header */}
            <header style={{ marginBottom: '2.5rem' }}>
                <button
                    onClick={() => navigate('/system')}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontWeight: '700', fontSize: '0.9rem', marginBottom: '1.5rem', padding: '0.4rem 0' }}
                >
                    <ArrowLeft size={18} /> Retour aux Établissements
                </button>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                            <div style={{ backgroundColor: 'var(--primary-light)', padding: '0.6rem', borderRadius: '12px', color: 'var(--primary)' }}>
                                <Building2 size={22} />
                            </div>
                            <h1 style={{ margin: 0, fontSize: '1.8rem', fontWeight: '800', color: 'var(--primary-dark)' }}>
                                {establishment?.name || 'Établissement'}
                            </h1>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Users size={15} style={{ color: 'var(--text-muted)' }} />
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', margin: 0 }}>
                                Gestion des utilisateurs de cet établissement — <strong>{users.length}</strong> compte(s)
                            </p>
                        </div>
                    </div>

                    <button
                        className="btn btn-primary"
                        onClick={() => { if (showForm && !editingId) { resetForm(); } else { resetForm(); setShowForm(true); } }}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', height: '48px', padding: '0 1.5rem', fontWeight: '700' }}
                    >
                        {showForm && !editingId ? <X size={20} /> : <UserPlus size={20} />}
                        {showForm && !editingId ? 'Annuler' : 'Nouveau Compte'}
                    </button>
                </div>
            </header>

            {/* Form */}
            {showForm && (
                <section className="card fade-in" style={{ marginBottom: '2rem', border: '2px solid var(--primary-light)', padding: '2rem', borderRadius: '20px' }}>
                    <h2 style={{ marginBottom: '2rem', color: 'var(--primary)', fontSize: '1.3rem', fontWeight: '800' }}>
                        {editingId ? '✏️ Modifier le Compte' : '➕ Nouveau Compte Staff'}
                    </h2>
                    <form onSubmit={handleSubmit}>
                        <div className="grid-resp-2" style={{ gap: '1.5rem' }}>
                            <div className="form-group">
                                <label className="form-label">Prénom</label>
                                <input type="text" className="form-input" style={{ height: '48px' }}
                                    value={formData.firstName}
                                    onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                                    required />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Nom de famille</label>
                                <input type="text" className="form-input" style={{ height: '48px' }}
                                    value={formData.lastName}
                                    onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                                    required />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Email Professionnel</label>
                                <input type="email" className="form-input" style={{ height: '48px' }}
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    required />
                            </div>
                            <div className="form-group">
                                <label className="form-label">
                                    {editingId ? 'Nouveau mot de passe (optionnel)' : 'Mot de passe initial'}
                                </label>
                                <input type="password" className="form-input" style={{ height: '48px' }}
                                    value={formData.password}
                                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                                    required={!editingId}
                                    placeholder={editingId ? 'Laisser vide pour ne pas changer' : ''} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Rôle / Permission</label>
                                <select className="form-input" style={{ height: '48px', fontWeight: '700' }}
                                    value={formData.role}
                                    onChange={e => setFormData({ ...formData, role: e.target.value })}>
                                    <option value="ADMIN">Administrateur (Accès Total)</option>
                                    <option value="FOUNDER">Fondateur (Accès Total)</option>
                                    <option value="ACCOUNTANT">Comptable (Finances)</option>
                                    <option value="SECRETARY">Secrétaire (Gestion)</option>
                                    <option value="TEACHER">Enseignant</option>
                                    <option value="DIRECTOR">Directeur</option>
                                </select>
                            </div>
                        </div>

                        <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                            <button type="button" className="btn" style={{ height: '48px', padding: '0 1.5rem', background: '#f8fafc' }} onClick={resetForm}>
                                Annuler
                            </button>
                            <button type="submit" className="btn btn-primary" style={{ height: '48px', minWidth: '200px', fontWeight: '800' }} disabled={submitting}>
                                {submitting ? 'En cours...' : editingId ? 'Mettre à jour' : 'Créer le Compte'}
                            </button>
                        </div>
                    </form>
                </section>
            )}

            {/* Users Table */}
            <div className="card" style={{ padding: 0, overflow: 'hidden', borderRadius: '20px' }}>
                {users.length === 0 ? (
                    <div style={{ padding: '4rem 2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                        <Shield size={48} style={{ opacity: 0.2, marginBottom: '1rem', display: 'block', margin: '0 auto 1rem' }} />
                        <p style={{ fontWeight: '700', fontSize: '1.1rem', marginBottom: '0.5rem' }}>Aucun utilisateur</p>
                        <p style={{ fontSize: '0.9rem' }}>Cet établissement n'a pas encore de compte staff. Créez-en un avec le bouton ci-dessus.</p>
                    </div>
                ) : (
                    <div className="table-container">
                        <table className="responsive-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ textAlign: 'left', background: '#f8fafc', borderBottom: '2px solid #f1f5f9' }}>
                                    <th style={{ padding: '1rem 1.5rem', fontSize: '0.75rem', color: '#64748b', fontWeight: '800', textTransform: 'uppercase' }}>Utilisateur</th>
                                    <th className="desktop-only" style={{ padding: '1rem 1.5rem', fontSize: '0.75rem', color: '#64748b', fontWeight: '800', textTransform: 'uppercase' }}>Email</th>
                                    <th style={{ padding: '1rem 1.5rem', fontSize: '0.75rem', color: '#64748b', fontWeight: '800', textTransform: 'uppercase' }}>Rôle</th>
                                    <th className="desktop-only" style={{ padding: '1rem 1.5rem', fontSize: '0.75rem', color: '#64748b', fontWeight: '800', textTransform: 'uppercase' }}>Créé le</th>
                                    <th style={{ padding: '1rem 1.5rem', textAlign: 'right', fontSize: '0.75rem', color: '#64748b', fontWeight: '800', textTransform: 'uppercase' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map(u => {
                                    const roleInfo = ROLE_LABELS[u.role] || { label: u.role, bg: '#f1f5f9', color: '#475569' };
                                    return (
                                        <tr key={u.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.2s' }}>
                                            <td data-label="Utilisateur" style={{ padding: '1rem 1.5rem' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                    <div className="desktop-only" style={{ width: '40px', height: '40px', borderRadius: '12px', backgroundColor: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', flexShrink: 0 }}>
                                                        <UserCheck size={20} />
                                                    </div>
                                                    <div>
                                                        <div style={{ fontWeight: '800', color: 'var(--primary-dark)' }}>{u.firstName} {u.lastName}</div>
                                                        <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{u.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="desktop-only" style={{ padding: '1rem 1.5rem', color: '#64748b', fontSize: '0.9rem' }}>{u.email}</td>
                                            <td data-label="Rôle" style={{ padding: '1rem 1.5rem' }}>
                                                <span style={{
                                                    padding: '0.4rem 0.8rem', borderRadius: '8px',
                                                    fontSize: '0.7rem', fontWeight: '900',
                                                    backgroundColor: roleInfo.bg, color: roleInfo.color,
                                                    textTransform: 'uppercase', whiteSpace: 'nowrap'
                                                }}>
                                                    {roleInfo.label}
                                                </span>
                                            </td>
                                            <td className="desktop-only" style={{ padding: '1rem 1.5rem', fontSize: '0.85rem', color: '#94a3b8' }}>
                                                {u.createdAt ? new Date(u.createdAt).toLocaleDateString('fr-FR') : '---'}
                                            </td>
                                            <td data-label="Actions" style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
                                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                                    <button
                                                        onClick={() => handleEdit(u)}
                                                        style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', color: 'var(--primary)', cursor: 'pointer', padding: '0.5rem' }}
                                                        title="Modifier"
                                                    >
                                                        <Pencil size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(u.id)}
                                                        style={{ background: '#fff5f5', border: '1px solid #fed7d7', borderRadius: '8px', color: '#dc2626', cursor: 'pointer', padding: '0.5rem' }}
                                                        title="Supprimer"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default EstablishmentUsers;
