import axios from 'axios';

// Instancia base para Logística
export const logisticaApi = axios.create({
    baseURL: '/api/logistica',
    headers: { 'Content-Type': 'application/json' }
});

// Instancia base para Aduanas
export const aduanaApi = axios.create({
    baseURL: '/api/aduana',
    headers: { 'Content-Type': 'application/json' }
});

// Ejemplo: logisticaApi.get('/buques') internamente llamará a http://localhost:8080/api/logistica/buques