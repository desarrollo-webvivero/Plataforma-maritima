package com.maritima.aduana.controller;

import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicLong;

import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Endpoint de "ping" para mantener despierto el servicio en planes gratuitos.
 *
 * Reglas de diseño (seguridad):
 *  - No recibe parámetros, cuerpo ni cabeceras con significado.
 *  - No usa base de datos, Redis, repositorios ni servicios.
 *  - Siempre responde lo mismo: "ok". No expone versión, hora, rutas ni errores.
 *  - Tiene un límite global de peticiones por minuto para evitar abuso.
 */
@RestController
@RequestMapping("/api/aduanas")
public class PingController {

    private static final int MAX_PETICIONES_POR_MINUTO = 120;
    private static final long VENTANA_MS = 60_000L;

    private final AtomicInteger contador = new AtomicInteger(0);
    private final AtomicLong inicioVentana = new AtomicLong(System.currentTimeMillis());

    @GetMapping("/ping")
    public ResponseEntity<String> ping() {

        if (!permitir()) {
            return ResponseEntity
                    .status(HttpStatus.TOO_MANY_REQUESTS)
                    .header("Retry-After", "60")
                    .cacheControl(CacheControl.noStore())
                    .build();
        }

        return ResponseEntity
                .ok()
                .cacheControl(CacheControl.noStore())
                .contentType(MediaType.TEXT_PLAIN)
                .body("ok");
    }

    /**
     * Limitador de ventana fija, global y en memoria.
     * No guarda IPs ni ningún dato del visitante: solo un contador.
     */
    private boolean permitir() {
        long ahora = System.currentTimeMillis();
        long inicio = inicioVentana.get();

        if (ahora - inicio >= VENTANA_MS
                && inicioVentana.compareAndSet(inicio, ahora)) {
            contador.set(0);
        }

        return contador.incrementAndGet() <= MAX_PETICIONES_POR_MINUTO;
    }
}