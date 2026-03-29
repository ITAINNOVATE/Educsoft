import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import config from '../config';
import {
    UserPlus,
    Search,
    Filter,
    User,
    Phone,
    MapPin,
    GraduationCap,
    ArrowLeft,
    Edit,
    FileText,
    Upload,
    Download,
    CheckCircle,
    Camera,
    CreditCard
} from 'lucide-react';

const Students = () => {
    const [students, setStudents] = useState([]);
    const [view, setView] = useState('LIST'); // LIST, REGISTER, DETAILS
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [activeTab, setActiveTab] = useState('BIO'); // BIO, PARENTS, HISTORY, DOCUMENTS, FINANCE
    const [classes, setClasses] = useState([]);
    const [schoolYears, setSchoolYears] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterClass, setFilterClass] = useState('');
    const [filterStatus, setFilterStatus] = useState('ACTIF');
    const [uploading, setUploading] = useState(false);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({ total: 0, pages: 0 });
    const [hasMore, setHasMore] = useState(false);

    const [formData, setFormData] = useState({
        studentData: {
            firstName: '', lastName: '', dob: '', pob: '', gender: 'M', address: '',
            nationality: 'Béninoise', birthCertNumber: '', bloodGroup: '',
            medicalInfo: '', handicap: '', adminObservations: '', internalNotes: ''
        },
        parents: [
            { firstName: '', lastName: '', phonePrimary: '', phoneSecondary: '', email: '', occupation: '', address: '', relation: 'PERE', isPrimary: true, isEmergency: true }
        ],
        enrollmentData: {
            classId: '', schoolYearId: ''
        },
        historyData: []
    });

    const { user } = useAuth();
    const API_BASE = config.API_URL;

    useEffect(() => {
        if (user?.token) {
            fetchData(1, true); // Reset to first page
            fetchConfig();
        }
    }, [user, filterClass, filterStatus]); // Reload on filter change

    // Debounced search
    useEffect(() => {
        const handler = setTimeout(() => {
            if (user?.token) fetchData(1, true);
        }, 500);
        return () => clearTimeout(handler);
    }, [searchTerm]);

    const fetchData = async (pageNum = 1, reset = false) => {
        try {
            if (reset) setLoading(true);
            const authHeader = { headers: { Authorization: `Bearer ${user.token}` } };
            
            const res = await axios.get(`${API_BASE}/students`, {
                ...authHeader,
                params: {
                    page: pageNum,
                    limit: 50,
                    search: searchTerm,
                    classId: filterClass,
                    status: filterStatus
                }
            });
            
            const newStudents = res.data.students;
            if (reset) {
                setStudents(newStudents);
            } else {
                setStudents(prev => [...prev, ...newStudents]);
            }

            setPagination(res.data.pagination);
            setPage(pageNum);
            setHasMore(pageNum < res.data.pagination.pages);

            if (selectedStudent) {
                const refreshed = await axios.get(`${API_BASE}/students/${selectedStudent.id}`, authHeader);
                setSelectedStudent(refreshed.data);
            }
        } catch (error) {
            console.error('Error fetching students:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleLoadMore = () => {
        if (!loading && hasMore) {
            fetchData(page + 1);
        }
    };

    const fetchConfig = async () => {
        try {
            const authHeader = { headers: { Authorization: `Bearer ${user.token}` } };
            const [yearsRes, classesRes] = await Promise.all([
                axios.get(`${API_BASE}/config/school-years`, authHeader),
                axios.get(`${API_BASE}/config/classes`, authHeader),
            ]);
            setSchoolYears(yearsRes.data);
            setClasses(classesRes.data);

            const currentYear = yearsRes.data.find(y => y.current);
            if (currentYear) {
                setFormData(prev => ({
                    ...prev,
                    enrollmentData: { ...prev.enrollmentData, schoolYearId: currentYear.id }
                }));
            }
        } catch (error) {
            console.error('Error fetching config:', error);
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();

        // Basic Validation
        if (!formData.studentData.firstName || !formData.studentData.lastName || !formData.enrollmentData.classId) {
            alert("Veuillez remplir les champs obligatoires (Nom, Prénoms, Classe).");
            return;
        }

        setUploading(true);
        try {
            // Prepare payload
            const payload = {
                studentData: formData.studentData,
                enrollmentData: {
                    classId: formData.enrollmentData.classId,
                    schoolYearId: formData.enrollmentData.schoolYearId
                },
                parents: formData.parents.filter(p => p.firstName && p.lastName)
            };

            await axios.post(`${API_BASE}/students/register`, payload, {
                headers: { Authorization: `Bearer ${user.token}` }
            });

            alert('Élève inscrit avec succès !');
            setView('LIST');
            fetchData();

            // Reset crucial form parts but keep context like school year
            setFormData(prev => ({
                ...prev,
                studentData: {
                    firstName: '', lastName: '', dob: '', pob: '', gender: 'M', address: '',
                    nationality: 'Béninoise', birthCertNumber: '', bloodGroup: '',
                    medicalInfo: '', handicap: '', adminObservations: '', internalNotes: ''
                },
                parents: [
                    { firstName: '', lastName: '', phonePrimary: '', phoneSecondary: '', email: '', occupation: '', address: '', relation: 'PERE', isPrimary: true, isEmergency: true }
                ]
            }));

        } catch (error) {
            console.error('Registration error:', error);
            alert(`Erreur lors de l'inscription: ${error.response?.data?.message || error.message}`);
        } finally {
            setUploading(false);
        }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            await axios.put(`${API_BASE}/students/${selectedStudent.id}`, {
                studentData: {
                    firstName: selectedStudent.firstName,
                    lastName: selectedStudent.lastName,
                    dob: selectedStudent.dob,
                    pob: selectedStudent.pob,
                    gender: selectedStudent.gender,
                    address: selectedStudent.address,
                    nationality: selectedStudent.nationality,
                    bloodGroup: selectedStudent.bloodGroup,
                    medicalInfo: selectedStudent.medicalInfo,
                    handicap: selectedStudent.handicap,
                    status: selectedStudent.status
                },
                parents: selectedStudent.parents.map(ps => ({
                    parentId: ps.parent.id,
                    firstName: ps.parent.firstName,
                    lastName: ps.parent.lastName,
                    phonePrimary: ps.parent.phonePrimary,
                    email: ps.parent.email,
                    relation: ps.relation,
                    isPrimary: ps.isPrimary,
                    isEmergency: ps.isEmergency
                }))
            }, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            alert('Mise à jour réussie');
            fetchData();
        } catch (error) {
            alert('Erreur lors de la mise à jour');
        }
    };

    const handleDownloadDossier = async () => {
        try {
            const response = await axios.get(`${API_BASE}/students/${selectedStudent.id}/pdf`, {
                headers: { Authorization: `Bearer ${user.token}` },
                responseType: 'blob' // Important for PDF download
            });

            // Create blob link to download
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Dossier_${selectedStudent.regNumber || 'Eleve'}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error('Error downloading dossier:', error);
            alert('Erreur lors du téléchargement du dossier.');
        }
    };

    
    
    const handlePhotoUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        const formData = new FormData();
        formData.append('photo', file);
        
        try {
            setUploading(true);
            await axios.post(`${API_BASE}/students/${selectedStudent.id}/photo`, formData, {
                headers: { 
                    Authorization: `Bearer ${user.token}`,
                    'Content-Type': 'multipart/form-data' 
                }
            });
            alert('Photo mise à jour !');
            openDetails(selectedStudent); // Refresh details
        } catch (error) {
            console.error('Error uploading photo:', error);
            alert('Erreur lors de l\'upload de la photo.');
        } finally {
            setUploading(false);
        }
    };

    const handleDownloadCard = async () => {
        try {
            const response = await axios.get(`${API_BASE}/students/${selectedStudent.id}/card`, {
                headers: { Authorization: `Bearer ${user.token}` },
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Carte_${selectedStudent.regNumber}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            alert('Erreur lors du téléchargement de la carte.');
        }
    };

    // Frontend filtering removed as it is now handled by the backend
    const displayedStudents = students;

    const openDetails = async (student) => {
        try {
            const res = await axios.get(`${API_BASE}/students/${student.id}`, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            setSelectedStudent(res.data);
            setView('DETAILS');
            setActiveTab('BIO');
        } catch (error) {
            console.error('Error fetching student details');
        }
    };

    const handleExportExcel = async () => {
        try {
            const params = new URLSearchParams({
                classId: filterClass,
                status: filterStatus,
                search: searchTerm
            });
            
            const response = await axios.get(`${API_BASE}/students/export?${params.toString()}`, {
                headers: { Authorization: `Bearer ${user.token}` },
                responseType: 'blob'
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Liste_Eleves_${new Date().toISOString().split('T')[0]}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error('Error exporting Excel:', error);
            alert('Erreur lors de l\'exportation Excel.');
        }
    };

    return (
        <div style={{ padding: '1rem', maxWidth: '1200px', margin: '0 auto' }}>
            <header className="stack-on-mobile" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem', gap: '1.5rem', background: 'white', padding: '1.5rem', borderRadius: '20px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
                <div>
                    <h1 style={{ fontSize: '2rem', color: 'var(--primary-dark)', margin: 0, fontWeight: '800' }}>
                        {view === 'DETAILS' ? 'Dossier Élève' : 'Gestion des Élèves'}
                    </h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginTop: '0.25rem' }}>
                        {view === 'DETAILS' ? `${selectedStudent?.firstName} ${selectedStudent?.lastName} • ${selectedStudent?.regNumber}` : 'Base de données centrale des élèves et tuteurs.'}
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    {view === 'LIST' ? (
                        <>
                            <button 
                                className="btn" 
                                onClick={handleExportExcel}
                                style={{ 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    gap: '0.5rem', 
                                    backgroundColor: '#2e7d32', 
                                    color: 'white',
                                    padding: '0.75rem 1.25rem',
                                    borderRadius: '12px',
                                    fontSize: '0.9rem',
                                    fontWeight: '700'
                                }}
                            >
                                <Download size={18} /> <span className="hide-mobile">Exporter Excel</span><span className="show-mobile">Export</span>
                            </button>
                            {user && (user.role === 'ADMIN' || user.role === 'SECRETARY' || user.role === 'SUPER_ADMIN') && (
                                <button 
                                    className="btn btn-primary" 
                                    onClick={() => setView('REGISTER')} 
                                    style={{ 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        gap: '0.5rem',
                                        padding: '0.75rem 1.25rem',
                                        borderRadius: '12px',
                                        fontSize: '0.9rem',
                                        fontWeight: '700'
                                    }}
                                >
                                    <UserPlus size={20} /> <span className="hide-mobile">Inscrire un Élève</span><span className="show-mobile">Inscrire</span>
                                </button>
                            )}
                        </>
                    ) : (
                        <button className="btn" onClick={() => setView('LIST')} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1.5rem', borderRadius: '12px', fontWeight: '700' }}>
                            <ArrowLeft size={20} /> Retour à la liste
                        </button>
                    )}
                </div>
            </header>

            {view === 'LIST' && (
                <>
                    <div className="card" style={{ marginBottom: '2rem', padding: '1rem' }}>
                        <div className="stack-on-mobile" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                            <div style={{ position: 'relative', flex: 2, width: '100%' }}>
                                <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#999' }} size={18} />
                                <input 
                                    type="text" 
                                    placeholder="Rechercher par nom, matricule..." 
                                    className="form-input" 
                                    style={{ paddingLeft: '40px' }}
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', flex: 1, width: '100%' }}>
                                <select className="form-input" value={filterClass} onChange={e => setFilterClass(e.target.value)}>
                                    <option value="">Toutes les classes</option>
                                    {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                                <select className="form-input" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                                    <option value="ACTIF">ACTIF</option>
                                    <option value="SUSPENDU">SUSPENDU</option>
                                    <option value="ARCHIVE">ARCHIVE</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="card" style={{ padding: '0' }}>
                        <div className="table-container">
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ textAlign: 'left', borderBottom: '2px solid #eee', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                        <th style={{ padding: '1rem' }}>Matricule</th>
                                        <th style={{ padding: '1rem' }}>Élève</th>
                                        <th style={{ padding: '1rem' }}>Classe</th>
                                        <th style={{ padding: '1rem' }}>Sexe</th>
                                        <th style={{ padding: '1rem' }}>Statut</th>
                                        <th style={{ padding: '1rem' }}>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {displayedStudents.map(student => (
                                        <tr key={student.id} style={{ borderBottom: '1px solid #f5f5f5', transition: 'background 0.2s' }}>
                                            <td style={{ padding: '1rem', fontWeight: 'bold', color: 'var(--primary)', whiteSpace: 'nowrap' }}>{student.regNumber}</td>
                                            <td style={{ padding: '1rem' }}>
                                                <div style={{ fontWeight: '600' }}>{student.lastName}</div>
                                                <div style={{ fontSize: '0.8rem', color: '#666' }}>{student.firstName}</div>
                                            </td>
                                            <td style={{ padding: '1rem', whiteSpace: 'nowrap' }}>{student.enrollments[0]?.class?.name || '---'}</td>
                                            <td style={{ padding: '1rem' }}>{student.gender}</td>
                                            <td style={{ padding: '1rem' }}>
                                                <span style={{ 
                                                    padding: '4px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 'bold',
                                                    backgroundColor: student.status === 'ACTIF' ? '#e8f5e9' : '#ffebee',
                                                    color: student.status === 'ACTIF' ? '#2e7d32' : '#c62828'
                                                }}>{student.status}</span>
                                            </td>
                                            <td style={{ padding: '1rem' }}>
                                                <button className="btn btn-outline" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} onClick={() => openDetails(student)}>
                                                    Détails
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {displayedStudents.length === 0 && !loading && (
                                        <tr><td colSpan="6" style={{ textAlign: 'center', padding: '3rem', color: '#999' }}>Aucun élève trouvé.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                        
                        {hasMore && (
                            <div style={{ textAlign: 'center', padding: '2rem', borderTop: '1px solid #eee' }}>
                                <button 
                                    className="btn" 
                                    onClick={handleLoadMore} 
                                    disabled={loading}
                                    style={{ 
                                        padding: '0.75rem 2rem', 
                                        backgroundColor: '#f1f5f9', 
                                        color: 'var(--primary)',
                                        fontWeight: '700',
                                        border: '1px solid #e2e8f0'
                                    }}
                                >
                                    {loading ? 'Chargement...' : 'Charger plus d\'élèves'}
                                </button>
                            </div>
                        )}
                        
                        {!hasMore && displayedStudents.length > 0 && (
                            <div style={{ textAlign: 'center', padding: '1.5rem', color: '#999', fontSize: '0.85rem' }}>
                                Fin de la liste ({displayedStudents.length} élèves affichés)
                            </div>
                        )}
                    </div>
                </>
            )}

            {view === 'REGISTER' && (
                <div className="card" style={{ border: '1px solid var(--primary-light)' }}>
                    <h2 style={{ marginBottom: '2rem', color: 'var(--primary)', borderBottom: '2px solid #f0f0f0', paddingBottom: '0.5rem' }}>Nouvelle Fiche d'Inscription</h2>
                    <form onSubmit={handleRegister}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '3rem' }}>
                            {/* ÉLÈVE SECTION */}
                            <section>
                                <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', color: 'var(--text-main)', fontSize: '1.1rem' }}>
                                    <User size={18} /> Identité de l'Élève
                                </h3>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div className="form-group">
                                        <label className="form-label">Nom</label>
                                        <input type="text" className="form-input" value={formData.studentData.lastName} onChange={e => setFormData({ ...formData, studentData: { ...formData.studentData, lastName: e.target.value.toUpperCase() } })} required />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Prénoms</label>
                                        <input type="text" className="form-input" value={formData.studentData.firstName} onChange={e => setFormData({ ...formData, studentData: { ...formData.studentData, firstName: e.target.value } })} required />
                                    </div>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div className="form-group">
                                        <label className="form-label">Date de Naissance</label>
                                        <input type="date" className="form-input" value={formData.studentData.dob} onChange={e => setFormData({ ...formData, studentData: { ...formData.studentData, dob: e.target.value } })} required />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Sexe</label>
                                        <select className="form-input" value={formData.studentData.gender} onChange={e => setFormData({ ...formData, studentData: { ...formData.studentData, gender: e.target.value } })}>
                                            <option value="M">Masculin</option>
                                            <option value="F">Féminin</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Lieu de Naissance</label>
                                    <input type="text" className="form-input" value={formData.studentData.pob} onChange={e => setFormData({ ...formData, studentData: { ...formData.studentData, pob: e.target.value } })} required />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Adresse Complète</label>
                                    <input type="text" className="form-input" value={formData.studentData.address} onChange={e => setFormData({ ...formData, studentData: { ...formData.studentData, address: e.target.value } })} required />
                                </div>
                            </section>

                            {/* PARENT SECTION */}
                            <section>
                                <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', color: 'var(--text-main)', fontSize: '1.1rem' }}>
                                    <Phone size={18} /> Responsable Légal (Principal)
                                </h3>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div className="form-group">
                                        <label className="form-label">Nom du Parent</label>
                                        <input type="text" className="form-input" value={formData.parents[0].lastName} onChange={e => {
                                            const newParents = [...formData.parents];
                                            newParents[0].lastName = e.target.value.toUpperCase();
                                            setFormData({ ...formData, parents: newParents });
                                        }} required />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Prénom du Parent</label>
                                        <input type="text" className="form-input" value={formData.parents[0].firstName} onChange={e => {
                                            const newParents = [...formData.parents];
                                            newParents[0].firstName = e.target.value;
                                            setFormData({ ...formData, parents: newParents });
                                        }} required />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Téléphone Principal</label>
                                    <input type="tel" className="form-input" value={formData.parents[0].phonePrimary} onChange={e => {
                                        const newParents = [...formData.parents];
                                        newParents[0].phonePrimary = e.target.value;
                                        setFormData({ ...formData, parents: newParents });
                                    }} required />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Lien avec l'élève</label>
                                    <select className="form-input" value={formData.parents[0].relation} onChange={e => {
                                        const newParents = [...formData.parents];
                                        newParents[0].relation = e.target.value;
                                        setFormData({ ...formData, parents: newParents });
                                    }}>
                                        <option value="PERE">Père</option>
                                        <option value="MERE">Mère</option>
                                        <option value="TUTEUR">Tuteur / Tutrice</option>
                                    </select>
                                </div>
                            </section>

                            {/* SCOLARITÉ SECTION */}
                            <section>
                                <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', color: 'var(--text-main)', fontSize: '1.1rem' }}>
                                    <GraduationCap size={18} /> Scolarité
                                </h3>
                                <div className="form-group">
                                    <label className="form-label">Classe d'Affectation</label>
                                    <select className="form-input" value={formData.enrollmentData.classId} onChange={e => setFormData({ ...formData, enrollmentData: { ...formData.enrollmentData, classId: e.target.value } })} required>
                                        <option value="">Sélectionner une classe</option>
                                        {classes.map(c => <option key={c.id} value={c.id}>{c.name} ({c.level})</option>)}
                                    </select>
                                </div>
                            </section>
                        </div>

                        <div style={{ marginTop: '3rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                            <button type="button" className="btn" onClick={() => setView('LIST')}>Annuler</button>
                            <button type="submit" className="btn btn-primary" style={{ padding: '1rem 2.5rem' }}>Valider l'Inscription</button>
                        </div>
                    </form>
                </div>
            )}

            {view === 'DETAILS' && selectedStudent && (
                <div id="student-details-grid" style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '2rem' }}>
                    <style>{`
                        @media (max-width: 900px) {
                            #student-details-grid { grid-template-columns: 1fr !important; }
                        }
                    `}</style>
                    <aside>
                        <div className="card" style={{ textAlign: 'center', position: 'sticky', top: '2rem' }}>
                            <div style={{ position: 'relative', width: '120px', height: '120px', margin: '0 auto 1.5rem' }}>
                                {selectedStudent.photoUrl ? (
                                    <img 
                                        src={`${API_BASE.replace('/api', '')}${selectedStudent.photoUrl}`} 
                                        alt="Profil" 
                                        style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover', border: '3px solid #e0f2f1' }}
                                    />
                                ) : (
                                    <div style={{ width: '100%', height: '100%', borderRadius: '50%', backgroundColor: '#e0f2f1', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', fontSize: '3rem', fontWeight: '800' }}>
                                        {selectedStudent.firstName[0]}{selectedStudent.lastName[0]}
                                    </div>
                                )}
                                
                                {user && user.role !== 'ACCOUNTANT' && (
                                    <label style={{ position: 'absolute', bottom: '0', right: '0', backgroundColor: 'var(--primary)', color: 'white', padding: '6px', borderRadius: '50%', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Camera size={16} />
                                        <input type="file" style={{ display: 'none' }} onChange={handlePhotoUpload} accept="image/*" />
                                    </label>
                                )}
                            </div>
                            <h2 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>{selectedStudent.lastName} {selectedStudent.firstName}</h2>
                            <span style={{ display: 'inline-block', padding: '0.25rem 0.75rem', borderRadius: '20px', backgroundColor: selectedStudent.status === 'ACTIF' ? '#e8f5e9' : '#ffebee', color: selectedStudent.status === 'ACTIF' ? '#2e7d32' : '#c62828', fontSize: '0.75rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>
                                {selectedStudent.status}
                            </span>

                            <div style={{ textAlign: 'left', borderTop: '1px solid #eee', paddingTop: '1.5rem', fontSize: '0.9rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                                    <GraduationCap size={16} color="var(--primary)" /> <strong>Classe:</strong> {selectedStudent.enrollments[0]?.class?.name || 'Non affecté'}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                                    <MapPin size={16} color="var(--primary)" /> <strong>Adresse:</strong> {selectedStudent.address}
                                </div>
                            </div>

                             <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1.5rem' }}>
                                <button className="btn btn-primary" style={{ width: '100%' }} onClick={handleDownloadDossier}><Download size={16} /> Fiche Élève PDF</button>
                                <button className="btn" style={{ width: '100%', backgroundColor: '#1a237e', color: 'white' }} onClick={handleDownloadCard}><CreditCard size={16} /> Imprimer Carte ID</button>
                            </div>
                        </div>
                    </aside>

                    <main className="card" style={{ padding: '0', overflow: 'hidden' }}>
                        <nav style={{ display: 'flex', borderBottom: '1px solid #eee', backgroundColor: '#fafafa', overflowX: 'auto', whiteSpace: 'nowrap' }} className="table-container">
                            {['BIO', 'CARTE', 'PARENTS', 'HISTORY', 'DOCUMENTS', 'FINANCE'].map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    style={{ 
                                        padding: '1.25rem 1.5rem', border: 'none', background: 'none', cursor: 'pointer', 
                                        borderBottom: activeTab === tab ? '3px solid var(--primary)' : '3px solid transparent', 
                                        color: activeTab === tab ? 'var(--primary)' : 'var(--text-muted)', 
                                        fontWeight: activeTab === tab ? 'bold' : 'normal', transition: 'all 0.2s',
                                        flexShrink: 0
                                    }}
                                >
                                    {tab === 'BIO' && 'Identité'}
                                    {tab === 'CARTE' && 'Carte ID'}
                                    {tab === 'PARENTS' && 'Famille'}
                                    {tab === 'HISTORY' && 'Historique'}
                                    {tab === 'DOCUMENTS' && 'Documents'}
                                    {tab === 'FINANCE' && 'Finance'}
                                </button>
                            ))}
                        </nav>

                        <div style={{ padding: '2rem' }}>
                            {activeTab === 'FINANCE' && selectedStudent.financials && (
                                <div>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2.5rem' }}>
                                        <div style={{ padding: '1.25rem', border: '1px solid #e8f5e9', borderRadius: '12px', background: '#f1f8e9' }}>
                                            <div style={{ color: '#2e7d32', fontSize: '0.75rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>OBLIGATOIRES</div>
                                            <div style={{ fontSize: '1.1rem', fontWeight: '800' }}>{selectedStudent.financials.OBLIGATORY.remaining.toLocaleString()} FCFA</div>
                                            <div style={{ fontSize: '0.7rem', color: '#689f38' }}>sur {selectedStudent.financials.OBLIGATORY.totalDue.toLocaleString()}</div>
                                        </div>
                                        <div style={{ padding: '1.25rem', border: '1px solid #fff3e0', borderRadius: '12px', background: '#fff8e1' }}>
                                            <div style={{ color: '#ef6c00', fontSize: '0.75rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>OPTIONNELS</div>
                                            <div style={{ fontSize: '1.1rem', fontWeight: '800' }}>{selectedStudent.financials.OPTIONAL.remaining.toLocaleString()} FCFA</div>
                                            <div style={{ fontSize: '0.7rem', color: '#f57c00' }}>sur {selectedStudent.financials.OPTIONAL.totalDue.toLocaleString()}</div>
                                        </div>
                                        <div style={{ padding: '1.25rem', border: '1px solid #f5f5f5', borderRadius: '12px', background: '#fafafa' }}>
                                            <div style={{ color: '#616161', fontSize: '0.75rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>OCCASIONNELS</div>
                                            <div style={{ fontSize: '1.1rem', fontWeight: '800' }}>{selectedStudent.financials.OCCASIONAL.remaining.toLocaleString()} FCFA</div>
                                            <div style={{ fontSize: '0.7rem', color: '#757575' }}>sur {selectedStudent.financials.OCCASIONAL.totalDue.toLocaleString()}</div>
                                        </div>
                                        <div style={{ padding: '1.25rem', border: '1px solid #ffebee', borderRadius: '12px', background: '#fff5f5' }}>
                                            <div style={{ color: '#c62828', fontSize: '0.75rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>TOTAL DU</div>
                                            <div style={{ fontSize: '1.1rem', fontWeight: '800' }}>{selectedStudent.financials.global.remaining.toLocaleString()} FCFA</div>
                                            <div style={{ fontSize: '0.7rem', color: '#d32f2f' }}>Payé: {selectedStudent.financials.global.totalPaid.toLocaleString()}</div>
                                        </div>
                                    </div>

                                    {/* DETAILED BREAKDOWNS */}
                                    <div style={{ backgroundColor: '#fcfcfc', border: '1px solid #eee', borderRadius: '12px', padding: '1.5rem', marginBottom: '2.5rem' }}>
                                        <h4 style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--primary-dark)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <FileText size={18} /> Détails de la Scolarité et des Frais
                                        </h4>

                                        {[
                                            { data: selectedStudent.financials.OBLIGATORY, title: 'FRAIS OBLIGATOIRES', color: '#2e7d32' },
                                            { data: selectedStudent.financials.OPTIONAL, title: 'FRAIS OPTIONNELS', color: '#ef6c00' },
                                            { data: selectedStudent.financials.OCCASIONAL, title: 'FRAIS OCCASIONNELS', color: '#616161' }
                                        ].map((cat, i) => (
                                            cat.data.details && cat.data.details.length > 0 && (
                                                <div key={i} style={{ marginBottom: '2rem' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: `2px solid ${cat.color}22`, paddingBottom: '0.4rem' }}>
                                                        <span style={{ fontSize: '0.85rem', fontWeight: '800', color: cat.color }}>{cat.title}</span>
                                                        <span style={{ fontSize: '0.75rem', fontWeight: '600', color: cat.data.remaining > 0 ? 'var(--error)' : 'var(--success)' }}>
                                                            {cat.data.remaining === 0 ? '✓ Soldé' : `Reste: ${cat.data.remaining.toLocaleString()} FCFA`}
                                                        </span>
                                                    </div>
                                                    <div style={{ overflowX: 'auto' }}>
                                                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                                                            <thead>
                                                                <tr style={{ textAlign: 'left', color: '#777', borderBottom: '1px solid #eee' }}>
                                                                    <th style={{ padding: '0.5rem' }}>Libellé</th>
                                                                    <th style={{ padding: '0.5rem', textAlign: 'right' }}>Montant Dû</th>
                                                                    <th style={{ padding: '0.5rem', textAlign: 'right' }}>Payé</th>
                                                                    <th style={{ padding: '0.5rem', textAlign: 'right' }}>Solde</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {cat.data.details.map(f => (
                                                                    <tr key={f.id} style={{ borderBottom: '1px solid #f5f5f5' }}>
                                                                        <td style={{ padding: '0.6rem 0.5rem', fontWeight: '600' }}>{f.name}</td>
                                                                        <td style={{ padding: '0.6rem 0.5rem', textAlign: 'right' }}>{f.amount.toLocaleString()}</td>
                                                                        <td style={{ padding: '0.6rem 0.5rem', textAlign: 'right', color: 'var(--success)', fontWeight: '600' }}>{f.paid.toLocaleString()}</td>
                                                                        <td style={{ padding: '0.6rem 0.5rem', textAlign: 'right', fontWeight: '800', color: f.remaining > 0 ? 'var(--error)' : 'var(--success)' }}>
                                                                            {f.remaining.toLocaleString()}
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            )
                                        ))}
                                    </div>

                                    <h4 style={{ fontSize: '1rem', marginBottom: '1.5rem', fontWeight: '700' }}>Historique des Paiements</h4>
                                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                        <thead>
                                            <tr style={{ textAlign: 'left', borderBottom: '2px solid #eee', fontSize: '0.85rem', color: '#666' }}>
                                                <th style={{ padding: '0.75rem' }}>Date</th>
                                                <th style={{ padding: '0.75rem' }}>Référence</th>
                                                <th style={{ padding: '0.75rem' }}>Frais</th>
                                                <th style={{ padding: '0.75rem' }}>Montant</th>
                                                <th style={{ padding: '0.75rem' }}>Méthode</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {selectedStudent.payments?.sort((a, b) => new Date(b.paymentDate) - new Date(a.paymentDate)).map(p => (
                                                <tr key={p.id} style={{ borderBottom: '1px solid #f9f9f9' }}>
                                                    <td style={{ padding: '0.75rem' }}>{new Date(p.paymentDate).toLocaleDateString()}</td>
                                                    <td style={{ padding: '0.75rem', fontSize: '0.75rem', fontFamily: 'monospace' }}>{p.receiptNumber}</td>
                                                    <td style={{ padding: '0.75rem' }}>{p.feeName || 'Divers'}</td>
                                                    <td style={{ padding: '0.75rem', fontWeight: 'bold' }}>{p.amount.toLocaleString()} FCFA</td>
                                                    <td style={{ padding: '0.75rem', fontSize: '0.75rem' }}>{p.method}</td>
                                                </tr>
                                            ))}
                                            {selectedStudent.payments?.length === 0 && (
                                                <tr><td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: '#999' }}>Aucun paiement enregistré.</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                            {activeTab === 'BIO' && (
                                <form onSubmit={handleUpdate}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                        <div className="form-group">
                                            <label className="form-label">Prénom(s)</label>
                                            <input type="text" className="form-input" value={selectedStudent.firstName} onChange={e => setSelectedStudent({ ...selectedStudent, firstName: e.target.value })} disabled={user?.role === 'ACCOUNTANT'} />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Nom</label>
                                            <input type="text" className="form-input" value={selectedStudent.lastName} onChange={e => setSelectedStudent({ ...selectedStudent, lastName: e.target.value.toUpperCase() })} disabled={user?.role === 'ACCOUNTANT'} />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Date de Naissance</label>
                                            <input type="date" className="form-input" value={selectedStudent.dob.split('T')[0]} onChange={e => setSelectedStudent({ ...selectedStudent, dob: e.target.value })} disabled={user?.role === 'ACCOUNTANT'} />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Nationalité</label>
                                            <input type="text" className="form-input" value={selectedStudent.nationality || ''} onChange={e => setSelectedStudent({ ...selectedStudent, nationality: e.target.value })} disabled={user?.role === 'ACCOUNTANT'} />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Acte de Naissance N°</label>
                                            <input type="text" className="form-input" value={selectedStudent.birthCertNumber || ''} onChange={e => setSelectedStudent({ ...selectedStudent, birthCertNumber: e.target.value })} disabled={user?.role === 'ACCOUNTANT'} />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Sexe</label>
                                            <select className="form-input" value={selectedStudent.gender} onChange={e => setSelectedStudent({ ...selectedStudent, gender: e.target.value })} disabled={user?.role === 'ACCOUNTANT'}>
                                                <option value="M">Masculin</option>
                                                <option value="F">Féminin</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="form-group" style={{ marginTop: '1rem' }}>
                                        <label className="form-label">Statut</label>
                                        <select className="form-input" value={selectedStudent.status} onChange={e => setSelectedStudent({ ...selectedStudent, status: e.target.value })} disabled={user?.role === 'ACCOUNTANT'}>
                                            <option value="ACTIF">ACTIF</option>
                                            <option value="SUSPENDU">SUSPENDU</option>
                                            <option value="TRANSFERE">TRANSFERE</option>
                                            <option value="ABANDON">ABANDON</option>
                                            <option value="DIPLOME">DIPLOME</option>
                                            <option value="ARCHIVE">ARCHIVE</option>
                                        </select>
                                    </div>
                                    {user && user.role !== 'ACCOUNTANT' && (
                                        <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
                                            <button type="submit" className="btn btn-primary">Enregistrer les changements</button>
                                        </div>
                                    )}
                                </form>
                            )}

                            {activeTab === 'CARTE' && (
                                <div style={{ textAlign: 'center', padding: '2rem' }}>
                                    <h4 style={{ marginBottom: '2rem' }}>Aperçu des Informations de la Carte</h4>
                                    <div style={{ 
                                        width: '400px', 
                                        height: '250px', 
                                        margin: '0 auto', 
                                        border: '2px solid #1a237e', 
                                        borderRadius: '15px', 
                                        position: 'relative', 
                                        overflow: 'hidden',
                                        textAlign: 'left',
                                        backgroundColor: 'white',
                                        boxShadow: '0 10px 20px rgba(0,0,0,0.1)'
                                    }}>
                                        {/* Header */}
                                        <div style={{ backgroundColor: '#1a237e', color: 'white', padding: '10px', textAlign: 'center' }}>
                                            <div style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>{user?.establishmentName?.toUpperCase() || 'ÉTABLISSEMENT'}</div>
                                            <div style={{ fontSize: '0.6rem' }}>Année Scolaire: {selectedStudent.enrollments[0]?.schoolYear?.name || '---'}</div>
                                        </div>

                                        <div style={{ padding: '15px', display: 'flex', gap: '15px' }}>
                                            {/* Photo */}
                                            <div style={{ width: '100px', height: '120px', border: '1px solid #ddd', overflow: 'hidden' }}>
                                                {selectedStudent.photoUrl ? (
                                                    <img src={`${API_BASE.replace('/api', '')}${selectedStudent.photoUrl}`} alt="Eleve" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                ) : (
                                                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ccc' }}>PHOTO</div>
                                                )}
                                            </div>

                                            {/* Info */}
                                            <div style={{ flex: 1, fontSize: '0.75rem' }}>
                                                <div style={{ marginBottom: '5px' }}><strong>MATRICULE:</strong> {selectedStudent.regNumber}</div>
                                                <div style={{ marginBottom: '5px' }}><strong>NOM:</strong> {selectedStudent.lastName}</div>
                                                <div style={{ marginBottom: '5px' }}><strong>PRÉNOM:</strong> {selectedStudent.firstName}</div>
                                                <div style={{ marginBottom: '5px' }}><strong>NÉ(E) LE:</strong> {new Date(selectedStudent.dob).toLocaleDateString()}</div>
                                                <div style={{ marginBottom: '5px' }}><strong>À:</strong> {selectedStudent.pob}</div>
                                                <div style={{ marginBottom: '5px', color: '#d32f2f' }}><strong>CLASSE:</strong> {selectedStudent.enrollments[0]?.class?.name || '---'}</div>
                                            </div>
                                        </div>

                                        {/* Bottom bar */}
                                        <div style={{ position: 'absolute', bottom: '0', width: '100%', backgroundColor: '#1a237e', color: 'white', fontSize: '0.5rem', textAlign: 'center', padding: '4px' }}>
                                            EDUSOFT - EXCELLENCE & DISCIPLINE
                                        </div>
                                    </div>
                                    <button className="btn btn-primary" style={{ marginTop: '2rem' }} onClick={handleDownloadCard}>
                                        Télécharger le PDF de la Carte (Prêt à imprimer)
                                    </button>
                                </div>
                            )}

                            {activeTab === 'PARENTS' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                    {selectedStudent.parents.map((ps, idx) => (
                                        <div key={idx} className="card" style={{ backgroundColor: '#fdfdfd', border: '1px solid #efefef' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                                <h4 style={{ color: 'var(--primary)', fontWeight: 'bold' }}>{ps.relation} {ps.isPrimary ? '(Principal)' : ''}</h4>
                                                {ps.isEmergency && <span style={{ fontSize: '0.7rem', backgroundColor: '#ffebee', color: '#c62828', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>URGENCE</span>}
                                            </div>
                                            <p><strong>Nom:</strong> {ps.parent.lastName} {ps.parent.firstName}</p>
                                            <p><strong>Téléphone:</strong> {ps.parent.phonePrimary}</p>
                                            <p><strong>Email:</strong> {ps.parent.email || '---'}</p>
                                            <p><strong>Profession:</strong> {ps.parent.occupation || '---'}</p>
                                        </div>
                                    ))}
                                    {user && user.role !== 'ACCOUNTANT' && (
                                        <button className="btn" style={{ border: '1px dashed #ccc' }}>+ Ajouter un parent / contact d'urgence</button>
                                    )}
                                </div>
                            )}

                            {activeTab === 'HISTORY' && (
                                <div>
                                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                        <thead>
                                            <tr style={{ textAlign: 'left', borderBottom: '2px solid #eee' }}>
                                                <th style={{ padding: '0.75rem' }}>Année</th>
                                                <th style={{ padding: '0.75rem' }}>Classe</th>
                                                <th style={{ padding: '0.75rem' }}>Établissement</th>
                                                <th style={{ padding: '0.75rem' }}>Résultat</th>
                                                <th style={{ padding: '0.75rem' }}>Moyenne</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {selectedStudent.schoolHistory?.map(h => (
                                                <tr key={h.id} style={{ borderBottom: '1px solid #f9f9f9' }}>
                                                    <td style={{ padding: '0.75rem' }}>{h.schoolYear}</td>
                                                    <td style={{ padding: '0.75rem' }}>{h.className}</td>
                                                    <td style={{ padding: '0.75rem' }}>{h.schoolName}</td>
                                                    <td style={{ padding: '0.75rem' }}>
                                                        <span style={{ fontSize: '0.8rem', color: h.result === 'ADMIS' ? '#2e7d32' : '#c62828' }}>{h.result}</span>
                                                    </td>
                                                    <td style={{ padding: '0.75rem' }}>{h.average || '---'}</td>
                                                </tr>
                                            ))}
                                            {selectedStudent.schoolHistory?.length === 0 && (
                                                <tr><td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Aucun historique enregistré.</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {activeTab === 'DOCUMENTS' && (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                                    {selectedStudent.documents?.map(doc => (
                                        <div key={doc.id} className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', backgroundColor: '#f5f5f5' }}>
                                            <FileText size={40} color="#999" style={{ marginBottom: '1rem' }} />
                                            <div style={{ textAlign: 'center' }}>
                                                <div style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>{doc.name}</div>
                                                <div style={{ fontSize: '0.7rem', color: '#777' }}>Statut: {doc.status}</div>
                                            </div>
                                            <a href={`${config.API_URL.replace('/api', '')}${doc.url}`} target="_blank" rel="noreferrer" className="btn" style={{ fontSize: '0.75rem', marginTop: '1rem', width: '100%' }}>Voir / Télécharger</a>
                                        </div>
                                    ))}
                                    {user && user.role !== 'ACCOUNTANT' && (
                                        <label className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '2px dashed #eee', cursor: 'pointer', minHeight: '150px' }}>
                                            <Upload size={30} color="#ddd" />
                                            <span style={{ fontSize: '0.8rem', color: '#aaa', marginTop: '0.5rem' }}>
                                                {uploading ? 'Téléchargement...' : 'Ajouter un fichier'}
                                            </span>
                                            <input
                                                type="file"
                                                style={{ display: 'none' }}
                                                onChange={async (e) => {
                                                    const file = e.target.files[0];
                                                    if (!file) return;

                                                    // Validate file type and size (max 5MB)
                                                    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
                                                    if (!allowedTypes.includes(file.type)) {
                                                        alert('Format de fichier non supporté. Veuillez utiliser PDF, JPG ou PNG.');
                                                        return;
                                                    }
                                                    if (file.size > 5 * 1024 * 1024) {
                                                        alert('Le fichier est trop volumineux (Max 5MB).');
                                                        return;
                                                    }

                                                    const formData = new FormData();
                                                    formData.append('document', file);
                                                    formData.append('studentId', selectedStudent.id);
                                                    formData.append('docType', 'OTHER');

                                                    setUploading(true);
                                                    try {
                                                        await axios.post(`${API_BASE}/students/${selectedStudent.id}/documents`, formData, {
                                                            headers: {
                                                                'Content-Type': 'multipart/form-data',
                                                                Authorization: `Bearer ${user.token}`
                                                            }
                                                        });
                                                        alert('Document téléchargé avec succès !');
                                                        // Refresh student data
                                                        const res = await axios.get(`${API_BASE}/students/${selectedStudent.id}`, {
                                                            headers: { Authorization: `Bearer ${user.token}` }
                                                        });
                                                        setSelectedStudent(res.data);
                                                    } catch (error) {
                                                        console.error('Upload error:', error);
                                                        alert('Erreur lors du téléchargement du document.');
                                                    } finally {
                                                        setUploading(false);
                                                    }
                                                }}
                                                disabled={uploading}
                                            />
                                        </label>
                                    )}
                                </div>
                            )}
                        </div>
                    </main>
                </div>
            )}

            {view === 'LIST' && (
                <>
                    <div className="card" style={{ marginBottom: '1.5rem', padding: '1.5rem' }}>
                        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                            <div style={{ position: 'relative', flex: 2, minWidth: '300px' }}>
                                <Search style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} size={18} />
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="Nom, matricule ou parent..."
                                    style={{ paddingLeft: '3rem' }}
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <select className="form-input" style={{ flex: 1 }} value={filterClass} onChange={e => setFilterClass(e.target.value)}>
                                <option value="">Toutes les Classes</option>
                                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                            <select className="form-input" style={{ flex: 1 }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                                <option value="ACTIF">ACTIF</option>
                                <option value="SUSPENDU">SUSPENDU</option>
                                <option value="TRANSFERE">TRANSFERE</option>
                                <option value="ARCHIVE">ARCHIVE</option>
                                <option value="">Tous les Statuts</option>
                            </select>
                        </div>
                    </div>

                    <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead style={{ backgroundColor: '#fafafa', borderBottom: '2px solid #eee' }}>
                                    <tr>
                                        <th style={{ padding: '1rem', textAlign: 'left' }}>Matricule</th>
                                        <th style={{ padding: '1rem', textAlign: 'left' }}>Élève</th>
                                        <th style={{ padding: '1rem', textAlign: 'left' }}>Classe</th>
                                        <th style={{ padding: '1rem', textAlign: 'left' }}>Parent Responsable</th>
                                        <th style={{ padding: '1rem', textAlign: 'left' }}>Statut</th>
                                        <th style={{ padding: '1rem', textAlign: 'center' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredStudents.map(student => {
                                        const primaryParent = student.parents.find(p => p.isPrimary)?.parent || student.parents[0]?.parent;
                                        return (
                                            <tr key={student.id} style={{ borderBottom: '1px solid #f5f5f5', transition: 'background 0.2s' }} className="table-row-hover">
                                                <td style={{ padding: '1rem', fontWeight: 'bold', color: 'var(--primary)' }}>{student.regNumber}</td>
                                                <td style={{ padding: '1rem' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                        <div style={{ width: '35px', height: '35px', borderRadius: '50%', backgroundColor: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 'bold' }}>
                                                            {student.firstName[0]}{student.lastName[0]}
                                                        </div>
                                                        <div>
                                                            <div style={{ fontWeight: '600' }}>{student.lastName} {student.firstName}</div>
                                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{student.gender === 'M' ? 'Masculin' : 'Féminin'}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td style={{ padding: '1rem' }}>
                                                    <div style={{ fontSize: '0.9rem' }}>{student.enrollments[0]?.class?.name || '---'}</div>
                                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{student.enrollments[0]?.class?.level}</div>
                                                </td>
                                                <td style={{ padding: '1rem' }}>
                                                    {primaryParent ? (
                                                        <>
                                                            <div style={{ fontSize: '0.9rem' }}>{primaryParent.lastName} {primaryParent.firstName}</div>
                                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{primaryParent.phonePrimary}</div>
                                                        </>
                                                    ) : '---'}
                                                </td>
                                                <td style={{ padding: '1rem' }}>
                                                    <span style={{ padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 'bold', backgroundColor: student.status === 'ACTIF' ? '#e8f5e9' : '#fafafa', color: student.status === 'ACTIF' ? '#2e7d32' : '#777' }}>
                                                        {student.status}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '1rem', textAlign: 'center' }}>
                                                    <button className="btn btn-primary" onClick={() => openDetails(student)} style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>Dossier Complet</button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                            {filteredStudents.length === 0 && (
                                <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                                    <Search size={40} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                                    <p>Aucun élève trouvé pour ces critères.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default Students;
