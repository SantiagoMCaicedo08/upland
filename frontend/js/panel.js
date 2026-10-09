// Pantalla protegida: sin token redirige al login, y con un token que el backend rechaza
// también (eso lo hace api.js al recibir el 401).
import { obtenerYo, misAlojamientos, eliminarAlojamiento, misReservas, reservasRecibidas } from './api.js';
import { exigirSesion } from './sesion.js';
import { montarNav } from './nav.js';
import {
  describirCapacidad, describirNoches, formatearFecha, formatearPrecio, mostrarError, ocultar,
} from './ui.js';

const NOMBRES_ROL = { HUESPED: 'Huésped', ANFITRION: 'Anfitrión', ADMIN: 'Administrador' };
const NOMBRES_ESTADO = {
  PENDIENTE_PAGO: 'Pendiente de pago',
  CONFIRMADA: 'Confirmada',
  COMPLETADA: 'Completada',
  CANCELADA: 'Cancelada',
  RECHAZADA: 'Rechazada',
};

const error = document.getElementById('error');
const lista = document.getElementById('mis-alojamientos');
const sinAlojamientos = document.getElementById('sin-alojamientos');
const plantilla = document.getElementById('plantilla-fila');
const plantillaReserva = document.getElementById('plantilla-reserva');

function crearFila(alojamiento) {
  const fila = plantilla.content.cloneNode(true);
  const id = encodeURIComponent(alojamiento.id);

  const nombre = fila.querySelector('.fila-nombre');
  nombre.textContent = alojamiento.titulo;
  nombre.href = `detalle.html?id=${id}`;
  fila.querySelector('.fila-datos').textContent =
    `${alojamiento.ciudad} · ${describirCapacidad(alojamiento.capacidad)} · ${formatearPrecio(alojamiento.precioNoche)} por noche`;
  fila.querySelector('.editar').href = `alojamiento.html?id=${id}`;
  fila.querySelector('.eliminar').addEventListener('click', () => eliminar(alojamiento));
  return fila;
}

// La misma fila sirve para las dos listas. El huésped solo viene en las reservas recibidas.
function crearFilaReserva(reserva) {
  const fila = plantillaReserva.content.cloneNode(true);

  const nombre = fila.querySelector('.fila-nombre');
  nombre.textContent = reserva.alojamientoTitulo;
  nombre.href = `detalle.html?id=${encodeURIComponent(reserva.alojamientoId)}`;
  fila.querySelector('.reserva-fechas').textContent =
    `${reserva.alojamientoCiudad} · ${formatearFecha(reserva.fechaEntrada)} → ${formatearFecha(reserva.fechaSalida)} · ${describirNoches(reserva.noches)}`;
  fila.querySelector('.reserva-total').textContent = formatearPrecio(reserva.valorTotal);
  fila.querySelector('.reserva-estado').textContent = NOMBRES_ESTADO[reserva.estado] ?? reserva.estado;

  if (reserva.huespedNombre) {
    const huesped = fila.querySelector('.reserva-huesped');
    huesped.textContent = `Huésped: ${reserva.huespedNombre} · ${reserva.huespedEmail}`;
    huesped.hidden = false;
  }
  return fila;
}

async function cargarMisAlojamientos() {
  const alojamientos = await misAlojamientos();
  lista.replaceChildren(...alojamientos.map(crearFila));
  sinAlojamientos.hidden = alojamientos.length > 0;
}

async function cargarReservasRecibidas() {
  const reservas = await reservasRecibidas();
  document.getElementById('reservas-recibidas').replaceChildren(...reservas.map(crearFilaReserva));
  document.getElementById('sin-recibidas').hidden = reservas.length > 0;
  // Solo suman las confirmadas: una reserva cancelada no es dinero ganado.
  const ganado = reservas
    .filter((reserva) => reserva.estado === 'CONFIRMADA' || reserva.estado === 'COMPLETADA')
    .reduce((suma, reserva) => suma + reserva.valorTotal, 0);
  document.getElementById('total-ganado').textContent = `Total ganado: ${formatearPrecio(ganado)}`;
  document.getElementById('seccion-recibidas').hidden = false;
}

async function cargarMisReservas() {
  const reservas = await misReservas();
  document.getElementById('mis-reservas').replaceChildren(...reservas.map(crearFilaReserva));
  document.getElementById('sin-reservas').hidden = reservas.length > 0;
  document.getElementById('seccion-mis-reservas').hidden = false;
}

async function eliminar(alojamiento) {
  if (!window.confirm(`¿Eliminar "${alojamiento.titulo}"? Dejará de aparecer en el catálogo.`)) return;
  ocultar(error);
  try {
    await eliminarAlojamiento(alojamiento.id);
    await cargarMisAlojamientos();
  } catch (e) {
    mostrarError(error, e);
  }
}

async function iniciar() {
  try {
    const yo = await obtenerYo();
    document.getElementById('saludo').textContent = `Hola, ${yo.nombre}`;
    document.getElementById('cuenta-email').textContent = yo.email;
    document.getElementById('cuenta-rol').textContent = NOMBRES_ROL[yo.rol] ?? yo.rol;
    document.getElementById('cuenta').hidden = false;

    if (yo.rol === 'ANFITRION') {
      document.getElementById('seccion-anfitrion').hidden = false;
      await cargarMisAlojamientos();
      await cargarReservasRecibidas();
    }
    // Cualquier cuenta puede reservar alojamientos ajenos, también un anfitrión.
    await cargarMisReservas();
  } catch (e) {
    mostrarError(error, e);
  }
}

if (exigirSesion()) {
  montarNav();
  iniciar();
}
