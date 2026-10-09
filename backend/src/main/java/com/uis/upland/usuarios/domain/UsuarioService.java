package com.uis.upland.usuarios.domain;

import java.util.Collection;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.uis.upland.shared.security.JwtService;
import com.uis.upland.shared.security.TokenEmitido;
import com.uis.upland.usuarios.infra.UsuarioRepository;

@Service
public class UsuarioService {

	private final UsuarioRepository usuarioRepository;
	private final PasswordEncoder passwordEncoder;
	private final JwtService jwtService;

	public UsuarioService(UsuarioRepository usuarioRepository, PasswordEncoder passwordEncoder,
			JwtService jwtService) {
		this.usuarioRepository = usuarioRepository;
		this.passwordEncoder = passwordEncoder;
		this.jwtService = jwtService;
	}

	public Usuario registrar(String nombre, String email, String password, Rol rolSolicitado) {
		Rol rol = rolSolicitado == null ? Rol.HUESPED : rolSolicitado;
		// Nadie se vuelve administrador registrándose; ese rol lo asigna otro administrador.
		if (rol == Rol.ADMIN) {
			throw new RolNoPermitidoException();
		}
		String emailNormalizado = normalizar(email);
		// Esta consulta existe para dar un mensaje claro en el caso normal.
		if (usuarioRepository.existsByEmail(emailNormalizado)) {
			throw new EmailYaRegistradoException();
		}
		Usuario usuario = new Usuario(nombre.trim(), emailNormalizado, passwordEncoder.encode(password), rol);
		try {
			return usuarioRepository.saveAndFlush(usuario);
		}
		catch (DataIntegrityViolationException e) {
			// Dos registros simultáneos con el mismo email pasan ambos la consulta de arriba.
			// El segundo choca con la restricción UNIQUE, que es la garantía real.
			throw new EmailYaRegistradoException();
		}
	}

	public TokenEmitido login(String email, String password) {
		// Email inexistente, cuenta desactivada y contraseña incorrecta responden lo mismo:
		// distinguirlos le diría a un atacante qué emails tienen cuenta.
		Usuario usuario = usuarioRepository.findByEmail(normalizar(email))
				.filter(Usuario::isActivo)
				.filter(encontrado -> passwordEncoder.matches(password, encontrado.getPasswordHash()))
				.orElseThrow(CredencialesInvalidasException::new);
		return jwtService.emitir(usuario.getId(), usuario.getRol().name());
	}

	public Usuario obtener(UUID id) {
		return usuarioRepository.findById(id).orElseThrow(UsuarioNoEncontradoException::new);
	}

	/** Consulta para otros módulos: devuelve datos de contacto, nunca la entidad. */
	public Map<UUID, ContactoUsuario> contactos(Collection<UUID> ids) {
		return usuarioRepository.findAllById(ids).stream()
				.collect(Collectors.toMap(Usuario::getId,
						usuario -> new ContactoUsuario(usuario.getId(), usuario.getNombre(), usuario.getEmail())));
	}

	/** La tabla exige el email en minúsculas (ck_usuarios_email_minusculas). */
	private String normalizar(String email) {
		return email.trim().toLowerCase(Locale.ROOT);
	}

}
