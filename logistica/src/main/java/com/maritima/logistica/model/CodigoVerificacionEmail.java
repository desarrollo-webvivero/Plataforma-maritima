package com.maritima.logistica.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * Código de verificación de correo para el registro.
 * Se guarda UNA fila por correo y solo el HASH del código, nunca el código en claro.
 */
@Entity
@Table(name = "codigos_verificacion_email")
public class CodigoVerificacionEmail {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 254)
    private String email;

    // HMAC-SHA256 en hexadecimal (64 caracteres). Null = no hay código activo.
    @Column(length = 64)
    private String codigoHash;

    private LocalDateTime expiraEn;

    private int intentos = 0;

    private LocalDateTime ultimoEnvio;

    // Ventana de 1 hora para limitar cuántos códigos se piden por correo
    private LocalDateTime ventanaInicio;

    private int enviosVentana = 0;

    public Long getId() { return id; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getCodigoHash() { return codigoHash; }
    public void setCodigoHash(String codigoHash) { this.codigoHash = codigoHash; }

    public LocalDateTime getExpiraEn() { return expiraEn; }
    public void setExpiraEn(LocalDateTime expiraEn) { this.expiraEn = expiraEn; }

    public int getIntentos() { return intentos; }
    public void setIntentos(int intentos) { this.intentos = intentos; }

    public LocalDateTime getUltimoEnvio() { return ultimoEnvio; }
    public void setUltimoEnvio(LocalDateTime ultimoEnvio) { this.ultimoEnvio = ultimoEnvio; }

    public LocalDateTime getVentanaInicio() { return ventanaInicio; }
    public void setVentanaInicio(LocalDateTime ventanaInicio) { this.ventanaInicio = ventanaInicio; }

    public int getEnviosVentana() { return enviosVentana; }
    public void setEnviosVentana(int enviosVentana) { this.enviosVentana = enviosVentana; }
}
