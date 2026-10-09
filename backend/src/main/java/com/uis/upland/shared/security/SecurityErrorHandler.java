package com.uis.upland.shared.security;

import java.io.IOException;
import java.nio.charset.StandardCharsets;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.stereotype.Component;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.uis.upland.shared.error.ApiError;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * Los rechazos de Spring Security ocurren en los filtros, antes de llegar a un controller,
 * así que el {@code @RestControllerAdvice} no los ve. Esta clase les da el mismo formato de
 * error que usa el resto de la API.
 */
@Component
public class SecurityErrorHandler implements AuthenticationEntryPoint, AccessDeniedHandler {

	private final ObjectMapper objectMapper;

	public SecurityErrorHandler(ObjectMapper objectMapper) {
		this.objectMapper = objectMapper;
	}

	/** Petición sin autenticar a una ruta protegida: 401. */
	@Override
	public void commence(HttpServletRequest request, HttpServletResponse response, AuthenticationException e)
			throws IOException {
		ApiError error = switch (String.valueOf(request.getAttribute(JwtAuthenticationFilter.MOTIVO_RECHAZO))) {
			case "TOKEN_VENCIDO" -> ApiError.of("TOKEN_VENCIDO", "La sesión expiró. Inicia sesión de nuevo");
			case "TOKEN_INVALIDO" -> ApiError.of("TOKEN_INVALIDO", "El token no es válido");
			default -> ApiError.of("NO_AUTENTICADO", "Debes iniciar sesión para acceder a este recurso");
		};
		write(response, HttpStatus.UNAUTHORIZED, error);
	}

	/** Usuario autenticado sin el rol que exige la ruta: 403. */
	@Override
	public void handle(HttpServletRequest request, HttpServletResponse response, AccessDeniedException e)
			throws IOException {
		write(response, HttpStatus.FORBIDDEN,
				ApiError.of("ACCESO_DENEGADO", "Tu cuenta no tiene permiso para realizar esta acción"));
	}

	private void write(HttpServletResponse response, HttpStatus status, ApiError error) throws IOException {
		response.setStatus(status.value());
		response.setContentType(MediaType.APPLICATION_JSON_VALUE);
		response.setCharacterEncoding(StandardCharsets.UTF_8.name());
		objectMapper.writeValue(response.getOutputStream(), error);
	}

}
