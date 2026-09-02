package com.maritima.logistica.model;

import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
@Entity
@DiscriminatorValue("SECA")
public class CargaSeca extends Contenedor {
    
    // Propiedad específica de la carga seca
    private Boolean requiereVentilacion;
}