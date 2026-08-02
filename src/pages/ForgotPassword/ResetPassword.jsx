import React, { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import './ForgotPassword.css';

function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [nuevaContraseña, setNuevaContraseña] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    if (!token) {
      setError("Enlace inválido: falta el token.");
      return;
    }

    if (nuevaContraseña !== confirmar) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:8080/api/auth/reset-password?token=${encodeURIComponent(token)}&nuevaContraseña=${encodeURIComponent(nuevaContraseña)}`,
        { method: "POST" }
      );

      const texto = await response.text();

      if (!response.ok) {
        setError(texto || "No se pudo restablecer la contraseña");
        return;
      }

      setMessage(texto);
      setTimeout(() => navigate("/login"), 2500);

    } catch (err) {
      setError("Error al procesar la solicitud: " + err.message);
    }
  };

  return (
    <div className="forgot-card">
      <h2 className="forgot-title">Nueva Contraseña</h2>
      <form onSubmit={handleSubmit} className="forgot-form">
        <input
          type="password"
          placeholder="Nueva contraseña"
          value={nuevaContraseña}
          onChange={(e) => setNuevaContraseña(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Confirmar contraseña"
          value={confirmar}
          onChange={(e) => setConfirmar(e.target.value)}
          required
        />
        {message && <p className="mensaje-exito">{message}</p>}
        {error && <p className="mensaje-error">{error}</p>}
        <button type="submit">Guardar nueva contraseña</button>
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

export default ResetPassword;
