  import React, { useState, useEffect } from 'react';
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

    useEffect(() => {
      if (show && canchaInfo) {
        setTotalPrice(duration * (canchaInfo.precio_hora || 0));
      }
    }, [duration, canchaInfo, show]);

    if (!show || !slotInfo || !canchaInfo || !currentUser) return null;

    const handleDurationChange = (e) => {
      const dur = parseInt(e.target.value);
      setDuration(dur >= 1 && dur <= 3 ? dur : 1);
    };

    const handlePago = () => {
      if (onPagar) {
        onPagar();  // Se llamará desde el componente padre para iniciar pago
      }
    };

    const handleConfirm = () => {
      if (onConfirm) {
        onConfirm(slotInfo.time, duration, totalPrice);
      }
    };

    const startHour = parseInt(slotInfo.time.split(':')[0]);
    const endHour = String(startHour + duration).padStart(2, '0') + ':00';

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
            <label htmlFor="duration"><FaClock /> Duración (1-3 horas):</label>
            <input
              type="number"
              id="duration"
              min="1"
              max="3"
              value={duration}
              onChange={handleDurationChange}
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