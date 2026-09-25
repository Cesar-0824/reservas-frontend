import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { Chart } from 'chart.js/auto';
import './AdminDashboard.css';
import {
  FaUsers,
  FaFutbol,
  FaCalendarCheck,
  FaSignOutAlt,
  FaTachometerAlt,
  FaUserFriends,
  FaClipboardList,
  FaPlus,
  FaEdit,
  FaTrash,
  FaTimes,
  FaChartBar,
  FaBan,
  FaCheckCircle,
  FaSearch,
  FaBell,
  FaUserCircle,
  FaChevronDown,
  FaTimesCircle,
  FaCog,
  FaMoneyBillWave 
} from "react-icons/fa";
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';

import Pagos from "./Pagos"



import DateFilterPicker from '../../components/DateFilterPicker/DateFilterPicker';

function AdminDashboard({ onLogout }) {
  const [usuarios, setUsuarios] = useState([]);
  const [canchas, setCanchas] = useState([]);
  const [reservas, setReservas] = useState([]);
  const [activeTab, setActiveTab] = useState('Inicio');
  const [adminName, setAdminName] = useState('');
  const [loading, setLoading] = useState(true);
  const [editandoCancha, setEditandoCancha] = useState(null);
  const [modalCrearAbierto, setModalCrearAbierto] = useState(false);
  const [mostrarModalCancelar, setMostrarModalCancelar] = useState(false);
  const [reservaCancelar, setReservaCancelar] = useState(null);
  const [motivoAdmin, setMotivoAdmin] = useState("Mantenimiento de la cancha");
  const [observacionAdmin, setObservacionAdmin] = useState("");
  const [usuarioDeshabilitar, setUsuarioDeshabilitar] = useState(null);
  const [busquedaUsuario, setBusquedaUsuario] = useState('');
  const [mostrarMenuPerfil, setMostrarMenuPerfil] = useState(false);
  const [mostrarNotificaciones, setMostrarNotificaciones] = useState(false);
  const [ordenUsuarios, setOrdenUsuarios] = useState({ campo: 'fechaRegistro', direccion: 'desc' });
  const [filtroTiempo, setFiltroTiempo] = useState('anio');
  const [fechaSeleccionada, setFechaSeleccionada] = useState(new Date());
  const [resumenStats, setResumenStats] = useState({
  totalReservas: 0,
  totalIngresos: 0,
  ticketPromedio: 0,
  totalCanceladas: 0,
  ingresosPerdidos: 0
});
  const [datosExport, setDatosExport] = useState({ ingresos: [], deportes: [], horarios: [] });
  const [apiOk, setApiOk] = useState(true);
  const [editandoPerfil, setEditandoPerfil] = useState(false);
  const [fechaFiltroReserva, setFechaFiltroReserva] = useState("");
  const [currentUser, setCurrentUser] = useState(() => {
  const stored = localStorage.getItem('currentUser');
  
  
  
  

  return stored ? JSON.parse(stored) : null;
});
    



const [pagos, setPagos] = useState([])
useEffect(() => {
  const fetchPagos = async () => {
    try {
      const token = localStorage.getItem('authToken');
 
      const res = await axios.get("http://localhost:8080/api/pagos", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
 
      setPagos(res.data);
    } catch (err) {
      console.error("Error al cargar pagos:", err);
    }
  };
 
  fetchPagos();
}, []);
 


const [filtroEstadoReserva, setFiltroEstadoReserva] = useState("pendiente");


const [detalleReserva, setDetalleReserva] = useState(null);
const [busquedaReserva, setBusquedaReserva] = useState("");


const [perfilForm, setPerfilForm] = useState({ nombre: '', email: '' });
const [passwordForm, setPasswordForm] = useState({ nueva: '', confirmar: '' });
const [confirmModal, setConfirmModal] = useState(null); // { mensaje, onConfirm }
  const [toast, setToast] = useState(null); // { tipo: 'exito' | 'error', texto }

const [mensajePerfil, setMensajePerfil] = useState(null);
const [configGeneral, setConfigGeneral] = useState({
  nombreClub: '', emailContacto: '', telefono: '', horaApertura: '00:00', horaCierre: '00:00'
});
const [configReservas, setConfigReservas] = useState({
  duracionMinima: 1, duracionMaxima: 3, anticipacionMaximaDias: 30, permitirCancelaciones: true
});
const mensajeRef = useRef(null);

const [detalleCancha, setDetalleCancha] = useState(null);
  const [modalEstadoCancha, setModalEstadoCancha] = useState(null); // { cancha, nuevoEstado }
  const [motivoCanchaAdmin, setMotivoCanchaAdmin] = useState('Mantenimiento');
  const [observacionCanchaAdmin, setObservacionCanchaAdmin] = useState('');
  


useEffect(() => {
  if (activeTab === 'configuracion') {
    const token = localStorage.getItem('authToken');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    axios.get('http://localhost:8080/api/configuracion', { headers })
      .then(res => {
        setConfigGeneral({
          nombreClub: res.data.nombreClub || '',
          emailContacto: res.data.emailContacto || '',
          telefono: res.data.telefono || '',
          horaApertura: res.data.horaApertura || '08:00',
          horaCierre: res.data.horaCierre || '22:00'
        });
        setConfigReservas({
          duracionMinima: res.data.duracionMinima ?? 1,
          duracionMaxima: res.data.duracionMaxima ?? 3,
          anticipacionMaximaDias: res.data.anticipacionMaximaDias ?? 30,
          permitirCancelaciones: res.data.permitirCancelaciones ?? true
        });
      })
      .catch(err => console.error('Error cargando configuración:', err));
  }
}, [activeTab]);

const guardarConfigGeneral = async () => {
  try {
    const token = localStorage.getItem('authToken');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    await axios.put('http://localhost:8080/api/configuracion/general', configGeneral, { headers });
  } catch (err) {
    throw err;
  }
};

const esMultiploDeMedia = (valor) => (valor * 10) % 5 === 0;

const guardarConfigReservas = async () => {
  if (!esMultiploDeMedia(configReservas.duracionMinima) || !esMultiploDeMedia(configReservas.duracionMaxima)) {
    throw new Error('Las duraciones deben ser en intervalos de 30 minutos (ej. 1, 1.5, 2, 2.5...).');
  }
  if (configReservas.duracionMinima > configReservas.duracionMaxima) {
    throw new Error('La duración mínima no puede ser mayor que la máxima.');
  }
  if (configReservas.duracionMinima <= 0 || configReservas.duracionMaxima <= 0) {
    throw new Error('Las duraciones deben ser mayores a 0.');
  }

  try {
    const token = localStorage.getItem('authToken');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    await axios.put('http://localhost:8080/api/configuracion/reservas', configReservas, { headers });
  } catch (err) {
    throw err;
  }
};

const mostrarToast = (tipo, texto) => {
  setToast({ tipo, texto });
  setTimeout(() => setToast(null), 4000);
};

const [guardandoPerfil, setGuardandoPerfil] = useState(false);

const guardarPerfilManual = async () => {
  if (!perfilForm.nombre?.trim() || !perfilForm.email?.trim()) {
    setMensajePerfil({ tipo: 'error', texto: 'El nombre y el email no pueden estar vacíos.' });
    return;
  }

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
    const token = localStorage.getItem('authToken');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    const body = {
      nombre: perfilForm.nombre,
      email: perfilForm.email
    };
    if (passwordForm.nueva) {
      body.contrasena = passwordForm.nueva;
    }

    const res = await axios.put(
      `http://localhost:8080/api/usuarios/actualizar/${currentUser.id}`,
      body,
      { headers }
    );

    const userActualizado = { ...currentUser, nombreUsuario: res.data.nombre, email: res.data.email };
    localStorage.setItem('currentUser', JSON.stringify(userActualizado));
    setCurrentUser(userActualizado);   // ← ESTA LÍNEA ES LA QUE FALTABA

    setPasswordForm({ nueva: '', confirmar: '' });
    setEditandoPerfil(false);
    setMensajePerfil({ tipo: 'exito', texto: 'Perfil actualizado correctamente.' });
  } catch (err) {
    setMensajePerfil({ tipo: 'error', texto: err.response?.data?.error || 'Error al actualizar el perfil.' });
  } finally {
    setGuardandoPerfil(false);
  }
};

const [guardandoTodo, setGuardandoTodo] = useState(false);

const guardarTodo = async () => {
  setGuardandoTodo(true);
  setMensajePerfil(null);
  try {
    await guardarConfigGeneral();
    await guardarConfigReservas();

    setMensajePerfil({ tipo: 'exito', texto: 'Cambios guardados correctamente.' });
  } catch (error) {
    setMensajePerfil({ tipo: 'error', texto: error.response?.data?.error || error.message || 'Ocurrió un error al guardar los cambios.' });
  } finally {
    setGuardandoTodo(false);
  }
};

useEffect(() => {
  if (mensajePerfil && mensajeRef.current) {
    mensajeRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}, [mensajePerfil]);
useEffect(() => {
  setMensajePerfil(null);
}, [activeTab]);


  // Estado para editar usuario
  const [editandoUsuario, setEditandoUsuario] = useState(null);
  const [nuevoRol, setNuevoRol] = useState('');

  




const handleOrdenar = (campo) => {
  setOrdenUsuarios(prev => {
    if (prev.campo === campo) {
      return { campo, direccion: prev.direccion === 'asc' ? 'desc' : 'asc' };
    }
    return { campo, direccion: 'asc' };
  });
};
//Export Estadisticas
const exportarExcelEstadisticas = () => {
  const libro = XLSX.utils.book_new();

  const hojaResumen = XLSX.utils.json_to_sheet([{
    "Período": getRangoLegible(filtroTiempo, fechaSeleccionada),
    "Total de Reservas": resumenStats.totalReservas,
    "Ingresos Totales (S/)": resumenStats.totalIngresos.toFixed(2),
    "Ticket Promedio (S/)": resumenStats.ticketPromedio.toFixed(2),
    "Generado": new Date().toLocaleDateString('es-PE')
  }]);
  XLSX.utils.book_append_sheet(libro, hojaResumen, "Resumen");

  XLSX.utils.book_append_sheet(libro, XLSX.utils.json_to_sheet(datosExport.ingresos), "Evolucion Ingresos");
  XLSX.utils.book_append_sheet(libro, XLSX.utils.json_to_sheet(datosExport.deportes), "Popularidad Deporte");
  XLSX.utils.book_append_sheet(libro, XLSX.utils.json_to_sheet(datosExport.horarios), "Horarios Pico");

  XLSX.writeFile(libro, `estadisticas-${filtroTiempo}-${new Date().toISOString().split('T')[0]}.xlsx`);
};

// PDF con TABLAS DE DATOS (números)
const exportarPDFDatos = () => {
  const doc = new jsPDF();

  doc.setFontSize(14);
  doc.text("Rendimiento del Club", 14, 15);
  doc.setFontSize(9);
  doc.text(`Período: ${getRangoLegible(filtroTiempo, fechaSeleccionada)} | Generado: ${new Date().toLocaleDateString('es-PE')}`, 14, 21);

  doc.setFontSize(10);
  doc.text(`Total de Reservas: ${resumenStats.totalReservas}`, 14, 29);
  doc.text(`Ingresos Totales: S/. ${resumenStats.totalIngresos.toFixed(2)}`, 14, 34);
  doc.text(`Ticket Promedio: S/. ${resumenStats.ticketPromedio.toFixed(2)}`, 14, 39);

  autoTable(doc, {
    startY: 45,
    head: [["Período", "Ingresos (S/)"]],
    body: datosExport.ingresos.map(f => [f.Periodo, f["Ingresos (S/)"]]),
    styles: { fontSize: 8 },
    headStyles: { fillColor: [16, 185, 129] }
  });

  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 8,
    head: [["Deporte", "Reservas"]],
    body: datosExport.deportes.map(f => [f.Deporte, f.Reservas]),
    styles: { fontSize: 8 },
    headStyles: { fillColor: [139, 92, 246] }
  });

  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 8,
    head: [["Hora", "Reservas"]],
    body: datosExport.horarios.map(f => [f.Hora, f.Reservas]),
    styles: { fontSize: 8 },
    headStyles: { fillColor: [59, 130, 246] }
  });

  doc.save(`estadisticas-datos-${filtroTiempo}-${new Date().toISOString().split('T')[0]}.pdf`);
};

