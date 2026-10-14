package com.uis.upland.alojamientos.infra;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Component;

import com.uis.upland.alojamientos.domain.BusquedaAlojamientos;
import com.uis.upland.alojamientos.domain.CriteriosBusqueda;
import com.uis.upland.alojamientos.domain.ResumenAlojamiento;
import com.uis.upland.shared.Pagina;

/**
 * Búsqueda del catálogo sobre PostgreSQL, escrita en SQL y no con JPA: los filtros son
 * opcionales y la consulta se arma según cuáles llegan.
 *
 * Excepción deliberada a los límites entre módulos: el filtro por fechas lee la tabla
 * reservas, que pertenece a otro módulo. Una búsqueda es un modelo de lectura que cruza
 * datos de varios módulos, y esa necesidad es justo lo que en la fase 2 resuelve la
 * proyección en MongoDB. El cruce queda encerrado en esta clase, detrás de la interfaz.
 */
@Component
public class BusquedaAlojamientosPostgres implements BusquedaAlojamientos {

	private static final String COLUMNAS = "a.id, a.anfitrion_id, a.titulo, a.ciudad, a.capacidad, a.precio_noche";

	// Mismo criterio que la restricción ex_reservas_sin_solape: solo ocupan fechas las
	// reservas confirmadas, y los rangos son [entrada, salida).
	private static final String LIBRE_EN_FECHAS = """
			NOT EXISTS (
			    SELECT 1 FROM reservas r
			    WHERE r.alojamiento_id = a.id
			      AND r.estado = 'CONFIRMADA'
			      AND daterange(r.fecha_entrada, r.fecha_salida) && daterange(:entrada, :salida))""";

	// El desempate por id mantiene el orden estable entre páginas cuando dos alojamientos
	// comparten fecha de creación; sin él una fila podría repetirse o saltarse al paginar.
	private static final String MAS_RECIENTES_PRIMERO = "a.fecha_creacion DESC, a.id";

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
						+ MAS_RECIENTES_PRIMERO + " LIMIT :tamano OFFSET :desplazamiento",
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
		if (criterios.huespedes() != null) {
			condiciones.add("a.capacidad >= :huespedes");
			parametros.addValue("huespedes", criterios.huespedes());
		}
		if (criterios.precioMax() != null) {
			condiciones.add("a.precio_noche <= :precioMax");
			parametros.addValue("precioMax", criterios.precioMax());
		}
		if (criterios.entrada() != null && criterios.salida() != null) {
			condiciones.add(LIBRE_EN_FECHAS);
			parametros.addValue("entrada", criterios.entrada()).addValue("salida", criterios.salida());
		}
		return String.join(" AND ", condiciones);
	}

	private ResumenAlojamiento resumen(ResultSet fila) throws SQLException {
		return new ResumenAlojamiento(fila.getObject("id", UUID.class), fila.getObject("anfitrion_id", UUID.class),
				fila.getString("titulo"), fila.getString("ciudad"), fila.getInt("capacidad"),
				fila.getBigDecimal("precio_noche"));
	}

	@Override
	public List<String> ciudades() {
		return jdbc.getJdbcTemplate().queryForList(
				"SELECT DISTINCT ciudad FROM alojamientos WHERE activo ORDER BY ciudad", String.class);
	}

}
