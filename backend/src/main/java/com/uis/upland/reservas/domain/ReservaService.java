package com.uis.upland.reservas.domain;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;

import com.uis.upland.alojamientos.domain.AlojamientoService;
import com.uis.upland.alojamientos.domain.ResumenAlojamiento;
import com.uis.upland.reservas.infra.ReservaRepository;
import com.uis.upland.usuarios.domain.ContactoUsuario;
import com.uis.upland.usuarios.domain.UsuarioService;

/**
 * Habla con los otros módulos solo por sus servicios públicos (AlojamientoService,
 * UsuarioService), nunca por sus repositorios ni sus entidades.
 */
@Service
public class ReservaService {

	private static final String RESTRICCION_SOLAPE = "ex_reservas_sin_solape";

	private final ReservaRepository reservaRepository;
	private final AlojamientoService alojamientoService;
	private final UsuarioService usuarioService;

	public ReservaService(ReservaRepository reservaRepository, AlojamientoService alojamientoService,
			UsuarioService usuarioService) {
		this.reservaRepository = reservaRepository;
		this.alojamientoService = alojamientoService;
		this.usuarioService = usuarioService;
	}

	public ReservaDetallada crear(UUID huespedId, UUID alojamientoId, LocalDate entrada, LocalDate salida) {
		if (!salida.isAfter(entrada)) {
			throw new FechasInvalidasException("La fecha de salida debe ser posterior a la de entrada");
		}
		if (entrada.isBefore(LocalDate.now())) {
			throw new FechasInvalidasException("La fecha de entrada no puede estar en el pasado");
		}
		ResumenAlojamiento alojamiento = alojamientoService.resumir(alojamientoId);
		if (alojamiento.anfitrionId().equals(huespedId)) {
			throw new ReservaPropiaException();
		}
		// Esta consulta existe para dar un mensaje claro en el caso normal. No es la garantía:
		// dos peticiones simultáneas la pasan las dos, porque ninguna ve aún la fila de la otra.
		if (reservaRepository.existeSolape(alojamientoId, entrada, salida)) {
			throw new FechasNoDisponiblesException();
		}

		// El precio sale del alojamiento en el servidor, nunca del cuerpo de la petición.
		BigDecimal valorTotal = alojamiento.precioNoche()
				.multiply(BigDecimal.valueOf(ChronoUnit.DAYS.between(entrada, salida)));
		Reserva reserva = new Reserva(alojamientoId, huespedId, entrada, salida, valorTotal);
		try {
			reserva = reservaRepository.saveAndFlush(reserva);
		}
		catch (DataIntegrityViolationException e) {
			// La garantía real: PostgreSQL rechaza el INSERT que cruza fechas con una reserva
			// confirmada, aunque las dos peticiones hayan llegado en el mismo instante.
			if (String.valueOf(e.getMostSpecificCause().getMessage()).contains(RESTRICCION_SOLAPE)) {
				throw new FechasNoDisponiblesException();
			}
			throw e;
		}
		return new ReservaDetallada(reserva, alojamiento, null);
	}

	/** Las reservas que hizo un usuario como huésped. */
	public List<ReservaDetallada> listarDeHuesped(UUID huespedId) {
		List<Reserva> reservas = reservaRepository.findByHuespedIdOrderByFechaEntradaDesc(huespedId);
		Map<UUID, ResumenAlojamiento> alojamientos = alojamientoService
				.resumenes(reservas.stream().map(Reserva::getAlojamientoId).toList());
		return reservas.stream()
				.map(reserva -> new ReservaDetallada(reserva, alojamientos.get(reserva.getAlojamientoId()), null))
				.toList();
	}

	/** Las reservas hechas sobre los alojamientos de un anfitrión, con los datos del huésped. */
	public List<ReservaDetallada> listarDeAnfitrion(UUID anfitrionId) {
		Map<UUID, ResumenAlojamiento> alojamientos = alojamientoService.resumenesDe(anfitrionId);
		List<Reserva> reservas = reservaRepository.findByAlojamientoIdInOrderByFechaEntradaDesc(alojamientos.keySet());
		Map<UUID, ContactoUsuario> huespedes = usuarioService
				.contactos(reservas.stream().map(Reserva::getHuespedId).toList());
		return reservas.stream()
				.map(reserva -> new ReservaDetallada(reserva, alojamientos.get(reserva.getAlojamientoId()),
						huespedes.get(reserva.getHuespedId())))
				.toList();
	}

	/** Rangos confirmados que aún no terminan; es lo que el detalle muestra como ocupado. */
	public List<Reserva> ocupacion(UUID alojamientoId) {
		return reservaRepository.findByAlojamientoIdAndEstadoAndFechaSalidaAfterOrderByFechaEntrada(alojamientoId,
				EstadoReserva.CONFIRMADA, LocalDate.now());
	}

}