// PDF con CAPTURA VISUAL (gráficos tal como se ven en pantalla)
const exportarPDFDiseno = async () => {
  const elemento = document.querySelector('.admin-statistics-container');
  if (!elemento) return;

  // Oculta los botones de exportar y los filtros durante la captura
  const filtros = document.querySelector('.time-filter-group');
  const exportGroup = document.querySelector('.export-group');
  if (filtros) filtros.classList.add('oculto-en-export');
  if (exportGroup) exportGroup.classList.add('oculto-en-export');

  // Crea temporalmente un texto con el período, para mostrar en su lugar
  const periodoTexto = document.createElement('div');
  periodoTexto.textContent = getRangoLegible(filtroTiempo, fechaSeleccionada);
  periodoTexto.style.cssText = 'font-size: 14px; font-weight: 600; color: #0f172a; padding: 8px 0;';
  periodoTexto.className = 'periodo-temporal-export';
  filtros?.parentElement?.appendChild(periodoTexto);

  const canvas = await html2canvas(elemento, { scale: 3, backgroundColor: '#ffffff' });
  const imgData = canvas.toDataURL('image/png');

  // Restaura todo a como estaba antes de la captura
  if (filtros) filtros.classList.remove('oculto-en-export');
  if (exportGroup) exportGroup.classList.remove('oculto-en-export');
  document.querySelector('.periodo-temporal-export')?.remove();

  const pdf = new jsPDF('p', 'mm', 'a4');
  const anchoPagina = pdf.internal.pageSize.getWidth();
  const altoPagina = pdf.internal.pageSize.getHeight();
  const anchoImg = anchoPagina - 20;
  const altoImg = (canvas.height * anchoImg) / canvas.width;

  let alturaRestante = altoImg;
  let posicionY = 10;

  pdf.addImage(imgData, 'PNG', 10, posicionY, anchoImg, altoImg);
  alturaRestante -= altoPagina;

  while (alturaRestante > 0) {
    posicionY = alturaRestante - altoImg + 10;
    pdf.addPage();
    pdf.addImage(imgData, 'PNG', 10, posicionY, anchoImg, altoImg);
    alturaRestante -= altoPagina;
  }

  pdf.save(`estadisticas-diseno-${filtroTiempo}-${new Date().toISOString().split('T')[0]}.pdf`);
};
  //notificaiones--
const generarNotificacionReserva = (r) => {
  const fecha = r.fechaReserva
    ? new Date(r.fechaReserva + 'T00:00:00').toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' })
    : 'fecha no definida';

  const hora = r.horaInicio && r.horaFin
    ? ` de ${r.horaInicio.slice(0,5)} a ${r.horaFin.slice(0,5)}`
    : '';

  let estadoTexto = '';
  let estadoClase = ''; 

  switch (r.estado) {
    case 'pendiente':
      estadoTexto = 'Falta confirmar';
      estadoClase = 'noti-estado-pendiente';
      break;
    case 'confirmada':
      estadoTexto = 'Confirmada, pendiente de pago';
      estadoClase = 'noti-estado-confirmada';
      break;
    case 'pagada':
      estadoTexto = 'Ya pagó';
      estadoClase = 'noti-estado-pagada';
      break;
    case 'cancelada':
      estadoTexto = 'Canceló la reserva';
      estadoClase = 'noti-estado-cancelada';
      break;
    default:
      estadoTexto = r.estado || 'Sin estado';
  }

  return {
    key: `reserva-${r.id}`,
    tipo: 'reserva',
    reservaId: r.id,
    orden: r.fechaCreacion ? new Date(r.fechaCreacion).getTime() : 0,
    mensaje: `${r.usuario?.nombre || 'Un usuario'} hizo una reserva para el ${fecha}${hora} en ${r.cancha?.nombre || 'una cancha'}`,
    estadoTexto,
    estadoClase
  };
};

const generarNotificacionUsuario = (u) => {
  return {
    key: `usuario-${u.id}`,
    tipo: 'usuario',
    usuarioId: u.id,
    orden: u.fechaRegistro ? new Date(u.fechaRegistro).getTime() : 0, // 👈 timestamp real
    mensaje: `${u.nombre || 'Un nuevo usuario'} se registró en la plataforma`,
    estadoTexto: 'Nuevo registro',
    estadoClase: 'noti-estado-confirmada'
  };
};

// Combina reservas + usuarios, ordena por más reciente
const notificaciones = [
  ...reservas.map(generarNotificacionReserva),
  ...usuarios.map(generarNotificacionUsuario)
]
  .sort((a, b) => b.orden - a.orden)
  .slice(0, 10);

const notificacionesPendientesCount = reservas.filter(r => r.estado === "pendiente").length;

const calcularGastoUsuario = (usuarioId) => {
  return reservas
    .filter(r => r.usuario?.id === usuarioId && r.estado === "pagada")
    .reduce((total, r) => total + (Number(r.montoTotal) || 0), 0);
};

const handleClickNotificacion = (n) => {
  setMostrarNotificaciones(false);
  if (n.tipo === 'reserva') {
    setActiveTab('reservas');
    setTimeout(() => {
      const fila = document.getElementById(`reserva-row-${n.reservaId}`);
      if (fila) {
        fila.scrollIntoView({ behavior: 'smooth', block: 'center' });
        fila.classList.add('admin-reserva-highlight');
        setTimeout(() => fila.classList.remove('admin-reserva-highlight'), 2000);
      }
    }, 150);
  } else if (n.tipo === 'usuario') {
    setActiveTab('usuarios');
    setTimeout(() => {
      const fila = document.getElementById(`usuario-row-${n.usuarioId}`);
      if (fila) {
        fila.scrollIntoView({ behavior: 'smooth', block: 'center' });
        fila.classList.add('admin-reserva-highlight');
        setTimeout(() => fila.classList.remove('admin-reserva-highlight'), 2000);
      }
    }, 150);
  }
};

const usuariosFiltrados = usuarios.filter(u =>
  u.nombre?.toLowerCase().includes(busquedaUsuario.toLowerCase()) ||
  u.email?.toLowerCase().includes(busquedaUsuario.toLowerCase())
)
  .sort((a, b) => {
    const { campo, direccion } = ordenUsuarios;
    let valorA, valorB;

    switch (campo) {
      case 'nombre':
        valorA = a.nombre?.toLowerCase() || '';
        valorB = b.nombre?.toLowerCase() || '';
        break;
      case 'email':
        valorA = a.email?.toLowerCase() || '';
        valorB = b.email?.toLowerCase() || '';
        break;
      case 'rol':
        valorA = a.rol === 'admin' ? 0 : 1;
        valorB = b.rol === 'admin' ? 0 : 1;
        break;
      case 'gasto':
        valorA = calcularGastoUsuario(a.id);
        valorB = calcularGastoUsuario(b.id);
        break;
      case 'estado':
        valorA = a.habilitado === false ? 1 : 0;
        valorB = b.habilitado === false ? 1 : 0;
        break;
      case 'fechaRegistro':
      default:
        valorA = a.fechaRegistro ? new Date(a.fechaRegistro).getTime() : 0;
        valorB = b.fechaRegistro ? new Date(b.fechaRegistro).getTime() : 0;
        break;
    }

    if (valorA < valorB) return direccion === 'asc' ? -1 : 1;
    if (valorA > valorB) return direccion === 'asc' ? 1 : -1;
    return 0;
  });

  const abrirModalCancelar = (reserva) => {
    setReservaCancelar(reserva);
    setMostrarModalCancelar(true);
  };
  const cerrarModalCancelar = () => {
    setMostrarModalCancelar(false);
    setReservaCancelar(null);
    setMotivoAdmin("Mantenimiento de la cancha");
    setObservacionAdmin("");
  };
  

const [nuevaCancha, setNuevaCancha] = useState({
  nombre: '',
  tipo: '',
  precio: '',
  imagen: null,
  modalidad: '',
  dimensiones: '',
  tipoSuperficie: '',
  iluminacion: '',
  caracteristicas: '',
  descripcion: ''
});

  // 👇 Refs para los canvas de los gráficos
  const ingresosChartRef = useRef(null);
  const deportesChartRef = useRef(null);
  const horariosChartRef = useRef(null);

  // 👇 Refs para guardar las instancias de Chart.js (y poder destruirlas)
  const ingresosChartInstance = useRef(null);
  const deportesChartInstance = useRef(null);
  const horariosChartInstance = useRef(null);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (user?.rol !== 'admin') {
      onLogout?.();
      return;
    }
    setAdminName(user.nombreUsuario || 'Administrador');

    const fetchData = async () => {
      try {
        const token = localStorage.getItem('authToken');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        const [resUsuarios, resCanchas, resReservas] = await Promise.all([
          axios.get('http://localhost:8080/api/usuarios', { headers }),
          axios.get('http://localhost:8080/api/canchas', { headers }),
          axios.get('http://localhost:8080/api/reservas', { headers })
        ]);
        setUsuarios(resUsuarios.data);
        setCanchas(resCanchas.data);
        setReservas(resReservas.data);
        setApiOk(true);
      } catch (err) {
        console.error("Error al cargar datos de administración:", err);
        setApiOk(false);
      } finally {
        setLoading(false);
        
      }
    };

//Refresca la pagina cada 15 segundos para mantener los datos actualizados
    fetchData();
  }, [onLogout]);
  useEffect(() => {
  const intervalo = setInterval(async () => {
    if (activeTab === 'estadisticas') return;

    try {
      const token = localStorage.getItem('authToken');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const [resUsuarios, resReservas] = await Promise.all([ 
        axios.get('http://localhost:8080/api/usuarios', { headers }),
        axios.get('http://localhost:8080/api/reservas', { headers })
      ]);

      setUsuarios(prev => JSON.stringify(prev) === JSON.stringify(resUsuarios.data) ? prev : resUsuarios.data);
      setReservas(prev => JSON.stringify(prev) === JSON.stringify(resReservas.data) ? prev : resReservas.data);
    } catch (err) {
      console.error("Error refrescando datos:", err);
    }
  }, 15000);

  return () => clearInterval(intervalo);
}, [onLogout, activeTab]);

function getRangoLegible(filtroTiempo, fechaSeleccionada) {
  if (!fechaSeleccionada) return '';
  const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

  if (filtroTiempo === 'dia') {
    return fechaSeleccionada.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
  }
  if (filtroTiempo === 'semana') {
    const inicio = new Date(fechaSeleccionada);
    const fin = new Date(inicio);
    fin.setDate(inicio.getDate() + 6);
    return `${inicio.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })} - ${fin.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}`;
  }
  if (filtroTiempo === 'mes') {
    return `${MESES[fechaSeleccionada.getMonth()]} ${fechaSeleccionada.getFullYear()}`;
  }
  return `Año ${fechaSeleccionada.getFullYear()}`;
}
  // ===== Filtra reservas según filtroTiempo + fechaSeleccionada =====
function filtrarPorTiempo(reservas, filtroTiempo, fechaSeleccionada) {
  const ref = fechaSeleccionada || new Date();
  


return reservas.filter(r => {
  if (!r.fechaReserva) return false;
  const f = new Date(r.fechaReserva + 'T00:00:00');

  if (filtroTiempo === 'dia') {
    return f.toDateString() === ref.toDateString();
  }
  if (filtroTiempo === 'semana') {
    const inicio = new Date(ref);
    inicio.setHours(0, 0, 0, 0);
    const fin = new Date(inicio);
    fin.setDate(inicio.getDate() + 6);
    return f >= inicio && f <= fin;
  }
  if (filtroTiempo === 'mes') {
    return f.getMonth() === ref.getMonth() && f.getFullYear() === ref.getFullYear();
  }
  // anio
  return f.getFullYear() === ref.getFullYear();
});
}

