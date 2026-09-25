// src/pages/Home/Home.jsx

import React, { useEffect, useState } from "react";

import { useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./Home.css";
import {
  FaFutbol,
  FaCalendarCheck,
  FaMapMarkerAlt,
  FaUsers,
  FaMoneyBillWave,

} from "react-icons/fa";
import clubImage from "../../assets/club.png";
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, } from 'swiper/modules';
import "bootstrap-icons/font/bootstrap-icons.css";

import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
export default function Home() {

const navigate = useNavigate();
const prevRef = useRef(null);
const nextRef = useRef(null);
const [swiperInstance, setSwiperInstance] = useState(null);


useEffect(() => {
  if (swiperInstance && prevRef.current && nextRef.current) {
    swiperInstance.params.navigation.prevEl = prevRef.current;
    swiperInstance.params.navigation.nextEl = nextRef.current;
    swiperInstance.navigation.destroy();
    swiperInstance.navigation.init();
    swiperInstance.navigation.update();
  }
}, [swiperInstance]);
  const [canchas, setCanchas] = useState([]);


  useEffect(() => {

    axios.get("http://localhost:8080/api/canchas")
      .then(res => {
        setCanchas(res.data);
      })
      .catch(error => {
        console.log("Error cargando canchas:", error);
      });

  }, []);

  // Si llegamos con un #hash en la URL (ej. desde otra pagina via Header),
  // hacemos scroll suave hasta la seccion correspondiente al cargar Home.
  useEffect(() => {
    if (window.location.hash) {
      const id = window.location.hash.replace('#', '');
      const el = document.getElementById(id);
      if (el) {
        setTimeout(() => {
          el.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    }
  }, []);

  const [detalleCancha, setDetalleCancha] = useState(null);








  console.log("Canchas recibidas:", canchas)

  const handleReservarClick = () => {
  const token = localStorage.getItem('authToken');
  const rawUser = localStorage.getItem('currentUser');

  if (!token || !rawUser) {
    navigate('/login');
    return;
  }

  let user;
  try {
    user = JSON.parse(rawUser);
  } catch {
    navigate('/login');
    return;
  }

  if (user.rol === 'admin') {
    navigate('/admin', { state: { tab: 'reservas' } });
  } else {
    navigate('/reservas', { state: { tab: 'disponibilidad' } });
  }
};

  return (
  <div className="home-wrapper">
    <div className="home-container">

      {/* HERO */}
      <section className="hero-section">

        <div className="hero-left">

          <div className="hero-badge">
            <FaFutbol />
            <span>El club ideal para reservar canchas deportivas</span>
          </div>

          <h1 className="hero-title">
            Reserva tu cancha
            <br />
            en <span>SportsMatch</span>
          </h1>

          <p className="hero-text">
            Disfruta de nuestras canchas de fútbol, vóley, tenis y más.
            Consulta horarios disponibles y realiza tu reserva de forma
            rápida, segura y desde cualquier dispositivo.
          </p>

          <div className="hero-buttons">
            <button
  type="button"
  className="btn-primary"
  onClick={handleReservarClick}
>
  Reservar Cancha
</button>
          </div>

        </div>

        <div className="hero-right">
          <div className="hero-card-glass">
            <img src={clubImage} alt="Club Deportivo" />
          </div>
        </div>

      </section>

      {/* BENEFICIOS */}
      <section className="features-section">

        <h2>¿Por qué elegir SportsMatch?</h2>

        <p className="features-description">
          Vive una mejor experiencia deportiva reservando tu cancha en línea.
        </p>

        <div className="features-grid">

          <div className="feature-card">
            <FaCalendarCheck className="feature-icon" />
            <h3>Reserva rápida</h3>
            <p>Agenda tu cancha en menos de un minuto.</p>
          </div>

          <div className="feature-card">
            <FaMapMarkerAlt className="feature-icon" />
            <h3>Horarios disponibles</h3>
            <p>Consulta la disponibilidad en tiempo real.</p>
          </div>

          <div className="feature-card">
            <FaUsers className="feature-icon" />
            <h3>Club deportivo</h3>
            <p>Forma parte de nuestra comunidad deportiva.</p>
          </div>

          <div className="feature-card">
            <FaMoneyBillWave className="feature-icon" />
            <h3>Precios accesibles</h3>
            <p>Tarifas transparentes para todos nuestros socios.</p>
          </div>

        </div>

      </section>

      {/* CANCHAS */}
      <section className="canchas-section">

        <div className="canchas-header">
          <div>
            <h2>Nuestras Canchas</h2>
            <p>Conoce nuestras instalaciones deportivas</p>
          </div>
        </div>

        <div className="canchas-slider-wrapper">

          <button ref={prevRef} className="cancha-nav-btn cancha-nav-prev">
            <i className="bi bi-arrow-left"></i>
          </button>

          <Swiper
            modules={[Navigation]}
            spaceBetween={24}
            slidesPerView={3}
            className="canchas-slider"
            onSwiper={setSwiperInstance}
            breakpoints={{
              320: { slidesPerView: 1, spaceBetween: 16 },
              576: { slidesPerView: 1.3, spaceBetween: 18 },
              768: { slidesPerView: 2, spaceBetween: 20 },
              1024: { slidesPerView: 3, spaceBetween: 22 },
              1400: { slidesPerView: 4, spaceBetween: 24 },
            }}
          >
            {canchas.map((cancha) => {
              


              return (
                <SwiperSlide key={cancha.id}>
                  <div className="cancha-card">

                    <div className="cancha-img-wrapper">
                      <span className="cancha-badge">{cancha.tipo}</span>
                      <img src={cancha.imagen} alt={cancha.nombre} />
                    </div>

                    <div className="cancha-info">
                      <h3>{cancha.nombre}</h3>

                      <div className="cancha-precio-box">
                        <span className="precio-label">Por hora</span>
                        <span className="precio-actual">S/ {cancha.precio_hora}</span>
                      </div>

                      <div className="cancha-card-acciones">
                        <button className="btn-ver-detalles" onClick={() => setDetalleCancha(cancha)}>
                          Ver Detalles
                        </button>

                        <button type="button" className="btn-reservar" onClick={handleReservarClick}>
                          Reservar
                        </button>
                      </div>
                    </div>

                  </div>
                </SwiperSlide>
              );
            })}
          </Swiper>

          <button ref={nextRef} className="cancha-nav-btn cancha-nav-next">
            <i className="bi bi-arrow-right"></i>
          </button>

        </div>

      </section>
      {detalleCancha && (
  <div className="admin-modal-overlay" onClick={() => setDetalleCancha(null)}>
    <div className="admin-modal-box" onClick={(e) => e.stopPropagation()}>
      <div className="admin-modal-header">
        <h3>{detalleCancha.nombre}</h3>
        <button className="admin-modal-close" onClick={() => setDetalleCancha(null)}>✕</button>
      </div>
      <div className="admin-modal-body">
        <img src={detalleCancha.imagen} alt={detalleCancha.nombre} style={{ width: '100%', borderRadius: 8, marginBottom: 12 }} />

        <p>
          <strong>Estado:</strong>{' '}
          <span className={`admin-cancha-estado-badge ${detalleCancha.estado === 'activa' ? 'estado-activa' : 'estado-mantenimiento'}`}>
            {detalleCancha.estado === 'activa' ? 'Activa' : 'En Mantenimiento'}
          </span>
        </p>

        {detalleCancha.estado === 'mantenimiento' && (
          <>
            <p><strong>Motivo:</strong> {detalleCancha.motivoEstado || 'No especificado'}</p>
            {detalleCancha.observacionEstado && (
              <p><strong>Observación:</strong> {detalleCancha.observacionEstado}</p>
            )}
          </>
        )}

        <p><strong>Deporte:</strong> {detalleCancha.tipo}</p>
        <p><strong>Precio por hora:</strong> S/ {detalleCancha.precio_hora}</p>
        {detalleCancha.modalidad && <p><strong>Modalidad:</strong> {detalleCancha.modalidad}</p>}
        {detalleCancha.dimensiones && <p><strong>Dimensiones:</strong> {detalleCancha.dimensiones}</p>}
        {detalleCancha.tipoSuperficie && <p><strong>Superficie:</strong> {detalleCancha.tipoSuperficie}</p>}
        {detalleCancha.iluminacion && <p><strong>Iluminación:</strong> {detalleCancha.iluminacion}</p>}
        {detalleCancha.caracteristicas && <p><strong>Características:</strong> {detalleCancha.caracteristicas}</p>}
        {detalleCancha.descripcion && <p><strong>Descripción:</strong> {detalleCancha.descripcion}</p>}
      </div>
      <div className="admin-modal-footer">
        <button className="admin-modal-cancel-btn" onClick={() => setDetalleCancha(null)}>Cerrar</button>
      </div>
    </div>
  </div>
)}
      {/* SERVICIOS */}
      <section id="servicios" className="servicios-section">
        <h2>
          Nuestros <span>Servicios</span> Deportivos
        </h2>
        <p className="servicios-description">
          En Canto Bello, nos especializamos en ofrecer espacios de calidad para tus actividades deportivas.
          Ya seas un particular, una empresa o estés organizando un evento especial, tenemos la solución perfecta para ti.
        </p>

        <div className="servicios-grid">
          <div className="servicio-card">
            <h3>Alquiler de Canchas</h3>
            <p>Disponemos de canchas de fútbol, vóley y básquet, adaptadas para distintas modalidades de juego.</p>
            <ul>
              <li>Canchas techadas y al aire libre</li>
              <li>Iluminación profesional para juegos nocturnos</li>
              <li>Vestuarios y duchas amplias y limpias</li>
            </ul>
          </div>

          <div className="servicio-card">
            <h3>Reserva Fácil y Rápida</h3>
            <p>Nuestro sistema de reservas online te permite asegurar tu espacio en minutos.</p>
            <ul>
              <li>Reservas por horas directamente desde nuestra web</li>
              <li>Consulta de disponibilidad en tiempo real</li>
              <li>Confirmación instantánea</li>
            </ul>
          </div>

          <div className="servicio-card">
            <h3>Eventos y Torneos</h3>
            <p>Organiza tus eventos o participa en nuestra comunidad deportiva.</p>
            <ul>
              <li>Alquiler para eventos deportivos y corporativos</li>
              <li>Torneos mensuales y ligas internas</li>
              <li>Espacios adaptables para reuniones y celebraciones</li>
            </ul>
          </div>
        </div>
      </section>

      {/* INFORMACIÓN */}
      <section id="informacion" className="informacion-section">
        <div className="informacion-inner">
          <h2>Descubre Canto Bello: <span>Más que Canchas</span></h2>
          <p>
            En Canto Bello, nuestra pasión es el deporte y nuestro compromiso es ofrecerte la mejor experiencia.
            Somos un complejo deportivo moderno y acogedor, diseñado para que disfrutes al máximo de cada partido y entrenamiento.
          </p>

          <div className="informacion-grid">
            <div className="informacion-card">
              <h3>Trayectoria y Experiencia</h3>
              <p>Con más de 10 años en el rubro deportivo, conocemos lo que necesitas. Nuestra experiencia es tu garantía de un servicio de calidad.</p>
            </div>

            <div className="informacion-card">
              <h3>Instalaciones de Primer Nivel</h3>
              <p>Contamos con canchas modernas y bien mantenidas, diseñadas para tu comodidad y rendimiento. Disfruta de espacios amplios y seguros.</p>
            </div>

            <div className="informacion-card">
              <h3>Equipo Dedicado</h3>
              <p>Nuestro personal capacitado y amable está siempre listo para asistirte, asegurando que tu experiencia en Canto Bello sea inmejorable.</p>
            </div>
          </div>
        </div>
      </section>

      

      

    </div>
  </div>
);
}
