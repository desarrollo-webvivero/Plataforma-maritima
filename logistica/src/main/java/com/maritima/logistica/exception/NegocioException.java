package com.maritima.logistica.exception;

/**
 * Error de regla de negocio con un mensaje seguro para mostrar al usuario
 * (saldo insuficiente, subasta cerrada, etc.). Nunca lleva detalles técnicos.
 */
public class NegocioException extends RuntimeException {
    public NegocioException(String mensaje) {
        super(mensaje);
    }
}
