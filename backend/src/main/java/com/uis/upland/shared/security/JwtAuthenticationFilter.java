package com.uis.upland.shared.security;

import java.io.IOException;
import java.util.List;

import org.springframework.http.HttpHeaders;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * Lee el token del header Authorization y, si es válido, deja al usuario autenticado para
 * el resto de la petición. No es un {@code @Component} a propósito: Spring Boot registraría
 * el bean una segunda vez como filtro del contenedor, por fuera de la cadena de seguridad.
 * Lo instancia {@link SecurityConfig}.
 */
public class JwtAuthenticationFilter extends OncePerRequestFilter {

	/** Atributo de la petición donde se anota por qué se descartó el token. */
	static final String MOTIVO_RECHAZO = "upland.jwt.motivoRechazo";

	private static final String PREFIJO = "Bearer ";

	private final JwtService jwtService;

	public JwtAuthenticationFilter(JwtService jwtService) {
		this.jwtService = jwtService;
	}

	@Override
	protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
			throws ServletException, IOException {
		String header = request.getHeader(HttpHeaders.AUTHORIZATION);
		if (header != null && header.startsWith(PREFIJO)) {
			try {
				UsuarioAutenticado usuario = jwtService.validar(header.substring(PREFIJO.length()));
				// Spring Security espera el prefijo ROLE_ para que funcione hasRole("ANFITRION").
				var authorities = List.of(new SimpleGrantedAuthority("ROLE_" + usuario.rol()));
				SecurityContextHolder.getContext()
						.setAuthentication(new UsernamePasswordAuthenticationToken(usuario, null, authorities));
			}
			catch (ExpiredJwtException e) {
				request.setAttribute(MOTIVO_RECHAZO, "TOKEN_VENCIDO");
			}
			catch (JwtException | IllegalArgumentException e) {
				request.setAttribute(MOTIVO_RECHAZO, "TOKEN_INVALIDO");
			}
		}
		// Un token malo no corta la petición aquí: sigue como anónima. Las rutas públicas
		// responden igual y las protegidas terminan en el 401 de SecurityErrorHandler.
		chain.doFilter(request, response);
	}

}