useEffect(() => {
  if (activeTab !== 'estadisticas' || !reservas.length) return;

  const reservasFiltradas = filtrarPorTiempo(reservas, filtroTiempo, fechaSeleccionada);

  // 👇 Calcular resumen (Total de reservas, ingresos, ticket promedio)
  const reservasValidas = reservasFiltradas.filter(r => r.estado === 'pagada' || r.estado === 'confirmada');
  const totalIngresos = reservasValidas.reduce((sum, r) => sum + (Number(r.montoTotal) || 0), 0);
  const totalReservas = reservasFiltradas.length;
  const ticketPromedio = reservasValidas.length ? totalIngresos / reservasValidas.length : 0;

 // 👇 NUEVO: reservas canceladas e ingresos perdidos por cancelación
const reservasCanceladas = reservasFiltradas.filter(r => r.estado === 'cancelada');
const totalCanceladas = reservasCanceladas.length;
const ingresosPerdidos = reservasCanceladas.reduce((sum, r) => sum + (Number(r.montoTotal) || 0), 0);
  setResumenStats({ totalReservas, totalIngresos, ticketPromedio, totalCanceladas, ingresosPerdidos });

  

  // ===== GRÁFICO 1: Evolución de Ingresos (línea) =====
  const ingresosPorClave = {};
  const canceladosPorClave = {};
  const cantidadCanceladosPorClave = {}; // 👈 NUEVO: cantidad de reservas canceladas

  reservasFiltradas.forEach(r => {
    const f = new Date(r.fechaReserva + 'T00:00:00');
    let clave;

    if (filtroTiempo === 'dia') {
      clave = (r.horaInicio ? r.horaInicio.split(':')[0] : '00') + ':00';
    } else if (filtroTiempo === 'semana' || filtroTiempo === 'mes') {
      clave = f.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
    } else {
      clave = f.toLocaleDateString('es-ES', { month: 'short' });
    }

    if (r.estado === 'pagada' || r.estado === 'confirmada') {
      ingresosPorClave[clave] = (ingresosPorClave[clave] || 0) + (Number(r.montoTotal) || 0);
    } else if (r.estado === 'cancelada') {
      canceladosPorClave[clave] = (canceladosPorClave[clave] || 0) + (Number(r.montoTotal) || 0);
      cantidadCanceladosPorClave[clave] = (cantidadCanceladosPorClave[clave] || 0) + 1; // 👈 NUEVO
    }
  });

if (filtroTiempo === 'anio') {
    const ordenMeses = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
    ordenMeses.forEach(m => {
      if (!(m in ingresosPorClave)) ingresosPorClave[m] = 0;
      if (!(m in canceladosPorClave)) canceladosPorClave[m] = 0;
      if (!(m in cantidadCanceladosPorClave)) cantidadCanceladosPorClave[m] = 0; // 👈 NUEVO
    });
  }
  if (filtroTiempo === 'dia') {
    for (let h = 7; h <= 23; h++) {
      const clave = String(h).padStart(2, '0') + ':00';
      if (!(clave in ingresosPorClave)) ingresosPorClave[clave] = 0;
      if (!(clave in canceladosPorClave)) canceladosPorClave[clave] = 0;
      if (!(clave in cantidadCanceladosPorClave)) cantidadCanceladosPorClave[clave] = 0; // 👈 NUEVO
    }
  }
  if (filtroTiempo === 'semana') {
    const inicio = new Date(fechaSeleccionada);
    inicio.setHours(0, 0, 0, 0);
    for (let i = 0; i < 7; i++) {
      const d = new Date(inicio);
      d.setDate(inicio.getDate() + i);
      const clave = d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
      if (!(clave in ingresosPorClave)) ingresosPorClave[clave] = 0;
      if (!(clave in canceladosPorClave)) canceladosPorClave[clave] = 0;
      if (!(clave in cantidadCanceladosPorClave)) cantidadCanceladosPorClave[clave] = 0; // 👈 NUEVO
    }
  }
  if (filtroTiempo === 'mes') {
    const anioRef = fechaSeleccionada.getFullYear();
    const mesRef = fechaSeleccionada.getMonth();
    const ultimoDia = new Date(anioRef, mesRef + 1, 0).getDate();
    for (let numDia = 1; numDia <= ultimoDia; numDia++) {
      const d = new Date(anioRef, mesRef, numDia);
      const clave = d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
      if (!(clave in ingresosPorClave)) ingresosPorClave[clave] = 0;
      if (!(clave in canceladosPorClave)) canceladosPorClave[clave] = 0;
      if (!(clave in cantidadCanceladosPorClave)) cantidadCanceladosPorClave[clave] = 0; // 👈 NUEVO
    }
  }


  // orden correcto según el tipo de clave
  let clavesOrdenadas = Object.keys(ingresosPorClave);
  if (filtroTiempo === 'dia') {
    clavesOrdenadas.sort((a, b) => parseInt(a) - parseInt(b));
  } else if (filtroTiempo === 'anio') {
    const ordenMeses = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
    clavesOrdenadas.sort((a, b) => ordenMeses.indexOf(a.toLowerCase()) - ordenMeses.indexOf(b.toLowerCase()));
  } else {
    clavesOrdenadas.sort((a, b) => {
      const [da, ma] = a.split('/').map(Number);
      const [db, mb] = b.split('/').map(Number);
      return ma - mb || da - db;
    });
  }


  if (ingresosChartInstance.current) ingresosChartInstance.current.destroy();
  if (ingresosChartRef.current) {
    ingresosChartInstance.current = new Chart(ingresosChartRef.current.getContext('2d'), {
      type: 'line',
      data: {
        labels: clavesOrdenadas,
        datasets: [
          {
            label: 'Ingresos (S/.)',
            data: clavesOrdenadas.map(c => ingresosPorClave[c]),
            borderColor: '#10b981',
            backgroundColor: 'rgba(16, 185, 129, 0.15)',
            fill: true,
            tension: 0.15,
            pointRadius: 4,
            pointHoverRadius: 6,
            pointBackgroundColor: '#10b981'
          },
          {
            label: 'Cancelado (S/.)',
            data: clavesOrdenadas.map(c => canceladosPorClave[c] || 0),
            borderColor: '#dc2626',
            backgroundColor: 'rgba(220, 38, 38, 0.15)',
            fill: true,
            tension: 0.15,
            pointRadius: 4,
            pointHoverRadius: 6,
            pointBackgroundColor: '#dc2626'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: true, position: 'top' },
          tooltip: {
            callbacks: {
              label: (ctx) => {
                if (ctx.dataset.label === 'Cancelado (S/.)') {
                  const cantidad = cantidadCanceladosPorClave[ctx.label] || 0;
                  return `${ctx.dataset.label}: S/. ${ctx.parsed.y.toFixed(2)} (${cantidad} reserva${cantidad === 1 ? '' : 's'})`; // 👈 NUEVO
                }
                return `${ctx.dataset.label}: S/. ${ctx.parsed.y.toFixed(2)}`;
              }
            }
          }
        },
        scales: {
          y: { beginAtZero: true }
        }
      }
    });
  }
// ===== GRÁFICO 2: Popularidad por Deporte (dona) =====
    const conteoPorTipo = {};
    reservasFiltradas
      .filter(r => r.estado !== 'cancelada')
      .forEach(r => {
        const tipo = r.cancha?.tipo || 'Otro';
        conteoPorTipo[tipo] = (conteoPorTipo[tipo] || 0) + 1;
      });

    const totalCanceladasDeporte = reservasFiltradas.filter(r => r.estado === 'cancelada').length; // 👈 NUEVO

    const paletaBase = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#14b8a6', '#f97316', '#a855f7'];

const tipos = Object.keys(conteoPorTipo);
const coloresDona = tipos.map((_, i) => paletaBase[i % paletaBase.length]);

const labelsDona = tipos.map(tipo => `${tipo} (${conteoPorTipo[tipo]} reservas)`);
const dataDona = Object.values(conteoPorTipo);

if (totalCanceladasDeporte > 0) {
  labelsDona.push(`Canceladas (${totalCanceladasDeporte} reservas)`);
  dataDona.push(totalCanceladasDeporte);
  coloresDona.push('#dc2626');
}

    if (deportesChartInstance.current) deportesChartInstance.current.destroy();
if (deportesChartRef.current) {
  deportesChartInstance.current = new Chart(deportesChartRef.current.getContext('2d'), {
    type: 'doughnut',
    data: {
      labels: labelsDona,
      datasets: [{
        data: dataDona,
        backgroundColor: coloresDona
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: 'bottom' } }
    }
  });
}

    // ===== GRÁFICO 3: Horarios Pico (barras) =====
    const conteoPorHora = {};
    const canceladasPorHora = {}; // 👈 NUEVO

reservasFiltradas.forEach(r => {
  if (!r.horaInicio) return;
  const hora = r.horaInicio.split(':')[0] + ':00';

  if (r.estado !== 'cancelada') {
    conteoPorHora[hora] = (conteoPorHora[hora] || 0) + 1;
  } else {
    canceladasPorHora[hora] = (canceladasPorHora[hora] || 0) + 1; // 👈 NUEVO
  }
});

// 👇 Completa las horas de atención (07:00 a 23:00) aunque no tengan reservas
for (let h = 7; h <= 23; h++) {
  const clave = String(h).padStart(2, '0') + ':00';
  if (!(clave in conteoPorHora)) conteoPorHora[clave] = 0;
  if (!(clave in canceladasPorHora)) canceladasPorHora[clave] = 0; // 👈 NUEVO
}

const horasOrdenadas = Object.keys(conteoPorHora).sort();

if (horariosChartInstance.current) horariosChartInstance.current.destroy();
if (horariosChartRef.current) {
  horariosChartInstance.current = new Chart(horariosChartRef.current.getContext('2d'), {
    type: 'bar',
    data: {
      labels: horasOrdenadas,
      datasets: [
        {
          label: 'Reservas',
          data: horasOrdenadas.map(h => conteoPorHora[h]),
          backgroundColor: '#3b82f6'
        },
        {
          label: 'Canceladas', // 👈 NUEVO
          data: horasOrdenadas.map(h => canceladasPorHora[h]),
          backgroundColor: '#dc2626'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: true, position: 'bottom' } }, // 👈 cambiado a true para diferenciar colores
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            stepSize: 1,
            precision: 0
          }
        }
      }
    }
  });
}

  setDatosExport({
  ingresos: clavesOrdenadas.map(c => ({
    Periodo: c,
    "Ingresos (S/)": ingresosPorClave[c].toFixed(2),
    "Cancelado (S/)": (canceladosPorClave[c] || 0).toFixed(2)
  })),
  deportes: Object.keys(conteoPorTipo).map(tipo => ({ Deporte: tipo, Reservas: conteoPorTipo[tipo] })),
  horarios: horasOrdenadas.map(h => ({ Hora: h, Reservas: conteoPorHora[h] })),
  resumen: [
    { Metrica: 'Total de Reservas', Valor: totalReservas },
    { Metrica: 'Ingresos Totales (S/)', Valor: totalIngresos.toFixed(2) },
    { Metrica: 'Ticket Promedio (S/)', Valor: ticketPromedio.toFixed(2) },
    { Metrica: 'Reservas Canceladas', Valor: totalCanceladas },
    { Metrica: 'Ingresos Perdidos por Cancelación (S/)', Valor: ingresosPerdidos.toFixed(2) }
  ]
});
    // Limpieza al desmontar o antes de re-ejecutar el efecto
  return () => {
    if (ingresosChartInstance.current) ingresosChartInstance.current.destroy();
    if (deportesChartInstance.current) deportesChartInstance.current.destroy();
    if (horariosChartInstance.current) horariosChartInstance.current.destroy();
  };
}, [activeTab, reservas, filtroTiempo, fechaSeleccionada]);

  const handleInputChange = e => {
    const { name, value } = e.target;
    setNuevaCancha(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = e => {
    setNuevaCancha(prev => ({ ...prev, imagen: e.target.files[0] }));
  };

const handleAgregarCancha = async e => {
  e.preventDefault();
  const formData = new FormData();
  formData.append('nombre', nuevaCancha.nombre);
  formData.append('tipo', nuevaCancha.tipo);
  formData.append('precio', nuevaCancha.precio);
  formData.append('modalidad', nuevaCancha.modalidad || '');
  formData.append('dimensiones', nuevaCancha.dimensiones || '');
  formData.append('tipoSuperficie', nuevaCancha.tipoSuperficie || '');
  formData.append('iluminacion', nuevaCancha.iluminacion || '');
  formData.append('caracteristicas', nuevaCancha.caracteristicas || '');
  formData.append('descripcion', nuevaCancha.descripcion || '');
  if (nuevaCancha.imagen) {
    formData.append('imagen', nuevaCancha.imagen);
  }
  try {
    const token = localStorage.getItem('authToken');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const res = await axios.post('http://localhost:8080/api/canchas/registrar', formData, { headers });
    setCanchas(prev => [...prev, res.data]);
    setNuevaCancha({ nombre: '', tipo: '', precio: '', imagen: null, modalidad: '', dimensiones: '', tipoSuperficie: '', iluminacion: '', caracteristicas: '', descripcion: '' });
    mostrarToast('exito', 'Cancha registrada correctamente.');
  } catch (err) {
    console.error("Error al agregar cancha:", err.response?.data || err.message);
    mostrarToast('error', 'No se pudo registrar la cancha.');
  }
};

const handleEliminarCancha = (id) => {
  setConfirmModal({
    mensaje: "¿Estás seguro de eliminar esta cancha?",
    onConfirm: async () => {
      try {
        const token = localStorage.getItem('authToken');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        await axios.delete(`http://localhost:8080/api/canchas/${id}`, { headers });
        setCanchas(prev => prev.filter(c => c.id !== id));
        mostrarToast('exito', 'Cancha eliminada correctamente.');
      } catch (err) {
        console.error("Error al eliminar cancha:", err);
        mostrarToast('error', 'No se pudo eliminar la cancha.');
      }
    }
  });
};
const handleActualizarCancha = (e) => {
  e.preventDefault();
  if (!editandoCancha) return;

  setConfirmModal({
    mensaje: "¿Estás seguro de actualizar esta cancha?",
    onConfirm: async () => {
      const formData = new FormData();
      formData.append("nombre", nuevaCancha.nombre);
      formData.append("tipo", nuevaCancha.tipo);
      formData.append("precio", nuevaCancha.precio);
      formData.append("modalidad", nuevaCancha.modalidad || '');
      formData.append("dimensiones", nuevaCancha.dimensiones || '');
      formData.append("tipoSuperficie", nuevaCancha.tipoSuperficie || '');
      formData.append("iluminacion", nuevaCancha.iluminacion || '');
      formData.append("caracteristicas", nuevaCancha.caracteristicas || '');
      formData.append("descripcion", nuevaCancha.descripcion || '');
      if (nuevaCancha.imagen) {
        formData.append("imagen", nuevaCancha.imagen);
      }

      try {
        const token = localStorage.getItem('authToken');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await axios.put(
          `http://localhost:8080/api/canchas/actualizar/${editandoCancha.id}`,
          formData,
          { headers }
        );
        setCanchas(prev => prev.map(c => c.id === res.data.id ? res.data : c));
        setEditandoCancha(null);
        setNuevaCancha({ nombre: "", tipo: "", precio: "", imagen: null, modalidad: '', dimensiones: '', tipoSuperficie: '', iluminacion: '', caracteristicas: '', descripcion: '' });
        mostrarToast('exito', 'Cancha actualizada correctamente.');
      } catch (err) {
        console.error(err);
        mostrarToast('error', 'No se pudo actualizar la cancha.');
      }
    }
  });
};

const handleEditarCancha = (cancha) => {
  setEditandoCancha(cancha);
  setNuevaCancha({
    nombre: cancha.nombre,
    tipo: cancha.tipo,
    precio: cancha.precio_hora || cancha.precio,
    imagen: null,
    modalidad: cancha.modalidad || '',
    dimensiones: cancha.dimensiones || '',
    tipoSuperficie: cancha.tipoSuperficie || '',
    iluminacion: cancha.iluminacion || '',
    caracteristicas: cancha.caracteristicas || '',
    descripcion: cancha.descripcion || ''
  });
};

const abrirModalEstadoCancha = (cancha, nuevoEstado) => {
  if (nuevoEstado === 'mantenimiento') {
    setModalEstadoCancha({ cancha, nuevoEstado });
    setMotivoCanchaAdmin('Mantenimiento');
    setObservacionCanchaAdmin('');
  } else {
    // Volver a 'activa' no necesita motivo, pero sí confirmación
    setConfirmModal({
      mensaje: `¿Marcar "${cancha.nombre}" como Activa nuevamente?`,
      onConfirm: () => cambiarEstadoCancha(cancha.id, 'activa', null, null)
    });
  }
};

const cambiarEstadoCancha = async (canchaId, nuevoEstado, motivo, observacion) => {
  try {
    const token = localStorage.getItem('authToken');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    const params = new URLSearchParams();
    params.append('estado', nuevoEstado);
    if (motivo) params.append('motivo', motivo);
    if (observacion) params.append('observacion', observacion);

    const res = await axios.patch(
      `http://localhost:8080/api/canchas/${canchaId}/estado?${params.toString()}`,
      null,
      { headers }
    );

    setCanchas(prev => prev.map(c => c.id === canchaId ? res.data : c));
    mostrarToast('exito', `Cancha marcada como ${nuevoEstado === 'activa' ? 'Activa' : 'En Mantenimiento'}.`);
    setModalEstadoCancha(null);
  } catch (err) {
    console.error("Error al cambiar estado de cancha:", err);
    mostrarToast('error', 'No se pudo cambiar el estado de la cancha.');
  }
};

const confirmarCambioEstadoConMotivo = () => {
  if (!modalEstadoCancha) return;
  cambiarEstadoCancha(modalEstadoCancha.cancha.id, modalEstadoCancha.nuevoEstado, motivoCanchaAdmin, observacionCanchaAdmin);
};

  const handleAbrirEditarUsuario = (usuario) => {
    setEditandoUsuario(usuario);
    setNuevoRol(usuario.rol);
  };

  const handleCerrarModalUsuario = () => {
    setEditandoUsuario(null);
    setNuevoRol('');
  };


const handleEliminarUsuario = (id) => {
  setConfirmModal({
    mensaje: "¿Estás seguro de que deseas eliminar este usuario?",
    onConfirm: async () => {
      try {
        const token = localStorage.getItem('authToken');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        await axios.delete(`http://localhost:8080/api/usuarios/${id}`, { headers });
        setUsuarios(prev => prev.filter(u => u.id !== id));
        mostrarToast('exito', 'Usuario eliminado correctamente.');
      } catch (err) {
        console.error("Error al eliminar usuario:", err);
        mostrarToast('error', 'No se pudo eliminar el usuario.');
      }
    }
  });
};



const handleGuardarRol = async () => {
  if (!editandoUsuario) return;
  try {
    const token = localStorage.getItem('authToken');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    await axios.put(
      `http://localhost:8080/api/usuarios/actualizar/${editandoUsuario.id}`,
      { ...editandoUsuario, rol: nuevoRol },
      { headers }
    );

    setUsuarios(prev => prev.map(u => u.id === editandoUsuario.id ? { ...u, rol: nuevoRol } : u));

    handleCerrarModalUsuario();
    mostrarToast('exito', 'Rol actualizado correctamente.');
  } catch (err) {
    console.error("Error al actualizar rol:", err);
    mostrarToast('error', 'No se pudo actualizar el rol del usuario.');
  }
};

const abrirModalDeshabilitar = (usuario) => {
  setUsuarioDeshabilitar(usuario);
};

const cerrarModalDeshabilitar = () => {
  setUsuarioDeshabilitar(null);
};

const handleConfirmarDeshabilitar = async () => {
  if (!usuarioDeshabilitar) return;
  try {
    const token = localStorage.getItem('authToken');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    const nuevoEstado = !usuarioDeshabilitar.habilitado;

    await axios.put(
      `http://localhost:8080/api/usuarios/actualizar/${usuarioDeshabilitar.id}`,
      {
        nombre: usuarioDeshabilitar.nombre,
        email: usuarioDeshabilitar.email,
        rol: usuarioDeshabilitar.rol,
        habilitado: nuevoEstado
        
      },
      { headers }
    );

    setUsuarios(prev =>
      prev.map(u => u.id === usuarioDeshabilitar.id ? { ...u, habilitado: nuevoEstado } : u)
    );

    mostrarToast('exito', nuevoEstado ? "Usuario habilitado correctamente." : "Usuario deshabilitado correctamente.");
cerrarModalDeshabilitar();
} catch (err) {
  console.error("Error al actualizar estado del usuario:", err);
  mostrarToast('error', 'No se pudo actualizar el usuario.');
}
};

const handleCambiarEstadoReserva = (reservaId, nuevoEstado) => {
  setConfirmModal({
    mensaje: `¿Seguro que deseas cambiar el estado a "${nuevoEstado}"?`,
    onConfirm: async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (!token) {
          mostrarToast('error', 'No hay token de autenticación, por favor inicia sesión.');
          return;
        }

        const reservaActual = reservas.find(r => r.id === reservaId);
        if (!reservaActual) {
          mostrarToast('error', 'Reserva no encontrada');
          return;
        }

        let response;

        if (nuevoEstado === 'confirmada') {
          // Usa el endpoint que dispara fechaLimitePago + correo
          response = await axios.put(
            `http://localhost:8080/api/reservas/${reservaId}/estado?estado=confirmada`,
            null,
            { headers: { Authorization: `Bearer ${token}` } }
          );
        } else {
          const reservaActualizada = { ...reservaActual, estado: nuevoEstado };
          response = await axios.put(
            `http://localhost:8080/api/reservas/actualizar/${reservaId}`,
            reservaActualizada,
            { headers: { Authorization: `Bearer ${token}` } }
          );
        }

        mostrarToast('exito', `Estado de reserva actualizado a "${nuevoEstado}"`);

        setReservas(prev => prev.map(r => (r.id === reservaId ? response.data : r)));
      } catch (error) {
        console.error("Error al actualizar estado de reserva:", error);
        mostrarToast('error', 'No se pudo actualizar el estado de la reserva.');
      }
    }
  });
};

  // 👇 NUEVO: confirma la cancelación con motivo, observación y quién canceló
  const handleConfirmarCancelacion = async () => {
    if (!reservaCancelar) return;

    try {
      const token = localStorage.getItem('authToken');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const reservaActualizada = {
        ...reservaCancelar,
        estado: "cancelada",
        motivoCancelacion: motivoAdmin,
        observacionCancelacion: observacionAdmin,
        canceladoPor: "admin"
      };

      await axios.put(
        `http://localhost:8080/api/reservas/actualizar/${reservaCancelar.id}`,
        reservaActualizada,
        { headers }
      );

      setReservas(prev =>
        prev.map(r =>
          r.id === reservaCancelar.id
            ? {
                ...r,
                estado: "cancelada",
                motivoCancelacion: motivoAdmin,
                observacionCancelacion: observacionAdmin,
                canceladoPor: "admin"
              }
            : r
        )
      );

      mostrarToast('exito', 'Reserva cancelada correctamente.');
cerrarModalCancelar();
} catch (err) {
  console.error("Error al cancelar reserva:", err);
  mostrarToast('error', 'No se pudo cancelar la reserva.');
}
  };

  const tituloPorTab = {
    Inicio: 'Inicio',
    estadisticas: 'Estadísticas',
    usuarios: 'Usuarios',
    reservas: 'Reservas',
    pagos: 'Pagos',
    canchas: 'Canchas',
    configuracion: 'Configuración'
  };



  function ultimoPago(reserva) {
  if (!reserva.pagos || reserva.pagos.length === 0) return null;
  return [...reserva.pagos].sort(
    (a, b) => new Date(b.fechaPago) - new Date(a.fechaPago)
  )[0];
}
  

  if (loading) return <div className="admin-loading">Cargando panel de administración...</div>;

  return (
    <div className="admin-dashboard-container">
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
    {toast.tipo === 'exito' ? <FaCheckCircle /> : <FaBan />}
    <span>{toast.texto}</span>
  </div>
)}

