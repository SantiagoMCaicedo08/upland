import { Link } from 'react-router-dom';
import { describirEspacio, describirTipo, describirUbicacion, formatearNumero, formatearPrecio } from '../formato.js';
import Foto from './Foto.jsx';
import { Estrella } from './Iconos.jsx';

// `fechas` es la parte de la URL con las fechas buscadas ("?entrada=...&salida=..."), para
// que el detalle abra con ellas ya puestas.
export default function TarjetaAlojamiento({ alojamiento, fechas = '' }) {
  return (
    <Link to={`/alojamientos/${alojamiento.id}${fechas}`} className="tarjeta">
      <div className="tarjeta-foto">
        <Foto url={alojamiento.fotoUrl} ancho={480} alt={alojamiento.titulo} />
        <span className="tarjeta-tipo">{describirTipo(alojamiento.tipo)}</span>
      </div>

      <div className="tarjeta-cuerpo">
        <div className="tarjeta-linea">
          <span className="tarjeta-lugar">{describirUbicacion(alojamiento)}</span>
          {alojamiento.calificacion !== null && (
            <span className="calificacion">
              <Estrella /> {alojamiento.calificacion.toFixed(2)}
              <span className="suave"> ({formatearNumero(alojamiento.numeroResenas)})</span>
            </span>
          )}
        </div>
        <h3 className="tarjeta-titulo">{alojamiento.titulo}</h3>
        <p className="tarjeta-espacio">{describirEspacio(alojamiento).join(' · ')}</p>
        <p className="tarjeta-precio">
          <strong>{formatearPrecio(alojamiento.precioNoche)}</strong> por noche
        </p>
      </div>
    </Link>
  );
}

// Lo que se ve mientras llegan los resultados: la silueta de una tarjeta.
export function TarjetaCargando() {
  return (
    <div className="tarjeta tarjeta-cargando" aria-hidden="true">
      <div className="tarjeta-foto" />
      <div className="tarjeta-cuerpo">
        <div className="linea-cargando linea-corta" />
        <div className="linea-cargando" />
        <div className="linea-cargando linea-media" />
      </div>
    </div>
  );
}
