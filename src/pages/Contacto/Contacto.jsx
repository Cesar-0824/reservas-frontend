// src/pages/Contacto/Contacto.jsx
import React, { useState } from 'react';
import './Contacto.css';

function Contacto() {
  const [formData, setFormData] = useState({
    nombre: '',
    correo: '',
    mensaje: ''
  });

  const [status, setStatus] = useState(''); // Mensaje de estado (éxito o error)

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setStatus('Enviando...');

    // Simulación de envío (puedes reemplazar con fetch o axios)
    setTimeout(() => {
      console.log('Formulario enviado:', formData);
      setStatus('¡Mensaje enviado con éxito! Te responderemos pronto.');
      setFormData({ nombre: '', correo: '', mensaje: '' });
    }, 1500);
  };

  return (
    <div className="contacto-container">
      <h1>Contáctanos</h1>
      
      <div className="contact-info">
        <p><span>Dirección:</span> Av. Las Palmeras 123, Lima</p>
        <p><span>Teléfono:</span> +51 987 654 321</p>
        <p><span>Email:</span> contacto@cantobello.com</p>
      </div>

      <form className="contact-form" onSubmit={handleSubmit}>
        <input
          type="text"
          name="nombre"
          placeholder="Tu nombre"
          value={formData.nombre}
          onChange={handleChange}
          required
        />
        <input
          type="email"
          name="correo"
          placeholder="Tu correo electrónico"
          value={formData.correo}
          onChange={handleChange}
          required
        />
        <textarea
          name="mensaje"
          placeholder="Escribe tu mensaje..."
          value={formData.mensaje}
          onChange={handleChange}
          required
        ></textarea>
        <button type="submit">Enviar</button>
      </form>

      {status && <p className="form-status-message">{status}</p>}
    </div>
  );
}

export default Contacto;
