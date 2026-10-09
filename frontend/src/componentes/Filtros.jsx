import { useEffect, useState } from 'react';
import { TIPOS } from '../formato.js';

const SERVICIOS_VISIBLES = 8;
const MINIMOS_DE_HABITACIONES = ['1', '2', '3', '4'];

// Panel lateral de filtros. No guarda estado de los filtros: los recibe ya leídos de la
// URL y avisa cada cambio con alCambiar. Así la URL es la única fuente de verdad y el botón
// Atrás del navegador deshace un filtro.
export default function Filtros({ filtros, opciones, alCambiar }) {
  const [verTodos, setVerTodos] = useState(false);

  // Zonas de la ciudad elegida, o de todas si no se eligió ninguna.
  const zonas = opciones.ciudades
    .filter((ciudad) => !filtros.ciudad || ciudad.nombre === filtros.ciudad)
    .flatMap((ciudad) => ciudad.zonas);

  // Los servicios ya marcados se muestran siempre, aunque estén más allá del corte.
  const servicios = verTodos
    ? opciones.servicios
    : opciones.servicios.filter((servicio, indice) => indice < SERVICIOS_VISIBLES || filtros.servicios.includes(servicio));

  function alternarServicio(servicio) {
    const marcados = filtros.servicios.includes(servicio)
      ? filtros.servicios.filter((otro) => otro !== servicio)
      : [...filtros.servicios, servicio];
    alCambiar({ servicios: marcados });
  }

  return (
    <div className="filtros">
      {zonas.length > 0 && (
        <fieldset className="filtro">
          <legend>Zona</legend>
          <select value={filtros.zona} onChange={(evento) => alCambiar({ zona: evento.target.value })}
            aria-label="Zona">
            <option value="">Todas las zonas</option>
            {zonas.map((zona) => <option key={zona} value={zona}>{zona}</option>)}
          </select>
        </fieldset>
      )}

      <fieldset className="filtro">
        <legend>Tipo de alojamiento</legend>
        <div className="opciones">
          <Opcion activa={!filtros.tipo} alElegir={() => alCambiar({ tipo: '' })}>Todos</Opcion>
          {TIPOS.map(([codigo, nombre]) => (
            <Opcion key={codigo} activa={filtros.tipo === codigo} alElegir={() => alCambiar({ tipo: codigo })}>
              {nombre}
            </Opcion>
          ))}
        </div>
      </fieldset>

      <fieldset className="filtro">
        <legend>Precio por noche</legend>
        <RangoDePrecio filtros={filtros} alCambiar={alCambiar} />
      </fieldset>

      <fieldset className="filtro">
        <legend>Habitaciones</legend>
        <div className="opciones">
          <Opcion activa={!filtros.habitaciones} alElegir={() => alCambiar({ habitaciones: '' })}>Cualquiera</Opcion>
          {MINIMOS_DE_HABITACIONES.map((minimo) => (
            <Opcion key={minimo} activa={filtros.habitaciones === minimo}
              alElegir={() => alCambiar({ habitaciones: minimo })}>
              {minimo}+
            </Opcion>
          ))}
        </div>
      </fieldset>

      <fieldset className="filtro">
        <legend>Servicios</legend>
        <div className="casillas">
          {servicios.map((servicio) => (
            <label key={servicio} className="casilla">
              <input type="checkbox" checked={filtros.servicios.includes(servicio)}
                onChange={() => alternarServicio(servicio)} />
              <span>{servicio}</span>
            </label>
          ))}
        </div>
        {opciones.servicios.length > SERVICIOS_VISIBLES && (
          <button type="button" className="enlace" onClick={() => setVerTodos(!verTodos)}>
            {verTodos ? 'Mostrar menos' : `Mostrar los ${opciones.servicios.length}`}
          </button>
        )}
      </fieldset>
    </div>
  );
}

function Opcion({ activa, alElegir, children }) {
  return (
    <button type="button" className={activa ? 'opcion opcion-activa' : 'opcion'} aria-pressed={activa}
      onClick={alElegir}>
      {children}
    </button>
  );
}

// El precio se escribe con el teclado, y buscar con cada dígito lanzaría una petición por
// tecla. Por eso guarda lo escrito en un estado propio y solo lo aplica al salir del campo
// o al pulsar Enter.
function RangoDePrecio({ filtros, alCambiar }) {
  const [minimo, setMinimo] = useState(filtros.precioMin);
  const [maximo, setMaximo] = useState(filtros.precioMax);

  useEffect(() => {
    setMinimo(filtros.precioMin);
    setMaximo(filtros.precioMax);
  }, [filtros.precioMin, filtros.precioMax]);

  function aplicar(evento) {
    evento?.preventDefault();
    if (minimo !== filtros.precioMin || maximo !== filtros.precioMax) {
      alCambiar({ precioMin: minimo, precioMax: maximo });
    }
  }

  return (
    <form className="rango" onSubmit={aplicar}>
      <label>
        <span>Mínimo</span>
        <input type="number" min="0" step="10000" inputMode="numeric" placeholder="$ 0" value={minimo}
          onChange={(evento) => setMinimo(evento.target.value)} onBlur={() => aplicar()} />
      </label>
      <label>
        <span>Máximo</span>
        <input type="number" min="0" step="10000" inputMode="numeric" placeholder="Sin límite" value={maximo}
          onChange={(evento) => setMaximo(evento.target.value)} onBlur={() => aplicar()} />
      </label>
      {/* Sin un botón de envío, Enter no dispara el submit en un formulario de dos campos. */}
      <button type="submit" hidden>Aplicar</button>
    </form>
  );
}
