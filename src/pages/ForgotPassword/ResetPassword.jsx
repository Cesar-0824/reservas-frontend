import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import "./ForgotPassword.css";

function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    if (!token) {
      setError("Enlace inválido: falta el token.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `http://localhost:8080/api/auth/reset-password?token=${encodeURIComponent(token)}&nuevaContraseña=${encodeURIComponent(password)}`,
        { method: "POST" }
      );

      const texto = await response.text();

      if (!response.ok) {
        setError(texto || "Error al restablecer la contraseña");
        setLoading(false);
        return;
      }

      setMessage("¡Contraseña actualizada con éxito! Redirigiendo al Login...");
      setTimeout(() => navigate("/login"), 3000);
    } catch (err) {
      setError("Error de conexión con el servidor");
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
          <h2>Crea tu nueva clave</h2>
          <p>
            Asegura tu cuenta eligiendo una contraseña fuerte y fácil de recordar para ti.
          </p>

          <div className="forgot-features">
            <div className="forgot-feature">
              <span>🔑</span>
              <div>
                <h4>Requisitos Recomendados</h4>
                <p>Usa al menos 6 caracteres combinando letras y números.</p>
              </div>
            </div>
            <div className="forgot-feature">
              <span>🛡️</span>
              <div>
                <h4>Protección Continua</h4>
                <p>Al guardar, cerraremos cualquier sesión abierta por seguridad.</p>
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
          <h2 className="forgot-title">Nueva Contraseña</h2>
          <p className="forgot-subtitle">
            Ingresa y confirma tu nueva clave de acceso.
          </p>

          <form onSubmit={handleSubmit}>
            <div className="forgot-form-group">
              <label>Nueva contraseña</label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="forgot-form-group">
              <label>Confirmar contraseña</label>
              <input
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            {message && <p className="forgot-mensaje-exito">{message}</p>}
            {error && <p className="forgot-error-message">{error}</p>}

            <button type="submit" className="forgot-button" disabled={loading}>
              {loading ? "Guardando..." : "Guardar nueva contraseña"}
            </button>
          </form>

          <div className="forgot-link">
            <button className="forgot-link-btn" onClick={() => navigate("/login")}>
              Volver a Iniciar Sesión
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
  
export default ResetPassword;
