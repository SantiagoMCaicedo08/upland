package com.uis.upland.alojamientos.domain;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "alojamientos")
public class Alojamiento {

	@Id
	@GeneratedValue(strategy = GenerationType.UUID)
	private UUID id;

	// Solo el id, sin @ManyToOne hacia Usuario: esa entidad pertenece a otro módulo y no
	// se importa desde aquí. La integridad la sostiene la clave foránea de la tabla.
	private UUID anfitrionId;

	private String titulo;

	private String descripcion;

	private String ciudad;

	private String direccion;

	private Double latitud;

	private Double longitud;

	private int capacidad;

	private BigDecimal precioNoche;

	private boolean activo;

	private Instant fechaCreacion;

	/** Constructor que exige JPA; no se usa desde el código. */
	protected Alojamiento() {
	}

	public Alojamiento(UUID anfitrionId, DatosAlojamiento datos) {
		this.anfitrionId = anfitrionId;
		this.activo = true;
		this.fechaCreacion = Instant.now();
		actualizar(datos);
	}

	public void actualizar(DatosAlojamiento datos) {
		this.titulo = datos.titulo();
		this.descripcion = datos.descripcion();
		this.ciudad = datos.ciudad();
		this.direccion = datos.direccion();
		this.latitud = datos.latitud();
		this.longitud = datos.longitud();
		this.capacidad = datos.capacidad();
		this.precioNoche = datos.precioNoche();
	}

	public void desactivar() {
		this.activo = false;
	}

	public UUID getId() {
		return id;
	}

	public UUID getAnfitrionId() {
		return anfitrionId;
	}

	public String getTitulo() {
		return titulo;
	}

	public String getDescripcion() {
		return descripcion;
	}

	public String getCiudad() {
		return ciudad;
	}

	public String getDireccion() {
		return direccion;
	}

	public Double getLatitud() {
		return latitud;
	}

	public Double getLongitud() {
		return longitud;
	}

	public int getCapacidad() {
		return capacidad;
	}

	public BigDecimal getPrecioNoche() {
		return precioNoche;
	}

	public boolean isActivo() {
		return activo;
	}

	public Instant getFechaCreacion() {
		return fechaCreacion;
	}

}
