import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import './ForgotPassword.css';

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    try {
      const response = await fetch(
        `http://localhost:8080/api/auth/forgot-password?email=${encodeURIComponent(email)}`,
        { method: "POST" }
      );

      const texto = await response.text();

      if (!response.ok) {
        setError(texto || "No se pudo procesar la solicitud");
        return;
      }

      setMessage(texto);
      setTimeout(() => navigate("/login"), 3000);

    } catch (err) {
      setError("Error al procesar la solicitud: " + err.message);
    }
  };

  return (
    <div className="forgot-card">
      <h2 className="forgot-title">Recuperar Contraseña</h2>
      <form onSubmit={handleSubmit} className="forgot-form">
        <input
          type="email"
          placeholder="Correo"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        {message && <p className="mensaje-exito">{message}</p>}
        {error && <p className="mensaje-error">{error}</p>}
        <button type="submit">Enviar correo</button>
      </form>

      <button
        type="button"
        className="btn-login"
        onClick={() => navigate("/login")}
      >
        Volver a Iniciar Sesión
      </button>
    </div>
  );
}

export default ForgotPassword;
