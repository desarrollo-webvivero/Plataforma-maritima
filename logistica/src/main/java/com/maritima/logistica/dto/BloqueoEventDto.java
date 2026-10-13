package com.maritima.logistica.dto;

public class BloqueoEventDto {
    private Long contenedorId;
    private String estado; // "RETENIDO" o "LIBERADO"
    private String motivo;

    // Getters y Setters
    public Long getContenedorId() { return contenedorId; }
    public void setContenedorId(Long contenedorId) { this.contenedorId = contenedorId; }
    public String getEstado() { return estado; }
    public void setEstado(String estado) { this.estado = estado; }
    public String getMotivo() { return motivo; }
    public void setMotivo(String motivo) { this.motivo = motivo; }
}