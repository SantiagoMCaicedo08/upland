// Dirección del backend. Es lo único que cambia entre el desarrollo local y un despliegue:
// Vite la toma de la variable de entorno VITE_API_URL al construir, si está definida.
export const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080';
