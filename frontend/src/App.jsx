import { Link, Route, Routes } from 'react-router-dom';
import Encabezado from './componentes/Encabezado.jsx';
import RutaProtegida from './componentes/RutaProtegida.jsx';
import Catalogo from './paginas/Catalogo.jsx';
import Detalle from './paginas/Detalle.jsx';
import FormularioAlojamiento from './paginas/FormularioAlojamiento.jsx';
import Login from './paginas/Login.jsx';
import Panel from './paginas/Panel.jsx';
import Registro from './paginas/Registro.jsx';

export default function App() {
  return (
    <>
      <Encabezado />
      <Routes>
        <Route path="/" element={<Catalogo />} />
        <Route path="/alojamientos/:id" element={<Detalle />} />
        <Route path="/login" element={<Login />} />
        <Route path="/registro" element={<Registro />} />
        <Route path="/panel" element={<RutaProtegida><Panel /></RutaProtegida>} />
        <Route path="/publicar" element={<RutaProtegida><FormularioAlojamiento /></RutaProtegida>} />
        <Route path="/alojamientos/:id/editar" element={<RutaProtegida><FormularioAlojamiento /></RutaProtegida>} />
        <Route path="*" element={<NoEncontrada />} />
      </Routes>
      <footer className="pie">
        <p>
          Upland · Proyecto de Entornos de Programación, UIS. Los alojamientos de Bogotá provienen
          de <a href="https://insideairbnb.com" target="_blank" rel="noreferrer">Inside Airbnb</a> (CC BY 4.0).
        </p>
      </footer>
    </>
  );
}

function NoEncontrada() {
  return (
    <main className="contenedor contenedor-angosto centrado">
      <h1>Página no encontrada</h1>
      <p className="suave">La dirección que abriste no existe.</p>
      <Link to="/" className="boton">Ir al catálogo</Link>
    </main>
  );
}
