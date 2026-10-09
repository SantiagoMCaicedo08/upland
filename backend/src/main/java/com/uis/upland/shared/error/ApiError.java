package com.uis.upland.shared.error;

import java.util.List;

/** Formato único de error de la API. Los nombres van en español porque los lee el cliente. */
public record ApiError(String codigo, String mensaje, List<String> detalles) {

	public static ApiError of(String codigo, String mensaje) {
		return new ApiError(codigo, mensaje, List.of());
	}

}
