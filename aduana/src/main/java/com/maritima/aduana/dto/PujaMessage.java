package com.maritima.aduana.dto;

import java.math.BigDecimal;

public class PujaMessage {
    private String idSubasta;
    private BigDecimal monto;
    private String idUsuario;

    // Constructors
    public PujaMessage() {
    }

    public PujaMessage(String idSubasta, BigDecimal monto, String idUsuario) {
        this.idSubasta = idSubasta;
        this.monto = monto;
        this.idUsuario = idUsuario;
    }

    // Getters and Setters
    public String getIdSubasta() {
        return idSubasta;
    }

    public void setIdSubasta(String idSubasta) {
        this.idSubasta = idSubasta;
    }

    public BigDecimal getMonto() {
        return monto;
    }

    public void setMonto(BigDecimal monto) {
        this.monto = monto;
    }

    public String getIdUsuario() {
        return idUsuario;
    }

    public void setIdUsuario(String idUsuario) {
        this.idUsuario = idUsuario;
    }
}