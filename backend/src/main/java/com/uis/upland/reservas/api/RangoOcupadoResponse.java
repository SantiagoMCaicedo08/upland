package com.uis.upland.reservas.api;

import java.time.LocalDate;

/** Es público, así que solo expone las fechas: nada sobre quién reservó ni cuánto pagó. */
public record RangoOcupadoResponse(LocalDate fechaEntrada, LocalDate fechaSalida) {
}
