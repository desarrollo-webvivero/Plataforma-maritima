package com.maritima.logistica.service;

import com.maritima.logistica.client.AduanaClient;
import com.maritima.logistica.model.Contenedor;
import com.maritima.logistica.model.HistorialContenedor;
import com.maritima.logistica.repository.ContenedorRepository;
import com.maritima.logistica.repository.HistorialContenedorRepository;
import com.maritima.logistica.repository.MuelleRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class MuelleService {

    private final MuelleRepository muelleRepository;
    private final ContenedorRepository contenedorRepository;
    private final HistorialContenedorRepository historialRepository;
    private final AduanaClient aduanaClient;

    public MuelleService(MuelleRepository muelleRepository, 
                         ContenedorRepository contenedorRepository, 
                         HistorialContenedorRepository historialRepository,
                         AduanaClient aduanaClient) {
        this.muelleRepository = muelleRepository;
        this.contenedorRepository = contenedorRepository;
        this.historialRepository = historialRepository;
        this.aduanaClient = aduanaClient;
    }

    public boolean validarDisponibilidad(Long muelleId) {
        return muelleRepository.findById(muelleId)
                .map(m -> "DISPONIBLE".equalsIgnoreCase(m.getEstadoDisponibilidad()))
                .orElse(false);
    }

    @Transactional
    public Contenedor procesarGateOut(Long contenedorId, Integer usuarioId) {
        // 1. Verificación en Logística
        Contenedor contenedor = contenedorRepository.findById(contenedorId)
                .orElseThrow(() -> new RuntimeException("Contenedor no encontrado en el sistema."));

        if ("GATE_OUT".equalsIgnoreCase(contenedor.getEstado())) {
            throw new RuntimeException("Operación denegada: El contenedor ya registró su salida del puerto.");
        }

        // 2. Validación Cruzada con Aduanas (Llamada HTTP síncrona)
        if (aduanaClient.tieneBloqueoActivo(contenedorId)) {
            throw new RuntimeException("ALERTA LEGAL: Operación denegada. El contenedor posee una retención aduanera activa.");
        }

        String estadoAnterior = contenedor.getEstado();
        Long muelleAnterior = contenedor.getMuelle() != null ? contenedor.getMuelle().getId() : null;

        // 3. Actualizar estado físico del contenedor
        contenedor.setEstado("GATE_OUT");
        contenedor.setMuelle(null); 
        contenedor.setActualizadoPor(usuarioId);
        contenedorRepository.save(contenedor);

        // 4. Registrar auditoría inmutable
        HistorialContenedor historial = new HistorialContenedor();
        historial.setContenedor(contenedor);
        historial.setEstadoAnterior(estadoAnterior);
        historial.setEstadoNuevo("GATE_OUT");
        historial.setMuelleIdAnterior(muelleAnterior);
        historial.setMuelleIdNuevo(null);
        historial.setCambiadoPor(usuarioId);
        historialRepository.save(historial);
        
        return contenedor;
    }
}