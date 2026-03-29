import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import config from '../config';
import { Plus, Calendar, BookOpen, CheckCircle, Edit, Trash2 } from 'lucide-react';

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
            fetchData();
        } catch (error) {
            alert('Erreur lors de la suppression du frais');
        }
    };

    return (
        <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
            <header style={{ marginBottom: '2.5rem' }}>
                <h1 style={{ fontSize: '2rem', color: 'var(--primary-dark)' }}>Configuration de l'Établissement</h1>
                <p style={{ color: 'var(--text-muted)' }}>Gérez les années académiques et les classes.</p>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '2rem' }}>

                {/* Academic Years Section */}
                <section className="card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                        <Calendar color="var(--primary)" />
                        <h2 style={{ fontSize: '1.25rem' }}>Années Académiques</h2>
                    </div>

                    <form onSubmit={handleAddYear} style={{ marginBottom: '2rem', padding: '1rem', background: '#f9f9f9', borderRadius: '8px' }}>
                        <div className="form-group">
                            <label className="form-label">Nom (ex: 2025-2026)</label>
                            <input type="text" className="form-input" value={newYear.name} onChange={e => setNewYear({ ...newYear, name: e.target.value })} required />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div className="form-group">
                                <label className="form-label">Date Début</label>
                                <input type="date" className="form-input" value={newYear.startDate} onChange={e => setNewYear({ ...newYear, startDate: e.target.value })} required />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Date Fin</label>
                                <input type="date" className="form-input" value={newYear.endDate} onChange={e => setNewYear({ ...newYear, endDate: e.target.value })} required />
                            </div>
                        </div>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', cursor: 'pointer' }}>
                            <input type="checkbox" checked={newYear.current} onChange={e => setNewYear({ ...newYear, current: e.target.checked })} />
                            Année en cours
                        </label>
                        <button type="submit" className="btn btn-primary btn-block">Ajouter l'Année</button>
                    </form>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {schoolYears.map(year => (
                            <div key={year.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', border: '1px solid #eee', borderRadius: '8px', alignItems: 'center' }}>
                                <div>
                                    <div style={{ fontWeight: '600' }}>{year.name}</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(year.startDate).toLocaleDateString()} - {new Date(year.endDate).toLocaleDateString()}</div>
                                </div>
                                {year.current && <span style={{ background: '#e8f5e9', color: '#2e7d32', padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.25rem' }}><CheckCircle size={14} /> Actuelle</span>}
                            </div>
                        ))}
                    </div>
                </section>

                {/* Classes Section */}
                <section className="card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                        <BookOpen color="var(--primary)" />
                        <h2 style={{ fontSize: '1.25rem' }}>Gestion des Classes</h2>
                    </div>

                    <form onSubmit={handleAddClass} style={{ marginBottom: '2rem', padding: '1rem', background: '#f9f9f9', borderRadius: '8px' }}>
                        <div className="form-group">
                            <label className="form-label">Nom de la Classe (ex: CM2, 3ème A)</label>
                            <input type="text" className="form-input" value={newClass.name} onChange={e => setNewClass({ ...newClass, name: e.target.value })} required />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Niveau</label>
                            <select className="form-input" value={newClass.level} onChange={e => setNewClass({ ...newClass, level: e.target.value })} required>
                                <option value="">Choisir un niveau...</option>
                                <option value="MATERNELLE">Maternelle</option>
                                <option value="PRIMAIRE">Primaire</option>
                                <option value="COLLEGE">Collège</option>
                                <option value="LYCEE">Lycée</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Année Académique</label>
                            <select className="form-input" value={newClass.schoolYearId} onChange={e => setNewClass({ ...newClass, schoolYearId: e.target.value })} required>
                                <option value="">Choisir l'année...</option>
                                {schoolYears.map(y => <option key={y.id} value={y.id}>{y.name}</option>)}
                            </select>
                        </div>
                        <button type="submit" className="btn btn-primary btn-block">Ajouter la Classe</button>
                    </form>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                        {classes.map(c => (
                            <div key={c.id} style={{ padding: '1rem', border: '1px solid #eee', borderRadius: '8px' }}>
                                <div style={{ fontWeight: '600' }}>{c.name}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: '500' }}>{c.level}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{c.schoolYear?.name}</div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Subjects Management */}
                <section className="card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                        <BookOpen color="var(--primary)" />
                        <h2 style={{ fontSize: '1.25rem' }}>Matières par Classe</h2>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Choisir une Classe</label>
                        <select 
                            className="form-input" 
                            value={selectedClassId} 
                            onChange={(e) => {
                                setSelectedClassId(e.target.value);
                                fetchSubjects(e.target.value);
                            }}
                        >
                            <option value="">Sélectionner une classe...</option>
                            {classes.map(c => <option key={c.id} value={c.id}>{c.name} ({c.level})</option>)}
                        </select>
                    </div>

                    {selectedClassId && (
                        <>
                            <form onSubmit={handleAddSubject} style={{ marginBottom: '2rem', padding: '1rem', background: '#f9f9f9', borderRadius: '8px' }}>
                                <div className="form-group">
                                    <label className="form-label">Nom de la Matière</label>
                                    <input type="text" className="form-input" value={newSubject.name} onChange={e => setNewSubject({...newSubject, name: e.target.value})} placeholder="ex: Mathématiques" required />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div className="form-group">
                                        <label className="form-label">Code (Optionnel)</label>
                                        <input type="text" className="form-input" value={newSubject.code} onChange={e => setNewSubject({...newSubject, code: e.target.value})} placeholder="ex: MATH" />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Coefficient</label>
                                        <input type="number" step="0.5" className="form-input" value={newSubject.coefficient} onChange={e => setNewSubject({...newSubject, coefficient: e.target.value})} required />
                                    </div>
                                </div>
                                <button type="submit" className="btn btn-primary btn-block">Ajouter la Matière</button>
                            </form>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                {subjects.map(s => (
                                    <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 1rem', border: '1px solid #eee', borderRadius: '8px', alignItems: 'center' }}>
                                        <div>
                                            <div style={{ fontWeight: '600' }}>{s.name} <span style={{ color: '#666', fontWeight: '400' }}>({s.code})</span></div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: '700' }}>Coefficient: {s.coefficient}</div>
                                        </div>
                                        <button onClick={() => handleDeleteSubject(s.id)} style={{ color: '#991b1b', background: 'none', border: 'none', cursor: 'pointer' }}><Trash2 size={16} /></button>
                                    </div>
                                ))}
                                {subjects.length === 0 && <p style={{ textAlign: 'center', color: '#999', fontSize: '0.9rem' }}>Aucune matière définie.</p>}
                            </div>
                        </>
                    )}
                </section>

                {/* Terms Management */}
                <section className="card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                        <Calendar color="var(--primary)" />
                        <h2 style={{ fontSize: '1.25rem' }}>Découpage (Trimestres/Semestres)</h2>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Choisir l'Année Académique</label>
                        <select 
                            className="form-input" 
                            value={selectedYearId} 
                            onChange={(e) => {
                                setSelectedYearId(e.target.value);
                                fetchTerms(e.target.value);
                            }}
                        >
                            <option value="">Sélectionner une année...</option>
                            {schoolYears.map(y => <option key={y.id} value={y.id}>{y.name}</option>)}
                        </select>
                    </div>

                    {selectedYearId && (
                        <>
                            <form onSubmit={handleAddTerm} style={{ marginBottom: '2rem', padding: '1rem', background: '#f9f9f9', borderRadius: '8px' }}>
                                <div className="form-group">
                                    <label className="form-label">Nom du Trimestre</label>
                                    <input type="text" className="form-input" value={newTerm.name} onChange={e => setNewTerm({...newTerm, name: e.target.value})} placeholder="ex: 1er Trimestre" required />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div className="form-group">
                                        <label className="form-label">Début (Optionnel)</label>
                                        <input type="date" className="form-input" value={newTerm.startDate} onChange={e => setNewTerm({...newTerm, startDate: e.target.value})} />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Fin (Optionnel)</label>
                                        <input type="date" className="form-input" value={newTerm.endDate} onChange={e => setNewTerm({...newTerm, endDate: e.target.value})} />
                                    </div>
                                </div>
                                <button type="submit" className="btn btn-primary btn-block">Ajouter le Trimestre</button>
                            </form>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                {terms.map(t => (
                                    <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 1rem', border: '1px solid #eee', borderRadius: '8px', alignItems: 'center' }}>
                                        <div>
                                            <div style={{ fontWeight: '600' }}>{t.name}</div>
                                            <div style={{ fontSize: '0.75rem', color: '#666' }}>
                                                {t.startDate ? new Date(t.startDate).toLocaleDateString() : 'N/A'} - {t.endDate ? new Date(t.endDate).toLocaleDateString() : 'N/A'}
                                            </div>
                                        </div>
                                        <button onClick={() => handleDeleteTerm(t.id)} style={{ color: '#991b1b', background: 'none', border: 'none', cursor: 'pointer' }}><Trash2 size={16} /></button>
                                    </div>
                                ))}
                                {terms.length === 0 && <p style={{ textAlign: 'center', color: '#999', fontSize: '0.9rem' }}>Aucun trimestre défini.</p>}
                            </div>
                        </>
                    )}
                </section>

                {/* ADVANCED FEE CONFIGURATION */}
                <section className="card" style={{ gridColumn: '1 / -1' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                        <Plus color="var(--primary)" />
                        <h2 style={{ fontSize: '1.25rem' }}>Configuration des Frais Scolaires</h2>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
                        {/* Add Fee Form */}
                        <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                            <h3 style={{ fontSize: '1rem', marginBottom: '1rem', fontWeight: '700' }}>Définir un Nouveau Frais</h3>
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
                                    <input name="name" type="text" className="form-input" placeholder="ex: Scolarité Trimestre 1" required />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Montant (FCFA)</label>
                                    <input name="amount" type="number" className="form-input" required />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Classe Concernée</label>
                                    <select name="classId" className="form-input" required>
                                        <option value="">Sélectionner...</option>
                                        {classes.map(c => <option key={c.id} value={c.id}>{c.name} ({c.level})</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Catégorie</label>
                                    <select name="category" className="form-input" required>
                                        <option value="ANNUAL_OBLIGATORY">🟢 Obligatoire Annuel</option>
                                        <option value="OPTIONAL">🟡 Optionnel</option>
                                        <option value="OCCASIONAL">🟠 Occasionnel</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Type de Frais</label>
                                    <select name="type" className="form-input" required>
                                        <optgroup label="Scolarité">
                                            <option value="TUITION">Scolarité (Annuelle/Mensuelle)</option>
                                            <option value="REGISTRATION">Inscription / Réinscription</option>
                                        </optgroup>
                                        <optgroup label="Services">
                                            <option value="TRANSPORT">Transport Scolaire</option>
                                            <option value="CANTEEN">Cantine / Restauration</option>
                                            <option value="HEALTH">Santé / Assurance</option>
                                        </optgroup>
                                        <optgroup label="Fournitures & Équipements">
                                            <option value="UNIFORM">Uniforme / Tenue</option>
                                            <option value="BOOKS">Manuels / Fournitures</option>
                                        </optgroup>
                                        <optgroup label="Examens & Activités">
                                            <option value="EXAM">Frais d'Examen / Concours</option>
                                            <option value="ACTIVITY">Sorties / Événements</option>
                                            <option value="DIPLOMA">Diplômes & Certificats</option>
                                        </optgroup>
                                        <optgroup label="Divers">
                                            <option value="PENALTY">Pénalités / Retards</option>
                                            <option value="OTHER">Autres frais divers</option>
                                        </optgroup>
                                    </select>
                                </div>
                                <button type="submit" className="btn btn-primary btn-block">Enregistrer le Frais</button>
                            </form>
                        </div>

                        {/* List of defined fees grouped by class */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            {classes.filter(c => c.fees && c.fees.length > 0).map(c => (
                                <div key={c.id} style={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
                                    {/* Class Header */}
                                    <div style={{
                                        background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)',
                                        color: 'white',
                                        padding: '1rem 1.5rem',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center'
                                    }}>
                                        <div>
                                            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', margin: 0 }}>{c.name}</h3>
                                            <p style={{ fontSize: '0.85rem', opacity: 0.9, margin: '0.25rem 0 0 0' }}>{c.level} • {c.schoolYear?.name}</p>
                                        </div>
                                        <div style={{
                                            background: 'rgba(255,255,255,0.2)',
                                            padding: '0.5rem 1rem',
                                            borderRadius: '20px',
                                            fontSize: '0.85rem',
                                            fontWeight: '600'
                                        }}>
                                            {c.fees.length} frais
                                        </div>
                                    </div>

                                    {/* Fees List */}
                                    <div style={{ background: 'white' }}>
                                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                            <thead>
                                                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                                                    <th style={{ padding: '0.75rem 1.5rem', textAlign: 'left', fontSize: '0.85rem', fontWeight: '600', color: '#64748b' }}>Libellé du Frais</th>
                                                    <th style={{ padding: '0.75rem 1.5rem', textAlign: 'left', fontSize: '0.85rem', fontWeight: '600', color: '#64748b' }}>Catégorie</th>
                                                    <th style={{ padding: '0.75rem 1.5rem', textAlign: 'left', fontSize: '0.85rem', fontWeight: '600', color: '#64748b' }}>Type</th>
                                                    <th style={{ padding: '0.75rem 1.5rem', textAlign: 'right', fontSize: '0.85rem', fontWeight: '600', color: '#64748b' }}>Montant</th>
                                                    <th style={{ padding: '0.75rem 1.5rem', textAlign: 'center', fontSize: '0.85rem', fontWeight: '600', color: '#64748b' }}>Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {c.fees.map((f, idx) => (
                                                    <tr key={f.id} style={{
                                                        borderBottom: idx < c.fees.length - 1 ? '1px solid #f1f5f9' : 'none',
                                                        transition: 'background 0.2s'
                                                    }}
                                                        onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                                                        onMouseLeave={e => e.currentTarget.style.background = 'white'}
                                                    >
                                                        <td style={{ padding: '1rem 1.5rem', fontSize: '0.9rem' }}>{f.name}</td>
                                                        <td style={{ padding: '1rem 1.5rem' }}>
                                                            <span style={{
                                                                fontSize: '0.75rem',
                                                                fontWeight: '600',
                                                                padding: '0.3rem 0.75rem',
                                                                borderRadius: '6px',
                                                                background: f.category === 'ANNUAL_OBLIGATORY' ? '#dcfce7' : f.category === 'OPTIONAL' ? '#fef3c7' : '#fee2e2',
                                                                color: f.category === 'ANNUAL_OBLIGATORY' ? '#166534' : f.category === 'OPTIONAL' ? '#92400e' : '#991b1b'
                                                            }}>
                                                                {f.category === 'ANNUAL_OBLIGATORY' ? '🟢 OBLIGATOIRE' : f.category === 'OPTIONAL' ? '🟡 OPTIONNEL' : '🟠 OCCASIONNEL'}
                                                            </span>
                                                        </td>
                                                        <td style={{ padding: '1rem 1.5rem', fontSize: '0.85rem', color: '#64748b' }}>
                                                            {f.type === 'TUITION' ? 'Scolarité' :
                                                                f.type === 'REGISTRATION' ? 'Inscription' :
                                                                    f.type === 'TRANSPORT' ? 'Transport' :
                                                                        f.type === 'CANTEEN' ? 'Cantine' :
                                                                            f.type === 'UNIFORM' ? 'Uniforme' :
                                                                                f.type === 'EXAM' ? 'Examen' :
                                                                                    f.type === 'BOOKS' ? 'Fournitures' :
                                                                                        f.type === 'HEALTH' ? 'Santé' :
                                                                                            f.type === 'ACTIVITY' ? 'Activité' :
                                                                                                f.type === 'DIPLOMA' ? 'Diplôme' :
                                                                                                    f.type === 'PENALTY' ? 'Pénalité' : 'Autre'}
                                                        </td>
                                                        <td style={{ padding: '1rem 1.5rem', textAlign: 'right', fontSize: '0.95rem', fontWeight: '600', color: 'var(--primary-dark)' }}>
                                                            {f.amount.toLocaleString()} FCFA
                                                        </td>
                                                        <td style={{ padding: '1rem 1.5rem', textAlign: 'center' }}>
                                                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                                                                <button
                                                                    onClick={() => {
                                                                        setEditingFee(f);
                                                                        setShowEditModal(true);
                                                                    }}
                                                                    className="btn"
                                                                    style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                                                                    title="Modifier"
                                                                >
                                                                    <Edit size={14} /> Modifier
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDeleteFee(f.id)}
                                                                    style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', background: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                                                                    title="Supprimer"
                                                                >
                                                                    <Trash2 size={14} /> Supprimer
                                                                </button>
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
                                <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                                    <p>Aucun frais configuré pour le moment.</p>
                                    <p style={{ fontSize: '0.85rem' }}>Utilisez le formulaire ci-dessus pour ajouter des frais.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </section>

            </div>

            {/* Edit Fee Modal */}
            {showEditModal && editingFee && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div className="card" style={{ maxWidth: '500px', width: '90%', maxHeight: '90vh', overflow: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h2 style={{ fontSize: '1.5rem', color: 'var(--primary-dark)' }}>Modifier le Frais</h2>
                            <button onClick={() => { setShowEditModal(false); setEditingFee(null); }} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#999' }}>×</button>
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
                            <div className="form-group">
                                <label className="form-label">Catégorie</label>
                                <select className="form-input" value={editingFee.category} onChange={e => setEditingFee({ ...editingFee, category: e.target.value })} required>
                                    <option value="ANNUAL_OBLIGATORY">🟢 Obligatoire Annuel</option>
                                    <option value="OPTIONAL">🟡 Optionnel</option>
                                    <option value="OCCASIONAL">🟠 Occasionnel</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Type de Frais</label>
                                <select className="form-input" value={editingFee.type} onChange={e => setEditingFee({ ...editingFee, type: e.target.value })} required>
                                    <optgroup label="Scolarité">
                                        <option value="TUITION">Scolarité (Annuelle/Mensuelle)</option>
                                        <option value="REGISTRATION">Inscription / Réinscription</option>
                                    </optgroup>
                                    <optgroup label="Services">
                                        <option value="TRANSPORT">Transport Scolaire</option>
                                        <option value="CANTEEN">Cantine / Restauration</option>
                                        <option value="HEALTH">Santé / Assurance</option>
                                    </optgroup>
                                    <optgroup label="Fournitures & Équipements">
                                        <option value="UNIFORM">Uniforme / Tenue</option>
                                        <option value="BOOKS">Manuels / Fournitures</option>
                                    </optgroup>
                                    <optgroup label="Examens & Activités">
                                        <option value="EXAM">Frais d'Examen / Concours</option>
                                        <option value="ACTIVITY">Sorties / Événements</option>
                                        <option value="DIPLOMA">Diplômes & Certificats</option>
                                    </optgroup>
                                    <optgroup label="Divers">
                                        <option value="PENALTY">Pénalités / Retards</option>
                                        <option value="OTHER">Autres frais divers</option>
                                    </optgroup>
                                </select>
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Enregistrer</button>
                                <button type="button" onClick={() => { setShowEditModal(false); setEditingFee(null); }} className="btn" style={{ flex: 1 }}>Annuler</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Configuration;
