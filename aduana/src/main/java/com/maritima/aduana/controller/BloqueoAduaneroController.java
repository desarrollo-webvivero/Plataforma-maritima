package com.maritima.aduana.controller;

import java.time.LocalDateTime;

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

    @Autowired
    private BloqueoAduaneroRepository repository;

    // Endpoint para que el Agente Aduanal aplique una alerta roja
    @PostMapping("/bloquear")
    public ResponseEntity<BloqueoAduanero> aplicarBloqueo(@RequestBody BloqueoAduanero bloqueo) {
        bloqueo.setFechaBloqueo(LocalDateTime.now());
        bloqueo.setEstado("ACTIVO");
        BloqueoAduanero nuevoBloqueo = repository.save(bloqueo);
        return ResponseEntity.ok(nuevoBloqueo);
    }

    // Endpoint de consulta ultra-rápida para el sistema logístico
    @GetMapping("/verificar/{codigoContenedor}")
    public ResponseEntity<Boolean> verificarBloqueo(@PathVariable String codigoContenedor) {
        boolean estaBloqueado = repository.existsByCodigoContenedorAndEstado(codigoContenedor, "ACTIVO");
        return ResponseEntity.ok(estaBloqueado);
    }
}