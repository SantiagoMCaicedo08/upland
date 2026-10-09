import { useEffect, useState } from 'react';
import { urlDeFoto } from '../formato.js';
import { IconoCasa } from './Iconos.jsx';

// Foto de un alojamiento. Las del dataset están alojadas fuera de Upland y una dirección
// ajena puede dejar de existir: si la imagen falla, o el alojamiento no tiene, se muestra
// un recuadro con un ícono en vez de una imagen rota.
export default function Foto({ url, ancho, alt = '' }) {
  const [fallo, setFallo] = useState(false);

  // Al cambiar de alojamiento hay que volver a intentarlo con la foto nueva.
  useEffect(() => setFallo(false), [url]);

  if (!url || fallo) {
    return (
      <div className="foto foto-vacia">
        <IconoCasa tamano={40} />
      </div>
    );
  }
  return (
    <img className="foto" src={urlDeFoto(url, ancho)} alt={alt} loading="lazy" onError={() => setFallo(true)} />
  );
}
