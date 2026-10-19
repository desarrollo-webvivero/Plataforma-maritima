import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 50 },  // Carga nominal: Subir a 50 usuarios concurrentes
    { duration: '1m', target: 50 },   // Mantener carga nominal
    { duration: '30s', target: 200 }, // Carga pico / Estrés: Subir a 200 usuarios
    { duration: '30s', target: 0 },   // Descenso gradual (recuperación)
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // El 95% de las solicitudes deben responder en < 500ms
    http_req_failed: ['rate<0.01'],   // Tasa de errores menor al 1%
  },
};

export default function () {
  const url = 'http://localhost:8081/licitaciones';
  const res = http.get(url);

  check(res, {
    'status es 200': (r) => r.status === 200,
    'tiempo de respuesta < 300ms': (r) => r.timings.duration < 300,
  });

  sleep(1);
}
