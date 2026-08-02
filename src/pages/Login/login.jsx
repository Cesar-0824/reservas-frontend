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
  <div className="login-page">

    {/* ==========================
        LADO IZQUIERDO
    =========================== */}
    <div className="login-left">


      <div className="overlay">

        <div className="brand">
          <h1>⚽ SportsMatch</h1>
          <span>¡Disfruta de tu pasión!</span>
        </div>

        <h2>Reserva tu cancha en cualquier momento.</h2>

        <p>
          Encuentra las mejores canchas de fútbol de tu ciudad,
          consulta horarios disponibles y realiza tus reservas
          de forma rápida, sencilla y segura.
        </p>

        <div className="features">

          <div className="feature">
            <span>⚽</span>
            <div>
              <h4>Reserva rápida</h4>
              <p>Elige fecha y horario en segundos.</p>
            </div>
          </div>

          <div className="feature">
            <span>📅</span>
            <div>
              <h4>Disponibilidad en tiempo real</h4>
              <p>Consulta las canchas libres al instante.</p>
            </div>
          </div>

          <div className="feature">
            <span>💳</span>
            <div>
              <h4>Pagos seguros</h4>
              <p>Confirma tu reserva fácilmente.</p>
            </div>
          </div>

        </div>

      </div>

    </div>

    {/* ==========================
        LADO DERECHO
    =========================== */}

    <div className="login-right">

      <button
          type="button"
          onClick={() => navigate("/")}
          className="back-btn-right"
        >
          ← Volver
        </button>

      <div className="login-card">

        <h2 className="login-title">
          Iniciar Sesión
        </h2>

        <p className="login-subtitle">
          Bienvenido nuevamente 👋
        </p>

        <form
          onSubmit={handleSubmit}
          className="login-form"
        >

          <div className="form-group">
            <label htmlFor="email">
              Correo Electrónico
            </label>

            <input
              type="email"
              id="email"
              placeholder="correo@ejemplo.com"
              value={formData.email}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">

            <label htmlFor="password">
              Contraseña
            </label>

            <input
              type="password"
              id="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              required
              disabled={loading}
            />

          </div>

          <div className="forgot-password">
            <a href="/forgot-password">
              ¿Olvidaste tu contraseña?
            </a>
          </div>

          {error && (
            <p className="error-message">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="login-button"
            disabled={loading}
          >
            {loading ? "Ingresando..." : "Ingresar"}
          </button>

        </form>

        <p className="register-link">
          ¿No tienes una cuenta?
          <a href="/registrar">
            {" "}Regístrate aquí
          </a>
        </p>

      </div>

    </div>

  </div>
);
}

export default Login;
