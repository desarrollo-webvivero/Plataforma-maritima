package com.maritima.logistica.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "buques")
public class Buque {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "buque_id")
    private Long id;

    @Column(nullable = false, length = 100)
    private String nombre;

    @Column(nullable = false, unique = true, length = 50)
    private String matricula;

    @Column(name = "capacidad_maxima_teus", nullable = false)
    private Integer capacidadMaximaTeus;

    @Column(name = "fecha_creacion", updatable = false)
    private LocalDateTime fechaCreacion;

    @OneToMany(mappedBy = "buque", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Contenedor> contenedores;

    @PrePersist
    protected void onCreate() { this.fechaCreacion = LocalDateTime.now(); }
}