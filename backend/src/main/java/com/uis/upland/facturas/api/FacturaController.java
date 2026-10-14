package com.uis.upland.facturas.api;

import java.util.UUID;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

import com.uis.upland.facturas.domain.FacturaService;
import com.uis.upland.shared.security.UsuarioAutenticado;

@RestController
public class FacturaController {

	private final FacturaService facturaService;

	public FacturaController(FacturaService facturaService) {
		this.facturaService = facturaService;
	}

	/** Requiere token (SecurityConfig). Si es del huésped o del anfitrión lo decide el servicio. */
	@GetMapping("/api/reservas/{reservaId}/factura")
	public FacturaResponse obtener(@PathVariable UUID reservaId, @AuthenticationPrincipal UsuarioAutenticado actor) {
		return FacturaResponse.from(facturaService.obtenerDeReserva(reservaId, actor.id()));
	}

}
