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
    User
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

    const API_BASE = `${config.API_URL}/accounting`;
    const PAYMENTS_API = `${config.API_URL}/payments`;

    useEffect(() => {
        if (user?.token) {
            fetchData();
        }
    }, [user, dateRange]); // Re-fetch when date range changes

    const fetchData = async () => {
        try {
            setLoading(true);
            const authHeader = { headers: { Authorization: `Bearer ${user.token}` } };
            let query = '';
            if (dateRange.start && dateRange.end) {
                query = `?startDate=${dateRange.start}&endDate=${dateRange.end}`;
            }

            const [statsRes, debtsRes, journalRes] = await Promise.all([
                axios.get(`${API_BASE}/stats${query}`, authHeader),
                axios.get(`${API_BASE}/debts`, authHeader),
                axios.get(`${PAYMENTS_API}${query}`, authHeader)
            ]);
            setStats(statsRes.data);
            setDebts(debtsRes.data);
            setJournalData(journalRes.data);
        } catch (error) {
            console.error('Error fetching accounting data:', error);
        } finally {
            setLoading(false);
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

    const totalDebt = debts.reduce((acc, curr) => acc + curr.balance, 0);

    const filteredJournal = journalData.filter(p =>
        p.student?.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.student?.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.receiptNumber.toLowerCase().includes(searchTerm.toLowerCase())
    );

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
        <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
            <header style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h1 style={{ fontSize: '2rem', color: 'var(--primary-dark)', fontWeight: '800' }}>Comptabilité</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Suivi financier, recettes et gestion des arriérés.</p>
                </div>

                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
                    <div style={{ display: 'flex', background: '#f1f5f9', padding: '0.25rem', borderRadius: '10px', marginRight: '1rem' }}>
                        <button 
                            onClick={() => setViewMode('DEBTS')}
                            style={{ 
                                padding: '0.5rem 1rem', borderRadius: '8px', border: 'none', cursor: 'pointer',
                                background: viewMode === 'DEBTS' ? 'white' : 'transparent',
                                color: viewMode === 'DEBTS' ? 'var(--primary-dark)' : '#64748b',
                                fontWeight: '700', boxShadow: viewMode === 'DEBTS' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
                                transition: 'all 0.2s'
                            }}
                        >
                            <AlertTriangle size={16} style={{ verticalAlign: 'middle', marginRight: '6px' }} /> Impayés
                        </button>
                        <button 
                            onClick={() => setViewMode('JOURNAL')}
                            style={{ 
                                padding: '0.5rem 1rem', borderRadius: '8px', border: 'none', cursor: 'pointer',
                                background: viewMode === 'JOURNAL' ? 'white' : 'transparent',
                                color: viewMode === 'JOURNAL' ? 'var(--primary-dark)' : '#64748b',
                                fontWeight: '700', boxShadow: viewMode === 'JOURNAL' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
                                transition: 'all 0.2s'
                            }}
                        >
                            <FileText size={16} style={{ verticalAlign: 'middle', marginRight: '6px' }} /> Journal de Caisse
                        </button>
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label style={{ fontSize: '0.75rem', fontWeight: '600', color: '#666', marginBottom: '0.25rem', display: 'block' }}>Du</label>
                        <input type="date" className="form-input" style={{ padding: '0.5rem' }} value={dateRange.start} onChange={e => setDateRange({ ...dateRange, start: e.target.value })} />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label style={{ fontSize: '0.75rem', fontWeight: '600', color: '#666', marginBottom: '0.25rem', display: 'block' }}>Au</label>
                        <input type="date" className="form-input" style={{ padding: '0.5rem' }} value={dateRange.end} onChange={e => setDateRange({ ...dateRange, end: e.target.value })} />
                    </div>
                    <button onClick={handleExport} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', height: '38px' }}>
                        <Download size={18} /> Exporter Rapport
                    </button>
                </div>
            </header>

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
            <section className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                    <h2 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {viewMode === 'DEBTS' ? (
                            <><AlertTriangle color="#c62828" size={20} /> Liste des Élèves Endettés</>
                        ) : (
                            <><FileText color="var(--primary)" size={20} /> Journal Historique des Recettes</>
                        )}
                    </h2>

                    <div style={{ position: 'relative' }}>
                        <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input
                            type="text"
                            placeholder={viewMode === 'DEBTS' ? "Rechercher un élève..." : "Rechercher un reçu ou élève..."}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{
                                padding: '0.6rem 1rem 0.6rem 2.5rem',
                                borderRadius: '8px',
                                border: '1px solid #ddd',
                                width: '300px',
                                outline: 'none'
                            }}
                        />
                    </div>
                </div>

                <div style={{ overflowX: 'auto' }}>
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
                                {debts.filter(debt => debt.name.toLowerCase().includes(searchTerm.toLowerCase())).map(debt => (
                                    <tr key={debt.id} style={{ borderBottom: '1px solid #f9f9f9', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.backgroundColor = '#fcfcfc'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                                        <td style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>{debt.regNumber}</td>
                                        <td style={{ padding: '1rem', fontWeight: '500' }}>{debt.name}</td>
                                        <td style={{ padding: '1rem' }}>{debt.className}</td>
                                        <td style={{ padding: '1rem' }}>{debt.totalFees.toLocaleString()}</td>
                                        <td style={{ padding: '1rem', color: '#2e7d32' }}>{debt.paid.toLocaleString()}</td>
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ color: 'var(--error)', fontWeight: 'bold' }}>{debt.balance.toLocaleString()}</div>
                                            <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
                                                {debt.breakdown.obligatory > 0 && (
                                                    <span title="Obligatoire" style={{ padding: '2px 6px', background: '#ffebee', color: '#c62828', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 'bold' }}>
                                                        OBL: {debt.breakdown.obligatory.toLocaleString()}
                                                    </span>
                                                )}
                                                {debt.breakdown.optional > 0 && (
                                                    <span title="Optionnel" style={{ padding: '2px 6px', background: '#fff3e0', color: '#ef6c00', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 'bold' }}>
                                                        OPT: {debt.breakdown.optional.toLocaleString()}
                                                    </span>
                                                )}
                                                {debt.breakdown.occasional > 0 && (
                                                    <span title="Occasionnel" style={{ padding: '2px 6px', background: '#f5f5f5', color: '#616161', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 'bold' }}>
                                                        OCC: {debt.breakdown.occasional.toLocaleString()}
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
                                {filteredJournal.map(p => (
                                    <tr key={p.id} style={{ borderBottom: '1px solid #f9f9f9', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.backgroundColor = '#fcfcfc'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                                        <td style={{ padding: '1rem', fontSize: '0.85rem' }}>{new Date(p.paymentDate).toLocaleDateString('fr-FR')}</td>
                                        <td style={{ padding: '1rem', fontWeight: '700', color: 'var(--primary-dark)' }}>{p.receiptNumber}</td>
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ fontWeight: '500' }}>{p.student.firstName} {p.student.lastName}</div>
                                            <div style={{ fontSize: '0.75rem', color: '#666' }}>{p.student.regNumber}</div>
                                        </td>
                                        <td style={{ padding: '1rem', fontSize: '0.9rem' }}>{p.feeName}</td>
                                        <td style={{ padding: '1rem', fontWeight: '800' }}>{p.amount.toLocaleString()}</td>
                                        <td style={{ padding: '1rem' }}>
                                            <span style={{ padding: '4px 8px', background: '#f0f4f8', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '600' }}>
                                                {p.method}
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
                    {((viewMode === 'DEBTS' && debts.length === 0) || (viewMode === 'JOURNAL' && filteredJournal.length === 0)) && (
                        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                            {searchTerm ? 'Aucun résultat pour cette recherche.' : 'Aucun enregistrement disponible.'}
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
                                    <div style={{ fontSize: '1.5rem', fontWeight: '900', color: 'var(--primary-dark)' }}>N° {selectedPayment.receiptNumber}</div>
                                    <div style={{ fontSize: '0.9rem', color: '#64748b', marginTop: '0.25rem' }}>Fait le: {new Date(selectedPayment.paymentDate).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
                                </div>
                            </div>
                        </div>

                        {/* Student Info */}
                        <div style={{ marginBottom: '3rem', display: 'flex', gap: '2rem' }}>
                            <div style={{ flex: 1, padding: '1.5rem', background: '#fcfcfc', border: '1px solid #f1f5f9', borderRadius: '12px' }}>
                                <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: '800', textTransform: 'uppercase', marginBottom: '0.75rem' }}>Informations de l'Élève</div>
                                <div style={{ fontSize: '1.25rem', fontWeight: '800', marginBottom: '0.4rem' }}>{selectedPayment.studentName}</div>
                                <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.95rem', color: '#444' }}>
                                    <span><strong>Matricule:</strong> {selectedPayment.studentReg}</span>
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
                                        {selectedPayment.feeName}
                                        {selectedPayment.notes && <div style={{ fontSize: '0.8rem', fontStyle: 'italic', fontWeight: '400', color: '#666', marginTop: '0.4rem' }}>Note: {selectedPayment.notes}</div>}
                                    </td>
                                    <td style={{ padding: '1.5rem 1rem', textAlign: 'right' }}>{selectedPayment.method}</td>
                                    <td style={{ padding: '1.5rem 1rem', textAlign: 'right', fontWeight: '800', fontSize: '1.1rem' }}>{selectedPayment.amount.toLocaleString()}</td>
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
