package com.maritima.logistica.controller;

import com.maritima.logistica.model.Contenedor;
import com.maritima.logistica.service.MuelleService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/operaciones")
public class GateOutController {

    private final MuelleService muelleService;

    public GateOutController(MuelleService muelleService) {
        this.muelleService = muelleService;
    }

    @GetMapping("/muelles/{id}/disponibilidad")
    public ResponseEntity<Boolean> verificarDisponibilidadMuelle(@PathVariable Long id) {
        return ResponseEntity.ok(muelleService.validarDisponibilidad(id));
    }

    @PostMapping("/gate-out/{contenedorId}")
    public ResponseEntity<?> autorizarGateOut(
            @PathVariable Long contenedorId,
            @RequestParam Integer usuarioId) {
        try {
            Contenedor contenedorSalida = muelleService.procesarGateOut(contenedorId, usuarioId);
            return ResponseEntity.ok(contenedorSalida);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}