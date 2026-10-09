import { useEffect, useState } from 'react';
import { diaSiguiente, fechaLocal } from '../formato.js';
import { IconoBuscar } from './Iconos.jsx';

// Barra de búsqueda principal: destino, fechas y huéspedes. A diferencia del panel de
// filtros, no busca con cada tecla: guarda lo que se escribe en un estado propio y solo lo
// entrega al pulsar Buscar.
export default function Buscador({ filtros, ciudades, alBuscar }) {
  const [valores, setValores] = useState(filtros);

  // Si los filtros cambian por otro lado (el botón Atrás, una etiqueta que se quita), la
  // barra debe mostrar lo mismo que la URL.
  useEffect(() => {
    setValores({
      ciudad: filtros.ciudad,
      entrada: filtros.entrada,
      salida: filtros.salida,
      huespedes: filtros.huespedes,
    });
  }, [filtros.ciudad, filtros.entrada, filtros.salida, filtros.huespedes]);

  function cambiar(evento) {
    const { name, value } = evento.target;
    setValores((previos) => ({ ...previos, [name]: value }));
  }

  function enviar(evento) {
    evento.preventDefault();
    alBuscar({
      ciudad: valores.ciudad,
      // La zona pertenece a una ciudad: si cambia la ciudad, la zona elegida deja de valer.
      ...(valores.ciudad !== filtros.ciudad ? { zona: '' } : {}),
      entrada: valores.entrada,
      salida: valores.salida,
      huespedes: valores.huespedes,
    });
  }

  return (
    <form className="buscador" onSubmit={enviar} role="search">
      <label className="buscador-campo">
        <span>Destino</span>
        <select name="ciudad" value={valores.ciudad} onChange={cambiar}>
          <option value="">Cualquier ciudad</option>
          {ciudades.map((ciudad) => <option key={ciudad.nombre} value={ciudad.nombre}>{ciudad.nombre}</option>)}
        </select>
      </label>

      {/* Las fechas van juntas o no van: si se llena una, el navegador exige la otra. */}
      <label className="buscador-campo">
        <span>Entrada</span>
        <input type="date" name="entrada" value={valores.entrada} min={fechaLocal()}
          required={Boolean(valores.salida)} onChange={cambiar} />
      </label>
      <label className="buscador-campo">
        <span>Salida</span>
        <input type="date" name="salida" value={valores.salida}
          min={valores.entrada ? diaSiguiente(valores.entrada) : fechaLocal(1)}
          required={Boolean(valores.entrada)} onChange={cambiar} />
      </label>

      <label className="buscador-campo buscador-campo-corto">
        <span>Huéspedes</span>
        <input type="number" name="huespedes" value={valores.huespedes} min="1" max="30"
          placeholder="Cuántos" onChange={cambiar} />
      </label>

      <button type="submit" className="boton buscador-boton">
        <IconoBuscar tamano={18} />
        <span>Buscar</span>
      </button>
    </form>
  );
}
