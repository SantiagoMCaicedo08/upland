package com.uis.upland.usuarios.api;

import com.uis.upland.usuarios.domain.Rol;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * Los mensajes van escritos aquí porque los que trae Bean Validation cambian de idioma
 * según el header Accept-Language del navegador.
 */
public record RegistroRequest(
		@NotBlank(message = "El nombre es obligatorio")
		@Size(max = 120, message = "El nombre admite máximo 120 caracteres")
		String nombre,

		@NotBlank(message = "El email es obligatorio")
		@Email(message = "El email no tiene un formato válido")
		@Size(max = 255, message = "El email admite máximo 255 caracteres")
		String email,

		// BCrypt ignora lo que pase de 72 bytes, así que aceptar más daría una falsa seguridad.
		@NotNull(message = "La contraseña es obligatoria")
		@Size(min = 8, max = 72, message = "La contraseña debe tener entre 8 y 72 caracteres")
		String password,

		/** Opcional. Si no llega, la cuenta se crea como HUESPED. */
		Rol rol) {
}
