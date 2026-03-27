import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LogIn, ShieldCheck, AlertCircle } from 'lucide-react';

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

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)',
            padding: '1rem'
        }}>
            <div className="card" style={{ width: '100%', maxWidth: '400px', textAlign: 'center' }}>
                <div style={{
                    display: 'inline-flex',
                    padding: '1rem',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(0, 77, 64, 0.1)',
                    marginBottom: '1rem'
                }}>
                    <ShieldCheck size={48} color="var(--primary)" />
                </div>

                <h1 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>EDUSOFT - SAAS</h1>
                <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Portail de Gestion Mutli-Établissements</p>

                {error && (
                    <div style={{
                        backgroundColor: '#ffebee',
                        color: 'var(--error)',
                        padding: '0.75rem',
                        borderRadius: 'var(--radius)',
                        marginBottom: '1.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        fontSize: '0.875rem'
                    }}>
                        <AlertCircle size={18} />
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="form-group" style={{ textAlign: 'left' }}>
                        <label className="form-label">Code Établissement</label>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="Ex: ITA2026"
                            value={establishmentCode}
                            onChange={(e) => setEstablishmentCode(e.target.value)}
                            required
                        />
                    </div>
                    <div className="form-group" style={{ textAlign: 'left' }}>
                        <label className="form-label">Identifiant</label>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="admin"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-group" style={{ textAlign: 'left' }}>
                        <label className="form-label">Mot de passe</label>
                        <input
                            type="password"
                            className="form-input"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary btn-block"
                        disabled={isLoading}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                    >
                        {isLoading ? 'Connexion en cours...' : (
                            <>
                                <LogIn size={20} />
                                Se connecter
                            </>
                        )}
                    </button>
                </form>

                <div style={{ marginTop: '2rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                    Authentification sécurisée • EduSoft v1.2.3 - SAAS
                </div>
            </div>
        </div>
    );
};

export default Login;
