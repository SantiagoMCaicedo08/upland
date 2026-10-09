package com.uis.upland.alojamientos.domain;

import com.uis.upland.shared.error.DomainException;

public class AlojamientoNoEncontradoException extends DomainException {

	public AlojamientoNoEncontradoException() {
		super(Tipo.NO_ENCONTRADO, "ALOJAMIENTO_NO_ENCONTRADO", "El alojamiento no existe");
	}

}
