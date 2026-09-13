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
  const [duracionMinima, setDuracionMinima] = useState(1);
  const [duracionMaxima, setDuracionMaxima] = useState(3);

  useEffect(() => {
    if (show) {
      axios.get('http://localhost:8080/api/configuracion')
        .then(res => {
          setDuracionMinima(res.data.duracionMinima || 1);
          setDuracionMaxima(res.data.duracionMaxima || 3);
          setDuration(res.data.duracionMinima || 1);
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

  const handleDurationChange = (e) => {
  setDuration(e.target.value);
};

const handleDurationBlur = () => {
  let dur = parseFloat(duration);
  if (isNaN(dur) || dur < duracionMinima) dur = duracionMinima;
  if (dur > duracionMaxima) dur = duracionMaxima;
  setDuration(dur);
};

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm(slotInfo.time, duration, totalPrice);
    }
  };

  const formatHora = (horaDecimal) => {
    const horas = Math.floor(horaDecimal);
    const minutos = (horaDecimal % 1) * 60;
    return String(horas).padStart(2, '0') + ':' + String(minutos).padStart(2, '0');
  };

  const startHour = parseInt(slotInfo.time.split(':')[0]);
  const endHour = formatHora(startHour + duration);

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
          <label htmlFor="duration"><FaClock /> Duración ({duracionMinima}-{duracionMaxima} horas):</label>
          <input
  type="number"
  id="duration"
  min={duracionMinima}
  max={duracionMaxima}
  step="0.5"
  value={duration}
  onChange={handleDurationChange}
  onBlur={handleDurationBlur}
/>
        </div>

        <div className="modal-detail-item">
          <FaDollarSign /> Precio por hora: <strong>S/ {canchaInfo.precio_hora?.toFixed(2)}</strong>
        </div>
        <div className="modal-detail-item">
          <FaDollarSign /> Total a pagar: <strong>S/ {totalPrice.toFixed(2)}</strong>
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