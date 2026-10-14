package com.uis.upland.facturas.domain;

import java.util.UUID;

import org.springframework.stereotype.Service;

import com.uis.upland.facturas.infra.FacturaRepository;

@Service
public class FacturaService {

	private final FacturaRepository facturaRepository;

	public FacturaService(FacturaRepository facturaRepository) {
		this.facturaRepository = facturaRepository;
	}

	/**
	 * La llama ReservaService dentro de la transacción que crea la reserva: si algo falla,
	 * no queda ni reserva sin factura ni factura sin reserva. No devuelve la entidad porque
	 * no debe salir de este módulo.
	 */
	public void emitir(DatosFactura datos) {
		facturaRepository.saveAndFlush(new Factura(datos));
	}

	/** Si la reserva no existe responde 404; si existe pero es de otros, 403. */
	public Factura obtenerDeReserva(UUID reservaId, UUID actorId) {
		Factura factura = facturaRepository.findByReservaId(reservaId).orElseThrow(FacturaNoEncontradaException::new);
		if (!factura.esDe(actorId)) {
			throw new FacturaAjenaException();
		}
		return factura;
	}

}
