import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import config from '../config';
import { UserPlus, Trash2, Shield, Mail, UserCheck, Pencil, X } from 'lucide-react';

const Users = () => {
    const [users, setUsers] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        firstName: '', lastName: '', email: '', password: '', role: 'SECRETARY'
    });

    const [editingId, setEditingId] = useState(null);
    const { user } = useAuth();
    const API_URL = `${config.API_URL}/users`;

    // Redirect if not admin (though backend protects it too)
    if (user && user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
        return <div style={{ padding: '2rem' }}>Accès refusé. Réservé aux administrateurs.</div>;
    }

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await axios.get(API_URL, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            setUsers(res.data);
        } catch (error) {
            console.error('Error fetching users:', error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingId) {
                // Update
                await axios.put(`${API_URL}/${editingId}`, formData, {
                    headers: { Authorization: `Bearer ${user.token}` }
                });
                alert('Utilisateur mis à jour avec succès !');
            } else {
                // Create
                await axios.post(API_URL, formData, {
                    headers: { Authorization: `Bearer ${user.token}` }
                });
                alert('Utilisateur créé avec succès !');
            }
            setShowForm(false);
            setEditingId(null);
            setFormData({ firstName: '', lastName: '', email: '', password: '', role: 'SECRETARY' });
            fetchUsers();
        } catch (error) {
            alert(error.response?.data?.message || 'Erreur lors de l’opération');
        }
    };

    const handleEdit = (u) => {
        setEditingId(u.id);
        setFormData({
            firstName: u.firstName,
            lastName: u.lastName,
            email: u.email,
            password: '', // Password optional for edit
            role: u.role
        });
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) return;
        try {
            await axios.delete(`${API_URL}/${id}`, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            fetchUsers();
        } catch (error) {
            alert(error.response?.data?.message || 'Erreur lors de la suppression');
        }
    };

    return (
        <div style={{ padding: '1rem', maxWidth: '1000px', margin: '0 auto' }}>
            <header className="stack-on-mobile" style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                <div>
                    <h1 style={{ fontSize: '2.2rem', color: 'var(--primary-dark)', fontWeight: '800', margin: 0 }}>Utilisateurs</h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>Gestion des accès et permissions du personnel.</p>
                </div>
                <button className="btn btn-primary" onClick={() => { 
                    if (showForm) {
                        setEditingId(null);
                        setFormData({ firstName: '', lastName: '', email: '', password: '', role: 'SECRETARY' });
                    }
                    setShowForm(!showForm);
                }} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', height: '48px', padding: '0 1.5rem', fontWeight: '700' }}>
                    {showForm ? <X size={20} /> : <UserPlus size={20} />}
                    {showForm ? 'Annuler' : 'Nouveau Staff'}
                </button>
            </header>

            {showForm && (
                <section className="card fade-in" style={{ marginBottom: '2rem', border: '1px solid var(--primary-light)', padding: '2rem', borderRadius: '20px' }}>
                    <h2 style={{ marginBottom: '2rem', color: 'var(--primary)', fontSize: '1.4rem', fontWeight: '800' }}>
                        {editingId ? 'Modifier le Compte' : 'Nouveau Compte Staff'}
                    </h2>
                    <form onSubmit={handleSubmit}>
                        <div className="grid-resp-2" style={{ gap: '1.5rem' }}>
                            <div className="form-group">
                                <label className="form-label">Prénom</label>
                                <input type="text" className="form-input" style={{ height: '48px' }} value={formData.firstName} onChange={e => setFormData({ ...formData, firstName: e.target.value })} required />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Nom de famille</label>
                                <input type="text" className="form-input" style={{ height: '48px' }} value={formData.lastName} onChange={e => setFormData({ ...formData, lastName: e.target.value })} required />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Email Professionnel</label>
                                <input type="email" className="form-input" style={{ height: '48px' }} value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} required />
                            </div>
                            <div className="form-group">
                                <label className="form-label">{editingId ? 'Changer Mot de Passe (Optionnel)' : 'Mot de Passe Initial'}</label>
                                <input type="password" className="form-input" style={{ height: '48px' }} value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} required={!editingId} placeholder={editingId ? 'Laisser vide pour garder l’ancien' : ''} />
                            </div>
                            <div className="form-group" style={{ gridColumn: 'span 1' }}>
                                <label className="form-label">Rôle / Permission</label>
                                <select className="form-input" style={{ height: '48px', fontWeight: '700' }} value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })}>
                                    {user.role === 'SUPER_ADMIN' && (
                                        <option value="ADMIN">Administrateur (Accès Total)</option>
                                    )}
                                    <option value="ACCOUNTANT">Comptable (Finances)</option>
                                    <option value="SECRETARY">Secrétaire (Gestion)</option>
                                </select>
                            </div>
                        </div>
                        <div style={{ marginTop: '2.5rem', display: 'flex', justifyContent: 'flex-end' }}>
                            <button type="submit" className="btn btn-primary" style={{ height: '48px', minWidth: '200px', fontWeight: '800' }}>
                                {editingId ? 'Mettre à jour' : 'Créer le Compte'}
                            </button>
                        </div>
                    </form>
                </section>
            )}

            <div className="card" style={{ padding: 0, overflow: 'hidden', borderRadius: '20px' }}>
                <div className="table-container">
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ textAlign: 'left', background: '#f8fafc', borderBottom: '2px solid #f1f5f9' }}>
                                <th style={{ padding: '1rem 1.5rem', fontSize: '0.75rem', color: '#64748b', fontWeight: '800', textTransform: 'uppercase' }}>Utilisateur</th>
                                <th className="desktop-only" style={{ padding: '1rem 1.5rem', fontSize: '0.75rem', color: '#64748b', fontWeight: '800', textTransform: 'uppercase' }}>Email</th>
                                <th style={{ padding: '1rem 1.5rem', fontSize: '0.75rem', color: '#64748b', fontWeight: '800', textTransform: 'uppercase' }}>Rôle</th>
                                <th className="desktop-only" style={{ padding: '1rem 1.5rem', fontSize: '0.75rem', color: '#64748b', fontWeight: '800', textTransform: 'uppercase' }}>Date</th>
                                <th style={{ padding: '1rem 1.5rem', textAlign: 'right', fontSize: '0.75rem', color: '#64748b', fontWeight: '800', textTransform: 'uppercase' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(Array.isArray(users) ? users : []).map(u => (
                                <tr key={u.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.2s' }}>
                                    <td style={{ padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <div style={{ width: '40px', height: '40px', borderRadius: '12px', backgroundColor: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                                            <UserCheck size={20} />
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: '800', color: 'var(--primary-dark)' }}>{u.firstName || '---'} {u.lastName || ''}</div>
                                            <div className="mobile-only" style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{u.email || '---'}</div>
                                        </div>
                                    </td>
                                    <td className="desktop-only" style={{ padding: '1rem 1.5rem', color: '#64748b', fontSize: '0.9rem' }}>{u.email}</td>
                                    <td style={{ padding: '1rem 1.5rem' }}>
                                        <span style={{
                                            padding: '0.4rem 0.8rem', borderRadius: '8px', fontSize: '0.7rem', fontWeight: '900',
                                            backgroundColor: u.role === 'ADMIN' ? '#fee2e2' : u.role === 'ACCOUNTANT' ? '#dcfce7' : '#dbeafe',
                                            color: u.role === 'ADMIN' ? '#991b1b' : u.role === 'ACCOUNTANT' ? '#166534' : '#1e40af',
                                            textTransform: 'uppercase'
                                        }}>
                                            {u.role === 'ADMIN' ? 'Admin' : u.role === 'ACCOUNTANT' ? 'Comptable' : 'Secrétaire'}
                                        </span>
                                    </td>
                                    <td className="desktop-only" style={{ padding: '1rem 1.5rem', fontSize: '0.85rem', color: '#94a3b8' }}>
                                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '---'}
                                    </td>
                                    <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
                                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                            <button onClick={() => handleEdit(u)} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', color: 'var(--primary)', cursor: 'pointer', padding: '0.5rem' }} title="Modifier">
                                                <Pencil size={18} />
                                            </button>
                                            {u?.id !== user?.id && (
                                                <button onClick={() => handleDelete(u?.id)} style={{ background: '#fff5f5', border: '1px solid #fed7d7', borderRadius: '8px', color: 'var(--error)', cursor: 'pointer', padding: '0.5rem' }} title="Supprimer">
                                                    <Trash2 size={18} />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Users;
