// src/pages/Register/Register.jsx
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./Register.css"; // o la ruta correcta


function Register() {
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("http://localhost:8080/api/usuarios/registrar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre, email, contrasena }), // ⬅ aquí usamos 'contrasena'
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Error al registrar usuario");
        setLoading(false);
        return;
      }

      alert("Usuario registrado correctamente");
      setLoading(false);
      navigate("/login");
    } catch (err) {
      setError("Error al conectar con el servidor");
      setLoading(false);
    }
  };

 return (
    <div className="login-page">

      {/* ==========================
          LADO IZQUIERDO (Branding)
      =========================== */}
      <div className="login-left">
        <div className="overlay">
          <div className="brand">
            <h1>⚽ SportsMatch</h1>
            <span>¡Disfruta de tu pasión!</span>
          </div>

          <h2>Únete a nuestra comunidad deportiva.</h2>

          <p>
            Crea tu cuenta en pocos segundos para reservar tus canchas favoritas, 
            consultar disponibilidad en tiempo real y organizar tus partidos.
          </p>

          <div className="features">
            <div className="feature">
              <span>🚀</span>
              <div>
                <h4>Registro rápido</h4>
                <p>Solo necesitas tus datos básicos para empezar.</p>
              </div>
            </div>

            <div className="feature">
              <span>📅</span>
              <div>
                <h4>Reservas en tiempo real</h4>
                <p>Consulta canchas disponibles al instante.</p>
              </div>
            </div>

            <div className="feature">
              <span>💳</span>
              <div>
                <h4>Pagos seguros</h4>
                <p>Confirma tu reserva de forma sencilla.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ==========================
          LADO DERECHO (Formulario)
      =========================== */}
      <div className="login-right">

        {/* Botón Volver posicionado en la parte superior derecha */}
        <button
          type="button"
          onClick={() => navigate("/")}
          className="back-btn-right"
        >
          ← Volver
        </button>

        <div className="register-card">
          <h2 className="register-title">Crear Cuenta</h2>

          <form className="register-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Nombre</label>
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Tu nombre completo"
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label>Correo Electrónico</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="correo@ejemplo.com"
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label>Contraseña</label>
              <input
                type="password"
                value={contrasena}
                onChange={(e) => setContrasena(e.target.value)}
                placeholder="••••••••"
                required
                disabled={loading}
              />
            </div>

            {error && <p className="error-message">{error}</p>}

            <button type="submit" className="register-button" disabled={loading}>
              {loading ? "Registrando..." : "Registrar"}
            </button>
          </form>

          <p className="login-link">
            ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
          </p>
        </div>

      </div>

    </div>
  );
}

export default Register;