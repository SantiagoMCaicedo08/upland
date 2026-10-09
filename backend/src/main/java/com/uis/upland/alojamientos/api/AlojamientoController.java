package com.uis.upland.alojamientos.api;

import java.util.List;
import java.util.UUID;

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
import com.uis.upland.alojamientos.domain.ResumenAlojamiento;
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

	@GetMapping
	public Pagina<ResumenAlojamiento> listar(@RequestParam(defaultValue = "0") int pagina,
			@RequestParam(defaultValue = "12") int tamano) {
		return alojamientoService.listar(pagina, tamano);
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
