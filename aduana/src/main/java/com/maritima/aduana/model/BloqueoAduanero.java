package com.maritima.aduana.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "bloqueos_aduaneros")
public class BloqueoAduanero {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Guardamos solo el código del contenedor, no la entidad completa, 
    // para mantener las bases de datos desacopladas.
    @Column(nullable = false, unique = true, length = 20)
    private String codigoContenedor;

    @Column(nullable = false)
    private String motivoAlerta; // Ej: Documentación falsa, Carga no declarada

    @Column(nullable = false)
    private String estado; // Ej: ACTIVO, LIBERADO

    private LocalDateTime fechaBloqueo;
    private String agenteAduanal;
}