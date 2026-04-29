import axios from "axios";
import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { setAuthCookies } from "../utils/auth";
import "./CreateAccoutPage.css"

const CreateAccountForm = () => {
    const navigate = useNavigate();
    const location = useLocation();

    // Dados do Google vindos do fluxo OAuth (se existirem)
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

    // Função genérica para atualizar qualquer campo do formulário
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setFormData(prevState => ({
            ...prevState,
            [id]: value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (isGoogleRegister) {
                // Cadastro via Google — sem senha, com googleId e avatar
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
                // Cadastro tradicional com email/senha (retorna apenas message e userId)
                const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/register`, formData);
                navigate('/verify-email', {
                    state: { userId: response.data.userId }
                });
            }
        } catch (error: any) {
            setError(error.response?.data?.message || "Erro ao criar conta");
            console.error('Erro no registro:', error);
        }
    };

    return (
        <div className="container">
            <div className="left">
                <img src="\img\gatoCadastro.png" alt="gato"/>
                <div className="overlay">
                    <h2>Junte-se à comunidade</h2>
                    <p>Milhares de pets reunidos com seus donos todos os meses</p>
                </div>
            </div>
            <div className="right">
                <div className="form-box">
                    <h1>Criar conta</h1>
                    {error && <p className="error">{error}</p>}
                    <form onSubmit={handleSubmit} className="form">
                        <input type="text"
                        id="name"
                        placeholder="Nome Completo"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        />
                        <input type="email"
                        id="email"
                        placeholder="Email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        />
                        {!isGoogleRegister &&(
                            <input type="password"
                            id="password"
                            placeholder="Senha"
                            onChange={handleChange}
                            required
                        />
                        )}
                        <div className="grid-2">
                            <input type="text"
                            id="phone"
                            placeholder="Telefone"
                            onChange={handleChange}
                        />
                            <input type="text"
                            id="zipCode"
                            placeholder="CEP"
                            onChange={handleChange}
                        />
                        </div>
                        <input type="text"
                        id="street"
                        placeholder="Rua"
                        onChange={handleChange}
                        />
                        <div className="grid-2">
                            <input
                            type="text"
                            id="number"
                            placeholder="Nº"
                            onChange={handleChange}
                            />

                            <input
                            type="text"
                            id="neighborhood"
                            placeholder="Bairro"
                            onChange={handleChange}
                            />
                        </div>
                        <div className="grid-2">
                            <input
                            type="text"
                            id="city"
                            placeholder="Cidade"
                            onChange={handleChange}
                            />

                            <input
                            type="text"
                            id="state"
                            placeholder="UF (Ex: SP)"
                            onChange={handleChange}
                            />
                        </div>
                        <button type="submit">
                            Cadastrar Conta
                        </button>
                    </form>
                    <p className="login">
                        Já tem conta? <span>Fazer login</span>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default CreateAccountForm;