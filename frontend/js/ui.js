// Utilidades de presentación que comparten varias pantallas.

const formatoPrecio = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
});

export function formatearPrecio(valor) {
  return formatoPrecio.format(valor);
}

export function describirCapacidad(capacidad) {
  return capacidad === 1 ? '1 huésped' : `${capacidad} huéspedes`;
}

export function describirNoches(noches) {
  return noches === 1 ? '1 noche' : `${noches} noches`;
}

const formatoFecha = new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'short', year: 'numeric' });

// Recibe 'AAAA-MM-DD'. Se le agrega la hora local porque new Date('2027-03-10') se
// interpreta en UTC y en Colombia (UTC-5) se mostraría como el 9 de marzo.
export function formatearFecha(fecha) {
  return formatoFecha.format(new Date(`${fecha}T00:00:00`));
}

// Noches entre dos fechas 'AAAA-MM-DD'. Date.UTC evita que un cambio de hora altere la cuenta.
export function contarNoches(entrada, salida) {
  const dia = (texto) => {
    const [anio, mes, diaDelMes] = texto.split('-').map(Number);
    return Date.UTC(anio, mes - 1, diaDelMes);
  };
  return Math.round((dia(salida) - dia(entrada)) / 86400000);
}

// Pinta un ErrorApi en un contenedor. El mensaje y los detalles vienen del servidor, así
// que entran con textContent: si trajeran HTML se mostraría como texto, no se ejecutaría.
export function mostrarError(contenedor, error) {
  const mensaje = document.createElement('p');
  mensaje.textContent = error.message;
  contenedor.replaceChildren(mensaje);

  if (error.detalles?.length) {
    const lista = document.createElement('ul');
    for (const detalle of error.detalles) {
      const item = document.createElement('li');
      item.textContent = detalle;
      lista.append(item);
    }
    contenedor.append(lista);
  }
  contenedor.hidden = false;
}

export function ocultar(elemento) {
  elemento.hidden = true;
  elemento.replaceChildren();
}
