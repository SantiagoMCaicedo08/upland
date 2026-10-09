import { Navigate, useLocation } from 'react-router-dom';
import { useSesion } from '../contexto/Sesion.jsx';

// Envuelve las páginas que exigen sesión. Sin token redirige al login y le deja anotado de
// dónde venía el usuario, para devolverlo ahí después de entrar. Es una comodidad de la
// interfaz: quien de verdad protege los datos es el backend, que exige el token.
export default function RutaProtegida({ children }) {
  const { usuario } = useSesion();
  const ubicacion = useLocation();

  if (!usuario) {
    return <Navigate to="/login" replace state={{ desde: ubicacion.pathname + ubicacion.search }} />;
  }
  return children;
}
