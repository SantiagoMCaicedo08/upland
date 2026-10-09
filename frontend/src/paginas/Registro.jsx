import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { registrar } from '../api.js';
import MensajeError from '../componentes/MensajeError.jsx';

export default function Registro() {
  const navegar = useNavigate();
  const [datos, setDatos] = useState({ nombre: '', email: '', password: '', rol: 'HUESPED' });
  const [error, setError] = useState(null);
  const [enviando, setEnviando] = useState(false);

  function cambiar(evento) {
    const { name, value } = evento.target;
    setDatos((previos) => ({ ...previos, [name]: value }));
  }

  async function enviar(evento) {
    evento.preventDefault();
    setError(null);
    setEnviando(true);
    try {
      await registrar(datos);
      // El registro no devuelve token: la cuenta nueva pasa por el login como cualquier otra.
      navegar('/login?motivo=registro');
    } catch (fallo) {
      setError(fallo);
      setEnviando(false);
    }
  }

  return (
    <main className="contenedor contenedor-angosto">
      <div className="tarjeta-formulario">
        <h1>Crear cuenta</h1>
        <MensajeError error={error} />

        <form onSubmit={enviar} className="formulario">
          <label className="campo">
            <span>Nombre</span>
            <input type="text" name="nombre" autoComplete="name" maxLength={120} required value={datos.nombre}
              onChange={cambiar} />
          </label>
          <label className="campo">
            <span>Email</span>
            <input type="email" name="email" autoComplete="email" maxLength={255} required value={datos.email}
              onChange={cambiar} />
          </label>
          <label className="campo">
            <span>Contraseña</span>
            <input type="password" name="password" autoComplete="new-password" minLength={8} maxLength={72}
              required value={datos.password} onChange={cambiar} />
            <small className="suave">Mínimo 8 caracteres.</small>
          </label>

          <fieldset className="campo">
            <legend>¿Para qué usarás Upland?</legend>
            <div className="opciones-rol">
              <label className={datos.rol === 'HUESPED' ? 'opcion-rol opcion-rol-activa' : 'opcion-rol'}>
                <input type="radio" name="rol" value="HUESPED" checked={datos.rol === 'HUESPED'} onChange={cambiar} />
                <strong>Quiero hospedarme</strong>
                <span className="suave">Buscar y reservar alojamientos.</span>
              </label>
              <label className={datos.rol === 'ANFITRION' ? 'opcion-rol opcion-rol-activa' : 'opcion-rol'}>
                <input type="radio" name="rol" value="ANFITRION" checked={datos.rol === 'ANFITRION'}
                  onChange={cambiar} />
                <strong>Quiero publicar</strong>
                <span className="suave">Ofrecer mis alojamientos.</span>
              </label>
            </div>
          </fieldset>

          <button type="submit" className="boton boton-ancho" disabled={enviando}>
            {enviando ? 'Creando cuenta…' : 'Crear cuenta'}
          </button>
        </form>

        <p className="formulario-pie">
          ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
        </p>
      </div>
    </main>
  );
}
