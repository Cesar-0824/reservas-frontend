// src/pages/Reservas/UserDashboard.jsx
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './UserDashboard.css';
import ReservationModal from './ReservationModal';
import BoletaVenta from '../Boleta/BoletaVenta';
import Canchas from './Canchas';
import {
  FaCoins, FaUserCircle, FaSignOutAlt, FaCalendarAlt, FaClock, FaFutbol,
  FaPlusCircle, FaTimesCircle, FaTachometerAlt, FaClipboardList,
  FaSearch, FaCheckCircle, FaExclamationCircle, FaBell, FaHistory,
   FaUserEdit, FaMoneyBillWave , FaEye
} from 'react-icons/fa';
import { useLocation } from 'react-router-dom';

const formatFecha = (fechaStr) => {
  const fecha = parseLocalDateString(fechaStr);
  if (!fecha) return 'N/A';
  const dia = String(fecha.getDate()).padStart(2, '0');
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const anio = fecha.getFullYear();
  return `${dia}/${mes}/${anio}`;
};

const parseLocalDateString = (dateStr) => {
  if (!dateStr) return null;
  const [year, month, day] = dateStr.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  return isNaN(date.getTime()) ? null : date;
};

const generateTimeSlots = (horaApertura = '00:00', horaCierre = '00:00') => {
  const [horaInicioH, horaInicioM] = horaApertura.split(':').map(Number);
  const [horaFinH, horaFinM] = horaCierre.split(':').map(Number);

  const inicioMin = horaInicioH * 60 + horaInicioM;
  const finMin = horaFinH * 60 + horaFinM;

  const slots = [];
  const pushSlot = (totalMin) => {
    const h = Math.floor(totalMin / 60) % 24;
    const m = totalMin % 60;
    slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
  };

  if (inicioMin === finMin) {
    // Abierto 24 horas
    for (let m = 0; m < 24 * 60; m += 30) pushSlot(m);
    return slots;
  }

  if (finMin > inicioMin) {
    for (let m = inicioMin; m < finMin; m += 30) pushSlot(m);
  } else {
    // Cruza medianoche
    for (let m = inicioMin; m < 24 * 60; m += 30) pushSlot(m);
    for (let m = 0; m < finMin; m += 30) pushSlot(m);
  }

  return slots;
};

