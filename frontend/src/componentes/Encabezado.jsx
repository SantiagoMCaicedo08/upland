import { Link, NavLink } from 'react-router-dom';
import { useSesion } from '../contexto/Sesion.jsx';
import { IconoMarca } from './Iconos.jsx';

export default function Encabezado() {
  const { usuario, cerrar } = useSesion();

  return (
    <header className="encabezado">
      <div className="encabezado-interior">
        <Link to="/" className="marca">
          <IconoMarca />
          <span>Upland</span>
        </Link>

        <nav className="encabezado-nav" aria-label="Principal">
          {usuario ? (
            <>
              {usuario.rol === 'ANFITRION' && (
                <NavLink to="/publicar" className="enlace-nav">Publicar alojamiento</NavLink>
              )}
              <NavLink to="/panel" className="enlace-nav">Mi panel</NavLink>
              <button type="button" className="boton boton-secundario" onClick={cerrar}>
                Cerrar sesión
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" className="enlace-nav">Iniciar sesión</NavLink>
              <Link to="/registro" className="boton">Registrarse</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
