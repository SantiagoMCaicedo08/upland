// Funciones puras de presentación: reciben datos y devuelven texto. No dependen de React.

const formatoPrecio = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
});
const formatoNumero = new Intl.NumberFormat('es-CO');
const formatoFecha = new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'short', year: 'numeric' });

export function formatearPrecio(valor) {
  return formatoPrecio.format(valor);
}

export function formatearNumero(valor) {
  return formatoNumero.format(valor);
}

// "1 noche" o "3 noches".
export function contar(cantidad, singular, plural) {
  return `${formatearNumero(cantidad)} ${cantidad === 1 ? singular : plural}`;
}

export const TIPOS = [
  ['ALOJAMIENTO_ENTERO', 'Alojamiento entero'],
  ['HABITACION_PRIVADA', 'Habitación privada'],
  ['HABITACION_COMPARTIDA', 'Habitación compartida'],
  ['HOTEL', 'Hotel'],
];

export function describirTipo(tipo) {
  return TIPOS.find(([codigo]) => codigo === tipo)?.[1] ?? tipo;
}

// "Chapinero, Bogotá" cuando hay zona; solo la ciudad cuando no.
export function describirUbicacion(alojamiento) {
  return alojamiento.zona ? `${alojamiento.zona}, ${alojamiento.ciudad}` : alojamiento.ciudad;
}

// ["4 huéspedes", "2 habitaciones", "3 camas"], omitiendo lo que no esté registrado.
export function describirEspacio(alojamiento) {
  const partes = [contar(alojamiento.capacidad, 'huésped', 'huéspedes')];
  if (alojamiento.habitaciones) partes.push(contar(alojamiento.habitaciones, 'habitación', 'habitaciones'));
  if (alojamiento.camas) partes.push(contar(alojamiento.camas, 'cama', 'camas'));
  if (alojamiento.banos) partes.push(`${alojamiento.banos} ${alojamiento.banos === 1 ? 'baño' : 'baños'}`);
  return partes;
}

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

// La fecha de hoy, o de dentro de unos días, como 'AAAA-MM-DD' en hora local. El formato
// 'sv-SE' produce justo ese texto, que es el que entiende un <input type="date">.
export function fechaLocal(diasDesdeHoy = 0) {
  const fecha = new Date();
  fecha.setDate(fecha.getDate() + diasDesdeHoy);
  return fecha.toLocaleDateString('sv-SE');
}

export function diaSiguiente(fecha) {
  const siguiente = new Date(`${fecha}T00:00:00`);
  siguiente.setDate(siguiente.getDate() + 1);
  return siguiente.toLocaleDateString('sv-SE');
}

// Las fotos del dataset están en el servidor de imágenes de Airbnb, y la dirección que trae
// el dataset es la del archivo original: entre 0,4 y 14 MB por foto. Ese servidor entrega
// una versión reducida si la ruta empieza por /im/ y se le pide un ancho (im_w): la misma
// foto a 480 píxeles pesa unos 20 KB. Sin esto, una página del catálogo descargaba 35 MB.
// Los anchos que acepta son fijos: 240, 320, 480, 720, 960 y 1200.
// Para cualquier otra dirección (una foto que pegó un anfitrión) se usa la foto tal cual.
export function urlDeFoto(url, ancho) {
  try {
    const direccion = new URL(url);
    if (!direccion.hostname.includes('muscache')) return url;
    if (!direccion.pathname.startsWith('/im/')) direccion.pathname = `/im${direccion.pathname}`;
    direccion.searchParams.set('im_w', ancho);
    return direccion.toString();
  } catch {
    return url;
  }
}
