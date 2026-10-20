package com.maritima.logistica.controller;

import com.maritima.logistica.model.Licitacion;
import com.maritima.logistica.repository.LicitacionRepository;
import com.maritima.logistica.repository.BuqueRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.maritima.logistica.model.UsuarioExportador;
import com.maritima.logistica.repository.UsuarioExportadorRepository;
import org.springframework.security.core.Authentication;
import org.springframework.http.HttpStatus;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/licitaciones")
public class LicitacionController {

    @Autowired
    private LicitacionRepository licitacionRepository;

    @Autowired
    private BuqueRepository buqueRepository;

    @Autowired
    private UsuarioExportadorRepository usuarioRepository;

    // 1. Listar todas las subastas (Lo usan Naviera y Exportador)
    @GetMapping
    public ResponseEntity<List<Licitacion>> listarSubastas() {
        return ResponseEntity.ok(licitacionRepository.findAll());
    }

    // 2. Publicar nueva subasta (Lo usa Naviera)
    @PostMapping
    public ResponseEntity<Licitacion> crearSubasta(@RequestBody Licitacion nueva) {
        if (nueva.getEstado() == null || nueva.getEstado().isEmpty()) {
            nueva.setEstado("ACTIVA");
        }
        if (nueva.getPujaActual() == null) {
            nueva.setPujaActual(nueva.getPrecioBase());
        }
        return ResponseEntity.ok(licitacionRepository.save(nueva));
    }

    // 3. Registrar una nueva puja (Lo usa el Cliente Exportador)

    @PostMapping("/{id}/pujar")
    public ResponseEntity<?> realizarPuja(
            @PathVariable Long id,
            @RequestBody Map<String, Object> payload,
            Authentication authentication) {

        // 1. Comprobar que exista un usuario autenticado
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("Debes iniciar sesión para realizar una puja.");
        }

        // 2. Buscar al exportador mediante el correo del JWT
        UsuarioExportador usuario = usuarioRepository
                .findByEmail(authentication.getName())
                .orElse(null);

        if (usuario == null) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("El usuario autenticado no existe.");
        }

        // 3. Obtener su identificador real desde PostgreSQL
        String codigoExportador = usuario.getCodigoExportador();

        // 4. Validar el monto recibido
        if (payload == null || payload.get("monto") == null) {
            return ResponseEntity.badRequest()
                    .body("Debes indicar el monto de la puja.");
        }

        BigDecimal nuevaPuja;

        try {
            nuevaPuja = new BigDecimal(payload.get("monto").toString());
        } catch (NumberFormatException ex) {
            return ResponseEntity.badRequest()
                    .body("El monto de la puja no es válido.");
        }

        if (nuevaPuja.compareTo(BigDecimal.ZERO) <= 0) {
            return ResponseEntity.badRequest()
                    .body("La puja debe ser mayor a cero.");
        }

        // 5. Buscar la licitación
        return licitacionRepository.findById(id).map(lic -> {

            if (!"ACTIVA".equalsIgnoreCase(lic.getEstado())) {
                return ResponseEntity.badRequest()
                        .body("La subasta ya no está activa.");
            }

            BigDecimal actual = lic.getPujaActual() != null
                    ? lic.getPujaActual()
                    : lic.getPrecioBase();

            if (actual == null) {
                return ResponseEntity.badRequest()
                        .body("La licitación no tiene un precio base válido.");
            }

            if (nuevaPuja.compareTo(actual) <= 0) {
                return ResponseEntity.badRequest()
                        .body("La puja debe superar el monto actual.");
            }

            // 6. Registrar la puja con la identidad del JWT
            lic.setPujaActual(nuevaPuja);
            lic.setMejorPostor(codigoExportador);

            return ResponseEntity.ok(licitacionRepository.save(lic));

        }).orElse(ResponseEntity.notFound().build());
    }


    // 4. Adjudicar y cerrar subasta (Lo usa Naviera)
    @PutMapping("/{id}/cerrar")
    public ResponseEntity<Licitacion> cerrarSubasta(@PathVariable Long id) {
        return licitacionRepository.findById(id).map(lic -> {
            lic.setEstado("ADJUDICADA");

            // 1. Descontar la capacidad del buque
            if (lic.getBuque() != null) {
                buqueRepository.findAll().stream()
                    .filter(b -> b.getNombre().equalsIgnoreCase(lic.getBuque()))
                    .findFirst()
                    .ifPresent(buque -> {
                        int capacidadActual = buque.getTeuDisponibles() != null ? buque.getTeuDisponibles() : 0;
                        int aDescontar = lic.getEspaciosTeu() != null ? lic.getEspaciosTeu() : 0;
                        int nuevaCapacidad = Math.max(0, capacidadActual - aDescontar);
                        buque.setTeuDisponibles(nuevaCapacidad);
                        buqueRepository.save(buque);
                    });
            }
            return ResponseEntity.ok(licitacionRepository.save(lic));
        }).orElse(ResponseEntity.notFound().build());
    }
}
