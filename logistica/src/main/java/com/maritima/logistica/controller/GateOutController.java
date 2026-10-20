package com.maritima.logistica.controller;

import com.maritima.logistica.model.Contenedor;
import com.maritima.logistica.service.MuelleService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.maritima.logistica.model.UsuarioExportador;
import com.maritima.logistica.repository.UsuarioExportadorRepository;
import org.springframework.security.core.Authentication;
import org.springframework.http.HttpStatus;

@RestController
@RequestMapping("/api/operaciones")
public class GateOutController {

    private final MuelleService muelleService;

    private final UsuarioExportadorRepository usuarioRepository;

    public GateOutController(
        MuelleService muelleService,
        UsuarioExportadorRepository usuarioRepository) {

    this.muelleService = muelleService;
    this.usuarioRepository = usuarioRepository;
    }

    @GetMapping("/muelles/{id}/disponibilidad")
    public ResponseEntity<Boolean> verificarDisponibilidadMuelle(@PathVariable Long id) {
        return ResponseEntity.ok(muelleService.validarDisponibilidad(id));
    }

    @PostMapping("/gate-out/{contenedorId}")
    public ResponseEntity<?> autorizarGateOut(
            @PathVariable Long contenedorId,
            Authentication authentication) {

        // 1. Verificar que exista una sesión autenticada
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("Debes iniciar sesión para autorizar Gate-Out.");
        }

        // 2. Verificar el rol del operador
        boolean autorizado = authentication.getAuthorities().stream()
                .anyMatch(a ->
                        "ROLE_PUERTO".equals(a.getAuthority()) ||
                        "ROLE_ADMIN".equals(a.getAuthority())
                );

        if (!autorizado) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("No tienes permisos para autorizar Gate-Out.");
        }

        // 3. Obtener al operador desde el JWT y PostgreSQL
        UsuarioExportador operador = usuarioRepository
                .findByEmail(authentication.getName())
                .orElse(null);

        if (operador == null) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("El operador autenticado no existe.");
        }

        // 4. Obtener el ID real del operador
        Integer usuarioId;

        try {
            usuarioId = Math.toIntExact(operador.getId());
        } catch (ArithmeticException ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("El identificador del operador no es compatible.");
        }

        // 5. Ejecutar el proceso existente de Gate-Out
        try {
            Contenedor contenedorSalida =
                    muelleService.procesarGateOut(contenedorId, usuarioId);

            return ResponseEntity.ok(contenedorSalida);

        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

}