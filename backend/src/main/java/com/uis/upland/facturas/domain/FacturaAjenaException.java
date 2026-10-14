package com.uis.upland.facturas.domain;

import com.uis.upland.shared.error.DomainException;

public class FacturaAjenaException extends DomainException {

	public FacturaAjenaException() {
		super(Tipo.PROHIBIDO, "FACTURA_AJENA", "Solo el huésped y el anfitrión de la reserva pueden ver su factura");
	}

}
