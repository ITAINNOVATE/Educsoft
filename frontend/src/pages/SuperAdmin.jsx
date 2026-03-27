import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Building2, Plus, CheckCircle, XCircle, ShieldCheck, Trash2, Pause, Play, Eye } from 'lucide-react';
import config from '../config';

const SuperAdmin = () => {
    const { user, switchEstablishment } = useAuth();
    const [establishments, setEstablishments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [newEst, setNewEst] = useState({ name: '', code: '', email: '', phone: '', address: '' });
    const API_BASE = `${config.API_URL}/establishments`;

    const handleManage = async (id) => {
        const res = await switchEstablishment(id);
        if (res.success) {
            alert('Vous gérez maintenant cet établissement.');
            window.location.reload(); // Reload to refresh sidebar and context
        } else {
            alert(res.message);
        }
    };

    useEffect(() => {
        fetchEstablishments();
    }, []);

    const fetchEstablishments = async () => {
        try {
            const res = await axios.get(API_BASE, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            setEstablishments(res.data);
        } catch (error) {
            console.error('Error fetching establishments:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleStatus = async (id, currentStatus) => {
        try {
            await axios.patch(`${API_BASE}/${id}`, { isActive: !currentStatus }, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            fetchEstablishments();
        } catch (error) {
            alert(error.response?.data?.message || 'Erreur lors de la mise à jour de l\'état');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Êtes-vous sûr de vouloir supprimer cet établissement ? Cette action est irréversible et ne fonctionnera que si l\'établissement est vide de données (élèves/agents).')) {
            return;
        }

        try {
            await axios.delete(`${API_BASE}/${id}`, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            alert('Établissement supprimé avec succès');
            fetchEstablishments();
        } catch (error) {
            const msg = error.response?.data?.message || 'Erreur lors de la suppression';
            const detail = error.response?.data?.details ? `\n\n${error.response?.data?.details}` : '';
            alert(msg + detail);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            await axios.post(API_BASE, newEst, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            alert('Établissement créé avec succès !');
            setShowModal(false);
            setNewEst({ name: '', code: '', email: '', phone: '', address: '' });
            fetchEstablishments();
        } catch (error) {
            const msg = error.response?.data?.message || 'Erreur lors de la création';
            const technicalError = error.response?.data?.error;
            const detail = technicalError 
                ? ` (${typeof technicalError === 'object' ? JSON.stringify(technicalError) : technicalError})` 
                : '';
            alert(msg + detail);
        }
    };

    if (loading) return <div className="p-8">Chargement du système...</div>;

    return (
        <div style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.75rem', color: 'var(--primary-dark)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <ShieldCheck size={32} /> Administration Système
                    </h1>
                    <p style={{ color: 'var(--text-muted)' }}>Gestion globale des établissements connectés</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                    <Plus size={20} /> Nouvel Établissement
                </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                {establishments.map(est => (
                    <div key={est.id} className="card" style={{ borderTop: '4px solid var(--primary)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                            <div style={{ backgroundColor: '#e0f2f1', padding: '0.75rem', borderRadius: '12px', color: 'var(--primary)' }}>
                                <Building2 size={24} />
                            </div>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{est.name}</h3>
                                <code style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 'bold' }}>CODE: {est.code}</code>
                            </div>
                        </div>
                        <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            <span>📧 {est.email || '-'}</span>
                            <span>📞 {est.phone || '-'}</span>
                            <span>📍 {est.address || '-'}</span>
                        </div>
                        <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: est.isActive ? '#2e7d32' : '#c62828', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                    {est.isActive ? <CheckCircle size={14} /> : <XCircle size={14} />}
                                    {est.isActive ? 'ACTIF' : 'SUSPENDU'}
                                </span>
                                <span style={{ fontSize: '0.75rem', color: '#999' }}>
                                    {est._count?.students || 0} Élèves • {est._count?.users || 0} Agents
                                </span>
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button
                                    onClick={() => handleManage(est.id)}
                                    title="Gérer"
                                    style={{
                                        border: 'none',
                                        background: 'var(--primary-light)',
                                        color: 'var(--primary)',
                                        padding: '0.5rem',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center'
                                    }}
                                >
                                    <Eye size={18} />
                                </button>
                                <button
                                    onClick={() => handleToggleStatus(est.id, est.isActive)}
                                    title={est.isActive ? 'Suspendre' : 'Activer'}
                                    style={{
                                        border: 'none',
                                        background: est.isActive ? '#fff3e0' : '#e8f5e9',
                                        color: est.isActive ? '#ef6c00' : '#2e7d32',
                                        padding: '0.5rem',
                                        borderRadius: '8px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    {est.isActive ? <Pause size={18} /> : <Play size={18} />}
                                </button>
                                <button
                                    onClick={() => handleDelete(est.id)}
                                    title="Supprimer"
                                    style={{
                                        border: 'none',
                                        background: '#ffebee',
                                        color: '#c62828',
                                        padding: '0.5rem',
                                        borderRadius: '8px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {showModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div className="card" style={{ width: '100%', maxWidth: '500px' }}>
                        <h2 style={{ marginBottom: '1.5rem' }}>Créer un Établissement</h2>
                        <form onSubmit={handleCreate}>
                            <div className="form-group">
                                <label className="form-label">Nom de l'établissement</label>
                                <input type="text" className="form-input" required value={newEst.name} onChange={e => setNewEst({...newEst, name: e.target.value})} placeholder="Ex: École Primaire Les Palmiers" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Code d'accès (Unique)</label>
                                <input type="text" className="form-input" required value={newEst.code} onChange={e => setNewEst({...newEst, code: e.target.value.toUpperCase()})} placeholder="Ex: PALMIERS2026" />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="form-group">
                                    <label className="form-label">Email</label>
                                    <input type="email" className="form-input" value={newEst.email} onChange={e => setNewEst({...newEst, email: e.target.value})} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Téléphone</label>
                                    <input type="text" className="form-input" value={newEst.phone} onChange={e => setNewEst({...newEst, phone: e.target.value})} />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Adresse</label>
                                <input type="text" className="form-input" value={newEst.address} onChange={e => setNewEst({...newEst, address: e.target.value})} />
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowModal(false)}>Annuler</button>
                                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Créer l'école</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SuperAdmin;
