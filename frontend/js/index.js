// Catálogo público: no exige sesión y sus llamadas no llevan token. Los filtros viven en la
// URL (?ciudad=San%20Gil&huespedes=2): así una búsqueda se puede compartir, y el botón Atrás
// del navegador vuelve a la anterior.
import { listarAlojamientos, obtenerCiudades } from './api.js';
import { montarNav } from './nav.js';
import { describirCapacidad, formatearPrecio, mostrarError, ocultar } from './ui.js';

const TAMANO_PAGINA = 6;
const CAMPOS = ['ciudad', 'huespedes', 'precioMax', 'entrada', 'salida'];

const formulario = document.getElementById('filtros');
const error = document.getElementById('error');
const resumen = document.getElementById('resumen');
const catalogo = document.getElementById('catalogo');
const vacio = document.getElementById('vacio');
const anterior = document.getElementById('anterior');
const siguiente = document.getElementById('siguiente');
const paginaActual = document.getElementById('pagina-actual');
const plantilla = document.getElementById('plantilla-tarjeta');

let pagina = 0;

function leerFiltros() {
  const parametros = new URLSearchParams(window.location.search);
  const filtros = {};
  for (const campo of CAMPOS) filtros[campo] = parametros.get(campo) ?? '';
  return filtros;
}

function hayFiltros(filtros) {
  return CAMPOS.some((campo) => filtros[campo] !== '');
}

// Las fechas van juntas: si se llena una, el navegador exige la otra antes de buscar.
function ajustarFechas() {
  const { entrada, salida } = formulario.elements;
  const hoy = new Date().toLocaleDateString('sv-SE');
  entrada.min = hoy;
  salida.min = entrada.value || hoy;
  entrada.required = salida.value !== '';
  salida.required = entrada.value !== '';
}

function ponerEnFormulario(filtros) {
  for (const campo of CAMPOS) formulario.elements[campo].value = filtros[campo];
  ajustarFechas();
}

function crearTarjeta(alojamiento, filtros) {
  const tarjeta = plantilla.content.cloneNode(true);
  // Si se buscó por fechas, el detalle abre con ellas ya puestas en el formulario de reserva.
  const fechas = filtros.entrada && filtros.salida ? `&entrada=${filtros.entrada}&salida=${filtros.salida}` : '';
  tarjeta.querySelector('.tarjeta').href = `detalle.html?id=${encodeURIComponent(alojamiento.id)}${fechas}`;
  tarjeta.querySelector('.tarjeta-ciudad').textContent = alojamiento.ciudad;
  tarjeta.querySelector('.tarjeta-titulo').textContent = alojamiento.titulo;
  tarjeta.querySelector('.tarjeta-capacidad').textContent = describirCapacidad(alojamiento.capacidad);
  tarjeta.querySelector('.tarjeta-precio').textContent = `${formatearPrecio(alojamiento.precioNoche)} por noche`;
  return tarjeta;
}

async function cargar() {
  ocultar(error);
  const filtros = leerFiltros();
  try {
    const resultado = await listarAlojamientos({ ...filtros, pagina, tamano: TAMANO_PAGINA });
    catalogo.replaceChildren(...resultado.contenido.map((alojamiento) => crearTarjeta(alojamiento, filtros)));
    resumen.textContent = resultado.totalElementos === 1 ? '1 alojamiento' : `${resultado.totalElementos} alojamientos`;
    vacio.textContent = hayFiltros(filtros)
      ? 'Ningún alojamiento coincide con esos filtros. Prueba con otros o pulsa Limpiar.'
      : 'Todavía no hay alojamientos publicados.';
    vacio.hidden = resultado.totalElementos > 0;
    paginaActual.textContent = `Página ${resultado.pagina + 1} de ${Math.max(resultado.totalPaginas, 1)}`;
    anterior.disabled = resultado.pagina === 0;
    siguiente.disabled = resultado.pagina >= resultado.totalPaginas - 1;
  } catch (e) {
    mostrarError(error, e);
  }
}

// Buscar escribe los filtros en la URL con pushState (sin recargar la página) y vuelve a
// la primera página de resultados.
function buscar(filtros) {
  const parametros = new URLSearchParams();
  for (const campo of CAMPOS) {
    if (filtros[campo] !== '') parametros.set(campo, filtros[campo]);
  }
  const consulta = parametros.toString();
  history.pushState(null, '', consulta ? `?${consulta}` : window.location.pathname);
  pagina = 0;
  cargar();
}

formulario.addEventListener('submit', (evento) => {
  evento.preventDefault();
  const filtros = {};
  for (const campo of CAMPOS) filtros[campo] = formulario.elements[campo].value.trim();
  buscar(filtros);
});

formulario.addEventListener('input', ajustarFechas);

document.getElementById('limpiar').addEventListener('click', () => {
  const vacios = Object.fromEntries(CAMPOS.map((campo) => [campo, '']));
  ponerEnFormulario(vacios);
  buscar(vacios);
});

// Atrás y Adelante cambian la URL sin recargar: hay que volver a leerla.
window.addEventListener('popstate', () => {
  ponerEnFormulario(leerFiltros());
  pagina = 0;
  cargar();
});

anterior.addEventListener('click', () => {
  pagina -= 1;
  cargar();
});

siguiente.addEventListener('click', () => {
  pagina += 1;
  cargar();
});

async function cargarCiudades() {
  try {
    const ciudades = await obtenerCiudades();
    const select = formulario.elements.ciudad;
    for (const ciudad of ciudades) {
      const opcion = document.createElement('option');
      opcion.value = ciudad;
      opcion.textContent = ciudad;
      select.append(opcion);
    }
    // La URL pudo traer una ciudad antes de que existieran las opciones para mostrarla.
    select.value = leerFiltros().ciudad;
  } catch {
    // Sin la lista de ciudades el catálogo sigue funcionando; solo ese filtro queda vacío.
  }
}

montarNav();
ponerEnFormulario(leerFiltros());
cargarCiudades();
cargar();
