package com.maritima.logistica.controller;

import com.maritima.logistica.model.Licitacion;
import com.maritima.logistica.repository.LicitacionRepository;
import com.maritima.logistica.repository.BuqueRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

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
    public ResponseEntity<?> realizarPuja(@PathVariable Long id, @RequestBody Map<String, Object> payload) {
        return licitacionRepository.findById(id).map(lic -> {
            if (!"ACTIVA".equalsIgnoreCase(lic.getEstado())) {
                return ResponseEntity.badRequest().body("La subasta ya no está activa.");
            }
            BigDecimal nuevaPuja = new BigDecimal(payload.get("monto").toString());
            BigDecimal actual = lic.getPujaActual() != null ? lic.getPujaActual() : lic.getPrecioBase();

            if (nuevaPuja.compareTo(actual) <= 0) {
                return ResponseEntity.badRequest().body("La puja debe superar el monto actual.");
            }

            lic.setPujaActual(nuevaPuja);
            lic.setMejorPostor(payload.getOrDefault("exportadorId", "EXP-001").toString());
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
