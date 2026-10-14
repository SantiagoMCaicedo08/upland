package com.uis.upland.alojamientos.domain;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Filtros del catálogo. Todo es opcional: un campo en null significa "sin filtrar por esto".
 * Las fechas van juntas y piden alojamientos libres en ese rango.
 */
public record CriteriosBusqueda(String ciudad, Integer huespedes, BigDecimal precioMax, LocalDate entrada,
		LocalDate salida) {
}
