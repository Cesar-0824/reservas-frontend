// src/pages/Register/Register.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
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
  <div className="register-card">
  <h2 className="register-title">Registro</h2>
  <form className="register-form" onSubmit={handleSubmit}>
    <div className="form-group">
      <label>Nombre</label>
      <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} required />
    </div>
    <div className="form-group">
      <label>Correo</label>
      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
    </div>
    <div className="form-group">
      <label>Contraseña</label>
      <input type="password" value={contrasena} onChange={(e) => setContrasena(e.target.value)} required />
    </div>
    {error && <p className="error-message">{error}</p>}
    <button type="submit" className="register-button" disabled={loading}>
      {loading ? "Registrando..." : "Registrar"}
    </button>
  </form>
  <p className="login-link">
    ¿Ya tienes cuenta? <a href="/login">Inicia sesión</a>
  </p>
</div>

  );
}

export default Register;
