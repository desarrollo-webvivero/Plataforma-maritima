package com.maritima.logistica.model;

import jakarta.persistence.Column;
import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
@Entity
@DiscriminatorValue("REFRIGERADA")
public class CargaRefrigerada extends Contenedor {
    
    @Column(nullable = false)
    private Double temperaturaRequerida;
    
    private Boolean conectadoARedElectrica;
}