package com.maritima.logistica.controller;

import com.maritima.logistica.model.Licitacion;
import com.maritima.logistica.service.LicitacionService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/licitaciones")
public class LicitacionController {

    private final LicitacionService licitacionService;

    public LicitacionController(LicitacionService licitacionService) {
        this.licitacionService = licitacionService;
    }

    @PostMapping("/{id}/adjudicar")
    public ResponseEntity<?> adjudicarLicitacion(
            @PathVariable Long id, 
            @RequestParam Integer usuarioId) {
        try {
            Licitacion licitacionAdjudicada = licitacionService.adjudicarLicitacion(id, usuarioId);
            return ResponseEntity.ok(licitacionAdjudicada);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}