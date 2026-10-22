package com.maritima.logistica.controller;

import com.maritima.logistica.model.Licitacion;
import com.maritima.logistica.repository.LicitacionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.maritima.logistica.exception.NegocioException;
import com.maritima.logistica.service.SubastaService;
import org.springframework.security.core.Authentication;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/licitaciones")
public class LicitacionController {

    @Autowired
    private LicitacionRepository licitacionRepository;

    @Autowired
    private SubastaService subastaService;

    // 1. Listar todas las subastas (Lo usan Naviera y Exportador)
    @GetMapping
    public ResponseEntity<List<Licitacion>> listarSubastas() {
        return ResponseEntity.ok(licitacionRepository.findAll());
    }

    // 2. Publicar nueva subasta (Lo usa Naviera)
    @PostMapping
    public ResponseEntity<?> crearSubasta(@RequestBody Licitacion nueva) {

        if (nueva.getPrecioBase() == null
                || nueva.getPrecioBase().compareTo(BigDecimal.ZERO) <= 0) {
            throw new NegocioException("El precio base debe ser mayor a cero.");
        }

        // Estos campos los controla el servidor, nunca el cliente
        nueva.setId(null);
        nueva.setEstado("ACTIVA");
        nueva.setMejorPostor(null);
        nueva.setPujaActual(nueva.getPrecioBase());

        return ResponseEntity.ok(licitacionRepository.save(nueva));
    }

    // 3. Registrar una puja (Lo usa el Exportador). El exportador sale del JWT.
    @PostMapping("/{id}/pujar")
    public ResponseEntity<?> realizarPuja(
            @PathVariable Long id,
            @RequestBody Map<String, Object> payload,
            Authentication authentication) {

        if (payload == null || payload.get("monto") == null) {
            throw new NegocioException("Debes indicar el monto de la puja.");
        }

        BigDecimal monto;
        try {
            monto = new BigDecimal(payload.get("monto").toString());
        } catch (NumberFormatException ex) {
            throw new NegocioException("El monto de la puja no es válido.");
        }

        return ResponseEntity.ok(
            subastaService.pujar(authentication.getName(), id, monto)
        );
    }

    // 4. Adjudicar y cerrar subasta (Lo usa Naviera): cobra al ganador y le crea su contenedor
    @PutMapping("/{id}/cerrar")
    public ResponseEntity<?> cerrarSubasta(@PathVariable Long id) {

        SubastaService.Cierre cierre = subastaService.cerrar(id);

        return ResponseEntity.ok(Map.of(
            "licitacion", cierre.licitacion(),
            "contenedorCodigo", cierre.contenedorCodigo(),
            "monto", cierre.monto()
        ));
    }
}
