// Detalle público de un alojamiento. La dirección de la página es detalle.html?id=<uuid>.
// Verlo no exige sesión; reservar sí.
import { obtenerAlojamiento, obtenerOcupacion, crearReserva } from './api.js';
import { datosDelToken } from './sesion.js';
import { montarNav } from './nav.js';
import {
  contarNoches, describirCapacidad, describirNoches, formatearFecha, formatearPrecio, mostrarError, ocultar,
} from './ui.js';

const id = new URLSearchParams(window.location.search).get('id');
const formulario = document.getElementById('formulario');
const enviar = document.getElementById('enviar');
const errorReserva = document.getElementById('error-reserva');
const resumen = document.getElementById('resumen-reserva');

let precioNoche = 0;

function pintarAlojamiento(alojamiento) {
  document.title = `${alojamiento.titulo} · Upland`;
  document.getElementById('ciudad').textContent = alojamiento.ciudad;
  document.getElementById('titulo').textContent = alojamiento.titulo;
  document.getElementById('descripcion').textContent = alojamiento.descripcion;
  document.getElementById('direccion').textContent = alojamiento.direccion;
  document.getElementById('capacidad').textContent = describirCapacidad(alojamiento.capacidad);
  document.getElementById('precio').textContent = formatearPrecio(alojamiento.precioNoche);

  if (alojamiento.latitud !== null) {
    document.getElementById('coordenadas').textContent = `${alojamiento.latitud}, ${alojamiento.longitud}`;
    document.getElementById('coordenadas').hidden = false;
    document.getElementById('coordenadas-etiqueta').hidden = false;
  }
}

async function pintarOcupacion() {
  const rangos = await obtenerOcupacion(id);
  const items = rangos.map((rango) => {
    const item = document.createElement('li');
    item.textContent = `${formatearFecha(rango.fechaEntrada)} → ${formatearFecha(rango.fechaSalida)}`;
    return item;
  });
  document.getElementById('rangos-ocupados').replaceChildren(...items);
  document.getElementById('ocupacion').hidden = rangos.length === 0;
}

// Qué se le ofrece a quien mira: editar si es el dueño, reservar si tiene sesión, o la
// invitación a iniciar sesión. Es solo comodidad: el backend vuelve a comprobar todo.
function prepararAcciones(alojamiento) {
  const sesion = datosDelToken();
  if (!sesion) {
    document.getElementById('invitacion').hidden = false;
  } else if (sesion.id === alojamiento.anfitrionId) {
    const editar = document.getElementById('editar');
    editar.href = `alojamiento.html?id=${encodeURIComponent(alojamiento.id)}`;
    editar.hidden = false;
  } else {
    // Un <input type="date"> trabaja con 'AAAA-MM-DD' en hora local, igual que 'sv-SE'.
    const hoy = new Date().toLocaleDateString('sv-SE');
    formulario.elements.fechaEntrada.min = hoy;
    formulario.elements.fechaSalida.min = hoy;
    document.getElementById('seccion-reserva').hidden = false;
  }
}

// El total que se muestra es una vista previa. El que vale lo calcula el backend.
function actualizarResumen() {
  const entrada = formulario.elements.fechaEntrada.value;
  const salida = formulario.elements.fechaSalida.value;
  if (!entrada || !salida) {
    resumen.textContent = 'Elige las fechas para ver el total.';
    return;
  }
  const noches = contarNoches(entrada, salida);
  resumen.textContent = noches > 0
    ? `${describirNoches(noches)} × ${formatearPrecio(precioNoche)} = ${formatearPrecio(noches * precioNoche)}`
    : 'La salida debe ser posterior a la entrada.';
}

formulario.addEventListener('input', actualizarResumen);

formulario.addEventListener('submit', async (evento) => {
  evento.preventDefault();
  ocultar(errorReserva);
  enviar.disabled = true;
  try {
    await crearReserva(id, formulario.elements.fechaEntrada.value, formulario.elements.fechaSalida.value);
    window.location.assign('panel.html');
  } catch (e) {
    // Aquí cae el 409 cuando las fechas se cruzan con otra reserva.
    mostrarError(errorReserva, e);
    enviar.disabled = false;
    pintarOcupacion().catch(() => {});
  }
});

async function iniciar() {
  try {
    const alojamiento = await obtenerAlojamiento(id);
    precioNoche = alojamiento.precioNoche;
    pintarAlojamiento(alojamiento);
    prepararAcciones(alojamiento);
    await pintarOcupacion();
    document.getElementById('alojamiento').hidden = false;
  } catch (e) {
    mostrarError(document.getElementById('error'), e);
  }
}

montarNav();
iniciar();
