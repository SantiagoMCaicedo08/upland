package com.uis.upland.shared.security;

import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.Date;
import java.util.UUID;

import javax.crypto.SecretKey;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

@Service
public class JwtService {

	private static final String CLAIM_ROL = "rol";

	private final SecretKey key;
	private final Duration expiracion;

	public JwtService(@Value("${upland.jwt.secret}") String secret,
			@Value("${upland.jwt.expiracion}") Duration expiracion) {
		// Con un secreto de menos de 32 bytes jjwt lanza WeakKeyException y la aplicación
		// no arranca: mejor fallar aquí que firmar tokens con una clave débil.
		this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
		this.expiracion = expiracion;
	}

	public TokenEmitido emitir(UUID usuarioId, String rol) {
		Instant ahora = Instant.now();
		String token = Jwts.builder()
				.subject(usuarioId.toString())
				.claim(CLAIM_ROL, rol)
				// jjwt solo acepta java.util.Date; es el único punto del proyecto que lo usa.
				.issuedAt(Date.from(ahora))
				.expiration(Date.from(ahora.plus(expiracion)))
				.signWith(key, Jwts.SIG.HS256)
				.compact();
		return new TokenEmitido(token, expiracion.toSeconds());
	}

	/**
	 * @throws JwtException si la firma no coincide, el token venció o está mal formado
	 * @throws IllegalArgumentException si el token está vacío o el sujeto no es un UUID
	 */
	public UsuarioAutenticado validar(String token) {
		Claims claims = Jwts.parser()
				.verifyWith(key)
				.build()
				.parseSignedClaims(token)
				.getPayload();
		return new UsuarioAutenticado(UUID.fromString(claims.getSubject()), claims.get(CLAIM_ROL, String.class));
	}

}
