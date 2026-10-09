package com.uis.upland.reservas.domain;

import com.uis.upland.shared.error.DomainException;

public class ReservaPropiaException extends DomainException {

	public ReservaPropiaException() {
		super(Tipo.SOLICITUD_INVALIDA, "RESERVA_PROPIA", "No puedes reservar tu propio alojamiento");
	}

}
