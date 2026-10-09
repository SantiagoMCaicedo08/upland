package com.uis.upland.reservas.domain;

import com.uis.upland.shared.error.DomainException;

public class FechasNoDisponiblesException extends DomainException {

	public FechasNoDisponiblesException() {
		super(Tipo.CONFLICTO, "FECHAS_NO_DISPONIBLES",
				"El alojamiento ya está reservado en esas fechas. Elige otro rango");
	}

}
