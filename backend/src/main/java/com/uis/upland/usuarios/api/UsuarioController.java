package com.uis.upland.usuarios.api;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.uis.upland.shared.security.UsuarioAutenticado;
import com.uis.upland.usuarios.domain.UsuarioService;

@RestController
@RequestMapping("/api/usuarios")
public class UsuarioController {

	private final UsuarioService usuarioService;

	public UsuarioController(UsuarioService usuarioService) {
		this.usuarioService = usuarioService;
	}

	/** El id sale del token, no de la URL: nadie puede pedir los datos de otro usuario. */
	@GetMapping("/yo")
	public UsuarioResponse yo(@AuthenticationPrincipal UsuarioAutenticado actor) {
		return UsuarioResponse.from(usuarioService.obtener(actor.id()));
	}

}
