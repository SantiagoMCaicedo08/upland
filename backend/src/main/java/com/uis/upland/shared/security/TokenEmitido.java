package com.uis.upland.shared.security;

/** Token firmado y los segundos que faltan para que venza. */
public record TokenEmitido(String token, long expiraEn) {
}
