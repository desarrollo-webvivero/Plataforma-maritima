package com.maritima.logistica.service;

import com.maritima.logistica.model.HistorialLicitacion;
import com.maritima.logistica.model.Licitacion;
import com.maritima.logistica.repository.HistorialLicitacionRepository;
import com.maritima.logistica.repository.LicitacionRepository;
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
}