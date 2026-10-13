package com.maritima.logistica.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.maritima.logistica.dto.BloqueoEventDto;
import com.maritima.logistica.model.Contenedor;
import com.maritima.logistica.model.HistorialContenedor;
import com.maritima.logistica.repository.ContenedorRepository;
import com.maritima.logistica.repository.HistorialContenedorRepository;
import org.springframework.data.redis.connection.Message;
import org.springframework.data.redis.connection.MessageListener;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
public class RedisMessageSubscriber implements MessageListener {

    private final ContenedorRepository contenedorRepository;
    private final HistorialContenedorRepository historialRepository;
    private final ObjectMapper objectMapper;


    public RedisMessageSubscriber(ContenedorRepository contenedorRepository, 
                                  HistorialContenedorRepository historialRepository) {
        this.contenedorRepository = contenedorRepository;
        this.historialRepository = historialRepository;
        this.objectMapper = new ObjectMapper(); // Inicialización manual ObjectMapper
    }

    @Override
    @Transactional
    public void onMessage(Message message, byte[] pattern) {
        try {
            // 1. Convertir el mensaje de Redis (JSON) a nuestro objeto DTO
            String mensajeJson = new String(message.getBody());
            BloqueoEventDto evento = objectMapper.readValue(mensajeJson, BloqueoEventDto.class);
            
            System.out.println("📥 [LOGÍSTICA] Evento de aduana recibido: Contenedor " 
                    + evento.getContenedorId() + " -> " + evento.getEstado());

            // 2. Buscar el contenedor en la base de datos de Logística
            Optional<Contenedor> contenedorOpt = contenedorRepository.findById(evento.getContenedorId());
            
            if (contenedorOpt.isPresent()) {
                Contenedor contenedor = contenedorOpt.get();
                String estadoAnterior = contenedor.getEstado();
                Long muelleAnterior = contenedor.getMuelle() != null ? contenedor.getMuelle().getId() : null;

                // 3. Lógica de negocio: Actualizar estado según lo que dicte Aduanas
                String nuevoEstado = "RETENIDO".equalsIgnoreCase(evento.getEstado()) ? "BLOQUEADO_ADUANA" : "EN_MUELLE";
                contenedor.setEstado(nuevoEstado);
                contenedor.setActualizadoPor(0); // 0 o ID de sistema automático
                contenedorRepository.save(contenedor);

                // 4. Guardar en el historial inmutable para auditoría
                HistorialContenedor historial = new HistorialContenedor();
                historial.setContenedor(contenedor);
                historial.setEstadoAnterior(estadoAnterior);
                historial.setEstadoNuevo(nuevoEstado);
                historial.setMuelleIdAnterior(muelleAnterior);
                historial.setMuelleIdNuevo(muelleAnterior); // No se mueve físicamente
                historial.setCambiadoPor(0); // Sistema automático
                historialRepository.save(historial);

                System.out.println("[LOGÍSTICA] Base de datos actualizada con éxito para el contenedor " + evento.getContenedorId());
            } else {
                System.out.println(" [LOGÍSTICA] El contenedor " + evento.getContenedorId() + " no existe en nuestra base de datos.");
            }

        } catch (Exception e) {
            System.err.println("[LOGÍSTICA] Error procesando el mensaje de Redis: " + e.getMessage());
        }
    }
}