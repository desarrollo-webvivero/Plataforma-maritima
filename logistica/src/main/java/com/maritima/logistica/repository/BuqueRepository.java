package com.maritima.logistica.repository;

import com.maritima.logistica.model.Buque;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface BuqueRepository extends JpaRepository<Buque, Long> {

    // Bloqueo de fila: dos reservas simultáneas no pueden vender el mismo espacio TEU
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select b from Buque b where b.id = :id")
    Optional<Buque> buscarParaActualizar(@Param("id") Long id);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select b from Buque b where upper(b.nombre) = upper(:nombre)")
    java.util.List<Buque> buscarPorNombreParaActualizar(@Param("nombre") String nombre);
}
