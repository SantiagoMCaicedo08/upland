package com.uis.upland.shared.security;

import java.util.UUID;

/**
 * Lo que se sabe de quien hace la petición, leído del token ya validado. Los controllers lo
 * reciben con {@code @AuthenticationPrincipal}.
 */
public record UsuarioAutenticado(UUID id, String rol) {
}
