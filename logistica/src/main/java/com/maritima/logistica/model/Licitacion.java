package com.maritima.logistica.model;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "licitaciones")
public class Licitacion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Double precioBase;

    private Double pujaGanadora;

    @Column(nullable = false)
    private String estado; // Ej: ABIERTA, CERRADA, ADJUDICADA

    private LocalDateTime fechaInicio;
    private LocalDateTime fechaFin;

    // Relación: La licitación se hace para un contenedor específico
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "contenedor_id")
    private Contenedor contenedor;
}