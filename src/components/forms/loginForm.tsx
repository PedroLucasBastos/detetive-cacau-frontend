import axios from "axios";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { setAuthCookies } from "../../utils/auth";

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


    return (
        <>
            <div className="flex items-center justify-center min-h-screen">
                <div>
                    <h1 className="text-2xl font-bold mb-4">Login</h1>
                    <form onSubmit={handleSubmit}>
                        <div>
                            <label htmlFor="email">Email</label>
                            <input type="email"
                                id="email"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        <div className="mb-4">
                            <label htmlFor="password">Senha</label>
                            <input type="password"
                                id="password"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                        <button type="submit"
                            className="w-full bg-blue-500 text-white py-2 rounded-md">Login</button>
                    </form>
                </div>
            </div>
        </>
    )
};

export default LoginForm


