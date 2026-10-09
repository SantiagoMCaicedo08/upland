package com.uis.upland.shared;

import java.util.List;

/**
 * Página de resultados con tipos propios. No se devuelve el Page de Spring Data porque ata
 * el contrato a JPA: la búsqueda sobre MongoDB de la fase 2 tiene que poder devolver lo mismo.
 */
public record Pagina<T>(List<T> contenido, int pagina, int tamano, long totalElementos, int totalPaginas) {
}
