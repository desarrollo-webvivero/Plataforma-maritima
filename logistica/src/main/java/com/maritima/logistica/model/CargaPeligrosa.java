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
@Table(name = "carga_peligrosa")
public class CargaPeligrosa extends Contenedor {
    @Column(name = "clasificacion_imo", length = 50)
    private String clasificacionImo;

    @Column(name = "instrucciones_manejo", columnDefinition = "TEXT")
    private String instruccionesManejo;
}