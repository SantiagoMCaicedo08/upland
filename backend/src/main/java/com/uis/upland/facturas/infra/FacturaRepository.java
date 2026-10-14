package com.uis.upland.facturas.infra;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.uis.upland.facturas.domain.Factura;

public interface FacturaRepository extends JpaRepository<Factura, UUID> {

	Optional<Factura> findByReservaId(UUID reservaId);

}
