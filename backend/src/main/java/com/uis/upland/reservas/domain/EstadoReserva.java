package com.uis.upland.reservas.domain;

/**
 * Los valores coinciden con el CHECK ck_reservas_estado. Hoy una reserva nace CONFIRMADA
 * porque no hay pago; los demás estados son del modelo completo y aún no se producen.
 */
public enum EstadoReserva {
	PENDIENTE_PAGO, CONFIRMADA, COMPLETADA, CANCELADA, RECHAZADA
}
