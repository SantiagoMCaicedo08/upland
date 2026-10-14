package com.uis.upland.alojamientos.domain;

import java.util.List;

import com.uis.upland.shared.Pagina;

/**
 * Consulta del catálogo público. Es una interfaz para que la fase 2 agregue una
 * implementación sobre MongoDB sin tocar el servicio ni el controller. Hoy la única
 * implementación lee de PostgreSQL.
 */
public interface BusquedaAlojamientos {

	Pagina<ResumenAlojamiento> buscar(CriteriosBusqueda criterios, int pagina, int tamano);

	/** Ciudades que tienen al menos un alojamiento activo, para ofrecerlas en el filtro. */
	List<String> ciudades();

}
