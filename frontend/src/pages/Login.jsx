import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
    LogIn, 
    ShieldCheck, 
    AlertCircle, 
    GraduationCap, 
    BookOpen, 
    Users, 
    CreditCard, 
    PieChart, 
    Mail, 
    Phone, 
    MapPin, 
    Send,
    CheckCircle,
    ArrowRight
} from 'lucide-react';
import config from '../config';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [establishmentCode, setEstablishmentCode] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Contact Form State
    const [contactName, setContactName] = useState('');
    const [contactEmail, setContactEmail] = useState('');
    const [contactMessage, setContactMessage] = useState('');

    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        const result = await login(email, password, establishmentCode);
        if (result.success) {
            navigate('/dashboard');
        } else {
            const errorInfo = typeof result.error === 'object' ? JSON.stringify(result.error) : result.error;
            setError(result.message + (errorInfo ? ` (${errorInfo})` : ''));
        }
        setIsLoading(false);
    };

    const handleContactSubmit = (e) => {
        e.preventDefault();
        alert('Merci pour votre message ! Notre équipe vous contactera sous peu.');
        setContactName('');
        setContactEmail('');
        setContactMessage('');
    };

    return (
        <div className="landing-container" style={{ backgroundColor: '#f0f9ff' }}>
            <div className="icon-pattern"></div>

            {/* SECTION 1: HERO & LOGIN */}
            <section style={{ 
                minHeight: '100vh', 
                padding: '4rem 1rem', 
                position: 'relative', 
                zIndex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center'
            }}>
                <header style={{ textAlign: 'center', marginBottom: '3rem' }} className="animate-fade-in-down">
                    <div style={{ 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        gap: '0.75rem', 
                        marginBottom: '1.5rem',
                        padding: '0.5rem 1.25rem',
                        background: 'white',
                        borderRadius: '30px',
                        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
                    }}>
                        <GraduationCap size={32} color="var(--primary)" />
                        <span style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--primary)', letterSpacing: '-0.5px' }}>EDUSOFT</span>
                    </div>
                    
                    <h1 style={{ 
                        fontSize: 'clamp(2rem, 5vw, 3.5rem)', 
                        fontWeight: '900', 
                        color: 'var(--primary-dark)',
                        lineHeight: 1.1,
                        marginBottom: '1rem',
                        textTransform: 'uppercase'
                    }}>
                        Gestion Scolaire Intégrée
                    </h1>
                    
                    <p style={{ 
                        maxWidth: '800px', 
                        margin: '0 auto', 
                        fontSize: '1.125rem', 
                        color: 'var(--text-muted)',
                        lineHeight: 1.6
                    }}>
                        Une plateforme SAAS moderne conçue par <strong>ITA INNOVATE</strong> pour centraliser, 
                        sécuriser et optimiser la gestion administrative et pédagogique de votre établissement.
                    </p>
                </header>

                <div className="card" style={{ 
                    width: '100%', 
                    maxWidth: '450px', 
                    borderRadius: 'var(--radius-lg)',
                    boxShadow: 'var(--shadow-lg)',
                    padding: '2.5rem',
                    border: '1px solid rgba(255,255,255,0.5)',
                    background: 'rgba(255,255,255,0.95)',
                    backdropFilter: 'blur(10px)'
                }}>
                    <h2 style={{ fontSize: '1.75rem', fontWeight: '800', marginBottom: '0.5rem', color: 'var(--text-main)' }}>Connexion</h2>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', fontSize: '0.875rem' }}>
                        Entrez le code de votre établissement et vos identifiants.
                    </p>

                    {error && (
                        <div style={{
                            backgroundColor: '#fef2f2',
                            color: 'var(--error)',
                            padding: '1rem',
                            borderRadius: 'var(--radius)',
                            marginBottom: '1.5rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            fontSize: '0.875rem',
                            border: '1px solid #fee2e2'
                        }}>
                            <AlertCircle size={20} />
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} style={{ textAlign: 'left' }}>
                        <div className="form-group">
                            <label className="form-label" style={{ fontSize: '0.875rem', fontWeight: '600' }}>Code Établissement</label>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="EX: ITA-GROUPE"
                                value={establishmentCode}
                                onChange={(e) => setEstablishmentCode(e.target.value)}
                                style={{ background: '#f8fafc' }}
                                required
                            />
                        </div>
                        
                        <div className="form-group">
                            <label className="form-label" style={{ fontSize: '0.875rem', fontWeight: '600' }}>Email professionnel</label>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="votre@email.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                style={{ background: '#f8fafc' }}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                <label className="form-label" style={{ margin: 0, fontSize: '0.875rem', fontWeight: '600' }}>Mot de passe</label>
                                <a href="#" style={{ fontSize: '0.875rem', color: 'var(--primary)', textDecoration: 'none', fontWeight: '500' }}>Oublié ?</a>
                            </div>
                            <input
                                type="password"
                                className="form-input"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                style={{ background: '#f8fafc' }}
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary btn-block"
                            disabled={isLoading}
                            style={{ 
                                marginTop: '1rem', 
                                padding: '1rem', 
                                background: 'linear-gradient(90deg, var(--primary) 0%, var(--primary-light) 100%)',
                                borderRadius: 'var(--radius)',
                                boxShadow: '0 4px 12px rgba(0, 77, 64, 0.2)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.75rem',
                                color: 'white'
                            }}
                        >
                            {isLoading ? 'Connexion...' : (
                                <>
                                    <LogIn size={20} />
                                    <span>Se connecter</span>
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </section>

            {/* SECTION 2: FONCTIONNALITÉS */}
            <section style={{ padding: '6rem 1rem', background: 'white', position: 'relative', zIndex: 1 }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                    <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
                        <h2 style={{ fontSize: '2.5rem', fontWeight: '900', color: 'var(--text-main)', marginBottom: '1rem' }}>
                            Fonctionnalités <span style={{ color: 'var(--primary)' }}>Principales</span>
                        </h2>
                        <div style={{ width: '80px', height: '5px', background: 'var(--primary)', margin: '0 auto', borderRadius: '10px' }}></div>
                    </div>

                    <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', 
                        gap: '2.5rem' 
                    }}>
                        <FeatureCard 
                            icon={<Users size={28} color="#0284c7" />}
                            title="Gestion des Élèves"
                            desc="Dossier élève complet, suivi de l'assiduité, historique académique et gestion administrative centralisée."
                            bgColor="#e0f2fe"
                        />
                        <FeatureCard 
                            icon={<CreditCard size={28} color="#059669" />}
                            title="Paiements & Scolarité"
                            desc="Facturation automatique, encaissements sécurisés et suivi en temps réel des arriérés de paiement."
                            bgColor="#dcfce7"
                        />
                        <FeatureCard 
                            icon={<PieChart size={28} color="#7c3aed" />}
                            title="Comptabilité École"
                            desc="Suivi de la caisse, balance des comptes et états financiers précis pour une gestion saine."
                            bgColor="#f3e8ff"
                        />
                        <FeatureCard 
                            icon={<BookOpen size={28} color="#ea580c" />}
                            title="Gestion des Classes"
                            desc="Organisation par niveaux, gestion des effectifs et répartition pédagogique optimisée."
                            bgColor="#ffedd5"
                        />
                        <FeatureCard 
                            icon={<CheckCircle size={28} color="#db2777" />}
                            title="Notes & Bulletins"
                            desc="Saisie intuitive des évaluations, calcul automatique des moyennes et génération des bulletins."
                            bgColor="#fce7f3"
                        />
                        <FeatureCard 
                            icon={<ShieldCheck size={28} color="#2563eb" />}
                            title="Portail Sécurisé"
                            desc="Accès dédié pour chaque rôle (Admin, Comptable, Secrétaire) avec traçabilité complète."
                            bgColor="#dbeafe"
                        />
                    </div>
                </div>
            </section>

            {/* SECTION 3: CONTACT */}
            <section style={{ padding: '6rem 1rem', position: 'relative', zIndex: 1, background: '#f0f9ff' }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '4rem', alignItems: 'start' }}>
                    <div>
                        <h2 style={{ fontSize: '2.5rem', fontWeight: '900', marginBottom: '1.5rem', color: 'var(--primary-dark)' }}>Contactez-nous</h2>
                        <p style={{ fontSize: '1.125rem', color: 'var(--text-muted)', marginBottom: '3rem', lineHeight: 1.6 }}>
                            Avez-vous des questions ou des suggestions ? Nous serions ravis d'avoir de vos nouvelles. 
                            Votre feedback nous aide à améliorer continuellement <strong>EDUSOFT</strong>.
                        </p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                            <ContactInfo icon={<Mail color="var(--primary)" />} title="EMAIL" value="groupita25@gmail.com" />
                            <ContactInfo icon={<Phone color="var(--primary)" />} title="TÉLÉPHONE" value="(00229) 0152818100" />
                            <ContactInfo icon={<MapPin color="var(--primary)" />} title="ADRESSE" value="Parakou, Bénin" />
                        </div>
                    </div>

                    <div className="card" style={{ padding: '2.5rem', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-lg)' }}>
                        <form onSubmit={handleContactSubmit}>
                            <div className="form-group">
                                <label className="form-label" style={{ fontWeight: '600' }}>Nom *</label>
                                <input 
                                    type="text" 
                                    className="form-input" 
                                    placeholder="Votre nom complet" 
                                    value={contactName}
                                    onChange={(e) => setContactName(e.target.value)}
                                    required 
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label" style={{ fontWeight: '600' }}>Email *</label>
                                <input 
                                    type="email" 
                                    className="form-input" 
                                    placeholder="votre@email.com" 
                                    value={contactEmail}
                                    onChange={(e) => setContactEmail(e.target.value)}
                                    required 
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label" style={{ fontWeight: '600' }}>Message *</label>
                                <textarea 
                                    className="form-input" 
                                    placeholder="Comment pouvons-nous vous aider ?" 
                                    rows="4"
                                    value={contactMessage}
                                    onChange={(e) => setContactMessage(e.target.value)}
                                    required
                                    style={{ resize: 'vertical' }}
                                ></textarea>
                            </div>
                            <button className="btn btn-primary btn-block" style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center', 
                                gap: '0.75rem',
                                padding: '1rem',
                                background: 'linear-gradient(90deg, #2563eb 0%, #059669 100%)',
                                color: 'white'
                            }}>
                                <Send size={20} />
                                Envoyer le message
                            </button>
                        </form>
                    </div>
                </div>
            </section>

            <footer style={{ padding: '3rem 1rem', background: 'var(--primary-dark)', color: 'white', textAlign: 'center', position: 'relative', zIndex: 1 }}>
                <p style={{ opacity: 0.7, fontSize: '0.875rem' }}>
                    © {new Date().getFullYear()} EDUSOFT - Une solution logicielle par ITA INNOVATE. Tous droits réservés.
                </p>
            </footer>
        </div>
    );
};

