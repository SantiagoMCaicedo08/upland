package com.uis.upland.usuarios.domain;

import com.uis.upland.shared.error.DomainException;

public class RolNoPermitidoException extends DomainException {

	public RolNoPermitidoException() {
		super(Tipo.SOLICITUD_INVALIDA, "ROL_NO_PERMITIDO", "Solo puedes registrarte como huésped o como anfitrión");
	}

}
