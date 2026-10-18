package com.maritima.logistica.model;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "billeteras")
public class Billetera {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Identificador del usuario (ej. "EXP-001"). 
    // Útil para cuando tengas login con múltiples usuarios.
    @Column(unique = true, nullable = false)
    private String exportadorId; 

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal saldoDisponible;

    // Constructores vacíos exigidos por JPA
    public Billetera() {}

    // Getters y Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getExportadorId() { return exportadorId; }
    public void setExportadorId(String exportadorId) { this.exportadorId = exportadorId; }

    public BigDecimal getSaldoDisponible() { return saldoDisponible; }
    public void setSaldoDisponible(BigDecimal saldoDisponible) { this.saldoDisponible = saldoDisponible; }
}
