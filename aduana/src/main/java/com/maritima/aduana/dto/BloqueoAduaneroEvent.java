package com.maritima.aduana.dto;

import java.io.Serializable;

public class BloqueoAduaneroEvent implements Serializable {
    private String idContenedor;
    private String tipoBloqueo; // EJ: "RETENIDO", "LIBERADO"
    private String motivo;
    private Long timestamp;

    public BloqueoAduaneroEvent() {}

    public BloqueoAduaneroEvent(String idContenedor, String tipoBloqueo, String motivo, Long timestamp) {
        this.idContenedor = idContenedor;
        this.tipoBloqueo = tipoBloqueo;
        this.motivo = motivo;
        this.timestamp = timestamp;
    }

    // Getters y Setters
    public String getIdContenedor() { return idContenedor; }
    public void setIdContenedor(String idContenedor) { this.idContenedor = idContenedor; }

    public String getTipoBloqueo() { return tipoBloqueo; }
    public void setTipoBloqueo(String tipoBloqueo) { this.tipoBloqueo = tipoBloqueo; }

    public String getMotivo() { return motivo; }
    public void setMotivo(String motivo) { this.motivo = motivo; }

    public Long getTimestamp() { return timestamp; }
    public void setTimestamp(Long timestamp) { this.timestamp = timestamp; }
}