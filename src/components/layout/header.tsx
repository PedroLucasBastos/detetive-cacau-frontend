import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { isTokenValid, clearAuthCookies, getAuthToken } from "../../utils/auth";

function Header() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const checkAuth = () => {
            const valid = isTokenValid();
            if (!valid && getAuthToken()) {
                // apaga os resíduos do cookie mas sem disparar outro evento para evitar loop
                clearAuthCookies(false);
            }
            setIsAuthenticated(valid);
        };

        window.addEventListener('authStateChange', checkAuth);
        // Também checa no load
        checkAuth();

        return () => window.removeEventListener('authStateChange', checkAuth);
    }, []);

    const handleLogout = () => {
        clearAuthCookies();
        navigate('/');
    };

    return (
        <header className="
            fixed top-0 left-0 right-0 z-50
            flex items-center justify-between
            px-8 h-[68px]
            bg-[rgba(26,15,8,0.85)] backdrop-blur-md
            border-b border-[rgba(182,119,29,0.25)]
            shadow-[0_2px_24px_rgba(0,0,0,0.4)]
        ">
            {/* Marca */}
            <span className="
                text-xl font-bold tracking-wider select-none whitespace-nowrap
                text-[#FF9D00] [text-shadow:0_0_16px_rgba(255,157,0,0.45)]
            ">
                Detetive Cacau
            </span>

            {/* Navegação */}
            <nav className="flex gap-8">
                {[
                    { label: 'Home', href: '/' },
                    { label: 'Explorar Mapa', href: '/mapa' },
                    { label: 'Blog', href: '/blog' },
                ].map(({ label, href }) => (
                    <Link
                        key={href}
                        to={href}
                        className="
                            relative text-[#FFCF71] text-sm font-medium tracking-wide
                            transition-colors duration-200
                            after:content-[''] after:absolute after:left-0 after:-bottom-1
                            after:h-0.5 after:w-0 after:bg-[#FF9D00] after:rounded-full
                            after:transition-[width] after:duration-300
                            hover:text-[#FF9D00] hover:after:w-full
                        "
                    >
                        {label}
                    </Link>
                ))}
            </nav>

            {/* Ações */}
            <div className="flex items-center gap-3">
                {isAuthenticated ? (
                    <button
                        onClick={handleLogout}
                        className="
                            cursor-pointer rounded-lg px-4 py-1.5
                            text-sm font-semibold whitespace-nowrap
                            bg-transparent border border-[#B6771D] text-[#FFCF71]
                            transition-all duration-200
                            hover:bg-[rgba(182,119,29,0.15)] hover:border-[#FF9D00] hover:text-[#FF9D00]
                        "
                    >
                        Sair
                    </button>
                ) : (
                    <>
                        {/* Login — contornado */}
                        <Link to="/login" className="
                            cursor-pointer rounded-lg px-4 py-1.5
                            text-sm font-semibold whitespace-nowrap
                            bg-transparent border border-[#B6771D] text-[#FFCF71]
                            transition-all duration-200
                            hover:bg-[rgba(182,119,29,0.15)] hover:border-[#FF9D00] hover:text-[#FF9D00]
                        ">
                            Login
                        </Link>

                        {/* Criar Conta — preenchido */}
                        <Link to="/create-account" className="
                            cursor-pointer rounded-lg px-4 py-1.5
                            text-sm font-semibold whitespace-nowrap
                            bg-gradient-to-br from-[#B6771D] to-[#FF9D00]
                            border border-transparent text-[#1A0F08]
                            transition-all duration-200
                            hover:from-[#FF9D00] hover:to-[#e6bc47]
                            hover:shadow-[0_0_14px_rgba(255,157,0,0.45)]
                            hover:-translate-y-px
                        ">
                            Criar Conta
                        </Link>
                    </>
                )}
            </div>
        </header>
    )
}

export default Header