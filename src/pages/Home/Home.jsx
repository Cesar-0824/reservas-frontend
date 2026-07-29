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
  FaMoneyBillWave
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

console.log("Canchas recibidas:", canchas)

  return (

    
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
            en <span>SportsMacth</span>
          </h1>

          <p className="hero-text">
            Disfruta de nuestras canchas de fútbol, vóley, tenis y más.
            Consulta horarios disponibles y realiza tu reserva de forma
            rápida, segura y desde cualquier dispositivo.
          </p>

          <div className="hero-buttons">

            <button
              className="btn-primary"
              onClick={() => navigate("/login")}
            >
              Reservar Cancha
            </button>

            

          </div>

        </div>

        <div className="hero-right">
          <img src={clubImage} alt="Club Deportivo" />
        </div>

      </section>

      {/* BENEFICIOS */}

      <section className="features-section">

        <h2>¿Por qué elegir SportsMacth?</h2>

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
        320: { slidesPerView: 1 },
        768: { slidesPerView: 2 },
        1200: { slidesPerView: 3 },
      }}
    >
      {canchas.map((cancha) => (
        <SwiperSlide key={cancha.id}>
          <div className="cancha-card">

            <div className="cancha-img-wrapper">
              <span className="cancha-badge">{cancha.tipo}</span>
              <img
                src={`http://localhost:8080${encodeURI(cancha.imagen)}`}
                alt={cancha.nombre}
              />
            </div>

            <div className="cancha-info">
              <h3>{cancha.nombre}</h3>

              <div className="cancha-precio-box">
                <span className="precio-label">Por hora</span>
                <span className="precio-actual">S/ {cancha.precio_hora}</span>
              </div>

              <button
                className="btn-reservar"
                onClick={() => navigate("/login")}
              >
                Reservar
              </button>
            </div>

          </div>
        </SwiperSlide>
      ))}
    </Swiper>

    <button ref={nextRef} className="cancha-nav-btn cancha-nav-next">
      <i className="bi bi-arrow-right"></i>
    </button>

  </div>

</section>
        
  </div>
  );
}