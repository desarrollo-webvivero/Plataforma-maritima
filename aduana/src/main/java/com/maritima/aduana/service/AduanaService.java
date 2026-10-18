package com.maritima.aduana.service;

import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import java.time.Duration;

@Service
public class AduanaService {

    private final RedisTemplate<String, Object> redisTemplate;

    public AduanaService(RedisTemplate<String, Object> redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    public void bloquearContenedor(String contenedorId) {
        // AQUÍ ES EXACTAMENTE DÓNDE VA TU CÓDIGO:
        // Guarda el estado del contenedor en Redis con una expiración automática de 24 horas para liberar RAM
        redisTemplate.opsForValue().set("aduana:bloqueo:" + contenedorId, "RETENIDO", Duration.ofHours(24));
    }
}