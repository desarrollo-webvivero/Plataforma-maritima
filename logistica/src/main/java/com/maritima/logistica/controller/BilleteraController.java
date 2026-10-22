package com.maritima.logistica.controller;

import com.maritima.logistica.dto.DescontarRequest;
import com.maritima.logistica.exception.NegocioException;
import com.maritima.logistica.service.BilleteraService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/billetera")
public class BilleteraController {

    private final BilleteraService billeteraService;

    public BilleteraController(BilleteraService billeteraService) {
        this.billeteraService = billeteraService;
    }

    // Siempre devuelve la billetera del usuario del JWT (no acepta ids del cliente)
    @GetMapping("/saldo")
    public ResponseEntity<BilleteraService.Resumen> consultarSaldo() {
        return ResponseEntity.ok(billeteraService.resumenActual());
    }

    @PostMapping("/descontar")
    public ResponseEntity<BilleteraService.Resumen> aplicarCobro(@RequestBody DescontarRequest request) {
        if (request.getMonto() == null) {
            throw new NegocioException("El monto es obligatorio.");
        }
        return ResponseEntity.ok(billeteraService.descontar(request.getMonto()));
    }

    @PostMapping("/recargar")
    public ResponseEntity<BilleteraService.Resumen> recargarFondos(@RequestBody DescontarRequest request) {
        if (request.getMonto() == null) {
            throw new NegocioException("El monto es obligatorio.");
        }
        return ResponseEntity.ok(billeteraService.recargar(request.getMonto()));
    }
}
