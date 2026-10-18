package com.maritima.logistica.dto;

import java.math.BigDecimal;

public class DescontarRequest {
    private BigDecimal monto;

    public DescontarRequest() {}

    public BigDecimal getMonto() {
        return monto;
    }

    public void setMonto(BigDecimal monto) {
        this.monto = monto;
    }
}
