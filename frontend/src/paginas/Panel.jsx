import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { eliminarAlojamiento, misAlojamientos, misReservas, obtenerYo, reservasRecibidas } from '../api.js';
import Foto from '../componentes/Foto.jsx';
import MensajeError from '../componentes/MensajeError.jsx';
import {
  contar, describirEspacio, describirUbicacion, formatearFecha, formatearPrecio,
} from '../formato.js';

const NOMBRES_ROL = { HUESPED: 'Huésped', ANFITRION: 'Anfitrión', ADMIN: 'Administrador' };
const NOMBRES_ESTADO = {
  PENDIENTE_PAGO: 'Pendiente de pago',
  CONFIRMADA: 'Confirmada',
  COMPLETADA: 'Completada',
  CANCELADA: 'Cancelada',
  RECHAZADA: 'Rechazada',
};

// Pantalla protegida. Llega aquí solo quien tiene token (RutaProtegida), y si el backend
// rechaza ese token, api.js lo borra y manda al login.
export default function Panel() {
  const ubicacion = useLocation();
  const [yo, setYo] = useState(null);
  const [alojamientos, setAlojamientos] = useState([]);
  const [recibidas, setRecibidas] = useState([]);
  const [reservas, setReservas] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    let vigente = true;

    async function cargar() {
      try {
        const usuario = await obtenerYo();
        const esAnfitrion = usuario.rol === 'ANFITRION';
        // Lo del anfitrión solo se pide si la cuenta es de anfitrión.
        const [propios, deOtros, mias] = await Promise.all([
          esAnfitrion ? misAlojamientos() : [],
          esAnfitrion ? reservasRecibidas() : [],
          misReservas(),
        ]);
        if (!vigente) return;
        setYo(usuario);
        setAlojamientos(propios);
        setRecibidas(deOtros);
        setReservas(mias);
      } catch (fallo) {
        if (vigente) setError(fallo);
      }
    }

    cargar();
    return () => {
      vigente = false;
    };
  }, []);

  async function eliminar(alojamiento) {
    if (!window.confirm(`¿Eliminar "${alojamiento.titulo}"? Dejará de aparecer en el catálogo.`)) return;
    setError(null);
    try {
      await eliminarAlojamiento(alojamiento.id);
      setAlojamientos((previos) => previos.filter((otro) => otro.id !== alojamiento.id));
    } catch (fallo) {
      setError(fallo);
    }
  }

  if (!yo) {
    return (
      <main className="contenedor">
        <MensajeError error={error} />
        {!error && <p className="suave">Cargando tu panel…</p>}
      </main>
    );
  }

  const esAnfitrion = yo.rol === 'ANFITRION';
  // Solo cuentan las reservas que ocupan fechas: una cancelada no es dinero ganado.
  const ganado = recibidas
    .filter((reserva) => reserva.estado === 'CONFIRMADA' || reserva.estado === 'COMPLETADA')
    .reduce((suma, reserva) => suma + reserva.valorTotal, 0);

  return (
    <main className="contenedor panel">
      <header className="panel-cabecera">
        <div>
          <h1>Hola, {yo.nombre}</h1>
          <p className="suave">{yo.email} · {NOMBRES_ROL[yo.rol] ?? yo.rol}</p>
        </div>
        {esAnfitrion && <Link to="/publicar" className="boton">Publicar alojamiento</Link>}
      </header>

      {ubicacion.state?.aviso && <p className="mensaje mensaje-aviso">{ubicacion.state.aviso}</p>}
      <MensajeError error={error} />

      {esAnfitrion && (
        <>
          <div className="cifras">
            <Cifra etiqueta="Alojamientos publicados" valor={alojamientos.length} />
            <Cifra etiqueta="Reservas recibidas" valor={recibidas.length} />
            <Cifra etiqueta="Total ganado" valor={formatearPrecio(ganado)} />
          </div>

          <section className="panel-seccion">
            <h2>Mis alojamientos</h2>
            {alojamientos.length === 0 && <p className="suave">Todavía no has publicado ningún alojamiento.</p>}
            <ul className="lista">
              {alojamientos.map((alojamiento) => (
                <li key={alojamiento.id} className="fila">
                  <div className="fila-foto"><Foto url={alojamiento.fotoUrl} ancho={240} /></div>
                  <div className="fila-cuerpo">
                    <Link to={`/alojamientos/${alojamiento.id}`} className="fila-titulo">{alojamiento.titulo}</Link>
                    <p className="suave">
                      {describirUbicacion(alojamiento)} · {describirEspacio(alojamiento)[0]} · {formatearPrecio(alojamiento.precioNoche)} por noche
                    </p>
                  </div>
                  <div className="fila-acciones">
                    <Link to={`/alojamientos/${alojamiento.id}/editar`} className="boton boton-secundario">Editar</Link>
                    <button type="button" className="boton boton-peligro" onClick={() => eliminar(alojamiento)}>
                      Eliminar
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section className="panel-seccion">
            <h2>Reservas recibidas</h2>
            {recibidas.length === 0 && <p className="suave">Todavía nadie ha reservado tus alojamientos.</p>}
            <ListaDeReservas reservas={recibidas} />
          </section>
        </>
      )}

      <section className="panel-seccion">
        <h2>Mis reservas</h2>
        {reservas.length === 0 && (
          <p className="suave">
            Todavía no has reservado. Explora el <Link to="/">catálogo de alojamientos</Link>.
          </p>
        )}
        <ListaDeReservas reservas={reservas} />
      </section>
    </main>
  );
}

function Cifra({ etiqueta, valor }) {
  return (
    <div className="cifra">
      <span className="cifra-valor">{valor}</span>
      <span className="suave">{etiqueta}</span>
    </div>
  );
}

// La misma lista sirve para las reservas hechas y las recibidas. El backend solo incluye
// el huésped en las recibidas, así que basta mirar si el dato viene.
function ListaDeReservas({ reservas }) {
  return (
    <ul className="lista">
      {reservas.map((reserva) => (
        <li key={reserva.id} className="fila">
          <div className="fila-foto"><Foto url={reserva.alojamientoFotoUrl} ancho={240} /></div>
          <div className="fila-cuerpo">
            <Link to={`/alojamientos/${reserva.alojamientoId}`} className="fila-titulo">
              {reserva.alojamientoTitulo}
            </Link>
            <p className="suave">
              {reserva.alojamientoCiudad} · {formatearFecha(reserva.fechaEntrada)} → {formatearFecha(reserva.fechaSalida)} · {contar(reserva.noches, 'noche', 'noches')}
            </p>
            {reserva.huespedNombre && (
              <p className="suave">Huésped: {reserva.huespedNombre} · {reserva.huespedEmail}</p>
            )}
          </div>
          <div className="fila-valor">
            <strong>{formatearPrecio(reserva.valorTotal)}</strong>
            <span className="estado">{NOMBRES_ESTADO[reserva.estado] ?? reserva.estado}</span>
          </div>
        </li>
      ))}
    </ul>
  );
}
