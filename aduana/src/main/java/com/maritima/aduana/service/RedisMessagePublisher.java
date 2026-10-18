package com.maritima.aduana.service;

import com.maritima.aduana.dto.BloqueoAduaneroEvent;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.listener.ChannelTopic;
import org.springframework.stereotype.Service;

@Service
public class RedisMessagePublisher {

    private final RedisTemplate<String, Object> redisTemplate;
    private final ChannelTopic channelTopic;

    public RedisMessagePublisher(RedisTemplate<String, Object> redisTemplate, ChannelTopic channelTopic) {
        this.redisTemplate = redisTemplate;
        this.channelTopic = channelTopic;
    }

    // Método que invocarás cada vez que emitas o levantes un bloqueo aduanero
    public void publicarEventoBloqueo(String idContenedor, String tipoBloqueo, String motivo) {
        BloqueoAduaneroEvent evento = new BloqueoAduaneroEvent(
                idContenedor,
                tipoBloqueo,
                motivo,
                System.currentTimeMillis()
        );

        // Envía el evento de manera asíncrona al canal de Redis Pub/Sub
        redisTemplate.convertAndSend(channelTopic.getTopic(), evento);
    }
}