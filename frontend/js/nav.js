// Barra de navegación común. Cada página tiene un <nav id="nav"> vacío y llama a montarNav().
import { haySesion, cerrarSesion } from './sesion.js';

function enlace(href, texto, clase) {
  const a = document.createElement('a');
  a.href = href;
  a.textContent = texto;
  if (clase) a.className = clase;
  return a;
}

export function montarNav() {
  const opciones = document.createElement('div');
  opciones.className = 'nav-opciones';

  if (haySesion()) {
    const salir = document.createElement('button');
    salir.type = 'button';
    salir.id = 'cerrar-sesion';
    salir.className = 'boton boton-secundario';
    salir.textContent = 'Cerrar sesión';
    salir.addEventListener('click', () => {
      cerrarSesion();
      window.location.assign('index.html');
    });
    opciones.append(enlace('panel.html', 'Mi panel'), salir);
  } else {
    opciones.append(enlace('login.html', 'Iniciar sesión'), enlace('registro.html', 'Registrarse', 'boton'));
  }

  document.getElementById('nav').replaceChildren(enlace('index.html', 'Upland', 'marca'), opciones);
}
