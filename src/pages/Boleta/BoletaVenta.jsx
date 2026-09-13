// src/pages/Boleta/BoletaVenta.jsx
import React, { useRef, useState } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { FaArrowLeft, FaFileDownload } from 'react-icons/fa';
import './BoletaVenta.css';

// ---- Utilidad: convierte un número a letras (soles) ----
const UNIDADES = ['', 'UNO', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE'];
const DECENAS = ['DIEZ', 'ONCE', 'DOCE', 'TRECE', 'CATORCE', 'QUINCE', 'DIECISEIS', 'DIECISIETE', 'DIECIOCHO', 'DIECINUEVE'];
const DECENAS_10 = ['', '', 'VEINTE', 'TREINTA', 'CUARENTA', 'CINCUENTA', 'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA'];
const CENTENAS = ['', 'CIENTO', 'DOSCIENTOS', 'TRESCIENTOS', 'CUATROCIENTOS', 'QUINIENTOS', 'SEISCIENTOS', 'SETECIENTOS', 'OCHOCIENTOS', 'NOVECIENTOS'];

function numeroALetrasEntero(n) {
  if (n === 0) return 'CERO';
  if (n === 100) return 'CIEN';

  let resultado = '';

  if (n >= 100) {
    resultado += CENTENAS[Math.floor(n / 100)] + ' ';
    n %= 100;
  }

  if (n >= 20) {
    resultado += DECENAS_10[Math.floor(n / 10)];
    if (n % 10 > 0) resultado += ' Y ' + UNIDADES[n % 10];
  } else if (n >= 10) {
    resultado += DECENAS[n - 10];
  } else if (n > 0) {
    resultado += UNIDADES[n];
  }

  return resultado.trim();
}

function montoALetras(monto) {
  const entero = Math.floor(monto);
  const centavos = Math.round((monto - entero) * 100);
  const centavosStr = String(centavos).padStart(2, '0');

  if (entero === 0) return `CERO con ${centavosStr}/100 SOLES`;

  let texto = '';
  if (entero >= 1000) {
    const miles = Math.floor(entero / 1000);
    const resto = entero % 1000;
    texto += (miles === 1 ? 'MIL' : `${numeroALetrasEntero(miles)} MIL`);
    if (resto > 0) texto += ' ' + numeroALetrasEntero(resto);
  } else {
    texto = numeroALetrasEntero(entero);
  }

  return `${texto} con ${centavosStr}/100 SOLES`;
}

const formatearMoneda = (n) => `S/ ${Number(n || 0).toFixed(2)}`;

/**
 * Props esperadas (todas opcionales, con datos de ejemplo por defecto):
 * - onVolver: función al hacer click en "Volver a pagos"
 * - datosEmpresa: { razonSocial, direccion, telefono, ruc }
 * - comprobante: { serie, numero, fechaEmision, fechaVencimiento, moneda }
 * - cliente: { nombre, documento, direccion }
 * - detalle: [{ codigo, cantidad, descripcion, precioUnitario }]
 * - observaciones: string
 */
function BoletaVenta({
  onVolver,
  tipoComprobante = 'boleta', // 'boleta' | 'factura'
  datosEmpresa = {
    razonSocial: 'Club Deportivo Canto Bello E.I.R.L.',
    direccion: 'Av. Canto Bello 458, San Juan de Lurigancho, Lima',
    telefono: '(01) 456-7890',
    ruc: '20601234567'
  },
  comprobante = {
    serie: '',
    numero: '00000025',
    fechaEmision: new Date().toLocaleDateString('es-PE'),
    fechaVencimiento: '',
    moneda: 'SOLES'
  },
  cliente = {
    nombre: 'Cesar Ramirez Torres',
    documento: '73456821',
    ruc: '',
    direccion: 'Jr. Los Alamos 245, Lima'
  },
  detalle = [
    { codigo: 'RES-00025', cantidad: 1, descripcion: 'Reserva Cancha de Futbol 1 (18:00 - 19:00)', precioUnitario: 40.0 }
  ],
  reserva = null,
  observaciones = 'Reserva de cancha deportiva - SportsMatch'
}) {
  const esFactura = tipoComprobante === 'factura';
  const tituloDocumento = esFactura ? 'FACTURA ELECTRONICA' : 'BOLETA DE VENTA ELECTRONICA';
  const serieDefault = esFactura ? 'F001' : 'B001';
  const serieFinal = comprobante.serie || serieDefault;
  const documentoCliente = esFactura
    ? `RUC: ${cliente.ruc || 'N/A'}`
    : `DNI: ${cliente.documento || 'N/A'}`;
  const boletaRef = useRef(null);
  const [descargando, setDescargando] = useState(false);

  const items = detalle.map((d) => ({
    ...d,
    importe: d.cantidad * d.precioUnitario
  }));

  const opGravada = items.reduce((acc, i) => acc + i.importe, 0) / 1.18;
  const igv = items.reduce((acc, i) => acc + i.importe, 0) - opGravada;
  const importeTotal = items.reduce((acc, i) => acc + i.importe, 0);

  const handleDescargarPDF = async () => {
    if (!boletaRef.current) return;
    setDescargando(true);
    try {
      const canvas = await html2canvas(boletaRef.current, { scale: 2, backgroundColor: '#ffffff' });
      const imgData = canvas.toDataURL('image/png');

      const pdf = new jsPDF({ unit: 'mm', format: 'a4' });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const imgWidth = pageWidth - 20;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
      pdf.save(`Boleta_${comprobante.serie}-${comprobante.numero}.pdf`);
    } catch (err) {
      console.error('Error generando PDF:', err);
    } finally {
      setDescargando(false);
    }
  };

  return (
    <div className="boleta-page">
      <div className="boleta-toolbar">
        <button className="boleta-btn-volver" onClick={onVolver}>
          <FaArrowLeft /> Volver a pagos
        </button>
        <button className="boleta-btn-descargar" onClick={handleDescargarPDF} disabled={descargando}>
          <FaFileDownload /> {descargando ? 'Generando...' : 'Descargar PDF'}
        </button>
      </div>

      <div className="boleta-documento" ref={boletaRef}>

        {/* ===== ENCABEZADO ===== */}
        <div className="boleta-encabezado">
          <div className="boleta-empresa">
            <p className="boleta-marca">SPORTSMATCH</p>
            <p className="boleta-razon-social">{datosEmpresa.razonSocial}</p>
            <p className="boleta-dato-empresa">{datosEmpresa.direccion}</p>
            <p className="boleta-dato-empresa">Telefono: {datosEmpresa.telefono}</p>
          </div>

          <div className="boleta-caja-comprobante">
            <p className="boleta-ruc">RUC: {datosEmpresa.ruc}</p>
            <p className="boleta-titulo-doc">{tituloDocumento}</p>
            <p className="boleta-serie">{serieFinal}-{comprobante.numero}</p>
          </div>
        </div>

        <div className="boleta-divisor" />

        {/* ===== DATOS DEL CLIENTE ===== */}
        <div className="boleta-datos-cliente">
          <div className="boleta-fila-dato">
            <span className="boleta-label">Cliente / Razon social</span>
            <span className="boleta-valor">{cliente.nombre}</span>
          </div>
          <div className="boleta-fila-dato">
            <span className="boleta-label">{esFactura ? 'RUC' : 'DNI'}</span>
            <span className="boleta-valor">{documentoCliente.split(': ')[1]}</span>
          </div>
          <div className="boleta-fila-dato">
            <span className="boleta-label">Direccion</span>
            <span className="boleta-valor">{cliente.direccion}</span>
          </div>
          <div className="boleta-fila-dato">
            <span className="boleta-label">Fecha de emision</span>
            <span className="boleta-valor">{comprobante.fechaEmision}</span>
          </div>
          {comprobante.fechaVencimiento && (
            <div className="boleta-fila-dato">
              <span className="boleta-label">Fecha de vencimiento</span>
              <span className="boleta-valor">{comprobante.fechaVencimiento}</span>
            </div>
          )}
          <div className="boleta-fila-dato">
            <span className="boleta-label">Moneda</span>
            <span className="boleta-valor">{comprobante.moneda}</span>
          </div>
        </div>

        {/* ===== DETALLE DE LA RESERVA ===== */}
        {reserva && (
          <div className="boleta-detalle-reserva">
            <p className="boleta-label-observaciones">Detalle de la reserva</p>
            <div className="boleta-detalle-reserva-grid">
              <div className="boleta-fila-dato">
                <span className="boleta-label">Cancha</span>
                <span className="boleta-valor">{reserva.cancha}</span>
              </div>
              <div className="boleta-fila-dato">
                <span className="boleta-label">Deporte</span>
                <span className="boleta-valor">{reserva.deporte}</span>
              </div>
              <div className="boleta-fila-dato">
                <span className="boleta-label">Fecha de uso</span>
                <span className="boleta-valor">{reserva.fecha}</span>
              </div>
              <div className="boleta-fila-dato">
                <span className="boleta-label">Horario</span>
                <span className="boleta-valor">{reserva.horaInicio} - {reserva.horaFin}</span>
              </div>
              <div className="boleta-fila-dato">
                <span className="boleta-label">Duracion</span>
                <span className="boleta-valor">{reserva.duracion}</span>
              </div>
              <div className="boleta-fila-dato">
                <span className="boleta-label">Precio por hora</span>
                <span className="boleta-valor">{formatearMoneda(reserva.precioHora)}</span>
              </div>
            </div>
          </div>
        )}

        {/* ===== TABLA DE DETALLE ===== */}
        <table className="boleta-tabla">
          <thead>
            <tr>
              <th>Codigo</th>
              <th>Cant.</th>
              <th>Descripcion</th>
              <th>P. Unit.</th>
              <th>Importe</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => (
              <tr key={idx}>
                <td>{item.codigo}</td>
                <td className="boleta-col-centro">{item.cantidad}</td>
                <td>{item.descripcion}</td>
                <td className="boleta-col-derecha">{formatearMoneda(item.precioUnitario)}</td>
                <td className="boleta-col-derecha">{formatearMoneda(item.importe)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* ===== RESUMEN DE IMPORTES ===== */}
        <div className="boleta-resumen-wrap">
          <div className="boleta-resumen">
            <div className="boleta-resumen-fila">
              <span>Op. Gratuita</span>
              <span>{formatearMoneda(0)}</span>
            </div>
            <div className="boleta-resumen-fila">
              <span>Op. Inafecta</span>
              <span>{formatearMoneda(0)}</span>
            </div>
            <div className="boleta-resumen-fila">
              <span>Op. Gravada</span>
              <span>{formatearMoneda(opGravada)}</span>
            </div>
            <div className="boleta-resumen-fila">
              <span>IGV - 18%</span>
              <span>{formatearMoneda(igv)}</span>
            </div>
            <div className="boleta-resumen-fila boleta-resumen-total">
              <span>IMPORTE TOTAL</span>
              <span>{formatearMoneda(importeTotal)}</span>
            </div>
          </div>
        </div>

        <p className="boleta-monto-letras">
          Son: {montoALetras(importeTotal)}
        </p>

        {/* ===== OBSERVACIONES ===== */}
        <div className="boleta-observaciones">
          <p className="boleta-label-observaciones">Observaciones</p>
          <p>{observaciones}</p>
        </div>

        <div className="boleta-divisor" />

        <p className="boleta-footer-texto">
          Esta es una representacion impresa de un comprobante electronico emitido por SportsMatch.
          Consulte su validez en el portal correspondiente.
        </p>
      </div>
    </div>
  );
}

export default BoletaVenta;