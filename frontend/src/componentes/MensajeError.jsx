// Muestra un ErrorApi: el mensaje y, si los hay, los detalles de validación del backend.
export default function MensajeError({ error }) {
  if (!error) return null;
  return (
    <div className="mensaje mensaje-error" role="alert">
      <p>{error.message}</p>
      {error.detalles?.length > 0 && (
        <ul>
          {error.detalles.map((detalle) => <li key={detalle}>{detalle}</li>)}
        </ul>
      )}
    </div>
  );
}
