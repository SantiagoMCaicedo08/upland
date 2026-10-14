// Factura de una reserva: factura.html?reserva=<uuid>. Es protegida, y además el backend
// solo la entrega al huésped o al anfitrión de esa reserva; a cualquier otro le responde 403.
import { obtenerFactura } from './api.js';
import { exigirSesion } from './sesion.js';
import { montarNav } from './nav.js';
import { formatearFecha, formatearPrecio, mostrarError } from './ui.js';

const formatoEmision = new Intl.DateTimeFormat('es-CO', { dateStyle: 'long', timeStyle: 'short' });

// El número se guarda como entero (17); en el documento se muestra como UP-000017.
function codigoDeFactura(numero) {
  return `UP-${String(numero).padStart(6, '0')}`;
}

function escribir(id, texto) {
  document.getElementById(id).textContent = texto;
}

async function iniciar() {
  const reservaId = new URLSearchParams(window.location.search).get('reserva');
  try {
    const factura = await obtenerFactura(reservaId);
    const codigo = codigoDeFactura(factura.numero);
    // El título de la pestaña es el nombre que el navegador propone para el PDF.
    document.title = `Factura ${codigo} · Upland`;

    escribir('numero', codigo);
    escribir('emision', `Emitida el ${formatoEmision.format(new Date(factura.fechaEmision))}`);
    escribir('huesped-nombre', factura.huespedNombre);
    escribir('huesped-email', factura.huespedEmail);
    escribir('anfitrion-nombre', factura.anfitrionNombre);
    escribir('anfitrion-email', factura.anfitrionEmail);
    escribir('alojamiento', `${factura.alojamientoTitulo}, ${factura.alojamientoCiudad}`);
    escribir('estadia', `Del ${formatearFecha(factura.fechaEntrada)} al ${formatearFecha(factura.fechaSalida)}`);
    escribir('noches', factura.noches);
    escribir('precio', formatearPrecio(factura.precioNoche));
    escribir('subtotal', formatearPrecio(factura.total));
    escribir('total', formatearPrecio(factura.total));

    document.getElementById('factura').hidden = false;
    document.getElementById('imprimir').hidden = false;
  } catch (e) {
    mostrarError(document.getElementById('error'), e);
  }
}

// Imprimir abre el diálogo del navegador, que también permite guardar como PDF. No hace
// falta ninguna librería para generar el PDF.
document.getElementById('imprimir').addEventListener('click', () => window.print());

if (exigirSesion()) {
  montarNav();
  iniciar();
}
