import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { buscarAlojamientos, obtenerOpcionesDeFiltro } from '../api.js';
import Buscador from '../componentes/Buscador.jsx';
import Filtros from '../componentes/Filtros.jsx';
import { IconoFiltros } from '../componentes/Iconos.jsx';
import MensajeError from '../componentes/MensajeError.jsx';
import Paginacion from '../componentes/Paginacion.jsx';
import TarjetaAlojamiento, { TarjetaCargando } from '../componentes/TarjetaAlojamiento.jsx';
import { contar, describirTipo, formatearFecha, formatearPrecio } from '../formato.js';

const TAMANO_PAGINA = 12;

const ORDENES = [
  ['POPULARES', 'Más populares'],
  ['MEJOR_CALIFICADOS', 'Mejor calificados'],
  ['PRECIO_ASCENDENTE', 'Precio: de menor a mayor'],
  ['PRECIO_DESCENDENTE', 'Precio: de mayor a menor'],
  ['RECIENTES', 'Más recientes'],
];

// Los filtros viven en la URL (?ciudad=Bogotá&servicios=Wifi...). Esta función los lee.
function leerFiltros(parametros) {
  const texto = (clave) => parametros.get(clave) ?? '';
  return {
    ciudad: texto('ciudad'),
    zona: texto('zona'),
    tipo: texto('tipo'),
    precioMin: texto('precioMin'),
    precioMax: texto('precioMax'),
    huespedes: texto('huespedes'),
    habitaciones: texto('habitaciones'),
    servicios: parametros.getAll('servicios'),
    entrada: texto('entrada'),
    salida: texto('salida'),
    orden: parametros.get('orden') ?? 'POPULARES',
    // En la URL las páginas empiezan en 1, que es como las cuenta una persona.
    pagina: Math.max(Number(parametros.get('pagina')) || 1, 1),
  };
}

// Una etiqueta por cada filtro activo, con el cambio que hay que aplicar para quitarlo.
function etiquetasActivas(filtros) {
  const etiquetas = [];
  if (filtros.ciudad) etiquetas.push({ texto: filtros.ciudad, quitar: { ciudad: '', zona: '' } });
  if (filtros.zona) etiquetas.push({ texto: filtros.zona, quitar: { zona: '' } });
  if (filtros.entrada && filtros.salida) {
    etiquetas.push({
      texto: `${formatearFecha(filtros.entrada)} → ${formatearFecha(filtros.salida)}`,
      quitar: { entrada: '', salida: '' },
    });
  }
  if (filtros.huespedes) {
    etiquetas.push({ texto: contar(Number(filtros.huespedes), 'huésped', 'huéspedes'), quitar: { huespedes: '' } });
  }
  if (filtros.tipo) etiquetas.push({ texto: describirTipo(filtros.tipo), quitar: { tipo: '' } });
  if (filtros.precioMin || filtros.precioMax) {
    const desde = filtros.precioMin ? `desde ${formatearPrecio(filtros.precioMin)}` : '';
    const hasta = filtros.precioMax ? `hasta ${formatearPrecio(filtros.precioMax)}` : '';
    etiquetas.push({ texto: `Precio ${desde} ${hasta}`.trim(), quitar: { precioMin: '', precioMax: '' } });
  }
  if (filtros.habitaciones) {
    etiquetas.push({ texto: `${filtros.habitaciones}+ habitaciones`, quitar: { habitaciones: '' } });
  }
  filtros.servicios.forEach((servicio) => {
    etiquetas.push({ texto: servicio, quitar: { servicios: filtros.servicios.filter((otro) => otro !== servicio) } });
  });
  return etiquetas;
}

