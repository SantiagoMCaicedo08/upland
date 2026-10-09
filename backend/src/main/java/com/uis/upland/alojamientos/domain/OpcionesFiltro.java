package com.uis.upland.alojamientos.domain;

import java.math.BigDecimal;
import java.util.List;

/**
 * Los valores entre los que se puede filtrar, sacados de los datos reales. El frontend arma
 * con esto sus listas en vez de tener ciudades o servicios escritos a mano.
 */
public record OpcionesFiltro(List<Ciudad> ciudades, List<String> servicios, BigDecimal precioMinimo,
		BigDecimal precioMaximo) {

	public record Ciudad(String nombre, List<String> zonas) {
	}

}
