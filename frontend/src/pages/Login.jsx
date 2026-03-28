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
  Layout, 
  FileText,
  ChevronRight,
  School
} from 'lucide-react';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [establishmentCode, setEstablishmentCode] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

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
      {
        icon: <Users size={28} color="#00796b" />,
        title: "Gestion des Élèves",
        desc: "Dossier scolaire complet, suivi de l'assiduité et historique administratif centralisé.",
        color: "#e0f2f1"
      },
      {
        icon: <CreditCard size={28} color="#1565c0" />,
        title: "Paiements & Scolarité",
        desc: "Gestion automatisée des frais, reçus numériques et suivi précis des arriérés.",
        color: "#e3f2fd"
      },
      {
        icon: <PieChart size={28} color="#2e7d32" />,
        title: "Comptabilité École",
        desc: "Suivi des caisses, balance des comptes et états financiers en temps réel.",
        color: "#e8f5e9"
      },
      {
        icon: <Layout size={28} color="#ef6c00" />,
        title: "Gestion des Classes",
        desc: "Organisation des niveaux, répartition des effectifs et emplois du temps.",
        color: "#fff3e0"
      },
      {
        icon: <FileText size={28} color="#c62828" />,
        title: "Notes & Bulletins",
        desc: "Saisie des évaluations, calcul automatique des moyennes et relevés personnalisés.",
        color: "#ffebee"
      },
      {
        icon: <School size={28} color="#6a1b9a" />,
        title: "Portail Parent",
        desc: "Accès sécurisé pour le suivi immédiat des notes et des paiements par les parents.",
        color: "#f3e5f5"
      }
    ];

    return (
        <div style={{
            minHeight: '100vh',
            backgroundColor: '#f4f9f9',
            fontFamily: 'Inter, system-ui, sans-serif',
            overflowX: 'hidden'
        }}>
            {/* HER0 & LOGIN SECTION */}
            <div style={{
                position: 'relative',
                minHeight: '100vh',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: '4rem 1rem',
                background: 'radial-gradient(circle at top right, #e0f2f1 0%, #f4f9f9 70%)',
                overflow: 'hidden'
            }}>
                {/* SVG Pattern Background (School Icons) */}
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    opacity: 0.1,
                    pointerEvents: 'none',
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 20l5 5-5 5-5-5 5-5zm40 40l5 5-5 5-5-5 5-5zM20 70l2 2-2 2-2-2 2-2zm50-40l2 2-2 2-2-2 2-2zM50 50l3 3-3 3-3-3 3-3z' fill='%23004d40' fill-opacity='0.4' fill-rule='evenodd'/%3E%3C/svg%3E")`,
                }}></div>

                <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', width: '100%', maxWidth: '800px', marginBottom: '3rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                        <div style={{ background: '#004d40', padding: '0.5rem', borderRadius: '10px' }}>
                          <GraduationCap size={40} color="white" />
                        </div>
                        <h1 style={{ fontSize: '2.5rem', fontWeight: '900', color: '#004d40', letterSpacing: '-1px' }}>EDUSOFT</h1>
                    </div>
                    
                    <h2 style={{ fontSize: '1.25rem', color: '#00695c', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '1.5rem' }}>
                      Gestion Scolaire Intégrée
                    </h2>
                    
                    <p style={{ fontSize: '1.1rem', color: '#455a64', lineHeight: '1.6', margin: '0 auto 3rem', maxWidth: '650px' }}>
                      EDUSOFT est une solution numérique complète de gestion développée par <strong>ITA INNOVATE</strong>, 
                      permettant de centraliser et d'optimiser le suivi des élèves, de la comptabilité scolaire et des résultats académiques.
                    </p>

                    {/* Login Card */}
                    <div className="card" style={{ 
                        width: '100%', 
                        maxWidth: '450px', 
                        margin: '0 auto', 
                        textAlign: 'left', 
                        padding: '2.5rem',
                        boxShadow: '0 20px 40px rgba(0, 77, 64, 0.08)',
                        border: '1px solid rgba(0, 77, 64, 0.05)',
                        borderRadius: '24px'
                    }}>
                        <h3 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '0.5rem', color: '#004d40' }}>Connexion</h3>
                        <p style={{ color: '#607d8b', fontSize: '0.9rem', marginBottom: '2rem' }}>Entrez le code de votre établissement et vos identifiants.</p>

                        {error && (
                            <div style={{
                                backgroundColor: '#ffebee',
                                color: '#c62828',
                                padding: '0.75rem 1rem',
                                borderRadius: '12px',
                                marginBottom: '1.5rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                                fontSize: '0.875rem',
                                border: '1px solid #ffcdd2'
                            }}>
                                <AlertCircle size={20} />
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', marginBottom: '0.5rem', color: '#37474f' }}>Code Établissement</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="EX: ITA-COLLEGE"
                                    style={{ padding: '0.85rem 1rem', borderRadius: '12px', backgroundColor: '#fff', border: '1.5px solid #e0e0e0' }}
                                    value={establishmentCode}
                                    onChange={(e) => setEstablishmentCode(e.target.value)}
                                    required
                                />
                            </div>
                            
                            <div className="form-group">
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', marginBottom: '0.5rem', color: '#37474f' }}>Email professionnel</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="nom@ecole.com"
                                    style={{ padding: '0.85rem 1rem', borderRadius: '12px', backgroundColor: '#fff', border: '1.5px solid #e0e0e0' }}
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="form-group" style={{ position: 'relative' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                  <label style={{ fontSize: '0.85rem', fontWeight: '700', color: '#37474f' }}>Mot de passe</label>
                                  <a href="#" style={{ fontSize: '0.75rem', color: '#00796b', textDecoration: 'none', fontWeight: '600' }}>Oublié ?</a>
                                </div>
                                <input
                                    type="password"
                                    className="form-input"
                                    placeholder="••••••••"
                                    style={{ padding: '0.85rem 1rem', borderRadius: '12px', backgroundColor: '#fff', border: '1.5px solid #e0e0e0' }}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                className="btn btn-primary btn-block"
                                disabled={isLoading}
                                style={{ 
                                  display: 'flex', 
                                  alignItems: 'center', 
                                  justifyContent: 'center', 
                                  gap: '0.75rem', 
                                  padding: '1rem', 
                                  borderRadius: '12px', 
                                  fontSize: '1rem', 
                                  fontWeight: '700',
                                  marginTop: '2rem',
                                  transition: 'transform 0.2s',
                                  backgroundColor: '#00796b'
                                }}
                                onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
                                onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
                            >
                                {isLoading ? 'Vérification...' : (
                                    <>
                                        <LogIn size={20} />
                                        Se connecter
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>

                {/* Bottom decoration */}
                <div style={{ position: 'relative', marginTop: 'auto', display: 'flex', gap: '3rem', opacity: 0.5 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem' }}>
                    <ShieldCheck size={16} color="#004d40" />
                    Authentification Sécurisée
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem' }}>
                    <div style={{ width: '8px', height: '8px', background: '#4caf50', borderRadius: '50%' }}></div>
                    Système v1.5.0 Opérationnel
                  </div>
                </div>
            </div>

            {/* FEATURES SECTION */}
            <div style={{ padding: '6rem 2rem', backgroundColor: '#fff', textAlign: 'center' }}>
                <h2 style={{ fontSize: '2.5rem', fontWeight: '900', color: '#004d40', marginBottom: '1rem' }}>
                  Fonctionnalités Principales
                </h2>
                <div style={{ width: '80px', height: '5px', background: 'linear-gradient(to right, #004d40, #4db6ac)', margin: '0 auto 4rem', borderRadius: '5px' }}></div>
                
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
                  gap: '2.5rem', 
                  maxWidth: '1200px', 
                  margin: '0 auto' 
                }}>
                    {features.map((f, idx) => (
                      <div key={idx} className="card" style={{ 
                        textAlign: 'left', 
                        padding: '2.5rem', 
                        borderRadius: '24px', 
                        background: '#fff',
                        transition: 'all 0.3s ease',
                        border: '1px solid #f0f0f0',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-start'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-10px)';
                        e.currentTarget.style.boxShadow = '0 15px 35px rgba(0,0,0,0.06)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'var(--shadow)';
                      }}
                      >
                        <div style={{ 
                          width: '60px', 
                          height: '60px', 
                          borderRadius: '16px', 
                          backgroundColor: f.color, 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          marginBottom: '1.5rem'
                        }}>
                          {f.icon}
                        </div>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: '800', marginBottom: '1rem', color: '#1a1a1a' }}>{f.title}</h3>
                        <p style={{ color: '#607d8b', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '2rem', flex: 1 }}>{f.desc}</p>
                        <a href="#" style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '0.25rem', 
                          fontSize: '0.8rem', 
                          fontWeight: '800', 
                          color: '#00796b', 
                          textDecoration: 'none',
                          textTransform: 'uppercase',
                          letterSpacing: '1px'
                        }}>
                          En savoir plus <ChevronRight size={16} />
                        </a>
                      </div>
                    ))}
                </div>
            </div>

            {/* FOOTER */}
            <footer style={{ padding: '3rem', backgroundColor: '#004d40', color: '#fff', textAlign: 'center' }}>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', marginBottom: '2rem' }}>
                <a href="#" style={{ color: 'white', textDecoration: 'none', opacity: 0.8 }}>Conditions d'utilisation</a>
                <a href="#" style={{ color: 'white', textDecoration: 'none', opacity: 0.8 }}>Confidentialité</a>
                <a href="#" style={{ color: 'white', textDecoration: 'none', opacity: 0.8 }}>Support</a>
              </div>
              <p style={{ opacity: 0.6, fontSize: '0.875rem' }}>
                &copy; 2026 EDUSOFT par ITA INNOVATE. Tous droits réservés.
              </p>
            </footer>
        </div>
    );
};

export default Login;