const FeatureCard = ({ icon, title, desc, bgColor }) => (
    <div className="card feature-card" style={{ textAlign: 'left', padding: '2.5rem' }}>
        <div style={{ 
            width: '60px', 
            height: '60px', 
            borderRadius: '16px', 
            backgroundColor: bgColor, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            marginBottom: '1.5rem'
        }}>
            {icon}
        </div>
        <h3 style={{ fontSize: '1.25rem', fontWeight: '800', marginBottom: '1rem', color: 'var(--text-main)' }}>{title}</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>{desc}</p>
        <a href="#contact" style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '0.5rem', 
            color: 'var(--primary)', 
            textDecoration: 'none', 
            fontWeight: '700',
            fontSize: '0.875rem',
            textTransform: 'uppercase'
        }}>
            En savoir plus <ArrowRight size={16} />
        </a>
    </div>
);

const ContactInfo = ({ icon, title, value }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
        <div style={{ 
            width: '50px', 
            height: '50px', 
            borderRadius: '12px', 
            background: 'white', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            boxShadow: 'var(--shadow)'
        }}>
            {icon}
        </div>
        <div>
            <div style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', letterSpacing: '1px' }}>{title}</div>
            <div style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--text-main)' }}>{value}</div>
        </div>
    </div>
);

export default Login;
