// Catálogo público: no exige sesión y sus llamadas no llevan token.
import { listarAlojamientos } from './api.js';
import { montarNav } from './nav.js';
import { describirCapacidad, formatearPrecio, mostrarError, ocultar } from './ui.js';

const TAMANO_PAGINA = 6;

const error = document.getElementById('error');
const catalogo = document.getElementById('catalogo');
const vacio = document.getElementById('vacio');
const anterior = document.getElementById('anterior');
const siguiente = document.getElementById('siguiente');
const paginaActual = document.getElementById('pagina-actual');
const plantilla = document.getElementById('plantilla-tarjeta');

let pagina = 0;

function crearTarjeta(alojamiento) {
  const tarjeta = plantilla.content.cloneNode(true);
  tarjeta.querySelector('.tarjeta').href = `detalle.html?id=${encodeURIComponent(alojamiento.id)}`;
  tarjeta.querySelector('.tarjeta-ciudad').textContent = alojamiento.ciudad;
  tarjeta.querySelector('.tarjeta-titulo').textContent = alojamiento.titulo;
  tarjeta.querySelector('.tarjeta-capacidad').textContent = describirCapacidad(alojamiento.capacidad);
  tarjeta.querySelector('.tarjeta-precio').textContent = `${formatearPrecio(alojamiento.precioNoche)} por noche`;
  return tarjeta;
}

async function cargar() {
  ocultar(error);
  try {
    const resultado = await listarAlojamientos(pagina, TAMANO_PAGINA);
    catalogo.replaceChildren(...resultado.contenido.map(crearTarjeta));
    vacio.hidden = resultado.totalElementos > 0;
    paginaActual.textContent = `Página ${resultado.pagina + 1} de ${Math.max(resultado.totalPaginas, 1)}`;
    anterior.disabled = resultado.pagina === 0;
    siguiente.disabled = resultado.pagina >= resultado.totalPaginas - 1;
  } catch (e) {
    mostrarError(error, e);
  }
}

anterior.addEventListener('click', () => {
  pagina -= 1;
  cargar();
});

siguiente.addEventListener('click', () => {
  pagina += 1;
  cargar();
});

montarNav();
cargar();
