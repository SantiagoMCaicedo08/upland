package com.uis.upland.usuarios.api;

import java.util.UUID;

import com.uis.upland.usuarios.domain.Rol;
import com.uis.upland.usuarios.domain.Usuario;

/** Lo que la API expone de un usuario. El hash de la contraseña nunca sale de aquí. */
public record UsuarioResponse(UUID id, String nombre, String email, Rol rol) {

	public static UsuarioResponse from(Usuario usuario) {
		return new UsuarioResponse(usuario.getId(), usuario.getNombre(), usuario.getEmail(), usuario.getRol());
	}

}
