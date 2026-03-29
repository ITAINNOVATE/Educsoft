import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
    LogIn, 
    ShieldCheck, 
    AlertCircle, 
    Book, 
    GraduationCap, 
    Pencil, 
    Globe, 
    Archive, 
    ClipboardCheck, 
    Users, 
    CreditCard, 
    PieChart, 
    School, 
    FileText, 
    Smartphone,
    Mail,
    Phone,
    MapPin,
    Send,
    ChevronRight,
    Eye,
    EyeOff
} from 'lucide-react';
import logo from '../assets/logo.png';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [establishmentCode, setEstablishmentCode] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

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

    const features = [
        { icon: <GraduationCap size={28} />, title: "Gestion des Élèves", desc: "Inscriptions et dossiers complets avec suivi administratif.", color: "#e8f5e9", iconColor: "#2e7d32" },
        { icon: <CreditCard size={28} />, title: "Paiements & Scolarité", desc: "Facturation automatique et suivi des arriérés en temps réel.", color: "#e3f2fd", iconColor: "#1565c0" },
        { icon: <PieChart size={28} />, title: "Comptabilité Scolaire", desc: "Journaux de caisse, balance et états financiers de l'école.", color: "#fff3e0", iconColor: "#ef6c00" },
        { icon: <School size={28} />, title: "Classes & Pédagogie", desc: "Organisation des niveaux, effectifs et emplois du temps.", color: "#f3e5f5", iconColor: "#7b1fa2" },
        { icon: <FileText size={28} />, title: "Notes & Bulletins", desc: "Espace évaluations et génération automatique des relevés.", color: "#e0f2f1", iconColor: "#00695c" },
        { icon: <Smartphone size={28} />, title: "Portail Parent", desc: "Accès sécurisé pour le suivi des performances scolaires.", color: "#fce4ec", iconColor: "#c2185b" }
    ];

    return (
        <div style={{ backgroundColor: '#f8fafc', color: '#1e293b' }}>
            <style>{`
                @keyframes patternMove {
                    0% { background-position: 0 0; }
                    100% { background-position: 100px 100px; }
                }
                .hero-pattern {
                    background-image: url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 86c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zm66-3c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zm-46-45c.552 0 1-.448 1-1s-.448-1-1-1-1 .448-1 1 .448 1 1 1zm26 18c.552 0 1-.448 1-1s-.448-1-1-1-1 .448-1 1 .448 1 1 1z' fill='%230ea5e9' fill-opacity='0.05' fill-rule='evenodd'/%3E%3C/svg%3E");
                    animation: patternMove 60s linear infinite;
                }
                .feature-card:hover {
                    transform: translateY(-8px);
                    box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
                }
                .form-input-focus:focus {
                    border-color: var(--primary) !important;
                    box-shadow: 0 0 0 4px rgba(var(--primary-rgb), 0.1) !important;
                }
            `}</style>

            {/* SECTION 1: HERO & LOGIN */}
            <section className="hero-pattern" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '1.5rem 1rem' }}>
                <div style={{ textAlign: 'center', maxWidth: '800px', marginBottom: '1.5rem' }}>
                    <div className="fade-in" style={{ display: 'inline-flex', marginBottom: '1.5rem' }}>
                        <img src={logo} alt="EDUSOFT" style={{ height: '120px', width: 'auto' }} />
                    </div>
                    <h2 style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--primary)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.2em' }}>Intelligence Scolaire</h2>
                    <p style={{ fontSize: '1rem', color: '#64748b', lineHeight: '1.6', marginBottom: '1rem', maxWidth: '600px', margin: '0 auto' }}>
                        Propulsé par <strong>ITA INNOVATE</strong>. Gérez votre établissement avec une efficacité sans précédent : inscriptions, finances, pédagogie et communication.
                    </p>
                </div>

                {/* LOGIN CARD */}
                <div className="card fade-in" style={{ width: '100%', maxWidth: '450px', borderRadius: '32px', padding: '2rem 2.5rem', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.1)', background: 'white', border: '1px solid #f1f5f9' }}>
                    <h3 style={{ fontSize: '1.75rem', fontWeight: '800', marginBottom: '0.5rem', textAlign: 'center', color: 'var(--primary-dark)' }}>Connexion</h3>
                    <p style={{ fontSize: '0.95rem', color: '#94a3b8', textAlign: 'center', marginBottom: '1.5rem', fontWeight: '500' }}>Accédez à votre espace sécurisé.</p>

                    {error && (
                        <div className="shake" style={{ backgroundColor: '#fef2f2', color: '#991b1b', padding: '1rem', borderRadius: '16px', marginBottom: '2rem', display: 'flex', gap: '0.75rem', fontSize: '0.85rem', border: '1px solid #fee2e2', fontWeight: '600' }}>
                            <AlertCircle size={20} />
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div style={{ textAlign: 'left' }}>
                            <label className="form-label" style={{ marginBottom: '0.6rem' }}>Code Établissement</label>
                            <input
                                type="text"
                                className="form-input form-input-focus"
                                placeholder="EX: ITA2025"
                                value={establishmentCode}
                                onChange={(e) => setEstablishmentCode(e.target.value)}
                                style={{ height: '52px', fontSize: '1rem', fontWeight: '700', letterSpacing: '1px' }}
                                required
                            />
                        </div>
                        <div style={{ textAlign: 'left' }}>
                            <label className="form-label" style={{ marginBottom: '0.6rem' }}>Email professionnel</label>
                            <input
                                type="text"
                                className="form-input form-input-focus"
                                placeholder="votre@email.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                style={{ height: '52px', fontSize: '1rem' }}
                                required
                            />
                        </div>
                        <div style={{ textAlign: 'left' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                                <label className="form-label" style={{ margin: 0 }}>Mot de passe</label>
                            </div>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    className="form-input form-input-focus"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    style={{ height: '52px', paddingRight: '3.5rem', fontSize: '1rem' }}
                                    required
                                />
                                <div onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '1.25rem', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', color: '#94a3b8' }}>
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="btn btn-primary"
                            style={{ 
                                marginTop: '1rem',
                                height: '56px',
                                borderRadius: '18px',
                                fontSize: '1.1rem',
                                fontWeight: '800',
                                boxShadow: '0 10px 15px -3px rgba(var(--primary-rgb), 0.3)'
                            }}
                        >
                            {isLoading ? 'Identification...' : (
                                <>
                                    Se connecter <ChevronRight size={20} />
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </section>

            {/* SECTION 2: FEATURES */}
            <section style={{ backgroundColor: '#ffffff', padding: '6rem 1.5rem', borderTop: '1px solid #f1f5f9' }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto', textAlign: 'center' }}>
                    <h2 style={{ fontSize: '2.5rem', fontWeight: '900', color: 'var(--primary-dark)', marginBottom: '1.5rem', letterSpacing: '-0.02em' }}>Une Solution à 360°</h2>
                    <div style={{ width: '80px', height: '6px', background: 'var(--primary)', margin: '0 auto 4rem', borderRadius: '10px' }}></div>

                    <div className="grid-resp-3" style={{ gap: '2rem' }}>
                        {features.map((f, i) => (
                            <div key={i} className="feature-card" style={{ backgroundColor: '#f8fafc', padding: '3rem 2rem', borderRadius: '32px', textAlign: 'left', transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)', cursor: 'default', border: '1px solid #f1f5f9' }}>
                                <div style={{ width: '64px', height: '64px', backgroundColor: 'white', color: f.iconColor, borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '2rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                                    {f.icon}
                                </div>
                                <h3 style={{ fontSize: '1.3rem', fontWeight: '800', marginBottom: '1rem', color: 'var(--primary-dark)' }}>{f.title}</h3>
                                <p style={{ color: '#64748b', fontSize: '1rem', lineHeight: '1.7', marginBottom: '2rem' }}>{f.desc}</p>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)', fontWeight: '800', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                                    Découvrir <ChevronRight size={18} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* SECTION 3: CONTACT */}
            <section className="hero-pattern" style={{ padding: '6rem 1.5rem', backgroundColor: '#fdfdfd' }}>
                <div className="stack-on-mobile" style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', gap: '5rem', alignItems: 'center' }}>
                    
                    {/* INFO COLUMN */}
                    <div style={{ flex: 1, textAlign: 'left' }}>
                        <h2 style={{ fontSize: '2.5rem', fontWeight: '900', color: 'var(--primary-dark)', marginBottom: '1.5rem' }}>Besoin d'aide ?</h2>
                        <p style={{ color: '#64748b', fontSize: '1.1rem', lineHeight: '1.7', marginBottom: '3.5rem' }}>
                            Notre équipe technique est à votre disposition pour vous accompagner dans la prise en main d'<strong>EDUSOFT</strong>.
                        </p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                                <div style={{ width: '56px', height: '56px', backgroundColor: 'white', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', color: 'var(--primary)' }}>
                                    <Mail size={24} />
                                </div>
                                <div>
                                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Email Support</div>
                                    <div style={{ fontSize: '1.1rem', color: 'var(--primary-dark)', fontWeight: '700' }}>groupita25@gmail.com</div>
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                                <div style={{ width: '56px', height: '56px', backgroundColor: 'white', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', color: 'var(--primary)' }}>
                                    <Phone size={24} />
                                </div>
                                <div>
                                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Assistance Directe</div>
                                    <div style={{ fontSize: '1.1rem', color: 'var(--primary-dark)', fontWeight: '700' }}>(+229) 01 52 81 81 00</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* FORM COLUMN */}
                    <div className="card" style={{ flex: 1.2, padding: '3.5rem 3rem', borderRadius: '40px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.05)', background: 'white' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
                            <div style={{ textAlign: 'left' }}>
                                <label className="form-label">Nom Complet</label>
                                <input
                                    type="text"
                                    className="form-input form-input-focus"
                                    placeholder="Ex: Jean Dupont"
                                    style={{ height: '52px' }}
                                />
                            </div>
                            <div style={{ textAlign: 'left' }}>
                                <label className="form-label">Votre Email</label>
                                <input
                                    type="email"
                                    className="form-input form-input-focus"
                                    placeholder="votre@email.com"
                                    style={{ height: '52px' }}
                                />
                            </div>
                            <div style={{ textAlign: 'left' }}>
                                <label className="form-label">Message</label>
                                <textarea
                                    className="form-input form-input-focus"
                                    rows="4"
                                    placeholder="Comment pouvons-nous vous aider ?"
                                    style={{ padding: '1rem', resize: 'none' }}
                                ></textarea>
                            </div>
                            <button className="btn btn-primary" style={{ height: '56px', borderRadius: '18px', fontWeight: '800' }}>
                                <Send size={20} style={{ marginRight: '0.75rem' }} /> Envoyer
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* FOOTER */}
            <footer style={{ backgroundColor: 'var(--primary-dark)', color: 'rgba(255,255,255,0.5)', padding: '3rem 1.5rem', textAlign: 'center', fontSize: '0.9rem' }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                    <div style={{ color: 'white', fontWeight: '800', marginBottom: '0.5rem', fontSize: '1.1rem' }}>EDUSOFT</div>
                    <div style={{ marginBottom: '1.5rem' }}>© 2026 ITA INNOVATE - Tous droits réservés</div>
                    <div style={{ fontSize: '0.75rem', maxWidth: '400px', margin: '0 auto', lineHeight: '1.6' }}>
                        Solution de Gestion Scolaire Intégrée v1.5.0. Conçu pour l'excellence académique et la transparence administrative.
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Login;
