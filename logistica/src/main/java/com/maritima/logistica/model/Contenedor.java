package com.maritima.logistica.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "contenedores")
@Inheritance(strategy = InheritanceType.JOINED)
public abstract class Contenedor {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "contenedor_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "buque_id")
    private Buque buque;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "muelle_id")
    private Muelle muelle;

    @Column(nullable = false, unique = true, length = 50)
    private String codigo;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal peso;

    @Column(nullable = false, length = 50)
    private String estado;

    @Column(name = "fecha_creacion", updatable = false)
    private LocalDateTime fechaCreacion;

    @Column(name = "fecha_actualizacion")
    private LocalDateTime fechaActualizacion;

    @Column(name = "actualizado_por")
    private Integer actualizadoPor;

    @PrePersist
    protected void onCreate() {
        this.fechaCreacion = LocalDateTime.now();
        this.fechaActualizacion = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() { this.fechaActualizacion = LocalDateTime.now(); }
}