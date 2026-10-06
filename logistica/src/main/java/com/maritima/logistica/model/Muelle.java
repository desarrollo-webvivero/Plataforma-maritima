package com.maritima.logistica.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "muelles")
public class Muelle {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "muelle_id")
    private Long id;

    @Column(nullable = false, length = 100)
    private String nombre;

    @Column(name = "estado_disponibilidad", length = 50)
    private String estadoDisponibilidad = "DISPONIBLE";

    @Column(name = "fecha_actualizacion")
    private LocalDateTime fechaActualizacion;

    @Column(name = "actualizado_por")
    private Integer actualizadoPor;

    @PrePersist
    @PreUpdate
    protected void onUpdate() { this.fechaActualizacion = LocalDateTime.now(); }
}