package com.maritima.logistica.dto;

import java.math.BigDecimal;

/**
 * Lo único que decide el cliente al reservar un contenedor.
 * El precio, los TEUs y el dueño los calcula el servidor.
 */
public record ReservaRequest(
        Long buqueId,
        Integer tamanoTeu,     // 20 o 40 pies
        String naturaleza,     // Carga Seca / Refrigerada / Peligrosa
        BigDecimal pesoKg
) {}
