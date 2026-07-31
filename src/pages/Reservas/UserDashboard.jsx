// src/pages/Reservas/UserDashboard.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './UserDashboard.css';
import ReservationModal from './ReservationModal';
import {
  FaCoins, FaUserCircle, FaSignOutAlt, FaCalendarAlt, FaClock, FaFutbol,
  FaPlusCircle, FaTimesCircle, FaTachometerAlt, FaClipboardList,
  FaSearch
} from 'react-icons/fa';

const parseLocalDateString = (dateStr) => {
  if (!dateStr) return null;
  const [year, month, day] = dateStr.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  return isNaN(date.getTime()) ? null : date;
};

const generateTimeSlots = () =>
  Array.from({ length: 17 }, (_, i) => `${String(i + 7).padStart(2, '0')}:00`);

function UserDashboard({ onLogout }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [reservas, setReservas] = useState([]);
  const [canchas, setCanchas] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedCanchaId, setSelectedCanchaId] = useState('');
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlotInfo, setSelectedSlotInfo] = useState(null);
  const [selectedCanchaInfo, setSelectedCanchaInfo] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoadingReservas, setIsLoadingReservas] = useState(true);
  const [isLoadingCanchas, setIsLoadingCanchas] = useState(true);
  const [isLoadingAvailability, setIsLoadingAvailability] = useState(false);
  const [errorReservas, setErrorReservas] = useState('');
  const [errorCanchas, setErrorCanchas] = useState('');
  const [availabilityError, setAvailabilityError] = useState('');

  // Navegacion tipo sidebar, igual que el AdminDashboard
  const [activeTab, setActiveTab] = useState('dashboard');

  // Cargar usuario desde localStorage
  useEffect(() => {
    const raw = localStorage.getItem('currentUser');
    try {
      const user = JSON.parse(raw);
      if (user?.id) setCurrentUser(user);
      else onLogout?.();
    } catch {
      onLogout?.();
    }
  }, [onLogout]);

  const authHeaders = () => {
    const token = localStorage.getItem('authToken');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  // Funcion para cargar reservas filtrando solo las del usuario actual
  const refrescarDatos = async () => {
    if (!currentUser) return;
    setIsLoadingReservas(true);
    setAvailabilityError('');
    try {
      const response = await axios.get("http://localhost:8080/api/reservas", {
        headers: authHeaders(),
      });
      const userId = currentUser.id || currentUser.userId;
      const misReservas = response.data.filter(r => r.usuario?.id === userId || r.usuario?.userId === userId);
      setReservas(misReservas);
      setErrorReservas('');

      if (selectedDate && selectedCanchaId) {
        actualizarDisponibilidad(selectedDate, selectedCanchaId, misReservas);
      } else {
        setAvailableSlots([]);
      }

    } catch (error) {
      console.error("Error al cargar reservas:", error);
      setErrorReservas("No se pudieron cargar tus reservas.");
      if (error.response?.status === 401) onLogout?.();
    } finally {
      setIsLoadingReservas(false);
    }
  };

  useEffect(() => {
    if (currentUser) refrescarDatos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  // Cargar canchas
  useEffect(() => {
    const fetchCanchas = async () => {
      try {
        const res = await axios.get('http://localhost:8080/api/canchas', { headers: authHeaders() });
        setCanchas(res.data);
        setErrorCanchas('');
      } catch (err) {
        console.error("Error canchas:", err);
        setErrorCanchas("No se pudieron cargar las canchas.");
        if (err.response?.status === 401) onLogout?.();
      } finally {
        setIsLoadingCanchas(false);
      }
    };
    fetchCanchas();
  }, [onLogout]);

  const actualizarDisponibilidad = (fecha, canchaId, reservasData) => {
    const cancha = canchas.find(c => c.id === parseInt(canchaId));
    if (!cancha) {
      setAvailabilityError("Cancha no encontrada.");
      setAvailableSlots([]);
      return;
    }

    const reservasHoy = reservasData.filter(r =>
      r.cancha?.id === cancha.id && r.fechaReserva === fecha
    );

    const disponibilidad = generateTimeSlots().map(slot => {
      const hour = parseInt(slot.split(':')[0]);
      const ocupada = reservasHoy.find(r => {
        const start = parseInt(r.horaInicio.split(':')[0]);
        const end = parseInt(r.horaFin.split(':')[0]);
        return hour >= start && hour < end;
      });
      return {
        time: slot,
        status: ocupada ? 'Ocupado' : 'Disponible',
        reservaInfo: ocupada || null
      };
    });

    setAvailableSlots(disponibilidad);

    if (disponibilidad.every(s => s.status === 'Ocupado')) {
      setAvailabilityError("Todas las horas estan ocupadas.");
    } else {
      setAvailabilityError('');
    }
  };

  const handleSearchAvailability = async (e) => {
    e.preventDefault();
    if (!selectedDate || !selectedCanchaId) {
      setAvailabilityError("Selecciona fecha y cancha.");
      setAvailableSlots([]);
      return;
    }
    const fechaSeleccionada = parseLocalDateString(selectedDate);

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const limite = new Date();
    limite.setMonth(limite.getMonth() + 2);
    limite.setHours(0, 0, 0, 0);

    if (fechaSeleccionada < hoy) {
      setAvailabilityError("No puedes reservar fechas anteriores a hoy.");
      setAvailableSlots([]);
      return;
    }

    if (fechaSeleccionada > limite) {
      setAvailabilityError("Solo puedes reservar hasta 2 meses desde hoy.");
      setAvailableSlots([]);
      return;
    }
    setIsLoadingAvailability(true);
    try {
      actualizarDisponibilidad(selectedDate, selectedCanchaId, reservas);
    } catch (err) {
      console.error("Error disponibilidad:", err);
      setAvailabilityError("Error consultando disponibilidad.");
      if (err.response?.status === 401) onLogout?.();
    } finally {
      setIsLoadingAvailability(false);
    }
  };

  const handleReservar = (hora) => {
    const cancha = canchas.find(c => c.id === parseInt(selectedCanchaId));
    if (!cancha || !selectedDate || !hora || !currentUser) return alert("Datos incompletos");
    setSelectedSlotInfo({ time: hora, date: selectedDate });
    setSelectedCanchaInfo(cancha);
    setIsModalOpen(true);
  };

  const handleConfirmReservation = async (horaInicio, duracion, total) => {
    const horaFin = String(parseInt(horaInicio.split(':')[0]) + duracion).padStart(2, '0') + ':00';
    const nuevaReserva = {
      usuario: { id: currentUser.id },
      cancha: { id: selectedCanchaInfo.id },
      fechaReserva: selectedDate,
      horaInicio,
      horaFin,
      estado: "pendiente",
      montoTotal: total,
      metodoPago: "efectivo"
    };
    try {
      await axios.post('http://localhost:8080/api/reservas/crear', nuevaReserva, { headers: authHeaders() });
      alert("Reserva confirmada.");
      setIsModalOpen(false);
      refrescarDatos();
    } catch (err) {
      console.error("Error al reservar:", err);
      alert("No se pudo confirmar la reserva.");
    }
  };

  const handleCancelarReserva = async (id) => {
    if (!window.confirm("¿Cancelar reserva?")) return;
    try {
      await axios.delete(`http://localhost:8080/api/reservas/${id}`, { headers: authHeaders() });
      alert("Reserva cancelada.");
      refrescarDatos();
    } catch (err) {
      console.error("Error cancelar:", err);
      alert("No se pudo cancelar.");
      if (err.response?.status === 401) onLogout?.();
    }
  };

  const handlePagoFicticio = async (reservaId) => {
    const ventanaPago = window.open('', '_blank');
    if (!ventanaPago) {
      alert('Por favor habilita ventanas emergentes');
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      const res = await axios.post(
        `http://localhost:8080/api/crear-preferencia?reservaId=${reservaId}`,
        null,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const linkPago = res.data.url || res.data;
      if (!linkPago) {
        ventanaPago.close();
        alert('No se pudo obtener el link de pago.');
        return;
      }

      ventanaPago.location.href = linkPago;

      setTimeout(async () => {
        ventanaPago.close();

        try {
          await axios.post(
            `http://localhost:8080/api/reservas/${reservaId}/pagar`,
            null,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          alert('Pago confirmado y reserva actualizada');
          refrescarDatos();
        } catch (error) {
          alert('Error al confirmar el pago');
          console.error(error);
        }
      }, 10000);

    } catch (error) {
      ventanaPago.close();
      alert('Error iniciando pago.');
      console.error(error);
    }
  };

  if (!currentUser) return <div className="user-loading">Verificando usuario...</div>;

  const reservasPendientes = reservas.filter(r => r.estado === 'pendiente').length;
  const reservasConfirmadas = reservas.filter(r => r.estado === 'confirmada').length;
  return (
    <div className="user-dashboard-container">
      <aside className="user-sidebar">
        <h2>Mi Panel</h2>
        <div className="user-nav">
          <button onClick={() => setActiveTab('dashboard')} className={activeTab === 'dashboard' ? 'active' : ''}>
            <FaTachometerAlt /> Dashboard
          </button>
          <button onClick={() => setActiveTab('disponibilidad')} className={activeTab === 'disponibilidad' ? 'active' : ''}>
            <FaSearch /> Consultar Disponibilidad
          </button>
          <button onClick={() => setActiveTab('reservas')} className={activeTab === 'reservas' ? 'active' : ''}>
            <FaClipboardList /> Mis Reservas
          </button>
          <button onClick={() => setActiveTab('canchas')} className={activeTab === 'canchas' ? 'active' : ''}>
            <FaFutbol /> Canchas
          </button>
          <button className="user-logout-button" onClick={onLogout}>
            <FaSignOutAlt /> Cerrar Sesion
          </button>
        </div>
      </aside>

      <div className="user-content">
        <header className="user-header">
          <div className="user-info">
            <FaUserCircle className="user-icon" />
            <h3>Hola, {currentUser.nombreUsuario}</h3>
          </div>
        </header>

        {activeTab === 'dashboard' && (
          <section className="user-summary">
            <div className="user-summary-card">
              <FaClipboardList className="icon" />
              <h3>{reservas.length}</h3>
              <p>Mis Reservas Totales</p>
            </div>
            <div className="user-summary-card">
              <FaClock className="icon" />
              <h3>{reservasPendientes}</h3>
              <p>Reservas Pendientes</p>
            </div>
            <div className="user-summary-card">
              <FaCalendarAlt className="icon" />
              <h3>{reservasConfirmadas}</h3>
              <p>Reservas Confirmadas</p>
            </div>
            <div className="user-summary-card">
              <FaFutbol className="icon" />
              <h3>{canchas.length}</h3>
              <p>Canchas Disponibles</p>
            </div>
          </section>
        )}

        {activeTab === 'disponibilidad' && (
          <section className="user-table-section">
            <h3>Consultar Disponibilidad</h3>

            <form className="user-consulta-form" onSubmit={handleSearchAvailability}>
              <div className="user-form-group">
                <label>Fecha:</label>
                <div className="user-input-with-icon">
                  <FaCalendarAlt className="input-icon" />
                  <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} required />
                </div>
              </div>
              <div className="user-form-group">
                <label>Cancha:</label>
                <div className="user-input-with-icon">
                  <FaFutbol className="input-icon" />
                  <select value={selectedCanchaId} onChange={e => setSelectedCanchaId(e.target.value)} required>
                    <option value="">Seleccionar Cancha</option>
                    {canchas.map(c => (
                      <option key={c.id} value={c.id}>{c.nombre} ({c.tipo})</option>
                    ))}
                  </select>
                </div>
              </div>
              <button type="submit" className="user-main-button" disabled={isLoadingAvailability}>
                {isLoadingAvailability ? 'Buscando...' : 'Consultar'}
              </button>
            </form>

            {availabilityError && <p className="user-error-message">{availabilityError}</p>}

            {isLoadingAvailability ? (
              <p>Cargando horarios...</p>
            ) : availableSlots.length > 0 && (
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th><FaClock /> Hora</th>
                      <th>Estado</th>
                      <th>Detalle</th>
                      <th>Accion</th>
                    </tr>
                  </thead>
                  <tbody>
                    {availableSlots.map(s => (
                      <tr key={s.time} className={s.status === 'Ocupado' ? 'user-slot-ocupado' : 'user-slot-disponible'}>
                        <td>{s.time}</td>
                        <td>{s.status}</td>
                        <td>
                          {s.status === 'Ocupado' && s.reservaInfo
                            ? `Reservado por ${s.reservaInfo.usuario?.nombre || 'N/A'} (${s.reservaInfo.horaInicio}-${s.reservaInfo.horaFin})`
                            : 'Disponible para reservar'}
                        </td>
                        <td>
                          {s.status === 'Disponible' && (
                            <button className="user-reserve-button" onClick={() => handleReservar(s.time)}>
                              <FaPlusCircle /> Reservar
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {activeTab === 'reservas' && (
          <section className="user-table-section">
            <h3>Mis Reservas</h3>
            {isLoadingReservas ? (
              <p>Cargando reservas...</p>
            ) : errorReservas ? (
              <p className="user-error-message">{errorReservas}</p>
            ) : reservas.length === 0 ? (
              <p>No hay reservas registradas.</p>
            ) : (
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Cancha</th>
                      <th>Fecha</th>
                      <th>Inicio</th>
                      <th>Fin</th>
                      <th>Precio/Hora</th>
                      <th>Monto Total</th>
                      <th>Estado</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reservas.map(r => (
                      <tr key={r.id}>
                        <td>{r.cancha?.nombre}</td>
                        <td>{parseLocalDateString(r.fechaReserva)?.toLocaleDateString('es-ES') || 'N/A'}</td>
                        <td>{r.horaInicio}</td>
                        <td>{r.horaFin}</td>
                        <td>S/ {r.cancha?.precio_hora?.toFixed(2)}</td>
                        <td>S/ {r.montoTotal?.toFixed(2)}</td>
                        <td>
                          <span className={`user-estado-badge user-estado-${r.estado || 'pendiente'}`}>
                            {r.estado || 'Pendiente'}
                          </span>
                        </td>
                        <td>
                          <div className="user-actions-buttons">
                            <button
                              className="user-cancel-button"
                              onClick={() => handleCancelarReserva(r.id)}
                              title="Cancelar reserva"
                            >
                              <FaTimesCircle /> Cancelar
                            </button>
                            {r.estado === "confirmada" && (
                              <button
                                className="user-pay-button"
                                onClick={() => handlePagoFicticio(r.id)}
                                title="Pagar reserva (ficticio)"
                              >
                                <FaCoins /> Pagar
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {activeTab === 'canchas' && (
          <section className="user-table-section">
            <h3>Canchas Disponibles</h3>
            {isLoadingCanchas ? (
              <p>Cargando canchas...</p>
            ) : errorCanchas ? (
              <p className="user-error-message">{errorCanchas}</p>
            ) : (
              <div className="user-canchas-grid">
                {canchas.map(c => (
                  <div key={c.id} className="user-cancha-item">
                    {c.imagen ? (
                      <img
                        src={`http://localhost:8080${c.imagen}`}
                        alt={c.nombre}
                        className="user-cancha-imagen"
                      />
                    ) : (
                      <div className="user-sin-imagen"><FaFutbol /> Sin imagen</div>
                    )}
                    <h4>{c.nombre}</h4>
                    <p><FaFutbol /> {c.tipo}</p>
                    <p><FaCoins /> S/ {c.precio_hora?.toFixed(2)} / hora</p>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </div>

      <ReservationModal
        show={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleConfirmReservation}
        slotInfo={selectedSlotInfo}
        canchaInfo={selectedCanchaInfo}
        currentUser={currentUser}
        onReservaExitosa={refrescarDatos}
      />
    </div>
  );
}

export default UserDashboard;
