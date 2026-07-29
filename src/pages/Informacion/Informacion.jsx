
import React from 'react';
import './Informacion.css';


function Informacion() {
  return (
    <div className="informacion-container">
  <h1>Descubre Canto Bello: <span style={{ color: '#3f51b5' }}>Más que Canchas</span></h1>
  <p>
    En Canto Bello, nuestra pasión es el deporte y nuestro compromiso es ofrecerte la mejor experiencia.
    Somos un complejo deportivo moderno y acogedor, diseñado para que disfrutes al máximo de cada partido y entrenamiento.
  </p>

  <div className="informacion-highlights">
    <div className="informacion-item">
      <h3>Trayectoria y Experiencia</h3>
      <p>Con más de 10 años en el rubro deportivo, conocemos lo que necesitas. Nuestra experiencia es tu garantía de un servicio de calidad.</p>
    </div>

    <div className="informacion-item">
      <h3>Instalaciones de Primer Nivel</h3>
      <p>Contamos con canchas modernas y bien mantenidas, diseñadas para tu comodidad y rendimiento. Disfruta de espacios amplios y seguros.</p>
    </div>

    <div className="informacion-item">
      <h3>Equipo Dedicado</h3>
      <p>Nuestro personal capacitado y amable está siempre listo para asistirte, asegurando que tu experiencia en Canto Bello sea inmejorable.</p>
    </div>
  </div>
</div>

  );
}

export default Informacion;