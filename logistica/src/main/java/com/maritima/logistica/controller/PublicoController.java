package com.maritima.logistica.controller;

import com.maritima.logistica.model.Buque;
import com.maritima.logistica.model.Licitacion;
import com.maritima.logistica.repository.BuqueRepository;
import com.maritima.logistica.repository.ContenedorRepository;
import com.maritima.logistica.repository.LicitacionRepository;

import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.util.Comparator;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicLong;

/**
 * Resumen PÚBLICO para la página de inicio (sin sesión).
 *
 * Reglas de diseño (seguridad):
 *  - Solo lectura y una única ruta exacta: GET /api/logistica/publico/resumen.
 *  - No recibe parámetros: no hay nada que inyectar ni filtrar.
 *  - Devuelve únicamente datos que ya son públicos en la operación marítima
 *    (nombre/IMO/ruta/espacio del buque y lotes abiertos). Usa DTOs propios,
 *    nunca las entidades, para no filtrar campos internos por accidente.
 *  - NO expone: ids de base de datos de buques, matrícula, contenedores, propietarios,
 *    exportadores, postores, usuarios, billeteras ni datos aduaneros.
 *    De los contenedores solo se devuelve la cantidad total.
 *  - Respuesta cacheada unos segundos y límite global de peticiones por minuto,
 *    para que un abuso no llegue a la base de datos.
 */
@RestController
@RequestMapping("/api/logistica/publico")
public class PublicoController {

    private static final long TTL_CACHE_MS = 3_000L;
    private static final int MAX_PETICIONES_POR_MINUTO = 600;
    private static final long VENTANA_MS = 60_000L;
    private static final int MAX_ELEMENTOS = 50;

    public record BuquePublico(
            String nombre,
            String imo,
            String ruta,
            Integer teuDisponibles,
            Integer capacidadTotal,
            String estado) {}

    public record SubastaPublica(
            Long id,
            String buque,
            String ruta,
            Integer espaciosTeu,
            BigDecimal pujaActual) {}

    public record ResumenPublico(
            List<BuquePublico> buques,
            List<SubastaPublica> subastasActivas,
            long contenedoresTotal) {}

    private final BuqueRepository buqueRepository;
    private final LicitacionRepository licitacionRepository;
    private final ContenedorRepository contenedorRepository;

    private final AtomicInteger contador = new AtomicInteger(0);
    private final AtomicLong inicioVentana = new AtomicLong(System.currentTimeMillis());

    private ResumenPublico cache;
    private long cacheMarca = 0L;

    public PublicoController(
            BuqueRepository buqueRepository,
            LicitacionRepository licitacionRepository,
            ContenedorRepository contenedorRepository) {
        this.buqueRepository = buqueRepository;
        this.licitacionRepository = licitacionRepository;
        this.contenedorRepository = contenedorRepository;
    }

    @GetMapping("/resumen")
    public ResponseEntity<ResumenPublico> resumen() {

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
                .body(obtenerResumen());
    }

    private synchronized ResumenPublico obtenerResumen() {
        long ahora = System.currentTimeMillis();

        if (cache == null || ahora - cacheMarca > TTL_CACHE_MS) {
            cache = construirResumen();
            cacheMarca = ahora;
        }
        return cache;
    }

    private ResumenPublico construirResumen() {

        List<BuquePublico> buques = buqueRepository.findAll().stream()
                .sorted(Comparator.comparing(
                        (Buque b) -> b.getNombre() == null ? "" : b.getNombre()))
                .limit(MAX_ELEMENTOS)
                .map(b -> new BuquePublico(
                        b.getNombre(),
                        b.getImo(),
                        b.getRutaActual(),
                        b.getTeuDisponibles(),
                        b.getCapacidadTeu(),
                        b.getEstado()))
                .toList();

        List<SubastaPublica> subastas = licitacionRepository.findAll().stream()
                .filter(l -> "ACTIVA".equalsIgnoreCase(l.getEstado()))
                .sorted(Comparator.comparing(
                        Licitacion::getId, Comparator.nullsLast(Comparator.<Long>reverseOrder())))
                .limit(MAX_ELEMENTOS)
                .map(l -> new SubastaPublica(
                        l.getId(),
                        l.getBuque(),
                        l.getRuta(),
                        l.getEspaciosTeu(),
                        l.getPujaActual() != null ? l.getPujaActual() : l.getPrecioBase()))
                .toList();

        return new ResumenPublico(buques, subastas, contenedorRepository.count());
    }

    /** Limitador de ventana fija, global y en memoria. No guarda IPs ni datos del visitante. */
    private boolean permitir() {
        long ahora = System.currentTimeMillis();
        long inicio = inicioVentana.get();

        if (ahora - inicio >= VENTANA_MS && inicioVentana.compareAndSet(inicio, ahora)) {
            contador.set(0);
        }
        return contador.incrementAndGet() <= MAX_PETICIONES_POR_MINUTO;
    }
}
