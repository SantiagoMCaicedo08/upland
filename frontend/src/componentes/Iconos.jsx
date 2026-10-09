// Íconos como SVG en línea: no hace falta una librería para media docena de dibujos.
// currentColor hace que tomen el color del texto que los rodea.

function Icono({ children, tamano = 20 }) {
  return (
    <svg width={tamano} height={tamano} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  );
}

export function IconoMarca({ tamano = 28 }) {
  return (
    <svg width={tamano} height={tamano} viewBox="0 0 32 32" aria-hidden="true">
      <rect width="32" height="32" rx="9" fill="currentColor" />
      <path d="M6 22 13 11l5 7 3-4 5 8z" fill="#ffffff" />
    </svg>
  );
}

export function IconoCasa(props) {
  return <Icono {...props}><path d="M3 11.5 12 4l9 7.5" /><path d="M5 10v10h14V10" /><path d="M10 20v-6h4v6" /></Icono>;
}

export function IconoCheck(props) {
  return <Icono {...props}><path d="M5 12.5 10 17l9-10" /></Icono>;
}

export function IconoFiltros(props) {
  return <Icono {...props}><path d="M4 6h16" /><path d="M7 12h10" /><path d="M10 18h4" /></Icono>;
}

export function IconoUbicacion(props) {
  return <Icono {...props}><path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.5" /></Icono>;
}

export function IconoBuscar(props) {
  return <Icono {...props}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></Icono>;
}

export function Estrella() {
  return <span className="estrella" aria-hidden="true">★</span>;
}
