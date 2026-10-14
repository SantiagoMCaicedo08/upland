// Cliente de la API. Todas las llamadas HTTP del frontend salen por peticion(), así que el
// header Authorization y el manejo del 401 están escritos una sola vez. Este archivo no
// sabe nada de React: es el mismo de la fase 1, con las llamadas de búsqueda agregadas.
import { API_URL } from './config.js';
import { obtenerToken, borrarToken } from './sesion.js';

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
  // así la pantalla de login puede mostrar "credenciales incorrectas". La redirección es
  // una carga completa de la página a propósito: reinicia todo el estado de React.
  if (respuesta.status === 401 && token) {
    borrarToken();
    window.location.assign('/login?motivo=sesion');
  }

  if (respuesta.status === 204) return null;
  const datos = await respuesta.json().catch(() => null);
  if (!respuesta.ok) throw new ErrorApi(respuesta.status, datos);
  return datos;
}

// Convierte un objeto de filtros en parámetros de URL. Los valores vacíos se omiten y los
// arreglos se repiten (?servicios=Wifi&servicios=Cocina), que es como los espera el backend.
function aParametros(filtros) {
  const parametros = new URLSearchParams();
  for (const [clave, valor] of Object.entries(filtros)) {
    if (Array.isArray(valor)) {
      valor.forEach((elemento) => parametros.append(clave, elemento));
    } else if (valor !== '' && valor !== null && valor !== undefined) {
      parametros.set(clave, valor);
    }
  }
  return parametros;
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

export function buscarAlojamientos(filtros) {
  return peticion('GET', `/api/alojamientos?${aParametros(filtros)}`, { conToken: false });
}

export function obtenerOpcionesDeFiltro() {
  return peticion('GET', '/api/alojamientos/filtros', { conToken: false });
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
