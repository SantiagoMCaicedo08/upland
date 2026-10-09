import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { actualizarAlojamiento, crearAlojamiento, obtenerAlojamiento, obtenerOpcionesDeFiltro } from '../api.js';
import Foto from '../componentes/Foto.jsx';
import MensajeError from '../componentes/MensajeError.jsx';
import { TIPOS } from '../formato.js';

const VACIO = {
  titulo: '', descripcion: '', ciudad: '', zona: '', direccion: '', latitud: '', longitud: '',
  tipo: 'ALOJAMIENTO_ENTERO', capacidad: '', habitaciones: '', camas: '', banos: '', servicios: [],
  precioNoche: '', fotoUrl: '',
};
const CAMPOS_NUMERICOS = ['latitud', 'longitud', 'capacidad', 'habitaciones', 'camas', 'banos', 'precioNoche'];
const CAMPOS_OPCIONALES_DE_TEXTO = ['zona', 'fotoUrl'];

// Los campos de un formulario son texto. Un campo opcional que quedó vacío viaja como null:
// así el backend distingue "sin coordenadas" de "coordenadas 0, 0", y "sin foto" de una
// dirección mal escrita.
function aCuerpo(datos) {
  const cuerpo = { ...datos };
  for (const campo of CAMPOS_NUMERICOS) {
    cuerpo[campo] = String(datos[campo]).trim() === '' ? null : Number(datos[campo]);
  }
  for (const campo of CAMPOS_OPCIONALES_DE_TEXTO) {
    cuerpo[campo] = datos[campo].trim() === '' ? null : datos[campo].trim();
  }
  return cuerpo;
}

// Lo contrario: de lo que devuelve la API a texto para los campos.
function aFormulario(alojamiento) {
  const datos = {};
  for (const campo of Object.keys(VACIO)) {
    datos[campo] = alojamiento[campo] ?? VACIO[campo];
  }
  return datos;
}

