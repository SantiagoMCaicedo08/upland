package com.uis.upland.alojamientos.api;

import java.math.BigDecimal;
import java.util.List;

import com.uis.upland.alojamientos.domain.DatosAlojamiento;
import com.uis.upland.alojamientos.domain.TipoAlojamiento;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

/**
 * Cuerpo de POST y PUT. No trae anfitrionId: el dueño sale del token, nunca del cuerpo. Las
 * reglas repiten los CHECK de la tabla para responder 400 con un mensaje claro en vez de
 * dejar que la base rechace la fila.
 */
public record AlojamientoRequest(
		@NotBlank(message = "El título es obligatorio")
		@Size(max = 150, message = "El título admite máximo 150 caracteres")
		String titulo,

		@NotBlank(message = "La descripción es obligatoria")
		@Size(max = 5000, message = "La descripción admite máximo 5000 caracteres")
		String descripcion,

		@NotBlank(message = "La ciudad es obligatoria")
		@Size(max = 100, message = "La ciudad admite máximo 100 caracteres")
		String ciudad,

		@Size(max = 100, message = "La zona admite máximo 100 caracteres")
		String zona,

		@NotBlank(message = "La dirección es obligatoria")
		@Size(max = 255, message = "La dirección admite máximo 255 caracteres")
		String direccion,

		@DecimalMin(value = "-90", message = "La latitud debe estar entre -90 y 90")
		@DecimalMax(value = "90", message = "La latitud debe estar entre -90 y 90")
		Double latitud,

		@DecimalMin(value = "-180", message = "La longitud debe estar entre -180 y 180")
		@DecimalMax(value = "180", message = "La longitud debe estar entre -180 y 180")
		Double longitud,

		/** Opcional. Si no llega, se registra como alojamiento entero. */
		TipoAlojamiento tipo,

		@NotNull(message = "La capacidad es obligatoria")
		@Positive(message = "La capacidad debe ser mayor que cero")
		Integer capacidad,

		@PositiveOrZero(message = "Las habitaciones no pueden ser negativas")
		Integer habitaciones,

		@PositiveOrZero(message = "Las camas no pueden ser negativas")
		Integer camas,

		@PositiveOrZero(message = "Los baños no pueden ser negativos")
		@Digits(integer = 2, fraction = 1, message = "Los baños admiten un decimal, por ejemplo 1.5")
		BigDecimal banos,

		@Size(max = 30, message = "Se admiten máximo 30 servicios")
		List<@NotBlank(message = "Un servicio no puede estar vacío") @Size(max = 60, message = "Cada servicio admite máximo 60 caracteres") String> servicios,

		@NotNull(message = "El precio por noche es obligatorio")
		@Positive(message = "El precio por noche debe ser mayor que cero")
		@Digits(integer = 10, fraction = 2, message = "El precio admite máximo 10 enteros y 2 decimales")
		BigDecimal precioNoche,

		@Size(max = 500, message = "La dirección de la foto admite máximo 500 caracteres")
		// El grupo es opcional para que un texto vacío ("sin foto") también sea válido.
		@Pattern(regexp = "(https?://.+)?", message = "La foto debe ser una dirección web que empiece por http:// o https://")
		String fotoUrl) {

	@AssertTrue(message = "La latitud y la longitud se envían juntas o no se envía ninguna")
	public boolean isCoordenadasCompletas() {
		return (latitud == null) == (longitud == null);
	}

	public DatosAlojamiento toDatos() {
		return new DatosAlojamiento(titulo.trim(), descripcion.trim(), ciudad.trim(), vacioANulo(zona),
				direccion.trim(), latitud, longitud, tipo == null ? TipoAlojamiento.ALOJAMIENTO_ENTERO : tipo,
				capacidad, habitaciones, camas, banos,
				servicios == null ? List.of() : servicios.stream().map(String::trim).distinct().toList(),
				precioNoche, vacioANulo(fotoUrl));
	}

	private static String vacioANulo(String texto) {
		return texto == null || texto.isBlank() ? null : texto.trim();
	}

}
