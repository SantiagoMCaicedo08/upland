package com.uis.upland.alojamientos.domain;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Lo que muestra una tarjeta del catálogo, y lo que otros módulos reciben cuando preguntan
 * por un alojamiento. Es un tipo de lectura sin anotaciones de JPA: la entidad no sale del
 * módulo, y cualquier implementación de {@link BusquedaAlojamientos} puede construirlo.
 */
public record ResumenAlojamiento(UUID id, UUID anfitrionId, String titulo, String ciudad, int capacidad,
		BigDecimal precioNoche) {

	public static ResumenAlojamiento from(Alojamiento alojamiento) {
		return new ResumenAlojamiento(alojamiento.getId(), alojamiento.getAnfitrionId(), alojamiento.getTitulo(),
				alojamiento.getCiudad(), alojamiento.getCapacidad(), alojamiento.getPrecioNoche());
	}

}
