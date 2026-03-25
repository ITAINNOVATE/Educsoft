import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Building2, Plus, CheckCircle, XCircle, ShieldCheck } from 'lucide-react';
import config from '../config';

const SuperAdmin = () => {
    const { user } = useAuth();
    const [establishments, setEstablishments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [newEst, setNewEst] = useState({ name: '', code: '', email: '', phone: '', address: '' });
    const API_BASE = `${config.API_URL}/establishments`;

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
            const detail = error.response?.data?.error ? ` (${error.response.data.error})` : '';
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
                            <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: est.isActive ? '#2e7d32' : '#c62828', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                {est.isActive ? <CheckCircle size={14} /> : <XCircle size={14} />}
                                {est.isActive ? 'ACTIF' : 'INACTIF'}
                            </span>
                            <span style={{ fontSize: '0.75rem', color: '#999' }}>
                                {est._count.students} Élèves • {est._count.users} Agents
                            </span>
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
