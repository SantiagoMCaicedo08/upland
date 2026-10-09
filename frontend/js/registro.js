import { registrar } from './api.js';
import { montarNav } from './nav.js';
import { mostrarError, ocultar } from './ui.js';

const formulario = document.getElementById('formulario');
const enviar = document.getElementById('enviar');
const error = document.getElementById('error');

montarNav();

formulario.addEventListener('submit', async (evento) => {
  evento.preventDefault();
  ocultar(error);
  enviar.disabled = true;
  const datos = new FormData(formulario);
  try {
    await registrar({
      nombre: datos.get('nombre'),
      email: datos.get('email'),
      password: datos.get('password'),
      rol: datos.get('rol'),
    });
    // El registro no devuelve token: la cuenta nueva pasa por el login como cualquier otra.
    window.location.assign('login.html?motivo=registro');
  } catch (e) {
    mostrarError(error, e);
    enviar.disabled = false;
  }
});
