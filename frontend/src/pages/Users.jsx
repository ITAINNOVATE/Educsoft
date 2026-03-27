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
        <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
            <header style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ fontSize: '2rem', color: 'var(--primary-dark)' }}>Gestion des Utilisateurs</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Gérez les comptes d'accès au système (Staff).</p>
                </div>
                <button className="btn btn-primary" onClick={() => { 
                    if (showForm) {
                        setEditingId(null);
                        setFormData({ firstName: '', lastName: '', email: '', password: '', role: 'SECRETARY' });
                    }
                    setShowForm(!showForm);
                }} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {showForm ? <X size={20} /> : <UserPlus size={20} />}
                    {showForm ? 'Annuler' : 'Nouvel Utilisateur'}
                </button>
            </header>

            {showForm && (
                <section className="card" style={{ marginBottom: '2rem', border: '1px solid var(--primary-light)' }}>
                    <h2 style={{ marginBottom: '1.5rem', color: 'var(--primary)', fontSize: '1.25rem' }}>
                        {editingId ? 'Modifier le Compte' : 'Nouveau Compte Staff'}
                    </h2>
                    <form onSubmit={handleSubmit}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                            <div className="form-group">
                                <label className="form-label">Prénom</label>
                                <input type="text" className="form-input" value={formData.firstName} onChange={e => setFormData({ ...formData, firstName: e.target.value })} required />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Nom</label>
                                <input type="text" className="form-input" value={formData.lastName} onChange={e => setFormData({ ...formData, lastName: e.target.value })} required />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Email Professionnel</label>
                                <input type="email" className="form-input" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} required />
                            </div>
                            <div className="form-group">
                                <label className="form-label">{editingId ? 'Changer Mot de Passe (Optionnel)' : 'Mot de Passe Initial'}</label>
                                <input type="password" className="form-input" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} required={!editingId} placeholder={editingId ? 'Laisser vide pour garder l’ancien' : ''} />
                            </div>
                            <div className="form-group" style={{ gridColumn: 'span 2' }}>
                                <label className="form-label">Rôle / Permission</label>
                                <select className="form-input" value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })}>
                                    <option value="ADMIN">Administrateur (Accès Total)</option>
                                    <option value="ACCOUNTANT">Comptable (Finances & Dashboard)</option>
                                    <option value="SECRETARY">Secrétaire (Gestion Élèves)</option>
                                </select>
                            </div>
                        </div>
                        <div style={{ marginTop: '1.5rem', display: 'flex', justifySelf: 'end' }}>
                            <button type="submit" className="btn btn-primary btn-block">Créer le Compte</button>
                        </div>
                    </form>
                </section>
            )}

            <div className="card">
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ textAlign: 'left', borderBottom: '2px solid #eee' }}>
                            <th style={{ padding: '1rem' }}>Utilisateur</th>
                            <th style={{ padding: '1rem' }}>Email</th>
                            <th style={{ padding: '1rem' }}>Rôle</th>
                            <th style={{ padding: '1rem' }}>Date Création</th>
                            <th style={{ padding: '1rem', textAlign: 'right' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(u => (
                            <tr key={u.id} style={{ borderBottom: '1px solid #f9f9f9' }}>
                                <td style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#e0f2f1', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                                        <UserCheck size={16} />
                                    </div>
                                    <span style={{ fontWeight: '500' }}>{u.firstName} {u.lastName}</span>
                                </td>
                                <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>{u.email}</td>
                                <td style={{ padding: '1rem' }}>
                                    <span style={{
                                        padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 'bold',
                                        backgroundColor: u.role === 'ADMIN' ? '#ffebee' : u.role === 'ACCOUNTANT' ? '#e8f5e9' : '#e3f2fd',
                                        color: u.role === 'ADMIN' ? '#c62828' : u.role === 'ACCOUNTANT' ? '#2e7d32' : '#1565c0'
                                    }}>
                                        {u.role === 'ADMIN' ? 'Administrateur' : u.role === 'ACCOUNTANT' ? 'Comptable' : 'Secrétaire'}
                                    </span>
                                </td>
                                <td style={{ padding: '1rem', fontSize: '0.875rem' }}>{new Date(u.createdAt).toLocaleDateString()}</td>
                                <td style={{ padding: '1rem', textAlign: 'right', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                    <button onClick={() => handleEdit(u)} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', padding: '0.5rem' }} title="Modifier">
                                        <Pencil size={18} />
                                    </button>
                                    {u.id !== user.id && (
                                        <button onClick={() => handleDelete(u.id)} style={{ background: 'none', border: 'none', color: 'var(--error)', cursor: 'pointer', padding: '0.5rem' }} title="Supprimer">
                                            <Trash2 size={18} />
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Users;
