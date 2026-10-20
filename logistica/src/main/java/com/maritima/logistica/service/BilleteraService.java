package com.maritima.logistica.service;

import com.maritima.logistica.model.Billetera;
import com.maritima.logistica.model.UsuarioExportador;
import com.maritima.logistica.repository.BilleteraRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.math.BigDecimal;
import com.maritima.logistica.repository.UsuarioExportadorRepository;
import com.maritima.logistica.model.UsuarioExportador;

@Service
public class BilleteraService {

    @Autowired
    private BilleteraRepository repository;

    @Autowired
    private UsuarioExportadorRepository usuarioRepository;

    // Para este proyecto simulamos que el usuario actual es "EXP-001"

    public Billetera obtenerSaldo() {

        // Obtener el correo del usuario autenticado mediante JWT
        org.springframework.security.core.Authentication auth =
                org.springframework.security.core.context.SecurityContextHolder
                        .getContext()
                        .getAuthentication();

        if (auth == null || !auth.isAuthenticated()) {
            throw new org.springframework.security.access.AccessDeniedException(
                    "Debes iniciar sesión para consultar tu billetera."
            );
        }

        String email = auth.getName();

        // Buscar el usuario real en PostgreSQL
        UsuarioExportador usuario = usuarioRepository.findByEmail(email)
                .orElseThrow(() ->
                        new org.springframework.security.access.AccessDeniedException(
                                "Usuario autenticado no encontrado."
                        )
                );

        // Obtener el identificador real del exportador
        String codigoExportador = usuario.getCodigoExportador();

        // Buscar la billetera correspondiente a este usuario
        return repository.findByExportadorId(codigoExportador)
                .orElseGet(() -> {
                    Billetera nueva = new Billetera();
                    nueva.setExportadorId(codigoExportador);

                    // Saldo inicial del prototipo
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
