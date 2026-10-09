package com.uis.upland.usuarios.domain;

import java.util.UUID;

/**
 * Lo que otros módulos pueden saber de un usuario. La entidad Usuario, con su hash de
 * contraseña, no sale de este módulo.
 */
public record ContactoUsuario(UUID id, String nombre, String email) {
}
