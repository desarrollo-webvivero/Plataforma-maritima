package com.maritima.logistica.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "carga_seca")
public class CargaSeca extends Contenedor {
    @Column(name = "tipo_embalaje", length = 100)
    private String tipoEmbalaje;

    @Column(name = "es_apilable")
    private Boolean esApilable;
}