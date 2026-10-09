package com.uis.upland.alojamientos.api;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

import com.uis.upland.alojamientos.domain.Alojamiento;

public record AlojamientoResponse(UUID id, UUID anfitrionId, String titulo, String descripcion, String ciudad,
		String direccion, Double latitud, Double longitud, int capacidad, BigDecimal precioNoche,
		Instant fechaCreacion) {

	public static AlojamientoResponse from(Alojamiento alojamiento) {
		return new AlojamientoResponse(alojamiento.getId(), alojamiento.getAnfitrionId(), alojamiento.getTitulo(),
				alojamiento.getDescripcion(), alojamiento.getCiudad(), alojamiento.getDireccion(),
				alojamiento.getLatitud(), alojamiento.getLongitud(), alojamiento.getCapacidad(),
				alojamiento.getPrecioNoche(), alojamiento.getFechaCreacion());
	}

}