{confirmModal && (
  <div className="admin-modal-overlay" onClick={() => setConfirmModal(null)}>
    <div className="admin-modal-box" onClick={(e) => e.stopPropagation()}>
      <div className="admin-modal-header">
        <h3>Confirmar</h3>
      </div>
      <div className="admin-modal-body">
        <p>{confirmModal.mensaje}</p>
      </div>
      <div className="admin-modal-footer">
        <button className="admin-modal-cancel-btn" onClick={() => setConfirmModal(null)}>Cancelar</button>
        <button
          className="admin-modal-save-btn"
          onClick={() => {
            confirmModal.onConfirm();
            setConfirmModal(null);
          }}
        >
          Aceptar
        </button>
      </div>
    </div>
  </div>
)}
      {/* 1. SIDEBAR */}
      <aside className="admin-sidebar">
        <h2>Admin Panel</h2>
        <div className="admin-nav">
          <button
            onClick={() => setActiveTab('Inicio')}
            className={activeTab === 'Inicio' ? 'active' : ''}
          >
            <FaTachometerAlt /> Inicio
          </button>

          <button
            onClick={() => setActiveTab('estadisticas')}
            className={activeTab === 'estadisticas' ? 'active' : ''}
          >
            <FaChartBar /> Estadísticas
          </button>

          <button
            onClick={() => setActiveTab('usuarios')}
            className={activeTab === 'usuarios' ? 'active' : ''}
          >
            <FaUserFriends /> Usuarios
          </button>

          <button
            onClick={() => setActiveTab('reservas')}
            className={activeTab === 'reservas' ? 'active' : ''}
          >
            <FaClipboardList /> Reservas
          </button>
          <button
            onClick={() => setActiveTab('pagos')}
            className={activeTab === 'pagos' ? 'active' : ''}
          >
            <FaMoneyBillWave /> Pagos

          </button>
          <button
            onClick={() => setActiveTab('canchas')}
            className={activeTab === 'canchas' ? 'active' : ''}
          >
            <FaFutbol /> Canchas
          </button>

          <button
             onClick={() => setActiveTab('configuracion')}
            className={activeTab === 'configuracion' ? 'active' : ''}
            >
            <FaCog /> Configuración
          </button>
          <button className="admin-logout-button" onClick={onLogout}>
            <FaSignOutAlt /> Cerrar Sesión
          </button>


        </div>
      </aside>
{/* 2. PANEL CONTENEDOR PRINCIPAL */}
      <div className="admin-content">
       <header className="admin-header">
  <div className="admin-header-titles">

    <h3>{tituloPorTab[activeTab] || 'Panel'}</h3>
  </div>

  <div className="admin-header-right">
    

    <div className="admin-header-notif-wrapper">
      <button
        className="admin-header-icon-btn"
        onClick={(e) => {
          e.stopPropagation();
          setMostrarNotificaciones(!mostrarNotificaciones);
          setMostrarMenuPerfil(false);
        }}
        title="Notificaciones"
      >
        <FaBell />
        {notificacionesPendientesCount > 0 && (
          <span className="admin-header-badge">{notificacionesPendientesCount}</span>
        )}
      </button>

      {mostrarNotificaciones && (
        <div className="admin-notif-dropdown" onClick={(e) => e.stopPropagation()}>
          <div className="admin-notif-header">
            <h4>Notificaciones</h4>
          </div>

          <div className="admin-notif-list">
            {notificaciones.length === 0 ? (
              <p className="admin-notif-empty">No hay notificaciones.</p>
            ) : (
              notificaciones.map(n => (
                <div
                  key={n.key}
                  className="admin-notif-item admin-notif-item-clickable"
                  onClick={() => handleClickNotificacion(n)}
                >
                  <p className="admin-notif-mensaje">{n.mensaje}</p>
                  <span className={`admin-notif-estado ${n.estadoClase}`}>{n.estadoTexto}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>

    <div className="admin-header-profile" onClick={(e) => {
      e.stopPropagation();
      setMostrarMenuPerfil(!mostrarMenuPerfil);
      setMostrarNotificaciones(false);
    }}>
      <FaUserCircle className="admin-header-avatar" />
      <span className="admin-header-name">{adminName}</span>
      <FaChevronDown className={`admin-header-chevron ${mostrarMenuPerfil ? 'open' : ''}`} />

      {mostrarMenuPerfil && (
        <div className="admin-header-dropdown" onClick={(e) => e.stopPropagation()}>
          <button className="admin-header-dropdown-item" onClick={onLogout}>
            <FaSignOutAlt /> Cerrar Sesión
          </button>
        </div>
      )}
    </div>
  </div>
</header>

        {/* INICIO */}
{activeTab === 'Inicio' && (
  <>
    {/* Bienvenida */}
    <section className="admin-welcome-card">
      <div>
        <h2>¡Bienvenido, {adminName}! 👋</h2>
        <p>
          Administra usuarios, reservas y canchas desde un solo lugar.
          Aquí encontrarás un resumen general del sistema.
        </p>
      </div>

      <div className="admin-date-card">
        <span>Fecha</span>
        <h3>{new Date().toLocaleDateString("es-PE")}</h3>
      </div>
    </section>

    {/* Resumen */}
    <section className="admin-summary">
      <div className="admin-summary-card">
        <FaUsers className="icon" />
        <h3>{usuarios?.length || 0}</h3>
        <p>Usuarios Registrados</p>
        <span className="admin-summary-subtext">
          {usuarios.filter(u => u.rol === "admin").length} admins · {usuarios.filter(u => u.rol === "usuario").length} normales
        </span>
      </div>

      <div className="admin-summary-card">
        <FaFutbol className="icon" />
        <h3>{canchas?.length || 0}</h3>
        <p>Canchas Disponibles</p>
      </div>

      <div className="admin-summary-card">
        <FaCalendarCheck className="icon" />
        <h3>{reservas?.length || 0}</h3>
        <p>Reservas Totales</p>
      </div>

      <div className="admin-summary-card">
        <FaClipboardList className="icon" />
        <h3>
          {reservas?.filter(r => r.estado === "pendiente").length || 0}
        </h3>
        <p>Reservas Pendientes</p>
      </div>

      <div className="admin-summary-card">
        <FaCalendarCheck className="icon" />
        <h3>
          {reservas?.filter(r => r.estado === "confirmada").length || 0}
        </h3>
        <p>Reservas Confirmadas</p>
      </div>

      <div className="admin-summary-card">
        <FaTimesCircle className="icon" />
        <h3>
          {reservas?.filter(r => r.estado === "cancelada").length || 0}
        </h3>
        <p>Reservas Canceladas</p>
      </div>
    </section>



    {/* Panel inferior */}
    <section className="admin-home-grid">

            {/* Canchas más reservadas */}
  <div className="admin-home-card">
    <h3>🏟️ Canchas Más Reservadas</h3>

    <table>
      <thead>
        <tr>
          <th>Cancha</th>
          <th>Reservas</th>
        </tr>
      </thead>
      <tbody>
        {Object.entries(
          reservas?.reduce((acc, r) => {
            const nombre = r.cancha?.nombre || 'Sin nombre';
            acc[nombre] = (acc[nombre] || 0) + 1;
            return acc;
          }, {}) || {}
        )
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([nombre, cantidad]) => (
            <tr key={nombre}>
              <td>{nombre}</td>
              <td>{cantidad}</td>
            </tr>
          ))}
      </tbody>
    </table>
  </div>


      {/* Próximas reservas */}
      <div className="admin-home-card">
        <h3>📅 Próximas Reservas</h3>

        <table>
          <thead>
            <tr>
              <th>Usuario</th>
              <th>Cancha</th>
              <th>Fecha</th>
              <th>Estado</th>
            </tr>
          </thead>

          <tbody>
            {reservas
              ?.filter(r => {
                if (!r.fechaReserva) return false;
                const f = new Date(r.fechaReserva + 'T00:00:00');
                const hoy = new Date();
                hoy.setHours(0, 0, 0, 0);
                return f >= hoy;
              })
              .sort((a, b) => new Date(a.fechaReserva) - new Date(b.fechaReserva))
              .slice(0, 5)
              .map(r => (
                <tr key={r.id}>
                  <td>{r.usuario?.nombre}</td>
                  <td>{r.cancha?.nombre}</td>
                  <td>{new Date(r.fechaReserva + 'T00:00:00').toLocaleDateString('es-PE', { day: '2-digit', month: 'short' })}</td>
                  <td>{r.estado}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* Estado del sistema */}
      <div className="admin-home-card">
        <h3>{apiOk ? '🟢' : '🔴'} Estado del Sistema</h3>

        <p>{apiOk ? '✔' : '✖'} API {apiOk ? 'funcionando' : 'sin respuesta'}</p>
        <p>{apiOk ? '✔' : '✖'} Base de datos {apiOk ? 'conectada' : 'sin conexión'}</p>
        <p>{apiOk ? '✔ Panel operativo' : '✖ Revisar conexión'}</p>
      </div>

    </section>
  </>
)}

{/* ESTADÍSTICAS Y GRÁFICOS */}
{activeTab === 'estadisticas' && (
  <section className="admin-statistics-container">
    <div className="stats-header">
      <div>
        <h2>Rendimiento del Club</h2>
        <p>Métricas clave de ingresos y reservas.</p>
      </div>

      <div className="stats-header-actions">
        <div className="export-group">
          <button className="filter-btn" onClick={exportarExcelEstadisticas}>📊 Excel</button>
          <button className="filter-btn" onClick={exportarPDFDatos}>📄 PDF Datos</button>
          <button className="filter-btn" onClick={exportarPDFDiseno}>🖼️ PDF Diseño</button>
        </div>

        <div className="time-filter-group">
          {['dia', 'semana', 'mes', 'anio'].map((periodo) => (
            <button
              key={periodo}
              className={`filter-btn ${filtroTiempo === periodo ? 'active' : ''}`}
              onClick={() => setFiltroTiempo(periodo)}
            >
              {periodo === 'anio' ? 'Año' : periodo.charAt(0).toUpperCase() + periodo.slice(1)}
            </button>
          ))}

          <DateFilterPicker
            filtroTiempo={filtroTiempo}
            fechaSeleccionada={fechaSeleccionada}
            onChange={setFechaSeleccionada}
          />
        </div>
      </div>
    </div>
<div className="stats-summary-cards">
  <div className="summary-card">
    <span className="summary-label">Total de Reservas</span>
    <span className="summary-value">{resumenStats.totalReservas}</span>
  </div>
  <div className="summary-card">
    <span className="summary-label">Ingresos Totales</span>
    <span className="summary-value">S/. {resumenStats.totalIngresos.toFixed(2)}</span>
  </div>
  <div className="summary-card">
    <span className="summary-label">Ticket Promedio</span>
    <span className="summary-value">S/. {resumenStats.ticketPromedio.toFixed(2)}</span>
  </div>
  <div className="summary-card summary-card-danger">
    <span className="summary-label">Reservas Canceladas</span>
    <span className="summary-value">{resumenStats.totalCanceladas}</span>
    <span className="summary-subvalue">S/. {resumenStats.ingresosPerdidos.toFixed(2)} perdidos</span>
  </div>
</div>
            <div className="stats-charts-grid">
              <div className="chart-card large">
                <div className="chart-header">
                  <h3>Evolución de Ingresos</h3>  
                  <span className="badge-tag green">Ganancias (S/.)</span>
                </div>
                <div className="chart-body">
                  <canvas ref={ingresosChartRef}></canvas>
                </div>
              </div>

              <div className="chart-card">
                <div className="chart-header">
                  <h3>Popularidad por Deporte</h3>
                  <span className="badge-tag purple">Reservas</span>
                </div>
                <div className="chart-body">
                  <canvas ref={deportesChartRef}></canvas>
                </div>
              </div>

              <div className="chart-card">
                <div className="chart-header">
                  <h3>Horarios Pico</h3>
                  <span className="badge-tag blue">Afluencia</span>
                </div>
                <div className="chart-body">
                  <canvas ref={horariosChartRef}></canvas>
                </div>
              </div>
            </div>
          </section>
        )}

{/* USUARIOS */}
{activeTab === 'usuarios' && (
    <section>
  
  
{/* Tarjetas resumen + Buscador, en su propia sección */}
  <section className="admin-summary-section">
    <div className="admin-summary" style={{ marginBottom: '20px' }}>
      <div className="admin-summary-card">
        <p style={{ margin: 0, color: 'var(--admin-text-muted)' }}>Total</p>
        <h3>{usuarios.length}</h3>
      </div>
      <div className="admin-summary-card">
        <p style={{ margin: 0, color: 'var(--admin-text-muted)' }}>Administradores</p>
        <h3>{usuarios.filter(u => u.rol === 'admin').length}</h3>
      </div>
      <div className="admin-summary-card">
        <p style={{ margin: 0, color: 'var(--admin-text-muted)' }}>Inactivos</p>
        <h3>{usuarios.filter(u => u.habilitado === false).length}</h3>
      </div>
    </div>

    <div className="admin-buscador-container">
      <FaSearch className="admin-buscador-icon" />
      <input
        type="text"
        className="admin-buscador-input"
        placeholder="Buscar por nombre o correo..."
        value={busquedaUsuario}
        onChange={(e) => setBusquedaUsuario(e.target.value)}
      />
    </div>
  </section>


  <section className="admin-table-section">
<table>
      <thead>
        <tr>
          <th className="admin-th-ordenable" onClick={() => handleOrdenar('nombre')}>
            Nombre {ordenUsuarios.campo === 'nombre' && (ordenUsuarios.direccion === 'asc' ? '▲' : '▼')}
          </th>
          <th className="admin-th-ordenable" onClick={() => handleOrdenar('email')}>
            Email {ordenUsuarios.campo === 'email' && (ordenUsuarios.direccion === 'asc' ? '▲' : '▼')}
          </th>
          <th className="admin-th-ordenable" onClick={() => handleOrdenar('rol')}>
            Rol {ordenUsuarios.campo === 'rol' && (ordenUsuarios.direccion === 'asc' ? '▲' : '▼')}
          </th>
          <th className="admin-th-ordenable" onClick={() => handleOrdenar('gasto')}>
            Gasto Total {ordenUsuarios.campo === 'gasto' && (ordenUsuarios.direccion === 'asc' ? '▲' : '▼')}
          </th>
          <th className="admin-th-ordenable" onClick={() => handleOrdenar('estado')}>
            Estado {ordenUsuarios.campo === 'estado' && (ordenUsuarios.direccion === 'asc' ? '▲' : '▼')}
          </th>
          <th className="admin-th-ordenable" onClick={() => handleOrdenar('fechaRegistro')}>
            Fecha de Registro {ordenUsuarios.campo === 'fechaRegistro' && (ordenUsuarios.direccion === 'asc' ? '▲' : '▼')}
          </th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        {usuariosFiltrados.map(u => (
          <tr key={u.id} id={`usuario-row-${u.id}`}>
            <td>{u.nombre}</td>
            <td>{u.email}</td>
            <td>
              <span className={`admin-rol-badge ${u.rol === 'admin' ? 'admin-rol-admin' : 'admin-rol-usuario'}`}>
                {u.rol}
              </span>
            </td>
            <td>S/ {calcularGastoUsuario(u.id).toFixed(2)}</td>
            <td>
              <span className={u.habilitado === false ? "admin-usuario-deshabilitado-badge" : "badge-pagado"}>
                {u.habilitado === false ? "Inactivo" : "Activo"}
              </span>
            </td>
            <td>
              {u.fechaRegistro
                ? new Date(u.fechaRegistro).toLocaleDateString('es-PE', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                  })
                : 'N/A'}
            </td>
            <td>
              <button className="admin-edit-btn" onClick={() => handleAbrirEditarUsuario(u)} title="Editar rol">
                <FaEdit />
              </button>
              <button
                className={u.habilitado === false ? "admin-edit-btn" : "admin-delete-btn"}
                onClick={() => abrirModalDeshabilitar(u)}
                title={u.habilitado === false ? "Habilitar usuario" : "Deshabilitar usuario"}
              >
                {u.habilitado === false ? <FaCheckCircle /> : <FaBan />}
              </button>
              <button className="admin-delete-btn" onClick={() => handleEliminarUsuario(u.id)} title="Eliminar usuario">
                <FaTrash />
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>

    {usuariosFiltrados.length === 0 && (
      <p style={{ textAlign: 'center', color: 'var(--admin-text-muted)', padding: '20px' }}>
        No se encontraron usuarios.
      </p>
    )}
  </section>
  </section>
)}


{usuarioDeshabilitar && (
  <div className="admin-modal-overlay" onClick={cerrarModalDeshabilitar}>
    <div className="admin-modal-box" onClick={(e) => e.stopPropagation()}>
      <div className="admin-modal-header">
        <h3>{usuarioDeshabilitar.habilitado === false ? "Habilitar Usuario" : "Deshabilitar Usuario"}</h3>
        <button className="admin-modal-close" onClick={cerrarModalDeshabilitar}><FaTimes /></button>
      </div>
      <div className="admin-modal-body">
        <p>
          ¿Estás seguro que quieres {usuarioDeshabilitar.habilitado === false ? "habilitar" : "deshabilitar"} a{" "}
          <strong>{usuarioDeshabilitar.nombre}</strong>?
        </p>
      </div>
      <div className="admin-modal-footer">
        <button className="admin-modal-cancel-btn" onClick={cerrarModalDeshabilitar}>Cancelar</button>
        <button className="admin-modal-save-btn" onClick={handleConfirmarDeshabilitar}>Aceptar</button>
      </div>
    </div>
  </div>
)}
      {/* MODAL EDITAR USUARIO */}
      {editandoUsuario && (
        <div className="admin-modal-overlay" onClick={handleCerrarModalUsuario}>
          <div className="admin-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3>Editar Usuario</h3>
              <button className="admin-modal-close" onClick={handleCerrarModalUsuario}><FaTimes /></button>
            </div>
            <div className="admin-modal-body">
              <p className="admin-modal-user-name">{editandoUsuario.nombre}</p>
              <p className="admin-modal-user-email">{editandoUsuario.email}</p>
              <label className="admin-modal-label">Rol del usuario</label>
              <select className="admin-modal-select" value={nuevoRol} onChange={(e) => setNuevoRol(e.target.value)}>
                <option value="usuario">Usuario</option>
                <option value="admin">Administrador</option>
              </select>
            </div>
            <div className="admin-modal-footer">
              <button className="admin-modal-cancel-btn" onClick={handleCerrarModalUsuario}>Cancelar</button>
              <button className="admin-modal-save-btn" onClick={handleGuardarRol}>Guardar Cambios</button>
            </div>
          </div>
        </div>
      )}
{/* RESERVAS */}
{activeTab === "reservas" && (() => {
  const ORDEN_ESTADO = { pendiente: 0, confirmada: 1, cancelada: 2 };

  const reservasVisibles = (
    filtroEstadoReserva === "todas"
      ? reservas.filter((r) =>
          ["pendiente", "confirmada", "cancelada"].includes(r.estado)
        )
      : reservas.filter((r) => r.estado === filtroEstadoReserva)
  )
    .filter((r) => {
      if (!busquedaReserva.trim()) return true;
      const texto = busquedaReserva.toLowerCase();
      return r.usuario?.nombre?.toLowerCase().includes(texto);
    })
    .filter((r) => {
      if (!fechaFiltroReserva) return true;
      return r.fechaReserva === fechaFiltroReserva;
    })
    .sort((a, b) => {
      const ordenEstado = ORDEN_ESTADO[a.estado] - ORDEN_ESTADO[b.estado];
      if (ordenEstado !== 0) return ordenEstado;
      return new Date(b.fechaCreacion) - new Date(a.fechaCreacion);
    });

  const totalPendientes = reservas.filter((r) => r.estado === "pendiente").length;
  const totalConfirmadas = reservas.filter((r) => r.estado === "confirmada").length;
  const totalCanceladas = reservas.filter((r) => r.estado === "cancelada").length;

  function ResumenReservas() {
    return (
      <div className="admin-summary-grid">
        <div className="admin-summary-card">
          <span className="admin-summary-label">Total</span>
          <span className="admin-summary-value">
            {totalPendientes + totalConfirmadas + totalCanceladas}
          </span>
        </div>
        <div className="admin-summary-card">
          <span className="admin-summary-label">Pendientes</span>
          <span className="admin-summary-value">{totalPendientes}</span>
        </div>
        <div className="admin-summary-card">
          <span className="admin-summary-label">Confirmadas</span>
          <span className="admin-summary-value">{totalConfirmadas}</span>
        </div>
        <div className="admin-summary-card">
          <span className="admin-summary-label">Canceladas</span>
          <span className="admin-summary-value">{totalCanceladas}</span>
        </div>
      </div>
    );
  }

  function FiltrosReservas() {
    return (
      <div className="admin-filtros-row">
        <input
          type="text"
          className="admin-search-input"
          placeholder="Buscar por nombre de usuario"
          value={busquedaReserva}
          onChange={(e) => setBusquedaReserva(e.target.value)}
        />

        <input
          type="date"
          className="admin-filtro-fecha"
          value={fechaFiltroReserva}
          onChange={(e) => setFechaFiltroReserva(e.target.value)}
        />

        <select
          className="admin-filtro-estado"
          value={filtroEstadoReserva}
          onChange={(e) => setFiltroEstadoReserva(e.target.value)}
        >
          <option value="pendiente">Pendientes</option>
          <option value="confirmada">Confirmadas</option>
          <option value="cancelada">Canceladas</option>
          <option value="todas">Todas</option>
        </select>
      </div>
    );
  }

  function TablaReservas() {
    if (reservasVisibles.length === 0) {
      return <p className="admin-empty-state">No se encontraron reservas con esos criterios.</p>;
    }

    return (
      <div className="admin-table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Usuario</th>
              <th>Cancha</th>
              <th>Fecha</th>
              <th>Horario</th>
              <th>Estado</th>
              <th>Info</th>
              <th>Detalles</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {reservasVisibles.map((r) => (
              <tr key={r.id}>
                <td>{r.usuario?.nombre}</td>
                <td>{r.cancha?.nombre}</td>
                <td>{r.fechaReserva}</td>
                <td>
                  {r.horaInicio} - {r.horaFin}
                </td>
                <td>
                  <span
                    className={
                      r.estado === "pendiente"
                        ? "badge badge-sin-pago"
                        : r.estado === "confirmada"
                        ? "badge badge-pagado"
                        : "badge badge-fallido"
                    }
                  >
                    {r.estado.charAt(0).toUpperCase() + r.estado.slice(1)}
                  </span>
                </td>
                <td>
                  {r.estado === "cancelada" ? (
                      <span
                        className={
                          r.canceladoPor === "cliente"
                            ? "badge badge-sin-pago"
                            : r.canceladoPor === "sistema"
                            ? "badge badge-fallido"
                            : "badge badge-admin"
                        }
                      >
                        {r.canceladoPor === "cliente"
                          ? "Cliente"
                          : r.canceladoPor === "sistema"
                          ? "Sistema"
                          : "Admin"}
                      </span>
                    ) : (
                    (() => {
                      const pago = ultimoPago(r);
                      const est = pago?.estado;
                      return (
                        <span
                          className={
                            est === "exitoso"
                              ? "badge badge-pagado"
                              : est === "fallido"
                              ? "badge badge-fallido"
                              : "badge badge-sin-pago"
                          }
                        >
                          {est === "exitoso"
                            ? "✔ Pagado"
                            : est === "fallido"
                            ? `✖ Fallido${
                                r.pagos?.length > 1 ? ` (intento ${r.pagos.length})` : ""
                              }`
                            : "Sin pago"}
                        </span>
                      );
                    })()
                  )}
                </td>
                <td>
                  <button className="admin-view-btn" onClick={() => setDetalleReserva(r)}>
                    👁 Ver detalle
                  </button>
                </td>
                <td>
                  <div className="admin-actions-cell">
                    {r.estado === "pendiente" && (
                      <>
                        <button
                          className="admin-confirm-btn"
                          onClick={() => handleCambiarEstadoReserva(r.id, "confirmada")}
                        >
                          ✔ Confirmar
                        </button>
                        <button className="admin-cancel-btn" onClick={() => abrirModalCancelar(r)}>
                          ✖ Cancelar
                        </button>
                      </>
                    )}

                    {r.estado === "confirmada" && (
                      <button className="admin-cancel-btn" onClick={() => abrirModalCancelar(r)}>
                        ✖ Cancelar
                      </button>
                    )}

                    {r.estado === "cancelada" && (
                      <span className="admin-empty-state" style={{ margin: 0 }}>
                        —
                      </span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  function ModalDetalleReserva() {
    if (!detalleReserva) return null;

    return (
      <div className="admin-modal-overlay" onClick={() => setDetalleReserva(null)}>
        <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
          <div className="admin-modal-header">
            <h3>Detalle de la reserva #{detalleReserva.id}</h3>
            <button className="admin-modal-close" onClick={() => setDetalleReserva(null)}>
              ✕
            </button>
          </div>

          <div className="admin-modal-body">
            <div className="admin-modal-row">
              <span>Usuario</span>
              <strong>{detalleReserva.usuario?.nombre || "—"}</strong>
            </div>
            <div className="admin-modal-row">
              <span>Cancha</span>
              <strong>{detalleReserva.cancha?.nombre || "—"}</strong>
            </div>
            <div className="admin-modal-row">
              <span>Fecha</span>
              <strong>{detalleReserva.fechaReserva || "—"}</strong>
            </div>
            <div className="admin-modal-row">
              <span>Horario</span>
              <strong>
                {detalleReserva.horaInicio} - {detalleReserva.horaFin}
              </strong>
            </div>
            <div className="admin-modal-row">
              <span>Monto total</span>
              <strong>S/ {Number(detalleReserva.montoTotal ?? 0).toFixed(2)}</strong>
            </div>
            <div className="admin-modal-row">
              <span>Estado</span>
              <strong>{detalleReserva.estado}</strong>
            </div>

            {detalleReserva.estado !== "cancelada" &&
              (() => {
                const pago = ultimoPago(detalleReserva);
                return (
                  <div className="admin-modal-row">
                    <span>Estado de pago</span>
                    <strong>{pago?.estado || "Sin pago"}</strong>
                  </div>
                );
              })()}

            {detalleReserva.estado === "cancelada" && (
                  <>
                    <div className="admin-modal-row">
                      <span>Cancelado por</span>
                      <strong>
                        {detalleReserva.canceladoPor === "cliente"
                          ? "Cliente"
                          : detalleReserva.canceladoPor === "sistema"
                          ? "Sistema"
                          : "Admin"}
                      </strong>
                    </div>
                    <div className="admin-modal-row">
                      <span>Motivo de cancelación</span>
                      <strong>{detalleReserva.motivoCancelacion || "No especificado"}</strong>
                    </div>
                    {detalleReserva.observacionCancelacion && (
                      <div className="admin-modal-row">
                        <span>Observación</span>
                        <strong>{detalleReserva.observacionCancelacion}</strong>
                      </div>
                    )}
                  </>
                )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <section className="admin-summary-section">
        <h3>Gestión de Reservas</h3>
        <ResumenReservas />
      </section>

      <section className="admin-filtros-section">
        <FiltrosReservas />
      </section>

      <section className="admin-table-section">
        <TablaReservas />
      </section>

      {/* MODAL DE DETALLE */}
      <ModalDetalleReserva />
    </>
  );
})()}


{activeTab === "pagos" && <Pagos pagos={pagos} />}


{activeTab === "canchas" && (
  <section className="admin-canchas-section">
    <div className="admin-canchas-header">
      <div>
        <p className="admin-canchas-subtitle">
          {canchas.length} registradas · {canchas.filter(c => c.estado === 'activa').length} activas · {canchas.filter(c => c.estado === 'mantenimiento').length} en mantenimiento
        </p>
      </div>
      <button
        className="admin-canchas-btn-agregar"
        onClick={() => {
          setNuevaCancha({ nombre: '', tipo: '', precio: '', imagen: null, modalidad: '', dimensiones: '', tipoSuperficie: '', iluminacion: '', caracteristicas: '', descripcion: '' });
          setModalCrearAbierto(true);
        }}
      >
        <FaPlus /> Agregar cancha
      </button>
    </div>

    <div className="admin-canchas-grid">
      {canchas.map((c) => (
        <div key={c.id} className="admin-canchas-card">
          <div className="admin-canchas-card-image-container">
            {c.imagen ? (
              <img src={c.imagen} alt={c.nombre} className="admin-canchas-card-image" />
            ) : (
              <div className="admin-canchas-card-no-image">Sin Imagen</div>
            )}
            <span className={`admin-cancha-estado-badge ${c.estado === 'activa' ? 'estado-activa' : 'estado-mantenimiento'}`}>
              {c.estado === 'activa' ? 'Activa' : 'Mantenimiento'}
            </span>
          </div>

          <div className="admin-canchas-card-content">
            <div className="admin-canchas-card-header">
              <h4 className="admin-canchas-card-title">{c.nombre}</h4>
              <span className="admin-canchas-card-price">
                S/ {c.precio_hora ?? c.precio}/h
              </span>
            </div>

            <p className="admin-canchas-card-subtext">⚽ {c.tipo}</p>
            {c.modalidad && <p className="admin-canchas-card-subtext">👥 {c.modalidad}</p>}

            <div className="admin-canchas-card-actions">
              <button className="admin-canchas-btn-detalle" onClick={() => setDetalleCancha(c)}>
                👁 Detalle
              </button>
              <button className="admin-canchas-btn-edit" onClick={() => handleEditarCancha(c)}>
                <FaEdit /> Editar
              </button>
              <button className="admin-canchas-btn-delete" onClick={() => handleEliminarCancha(c.id)}>
                <FaTrash /> Eliminar
              </button>
            </div>

            <div className="admin-canchas-card-estado-toggle">
              {c.estado === 'activa' ? (
                <button className="admin-cancel-btn" onClick={() => abrirModalEstadoCancha(c, 'mantenimiento')}>
                  Poner en Mantenimiento
                </button>
              ) : (
                <button className="admin-confirm-btn" onClick={() => abrirModalEstadoCancha(c, 'activa')}>
                  Marcar como Activa
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  </section>
)}
{modalEstadoCancha && (
  <div className="admin-modal-overlay" onClick={() => setModalEstadoCancha(null)}>
    <div className="admin-modal-box" onClick={(e) => e.stopPropagation()}>
      <div className="admin-modal-header">
        <h3>Poner en Mantenimiento</h3>
        <button className="admin-modal-close" onClick={() => setModalEstadoCancha(null)}><FaTimes /></button>
      </div>
      <div className="admin-modal-body">
        <p><strong>Cancha:</strong> {modalEstadoCancha.cancha.nombre}</p>

        <label className="admin-modal-label">Motivo</label>
        <select
          className="admin-modal-select"
          value={motivoCanchaAdmin}
          onChange={(e) => setMotivoCanchaAdmin(e.target.value)}
        >
          <option value="Mantenimiento">Mantenimiento</option>
          <option value="Reparación">Reparación</option>
          <option value="Limpieza">Limpieza</option>
          <option value="Remodelación">Remodelación</option>
          <option value="Daño o desperfecto">Daño o desperfecto</option>
          <option value="Evento deportivo">Evento deportivo</option>
          <option value="Campeonato">Campeonato</option>
          <option value="Cierre temporal">Cierre temporal</option>
          <option value="Otro">Otro</option>
        </select>

        <label className="admin-modal-label">Observación (opcional)</label>
        <textarea
          className="admin-modal-select"
          rows={3}
          placeholder="Detalles adicionales..."
          value={observacionCanchaAdmin}
          onChange={(e) => setObservacionCanchaAdmin(e.target.value)}
        />
      </div>
      <div className="admin-modal-footer">
        <button className="admin-modal-cancel-btn" onClick={() => setModalEstadoCancha(null)}>Cancelar</button>
        <button className="admin-modal-save-btn" onClick={confirmarCambioEstadoConMotivo}>Confirmar</button>
      </div>
    </div>
  </div>
)}
{detalleCancha && (
  <div className="admin-modal-overlay" onClick={() => setDetalleCancha(null)}>
    <div className="admin-modal-box" onClick={(e) => e.stopPropagation()}>
      <div className="admin-modal-header">
        <h3>{detalleCancha.nombre}</h3>
        <button className="admin-modal-close" onClick={() => setDetalleCancha(null)}><FaTimes /></button>
      </div>
      <div className="admin-modal-body">
        {detalleCancha.imagen && (
          <img src={detalleCancha.imagen} alt={detalleCancha.nombre} style={{ width: '100%', borderRadius: 8, marginBottom: 12 }} />
        )}
        <p><strong>Deporte:</strong> {detalleCancha.tipo}</p>
        <p><strong>Precio por hora:</strong> S/ {detalleCancha.precio_hora ?? detalleCancha.precio}</p>
        {detalleCancha.modalidad && <p><strong>Modalidad:</strong> {detalleCancha.modalidad}</p>}
        {detalleCancha.dimensiones && <p><strong>Dimensiones:</strong> {detalleCancha.dimensiones}</p>}
        {detalleCancha.tipoSuperficie && <p><strong>Tipo de superficie:</strong> {detalleCancha.tipoSuperficie}</p>}
        {detalleCancha.iluminacion && <p><strong>Iluminación:</strong> {detalleCancha.iluminacion}</p>}
        {detalleCancha.caracteristicas && <p><strong>Características:</strong> {detalleCancha.caracteristicas}</p>}
        {detalleCancha.descripcion && <p><strong>Descripción:</strong> {detalleCancha.descripcion}</p>}
        <p>
          <strong>Estado:</strong>{' '}
          <span className={`admin-cancha-estado-badge ${detalleCancha.estado === 'activa' ? 'estado-activa' : 'estado-mantenimiento'}`}>
            {detalleCancha.estado === 'activa' ? 'Activa' : 'Mantenimiento'}
          </span>
        </p>
        {detalleCancha.estado === 'mantenimiento' && (
          <>
            <p><strong>Motivo:</strong> {detalleCancha.motivoEstado || 'No especificado'}</p>
            {detalleCancha.observacionEstado && <p><strong>Observación:</strong> {detalleCancha.observacionEstado}</p>}
          </>
        )}
      </div>
      <div className="admin-modal-footer">
        <button className="admin-modal-cancel-btn" onClick={() => setDetalleCancha(null)}>Cerrar</button>
      </div>
    </div>
  </div>
)}
        {/* MODAL PARA AGREGAR NUEVA CANCHA */}
        {modalCrearAbierto && (
          <div className="admin-canchas-modal-overlay" onClick={() => setModalCrearAbierto(false)}>
            <div className="admin-canchas-modal-box" onClick={(e) => e.stopPropagation()}>
              <div className="admin-canchas-modal-header">
                <h3>Agregar Nueva Cancha</h3>
                <button className="admin-canchas-modal-close" onClick={() => setModalCrearAbierto(false)}>
                  <FaTimes />
                </button>
              </div>
              <form onSubmit={(e) => {
                handleAgregarCancha(e);
                setModalCrearAbierto(false);
              }}>
                <div className="admin-canchas-modal-body">
                  <label>Nombre de la cancha</label>
                  <input
                    type="text"
                    name="nombre"
                    placeholder="Ej: Cancha Central"
                    value={nuevaCancha.nombre}
                    onChange={handleInputChange}
                    required
                  />

                  <label>Tipo de cancha</label>
                  <input
                    type="text"
                    name="tipo"
                    placeholder="Ej: Fútbol - Césped Sintético"
                    value={nuevaCancha.tipo}
                    onChange={handleInputChange}
                    required
                  />

                  <label>Precio por hora (S/)</label>
                  <input
                    type="number"
                    name="precio"
                    placeholder="Ej: 85"
                    value={nuevaCancha.precio}
                    onChange={handleInputChange}
                    required
                  />
                  <label>Modalidad</label>
<input
  type="text"
  name="modalidad"
  placeholder="Ej: 7 vs 7"
  value={nuevaCancha.modalidad}
  onChange={handleInputChange}
/>

<label>Dimensiones</label>
<input
  type="text"
  name="dimensiones"
  placeholder="Ej: 40 x 20 m"
  value={nuevaCancha.dimensiones}
  onChange={handleInputChange}
/>

<label>Tipo de superficie</label>
<input
  type="text"
  name="tipoSuperficie"
  placeholder="Ej: Césped sintético"
  value={nuevaCancha.tipoSuperficie}
  onChange={handleInputChange}
/>

<label>Iluminación</label>
<select
  name="iluminacion"
  value={nuevaCancha.iluminacion}
  onChange={handleInputChange}
>
  <option value="">Seleccionar...</option>
  <option value="Nocturna">Nocturna</option>
  <option value="Natural">Natural</option>
  <option value="Sin iluminación">Sin iluminación</option>
</select>

<label>Características</label>
<input
  type="text"
  name="caracteristicas"
  placeholder="Ej: Césped sintético · Iluminación · Vestuarios"
  value={nuevaCancha.caracteristicas}
  onChange={handleInputChange}
/>

<label>Descripción</label>
<textarea
  name="descripcion"
  rows={3}
  placeholder="Descripción de la cancha..."
  value={nuevaCancha.descripcion}
  onChange={handleInputChange}
/>

                  <label>Imagen de la cancha</label>
                  <input type="file" accept="image/*" onChange={handleImageChange} />
                </div>
                <div className="admin-canchas-modal-footer">
                  <button
                    type="button"
                    className="admin-canchas-modal-cancel-btn"
                    onClick={() => setModalCrearAbierto(false)}
                  >
                    Cancelar
                  </button>
                  <button type="submit" className="admin-canchas-modal-save-btn">
                    Guardar Cancha
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL EDITAR CANCHA */}
        {editandoCancha && (
          <div className="admin-canchas-modal-overlay" onClick={() => setEditandoCancha(null)}>
            <div className="admin-canchas-modal-box" onClick={(e) => e.stopPropagation()}>
              <div className="admin-canchas-modal-header">
                <h3>Editar Cancha</h3>
                <button className="admin-canchas-modal-close" onClick={() => setEditandoCancha(null)}>
                  <FaTimes />
                </button>
              </div>
              <form onSubmit={handleActualizarCancha}>
                <div className="admin-canchas-modal-body">
                  <label>Nombre</label>
                  <input type="text" name="nombre" value={nuevaCancha.nombre} onChange={handleInputChange} required />

                  <label>Tipo</label>
                  <input type="text" name="tipo" value={nuevaCancha.tipo} onChange={handleInputChange} required />

                  <label>Precio por hora</label>
                  <input type="number" name="precio" value={nuevaCancha.precio} onChange={handleInputChange} required />

                  <label>Modalidad</label>
<input
  type="text"
  name="modalidad"
  placeholder="Ej: 7 vs 7"
  value={nuevaCancha.modalidad}
  onChange={handleInputChange}
/>

<label>Dimensiones</label>
<input
  type="text"
  name="dimensiones"
  placeholder="Ej: 40 x 20 m"
  value={nuevaCancha.dimensiones}
  onChange={handleInputChange}
/>

<label>Tipo de superficie</label>
<input
  type="text"
  name="tipoSuperficie"
  placeholder="Ej: Césped sintético"
  value={nuevaCancha.tipoSuperficie}
  onChange={handleInputChange}
/>

<label>Iluminación</label>
<select
  name="iluminacion"
  value={nuevaCancha.iluminacion}
  onChange={handleInputChange}
>
  <option value="">Seleccionar...</option>
  <option value="Nocturna">Nocturna</option>
  <option value="Natural">Natural</option>
  <option value="Sin iluminación">Sin iluminación</option>
</select>

<label>Características</label>
<input
  type="text"
  name="caracteristicas"
  placeholder="Ej: Césped sintético · Iluminación · Vestuarios"
  value={nuevaCancha.caracteristicas}
  onChange={handleInputChange}
/>

<label>Descripción</label>
<textarea
  name="descripcion"
  rows={3}
  placeholder="Descripción de la cancha..."
  value={nuevaCancha.descripcion}
  onChange={handleInputChange}
/>

                  <label>Cambiar imagen</label>
                  <input type="file" accept="image/*" onChange={handleImageChange} />
                  {editandoCancha.imagen && (
                    <>
                      <p className="admin-canchas-preview-text">Imagen actual:</p>
                      <img src={editandoCancha.imagen} alt="Cancha" className="admin-canchas-preview-img" />
                    </>
                  )}
                </div>
                <div className="admin-canchas-modal-footer">
                  <button type="button" className="admin-canchas-modal-cancel-btn" onClick={() => setEditandoCancha(null)}>Cancelar</button>
                  <button type="submit" className="admin-canchas-modal-save-btn">Guardar Cambios</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL PARA ELEGIR MOTIVO Y CANCELAR RESERVA */}
        {mostrarModalCancelar && (
          <div className="admin-modal-overlay" onClick={cerrarModalCancelar}>
            <div className="admin-modal-box" onClick={(e) => e.stopPropagation()}>
              <div className="admin-modal-header">
                <h3>Cancelar Reserva</h3>
                <button className="admin-modal-close" onClick={cerrarModalCancelar}><FaTimes /></button>
              </div>
              <div className="admin-modal-body">
                <p><strong>Usuario:</strong> {reservaCancelar?.usuario?.nombre}</p>
                <p><strong>Cancha:</strong> {reservaCancelar?.cancha?.nombre}</p>

                <label className="admin-modal-label">Motivo de cancelación</label>
                <select
                  className="admin-modal-select"
                  value={motivoAdmin}
                  onChange={(e) => setMotivoAdmin(e.target.value)}
                >
                  <option value="Mantenimiento de la cancha">Mantenimiento de la cancha</option>
                  <option value="Condiciones climáticas">Condiciones climáticas</option>
                  <option value="Problema técnico">Problema técnico</option>
                  <option value="Doble reserva / error de sistema">Doble reserva / error de sistema</option>
                  <option value="Solicitud del cliente">Solicitud del cliente</option>
                  <option value="Otro">Otro</option>
                </select>

                <label className="admin-modal-label">Observación (opcional)</label>
                <textarea
                  className="admin-modal-select"
                  rows={3}
                  placeholder="Detalles adicionales para el cliente..."
                  value={observacionAdmin}
                  onChange={(e) => setObservacionAdmin(e.target.value)}
                />
              </div>
              <div className="admin-modal-footer">
                <button className="admin-modal-cancel-btn" onClick={cerrarModalCancelar}>Volver</button>
                <button className="admin-modal-save-btn" onClick={handleConfirmarCancelacion}>Confirmar Cancelación</button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'configuracion' && (
  <section className="admin-config-section">
    <div className="admin-config-header">
      <div>
        <h2>Configuración</h2>
        <p>Administra tu cuenta y las preferencias de SportsMatch.</p>
      </div>
    </div>

    {mensajePerfil && (
  <div ref={mensajeRef} className={`admin-config-mensaje ${mensajePerfil.tipo}`}>
    {mensajePerfil.texto}
  </div>
)}

    <div className="admin-config-grid">

      <div className="admin-config-card">
  <div className="admin-config-card-header">
    <div>
      <h3>Datos de Perfil</h3>
      <p>Información de tu cuenta.</p>
    </div>
  </div>

  {!editandoPerfil ? (
    <>
      <label>Nombre</label>
<p className="admin-config-valor-fijo">{currentUser?.nombreUsuario || '—'}</p>

<label>Email</label>
<p className="admin-config-valor-fijo">{currentUser?.email || '—'}</p>

      <button
  type="button"
  className="admin-confirm-btn"
  onClick={() => {
    setPerfilForm({ nombre: currentUser?.nombreUsuario || '', email: currentUser?.email || '' });
    setEditandoPerfil(true);
  }}
>
  Editar Perfil
</button>
    </>
  ) : (
    <>
      <label>Nombre</label>
      <input
        type="text"
        value={perfilForm.nombre}
        onChange={(e) => setPerfilForm({ ...perfilForm, nombre: e.target.value })}
      />

      <label>Email</label>
      <input
        type="email"
        value={perfilForm.email}
        onChange={(e) => setPerfilForm({ ...perfilForm, email: e.target.value })}
      />

      <label>Nueva contraseña (opcional)</label>
      <input
        type="password"
        value={passwordForm.nueva}
        onChange={(e) => setPasswordForm({ ...passwordForm, nueva: e.target.value })}
        placeholder="Dejar en blanco para no cambiar"
      />

      <label>Confirmar contraseña</label>
      <input
        type="password"
        value={passwordForm.confirmar}
        onChange={(e) => setPasswordForm({ ...passwordForm, confirmar: e.target.value })}
        placeholder="Dejar en blanco para no cambiar"
      />

      <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
        <button
          type="button"
          className="admin-confirm-btn"
          onClick={guardarPerfilManual}
          disabled={guardandoPerfil}
        >
          {guardandoPerfil ? 'Guardando...' : 'Guardar Perfil'}
        </button>

        <button
          type="button"
          className="admin-secondary-btn"
          onClick={() => {
            setPerfilForm({ nombre: currentUser.nombreUsuario || '', email: currentUser.email || '' });
            setPasswordForm({ nueva: '', confirmar: '' });
            setEditandoPerfil(false);
          }}
        >
          Cancelar
        </button>
      </div>
    </>
  )}
</div>

      <div className="admin-config-card">
        <div className="admin-config-card-header">
          <div>
            <h3>Configuración General</h3>
            <p>Horario de atención del club.</p>
          </div>
        </div>

        <label>Horario de atención</label>
        <div className="admin-config-time-row">
          <input
            type="time"
            value={configGeneral.horaApertura}
            onChange={(e) => setConfigGeneral({ ...configGeneral, horaApertura: e.target.value })}
          />
          <span>hasta</span>
          <input
            type="time"
            value={configGeneral.horaCierre}
            onChange={(e) => setConfigGeneral({ ...configGeneral, horaCierre: e.target.value })}
          />
        </div>
      </div>

      <div className="admin-config-card">
        <div className="admin-config-card-header">
          <div>
            <h3>Configuración de Reservas</h3>
            <p>Define las reglas para las reservas.</p>
          </div>
        </div>

        <label>Duración mínima (horas)</label>
        <input
          type="number"
          min="0.5"
          step="0.5"
          value={configReservas.duracionMinima}
          onChange={(e) => setConfigReservas({ ...configReservas, duracionMinima: Number(e.target.value) })}
        />

        <label>Duración máxima (horas)</label>
        <input
          type="number"
          min="0.5"
          step="0.5"
          value={configReservas.duracionMaxima}
          onChange={(e) => setConfigReservas({ ...configReservas, duracionMaxima: Number(e.target.value) })}
        />

        <label>Anticipación máxima para reservar (días)</label>
        <input
          type="number"
          min="1"
          value={configReservas.anticipacionMaximaDias}
          onChange={(e) => setConfigReservas({ ...configReservas, anticipacionMaximaDias: Number(e.target.value) })}
        />
      </div>

    </div>

    <div className="admin-config-guardar-todo">
      <button
        type="button"
        className="admin-confirm-btn admin-confirm-btn-final"
        onClick={guardarTodo}
        disabled={guardandoTodo}
      >
        {guardandoTodo ? 'Guardando...' : 'Guardar Cambios'}
      </button>
    </div>

  </section>
)}
      </div>
    </div>
  );
}

export default AdminDashboard;