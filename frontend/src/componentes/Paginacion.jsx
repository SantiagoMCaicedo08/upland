import { formatearNumero } from '../formato.js';

// Qué números mostrar: siempre la primera y la última página, y dos a cada lado de la
// actual. Con 1.563 páginas y la 40 abierta queda 1 … 38 39 [40] 41 42 … 1563.
function paginasVisibles(actual, total) {
  const paginas = new Set([1, total]);
  for (let pagina = actual - 2; pagina <= actual + 2; pagina += 1) {
    if (pagina >= 1 && pagina <= total) paginas.add(pagina);
  }
  return [...paginas].sort((a, b) => a - b);
}

export default function Paginacion({ actual, total, alCambiar }) {
  if (total <= 1) return null;
  const paginas = paginasVisibles(actual, total);

  return (
    <nav className="paginacion" aria-label="Páginas de resultados">
      <button type="button" className="pagina" disabled={actual === 1} onClick={() => alCambiar(actual - 1)}>
        Anterior
      </button>

      {paginas.map((pagina, indice) => (
        <span key={pagina} className="pagina-grupo">
          {/* Un hueco entre números consecutivos se marca con puntos suspensivos. */}
          {indice > 0 && pagina - paginas[indice - 1] > 1 && <span className="pagina-hueco">…</span>}
          <button
            type="button"
            className={pagina === actual ? 'pagina pagina-actual' : 'pagina'}
            aria-current={pagina === actual ? 'page' : undefined}
            onClick={() => alCambiar(pagina)}
          >
            {formatearNumero(pagina)}
          </button>
        </span>
      ))}

      <button type="button" className="pagina" disabled={actual === total} onClick={() => alCambiar(actual + 1)}>
        Siguiente
      </button>
    </nav>
  );
}
