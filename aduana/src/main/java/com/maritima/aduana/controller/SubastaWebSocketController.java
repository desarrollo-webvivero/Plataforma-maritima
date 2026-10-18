package com.maritima.aduana.controller;

import com.maritima.aduana.dto.PujaMessage;
import com.maritima.aduana.model.SubastaRedis;
import com.maritima.aduana.repository.SubastaRedisRepository;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;

import java.math.BigDecimal;

@Controller
public class SubastaWebSocketController {

    private final SubastaRedisRepository subastaRedisRepository;

    public SubastaWebSocketController(SubastaRedisRepository subastaRedisRepository) {
        this.subastaRedisRepository = subastaRedisRepository;
    }

    @MessageMapping("/Pujar")
    @SendTo("/topic/subasta")

    public SubastaRedis procesarPuja(PujaMessage mensaje) {
      
        SubastaRedis subastaActual = subastaRedisRepository.findById(mensaje.getIdSubasta())
              .orElse(new SubastaRedis(mensaje.getIdSubasta(), "LIC-001" ,"Nadie", BigDecimal.ZERO, System.currentTimeMillis()));

        if (mensaje.getMonto().compareTo(subastaActual.getMontoActual()) > 0) {
            subastaActual.setIdUsuario(mensaje.getIdUsuario());
            subastaActual.setMontoActual(mensaje.getMonto());
            subastaActual.setTimestamp(System.currentTimeMillis());
            subastaRedisRepository.save(subastaActual);

        }

        return subastaActual;

    }
}
