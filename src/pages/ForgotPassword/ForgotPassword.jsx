import React, { useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../../firebase";
import { useNavigate } from "react-router-dom";
import './ForgotPassword.css';

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const validarCorreo = async (email) => {
    const response = await fetch("http://localhost:8080/api/usuarios/validarCorreo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ correo: email })
    });
    const data = await response.json();
    return data;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    try {
      // ✅ Validar en BD y Firebase desde backend
      const resultado = await validarCorreo(email);
      if (!resultado.estado) {
        setError(resultado.mensaje);
        return;
      }

      // ✅ Enviar correo de recuperación desde Firebase
      await sendPasswordResetEmail(auth, email);
      setMessage("Se envió un correo para restablecer la contraseña.");

      // Redirigir después de 3s
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

  {/* Botón de volver al login, mismo tamaño y estilo */}
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
