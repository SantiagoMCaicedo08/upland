// La sesión del navegador es el token guardado en localStorage. Tradeoff aceptado: cualquier
// script que se ejecute en la página puede leerlo (XSS). Por eso el resto del frontend
// escribe en el DOM con textContent y nunca con innerHTML.
const CLAVE_TOKEN = 'upland.token';

export function guardarToken(token) {
  localStorage.setItem(CLAVE_TOKEN, token);
}

export function obtenerToken() {
  return localStorage.getItem(CLAVE_TOKEN);
}

export function cerrarSesion() {
  localStorage.removeItem(CLAVE_TOKEN);
}

export function haySesion() {
  return obtenerToken() !== null;
}

// El payload de un JWT va codificado en base64url, no cifrado: cualquiera puede leerlo.
// Aquí solo sirve para decidir qué mostrar. Quien comprueba la firma, y por tanto quien
// decide qué se permite, es el backend.
export function datosDelToken() {
  const token = obtenerToken();
  if (!token) return null;
  try {
    const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const datos = JSON.parse(atob(payload));
    return { id: datos.sub, rol: datos.rol };
  } catch {
    return null;
  }
}

// Para las páginas protegidas. Devuelve false si redirige, para que la página no siga cargando.
export function exigirSesion() {
  if (haySesion()) return true;
  window.location.replace('login.html');
  return false;
}
