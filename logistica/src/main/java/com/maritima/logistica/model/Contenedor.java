package com.maritima.logistica.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "contenedores")
@Inheritance(strategy = InheritanceType.SINGLE_TABLE)
@DiscriminatorColumn(name = "tipo_carga", discriminatorType = DiscriminatorType.STRING)
public abstract class Contenedor {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false, length = 20)
    private String codigoRegistro;

    @Column(nullable = false)
    private Double pesoKg;

    @Column(nullable = false)
    private String estadoActual; // Ej: EN_ESPERA, A_BORDO, RETENIDO

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "buque_id")
    private Buque buqueAsignado;
}