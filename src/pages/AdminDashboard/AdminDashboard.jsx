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
  FaChartBar
} from "react-icons/fa";

function AdminDashboard({ onLogout }) {
  const [usuarios, setUsuarios] = useState([]);
  const [canchas, setCanchas] = useState([]);
  const [reservas, setReservas] = useState([]);
  const [activeTab, setActiveTab] = useState('Inicio');
  const [adminName, setAdminName] = useState('');
  const [loading, setLoading] = useState(true);
  const [editandoCancha, setEditandoCancha] = useState(null); 
  const [modalCrearAbierto, setModalCrearAbierto] = useState(false);
  const [reservaACancelar, setReservaACancelar] = useState(null);
const [motivoCancelacion, setMotivoCancelacion] = useState("Trabajo");
const [notaCancelacion, setNotaCancelacion] = useState("");

  // Estado para filtro de estadísticas
  const [filtroTiempo, setFiltroTiempo] = useState('mes');

  // Estado para editar usuario
  const [editandoUsuario, setEditandoUsuario] = useState(null);
  const [nuevoRol, setNuevoRol] = useState('');

  const [nuevaCancha, setNuevaCancha] = useState({
    nombre: '',
    tipo: '',
    precio: '',
    imagen: null
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
      } catch (err) {
        console.error("Error al cargar datos de administración:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [onLogout]);

  // 👇 Función auxiliar para filtrar reservas según el filtro de tiempo elegido
  const filtrarPorTiempo = (reservasList, filtro) => {
    const ahora = new Date();
    return reservasList.filter(r => {
      if (!r.fechaReserva) return false;
      const fecha = new Date(r.fechaReserva);
      switch (filtro) {
        case 'dia':
          return fecha.toDateString() === ahora.toDateString();
        case 'semana': {
          const inicioSemana = new Date(ahora);
          inicioSemana.setDate(ahora.getDate() - ahora.getDay());
          inicioSemana.setHours(0, 0, 0, 0);
          return fecha >= inicioSemana;
        }
        case 'mes':
          return fecha.getMonth() === ahora.getMonth() && fecha.getFullYear() === ahora.getFullYear();
        case 'anio':
          return fecha.getFullYear() === ahora.getFullYear();
        default:
          return true;
      }
    });
  };

  // 👇 useEffect que crea/actualiza los 3 gráficos cuando corresponde
  useEffect(() => {
    if (activeTab !== 'estadisticas' || !reservas.length) return;

    const reservasFiltradas = filtrarPorTiempo(reservas, filtroTiempo);

    // ===== GRÁFICO 1: Evolución de Ingresos (línea) =====
    const ingresosPorFecha = {};
    reservasFiltradas.forEach(r => {
      if (r.estado !== 'pagada' && r.estado !== 'confirmada') return;
      const fecha = r.fechaReserva;
      ingresosPorFecha[fecha] = (ingresosPorFecha[fecha] || 0) + (Number(r.montoTotal) || 0);
    });
    const fechasOrdenadas = Object.keys(ingresosPorFecha).sort();

    if (ingresosChartInstance.current) ingresosChartInstance.current.destroy();
    if (ingresosChartRef.current) {
      ingresosChartInstance.current = new Chart(ingresosChartRef.current.getContext('2d'), {
        type: 'line',
        data: {
          labels: fechasOrdenadas,
          datasets: [{
            label: 'Ingresos (S/.)',
            data: fechasOrdenadas.map(f => ingresosPorFecha[f]),
            borderColor: '#10b981',
            backgroundColor: 'rgba(16, 185, 129, 0.15)',
            fill: true,
            tension: 0.3
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } }
        }
      });
    }

    // ===== GRÁFICO 2: Popularidad por Deporte (dona) =====
    const conteoPorTipo = {};
    reservasFiltradas.forEach(r => {
      const tipo = r.cancha?.tipo || 'Otro';
      conteoPorTipo[tipo] = (conteoPorTipo[tipo] || 0) + 1;
    });

    if (deportesChartInstance.current) deportesChartInstance.current.destroy();
    if (deportesChartRef.current) {
      deportesChartInstance.current = new Chart(deportesChartRef.current.getContext('2d'), {
        type: 'doughnut',
        data: {
          labels: Object.keys(conteoPorTipo),
          datasets: [{
            data: Object.values(conteoPorTipo),
            backgroundColor: ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6']
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
    reservasFiltradas.forEach(r => {
      if (!r.horaInicio) return;
      const hora = r.horaInicio.split(':')[0] + ':00';
      conteoPorHora[hora] = (conteoPorHora[hora] || 0) + 1;
    });
    const horasOrdenadas = Object.keys(conteoPorHora).sort();

    if (horariosChartInstance.current) horariosChartInstance.current.destroy();
    if (horariosChartRef.current) {
      horariosChartInstance.current = new Chart(horariosChartRef.current.getContext('2d'), {
        type: 'bar',
        data: {
          labels: horasOrdenadas,
          datasets: [{
            label: 'Reservas',
            data: horasOrdenadas.map(h => conteoPorHora[h]),
            backgroundColor: '#3b82f6'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } }
        }
      });
    }

    // Limpieza al desmontar o antes de re-ejecutar el efecto
    return () => {
      if (ingresosChartInstance.current) ingresosChartInstance.current.destroy();
      if (deportesChartInstance.current) deportesChartInstance.current.destroy();
      if (horariosChartInstance.current) horariosChartInstance.current.destroy();
    };
  }, [activeTab, reservas, filtroTiempo]);

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
    if (nuevaCancha.imagen) {
      formData.append('imagen', nuevaCancha.imagen);
    }
    try {
      const token = localStorage.getItem('authToken');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await axios.post('http://localhost:8080/api/canchas/registrar', formData, { headers });
      setCanchas(prev => [...prev, res.data]);
      setNuevaCancha({ nombre: '', tipo: '', precio: '', imagen: null });
    } catch (err) {
      console.error("Error al agregar cancha:", err.response?.data || err.message);
      alert("No se pudo registrar la cancha.");
    }
  };

  const handleEliminarCancha = async (id) => {
    if (!window.confirm("¿Estás seguro de eliminar esta cancha?")) return;
    try {
      const token = localStorage.getItem('authToken');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      await axios.delete(`http://localhost:8080/api/canchas/${id}`, { headers });
      setCanchas(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      console.error("Error al eliminar cancha:", err);
      alert("No se pudo eliminar la cancha.");
    }
  };

  const handleEditarCancha = (cancha) => {
    setEditandoCancha(cancha);

    setNuevaCancha({
      nombre: cancha.nombre,
      tipo: cancha.tipo,
      precio: cancha.precio_hora || cancha.precio,
      imagen: null
    });
  };

  const handleActualizarCancha = async (e) => {
    e.preventDefault();

    if (!editandoCancha) return;

    const confirmar = window.confirm(
      "¿Estás seguro de actualizar esta cancha?"
    );

    if (!confirmar) return;

    const formData = new FormData();

    formData.append("nombre", nuevaCancha.nombre);
    formData.append("tipo", nuevaCancha.tipo);
    formData.append("precio", nuevaCancha.precio);

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

      setCanchas(prev =>
        prev.map(c => c.id === res.data.id ? res.data : c)
      );

      setEditandoCancha(null);

      setNuevaCancha({
        nombre: "",
        tipo: "",
        precio: "",
        imagen: null
      });

      alert("✅ Cancha actualizada correctamente.");

    } catch (err) {
      console.error(err);
      alert("❌ No se pudo actualizar la cancha.");
    }
  };

  const handleAbrirEditarUsuario = (usuario) => {
    setEditandoUsuario(usuario);
    setNuevoRol(usuario.rol);
  };

  const handleCerrarModalUsuario = () => {
    setEditandoUsuario(null);
    setNuevoRol('');
  };

  const handleEliminarUsuario = async (id) => {
    const confirmar = window.confirm("¿Estás seguro de que deseas eliminar este usuario?");

    if (!confirmar) return;

    try {
      const token = localStorage.getItem('authToken');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      await axios.delete(
        `http://localhost:8080/api/usuarios/${id}`,
        { headers }
      );

      setUsuarios(prev => prev.filter(u => u.id !== id));

      alert("✅ Usuario eliminado correctamente.");

    } catch (err) {
      console.error("Error al eliminar usuario:", err);
      alert("❌ No se pudo eliminar el usuario.");
    }
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

      setUsuarios(prev =>
        prev.map(u => u.id === editandoUsuario.id ? { ...u, rol: nuevoRol } : u)
      );

      handleCerrarModalUsuario();
      alert("Rol actualizado correctamente.");
    } catch (err) {
      console.error("Error al actualizar rol:", err);
      alert("No se pudo actualizar el rol del usuario.");
    }
  };

  const handleCambiarEstadoReserva = async (reservaId, nuevoEstado) => {
    if (!window.confirm(`¿Seguro que deseas cambiar el estado a "${nuevoEstado}"?`)) return;

    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        alert('No hay token de autenticación, por favor inicia sesión.');
        return;
      }

      const reservaActual = reservas.find(r => r.id === reservaId);
      if (!reservaActual) return alert("Reserva no encontrada");

      const reservaActualizada = { ...reservaActual, estado: nuevoEstado };

      await axios.put(
        `http://localhost:8080/api/reservas/actualizar/${reservaId}`,
        reservaActualizada,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert(`Estado de reserva actualizado a "${nuevoEstado}"`);

      setReservas(prev =>
        prev.map(r => (r.id === reservaId ? { ...r, estado: nuevoEstado } : r))
      );
    } catch (error) {
      console.error("Error al actualizar estado de reserva:", error);
      alert("No se pudo actualizar el estado de la reserva.");
    }
  };
const tituloPorTab = {
  Inicio: 'Inicio',
  estadisticas: 'Estadísticas',
  usuarios: 'Usuarios',
  reservas: 'Reservas',
  canchas: 'Canchas'
};
  if (loading) return <div className="admin-loading">Cargando panel de administración...</div>;

  return (
    <div className="admin-dashboard-container">
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
            onClick={() => setActiveTab('canchas')} 
            className={activeTab === 'canchas' ? 'active' : ''}
          >
            <FaFutbol /> Canchas
          </button>

          <button className="admin-logout-button" onClick={onLogout}>
            <FaSignOutAlt /> Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* 2. PANEL CONTENEDOR PRINCIPAL */}
      <div className="admin-content">
        <header className="admin-header">
  <h3>{tituloPorTab[activeTab] || 'Panel'}</h3>
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
            </section>

            {/* Panel inferior */}
            <section className="admin-home-grid">

              {/* Accesos rápidos */}
              <div className="admin-home-card">
                <h3>⚡ Accesos rápidos</h3>

                <div className="admin-shortcuts">

                  <button onClick={() => setActiveTab("usuarios")}>
                    <FaUsers />
                    Usuarios
                  </button>

                  <button onClick={() => setActiveTab("reservas")}>
                    <FaClipboardList />
                    Reservas
                  </button>

                  <button onClick={() => setActiveTab("canchas")}>
                    <FaFutbol />
                    Canchas
                  </button>

                  <button onClick={() => setActiveTab("estadisticas")}>
                    <FaChartBar />
                    Estadísticas
                  </button>

                </div>
              </div>

              {/* Últimas reservas */}
              <div className="admin-home-card">
                <h3>📅 Últimas Reservas</h3>

                <table>
                  <thead>
                    <tr>
                      <th>Usuario</th>
                      <th>Cancha</th>
                      <th>Estado</th>
                    </tr>
                  </thead>

                  <tbody>

                    {reservas
                      ?.slice(-5)
                      .reverse()
                      .map(r => (
                        <tr key={r.id}>
                          <td>{r.usuario?.nombre}</td>
                          <td>{r.cancha?.nombre}</td>
                          <td>{r.estado}</td>
                        </tr>
                      ))}

                  </tbody>
                </table>
              </div>

              {/* Estado del sistema */}
              <div className="admin-home-card">

                <h3>🟢 Estado del Sistema</h3>

                <p>✔ API funcionando</p>

                <p>✔ Base de datos conectada</p>

                <p>✔ Panel operativo</p>

              </div>

              {/* Resumen */}
              <div className="admin-home-card">

                <h3>📌 Resumen</h3>

                <p>
                  Usuarios administradores:
                  <strong>
                    {" "}
                    {usuarios.filter(u => u.rol === "admin").length}
                  </strong>
                </p>

                <p>
                  Usuarios normales:
                  <strong>
                    {" "}
                    {usuarios.filter(u => u.rol === "usuario").length}
                  </strong>
                </p>

                <p>
                  Reservas canceladas:
                  <strong>
                    {" "}
                    {reservas.filter(r => r.estado === "cancelada").length}
                  </strong>
                </p>

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
              </div>
            </div>

            <div className="stats-charts-grid">
              <div className="chart-card large">
                <div className="chart-header">
                  <h3>Evolución de Ingresos</h3>
                  <span className="badge-tag green">Ganancias ($)</span>
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
          <section className="admin-table-section">
            <h3>Lista de Usuarios</h3>
            <table>
              <thead>
                <tr><th>Nombre</th><th>Email</th><th>Rol</th><th>Acciones</th></tr>
              </thead>
              <tbody>
                {usuarios.map(u => (
                  <tr key={u.id}>
                    <td>{u.nombre}</td>
                    <td>{u.email}</td>
                    <td>
                      <span className={`admin-rol-badge ${u.rol === 'admin' ? 'admin-rol-admin' : 'admin-rol-usuario'}`}>
                        {u.rol}
                      </span>
                    </td>
                    <td>
                      <button className="admin-edit-btn" onClick={() => handleAbrirEditarUsuario(u)} title="Editar rol">
                        <FaEdit />
                      </button>
                      <button className="admin-delete-btn" onClick={() => handleEliminarUsuario(u.id)} title="Eliminar usuario">
                        <FaTrash />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

{/* RESERVAS */}
{activeTab === 'reservas' && (
  <section className="admin-reservas-section">
    <h3>Reservas por Estado</h3>
    <div className="admin-reservas-grid">
      {["pendiente", "confirmada", "pagada", "cancelada"].map(estado => (
        <div className="admin-reservas-card" key={estado}>
          <div className="admin-reservas-card-header">
            <h4>{estado.charAt(0).toUpperCase() + estado.slice(1)}</h4>
            <span className={`admin-reservas-badge badge-${estado}`}>
              {reservas.filter(r => r.estado === estado).length}
            </span>
          </div>
          <table className="admin-reservas-table">
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Cancha</th>
                <th>Fecha</th>
                <th>Inicio</th>
                <th>Fin</th>
                <th>Acciones / Estado</th>
              </tr>
            </thead>
            <tbody>
              {reservas.filter(r => r.estado === estado).length === 0 ? (
                <tr>
                  <td colSpan="6" className="admin-reservas-empty">Sin reservas en este estado</td>
                </tr>
              ) : (
                reservas.filter(r => r.estado === estado).map(r => (
                  <tr key={r.id}>
                    <td>{r.usuario?.nombre}</td>
                    <td>{r.cancha?.nombre}</td>
                    <td>{r.fechaReserva}</td>
                    <td>{r.horaInicio}</td>
                    <td>{r.horaFin}</td>
                    <td>
                      {/* ESTADO: PENDIENTE */}
                      {estado === "pendiente" && (
                        <div className="admin-reservas-actions">
                          <button className="admin-btn-confirmar" onClick={() => handleCambiarEstadoReserva(r.id, "confirmada")}>
                            Confirmar
                          </button>
                          <button className="admin-btn-cancelar" onClick={() => setReservaACancelar(r)}>
                            Cancelar
                          </button>
                        </div>
                      )}

                      {/* ESTADO: CONFIRMADA (Esperando pago del cliente) */}
                      {estado === "confirmada" && (
                        <div className="admin-reservas-actions">
                          <span className="admin-text-warning">⏳ Esperando pago del usuario</span>
                          <button className="admin-btn-cancelar" onClick={() => setReservaACancelar(r)}>
                            Cancelar
                          </button>
                        </div>
                      )}

                      {/* ESTADO: PAGADA (Actualizado automáticamente cuando el usuario paga) */}
                      {estado === "pagada" && (
                        <span className="admin-text-success">✔ Pagado por el usuario</span>
                      )}

                      {/* ESTADO: CANCELADA */}
                      {estado === "cancelada" && (
                        <span className="admin-text-muted">
                          {r.motivoCancelacion ? `Motivo: ${r.motivoCancelacion}` : "Cancelada"}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ))}
    </div>

    {/* MODAL DE CANCELACIÓN CON OPCIONES Y NOTA PARA EL USUARIO */}
    {reservaACancelar && (
      <div className="admin-canchas-modal-overlay" onClick={() => setReservaACancelar(null)}>
        <div className="admin-canchas-modal-box" onClick={(e) => e.stopPropagation()}>
          <div className="admin-canchas-modal-header">
            <h3>Cancelar Reserva</h3>
            <button className="admin-canchas-modal-close" onClick={() => setReservaACancelar(null)}>✕</button>
          </div>
          <div className="admin-canchas-modal-body">
            <p><strong>Usuario:</strong> {reservaACancelar.usuario?.nombre}</p>
            <p><strong>Cancha:</strong> {reservaACancelar.cancha?.nombre} ({reservaACancelar.fechaReserva})</p>
            
            <label>Selecciona el motivo principal:</label>
            <select 
              className="admin-reservas-select"
              value={motivoCancelacion} 
              onChange={(e) => setMotivoCancelacion(e.target.value)}
            >
              <option value="Trabajo">Motivos de Trabajo</option>
              <option value="Estudio">Motivos de Estudio</option>
              <option value="Mantenimiento">Mantenimiento de Cancha</option>
              <option value="Clima">Condiciones Climáticas</option>
              <option value="Personal / Salud">Salud / Emergencia Personal</option>
              <option value="Otro">Otro motivo</option>
            </select>

            <label>Mensaje / Detalle para el usuario:</label>
            <textarea 
              rows="3"
              className="admin-reservas-textarea"
              placeholder="Escribe la razón que se le notificará al usuario..."
              value={notaCancelacion}
              onChange={(e) => setNotaCancelacion(e.target.value)}
            />
          </div>
          <div className="admin-canchas-modal-footer">
            <button 
              type="button" 
              className="admin-canchas-modal-cancel-btn" 
              onClick={() => setReservaACancelar(null)}
            >
              Volver
            </button>
            <button 
              type="button" 
              className="admin-btn-modal-cancel-confirm"
              onClick={() => {
                const detalleFinal = `${motivoCancelacion}${notaCancelacion ? `: ${notaCancelacion}` : ''}`;
                handleCambiarEstadoReserva(reservaACancelar.id, "cancelada", detalleFinal);
                setReservaACancelar(null);
                setNotaCancelacion("");
              }}
            >
              Confirmar Cancelación
            </button>
          </div>
        </div>
      </div>
    )}
  </section>
)}

        {/* CANCHAS */}
{activeTab === "canchas" && (
  <section className="admin-canchas-section">
    {/* ENCABEZADO CON TÍTULO, METRICAS Y BOTÓN PRINCIPAL */}
    <div className="admin-canchas-header">
      <div>
        
        <p className="admin-canchas-subtitle">
          {canchas.length} registradas
        </p>
      </div>
      <button 
        className="admin-canchas-btn-agregar" 
        onClick={() => {
          setNuevaCancha({ nombre: '', tipo: '', precio: '', imagen: null });
          setModalCrearAbierto(true);
        }}  
      >
        <FaPlus /> Agregar cancha
      </button>
    </div>

    {/* GRID DE TARJETAS DE CANCHAS */}
    <div className="admin-canchas-grid">
      {canchas.map((c) => (
        <div key={c.id} className="admin-canchas-card">
          {/* IMAGEN DE LA CANCHA */}
          <div className="admin-canchas-card-image-container">
            {c.imagen ? (
              <img src={c.imagen} alt={c.nombre} className="admin-canchas-card-image" />
            ) : (
              <div className="admin-canchas-card-no-image">Sin Imagen</div>
            )}
          </div>

          {/* DETALLES DE LA CANCHA */}
          <div className="admin-canchas-card-content">
            <div className="admin-canchas-card-header">
              <h4 className="admin-canchas-card-title">{c.nombre}</h4>
              <span className="admin-canchas-card-price">
                S/ {c.precio_hora ?? c.precio}/h
              </span>
            </div>

            <p className="admin-canchas-card-subtext">
              ⚽ {c.tipo}
            </p>

            {/* ACCIONES Y BOTONES */}
            <div className="admin-canchas-card-actions">
              <button 
                className="admin-canchas-btn-edit" 
                onClick={() => handleEditarCancha(c)}
              >
                <FaEdit /> Editar
              </button>
              <button 
                className="admin-canchas-btn-delete" 
                onClick={() => handleEliminarCancha(c.id)}
              >
                <FaTrash /> Eliminar
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  </section>
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
</div>

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
    </div>
  );
}

export default AdminDashboard;
