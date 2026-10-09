package com.uis.upland.alojamientos.api;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.uis.upland.alojamientos.domain.AlojamientoService;
import com.uis.upland.alojamientos.domain.CriteriosBusqueda;
import com.uis.upland.alojamientos.domain.OpcionesFiltro;
import com.uis.upland.alojamientos.domain.OrdenBusqueda;
import com.uis.upland.alojamientos.domain.ResumenAlojamiento;
import com.uis.upland.alojamientos.domain.TipoAlojamiento;
import com.uis.upland.shared.Pagina;
import com.uis.upland.shared.security.UsuarioAutenticado;

import jakarta.validation.Valid;

/** Quién puede llamar a cada ruta se decide en SecurityConfig; quién es dueño, en el servicio. */
@RestController
@RequestMapping("/api/alojamientos")
public class AlojamientoController {

	private final AlojamientoService alojamientoService;

	public AlojamientoController(AlojamientoService alojamientoService) {
		this.alojamientoService = alojamientoService;
	}

	/** Catálogo público. Todos los filtros son opcionales y se combinan entre sí. */
	@GetMapping
	public Pagina<ResumenAlojamiento> buscar(
			@RequestParam(required = false) String ciudad,
			@RequestParam(required = false) String zona,
			@RequestParam(required = false) TipoAlojamiento tipo,
			@RequestParam(required = false) BigDecimal precioMin,
			@RequestParam(required = false) BigDecimal precioMax,
			@RequestParam(required = false) Integer huespedes,
			@RequestParam(required = false) Integer habitaciones,
			@RequestParam(required = false) List<String> servicios,
			@RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate entrada,
			@RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate salida,
			@RequestParam(defaultValue = "POPULARES") OrdenBusqueda orden,
			@RequestParam(defaultValue = "0") int pagina,
			@RequestParam(defaultValue = "12") int tamano) {
		// Un parámetro que llega vacío (?ciudad=) cuenta como ausente.
		CriteriosBusqueda criterios = new CriteriosBusqueda(vacioANulo(ciudad), vacioANulo(zona), tipo, precioMin,
				precioMax, huespedes, habitaciones, servicios == null ? List.of() : servicios, entrada, salida, orden);
		return alojamientoService.buscar(criterios, pagina, tamano);
	}

	/** Ciudades, zonas, servicios y rango de precios disponibles para filtrar. */
	@GetMapping("/filtros")
	public OpcionesFiltro opcionesDeFiltro() {
		return alojamientoService.opcionesDeFiltro();
	}

	private static String vacioANulo(String texto) {
		return texto == null || texto.isBlank() ? null : texto.trim();
	}

	@GetMapping("/mios")
	public List<AlojamientoResponse> listarMios(@AuthenticationPrincipal UsuarioAutenticado actor) {
		return alojamientoService.listarDe(actor.id()).stream().map(AlojamientoResponse::from).toList();
	}

	@GetMapping("/{id}")
	public AlojamientoResponse obtener(@PathVariable UUID id) {
		return AlojamientoResponse.from(alojamientoService.obtener(id));
	}

	@PostMapping
	@ResponseStatus(HttpStatus.CREATED)
	public AlojamientoResponse crear(@AuthenticationPrincipal UsuarioAutenticado actor,
			@Valid @RequestBody AlojamientoRequest request) {
		return AlojamientoResponse.from(alojamientoService.crear(actor.id(), request.toDatos()));
	}

	@PutMapping("/{id}")
	public AlojamientoResponse actualizar(@PathVariable UUID id, @AuthenticationPrincipal UsuarioAutenticado actor,
			@Valid @RequestBody AlojamientoRequest request) {
		return AlojamientoResponse.from(alojamientoService.actualizar(id, actor.id(), request.toDatos()));
	}

	@DeleteMapping("/{id}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void eliminar(@PathVariable UUID id, @AuthenticationPrincipal UsuarioAutenticado actor) {
		alojamientoService.eliminar(id, actor.id());
	}

}
