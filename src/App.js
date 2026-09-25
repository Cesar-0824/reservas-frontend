import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import axios from 'axios';

import Header from './components/Header/Header';
import BrandingBar from './components/BrandingBar/BrandingBar';
import Footer from './components/Footer/Footer';
import Home from './pages/Home/Home';
import UserDashboard from './pages/Reservas/UserDashboard';
import Login from './pages/Login/login';
import Register from './pages/Register/Register';
import AdminDashboard from './pages/AdminDashboard/AdminDashboard';
import ForgotPassword from './pages/ForgotPassword/ForgotPassword';
import ResetPassword from './pages/ForgotPassword/ResetPassword'

import './App.css';

// Interceptor global: si cualquier request recibe 401, limpia la sesión y manda a login
axios.interceptors.response.use(
    response => response,
    error => {
        if (error.response && error.response.status === 401) {
            localStorage.removeItem('authToken');
            localStorage.removeItem('currentUser');
            if (window.location.pathname !== '/login') {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

// Verifica la sesión contra el backend (no solo localStorage)
const verificarSesion = async () => {
    const token = localStorage.getItem('authToken');
    const rawUser = localStorage.getItem('currentUser');

    if (!token || !rawUser || rawUser === 'undefined' || rawUser === 'null') {
        return false;
    }

    try {
        JSON.parse(rawUser);
    } catch {
        localStorage.removeItem('authToken');
        localStorage.removeItem('currentUser');
        return false;
    }

    try {
        // TODO: reemplaza esta URL por un endpoint real de tu backend
        // que valide el token (ej: /api/auth/me, /api/usuarios/perfil)
        await axios.get('http://localhost:8080/api/auth/me', {
            headers: { Authorization: `Bearer ${token}` }
        });
        return true;
    } catch (err) {
        localStorage.removeItem('authToken');
        localStorage.removeItem('currentUser');
        return false;
    }
};

// Verifica si el usuario es admin (a partir de los datos ya validados en localStorage)
const esAdmin = () => {
    const rawUser = localStorage.getItem('currentUser');
    if (!rawUser) return false;
    try {
        const parsedUser = JSON.parse(rawUser);
        return parsedUser.rol === 'admin';
    } catch {
        return false;
    }
};

// Ruta protegida para cualquier usuario logueado
const PrivateRoute = ({ children, isAuthenticated }) => {
    return isAuthenticated ? children : <Navigate to="/login" replace />;
};

// Ruta protegida solo para admin
const AdminRoute = ({ children }) => {
    return esAdmin() ? children : <Navigate to="/reservas" replace />;
};

// Layout interno: sí puede usar useLocation() porque está dentro de <Router>
function AppLayout({ isAuthenticated, globalHandleLogout, handleLoginSuccess }) {
    const location = useLocation();
    const isAdminRoute = location.pathname.startsWith('/admin');
    const isUserDashboardRoute = location.pathname.startsWith('/reservas');

    const isFullWidthRoute = location.pathname === '/login' || location.pathname === '/registrar';

    const isDashboardRoute = isAdminRoute || isUserDashboardRoute;

    const hideHeaderAndFooter = isDashboardRoute || isFullWidthRoute;

    return (
        <div className="App">
            {!hideHeaderAndFooter && <Header onLogout={globalHandleLogout} isLoggedIn={isAuthenticated} />}
            {!hideHeaderAndFooter && <BrandingBar />}

            <main className={hideHeaderAndFooter ? '' : 'main-content'}>
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/registrar" element={<Register />} />
                    <Route path="/reset-password" element={<ResetPassword />} />

                    <Route
                        path="/login"
                        element={
                            isAuthenticated ? (
                                esAdmin() ? <Navigate to="/admin" replace /> : <Navigate to="/reservas" replace />
                            ) : (
                                <Login onLoginSuccess={handleLoginSuccess} />
                            )
                        }
                    />
                    <Route path="/forgot-password" element={<ForgotPassword />} />

                    <Route
                        path="/reservas"
                        element={
                            <PrivateRoute isAuthenticated={isAuthenticated}>
                                <UserDashboard onLogout={globalHandleLogout} />
                            </PrivateRoute>
                        }
                    />

                    <Route
                        path="/admin"
                        element={
                            <PrivateRoute isAuthenticated={isAuthenticated}>
                                <AdminRoute>
                                    <AdminDashboard onLogout={globalHandleLogout} />
                                </AdminRoute>
                            </PrivateRoute>
                        }
                    />

                    <Route
                        path="/dashboard"
                        element={
                            <PrivateRoute isAuthenticated={isAuthenticated}>
                                <div style={{ padding: '50px', textAlign: 'center' }}>
                                    <h2>¡Bienvenido, usuario logueado!</h2>
                                    <button onClick={globalHandleLogout} className="logout-button">Cerrar Sesión</button>
                                </div>
                            </PrivateRoute>
                        }
                    />

                    <Route
                        path="*"
                        element={
                            <div style={{ padding: '50px', textAlign: 'center', fontSize: '2em', color: 'red' }}>
                                Página no encontrada (404)
                            </div>
                        }
                    />
                </Routes>
            </main>

            {(!isDashboardRoute && !isFullWidthRoute) && <Footer />}
        </div>
    );
}

function App() {
    const [isAuthenticated, setIsAuthenticated] = useState(null); // null = "verificando"

    const handleLoginSuccess = () => {
        verificarSesion().then(setIsAuthenticated);
    };

    const globalHandleLogout = () => {
        localStorage.removeItem('authToken');
        localStorage.removeItem('currentUser');
        setIsAuthenticated(false);
    };

    useEffect(() => {
        verificarSesion().then(setIsAuthenticated);

        const handleStorageChange = (e) => {
            if (e.key === 'authToken' && e.newValue === null) {
                setIsAuthenticated(false);
            }
        };
        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    if (isAuthenticated === null) {
        return <div style={{ textAlign: 'center', padding: '50px' }}>Cargando...</div>;
    }

    return (
        <Router>
            <AppLayout
                isAuthenticated={isAuthenticated}
                globalHandleLogout={globalHandleLogout}
                handleLoginSuccess={handleLoginSuccess}
            />
        </Router>
    );
}

export default App;