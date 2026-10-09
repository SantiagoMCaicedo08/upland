package com.uis.upland.usuarios.domain;

import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * Los nombres de columna no se declaran: Spring Boot traduce camelCase a snake_case
 * (passwordHash -> password_hash), y con ddl-auto=validate el arranque falla si un campo
 * no encuentra su columna.
 */
@Entity
@Table(name = "usuarios")
public class Usuario {

	@Id
	@GeneratedValue(strategy = GenerationType.UUID)
	private UUID id;

	private String nombre;

	private String email;

	private String passwordHash;

	// STRING y no ORDINAL: se guarda 'ANFITRION', no su posición en el enum, así reordenar
	// el enum no cambia el significado de las filas existentes.
	@Enumerated(EnumType.STRING)
	private Rol rol;

	private boolean activo;

	private Instant fechaCreacion;

	/** Constructor que exige JPA; no se usa desde el código. */
	protected Usuario() {
	}

	public Usuario(String nombre, String email, String passwordHash, Rol rol) {
		this.nombre = nombre;
		this.email = email;
		this.passwordHash = passwordHash;
		this.rol = rol;
		this.activo = true;
		this.fechaCreacion = Instant.now();
	}

	public UUID getId() {
		return id;
	}

	public String getNombre() {
		return nombre;
	}

	public String getEmail() {
		return email;
	}

	public String getPasswordHash() {
		return passwordHash;
	}

	public Rol getRol() {
		return rol;
	}

	public boolean isActivo() {
		return activo;
	}

	public Instant getFechaCreacion() {
		return fechaCreacion;
	}

}
