import axios from 'axios';
import { obtenerSesion } from './session';

export const logisticaApi = axios.create({
  baseURL: import.meta.env.VITE_API_LOGISTICA || 'http://localhost:8081',
  withCredentials: false,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json'
  }
});

// Rutas que no necesitan sesión
const RUTAS_PUBLICAS = ['/usuarios/login', '/usuarios/registro', '/api/logistica/ping'];
const esPublica = (url = '') => RUTAS_PUBLICAS.some((r) => url.startsWith(r));

logisticaApi.interceptors.request.use((config) => {
  if (esPublica(config.url)) {
    delete config.headers.Authorization;
    return config;
  }

  const token = obtenerSesion()?.token;

  // Sin sesión no se envía la petición: así no se llena la consola de errores 401
  if (typeof token !== 'string' || !token.trim()) {
    return Promise.reject(new axios.CanceledError('sin-sesion'));
  }

  config.headers.Authorization = `Bearer ${token}`;
  return config;
});

logisticaApi.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error.config?.url || '';

    // Token vencido o inválido: se cierra la sesión una sola vez y se avisa a la app
    if (error.response?.status === 401 && !esPublica(url) && obtenerSesion()?.token) {
      window.dispatchEvent(new Event('sesionExpirada'));
    }

    return Promise.reject(error);
  }
);
