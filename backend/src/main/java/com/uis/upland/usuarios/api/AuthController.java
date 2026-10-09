package com.uis.upland.usuarios.api;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.uis.upland.shared.security.TokenEmitido;
import com.uis.upland.usuarios.domain.Usuario;
import com.uis.upland.usuarios.domain.UsuarioService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

	private final UsuarioService usuarioService;

	public AuthController(UsuarioService usuarioService) {
		this.usuarioService = usuarioService;
	}

	@PostMapping("/registro")
	@ResponseStatus(HttpStatus.CREATED)
	public UsuarioResponse registrar(@Valid @RequestBody RegistroRequest request) {
		Usuario usuario = usuarioService.registrar(request.nombre(), request.email(), request.password(),
				request.rol());
		return UsuarioResponse.from(usuario);
	}

	@PostMapping("/login")
	public LoginResponse login(@Valid @RequestBody LoginRequest request) {
		TokenEmitido token = usuarioService.login(request.email(), request.password());
		return new LoginResponse(token.token(), token.expiraEn());
	}

}
