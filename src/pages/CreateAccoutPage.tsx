import axios from "axios";
import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { setAuthCookies } from "../utils/auth";
import "./CreateAccoutPage.css";

const CreateAccountForm = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const googleData = location.state?.googleData as {
        name: string;
        email: string;
        picture?: string;
        googleId: string;
    } | undefined;

    const isGoogleRegister = !!googleData;

    const [formData, setFormData] = useState({
        name: googleData?.name || '',
        email: googleData?.email || '',
        password: '',
        phone: '',
        zipCode: '',
        street: '',
        number: '',
        neighborhood: '',
        city: '',
        state: ''
    });

    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setFormData(prev => ({ ...prev, [id]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            if (isGoogleRegister) {
                const { password, ...dataWithoutPassword } = formData;
                const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/google/register`, {
                    ...dataWithoutPassword,
                    googleId: googleData.googleId,
                    avatar: googleData.picture,
                });
                const { token, user } = response.data;
                setAuthCookies(token, user);
                navigate('/profile');
            } else {
                const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/register`, formData);
                navigate('/verify-email', {
                    state: { userId: response.data.userId }
                });
            }
        } catch (error: any) {
            setError(error.response?.data?.message || "Erro ao criar conta");
            console.error('Erro no registro:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="ca-container">

            {/* ── Coluna esquerda: imagem decorativa ── */}
            <div className="ca-left">
                <img src="/img/gatoCadastro.png" alt="Gato fofo" />
                <div className="ca-overlay">
                    <h2>Junte-se à comunidade</h2>
                    <p>Milhares de pets reunidos com seus donos todos os meses</p>
                </div>
            </div>

            {/* ── Coluna direita: formulário ── */}
            <div className="ca-right">

                {/* Logo visível só no mobile */}
                <div className="ca-logo-mobile">
                    <img src="/img/patinha.png" alt="logo" width={26} height={26} />
                    <span>Detetive Cacau</span>
                </div>

                <h1>Criar conta</h1>
                {error && <p className="ca-error">{error}</p>}

                <form onSubmit={handleSubmit} className="ca-form">

                    <input type="text" id="name" placeholder="Nome Completo"
                        value={formData.name} onChange={handleChange} required />

                    <input type="email" id="email" placeholder="Email"
                        value={formData.email} onChange={handleChange} required
                        disabled={isGoogleRegister} />

                    {/* Campo de senha nativo */}
                    {!isGoogleRegister && (
                        <input
                            type="password"
                            id="password"
                            placeholder="Senha"
                            onChange={handleChange}
                            required
                        />
                    )}

                    <div className="grid-2">
                        <input type="text" id="phone" placeholder="Telefone" onChange={handleChange} />
                        <input type="text" id="zipCode" placeholder="CEP" onChange={handleChange} />
                    </div>

                    <input type="text" id="street" placeholder="Rua" onChange={handleChange} />

                    <div className="grid-2">
                        <input type="text" id="number" placeholder="Nº" onChange={handleChange} />
                        <input type="text" id="neighborhood" placeholder="Bairro" onChange={handleChange} />
                    </div>

                    <div className="grid-2">
                        <input type="text" id="city" placeholder="Cidade" onChange={handleChange} />
                        <input type="text" id="state" placeholder="UF (Ex: SP)" onChange={handleChange} />
                    </div>

                    <button type="submit" disabled={loading}>
                        {loading ? 'Criando conta...' : 'Cadastrar Conta'}
                    </button>
                </form>

                <p className="ca-login-link">
                    Já tem conta? <Link to="/login"><span>Fazer login</span></Link>
                </p>
            </div>
        </div>
    );
};

export default CreateAccountForm;