const getTimeAgo = (fecha) => {
  if (!fecha) return '';
  const seconds = Math.floor((new Date() - new Date(fecha)) / 1000);
  
  if (seconds < 60) return 'ahora';
  
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks} sem`;
  
  const months = Math.floor(days / 30);
  return `${months} mes`;
};
  const getTabTitle = (tab) => {
  const titles = {
    'dashboard': '🏠 Inicio',
    'disponibilidad': '🔍 Reservar Cancha',
    'reservas': '📋 Mis Reservas',
    'canchas': '⚽ Canchas',
    'perfil': '👤 Mi Perfil',
    'notificaciones': '🔔 Notificaciones'
  };
  return titles[tab] || '🏠 Inicio';

  
};
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
  const [, setIsLoadingCanchas] = useState(true);
  const [isLoadingAvailability, setIsLoadingAvailability] = useState(false);
  const [errorReservas, setErrorReservas] = useState('');
  const [, setErrorCanchas] = useState('');
  const [availabilityError, setAvailabilityError] = useState('');
  const [configClub, setConfigClub] = useState({ horaApertura: '00:00', horaCierre: '00:00' });
  const [activeTab, setActiveTab] = useState('dashboard');
  const [busquedaHistorial, setBusquedaHistorial] = useState("");
  const [fechaFiltroHistorial, setFechaFiltroHistorial] = useState("");
const [estadoFiltroHistorial, setEstadoFiltroHistorial] = useState("todos");


  const [toast, setToast] = useState(null);
  const mostrarToast = (tipo, texto) => {
    setToast({ tipo, texto });
    setTimeout(() => setToast(null), 3500);
  };

  const [confirmDialog, setConfirmDialog] = useState(null);

  const [motivoDialog, setMotivoDialog] = useState(null);
  const [motivoInput, setMotivoInput] = useState('');

  // ===== NUEVO: estado para Mi Perfil =====
  const [perfilForm, setPerfilForm] = useState({ nombre: '', apellido: '', email: '' });
  const [passwordForm, setPasswordForm] = useState({ nueva: '', confirmar: '' });
  const [mensajePerfil, setMensajePerfil] = useState(null);
  const [guardandoPerfil, setGuardandoPerfil] = useState(false);
  const mensajeRef = useRef(null);

const [mostrarNotifDropdown, setMostrarNotifDropdown] = useState(false);
const [subTabReservas, setSubTabReservas] = useState('vigentes'); // 'vigentes' | 'historial'
const [comprobanteDialog, setComprobanteDialog] = useState(null); // { reservaId }
const [tipoComprobante, setTipoComprobante] = useState('boleta');
const [rucFactura, setRucFactura] = useState('');
const [, setComprobantes] = useState({}); // { [reservaId]: { tipo, ruc } }
const [detallePago, setDetallePago] = useState(null); // reserva seleccionada


const [razonSocialFactura, setRazonSocialFactura] = useState('');

const [consultandoRuc, setConsultandoRuc] = useState(false);
const [direccionFactura, setDireccionFactura] = useState('');

const [notificaciones, setNotificaciones] = useState([]);
const [mostrarTodasNotif, setMostrarTodasNotif] = useState(false);

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


  const location = useLocation();

  useEffect(() => {
    if (location.state?.tab) {
      setActiveTab(location.state.tab);
    }
  }, [location.state]);


// NUEVO: precargar datos del perfil cuando el usuario esté disponible
useEffect(() => {
  if (currentUser) {
    setPerfilForm({
      nombre: currentUser.nombre || '',
      apellido: currentUser.apellido || '',
      email: currentUser.email || ''
    });
  }
}, [currentUser]);

  // NUEVO: limpiar el mensaje de perfil al cambiar de pestaña
  useEffect(() => {
    setMensajePerfil(null);
  }, [activeTab]);

  // NUEVO: hacer scroll hasta el mensaje de confirmación cuando aparece
  useEffect(() => {
    if (mensajePerfil && mensajeRef.current) {
      mensajeRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [mensajePerfil]);

  const authHeaders = () => {
    const token = localStorage.getItem('authToken');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

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

  // NUEVO: refresca las reservas periódicamente para reflejar cambios del backend
// (ej: cancelación automática por vencimiento de plazo de pago)
useEffect(() => {
  if (!currentUser) return;
  const interval = setInterval(() => {
    refrescarDatos();
  }, 30 * 1000); // cada 30 segundos
  return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [currentUser]);

  // ← AQUÍ va el nuevo, justo debajo de este
useEffect(() => {
  if (!currentUser) return;
  const intervalo = setInterval(async () => {
    try {
      const response = await axios.get("http://localhost:8080/api/reservas", {
        headers: authHeaders(),
      });
      const userId = currentUser.id || currentUser.userId;
      const misReservas = response.data.filter(r => r.usuario?.id === userId || r.usuario?.userId === userId);

      setReservas(prev => JSON.stringify(prev) === JSON.stringify(misReservas) ? prev : misReservas);
    } catch (err) {
      console.error("Error refrescando datos:", err);
    }
  }, 8000);
  return () => clearInterval(intervalo);
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [currentUser]);

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

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await axios.get('http://localhost:8080/api/configuracion', { headers: authHeaders() });
        setConfigClub({
          horaApertura: res.data.horaApertura || '00:00',
          horaCierre: res.data.horaCierre || '00:00'
        });
      } catch (err) {
        console.error("Error cargando configuración del club:", err);
      }
    };
    fetchConfig();
  }, []);

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

  const ahora = new Date();
  const hoyStr = `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, '0')}-${String(ahora.getDate()).padStart(2, '0')}`;
  const esHoy = fecha === hoyStr;
  
const aMinutos = (horaStr) => {
  const [h, m] = horaStr.split(':').map(Number);
  return h * 60 + m;
};

const disponibilidad = generateTimeSlots(configClub.horaApertura, configClub.horaCierre).map(slot => {
  const slotInicio = aMinutos(slot);
  const slotFin = slotInicio + 30; // cada slot representa un bloque de 30 min

  const ocupada = reservasHoy.find(r => {
    const estaActiva = r.estado !== 'cancelada' && r.estado !== 'vencida';
    if (!estaActiva) return false;

    const resInicio = aMinutos(r.horaInicio);
    const resFin = aMinutos(r.horaFin);

    // Overlap real: el slot de 30 min se cruza con el rango de la reserva
    return slotInicio < resFin && resInicio < slotFin;
  });

  let status;
  if (ocupada) {
    status = 'Ocupado';
} else if (esHoy && slotInicio <= (ahora.getHours() * 60 + ahora.getMinutes())) {
    status = 'Pasado';
  } else {
    status = 'Disponible';
  }

  return {
    time: slot,
    status,
    reservaInfo: ocupada || null
  };
});

  setAvailableSlots(disponibilidad);

  if (disponibilidad.every(s => s.status === 'Ocupado' || s.status === 'Pasado')) {
    setAvailabilityError("No hay horas disponibles para hoy.");
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
    if (!cancha || !selectedDate || !hora || !currentUser) {
      mostrarToast('error', 'Datos incompletos');
      return;
    }
    setSelectedSlotInfo({ time: hora, date: selectedDate });
    setSelectedCanchaInfo(cancha);
    setIsModalOpen(true);
  };

// Mismo helper que en ReservationModal.jsx
function sumarHoras(horaInicio, duracionHoras) {
  const [h, m] = horaInicio.split(':').map(Number);
  const totalMinutos = h * 60 + m + Math.round(duracionHoras * 60);
  const horas = Math.floor(totalMinutos / 60) % 24;
  const minutos = totalMinutos % 60;
  return String(horas).padStart(2, '0') + ':' + String(minutos).padStart(2, '0');
}

const handleConfirmReservation = async (horaInicio, duracion, total) => {
  const horaFin = sumarHoras(horaInicio, duracion);
  const nuevaReserva = {
    usuario: { id: currentUser.id },
    cancha: { id: selectedCanchaInfo.id },
    fechaReserva: selectedDate,
    horaInicio,
    horaFin,
    estado: "pendiente",
    metodoPago: "efectivo"
    // montoTotal ya no se envía: el backend lo calcula de forma segura
  };
  try {
    await axios.post('http://localhost:8080/api/reservas/crear', nuevaReserva, { headers: authHeaders() });
    mostrarToast('exito', 'Reserva confirmada.');
    setIsModalOpen(false);
    refrescarDatos();
  } catch (err) {
    console.error("Error al reservar:", err.response?.data);
    mostrarToast('error', err.response?.data || 'No se pudo confirmar la reserva.');
  }
};

  const handleCancelarReserva = (reserva) => {
    setMotivoInput('Ya no puedo asistir');
    setMotivoDialog({ reserva });
  };

  const confirmarCancelacionConMotivo = async () => {
    const reserva = motivoDialog.reserva;
    const reservaActualizada = {
      ...reserva,
      estado: "cancelada",
      motivoCancelacion: motivoInput || "Cancelado por el cliente",
      canceladoPor: "cliente"
    };

    try {
      await axios.put(
        `http://localhost:8080/api/reservas/actualizar/${reserva.id}`,
        reservaActualizada,
        { headers: authHeaders() }
      );
      mostrarToast('exito', 'Reserva cancelada.');
      refrescarDatos();
    } catch (err) {
      console.error("Error cancelar:", err);
      mostrarToast('error', 'No se pudo cancelar.');
      if (err.response?.status === 401) onLogout?.();
    } finally {
      setMotivoDialog(null);
    }
  };

