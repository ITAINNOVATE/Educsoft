import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import config from '../config';
import { 
    Wallet, TrendingDown, Calendar, Search, 
    Plus, Trash2, FileText, Filter, Receipt,
    AlertCircle, CheckCircle, Package, Truck, 
    UserCheck, Wrench, HelpCircle, X, Paperclip,
    User, Eye, Link as LinkIcon
} from 'lucide-react';

const Expenses = () => {
    const { user } = useAuth();
    const API_URL = `${config.API_URL}/expenses`;
    const STORAGE_URL = config.API_URL; // To serve static files

    const [expenses, setExpenses] = useState([]);
    const [stats, setStats] = useState({ monthlyTotal: 0, categories: [] });
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('');
    const fileInputRef = useRef(null);

    const [formData, setFormData] = useState({
        description: '',
        amount: '',
        category: 'ACHAT',
        method: 'CASH',
        notes: '',
        spentBy: '',
        date: new Date().toISOString().split('T')[0]
    });
    const [receiptFile, setReceiptFile] = useState(null);

    const categories = [
        { id: 'ACHAT', label: 'Achats / Fournitures', icon: <Package size={16} /> },
        { id: 'SALAIRE', label: 'Salaires / Primes', icon: <UserCheck size={16} /> },
        { id: 'LOYER', label: 'Loyer / Factures', icon: <FileText size={16} /> },
        { id: 'MAINTENANCE', label: 'Maintenance / Travaux', icon: <Wrench size={16} /> },
        { id: 'TRANSPORT', label: 'Transport / Carburant', icon: <Truck size={16} /> },
        { id: 'DIVERS', label: 'Dépenses Diverses', icon: <HelpCircle size={16} /> }
    ];

    useEffect(() => {
        fetchData();
    }, [filterCategory]);

    const fetchData = async () => {
        setLoading(true);
        try {
            let url = API_URL;
            if (filterCategory) url += `?category=${filterCategory}`;
            
            const [expRes, statsRes] = await Promise.all([
                axios.get(url, { headers: { Authorization: `Bearer ${user.token}` } }),
                axios.get(`${API_URL}/stats`, { headers: { Authorization: `Bearer ${user.token}` } })
            ]);
            
            setExpenses(expRes.data);
            setStats(statsRes.data);
        } catch (error) {
            console.error('Error fetching expenses:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = (e) => {
        setReceiptFile(e.target.files[0]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        const data = new FormData();
        data.append('description', formData.description);
        data.append('amount', formData.amount);
        data.append('category', formData.category);
        data.append('method', formData.method);
        data.append('notes', formData.notes);
        data.append('spentBy', formData.spentBy);
        data.append('date', formData.date);
        if (receiptFile) {
            data.append('receipt', receiptFile);
        }

        try {
            await axios.post(API_URL, data, {
                headers: { 
                    Authorization: `Bearer ${user.token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });
            setShowForm(false);
            setFormData({
                description: '', amount: '', category: 'ACHAT',
                method: 'CASH', notes: '', spentBy: '',
                date: new Date().toISOString().split('T')[0]
            });
            setReceiptFile(null);
            fetchData();
            alert('Dépense enregistrée avec succès !');
        } catch (error) {
            alert(error.response?.data?.message || 'Erreur lors de l’enregistrement');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Supprimer cette dépense ?')) return;
        try {
            await axios.delete(`${API_URL}/${id}`, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            fetchData();
        } catch (error) {
            alert('Erreur lors de la suppression');
        }
    };

    const filteredExpenses = expenses.filter(e => 
        e.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.spentBy?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div style={{ padding: '1rem', maxWidth: '1400px', margin: '0 auto' }}>
            {/* Header section */}
            <header className="stack-on-mobile" style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                <div>
                    <h1 style={{ fontSize: '2.5rem', color: 'var(--primary-dark)', fontWeight: '900', margin: 0, letterSpacing: '-0.02em' }}>Caisse Dépenses</h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', marginTop: '0.5rem' }}>Suivi rigoureux des flux de trésorerie sortants.</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowForm(!showForm)} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', height: '52px', padding: '0 2rem', fontWeight: '800', borderRadius: '12px' }}>
                    {showForm ? <X size={20} /> : <Plus size={20} />}
                    {showForm ? 'Fermer' : 'Déclarer une Dépense'}
                </button>
            </header>

            {/* Quick Stats */}
            <div className="grid-resp-3" style={{ marginBottom: '3rem', gap: '1.5rem' }}>
                <div className="card shadow-sm" style={{ background: 'linear-gradient(135deg, var(--primary-dark), #0f172a)', color: 'white', display: 'flex', alignItems: 'center', gap: '1.5rem', padding: '2rem', border: 'none' }}>
                    <div style={{ background: 'rgba(255,255,255,0.15)', padding: '1.25rem', borderRadius: '20px' }}>
                        <TrendingDown size={36} color="var(--secondary)" />
                    </div>
                    <div>
                        <div style={{ fontSize: '0.85rem', opacity: 0.8, textTransform: 'uppercase', fontWeight: '800', letterSpacing: '0.05em' }}>Sorties du Mois</div>
                        <div style={{ fontSize: '2.2rem', fontWeight: '900' }}>{stats.monthlyTotal?.toLocaleString()} <span style={{ fontSize: '1rem', opacity: 0.7 }}>FCFA</span></div>
                    </div>
                </div>

                <div className="card shadow-sm" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', padding: '2rem', background: 'white' }}>
                    <div style={{ background: '#fff7ed', padding: '1.25rem', borderRadius: '20px' }}>
                        <Wallet size={36} color="#c2410c" />
                    </div>
                    <div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '800', letterSpacing: '0.05em' }}>Moyenne Mensuelle</div>
                        <div style={{ fontSize: '1.8rem', fontWeight: '900', color: 'var(--primary-dark)' }}>
                            {(stats.monthlyTotal / 30).toFixed(0).toLocaleString()} <span style={{ fontSize: '0.9rem' }}>/jour</span>
                        </div>
                   </div>
                </div>

                <div className="card shadow-sm" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', padding: '2rem', background: 'white' }}>
                    <div style={{ background: '#f0fdf4', padding: '1.25rem', borderRadius: '20px' }}>
                        <Calendar size={36} color="#15803d" />
                    </div>
                    <div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '800', letterSpacing: '0.05em' }}>Total Opérations</div>
                        <div style={{ fontSize: '1.8rem', fontWeight: '900', color: 'var(--primary-dark)' }}>{expenses.length} <span style={{ fontSize: '0.9rem' }}>recettes</span></div>
                    </div>
                </div>
            </div>

            {/* Form Section */}
            {showForm && (
                <section className="card fade-in" style={{ marginBottom: '3rem', padding: '2.5rem', borderRadius: '24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2.5rem' }}>
                        <div style={{ background: 'var(--primary)', color: 'white', padding: '0.5rem', borderRadius: '8px' }}>
                            <Receipt size={24} />
                        </div>
                        <h2 style={{ color: 'var(--primary-dark)', fontSize: '1.6rem', fontWeight: '900', margin: 0 }}>Nouveaux Frais de Fonctionnement</h2>
                    </div>
                    <form onSubmit={handleSubmit}>
                        <div className="grid-resp-2" style={{ gap: '2rem' }}>
                            <div className="form-group">
                                <label className="form-label" style={{ fontWeight: '700' }}>Motif de la dépense (Libellé)</label>
                                <input type="text" className="form-input" style={{ height: '52px', borderRadius: '12px' }} placeholder="Ex: Réparation toiture, Achat rames de papier..." value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} required />
                            </div>
                            <div className="form-group">
                                <label className="form-label" style={{ fontWeight: '700' }}>Effectuée par (Bénéficiaire/Responsable)</label>
                                <div style={{ position: 'relative' }}>
                                    <User size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                                    <input type="text" className="form-input" style={{ height: '52px', borderRadius: '12px', paddingLeft: '3rem' }} placeholder="Nom du membre du personnel..." value={formData.spentBy} onChange={e => setFormData({...formData, spentBy: e.target.value})} required />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label" style={{ fontWeight: '700' }}>Catégorie analytique</label>
                                <select className="form-input" style={{ height: '52px', fontWeight: '700', borderRadius: '12px' }} value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                                    {categories.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label" style={{ fontWeight: '700' }}>Montant décaissé (FCFA)</label>
                                <input type="number" className="form-input" style={{ height: '52px', fontSize: '1.4rem', fontWeight: '900', color: '#dc2626', borderRadius: '12px' }} value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} required />
                            </div>
                            <div className="form-group">
                                <label className="form-label" style={{ fontWeight: '700' }}>Date de l'opération</label>
                                <input type="date" className="form-input" style={{ height: '52px', borderRadius: '12px' }} value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} required />
                            </div>
                            <div className="form-group">
                                <label className="form-label" style={{ fontWeight: '700' }}>Canal de paiement</label>
                                <select className="form-input" style={{ height: '52px', borderRadius: '12px' }} value={formData.method} onChange={e => setFormData({...formData, method: e.target.value})}>
                                    <option value="CASH">💵 Espèces / Main propre</option>
                                    <option value="MOBILE_MONEY">📱 Mobile Money (Moov/MTN)</option>
                                    <option value="TRANSFER">🏦 Virement Bancaire</option>
                                </select>
                            </div>
                            <div className="form-group" style={{ gridColumn: 'span 2' }}>
                                <label className="form-label" style={{ fontWeight: '700' }}>Observations & Précisions</label>
                                <textarea 
                                    className="form-input" 
                                    style={{ padding: '1rem', height: '100px', borderRadius: '12px', resize: 'none' }} 
                                    placeholder="Détails supplémentaires, n° de facture, contexte..." 
                                    value={formData.notes} 
                                    onChange={e => setFormData({...formData, notes: e.target.value})}
                                />
                            </div>
                            <div className="form-group" style={{ gridColumn: 'span 2' }}>
                                <label className="form-label" style={{ fontWeight: '700' }}>Pièce justificative (Reçu, Facture, Photo)</label>
                                <div style={{ 
                                    border: '2px dashed #e2e8f0', padding: '1.5rem', borderRadius: '12px', 
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem',
                                    cursor: 'pointer', transition: 'all 0.2s'
                                }}
                                onClick={() => fileInputRef.current.click()}
                                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--primary)'}
                                onMouseLeave={e => e.currentTarget.style.borderColor = '#e2e8f0'}
                                >
                                    <Paperclip size={24} color={receiptFile ? 'var(--success)' : '#94a3b8'} />
                                    <span style={{ color: receiptFile ? 'var(--success)' : '#64748b', fontWeight: '600' }}>
                                        {receiptFile ? `Fichier sélectionné : ${receiptFile.name}` : 'Cliquer pour joindre un document (PDF, Image)'}
                                    </span>
                                    <input 
                                        type="file" 
                                        ref={fileInputRef} 
                                        style={{ display: 'none' }} 
                                        onChange={handleFileChange}
                                        accept="image/*,application/pdf"
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="stack-on-mobile" style={{ marginTop: '3rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                            <button type="button" className="btn" style={{ padding: '0 2rem', background: '#f8fafc', border: '1px solid #e2e8f0', color: '#64748b' }} onClick={() => setShowForm(false)}>Annuler</button>
                            <button type="submit" className="btn btn-primary" style={{ padding: '0 3rem', height: '52px', fontWeight: '900', borderRadius: '12px' }}>Enregistrer la dépense</button>
                        </div>
                    </form>
                </section>
            )}

            {/* List Section */}
            <div className="card shadow-sm" style={{ padding: '0', borderRadius: '24px', overflow: 'hidden', background: 'white' }}>
                <div style={{ padding: '1.5rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem', borderBottom: '1px solid #f1f5f9', background: '#fafafa' }}>
                    <div style={{ position: 'relative', flex: 1, minWidth: '300px' }}>
                        <Search style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} size={20} />
                        <input 
                            type="text" 
                            className="form-input" 
                            placeholder="Chercher par motif, personne..." 
                            style={{ paddingLeft: '3.5rem', height: '48px', borderRadius: '14px', border: '1px solid #e2e8f0' }}
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <Filter size={18} color="var(--primary)" />
                        <select 
                            className="form-input" 
                            style={{ height: '48px', borderRadius: '14px', minWidth: '200px', fontSize: '0.9rem', border: '1px solid #e2e8f0', fontWeight: '600' }}
                            value={filterCategory}
                            onChange={e => setFilterCategory(e.target.value)}
                        >
                            <option value="">Tous les types de frais</option>
                            {categories.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                        </select>
                    </div>
                </div>

                <div className="table-container fade-in">
                    <table className="responsive-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ textAlign: 'left', background: '#f8fafc', borderBottom: '2px solid #f1f5f9' }}>
                                <th style={{ padding: '1.25rem 2rem', fontSize: '0.75rem', color: '#475569', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Motif & Responsable</th>
                                <th className="desktop-only" style={{ padding: '1.25rem 2rem', fontSize: '0.75rem', color: '#475569', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Détails</th>
                                <th className="desktop-only" style={{ padding: '1.25rem 2rem', fontSize: '0.75rem', color: '#475569', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Date</th>
                                <th style={{ padding: '1.25rem 2rem', fontSize: '0.75rem', color: '#475569', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Montant (FCFA)</th>
                                <th style={{ padding: '1.25rem 2rem', textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="5" style={{ padding: '4rem', textAlign: 'center', color: '#94a3b8' }}>Chargement du journal...</td></tr>
                            ) : filteredExpenses.length === 0 ? (
                                <tr><td colSpan="5" style={{ padding: '4rem', textAlign: 'center', color: '#94a3b8' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                                        <AlertCircle size={48} style={{ opacity: 0.2 }} />
                                        <span>Aucun mouvement comptable enregistré.</span>
                                    </div>
                                </td></tr>
                            ) : filteredExpenses.map(e => (
                                <tr key={e.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.2s' }} className="table-row-hover">
                                    <td data-label="Motif" style={{ padding: '1.25rem 2rem' }}>
                                        <div style={{ fontWeight: '800', color: 'var(--primary-dark)', fontSize: '1.05rem' }}>{e.description}</div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#64748b', marginTop: '0.4rem' }}>
                                            <User size={14} /> {e.spentBy || 'Non spécifié'}
                                        </div>
                                    </td>
                                    <td className="desktop-only" data-label="Détails" style={{ padding: '1.25rem 2rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--primary)', fontWeight: '700' }}>
                                            {categories.find(c => c.id === e.category)?.icon}
                                            {categories.find(c => c.id === e.category)?.label}
                                        </div>
                                        <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.2rem' }}>Mode: {e.method}</div>
                                    </td>
                                    <td className="desktop-only" data-label="Date" style={{ padding: '1.25rem 2rem', color: '#475569', fontSize: '0.95rem', fontWeight: '600' }}>
                                        {new Date(e.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
                                    </td>
                                    <td data-label="Montant" style={{ padding: '1.25rem 2rem', textAlign: 'right' }}>
                                        <div style={{ fontWeight: '950', color: '#dc2626', fontSize: '1.2rem' }}>-{e.amount.toLocaleString()}</div>
                                        {e.notes && <div title={e.notes} style={{ fontSize: '0.7rem', color: '#94a3b8', fontStyle: 'italic', maxWidth: '150px', marginLeft: 'auto', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.notes}</div>}
                                    </td>
                                    <td style={{ padding: '1.25rem 2rem' }}>
                                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                            {e.receiptUrl && (
                                                <a 
                                                    href={`${STORAGE_URL}${e.receiptUrl}`} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '10px', color: '#2563eb' }}
                                                    title="Voir justificatif"
                                                >
                                                    <Paperclip size={16} />
                                                </a>
                                            )}
                                            <button 
                                                onClick={() => handleDelete(e.id)} 
                                                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', background: '#fff1f2', border: '1px solid #fecdd3', borderRadius: '10px', color: '#e11d48', cursor: 'pointer' }}
                                                title="Supprimer"
                                            >
                                                <Trash2 size={16} />
                                            </button>
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

export default Expenses;
