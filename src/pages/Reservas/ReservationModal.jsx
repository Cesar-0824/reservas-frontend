import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './ReservationModal.css';
import {
  FaTimes,
  FaCalendarAlt,
  FaClock,
  FaFutbol,
  FaDollarSign,
  FaUserCircle,
} from 'react-icons/fa';

// Formatea horas decimales (ej. 1.5) a "1 h 30 min"
function formatDuracion(horas) {
  const totalMin = Math.round(horas * 60);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h} h`;
  return `${h} h ${m} min`;
}

// Suma una duración en horas decimales (ej. 1.5) a un "HH:mm"
function sumarHoras(horaInicio, duracionHoras) {
  const [h, m] = horaInicio.split(':').map(Number);
  const totalMinutos = h * 60 + m + Math.round(duracionHoras * 60);
  const horas = Math.floor(totalMinutos / 60) % 24;
  const minutos = totalMinutos % 60;
  return String(horas).padStart(2, '0') + ':' + String(minutos).padStart(2, '0');
}

function ReservationModal({
  show,
  onClose,
  slotInfo,
  canchaInfo,
  currentUser,
  onConfirm,
  onPagar,
  onReservaExitosa
}) {
  const [duration, setDuration] = useState(1);
  const [totalPrice, setTotalPrice] = useState(0);
  const [duracionMinima, setDuracionMinima] = useState(0.5);
  const [duracionMaxima, setDuracionMaxima] = useState(3);

  useEffect(() => {
    if (show) {
      axios.get('http://localhost:8080/api/configuracion')
        .then(res => {
          const min = res.data.duracionMinima || 0.5;
          const max = res.data.duracionMaxima || 3;
          setDuracionMinima(min);
          setDuracionMaxima(max);
          setDuration(min);
        })
        .catch(err => console.error('Error cargando configuración:', err));
    }
  }, [show]);

  useEffect(() => {
    if (show && canchaInfo) {
      const dur = parseFloat(duration) || 0;
      setTotalPrice(dur * (canchaInfo.precio_hora || 0));
    }
  }, [duration, canchaInfo, show]);

  if (!show || !slotInfo || !canchaInfo || !currentUser) return null;

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm(slotInfo.time, duration, totalPrice);
    }
  };

  const endHour = sumarHoras(slotInfo.time, duration);

  // Genera las opciones de 30 en 30 minutos entre duracionMinima y duracionMaxima
  const opcionesDuracion = [];
  for (let h = duracionMinima; h <= duracionMaxima + 0.0001; h += 0.5) {
    opcionesDuracion.push(Math.round(h * 100) / 100);
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-button" onClick={onClose}>
          <FaTimes />
        </button>
        <h2>Confirmar Reserva</h2>

        <div className="modal-detail-item">
          <FaUserCircle /> Usuario: <strong>{currentUser.nombreUsuario}</strong>
        </div>
        <div className="modal-detail-item">
          <FaFutbol /> Cancha: <strong>{canchaInfo.nombre} ({canchaInfo.tipo})</strong>
        </div>
        <div className="modal-detail-item">
          <FaCalendarAlt /> Fecha: <strong>{slotInfo.date}</strong>
        </div>
        <div className="modal-detail-item">
          <FaClock /> Hora de Inicio: <strong>{slotInfo.time}</strong>
        </div>
        <div className="modal-detail-item">
          <FaClock /> Hora de Fin: <strong>{endHour}</strong>
        </div>

        <div className="modal-detail-item">
          <label htmlFor="duration"><FaClock /> Duración:</label>
          <select
            id="duration"
            value={duration}
            onChange={(e) => setDuration(parseFloat(e.target.value))}
          >
            {opcionesDuracion.map((h) => (
              <option key={h} value={h}>
                {formatDuracion(h)}
              </option>
            ))}
          </select>
        </div>

        <span style={{ fontWeight: 700 }}>S/</span> Precio por hora: <strong>S/ {canchaInfo.precio_hora?.toFixed(2)}</strong>
        <div className="modal-detail-item">
          <span style={{ fontWeight: 700 }}>S/</span> Total a pagar: <strong>S/ {totalPrice.toFixed(2)}</strong>
        </div>

        <div className="modal-actions">
          <button className="modal-cancel-btn" onClick={onClose}>Cancelar</button>
          <button className="modal-confirm-btn" onClick={handleConfirm}>Confirmar Reserva</button>
        </div>
      </div>
    </div>
  );
}

export default ReservationModal;