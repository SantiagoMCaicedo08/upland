package com.uis.upland.alojamientos.domain;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * Filtros del catálogo. Todo es opcional: un campo en null (o la lista vacía) significa
 * "sin filtrar por esto". Las fechas van juntas y piden alojamientos libres en ese rango.
 */
public record CriteriosBusqueda(String ciudad, String zona, TipoAlojamiento tipo, BigDecimal precioMin,
		BigDecimal precioMax, Integer huespedes, Integer habitaciones, List<String> servicios, LocalDate entrada,
		LocalDate salida, OrdenBusqueda orden) {
}
