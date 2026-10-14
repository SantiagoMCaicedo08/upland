package com.uis.upland.facturas.domain;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

import org.hibernate.annotations.Generated;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/** Una factura no se edita: solo tiene constructor y getters. */
@Entity
@Table(name = "facturas")
public class Factura {

	@Id
	@GeneratedValue(strategy = GenerationType.UUID)
	private UUID id;

	// Lo asigna PostgreSQL (GENERATED ALWAYS AS IDENTITY): Hibernate no lo envía en el INSERT
	// y @Generated hace que lo lea de vuelta después de insertar.
	@Generated
	@Column(insertable = false, updatable = false)
	private Long numero;

	private UUID reservaId;

	private UUID huespedId;

	private UUID anfitrionId;

	private String huespedNombre;

	private String huespedEmail;

	private String anfitrionNombre;

	private String anfitrionEmail;

	private String alojamientoTitulo;

	private String alojamientoCiudad;

	private LocalDate fechaEntrada;

	private LocalDate fechaSalida;

	private int noches;

	private BigDecimal precioNoche;

	private BigDecimal total;

	private Instant fechaEmision;

	/** Constructor que exige JPA; no se usa desde el código. */
	protected Factura() {
	}

	public Factura(DatosFactura datos) {
		this.reservaId = datos.reservaId();
		this.huespedId = datos.huesped().id();
		this.huespedNombre = datos.huesped().nombre();
		this.huespedEmail = datos.huesped().email();
		this.anfitrionId = datos.anfitrion().id();
		this.anfitrionNombre = datos.anfitrion().nombre();
		this.anfitrionEmail = datos.anfitrion().email();
		this.alojamientoTitulo = datos.alojamientoTitulo();
		this.alojamientoCiudad = datos.alojamientoCiudad();
		this.fechaEntrada = datos.fechaEntrada();
		this.fechaSalida = datos.fechaSalida();
		this.noches = (int) ChronoUnit.DAYS.between(datos.fechaEntrada(), datos.fechaSalida());
		this.precioNoche = datos.precioNoche();
		this.total = datos.precioNoche().multiply(BigDecimal.valueOf(noches));
		this.fechaEmision = Instant.now();
	}

	/** Solo el huésped y el anfitrión de la reserva pueden ver su factura. */
	public boolean esDe(UUID usuarioId) {
		return huespedId.equals(usuarioId) || anfitrionId.equals(usuarioId);
	}

	public UUID getId() {
		return id;
	}

	public Long getNumero() {
		return numero;
	}

	public UUID getReservaId() {
		return reservaId;
	}

	public String getHuespedNombre() {
		return huespedNombre;
	}

	public String getHuespedEmail() {
		return huespedEmail;
	}

	public String getAnfitrionNombre() {
		return anfitrionNombre;
	}

	public String getAnfitrionEmail() {
		return anfitrionEmail;
	}

	public String getAlojamientoTitulo() {
		return alojamientoTitulo;
	}

	public String getAlojamientoCiudad() {
		return alojamientoCiudad;
	}

	public LocalDate getFechaEntrada() {
		return fechaEntrada;
	}

	public LocalDate getFechaSalida() {
		return fechaSalida;
	}

	public int getNoches() {
		return noches;
	}

	public BigDecimal getPrecioNoche() {
		return precioNoche;
	}

	public BigDecimal getTotal() {
		return total;
	}

	public Instant getFechaEmision() {
		return fechaEmision;
	}

}
