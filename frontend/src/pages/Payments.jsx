import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import config from '../config';
import logo from '../assets/logo.png';
import {
    CreditCard, Search, FileText,
    CheckCircle, User, BookOpen, AlertCircle,
    Download, ArrowRight, History, Calendar,
    Wallet, TrendingUp, Calculator, Printer, X
} from 'lucide-react';

const Payments = () => {
    const { user } = useAuth();
    const API_BASE = config.API_URL;

    // Form State
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [selectedFee, setSelectedFee] = useState(null);
    const [amount, setAmount] = useState('');
    const [method, setMethod] = useState('CASH');
    const [notes, setNotes] = useState('');

    // UI State
    const [classes, setClasses] = useState([]);
    const [selectedClassId, setSelectedClassId] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [dailyStats, setDailyStats] = useState({ totalRevenue: 0, count: 0, transactions: [] });
    const [allRecent, setAllRecent] = useState([]);
    const [showResults, setShowResults] = useState(false);
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [confirmationData, setConfirmationData] = useState(null);
    const [showInvoice, setShowInvoice] = useState(false);

    const searchRef = useRef(null);

    useEffect(() => {
        if (user?.token) {
            fetchDailySummary();
            fetchRecentTransactions();
            fetchClasses();
        }
    }, [user]);

    const fetchClasses = async () => {
        try {
            const res = await axios.get(`${API_BASE}/config/classes`, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            setClasses(res.data);
        } catch (error) {
            console.error('Error fetching classes:', error);
        }
    };

    const handleClassChange = async (classId) => {
        setSelectedClassId(classId);
        if (!classId) {
            setSearchResults([]);
            return;
        }
        setIsSearching(true);
        setShowResults(true);
        try {
            const res = await axios.get(`${API_BASE}/payments/search-students?classId=${classId}`, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            setSearchResults(res.data);
        } catch (error) {
            console.error('Error fetching class students:', error);
        } finally {
            setIsSearching(false);
        }
    };

    const fetchDailySummary = async () => {
        try {
            const res = await axios.get(`${API_BASE}/payments/daily-summary`, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            setDailyStats(res.data);
        } catch (error) {
            console.error('Error fetching daily summary:', error);
        }
    };

    const fetchRecentTransactions = async () => {
        try {
            const res = await axios.get(`${API_BASE}/payments/student/all`, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            setAllRecent(res.data);
        } catch (error) {
            console.error('Error fetching recent transactions:', error);
        }
    };

    const handleSearch = async (val) => {
        setSearchTerm(val);
        if (val.length < 2) {
            setSearchResults([]);
            return;
        }

        setIsSearching(true);
        setShowResults(true);
        try {
            const res = await axios.get(`${API_BASE}/payments/search-students?q=${val}`, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            setSearchResults(res.data);
        } catch (error) {
            console.error('Search error:', error);
        } finally {
            setIsSearching(false);
        }
    };

    const selectStudent = (student) => {
        setSelectedStudent(student);
        setSearchTerm(`${student.firstName} ${student.lastName}`);
        setShowResults(false);
        // Default to first obligatory fee if available
        if (student.groupedFees?.OBLIGATORY?.length > 0) {
            setSelectedFee(student.groupedFees.OBLIGATORY[0]);
            setAmount(student.groupedFees.OBLIGATORY[0].amount);
        } else if (student.groupedFees?.OPTIONAL?.length > 0) {
            setSelectedFee(student.groupedFees.OPTIONAL[0]);
            setAmount(student.groupedFees.OPTIONAL[0].amount);
        }
    };

    const [paymentSuccess, setPaymentSuccess] = useState(false);
    const [lastPaymentId, setLastPaymentId] = useState(null);
    const [successData, setSuccessData] = useState(null);

    const handlePayment = (e) => {
        e.preventDefault();
        if (!selectedStudent || !amount) return;

        setConfirmationData({
            studentId: selectedStudent.id,
            feeId: selectedFee?.id,
            feeName: selectedFee?.name || 'Paiement Divers',
            amount: parseFloat(amount),
            method,
            notes,
            studentName: `${selectedStudent.firstName} ${selectedStudent.lastName}`,
            studentClass: selectedStudent.class,
            feeCategory: selectedFee?.category
        });
        setShowConfirmation(true);
    };

    const confirmPayment = async () => {
        setIsProcessing(true);
        try {
            const res = await axios.post(`${API_BASE}/payments`, {
                studentId: confirmationData.studentId,
                feeId: confirmationData.feeId,
                feeName: confirmationData.feeName,
                amount: confirmationData.amount,
                method: confirmationData.method,
                notes: confirmationData.notes
            }, {
                headers: { Authorization: `Bearer ${user.token}` }
            });

            // Refresh data
            fetchDailySummary();
            fetchRecentTransactions();

            // Set data for invoice visualization
            setSuccessData({
                id: res.data.id,
                amount: confirmationData.amount,
                studentName: confirmationData.studentName,
                studentClass: confirmationData.studentClass,
                studentReg: selectedStudent.regNumber,
                receiptNumber: res.data.receiptNumber,
                feeName: confirmationData.feeName,
                paymentDate: res.data.paymentDate,
                method: confirmationData.method,
                notes: confirmationData.notes,
                remaining: selectedStudent.financials.remaining - confirmationData.amount
            });

            // Reset form
            resetForm();
            setLastPaymentId(res.data.id);
            setShowConfirmation(false);
            setPaymentSuccess(true);

            // Removed auto-close timeout to allow user to choose action
        } catch (error) {
            alert('Erreur lors du traitement du paiement');
        } finally {
            setIsProcessing(false);
        }
    };

    const resetForm = () => {
        setSelectedStudent(null);
        setSelectedFee(null);
        setAmount('');
        setNotes('');
        setSearchTerm('');
        setMethod('CASH');
    };

    const downloadReceipt = (id) => {
        window.open(`${API_BASE}/payments/receipt/${id}?token=${user.token}`, '_blank');
    };

        <div className="responsive-container" style={{ maxWidth: '1400px', margin: '0 auto', fontFamily: 'Inter, sans-serif' }}>

            {/* Header section */}
            <header className="stack-on-mobile" style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1.5rem' }}>
                <div style={{ flex: 1 }}>
                    <h1 style={{ color: 'var(--primary-dark)', fontWeight: '900', fontSize: '2.2rem', marginBottom: '0.4rem', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
                        Caisse & Paiements
                    </h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>
                        Enregistrement des frais scolaires et suivi des recettes.
                    </p>
                </div>

                <div className="grid-resp-2" style={{ gap: '1rem', flexShrink: 0 }}>
                    <div className="card" style={{ padding: '0.75rem 1rem', background: 'white', display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: '180px' }}>
                        <div style={{ background: '#e0f2f1', padding: '0.5rem', borderRadius: '10px' }}>
                            <TrendingUp color="var(--primary)" size={18} />
                        </div>
                        <div>
                            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>Recettes Jour</div>
                            <div style={{ fontSize: '1rem', fontWeight: '800', color: 'var(--primary-dark)' }}>{dailyStats.totalRevenue?.toLocaleString()} <span style={{ fontSize: '0.7rem' }}>FCFA</span></div>
                        </div>
                    </div>
                    <div className="card" style={{ padding: '0.75rem 1rem', background: 'white', display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: '150px' }}>
                        <div style={{ background: '#fff3e0', padding: '0.5rem', borderRadius: '10px' }}>
                            <FileText color="#fb8c00" size={18} />
                        </div>
                        <div>
                            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>Transactions</div>
                            <div style={{ fontSize: '1rem', fontWeight: '800', color: 'var(--primary-dark)' }}>{dailyStats.count}</div>
                        </div>
                    </div>
                </div>
            </header>

            <div className="grid-resp-2" style={{ gap: '2rem' }}>

                {/* PAYMENT FORM COLUMN */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    <section className="card" style={{ padding: '2.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
                            <Wallet color="var(--primary)" size={28} />
                            <h2 style={{ fontSize: '1.5rem', fontWeight: '700' }}>Nouveau Règlement</h2>
                        </div>



                        <form onSubmit={handlePayment}>
                            {/* SEARCH INPUT */}
                            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                                <label className="form-label">Parcourir par Classe</label>
                                <select
                                    className="form-input"
                                    style={{ height: '3.5rem' }}
                                    value={selectedClassId}
                                    onChange={(e) => handleClassChange(e.target.value)}
                                >
                                    <option value="">-- Sélectionner une classe --</option>
                                    {classes.map(c => (
                                        <option key={c.id} value={c.id}>{c.name} ({c.level})</option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group" style={{ position: 'relative' }} ref={searchRef}>
                                <label className="form-label">Recherche Directe (Nom ou Matricule)</label>
                                <div style={{ position: 'relative' }}>
                                    <Search style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} size={20} />
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="Commencez à saisir..."
                                        style={{ paddingLeft: '3rem', height: '3.5rem', fontSize: '1.1rem' }}
                                        value={searchTerm}
                                        onChange={(e) => {
                                            setSelectedClassId('');
                                            handleSearch(e.target.value);
                                        }}
                                        onFocus={() => { if (searchTerm.length >= 2) setShowResults(true); }}
                                    />
                                    {isSearching && <div className="spinner-small" style={{ position: 'absolute', right: '1rem', top: '35%' }}></div>}
                                </div>

                                {/* AUTOCOMPLETE DROPDOWN */}
                                {showResults && searchResults.length > 0 && (
                                    <div style={{
                                        position: 'absolute', top: '105%', left: 0, right: 0,
                                        background: 'white', borderRadius: '12px', zIndex: 100,
                                        boxShadow: '0 10px 25px rgba(0,0,0,0.1)', overflow: 'hidden',
                                        border: '1px solid #eee'
                                    }}>
                                        {searchResults.map(s => (
                                            <div
                                                key={s.id}
                                                onClick={() => selectStudent(s)}
                                                style={{
                                                    padding: '1rem', cursor: 'pointer', borderBottom: '1px solid #f5f5f5',
                                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                                    transition: 'all 0.2s'
                                                }}
                                                className="search-item"
                                            >
                                                <div>
                                                    <div style={{ fontWeight: '700', color: 'var(--primary-dark)' }}>{s.firstName} {s.lastName}</div>
                                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{s.regNumber} • {s.class}</div>
                                                </div>
                                                <div style={{ textAlign: 'right' }}>
                                                    <div style={{ fontSize: '0.75rem', color: '#666', fontWeight: '600' }}>Reste à payer</div>
                                                    <div style={{ fontWeight: '800', color: s.financials.remaining > 0 ? 'var(--error)' : 'var(--success)' }}>
                                                        {s.financials.remaining.toLocaleString()} <span style={{ fontSize: '0.7rem' }}>FCFA</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* SELECTED STUDENT INFO */}
                            {selectedStudent && (
                                <div style={{
                                    background: '#f0f4f8', padding: '1.5rem', borderRadius: '12px',
                                    marginBottom: '2rem', marginTop: '-1rem', border: '1px solid #d1d9e6',
                                    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', alignItems: 'center'
                                }}>
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                            <User size={16} color="var(--primary)" />
                                            <span style={{ fontWeight: '800', color: 'var(--primary-dark)', fontSize: '1.1rem' }}>
                                                {selectedStudent.firstName} {selectedStudent.lastName}
                                            </span>
                                        </div>
                                        <div style={{ display: 'flex', gap: '1rem', fontSize: '0.9rem', color: '#666' }}>
                                            <span><BookOpen size={14} style={{ verticalAlign: 'middle' }} /> {selectedStudent.class}</span>
                                            <span># {selectedStudent.regNumber}</span>
                                        </div>
                                    </div>

                                    <div className="hide-mobile" style={{ borderLeft: '1px solid #cbd5e1', paddingLeft: '1.5rem' }}>
                                        <div style={{ fontSize: '0.8rem', color: '#666', fontWeight: '600', textTransform: 'uppercase' }}>Situation Financière</div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginTop: '0.4rem' }}>
                                            <span>Total Dû:</span>
                                            <span style={{ fontWeight: '700' }}>{selectedStudent.financials.totalDue.toLocaleString()}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: 'var(--success)' }}>
                                            <span>Déjà Payé:</span>
                                            <span style={{ fontWeight: '700' }}>{selectedStudent.financials.totalPaid.toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* PAYMENT INPUTS */}
                            <div className="grid-resp-2" style={{ gap: '1.5rem', marginBottom: '1.5rem' }}>
                                <div className="form-group">
                                    <label className="form-label">Type de Frais</label>
                                    <select
                                        className="form-input"
                                        value={selectedFee?.id || ''}
                                        onChange={(e) => {
                                            const fee = [
                                                ...(selectedStudent?.groupedFees?.OBLIGATORY || []),
                                                ...(selectedStudent?.groupedFees?.OPTIONAL || []),
                                                ...(selectedStudent?.groupedFees?.OCCASIONAL || [])
                                            ].find(f => f.id === e.target.value);
                                            setSelectedFee(fee);
                                            if (fee) setAmount(fee.amount);
                                        }}
                                        required={selectedStudent?.groupedFees?.OBLIGATORY?.length > 0}
                                        style={{
                                            borderLeft: `5px solid ${selectedFee?.category === 'ANNUAL_OBLIGATORY' ? '#2e7d32' :
                                                selectedFee?.category === 'OPTIONAL' ? '#fb8c00' :
                                                    selectedFee?.category === 'OCCASIONAL' ? '#ef5350' : '#ddd'
                                                }`
                                        }}
                                    >
                                        <option value="">Sélectionner un frais...</option>

                                        {selectedStudent?.groupedFees?.OBLIGATORY?.length > 0 && (
                                            <optgroup label="🟢 OBLIGATOIRES ANNUELS">
                                                {selectedStudent.groupedFees.OBLIGATORY.map(f => (
                                                    <option key={f.id} value={f.id}>{f.name} ({(f.amount || 0).toLocaleString()} FCFA)</option>
                                                ))}
                                            </optgroup>
                                        )}

                                        {selectedStudent?.groupedFees?.OPTIONAL?.length > 0 && (
                                            <optgroup label="🟡 FRAIS OPTIONNELS">
                                                {selectedStudent.groupedFees.OPTIONAL.map(f => (
                                                    <option key={f.id} value={f.id}>{f.name} ({(f.amount || 0).toLocaleString()} FCFA)</option>
                                                ))}
                                            </optgroup>
                                        )}

                                        {selectedStudent?.groupedFees?.OCCASIONAL?.length > 0 && (
                                            <optgroup label="🟠 FRAIS OCCASIONNELS">
                                                {selectedStudent.groupedFees.OCCASIONAL.map(f => (
                                                    <option key={f.id} value={f.id}>{f.name} ({(f.amount || 0).toLocaleString()} FCFA)</option>
                                                ))}
                                            </optgroup>
                                        )}

                                        <option value="other">Autre / Règlement Manuel</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Montant (FCFA)</label>
                                    <input
                                        type="number"
                                        className="form-input"
                                        style={{ fontWeight: '700', fontSize: '1.25rem', color: 'var(--primary)' }}
                                        value={amount}
                                        onChange={e => setAmount(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid-resp-2" style={{ gap: '1.5rem', marginBottom: '2rem' }}>
                                <div className="form-group">
                                    <label className="form-label">Notes</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="Observations..."
                                        value={notes}
                                        onChange={e => setNotes(e.target.value)}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Mode</label>
                                    <select className="form-input" value={method} onChange={e => setMethod(e.target.value)}>
                                        <option value="CASH">Espèces 💵</option>
                                        <option value="MOBILE_MONEY">Mobile Money 📱</option>
                                        <option value="TRANSFER">Virement 🏦</option>
                                    </select>
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="btn btn-primary btn-block"
                                style={{ height: '4rem', fontSize: '1.25rem', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}
                                disabled={isProcessing || !selectedStudent || !amount}
                            >
                                <CheckCircle size={24} /> Valider l'Encaissement
                            </button>
                        </form>
                    </section>
                </div>

                {/* HISTORICAL / STATS COLUMN */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                    {/* SUMMARY OF TODAY */}
                    <section className="card" style={{ padding: '2rem', position: 'relative', overflow: 'hidden' }}>
                        <div style={{ position: 'absolute', right: '-20px', top: '-10px', opacity: 0.05 }}>
                            <Calculator size={120} color="var(--primary)" />
                        </div>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '1.5rem', color: '#444', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Calendar size={18} color="var(--primary)" /> Flash Recettes Aujourd'hui
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                <div style={{ fontSize: '0.7rem', color: '#666', fontWeight: '700' }}>TOTAL PERÇU</div>
                                <div style={{ fontSize: '1.5rem', fontWeight: '900', color: 'var(--primary)' }}>{dailyStats.totalRevenue?.toLocaleString()} <span style={{ fontSize: '0.8rem' }}>FCFA</span></div>
                            </div>
                            <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                <div style={{ fontSize: '0.7rem', color: '#666', fontWeight: '700' }}>NOMBRE REÇUS</div>
                                <div style={{ fontSize: '1.5rem', fontWeight: '900', color: 'var(--primary-dark)' }}>{dailyStats.count}</div>
                            </div>
                        </div>
                    </section>

                    {/* RECENT TRANSACTIONS */}
                    <section className="card" style={{ padding: '2rem', flexGrow: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--primary-dark)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <History size={20} color="var(--primary)" /> Derniers Paiements
                            </h3>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {allRecent.length > 0 ? allRecent.map((p, idx) => (
                                <div
                                    key={p.id}
                                    style={{
                                        padding: '1rem', borderRadius: '12px', background: 'white',
                                        border: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                        transition: 'transform 0.2s', cursor: 'default'
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.transform = 'translateX(5px)'}
                                    onMouseLeave={e => e.currentTarget.style.transform = 'none'}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <div style={{
                                            width: '40px', height: '40px', background: '#e0f2f1', borderRadius: '10px',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)'
                                        }}>
                                            <FileText size={20} />
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: '700', fontSize: '0.95rem' }}>{p.student?.lastName || '---'} {p.student?.firstName || ''}</div>
                                            <div style={{ fontSize: '0.75rem', color: '#666' }}>
                                                {(p.receiptNumber || '---')} • {p.paymentDate ? new Date(p.paymentDate).toLocaleDateString('fr-FR') : '---'}
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontWeight: '800', color: 'var(--primary-dark)' }}>{(p.amount || 0).toLocaleString()} FCFA</div>
                                        <button
                                            onClick={() => downloadReceipt(p.id)}
                                            style={{
                                                marginTop: '0.25rem', border: 'none', background: 'none',
                                                color: 'var(--primary)', fontSize: '0.75rem', fontWeight: '700',
                                                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.2rem', justifyContent: 'flex-end'
                                            }}
                                        >
                                            <Download size={14} /> Reçu PDF
                                        </button>
                                    </div>
                                </div>
                            )) : (
                                <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                                    <AlertCircle size={40} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                                    <p>Veuillez rafraîchir ou effectuer un paiement.</p>
                                </div>
                            )}
                        </div>

                        {allRecent.length > 0 && (
                            <button style={{
                                marginTop: '1.5rem', width: '100%', padding: '0.75rem',
                                borderRadius: '8px', border: '1px solid #e2e8f0', background: 'white',
                                color: '#64748b', fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
                            }}>
                                Voir tout l'historique <ArrowRight size={16} />
                            </button>
                        )}
                    </section>

                </div>

            </div>

            {/* CONFIRMATION MODAL */}
            {showConfirmation && confirmationData && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
                    animation: 'fadeIn 0.2s'
                }}>
                    <div className="card" style={{
                        padding: '0', maxWidth: '600px', width: '90%',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', border: 'none', overflow: 'hidden'
                    }}>
                        <div style={{
                            background: 'var(--primary)', color: 'white', padding: '1.5rem',
                            display: 'flex', alignItems: 'center', gap: '1rem'
                        }}>
                            <div style={{ background: 'rgba(255,255,255,0.2)', padding: '0.75rem', borderRadius: '50%' }}>
                                <FileText size={28} />
                            </div>
                            <div>
                                <h2 style={{ fontSize: '1.4rem', fontWeight: '700', margin: 0 }}>Confirmer le Paiement</h2>
                                <p style={{ opacity: 0.9, fontSize: '0.9rem', margin: '0.2rem 0 0 0' }}>Vérifiez les détails avant validation finale.</p>
                            </div>
                        </div>

                        <div style={{ padding: '2rem' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
                                <div>
                                    <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '0.25rem' }}>Élève Concerné</div>
                                    <div style={{ fontWeight: '700', fontSize: '1.1rem', color: 'var(--text-main)' }}>{confirmationData.studentName}</div>
                                    <div style={{ fontSize: '0.85rem', color: '#64748b' }}>{confirmationData.studentClass}</div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '0.25rem' }}>Montant à Payer</div>
                                    <div style={{ fontWeight: '800', fontSize: '1.5rem', color: 'var(--primary)' }}>{confirmationData.amount.toLocaleString()} FCFA</div>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Mode: {confirmationData.method === 'CASH' ? 'Espèces' : confirmationData.method === 'MOBILE_MONEY' ? 'Mobile Money' : 'Virement'}</div>
                                </div>
                            </div>

                            <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '2rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
                                    <span style={{ color: '#64748b', fontSize: '0.9rem' }}>Motif du Paiement</span>
                                    <span style={{ fontWeight: '600' }}>{confirmationData.feeName}</span>
                                </div>
                                {confirmationData.notes && (
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem' }}>
                                        <span style={{ color: '#64748b', fontSize: '0.9rem' }}>Notes</span>
                                        <span style={{ fontStyle: 'italic', color: '#444' }}>{confirmationData.notes}</span>
                                    </div>
                                )}
                            </div>

                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button
                                    onClick={() => setShowConfirmation(false)}
                                    className="btn"
                                    style={{ flex: 1, padding: '1rem', border: '1px solid #cbd5e1', background: 'white', color: '#64748b' }}
                                    disabled={isProcessing}
                                >
                                    Annuler
                                </button>
                                <button
                                    onClick={confirmPayment}
                                    className="btn btn-primary"
                                    style={{ flex: 2, padding: '1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.75rem', fontWeight: '700', fontSize: '1.1rem' }}
                                    disabled={isProcessing}
                                >
                                    {isProcessing ? 'Traitement...' : <><CheckCircle size={20} /> Confirmer & Imprimer Reçu</>}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* PAYMENT SUCCESS MODAL */}
            {paymentSuccess && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
                    animation: 'fadeIn 0.3s'
                }}>
                    <div className="card" style={{
                        padding: '3rem', maxWidth: '500px', width: '90%', textAlign: 'center',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', border: 'none'
                    }}>
                        <div style={{
                            width: '80px', height: '80px', background: '#dcfce7', borderRadius: '50%',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#166534',
                            marginBottom: '0.5rem'
                        }}>
                            <CheckCircle size={48} />
                        </div>

                        <div>
                            <h2 style={{ fontSize: '1.8rem', fontWeight: '800', color: '#166534', marginBottom: '0.5rem' }}>Paiement Validé !</h2>
                            <p style={{ color: '#666', fontSize: '1.1rem' }}>L'encaissement a été enregistré avec succès.</p>
                        </div>

                        <div style={{
                            background: '#f8fafc', padding: '1.5rem', borderRadius: '12px', width: '100%',
                            border: '1px solid #e2e8f0'
                        }}>
                            <div style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '0.5rem' }}>Montant Encaissé</div>
                            <div style={{ fontSize: '2rem', fontWeight: '900', color: 'var(--primary-dark)' }}>
                                {successData?.amount?.toLocaleString()} <span style={{ fontSize: '1rem' }}>FCFA</span>
                            </div>
                            <div style={{ fontSize: '0.9rem', color: '#64748b', marginTop: '0.5rem' }}>
                                {successData?.studentName}
                            </div>
                            {successData?.receiptNumber && (
                                <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.2rem' }}>
                                    Reçu N° {successData.receiptNumber}
                                </div>
                            )}
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
                            <button
                                onClick={() => {
                                    setPaymentSuccess(false);
                                    setShowInvoice(true);
                                }}
                                className="btn btn-primary"
                                style={{
                                    padding: '1rem', borderRadius: '12px', fontSize: '1.1rem',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem',
                                    fontWeight: '700'
                                }}
                            >
                                <FileText size={24} /> Visualiser la Facture
                            </button>
                            <button
                                onClick={() => {
                                    setPaymentSuccess(false);
                                    setLastPaymentId(null);
                                    setSuccessData(null);
                                }}
                                style={{
                                    padding: '1rem', background: 'transparent', border: 'none',
                                    color: '#64748b', cursor: 'pointer', fontWeight: '600', fontSize: '1rem'
                                }}
                            >
                                Fermer et Nouveau Paiement
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* INVOICE VISUALIZATION MODAL (A4) */}
            {showInvoice && successData && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', 
                    zIndex: 3000, overflowY: 'auto', padding: '1rem'
                }}>
                    <div className="no-print" style={{ 
                        width: '100%', maxWidth: '210mm', display: 'flex', justifyContent: 'space-between', 
                        marginBottom: '1.5rem', alignItems: 'center', gap: '1rem' 
                    }}>
                        <button 
                            onClick={() => setShowInvoice(false)}
                            style={{ 
                                background: 'white', border: 'none', padding: '0.75rem 1.5rem', 
                                borderRadius: '8px', fontWeight: '700', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', gap: '0.5rem', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                            }}
                        >
                            <X size={20} /> Fermer
                        </button>
                        <button 
                            onClick={() => window.print()}
                            style={{ 
                                background: 'var(--primary)', color: 'white', border: 'none', 
                                padding: '0.75rem 2rem', borderRadius: '8px', fontWeight: '700', 
                                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                            }}
                        >
                            <Printer size={20} /> Imprimer (A4)
                        </button>
                    </div>

                    <div id="invoice-print-area" className="invoice-a4">
                        {/* Header Section */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3rem', borderBottom: '2px solid var(--primary)', paddingBottom: '1.5rem' }}>
                            <div style={{ flex: 1 }}>
                                {user.establishmentInfo?.logoUrl ? (
                                    <div style={{ marginBottom: '1rem' }}>
                                        <img src={user.establishmentInfo.logoUrl} alt="Logo" style={{ maxHeight: '130px', maxWidth: '200px', objectFit: 'contain' }} />
                                    </div>
                                ) : (
                                    <div style={{ marginBottom: '1.5rem' }}>
                                        <img src={logo} alt="EDUSOFT" style={{ maxHeight: '130px', maxWidth: '200px', objectFit: 'contain' }} />
                                    </div>
                                )}
                                <h2 style={{ margin: 0, color: 'var(--primary-dark)', fontSize: '1.5rem', textTransform: 'uppercase' }}>
                                    {user.establishmentName}
                                </h2>
                                <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem', color: '#444' }}>{user.establishmentInfo?.address || 'Cotonou, Bénin'}</p>
                                <p style={{ margin: '0.2rem 0', fontSize: '0.9rem', color: '#444' }}>Tél: {user.establishmentInfo?.phone || '+229 00 00 00 00'}</p>
                                <p style={{ margin: '0.2rem 0', fontSize: '0.9rem', color: '#444' }}>Email: {user.establishmentInfo?.email || 'contact@ecole.bj'}</p>
                            </div>
                            <div style={{ textAlign: 'right', flex: 1 }}>
                                <div style={{ 
                                    display: 'inline-block', padding: '1rem 2rem', background: '#f8fafc', 
                                    border: '1px solid #e2e8f0', borderRadius: '12px', textAlign: 'center'
                                }}>
                                    <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>Reçu de Paiement</div>
                                    <div style={{ fontSize: '1.5rem', fontWeight: '900', color: 'var(--primary-dark)' }}>N° {successData.receiptNumber}</div>
                                    <div style={{ fontSize: '0.9rem', color: '#64748b', marginTop: '0.25rem' }}>Fait le: {new Date(successData.paymentDate).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
                                </div>
                            </div>
                        </div>

                        {/* Student Info */}
                        <div style={{ marginBottom: '3rem', display: 'flex', gap: '2rem' }}>
                            <div style={{ flex: 1, padding: '1.5rem', background: '#fcfcfc', border: '1px solid #f1f5f9', borderRadius: '12px' }}>
                                <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: '800', textTransform: 'uppercase', marginBottom: '0.75rem' }}>Informations de l'Élève</div>
                                <div style={{ fontSize: '1.25rem', fontWeight: '800', marginBottom: '0.4rem' }}>{successData.studentName}</div>
                                <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.95rem', color: '#444' }}>
                                    <span><strong>Matricule:</strong> {successData.studentReg}</span>
                                    <span><strong>Classe:</strong> {successData.studentClass}</span>
                                </div>
                            </div>
                        </div>

                        {/* Transaction Details Table */}
                        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '3rem' }}>
                            <thead>
                                <tr style={{ borderBottom: '2px solid #333' }}>
                                    <th style={{ textAlign: 'left', padding: '1rem', fontSize: '0.9rem', color: '#64748b' }}>DÉSIGNATION / MOTIF DU PAIEMENT</th>
                                    <th style={{ textAlign: 'right', padding: '1rem', fontSize: '0.9rem', color: '#64748b' }}>MODE</th>
                                    <th style={{ textAlign: 'right', padding: '1rem', fontSize: '0.9rem', color: '#64748b' }}>MONTANT (FCFA)</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                                    <td style={{ padding: '1.5rem 1rem', fontWeight: '600' }}>
                                        {successData.feeName}
                                        {successData.notes && <div style={{ fontSize: '0.8rem', fontStyle: 'italic', fontWeight: '400', color: '#666', marginTop: '0.4rem' }}>Note: {successData.notes}</div>}
                                    </td>
                                    <td style={{ padding: '1.5rem 1rem', textAlign: 'right' }}>{successData.method}</td>
                                    <td style={{ padding: '1.5rem 1rem', textAlign: 'right', fontWeight: '800', fontSize: '1.1rem' }}>{successData.amount.toLocaleString()}</td>
                                </tr>
                                <tr style={{ background: 'var(--primary-dark)', color: 'white' }}>
                                    <td colSpan="2" style={{ padding: '1rem', textAlign: 'right', fontWeight: '700' }}>TOTAL RÉGLÉ</td>
                                    <td style={{ padding: '1rem', textAlign: 'right', fontWeight: '900', fontSize: '1.4rem' }}>{successData.amount.toLocaleString()}</td>
                                </tr>
                            </tbody>
                        </table>

                        {/* Recap / Balance */}
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '4rem' }}>
                            <div style={{ width: '300px', borderTop: '1px solid #eee', paddingTop: '1rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.95rem' }}>
                                    <span>Reste à payer après ce versement:</span>
                                    <span style={{ fontWeight: '800', color: successData.remaining > 0 ? 'var(--error)' : 'var(--success)' }}>
                                        {successData.remaining.toLocaleString()} FCFA
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Signatures */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4rem' }}>
                            <div style={{ textAlign: 'center', width: '200px' }}>
                                <div style={{ fontSize: '0.9rem', fontWeight: '700', marginBottom: '4rem', textDecoration: 'underline' }}>Le Parent / Tuteur</div>
                                <div style={{ borderTop: '1px dashed #ccc' }}></div>
                            </div>
                            <div style={{ textAlign: 'center', width: '200px' }}>
                                <div style={{ fontSize: '0.9rem', fontWeight: '700', marginBottom: '4rem', textDecoration: 'underline' }}>La Comptabilité / Cachet</div>
                                <div style={{ borderTop: '1px dashed #ccc' }}></div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div style={{ 
                            position: 'absolute', bottom: '20mm', left: '20mm', right: '20mm', 
                            textAlign: 'center', fontSize: '0.75rem', color: '#94a3b8',
                            borderTop: '1px solid #f1f5f9', paddingTop: '1rem'
                        }}>
                            Ce reçu est généré par EduSoft. Toute altération manuelle annule sa validité. 
                            Merci pour votre confiance.
                        </div>
                    </div>
                </div>
            )}


            {/* Global styles for components */}
            <style dangerouslySetInnerHTML={{
                __html: `
                .search-item:hover {
                    background-color: #f8fafc !important;
                }
                .spinner-small {
                    width: 20px;
                    height: 20px;
                    border: 2px solid #f3f3f3;
                    border-top: 2px solid var(--primary);
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                }
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `}} />
        </div>
    );
};

export default Payments;
