// src/pages/AdminDashboard/Pagos.jsx
import React, { useState, useMemo } from "react";
import "./Pagos.css";
import BoletaVenta from '../Boleta/BoletaVenta';

const ESTADOS_PAGO = ["pendiente", "exitoso", "fallido"];

const ESTADO_LABELS = {
  pendiente: "Pendiente",
  exitoso: "Exitoso",
  fallido: "Fallido",
};

const ESTADO_BADGE_CLASS = {
  pendiente: "badge badge-sin-pago",
  exitoso: "badge badge-pagado",
  fallido: "badge badge-fallido",
};

// ============================================================
// Utilidades reutilizadas por otros módulos (ej. tab de Reservas)
// Asume que Reserva expone reserva.pagos (lista de Pago), cargada
// vía el @OneToMany del lado de Reserva.
// ============================================================

export function ultimoPago(reserva) {
  if (!reserva?.pagos || reserva.pagos.length === 0) return null;
  return reserva.pagos[reserva.pagos.length - 1];
}

export function PagoBadge({ reserva }) {
  const pago = ultimoPago(reserva);
  const est = pago?.estado;

  if (est === "exitoso") {
    return <span className="badge badge-pagado">✔ Pagado</span>;
  }
  if (est === "fallido") {
    const intentos = reserva.pagos?.length > 1 ? ` (intento ${reserva.pagos.length})` : "";
    return <span className="badge badge-fallido">✖ Fallido{intentos}</span>;
  }
  return <span className="badge badge-sin-pago">Pendiente</span>;
}

// ============================================================
// Badge de estado (para la tabla de Pagos)
// ============================================================

function EstadoPagoBadge({ estado }) {
  return (
    <span className={ESTADO_BADGE_CLASS[estado] || "badge badge-sin-pago"}>
      {ESTADO_LABELS[estado] || estado}
    </span>
  );
}

// ============================================================
// Tarjetas de resumen
// ============================================================

function ResumenPagos({ pagos }) {
  const resumen = useMemo(() => {
    return {
      total: pagos.length,
      exitosos: pagos.filter((p) => p.estado === "exitoso").length,
      pendientes: pagos.filter((p) => p.estado === "pendiente").length,
      fallidos: pagos.filter((p) => p.estado === "fallido").length,
    };
  }, [pagos]);

  return (
    <div className="admin-summary-grid">
      <div className="admin-summary-card">
        <span className="admin-summary-label">Total de pagos</span>
        <span className="admin-summary-value">{resumen.total}</span>
      </div>
      <div className="admin-summary-card">
        <span className="admin-summary-label">Exitosos</span>
        <span className="admin-summary-value">{resumen.exitosos}</span>
      </div>
      <div className="admin-summary-card">
        <span className="admin-summary-label">Pendientes</span>
        <span className="admin-summary-value">{resumen.pendientes}</span>
      </div>
      <div className="admin-summary-card">
        <span className="admin-summary-label">Fallidos</span>
        <span className="admin-summary-value">{resumen.fallidos}</span>
      </div>
    </div>
  );
}

// ============================================================
// Modal de detalle de una transacción
// El comprobante y los datos de usuario/cancha viven en pago.reserva,
// no en el pago directamente.
// ============================================================

