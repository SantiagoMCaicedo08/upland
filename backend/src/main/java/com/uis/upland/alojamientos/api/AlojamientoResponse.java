package com.uis.upland.alojamientos.api;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

import com.uis.upland.alojamientos.domain.Alojamiento;
import com.uis.upland.alojamientos.domain.TipoAlojamiento;

public record AlojamientoResponse(UUID id, UUID anfitrionId, String titulo, String descripcion, String ciudad,
		String zona, String direccion, Double latitud, Double longitud, TipoAlojamiento tipo, int capacidad,
		Integer habitaciones, Integer camas, BigDecimal banos, List<String> servicios, BigDecimal precioNoche,
		String fotoUrl, BigDecimal calificacion, int numeroResenas, Instant fechaCreacion) {

	public static AlojamientoResponse from(Alojamiento alojamiento) {
		return new AlojamientoResponse(alojamiento.getId(), alojamiento.getAnfitrionId(), alojamiento.getTitulo(),
				alojamiento.getDescripcion(), alojamiento.getCiudad(), alojamiento.getZona(),
				alojamiento.getDireccion(), alojamiento.getLatitud(), alojamiento.getLongitud(),
				alojamiento.getTipo(), alojamiento.getCapacidad(), alojamiento.getHabitaciones(),
				alojamiento.getCamas(), alojamiento.getBanos(), alojamiento.getServicios(),
				alojamiento.getPrecioNoche(), alojamiento.getFotoUrl(), alojamiento.getCalificacion(),
				alojamiento.getNumeroResenas(), alojamiento.getFechaCreacion());
	}

}
