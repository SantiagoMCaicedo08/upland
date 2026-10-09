import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { crearReserva, obtenerAlojamiento, obtenerOcupacion } from '../api.js';
import Foto from '../componentes/Foto.jsx';
import { Estrella, IconoCheck, IconoUbicacion } from '../componentes/Iconos.jsx';
import MensajeError from '../componentes/MensajeError.jsx';
import { useSesion } from '../contexto/Sesion.jsx';
import {
  contar, contarNoches, describirEspacio, describirTipo, describirUbicacion, diaSiguiente, fechaLocal,
  formatearFecha, formatearNumero, formatearPrecio,
} from '../formato.js';

export default function Detalle() {
  const { id } = useParams();
  const [alojamiento, setAlojamiento] = useState(null);
  const [ocupacion, setOcupacion] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    let vigente = true;
    setAlojamiento(null);
    setError(null);

    // Las dos peticiones son independientes, así que salen a la vez.
    Promise.all([obtenerAlojamiento(id), obtenerOcupacion(id)])
      .then(([datos, rangos]) => {
        if (!vigente) return;
        setAlojamiento(datos);
        setOcupacion(rangos);
        document.title = `${datos.titulo} · Upland`;
      })
      .catch((fallo) => {
        if (vigente) setError(fallo);
      });

    return () => {
      vigente = false;
      document.title = 'Upland · Alojamientos';
    };
  }, [id]);

  if (error) {
    return (
      <main className="contenedor contenedor-medio">
        <MensajeError error={error} />
        <Link to="/" className="boton boton-secundario">Volver al catálogo</Link>
      </main>
    );
  }
  if (!alojamiento) {
    return <main className="contenedor"><p className="suave">Cargando alojamiento…</p></main>;
  }

  const tieneMapa = alojamiento.latitud !== null;

  return (
    <main className="contenedor detalle">
      <header className="detalle-cabecera">
        <h1>{alojamiento.titulo}</h1>
        <p className="detalle-resumen">
          {alojamiento.calificacion !== null && (
            <span className="calificacion">
              <Estrella /> {alojamiento.calificacion.toFixed(2)}
              <span className="suave"> · {contar(alojamiento.numeroResenas, 'reseña', 'reseñas')}</span>
            </span>
          )}
          <span>{describirUbicacion(alojamiento)}</span>
        </p>
      </header>

      <div className="detalle-foto">
        <Foto url={alojamiento.fotoUrl} ancho={1200} alt={alojamiento.titulo} />
      </div>

      <div className="detalle-columnas">
        <div className="detalle-contenido">
          <section className="detalle-seccion">
            <h2>{describirTipo(alojamiento.tipo)}</h2>
            <p className="suave">{describirEspacio(alojamiento).join(' · ')}</p>
          </section>

          <section className="detalle-seccion">
            <h2>Sobre este alojamiento</h2>
            <p className="descripcion">{alojamiento.descripcion}</p>
          </section>

          {alojamiento.servicios.length > 0 && (
            <section className="detalle-seccion">
              <h2>Servicios</h2>
              <ul className="servicios">
                {alojamiento.servicios.map((servicio) => (
                  <li key={servicio}><IconoCheck tamano={18} /> {servicio}</li>
                ))}
              </ul>
            </section>
          )}

          <section className="detalle-seccion">
            <h2>Ubicación</h2>
            <p className="ubicacion">
              <IconoUbicacion tamano={18} />
              <span>{alojamiento.direccion}</span>
            </p>
            {tieneMapa && (
              <a className="enlace" target="_blank" rel="noreferrer"
                href={`https://www.openstreetmap.org/?mlat=${alojamiento.latitud}&mlon=${alojamiento.longitud}#map=16/${alojamiento.latitud}/${alojamiento.longitud}`}>
                Ver en el mapa
              </a>
            )}
          </section>
        </div>

        <aside className="detalle-lateral">
          <TarjetaDeReserva alojamiento={alojamiento} ocupacion={ocupacion} alOcupar={setOcupacion} />
        </aside>
      </div>
    </main>
  );
}

