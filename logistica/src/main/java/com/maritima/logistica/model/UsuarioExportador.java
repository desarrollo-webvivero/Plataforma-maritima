package com.maritima.logistica.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "usuarios_exportadores")
public class UsuarioExportador {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String codigoExportador; // Ej: EXP-002

    @Column(nullable = false)
    private String empresa;

    @Column(nullable = false)
    private String nit;

    @Column(nullable = false)
    private String representante;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String password;

    private String telefono;

    private String rol = "EXPORTADOR";

    private Double saldoInicial = 5000.00;

    private LocalDateTime fechaRegistro = LocalDateTime.now();

    // Getters y Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getCodigoExportador() { return codigoExportador; }
    public void setCodigoExportador(String codigoExportador) { this.codigoExportador = codigoExportador; }

    public String getEmpresa() { return empresa; }
    public void setEmpresa(String empresa) { this.empresa = empresa; }

    public String getNit() { return nit; }
    public void setNit(String nit) { this.nit = nit; }

    public String getRepresentante() { return representante; }
    public void setRepresentante(String representante) { this.representante = representante; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public String getTelefono() { return telefono; }
    public void setTelefono(String telefono) { this.telefono = telefono; }

    public String getRol() { return rol; }
    public void setRol(String rol) { this.rol = rol; }

    public Double getSaldoInicial() { return saldoInicial; }
    public void setSaldoInicial(Double saldoInicial) { this.saldoInicial = saldoInicial; }

    public LocalDateTime getFechaRegistro() { return fechaRegistro; }
    public void setFechaRegistro(LocalDateTime fechaRegistro) { this.fechaRegistro = fechaRegistro; }
}
