import axios from "axios";
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { setAuthCookies } from "../../utils/auth";
import { useGoogleLogin } from '@react-oauth/google';
import './loginForm.css';

const LoginForm = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/login`, { email, password });
            const { token, user } = response.data;
            setAuthCookies(token, user);
            navigate('/profile');
        } catch (error: any) {
            if (error.response?.status === 403 && error.response?.data?.needsVerification) {
                navigate('/verify-email', {
                    state: { userId: error.response.data.userId }
                });
                return;
            }
            setError(error.response?.data?.message || 'Email ou senha inválidos.');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            try {
                const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/google`, {
                    accessToken: tokenResponse.access_token,
                });
                if (res.data.needsRegistration) {
                    navigate('/create-account', { state: { googleData: res.data.googleData } });
                    return;
                }
                const { token, user } = res.data;
                setAuthCookies(token, user);
                navigate('/profile');
            } catch (error: any) {
                console.error('Erro no login com Google:', error.response?.data?.message || error.message);
            }
        },
        onError: errorResponse => console.error("Erro no popup do Google:", errorResponse),
    });

    return (
        <div className="login-container">

            {/* ── Coluna esquerda: formulário ── */}
            <div className="login-left">

                {/* Logo visível só no mobile */}
                <div className="login-logo-mobile">
                    <img src="/img/patinha.png" alt="logo" width={26} height={26} />
                    <span>Detetive Cacau</span>
                </div>

                <h1>Bem-vindo de volta!</h1>
                <p>Acesse sua conta para gerenciar alertas e ajudar a reunir pets com seus donos.</p>

                <form onSubmit={handleSubmit}>
                    <div className="input-group">
                        <label htmlFor="login-email">Email</label>
                        <input
                            id="login-email"
                            type="email"
                            placeholder="exemplo@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className="input-group">
                        <label htmlFor="login-password">Senha</label>
                        <input
                            id="login-password"
                            type="password"
                            placeholder="Insira sua senha"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    {error && <p className="login-error">{error}</p>}

                    <button type="submit" className="login-btn" disabled={loading}>
                        {loading ? 'Entrando...' : 'Entrar'}
                    </button>
                </form>

                <div className="divider">ou continue com</div>

                <button className="google-btn" onClick={() => handleGoogleLogin()} type="button">
                    <img src="/img/google.png" alt="google" className="google-icon" />
                    Entrar com Google
                </button>

                <p className="register-text">
                    Não tem conta?{' '}
                    <Link to="/create-account"><span>Cadastrar</span></Link>
                </p>
            </div>

            {/* ── Coluna direita: imagem decorativa ── */}
            <div className="login-right">
                <img src="/img/dog.png" alt="Cachorro feliz" className="login-img" />
                <div className="overlay">
                    <p>
                        "Graças ao Detetive Cacau, reencontrei meu melhor amigo em menos de 24 horas.
                        Uma comunidade incrível!"
                    </p>
                    <span>— Julia &amp; Pipoca</span>
                </div>
            </div>
        </div>
    );
};

export default LoginForm;
