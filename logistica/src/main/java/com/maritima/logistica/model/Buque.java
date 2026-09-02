package com.maritima.logistica.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "buques")
public class Buque {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false, length = 100)
    private String nombre;

    @Column(nullable = false)
    private Double capacidadMaximaKg;

    // Relación inversa: Un buque tiene muchos contenedores
    @OneToMany(mappedBy = "buqueAsignado", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Contenedor> contenedores;
}