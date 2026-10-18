package com.maritima.aduana.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.listener.ChannelTopic;

@Configuration
public class RedisPubSubConfig {

    // Definimos el nombre oficial del canal de eventos aduaneros
    public static final String CANAL_BLOQUEOS = "canal-bloqueos-aduaneros";

    @Bean
    public ChannelTopic topic() {
        return new ChannelTopic(CANAL_BLOQUEOS);
    }
}