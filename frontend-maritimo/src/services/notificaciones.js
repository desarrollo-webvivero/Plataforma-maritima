// Sistema mínimo de avisos en pantalla (reemplaza alert() y los errores en consola).
const oyentes = new Set();

export const notificar = (mensaje, tipo = 'error') => {
  if (!mensaje) return;
  const aviso = { id: `${Date.now()}-${Math.random()}`, mensaje, tipo };
  oyentes.forEach((fn) => fn(aviso));
};

export const suscribirAvisos = (fn) => {
  oyentes.add(fn);
  return () => oyentes.delete(fn);
};

// Convierte cualquier error en un texto corto y seguro para el usuario.
// Solo se muestra el texto del servidor en errores 400/409 (mensajes ya revisados);
// en cualquier otro caso se usa un mensaje genérico, sin detalles técnicos.
export const mensajeError = (
  error,
  porDefecto = 'No se pudo completar la operación. Intenta nuevamente.'
) => {
  if (error?.code === 'ERR_CANCELED') return 'Inicia sesión para continuar.';

  const status = error?.response?.status;

  if (!error?.response) return 'No se pudo conectar con el servidor. Intenta nuevamente.';
  if (status === 401) return 'Tu sesión expiró. Inicia sesión nuevamente.';
  if (status === 403) return 'No tienes permiso para realizar esta acción.';
  if (status === 429) return 'Demasiados intentos. Espera un momento e inténtalo de nuevo.';

  if (status === 400 || status === 409) {
    const texto = error.response.data?.error;
    if (typeof texto === 'string' && texto.length > 0 && texto.length <= 200) return texto;
  }

  return porDefecto;
};
