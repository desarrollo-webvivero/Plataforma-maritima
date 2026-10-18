package com.maritima.logistica.controller;

import com.maritima.logistica.model.Buque;
import com.maritima.logistica.repository.BuqueRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/buques")
public class BuqueController {

    @Autowired
    private BuqueRepository buqueRepository;

    @GetMapping
    public ResponseEntity<List<Buque>> listarBuques() {
        List<Buque> lista = buqueRepository.findAll();
        // Si la base de datos está vacía, sembramos los 3 buques iniciales automáticamente
        if (lista.isEmpty()) {
           
            Buque b1 = new Buque();
            b1.setNombre("MSC GÜLSÜN");
            b1.setImo("IMO-9839430");
            b1.setMatricula("MAT-9839430"); // <--- ¡Agregado!
            b1.setCapacidadTeu(23756);
            b1.setTeuDisponibles(450);
            b1.setRutaActual("Puerto Quetzal, Guatemala ➔ Port of Los Angeles, EE.UU.");
            b1.setEstado("Atracado");

            Buque b2 = new Buque();
            b2.setNombre("MAERSK MC-KINNEY");
            b2.setImo("IMO-9619907");
            b2.setMatricula("MAT-9619907"); // <--- ¡Agregado!
            b2.setCapacidadTeu(18270);
            b2.setTeuDisponibles(120);
            b2.setRutaActual("Puerto de Manzanillo, México ➔ Port of Rotterdam, Países Bajos");
            b2.setEstado("En Ruta");

            Buque b3 = new Buque();
            b3.setNombre("CMA CGM JACQUES");
            b3.setImo("IMO-9839179");
            b3.setMatricula("MAT-9839179"); // <--- ¡Agregado!
            b3.setCapacidadTeu(23112);
            b3.setTeuDisponibles(820);
            b3.setRutaActual("Puerto Barrios, Guatemala ➔ Port of Miami, EE.UU.");
            b3.setEstado("En Ruta");

        
            lista = buqueRepository.saveAll(List.of(b1, b2, b3));
        }
        return ResponseEntity.ok(lista);
    }
     
    @PostMapping
        public ResponseEntity<Buque> crearBuque(@RequestBody Buque nuevo) {

    // Validar que el nombre sea obligatorio
         if (nuevo.getNombre() == null ||
            nuevo.getNombre().isBlank()) {
         return ResponseEntity.badRequest().build();
        }

    // Si no viene matrícula, generar una para el prototipo
         if (nuevo.getMatricula() == null ||
            nuevo.getMatricula().isBlank()) {

            String matricula = "MAT-" +
                java.util.UUID.randomUUID()
                .toString()
                .substring(0, 8)
                .toUpperCase();

         nuevo.setMatricula(matricula);
        }

    // Guardar el buque en PostgreSQL
        Buque guardado = buqueRepository.save(nuevo);

        return ResponseEntity.ok(guardado);
    }

    

    @PutMapping("/{id}/estado")
    public ResponseEntity<Buque> cambiarEstado(@PathVariable Long id, @RequestBody Map<String, String> payload) {
        return buqueRepository.findById(id).map(buque -> {
            // Genera la fecha actual en la zona de Guatemala
            java.time.LocalDateTime now = java.time.LocalDateTime.now(java.time.ZoneId.of("America/Guatemala"));
            java.time.format.DateTimeFormatter formatter = java.time.format.DateTimeFormatter.ofPattern("dd/MM/yy HH:mm");
            
            String estadoBase = payload.get("estado"); // Recibe "Atracado" o "En Ruta"
            String estadoConFecha = estadoBase != null && estadoBase.equals("Atracado") 
                ? "Atracado el " + now.format(formatter) 
                : "Zarpó el " + now.format(formatter);
            
            buque.setEstado(estadoConFecha);
            return ResponseEntity.ok(buqueRepository.save(buque));
        }).orElse(ResponseEntity.notFound().build());
    }
}
