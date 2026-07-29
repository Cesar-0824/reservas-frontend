import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './Header.css';
import logoImage from '../../assets/logo.png';
import { FaFacebookF, FaGooglePlusG, FaTwitter, FaBars, FaTimes } from 'react-icons/fa';

function Header() {
    // 🆕 estado del menú hamburguesa
    const [menuOpen, setMenuOpen] = useState(false);
    const closeMenu = () => setMenuOpen(false);

    return (
        <header className="header">

            <div className="main-header">

                {/* IZQUIERDA */}
                <div className="header-left">
                    <Link to="/" className="header-logo-link">
                        <img 
                            src={logoImage} 
                            alt="Logo" 
                            className="header-logo-img" 
                        />
                    </Link>

                    <div className="header-info">
                        <span className="header-app-name">
                            SportsMatch
                        </span>

                        <span className="header-tagline">
                            ¡Disfruta de tu pasión!
                        </span>
                    </div>
                </div>


                {/* 🆕 BOTÓN HAMBURGUESA (solo visible en móvil vía CSS) */}
                <button
                    className="hamburger-btn"
                    onClick={() => setMenuOpen(!menuOpen)}
                    aria-label="Abrir menú"
                    aria-expanded={menuOpen}
                >
                    {menuOpen ? <FaTimes /> : <FaBars />}
                </button>


                {/* CENTRO */}
                <nav>
                    <ul className={menuOpen ? 'menu-links open' : 'menu-links'}>
                        <li>
                            <Link to="/servicios" onClick={closeMenu}>
                                Servicios
                            </Link>
                        </li>

                        <li>
                            <Link to="/informacion" onClick={closeMenu}>
                                Información
                            </Link>
                        </li>

                        <li>
                            <Link to="/contacto" onClick={closeMenu}>
                                Contacto
                            </Link>
                        </li>
                    </ul>
                </nav>


                {/* DERECHA */}
                <div className={menuOpen ? 'header-social open' : 'header-social'}>

                    <a href="https://facebook.com" 
                       target="_blank" 
                       rel="noopener noreferrer"
                       className="social-icon facebook">
                        <FaFacebookF />
                    </a>

                    <a href="https://plus.google.com" 
                       target="_blank" 
                       rel="noopener noreferrer"
                       className="social-icon google">
                        <FaGooglePlusG />
                    </a>

                    <a href="https://twitter.com" 
                       target="_blank" 
                       rel="noopener noreferrer"
                       className="social-icon twitter">
                        <FaTwitter />
                    </a>

                </div>

            </div>

        </header>
    );
}

export default Header;
