package com.uis.upland.usuarios.domain;

import com.uis.upland.shared.error.DomainException;

public class EmailYaRegistradoException extends DomainException {

	public EmailYaRegistradoException() {
		super(Tipo.CONFLICTO, "EMAIL_YA_REGISTRADO", "Ya existe una cuenta con ese email");
	}

}
