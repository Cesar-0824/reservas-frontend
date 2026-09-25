import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaFutbol, FaCoins } from 'react-icons/fa';
import './Canchas.css';

function Canchas({ setActiveTab, setSelectedCanchaId }) {
  const [canchas, setCanchas] = useState([]);
  const [isLoadingCanchas, setIsLoadingCanchas] = useState(true);
  const [errorCanchas, setErrorCanchas] = useState(null);
  const [detalleCancha, setDetalleCancha] = useState(null);

  useEffect(() => {
    const fetchCanchas = async () => {
      try {
        const token = localStorage.getItem('authToken');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await axios.get('http://localhost:8080/api/canchas', { headers });
        setCanchas(res.data);
      } catch (err) {
        console.error("Error al cargar canchas:", err);
        setErrorCanchas("No se pudieron cargar las canchas.");
      } finally {
        setIsLoadingCanchas(false);
      }
    };
    fetchCanchas();
  }, []);

  return (
    <section className="canchas-view-container">
      <h2><FaFutbol /> Canchas disponibles</h2>

      {isLoadingCanchas ? (
        <p>Cargando canchas...</p>
      ) : errorCanchas ? (
        <p className="canchas-view-error">{errorCanchas}</p>
      ) : canchas.length === 0 ? (
        <p>No hay canchas registradas.</p>
      ) : (
        <div className="canchas-view-grid">
          {canchas.map((c) => (
            <div key={c.id} className="canchas-view-card">
              {c.imagen ? (
                <img src={c.imagen} alt={c.nombre} className="canchas-view-card-img" />
              ) : (
                <div className="canchas-view-no-img"><FaFutbol /> Sin imagen</div>
              )}
              <h4>{c.nombre}</h4>
              <p><FaFutbol /> {c.tipo}</p>
              <p><FaCoins /> S/ {c.precio_hora?.toFixed(2)} / hora</p>

              <div className="canchas-view-actions">
                <button
                  className="canchas-view-btn-outline"
                  onClick={() => setDetalleCancha(c)}
                >
                  Ver detalle
                </button>
                {c.estado === 'activa' ? (
                  <button
                    className="canchas-view-btn-primary"
                    onClick={() => {
                      setSelectedCanchaId?.(String(c.id));
                      setActiveTab?.('disponibilidad');
                    }}
                  >
                    Seleccionar
                  </button>
                ) : (
                  <button className="canchas-view-alert-disabled" disabled>
                    No disponible
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL DE DETALLE */}
      {detalleCancha && (
        <div className="canchas-view-modal-overlay" onClick={() => setDetalleCancha(null)}>
          <div className="canchas-view-modal" onClick={(e) => e.stopPropagation()}>
            <div className="canchas-view-modal-header">
              <h3>{detalleCancha.nombre}</h3>
              <button className="canchas-view-modal-close" onClick={() => setDetalleCancha(null)}>✕</button>
            </div>

            <div className="canchas-view-modal-body">
              {detalleCancha.imagen && (
                <img
                  src={detalleCancha.imagen}
                  alt={detalleCancha.nombre}
                  className="canchas-view-modal-img"
                />
              )}

              <div className="canchas-view-modal-row">
                <span>Tipo</span>
                <strong>{detalleCancha.tipo || '—'}</strong>
              </div>
              <div className="canchas-view-modal-row">
                <span>Precio por hora</span>
                <strong>S/ {Number(detalleCancha.precio_hora ?? 0).toFixed(2)}</strong>
              </div>
              <div className="canchas-view-modal-row">
                <span>Estado</span>
                <strong>{detalleCancha.estado === 'activa' ? 'Disponible' : 'No disponible'}</strong>
              </div>
              <div className="canchas-view-modal-row">
                <span>Modalidad</span>
                <strong>{detalleCancha.modalidad || '—'}</strong>
              </div>
              <div className="canchas-view-modal-row">
                <span>Dimensiones</span>
                <strong>{detalleCancha.dimensiones || '—'}</strong>
              </div>
              <div className="canchas-view-modal-row">
                <span>Tipo de superficie</span>
                <strong>{detalleCancha.tipoSuperficie || detalleCancha.tipo_superficie || '—'}</strong>
              </div>
              <div className="canchas-view-modal-row">
                <span>Iluminación</span>
                <strong>{detalleCancha.iluminacion || '—'}</strong>
              </div>
              {detalleCancha.caracteristicas && (
                <div className="canchas-view-modal-row">
                  <span>Características</span>
                  <strong>{detalleCancha.caracteristicas}</strong>
                </div>
              )}
              {detalleCancha.descripcion && (
                <div className="canchas-view-modal-row canchas-view-modal-row-full">
                  <span>Descripción</span>
                  <p>{detalleCancha.descripcion}</p>
                </div>
              )}
            </div>

            <div className="canchas-view-modal-footer">
              {detalleCancha.estado === 'activa' ? (
                <button
                  className="canchas-view-btn-primary"
                  onClick={() => {
                    setSelectedCanchaId?.(String(detalleCancha.id));
                    setActiveTab?.('disponibilidad');
                    setDetalleCancha(null);
                  }}
                >
                  Reservar esta cancha
                </button>
              ) : (
                <p className="canchas-view-alert-disabled">
                  Esta cancha no está disponible actualmente para reservas.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default Canchas;