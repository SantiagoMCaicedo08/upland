// Cliente de la API. Todas las llamadas HTTP del frontend salen por peticion(), así que el
// header Authorization y el manejo del 401 están escritos una sola vez. Este archivo no
// toca el DOM: en la fase 2 lo puede importar React tal como está.
import { API_URL } from './config.js';
import { obtenerToken, cerrarSesion } from './sesion.js';

// Error con el formato { codigo, mensaje, detalles } que devuelve el backend.
export class ErrorApi extends Error {
  constructor(estado, cuerpo) {
    super(cuerpo?.mensaje ?? 'No se pudo completar la operación');
    this.estado = estado;
    this.codigo = cuerpo?.codigo ?? 'ERROR';
    this.detalles = cuerpo?.detalles ?? [];
  }
}

async function peticion(metodo, ruta, { cuerpo, conToken = true } = {}) {
  const cabeceras = {};
  if (cuerpo !== undefined) cabeceras['Content-Type'] = 'application/json';
  const token = conToken ? obtenerToken() : null;
  if (token) cabeceras['Authorization'] = `Bearer ${token}`;

  let respuesta;
  try {
    respuesta = await fetch(`${API_URL}${ruta}`, {
      method: metodo,
      headers: cabeceras,
      body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
    });
  } catch {
    // fetch solo rechaza la promesa por fallos de red o de CORS; un 404 o un 500 no entran aquí.
    throw new ErrorApi(0, { codigo: 'SIN_CONEXION', mensaje: 'No se pudo conectar con el servidor' });
  }

  // Un 401 en una llamada que llevaba token significa que el token venció o no es válido:
  // se borra y se manda al login. El 401 del propio login no lleva token y no entra aquí,
  // así la pantalla de login puede mostrar "credenciales incorrectas".
  if (respuesta.status === 401 && token) {
    cerrarSesion();
    window.location.assign('login.html?motivo=sesion');
  }

  if (respuesta.status === 204) return null;
  const datos = await respuesta.json().catch(() => null);
  if (!respuesta.ok) throw new ErrorApi(respuesta.status, datos);
  return datos;
}

// --- Autenticación ---

export function registrar(datos) {
  return peticion('POST', '/api/auth/registro', { cuerpo: datos, conToken: false });
}

export function iniciarSesion(email, password) {
  return peticion('POST', '/api/auth/login', { cuerpo: { email, password }, conToken: false });
}

export function obtenerYo() {
  return peticion('GET', '/api/usuarios/yo');
}

// --- Alojamientos ---

// Recibe los filtros como objeto y omite los vacíos: ?ciudad= no se envía.
export function listarAlojamientos(filtros) {
  const parametros = new URLSearchParams();
  for (const [clave, valor] of Object.entries(filtros)) {
    if (valor !== '' && valor !== null && valor !== undefined) parametros.set(clave, valor);
  }
  return peticion('GET', `/api/alojamientos?${parametros}`, { conToken: false });
}

export function obtenerCiudades() {
  return peticion('GET', '/api/alojamientos/ciudades', { conToken: false });
}

export function obtenerAlojamiento(id) {
  return peticion('GET', `/api/alojamientos/${encodeURIComponent(id)}`, { conToken: false });
}

export function misAlojamientos() {
  return peticion('GET', '/api/alojamientos/mios');
}

export function crearAlojamiento(datos) {
  return peticion('POST', '/api/alojamientos', { cuerpo: datos });
}

export function actualizarAlojamiento(id, datos) {
  return peticion('PUT', `/api/alojamientos/${encodeURIComponent(id)}`, { cuerpo: datos });
}

export function eliminarAlojamiento(id) {
  return peticion('DELETE', `/api/alojamientos/${encodeURIComponent(id)}`);
}

// --- Reservas ---

// Las fechas viajan como texto 'AAAA-MM-DD', que es lo que entrega un <input type="date">.
export function crearReserva(alojamientoId, fechaEntrada, fechaSalida) {
  return peticion('POST', '/api/reservas', { cuerpo: { alojamientoId, fechaEntrada, fechaSalida } });
}

export function misReservas() {
  return peticion('GET', '/api/reservas/mias');
}

export function reservasRecibidas() {
  return peticion('GET', '/api/reservas/recibidas');
}

export function obtenerOcupacion(alojamientoId) {
  return peticion('GET', `/api/reservas/ocupacion?alojamientoId=${encodeURIComponent(alojamientoId)}`, { conToken: false });
}

// --- Facturas ---

export function obtenerFactura(reservaId) {
  return peticion('GET', `/api/reservas/${encodeURIComponent(reservaId)}/factura`);
}
