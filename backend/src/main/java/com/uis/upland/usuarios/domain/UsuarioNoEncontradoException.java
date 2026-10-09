package com.uis.upland.usuarios.domain;

import com.uis.upland.shared.error.DomainException;

public class UsuarioNoEncontradoException extends DomainException {

	public UsuarioNoEncontradoException() {
		super(Tipo.NO_ENCONTRADO, "USUARIO_NO_ENCONTRADO", "El usuario no existe");
	}

}
