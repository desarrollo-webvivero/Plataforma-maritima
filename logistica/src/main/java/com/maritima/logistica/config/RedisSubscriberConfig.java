package com.maritima.logistica.config;

import com.maritima.logistica.service.RedisMessageSubscriber;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.listener.ChannelTopic;
import org.springframework.data.redis.listener.RedisMessageListenerContainer;
import org.springframework.data.redis.listener.adapter.MessageListenerAdapter;

//remover las barras para activar la configuración de Redis, lo puedes hacer vs o me avisas
//@Configuration
public class RedisSubscriberConfig {

    public static final String CANAL_BLOQUEOS = "canal-bloqueos-aduaneros";

    @Bean
    public MessageListenerAdapter listenerAdapter(RedisMessageSubscriber subscriber) {
        return new MessageListenerAdapter(subscriber, "onMessage");
    }

    @Bean
    public RedisMessageListenerContainer container(RedisConnectionFactory connectionFactory,
                                                   MessageListenerAdapter listenerAdapter) {
        RedisMessageListenerContainer container = new RedisMessageListenerContainer();
        container.setConnectionFactory(connectionFactory);
        // Suscribimos nuestro adaptador al mismo canal que usa Aduanas
        container.addMessageListener(listenerAdapter, new ChannelTopic(CANAL_BLOQUEOS));
        return container;
    }
}