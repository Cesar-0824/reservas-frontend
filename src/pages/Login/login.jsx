import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './login.css';




function Login({ onLoginSuccess }) {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post('http://localhost:8080/api/auth/login', {
        email: formData.email,
        password: formData.password,
      });

      const { token, email, userId, nombreUsuario, rol } = response.data;

      if (token) {
        const user = { id: userId, email, nombreUsuario, rol };
        localStorage.setItem('authToken', token);
        localStorage.setItem('currentUser', JSON.stringify(user));

        if (typeof onLoginSuccess === 'function') {
          onLoginSuccess();
        }

        if (rol === 'admin') {
          navigate('/admin', { replace: true });
        } else {
          navigate('/reservas', { replace: true });
        }
      } else {
        setError('Error: No se recibió un token válido.');
      }
    } catch (err) {
      console.error('Login error:', err);
      if (err.response?.data) {
        setError(err.response.data);
      } else if (err.request) {
        setError('No se pudo conectar con el servidor.');
      } else {
        setError    ('Error inesperado. Intenta de nuevo.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page-container">
      <div className="login-card">
        <h2 className="login-title">Iniciar Sesión</h2>
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="email">Correo Electrónico</label>
            <input
              type="email"
              id="email"
              placeholder="tu@ejemplo.com"
              value={formData.email}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Contraseña</label>
            <input
              type="password"
              id="password"
              placeholder="Contraseña"
              value={formData.password}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>

          {/* Enlace para recuperar contraseña */}
          <div className="forgot-password">
            <a href="/forgot-password">¿Olvidaste tu contraseña?</a>
          </div>

          {error && <p className="error-message">{error}</p>}

          <button type="submit" className="login-button" disabled={loading}>
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>
        <p className="register-link">
          ¿No tienes una cuenta? <a href="/registrar">Regístrate aquí</a>
        </p>
      </div>
    </div>
  );
}

export default Login;
