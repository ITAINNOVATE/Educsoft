import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Building2, Plus, CheckCircle, XCircle, Trash2, Pause, Play, Eye, Mail, Phone, MapPin, Pencil } from 'lucide-react';
import config from '../config';
import logo from '../assets/logo.png';

const SuperAdmin = () => {
    const { user, switchEstablishment } = useAuth();
    const navigate = useNavigate();
    const [establishments, setEstablishments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [newEst, setNewEst] = useState({ name: '', code: '', email: '', phone: '', address: '', type: '', typeOther: '', directorName: '' });
    const establishmentTypes = [
        "Maternelle",
        "Maternelle-Primaire-Secondaire",
        "Primaire & Secondaire",
        "Technique & Professionnel",
        "Universitaire",
        "Autre"
    ];
    const API_BASE = `${config.API_URL}/establishments`;

    const handleManage = async (id) => {
        const res = await switchEstablishment(id);
        if (res.success) {
            navigate('/dashboard');
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

    const handleEditClick = (est) => {
        setNewEst({
            name: est.name || '',
            code: est.code || '',
            email: est.email || '',
            phone: est.phone || '',
            address: est.address || '',
            type: est.type || '',
            typeOther: est.typeOther || '',
            directorName: est.directorName || ''
        });
        setEditingId(est.id);
        setIsEditing(true);
        setShowModal(true);
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            if (isEditing) {
                await axios.patch(`${API_BASE}/${editingId}`, newEst, {
                    headers: { Authorization: `Bearer ${user.token}` }
                });
                alert('Établissement mis à jour avec succès !');
            } else {
                await axios.post(API_BASE, newEst, {
                    headers: { Authorization: `Bearer ${user.token}` }
                });
                alert('Établissement créé avec succès !');
            }
            setShowModal(false);
            resetForm();
            fetchEstablishments();
        } catch (error) {
            const msg = error.response?.data?.message || 'Erreur lors de l’opération';
            const technicalError = error.response?.data?.error;
            const detail = technicalError 
                ? ` (${typeof technicalError === 'object' ? JSON.stringify(technicalError) : technicalError})` 
                : '';
            alert(msg + detail);
        }
    };

    const resetForm = () => {
        setNewEst({ name: '', code: '', email: '', phone: '', address: '', type: '', typeOther: '', directorName: '' });
        setIsEditing(false);
        setEditingId(null);
    };

    if (loading) return <div className="p-8">Chargement du système...</div>;

    return (
        <div style={{ padding: '1rem', maxWidth: '1200px', margin: '0 auto' }}>
            <header className="stack-on-mobile" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2.5rem', gap: '1rem' }}>
                <div>
                    <h1 style={{ fontSize: '2.2rem', color: 'var(--primary-dark)', display: 'flex', alignItems: 'center', gap: '1rem', fontWeight: '800', margin: 0 }}>
                        <img src={logo} alt="ITA" style={{ height: '65px', width: 'auto' }} /> Système ITA
                    </h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>Administration globale des établissements affiliés.</p>
                </div>
                <button className="btn btn-primary" style={{ height: '48px', padding: '0 1.5rem', fontWeight: '700', width: '100%', maxWidth: '250px' }} onClick={() => { resetForm(); setShowModal(true); }}>
                    <Plus size={20} style={{ marginRight: '0.5rem' }} /> Nouvel Établissement
                </button>
            </header>

            <div className="grid-resp-2" style={{ gap: '1.5rem' }}>
                {(Array.isArray(establishments) ? establishments : []).map(est => (
                    <div key={est.id} className="card fade-in" style={{ borderTop: '5px solid var(--primary)', borderRadius: '20px', padding: '1.75rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: '1.5rem' }}>
                            <div style={{ backgroundColor: 'var(--primary-light)', padding: '0.8rem', borderRadius: '14px', color: 'var(--primary)' }}>
                                <Building2 size={28} />
                            </div>
                            <div style={{ flex: 1 }}>
                                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '800', color: 'var(--primary-dark)' }}>{est.name || 'Établissement Sans Nom'}</h3>
                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '0.3rem', flexWrap: 'wrap' }}>
                                    <code style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: '800', backgroundColor: '#f1f5f9', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>{est.code || '---'}</code>
                                    {est.type && (
                                        <span style={{ fontSize: '0.65rem', padding: '0.2rem 0.5rem', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', textTransform: 'uppercase', color: '#64748b', fontWeight: '700' }}>
                                            {est.type === 'Autre' ? est.typeOther : est.type}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                        
                        <div style={{ fontSize: '0.9rem', color: '#64748b', display: 'flex', flexDirection: 'column', gap: '0.6rem', background: '#f8fafc', padding: '1rem', borderRadius: '12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}><Mail size={14} /> {est.email || '-'}</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}><Phone size={14} /> {est.phone || '-'}</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}><MapPin size={14} /> {est.address || '-'}</div>
                        </div>

                        <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                <span style={{ fontSize: '0.7rem', fontWeight: '900', color: est.isActive ? '#166534' : '#991b1b', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                    {est.isActive ? <CheckCircle size={14} /> : <XCircle size={14} />}
                                    {est.isActive ? 'ACTIF' : 'SUSPENDU'}
                                </span>
                                <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: '600' }}>
                                    {est._count?.students || 0} Élèves • {est._count?.users || 0} Staff
                                </span>
                            </div>
                            <div style={{ display: 'flex', gap: '0.6rem' }}>
                                <button
                                    onClick={() => handleManage(est.id)}
                                    title="Gérer l'établissement"
                                    style={{ border: 'none', background: 'var(--primary-light)', color: 'var(--primary)', padding: '0.6rem', borderRadius: '10px', cursor: 'pointer' }}
                                >
                                    <Eye size={20} />
                                </button>
                                <button
                                    onClick={() => handleEditClick(est)}
                                    title="Modifier l'établissement"
                                    style={{ border: 'none', background: '#f1f5f9', color: '#475569', padding: '0.6rem', borderRadius: '10px', cursor: 'pointer' }}
                                >
                                    <Pencil size={20} />
                                </button>
                                <button
                                    onClick={() => handleToggleStatus(est.id, est.isActive)}
                                    title={est.isActive ? 'Suspendre' : 'Activer'}
                                    style={{ border: 'none', background: est.isActive ? '#fff7ed' : '#f0fdf4', color: est.isActive ? '#9a3412' : '#166534', padding: '0.6rem', borderRadius: '10px', cursor: 'pointer' }}
                                >
                                    {est.isActive ? <Pause size={20} /> : <Play size={20} />}
                                </button>
                                <button
                                    onClick={() => handleDelete(est.id)}
                                    title="Supprimer définitivement"
                                    style={{ border: 'none', background: '#fff5f5', color: '#991b1b', padding: '0.6rem', borderRadius: '10px', cursor: 'pointer' }}
                                >
                                    <Trash2 size={20} />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* MODAL: Creation - Scrollable on mobile */}
            {showModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '1rem' }}>
                    <div className="card fade-in" style={{ width: '100%', maxWidth: '550px', maxHeight: '90vh', overflowY: 'auto', borderRadius: '24px', padding: '2rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                            <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '800', color: 'var(--primary-dark)' }}>
                                {isEditing ? 'Modifier l’établissement' : 'Nouvel Établissement'}
                            </h2>
                            <button onClick={() => { setShowModal(false); resetForm(); }} style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer' }}>×</button>
                        </div>
                        <form onSubmit={handleCreate}>
                            <div className="form-group">
                                <label className="form-label">Nom officiel</label>
                                <input type="text" className="form-input" style={{ height: '48px' }} required value={newEst.name} onChange={e => setNewEst({...newEst, name: e.target.value})} placeholder="Ex: Groupe Scolaire ITA" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Nom du Directeur</label>
                                <input type="text" className="form-input" style={{ height: '48px' }} value={newEst.directorName} onChange={e => setNewEst({...newEst, directorName: e.target.value})} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Code d'accès unique {isEditing && <span style={{ color: '#94a3b8', fontSize: '0.8rem', fontWeight: 'normal' }}>(Non modifiable)</span>}</label>
                                <input 
                                    type="text" 
                                    className="form-input" 
                                    style={{ height: '48px', fontWeight: '800', letterSpacing: '1px', opacity: isEditing ? 0.6 : 1 }} 
                                    required 
                                    disabled={isEditing}
                                    value={newEst.code} 
                                    onChange={e => setNewEst({...newEst, code: e.target.value.toUpperCase()})} 
                                    placeholder="EX: ITA2026" 
                                />
                            </div>
                            <div className="grid-resp-2" style={{ gap: '1rem' }}>
                                <div className="form-group">
                                    <label className="form-label">Email contact</label>
                                    <input type="email" className="form-input" style={{ height: '48px' }} value={newEst.email} onChange={e => setNewEst({...newEst, email: e.target.value})} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Téléphone</label>
                                    <input type="text" className="form-input" style={{ height: '48px' }} value={newEst.phone} onChange={e => setNewEst({...newEst, phone: e.target.value})} />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Adresse physique</label>
                                <input type="text" className="form-input" style={{ height: '48px' }} value={newEst.address} onChange={e => setNewEst({...newEst, address: e.target.value})} />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Type d'établissement</label>
                                <select 
                                    className="form-input" 
                                    style={{ height: '48px', fontWeight: '700' }}
                                    required 
                                    value={newEst.type} 
                                    onChange={e => setNewEst({...newEst, type: e.target.value, typeOther: e.target.value === 'Autre' ? newEst.typeOther : ''})}
                                >
                                    <option value="">-- Choisir le type --</option>
                                    {establishmentTypes.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>

                            {newEst.type === 'Autre' && (
                                <div className="form-group">
                                    <label className="form-label">Précisez le type</label>
                                    <input type="text" className="form-input" style={{ height: '48px' }} required value={newEst.typeOther} onChange={e => setNewEst({...newEst, typeOther: e.target.value})} />
                                </div>
                            )}
                             <div style={{ display: 'flex', gap: '1rem', marginTop: '2.5rem' }}>
                                <button type="button" className="btn" style={{ flex: 1, height: '48px', background: '#f8fafc' }} onClick={() => { setShowModal(false); resetForm(); }}>Annuler</button>
                                <button type="submit" className="btn btn-primary" style={{ flex: 1, height: '48px' }}>
                                    {isEditing ? 'Enregistrer les modifications' : 'Enregistrer l\'école'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SuperAdmin;
