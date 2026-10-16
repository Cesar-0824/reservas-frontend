// src/pages/AdminDashboard/AgendaCanchas.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import "./AgendaCanchas.css"; // CSS único enlazado

const generarSlotsAgenda = (horaApertura = '00:00', horaCierre = '00:00') => {
  const [hIni, mIni] = horaApertura.split(':').map(Number);
  const [hFin, mFin] = horaCierre.split(':').map(Number);
  const inicioMin = hIni * 60 + mIni;
  const finMin = hFin * 60 + mFin;

  const slots = [];
  const pushSlot = (totalMin) => {
    const h = Math.floor(totalMin / 60) % 24;
    const m = totalMin % 60;
    slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
  };

  if (inicioMin === finMin) {
    for (let m = 0; m < 24 * 60; m += 30) pushSlot(m);
    return slots;
  }
  if (finMin > inicioMin) {
    for (let m = inicioMin; m < finMin; m += 30) pushSlot(m);
  } else {
    for (let m = inicioMin; m < 24 * 60; m += 30) pushSlot(m);
    for (let m = 0; m < finMin; m += 30) pushSlot(m);
  }
  return slots;
};

const aMinutosAgenda = (horaStr) => {
  const [h, m] = horaStr.split(':').map(Number);
  return h * 60 + m;
};

// Clases únicas para los badges
const badgeClasePorEstado = {
  disponible: 'agenda-canchas-badge agenda-canchas-badge-disponible',
  pendiente: 'agenda-canchas-badge agenda-canchas-badge-sin-pago',
  confirmada: 'agenda-canchas-badge agenda-canchas-badge-admin',
  pagada: 'agenda-canchas-badge agenda-canchas-badge-pagado',
  mantenimiento: 'agenda-canchas-badge agenda-canchas-badge-fallido',
  fuera_horario: 'agenda-canchas-badge agenda-canchas-badge-fallido'
};

const labelPorEstado = {
  disponible: 'Disponible',
  pendiente: 'Pendiente',
  confirmada: 'Confirmada',
  pagada: 'Pagada',
  mantenimiento: 'Mantenimiento',
  fuera_horario: 'Fuera del horario'
};

