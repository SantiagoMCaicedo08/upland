package com.uis.upland.reservas.domain;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "reservas")
public class Reserva {

	@Id
	@GeneratedValue(strategy = GenerationType.UUID)
	private UUID id;

	// Solo los ids: Alojamiento y Usuario son entidades de otros módulos.
	private UUID alojamientoId;

	private UUID huespedId;

	private LocalDate fechaEntrada;

	private LocalDate fechaSalida;

	private BigDecimal valorTotal;

	@Enumerated(EnumType.STRING)
	private EstadoReserva estado;

	private Instant fechaCreacion;

	/** Constructor que exige JPA; no se usa desde el código. */
	protected Reserva() {
	}

	public Reserva(UUID alojamientoId, UUID huespedId, LocalDate fechaEntrada, LocalDate fechaSalida,
			BigDecimal valorTotal) {
		this.alojamientoId = alojamientoId;
		this.huespedId = huespedId;
		this.fechaEntrada = fechaEntrada;
		this.fechaSalida = fechaSalida;
		this.valorTotal = valorTotal;
		this.estado = EstadoReserva.CONFIRMADA;
		this.fechaCreacion = Instant.now();
	}

	/** El día de salida no cuenta: del 10 al 13 son tres noches. */
	public long getNoches() {
		return ChronoUnit.DAYS.between(fechaEntrada, fechaSalida);
	}

	public UUID getId() {
		return id;
	}

	public UUID getAlojamientoId() {
		return alojamientoId;
	}

	public UUID getHuespedId() {
		return huespedId;
	}

	public LocalDate getFechaEntrada() {
		return fechaEntrada;
	}

	public LocalDate getFechaSalida() {
		return fechaSalida;
	}

	public BigDecimal getValorTotal() {
		return valorTotal;
	}

	public EstadoReserva getEstado() {
		return estado;
	}

	public Instant getFechaCreacion() {
		return fechaCreacion;
	}

}
