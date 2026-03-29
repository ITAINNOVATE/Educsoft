import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import config from '../config';
import { Save, Search, BookOpen, Clock, Users as UsersIcon, ChevronRight } from 'lucide-react';

const Grades = () => {
    const [classes, setClasses] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [terms, setTerms] = useState([]);
    const [studentGrades, setStudentGrades] = useState([]);
    
    const [selectedClass, setSelectedClass] = useState('');
    const [selectedSubject, setSelectedSubject] = useState('');
    const [selectedTerm, setSelectedTerm] = useState('');
    
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const { user } = useAuth();

    const API_URL = config.API_URL;
    const authHeader = { headers: { Authorization: `Bearer ${user.token}` } };

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        try {
            const [classesRes, yearsRes] = await Promise.all([
                axios.get(`${API_URL}/config/classes`, authHeader),
                axios.get(`${API_URL}/config/school-years`, authHeader)
            ]);
            setClasses(classesRes.data);
            
            const currentYear = yearsRes.data.find(y => y.current) || yearsRes.data[0];
            if (currentYear) {
                const termsRes = await axios.get(`${API_URL}/config/terms/${currentYear.id}`, authHeader);
                setTerms(termsRes.data);
            }
        } catch (error) {
            console.error('Error fetching initial data:', error);
        }
    };

    const handleClassChange = async (classId) => {
        setSelectedClass(classId);
        setSelectedSubject('');
        setStudentGrades([]);
        if (!classId) return;

        try {
            const res = await axios.get(`${API_URL}/config/subjects/${classId}`, authHeader);
            setSubjects(res.data);
        } catch (error) {
            console.error('Error fetching subjects:', error);
        }
    };

    const fetchGrades = async () => {
        if (!selectedClass || !selectedSubject || !selectedTerm) return;
        setLoading(true);
        try {
            const res = await axios.get(`${API_URL}/grades`, {
                ...authHeader,
                params: { classId: selectedClass, subjectId: selectedSubject, termId: selectedTerm }
            });
            setStudentGrades(res.data);
        } catch (error) {
            console.error('Error fetching grades:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleGradeChange = (studentId, value) => {
        // Simple validation 0-20
        if (value !== '' && (parseFloat(value) < 0 || parseFloat(value) > 20)) return;
        
        setStudentGrades(prev => prev.map(sg => 
            sg.studentId === studentId ? { ...sg, value } : sg
        ));
    };

    const handleSave = async () => {
        if (studentGrades.length === 0) return;
        setSaving(true);
        try {
            await axios.post(`${API_URL}/grades/bulk`, {
                classId: selectedClass,
                subjectId: selectedSubject,
                termId: selectedTerm,
                grades: studentGrades.filter(sg => sg.value !== '').map(sg => ({
                    studentId: sg.studentId,
                    gradeId: sg.gradeId,
                    value: sg.value,
                    type: sg.type
                }))
            }, authHeader);
            alert('Notes enregistrées avec succès !');
            fetchGrades();
        } catch (error) {
            alert('Erreur lors de l\'enregistrement');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
            <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ fontSize: '2.25rem', fontWeight: '800', color: 'var(--primary-dark)', letterSpacing: '-0.5px' }}>Saisie des Notes</h1>
                    <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>Enregistrez les résultats académiques par classe et par matière.</p>
                </div>
            </header>

            {/* Filters Section */}
            <section className="card" style={{ marginBottom: '2rem', background: 'linear-gradient(to right, #ffffff, #f8fafc)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', alignItems: 'end' }}>
                    <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><UsersIcon size={14} /> Classe</label>
                        <select className="form-input" value={selectedClass} onChange={e => handleClassChange(e.target.value)}>
                            <option value="">Sélectionner une classe...</option>
                            {classes.map(c => <option key={c.id} value={c.id}>{c.name} ({c.level})</option>)}
                        </select>
                    </div>

                    <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><BookOpen size={14} /> Matière</label>
                        <select className="form-input" value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)} disabled={!selectedClass}>
                            <option value="">Sélectionner une matière...</option>
                            {subjects.map(s => <option key={s.id} value={s.id}>{s.name} (Coeff: {s.coefficient})</option>)}
                        </select>
                    </div>

                    <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Clock size={14} /> Période / Trimestre</label>
                        <select className="form-input" value={selectedTerm} onChange={e => setSelectedTerm(e.target.value)}>
                            <option value="">Sélectionner la période...</option>
                            {terms.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                    </div>

                    <button 
                        onClick={fetchGrades}
                        disabled={!selectedClass || !selectedSubject || !selectedTerm || loading}
                        className="btn btn-primary"
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', height: '42px' }}
                    >
                        <Search size={18} /> {loading ? 'Chargement...' : 'Afficher la Liste'}
                    </button>
                </div>
            </section>

            {/* Grades Grid */}
            {studentGrades.length > 0 ? (
                <section className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ background: 'var(--primary)', color: 'white', padding: '0.5rem', borderRadius: '8px' }}>
                                <UsersIcon size={20} />
                            </div>
                            <div>
                                <h3 style={{ margin: 0, fontWeight: '700' }}>Tableau de Saisie - {subjects.find(s => s.id === selectedSubject)?.name}</h3>
                                <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>{studentGrades.length} élèves inscrits</p>
                            </div>
                        </div>
                        <button 
                            onClick={handleSave} 
                            disabled={saving}
                            className="btn btn-primary" 
                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.5rem', borderRadius: '10px', boxShadow: '0 4px 12px rgba(var(--primary-rgb), 0.2)' }}
                        >
                            <Save size={18} /> {saving ? 'Enregistrement...' : 'Enregistrer Tout'}
                        </button>
                    </div>

                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ background: '#ffffff', borderBottom: '2px solid #e2e8f0' }}>
                                    <th style={{ padding: '1rem 1.5rem', textAlign: 'left', fontSize: '0.85rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Matricule</th>
                                    <th style={{ padding: '1rem 1.5rem', textAlign: 'left', fontSize: '0.85rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Nom & Prénoms</th>
                                    <th style={{ padding: '1rem 1.5rem', textAlign: 'center', fontSize: '0.85rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', width: '200px' }}>Note (/20)</th>
                                    <th style={{ padding: '1rem 1.5rem', textAlign: 'left', fontSize: '0.85rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Progression</th>
                                    <th style={{ padding: '1rem 1.5rem', textAlign: 'center', fontSize: '0.85rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Bulletin</th>
                                </tr>
                            </thead>
                            <tbody>
                                {studentGrades.map((sg, idx) => (
                                    <tr key={sg.studentId} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.2s' }}>
                                        <td style={{ padding: '1rem 1.5rem', color: '#64748b', fontSize: '0.9rem', fontWeight: '600' }}>{sg.regNumber}</td>
                                        <td style={{ padding: '1rem 1.5rem', fontWeight: '700', color: 'var(--primary-dark)' }}>{sg.studentName}</td>
                                        <td style={{ padding: '1rem 1.5rem', textAlign: 'center' }}>
                                            <input 
                                                type="number" 
                                                step="0.25"
                                                min="0"
                                                max="20"
                                                className="form-input"
                                                style={{ width: '100px', textAlign: 'center', fontWeight: '800', fontSize: '1.1rem', borderColor: sg.value !== '' ? 'var(--primary)' : '#e2e8f0', borderRadius: '8px' }}
                                                value={sg.value}
                                                onChange={e => handleGradeChange(sg.studentId, e.target.value)}
                                                placeholder="--"
                                            />
                                        </td>
                                        <td style={{ padding: '1rem 1.5rem' }}>
                                            {sg.value !== '' && (
                                                <div style={{ width: '100%', background: '#f1f5f9', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                                                    <div style={{ 
                                                        width: `${(parseFloat(sg.value) / 20) * 100}%`, 
                                                        height: '100%', 
                                                        background: parseFloat(sg.value) >= 10 ? 'var(--success)' : 'var(--error)',
                                                        transition: 'width 0.3s'
                                                    }} />
                                                </div>
                                            )}
                                        </td>
                                        <td style={{ padding: '1rem 1.5rem', textAlign: 'center' }}>
                                            <a 
                                                href={`${config.API_URL}/grades/bulletin/${sg.studentId}/${selectedTerm}?token=${user.token}`} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="btn"
                                                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 0.8rem', fontSize: '0.75rem', color: 'var(--primary)', border: '1px solid var(--primary)', borderRadius: '6px' }}
                                            >
                                                <ChevronRight size={14} /> Bulletin
                                            </a>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    
                    <div style={{ padding: '1.5rem', textAlign: 'right', background: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
                        <button onClick={handleSave} disabled={saving} className="btn btn-primary" style={{ padding: '0.75rem 2rem' }}>
                            <Save size={20} style={{ marginRight: '0.5rem' }} /> {saving ? 'Enregistrement...' : 'Valider toutes les notes'}
                        </button>
                    </div>
                </section>
            ) : (
                <div style={{ textAlign: 'center', padding: '5rem 2rem', background: 'white', borderRadius: '20px', border: '1px dashed #e2e8f0' }}>
                    <div style={{ background: '#f1f5f9', width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                        <Search size={32} color="#94a3b8" />
                    </div>
                    <h3 style={{ color: 'var(--primary-dark)', margin: '0 0 0.5rem 0' }}>En attente de sélection</h3>
                    <p style={{ color: '#64748b', fontSize: '0.9rem', maxWidth: '300px', margin: '0 auto' }}>
                        Veuillez choisir une classe, une matière et une période pour charger la liste des élèves.
                    </p>
                </div>
            )}
        </div>
    );
};

export default Grades;
