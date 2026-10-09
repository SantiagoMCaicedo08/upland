package com.uis.upland.reservas.domain;

import com.uis.upland.alojamientos.domain.ResumenAlojamiento;
import com.uis.upland.usuarios.domain.ContactoUsuario;

/**
 * Una reserva junto con los datos de otros módulos que hacen falta para mostrarla. El
 * huésped solo viene cuando quien consulta es el anfitrión; en los demás casos es null.
 */
public record ReservaDetallada(Reserva reserva, ResumenAlojamiento alojamiento, ContactoUsuario huesped) {
}
