package com.maritima.logistica.controller;

import com.maritima.logistica.model.Billetera;
import com.maritima.logistica.dto.DescontarRequest;
import com.maritima.logistica.service.BilleteraService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.math.BigDecimal;

@RestController
@RequestMapping("/billetera")
public class BilleteraController {

    @Autowired
    private BilleteraService billeteraService;

    @GetMapping("/saldo")
    public ResponseEntity<Billetera> consultarSaldo() {
        return ResponseEntity.ok(billeteraService.obtenerSaldo());
    }

    @PostMapping("/descontar")
    public ResponseEntity<?> aplicarCobro(@RequestBody DescontarRequest request) {
        try {
            BigDecimal monto = request.getMonto();
            if (monto == null) {
                return ResponseEntity.badRequest().body("El monto es obligatorio");
            }
            Billetera billeteraActualizada = billeteraService.descontarSaldo(monto);
            return ResponseEntity.ok(billeteraActualizada);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/recargar")
    public ResponseEntity<?> recargarFondos(@RequestBody DescontarRequest request) {
        try {
            BigDecimal monto = request.getMonto();
            if (monto == null) {
                return ResponseEntity.badRequest().body("El monto es obligatorio");
            }
            Billetera billeteraActualizada = billeteraService.recargarSaldo(monto);
            return ResponseEntity.ok(billeteraActualizada);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
