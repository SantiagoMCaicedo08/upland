package com.uis.upland.facturas.domain;

import com.uis.upland.shared.error.DomainException;

public class FacturaNoEncontradaException extends DomainException {

	public FacturaNoEncontradaException() {
		super(Tipo.NO_ENCONTRADO, "FACTURA_NO_ENCONTRADA", "Esa reserva no tiene factura");
	}

}
