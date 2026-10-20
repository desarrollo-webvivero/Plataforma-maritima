
package com.maritima.logistica.controller;

import com.maritima.logistica.model.UsuarioExportador;
import com.maritima.logistica.repository.UsuarioExportadorRepository;
import com.maritima.logistica.service.MuelleService;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;

import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;
import java.util.Optional;

import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class GateOutControllerTest {

    private MockMvc mockMvc;

    @Mock
    private MuelleService muelleService;

    @Mock
    private UsuarioExportadorRepository usuarioRepository;

    @InjectMocks
    private GateOutController gateOutController;

    private Authentication operadorPuerto;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders
                .standaloneSetup(gateOutController)
                .build();

        operadorPuerto = new UsernamePasswordAuthenticationToken(
                "puerto@maritima.com",
                null,
                List.of(new SimpleGrantedAuthority("ROLE_PUERTO"))
        );
    }

    @Test
    @DisplayName("GET disponibilidad - Retorna true")
    void testVerificarDisponibilidad() throws Exception {

        when(muelleService.validarDisponibilidad(1L))
                .thenReturn(true);

        mockMvc.perform(get("/api/operaciones/muelles/1/disponibilidad"))
                .andExpect(status().isOk())
                .andExpect(content().string("true"));
    }

    @Test
    @DisplayName("Gate-Out sin autenticación retorna 401")
    void testGateOutSinAutenticacion() throws Exception {

        mockMvc.perform(post("/api/operaciones/gate-out/20"))
                .andExpect(status().isUnauthorized());

        verifyNoInteractions(muelleService);
    }

    @Test
    @DisplayName("Gate-Out con rol EXPORTADOR retorna 403")
    void testGateOutSinPermisos() throws Exception {

        Authentication exportador =
                new UsernamePasswordAuthenticationToken(
                        "exportador@maritima.com",
                        null,
                        List.of(new SimpleGrantedAuthority("ROLE_EXPORTADOR"))
                );

        mockMvc.perform(post("/api/operaciones/gate-out/20")
                        .principal(exportador))
                .andExpect(status().isForbidden());

        verifyNoInteractions(muelleService);
    }

    @Test
    @DisplayName("Gate-Out bloqueado por Aduanas retorna 400")
    void testGateOutBloqueadoRetornaBadRequest() throws Exception {

        UsuarioExportador operador = new UsuarioExportador();
        operador.setId(5L);

        when(usuarioRepository.findByEmail("puerto@maritima.com"))
                .thenReturn(Optional.of(operador));

        when(muelleService.procesarGateOut(20L, 5))
                .thenThrow(new RuntimeException(
                        "ALERTA LEGAL: Operación denegada. " +
                        "El contenedor posee una retención aduanera activa."
                ));

        mockMvc.perform(post("/api/operaciones/gate-out/20")
                        .principal(operadorPuerto))
                .andExpect(status().isBadRequest())
                .andExpect(content().string(
                        org.hamcrest.Matchers.containsString("ALERTA LEGAL")
                ));

        verify(muelleService).procesarGateOut(20L, 5);
    }
}
