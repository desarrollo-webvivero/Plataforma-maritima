package com.maritima.logistica.model;

import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
@Entity
@DiscriminatorValue("PELIGROSA")
public class CargaPeligrosa extends Contenedor {
    
    private String nivelRiesgo; // Ej: ALTO, MEDIO
    private String regulacionAplicable; 
}