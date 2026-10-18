package com.maritima.logistica.service;

import com.maritima.logistica.model.Billetera;
import com.maritima.logistica.repository.BilleteraRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.math.BigDecimal;

@Service
public class BilleteraService {

    @Autowired
    private BilleteraRepository repository;

    // Para este proyecto simulamos que el usuario actual es "EXP-001"
    private final String USUARIO_ACTUAL = "EXP-001";

    public Billetera obtenerSaldo() {
        // Busca el saldo, si no existe, le regala los $14,500.00 iniciales
        return repository.findByExportadorId(USUARIO_ACTUAL)
                .orElseGet(() -> {
                    Billetera nueva = new Billetera();
                    nueva.setExportadorId(USUARIO_ACTUAL);
                    nueva.setSaldoDisponible(new BigDecimal("14500.00"));
                    return repository.save(nueva);
                });
    }

    public Billetera recargarSaldo(BigDecimal montoRecarga) {
        Billetera billetera = obtenerSaldo();
        if (montoRecarga == null || montoRecarga.compareTo(BigDecimal.ZERO) <= 0) {
            throw new RuntimeException("El monto a recargar debe ser mayor a cero.");
        }
        BigDecimal nuevoSaldo = billetera.getSaldoDisponible().add(montoRecarga);
        billetera.setSaldoDisponible(nuevoSaldo);
        return repository.save(billetera);
    }

    public Billetera descontarSaldo(BigDecimal montoCobrado) {
        Billetera billetera = obtenerSaldo();
        
        // Validación para evitar saldos negativos
        if (billetera.getSaldoDisponible().compareTo(montoCobrado) < 0) {
            throw new RuntimeException("Fondos insuficientes en la billetera virtual.");
        }
        
        // Resta el monto y guarda en base de datos
        BigDecimal nuevoSaldo = billetera.getSaldoDisponible().subtract(montoCobrado);
        billetera.setSaldoDisponible(nuevoSaldo);
        
        return repository.save(billetera);
    }
}
