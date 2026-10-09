package com.uis.upland.alojamientos.domain;

import java.math.BigDecimal;
import java.util.List;

/** Lo que un anfitrión puede escribir de un alojamiento, tanto al crearlo como al editarlo. */
public record DatosAlojamiento(String titulo, String descripcion, String ciudad, String zona, String direccion,
		Double latitud, Double longitud, TipoAlojamiento tipo, int capacidad, Integer habitaciones, Integer camas,
		BigDecimal banos, List<String> servicios, BigDecimal precioNoche, String fotoUrl) {
}
