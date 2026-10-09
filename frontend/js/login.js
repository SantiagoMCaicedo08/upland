import { iniciarSesion } from './api.js';
import { guardarToken } from './sesion.js';
import { montarNav } from './nav.js';
import { mostrarError, ocultar } from './ui.js';

const AVISOS = new Map([
  ['sesion', 'Tu sesión expiró o dejó de ser válida. Inicia sesión de nuevo.'],
  ['registro', 'Cuenta creada. Ya puedes iniciar sesión.'],
]);

const formulario = document.getElementById('formulario');
const enviar = document.getElementById('enviar');
const error = document.getElementById('error');
const aviso = document.getElementById('aviso');

montarNav();

// Otras pantallas llegan aquí con ?motivo=... para explicar por qué se pide iniciar sesión.
const motivo = new URLSearchParams(window.location.search).get('motivo');
if (AVISOS.has(motivo)) {
  aviso.textContent = AVISOS.get(motivo);
  aviso.hidden = false;
}

formulario.addEventListener('submit', async (evento) => {
  evento.preventDefault();
  ocultar(error);
  enviar.disabled = true;
  const datos = new FormData(formulario);
  try {
    const { token } = await iniciarSesion(datos.get('email'), datos.get('password'));
    guardarToken(token);
    window.location.assign('panel.html');
  } catch (e) {
    mostrarError(error, e);
    enviar.disabled = false;
  }
});