function DetallePagoModal({ pago, onClose, onVerBoleta }) {
  if (!pago) return null;

  const reserva = pago.reserva;

  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
        <div className="admin-modal-header">
          <h3>Detalle del pago #{pago.id}</h3>
          <button className="admin-modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="admin-modal-body">
          <div className="admin-modal-row">
            <span>Usuario</span>
            <strong>{reserva?.usuario?.nombre || "—"}</strong>
          </div>
          <div className="admin-modal-row">
            <span>Reserva</span>
            <strong>#{reserva?.id}</strong>
          </div>
          <div className="admin-modal-row">
            <span>Cancha</span>
            <strong>{reserva?.cancha?.nombre || "—"}</strong>
          </div>
          <div className="admin-modal-row">
            <span>Fecha de pago</span>
            <strong>{pago.fechaPago ? new Date(pago.fechaPago).toLocaleString() : "—"}</strong>
          </div>
          <div className="admin-modal-row">
            <span>Monto</span>
            <strong>S/ {Number(pago.monto ?? 0).toFixed(2)}</strong>
          </div>
          <div className="admin-modal-row">
            <span>Método de pago</span>
            <strong>{pago.pasarela || "—"}</strong>
          </div>
          <div className="admin-modal-row">
            <span>Estado</span>
            <EstadoPagoBadge estado={pago.estado} />
          </div>

          <hr />

          <h4>Comprobante</h4>
          <div className="admin-modal-row">
            <span>Tipo</span>
            <strong>{reserva?.tipoComprobante || "—"}</strong>
          </div>
          <div className="admin-modal-row">
            <span>RUC</span>
            <strong>{reserva?.rucComprobante || "—"}</strong>
          </div>
          <div className="admin-modal-row">
            <span>Razón social</span>
            <strong>{reserva?.razonSocialComprobante || "—"}</strong>
          </div>

          <div className="admin-modal-actions">
            <button className="admin-view-btn" onClick={() => onVerBoleta(pago)}>
              🧾 Ver boleta completa
            </button>
          </div>

          {reserva?.comprobanteUrl && (
            <div className="admin-modal-actions">
              <a href={reserva.comprobanteUrl} target="_blank" rel="noopener noreferrer" className="admin-view-btn">
                👁 Ver PDF
              </a>
              <a href={reserva.comprobanteUrl} download className="admin-confirm-btn">
                ⬇ Descargar
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
// ============================================================
// Componente principal: tab "Pagos" del panel administrativo
// ============================================================

export default function Pagos({ pagos = [] }) {
  const [busqueda, setBusqueda] = useState("");
  const [filtroFecha, setFiltroFecha] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [pagoSeleccionado, setPagoSeleccionado] = useState(null);
  const [boletaAbierta, setBoletaAbierta] = useState(null);

  const pagosFiltrados = useMemo(() => {
    return pagos
      .filter((p) => {
        const texto = busqueda.trim().toLowerCase();
        const reserva = p.reserva;

        const coincideBusqueda =
          texto === "" ||
          reserva?.usuario?.nombre?.toLowerCase().includes(texto) ||
          String(reserva?.id || "").toLowerCase().includes(texto) ||
          String(p.id || "").toLowerCase().includes(texto);

        const fechaPagoStr = p.fechaPago ? p.fechaPago.slice(0, 10) : "";
        const coincideFecha = filtroFecha === "" || fechaPagoStr === filtroFecha;

        const coincideEstado = filtroEstado === "todos" || p.estado === filtroEstado;

        return coincideBusqueda && coincideFecha && coincideEstado;
      })
      .sort((a, b) => new Date(b.fechaPago) - new Date(a.fechaPago));
  }, [pagos, busqueda, filtroFecha, filtroEstado]);

  return (
    <section className="admin-table-section">
      <h3>Gestión de Pagos</h3>

      <ResumenPagos pagos={pagos} />

      <div className="admin-filtros-row">
        <input
          type="text"
          className="admin-search-input"
          placeholder="Buscar por usuario, ID de reserva o ID de pago"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />

        <input
          type="date"
          className="admin-filtro-fecha"
          value={filtroFecha}
          onChange={(e) => setFiltroFecha(e.target.value)}
        />

        <select
          className="admin-filtro-estado"
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value)}
        >
          <option value="todos">Todos los estados</option>
          {ESTADOS_PAGO.map((estado) => (
            <option key={estado} value={estado}>
              {ESTADO_LABELS[estado]}
            </option>
          ))}
        </select>
      </div>

      {pagosFiltrados.length === 0 ? (
        <p className="admin-empty-state">No se encontraron pagos con esos criterios.</p>
      ) : (
        <div className="admin-table-wrapper">
          <table>
            <thead>
              <tr>
                <th>ID Pago</th>
                <th>Usuario</th>
                <th>Reserva</th>
                <th>Cancha</th>
                <th>Fecha de pago</th>
                <th>Monto</th>
                <th>Método de pago</th>
                <th>Estado</th>
                <th>Comprobante</th>
                <th>Detalles</th>
              </tr>
            </thead>
            <tbody>
              {pagosFiltrados.map((p) => (
                <tr key={p.id}>
                  <td>{p.id}</td>
                  <td>{p.reserva?.usuario?.nombre || "—"}</td>
                  <td>#{p.reserva?.id}</td>
                  <td>{p.reserva?.cancha?.nombre || "—"}</td>
                  <td>{p.fechaPago ? new Date(p.fechaPago).toLocaleString() : "—"}</td>
                  <td>S/ {Number(p.monto ?? 0).toFixed(2)}</td>
                  <td>{p.pasarela || "—"}</td>
                  <td><EstadoPagoBadge estado={p.estado} /></td>
                  <td>{p.reserva?.tipoComprobante || "—"}</td>
                  <td>
                    <button
                      className="admin-view-btn"
                      onClick={() => setPagoSeleccionado(p)}
                    >
                      👁 Ver detalle
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <DetallePagoModal
        pago={pagoSeleccionado}
        onClose={() => setPagoSeleccionado(null)}
        onVerBoleta={(pago) => {
          setPagoSeleccionado(null);
          setBoletaAbierta(pago);
        }}
      />

      {boletaAbierta && (
  <div className="admin-modal-overlay" onClick={() => setBoletaAbierta(null)}>
    <div
      className="boleta-modal-box" 
      onClick={(e) => e.stopPropagation()}
    >
        <BoletaVenta
          onVolver={() => setBoletaAbierta(null)}
          tipoComprobante={boletaAbierta.reserva?.tipoComprobante || 'boleta'}
          cliente={{
            nombre: boletaAbierta.reserva?.razonSocialComprobante || boletaAbierta.reserva?.usuario?.nombre || 'N/A',
            documento: boletaAbierta.reserva?.usuario?.dni || 'N/A',
            ruc: boletaAbierta.reserva?.rucComprobante || 'N/A',
            direccion: boletaAbierta.reserva?.direccionFiscalComprobante || boletaAbierta.reserva?.usuario?.direccion || 'N/A'
          }}
          comprobante={{
            numero: String(boletaAbierta.reserva?.id).padStart(8, '0'),
            fechaEmision: boletaAbierta.reserva?.fechaReserva
              ? new Date(boletaAbierta.reserva.fechaReserva).toLocaleDateString('es-PE')
              : 'N/A',
            fechaHoraPago: boletaAbierta.fechaPago
              ? new Date(boletaAbierta.fechaPago).toLocaleString('es-PE', {
                  day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
                })
              : null
          }}
          detalle={[{
            codigo: `RES-${String(boletaAbierta.reserva?.id).padStart(5, '0')}`,
            cantidad: 1,
            descripcion: `Reserva ${boletaAbierta.reserva?.cancha?.nombre} (${boletaAbierta.reserva?.horaInicio} - ${boletaAbierta.reserva?.horaFin})`,
            precioUnitario: boletaAbierta.monto
          }]}
          reserva={{
            cancha: boletaAbierta.reserva?.cancha?.nombre || 'N/A',
            deporte: boletaAbierta.reserva?.cancha?.tipo || 'N/A',
            fecha: boletaAbierta.reserva?.fechaReserva
              ? new Date(boletaAbierta.reserva.fechaReserva).toLocaleDateString('es-PE')
              : 'N/A',
            horaInicio: boletaAbierta.reserva?.horaInicio,
            horaFin: boletaAbierta.reserva?.horaFin,
            duracion: 'N/A',
            precioHora: boletaAbierta.monto
          }}
        />
        </div>
      </div>
      )}
    </section>
  );
}