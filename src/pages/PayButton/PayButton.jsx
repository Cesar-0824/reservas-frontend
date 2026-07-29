import React from 'react';
import axios from 'axios';

function PayButton({ reservaId, onPagoExitoso }) {
  const handlePagar = async () => {
    const ventanaPago = window.open('', '_blank');
    if (!ventanaPago) {
      alert('Por favor habilita ventanas emergentes.');
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

      // Aquí podrías mostrar algún mensaje mientras el usuario completa el pago

      // NO se puede detectar directamente en JS cuándo termina el pago, por eso el webhook

    } catch (error) {
      ventanaPago.close();
      alert('Error iniciando pago.');
      console.error(error);
    }
  };

  return (
    <button onClick={handlePagar}>
      Pagar Reserva
    </button>
  );
}

export default PayButton;
  