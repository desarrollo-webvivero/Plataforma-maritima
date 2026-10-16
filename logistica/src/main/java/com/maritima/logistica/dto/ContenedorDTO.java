package com.maritima.logistica.dto;

import lombok.Getter;
import lombok.Setter;
import java.math.BigDecimal;

@Getter
@Setter
public class ContenedorDTO {
    // Estos son los datos que React enviará al backend
    private String codigo; 
    private String tipo;   // Para saber qué clase hija instanciar
    private String estado;
    private BigDecimal peso;
}