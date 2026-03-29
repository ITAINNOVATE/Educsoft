import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import config from '../config';
import { Plus, Calendar, BookOpen, CheckCircle, Edit, Trash2, X } from 'lucide-react';

const Configuration = () => {
    const [schoolYears, setSchoolYears] = useState([]);
    const [classes, setClasses] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [terms, setTerms] = useState([]);
    const [selectedClassId, setSelectedClassId] = useState('');
    const [selectedYearId, setSelectedYearId] = useState('');
    
    const [newYear, setNewYear] = useState({ name: '', startDate: '', endDate: '', current: false });
    const [newClass, setNewClass] = useState({ name: '', level: '', schoolYearId: '' });
    const [newSubject, setNewSubject] = useState({ name: '', code: '', coefficient: 1, classId: '' });
    const [newTerm, setNewTerm] = useState({ name: '', startDate: '', endDate: '', schoolYearId: '' });
    
    const [editingFee, setEditingFee] = useState(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const { user } = useAuth();

    const API_URL = `${config.API_URL}/config`;

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const authHeader = { headers: { Authorization: `Bearer ${user.token}` } };
            const [yearsRes, classesRes] = await Promise.all([
                axios.get(`${API_URL}/school-years`, authHeader),
                axios.get(`${API_URL}/classes`, authHeader),
            ]);
            setSchoolYears(yearsRes.data);
            setClasses(classesRes.data);
            
            // Set first year as default for terms if exists
            if (yearsRes.data.length > 0 && !selectedYearId) {
                const current = yearsRes.data.find(y => y.current) || yearsRes.data[0];
                setSelectedYearId(current.id);
                fetchTerms(current.id);
            }
        } catch (error) {
            console.error('Error fetching config data:', error);
        }
    };

    const fetchSubjects = async (classId) => {
        if (!classId) return;
        try {
            const res = await axios.get(`${API_URL}/subjects/${classId}`, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            setSubjects(res.data);
        } catch (error) {
            console.error('Error fetching subjects:', error);
        }
    };

    const fetchTerms = async (yearId) => {
        if (!yearId) return;
        try {
            const res = await axios.get(`${API_URL}/terms/${yearId}`, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            setTerms(res.data);
        } catch (error) {
            console.error('Error fetching terms:', error);
        }
    };

    const handleAddYear = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`${API_URL}/school-years`, newYear, {
                headers: { Authorization: `Bearer ${user.token}` },
            });
            setNewYear({ name: '', startDate: '', endDate: '', current: false });
            fetchData();
        } catch (error) {
            alert('Error adding school year');
        }
    };

    const handleAddClass = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`${API_URL}/classes`, newClass, {
                headers: { Authorization: `Bearer ${user.token}` },
            });
            setNewClass({ name: '', level: '', schoolYearId: '' });
            fetchData();
        } catch (error) {
            alert('Error adding class');
        }
    };

    const handleAddSubject = async (e) => {
        e.preventDefault();
        if (!selectedClassId) return alert('Veuillez choisir une classe');
        try {
            await axios.post(`${API_URL}/subjects`, { ...newSubject, classId: selectedClassId }, {
                headers: { Authorization: `Bearer ${user.token}` },
            });
            setNewSubject({ name: '', code: '', coefficient: 1, classId: '' });
            fetchSubjects(selectedClassId);
        } catch (error) {
            alert('Erreur lors de l\'ajout de la matière');
        }
    };

    const handleDeleteSubject = async (id) => {
        if (!confirm('Supprimer cette matière ?')) return;
        try {
            await axios.delete(`${API_URL}/subjects/${id}`, {
                headers: { Authorization: `Bearer ${user.token}` },
            });
            fetchSubjects(selectedClassId);
        } catch (error) {
            alert('Erreur lors de la suppression');
        }
    };

    const handleAddTerm = async (e) => {
        e.preventDefault();
        if (!selectedYearId) return alert('Veuillez choisir une année');
        try {
            await axios.post(`${API_URL}/terms`, { ...newTerm, schoolYearId: selectedYearId }, {
                headers: { Authorization: `Bearer ${user.token}` },
            });
            setNewTerm({ name: '', startDate: '', endDate: '', schoolYearId: '' });
            fetchTerms(selectedYearId);
        } catch (error) {
            alert('Erreur lors de l\'ajout du trimestre');
        }
    };

    const handleDeleteTerm = async (id) => {
        if (!confirm('Supprimer ce découpage ?')) return;
        try {
            await axios.delete(`${API_URL}/terms/${id}`, {
                headers: { Authorization: `Bearer ${user.token}` },
            });
            fetchTerms(selectedYearId);
        } catch (error) {
            alert('Erreur lors de la suppression');
        }
    };

    const handleUpdateFee = async (e) => {
        e.preventDefault();
        try {
            await axios.put(`${config.API_URL}/payments/fees/${editingFee.id}`, {
                name: editingFee.name,
                amount: editingFee.amount,
                category: editingFee.category,
                type: editingFee.type
            }, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            alert('Frais modifié avec succès');
            setShowEditModal(false);
            setEditingFee(null);
            fetchData();
        } catch (error) {
            alert('Erreur lors de la modification du frais');
        }
    };

    const handleDeleteFee = async (feeId) => {
        if (!confirm('Êtes-vous sûr de vouloir supprimer ce frais ?')) return;
        try {
            await axios.delete(`${config.API_URL}/payments/fees/${feeId}`, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            alert('Frais supprimé avec succès');
        } catch (error) {
            alert('Erreur lors de la suppression du frais');
        }
    };

    return (
        <div style={{ padding: '1rem', maxWidth: '1200px', margin: '0 auto' }}>
            <header className="stack-on-mobile" style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                <div>
                    <h1 style={{ fontSize: '2.2rem', color: 'var(--primary-dark)', fontWeight: '800', margin: 0 }}>Configuration</h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>Paramètres de l'établissement et frais scolaires.</p>
                </div>
            </header>

            <div className="grid-resp-2" style={{ gap: '2rem' }}>

                {/* Academic Years Section */}
                <section className="card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                        <div style={{ padding: '0.5rem', borderRadius: '8px', background: 'var(--primary-light)', color: 'var(--primary)' }}>
                            <Calendar size={20} />
                        </div>
                        <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Années Académiques</h2>
                    </div>

                    <form onSubmit={handleAddYear} style={{ marginBottom: '2rem', padding: '1.25rem', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                        <div className="form-group">
                            <label className="form-label">Nom (ex: 2025-2026)</label>
                            <input type="text" className="form-input" value={newYear.name} onChange={e => setNewYear({ ...newYear, name: e.target.value })} placeholder="ex: 2024-2025" required />
                        </div>
                        <div className="grid-resp-2" style={{ gap: '1rem', marginBottom: '1rem' }}>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label className="form-label">Date Début</label>
                                <input type="date" className="form-input" value={newYear.startDate} onChange={e => setNewYear({ ...newYear, startDate: e.target.value })} required />
                            </div>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label className="form-label">Date Fin</label>
                                <input type="date" className="form-input" value={newYear.endDate} onChange={e => setNewYear({ ...newYear, endDate: e.target.value })} required />
                            </div>
                        </div>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem', cursor: 'pointer', padding: '0.5rem', borderRadius: '8px', border: '1px solid #eee', background: 'white' }}>
                            <input type="checkbox" style={{ width: '18px', height: '18px' }} checked={newYear.current} onChange={e => setNewYear({ ...newYear, current: e.target.checked })} />
                            <span style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--primary-dark)' }}>Définir comme année en cours</span>
                        </label>
                        <button type="submit" className="btn btn-primary btn-block" style={{ height: '45px' }}>Ajouter l'Année Académique</button>
                    </form>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {(Array.isArray(schoolYears) ? schoolYears : []).map(year => (
                            <div key={year.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', border: '1px solid #f1f5f9', borderRadius: '12px', alignItems: 'center', background: year.current ? '#f0f9ff' : 'white', borderColor: year.current ? '#bae6fd' : '#f1f5f9' }}>
                                <div>
                                    <div style={{ fontWeight: '700', color: 'var(--primary-dark)' }}>{year.name || '---'}</div>
                                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                                        {year.startDate ? new Date(year.startDate).toLocaleDateString('fr-FR') : '---'} - {year.endDate ? new Date(year.endDate).toLocaleDateString('fr-FR') : '---'}
                                    </div>
                                </div>
                                {year.current && <span style={{ background: 'var(--success)', color: 'white', padding: '0.3rem 0.75rem', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.3rem' }}><CheckCircle size={14} /> ACTIVE</span>}
                            </div>
                        ))}
                    </div>
                </section>

                {/* Classes Section */}
                <section className="card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                        <div style={{ padding: '0.5rem', borderRadius: '8px', background: 'var(--primary-light)', color: 'var(--primary)' }}>
                            <BookOpen size={20} />
                        </div>
                        <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Gestion des Classes</h2>
                    </div>

                    <form onSubmit={handleAddClass} style={{ marginBottom: '2rem', padding: '1.25rem', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                        <div className="form-group">
                            <label className="form-label">Nom de la Classe</label>
                            <input type="text" className="form-input" value={newClass.name} onChange={e => setNewClass({ ...newClass, name: e.target.value })} placeholder="ex: CM2 B, 6ème Rouge" required />
                        </div>
                        <div className="grid-resp-2" style={{ gap: '1rem', marginBottom: '1.25rem' }}>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label className="form-label">Niveau</label>
                                <select className="form-input" value={newClass.level} onChange={e => setNewClass({ ...newClass, level: e.target.value })} required>
                                    <option value="">Niveau...</option>
                                    <option value="MATERNELLE">Maternelle</option>
                                    <option value="PRIMAIRE">Primaire</option>
                                    <option value="COLLEGE">Collège</option>
                                    <option value="LYCEE">Lycée</option>
                                </select>
                            </div>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label className="form-label">Année Académique</label>
                                <select className="form-input" value={newClass.schoolYearId} onChange={e => setNewClass({ ...newClass, schoolYearId: e.target.value })} required>
                                    <option value="">Année...</option>
                                    {(Array.isArray(schoolYears) ? schoolYears : []).map(y => <option key={y.id} value={y.id}>{y.name || '---'}</option>)}
                                </select>
                            </div>
                        </div>
                        <button type="submit" className="btn btn-primary btn-block" style={{ height: '45px' }}>Créer la Classe</button>
                    </form>

                    <div className="grid-resp-2" style={{ gap: '0.75rem' }}>
                        {(Array.isArray(classes) ? classes : []).map(c => (
                            <div key={c.id} style={{ padding: '1rem', background: 'white', border: '1px solid #f1f5f9', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                <div style={{ fontWeight: '700', color: 'var(--primary-dark)' }}>{c.name || '---'}</div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', background: '#f1f5f9', borderRadius: '4px', color: 'var(--primary)', fontWeight: '700' }}>{c.level || '---'}</span>
                                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{c.schoolYear?.name || '---'}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Subjects Management */}
                <section className="card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                        <div style={{ padding: '0.5rem', borderRadius: '8px', background: 'var(--primary-light)', color: 'var(--primary)' }}>
                            <BookOpen size={20} />
                        </div>
                        <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Matières & Coefficients</h2>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Sélectionner une Classe</label>
                        <select 
                            className="form-input" 
                            style={{ height: '45px', fontWeight: '600' }}
                            value={selectedClassId} 
                            onChange={(e) => {
                                setSelectedClassId(e.target.value);
                                fetchSubjects(e.target.value);
                            }}
                        >
                            <option value="">-- Choisir une classe --</option>
                            {(Array.isArray(classes) ? classes : []).map(c => <option key={c.id} value={c.id}>{c.name || '---'} ({c.level || '---'})</option>)}
                        </select>
                    </div>

                    {selectedClassId && (
                        <div className="stack-on-mobile" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <form onSubmit={handleAddSubject} style={{ padding: '1.25rem', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                <div className="form-group">
                                    <label className="form-label">Intitulé de la Matière</label>
                                    <input type="text" className="form-input" value={newSubject.name} onChange={e => setNewSubject({...newSubject, name: e.target.value})} placeholder="ex: Mathématiques" required />
                                </div>
                                <div className="grid-resp-2" style={{ gap: '1rem', marginBottom: '1.25rem' }}>
                                    <div className="form-group" style={{ marginBottom: 0 }}>
                                        <label className="form-label">Code</label>
                                        <input type="text" className="form-input" value={newSubject.code} onChange={e => setNewSubject({...newSubject, code: e.target.value})} placeholder="ex: MATH" />
                                    </div>
                                    <div className="form-group" style={{ marginBottom: 0 }}>
                                        <label className="form-label">Coefficient</label>
                                        <input type="number" step="0.5" className="form-input" value={newSubject.coefficient} onChange={e => setNewSubject({...newSubject, coefficient: e.target.value})} required />
                                    </div>
                                </div>
                                <button type="submit" className="btn btn-primary btn-block">Ajouter à la Classe</button>
                            </form>

                            <div className="table-container" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead style={{ position: 'sticky', top: 0, background: 'white', zIndex: 10 }}>
                                        <tr style={{ textAlign: 'left', borderBottom: '2px solid #f1f5f9' }}>
                                            <th style={{ padding: '0.75rem', fontSize: '0.8rem', color: '#64748b' }}>Matière</th>
                                            <th style={{ padding: '0.75rem', fontSize: '0.8rem', color: '#64748b' }}>Coef.</th>
                                            <th style={{ padding: '0.75rem', fontSize: '0.8rem', color: '#64748b', textAlign: 'right' }}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(Array.isArray(subjects) ? subjects : []).map(s => (
                                            <tr key={s.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                <td style={{ padding: '0.75rem' }}>
                                                    <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>{s.name || '---'}</div>
                                                    <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{s.code || 'SANS CODE'}</div>
                                                </td>
                                                <td style={{ padding: '0.75rem' }}>
                                                    <span style={{ fontWeight: '800', color: 'var(--primary)' }}>{s.coefficient || 1}</span>
                                                </td>
                                                <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                                                    <button onClick={() => handleDeleteSubject(s.id)} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem' }}><Trash2 size={16} /></button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {subjects.length === 0 && <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>Aucune matière définie.</div>}
                            </div>
                        </div>
                    )}
                </section>

                {/* Terms Management */}
                <section className="card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                        <div style={{ padding: '0.5rem', borderRadius: '8px', background: 'var(--primary-light)', color: 'var(--primary)' }}>
                            <Calendar size={20} />
                        </div>
                        <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Découpage Académique</h2>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Sélectionner l'Année</label>
                        <select 
                            className="form-input" 
                            style={{ height: '45px', fontWeight: '600' }}
                            value={selectedYearId} 
                            onChange={(e) => {
                                setSelectedYearId(e.target.value);
                                fetchTerms(e.target.value);
                            }}
                        >
                            <option value="">-- Choisir une année --</option>
                            {schoolYears.map(y => <option key={y.id} value={y.id}>{y.name}</option>)}
                        </select>
                    </div>

                    {selectedYearId && (
                        <div className="stack-on-mobile" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <form onSubmit={handleAddTerm} style={{ padding: '1.25rem', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                <div className="form-group">
                                    <label className="form-label">Nom du Découpage</label>
                                    <input type="text" className="form-input" value={newTerm.name} onChange={e => setNewTerm({...newTerm, name: e.target.value})} placeholder="ex: 1er Trimestre, Semestre 1" required />
                                </div>
                                <div className="grid-resp-2" style={{ gap: '1rem', marginBottom: '1.25rem' }}>
                                    <div className="form-group" style={{ marginBottom: 0 }}>
                                        <label className="form-label">Du</label>
                                        <input type="date" className="form-input" value={newTerm.startDate} onChange={e => setNewTerm({...newTerm, startDate: e.target.value})} />
                                    </div>
                                    <div className="form-group" style={{ marginBottom: 0 }}>
                                        <label className="form-label">Au</label>
                                        <input type="date" className="form-input" value={newTerm.endDate} onChange={e => setNewTerm({...newTerm, endDate: e.target.value})} />
                                    </div>
                                </div>
                                <button type="submit" className="btn btn-primary btn-block">Ajouter Période</button>
                            </form>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                {(Array.isArray(terms) ? terms : []).map(t => (
                                    <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', background: 'white', border: '1px solid #f1f5f9', borderRadius: '12px', alignItems: 'center' }}>
                                        <div>
                                            <div style={{ fontWeight: '700', color: 'var(--primary-dark)' }}>{t.name || '---'}</div>
                                            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                                                {t.startDate ? new Date(t.startDate).toLocaleDateString('fr-FR') : 'N/A'} - {t.endDate ? new Date(t.endDate).toLocaleDateString('fr-FR') : 'N/A'}
                                            </div>
                                        </div>
                                        <button onClick={() => handleDeleteTerm(t.id)} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem' }}><Trash2 size={18} /></button>
                                    </div>
                                ))}
                                {(!Array.isArray(terms) || terms.length === 0) && <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>Aucun découpage défini.</div>}
                            </div>
                        </div>
                    )}
                </section>

                {/* ADVANCED FEE CONFIGURATION */}
                <section className="card" style={{ gridColumn: '1 / -1' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
                        <div style={{ padding: '0.5rem', borderRadius: '8px', background: 'var(--primary-light)', color: 'var(--primary)' }}>
                            <Plus size={20} />
                        </div>
                        <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Tableau des Frais Scolaires</h2>
                    </div>

                    <div className="stack-on-mobile" style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) 2fr', gap: '2rem' }}>
                        {/* Add Fee Form */}
                        <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '16px', border: '1px solid #e2e8f0', height: 'fit-content' }}>
                            <h3 style={{ fontSize: '1rem', marginBottom: '1.25rem', fontWeight: '700', color: 'var(--primary-dark)' }}>Définir un Nouveau Frais</h3>
                            <form onSubmit={async (e) => {
                                e.preventDefault();
                                const data = new FormData(e.target);
                                try {
                                    await axios.post(`${config.API_URL}/payments/fees`, {
                                        name: data.get('name'),
                                        amount: data.get('amount'),
                                        category: data.get('category'),
                                        type: data.get('type'),
                                        classId: data.get('classId')
                                    }, { headers: { Authorization: `Bearer ${user.token}` } });
                                    alert('Frais ajouté avec succès');
                                    e.target.reset();
                                    fetchData();
                                } catch (err) { alert('Erreur lors de l\'ajout du frais'); }
                            }}>
                                <div className="form-group">
                                    <label className="form-label">Libellé du Frais</label>
                                    <input name="name" type="text" className="form-input" placeholder="ex: Frais de Scolarité" required />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Montant (FCFA)</label>
                                    <input name="amount" type="number" className="form-input" placeholder="0" required />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Classe Concernée</label>
                                    <select name="classId" className="form-input" required>
                                        <option value="">Sélectionner une classe...</option>
                                        {(Array.isArray(classes) ? classes : []).map(c => <option key={c.id} value={c.id}>{c.name || '---'} ({c.level || '---'})</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Catégorie d'Exigibilité</label>
                                    <select name="category" className="form-input" required>
                                        <option value="ANNUAL_OBLIGATORY">Obligatoire Annuel</option>
                                        <option value="OPTIONAL">Optionnel / Facultatif</option>
                                        <option value="OCCASIONAL">Occasionnel / Spécifique</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Nature du Frais</label>
                                    <select name="type" className="form-input" required>
                                        <optgroup label="Scolarité Core">
                                            <option value="TUITION">Scolarité (Instruction)</option>
                                            <option value="REGISTRATION">Frais d'Inscription</option>
                                        </optgroup>
                                        <optgroup label="Services École">
                                            <option value="TRANSPORT">Transport / Bus</option>
                                            <option value="CANTEEN">Cantine Scolaire</option>
                                            <option value="HEALTH">Infirmerie / Assurance</option>
                                        </optgroup>
                                        <optgroup label="Fournitures">
                                            <option value="UNIFORM">Tenues & Uniformes</option>
                                            <option value="BOOKS">Manuels & Fournitures</option>
                                        </optgroup>
                                        <optgroup label="Autres">
                                            <option value="EXAM">Frais d'Examen</option>
                                            <option value="ACTIVITY">Sorties & Activités</option>
                                            <option value="DIPLOMA">Frais de Diplôme</option>
                                            <option value="PENALTY">Pénalités</option>
                                            <option value="OTHER">Frais Divers</option>
                                        </optgroup>
                                    </select>
                                </div>
                                <button type="submit" className="btn btn-primary btn-block" style={{ height: '48px', marginTop: '0.5rem' }}>Enregistrer le Frais</button>
                            </form>
                        </div>

                        {/* Fees List with Table Scroll */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            {(Array.isArray(classes) ? classes : []).filter(c => Array.isArray(c.fees) && c.fees.length > 0).map(c => (
                                <div key={c.id} style={{ border: '1px solid #e2e8f0', borderRadius: '16px', overflow: 'hidden', background: 'white', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                                    <div style={{ background: 'var(--primary-dark)', color: 'white', padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '800' }}>{c.name || '---'}</h4>
                                            <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>{c.level || '---'} • {c.schoolYear?.name || '---'}</span>
                                        </div>
                                        <div style={{ background: 'rgba(255,255,255,0.15)', padding: '0.4rem 0.8rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: '700' }}>
                                            {(Array.isArray(c.fees) ? c.fees.length : 0)} Frais
                                        </div>
                                    </div>

                                    <div className="table-container">
                                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                            <thead>
                                                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #f1f5f9' }}>
                                                    <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', color: '#64748b' }}>LIBELLÉ</th>
                                                    <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', color: '#64748b' }}>CATÉGORIE</th>
                                                    <th style={{ padding: '0.75rem 1rem', textAlign: 'right', fontSize: '0.75rem', color: '#64748b' }}>MONTANT</th>
                                                    <th style={{ padding: '0.75rem 1rem', textAlign: 'center', fontSize: '0.75rem', color: '#64748b' }}>ACTIONS</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {(Array.isArray(c.fees) ? c.fees : []).map((f, idx) => (
                                                    <tr key={f.id} style={{ borderBottom: idx < c.fees.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                                                        <td style={{ padding: '0.875rem 1rem' }}>
                                                            <div style={{ fontWeight: '600', fontSize: '0.875rem' }}>{f.name || '---'}</div>
                                                            <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                                                                {f.type === 'TUITION' ? 'Scolarité' : f.type === 'REGISTRATION' ? 'Inscription' : 'Service'}
                                                            </div>
                                                        </td>
                                                        <td style={{ padding: '0.875rem 1rem' }}>
                                                            <span style={{
                                                                fontSize: '0.65rem', fontWeight: '800', padding: '0.2rem 0.5rem', borderRadius: '4px',
                                                                background: f.category === 'ANNUAL_OBLIGATORY' ? '#dcfce7' : f.category === 'OPTIONAL' ? '#fef3c7' : '#f5f5f5',
                                                                color: f.category === 'ANNUAL_OBLIGATORY' ? '#166534' : f.category === 'OPTIONAL' ? '#92400e' : '#616161'
                                                            }}>
                                                                {f.category === 'ANNUAL_OBLIGATORY' ? 'OBLIGATOIRE' : f.category === 'OPTIONAL' ? 'OPTIONNEL' : 'OCCASIONNEL'}
                                                            </span>
                                                        </td>
                                                        <td style={{ padding: '0.875rem 1rem', textAlign: 'right', fontWeight: '800', color: 'var(--primary-dark)', fontSize: '0.9rem' }}>
                                                            {(f.amount || 0).toLocaleString()}
                                                        </td>
                                                        <td style={{ padding: '0.875rem 1rem' }}>
                                                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                                                                <button onClick={() => { setEditingFee(f); setShowEditModal(true); }} style={{ padding: '0.4rem', color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer' }}><Edit size={16} /></button>
                                                                <button onClick={() => handleDeleteFee(f.id)} style={{ padding: '0.4rem', color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}><Trash2 size={16} /></button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            ))}
                            {classes.filter(c => c.fees && c.fees.length > 0).length === 0 && (
                                <div style={{ padding: '4rem 2rem', textAlign: 'center', background: '#f8fafc', borderRadius: '16px', border: '2px dashed #e2e8f0', color: '#94a3b8' }}>
                                    <Plus size={32} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                                    <p style={{ fontWeight: '600', margin: 0 }}>Aucun frais configuré</p>
                                    <p style={{ fontSize: '0.85rem' }}>Utilisez le formulaire pour commencer la configuration.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </section>

            </div>

            {/* Edit Fee Modal - Optimized for Mobile */}
            {showEditModal && editingFee && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 3000 }}>
                    <div className="card" style={{ maxWidth: '500px', width: '100%', borderBottomLeftRadius: 0, borderBottomRightRadius: 0, padding: '1.5rem 2rem 2.5rem 2rem', maxHeight: '90vh', overflowY: 'auto' }}>
                        <div style={{ width: '40px', height: '4px', background: '#e2e8f0', borderRadius: '2px', margin: '0 auto 1.5rem auto' }} className="mobile-only"></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--primary-dark)', margin: 0 }}>Modifier Frais</h2>
                            <button onClick={() => { setShowEditModal(false); setEditingFee(null); }} style={{ background: '#f1f5f9', border: 'none', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}><X size={18} /></button>
                        </div>
                        <form onSubmit={handleUpdateFee}>
                            <div className="form-group">
                                <label className="form-label">Libellé du Frais</label>
                                <input type="text" className="form-input" value={editingFee.name} onChange={e => setEditingFee({ ...editingFee, name: e.target.value })} required />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Montant (FCFA)</label>
                                <input type="number" className="form-input" value={editingFee.amount} onChange={e => setEditingFee({ ...editingFee, amount: parseInt(e.target.value) })} required />
                            </div>
                            <div className="grid-resp-2" style={{ gap: '1rem' }}>
                                <div className="form-group">
                                    <label className="form-label">Catégorie</label>
                                    <select className="form-input" value={editingFee.category} onChange={e => setEditingFee({ ...editingFee, category: e.target.value })} required>
                                        <option value="ANNUAL_OBLIGATORY">🟢 Obligatoire</option>
                                        <option value="OPTIONAL">🟡 Optionnel</option>
                                        <option value="OCCASIONAL">🟠 Occasionnel</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Type</label>
                                    <select className="form-input" value={editingFee.type} onChange={e => setEditingFee({ ...editingFee, type: e.target.value })} required>
                                        <option value="TUITION">Scolarité</option>
                                        <option value="REGISTRATION">Inscription</option>
                                        <option value="TRANSPORT">Transport</option>
                                        <option value="CANTEEN">Cantine</option>
                                        <option value="UNIFORM">Tenues</option>
                                        <option value="BOOKS">Fournitures</option>
                                        <option value="EXAM">Examens</option>
                                        <option value="OTHER">Autre</option>
                                    </select>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                                <button type="submit" className="btn btn-primary" style={{ flex: 1, height: '48px' }}>Mettre à Jour</button>
                                <button type="button" onClick={() => { setShowEditModal(false); setEditingFee(null); }} className="btn" style={{ flex: 1, background: '#f8fafc', border: '1px solid #e2e8f0', color: '#64748b' }}>Annuler</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Configuration;
