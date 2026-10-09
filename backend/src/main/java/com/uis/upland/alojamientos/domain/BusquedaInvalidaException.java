package com.uis.upland.alojamientos.domain;

import com.uis.upland.shared.error.DomainException;

public class BusquedaInvalidaException extends DomainException {

	public BusquedaInvalidaException(String mensaje) {
		super(Tipo.SOLICITUD_INVALIDA, "BUSQUEDA_INVALIDA", mensaje);
	}

}
