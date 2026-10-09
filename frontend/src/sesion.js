// Almacenamiento del token. Tradeoff aceptado: localStorage lo puede leer cualquier script
// que se ejecute en la página (XSS). React escapa por defecto todo lo que pinta, y este
// proyecto no usa dangerouslySetInnerHTML en ningún lado.
//
// Los componentes no usan este archivo directamente: leen la sesión del contexto
// (contexto/Sesion.jsx), que es el que avisa a React cuando cambia.
const CLAVE_TOKEN = 'upland.token';

export function guardarToken(token) {
  localStorage.setItem(CLAVE_TOKEN, token);
}

export function obtenerToken() {
  return localStorage.getItem(CLAVE_TOKEN);
}

export function borrarToken() {
  localStorage.removeItem(CLAVE_TOKEN);
}

// El payload de un JWT va codificado en base64url, no cifrado: cualquiera puede leerlo.
// Aquí solo sirve para decidir qué mostrar. Quien comprueba la firma, y por tanto quien
// decide qué se permite, es el backend.
export function datosDelToken(token) {
  if (!token) return null;
  try {
    const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const datos = JSON.parse(atob(payload));
    return { id: datos.sub, rol: datos.rol };
  } catch {
    return null;
  }
}
