import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { isTokenValid, clearAuthCookies, getAuthToken } from "../../utils/auth";
import './header.css'

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
        <header className="header">
            <div className="logo">
                <img src="public\img\patinha.png" alt="logo" className="logo-img"/>
                <span>Detetive Cacau</span>
            </div>
            <nav className="nav">
                {
                    [
                        { label: 'Home', href: '/' },
                        { label: 'Explorar Mapa', href: '/mapa' },
                        { label: 'Blog', href: '/blog' }
                    ].map(({ label, href }) => {
                        return (
                            <Link
                                key={href}
                                to={href}
                                className="nav-link"
                            >
                                {label}
                            </Link>
                        )
                    })
                 }
            </nav>
            <div className="actions">
                {isAuthenticated ?(
                    <button onClick={handleLogout} className="btn outline">
                        Sair
                    </button>
                ):(
                    <>
                    <Link to="/login" className="btn outline">
                    Login
                    </Link>

                    <Link to="/create-account" className="btn filled">
                    Criar conta
                    </Link>
                    </>
                )}
            </div>
        </header>
    )
}

export default Header