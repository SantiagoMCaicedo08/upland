package com.uis.upland.alojamientos.infra;

import java.math.BigDecimal;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Component;

import com.uis.upland.alojamientos.domain.BusquedaAlojamientos;
import com.uis.upland.alojamientos.domain.CriteriosBusqueda;
import com.uis.upland.alojamientos.domain.OpcionesFiltro;
import com.uis.upland.alojamientos.domain.OrdenBusqueda;
import com.uis.upland.alojamientos.domain.ResumenAlojamiento;
import com.uis.upland.alojamientos.domain.TipoAlojamiento;
import com.uis.upland.shared.Pagina;

/**
 * Búsqueda del catálogo sobre PostgreSQL, escrita en SQL y no con JPA por dos razones: los
 * filtros son opcionales y la consulta se arma según cuáles llegan, y así el SQL que se
 * ejecuta es exactamente el que se mide con EXPLAIN ANALYZE (docs/MEDICION-BUSQUEDA.md).
 *
 * Excepción deliberada a los límites entre módulos: el filtro por fechas lee la tabla
 * reservas, que pertenece a otro módulo. Una búsqueda es un modelo de lectura que cruza
 * datos de varios módulos, y esa necesidad es justo lo que en la fase 2 resuelve la
 * proyección en MongoDB. El cruce queda encerrado en esta clase, detrás de la interfaz.
 */
@Component
public class BusquedaAlojamientosPostgres implements BusquedaAlojamientos {

	private static final String COLUMNAS = """
			a.id, a.anfitrion_id, a.titulo, a.ciudad, a.zona, a.tipo, a.capacidad, a.habitaciones, a.camas,
			a.precio_noche, a.foto_url, a.calificacion, a.numero_resenas""";

	// Mismo criterio que la restricción ex_reservas_sin_solape: solo ocupan fechas las
	// reservas confirmadas, y los rangos son [entrada, salida).
	private static final String LIBRE_EN_FECHAS = """
			NOT EXISTS (
			    SELECT 1 FROM reservas r
			    WHERE r.alojamiento_id = a.id
			      AND r.estado = 'CONFIRMADA'
			      AND daterange(r.fecha_entrada, r.fecha_salida) && daterange(:entrada, :salida))""";

	private final NamedParameterJdbcTemplate jdbc;

	public BusquedaAlojamientosPostgres(NamedParameterJdbcTemplate jdbc) {
		this.jdbc = jdbc;
	}

	@Override
	public Pagina<ResumenAlojamiento> buscar(CriteriosBusqueda criterios, int pagina, int tamano) {
		MapSqlParameterSource parametros = new MapSqlParameterSource();
		String condiciones = condiciones(criterios, parametros);

		Long total = jdbc.queryForObject("SELECT count(*) FROM alojamientos a WHERE " + condiciones, parametros,
				Long.class);

		parametros.addValue("tamano", tamano).addValue("desplazamiento", (long) pagina * tamano);
		List<ResumenAlojamiento> contenido = jdbc.query(
				"SELECT " + COLUMNAS + " FROM alojamientos a WHERE " + condiciones + " ORDER BY "
						+ orden(criterios.orden()) + " LIMIT :tamano OFFSET :desplazamiento",
				parametros, (fila, numero) -> resumen(fila));

		int totalPaginas = (int) Math.ceil((double) total / tamano);
		return new Pagina<>(contenido, pagina, tamano, total, totalPaginas);
	}

