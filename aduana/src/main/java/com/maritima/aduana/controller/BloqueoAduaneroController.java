package com.maritima.aduana.controller;

import java.time.LocalDateTime;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.maritima.aduana.model.BloqueoAduanero;
import com.maritima.aduana.repository.BloqueoAduaneroRepository;

@RestController
@RequestMapping("/api/aduanas")
public class BloqueoAduaneroController {

    private static final int MAX_CODIGO = 50;
    private static final int MAX_MOTIVO = 200;

    // Solo se aceptan estos campos: el cliente no puede fijar id, estado ni fecha.
    public record BloqueoRequest(String codigoContenedor, String motivo) {}

    public record LiberacionRequest(String codigoContenedor) {}

    @Autowired
    private BloqueoAduaneroRepository repository;

    // Endpoint para que el Agente Aduanal aplique una alerta roja.
    // Si el contenedor ya tenía un registro (por ejemplo, liberado antes), se reactiva.
    @PostMapping("/bloquear")
    public ResponseEntity<?> aplicarBloqueo(@RequestBody BloqueoRequest request) {

        if (!codigoValido(request == null ? null : request.codigoContenedor())
                || request.motivo() == null
                || request.motivo().isBlank()
                || request.motivo().length() > MAX_MOTIVO) {
            return ResponseEntity.badRequest().body(Map.of("error", "Solicitud inválida."));
        }

        String codigo = request.codigoContenedor().trim();

        BloqueoAduanero bloqueo = repository.findByCodigoContenedor(codigo)
                .orElseGet(BloqueoAduanero::new);

        bloqueo.setIdContenedor(codigo);
        bloqueo.setCodigoContenedor(codigo);
        bloqueo.setMotivo(request.motivo().trim());
        bloqueo.setEstado("ACTIVO");
        bloqueo.setFechaBloqueo(LocalDateTime.now());
        repository.save(bloqueo);

        return ResponseEntity.ok(Map.of("codigoContenedor", codigo, "estado", "ACTIVO"));
    }

    // Levanta la retención (Canal Verde / Revisión documental). Es idempotente.
    @PostMapping("/liberar")
    public ResponseEntity<?> liberarBloqueo(@RequestBody LiberacionRequest request) {

        if (!codigoValido(request == null ? null : request.codigoContenedor())) {
            return ResponseEntity.badRequest().body(Map.of("error", "Solicitud inválida."));
        }

        String codigo = request.codigoContenedor().trim();

        repository.findByCodigoContenedor(codigo).ifPresent(bloqueo -> {
            bloqueo.setEstado("LIBERADO");
            repository.save(bloqueo);
        });

        return ResponseEntity.ok(Map.of("codigoContenedor", codigo, "estado", "LIBERADO"));
    }

    // Endpoint de consulta ultra-rápida para el sistema logístico
    @GetMapping("/verificar/{codigoContenedor}")
    public ResponseEntity<Boolean> verificarBloqueo(@PathVariable String codigoContenedor) {
        boolean estaBloqueado = repository.existsByCodigoContenedorAndEstado(codigoContenedor, "ACTIVO");
        return ResponseEntity.ok(estaBloqueado);
    }

    private boolean codigoValido(String codigo) {
        return codigo != null && !codigo.isBlank() && codigo.trim().length() <= MAX_CODIGO;
    }
}
