// Formulario protegido. Sin ?id crea un alojamiento; con ?id=<uuid> edita el existente.
import { obtenerAlojamiento, crearAlojamiento, actualizarAlojamiento } from './api.js';
import { exigirSesion } from './sesion.js';
import { montarNav } from './nav.js';
import { mostrarError, ocultar } from './ui.js';

const CAMPOS_TEXTO = ['titulo', 'descripcion', 'ciudad', 'direccion'];
const CAMPOS_NUMERO = ['capacidad', 'precioNoche', 'latitud', 'longitud'];

const id = new URLSearchParams(window.location.search).get('id');
const formulario = document.getElementById('formulario');
const enviar = document.getElementById('enviar');
const error = document.getElementById('error');

// Un campo numérico vacío viaja como null, no como 0: así el backend distingue
// "sin coordenadas" de "coordenadas 0, 0".
function leerFormulario() {
  const datos = {};
  for (const campo of CAMPOS_TEXTO) {
    datos[campo] = formulario.elements[campo].value;
  }
  for (const campo of CAMPOS_NUMERO) {
    const texto = formulario.elements[campo].value.trim();
    datos[campo] = texto === '' ? null : Number(texto);
  }
  return datos;
}

async function prepararEdicion() {
  document.getElementById('encabezado').textContent = 'Editar alojamiento';
  document.title = 'Editar alojamiento · Upland';
  enviar.textContent = 'Guardar cambios';
  try {
    const alojamiento = await obtenerAlojamiento(id);
    for (const campo of [...CAMPOS_TEXTO, ...CAMPOS_NUMERO]) {
      formulario.elements[campo].value = alojamiento[campo] ?? '';
    }
  } catch (e) {
    mostrarError(error, e);
    formulario.hidden = true;
  }
}

formulario.addEventListener('submit', async (evento) => {
  evento.preventDefault();
  ocultar(error);
  enviar.disabled = true;
  try {
    if (id) {
      await actualizarAlojamiento(id, leerFormulario());
    } else {
      await crearAlojamiento(leerFormulario());
    }
    window.location.assign('panel.html');
  } catch (e) {
    // Aquí caen el 400 de validación y el 403 de quien intenta editar un alojamiento ajeno.
    mostrarError(error, e);
    enviar.disabled = false;
  }
});

if (exigirSesion()) {
  montarNav();
  if (id) prepararEdicion();
}
