package com.maritima.aduana.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "bloqueos_aduaneros", indexes = {
    // Creamos un índice para acelerar las búsquedas por el código del contenedor
    @Index(name = "idx_bloqueo_contenedor", columnList = "idContenedor"),
    // Creamos un índice para agilizar los reportes por estado (RETENIDO / LIBERADO)
    @Index(name = "idx_bloqueo_estado", columnList = "estado")
})
public class BloqueoAduanero {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String idContenedor;

    @Column(nullable = false)
    private String motivo;

    @Column(nullable = false)
    private String estado; 

    private String codigoContenedor;

    private LocalDateTime fechaBloqueo;

    public BloqueoAduanero() {
    }

    public BloqueoAduanero(Long id, String idContenedor, String motivo, String estado, String codigoContenedor, LocalDateTime fechaBloqueo) {
        this.id = id;
        this.idContenedor = idContenedor;
        this.motivo = motivo;
        this.estado = estado;
        this.fechaBloqueo = fechaBloqueo;
        this.codigoContenedor = codigoContenedor;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getIdContenedor() {
        return idContenedor;
    }

    public void setIdContenedor(String idContenedor) {
        this.idContenedor = idContenedor;
    }

    public String getMotivo() {
        return motivo;
    }

    public void setMotivo(String motivo) {
        this.motivo = motivo;
    }

    public String getEstado() {
        return estado;
    }

    public void setEstado(String estado) {
        this.estado = estado;
    }

    public String getCodigoContenedor(){
        return codigoContenedor;
    }

    public void setCodigoContenedor(String codigoContenedor){
        this.codigoContenedor = codigoContenedor;
    }

    public LocalDateTime getFechaBloqueo() {
        return fechaBloqueo;
    }

    public void setFechaBloqueo(LocalDateTime fechaBloqueo) {
        this.fechaBloqueo = fechaBloqueo;
    }
}

