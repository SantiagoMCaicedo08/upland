package com.uis.upland.shared.error;

import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.ErrorResponse;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

@RestControllerAdvice
public class GlobalExceptionHandler {

	private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

	@ExceptionHandler(DomainException.class)
	public ResponseEntity<ApiError> handleDomain(DomainException e) {
		HttpStatus status = switch (e.getTipo()) {
			case NO_ENCONTRADO -> HttpStatus.NOT_FOUND;
			case CONFLICTO -> HttpStatus.CONFLICT;
			case PROHIBIDO -> HttpStatus.FORBIDDEN;
			case NO_AUTENTICADO -> HttpStatus.UNAUTHORIZED;
			case SOLICITUD_INVALIDA -> HttpStatus.BAD_REQUEST;
		};
		return ResponseEntity.status(status).body(ApiError.of(e.getCodigo(), e.getMessage()));
	}

	@ExceptionHandler(MethodArgumentNotValidException.class)
	public ResponseEntity<ApiError> handleValidation(MethodArgumentNotValidException e) {
		List<String> detalles = e.getBindingResult().getAllErrors().stream()
				.map(error -> error.getDefaultMessage())
				.sorted()
				.toList();
		return ResponseEntity.badRequest()
				.body(new ApiError("VALIDACION", "Hay datos inválidos en la petición", detalles));
	}

	@ExceptionHandler(HttpMessageNotReadableException.class)
	public ResponseEntity<ApiError> handleUnreadableBody(HttpMessageNotReadableException e) {
		return ResponseEntity.badRequest()
				.body(ApiError.of("CUERPO_INVALIDO", "El cuerpo de la petición no es un JSON válido"));
	}

	@ExceptionHandler(MethodArgumentTypeMismatchException.class)
	public ResponseEntity<ApiError> handleTypeMismatch(MethodArgumentTypeMismatchException e) {
		return ResponseEntity.badRequest()
				.body(ApiError.of("PARAMETRO_INVALIDO", "El parámetro '" + e.getName() + "' no tiene un formato válido"));
	}

	@ExceptionHandler(Exception.class)
	public ResponseEntity<ApiError> handleUnexpected(Exception e) {
		// Las excepciones propias de Spring MVC (ruta inexistente, método no soportado) ya
		// saben qué estado HTTP les corresponde; solo se les cambia el formato del cuerpo.
		if (e instanceof ErrorResponse springError) {
			return ResponseEntity.status(springError.getStatusCode())
					.body(ApiError.of("SOLICITUD_NO_ATENDIDA", "La solicitud no pudo atenderse"));
		}
		// El detalle queda en el log del servidor; al cliente no se le envía el stacktrace.
		log.error("Error no controlado", e);
		return ResponseEntity.internalServerError()
				.body(ApiError.of("ERROR_INTERNO", "Ocurrió un error inesperado"));
	}

}
