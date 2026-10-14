package com.uis.upland.facturas.domain;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

import com.uis.upland.usuarios.domain.ContactoUsuario;

/**
 * Lo que necesita una factura para emitirse. Lo arma el módulo de reservas con datos que ya
 * tiene, así este módulo no depende de reservas ni de sus entidades.
 */
public record DatosFactura(UUID reservaId, ContactoUsuario huesped, ContactoUsuario anfitrion,
		String alojamientoTitulo, String alojamientoCiudad, LocalDate fechaEntrada, LocalDate fechaSalida,
		BigDecimal precioNoche) {
}
