import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { iniciarSesion } from '../api.js';
import MensajeError from '../componentes/MensajeError.jsx';
import { useSesion } from '../contexto/Sesion.jsx';

const AVISOS = {
  sesion: 'Tu sesión expiró o dejó de ser válida. Inicia sesión de nuevo.',
  registro: 'Cuenta creada. Ya puedes iniciar sesión.',
};

export default function Login() {
  const { usuario, iniciar } = useSesion();
  const navegar = useNavigate();
  const ubicacion = useLocation();
  const [parametros] = useSearchParams();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [enviando, setEnviando] = useState(false);

  // A dónde volver después de entrar: la página protegida que mandó aquí, o el panel.
  const destino = ubicacion.state?.desde ?? '/panel';
  // hasOwn evita que ?motivo=toString termine mostrando una función heredada de Object.
  const motivo = parametros.get('motivo');
  const aviso = Object.hasOwn(AVISOS, motivo) ? AVISOS[motivo] : null;

  if (usuario) {
    return <Navigate to={destino} replace />;
  }

  async function enviar(evento) {
    evento.preventDefault();
    setError(null);
    setEnviando(true);
    try {
      const { token } = await iniciarSesion(email, password);
      // Al guardar el token cambia `usuario`, y el <Navigate> de arriba hace la redirección.
      iniciar(token);
    } catch (fallo) {
      setError(fallo);
      setEnviando(false);
    }
  }

  return (
    <main className="contenedor contenedor-angosto">
      <div className="tarjeta-formulario">
        <h1>Iniciar sesión</h1>
        {aviso && <p className="mensaje mensaje-aviso">{aviso}</p>}
        <MensajeError error={error} />

        <form onSubmit={enviar} className="formulario">
          <label className="campo">
            <span>Email</span>
            <input type="email" name="email" autoComplete="email" required value={email}
              onChange={(evento) => setEmail(evento.target.value)} />
          </label>
          <label className="campo">
            <span>Contraseña</span>
            <input type="password" name="password" autoComplete="current-password" required value={password}
              onChange={(evento) => setPassword(evento.target.value)} />
          </label>
          <button type="submit" className="boton boton-ancho" disabled={enviando}>
            {enviando ? 'Entrando…' : 'Entrar'}
          </button>
        </form>

        <p className="formulario-pie">
          ¿No tienes cuenta? <Link to="/registro" state={ubicacion.state}>Regístrate</Link>
        </p>
      </div>
    </main>
  );
}
