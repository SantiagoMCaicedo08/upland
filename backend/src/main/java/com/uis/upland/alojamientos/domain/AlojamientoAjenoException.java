package com.uis.upland.alojamientos.domain;

import com.uis.upland.shared.error.DomainException;

public class AlojamientoAjenoException extends DomainException {

	public AlojamientoAjenoException() {
		super(Tipo.PROHIBIDO, "ALOJAMIENTO_AJENO", "No puedes modificar un alojamiento que no es tuyo");
	}

}