const consultarRuc = async (ruc) => {
  if (ruc.length !== 11) return;

  setConsultandoRuc(true);

  try {
    const token = localStorage.getItem('authToken');

    const res = await axios.get(
      `http://localhost:8080/api/sunat/ruc/${ruc}`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    setRazonSocialFactura(res.data.razon_social || '');
    setDireccionFactura(res.data.direccion || '');

    mostrarToast('exito', 'Datos de la empresa cargados.');

  } catch (err) {
    setRazonSocialFactura('');
    setDireccionFactura('');

    mostrarToast('error', 'No se encontraron datos para ese RUC.');

  } finally {
    setConsultandoRuc(false);
  }
};

const handlePagoFicticio = async (reservaId, comprobanteInfo) => {
  const ventanaPago = window.open('', '_blank');
  if (!ventanaPago) {
    mostrarToast('error', 'Por favor habilita ventanas emergentes');
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
      mostrarToast('error', 'No se pudo obtener el link de pago.');
      return;
    }

    ventanaPago.location.href = linkPago;

setTimeout(async () => {
  ventanaPago.close();
  try {
    await axios.post(
      `http://localhost:8080/api/reservas/${reservaId}/pagar`,
      comprobanteInfo
        ? {
            tipo: comprobanteInfo.tipo,
            ruc: comprobanteInfo.ruc,
            razonSocial: comprobanteInfo.razonSocial,
            direccionFiscal: comprobanteInfo.direccionFiscal
          }
        : null,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (comprobanteInfo) {
      setComprobantes(prev => ({ ...prev, [reservaId]: comprobanteInfo }));
    }
    mostrarToast('exito', 'Pago confirmado y reserva actualizada');
    refrescarDatos();
  } catch (error) {
    mostrarToast('error', 'Error al confirmar el pago');
    console.error(error);
  }
}, 10000);

  } catch (error) {
    ventanaPago.close();
    mostrarToast('error', 'Error iniciando pago.');
    console.error(error);
  }
};

const guardarPerfilUsuario = async (e) => {
  e.preventDefault();
  if (passwordForm.nueva || passwordForm.confirmar) {
    if (passwordForm.nueva.length < 6) {
      setMensajePerfil({ tipo: 'error', texto: 'La contraseña debe tener al menos 6 caracteres.' });
      return;
    }
    if (passwordForm.nueva !== passwordForm.confirmar) {
      setMensajePerfil({ tipo: 'error', texto: 'Las contraseñas no coinciden.' });
      return;
    }
  }

  setGuardandoPerfil(true);
  setMensajePerfil(null);
  try {
    const body = {
      nombre: perfilForm.nombre,
      apellido: perfilForm.apellido,
      email: perfilForm.email
    };
    if (passwordForm.nueva) {
      body.contrasena = passwordForm.nueva;
    }

    const res = await axios.put(
      `http://localhost:8080/api/usuarios/mi-perfil`,
      body,
      { headers: authHeaders() }
    );

    const userActualizado = {
      ...currentUser,
      nombre: res.data.nombre,
      nombreUsuario: res.data.nombre,
      apellido: res.data.apellido,
      email: res.data.email
    };
    localStorage.setItem('currentUser', JSON.stringify(userActualizado));
    setCurrentUser(userActualizado);
    setPasswordForm({ nueva: '', confirmar: '' });

    setMensajePerfil({ tipo: 'exito', texto: 'Perfil actualizado correctamente.' });
  } catch (err) {
    setMensajePerfil({ tipo: 'error', texto: err.response?.data?.error || 'Error al actualizar el perfil.' });
  } finally {
    setGuardandoPerfil(false);
  }
};

const cargarNotificaciones = async () => {
  try {
    const token = localStorage.getItem('authToken');
    const res = await axios.get(
      `http://localhost:8080/api/notificaciones/usuario/${currentUser.id}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const ordenadas = res.data.sort((a, b) => new Date(b.fechaEnvio) - new Date(a.fechaEnvio));
    setNotificaciones(ordenadas);
  } catch (error) {
    console.error('Error cargando notificaciones:', error);
  }
};

useEffect(() => {
  if (!currentUser?.id) return;
  cargarNotificaciones();
  const interval = setInterval(cargarNotificaciones, 3 * 60 * 1000);
  return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [currentUser?.id]);

const marcarComoLeida = async (id) => {
  try {
    const token = localStorage.getItem('authToken');
    await axios.patch(
      `http://localhost:8080/api/notificaciones/${id}/leer`,
      null,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    setNotificaciones(prev =>
      prev.map(n => n.id === id ? { ...n, leida: true } : n)
    );
  } catch (error) {
    console.error('Error marcando notificación como leída:', error);
  }
};
const marcarTodasComoLeidas = async () => {
  try {
    const token = localStorage.getItem('authToken');
    await axios.patch(
      `http://localhost:8080/api/notificaciones/usuario/${currentUser.id}/leer-todas`,
      null,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    setNotificaciones(prev => prev.map(n => ({ ...n, leida: true })));
  } catch (error) {
    console.error('Error marcando todas como leídas:', error);
  }
};

  if (!currentUser) return <div className="user-loading">Verificando usuario...</div>;


  // ===== NUEVO: datos derivados para Inicio, Pagos, Notificaciones e Historial =====
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const reservasFuturas = reservas
    .filter(r => {
      const f = parseLocalDateString(r.fechaReserva);
      return f && f >= hoy && r.estado !== 'cancelada';
    })
    .sort((a, b) => {
      const fa = parseLocalDateString(a.fechaReserva);
      const fb = parseLocalDateString(b.fechaReserva);
      if (fa.getTime() !== fb.getTime()) return fa - fb;
      return a.horaInicio.localeCompare(b.horaInicio);
    });

  const proximaReserva = reservasFuturas[0] || null;

  const reservasPasadas = reservas.filter(r => {
    const f = parseLocalDateString(r.fechaReserva);
    return r.estado === 'cancelada' || (f && f < hoy);
  });

  const totalGastado = reservas
    .filter(r => r.estado === 'pagada')
    .reduce((acc, r) => acc + (r.montoTotal || 0), 0);

    function ContadorPago({ fechaLimitePago }) {
  const [tiempoRestante, setTiempoRestante] = useState('');
  const [vencido, setVencido] = useState(false);

  useEffect(() => {
    if (!fechaLimitePago) return;

    const calcular = () => {
      const limite = new Date(fechaLimitePago).getTime();
      const ahora = Date.now();
      const diff = limite - ahora;

      if (diff <= 0) {
        setVencido(true);
        setTiempoRestante('Vencido');
        return;
      }

      const minutos = Math.floor(diff / 60000);
      const segundos = Math.floor((diff % 60000) / 1000);
      setTiempoRestante(`${minutos}:${segundos.toString().padStart(2, '0')}`);
    };

    calcular();
    const interval = setInterval(calcular, 1000);
    return () => clearInterval(interval);
  }, [fechaLimitePago]);

  if (!fechaLimitePago) return null;

  return (
    <span className={vencido ? 'user-tiempo-vencido' : 'user-tiempo-restante'}>
      {tiempoRestante}
    </span>
  );
}

const reservasPasadasFiltradas = reservasPasadas
  .filter((r) => {
    if (!busquedaHistorial.trim()) return true;
    return r.cancha?.nombre?.toLowerCase().includes(busquedaHistorial.toLowerCase());
  })
  .filter((r) => {
    if (!fechaFiltroHistorial) return true;
    return r.fechaReserva === fechaFiltroHistorial;
  })
  .filter((r) => {
    if (estadoFiltroHistorial === "todos") return true;
    return r.estado === estadoFiltroHistorial;
  })
  .sort((a, b) => new Date(b.fechaReserva) - new Date(a.fechaReserva));
  
const reservasConfirmadas = reservas.filter(r => r.estado === 'confirmada').length;




  if (detallePago && detallePago.estado === 'pagada') {
  const infoComprobante = {
  tipo: detallePago.tipoComprobante || 'boleta',
  ruc: detallePago.rucComprobante,
  razonSocial: detallePago.razonSocialComprobante
};


  const esFacturaGuardada = infoComprobante.tipo === 'factura';

  const duracionHoras = parseInt(detallePago.horaFin) - parseInt(detallePago.horaInicio);
  const precioHora = detallePago.cancha?.precio_hora || (detallePago.montoTotal / duracionHoras);
  const pagoExitoso = detallePago.pagos?.find(p => p.estado === 'exitoso')
  ?? detallePago.pagos?.[detallePago.pagos.length - 1]
  ?? null;





const fechaHoraPago = pagoExitoso?.fechaPago
  ? new Date(pagoExitoso.fechaPago).toLocaleString('es-PE', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    })
  : null;




  return (
    <BoletaVenta
      onVolver={() => setDetallePago(null)}
      tipoComprobante={infoComprobante.tipo}
      cliente={{
        nombre: esFacturaGuardada ? infoComprobante.razonSocial : currentUser.nombreUsuario,
        documento: currentUser.dni || 'N/A',
        ruc: infoComprobante.ruc || 'N/A',
        direccion: esFacturaGuardada ? (detallePago.direccionFiscalComprobante || 'N/A') : (currentUser.direccion || 'N/A')
      }}
      
      comprobante={{
        numero: String(detallePago.id).padStart(8, '0'),
        fechaEmision: parseLocalDateString(detallePago.fechaReserva)?.toLocaleDateString('es-PE'),
        fechaHoraPago: fechaHoraPago //
      }}
      detalle={[{
        codigo: `RES-${String(detallePago.id).padStart(5, '0')}`,
        cantidad: duracionHoras,
        descripcion: `Reserva ${detallePago.cancha?.nombre} (${detallePago.horaInicio} - ${detallePago.horaFin})`,
        precioUnitario: precioHora
      }]}
      reserva={{
        cancha: detallePago.cancha?.nombre || 'N/A',
        deporte: detallePago.cancha?.tipo || 'N/A',
        fecha: parseLocalDateString(detallePago.fechaReserva)?.toLocaleDateString('es-PE') || 'N/A',
        horaInicio: detallePago.horaInicio,
        horaFin: detallePago.horaFin,
        duracion: `${duracionHoras} hora(s)`,
        precioHora: precioHora
      }}
    />
  );
}

  return (
    <div className="user-dashboard-container">
      

      {toast && (
        <div
          style={{
            position: 'fixed', top: 20, right: 20, zIndex: 9999,
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '14px 18px', borderRadius: 10,
            color: '#fff', fontWeight: 500, minWidth: 260, maxWidth: 400,
            boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
            backgroundColor: toast.tipo === 'exito' ? '#16a34a' : '#dc2626'
          }}
        >
          {toast.tipo === 'exito' ? <FaCheckCircle /> : <FaExclamationCircle />}
          <span>{toast.texto}</span>
        </div>
      )}
      

      {confirmDialog && (
        <div className="admin-modal-overlay" onClick={() => setConfirmDialog(null)}>
          <div className="admin-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3>Confirmar</h3>
            </div>
            <div className="admin-modal-body">
              <p>{confirmDialog.mensaje}</p>
            </div>
            <div className="admin-modal-footer">
              <button className="admin-modal-cancel-btn" onClick={() => setConfirmDialog(null)}>Cancelar</button>
              <button
                className="admin-modal-save-btn"
                onClick={() => {
                  confirmDialog.onConfirm();
                  setConfirmDialog(null);
                }}
              >
                Aceptar
              </button>
            </div>
          </div>
        </div>
      )}

      {detallePago && detallePago.estado !== 'pagada' && (
  <div className="admin-modal-overlay" onClick={() => setDetallePago(null)}>
    <div className="admin-modal-box" onClick={(e) => e.stopPropagation()}>
      <div className="admin-modal-header"><h3>Detalle de la Reserva</h3></div>
      <div className="admin-modal-body">
  <div className="modal-detail-row">
    <span className="modal-detail-label">Cancha:</span>
    <span className="modal-detail-value">{detallePago.cancha?.nombre}</span>
  </div>

  <div className="modal-detail-row">
    <span className="modal-detail-label">Fecha:</span>
    <span className="modal-detail-value">{formatFecha(detallePago.fechaReserva)}</span>
  </div>

  <div className="modal-detail-row">
    <span className="modal-detail-label">Horario:</span>
    <span className="modal-detail-value">
      {/* Cortamos los segundos innecesarios si vienen en formato HH:MM:SS */}
      {detallePago.horaInicio?.slice(0, 5)} - {detallePago.horaFin?.slice(0, 5)}
    </span>
  </div>

  <div className="modal-detail-row monto-row">
    <span className="modal-detail-label">Monto:</span>
    <span className="modal-detail-value">S/ {detallePago.montoTotal?.toFixed(2)}</span>
  </div>

  <div className="modal-detail-row">
    <span className="modal-detail-label">Estado:</span>
    <span className={`user-estado-badge user-estado-${detallePago.estado || 'pendiente'}`}>
      {detallePago.estado || 'Pendiente'}
    </span>
  </div>

  {detallePago.estado === 'cancelada' && (
    <div className="modal-detail-row cancel-row">
      <span className="modal-detail-label">Motivo de cancelación:</span>
      <span className="modal-detail-value">
        {detallePago.motivoCancelacion || 'No se especificó motivo.'}
      </span>
    </div>
  )}
</div>

<div className="admin-modal-footer">
  <button className="admin-modal-cancel-btn" onClick={() => setDetallePago(null)}>
    Cerrar
  </button>
</div>
    </div>
  </div>
)}

      {motivoDialog && (
        <div className="admin-modal-overlay" onClick={() => setMotivoDialog(null)}>
          <div className="admin-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3>Cancelar Reserva</h3>
            </div>
            <div className="admin-modal-body">
              <label className="admin-modal-label">Motivo de la cancelación (opcional)</label>
              <textarea
                className="admin-modal-select"
                rows={3}
                value={motivoInput}
                onChange={(e) => setMotivoInput(e.target.value)}
              />
            </div>
            <div className="admin-modal-footer">
              <button className="admin-modal-cancel-btn" onClick={() => setMotivoDialog(null)}>Volver</button>
              <button className="admin-modal-save-btn" onClick={confirmarCancelacionConMotivo}>Confirmar Cancelación</button>
            </div>
          </div>
        </div>
      )}

{comprobanteDialog && (
  <div className="admin-modal-overlay" onClick={() => setComprobanteDialog(null)}>
    <div className="admin-modal-box" onClick={(e) => e.stopPropagation()}>
      <div className="admin-modal-header"><h3>Comprobante de Pago</h3></div>
      <div className="admin-modal-body">
        <label className="admin-modal-label">Tipo de comprobante</label>
        <select
          className="admin-modal-select"
          value={tipoComprobante}
          onChange={(e) => setTipoComprobante(e.target.value)}
        >
          <option value="boleta">Boleta</option>
          <option value="factura">Factura</option>
        </select>

        {tipoComprobante === 'factura' && (
          <>
            <label className="admin-modal-label">RUC</label>
            <input
              className="admin-modal-select"
              value={rucFactura}
              onChange={(e) => {
                const valor = e.target.value.replace(/\D/g, '').slice(0, 11);
                setRucFactura(valor);
                if (valor.length === 11) {
                  consultarRuc(valor);
                } else {
                  setRazonSocialFactura('');
                  setDireccionFactura('');
                }
              }}
              placeholder="11 dígitos"
              maxLength={11}
            />

            {consultandoRuc && <p className="boleta-consultando">Consultando RUC...</p>}

            {razonSocialFactura && !consultandoRuc && (
              <>
                <label className="admin-modal-label">Razón Social</label>
                <p className="admin-config-valor-fijo">{razonSocialFactura}</p>

                <label className="admin-modal-label">Dirección Fiscal</label>
                <p className="admin-config-valor-fijo">{direccionFactura || 'No disponible'}</p>
              </>
            )}
          </>
        )}

      </div>
      <div className="admin-modal-footer">
        <button className="admin-modal-cancel-btn" onClick={() => setComprobanteDialog(null)}>Cancelar</button>
        <button
          className="admin-modal-save-btn"
          onClick={() => {
            if (tipoComprobante === 'factura') {
              if (rucFactura.length !== 11) {
                mostrarToast('error', 'El RUC debe tener 11 dígitos.');
                return;
              }
              if (!razonSocialFactura) {
                mostrarToast('error', 'No se encontraron datos de la empresa para ese RUC.');
                return;
              }
            }

            const id = comprobanteDialog.reservaId;
            const info = tipoComprobante === 'factura'
              ? { tipo: 'factura', ruc: rucFactura, razonSocial: razonSocialFactura, direccionFiscal: direccionFactura }
              : { tipo: 'boleta', ruc: null, razonSocial: null, direccionFiscal: null };

            setComprobanteDialog(null);
            handlePagoFicticio(id, info);
          }}
          disabled={consultandoRuc}
        >
          Continuar al pago
        </button>
      </div>
    </div>
  </div>
)}



      <aside className="user-sidebar">
        <div className="sidebar-brand">
    <div className="brand-logo-box">
      <FaFutbol className="brand-icon" />
    </div>
    <div className="brand-text">
      <h2>Sports<span>Match</span></h2>
      <p>Panel de usuario</p>
    </div>
  </div>
        <div className="user-nav">
          <button onClick={() => setActiveTab('dashboard')} className={activeTab === 'dashboard' ? 'active' : ''}>
            <FaTachometerAlt /> Inicio
          </button>
          <button onClick={() => setActiveTab('disponibilidad')} className={activeTab === 'disponibilidad' ? 'active' : ''}>
            <FaSearch /> Reservar Cancha
          </button>
          <button onClick={() => setActiveTab('reservas')} className={activeTab === 'reservas' ? 'active' : ''}>
            <FaClipboardList /> Mis Reservas
          </button>
          <button onClick={() => setActiveTab('canchas')} className={activeTab === 'canchas' ? 'active' : ''}>
            <FaFutbol /> Canchas
          </button> 
          <button onClick={() => setActiveTab('perfil')} className={activeTab === 'perfil' ? 'active' : ''}>
            <FaUserEdit /> Mi Perfil
          </button>
          <button className="user-logout-button" onClick={onLogout}>
            <FaSignOutAlt /> Cerrar Sesion
          </button>
        </div>
      </aside>

            <div className="user-content">
<header className="user-header">
  {/* LADO IZQUIERDO: Título */}
  <div className="user-header-title">
    <h3>{getTabTitle(activeTab)}</h3>
  </div>

  {/* LADO DERECHO: Notificaciones y Perfil */}
  <div className="user-header-actions">
    
    {/* CONTENEDOR DE NOTIFICACIONES (Lógica original mantenida) */}
<div className="user-header-notif-wrapper">
  <button
    className="user-header-icon-btn"
    onClick={() => setMostrarNotifDropdown(!mostrarNotifDropdown)}
  >
    <FaBell />
    {notificaciones.filter(n => !n.leida).length > 0 && (
      <span className="user-notif-badge">{notificaciones.filter(n => !n.leida).length}</span>
    )}
  </button>

  {/* Dropdown de notificaciones */}
  {mostrarNotifDropdown && (
    <div className="user-notif-dropdown">
      <div className="user-notif-header">
        <h4>Notificaciones</h4>
      </div>

      <div className="user-notif-body">
        {notificaciones.length === 0 ? (
          <p className="user-notif-vacio">Sin notificaciones.</p>
        ) : (
          notificaciones.slice(0, 5).map(n => (
            <div
              key={n.id}
              className={`user-notif-item ${n.leida ? 'user-notif-leida' : 'user-notif-no-leida'}`}
              onClick={() => {
  if (!n.leida) marcarComoLeida(n.id);
  setActiveTab('notificaciones');
  setMostrarTodasNotif(false);
}}
              style={{ cursor: 'pointer' }}
            >
              {!n.leida && <span className="user-notif-indicator"></span>}

              <p>{n.mensaje}</p>

              <span className="user-notif-time">{getTimeAgo(n.fechaEnvio)}</span>
            </div>
          ))
        )}
      </div>

      <button
        className="user-notif-vertodo"
        onClick={() => { setActiveTab('notificaciones'); setMostrarNotifDropdown(false); }}
      >
        Ver todas
      </button>
    </div>
  )}
    </div>

    {/* NUEVO PERFIL DE USUARIO ALINEADO A LA DERECHA */}
    <div className="user-profile-badge">
      <div className="user-avatar-circle">
        {/* Muestra la inicial del usuario o un ícono si no hay nombre */}
        {currentUser.nombreUsuario ? currentUser.nombreUsuario.charAt(0).toUpperCase() : <FaUserCircle />}
      </div>
      <div className="user-profile-info">
        <span className="user-name-text">{currentUser.nombreUsuario}</span>
      </div>
    </div>

    {/* MODAL DE TODAS LAS NOTIFICACIONES (Lógica original mantenida) */}
    {mostrarTodasNotif && (
      <div className="admin-modal-overlay" onClick={() => setMostrarTodasNotif(false)}>
        <div className="admin-modal-box" onClick={(e) => e.stopPropagation()}>
          <div className="admin-modal-header">
            <h3>Todas tus notificaciones</h3>
          </div>
          <div className="admin-modal-body" style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {notificaciones.length === 0 ? (
              <p>No tienes notificaciones.</p>
            ) : (
              notificaciones.map(n => (
                <div
                  key={n.id}
                  className={`user-notif-item ${n.leida ? 'user-notif-leida' : 'user-notif-no-leida'}`}
                  onClick={() => {
  console.log('Clic en notificación', n.id, 'activeTab antes:', activeTab);
  if (!n.leida) marcarComoLeida(n.id);
  setActiveTab('notificaciones');
  setMostrarTodasNotif(false);
}}
                  style={{ cursor: n.leida ? 'default' : 'pointer', marginBottom: 10, padding: 10 }}
                >
                  <p>{n.mensaje}</p>
                  <small>{new Date(n.fechaEnvio).toLocaleString('es-PE')}</small>
                </div>
              ))
            )}
          </div>
          <div className="admin-modal-footer">
            <button className="admin-modal-cancel-btn" onClick={marcarTodasComoLeidas}>
              Marcar todas como leídas
            </button>
            <button className="admin-modal-save-btn" onClick={() => setMostrarTodasNotif(false)}>
              Cerrar
            </button>
          </div>
        </div>
      </div>
    )}
    
  </div>
</header>

        {activeTab === 'dashboard' && (
          <>
            {/* NUEVO: tarjeta destacada de Próxima Reserva */}
            <section className="user-proxima-reserva-card">
              <h3><FaCalendarAlt /> Próxima Reserva</h3>
              {proximaReserva ? (
                <div className="user-proxima-reserva-body">
                  <div>
                    <strong>{proximaReserva.cancha?.nombre}</strong>
                    <span className={`user-estado-badge user-estado-${proximaReserva.estado || 'pendiente'}`}>
                      {proximaReserva.estado || 'Pendiente'}
                    </span>
                  </div>
                  <p><FaCalendarAlt /> {parseLocalDateString(proximaReserva.fechaReserva)?.toLocaleDateString('es-ES')}</p>
                  <p><FaClock /> {proximaReserva.horaInicio} - {proximaReserva.horaFin}</p>
                  <p><FaCoins /> S/ {proximaReserva.montoTotal?.toFixed(2)}</p>
                </div>
              ) : (
                <p>No tienes reservas próximas. ¡Reserva una cancha ahora!</p>
              )}
            </section>

            <section className="user-summary">
              <div className="user-summary-card">
                <FaCalendarAlt className="icon" />
                <h3>{proximaReserva ? parseLocalDateString(proximaReserva.fechaReserva)?.toLocaleDateString('es-ES') : '—'}</h3>
                <p>Próxima Reserva</p>
              </div>
              <div className="user-summary-card">
                <FaClipboardList className="icon" />
                <h3>{reservas.length}</h3>
                <p>Total de Reservas</p>
              </div>
              <div className="user-summary-card">
                <FaCheckCircle className="icon" />
                <h3>{reservasConfirmadas}</h3>
                <p>Reservas Confirmadas</p>
              </div>
              <div className="user-summary-card">
                <FaMoneyBillWave className="icon" />
                <h3>S/ {totalGastado.toFixed(2)}</h3>
                <p>Total Gastado</p>
              </div>
            </section>
          </>
        )}

        {activeTab === 'disponibilidad' && (
  <section className="user-table-section user-disponibilidad-section">
    <h3>Reservar Cancha</h3>

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
        <option key={c.id} value={c.id} disabled={c.estado !== 'activa'}>
          {c.nombre} ({c.tipo}){c.estado !== 'activa' ? ' - No disponible' : ''}
        </option>
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
          <tr
            key={s.time}
            className={
              s.status === 'Pasado' ? 'user-slot-pasado' :
              s.status === 'Ocupado' ? 'user-slot-ocupado' :
              'user-slot-disponible'
            }
          >
            <td className="user-slot-hora">{s.time}</td>
            <td>
              <span
                className="user-status-badge"
                style={{
                  padding: '3px 10px',
                  borderRadius: 20,
                  fontSize: 12,
                  fontWeight: 600,
                  color: '#fff',
                  backgroundColor:
                    s.status === 'Pasado' ? '#6b7280' :
                    s.status === 'Ocupado' ? '#dc2626' :
                    '#16a34a'
                }}
              >
                {s.status === 'Pasado' ? 'No disponible' : s.status}
              </span>
            </td>
            <td>
              {s.status === 'Ocupado' && s.reservaInfo
                ? `Reservado por ${s.reservaInfo.usuario?.nombre || 'N/A'} (${s.reservaInfo.horaInicio}-${s.reservaInfo.horaFin})`
                : s.status === 'Pasado'
                ? 'Este horario ya pasó'
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
    <div className="user-subtabs">
      <button
        className={subTabReservas === 'vigentes' ? 'active' : ''}
        onClick={() => setSubTabReservas('vigentes')}
      >
        Vigentes
      </button>
      <button
        className={subTabReservas === 'historial' ? 'active' : ''}
        onClick={() => setSubTabReservas('historial')}
      >
        <FaHistory /> Historial
      </button>
    </div>

    {subTabReservas === 'vigentes' ? (
      isLoadingReservas ? (
        <p>Cargando reservas...</p>
      ) : errorReservas ? (
        <p className="user-error-message">{errorReservas}</p>
      ) : reservasFuturas.length === 0 ? (
        <p>No tienes reservas vigentes.</p>
      ) : (
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Cancha</th><th>Fecha</th><th>Inicio</th><th>Fin</th>
                <th>Precio/Hora</th><th>Monto Total</th><th>Estado</th>
                <th>Comprobante</th><th>Tiempo restante</th><th>Acciones</th><th>Detalle</th>
              </tr>
            </thead>
            <tbody>
              {reservasFuturas.map(r => (
                <tr key={r.id}>
                  <td>{r.cancha?.nombre}</td>
                  <td>{formatFecha(r.fechaReserva)}</td>
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
                    {r.estado === 'pagada'
                      ? (r.tipoComprobante === 'factura' ? 'Factura' : 'Boleta')
                      : '—'}
                  </td>
                  <td>
                    {r.estado === 'confirmada'
                      ? <ContadorPago fechaLimitePago={r.fechaLimitePago} />
                      : '—'}
                  </td>
                  <td>
                    <div className="user-actions-buttons">
                      {r.estado !== "cancelada" && r.estado !== "pagada" && (
                        <button className="user-cancel-button" onClick={() => handleCancelarReserva(r)}>
                          <FaTimesCircle /> Cancelar
                        </button>
                      )}
                      {r.estado === "confirmada" && (
                        <button
                          className="user-pay-button"
                          onClick={() => {
                            setTipoComprobante('boleta');
                            setRucFactura('');
                            setComprobanteDialog({ reservaId: r.id });
                          }}
                        >
                          <FaCoins /> Pagar
                        </button>
                      )}
                    </div>
                  </td>
                  <td>
                    {(r.estado === 'pagada' || r.estado === 'cancelada') && (
                      <button className="user-reserve-button" onClick={() => setDetallePago(r)}>
                        <FaEye /> Detalle
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
    ) : (
      <>
        <div className="user-filtros-row">
          <input
            type="text"
            className="user-search-input"
            placeholder="Buscar por cancha"
            value={busquedaHistorial}
            onChange={(e) => setBusquedaHistorial(e.target.value)}
          />

          <input
            type="date"
            className="user-filtro-fecha"
            value={fechaFiltroHistorial}
            onChange={(e) => setFechaFiltroHistorial(e.target.value)}
          />

          <select
            className="user-filtro-estado"
            value={estadoFiltroHistorial}
            onChange={(e) => setEstadoFiltroHistorial(e.target.value)}
          >
            <option value="todos">Todos</option>
            <option value="pagada">Pagados</option>
            <option value="cancelada">Cancelados</option>
            <option value="confirmada">Confirmados</option>
            <option value="pendiente">Pendientes</option>
          </select>
        </div>

        {reservasPasadasFiltradas.length === 0 ? (
          <p>No se encontraron reservas con esos criterios.</p>
        ) : (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Cancha</th><th>Fecha</th><th>Inicio</th><th>Fin</th>
                  <th>Monto Total</th><th>Estado</th><th>Comprobante</th><th>Detalle</th>
                </tr>
              </thead>
              <tbody>
                {reservasPasadasFiltradas.map(r => (
                  <tr key={r.id}>
                    <td>{r.cancha?.nombre}</td>
                    <td>{formatFecha(r.fechaReserva)}</td>
                    <td>{r.horaInicio}</td>
                    <td>{r.horaFin}</td>
                    <td>S/ {r.montoTotal?.toFixed(2)}</td>
                    <td>
                      <span className={`user-estado-badge user-estado-${r.estado || 'pendiente'}`}>
                        {r.estado || 'Pendiente'}
                      </span>
                    </td>
                    <td>
                      {r.estado === 'pagada'
                        ? (r.tipoComprobante === 'factura' ? 'Factura' : 'Boleta')
                        : '—'}
                    </td>
                    <td>
                      {(r.estado === 'pagada' || r.estado === 'cancelada') && (
                        <button className="user-reserve-button" onClick={() => setDetallePago(r)}>
                          <FaEye /> Detalle
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </>
    )}
  </section>
)}

{activeTab === 'canchas' && (
  <Canchas setActiveTab={setActiveTab} setSelectedCanchaId={setSelectedCanchaId} />
)}
        
{activeTab === 'notificaciones' && (
  <section className="user-notificaciones-page">
    <div className="user-notificaciones-header">
      <div className="user-notificaciones-title">
        <h2>Tus Notificaciones</h2>
      </div>
      {notificaciones.some(n => !n.leida) && (
        <button className="user-btn-marcar-todas" onClick={marcarTodasComoLeidas}>
          Marcar todas como leídas
        </button>
      )}
    </div>

    {notificaciones.length === 0 ? (
      <div className="user-notificaciones-empty">
        <div className="empty-icon">🔔</div>
        <p>No tienes notificaciones en este momento.</p>
      </div>
    ) : (
      <div className="user-notificaciones-list">
        {notificaciones.map(n => (
          <div
            key={n.id}
            className={`user-notificaciones-card ${n.leida ? 'estado-leida' : 'estado-no-leida'}`}
            onClick={() => !n.leida && marcarComoLeida(n.id)}
          >
            {/* Indicador visual de estado */}
            <div className="notif-card-indicator"></div>
            
            <div className="notif-card-content">
              <p className="notif-card-message">{n.mensaje}</p>
              <span className="notif-card-date">
                {new Date(n.fechaEnvio).toLocaleString('es-PE', {
                  day: '2-digit', month: 'short', year: 'numeric',
                  hour: '2-digit', minute: '2-digit'
                })}
              </span>
            </div>
          </div>
        ))}
      </div>
    )}
  </section>
)}
        {/* ===== NUEVO: Mi Perfil ===== */}
        {activeTab === 'perfil' && (
          <section className="user-table-section">
            <h3>Mi Perfil</h3>

            {mensajePerfil && (
              <div ref={mensajeRef} className={`admin-config-mensaje ${mensajePerfil.tipo}`}>
                {mensajePerfil.texto}
              </div>
            )}

            <form className="user-perfil-form" onSubmit={guardarPerfilUsuario}>
              <div className="user-form-group">
                <label>Nombre</label>
                <input
                  type="text"
                  value={perfilForm.nombre}
                  onChange={(e) => setPerfilForm({ ...perfilForm, nombre: e.target.value })}
                  required
                />
              </div>
              

                <div className="user-form-group">
                  <label>Apellido</label>
                  <input
                    type="text"
                    value={perfilForm.apellido}
                    onChange={(e) => setPerfilForm({ ...perfilForm, apellido: e.target.value })}
                    required
                  />
                </div>

              <div className="user-form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={perfilForm.email}
                  onChange={(e) => setPerfilForm({ ...perfilForm, email: e.target.value })}
                  required
                />
              </div>

              <div className="user-form-group">
                <label>Nueva contraseña (opcional)</label>
                <input
                  type="password"
                  value={passwordForm.nueva}
                  onChange={(e) => setPasswordForm({ ...passwordForm, nueva: e.target.value })}
                  placeholder="Dejar en blanco para no cambiar"
                />
              </div>

              <div className="user-form-group">
                <label>Confirmar contraseña</label>
                <input
                  type="password"
                  value={passwordForm.confirmar}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmar: e.target.value })}
                  placeholder="Dejar en blanco para no cambiar"
                />
              </div>

              <button type="submit" className="user-main-button" disabled={guardandoPerfil}>
                {guardandoPerfil ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </form>
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
