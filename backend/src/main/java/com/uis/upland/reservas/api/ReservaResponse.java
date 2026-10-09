package com.uis.upland.reservas.api;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

import com.uis.upland.reservas.domain.EstadoReserva;
import com.uis.upland.reservas.domain.Reserva;
import com.uis.upland.reservas.domain.ReservaDetallada;

/** huespedNombre y huespedEmail solo vienen en las reservas que consulta el anfitrión. */
public record ReservaResponse(UUID id, UUID alojamientoId, String alojamientoTitulo, String alojamientoCiudad,
		String alojamientoFotoUrl, LocalDate fechaEntrada, LocalDate fechaSalida, long noches, BigDecimal valorTotal,
		EstadoReserva estado, Instant fechaCreacion, String huespedNombre, String huespedEmail) {

	public static ReservaResponse from(ReservaDetallada detalle) {
		Reserva reserva = detalle.reserva();
		return new ReservaResponse(reserva.getId(), reserva.getAlojamientoId(), detalle.alojamiento().titulo(),
				detalle.alojamiento().ciudad(), detalle.alojamiento().fotoUrl(), reserva.getFechaEntrada(),
				reserva.getFechaSalida(),
				reserva.getNoches(), reserva.getValorTotal(), reserva.getEstado(), reserva.getFechaCreacion(),
				detalle.huesped() == null ? null : detalle.huesped().nombre(),
				detalle.huesped() == null ? null : detalle.huesped().email());
	}

}
