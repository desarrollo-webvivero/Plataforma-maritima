package com.maritima.logistica.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
//import lombok.AllArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;

@Getter
@Setter
@NoArgsConstructor
//@AllArgsConstructor
@Entity
@Table(name = "contenedores")
@Inheritance(strategy = InheritanceType.JOINED)
public abstract class Contenedor {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "contenedor_id")
    private Long id;

    @JsonIgnore

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "buque_id")
    private Buque buque;

    @JsonIgnore

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "muelle_id")
    private Muelle muelle;

    @Column(nullable = false, unique = true, length = 50)
    private String codigo;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal peso;

    @Column(nullable = false, length = 50)
    private String estado;

    // Código del exportador dueño de la carga (ej. "EXP-015").
    // Los exportadores solo ven los contenedores que les pertenecen.
    @Column(name = "codigo_exportador", length = 20)
    private String codigoExportador;

    // Dictamen del semáforo aduanero: VERDE, AMARILLO o ROJO (null = sin dictamen = verde).
    // Se guarda aparte del texto de "estado" para que una retención nunca se pierda ni
    // pueda ser borrada por otra operación (por ejemplo, del puerto).
    @Column(name = "dictamen_aduanero", length = 20)
    private String dictamenAduanero;

    @Column(name = "motivo_dictamen", length = 120)
    private String motivoDictamen;

    // Datos de ubicación solo para mostrar en pantalla (no se guardan en esta tabla).
    @Transient
    private Long muelleId;

    @Transient
    private String muelleNombre;

    @Column(name = "fecha_creacion", updatable = false)
    private LocalDateTime fechaCreacion;

    @Column(name = "fecha_actualizacion")
    private LocalDateTime fechaActualizacion;

    @Column(name = "actualizado_por")
    private Integer actualizadoPor;

    // Los paneles de Puerto y Exportador leen este campo para mostrar la alerta aduanera.
    @JsonProperty("retenidoPorAduana")
    public boolean isRetenidoPorAduana() {
        return "ROJO".equalsIgnoreCase(dictamenAduanero);
    }

    @PrePersist
    protected void onCreate() {
        this.fechaCreacion = LocalDateTime.now();
        this.fechaActualizacion = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() { this.fechaActualizacion = LocalDateTime.now(); }
}