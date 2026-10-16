package com.maritima.logistica.model;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "licitaciones")
public class Licitacion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String buque;
    private String ruta;
    private Integer espaciosTeu;

    @Column(precision = 12, scale = 2)
    private BigDecimal precioBase;

    @Column(precision = 12, scale = 2)
    private BigDecimal pujaActual;

    private String mejorPostor; // Ej. "EXP-001"
    private String estado;      // "ACTIVA" o "ADJUDICADA"
    private Integer actualizadoPor;

    public Licitacion() {}

    // Getters y Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getBuque() { return buque; }
    public void setBuque(String buque) { this.buque = buque; }

    public String getRuta() { return ruta; }
    public void setRuta(String ruta) { this.ruta = ruta; }

    public Integer getEspaciosTeu() { return espaciosTeu; }
    public void setEspaciosTeu(Integer espaciosTeu) { this.espaciosTeu = espaciosTeu; }

    public BigDecimal getPrecioBase() { return precioBase; }
    public void setPrecioBase(BigDecimal precioBase) { this.precioBase = precioBase; }

    public BigDecimal getPujaActual() { return pujaActual; }
    public void setPujaActual(BigDecimal pujaActual) { this.pujaActual = pujaActual; }

    public String getMejorPostor() { return mejorPostor; }
    public void setMejorPostor(String mejorPostor) { this.mejorPostor = mejorPostor; }

    public String getEstado() { return estado; }
    public void setEstado(String estado) { this.estado = estado; }

    public Integer getActualizadoPor() { 
        return actualizadoPor; 
    }
    
    public void setActualizadoPor(Integer actualizadoPor) { 
        this.actualizadoPor = actualizadoPor; 
    }
}
