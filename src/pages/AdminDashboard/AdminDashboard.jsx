import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './AdminDashboard.css';
import {
  FaUsers, FaFutbol, FaCalendarCheck, FaSignOutAlt, FaTachometerAlt,
  FaUserFriends, FaClipboardList, FaPlus, FaEdit, FaTrash, FaTimes,
  FaMoneyBillWave, FaStar, FaBullhorn, FaTools, FaChartBar, FaCog
} from 'react-icons/fa';

function AdminDashboard({ onLogout }) {
  const [usuarios, setUsuarios] = useState([]);
  const [canchas, setCanchas] = useState([]);
  const [reservas, setReservas] = useState([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [adminName, setAdminName] = useState('');
  const [loading, setLoading] = useState(true);
  const [editandoCancha, setEditandoCancha] = useState(null);

  // 🆕 Estado para editar usuario
  const [editandoUsuario, setEditandoUsuario] = useState(null);
  const [nuevoRol, setNuevoRol] = useState('');

  const [nuevaCancha, setNuevaCancha] = useState({
    nombre: '',
    tipo: '',
    precio: '',
    imagen: null
  });

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

const [mostrarModalCancha, setMostrarModalCancha] = useState(false);

const handleEditarCancha = (cancha) => {
  setEditandoCancha(cancha);

  setNuevaCancha({
    nombre: cancha.nombre,
    tipo: cancha.tipo,
    precio: cancha.precio_hora || cancha.precio,
    imagen: null
  });

  setMostrarModalCancha(true);
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
    setMostrarModalCancha(false);

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
  // 🆕 Abrir modal de edición de usuario
  const handleAbrirEditarUsuario = (usuario) => {
    setEditandoUsuario(usuario);
    setNuevoRol(usuario.rol);
  };

  // 🆕 Cerrar modal
  const handleCerrarModalUsuario = () => {
    setEditandoUsuario(null);
    setNuevoRol('');
  };
const handleEliminarUsuario = async (id) => {
  const confirmar = window.confirm("¿Estás seguro de que deseas eliminar este usuario?");

  if (!confirmar) return;

  try {
    const token = localStorage.getItem('authToken');
    const headers = token 
      ? { Authorization: `Bearer ${token}` } 
      : {};

    await axios.delete(
      `http://localhost:8080/api/usuarios/${id}`,
      { headers }
    );

    setUsuarios(prev =>
      prev.filter(u => u.id !== id)
    );

    alert("✅ Usuario eliminado correctamente.");

  } catch (err) {
    console.error("Error al eliminar usuario:", err);
    alert("❌ No se pudo eliminar el usuario.");
  }
};
  // 🆕 Guardar nuevo rol
  const handleGuardarRol = async () => {
    if (!editandoUsuario) return;
    try {
      const token = localStorage.getItem('authToken');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const res = await axios.put(
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
      alert("No se pudo actualizar la estado de la reserva.");
    }
  };

  const handlePagoExitoso = (reservaId) => {
    setReservas(prev =>
      prev.map(r => r.id === reservaId ? { ...r, estado: 'pagada' } : r)
    );
  };

  if (loading) return <div className="admin-loading">Cargando panel de administración...</div>;

  return (
    <div className="admin-dashboard-container">
      <aside className="admin-sidebar">
        <h2>Admin Panel</h2>
        <div className="admin-nav">
          <button onClick={() => setActiveTab('dashboard')} className={activeTab === 'dashboard' ? 'active' : ''}>
            <FaTachometerAlt /> Dashboard
          </button>
          <button onClick={() => setActiveTab('usuarios')} className={activeTab === 'usuarios' ? 'active' : ''}>
            <FaUserFriends /> Usuarios
          </button>
          <button onClick={() => setActiveTab('reservas')} className={activeTab === 'reservas' ? 'active' : ''}>
            <FaClipboardList /> Reservas
          </button>
          <button onClick={() => setActiveTab('canchas')} className={activeTab === 'canchas' ? 'active' : ''}>
            <FaFutbol /> Canchas
          </button>
          <button className="admin-logout-button" onClick={onLogout}>
            <FaSignOutAlt /> Cerrar Sesión
          </button>
          
        </div>
      </aside>

      <div className="admin-content">
        <header className="admin-header">
          <h3>Bienvenido, {adminName}</h3>
        </header>

        {activeTab === 'dashboard' && (
          <section className="admin-summary">
            <div className="admin-summary-card">
              <FaUsers className="icon" />
              <h3>{usuarios.length}</h3>
              <p>Usuarios Registrados</p>
            </div>
            <div className="admin-summary-card">
              <FaFutbol className="icon" />
              <h3>{canchas.length}</h3>
              <p>Canchas Disponibles</p>
            </div>
            <div className="admin-summary-card">
              <FaCalendarCheck className="icon" />
              <h3>{reservas.length}</h3>
              <p>Reservas Totales</p>
            </div>
            <div className="admin-summary-card">
              <FaClipboardList className="icon" />
              <h3>
                {reservas.filter(r => r.estado === "pendiente").length}
              </h3>
              <p>Reservas Pendientes</p>
            </div>
            <div className="admin-summary-card">
              <FaCalendarCheck className="icon" />
              <h3>
                {reservas.filter(r => r.estado === "confirmada").length}
              </h3>
              <p>Reservas Confirmadas</p>
            </div>
          </section>
        )}
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
                      
                        <button
                          className="admin-edit-btn"
                          onClick={() => handleAbrirEditarUsuario(u)}
                          title="Editar rol">
                          <FaEdit />
                        </button>

                        <button
                          className="admin-delete-btn"
                          onClick={() => handleEliminarUsuario(u.id)}
                          title="Eliminar usuario">
                          <FaTrash />
                        </button>
                      
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        {activeTab === 'reservas' && (
          <section className="admin-table-section">
            <h3>Reservas por Estado</h3>
            <div className="admin-reservas-grid">
              {["pendiente", "confirmada", "cancelada"].map(estado => (
                <div className="admin-reservas-card" key={estado}>
                  <h4>{estado.charAt(0).toUpperCase() + estado.slice(1)}</h4>
                  <table>
                    <thead>
                      <tr>
                        <th>Usuario</th><th>Cancha</th><th>Fecha</th><th>Inicio</th><th>Fin</th><th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reservas.filter(r => r.estado === estado).map(r => (
                        <tr key={r.id}>
                          <td>{r.usuario?.nombre}</td>
                          <td>{r.cancha?.nombre}</td>
                          <td>{r.fechaReserva}</td>
                          <td>{r.horaInicio}</td>
                          <td>{r.horaFin}</td>
                          <td>
                            {estado === "pendiente" && (
                              <>
                                <button
                                  className="admin-confirm-btn"
                                  onClick={() => handleCambiarEstadoReserva(r.id, "confirmada")}
                                  title="Confirmar reserva"
                                >
                                  Confirmar
                                </button>
                                <button
                                  className="admin-cancel-btn"
                                  onClick={() => handleCambiarEstadoReserva(r.id, "cancelada")}
                                  title="Cancelar reserva"
                                >
                                  Cancelar
                                </button>
                              </>
                            )}
                            {estado === "confirmada" && (
                              <button
                                className="admin-cancel-btn"
                                onClick={() => handleCambiarEstadoReserva(r.id, "cancelada")}
                                title="Cancelar reserva"
                              >
                                Cancelar
                              </button>
                            )}
                            {estado === "cancelada" && <em>No hay acciones</em>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          </section>
        )}

        {activeTab === "canchas" && (
  <section className="admin-table-section">
    <h3>Gestión de Canchas</h3>

    {/* ===== AGREGAR CANCHA ===== */}
    <form
      className="admin-form-canchas"
      onSubmit={handleAgregarCancha}
    >
      <input
        type="text"
        name="nombre"
        placeholder="Nombre de la cancha"
        value={nuevaCancha.nombre}
        onChange={handleInputChange}
        required
      />

      <input
        type="text"
        name="tipo"
        placeholder="Tipo de cancha (Fútbol, Vóley...)"
        value={nuevaCancha.tipo}
        onChange={handleInputChange}
        required
      />

      <input
        type="number"
        name="precio"
        placeholder="Precio por hora"
        value={nuevaCancha.precio}
        onChange={handleInputChange}
        required
      />

      <input
        type="file"
        accept="image/*"
        onChange={handleImageChange}
      />

      <button type="submit">
        <FaPlus /> Agregar Cancha
      </button>
    </form>

    {/* ===== TABLA ===== */}

    <table>
      <thead>
        <tr>
          <th>Nombre</th>
          <th>Tipo</th>
          <th>Precio</th>
          <th>Imagen</th>
          <th>Acciones</th>
        </tr>
      </thead>

      <tbody>
        {canchas.map((c) => (
          <tr key={c.id}>
            <td>{c.nombre}</td>

            <td>{c.tipo}</td>

            <td>S/. {c.precio_hora}</td>

            <td>
              {c.imagen ? (
                <img
                  src={`http://localhost:8080${c.imagen}`}
                  alt={c.nombre}
                  height="45"
                />
              ) : (
                "Sin imagen"
              )}
            </td>

            <td>
              <button
                className="admin-edit-btn"
                onClick={() => handleEditarCancha(c)}
                title="Editar cancha"
              >
                <FaEdit />
              </button>

              <button
                className="admin-delete-btn"
                onClick={() => handleEliminarCancha(c.id)}
                title="Eliminar cancha"
              >
                <FaTrash />
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </section>
)}
{/* ===== MODAL EDITAR CANCHA ===== */}

{editandoCancha && (
  <div
    className="admin-modal-overlay"
    onClick={() => setEditandoCancha(null)}
  >
    <div
      className="admin-modal-box"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="admin-modal-header">
        <h3>Editar Cancha</h3>

        <button
          className="admin-modal-close"
          onClick={() => setEditandoCancha(null)}
        >
          <FaTimes />
        </button>
      </div>

      <form onSubmit={handleActualizarCancha}>

        <div className="admin-modal-body">

          <label>Nombre</label>

          <input
            type="text"
            name="nombre"
            value={nuevaCancha.nombre}
            onChange={handleInputChange}
            required
          />

          <label>Tipo</label>

          <input
            type="text"
            name="tipo"
            value={nuevaCancha.tipo}
            onChange={handleInputChange}
            required
          />

          <label>Precio por hora</label>

          <input
            type="number"
            name="precio"
            value={nuevaCancha.precio}
            onChange={handleInputChange}
            required
          />

          <label>Cambiar imagen</label>

          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
          />

          {editandoCancha.imagen && (
            <>
              <p>Imagen actual</p>

              <img
                src={`http://localhost:8080${editandoCancha.imagen}`}
                alt="Cancha"
                width="220"
                style={{
                  borderRadius: "10px",
                  marginTop: "10px"
                }}
              />
            </>
          )}

        </div>

        <div className="admin-modal-footer">

          <button
            type="button"
            className="admin-modal-cancel-btn"
            onClick={() => setEditandoCancha(null)}
          >
            Cancelar
          </button>

          <button
            type="submit"
            className="admin-modal-save-btn"
          >
            Guardar Cambios
          </button>

        </div>

      </form>

    </div>
  </div>
)}
        
      </div>

      {/* 🆕 MODAL EDITAR USUARIO */}
      {editandoUsuario && (
        <div className="admin-modal-overlay" onClick={handleCerrarModalUsuario}>
          <div className="admin-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3>Editar Usuario</h3>
              <button className="admin-modal-close" onClick={handleCerrarModalUsuario}>
                <FaTimes />
              </button>
            </div>

            <div className="admin-modal-body">
              <p className="admin-modal-user-name">{editandoUsuario.nombre}</p>
              <p className="admin-modal-user-email">{editandoUsuario.email}</p>

              <label className="admin-modal-label">Rol del usuario</label>
              <select
                className="admin-modal-select"
                value={nuevoRol}
                onChange={(e) => setNuevoRol(e.target.value)}
              >
                <option value="usuario">Usuario</option>
                <option value="admin">Administrador</option>
              </select>
            </div>

            <div className="admin-modal-footer">
              <button className="admin-modal-cancel-btn" onClick={handleCerrarModalUsuario}>
                Cancelar
              </button>
              <button className="admin-modal-save-btn" onClick={handleGuardarRol}>
                Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;
