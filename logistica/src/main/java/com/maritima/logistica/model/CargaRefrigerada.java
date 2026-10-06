package com.maritima.logistica.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "carga_refrigerada")
public class CargaRefrigerada extends Contenedor {
    @Column(name = "temperatura_requerida", precision = 5, scale = 2)
    private BigDecimal temperaturaRequerida;

    @Column(name = "requiere_ventilacion")
    private Boolean requiereVentilacion;
}