package com.maritima.logistica.service;

import com.maritima.logistica.model.Licitacion;
import com.maritima.logistica.repository.HistorialLicitacionRepository;
import com.maritima.logistica.repository.LicitacionRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ConcurrenciaLicitacionTest {

    @Mock
    private LicitacionRepository licitacionRepository;

    @Mock
    private HistorialLicitacionRepository historialRepository;

    @InjectMocks
    private LicitacionService licitacionService;

    @Test
    @DisplayName("Validar concurrencia: Varios hilos intentan adjudicar la misma licitación al mismo tiempo")
    void testAdjudicacionConcurrente() throws InterruptedException {
        Licitacion licitacion = new Licitacion();
        licitacion.setId(100L);
        licitacion.setEstado("ABIERTA");
        licitacion.setPrecioBase(new BigDecimal("50000.00"));

        when(licitacionRepository.findById(100L)).thenReturn(Optional.of(licitacion));

        int numeroHilos = 5;
        ExecutorService executorService = Executors.newFixedThreadPool(numeroHilos);
        CountDownLatch latch = new CountDownLatch(1);
        AtomicInteger exitos = new AtomicInteger(0);
        AtomicInteger fallos = new AtomicInteger(0);

        for (int i = 0; i < numeroHilos; i++) {
            final int usuarioId = 1000 + i;
            executorService.submit(() -> {
                try {
                    latch.await();
                    synchronized (licitacion) {
                        licitacionService.adjudicarLicitacion(100L, usuarioId);
                    }
                    exitos.incrementAndGet();
                } catch (Exception e) {
                    fallos.incrementAndGet();
                }
            });
        }

        latch.countDown();
        executorService.shutdown();
        executorService.awaitTermination(5, TimeUnit.SECONDS);

        assertEquals(1, exitos.get(), "Solo una solicitud concurrente debió adjudicar la licitación");
        assertEquals(4, fallos.get(), "Las demás solicitudes concurrentes debieron ser rechazadas");
        assertEquals("ADJUDICADA", licitacion.getEstado());
    }
}