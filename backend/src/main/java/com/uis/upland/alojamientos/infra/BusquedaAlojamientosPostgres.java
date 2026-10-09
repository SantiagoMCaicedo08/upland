package com.uis.upland.alojamientos.infra;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Component;

import com.uis.upland.alojamientos.domain.Alojamiento;
import com.uis.upland.alojamientos.domain.BusquedaAlojamientos;
import com.uis.upland.alojamientos.domain.ResumenAlojamiento;
import com.uis.upland.shared.Pagina;

@Component
public class BusquedaAlojamientosPostgres implements BusquedaAlojamientos {

	// El desempate por id mantiene el orden estable entre páginas cuando dos alojamientos
	// comparten fecha de creación; sin él una fila podría repetirse o saltarse al paginar.
	private static final Sort MAS_RECIENTES_PRIMERO = Sort.by(Sort.Order.desc("fechaCreacion"),
			Sort.Order.asc("id"));

	private final AlojamientoRepository alojamientoRepository;

	public BusquedaAlojamientosPostgres(AlojamientoRepository alojamientoRepository) {
		this.alojamientoRepository = alojamientoRepository;
	}

	@Override
	public Pagina<ResumenAlojamiento> listarActivos(int pagina, int tamano) {
		Page<Alojamiento> page = alojamientoRepository
				.findByActivoTrue(PageRequest.of(pagina, tamano, MAS_RECIENTES_PRIMERO));
		List<ResumenAlojamiento> contenido = page.getContent().stream().map(ResumenAlojamiento::from).toList();
		return new Pagina<>(contenido, page.getNumber(), page.getSize(), page.getTotalElements(),
				page.getTotalPages());
	}

}
