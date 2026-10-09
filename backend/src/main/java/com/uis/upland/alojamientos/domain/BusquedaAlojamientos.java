package com.uis.upland.alojamientos.domain;

import com.uis.upland.shared.Pagina;

/**
 * Consulta del catálogo público. Es una interfaz para que la fase 2 agregue una
 * implementación sobre MongoDB sin tocar el servicio ni el controller. Hoy la única
 * implementación lee de PostgreSQL.
 */
public interface BusquedaAlojamientos {

	Pagina<ResumenAlojamiento> listarActivos(int pagina, int tamano);

}
