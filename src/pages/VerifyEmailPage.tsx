import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { setAuthCookies } from "../utils/auth";

const VerifyEmailPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const userId = location.state?.userId;

    const [code, setCode] = useState(["", "", "", "", "", ""]);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    
    // Resend state
    const [resendCount, setResendCount] = useState(0);
    const [cooldown, setCooldown] = useState(0);
    const [timeLeft, setTimeLeft] = useState(300); // 5 minutes code expiration (just visual)

    const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

    useEffect(() => {
        if (!userId) {
            navigate("/login");
        }
    }, [userId, navigate]);

    useEffect(() => {
        // Load resend cooldown from localStorage
        if (userId) {
            const data = localStorage.getItem(`resend_data_${userId}`);
            if (data) {
                const { count, blockedUntil } = JSON.parse(data);
                const now = Date.now();
                if (blockedUntil && blockedUntil > now) {
                    setCooldown(Math.ceil((blockedUntil - now) / 1000));
                    setResendCount(count);
                } else if (blockedUntil && blockedUntil <= now) {
                    // Cooldown passed
                    localStorage.removeItem(`resend_data_${userId}`);
                } else {
                    setResendCount(count || 0);
                }
            }
        }
    }, [userId]);

    useEffect(() => {
        let timer: ReturnType<typeof setInterval>;
        if (cooldown > 0) {
            timer = setInterval(() => {
                setCooldown(c => c - 1);
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [cooldown]);

    useEffect(() => {
        let timer: ReturnType<typeof setInterval>;
        if (timeLeft > 0) {
            timer = setInterval(() => {
                setTimeLeft(t => t - 1);
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [timeLeft]);

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, "0")}`;
    };

    const handleChange = (index: number, value: string) => {
        if (!/^[0-9]?$/.test(value)) return;
        const newCode = [...code];
        newCode[index] = value;
        setCode(newCode);

        // Auto focus next
        if (value && index < 5) {
            inputsRef.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Backspace" && !code[index] && index > 0) {
            inputsRef.current[index - 1]?.focus();
        }
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData("text").trim();
        if (/^\d{6}$/.test(pastedData)) {
            setCode(pastedData.split(""));
            inputsRef.current[5]?.focus();
        }
    };

    const handleVerify = async () => {
        const fullCode = code.join("");
        if (fullCode.length !== 6) return;

        setLoading(true);
        setError("");
        
        try {
            const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/verify-email`, {
                userId,
                code: fullCode
            });

            const { token, user } = response.data;
            setAuthCookies(token, user);
            navigate("/profile");
        } catch (err: any) {
            setError(err.response?.data?.message || "Código incorreto. Tente novamente.");
            setCode(["", "", "", "", "", ""]);
            inputsRef.current[0]?.focus();
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        if (resendCount >= 2 || cooldown > 0) return;

        try {
            await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/resend-code`, { userId });
            
            const newCount = resendCount + 1;
            setResendCount(newCount);
            setTimeLeft(300); // reset visual timer
            setError("");

            if (newCount >= 2) {
                const blockedUntil = Date.now() + 30 * 60 * 1000; // 30 minutes
                setCooldown(30 * 60);
                localStorage.setItem(`resend_data_${userId}`, JSON.stringify({ count: newCount, blockedUntil }));
            } else {
                localStorage.setItem(`resend_data_${userId}`, JSON.stringify({ count: newCount }));
            }
        } catch (err: any) {
            setError(err.response?.data?.message || "Erro ao reenviar código.");
        }
    };

    if (!userId) return null;

    return (
        <div className="flex items-center justify-center min-h-screen py-10 bg-gray-50">
            <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md text-center">
                <h1 className="text-2xl font-bold mb-2 text-gray-800">Verifique seu e-mail</h1>
                <p className="text-gray-600 mb-6 text-sm">
                    Enviamos um código de 6 dígitos para o seu e-mail.
                    <br />
                    {timeLeft > 0 ? (
                        <span className="text-orange-500 font-semibold">O código expira em {formatTime(timeLeft)}</span>
                    ) : (
                        <span className="text-red-500 font-semibold">O código expirou. Solicite um novo.</span>
                    )}
                </p>

                {error && <p className="text-red-500 text-sm mb-4 animate-pulse">{error}</p>}

                <div className="flex justify-center gap-2 mb-6">
                    {code.map((digit, index) => (
                        <input
                            key={index}
                            ref={(el) => { inputsRef.current[index] = el; }}
                            type="text"
                            inputMode="numeric"
                            maxLength={1}
                            value={digit}
                            onChange={(e) => handleChange(index, e.target.value)}
                            onKeyDown={(e) => handleKeyDown(index, e)}
                            onPaste={handlePaste}
                            className={`w-12 h-14 text-center text-xl font-bold border-2 rounded-md outline-none transition-colors ${
                                error ? "border-red-500 bg-red-50" : "border-gray-300 focus:border-green-500"
                            }`}
                        />
                    ))}
                </div>

                <button
                    onClick={handleVerify}
                    disabled={code.join("").length !== 6 || loading}
                    className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-3 rounded-md transition mb-4"
                >
                    {loading ? "Verificando..." : "Verificar Código"}
                </button>

                <div>
                    {cooldown > 0 ? (
                        <p className="text-sm text-gray-500">
                            Muitas tentativas. Tente novamente em <span className="font-bold text-red-500">{formatTime(cooldown)}</span>
                        </p>
                    ) : (
                        <button
                            onClick={handleResend}
                            className="text-sm text-green-600 hover:text-green-700 font-semibold underline bg-transparent border-none cursor-pointer"
                        >
                            Reenviar código
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default VerifyEmailPage;
