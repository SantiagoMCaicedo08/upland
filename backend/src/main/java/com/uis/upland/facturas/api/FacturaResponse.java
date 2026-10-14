package com.uis.upland.facturas.api;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

import com.uis.upland.facturas.domain.Factura;

public record FacturaResponse(long numero, Instant fechaEmision, UUID reservaId, String huespedNombre,
		String huespedEmail, String anfitrionNombre, String anfitrionEmail, String alojamientoTitulo,
		String alojamientoCiudad, LocalDate fechaEntrada, LocalDate fechaSalida, int noches, BigDecimal precioNoche,
		BigDecimal total) {

	public static FacturaResponse from(Factura factura) {
		return new FacturaResponse(factura.getNumero(), factura.getFechaEmision(), factura.getReservaId(),
				factura.getHuespedNombre(), factura.getHuespedEmail(), factura.getAnfitrionNombre(),
				factura.getAnfitrionEmail(), factura.getAlojamientoTitulo(), factura.getAlojamientoCiudad(),
				factura.getFechaEntrada(), factura.getFechaSalida(), factura.getNoches(), factura.getPrecioNoche(),
				factura.getTotal());
	}

}
