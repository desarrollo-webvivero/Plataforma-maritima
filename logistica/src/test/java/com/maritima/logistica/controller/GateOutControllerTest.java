package com.maritima.logistica.controller;

import com.maritima.logistica.model.CargaSeca;
import com.maritima.logistica.service.MuelleService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class GateOutControllerTest {

    private MockMvc mockMvc;

    @Mock
    private MuelleService muelleService;

    @InjectMocks
    private GateOutController gateOutController;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(gateOutController).build();
    }

    @Test
    @DisplayName("GET /api/operaciones/muelles/{id}/disponibilidad - Retorna true si está libre")
    void testVerificarDisponibilidad() throws Exception {
        when(muelleService.validarDisponibilidad(1L)).thenReturn(true);

        mockMvc.perform(get("/api/operaciones/muelles/1/disponibilidad"))
                .andExpect(status().isOk())
                .andExpect(content().string("true"));
    }

    @Test
    @DisplayName("POST /api/operaciones/gate-out/{id} - Retorna 400 Bad Request ante retención")
    void testGateOutBloqueadoRetornaBadRequest() throws Exception {
        when(muelleService.procesarGateOut(20L, 5))
                .thenThrow(new RuntimeException("ALERTA LEGAL: Operación denegada. El contenedor posee una retención aduanera activa."));

        mockMvc.perform(post("/api/operaciones/gate-out/20")
                .param("usuarioId", "5"))
                .andExpect(status().isBadRequest())
                .andExpect(content().string(org.hamcrest.Matchers.containsString("ALERTA LEGAL")));
    }
}