// Un mismo formulario para crear (/publicar) y para editar (/alojamientos/:id/editar).
export default function FormularioAlojamiento() {
  const { id } = useParams();
  const navegar = useNavigate();
  const editando = Boolean(id);

  const [datos, setDatos] = useState(VACIO);
  const [serviciosDisponibles, setServiciosDisponibles] = useState([]);
  const [error, setError] = useState(null);
  const [cargando, setCargando] = useState(editando);
  const [noCargo, setNoCargo] = useState(false);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    obtenerOpcionesDeFiltro().then((opciones) => setServiciosDisponibles(opciones.servicios)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!editando) {
      setDatos(VACIO);
      return undefined;
    }
    let vigente = true;
    obtenerAlojamiento(id)
      .then((alojamiento) => {
        if (vigente) {
          setDatos(aFormulario(alojamiento));
          setCargando(false);
        }
      })
      .catch((fallo) => {
        if (vigente) {
          setError(fallo);
          setNoCargo(true);
          setCargando(false);
        }
      });
    return () => {
      vigente = false;
    };
  }, [id, editando]);

  function cambiar(evento) {
    const { name, value } = evento.target;
    setDatos((previos) => ({ ...previos, [name]: value }));
  }

  function alternarServicio(servicio) {
    setDatos((previos) => ({
      ...previos,
      servicios: previos.servicios.includes(servicio)
        ? previos.servicios.filter((otro) => otro !== servicio)
        : [...previos.servicios, servicio],
    }));
  }

  async function enviar(evento) {
    evento.preventDefault();
    setError(null);
    setEnviando(true);
    try {
      if (editando) {
        await actualizarAlojamiento(id, aCuerpo(datos));
      } else {
        await crearAlojamiento(aCuerpo(datos));
      }
      navegar('/panel', { state: { aviso: editando ? 'Cambios guardados.' : 'Alojamiento publicado.' } });
    } catch (fallo) {
      // Aquí caen el 400 de validación y el 403 de quien intenta editar un alojamiento ajeno.
      setError(fallo);
      setEnviando(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  if (cargando) {
    return <main className="contenedor contenedor-medio"><p className="suave">Cargando…</p></main>;
  }
  // Sin los datos actuales no tiene sentido mostrar un formulario de edición vacío.
  if (noCargo) {
    return (
      <main className="contenedor contenedor-medio">
        <MensajeError error={error} />
        <Link to="/panel" className="boton boton-secundario">Volver a mi panel</Link>
      </main>
    );
  }

  // Los servicios que ya tiene el alojamiento se ofrecen aunque no estén en la lista común.
  const servicios = [...new Set([...serviciosDisponibles, ...datos.servicios])];

  return (
    <main className="contenedor contenedor-medio">
      <h1>{editando ? 'Editar alojamiento' : 'Publicar alojamiento'}</h1>
      <MensajeError error={error} />

      <form onSubmit={enviar} className="tarjeta-formulario formulario">
        <h2>Lo básico</h2>
        <label className="campo">
          <span>Título</span>
          <input type="text" name="titulo" maxLength={150} required value={datos.titulo} onChange={cambiar} />
        </label>
        <label className="campo">
          <span>Descripción</span>
          <textarea name="descripcion" rows={5} maxLength={5000} required value={datos.descripcion}
            onChange={cambiar} />
        </label>
        <div className="campos-en-fila">
          <label className="campo">
            <span>Tipo</span>
            <select name="tipo" value={datos.tipo} onChange={cambiar}>
              {TIPOS.map(([codigo, nombre]) => <option key={codigo} value={codigo}>{nombre}</option>)}
            </select>
          </label>
          <label className="campo">
            <span>Precio por noche (COP)</span>
            <input type="number" name="precioNoche" min="1" step="0.01" required value={datos.precioNoche}
              onChange={cambiar} />
          </label>
        </div>

        <h2>Ubicación</h2>
        <div className="campos-en-fila">
          <label className="campo">
            <span>Ciudad</span>
            <input type="text" name="ciudad" maxLength={100} required value={datos.ciudad} onChange={cambiar} />
          </label>
          <label className="campo">
            <span>Zona o barrio <em className="suave">(opcional)</em></span>
            <input type="text" name="zona" maxLength={100} value={datos.zona} onChange={cambiar} />
          </label>
        </div>
        <label className="campo">
          <span>Dirección</span>
          <input type="text" name="direccion" maxLength={255} required value={datos.direccion} onChange={cambiar} />
        </label>
        <div className="campos-en-fila">
          <label className="campo">
            <span>Latitud <em className="suave">(opcional)</em></span>
            <input type="number" name="latitud" min="-90" max="90" step="any" value={datos.latitud}
              onChange={cambiar} />
          </label>
          <label className="campo">
            <span>Longitud <em className="suave">(opcional)</em></span>
            <input type="number" name="longitud" min="-180" max="180" step="any" value={datos.longitud}
              onChange={cambiar} />
          </label>
        </div>

        <h2>Espacio</h2>
        <div className="campos-en-fila campos-cortos">
          <label className="campo">
            <span>Huéspedes</span>
            <input type="number" name="capacidad" min="1" step="1" required value={datos.capacidad}
              onChange={cambiar} />
          </label>
          <label className="campo">
            <span>Habitaciones</span>
            <input type="number" name="habitaciones" min="0" step="1" value={datos.habitaciones} onChange={cambiar} />
          </label>
          <label className="campo">
            <span>Camas</span>
            <input type="number" name="camas" min="0" step="1" value={datos.camas} onChange={cambiar} />
          </label>
          <label className="campo">
            <span>Baños</span>
            <input type="number" name="banos" min="0" step="0.5" value={datos.banos} onChange={cambiar} />
          </label>
        </div>

        {servicios.length > 0 && (
          <>
            <h2>Servicios</h2>
            <div className="casillas casillas-en-columnas">
              {servicios.map((servicio) => (
                <label key={servicio} className="casilla">
                  <input type="checkbox" checked={datos.servicios.includes(servicio)}
                    onChange={() => alternarServicio(servicio)} />
                  <span>{servicio}</span>
                </label>
              ))}
            </div>
          </>
        )}

        <h2>Foto</h2>
        <label className="campo">
          <span>Dirección web de la foto <em className="suave">(opcional)</em></span>
          <input type="url" name="fotoUrl" maxLength={500} placeholder="https://…" value={datos.fotoUrl}
            onChange={cambiar} />
        </label>
        {datos.fotoUrl && (
          <div className="vista-previa"><Foto url={datos.fotoUrl} ancho={480} alt="Vista previa de la foto" /></div>
        )}

        <div className="formulario-acciones">
          <Link to="/panel" className="boton boton-secundario">Cancelar</Link>
          <button type="submit" className="boton" disabled={enviando}>
            {enviando ? 'Guardando…' : editando ? 'Guardar cambios' : 'Publicar'}
          </button>
        </div>
      </form>
    </main>
  );
}
