package com.uis.upland.alojamientos.infra;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import com.uis.upland.alojamientos.domain.Alojamiento;

/**
 * Las consultas del CRUD filtran por activo. La excepción es findByAnfitrionId, que usa el
 * módulo de reservas: una reserva sigue existiendo aunque su alojamiento se haya dado de baja.
 */
public interface AlojamientoRepository extends JpaRepository<Alojamiento, UUID> {

	List<Alojamiento> findByAnfitrionId(UUID anfitrionId);

	Optional<Alojamiento> findByIdAndActivoTrue(UUID id);

	Page<Alojamiento> findByActivoTrue(Pageable pageable);

	List<Alojamiento> findByAnfitrionIdAndActivoTrueOrderByFechaCreacionDesc(UUID anfitrionId);

}
