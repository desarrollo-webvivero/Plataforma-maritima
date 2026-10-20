import axios from 'axios';

// Creamos la instancia centralizada para el microservicio de Logística
export const logisticaApi = axios.create({
    // Usa la variable de entorno, o cae por defecto al puerto 8081 si no existe
    baseURL: import.meta.env.VITE_API_LOGISTICA || 'http://localhost:8081',
    
    // CRÍTICO: Obliga a Axios a enviar siempre cookies/sesiones si existieran
    withCredentials: false,
    
    // Opcional: headers por defecto que tu backend siempre esperará
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
});

// Interceptor (Opcional pero recomendado): Para atrapar errores globales
logisticaApi.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 500) {
            console.error("Error interno del servidor en Logística");
        }
        return Promise.reject(error);
    }
);

// Si más adelante creas el microservicio de Aduana en el puerto 8082, 
// simplemente agregas otra instancia aquí:
// export const aduanaApi = axios.create({ ... baseURL: 'http://localhost:8082' });