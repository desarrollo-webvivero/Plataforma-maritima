package com.maritima.aduana.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.redis.core.RedisHash;
import java.io.Serializable;
import java.math.BigDecimal;

@RedisHash("subastas")
public class SubastaRedis implements Serializable {

    @Id 
    private String idSubasta;
    private String idLicitacion;
    private String idUsuario;
    private BigDecimal montoActual;
    private Long timestamp;


    public SubastaRedis() {}
    
    public SubastaRedis(String idSubasta, String idLicitacion, String idUsuario, BigDecimal montoActual, Long timestamp) {
            this.idSubasta = idSubasta;
            this.idLicitacion = idLicitacion;
            this.idUsuario = idUsuario;
            this.montoActual = montoActual;
            this.timestamp = timestamp;
    }

    public String getIdSubasta() { return idSubasta; }
    public void setIdSubasta(String idSubasta) { this.idSubasta = idSubasta; }

    public String getIdLicitacion() { return idLicitacion; }
    public void setIdLicitacion(String idLicitacion) { this.idLicitacion = idLicitacion; }

    public String getIdUsuario() { return idUsuario; }
    public void setIdUsuario(String idUsuario) { this.idUsuario = idUsuario; }

    public BigDecimal getMontoActual() { return montoActual; }
    public void setMontoActual(BigDecimal montoActual) { this.montoActual = montoActual; }

    public Long getTimestamp() { return timestamp; }
    public void setTimestamp(Long timestamp) { this.timestamp = timestamp; }
}