package com.maritima.logistica.repository;

import com.maritima.logistica.model.Licitacion;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.Optional;

public interface LicitacionRepository extends JpaRepository<Licitacion, Long> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select l from Licitacion l where l.id = :id")
    Optional<Licitacion> buscarParaActualizar(@Param("id") Long id);

    // Dinero retenido: suma de las pujas ganadoras de un exportador en subastas activas
    @Query("select sum(l.pujaActual) from Licitacion l " +
           "where l.mejorPostor = :codigo and upper(l.estado) = 'ACTIVA'")
    BigDecimal sumarBloqueado(@Param("codigo") String codigo);
}
