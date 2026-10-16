package com.maritima.logistica.controller;

import com.maritima.logistica.dto.ContenedorDTO;
import com.maritima.logistica.model.Contenedor;
import com.maritima.logistica.model.CargaSeca;
import com.maritima.logistica.model.CargaRefrigerada;
import com.maritima.logistica.model.CargaPeligrosa;
import com.maritima.logistica.repository.ContenedorRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/contenedores")
//@CrossOrigin(origins = "http://localhost:3000", allowCredentials = "true")
public class ContenedorController {

    @Autowired
    private ContenedorRepository repository;

    @GetMapping
    public List<Contenedor> obtenerContenedores() {
        return repository.findAll();
    }

    @PostMapping
    public ResponseEntity<?> crearContenedor(@RequestBody ContenedorDTO dto) {
        
        Contenedor nuevoContenedor;
        
        // 1. Instanciamos la clase hija correcta basándonos en el DTO de React
        if (dto.getTipo() != null) {
            String tipo = dto.getTipo().toLowerCase();
            if (tipo.contains("refrigerada")) {
                nuevoContenedor = new CargaRefrigerada();
            } else if (tipo.contains("peligrosa")) {
                nuevoContenedor = new CargaPeligrosa();
            } else {
                nuevoContenedor = new CargaSeca(); // Por defecto será carga seca
            }
        } else {
            nuevoContenedor = new CargaSeca();
        }
        
        // 2. Llenamos los datos principales usando los Setters de la clase abstracta
        nuevoContenedor.setCodigo(dto.getCodigo());
        nuevoContenedor.setEstado(dto.getEstado());
        
        if (dto.getPeso() != null) {
            nuevoContenedor.setPeso(dto.getPeso());
        } else {
            nuevoContenedor.setPeso(new java.math.BigDecimal("0.0"));
        }
        
        // 3. Guardamos en la base de datos de PostgreSQL
        Contenedor guardado = repository.save(nuevoContenedor);
        
        return ResponseEntity.ok(guardado);
    }

    @PutMapping("/{id}/estado")
    public ResponseEntity<?> actualizarEstadoPortuario(
            @PathVariable Long id,
            @RequestBody java.util.Map<String, Object> payload) {
        return repository.findById(id).map(contenedor -> {
            if (payload.containsKey("estado")) {
                contenedor.setEstado(payload.get("estado").toString());
            }
            if (payload.containsKey("muelleId")) {
                // Como muelle es una entidad ManyToOne o campo Integer según la entidad,
                // guardamos la fecha de actualización automáticamente por @PreUpdate
            }
            contenedor.setFechaActualizacion(java.time.LocalDateTime.now());
            return ResponseEntity.ok(repository.save(contenedor));
        }).orElse(ResponseEntity.notFound().build());
    }
}