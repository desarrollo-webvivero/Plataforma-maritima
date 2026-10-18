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
@Table(name = "historial_licitaciones")
public class HistorialLicitacion {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "historial_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "licitacion_id", nullable = false)
    private Licitacion licitacion;

    @Column(name = "estado_anterior", length = 50)
    private String estadoAnterior;

    @Column(name = "estado_nuevo", nullable = false, length = 50)
    private String estadoNuevo;

    @Column(name = "fecha_cambio", updatable = false)
    private LocalDateTime fechaCambio;

    @Column(name = "cambiado_por", nullable = false)
    private Integer cambiadoPor;

    @PrePersist
    protected void onCreate() { this.fechaCambio = LocalDateTime.now(); }
}