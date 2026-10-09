package com.uis.upland.usuarios.api;

/** expiraEn son los segundos que faltan para que el token venza. */
public record LoginResponse(String token, long expiraEn) {
}
