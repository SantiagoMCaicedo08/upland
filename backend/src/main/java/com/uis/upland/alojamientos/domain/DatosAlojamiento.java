package com.uis.upland.alojamientos.domain;

import java.math.BigDecimal;

/** Lo que un anfitrión puede escribir de un alojamiento, tanto al crearlo como al editarlo. */
public record DatosAlojamiento(String titulo, String descripcion, String ciudad, String direccion,
		Double latitud, Double longitud, int capacidad, BigDecimal precioNoche) {
}
