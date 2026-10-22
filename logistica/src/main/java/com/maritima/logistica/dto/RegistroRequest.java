package com.maritima.logistica.dto;

/**
 * Solo los campos que el cliente PUEDE enviar al registrarse.
 * Campos como id, rol o codigoExportador no existen aquí,
 * por lo que el cliente no puede manipularlos.
 */
public record RegistroRequest(
        String empresa,
        String nit,
        String representante,
        String email,
        String telefono,
        String password,
        Double saldoInicial,
        String codigoVerificacion
) {}
