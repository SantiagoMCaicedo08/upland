// La sesión como estado de React. El token vive en localStorage (sesion.js), pero React no
// se entera de los cambios en localStorage: por eso se copia a un estado, y cualquier
// componente que use useSesion() se vuelve a pintar al iniciar o cerrar sesión.
import { createContext, useContext, useMemo, useState } from 'react';
import { borrarToken, datosDelToken, guardarToken, obtenerToken } from '../sesion.js';

const SesionContext = createContext(null);

export function SesionProvider({ children }) {
  const [token, setToken] = useState(obtenerToken);

  const sesion = useMemo(() => ({
    // { id, rol } leídos del token, o null si no hay sesión.
    usuario: datosDelToken(token),
    iniciar(nuevoToken) {
      guardarToken(nuevoToken);
      setToken(nuevoToken);
    },
    // Cerrar sesión recarga la aplicación en el inicio en vez de cambiar el estado. Así se
    // descarta de una vez todo lo que hubiera en memoria del usuario anterior, y una página
    // protegida que esté abierta no alcanza a redirigir al login por su cuenta.
    cerrar() {
      borrarToken();
      window.location.assign('/');
    },
  }), [token]);

  return <SesionContext.Provider value={sesion}>{children}</SesionContext.Provider>;
}

export function useSesion() {
  return useContext(SesionContext);
}
