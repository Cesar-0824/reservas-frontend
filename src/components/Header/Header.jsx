import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Header.css';
import { FaBars, FaTimes, FaFutbol } from 'react-icons/fa';
    
function Header() {
    const [menuOpen, setMenuOpen] = useState(false);
    const closeMenu = () => setMenuOpen(false);

    
    const location = useLocation();



    // 🆕 Maneja el scroll cuando se llega a "/" con un hash en la URL
    // (por ejemplo, al navegar desde otra ruta con navigate(`/#${id}`))
    useEffect(() => {
        if (location.pathname === '/' && location.hash) {
            const id = location.hash.replace('#', '');

            // Pequeño delay para asegurar que el DOM de la home
            // ya esté montado antes de intentar hacer scroll
            const timeoutId = setTimeout(() => {
                const el = document.getElementById(id);
                if (el) {
                    el.scrollIntoView({ behavior: 'smooth' });
                }
            }, 100);

            return () => clearTimeout(timeoutId);
        }
    }, [location]);

    return (
        <header className="header">

            <div className="main-header">

                {/* IZQUIERDA */}
                <div className="header-left">
                    <Link to="/" className="header-logo-link">
                        <span className="header-logo-badge">
                            <FaFutbol className="header-logo-img" />
                        </span>
                    </Link>

                    <div className="header-info">
                        <Link to="/" className="header-app-name" onClick={closeMenu}>
                            SportsMatch
                        </Link>
                    </div>
                </div>


                {/* BOTÓN HAMBURGUESA (solo visible en móvil vía CSS) */}
                <button
                    className="hamburger-btn"
                    onClick={() => setMenuOpen(!menuOpen)}
                    aria-label="Abrir menú"
                    aria-expanded={menuOpen}
                >
                    {menuOpen ? <FaTimes /> : <FaBars />}
                </button>


                {/* WRAPPER: agrupa menu + auth para que se desplieguen juntos, sin huecos */}
                <div className={menuOpen ? 'mobile-menu-wrapper open' : 'mobile-menu-wrapper'}>

                    

                    {/* DERECHA */}
                    <div className="header-auth">
                        <Link to="/login" className="header-btn-login" onClick={closeMenu}>
                            Iniciar sesión
                        </Link>
                        <Link to="/registrar" className="header-btn-register" onClick={closeMenu}>
                            Registrarse
                        </Link>
                    </div>

                </div>

            </div>

        </header>
    );
}

export default Header;