package com.maritima.logistica.service;

import com.maritima.logistica.client.AduanaClient;
import com.maritima.logistica.model.CargaSeca;
import com.maritima.logistica.model.Contenedor;
import com.maritima.logistica.model.HistorialContenedor;
import com.maritima.logistica.model.Muelle;
import com.maritima.logistica.repository.ContenedorRepository;
import com.maritima.logistica.repository.HistorialContenedorRepository;
import com.maritima.logistica.repository.MuelleRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class MuelleServiceTest {

    @Mock
    private MuelleRepository muelleRepository;

    @Mock
    private ContenedorRepository contenedorRepository;

    @Mock
    private HistorialContenedorRepository historialRepository;

    @Mock
    private AduanaClient aduanaClient;

    @InjectMocks
    private MuelleService muelleService;

    private Contenedor contenedorPrueba;
    private Muelle muellePrueba;

    @BeforeEach
    void setUp() {
        muellePrueba = new Muelle();
        muellePrueba.setId(1L);
        muellePrueba.setNombre("Muelle Principal Norte");
        muellePrueba.setEstadoDisponibilidad("DISPONIBLE");

        contenedorPrueba = new CargaSeca();
        contenedorPrueba.setId(10L);
        contenedorPrueba.setCodigo("CONT-9999");
        contenedorPrueba.setPeso(new BigDecimal("12500.00"));
        contenedorPrueba.setEstado("EN_MUELLE");
        contenedorPrueba.setMuelle(muellePrueba);
    }

    @Test
    @DisplayName("Debe lanzar excepción si Aduanas reporta retención activa")
    void testProcesarGateOut_ConBloqueoAduanero() {
        when(contenedorRepository.findById(10L)).thenReturn(Optional.of(contenedorPrueba));
        when(aduanaClient.tieneBloqueoActivo("CONT-9999"))
        .thenReturn(true);
        RuntimeException excepcion = assertThrows(RuntimeException.class, () -> {
            muelleService.procesarGateOut(10L, 101);
        });

        assertTrue(excepcion.getMessage().contains("retención aduanera activa"));
        verify(contenedorRepository, never()).save(any());
        verify(historialRepository, never()).save(any());
    }

    @Test
    @DisplayName("Debe procesar Gate-out correctamente si Aduana no tiene bloqueos")
    void testProcesarGateOut_Exitoso() {
        when(contenedorRepository.findById(10L)).thenReturn(Optional.of(contenedorPrueba));
        when(aduanaClient.tieneBloqueoActivo("CONT-9999"))
        .thenReturn(false);
        when(contenedorRepository.save(any(Contenedor.class))).thenAnswer(i -> i.getArgument(0));

        Contenedor resultado = muelleService.procesarGateOut(10L, 101);

        assertNotNull(resultado);
        assertEquals("GATE_OUT", resultado.getEstado());
        assertNull(resultado.getMuelle());
        verify(contenedorRepository, times(1)).save(contenedorPrueba);
        verify(historialRepository, times(1)).save(any(HistorialContenedor.class));
    }
}