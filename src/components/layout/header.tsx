import { Link, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { isTokenValid, clearAuthCookies, getAuthToken } from "../../utils/auth";
import {
    Burger,
    Drawer,
    Stack,
    Group,
    Divider,
    Button,
    Text,
    Box,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import './header.css';

const navLinks = [
    { label: 'Home', href: '/' },
    { label: 'Explorar Mapa', href: '/mapa' },
    { label: 'Blog', href: '/blog' },
];

function Header() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [drawerOpened, { toggle: toggleDrawer, close: closeDrawer }] = useDisclosure(false);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const checkAuth = () => {
            const valid = isTokenValid();
            if (!valid && getAuthToken()) {
                clearAuthCookies(false);
            }
            setIsAuthenticated(valid);
        };

        window.addEventListener('authStateChange', checkAuth);
        checkAuth();

        return () => window.removeEventListener('authStateChange', checkAuth);
    }, []);

    const handleLogout = () => {
        clearAuthCookies();
        navigate('/');
        closeDrawer();
    };

    const isProfilePage = location.pathname === '/profile';

    return (
        <>
            <header className="header">
                {/* Logo */}
                <div className="logo" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
                    <img src="/img/patinha.png" alt="logo" className="logo-img" />
                    <span>Detetive Cacau</span>
                </div>

                {/* Nav desktop */}
                <nav className="nav nav-desktop">
                    {navLinks.map(({ label, href }) => (
                        <Link key={href} to={href} className="nav-link">
                            {label}
                        </Link>
                    ))}
                </nav>

                {/* Actions desktop */}
                <div className="actions actions-desktop">
                    {isAuthenticated ? (
                        <>
                            {!isProfilePage && (
                                <Link to="/profile" className="btn filled">
                                    Meu Perfil
                                </Link>
                            )}
                            <button onClick={handleLogout} className="btn outline">
                                Sair
                            </button>
                        </>
                    ) : (
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

                {/* Burger para mobile */}
                <Burger
                    opened={drawerOpened}
                    onClick={toggleDrawer}
                    className="burger-mobile"
                    aria-label="Abrir menu"
                    color="#3D2B1F"
                />
            </header>

            {/* Drawer mobile */}
            <Drawer
                opened={drawerOpened}
                onClose={closeDrawer}
                title={
                    <Group gap={8} onClick={() => { navigate('/'); closeDrawer(); }} style={{ cursor: 'pointer' }}>
                        <img src="/img/patinha.png" alt="logo" width={24} height={24} />
                        <Text fw={700} size="md" c="#3D2B1F" style={{ letterSpacing: 1 }}>
                            Detetive Cacau
                        </Text>
                    </Group>
                }
                position="right"
                size="xs"
                styles={{
                    header: { borderBottom: '1px solid #f3f2f1', paddingBottom: 12 },
                    body: { paddingTop: 16 },
                    root: { zIndex: 200 },
                }}
            >
                <Stack gap="xs">
                    {navLinks.map(({ label, href }) => (
                        <Link
                            key={href}
                            to={href}
                            className="nav-link drawer-nav-link"
                            onClick={closeDrawer}
                        >
                            {label}
                        </Link>
                    ))}

                    <Divider my="sm" color="#f3f2f1" />

                    <Box>
                        {isAuthenticated ? (
                            <Stack gap="xs">
                                {!isProfilePage && (
                                    <Button
                                        component={Link}
                                        to="/profile"
                                        fullWidth
                                        onClick={closeDrawer}
                                        styles={{
                                            root: {
                                                background: '#3D2B1F',
                                                borderRadius: 20,
                                                fontWeight: 600,
                                                fontSize: 14,
                                            }
                                        }}
                                    >
                                        Meu Perfil
                                    </Button>
                                )}
                                <Button
                                    fullWidth
                                    variant="default"
                                    onClick={handleLogout}
                                    styles={{
                                        root: {
                                            background: '#f3f2f1',
                                            border: 'none',
                                            borderRadius: 20,
                                            fontWeight: 600,
                                            fontSize: 14,
                                            color: '#3D2B1F',
                                        }
                                    }}
                                >
                                    Sair
                                </Button>
                            </Stack>
                        ) : (
                            <Stack gap="xs">
                                <Button
                                    component={Link}
                                    to="/login"
                                    fullWidth
                                    variant="default"
                                    onClick={closeDrawer}
                                    styles={{
                                        root: {
                                            background: '#f3f2f1',
                                            border: 'none',
                                            borderRadius: 20,
                                            fontWeight: 600,
                                            fontSize: 14,
                                            color: '#3D2B1F',
                                        }
                                    }}
                                >
                                    Login
                                </Button>
                                <Button
                                    component={Link}
                                    to="/create-account"
                                    fullWidth
                                    onClick={closeDrawer}
                                    styles={{
                                        root: {
                                            background: '#3D2B1F',
                                            borderRadius: 20,
                                            fontWeight: 600,
                                            fontSize: 14,
                                        }
                                    }}
                                >
                                    Criar conta
                                </Button>
                            </Stack>
                        )}
                    </Box>
                </Stack>
            </Drawer>
        </>
    );
}

export default Header;