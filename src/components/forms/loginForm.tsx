import axios from "axios";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { setAuthCookies } from "../../utils/auth";
import { useGoogleLogin } from '@react-oauth/google';
import './loginForm.css'

const LoginForm = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/login`, { email, password });

            const { token, user } = response.data;

            setAuthCookies(token, user);

            navigate('/profile');
        } catch (error: any) {
            console.error('Erro no login:', error.response?.data?.message || error.message);
        }
    };

    // ─── Google OAuth2 ─────────────────────────────────────────────────────────

    const handleGoogleLogin = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            try {
                // Envia o access_token para o backend validar e buscar o perfil
                const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/google`, {
                    accessToken: tokenResponse.access_token,
                });

                // Usuário novo — precisa completar cadastro
                if (res.data.needsRegistration) {
                    navigate('/create-account', {
                        state: { googleData: res.data.googleData },
                    });
                    return;
                }

                // Usuário já existe — login direto
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
            <div className="login-left">
                <h1>Bem-vindo de volta!</h1>
                <p>Acesse sua conta para gerenciar alertas e ajudar a reunir pets com seus donos.</p>
                <form onSubmit={handleSubmit}>
                    <div className="input-group">
                        <label>Email</label>
                        <input type="email" placeholder="exemplo@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
                    </div>
                    <div className="input-group">
                        <label>Senha</label>
                        <input type="password" placeholder="Insira sua senha" value={password} onChange={(e) => setPassword(e.target.value)} />
                    </div>
                    <button type="submit" className="login-btn">
                        Entrar
                    </button>
                </form>
                <div className="divider">ou continue com</div>
                <button className="google-btn" onClick={() => handleGoogleLogin()} type="button">
                    <img src="\img\google.png" alt="google" className="google-icon" />
                    Entrar com Google
                </button>
                <p className="register-text">
                    Não tem conta? <span> Cadastrar</span>
                </p>
            </div>
            <div className="login-right">
                <img src="\img\dog.png" alt="dog" className="login-img" />
                <div className="overlay">
                    <p>
                        "Graças ao Detetive Cacau, reencontrei meu melhor amigo em menos de 24 horas.
                        Uma comunidade incrível!"
                    </p>
                    <span>-Julia &amp; Pipoca</span>
                </div>
            </div>
        </div>
    )
};

export default LoginForm;
