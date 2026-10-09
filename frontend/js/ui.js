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

const NOMBRES_TIPO = {
  ALOJAMIENTO_ENTERO: 'Alojamiento entero',
  HABITACION_PRIVADA: 'Habitación privada',
  HABITACION_COMPARTIDA: 'Habitación compartida',
  HOTEL: 'Hotel',
};

export function describirTipo(tipo) {
  return NOMBRES_TIPO[tipo] ?? tipo;
}

// "Chapinero, Bogotá" cuando hay zona; solo la ciudad cuando no.
export function describirUbicacion(alojamiento) {
  return alojamiento.zona ? `${alojamiento.zona}, ${alojamiento.ciudad}` : alojamiento.ciudad;
}

// "4 huéspedes · 2 habitaciones · 3 camas", omitiendo lo que el alojamiento no tenga registrado.
export function describirEspacio(alojamiento) {
  const partes = [describirCapacidad(alojamiento.capacidad)];
  if (alojamiento.habitaciones) {
    partes.push(alojamiento.habitaciones === 1 ? '1 habitación' : `${alojamiento.habitaciones} habitaciones`);
  }
  if (alojamiento.camas) {
    partes.push(alojamiento.camas === 1 ? '1 cama' : `${alojamiento.camas} camas`);
  }
  return partes.join(' · ');
}

export function describirCalificacion(alojamiento) {
  return `★ ${alojamiento.calificacion.toFixed(2)} (${alojamiento.numeroResenas})`;
}

// Las fotos del dataset están alojadas fuera de Upland. Si una deja de existir o no hay
// foto, se oculta la imagen y queda el fondo de color del contenedor.
export function ponerFoto(imagen, fotoUrl, ancho) {
  if (!fotoUrl) {
    imagen.hidden = true;
    return;
  }
  imagen.addEventListener('error', () => { imagen.hidden = true; }, { once: true });
  // im_w le pide al servidor de imágenes una versión reducida en vez del original.
  imagen.src = `${fotoUrl}?im_w=${ancho}`;
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
