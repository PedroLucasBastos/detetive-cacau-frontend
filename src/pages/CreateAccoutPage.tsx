import axios from "axios";
import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { setAuthCookies } from "../utils/auth";

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
        <div className="flex items-center justify-center min-h-screen py-10 bg-gray-50">
            <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
                <h1 className="text-2xl font-bold mb-6 text-center">Criar Conta</h1>

                {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Dados Básicos */}
                    <input type="text" id="name" placeholder="Nome Completo" value={formData.name} onChange={handleChange} className="w-full px-3 py-2 border rounded-md" required readOnly={isGoogleRegister} />
                    <input type="email" id="email" placeholder="Email" value={formData.email} onChange={handleChange} className="w-full px-3 py-2 border rounded-md" required readOnly={isGoogleRegister} />

                    {/* Senha — oculta para cadastro via Google */}
                    {!isGoogleRegister && (
                        <input type="password" id="password" placeholder="Senha" onChange={handleChange} className="w-full px-3 py-2 border rounded-md" required />
                    )}

                    {/* Contato e Endereço */}
                    <div className="grid grid-cols-2 gap-2">
                        <input type="text" id="phone" placeholder="Telefone" onChange={handleChange} className="px-3 py-2 border rounded-md" />
                        <input type="text" id="zipCode" placeholder="CEP" onChange={handleChange} className="px-3 py-2 border rounded-md" />
                    </div>

                    <input type="text" id="street" placeholder="Rua" onChange={handleChange} className="w-full px-3 py-2 border rounded-md" />

                    <div className="grid grid-cols-3 gap-2">
                        <input type="text" id="number" placeholder="Nº" onChange={handleChange} className="px-3 py-2 border rounded-md" />
                        <input type="text" id="neighborhood" placeholder="Bairro" onChange={handleChange} className="col-span-2 px-3 py-2 border rounded-md" />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        <input type="text" id="city" placeholder="Cidade" onChange={handleChange} className="px-3 py-2 border rounded-md" />
                        <input type="text" id="state" placeholder="UF (Ex: SP)" onChange={handleChange} className="px-3 py-2 border rounded-md" />
                    </div>

                    <button type="submit" className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2 rounded-md transition">
                        Cadastrar Agora
                    </button>
                </form>
            </div>
        </div>
    );
};

export default CreateAccountForm;