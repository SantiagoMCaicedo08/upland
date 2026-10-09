package com.uis.upland.reservas.infra;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import com.uis.upland.reservas.domain.EstadoReserva;
import com.uis.upland.reservas.domain.Reserva;

public interface ReservaRepository extends JpaRepository<Reserva, UUID> {

	// Dos rangos [a, b) y [c, d) se cruzan cuando a < d y c < b. Es la misma condición que
	// evalúa el operador && de la restricción ex_reservas_sin_solape.
	@Query("""
			select count(r) > 0 from Reserva r
			where r.alojamientoId = :alojamientoId
			  and r.estado = com.uis.upland.reservas.domain.EstadoReserva.CONFIRMADA
			  and r.fechaEntrada < :salida
			  and r.fechaSalida > :entrada
			""")
	boolean existeSolape(UUID alojamientoId, LocalDate entrada, LocalDate salida);

	List<Reserva> findByHuespedIdOrderByFechaEntradaDesc(UUID huespedId);

	List<Reserva> findByAlojamientoIdInOrderByFechaEntradaDesc(Collection<UUID> alojamientoIds);

	List<Reserva> findByAlojamientoIdAndEstadoAndFechaSalidaAfterOrderByFechaEntrada(UUID alojamientoId,
			EstadoReserva estado, LocalDate fecha);

}
