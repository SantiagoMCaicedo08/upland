package com.uis.upland.reservas.api;

import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.uis.upland.reservas.domain.ReservaService;
import com.uis.upland.shared.security.UsuarioAutenticado;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/reservas")
public class ReservaController {

	private final ReservaService reservaService;

	public ReservaController(ReservaService reservaService) {
		this.reservaService = reservaService;
	}

	@PostMapping
	@ResponseStatus(HttpStatus.CREATED)
	public ReservaResponse crear(@AuthenticationPrincipal UsuarioAutenticado actor,
			@Valid @RequestBody ReservaRequest request) {
		return ReservaResponse.from(reservaService.crear(actor.id(), request.alojamientoId(),
				request.fechaEntrada(), request.fechaSalida()));
	}

	/** Las que hice como huésped. */
	@GetMapping("/mias")
	public List<ReservaResponse> listarMias(@AuthenticationPrincipal UsuarioAutenticado actor) {
		return reservaService.listarDeHuesped(actor.id()).stream().map(ReservaResponse::from).toList();
	}

	/** Las que otros hicieron sobre mis alojamientos. */
	@GetMapping("/recibidas")
	public List<ReservaResponse> listarRecibidas(@AuthenticationPrincipal UsuarioAutenticado actor) {
		return reservaService.listarDeAnfitrion(actor.id()).stream().map(ReservaResponse::from).toList();
	}

	/** Pública: fechas ya ocupadas de un alojamiento. */
	@GetMapping("/ocupacion")
	public List<RangoOcupadoResponse> ocupacion(@RequestParam UUID alojamientoId) {
		return reservaService.ocupacion(alojamientoId).stream()
				.map(reserva -> new RangoOcupadoResponse(reserva.getFechaEntrada(), reserva.getFechaSalida()))
				.toList();
	}

}
