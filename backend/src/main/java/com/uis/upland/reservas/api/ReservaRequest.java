package com.uis.upland.reservas.api;

import java.time.LocalDate;
import java.util.UUID;

import jakarta.validation.constraints.NotNull;

/** No trae huésped ni precio: el huésped sale del token y el precio del alojamiento. */
public record ReservaRequest(
		@NotNull(message = "El alojamiento es obligatorio")
		UUID alojamientoId,

		@NotNull(message = "La fecha de entrada es obligatoria")
		LocalDate fechaEntrada,

		@NotNull(message = "La fecha de salida es obligatoria")
		LocalDate fechaSalida) {
}
