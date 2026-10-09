package com.uis.upland.shared.error;

/**
 * Base de las excepciones de dominio. Cada una declara su tipo y un código estable; la
 * traducción a HTTP ocurre en un solo lugar, {@link GlobalExceptionHandler}, para que el
 * dominio no conozca códigos de estado.
 */
public abstract class DomainException extends RuntimeException {

	public enum Tipo {
		NO_ENCONTRADO, CONFLICTO, PROHIBIDO, NO_AUTENTICADO, SOLICITUD_INVALIDA
	}

	private final Tipo tipo;
	private final String codigo;

	protected DomainException(Tipo tipo, String codigo, String mensaje) {
		super(mensaje);
		this.tipo = tipo;
		this.codigo = codigo;
	}

	public Tipo getTipo() {
		return tipo;
	}

	public String getCodigo() {
		return codigo;
	}

}
