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
        <div style={{ padding: '1rem', maxWidth: '1200px', margin: '0 auto' }}>
            <header className="stack-on-mobile" style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                <div>
                    <h1 style={{ fontSize: '2.2rem', color: 'var(--primary-dark)', fontWeight: '800', margin: 0 }}>Saisie des Notes</h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>Enregistrez les résultats académiques par classe et par matière.</p>
                </div>
            </header>

             {/* Filters Section */}
            <section className="card" style={{ marginBottom: '2rem', padding: '1.5rem', borderRadius: '20px' }}>
                <div className="grid-resp-2" style={{ gap: '1.25rem', alignItems: 'end' }}>
                    <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><UsersIcon size={14} /> Classe</label>
                        <select className="form-input" style={{ height: '48px' }} value={selectedClass} onChange={e => handleClassChange(e.target.value)}>
                            <option value="">Sélectionner une classe...</option>
                            {classes.map(c => <option key={c.id} value={c.id}>{c.name} ({c.level})</option>)}
                        </select>
                    </div>

                    <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><BookOpen size={14} /> Matière</label>
                        <select className="form-input" style={{ height: '48px' }} value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)} disabled={!selectedClass}>
                            <option value="">Sélectionner une matière...</option>
                            {subjects.map(s => <option key={s.id} value={s.id}>{s.name} (Coeff: {s.coefficient})</option>)}
                        </select>
                    </div>

                    <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Clock size={14} /> Période / Trimestre</label>
                        <select className="form-input" style={{ height: '48px' }} value={selectedTerm} onChange={e => setSelectedTerm(e.target.value)}>
                            <option value="">Sélectionner la période...</option>
                            {terms.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                    </div>

                    <button 
                        onClick={fetchGrades}
                        disabled={!selectedClass || !selectedSubject || !selectedTerm || loading}
                        className="btn btn-primary"
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', height: '48px', fontWeight: '700' }}
                    >
                        <Search size={20} /> {loading ? 'Chargement...' : 'Afficher la Liste'}
                    </button>
                </div>
            </section>

            {/* Grades Grid */}
            {studentGrades.length > 0 ? (
                <section className="card fade-in" style={{ padding: 0, borderRadius: '24px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                    <div className="stack-on-mobile" style={{ padding: '1.5rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', gap: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ background: 'var(--primary)', color: 'white', padding: '0.75rem', borderRadius: '14px' }}>
                                <BookOpen size={24} />
                            </div>
                            <div>
                                <h3 style={{ margin: 0, fontWeight: '800', color: 'var(--primary-dark)', fontSize: '1.25rem' }}>
                                    {subjects.find(s => s.id === selectedSubject)?.name}
                                </h3>
                                <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b', fontWeight: '600' }}>{studentGrades.length} élèves à évaluer</p>
                            </div>
                        </div>
                        <button 
                            onClick={handleSave} 
                            disabled={saving}
                            className="btn btn-primary" 
                            style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1.5rem', borderRadius: '12px', width: 'auto', minWidth: '180px', justifyContent: 'center', fontWeight: '800' }}
                        >
                            <Save size={20} /> {saving ? 'Enregistrement...' : 'Enregistrer Notes'}
                        </button>
                    </div>

                    <div className="table-container">
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ background: '#ffffff', borderBottom: '2px solid #f1f5f9' }}>
                                    <th style={{ padding: '1.25rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Matricule</th>
                                    <th style={{ padding: '1.25rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Nom & Prénoms</th>
                                    <th style={{ padding: '1.25rem 1.5rem', textAlign: 'center', fontSize: '0.75rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', width: '180px' }}>Note (/20)</th>
                                    <th className="desktop-only" style={{ padding: '1.25rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Niveau</th>
                                    <th style={{ padding: '1.25rem 1.5rem', textAlign: 'center', fontSize: '0.75rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {studentGrades.map((sg) => (
                                    <tr key={sg.studentId} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.2s' }}>
                                        <td style={{ padding: '1.25rem 1.5rem', color: '#94a3b8', fontSize: '0.85rem', fontWeight: '700' }}>#{sg.regNumber}</td>
                                        <td style={{ padding: '1.25rem 1.5rem' }}>
                                            <div style={{ fontWeight: '800', color: 'var(--primary-dark)', fontSize: '1rem' }}>{sg.studentName}</div>
                                        </td>
                                        <td style={{ padding: '1.25rem 1.5rem', textAlign: 'center' }}>
                                            <input 
                                                type="number" 
                                                step="0.25"
                                                min="0"
                                                max="20"
                                                className="form-input"
                                                style={{ 
                                                    width: '90px', 
                                                    height: '48px',
                                                    textAlign: 'center', 
                                                    fontWeight: '900', 
                                                    fontSize: '1.25rem', 
                                                    color: sg.value !== '' ? 'var(--primary)' : 'inherit',
                                                    borderColor: sg.value !== '' ? 'var(--primary)' : '#e2e8f0', 
                                                    borderRadius: '12px',
                                                    margin: '0 auto',
                                                    backgroundColor: sg.value !== '' ? 'rgba(var(--primary-rgb), 0.02)' : 'white'
                                                }}
                                                value={sg.value}
                                                onChange={e => handleGradeChange(sg.studentId, e.target.value)}
                                                placeholder="--"
                                            />
                                        </td>
                                        <td className="desktop-only" style={{ padding: '1.25rem 1.5rem' }}>
                                            {sg.value !== '' && (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                    <div style={{ flex: 1, background: '#f1f5f9', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                                                        <div style={{ 
                                                            width: `${(parseFloat(sg.value) / 20) * 100}%`, 
                                                            height: '100%', 
                                                            background: parseFloat(sg.value) >= 10 ? '#22c55e' : '#ef4444',
                                                            transition: 'width 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
                                                        }} />
                                                    </div>
                                                    <span style={{ fontSize: '0.75rem', fontWeight: '800', color: parseFloat(sg.value) >= 10 ? '#166534' : '#991b1b' }}>
                                                        {parseFloat(sg.value) >= 10 ? 'Admis' : 'Échec'}
                                                    </span>
                                                </div>
                                            )}
                                        </td>
                                        <td style={{ padding: '1.25rem 1.5rem', textAlign: 'center' }}>
                                            <a 
                                                href={`${config.API_URL}/grades/bulletin/${sg.studentId}/${selectedTerm}?token=${user.token}`} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="btn"
                                                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.6rem 1rem', fontSize: '0.7rem', fontWeight: '900', background: '#f8fafc', color: 'var(--primary)', border: '1px solid #e2e8f0', borderRadius: '10px' }}
                                            >
                                                Bulletin <ChevronRight size={14} />
                                            </a>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    
                    <div style={{ padding: '2rem', textAlign: 'right', background: '#f8fafc', borderTop: '2px solid #f1f5f9' }}>
                        <button 
                            onClick={handleSave} 
                            disabled={saving} 
                            className="btn btn-primary" 
                            style={{ padding: '1rem 3rem', borderRadius: '16px', fontWeight: '900', fontSize: '1.1rem', boxShadow: '0 10px 15px -3px rgba(var(--primary-rgb), 0.3)' }}
                        >
                            <Save size={24} style={{ marginRight: '0.75rem' }} /> {saving ? 'Enregistrement...' : 'Valider la Saisie'}
                        </button>
                    </div>
                </section>
            ) : (
                <div style={{ textAlign: 'center', padding: '6rem 2rem', background: 'white', borderRadius: '32px', border: '2px dashed #f1f5f9' }}>
                    <div className="fade-in" style={{ background: '#f8fafc', width: '100px', height: '100px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 2rem', border: '1px solid #f1f5f9' }}>
                        <Search size={40} style={{ color: '#cbd5e1' }} />
                    </div>
                    <h3 style={{ color: 'var(--primary-dark)', margin: '0 0 0.75rem 0', fontWeight: '800', fontSize: '1.5rem' }}>Prêt à Saisir les Notes ?</h3>
                    <p style={{ color: '#94a3b8', fontSize: '1rem', maxWidth: '380px', margin: '0 auto', lineHeight: 1.6, fontWeight: '500' }}>
                        Utilisez les filtres en haut pour sélectionner une classe et une période. La liste des élèves s'affichera ici.
                    </p>
                </div>
            )}
        </div>
    );
};

export default Grades;