export default function Catalogo() {
  const [parametros, setParametros] = useSearchParams();
  const consulta = parametros.toString();
  const filtros = useMemo(() => leerFiltros(new URLSearchParams(consulta)), [consulta]);

  const [opciones, setOpciones] = useState({ ciudades: [], servicios: [] });
  const [estado, setEstado] = useState({ cargando: true, error: null, resultado: null });
  const [filtrosAbiertos, setFiltrosAbiertos] = useState(false);

  // Las listas de ciudades, zonas y servicios se piden una sola vez.
  useEffect(() => {
    obtenerOpcionesDeFiltro().then(setOpciones).catch(() => {});
  }, []);

  // Cada vez que cambia la URL se vuelve a buscar. `vigente` descarta la respuesta de una
  // búsqueda anterior que llegue tarde: sin eso, al cambiar rápido dos filtros podría
  // quedar pintado el resultado del primero.
  useEffect(() => {
    let vigente = true;
    setEstado((previo) => ({ ...previo, cargando: true, error: null }));

    buscarAlojamientos({ ...filtros, pagina: filtros.pagina - 1, tamano: TAMANO_PAGINA })
      .then((resultado) => {
        if (vigente) setEstado({ cargando: false, error: null, resultado });
      })
      .catch((error) => {
        if (vigente) setEstado({ cargando: false, error, resultado: null });
      });

    return () => {
      vigente = false;
    };
  }, [filtros]);

  // Aplica cambios a la URL. Cualquier cambio de filtro vuelve a la primera página, porque
  // la página 7 de la búsqueda anterior no significa nada en la nueva.
  function cambiar(cambios) {
    const siguientes = new URLSearchParams(parametros);
    for (const [clave, valor] of Object.entries(cambios)) {
      siguientes.delete(clave);
      if (Array.isArray(valor)) {
        valor.forEach((elemento) => siguientes.append(clave, elemento));
      } else if (valor !== '' && valor !== null) {
        siguientes.set(clave, valor);
      }
    }
    if (!('pagina' in cambios)) siguientes.delete('pagina');
    setParametros(siguientes);
  }

  function irAPagina(pagina) {
    cambiar({ pagina: pagina === 1 ? '' : String(pagina) });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  const etiquetas = etiquetasActivas(filtros);
  const { cargando, error, resultado } = estado;
  // Para que el detalle abra con las fechas que se buscaron.
  const fechas = filtros.entrada && filtros.salida ? `?entrada=${filtros.entrada}&salida=${filtros.salida}` : '';

  return (
    <>
      <section className="portada">
        <div className="portada-interior">
          <h1>Encuentra dónde quedarte</h1>
          <p>Apartamentos, casas y habitaciones en Bogotá y Santander.</p>
          <Buscador filtros={filtros} ciudades={opciones.ciudades} alBuscar={cambiar} />
        </div>
      </section>

      <main className="contenedor catalogo">
        <aside className={filtrosAbiertos ? 'catalogo-filtros catalogo-filtros-abiertos' : 'catalogo-filtros'}>
          <Filtros filtros={filtros} opciones={opciones} alCambiar={cambiar} />
        </aside>

        <section className="catalogo-resultados" aria-live="polite" aria-busy={cargando}>
          <div className="resultados-cabecera">
            <h2>
              {resultado ? contar(resultado.totalElementos, 'alojamiento', 'alojamientos') : 'Buscando…'}
            </h2>
            <div className="resultados-controles">
              <button type="button" className="boton boton-secundario solo-movil"
                aria-expanded={filtrosAbiertos} onClick={() => setFiltrosAbiertos(!filtrosAbiertos)}>
                <IconoFiltros tamano={18} />
                <span>Filtros</span>
              </button>
              <label className="orden">
                <span>Ordenar por</span>
                <select value={filtros.orden} onChange={(evento) => cambiar({ orden: evento.target.value })}>
                  {ORDENES.map(([codigo, nombre]) => <option key={codigo} value={codigo}>{nombre}</option>)}
                </select>
              </label>
            </div>
          </div>

          {etiquetas.length > 0 && (
            <div className="etiquetas">
              {etiquetas.map((etiqueta) => (
                <button key={etiqueta.texto} type="button" className="etiqueta etiqueta-quitable"
                  onClick={() => cambiar(etiqueta.quitar)} aria-label={`Quitar filtro: ${etiqueta.texto}`}>
                  {etiqueta.texto} <span aria-hidden="true">×</span>
                </button>
              ))}
              <button type="button" className="enlace" onClick={() => setParametros({})}>Limpiar todo</button>
            </div>
          )}

          <MensajeError error={error} />

          {resultado?.totalElementos === 0 && (
            <div className="vacio">
              <h3>Ningún alojamiento coincide con esos filtros</h3>
              <p className="suave">Prueba con otras fechas, un precio más amplio o menos servicios.</p>
              <button type="button" className="boton boton-secundario" onClick={() => setParametros({})}>
                Limpiar filtros
              </button>
            </div>
          )}

          <div className={cargando && resultado ? 'rejilla rejilla-actualizando' : 'rejilla'}>
            {resultado
              ? resultado.contenido.map((alojamiento) => (
                <TarjetaAlojamiento key={alojamiento.id} alojamiento={alojamiento} fechas={fechas} />
              ))
              : cargando && Array.from({ length: 6 }, (_, indice) => <TarjetaCargando key={indice} />)}
          </div>

          {resultado && (
            <Paginacion actual={resultado.pagina + 1} total={resultado.totalPaginas} alCambiar={irAPagina} />
          )}
        </section>
      </main>
    </>
  );
}
