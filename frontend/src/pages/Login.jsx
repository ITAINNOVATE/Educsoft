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
        <div style={{ backgroundColor: '#e0f7fa', color: '#37474f' }}>
            <style>{`
                @keyframes patternMove {
                    0% { background-position: 0 0; }
                    100% { background-position: 100px 100px; }
                }
                .hero-pattern {
                    background-image: url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 86c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zm66-3c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zm-46-45c.552 0 1-.448 1-1s-.448-1-1-1-1 .448-1 1 .448 1 1 1zm26 18c.552 0 1-.448 1-1s-.448-1-1-1-1 .448-1 1 .448 1 1 1z' fill='%2300acc1' fill-opacity='0.08' fill-rule='evenodd'/%3E%3C/svg%3E");
                    animation: patternMove 60s linear infinite;
                }
                .feature-card:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 12px 20px rgba(0,0,0,0.1);
                }
                .form-input-focus:focus {
                    border-color: #00796b !important;
                    box-shadow: 0 0 0 3px rgba(0, 121, 107, 0.1) !important;
                }
            `}</style>

            {/* SECTION 1: HERO & LOGIN */}
            <section className="hero-pattern" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '4rem 2rem' }}>
                <div style={{ textAlign: 'center', maxWidth: '800px', marginBottom: '3rem' }}>
                    <div style={{ display: 'inline-flex', padding: '1rem', backgroundColor: 'white', borderRadius: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', marginBottom: '1.5rem' }}>
                        <ShieldCheck size={48} color="#00796b" />
                    </div>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: '900', color: '#004d40', marginBottom: '0.5rem', letterSpacing: '-1px' }}>EDUSOFT</h1>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#00796b', marginBottom: '1.5rem', textTransform: 'uppercase', letterSpacing: '2px' }}>Gestion Scolaire Intégrée</h2>
                    <p style={{ fontSize: '1.1rem', color: '#455a64', lineHeight: '1.6', marginBottom: '3rem' }}>
                        EDUSOFT est une solution numérique complète développée par <strong>ITA INNOVATE</strong>, permettant de centraliser et d'optimiser la gestion de votre école : de l'inscription à la comptabilité, en passant par les bulletins et le suivi pédagogique.
                    </p>
                </div>

                {/* LOGIN CARD */}
                <div style={{ width: '100%', maxWidth: '440px', backgroundColor: 'white', borderRadius: '24px', padding: '2.5rem', boxShadow: '0 20px 40px rgba(0,0,0,0.08)', position: 'relative' }}>
                    <h3 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '0.5rem', textAlign: 'center' }}>Connexion</h3>
                    <p style={{ fontSize: '0.875rem', color: '#78909c', textAlign: 'center', marginBottom: '2rem' }}>Entrez le code de votre établissement et vos identifiants.</p>

                    {error && (
                        <div style={{ backgroundColor: '#ffebee', color: '#c62828', padding: '1rem', borderRadius: '12px', marginBottom: '1.5rem', display: 'flex', gap: '0.75rem', fontSize: '0.875rem' }}>
                            <AlertCircle size={20} />
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        <div style={{ textAlign: 'left' }}>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', marginBottom: '0.5rem', color: '#546e7a' }}>Code Établissement *</label>
                            <input
                                type="text"
                                className="form-input-focus"
                                placeholder="EX: ITA2025"
                                value={establishmentCode}
                                onChange={(e) => setEstablishmentCode(e.target.value)}
                                style={{ width: '100%', padding: '0.8rem 1rem', borderRadius: '10px', border: '1px solid #cfd8dc', outline: 'none', transition: 'all 0.2s' }}
                                required
                            />
                        </div>
                        <div style={{ textAlign: 'left' }}>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', marginBottom: '0.5rem', color: '#546e7a' }}>Email professionnel *</label>
                            <input
                                type="text"
                                className="form-input-focus"
                                placeholder="votre@email.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                style={{ width: '100%', padding: '0.8rem 1rem', borderRadius: '10px', border: '1px solid #cfd8dc', outline: 'none', transition: 'all 0.2s' }}
                                required
                            />
                        </div>
                        <div style={{ textAlign: 'left', position: 'relative' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                <label style={{ fontSize: '0.85rem', fontWeight: '700', color: '#546e7a' }}>Mot de passe *</label>
                                <span style={{ fontSize: '0.75rem', color: '#00796b', fontWeight: '600', cursor: 'pointer' }}>Oublié ?</span>
                            </div>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    className="form-input-focus"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    style={{ width: '100%', padding: '0.8rem 1rem', paddingRight: '3rem', borderRadius: '10px', border: '1px solid #cfd8dc', outline: 'none', transition: 'all 0.2s' }}
                                    required
                                />
                                <div onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', color: '#90a4ae' }}>
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            style={{ 
                                marginTop: '1rem',
                                padding: '1rem',
                                borderRadius: '12px',
                                border: 'none',
                                background: 'linear-gradient(90deg, #00796b 0%, #00acc1 100%)',
                                color: 'white',
                                fontWeight: '700',
                                fontSize: '1rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.75rem',
                                transition: 'transform 0.2s, opacity 0.2s',
                                boxShadow: '0 4px 12px rgba(0, 121, 107, 0.3)'
                            }}
                            onMouseEnter={(e) => e.target.style.opacity = '0.9'}
                            onMouseLeave={(e) => e.target.style.opacity = '1'}
                        >
                            {isLoading ? 'Identification...' : (
                                <>
                                    <Send size={20} />
                                    Se connecter
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </section>

            {/* SECTION 2: FEATURES */}
            <section style={{ backgroundColor: '#f5f7f8', padding: '6rem 2rem' }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto', textAlign: 'center' }}>
                    <h2 style={{ fontSize: '2.5rem', fontWeight: '900', color: '#004d40', marginBottom: '1.5rem' }}>Fonctionnalités Principales</h2>
                    <div style={{ width: '60px', height: '5px', background: 'linear-gradient(90deg, #0288d1 0%, #26a69a 100%)', margin: '0 auto 4rem', borderRadius: '5px' }}></div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2rem' }}>
                        {features.map((f, i) => (
                            <div key={i} className="feature-card" style={{ backgroundColor: 'white', padding: '2.5rem', borderRadius: '24px', textAlign: 'left', transition: 'all 0.3s ease', cursor: 'default' }}>
                                <div style={{ width: '60px', height: '60px', backgroundColor: f.color, color: f.iconColor, borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
                                    {f.icon}
                                </div>
                                <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '1rem', color: '#263238' }}>{f.title}</h3>
                                <p style={{ color: '#607d8b', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '1.5rem' }}>{f.desc}</p>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#00796b', fontWeight: '700', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px', cursor: 'pointer' }}>
                                    En savoir plus <ChevronRight size={16} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* SECTION 3: CONTACT */}
            <section className="hero-pattern" style={{ padding: '6rem 2rem' }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '4rem', alignItems: 'center' }}>
                    
                    {/* INFO COLUMN */}
                    <div style={{ textAlign: 'left' }}>
                        <h2 style={{ fontSize: '2.5rem', fontWeight: '900', color: '#004d40', marginBottom: '1.5rem' }}>Contactez-nous</h2>
                        <p style={{ color: '#546e7a', fontSize: '1.1rem', lineHeight: '1.6', marginBottom: '3rem' }}>
                            Avez-vous des questions ou des suggestions ? Nous serions ravis d'avoir de vos nouvelles. 
                            Votre feedback nous aide à améliorer continuellement <strong>EDUSOFT</strong>.
                        </p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                                <div style={{ width: '50px', height: '50px', backgroundColor: 'white', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }}>
                                    <Mail color="#00acc1" />
                                </div>
                                <div>
                                    <div style={{ fontSize: '0.7rem', color: '#90a4ae', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px' }}>Email</div>
                                    <div style={{ fontSize: '1.1rem', color: '#37474f', fontWeight: '600' }}>groupita25@gmail.com</div>
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                                <div style={{ width: '50px', height: '50px', backgroundColor: 'white', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }}>
                                    <Phone color="#00acc1" />
                                </div>
                                <div>
                                    <div style={{ fontSize: '0.7rem', color: '#90a4ae', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px' }}>Téléphone</div>
                                    <div style={{ fontSize: '1.1rem', color: '#37474f', fontWeight: '600' }}>(00229) 0152818100</div>
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                                <div style={{ width: '50px', height: '50px', backgroundColor: 'white', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }}>
                                    <MapPin color="#00acc1" />
                                </div>
                                <div>
                                    <div style={{ fontSize: '0.7rem', color: '#90a4ae', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px' }}>Adresse</div>
                                    <div style={{ fontSize: '1.1rem', color: '#37474f', fontWeight: '600' }}>Parakou, Bénin</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* FORM COLUMN */}
                    <div style={{ backgroundColor: 'white', padding: '3rem', borderRadius: '32px', boxShadow: '0 20px 40px rgba(0,0,0,0.06)' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <div style={{ textAlign: 'left' }}>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', marginBottom: '0.5rem', color: '#546e7a' }}>Nom *</label>
                                <input
                                    type="text"
                                    className="form-input-focus"
                                    placeholder="Votre nom complet"
                                    style={{ width: '100%', padding: '0.8rem 1rem', borderRadius: '10px', border: '1px solid #cfd8dc', outline: 'none' }}
                                />
                            </div>
                            <div style={{ textAlign: 'left' }}>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', marginBottom: '0.5rem', color: '#546e7a' }}>Email *</label>
                                <input
                                    type="email"
                                    className="form-input-focus"
                                    placeholder="votre@email.com"
                                    style={{ width: '100%', padding: '0.8rem 1rem', borderRadius: '10px', border: '1px solid #cfd8dc', outline: 'none' }}
                                />
                            </div>
                            <div style={{ textAlign: 'left' }}>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', marginBottom: '0.5rem', color: '#546e7a' }}>Message *</label>
                                <textarea
                                    className="form-input-focus"
                                    rows="4"
                                    placeholder="Comment pouvons-nous vous aider ?"
                                    style={{ width: '100%', padding: '0.8rem 1rem', borderRadius: '10px', border: '1px solid #cfd8dc', outline: 'none', resize: 'none' }}
                                ></textarea>
                            </div>
                            <button
                                style={{ 
                                    padding: '1rem',
                                    borderRadius: '12px',
                                    border: 'none',
                                    background: 'linear-gradient(90deg, #0072ff 0%, #00c6ff 100%)',
                                    color: 'white',
                                    fontWeight: '700',
                                    fontSize: '1rem',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '0.75rem',
                                    boxShadow: '0 10px 20px rgba(0, 114, 255, 0.2)'
                                }}
                            >
                                <Send size={20} />
                                Envoyer le message
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* FOOTER */}
            <footer style={{ backgroundColor: '#004d40', color: 'rgba(255,255,255,0.6)', padding: '2rem', textAlign: 'center', fontSize: '0.8rem' }}>
                <div style={{ marginBottom: '0.5rem' }}>© 2026 EDUSOFT - Produit d'ITA INNOVATE</div>
                <div>Plateforme de Gestion Scolaire Intégrée Multi-Établissements • v1.5.0</div>
            </footer>
        </div>
    );
};

export default Login;