// La caja de la derecha. Según quién mira ofrece editar (el dueño), reservar (cualquier
// otra cuenta) o iniciar sesión (un visitante). Es solo lo que la interfaz ofrece: el
// backend vuelve a comprobar dueño, fechas y precio por su cuenta.
function TarjetaDeReserva({ alojamiento, ocupacion, alOcupar }) {
  const { usuario } = useSesion();
  const navegar = useNavigate();
  const ubicacion = useLocation();
  const [parametros] = useSearchParams();

  // Si se llegó desde una búsqueda con fechas, vienen en la URL y se usan de entrada.
  const [entrada, setEntrada] = useState(parametros.get('entrada') ?? '');
  const [salida, setSalida] = useState(parametros.get('salida') ?? '');
  const [error, setError] = useState(null);
  const [enviando, setEnviando] = useState(false);

  const esDueno = usuario?.id === alojamiento.anfitrionId;
  const noches = entrada && salida ? contarNoches(entrada, salida) : 0;

  async function reservar(evento) {
    evento.preventDefault();
    setError(null);
    setEnviando(true);
    try {
      await crearReserva(alojamiento.id, entrada, salida);
      navegar('/panel', { state: { aviso: 'Reserva confirmada.' } });
    } catch (fallo) {
      // Aquí cae el 409 cuando las fechas se cruzan con otra reserva. Se vuelve a pedir la
      // ocupación porque alguien pudo haber reservado mientras la página estaba abierta.
      setError(fallo);
      setEnviando(false);
      obtenerOcupacion(alojamiento.id).then(alOcupar).catch(() => {});
    }
  }

  return (
    <div className="reserva">
      <p className="reserva-precio">
        <strong>{formatearPrecio(alojamiento.precioNoche)}</strong> por noche
      </p>

      {esDueno && (
        <>
          <p className="suave">Este alojamiento es tuyo.</p>
          <Link to={`/alojamientos/${alojamiento.id}/editar`} className="boton boton-ancho">Editar alojamiento</Link>
        </>
      )}

      {!usuario && (
        <Link to="/login" state={{ desde: ubicacion.pathname + ubicacion.search }} className="boton boton-ancho">
          Inicia sesión para reservar
        </Link>
      )}

      {usuario && !esDueno && (
        <form onSubmit={reservar} className="reserva-formulario">
          <div className="reserva-fechas">
            <label className="campo">
              <span>Entrada</span>
              <input type="date" value={entrada} min={fechaLocal()} required
                onChange={(evento) => setEntrada(evento.target.value)} />
            </label>
            <label className="campo">
              <span>Salida</span>
              <input type="date" value={salida} min={entrada ? diaSiguiente(entrada) : fechaLocal(1)} required
                onChange={(evento) => setSalida(evento.target.value)} />
            </label>
          </div>

          {/* Vista previa. El total que vale lo calcula el backend con el precio guardado. */}
          {noches > 0 && (
            <dl className="reserva-total">
              <dt>{formatearPrecio(alojamiento.precioNoche)} × {contar(noches, 'noche', 'noches')}</dt>
              <dd>{formatearPrecio(alojamiento.precioNoche * noches)}</dd>
            </dl>
          )}

          <MensajeError error={error} />
          <button type="submit" className="boton boton-ancho" disabled={enviando}>
            {enviando ? 'Reservando…' : 'Reservar'}
          </button>
        </form>
      )}

      {ocupacion.length > 0 && (
        <div className="reserva-ocupacion">
          <h3>Fechas ya reservadas</h3>
          <ul>
            {ocupacion.map((rango) => (
              <li key={rango.fechaEntrada}>
                {formatearFecha(rango.fechaEntrada)} → {formatearFecha(rango.fechaSalida)}
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="reserva-nota suave">
        {formatearNumero(alojamiento.capacidad)} huéspedes como máximo · sin pago en línea
      </p>
    </div>
  );
}
