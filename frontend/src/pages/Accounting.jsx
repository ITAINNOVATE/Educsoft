import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import config from '../config';
import {
    TrendingUp,
    AlertTriangle,
    Download,
    FileText,
    Search,
    Filter,
    ArrowUpRight,
    CheckCircle,
    Eye,
    Printer,
    X,
    Calendar,
    BookOpen,
    User,
    FileSpreadsheet
} from 'lucide-react';

const Accounting = () => {
    const [stats, setStats] = useState(null);
    const [debts, setDebts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const { user } = useAuth();
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    const [viewMode, setViewMode] = useState('DEBTS'); // DEBTS or JOURNAL
    const [journalData, setJournalData] = useState([]);
    const [showInvoice, setShowInvoice] = useState(false);
    const [selectedPayment, setSelectedPayment] = useState(null);
    const [classes, setClasses] = useState([]);
    const [filterClass, setFilterClass] = useState('');
    const [isExporting, setIsExporting] = useState(false);
    
    // Pagination states
    const [debtPage, setDebtPage] = useState(1);
    const [journalPage, setJournalPage] = useState(1);
    const [debtPagination, setDebtPagination] = useState({ total: 0, pages: 0 });
    const [journalPagination, setJournalPagination] = useState({ total: 0, pages: 0 });
    const [hasMoreDebts, setHasMoreDebts] = useState(false);
    const [hasMoreJournal, setHasMoreJournal] = useState(false);

    const API_BASE = `${config.API_URL}/accounting`;
    const PAYMENTS_API = `${config.API_URL}/payments`;

    useEffect(() => {
        if (user?.token) {
            fetchStats();
            fetchDebts(1, true);
            fetchJournal(1, true);
        }
    }, [user, dateRange, filterClass]);

    // Debounced search for debts
    useEffect(() => {
        const handler = setTimeout(() => {
            if (user?.token) fetchDebts(1, true);
        }, 500);
        return () => clearTimeout(handler);
    }, [searchTerm]);

    useEffect(() => {
        if (user?.token) {
            fetchClasses();
        }
    }, [user]);

    const fetchClasses = async () => {
        try {
            const res = await axios.get(`${config.API_URL}/config/classes`, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            setClasses(res.data);
        } catch (error) {
            console.error('Error fetching classes:', error);
        }
    };

    const fetchStats = async () => {
        try {
            const authHeader = { headers: { Authorization: `Bearer ${user.token}` } };
            let query = '';
            if (dateRange.start && dateRange.end) {
                query = `?startDate=${dateRange.start}&endDate=${dateRange.end}`;
            }
            const res = await axios.get(`${API_BASE}/stats${query}`, authHeader);
            setStats(res.data);
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    const fetchDebts = async (pageNum = 1, reset = false) => {
        try {
            if (reset) setLoading(true);
            const authHeader = { headers: { Authorization: `Bearer ${user.token}` } };
            
            const res = await axios.get(`${API_BASE}/debts`, {
                ...authHeader,
                params: {
                    page: pageNum,
                    limit: 50,
                    classId: filterClass,
                    search: searchTerm
                }
            });

            const newStudents = res.data?.students || [];
            if (reset) {
                setDebts(newStudents);
            } else {
                setDebts(prev => [...(Array.isArray(prev) ? prev : []), ...newStudents]);
            }

            setDebtPagination(res.data?.pagination || { total: 0, pages: 0 });
            setDebtPage(pageNum);
            setHasMoreDebts(pageNum < (res.data?.pagination?.pages || 0));
        } catch (error) {
            console.error('Error fetching debts:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchJournal = async (pageNum = 1, reset = false) => {
        try {
            if (reset) setLoading(true);
            const authHeader = { headers: { Authorization: `Bearer ${user.token}` } };
            
            const params = {
                page: pageNum,
                limit: 30
            };
            if (dateRange.start) params.startDate = dateRange.start;
            if (dateRange.end) params.endDate = dateRange.end;

            const res = await axios.get(`${PAYMENTS_API}`, {
                ...authHeader,
                params
            });

            const newPayments = res.data?.payments || [];
            if (reset) {
                setJournalData(newPayments);
            } else {
                setJournalData(prev => [...(Array.isArray(prev) ? prev : []), ...newPayments]);
            }

            setJournalPagination(res.data?.pagination || { total: 0, pages: 0 });
            setJournalPage(pageNum);
            setHasMoreJournal(pageNum < (res.data?.pagination?.pages || 0));
        } catch (error) {
            console.error('Error fetching journal:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleLoadMoreDebts = () => {
        if (!loading && hasMoreDebts) {
            fetchDebts(debtPage + 1);
        }
    };

    const handleLoadMoreJournal = () => {
        if (!loading && hasMoreJournal) {
            fetchJournal(journalPage + 1);
        }
    };

    const handleExportExcel = async () => {
        try {
            setIsExporting(true);
            const params = new URLSearchParams();
            if (filterClass) params.append('classId', filterClass);
            if (searchTerm) params.append('search', searchTerm);

            const response = await axios.get(`${API_BASE}/debts/export?${params.toString()}`, {
                headers: { Authorization: `Bearer ${user.token}` },
                responseType: 'blob'
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Impayes_${new Date().toISOString().split('T')[0]}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error('Excel Export Error:', error);
            alert('Erreur lors de l\'exportation Excel.');
        } finally {
            setIsExporting(false);
        }
    };

    const handleExport = async () => {
        try {
            setLoading(true);
            let query = '';
            if (dateRange.start && dateRange.end) {
                query = `?startDate=${dateRange.start}&endDate=${dateRange.end}`;
            }

            const response = await axios.get(`${API_BASE}/report${query}`, {
                headers: { Authorization: `Bearer ${user.token}` },
                responseType: 'blob' // Important for binary data
            });

            // Create a link to download the file
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Rapport_Comptable_${new Date().toISOString().split('T')[0]}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error('Error exporting report:', error);
            alert('Erreur lors de l\'exportation du rapport.');
        } finally {
            setLoading(false);
        }
    };

    // ... existing filter logic ...

    const safeDebts = Array.isArray(debts) ? debts : [];
    const totalDebt = safeDebts.reduce((acc, curr) => acc + (curr.balance || 0), 0);

    const displayedDebts = safeDebts;
    const displayedJournal = Array.isArray(journalData) ? journalData : [];

    const handleViewInvoice = (p) => {
        // Calculate balance for the invoice
        const enrollment = p.student.enrollments[0];
        const fees = enrollment?.class?.fees || [];
        const payments = p.student.payments || [];
        
        // Use the same balance calculation logic
        const totalPaid = payments.reduce((acc, curr) => acc + curr.amount, 0);
        const totalDue = fees.reduce((acc, curr) => acc + curr.amount, 0);
        const remaining = totalDue - totalPaid;

        setSelectedPayment({
            id: p.id,
            amount: p.amount,
            studentName: `${p.student.firstName} ${p.student.lastName}`,
            studentClass: enrollment?.class?.name || 'N/A',
            studentReg: p.student.regNumber,
            receiptNumber: p.receiptNumber,
            feeName: p.feeName,
            paymentDate: p.paymentDate,
            method: p.method,
            notes: p.notes,
            remaining: remaining
        });
        setShowInvoice(true);
    };

    if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><div className="spinner"></div></div>;

    return (
        <div style={{ padding: '1rem', maxWidth: '1200px', margin: '0 auto' }}>
            <header className="stack-on-mobile" style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1.5rem' }}>
                <div>
                    <h1 style={{ fontSize: '2.2rem', color: 'var(--primary-dark)', fontWeight: '800', margin: 0 }}>Comptabilité</h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>Suivi financier, recettes et gestion des arriérés.</p>
                </div>

                <div className="stack-on-mobile" style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', width: 'auto' }}>
                    <div style={{ display: 'flex', background: '#f1f5f9', padding: '0.25rem', borderRadius: '10px', width: '100%' }}>
                        <button 
                            onClick={() => setViewMode('DEBTS')}
                            style={{ 
                                flex: 1, padding: '0.5rem', borderRadius: '8px', border: 'none', cursor: 'pointer',
                                background: viewMode === 'DEBTS' ? 'white' : 'transparent',
                                color: viewMode === 'DEBTS' ? 'var(--primary-dark)' : '#64748b',
                                fontWeight: '700', boxShadow: viewMode === 'DEBTS' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
                                fontSize: '0.85rem'
                            }}
                        >
                            Impayés
                        </button>
                        <button 
                            onClick={() => setViewMode('JOURNAL')}
                            style={{ 
                                flex: 1, padding: '0.5rem', borderRadius: '8px', border: 'none', cursor: 'pointer',
                                background: viewMode === 'JOURNAL' ? 'white' : 'transparent',
                                color: viewMode === 'JOURNAL' ? 'var(--primary-dark)' : '#64748b',
                                fontWeight: '700', boxShadow: viewMode === 'JOURNAL' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
                                fontSize: '0.85rem'
                            }}
                        >
                            Journal
                        </button>
                    </div>
                    <button onClick={handleExport} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', height: '42px', width: '100%', justifyContent: 'center' }}>
                        <Download size={18} /> Rapport
                    </button>
                </div>
            </header>

            {/* Date Filters Bar */}
            <div className="card stack-on-mobile" style={{ marginBottom: '2rem', padding: '1rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '0.5rem', flex: 1, width: '100%' }}>
                    <div style={{ flex: 1 }}>
                        <label style={{ fontSize: '0.7rem', fontWeight: '700', color: '#666', marginBottom: '0.2rem', display: 'block', textTransform: 'uppercase' }}>Début</label>
                        <input type="date" className="form-input" value={dateRange.start} onChange={e => setDateRange({ ...dateRange, start: e.target.value })} />
                    </div>
                    <div style={{ flex: 1 }}>
                        <label style={{ fontSize: '0.7rem', fontWeight: '700', color: '#666', marginBottom: '0.2rem', display: 'block', textTransform: 'uppercase' }}>Fin</label>
                        <input type="date" className="form-input" value={dateRange.end} onChange={e => setDateRange({ ...dateRange, end: e.target.value })} />
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', flex: 1, width: '100%' }}>
                    <div style={{ flex: 1 }}>
                        <label style={{ fontSize: '0.7rem', fontWeight: '700', color: '#666', marginBottom: '0.2rem', display: 'block', textTransform: 'uppercase' }}>Filtrer par Classe</label>
                        <select 
                            className="form-input" 
                            value={filterClass} 
                            onChange={(e) => setFilterClass(e.target.value)}
                            style={{ height: '42px' }}
                        >
                            <option value="">Toutes les classes</option>
                            {classes.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>
                </div>
                <div style={{ position: 'relative', flex: 1, width: '100%' }}>
                    <label style={{ fontSize: '0.7rem', fontWeight: '700', color: '#666', marginBottom: '0.2rem', display: 'block', textTransform: 'uppercase' }}>Recherche Directe</label>
                    <div style={{ position: 'relative' }}>
                        <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input
                            type="text"
                            placeholder="Nom, Matricule..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="form-input"
                            style={{ paddingLeft: '2.5rem', height: '42px' }}
                        />
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
                <StatCard
                    label="Recettes Totales"
                    value={`${(stats?.revenueTotal || 0).toLocaleString()} FCFA`}
                    icon={<TrendingUp color="#2e7d32" />}
                    color="#e8f5e9"
                />
                <StatCard
                    label="Total des Arriérés"
                    value={`${totalDebt.toLocaleString()} FCFA`}
                    icon={<AlertTriangle color="#c62828" />}
                    color="#ffebee"
                />
                <StatCard
                    label="Recettes ce Mois"
                    value={`${(stats?.revenueMonth || 0).toLocaleString()} FCFA`}
                    icon={<TrendingUp color="#1565c0" />}
                    color="#e3f2fd"
                />
                <StatCard
                    label="Taux de Recouvrement"
                    value={`${stats?.revenueTotal ? Math.round((stats.revenueTotal / (stats.revenueTotal + totalDebt)) * 100) : 0}%`}
                    icon={<CheckCircle color="#6a1b9a" />}
                    color="#f3e5f5"
                />
            </div>

            {/* Main Content Table (Debts or Journal) */}
            <section className="card" style={{ padding: '0' }}>
                <div style={{ padding: '1.5rem', borderBottom: '1px solid #eee' }}>
                    <h2 style={{ fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                        {viewMode === 'DEBTS' ? (
                            <><AlertTriangle color="#c62828" size={18} /> Élèves en Arriérés</>
                        ) : (
                            <><FileText color="var(--primary)" size={18} /> Ledger de Caisse</>
                        )}
                    </h2>
                    {viewMode === 'DEBTS' && (
                        <button 
                            onClick={handleExportExcel}
                            disabled={isExporting}
                            className="btn" 
                            style={{ 
                                background: '#2e7d32', color: 'white', display: 'flex', 
                                alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', padding: '0.5rem 1rem' 
                            }}
                        >
                            {isExporting ? <div className="spinner-small"></div> : <><FileSpreadsheet size={16} /> Exporter Excel</>}
                        </button>
                    )}
                </div>

                <div className="table-container">
                    {viewMode === 'DEBTS' ? (
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ textAlign: 'left', borderBottom: '2px solid #eee', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                                    <th style={{ padding: '1rem' }}>Matricule</th>
                                    <th style={{ padding: '1rem' }}>Élève</th>
                                    <th style={{ padding: '1rem' }}>Classe</th>
                                    <th style={{ padding: '1rem' }}>Total Frais</th>
                                    <th style={{ padding: '1rem' }}>Payé</th>
                                    <th style={{ padding: '1rem' }}>Reste à Payer</th>
                                    <th style={{ padding: '1rem' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {displayedDebts.map(debt => (
                                        <tr key={debt.id} style={{ borderBottom: '1px solid #f9f9f9', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.backgroundColor = '#fcfcfc'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                                            <td style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>{debt.regNumber || '---'}</td>
                                            <td style={{ padding: '1rem', fontWeight: '500' }}>{debt.name || 'Inconnu'}</td>
                                            <td style={{ padding: '1rem' }}>{debt.className || '---'}</td>
                                            <td style={{ padding: '1rem' }}>{(debt.totalFees || 0).toLocaleString()}</td>
                                            <td style={{ padding: '1rem', color: '#2e7d32' }}>{(debt.paid || 0).toLocaleString()}</td>
                                            <td style={{ padding: '1rem' }}>
                                                <div style={{ color: 'var(--error)', fontWeight: 'bold' }}>{(debt.balance || 0).toLocaleString()}</div>
                                                <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
                                                    {(debt.breakdown?.obligatory > 0) && (
                                                        <span title="Obligatoire" style={{ padding: '2px 6px', background: '#ffebee', color: '#c62828', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 'bold' }}>
                                                            OBL: {(debt.breakdown.obligatory || 0).toLocaleString()}
                                                        </span>
                                                    )}
                                                    {(debt.breakdown?.optional > 0) && (
                                                        <span title="Optionnel" style={{ padding: '2px 6px', background: '#fff3e0', color: '#ef6c00', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 'bold' }}>
                                                            OPT: {(debt.breakdown.optional || 0).toLocaleString()}
                                                        </span>
                                                    )}
                                                    {(debt.breakdown?.occasional > 0) && (
                                                        <span title="Occasionnel" style={{ padding: '2px 6px', background: '#f5f5f5', color: '#616161', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 'bold' }}>
                                                            OCC: {(debt.breakdown.occasional || 0).toLocaleString()}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                        <td style={{ padding: '1rem' }}>
                                            <button style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                <FileText size={16} /> Relancer
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ textAlign: 'left', borderBottom: '2px solid #eee', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                                    <th style={{ padding: '1rem' }}>Date</th>
                                    <th style={{ padding: '1rem' }}>Reçu</th>
                                    <th style={{ padding: '1rem' }}>Élève</th>
                                    <th style={{ padding: '1rem' }}>Libellé</th>
                                    <th style={{ padding: '1rem' }}>Montant</th>
                                    <th style={{ padding: '1rem' }}>Mode</th>
                                    <th style={{ padding: '1rem' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {displayedJournal.map(p => (
                                    <tr key={p.id} style={{ borderBottom: '1px solid #f9f9f9', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.backgroundColor = '#fcfcfc'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                                        <td style={{ padding: '1rem', fontSize: '0.85rem' }}>{p.paymentDate ? new Date(p.paymentDate).toLocaleDateString('fr-FR') : '---'}</td>
                                        <td style={{ padding: '1rem', fontWeight: '700', color: 'var(--primary-dark)' }}>{p.receiptNumber || '---'}</td>
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ fontWeight: '500' }}>{p.student?.lastName || '---'} {p.student?.firstName || ''}</div>
                                            <div style={{ fontSize: '0.75rem', color: '#666' }}>{p.student?.regNumber || '---'}</div>
                                        </td>
                                        <td style={{ padding: '1rem', fontSize: '0.9rem' }}>{p.feeName || '---'}</td>
                                        <td style={{ padding: '1rem', fontWeight: '800' }}>{(p.amount || 0).toLocaleString()}</td>
                                        <td style={{ padding: '1rem' }}>
                                            <span style={{ padding: '4px 8px', background: '#f0f4f8', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '600' }}>
                                                {p.method || '---'}
                                            </span>
                                        </td>
                                        <td style={{ padding: '0.5rem 1rem' }}>
                                            <div style={{ display: 'flex', gap: '10px' }}>
                                                <button 
                                                    onClick={() => handleViewInvoice(p)}
                                                    title="Voir détail / Reçu"
                                                    style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', padding: '5px' }}
                                                >
                                                    <Eye size={18} />
                                                </button>
                                                <button 
                                                    onClick={() => handleViewInvoice(p)} // Reusing the same modal for printing
                                                    title="Imprimer"
                                                    style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: '5px' }}
                                                >
                                                    <Printer size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                    {((viewMode === 'DEBTS' && displayedDebts.length === 0) || (viewMode === 'JOURNAL' && displayedJournal.length === 0)) && !loading && (
                        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                            {searchTerm ? 'Aucun résultat pour cette recherche.' : 'Aucun enregistrement disponible.'}
                        </div>
                    )}
                    
                    {viewMode === 'DEBTS' && hasMoreDebts && (
                        <div style={{ textAlign: 'center', padding: '1.5rem', borderTop: '1px solid #eee' }}>
                            <button className="btn" onClick={handleLoadMoreDebts} disabled={loading} style={{ background: '#f1f5f9', color: 'var(--primary)', fontWeight: '700' }}>
                                {loading ? 'Chargement...' : 'Charger plus d\'arriérés'}
                            </button>
                        </div>
                    )}

                    {viewMode === 'JOURNAL' && hasMoreJournal && (
                        <div style={{ textAlign: 'center', padding: '1.5rem', borderTop: '1px solid #eee' }}>
                            <button className="btn" onClick={handleLoadMoreJournal} disabled={loading} style={{ background: '#f1f5f9', color: 'var(--primary)', fontWeight: '700' }}>
                                {loading ? 'Chargement...' : 'Charger plus d\'entrées'}
                            </button>
                        </div>
                    )}
                </div>
            </section>

            {/* INVOICE VISUALIZATION MODAL (A4) */}
            {showInvoice && selectedPayment && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', 
                    zIndex: 2000, overflowY: 'auto', padding: '2rem 0'
                }}>
                    <div className="no-print" style={{ 
                        width: '210mm', display: 'flex', justifyContent: 'space-between', 
                        marginBottom: '1rem', alignItems: 'center' 
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
                                        <img src={user.establishmentInfo.logoUrl} alt="Logo" style={{ maxHeight: '100px', maxWidth: '200px', objectFit: 'contain' }} />
                                    </div>
                                ) : (
                                    <div style={{ 
                                        width: '120px', height: '120px', border: '2px dashed #ddd', 
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', 
                                        borderRadius: '8px', color: '#999', fontSize: '0.8rem',
                                        marginBottom: '1rem', background: '#fcfcfc'
                                    }}>
                                        LOGO ÉCOLE
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
                                    <div style={{ fontSize: '1.5rem', fontWeight: '900', color: 'var(--primary-dark)' }}>N° {selectedPayment?.receiptNumber || '---'}</div>
                                    <div style={{ fontSize: '0.9rem', color: '#64748b', marginTop: '0.25rem' }}>Fait le: {selectedPayment?.paymentDate ? new Date(selectedPayment.paymentDate).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }) : '---'}</div>
                                </div>
                            </div>
                        </div>

                        {/* Student Info */}
                        <div style={{ marginBottom: '3rem', display: 'flex', gap: '2rem' }}>
                            <div style={{ flex: 1, padding: '1.5rem', background: '#fcfcfc', border: '1px solid #f1f5f9', borderRadius: '12px' }}>
                                <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: '800', textTransform: 'uppercase', marginBottom: '0.75rem' }}>Informations de l'Élève</div>
                                <div style={{ fontSize: '1.25rem', fontWeight: '800', marginBottom: '0.4rem' }}>{selectedPayment?.studentName || '---'}</div>
                                <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.95rem', color: '#444' }}>
                                    <span><strong>Matricule:</strong> {selectedPayment?.studentReg || '---'}</span>
                                    <span><strong>Classe:</strong> {selectedPayment.studentClass}</span>
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
                                        {selectedPayment?.feeName || '---'}
                                        {selectedPayment?.notes && <div style={{ fontSize: '0.8rem', fontStyle: 'italic', fontWeight: '400', color: '#666', marginTop: '0.4rem' }}>Note: {selectedPayment.notes}</div>}
                                    </td>
                                    <td style={{ padding: '1.5rem 1rem', textAlign: 'right' }}>{selectedPayment?.method || '---'}</td>
                                    <td style={{ padding: '1.5rem 1rem', textAlign: 'right', fontWeight: '800', fontSize: '1.1rem' }}>{(selectedPayment?.amount || 0).toLocaleString()}</td>
                                </tr>
                                <tr style={{ background: 'var(--primary-dark)', color: 'white' }}>
                                    <td colSpan="2" style={{ padding: '1rem', textAlign: 'right', fontWeight: '700' }}>TOTAL RÉGLÉ</td>
                                    <td style={{ padding: '1rem', textAlign: 'right', fontWeight: '900', fontSize: '1.4rem' }}>{selectedPayment.amount.toLocaleString()}</td>
                                </tr>
                            </tbody>
                        </table>

                        {/* Recap / Balance */}
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '4rem' }}>
                            <div style={{ width: '300px', borderTop: '1px solid #eee', paddingTop: '1rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.95rem' }}>
                                    <span>Reste à payer après ce versement:</span>
                                    <span style={{ fontWeight: '800', color: selectedPayment.remaining > 0 ? 'var(--error)' : 'var(--success)' }}>
                                        {selectedPayment.remaining.toLocaleString()} FCFA
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
        </div>
    );
};

const StatCard = ({ icon, label, value, color }) => (
    <div className="card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
        <div style={{ padding: '1rem', borderRadius: '12px', backgroundColor: color }}>{icon}</div>
        <div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{label}</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 'bold', marginTop: '0.25rem' }}>{value}</div>
        </div>
    </div>
);

export default Accounting;
