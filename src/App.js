import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';

import Header from './components/Header/Header';
import BrandingBar from './components/BrandingBar/BrandingBar';
import Footer from './components/Footer/Footer';
import Home from './pages/Home/Home';
import UserDashboard from './pages/Reservas/UserDashboard';
import Login from './pages/Login/login';
import Servicios from './pages/Servicios/Servicios';
import Informacion from './pages/Informacion/Informacion';
import Contacto from './pages/Contacto/Contacto';
import Register from './pages/Register/Register';
import AdminDashboard from './pages/AdminDashboard/AdminDashboard';
import ForgotPassword from './pages/ForgotPassword/ForgotPassword';

import './App.css';

// Función para verificar si hay sesión iniciada
const getIsAuthenticated = () => {
    const token = localStorage.getItem('authToken');
    const rawUser = localStorage.getItem('currentUser');
    try {
        if (token && rawUser && rawUser !== 'undefined' && rawUser !== 'null') {
            const parsedUser = JSON.parse(rawUser);
            return !!parsedUser && typeof parsedUser === 'object' && !!parsedUser.id;
        }
    } catch (e) {
        console.error("Error parseando currentUser desde localStorage en getIsAuthenticated:", e);
        localStorage.removeItem('authToken');
        localStorage.removeItem('currentUser');
    }
    return false;
};

// Función para verificar si el usuario es admin
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
const PrivateRoute = ({ children }) => {
    const isAuthenticated = getIsAuthenticated();
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
    const isDashboardRoute = isAdminRoute || isUserDashboardRoute;

    return (
        <div className="App">
            {!isDashboardRoute && <Header onLogout={globalHandleLogout} isLoggedIn={isAuthenticated} />}
            {!isDashboardRoute && <BrandingBar />}

            <main className={isDashboardRoute ? '' : 'main-content'}>
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/servicios" element={<Servicios />} />
                    <Route path="/informacion" element={<Informacion />} />
                    <Route path="/contacto" element={<Contacto />} />
                    <Route path="/registrar" element={<Register />} />

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
                            <PrivateRoute>
                                <UserDashboard onLogout={globalHandleLogout} />
                            </PrivateRoute>
                        }
                    />

                    <Route
                        path="/admin"
                        element={
                            <PrivateRoute>
                                <AdminRoute>
                                    <AdminDashboard onLogout={globalHandleLogout} />
                                </AdminRoute>
                            </PrivateRoute>
                        }
                    />

                    <Route
                        path="/dashboard"
                        element={
                            <PrivateRoute>
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

            {!isDashboardRoute && <Footer />}
        </div>
    );
}

function App() {
    const [, setAuthTrigger] = useState(false);

    const handleLoginSuccess = () => {
        setAuthTrigger(prev => !prev);
        console.log("App.js: Login exitoso, estado de autenticación re-evaluado.");
    };

    const globalHandleLogout = () => {
        console.log("App.js: Cierre de sesión global activado.");
        localStorage.removeItem('authToken');
        localStorage.removeItem('currentUser');
        setAuthTrigger(prev => !prev);
    };

    const isAuthenticated = getIsAuthenticated();   

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
