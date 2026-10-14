import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { obtenerFactura } from '../api.js';
import MensajeError from '../componentes/MensajeError.jsx';
import { contar, formatearFecha, formatearPrecio } from '../formato.js';

const formatoEmision = new Intl.DateTimeFormat('es-CO', { dateStyle: 'long', timeStyle: 'short' });

// El número se guarda como entero (17); en el documento se muestra como UP-000017.
function codigoDeFactura(numero) {
  return `UP-${String(numero).padStart(6, '0')}`;
}

// Factura de una reserva. La ruta es protegida, y además el backend solo la entrega al
// huésped o al anfitrión de esa reserva; a cualquier otro le responde 403.
export default function Factura() {
  const { id } = useParams();
  const [factura, setFactura] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let vigente = true;
    obtenerFactura(id)
      .then((datos) => {
        if (!vigente) return;
        setFactura(datos);
        // El título de la pestaña es el nombre que el navegador propone para el PDF.
        document.title = `Factura ${codigoDeFactura(datos.numero)} · Upland`;
      })
      .catch((fallo) => {
        if (vigente) setError(fallo);
      });
    return () => {
      vigente = false;
      document.title = 'Upland · Alojamientos';
    };
  }, [id]);

  return (
    <main className="contenedor contenedor-medio">
      <div className="factura-acciones no-imprimir">
        <Link to="/panel" className="boton boton-secundario">Volver a mi panel</Link>
        {/* Imprimir abre el diálogo del navegador, que también permite guardar como PDF. */}
        {factura && <button type="button" className="boton" onClick={() => window.print()}>Imprimir o guardar PDF</button>}
      </div>

      <MensajeError error={error} />
      {!factura && !error && <p className="suave">Cargando factura…</p>}

      {factura && (
        <article className="factura">
          <header className="factura-cabecera">
            <div>
              <p className="factura-marca">Upland</p>
              <p className="suave">Plataforma de reserva de alojamientos</p>
            </div>
            <div className="factura-numero">
              <p className="suave">Factura</p>
              <p className="factura-codigo">{codigoDeFactura(factura.numero)}</p>
              <p className="suave">Emitida el {formatoEmision.format(new Date(factura.fechaEmision))}</p>
            </div>
          </header>

          <div className="factura-partes">
            <section>
              <h2>Huésped</h2>
              <p>{factura.huespedNombre}</p>
              <p className="suave">{factura.huespedEmail}</p>
            </section>
            <section>
              <h2>Anfitrión</h2>
              <p>{factura.anfitrionNombre}</p>
              <p className="suave">{factura.anfitrionEmail}</p>
            </section>
          </div>

          <table className="factura-detalle">
            <thead>
              <tr>
                <th>Descripción</th>
                <th>Noches</th>
                <th>Precio por noche</th>
                <th>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <strong>{factura.alojamientoTitulo}, {factura.alojamientoCiudad}</strong>
                  <span className="suave">
                    Del {formatearFecha(factura.fechaEntrada)} al {formatearFecha(factura.fechaSalida)} · {contar(factura.noches, 'noche', 'noches')}
                  </span>
                </td>
                <td>{factura.noches}</td>
                <td>{formatearPrecio(factura.precioNoche)}</td>
                <td>{formatearPrecio(factura.total)}</td>
              </tr>
            </tbody>
            <tfoot>
              <tr>
                <th colSpan={3}>Total</th>
                <td>{formatearPrecio(factura.total)}</td>
              </tr>
            </tfoot>
          </table>

          <p className="factura-nota suave">
            Documento de demostración generado por Upland, proyecto académico de la Universidad Industrial de
            Santander. No es una factura electrónica ante la DIAN y no incluye impuestos.
          </p>
        </article>
      )}
    </main>
  );
}
