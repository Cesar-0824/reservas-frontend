import React from 'react';
import './Servicios.css';

function Servicios() {
  return (
    <div className="services-container">
      <h1 className="services-title">
        Nuestros <span style={{ color: '#3f51b5' }}>Servicios</span> Deportivos
      </h1>
      <p className="services-intro">
        En Canto Bello, nos especializamos en ofrecer espacios de calidad para tus actividades deportivas.
        Ya seas un particular, una empresa o estés organizando un evento especial, tenemos la solución perfecta para ti.
      </p>

      <div className="service-cards">
        <div className="service-card">
          <h3>Alquiler de Canchas</h3>
          <p>Disponemos de canchas de fútbol, vóley y básquet, adaptadas para distintas modalidades de juego.</p>
          <ul>
            <li>Canchas techadas y al aire libre</li>
            <li>Iluminación profesional para juegos nocturnos</li>
            <li>Vestuarios y duchas amplias y limpias</li>
          </ul>
        </div>

        <div className="service-card">
          <h3>Reserva Fácil y Rápida</h3>
          <p>Nuestro sistema de reservas online te permite asegurar tu espacio en minutos.</p>
          <ul>
            <li>Reservas por horas directamente desde nuestra web</li>
            <li>Consulta de disponibilidad en tiempo real</li>
            <li>Confirmación instantánea</li>
          </ul>
        </div>

        <div className="service-card">
          <h3>Eventos y Torneos</h3>
          <p>Organiza tus eventos o participa en nuestra comunidad deportiva.</p>
          <ul>
            <li>Alquiler para eventos deportivos y corporativos</li>
            <li>Torneos mensuales y ligas internas</li>
            <li>Espacios adaptables para reuniones y celebraciones</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default Servicios;
