package com.uis.upland.alojamientos.domain;

import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.uis.upland.alojamientos.infra.AlojamientoRepository;
import com.uis.upland.shared.Pagina;

@Service
public class AlojamientoService {

	private static final int TAMANO_MAXIMO = 50;

	private final AlojamientoRepository alojamientoRepository;
	private final BusquedaAlojamientos busquedaAlojamientos;

	public AlojamientoService(AlojamientoRepository alojamientoRepository,
			BusquedaAlojamientos busquedaAlojamientos) {
		this.alojamientoRepository = alojamientoRepository;
		this.busquedaAlojamientos = busquedaAlojamientos;
	}

	public Pagina<ResumenAlojamiento> buscar(CriteriosBusqueda criterios, int pagina, int tamano) {
		if ((criterios.entrada() == null) != (criterios.salida() == null)) {
			throw new BusquedaInvalidaException("Para filtrar por fechas indica la entrada y la salida");
		}
		if (criterios.entrada() != null && !criterios.salida().isAfter(criterios.entrada())) {
			throw new BusquedaInvalidaException("La fecha de salida debe ser posterior a la de entrada");
		}
		if (criterios.precioMin() != null && criterios.precioMax() != null
				&& criterios.precioMin().compareTo(criterios.precioMax()) > 0) {
			throw new BusquedaInvalidaException("El precio mínimo no puede ser mayor que el máximo");
		}
		// Se acota aquí para que nadie pida un millón de filas con ?tamano=1000000.
		return busquedaAlojamientos.buscar(criterios, Math.max(pagina, 0), Math.clamp(tamano, 1, TAMANO_MAXIMO));
	}

	public OpcionesFiltro opcionesDeFiltro() {
		return busquedaAlojamientos.opcionesDeFiltro();
	}

	/**
	 * No pasa por BusquedaAlojamientos: el anfitrión tiene que ver de inmediato lo que acaba
	 * de crear o editar, así que esta consulta siempre lee de la fuente de verdad.
	 */
	public List<Alojamiento> listarDe(UUID anfitrionId) {
		return alojamientoRepository.findByAnfitrionIdAndActivoTrueOrderByFechaCreacionDesc(anfitrionId);
	}

	public Alojamiento obtener(UUID id) {
		return alojamientoRepository.findByIdAndActivoTrue(id).orElseThrow(AlojamientoNoEncontradoException::new);
	}

	// --- Consultas para otros módulos. Devuelven ResumenAlojamiento, nunca la entidad. ---

	/** Solo alojamientos activos: es lo que se puede reservar. */
	public ResumenAlojamiento resumir(UUID id) {
		return ResumenAlojamiento.from(obtener(id));
	}

	/** Incluye los dados de baja, para poder mostrar reservas hechas antes de la baja. */
	public Map<UUID, ResumenAlojamiento> resumenes(Collection<UUID> ids) {
		return alojamientoRepository.findAllById(ids).stream()
				.collect(Collectors.toMap(Alojamiento::getId, ResumenAlojamiento::from));
	}

	/** Todos los alojamientos de un anfitrión, incluidos los dados de baja. */
	public Map<UUID, ResumenAlojamiento> resumenesDe(UUID anfitrionId) {
		return alojamientoRepository.findByAnfitrionId(anfitrionId).stream()
				.collect(Collectors.toMap(Alojamiento::getId, ResumenAlojamiento::from));
	}

	public Alojamiento crear(UUID anfitrionId, DatosAlojamiento datos) {
		return alojamientoRepository.save(new Alojamiento(anfitrionId, datos));
	}

	// @Transactional mantiene la entidad gestionada durante todo el método: al terminar,
	// Hibernate detecta los cambios y emite el UPDATE sin que haga falta llamar a save().
	@Transactional
	public Alojamiento actualizar(UUID id, UUID actorId, DatosAlojamiento datos) {
		Alojamiento alojamiento = obtenerPropio(id, actorId);
		alojamiento.actualizar(datos);
		return alojamiento;
	}

	/** Baja lógica: la fila se conserva con activo = false. */
	@Transactional
	public void eliminar(UUID id, UUID actorId) {
		obtenerPropio(id, actorId).desactivar();
	}

	/** Si el alojamiento existe pero es de otro anfitrión la respuesta es 403, no 404. */
	private Alojamiento obtenerPropio(UUID id, UUID actorId) {
		Alojamiento alojamiento = obtener(id);
		if (!alojamiento.getAnfitrionId().equals(actorId)) {
			throw new AlojamientoAjenoException();
		}
		return alojamiento;
	}

}
