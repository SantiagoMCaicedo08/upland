package com.uis.upland.reservas.domain;

import com.uis.upland.shared.error.DomainException;

public class FechasInvalidasException extends DomainException {

	public FechasInvalidasException(String mensaje) {
		super(Tipo.SOLICITUD_INVALIDA, "FECHAS_INVALIDAS", mensaje);
	}

}
