import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./ForgotPassword.css";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");
    setLoading(true);

    try {
      const response = await fetch(
        `http://localhost:8080/api/auth/forgot-password?email=${encodeURIComponent(email)}`,
        { method: "POST" }
      );

      const texto = await response.text();

      if (!response.ok) {
        setError(texto || "No se pudo procesar la solicitud");
        setLoading(false);
        return;
      }

      setMessage(texto);
      setTimeout(() => navigate("/login"), 3000);

    } catch (err) {
      setError("Error al procesar la solicitud: " + err.message);
      setLoading(false);
    }
  };

  return (
    <div className="forgot-page">
      {/* PANEL IZQUIERDO */}
      <div className="forgot-left">
        <div className="forgot-overlay">
          <div className="forgot-brand">
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontSize: "2.8rem", display: "inline-block" }}>⚽</span>
              <h1>SportsMatch</h1>
            </div>
            <span>¡Disfruta de tu pasión!</span>
          </div>
          <h2>¿Problemas para ingresar?</h2>
          <p>
            No te preocupes. Te ayudaremos a recuperar el acceso a tu cuenta para que no te pierdas ninguna reserva.
          </p>

          <div className="forgot-features">
            <div className="forgot-feature">
              <span>🔒</span>
              <div>
                <h4>Proceso Seguro</h4>
                <p>Enviamos un enlace directo de verificación a tu correo.</p>
              </div>
            </div>
            <div className="forgot-feature">
              <span>⚡</span>
              <div>
                <h4>Rápido y Sencillo</h4>
                <p>Restablece tu clave en menos de 2 minutos.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* PANEL DERECHO */}
      <div className="forgot-right">
        <button className="forgot-back-btn" onClick={() => navigate("/login")}>
          ← Volver
        </button>

        <div className="forgot-card">
          <h2 className="forgot-title">Recuperar Contraseña</h2>
          <p className="forgot-subtitle">
            Ingresa tu correo y te enviaremos las instrucciones.
          </p>

          <form onSubmit={handleSubmit}>
            <div className="forgot-form-group">
              <label htmlFor="email">Correo Electrónico</label>
              <input
                id="email"
                type="email"
                placeholder="correo@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            {message && <p className="forgot-mensaje-exito">{message}</p>}
            {error && <p className="forgot-error-message">{error}</p>}

            <button type="submit" className="forgot-button" disabled={loading}>
              {loading ? "Enviando..." : "Enviar correo"}
            </button>
          </form>

          <div className="forgot-link">
            ¿Recordaste tu contraseña?
            <button type="button" className="forgot-link-btn" onClick={() => navigate("/login")}>
              Inicia Sesión
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;
