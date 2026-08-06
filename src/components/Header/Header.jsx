import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import './Header.css';
import logoImage from '../../assets/logo.png';
import { FaBars, FaTimes } from 'react-icons/fa';

function Header() {
    const [menuOpen, setMenuOpen] = useState(false);
    const closeMenu = () => setMenuOpen(false);

    const navigate = useNavigate();
    const location = useLocation();

    const goToSection = (id) => (e) => {
        e.preventDefault();
        closeMenu();

        if (location.pathname === '/') {
            const el = document.getElementById(id);
            if (el) {
                el.scrollIntoView({ behavior: 'smooth' });
            }
        } else {
            navigate(`/#${id}`);
        }
    };

    return (
        <header className="header">

            <div className="main-header">

                {/* IZQUIERDA */}
                <div className="header-left">
                    <Link to="/" className="header-logo-link">
                        <span className="header-logo-badge">
                            <img
                                src={logoImage}
                                alt="Logo"
                                className="header-logo-img"
                            />
                        </span>
                    </Link>

                    <div className="header-info">
                        <span className="header-app-name">
                            SportsMatch
                        </span>
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


                {/* 🆕 WRAPPER: agrupa menu + auth para que se desplieguen juntos, sin huecos */}
                <div className={menuOpen ? 'mobile-menu-wrapper open' : 'mobile-menu-wrapper'}>

                    {/* CENTRO */}
                    <nav>
                        <ul className="menu-links">
                            <li>
                                <a href="#servicios" onClick={goToSection('servicios')}>
                                    Servicios
                                </a>
                            </li>

                            <li>
                                <a href="#informacion" onClick={goToSection('informacion')}>
                                    Información
                                </a>
                            </li>

                            <li>
                                <a href="#contacto" onClick={goToSection('contacto')}>
                                    Contacto
                                </a>
                            </li>
                        </ul>
                    </nav>

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