	/**
	 * Arma el WHERE solo con los filtros presentes. Los valores viajan siempre como
	 * parámetros (:nombre), nunca concatenados, así que no hay inyección de SQL posible.
	 */
	private String condiciones(CriteriosBusqueda criterios, MapSqlParameterSource parametros) {
		List<String> condiciones = new ArrayList<>();
		condiciones.add("a.activo");

		if (criterios.ciudad() != null) {
			condiciones.add("a.ciudad = :ciudad");
			parametros.addValue("ciudad", criterios.ciudad());
		}
		if (criterios.zona() != null) {
			condiciones.add("a.zona = :zona");
			parametros.addValue("zona", criterios.zona());
		}
		if (criterios.tipo() != null) {
			condiciones.add("a.tipo = :tipo");
			parametros.addValue("tipo", criterios.tipo().name());
		}
		if (criterios.precioMin() != null) {
			condiciones.add("a.precio_noche >= :precioMin");
			parametros.addValue("precioMin", criterios.precioMin());
		}
		if (criterios.precioMax() != null) {
			condiciones.add("a.precio_noche <= :precioMax");
			parametros.addValue("precioMax", criterios.precioMax());
		}
		if (criterios.huespedes() != null) {
			condiciones.add("a.capacidad >= :huespedes");
			parametros.addValue("huespedes", criterios.huespedes());
		}
		if (criterios.habitaciones() != null) {
			condiciones.add("a.habitaciones >= :habitaciones");
			parametros.addValue("habitaciones", criterios.habitaciones());
		}
		if (!criterios.servicios().isEmpty()) {
			// @> es "contiene": el alojamiento debe tener todos los servicios pedidos. La
			// lista se expande a ARRAY[?, ?, ...], un parámetro por servicio.
			condiciones.add("a.servicios @> ARRAY[:servicios]::text[]");
			parametros.addValue("servicios", criterios.servicios());
		}
		if (criterios.entrada() != null && criterios.salida() != null) {
			condiciones.add(LIBRE_EN_FECHAS);
			parametros.addValue("entrada", criterios.entrada()).addValue("salida", criterios.salida());
		}
		return String.join(" AND ", condiciones);
	}

	/**
	 * El ORDER BY sale de este switch, no del texto de la petición. El desempate por id
	 * mantiene el orden estable entre páginas cuando varias filas empatan.
	 */
	private String orden(OrdenBusqueda orden) {
		return switch (orden) {
			case POPULARES -> "a.numero_resenas DESC, a.id";
			case MEJOR_CALIFICADOS -> "a.calificacion DESC NULLS LAST, a.numero_resenas DESC, a.id";
			case PRECIO_ASCENDENTE -> "a.precio_noche ASC, a.id";
			case PRECIO_DESCENDENTE -> "a.precio_noche DESC, a.id";
			case RECIENTES -> "a.fecha_creacion DESC, a.id";
		};
	}

	private ResumenAlojamiento resumen(ResultSet fila) throws SQLException {
		return new ResumenAlojamiento(fila.getObject("id", UUID.class), fila.getObject("anfitrion_id", UUID.class),
				fila.getString("titulo"), fila.getString("ciudad"), fila.getString("zona"),
				TipoAlojamiento.valueOf(fila.getString("tipo")), fila.getInt("capacidad"),
				fila.getObject("habitaciones", Integer.class), fila.getObject("camas", Integer.class),
				fila.getBigDecimal("precio_noche"), fila.getString("foto_url"), fila.getBigDecimal("calificacion"),
				fila.getInt("numero_resenas"));
	}

	@Override
	public OpcionesFiltro opcionesDeFiltro() {
		// LinkedHashMap conserva el orden alfabético en que llegan las ciudades.
		Map<String, List<String>> zonasPorCiudad = new LinkedHashMap<>();
		jdbc.query("""
				SELECT ciudad, zona FROM alojamientos
				WHERE activo
				GROUP BY ciudad, zona
				ORDER BY ciudad, zona""", fila -> {
			List<String> zonas = zonasPorCiudad.computeIfAbsent(fila.getString("ciudad"), c -> new ArrayList<>());
			if (fila.getString("zona") != null) {
				zonas.add(fila.getString("zona"));
			}
		});
		List<OpcionesFiltro.Ciudad> ciudades = zonasPorCiudad.entrySet().stream()
				.map(entrada -> new OpcionesFiltro.Ciudad(entrada.getKey(), entrada.getValue()))
				.toList();

		// Del más común al menos común, que es el orden en que conviene ofrecerlos.
		List<String> servicios = jdbc.getJdbcTemplate().queryForList("""
				SELECT servicio FROM alojamientos a, unnest(a.servicios) AS servicio
				WHERE a.activo
				GROUP BY servicio
				ORDER BY count(*) DESC, servicio""", String.class);

		Map<String, Object> precios = jdbc.getJdbcTemplate().queryForMap(
				"SELECT min(precio_noche) AS minimo, max(precio_noche) AS maximo FROM alojamientos WHERE activo");

		return new OpcionesFiltro(ciudades, servicios, (BigDecimal) precios.get("minimo"),
				(BigDecimal) precios.get("maximo"));
	}

}
