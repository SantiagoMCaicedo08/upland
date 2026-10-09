// Catálogo público: no exige sesión y sus llamadas no llevan token.
import { listarAlojamientos } from './api.js';
import { montarNav } from './nav.js';
import {
  describirCalificacion, describirEspacio, describirUbicacion, formatearPrecio, mostrarError, ocultar, ponerFoto,
} from './ui.js';

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
  tarjeta.querySelector('.tarjeta-ciudad').textContent = describirUbicacion(alojamiento);
  tarjeta.querySelector('.tarjeta-titulo').textContent = alojamiento.titulo;
  tarjeta.querySelector('.tarjeta-capacidad').textContent = describirEspacio(alojamiento);
  ponerFoto(tarjeta.querySelector('.tarjeta-imagen'), alojamiento.fotoUrl, 480);

  if (alojamiento.calificacion !== null) {
    const calificacion = tarjeta.querySelector('.tarjeta-calificacion');
    calificacion.textContent = describirCalificacion(alojamiento);
    calificacion.hidden = false;
  }
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