export default function AgendaCanchas({ canchas = [], reservas = [] }) {
  const [configClub, setConfigClub] = useState({ horaApertura: '00:00', horaCierre: '00:00' });

  const [agendaFecha, setAgendaFecha] = useState(() => {
    const hoy = new Date();
    return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;
  });
  const [agendaCanchaId, setAgendaCanchaId] = useState('');
  const [agendaDetalleReserva, setAgendaDetalleReserva] = useState(null);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const token = localStorage.getItem('authToken');
        const res = await axios.get('http://localhost:8080/api/configuracion', {
          headers: { Authorization: `Bearer ${token}` }
        });
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

const canchaSeleccionada = canchas.find(c => c.id === parseInt(agendaCanchaId));
const slots = generarSlotsAgenda(configClub.horaApertura, configClub.horaCierre);

const reservasDelDia = canchaSeleccionada
  ? reservas.filter(r =>
      r.cancha?.id === canchaSeleccionada.id &&
      r.fechaReserva === agendaFecha &&
      r.estado !== 'cancelada' &&
      r.estado !== 'vencida'
    )
  : [];

const slotsConEstado = slots.map(slot => {
  const slotInicio = aMinutosAgenda(slot);
  const slotFin = slotInicio + 30;

  if (
    canchaSeleccionada?.estado === 'mantenimiento' &&
    canchaSeleccionada?.fechaInicioMantenimiento
  ) {
    const slotDateTime = new Date(`${agendaFecha}T${slot}:00`);
    const inicioMantenimiento = new Date(canchaSeleccionada.fechaInicioMantenimiento);

    if (slotDateTime >= inicioMantenimiento) {
      return { time: slot, status: 'mantenimiento', reserva: null };
    }
  }

  const reservaEncontrada = reservasDelDia.find(r => {
    const resInicio = aMinutosAgenda(r.horaInicio);
    const resFin = aMinutosAgenda(r.horaFin);
    return slotInicio < resFin && resInicio < slotFin;
  });

  if (reservaEncontrada) {
    return { time: slot, status: reservaEncontrada.estado, reserva: reservaEncontrada };
  }

  return { time: slot, status: 'disponible', reserva: null };
});

const reservasFueraDeHorario = reservasDelDia.filter(r => {
  const yaCubierta = slotsConEstado.some(s => s.reserva?.id === r.id);
  return !yaCubierta;
}).map(r => ({
  time: `${r.horaInicio.slice(0, 5)} - ${r.horaFin.slice(0, 5)}`,
  status: 'fuera_horario',
  reserva: r
}));

const filasAgenda = [...slotsConEstado, ...reservasFueraDeHorario];

  return (
    <section className="agenda-canchas-section">
      

      <div className="agenda-canchas-filtros">
        <input
          type="date"
          className="agenda-canchas-filtro-fecha"
          value={agendaFecha}
          onChange={(e) => setAgendaFecha(e.target.value)}
        />

        <select
          className="agenda-canchas-filtro-estado"
          value={agendaCanchaId}
          onChange={(e) => setAgendaCanchaId(e.target.value)}
        >
          <option value="">Selecciona una cancha</option>
          {canchas.map(c => (
            <option key={c.id} value={c.id}>
              {c.nombre} ({c.tipo})
            </option>
          ))}
        </select>
      </div>

      {!canchaSeleccionada ? (
        <p className="agenda-canchas-empty">Selecciona una cancha para ver su disponibilidad.</p>
      ) : (
        <div className="agenda-canchas-table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Hora</th>
                <th>Estado</th>
                <th>Detalle</th>
              </tr>
            </thead>
            <tbody>
  {filasAgenda.map((s, idx) => (
    <tr key={s.reserva ? `res-${s.reserva.id}` : `slot-${idx}`}>
      <td>{s.time}</td>
      <td>
        <span className={badgeClasePorEstado[s.status] || 'agenda-canchas-badge agenda-canchas-badge-fallido'}>
          {labelPorEstado[s.status] || s.status}
        </span>
      </td>
      <td>
        {s.reserva ? (
          <button
            className="agenda-canchas-btn-view"
            onClick={() => setAgendaDetalleReserva(s.reserva)}
          >
            👁 Ver reserva
          </button>
        ) : (
          <span className="agenda-canchas-empty" style={{ margin: 0 }}>—</span>
        )}
      </td>
    </tr>
  ))}
</tbody>
          </table>
        </div>
      )}

      {agendaDetalleReserva && (
        <div className="agenda-canchas-modal-overlay" onClick={() => setAgendaDetalleReserva(null)}>
          <div className="agenda-canchas-modal" onClick={(e) => e.stopPropagation()}>
            <div className="agenda-canchas-modal-header">
              <h3>Reserva #{agendaDetalleReserva.id}</h3>
              <button className="agenda-canchas-modal-close" onClick={() => setAgendaDetalleReserva(null)}>✕</button>
            </div>
            <div className="agenda-canchas-modal-body">
              <div className="agenda-canchas-modal-row">
                <span>Usuario</span>
                <strong>{agendaDetalleReserva.usuario?.nombre || "—"}</strong>
              </div>
              <div className="agenda-canchas-modal-row">
                <span>Cancha</span>
                <strong>{agendaDetalleReserva.cancha?.nombre || "—"}</strong>
              </div>
              <div className="agenda-canchas-modal-row">
                <span>Horario</span>
                <strong>{agendaDetalleReserva.horaInicio} - {agendaDetalleReserva.horaFin}</strong>
              </div>
              <div className="agenda-canchas-modal-row">
                <span>Estado</span>
                <strong>{labelPorEstado[agendaDetalleReserva.estado] || agendaDetalleReserva.estado}</strong>
              </div>
              <div className="agenda-canchas-modal-row">
                <span>Monto total</span>
                <strong>S/ {Number(agendaDetalleReserva.montoTotal ?? 0).toFixed(2)}</strong>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}