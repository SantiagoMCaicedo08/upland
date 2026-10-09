package com.uis.upland.usuarios.domain;

import com.uis.upland.shared.error.DomainException;

public class CredencialesInvalidasException extends DomainException {

	public CredencialesInvalidasException() {
		super(Tipo.NO_AUTENTICADO, "CREDENCIALES_INVALIDAS", "Email o contraseña incorrectos");
	}

}
