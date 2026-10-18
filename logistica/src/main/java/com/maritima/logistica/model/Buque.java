package com.maritima.logistica.model;

import jakarta.persistence.*;

@Entity
@Table(name = "buques")
public class Buque {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String nombre;
    private String imo;
   @Column(name = "capacidad_maxima_teus")
    private Integer capacidadTeu;
    private Integer teuDisponibles;
    private String rutaActual;
    private String matricula;
    private String estado; // "Atracado" o "En Ruta"

    public Buque() {}

    // Getters y Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }

    public String getImo() { return imo; }
    public void setImo(String imo) { this.imo = imo; }

    public Integer getCapacidadTeu() { return capacidadTeu; }
    public void setCapacidadTeu(Integer capacidadTeu) { this.capacidadTeu = capacidadTeu; }

    public Integer getTeuDisponibles() { return teuDisponibles; }
    public void setTeuDisponibles(Integer teuDisponibles) { this.teuDisponibles = teuDisponibles; }

    public String getRutaActual() { return rutaActual; }
    public void setRutaActual(String rutaActual) { this.rutaActual = rutaActual; }

    public String getMatricula() { return matricula; }
    public void setMatricula(String matricula) { this.matricula = matricula; }

    public String getEstado() { return estado; }
    public void setEstado(String estado) { this.estado = estado; }
}
