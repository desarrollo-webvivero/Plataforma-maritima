package com.maritima.logistica.service;

import com.maritima.logistica.model.HistorialLicitacion;
import com.maritima.logistica.model.Licitacion;
import com.maritima.logistica.repository.HistorialLicitacionRepository;
import com.maritima.logistica.repository.LicitacionRepository;

import java.math.BigDecimal;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class LicitacionService {

    private final LicitacionRepository licitacionRepository;
    private final HistorialLicitacionRepository historialRepository;

    public LicitacionService(LicitacionRepository licitacionRepository, 
                             HistorialLicitacionRepository historialRepository) {
        this.licitacionRepository = licitacionRepository;
        this.historialRepository = historialRepository;
    }

    @Transactional
    public Licitacion adjudicarLicitacion(Long licitacionId, Integer usuarioId) {
        Licitacion licitacion = licitacionRepository.findById(licitacionId)
                .orElseThrow(() -> new RuntimeException("Licitación no encontrada."));

        if ("ADJUDICADA".equalsIgnoreCase(licitacion.getEstado())) {
            throw new RuntimeException("La licitación ya ha sido adjudicada previamente.");
        }

        String estadoAnterior = licitacion.getEstado();

        // 1. Actualizar estado de la licitación
        licitacion.setEstado("ADJUDICADA");
        licitacion.setActualizadoPor(usuarioId);
        licitacionRepository.save(licitacion);

        // 2. Registrar en la bitácora inmutable de auditoría
        HistorialLicitacion historial = new HistorialLicitacion();
        historial.setLicitacion(licitacion);
        historial.setEstadoAnterior(estadoAnterior);
        historial.setEstadoNuevo("ADJUDICADA");
        historial.setCambiadoPor(usuarioId);
        historialRepository.save(historial);

        // Nota Sprint 3: Aquí publicaremos un evento en Redis para que el módulo IAM cobre los tokens.

        return licitacion;
    }

    /**
     * Registra y valida una puja manteniendo una Complejidad Ciclomática de McCabe < 10
     * y aplicando Análisis de Valores Límite (BVA).
     */
    @Transactional
    public Licitacion registrarPujaSegura(Long licitacionId, BigDecimal montoOferta) {
        Licitacion licitacion = obtenerLicitacionActiva(licitacionId);
        validarMontoPuja(licitacion, montoOferta);

        licitacion.setPujaActual(montoOferta);
        return licitacionRepository.save(licitacion);
    }

    private Licitacion obtenerLicitacionActiva(Long licitacionId) {
        Licitacion licitacion = licitacionRepository.findById(licitacionId)
                .orElseThrow(() -> new IllegalArgumentException("Licitación no encontrada"));

        if ("ADJUDICADA".equalsIgnoreCase(licitacion.getEstado()) || "CERRADA".equalsIgnoreCase(licitacion.getEstado())) {
            throw new IllegalStateException("La licitación no se encuentra activa para recibir pujas.");
        }
        return licitacion;
    }

    private void validarMontoPuja(Licitacion licitacion, BigDecimal monto) {
        if (monto == null || monto.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("El monto de la puja debe ser mayor a cero.");
        }

        BigDecimal ofertaMinima = licitacion.getPujaActual() != null
                ? licitacion.getPujaActual()
                : (licitacion.getPrecioBase() != null ? licitacion.getPrecioBase() : BigDecimal.ZERO);

        if (monto.compareTo(ofertaMinima) <= 0) {
            throw new IllegalArgumentException("El monto debe superar la oferta actual o precio base.");
        }
    }
}